import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useWorkflowEditorStore } from "./store";
import type { WorkflowAssetMetadata } from "./types";

const imageAsset: WorkflowAssetMetadata = {
  id: "asset-image",
  kind: "image",
  fileName: "source.png",
  mimeType: "image/png",
  size: 1024,
  previewUrl: "blob:image",
};

function resetStore() {
  useWorkflowEditorStore.getState().reset();
}

describe("useWorkflowEditorStore job lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetStore();
    useWorkflowEditorStore.getState().attachAssetToNode("node-load-image", imageAsset);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    resetStore();
  });

  test("graph edits cancel scheduled local job updates and clear validation errors", () => {
    useWorkflowEditorStore.getState().startJob();

    const startedJobId = useWorkflowEditorStore.getState().job.id;
    expect(startedJobId).toMatch(/^job-/);
    expect(useWorkflowEditorStore.getState().job.status).toBe("queued");

    useWorkflowEditorStore.getState().onNodesChange([
      {
        id: "node-load-image",
        type: "select",
        selected: true,
      },
    ]);

    expect(useWorkflowEditorStore.getState().job).toEqual({
      id: null,
      status: "idle",
      progress: 0,
      errorMessage: null,
    });
    expect(useWorkflowEditorStore.getState().graphValidationErrors).toEqual([]);

    vi.advanceTimersByTime(10_000);

    expect(useWorkflowEditorStore.getState().job).toEqual({
      id: null,
      status: "idle",
      progress: 0,
      errorMessage: null,
    });
    expect(useWorkflowEditorStore.getState().nodes.every((node) => node.data.status === "idle")).toBe(true);
  });

  test("job ids include suffix beyond Date.now timestamp", () => {
    vi.setSystemTime(1_700_000_000_000);

    useWorkflowEditorStore.getState().startJob();
    const firstJobId = useWorkflowEditorStore.getState().job.id;

    resetStore();
    useWorkflowEditorStore.getState().attachAssetToNode("node-load-image", imageAsset);
    useWorkflowEditorStore.getState().startJob();
    const secondJobId = useWorkflowEditorStore.getState().job.id;

    expect(firstJobId).toMatch(/^job-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    expect(secondJobId).toMatch(/^job-[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/);
    expect(secondJobId).not.toBe(firstJobId);
  });
});
