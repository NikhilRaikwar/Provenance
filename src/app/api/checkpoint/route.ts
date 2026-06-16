import { NextRequest, NextResponse } from "next/server";
import { buildCheckpoint } from "@/lib/checkpoint";
import { storeCheckpointMemory } from "@/lib/memwal";
import { storeBlob } from "@/lib/walrus";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, walletAddress, content, checkpointIndex } = await req.json();

    if (!sessionId || !walletAddress || content === undefined || checkpointIndex === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    if (String(content).trim() === "") {
      return NextResponse.json({ success: false, error: "Content is empty" }, { status: 400 });
    }

    const checkpoint = buildCheckpoint(sessionId, walletAddress, Number(checkpointIndex), String(content));
    const blobId = await storeBlob(JSON.stringify(checkpoint), 5);

    await storeCheckpointMemory({
      sessionId,
      checkpointIndex: checkpoint.checkpointIndex,
      blobId,
      timestamp: checkpoint.timestamp,
      wordCount: checkpoint.wordCount,
    });

    return NextResponse.json({
      success: true,
      blobId,
      timestamp: checkpoint.timestamp,
      checkpointIndex: checkpoint.checkpointIndex,
      wordCount: checkpoint.wordCount,
    });
  } catch (error) {
    console.error("[/api/checkpoint]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
