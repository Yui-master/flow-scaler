import type { WorkflowAssetKind, WorkflowAssetMetadata } from "./types";

export const MAX_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024;

const ACCEPTED_MIME_TYPES: Record<string, WorkflowAssetKind> = {
  "image/png": "image",
  "image/jpeg": "image",
  "video/mp4": "video",
};

export type AssetFileValidationResult =
  | { valid: true; kind: WorkflowAssetKind }
  | { valid: false; reason: string };

export function validateWorkflowAssetFile(
  file: File,
): AssetFileValidationResult {
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return {
      valid: false,
      reason: "File is larger than the 100 MB MVP limit.",
    };
  }

  const kind = ACCEPTED_MIME_TYPES[file.type];
  if (!kind) {
    return {
      valid: false,
      reason: "Unsupported file type. Use PNG, JPG, or MP4.",
    };
  }

  return { valid: true, kind };
}

function createWorkflowAssetId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createWorkflowAssetMetadata(
  file: File,
  kind: WorkflowAssetKind,
  previewUrl: string | null,
): WorkflowAssetMetadata {
  return {
    id: createWorkflowAssetId(),
    kind,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    previewUrl: previewUrl ?? "",
  };
}

export function formatBytes(size: number): string {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
