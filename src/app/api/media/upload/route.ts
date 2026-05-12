import { NextResponse } from "next/server";

import { MAX_UPLOAD_SIZE_BYTES } from "../../../../features/workflow-editor/media";
import { createMediaId, saveStoredAsset } from "../../../../server/media/manifest";
import { createLocalStorageKey, writeLocalFile } from "../../../../server/storage/local";

const supportedMimeTypes = new Set(["image/png", "image/jpeg"]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ errorMessage: "Upload requires a file." }, { status: 400 });
  }

  if (!supportedMimeTypes.has(file.type)) {
    return NextResponse.json({ errorMessage: "Unsupported file type. Use PNG or JPG." }, { status: 400 });
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { errorMessage: "File is larger than the 100 MB MVP limit." },
      { status: 400 },
    );
  }

  const assetId = createMediaId("asset");
  const storageKey = createLocalStorageKey({
    area: "uploads",
    userId: "demo",
    assetId,
    fileName: file.name,
  });

  await writeLocalFile(storageKey, Buffer.from(await file.arrayBuffer()));

  const asset = await saveStoredAsset({
    id: assetId,
    kind: "image",
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
    storageKey,
  });

  return NextResponse.json({
    assetId: asset.id,
    kind: asset.kind,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
    size: asset.size,
  });
}
