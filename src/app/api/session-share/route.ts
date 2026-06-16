import { NextRequest, NextResponse } from "next/server";
import { blobUrl, storeBlob } from "@/lib/walrus";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, walletAddress, title, wordCount, checkpointCount, checkpoints, proofUrl } = body;

    if (!sessionId || !walletAddress || !Array.isArray(checkpoints)) {
      return NextResponse.json({ success: false, error: "Missing required session fields" }, { status: 400 });
    }

    const manifest = {
      appName: "Provenance",
      version: "1.0",
      kind: "provenance-session-share",
      sessionId,
      walletAddress,
      title: title || "Untitled",
      wordCount: Number(wordCount || 0),
      checkpointCount: Number(checkpointCount || checkpoints.length),
      checkpoints,
      proofUrl: proofUrl || null,
      generatedAt: new Date().toISOString(),
    };

    const shareBlobId = await storeBlob(JSON.stringify(manifest, null, 2), 53);

    return NextResponse.json({
      success: true,
      shareBlobId,
      shareUrl: blobUrl(shareBlobId),
    });
  } catch (error) {
    console.error("[/api/session-share]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
