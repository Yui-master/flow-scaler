import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useWorkflowEditorStore } from "./store";
import type { WorkflowAssetMetadata } from "./types";

const imageAsset: WorkflowAssetMetadata = {
  id: "asset-image",
  assetId: "server-asset-image",
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
    resetStore();
    useWorkflowEditorStore.getState().attachAssetToNode("node-load-image", imageAsset);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetStore();
  });

  test("starts real media job and stores output download URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          job: {
            id: "job-real",
            status: "completed",
            progress: 100,
            outputId: "output-real",
            downloadUrl: "/api/media/outputs/output-real",
          },
        }),
      }),
    );

    await useWorkflowEditorStore.getState().startJob();

    expect(fetch).toHaveBeenCalledWith(
      "/api/media/jobs",
      expect.objectContaining({ method: "POST" }),
    );
    expect(useWorkflowEditorStore.getState().job).toEqual({
      id: "job-real",
      status: "completed",
      progress: 100,
      errorMessage: null,
      outputId: "output-real",
      downloadUrl: "/api/media/outputs/output-real",
    });
    expect(
      useWorkflowEditorStore
        .getState()
        .nodes.filter((node) => ["loadImage", "realesrganUpscale", "exportFile"].includes(node.data.kind))
        .every((node) => node.data.status === "completed"),
    ).toBe(true);
  });

  test("requires server-uploaded asset before starting job", async () => {
    useWorkflowEditorStore.getState().attachAssetToNode("node-load-image", {
      ...imageAsset,
      assetId: undefined,
    });

    await useWorkflowEditorStore.getState().startJob();

    expect(useWorkflowEditorStore.getState().job.status).toBe("failed");
    expect(useWorkflowEditorStore.getState().graphValidationErrors).toEqual([
      {
        nodeId: "node-load-image",
        message: "Load Image needs a server-uploaded asset before starting a job.",
      },
    ]);
  });

  test("marks RealESRGAN node failed when media job fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          job: {
            id: "job-failed",
            status: "failed",
            progress: 0,
            errorMessage: "RealESRGAN dependencies are missing.",
          },
        }),
      }),
    );

    await useWorkflowEditorStore.getState().startJob();

    const upscale = useWorkflowEditorStore
      .getState()
      .nodes.find((node) => node.data.kind === "realesrganUpscale");
    expect(useWorkflowEditorStore.getState().job.status).toBe("failed");
    expect(upscale?.data.status).toBe("failed");
    expect(upscale?.data.params.errorMessage).toBe("RealESRGAN dependencies are missing.");
  });
});
