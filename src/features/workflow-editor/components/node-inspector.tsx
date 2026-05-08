"use client";

import type { ChangeEvent } from "react";

import {
  createWorkflowAssetMetadata,
  formatBytes,
  validateWorkflowAssetFile,
} from "../media";
import type {
  WorkflowAssetMetadata,
  WorkflowNode,
  WorkflowNodeParamsByKind,
} from "../types";

type NodeInspectorProps = {
  selectedNode: WorkflowNode | null;
  onAttachAsset: (nodeId: string, asset: WorkflowAssetMetadata) => void;
  onSetNodeError: (nodeId: string, errorMessage: string) => void;
  onUpdateNodeParams: (
    nodeId: string,
    params: Partial<WorkflowNodeParamsByKind["realesrganUpscale"]>,
  ) => void;
};

type UploadNodeKind = "loadImage" | "loadVideo";

function isUploadNodeKind(kind: WorkflowNode["data"]["kind"]): kind is UploadNodeKind {
  return kind === "loadImage" || kind === "loadVideo";
}

function hasRealESRGANParams(
  node: WorkflowNode,
): node is WorkflowNode & {
  data: { params: WorkflowNodeParamsByKind["realesrganUpscale"] };
} {
  return node.data.kind === "realesrganUpscale";
}

const fileAcceptByKind = {
  loadImage: "image/png,image/jpeg",
  loadVideo: "video/mp4",
} as const;

const requiredAssetKindByNodeKind = {
  loadImage: "image",
  loadVideo: "video",
} as const;

const mismatchErrorByNodeKind = {
  loadImage: "Load Image needs a PNG or JPG file.",
  loadVideo: "Load Video needs an MP4 file.",
} as const;

export function NodeInspector({
  selectedNode,
  onAttachAsset,
  onSetNodeError,
  onUpdateNodeParams,
}: NodeInspectorProps) {
  if (!selectedNode) {
    return (
      <aside className="w-80 border-l border-yellow-500/20 bg-zinc-950/95 p-5 text-zinc-100">
        <p className="text-xs font-semibold tracking-[0.24em] text-yellow-400 uppercase">
          Inspector
        </p>
        <p className="mt-4 text-sm leading-6 text-zinc-400">
          Select a node to configure upload, model, preview, and status.
        </p>
      </aside>
    );
  }

  const asset = "asset" in selectedNode.data.params ? selectedNode.data.params.asset : undefined;
  const errorMessage = selectedNode.data.params.errorMessage;
  const isUploadNode = isUploadNodeKind(selectedNode.data.kind);
  const realesrganParams = hasRealESRGANParams(selectedNode)
    ? selectedNode.data.params
    : null;
  const isPreviewVisible = selectedNode.data.kind === "preview" || Boolean(asset);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target;

    if (!selectedNode || !isUploadNodeKind(selectedNode.data.kind)) {
      input.value = "";
      return;
    }

    const uploadNodeKind = selectedNode.data.kind;
    const file = input.files?.[0];
    if (!file) {
      input.value = "";
      return;
    }

    const validation = validateWorkflowAssetFile(file);
    if (!validation.valid) {
      onSetNodeError(selectedNode.id, validation.reason);
      input.value = "";
      return;
    }

    const requiredKind = requiredAssetKindByNodeKind[uploadNodeKind];
    if (validation.kind !== requiredKind) {
      onSetNodeError(selectedNode.id, mismatchErrorByNodeKind[uploadNodeKind]);
      input.value = "";
      return;
    }

    const previewUrl = validation.kind === "image" ? URL.createObjectURL(file) : null;
    const metadata = createWorkflowAssetMetadata(file, validation.kind, previewUrl);
    const previousPreviewUrl = asset?.previewUrl;

    onAttachAsset(selectedNode.id, metadata);

    if (previousPreviewUrl && previousPreviewUrl !== previewUrl) {
      URL.revokeObjectURL(previousPreviewUrl);
    }

    input.value = "";
  }

  return (
    <aside className="w-80 overflow-y-auto border-l border-yellow-500/20 bg-zinc-950/95 p-5 text-zinc-100">
      <div className="mb-6">
        <p className="text-xs font-semibold tracking-[0.24em] text-yellow-400 uppercase">
          Inspector
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          {selectedNode.data.label}
        </h2>
        <span className="mt-3 inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-1 text-xs font-semibold text-yellow-200">
          {selectedNode.data.kind}
        </span>
      </div>

      <div className="space-y-5">
        <section className="rounded-2xl border border-yellow-500/20 bg-zinc-900/70 p-4">
          <h3 className="text-sm font-semibold text-yellow-300">Status</h3>
          <p className="mt-3 text-sm text-zinc-300">
            Current status: <span className="font-semibold text-white">{selectedNode.data.status}</span>
          </p>
          {errorMessage && (
            <p
              role="alert"
              className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200"
            >
              {errorMessage}
            </p>
          )}
        </section>

        {isUploadNodeKind(selectedNode.data.kind) && (
          <section className="rounded-2xl border border-yellow-500/20 bg-zinc-900/70 p-4">
            <h3 className="text-sm font-semibold text-yellow-300">Upload</h3>
            <label className="mt-3 block text-sm font-medium text-zinc-300" htmlFor={`${selectedNode.id}-asset`}>
              Source file
            </label>
            <input
              id={`${selectedNode.id}-asset`}
              type="file"
              accept={fileAcceptByKind[selectedNode.data.kind]}
              onChange={handleFileChange}
              className="mt-2 block w-full cursor-pointer rounded-xl border border-yellow-500/20 bg-zinc-950 text-sm text-zinc-300 file:mr-3 file:border-0 file:bg-yellow-400 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-zinc-950 hover:border-yellow-400/70 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            />

            {asset && (
              <div className="mt-4 space-y-2 rounded-xl border border-zinc-700 bg-zinc-950/80 p-3 text-sm text-zinc-300">
                <p className="font-semibold text-white">{asset.fileName}</p>
                <p>{asset.mimeType}</p>
                <p>{formatBytes(asset.size)}</p>
                {asset.previewUrl && (
                  <img
                    src={asset.previewUrl}
                    alt={`${asset.fileName} preview`}
                    className="mt-3 max-h-40 w-full rounded-lg border border-yellow-500/20 object-contain"
                  />
                )}
              </div>
            )}
          </section>
        )}

        {realesrganParams && (
          <section className="rounded-2xl border border-yellow-500/20 bg-zinc-900/70 p-4">
            <label className="text-sm font-semibold text-yellow-300" htmlFor={`${selectedNode.id}-model`}>
              RealESRGAN model
            </label>
            <select
              id={`${selectedNode.id}-model`}
              value={realesrganParams.model ?? "realesrgan-x4plus"}
              onChange={(event) => onUpdateNodeParams(selectedNode.id, { model: event.target.value })}
              className="mt-3 block w-full rounded-xl border border-yellow-500/20 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
            >
              <option value="realesrgan-x4plus">realesrgan-x4plus</option>
            </select>
          </section>
        )}

        {isPreviewVisible && (
          <section className="rounded-2xl border border-yellow-500/20 bg-zinc-900/70 p-4">
            <h3 className="text-sm font-semibold text-yellow-300">Preview</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-300">
              {asset
                ? `${asset.kind.toUpperCase()} preview metadata ready.`
                : "Connect this node to preview upstream media metadata."}
            </p>
          </section>
        )}
      </div>
    </aside>
  );
}
