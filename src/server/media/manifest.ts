import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { getLocalStorageRoot } from "../storage/local";

export type StoredMediaAsset = {
  id: string;
  kind: "image" | "video";
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
};

export type StoredMediaOutput = {
  id: string;
  jobId: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageKey: string;
};

type MediaManifest = {
  assets: Record<string, StoredMediaAsset>;
  outputs: Record<string, StoredMediaOutput>;
};

const emptyManifest = (): MediaManifest => ({ assets: {}, outputs: {} });

function manifestPath() {
  return path.join(getLocalStorageRoot(), "manifest.json");
}

async function readManifest(): Promise<MediaManifest> {
  try {
    return JSON.parse(await readFile(manifestPath(), "utf8")) as MediaManifest;
  } catch {
    return emptyManifest();
  }
}

async function writeManifest(manifest: MediaManifest) {
  const filePath = manifestPath();
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(manifest, null, 2));
}

export function createMediaId(prefix: string) {
  return `${prefix}-${randomUUID()}`;
}

export async function saveStoredAsset(asset: StoredMediaAsset) {
  const manifest = await readManifest();
  manifest.assets[asset.id] = asset;
  await writeManifest(manifest);
  return asset;
}

export async function getStoredAsset(assetId: string) {
  const manifest = await readManifest();
  return manifest.assets[assetId] ?? null;
}

export async function saveStoredOutput(output: StoredMediaOutput) {
  const manifest = await readManifest();
  manifest.outputs[output.id] = output;
  await writeManifest(manifest);
  return output;
}

export async function getStoredOutput(outputId: string) {
  const manifest = await readManifest();
  return manifest.outputs[outputId] ?? null;
}
