import { blobUrl, fetchBlob, storeBlob } from "@/lib/walrus";
import type { Checkpoint, CheckpointMemory, ProofEntry } from "@/types";

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function wordDelta(previous: string, current: string): number {
  return countWords(current) - countWords(previous);
}

function escHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function buildProofEntries(checkpoints: CheckpointMemory[]): Promise<ProofEntry[]> {
  const entries: ProofEntry[] = [];
  let previousContent = "";

  for (const cp of checkpoints) {
    const raw = await fetchBlob(cp.blobId);
    const parsed = JSON.parse(raw) as Checkpoint;
    const content = parsed.content ?? "";
    const excerpt = content.slice(0, 160);

    entries.push({
      checkpointIndex: parsed.checkpointIndex,
      timestamp: parsed.timestamp,
      wordCount: parsed.wordCount,
      wordDelta: wordDelta(previousContent, content),
      blobId: cp.blobId,
      blobUrl: blobUrl(cp.blobId),
      excerpt: content.length > 160 ? `${excerpt}...` : excerpt,
      contentHash: parsed.contentHash,
    });

    previousContent = content;
  }

  return entries;
}

export function generateProofHtml(sessionId: string, walletAddress: string, entries: ProofEntry[]): string {
  const start = entries[0]?.timestamp ?? new Date().toISOString();
  const end = entries[entries.length - 1]?.timestamp ?? start;
  const totalWords = entries[entries.length - 1]?.wordCount ?? 0;
  const rows = entries
    .map(
      (entry) => `
      <article class="entry">
        <div class="entry-top">
          <span>#${entry.checkpointIndex + 1}</span>
          <time>${escHtml(new Date(entry.timestamp).toLocaleString())}</time>
          <strong>${entry.wordCount} words ${
            entry.wordDelta > 0 ? `+${entry.wordDelta}` : entry.wordDelta
          }</strong>
        </div>
        <p>${escHtml(entry.excerpt)}</p>
        <a href="${entry.blobUrl}" target="_blank" rel="noreferrer">Walrus blob: ${entry.blobId}</a>
        <code>SHA-256: ${entry.contentHash}</code>
      </article>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Provenance Proof ${escHtml(sessionId)}</title>
<style>
:root{color-scheme:light;--cream:#F7F5F0;--line:#DDD8CE;--ink:#1A1A2E;--muted:#6B6B85;--blue:#3B6FD4;--green:#1D8A5E}
*{box-sizing:border-box}body{margin:0;background:var(--cream);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif;line-height:1.55}
main{max-width:920px;margin:0 auto;padding:56px 20px 72px}header{background:#fff;border:1px solid var(--line);border-radius:18px;padding:32px;box-shadow:0 18px 70px rgba(26,26,46,.12)}
h1{font-family:Georgia,serif;font-size:clamp(2rem,6vw,4rem);line-height:1;margin:0 0 14px}.tag{color:var(--blue);font-weight:700;text-transform:uppercase;font-size:.74rem;letter-spacing:.12em}
.meta{color:var(--muted);font-size:.9rem;margin-top:18px}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:24px}.stat{background:var(--cream);border:1px solid var(--line);border-radius:12px;padding:16px}.stat b{display:block;font-size:1.65rem}
.verify{margin-top:24px;padding:16px;border-radius:12px;background:#EBF0FB;color:#2350A8;font-size:.9rem}.entry{background:#fff;border:1px solid var(--line);border-radius:14px;margin-top:16px;padding:20px}
.entry-top{display:flex;flex-wrap:wrap;gap:12px;align-items:center;color:var(--muted);font-size:.82rem}.entry-top span{background:var(--ink);color:white;border-radius:999px;padding:4px 10px}
.entry p{font-family:Georgia,serif;font-size:1.05rem}.entry a{display:block;color:var(--blue);word-break:break-all}.entry code{display:block;margin-top:10px;color:var(--green);font-size:.78rem;word-break:break-all}
footer{margin-top:36px;color:var(--muted);font-size:.85rem;text-align:center}
</style>
</head>
<body>
<main>
<header>
<div class="tag">Provenance writing proof</div>
<h1>Your writing, cryptographically proven.</h1>
<div class="meta">
Session: <code>${escHtml(sessionId)}</code><br />
Wallet: <code>${escHtml(walletAddress)}</code><br />
First checkpoint: ${escHtml(new Date(start).toLocaleString())}<br />
Last checkpoint: ${escHtml(new Date(end).toLocaleString())}<br />
Proof generated: ${escHtml(new Date().toLocaleString())}
</div>
<div class="stats">
<div class="stat"><b>${entries.length}</b>checkpoints</div>
<div class="stat"><b>${totalWords}</b>final words</div>
<div class="stat"><b>53</b>testnet epochs</div>
</div>
<div class="verify">Verify independently by fetching each Walrus blob, hashing the content field with SHA-256, and comparing it to the displayed hash.</div>
</header>
${rows}
<footer>Built with Walrus, MemWal, and Sui. Published by Provenance.</footer>
</main>
</body>
</html>`;
}

export async function generateAndPublishProof(
  sessionId: string,
  walletAddress: string,
  checkpoints: CheckpointMemory[],
): Promise<{ proofUrl: string; proofBlobId: string }> {
  const entries = await buildProofEntries(checkpoints);
  if (entries.length === 0) throw new Error(`No valid checkpoints for ${sessionId}`);

  const html = generateProofHtml(sessionId, walletAddress, entries);
  const proofBlobId = await storeBlob(html, 53);

  return {
    proofBlobId,
    proofUrl: blobUrl(proofBlobId),
  };
}
