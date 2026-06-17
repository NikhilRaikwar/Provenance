"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDAppKit, useCurrentWallet, useWalletConnection } from "@mysten/dapp-kit-react";
import { nanoid } from "nanoid";
import { countWords, extractTitle, formatDate, formatTime, truncateAddress } from "@/lib/client-text";
import type { CheckpointResponse, ProofResponse, Session } from "@/types";

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const INTERVAL = DEMO ? 15_000 : 60_000;
const WALRUS_AGG = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR ?? "https://aggregator.walrus-testnet.walrus.space";

type Panel = "editor" | "sessions" | "proofs" | "wallet" | "agent";
type TickerState = "idle" | "saving" | "saved" | "error";

interface CpLogEntry {
  blobId: string;
  timestamp: string;
  wordCount: number;
  index: number;
}

interface StoredProof {
  sessionId: string;
  title: string;
  url: string;
  proofBlobId: string | null;
  checkpointCount: number;
  wordCount: number;
  walletAddress: string;
  createdAt: string;
}

interface AgentInsight {
  themes: string[];
  styleNotes: string;
  paceSummary: string;
  keyIdeas: string[];
  agentSummary: string;
  analyzedAt: string;
  checkpointCount: number;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Spinner SVG ──────────────────────────────────────────────────────────────
function Spinner({ blue = false, size = 14 }: { blue?: boolean; size?: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: `2px solid ${blue ? "var(--blue-mid)" : "rgba(255,255,255,.3)"}`,
        borderTopColor: blue ? "var(--blue)" : "#fff",
        borderRadius: "50%",
        animation: "spin .7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

// ─── SVG icons (inline, no extra dependency) ──────────────────────────────────
const IconPen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IconFile = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="10" />
  </svg>
);
const IconWallet = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
  </svg>
);
const IconBrain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);
const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);
const IconExternalLink = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

