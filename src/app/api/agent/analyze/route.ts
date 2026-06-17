import { NextRequest, NextResponse } from "next/server";
import { fetchBlob } from "@/lib/walrus";
import { recallSession, sessionNamespace } from "@/lib/memwal";
import { MemWal } from "@mysten-incubation/memwal";
import type { Checkpoint } from "@/types";

export interface AgentInsight {
  themes: string[];
  styleNotes: string;
  paceSummary: string;
  keyIdeas: string[];
  agentSummary: string;
  analyzedAt: string;
  checkpointCount: number;
}

/** Calls OpenAI to analyze writing excerpts. Falls back to a stub if no key is set. */
async function analyzeWithLLM(excerpts: string[], sessionId: string): Promise<AgentInsight> {
  const analyzedAt = new Date().toISOString();

  if (!process.env.OPENAI_API_KEY) {
    // Graceful stub — UI still renders, just without real LLM analysis
    return {
      themes: ["(Set OPENAI_API_KEY to enable AI analysis)"],
      styleNotes: "AI analysis unavailable — add OPENAI_API_KEY to .env.local",
      paceSummary: `${excerpts.length} checkpoints recorded this session.`,
      keyIdeas: [],
      agentSummary: "Writing agent is active and tracking your session. Add an OpenAI key for full analysis.",
      analyzedAt,
      checkpointCount: excerpts.length,
    };
  }

  const combinedExcerpts = excerpts
    .map((e, i) => `[Checkpoint ${i + 1}]: ${e.slice(0, 300)}`)
    .join("\n\n");

  const systemPrompt = `You are a writing intelligence agent embedded in Provenance, a tool that
cryptographically seals writing checkpoints on the Walrus decentralized storage network.
Analyze the provided writing excerpts from a user's session and return a structured JSON response.
Be concise, insightful, and encouraging. Focus on the writer's process, not just content.`;

  const userPrompt = `Analyze these ${excerpts.length} writing checkpoints from session "${sessionId}":

${combinedExcerpts}

Return a JSON object with these exact fields:
- themes: string[] — 2-4 recurring themes or topics detected across checkpoints
- styleNotes: string — one sentence about the writer's style (e.g., tone, sentence structure)
- paceSummary: string — one sentence about writing pace and momentum across checkpoints
- keyIdeas: string[] — 2-3 key ideas or arguments that appear across the drafts
- agentSummary: string — a 2-sentence overall assessment of this writing session

Return ONLY valid JSON, no markdown fences.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 600,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const raw = json.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as Partial<AgentInsight>;

  return {
    themes: parsed.themes ?? [],
    styleNotes: parsed.styleNotes ?? "",
    paceSummary: parsed.paceSummary ?? "",
    keyIdeas: parsed.keyIdeas ?? [],
    agentSummary: parsed.agentSummary ?? "",
    analyzedAt,
    checkpointCount: excerpts.length,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId, walletAddress } = await req.json();

    if (!sessionId || !walletAddress) {
      return NextResponse.json({ success: false, error: "Missing sessionId or walletAddress" }, { status: 400 });
    }

    // Retrieve checkpoint metadata from MemWal
    const checkpoints = await recallSession(sessionId);
    if (checkpoints.length === 0) {
      return NextResponse.json(
        { success: false, error: "No checkpoints found — write and seal at least one checkpoint first." },
        { status: 404 },
      );
    }

    // Fetch actual writing content from Walrus blobs
    const excerpts: string[] = [];
    for (const cp of checkpoints.slice(0, 10)) {
      // Cap at 10 to stay within LLM token limits
      try {
        const raw = await fetchBlob(cp.blobId);
        const parsed = JSON.parse(raw) as Checkpoint;
        if (parsed.content?.trim()) excerpts.push(parsed.content);
      } catch {
        // Skip blobs that can't be fetched — non-fatal
      }
    }

    if (excerpts.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not fetch writing content from Walrus blobs." },
        { status: 500 },
      );
    }

    // Run LLM analysis
    const insight = await analyzeWithLLM(excerpts, sessionId);

    // Store the analysis in MemWal as an agent memory for this session
    try {
      if (process.env.MEMWAL_KEY && process.env.MEMWAL_ACCOUNT_ID) {
        const memwal = MemWal.create({
          key: process.env.MEMWAL_KEY,
          accountId: process.env.MEMWAL_ACCOUNT_ID,
          serverUrl: process.env.MEMWAL_SERVER_URL ?? "https://relayer.memory.walrus.xyz",
        });
        const ns = sessionNamespace(sessionId);
        const memoryText = `Agent analysis for session ${sessionId}: themes=${insight.themes.join(",")}. ${insight.agentSummary}`;
        await memwal.remember(memoryText, ns);
      }
    } catch {
      // Storing in MemWal is best-effort — don't fail the whole request
    }

    return NextResponse.json({ success: true, insight });
  } catch (error) {
    console.error("[/api/agent/analyze]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Agent analysis failed" },
      { status: 500 },
    );
  }
}
