import { describe, expect, it } from "vitest";

import { createWorkflowNode } from "./catalog";
import { validateWorkflowConnection } from "./validation";
import type { WorkflowEdge, WorkflowNode } from "./types";

const nodes: WorkflowNode[] = [
  createWorkflowNode("loadVideo", "load-video", { x: 0, y: 0 }),
  createWorkflowNode("extractFrames", "extract-frames", { x: 0, y: 100 }),
  createWorkflowNode("loadImage", "load-image", { x: 0, y: 200 }),
  createWorkflowNode("combineFrames", "combine-frames", { x: 0, y: 300 }),
];

describe("validateWorkflowConnection", () => {
  it("accepts compatible source and target data types", () => {
    expect(
      validateWorkflowConnection(
        { source: "extract-frames", target: "combine-frames" },
        nodes,
        [],
      ),
    ).toEqual({ valid: true });
  });

  it("rejects incompatible source and target data types", () => {
    expect(
      validateWorkflowConnection(
        { source: "load-image", target: "extract-frames" },
        nodes,
        [],
      ),
    ).toEqual({
      valid: false,
      reason: "Load Image outputs image, but Extract Frames expects video.",
    });
  });

  it("rejects self connections", () => {
    expect(
      validateWorkflowConnection(
        { source: "load-video", target: "load-video" },
        nodes,
        [],
      ),
    ).toEqual({ valid: false, reason: "A node cannot connect to itself." });
  });

  it("rejects duplicate source-target connections", () => {
    const edges: WorkflowEdge[] = [
      { id: "existing", source: "load-video", target: "extract-frames" },
    ];

    expect(
      validateWorkflowConnection(
        { source: "load-video", target: "extract-frames" },
        nodes,
        edges,
      ),
    ).toEqual({
      valid: false,
      reason: "Load Video is already connected to Extract Frames.",
    });
  });
});
