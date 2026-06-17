import { MemWal } from "@mysten-incubation/memwal";
import type { CheckpointMemory } from "@/types";

let client: unknown = null;

function assertCredentials() {
  if (!process.env.MEMWAL_KEY || process.env.MEMWAL_KEY.includes("<")) {
    throw new Error("MEMWAL_KEY is missing. Generate a delegate key and set it in .env.local.");
  }
  if (!process.env.MEMWAL_ACCOUNT_ID || process.env.MEMWAL_ACCOUNT_ID.includes("<")) {
    throw new Error("MEMWAL_ACCOUNT_ID is missing. Generate a MemWal account and set it in .env.local.");
  }
}

export function sessionNamespace(sessionId: string): string {
  return `provenance:${sessionId}`;
}

function getClient(): any {
  if (client) return client;
  assertCredentials();
  client = MemWal.create({
    key: process.env.MEMWAL_KEY!,
    accountId: process.env.MEMWAL_ACCOUNT_ID!,
    // Standardized on MEMWAL_SERVER_URL — see .env.example
    serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
  });
  return client;
}

export async function storeCheckpointMemory(cp: CheckpointMemory): Promise<void> {
  const memwal = getClient();
  const namespace = sessionNamespace(cp.sessionId);
  const content = `Session ${cp.sessionId} checkpoint ${cp.checkpointIndex} at ${cp.timestamp}: blobId=${cp.blobId} words=${cp.wordCount}`;
  const job = await memwal.remember(content, namespace);
  await memwal.waitForRememberJob(job.job_id);
}

export async function recallSession(sessionId: string): Promise<CheckpointMemory[]> {
  const memwal = getClient();
  const namespace = sessionNamespace(sessionId);
  // Use recommended object form — positional recall(query, limit, namespace) is deprecated
  const result = await memwal.recall({ query: `all checkpoints for session ${sessionId}`, limit: 100, namespace });
  const rows = Array.isArray(result?.results) ? result.results : [];

  return rows
    .map((r: any) => parseCheckpointMemory(r.content ?? r.text ?? "", sessionId))
    .filter((row: CheckpointMemory | null): row is CheckpointMemory => row !== null)
    .sort((a: CheckpointMemory, b: CheckpointMemory) => a.checkpointIndex - b.checkpointIndex);
}

function parseCheckpointMemory(text: string, sessionId: string): CheckpointMemory | null {
  const checkpointIndex = text.match(/checkpoint\s+(\d+)/)?.[1];
  const timestamp = text.match(/at\s+([\d\-T:.Z]+):/)?.[1];
  const blobId = text.match(/blobId=([A-Za-z0-9_-]+)/)?.[1];
  const wordCount = text.match(/words=(\d+)/)?.[1];

  if (!checkpointIndex || !timestamp || !blobId || !wordCount) return null;

  return {
    sessionId,
    checkpointIndex: Number.parseInt(checkpointIndex, 10),
    timestamp,
    blobId,
    wordCount: Number.parseInt(wordCount, 10),
  };
}
