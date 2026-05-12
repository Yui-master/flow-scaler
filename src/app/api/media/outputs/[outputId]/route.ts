import { NextResponse } from "next/server";

import { getStoredOutput } from "../../../../../server/media/manifest";
import { readLocalFile } from "../../../../../server/storage/local";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ outputId: string }> },
) {
  const { outputId } = await params;
  const output = await getStoredOutput(outputId);

  if (!output) {
    return NextResponse.json({ errorMessage: "Output not found." }, { status: 404 });
  }

  const file = await readLocalFile(output.storageKey);

  return new NextResponse(file, {
    headers: {
      "Content-Type": output.mimeType,
      "Content-Length": String(output.size),
      "Content-Disposition": `attachment; filename="${output.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
