"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@mysten/dapp-kit-react/ui";
import { useWalletConnection } from "@mysten/dapp-kit-react";
import { BrainCircuit, FileCheck2, Fingerprint, LockKeyhole, Network, Share2 } from "lucide-react";

export function LandingPage() {
  const connection = useWalletConnection();
  const router = useRouter();

  useEffect(() => {
    if (connection.status === "connected") {
      router.push("/dashboard");
    }
  }, [connection.status, router]);

  return (
    <>
      <div id="page-landing" className="page active">
        <nav className="nav">
          <div className="nav-brand">
            <div className="nav-pulse" />
            <div className="nav-logo">Provenance</div>
          </div>
          <div className="nav-links">
            <a href="#how">How it works</a>
            <a href="#why">Why Walrus</a>
            <ConnectButton className="nav-dashboard-link">
              Dashboard
            </ConnectButton>
          </div>
          <ConnectButton className="nav-connect-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
              <line x1="12" y1="12" x2="12" y2="16" />
              <line x1="10" y1="14" x2="14" y2="14" />
            </svg>
            Connect Wallet
          </ConnectButton>
        </nav>

        {/* HERO */}
        <section className="hero">
          <div>
            <div className="hero-tag">
              <span className="hero-tag-dot" />
              Live on Walrus Testnet
            </div>
            <h1 className="hero-h1">
              Your writing,
              <br />
              <em>cryptographically proven.</em>
            </h1>
            <p className="hero-p">
              Provenance seals every draft milestone as a permanent Walrus blob, stores the ordered checkpoint chain in
              MemWal agent memory, and publishes a tamper-proof proof page - all anchored to your Sui wallet.
            </p>
            <div className="hero-btns">
              <ConnectButton className="btn-sui">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="7" width="20" height="14" rx="2" />
                  <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                </svg>
                Connect Wallet to Start
              </ConnectButton>
              <a href="#how" className="btn-outline">
                See how it works
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <div className="hs-val">53</div>
                <div className="hs-lbl">Proof lifetime</div>
              </div>
              <div>
                <div className="hs-val">15s</div>
                <div className="hs-lbl">Demo seal cadence</div>
              </div>
              <div>
                <div className="hs-val">0</div>
                <div className="hs-lbl">Trusted middlemen</div>
              </div>
            </div>
          </div>

          <div className="hero-mockup">
            <div className="mockup-bar">
              <div className="mac-dots">
                <span className="r" />
                <span className="y" />
                <span className="g" />
              </div>
              <div className="mockup-url">provenance.app/editor - session_a7k2m</div>
            </div>
            <div className="mockup-body">
              <div className="mb-wallet-chip">
                <span className="wdot" />
                0x7a23...b9c1 - Sui Testnet
              </div>
              <div className="mb-ticker">
                <span className="tdot" />
                Next seal in 38s &nbsp;-&nbsp; Demo mode
              </div>
              <div className="mb-text" id="hero-type">
                In a world where AI generates text effortlessly, the process is the proof
                <span className="mb-cursor" />
              </div>
              <div className="mb-cps">
                <div className="mb-cps-lbl">Sealed checkpoints</div>
                <div className="mb-cp-row">
                  <span className="cdot" />
                  #1 - 09:14:02
                  <span className="cbid">M4hsZGQ1oCkt...</span>
                </div>
                <div className="mb-cp-row">
                  <span className="cdot" />
                  #2 - 09:14:17
                  <span className="cbid">BKq9XPRT3nWw...</span>
                </div>
                <div className="mb-cp-row">
                  <span className="cdot" />
                  #3 - 09:14:32
                  <span className="cbid">YmRs4oGV7TFZ...</span>
                </div>
              </div>
              <ConnectButton className="mb-proofbtn">Generate Proof</ConnectButton>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="flow-section" id="how">
          <div className="flow-inner">
            <div className="section-ey">User Flow</div>
            <h2 className="section-h2">From blank page to verified proof.</h2>
            <p className="section-sub">
              Connect your Sui wallet once, then write. Everything else happens automatically on Walrus.
            </p>
            <div className="flow-steps">
              <div className="flow-step active-step">
                <div className="fs-num">1</div>
                <div className="fs-title">Connect Sui Wallet</div>
                <p className="fs-desc">
                  Connect Slippi, Sui Wallet, or any Sui-compatible wallet. Your address anchors your authorship identity.
                </p>
              </div>
              <div className="flow-step">
                <div className="fs-num">2</div>
                <div className="fs-title">Write in the Editor</div>
                <p className="fs-desc">
                  Write normally. Every 60 seconds, a checkpoint is SHA-256 hashed and sealed as a permanent Walrus blob
                  via MemWal.
                </p>
              </div>
              <div className="flow-step">
                <div className="fs-num">3</div>
                <div className="fs-title">Generate Proof</div>
                <p className="fs-desc">
                  One click rebuilds your full writing timeline from Walrus blobs and publishes it as a permanent proof
                  page.
                </p>
              </div>
              <div className="flow-step">
                <div className="fs-num">4</div>
                <div className="fs-title">Share Anywhere</div>
                <p className="fs-desc">
                  Your proof URL is permanent and requires no account to view. Share it with publishers, professors, or
                  co-founders.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="track-section" id="agents">
          <div className="track-inner">
            <div className="track-copy">
              <div className="section-ey">Walrus Track Fit</div>
              <h2 className="section-h2">A long-running agentic workflow with durable memory.</h2>
              <p className="section-sub">
                Provenance turns a writing session into reusable agent context. Checkpoints become persistent files,
                MemWal keeps the ordered memory chain, and the writing agent can analyze the session history later.
              </p>
            </div>
            <div className="track-grid">
              <article className="track-card">
                <BrainCircuit />
                <strong>MemWal memory</strong>
                <span>Session namespaces preserve checkpoint chains across visits and tools.</span>
              </article>
              <article className="track-card">
                <FileCheck2 />
                <strong>Walrus artifacts</strong>
                <span>Draft checkpoints, share manifests, and proof pages are stored as Walrus blobs.</span>
              </article>
              <article className="track-card">
                <Network />
                <strong>Agent-ready context</strong>
                <span>The API exposes recall and analysis routes for workflow automation.</span>
              </article>
              <article className="track-card">
                <Share2 />
                <strong>Portable sharing</strong>
                <span>Every session can be shared as a verifier-readable Walrus URL.</span>
              </article>
            </div>
          </div>
        </section>

        {/* WHY */}
        <section className="why-section" id="why">
          <div className="why-inner">
            <div>
              <div className="why-lbl">Why it's unforgeable</div>
              <h2 className="why-h2">The chain of custody is cryptographic, not claimed.</h2>
              <p className="why-p">
                Every other provenance tool tells you when a file was uploaded. Provenance proves the living process, and
                the chain cannot be retroactively edited by anyone, including us.
              </p>
            </div>
            <div className="why-points">
              <div className="why-pt">
                <LockKeyhole className="why-pt-ico" aria-hidden="true" />
                <div>
                  <div className="why-pt-title">Content-addressed blobs</div>
                  <p className="why-pt-desc">
                    Walrus blob IDs are SHA-256 fingerprints. You cannot upload different content and get the same ID.
                  </p>
                </div>
              </div>
              <div className="why-pt">
                <BrainCircuit className="why-pt-ico" aria-hidden="true" />
                <div>
                  <div className="why-pt-title">MemWal ordered chain</div>
                  <p className="why-pt-desc">
                    MemWal stores the ordered sequence of blob IDs with timestamps in a system outside your control.
                  </p>
                </div>
              </div>
              <div className="why-pt">
                <Fingerprint className="why-pt-ico" aria-hidden="true" />
                <div>
                  <div className="why-pt-title">Wallet-anchored identity</div>
                  <p className="why-pt-desc">
                    Your Sui wallet address is attached to every session. Authorship is tied to a cryptographic identity,
                    not an email.
                  </p>
                </div>
              </div>
              <div className="why-pt">
                <FileCheck2 className="why-pt-ico" aria-hidden="true" />
                <div>
                  <div className="why-pt-title">Proof page is a blob</div>
                  <p className="why-pt-desc">
                    The proof HTML is itself a permanent Walrus blob. Its URL is its content address - read-only forever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="land-footer">
          <div className="lf-inner">
            <div className="lf-logo">Provenance</div>
            <div className="lf-links">
              <a href="https://docs.wal.app" target="_blank" rel="noreferrer">
                Walrus Docs
              </a>
              <a
                href="https://docs.wal.app/walrus-memory/getting-started/what-is-walrus-memory"
                target="_blank"
                rel="noreferrer"
              >
                MemWal
              </a>
              <a href="https://sui.io" target="_blank" rel="noreferrer">
                Sui Network
              </a>
              <ConnectButton className="lf-dashboard-link">
                Dashboard
              </ConnectButton>
            </div>
            <div className="lf-built">
              Built on{" "}
              <a href="https://walrus.xyz" target="_blank" rel="noreferrer">
                Walrus
              </a>{" "}
              - Sui Overflow 2026
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
