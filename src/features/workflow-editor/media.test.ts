import { describe, expect, it } from "vitest";

import { MAX_UPLOAD_SIZE_BYTES, validateWorkflowAssetFile } from "./media";

function createFile(size: number, name: string, type: string): File {
  const file = new File([], name, { type });
  Object.defineProperty(file, "size", { value: size });

  return file;
}

describe("validateWorkflowAssetFile", () => {
  it("accepts PNG images", () => {
    expect(validateWorkflowAssetFile(createFile(1, "image.png", "image/png"))).toEqual({
      valid: true,
      kind: "image",
    });
  });

  it("accepts JPEG images", () => {
    expect(validateWorkflowAssetFile(createFile(1, "image.jpg", "image/jpeg"))).toEqual({
      valid: true,
      kind: "image",
    });
  });

  it("accepts MP4 videos", () => {
    expect(validateWorkflowAssetFile(createFile(1, "video.mp4", "video/mp4"))).toEqual({
      valid: true,
      kind: "video",
    });
  });

  it("rejects unsupported MIME types", () => {
    expect(validateWorkflowAssetFile(createFile(1, "image.gif", "image/gif"))).toEqual({
      valid: false,
      reason: "Unsupported file type. Use PNG, JPG, or MP4.",
    });
  });

  it("rejects files larger than the MVP upload limit", () => {
    expect(
      validateWorkflowAssetFile(
        createFile(MAX_UPLOAD_SIZE_BYTES + 1, "large.png", "image/png"),
      ),
    ).toEqual({
      valid: false,
      reason: "File is larger than the 100 MB MVP limit.",
    });
  });
});
