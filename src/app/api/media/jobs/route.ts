import { NextResponse } from "next/server";

import { startMediaJob } from "../../../../server/media/executor";

export async function POST(request: Request) {
  const body = (await request.json()) as Parameters<typeof startMediaJob>[0];
  const job = await startMediaJob(body);

  return NextResponse.json(
    { job },
    { status: job.status === "completed" ? 200 : 500 },
  );
}
