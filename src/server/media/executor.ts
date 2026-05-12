import "server-only";

import { stat } from "node:fs/promises";
import path from "node:path";

import type { WorkflowEdge, WorkflowNode } from "../../features/workflow-editor/types";
import { createLocalStorageKey, ensureLocalFileParent, resolveLocalStoragePath } from "../storage/local";
import { createMediaId, getStoredAsset, saveStoredOutput } from "./manifest";
import { runRealEsrgan } from "./python";

export type StartMediaJobInput = {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
};

export type StartMediaJobResult = {
  id: string;
  status: "completed" | "failed";
  progress: number;
  outputId?: string;
  downloadUrl?: string;
  errorMessage?: string;
};

function sanitizeOutputName(value: string) {
  const baseName = value.trim() || "flowscaler-output";
  return baseName.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.png$/i, "") + ".png";
}

function getNode(nodes: WorkflowNode[], kind: WorkflowNode["data"]["kind"]) {
  return nodes.find((node) => node.data.kind === kind) ?? null;
}

function isConnected(edges: WorkflowEdge[], sourceId: string, targetId: string) {
  return edges.some((edge) => edge.source === sourceId && edge.target === targetId);
}

export async function startMediaJob(input: StartMediaJobInput): Promise<StartMediaJobResult> {
  const jobId = createMediaId("job");
  const loadImage = getNode(input.nodes, "loadImage");
  const upscale = getNode(input.nodes, "realesrganUpscale");
  const exportFile = getNode(input.nodes, "exportFile");

  if (!loadImage || !upscale || !exportFile) {
    return { id: jobId, status: "failed", progress: 0, errorMessage: "Workflow needs Load Image, RealESRGAN Upscale, and Export File nodes." };
  }

  if (!isConnected(input.edges, loadImage.id, upscale.id) || !isConnected(input.edges, upscale.id, exportFile.id)) {
    return { id: jobId, status: "failed", progress: 0, errorMessage: "Workflow must connect Load Image -> RealESRGAN Upscale -> Export File." };
  }

  const loadParams = loadImage.data.params;
  const upscaleParams = upscale.data.params;
  const exportParams = exportFile.data.params;
  const asset = "asset" in loadParams ? loadParams.asset : undefined;
  const model = "model" in upscaleParams ? upscaleParams.model : "realesrgan-x4plus";
  const scale = "scale" in upscaleParams ? upscaleParams.scale : 4;
  const outputName = "outputName" in exportParams ? exportParams.outputName : "flowscaler-output";

  if (!asset?.assetId) {
    return { id: jobId, status: "failed", progress: 0, errorMessage: "Load Image needs a persisted uploaded asset." };
  }

  const storedAsset = await getStoredAsset(asset.assetId);
  if (!storedAsset) {
    return { id: jobId, status: "failed", progress: 0, errorMessage: "Uploaded asset was not found in local storage." };
  }

  if (model !== "realesrgan-x4plus") {
    return { id: jobId, status: "failed", progress: 0, errorMessage: "Unsupported RealESRGAN model preset." };
  }

  if (scale !== 4) {
    return { id: jobId, status: "failed", progress: 0, errorMessage: "FR-03 RealESRGAN image path expects scale 4." };
  }

  const outputId = createMediaId("output");
  const outputFileName = sanitizeOutputName(outputName);
  const outputStorageKey = createLocalStorageKey({
    area: "output",
    jobId,
    assetId: outputId,
    fileName: outputFileName,
  });
  const inputPath = resolveLocalStoragePath(storedAsset.storageKey);
  const outputPath = await ensureLocalFileParent(outputStorageKey);

  try {
    await runRealEsrgan({
      inputPath,
      outputPath,
      model: "RealESRGAN_x4plus",
      scale,
    });
  } catch (error) {
    return {
      id: jobId,
      status: "failed",
      progress: 0,
      errorMessage: error instanceof Error ? error.message : "RealESRGAN failed.",
    };
  }

  const outputStat = await stat(outputPath);
  await saveStoredOutput({
    id: outputId,
    jobId,
    fileName: path.basename(outputFileName),
    mimeType: "image/png",
    size: outputStat.size,
    storageKey: outputStorageKey,
  });

  return {
    id: jobId,
    status: "completed",
    progress: 100,
    outputId,
    downloadUrl: `/api/media/outputs/${outputId}`,
  };
}
