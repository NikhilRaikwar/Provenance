import { NextRequest, NextResponse } from "next/server";
import { recallSession } from "@/lib/memwal";

export async function GET(req: NextRequest) {
  const sessionId = new URL(req.url).searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const checkpoints = await recallSession(sessionId);
    return NextResponse.json({ success: true, sessionId, checkpoints });
  } catch (error) {
    console.error("[/api/recall]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
