import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_STORAGE_ROOT = "storage";

export type LocalStorageArea = "uploads" | "output" | "intermediate";

export type LocalStorageKeyInput = {
  userId?: string;
  jobId?: string;
  assetId: string;
  fileName: string;
  area: LocalStorageArea;
};

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function getLocalStorageRoot() {
  return path.resolve(
    process.cwd(),
    process.env.LOCAL_STORAGE_ROOT ?? DEFAULT_STORAGE_ROOT,
  );
}

export function createLocalStorageKey(input: LocalStorageKeyInput) {
  const safeAssetId = sanitizePathSegment(input.assetId);
  const safeFileName = sanitizePathSegment(input.fileName);
  const storedFileName = `${safeAssetId}-${safeFileName}`;

  if (input.area === "uploads") {
    return path.posix.join(
      "users",
      sanitizePathSegment(input.userId ?? "demo"),
      "uploads",
      storedFileName,
    );
  }

  if (!input.jobId) {
    throw new Error("jobId is required for job storage keys");
  }

  return path.posix.join(
    "jobs",
    sanitizePathSegment(input.jobId),
    input.area,
    storedFileName,
  );
}

export function resolveLocalStoragePath(storageKey: string) {
  const root = getLocalStorageRoot();
  const resolvedPath = path.resolve(root, storageKey);

  if (!resolvedPath.startsWith(root + path.sep) && resolvedPath !== root) {
    throw new Error("Storage key resolves outside local storage root");
  }

  return resolvedPath;
}

export async function writeLocalFile(storageKey: string, data: Buffer | Uint8Array) {
  const filePath = resolveLocalStoragePath(storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  return filePath;
}

export async function readLocalFile(storageKey: string) {
  return readFile(resolveLocalStoragePath(storageKey));
}

export async function ensureLocalFileParent(storageKey: string) {
  const filePath = resolveLocalStoragePath(storageKey);
  await mkdir(path.dirname(filePath), { recursive: true });
  return filePath;
}