// ─── Dashboard Component ───────────────────────────────────────────────────────
export function Dashboard() {
  const router = useRouter();
  const dAppKit = useDAppKit();
  const connection = useWalletConnection();
  const wallet = useCurrentWallet();
  const walletAddress = connection.account?.address ?? "";

  const [panel, setPanel] = useState<Panel>("editor");
  const [sessionId, setSessionId] = useState(() => nanoid(8));
  const [content, setContent] = useState("");
  const [checkpointIndex, setCheckpointIndex] = useState(0);
  const [checkpoints, setCheckpoints] = useState<CpLogEntry[]>([]);
  const [tickerState, setTickerState] = useState<TickerState>("idle");
  const [nextSaveIn, setNextSaveIn] = useState(INTERVAL / 1000);
  const [proofState, setProofState] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [proofs, setProofs] = useState<StoredProof[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" | "" } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [agentInsights, setAgentInsights] = useState<AgentInsight | null>(null);
  const [agentState, setAgentState] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [agentStrings, setAgentStrings] = useState<string[]>([]);

  const contentRef = useRef(content);
  const cpIndexRef = useRef(checkpointIndex);
  const savingRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { contentRef.current = content; }, [content]);
  useEffect(() => { cpIndexRef.current = checkpointIndex; }, [checkpointIndex]);

  const wordCount = countWords(content);

  // ─── Toast ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg: string, type: "ok" | "err" | "" = "") => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  // ─── Storage ──────────────────────────────────────────────────────────────
  const loadStorage = useCallback(() => {
    setSessions(readJson<Session[]>("provenance:sessions", []));
    setProofs(readJson<StoredProof[]>("provenance:proofs", []));
  }, []);

  const saveSession = useCallback(
    (cps: CpLogEntry[], pUrl?: string | null) => {
      const all = readJson<Session[]>("provenance:sessions", []);
      const idx = all.findIndex((s) => s.sessionId === sessionId);
      const existing = idx >= 0 ? all[idx] : null;
      const finalProofUrl = pUrl !== undefined ? pUrl : (existing ? existing.proofUrl : null);
      const entry: Session = {
        sessionId,
        walletAddress,
        title: extractTitle(contentRef.current),
        startTime: existing ? existing.startTime : new Date().toISOString(),
        lastSaved: new Date().toISOString(),
        checkpointCount: cps.length,
        wordCount: countWords(contentRef.current),
        lastBlobId: cps.length > 0 ? cps[cps.length - 1].blobId : null,
        proofUrl: finalProofUrl,
        proofBlobId: finalProofUrl
          ? (finalProofUrl.split("/blobs/")[1] ?? null)
          : null,
      };
      if (idx >= 0) all[idx] = entry;
      else all.unshift(entry);
      writeJson("provenance:sessions", all.slice(0, 30));
      setSessions([...all]);
    },
    [sessionId, walletAddress],
  );

  const saveProof = useCallback(
    (url: string, cps: CpLogEntry[]) => {
      const all = readJson<StoredProof[]>("provenance:proofs", []);
      all.unshift({
        sessionId,
        title: extractTitle(contentRef.current),
        url,
        proofBlobId: url.split("/blobs/")[1] ?? null,
        checkpointCount: cps.length,
        wordCount: countWords(contentRef.current),
        walletAddress,
        createdAt: new Date().toISOString(),
      });
      writeJson("provenance:proofs", all.slice(0, 50));
      setProofs([...all]);
      // also update sessions proofUrl
      saveSession(cps, url);
    },
    [sessionId, walletAddress, saveSession],
  );

  useEffect(() => { loadStorage(); }, [loadStorage]);

  // ─── Seal Checkpoint ──────────────────────────────────────────────────────
  const sealCheckpoint = useCallback(async () => {
    if (contentRef.current.trim() === "" || savingRef.current) return;
    savingRef.current = true;
    setTickerState("saving");

    try {
      const res = await fetch("/api/checkpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          content: contentRef.current,
          checkpointIndex: cpIndexRef.current,
          walletAddress,
        }),
      });

      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as CheckpointResponse;
      if (!data.blobId || !data.timestamp || data.wordCount === undefined) {
        throw new Error(data.error || "Malformed checkpoint response");
      }

      const cp: CpLogEntry = {
        blobId: data.blobId,
        timestamp: data.timestamp,
        wordCount: data.wordCount,
        index: cpIndexRef.current,
      };

      setCheckpoints((prev) => {
        const next = [...prev, cp];
        setCheckpointIndex(next.length);
        cpIndexRef.current = next.length;
        saveSession(next);
        // Trigger agent after 2+ checkpoints
        if (next.length >= 2 && agentState === "idle") {
          runAgentAnalysis(next);
        }
        return next;
      });

      setTickerState("saved");
      showToast(`Checkpoint #${cpIndexRef.current} sealed on Walrus`, "ok");
      setTimeout(() => setTickerState("idle"), 3000);
    } catch (err) {
      setTickerState("error");
      showToast("Checkpoint failed — check your .env credentials", "err");
      setTimeout(() => setTickerState("idle"), 4000);
    } finally {
      savingRef.current = false;
      setNextSaveIn(INTERVAL / 1000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, walletAddress, saveSession, agentState, showToast]);

  // ─── Timer ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const auto = setInterval(() => sealCheckpoint(), INTERVAL);
    const cd = setInterval(() => {
      if (!savingRef.current) {
        setNextSaveIn((n) => {
          const v = Math.max(0, n - 1);
          return v;
        });
      }
    }, 1000);
    return () => { clearInterval(auto); clearInterval(cd); };
  }, [sealCheckpoint]);

  // ─── Agent Analysis ───────────────────────────────────────────────────────
  const runAgentAnalysis = useCallback(
    async (cps?: CpLogEntry[]) => {
      const latestCps = cps ?? checkpoints;
      if (latestCps.length === 0) return;
      setAgentState("analyzing");

      // Optimistic local analysis while API runs
      const wc = countWords(contentRef.current);
      const avg = Math.round(wc / Math.max(latestCps.length, 1));
      const localInsights = [
        `Writing velocity: ~${avg} words per checkpoint (${latestCps.length} checkpoints sealed)`,
        `Provenance chain: ${latestCps.length} SHA-256 hashed blobs in MemWal namespace provenance:${sessionId}`,
        wc > 100
          ? `Content depth: Draft has reached ${wc} words — approaching paragraph-level substance`
          : `Content building: ${wc} words so far — keep going to unlock AI analysis`,
      ];
      setAgentStrings(localInsights);

      try {
        const res = await fetch("/api/agent/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, walletAddress }),
        });
        const data = await res.json();
        if (data.success && data.insight) {
          setAgentInsights(data.insight as AgentInsight);
          setAgentStrings([]);
        } else {
          // Keep local insights visible
        }
      } catch {
        // Local insights already shown — silently continue
      } finally {
        setAgentState("done");
      }
    },
    [checkpoints, sessionId, walletAddress],
  );

  // ─── Generate Proof ───────────────────────────────────────────────────────
  const generateProof = useCallback(async () => {
    if (checkpoints.length === 0 || proofState === "generating") return;
    setProofState("generating");
    try {
      const res = await fetch("/api/proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, walletAddress }),
      });
      if (!res.ok) throw new Error(`API ${res.status}`);
      const data = (await res.json()) as ProofResponse;
      if (!data.proofUrl) {
        throw new Error(data.error || "Proof URL missing from response");
      }
      setProofUrl(data.proofUrl);
      setProofState("done");
      saveProof(data.proofUrl, checkpoints);
      setModalOpen(true);
      showToast("Proof published to Walrus!", "ok");
    } catch {
      setProofState("error");
      showToast("Proof generation failed", "err");
      setTimeout(() => setProofState("idle"), 4000);
    }
  }, [checkpoints, proofState, sessionId, walletAddress, saveProof, showToast]);

  // ─── New Session ──────────────────────────────────────────────────────────
  const startNewSession = useCallback(() => {
    setSessionId(nanoid(8));
    setContent("");
    setCheckpointIndex(0);
    setCheckpoints([]);
    setTickerState("idle");
    setNextSaveIn(INTERVAL / 1000);
    setProofUrl(null);
    setProofState("idle");
    setAgentInsights(null);
    setAgentStrings([]);
    setAgentState("idle");
    setPanel("editor");
    showToast("New session started");
  }, [showToast]);

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const disconnectWallet = useCallback(async () => {
    try {
      await dAppKit.disconnectWallet();
    } catch {
      /* ignore */
    }
    router.push("/");
  }, [dAppKit, router]);

  // ─── Copy helper ──────────────────────────────────────────────────────────
  const copy = useCallback(
    async (text: string, label = "Copied!") => {
      await navigator.clipboard.writeText(text);
      showToast(label, "ok");
    },
    [showToast],
  );

  // ─── Panel switch with data load ─────────────────────────────────────────
  const goPanel = useCallback(
    (p: Panel) => {
      setPanel(p);
      if (p === "sessions" || p === "proofs" || p === "wallet") loadStorage();
      if (p === "agent" && agentState === "idle" && checkpoints.length >= 1) {
        void runAgentAnalysis();
      }
    },
    [loadStorage, agentState, checkpoints.length, runAgentAnalysis],
  );

  // ─── Ticker label ─────────────────────────────────────────────────────────
  const tickerLabel = () => {
    if (tickerState === "saving") return "Sealing on Walrus...";
    if (tickerState === "saved" ) return "✓ Sealed on Walrus";
    if (tickerState === "error" ) return "Seal failed";
    return `Next seal in ${nextSaveIn}s`;
  };

  const tickerClass = {
    idle:   "ticker tk-idle",
    saving: "ticker tk-saving",
    saved:  "ticker tk-saved",
    error:  "ticker tk-error",
  }[tickerState];

  const walletInitial = wallet?.name?.[0]?.toUpperCase() ?? walletAddress.slice(2, 4).toUpperCase() ?? "P";

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div id="page-dashboard" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

      {/* ── Toast ─────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`toast-d ${toast.type === "ok" ? "toast-ok" : toast.type === "err" ? "toast-err" : ""}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Proof Modal ───────────────────────────────────────────────── */}
      {modalOpen && proofUrl && (
        <div className="modal-backdrop open" onClick={(e) => { if ((e.target as HTMLElement).classList.contains("modal-backdrop")) setModalOpen(false); }}>
          <div className="modal-box">
            <button className="modal-x" type="button" onClick={() => setModalOpen(false)}>✕</button>
            <div className="modal-icon">✓</div>
            <div className="modal-title">Proof Sealed on Walrus</div>
            <p className="modal-sub">
              {checkpoints.length} checkpoints · session_{sessionId} · {truncateAddress(walletAddress)}
            </p>
            <div className="modal-sum">
              <div className="ms-item"><div className="ms-val">{checkpoints.length}</div><div className="ms-lbl">checkpoints</div></div>
              <div className="ms-item"><div className="ms-val">{wordCount}</div><div className="ms-lbl">words</div></div>
              <div className="ms-item"><div className="ms-val">∞</div><div className="ms-lbl">lifetime</div></div>
            </div>
            <div className="modal-url-lbl">Permanent Walrus Proof URL</div>
            <div className="modal-url">{proofUrl}</div>
            <div className="modal-acts">
              <button className="modal-copy" type="button" onClick={() => copy(proofUrl, "URL copied!")}>Copy URL</button>
              <a className="modal-open" href={proofUrl} target="_blank" rel="noreferrer">Open Proof →</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Dashboard Shell ───────────────────────────────────────────── */}
      <div className="dash-shell">

        {/* ── Sidebar ───────────────────────────────────────────────── */}
        <aside className="dsidebar">
          {/* Brand + new session */}
          <div className="dsb-head">
            <div className="brand">
              <span className="pulse" />
              <span className="dsb-brand">Provenance</span>
            </div>
            <button className="dsb-newbtn" type="button" title="New session" onClick={startNewSession}>+</button>
          </div>

          {/* Wallet chip */}
          <div className="dsb-wallet">
            <div className="dsb-wdot" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="dsb-waddr">{truncateAddress(walletAddress)}</div>
              <div className="dsb-wnet">Sui Testnet</div>
            </div>
            <button type="button" className="dsb-wdiscon" onClick={disconnectWallet}>Disconnect</button>
          </div>

          {/* Nav */}
          <nav className="dsb-nav">
            <div className="dsb-sec-lbl">Workspace</div>

            <button type="button" className={`dsb-navbtn ${panel === "editor" ? "active" : ""}`} onClick={() => goPanel("editor")}>
              <IconPen />
              Editor
              <span className="dsb-count">{checkpoints.length} cp</span>
            </button>

            <button type="button" className={`dsb-navbtn ${panel === "sessions" ? "active" : ""}`} onClick={() => goPanel("sessions")}>
              <IconFile />
              Sessions
              <span className="dsb-count">{sessions.length}</span>
            </button>

            <button type="button" className={`dsb-navbtn ${panel === "proofs" ? "active" : ""}`} onClick={() => goPanel("proofs")}>
              <IconShield />
              Proofs
              <span className="dsb-count">{proofs.length}</span>
            </button>

            <button type="button" className={`dsb-navbtn ${panel === "agent" ? "active" : ""}`} onClick={() => goPanel("agent")}>
              <IconBrain />
              Agent Insights
              {agentState === "analyzing" && <span className="dsb-count" style={{ color: "var(--sui)" }}>•••</span>}
            </button>

            <div className="dsb-sec-lbl" style={{ marginTop: "0.75rem" }}>Account</div>

            <button type="button" className={`dsb-navbtn ${panel === "wallet" ? "active" : ""}`} onClick={() => goPanel("wallet")}>
              <IconWallet />
              Wallet Info
            </button>

            <button type="button" className="dsb-navbtn" onClick={() => router.push("/")}>
              <IconHome />
              Home
            </button>
          </nav>

          {/* Bottom Walrus status */}
          <div className="dsb-bottom">
            <div className="walrus-chip">
              <div className="wc-dot" />
              <div className="wc-txt">Walrus Testnet</div>
              <div className="wc-net">Live</div>
            </div>
          </div>
        </aside>

        {/* ── Main Area ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Topbar */}
          <div className="dash-topbar">
            <div className="dt-left">
              <div className="dt-title">
                {{ editor: "Editor", sessions: "Sessions", proofs: "Proofs", wallet: "Wallet Info", agent: "AI Agent Insights" }[panel]}
              </div>
              <div className="dt-session">session_{sessionId}</div>
            </div>
            <div className="dt-right">
              {DEMO && <span className="dt-demo">Demo Mode · 15s seal</span>}
              <div className="dt-avatar">{walletInitial}</div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="dash-main">

            {/* ══ EDITOR PANEL ══════════════════════════════════════════ */}
            <div className={`dpanel ${panel === "editor" ? "active" : ""}`} id="panel-editor">

              {/* Stats bar */}
              <div className="stats-bar">
                <div className="stat-box">
                  <div className="stat-box-lbl">Words</div>
                  <div className="stat-box-val">{wordCount}</div>
                  <div className="stat-box-sub">current draft</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-lbl">Checkpoints</div>
                  <div className="stat-box-val">{checkpoints.length}</div>
                  <div className={`stat-box-sub ${checkpoints.length > 0 ? "ok" : ""}`}>
                    {checkpoints.length > 0
                      ? `last: ${formatTime(checkpoints[checkpoints.length - 1]?.timestamp)}`
                      : "none sealed yet"}
                  </div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-lbl">Next Seal</div>
                  <div className="stat-box-val">{tickerState === "saving" ? "…" : `${nextSaveIn}s`}</div>
                  <div className="stat-box-sub warn">{DEMO ? "demo interval" : "1 min interval"}</div>
                </div>
                <div className="stat-box">
                  <div className="stat-box-lbl">Wallet</div>
                  <div className="stat-box-val" style={{ fontSize: "1rem", fontFamily: "'JetBrains Mono', monospace" }}>
                    {truncateAddress(walletAddress)}
                  </div>
                  <div className="stat-box-sub ok">Connected · Testnet</div>
                </div>
              </div>

              {/* Editor section */}
              <div className="editor-section">

                {/* Main editor card */}
                <div className="editor-card">
                  <div className="editor-toolbar">
                    <div className="etb-left">
                      <span className="etb-sid">session_{sessionId}</span>
                      <span className="etb-wc">{wordCount} words</span>
                      <div className={tickerClass}>
                        <span className="tk-dot" />
                        <span>{tickerLabel()}</span>
                      </div>
                    </div>
                    <div className="etb-right">
                      <span className="etb-cp-badge">{checkpoints.length} checkpoints</span>
                      <button
                        type="button"
                        className={`btn-proof ${proofState === "generating" ? "loading" : ""}`}
                        disabled={checkpoints.length === 0 || proofState === "generating"}
                        onClick={generateProof}
                        id="proof-btn"
                      >
                        {proofState === "generating" ? (
                          <><Spinner /> Building proof...</>
                        ) : "Generate Proof"}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="dash-textarea"
                    id="main-editor"
                    placeholder={`Start writing. Your process is being sealed on Walrus every ${DEMO ? "15 seconds (demo mode)" : "60 seconds"}...`}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>

                {/* Agent Insights card (embedded in editor) */}
                <div className="agent-card">
                  <div className="agent-head">
                    <IconBrain />
                    <div className="agent-head-title">AI Writing Agent</div>
                    <span className="agent-badge">MemWal powered</span>
                  </div>
                  <div id="agent-body">
                    {agentState === "analyzing" ? (
                      <div className="agent-analyzing">
                        <Spinner blue size={14} />
                        Agent analyzing checkpoint history via MemWal...
                      </div>
                    ) : agentInsights ? (
                      <div className="agent-insights">
                        {agentInsights.agentSummary && (
                          <div className="agent-insight">{agentInsights.agentSummary}</div>
                        )}
                        {agentInsights.themes.length > 0 && (
                          <div className="agent-insight">
                            Themes detected: {agentInsights.themes.join(" · ")}
                          </div>
                        )}
                        {agentInsights.styleNotes && (
                          <div className="agent-insight">Style: {agentInsights.styleNotes}</div>
                        )}
                        {agentInsights.paceSummary && (
                          <div className="agent-insight">{agentInsights.paceSummary}</div>
                        )}
                        {agentInsights.keyIdeas.length > 0 && (
                          <div className="agent-insight">
                            Key ideas: {agentInsights.keyIdeas.join(" · ")}
                          </div>
                        )}
                      </div>
                    ) : agentStrings.length > 0 ? (
                      <div className="agent-insights">
                        {agentStrings.map((s) => (
                          <div className="agent-insight" key={s}>{s}</div>
                        ))}
                      </div>
                    ) : (
                      <div className="agent-empty">
                        <p>
                          The writing agent will analyze your draft history
                          <br />
                          after your second checkpoint is sealed.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checkpoint log */}
                <div className="cp-log-card">
                  <div className="cp-log-head">
                    <div className="cp-log-title">Checkpoint Chain</div>
                    <div className="cp-log-meta">Each entry is a permanent Walrus blob</div>
                  </div>
                  {checkpoints.length === 0 ? (
                    <div className="cp-empty">
                      <p>No checkpoints yet.<br />Start typing — your first seal fires in {nextSaveIn}s.</p>
                    </div>
                  ) : (
                    <div className="cp-list">
                      {[...checkpoints].reverse().map((cp, i, arr) => {
                        const prev = arr[i + 1]?.wordCount ?? 0;
                        const delta = cp.wordCount - prev;
                        return (
                          <div key={cp.blobId} className="cp-item">
                            <div className="cp-num">{cp.index + 1}</div>
                            <div className="cp-main">
                              <div className="cp-time">{formatTime(cp.timestamp)} · {cp.wordCount} words</div>
                              <div
                                className="cp-blob"
                                title="Click to copy blob ID"
                                onClick={() => copy(cp.blobId, "Blob ID copied")}
                              >
                                {cp.blobId}
                              </div>
                            </div>
                            <div className="cp-wc">
                              {delta > 0 && <span className="cp-delta">+{delta}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* ══ SESSIONS PANEL ════════════════════════════════════════ */}
            <div className={`dpanel ${panel === "sessions" ? "active" : ""}`} id="panel-sessions">
              <div className="sessions-wrap">
                <div className="panel-head">
                  <div>
                    <div className="ph-title">Sessions</div>
                    <div className="ph-sub">All writing sessions from your wallet</div>
                  </div>
                  <button type="button" className="btn-small dark" onClick={startNewSession}>+ New Session</button>
                </div>
                <div className="sess-grid">
                  {sessions.length === 0 ? (
                    <div className="empty-state"><p>No sessions yet. Start writing to create your first session.</p></div>
                  ) : sessions.map((s) => (
                    <div key={s.sessionId} className="sess-card">
                      <div className="sc-top">
                        <div className="sc-title">{s.title || "Untitled"}</div>
                        {s.proofUrl && <span className="sc-proof-pill">Proof Ready</span>}
                      </div>
                      <div className="sc-meta">
                        {s.checkpointCount} checkpoints · {s.wordCount} words · {formatDate(s.lastSaved)}
                        <br />
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: ".65rem", color: "var(--ink-4)" }}>
                          {truncateAddress(s.walletAddress)}
                        </span>
                      </div>
                      <div className="sc-acts">
                        {s.proofUrl ? (
                          <>
                            <a className="sc-act prim" href={s.proofUrl} target="_blank" rel="noreferrer">View Proof →</a>
                            <button type="button" className="sc-act" onClick={() => copy(s.proofUrl!, "URL copied!")}>Copy URL</button>
                          </>
                        ) : (
                          <button type="button" className="sc-act" onClick={() => setPanel("editor")}>Continue Writing</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ PROOFS PANEL ══════════════════════════════════════════ */}
            <div className={`dpanel ${panel === "proofs" ? "active" : ""}`} id="panel-proofs">
              <div className="sessions-wrap">
                <div className="panel-head">
                  <div>
                    <div className="ph-title">Generated Proofs</div>
                    <div className="ph-sub">Permanent Walrus proof pages</div>
                  </div>
                </div>
                <div id="proofs-list">
                  {proofs.length === 0 ? (
                    <div className="empty-state">
                      <p>No proofs yet.<br />Write something and click "Generate Proof" to create your first verifiable authorship certificate.</p>
                    </div>
                  ) : proofs.map((p) => (
                    <div key={`${p.sessionId}-${p.createdAt}`} className="proof-card">
                      <div className="pc-head">
                        <div className="pc-title">{p.title || "Untitled"}</div>
                        <div className="pc-time">{formatDate(p.createdAt)}</div>
                      </div>
                      <div className="pc-url">{p.url}</div>
                      <div className="pc-acts">
                        <a className="pc-act prim" href={p.url} target="_blank" rel="noreferrer">Open Proof →</a>
                        <button type="button" className="pc-act" onClick={() => copy(p.url, "URL copied!")}>Copy URL</button>
                        <span style={{ marginLeft: "auto", fontSize: ".7rem", color: "var(--ink-4)", alignSelf: "center" }}>
                          {p.checkpointCount} cp · {p.wordCount} words
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ AGENT PANEL ═══════════════════════════════════════════ */}
            <div className={`dpanel ${panel === "agent" ? "active" : ""}`} id="panel-agent">
              <div className="sessions-wrap">
                <div className="panel-head">
                  <div>
                    <div className="ph-title">AI Writing Agent</div>
                    <div className="ph-sub">Powered by MemWal persistent memory</div>
                  </div>
                  <button
                    type="button"
                    className="btn-small dark"
                    disabled={checkpoints.length === 0 || agentState === "analyzing"}
                    onClick={() => void runAgentAnalysis()}
                  >
                    {agentState === "analyzing" ? <><Spinner />Analyzing…</> : "Re-analyse"}
                  </button>
                </div>

                {agentState === "analyzing" ? (
                  <div className="agent-card">
                    <div className="agent-head">
                      <IconBrain />
                      <div className="agent-head-title">AI Writing Agent</div>
                      <span className="agent-badge">MemWal powered</span>
                    </div>
                    <div className="agent-analyzing">
                      <Spinner blue size={14} />
                      Recalling checkpoint history from MemWal and running analysis...
                    </div>
                  </div>
                ) : agentInsights ? (
                  <>
                    <div className="agent-card" style={{ marginBottom: "1rem" }}>
                      <div className="agent-head">
                        <IconBrain />
                        <div className="agent-head-title">AI Writing Agent</div>
                        <span className="agent-badge">MemWal powered</span>
                      </div>
                      <div className="agent-insights">
                        <div className="agent-insight" style={{ fontWeight: 600 }}>{agentInsights.agentSummary}</div>
                        {agentInsights.styleNotes && <div className="agent-insight">Style: {agentInsights.styleNotes}</div>}
                        {agentInsights.paceSummary && <div className="agent-insight">{agentInsights.paceSummary}</div>}
                        {agentInsights.themes.length > 0 && (
                          <div className="agent-insight">Themes: {agentInsights.themes.join(" · ")}</div>
                        )}
                        {agentInsights.keyIdeas.length > 0 && (
                          <div className="agent-insight">Key ideas: {agentInsights.keyIdeas.join(" · ")}</div>
                        )}
                        <div className="agent-insight" style={{ color: "var(--ink-4)" }}>
                          Analysed {agentInsights.checkpointCount} checkpoint{agentInsights.checkpointCount !== 1 ? "s" : ""} · {formatDate(agentInsights.analyzedAt)}
                        </div>
                      </div>
                    </div>
                  </>
                ) : agentStrings.length > 0 ? (
                  <div className="agent-card">
                    <div className="agent-head">
                      <IconBrain />
                      <div className="agent-head-title">AI Writing Agent</div>
                      <span className="agent-badge">Local analysis</span>
                    </div>
                    <div className="agent-insights">
                      {agentStrings.map((s) => <div className="agent-insight" key={s}>{s}</div>)}
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No analysis yet.<br />Seal at least one checkpoint, then click <strong>Agent Insights</strong> to run AI analysis.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ══ WALLET PANEL ══════════════════════════════════════════ */}
            <div className={`dpanel ${panel === "wallet" ? "active" : ""}`} id="panel-wallet">
              <div className="wallet-wrap">
                <div className="panel-head">
                  <div>
                    <div className="ph-title">Wallet Info</div>
                    <div className="ph-sub">Your connected Sui wallet</div>
                  </div>
                </div>
                <div className="winfo-card">
                  <div className="wic-head">
                    <div className="wic-avatar">🌊</div>
                    <div>
                      <div className="wic-addr">{walletAddress}</div>
                      <div className="wic-net">{wallet?.name ?? "Sui Wallet"} · Sui Testnet</div>
                    </div>
                    <div className="wic-connected">● Connected</div>
                  </div>
                  <div className="wic-rows">
                    <div className="wic-row">
                      <div className="wic-row-lbl">Wallet</div>
                      <div className="wic-row-val">{wallet?.name ?? "Sui Wallet"}</div>
                    </div>
                    <div className="wic-row">
                      <div className="wic-row-lbl">Network</div>
                      <div className="wic-row-val green">Sui Testnet</div>
                    </div>
                    <div className="wic-row">
                      <div className="wic-row-lbl">Sessions</div>
                      <div className="wic-row-val">{sessions.length}</div>
                    </div>
                    <div className="wic-row">
                      <div className="wic-row-lbl">Proofs</div>
                      <div className="wic-row-val">{proofs.length}</div>
                    </div>
                    <div className="wic-row">
                      <div className="wic-row-lbl">Walrus Network</div>
                      <div className="wic-row-val blue">Testnet · aggregator.walrus-testnet.walrus.space</div>
                    </div>
                    <div className="wic-row">
                      <div className="wic-row-lbl">MemWal Relayer</div>
                      <div className="wic-row-val blue">relayer.memory.walrus.xyz</div>
                    </div>
                  </div>
                  <div className="wic-foot">
                    <button type="button" className="wic-btn" onClick={() => copy(walletAddress, "Address copied!")}>Copy Address</button>
                    <a className="wic-btn" href={`https://suiscan.xyz/testnet/account/${walletAddress}`} target="_blank" rel="noreferrer">Explorer</a>
                    <button type="button" className="wic-btn danger" onClick={disconnectWallet}>Disconnect</button>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end dash-main */}
        </div>{/* end flex col */}
      </div>{/* end dash-shell */}
    </div>
  );
}
