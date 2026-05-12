import { describe, expect, test } from "vitest";

import { createWorkflowNode } from "./catalog";
import { createJobLifecycleSteps, validateWorkflowForJobStart } from "./job";
import type { WorkflowAssetMetadata, WorkflowEdge, WorkflowNode } from "./types";

const videoAsset: WorkflowAssetMetadata = {
  id: "asset-video",
  kind: "video",
  fileName: "source.mp4",
  mimeType: "video/mp4",
  size: 1024,
  previewUrl: "blob:video",
};

const imageAsset: WorkflowAssetMetadata = {
  id: "asset-image",
  kind: "image",
  fileName: "source.png",
  mimeType: "image/png",
  size: 1024,
  previewUrl: "blob:image",
};

function node(kind: WorkflowNode["data"]["kind"], id: string): WorkflowNode {
  return createWorkflowNode(kind, id, { x: 0, y: 0 });
}

function videoWorkflow() {
  const nodes = [
    node("loadVideo", "load-video"),
    node("extractFrames", "extract-frames"),
    node("realesrganUpscale", "upscale"),
    node("combineFrames", "combine-frames"),
    node("exportFile", "export"),
  ];

  nodes[0]!.data.params = { asset: videoAsset };

  const edges: WorkflowEdge[] = [
    { id: "load-to-extract", source: "load-video", target: "extract-frames" },
    { id: "extract-to-upscale", source: "extract-frames", target: "upscale" },
    { id: "upscale-to-combine", source: "upscale", target: "combine-frames" },
    { id: "combine-to-export", source: "combine-frames", target: "export" },
  ];

  return { nodes, edges };
}

describe("validateWorkflowForJobStart", () => {
  test("valid configured video workflow ending in Export File returns valid true", () => {
    const { nodes, edges } = videoWorkflow();

    expect(validateWorkflowForJobStart(nodes, edges)).toEqual({ valid: true });
  });

  test("missing asset on Load Video returns a validation error", () => {
    const { nodes, edges } = videoWorkflow();
    nodes[0]!.data.params = {};

    expect(validateWorkflowForJobStart(nodes, edges)).toEqual({
      valid: false,
      errors: [
        {
          nodeId: "load-video",
          message: "Load Video needs an uploaded MP4 file.",
        },
      ],
    });
  });

  test("whitespace-only model on RealESRGAN returns a validation error", () => {
    const { nodes, edges } = videoWorkflow();
    nodes[2]!.data.params = { model: "   ", scale: 4 };

    expect(validateWorkflowForJobStart(nodes, edges)).toEqual({
      valid: false,
      errors: [
        {
          nodeId: "upscale",
          message: "RealESRGAN Upscale needs a model preset.",
        },
      ],
    });
  });

  test("valid Load Image asset returns valid true", () => {
    const nodes = [node("loadImage", "load-image"), node("exportFile", "export")];
    nodes[0]!.data.params = { asset: imageAsset };
    const edges: WorkflowEdge[] = [
      { id: "image-to-export", source: "load-image", target: "export" },
    ];

    expect(validateWorkflowForJobStart(nodes, edges)).toEqual({ valid: true });
  });

  test("no connected Export File returns a validation error", () => {
    const { nodes, edges } = videoWorkflow();

    expect(validateWorkflowForJobStart(nodes, edges.slice(0, -1))).toEqual({
      valid: false,
      errors: [
        {
          message: "Workflow needs a connected Export File output.",
        },
      ],
    });
  });

  test("cycle with connected Export File returns a DAG validation error", () => {
    const { nodes, edges } = videoWorkflow();
    edges.push({ id: "cycle", source: "combine-frames", target: "extract-frames" });

    expect(validateWorkflowForJobStart(nodes, edges)).toEqual({
      valid: false,
      errors: [{ message: "Workflow graph must be a DAG." }],
    });
  });

  test("unknown edge endpoint returns connection endpoint validation error", () => {
    const { nodes, edges } = videoWorkflow();
    edges.push({ id: "missing", source: "missing-node", target: "export" });

    expect(validateWorkflowForJobStart(nodes, edges)).toEqual({
      valid: false,
      errors: [
        { message: "Connection source or target node was not found." },
        { message: "Workflow contains an edge with a missing node." },
      ],
    });
  });
});

describe("createJobLifecycleSteps", () => {
  test("creates ordered queued running completed steps for a 5-node video workflow", () => {
    const { nodes, edges } = videoWorkflow();

    expect(createJobLifecycleSteps(nodes, edges)).toEqual([
      { nodeId: "load-video", status: "queued", progress: 10 },
      { nodeId: "load-video", status: "running", progress: 20 },
      { nodeId: "load-video", status: "completed", progress: 30 },
      { nodeId: "extract-frames", status: "queued", progress: 40 },
      { nodeId: "extract-frames", status: "running", progress: 50 },
      { nodeId: "extract-frames", status: "completed", progress: 60 },
      { nodeId: "upscale", status: "queued", progress: 70 },
      { nodeId: "upscale", status: "running", progress: 80 },
      { nodeId: "upscale", status: "completed", progress: 90 },
      { nodeId: "combine-frames", status: "queued", progress: 95 },
      { nodeId: "combine-frames", status: "running", progress: 98 },
      { nodeId: "combine-frames", status: "completed", progress: 99 },
      { nodeId: "export", status: "queued", progress: 99 },
      { nodeId: "export", status: "running", progress: 99 },
      { nodeId: "export", status: "completed", progress: 100 },
    ]);
  });

  test("orders only nodes reachable from connected Export File paths", () => {
    const { nodes, edges } = videoWorkflow();
    nodes.push(node("preview", "preview"));

    expect(createJobLifecycleSteps(nodes, edges).map((step) => step.nodeId)).not.toContain(
      "preview",
    );
  });

  test("adds a terminal completed step for shorter workflows", () => {
    const nodes = [
      node("loadImage", "load-image"),
      node("realesrganUpscale", "upscale"),
      node("exportFile", "export"),
    ];
    nodes[0]!.data.params = { asset: imageAsset };
    const edges = [
      { id: "load-upscale", source: "load-image", target: "upscale" },
      { id: "upscale-export", source: "upscale", target: "export" },
    ];

    expect(createJobLifecycleSteps(nodes, edges).at(-1)).toEqual({
      nodeId: "export",
      status: "completed",
      progress: 100,
    });
  });

  test("throws on cycle", () => {
    const { nodes, edges } = videoWorkflow();
    edges.push({ id: "cycle", source: "combine-frames", target: "extract-frames" });

    expect(() => createJobLifecycleSteps(nodes, edges)).toThrow(
      "Workflow graph must be a DAG.",
    );
  });

  test("throws on missing edge endpoint", () => {
    const { nodes, edges } = videoWorkflow();
    edges.push({ id: "missing", source: "missing-node", target: "export" });

    expect(() => createJobLifecycleSteps(nodes, edges)).toThrow(
      "Workflow contains an edge with a missing node.",
    );
  });
});
