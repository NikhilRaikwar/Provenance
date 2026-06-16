import { NextRequest, NextResponse } from "next/server";
import { recallSession } from "@/lib/memwal";
import { generateAndPublishProof } from "@/lib/proof-generator";

export async function POST(req: NextRequest) {
  try {
    const { sessionId, walletAddress } = await req.json();

    if (!sessionId || !walletAddress) {
      return NextResponse.json({ success: false, error: "Missing sessionId or walletAddress" }, { status: 400 });
    }

    const checkpoints = await recallSession(sessionId);
    if (checkpoints.length === 0) {
      return NextResponse.json({ success: false, error: "No checkpoints found for this session" }, { status: 404 });
    }

    const { proofUrl, proofBlobId } = await generateAndPublishProof(sessionId, walletAddress, checkpoints);

    return NextResponse.json({
      success: true,
      proofUrl,
      proofBlobId,
      checkpointCount: checkpoints.length,
      sessionId,
    });
  } catch (error) {
    console.error("[/api/proof]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 },
    );
  }
}
