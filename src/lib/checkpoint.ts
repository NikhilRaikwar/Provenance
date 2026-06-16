import { createHash } from "crypto";
import type { Checkpoint } from "@/types";

export function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

export function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

export function buildCheckpoint(
  sessionId: string,
  walletAddress: string,
  checkpointIndex: number,
  content: string,
): Checkpoint {
  return {
    sessionId,
    walletAddress,
    checkpointIndex,
    timestamp: new Date().toISOString(),
    wordCount: countWords(content),
    charCount: content.length,
    contentHash: sha256(content),
    content,
    appName: "Provenance",
    version: "1.0",
  };
}
