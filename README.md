# 🔏 Provenance

<p align="center">
  <img src="https://img.shields.io/badge/Provenance-Your%20Writing%2C%20Cryptographically%20Proven-4DA2FF?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==" alt="Provenance">
</p>

<p align="center">
  <strong>Your writing, cryptographically proven. 🖊️✨</strong><br/>
  <em>An Agentic Co-Writer Powered by Sui, Walrus, & MemWal</em>
</p>

<p align="center">
  <a href="https://sui.io"><img alt="Sui" src="https://img.shields.io/badge/Sui-Testnet-4DA2FF?style=for-the-badge&logo=sui&logoColor=white"></a>
  <a href="https://walrus.xyz"><img alt="Walrus" src="https://img.shields.io/badge/Walrus-Permanent%20Blobs-3B6FD4?style=for-the-badge&logoColor=white"></a>
  <a href="https://memwal.ai"><img alt="MemWal" src="https://img.shields.io/badge/MemWal-Agent%20Memory-1D8A5E?style=for-the-badge&logoColor=white"></a>
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-1A1A2E?style=for-the-badge&logo=next.js&logoColor=white">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
</p>

<p align="center">
  <a href="#-what-is-provenance">Overview</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-data-flow">Data Flow</a> •
  <a href="#-ai-agent-integration">AI Agent Flow</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API Documentation</a> •
  <a href="#-verification">Verification</a>
</p>

---

## 🌟 What is Provenance?

**Provenance** is a full-stack Next.js application that provides writers, researchers, and creators with a **verifiable, tamper-proof audit trail** of their document's creation history. In an era dominated by AI-generated content, **the process is the proof**. Provenance records your creative journey in real-time, anchoring checkpoints to your Sui wallet, saving files on Walrus, and persisting state across sessions using MemWal.

Built for the **🏆 Sui Overflow 2026 — Walrus Track**, Provenance demonstrates how decentralized data and agentic memory systems can cooperate to create verifiable workflows.

### ✨ Key Features

| Feature | Technical Implementation |
|--------|--------------------------|
| 🔑 **Sui Wallet Identity** | User authentication anchored to Sui testnet addresses via `@mysten/dapp-kit-react` |
| 📝 **Focused Editor** | Distraction-free, responsive dark-mode text editor with real-time statistics |
| ⏱️ **Auto-Seal Checkpoints** | Draft states are sealed as permanent content-addressed JSON blobs on Walrus |
| 🧠 **Verifiable Memory Chains** | Sequential history links stored in MemWal session namespaces (`provenance:{sessionId}`) |
| 🤖 **AI Writing Agent** | Background intelligence analyzing writing velocity, themes, style, and idea evolution |
| 📄 **Shareable Proof Pages** | Self-contained, beautiful verification HTML pages served as raw `text/html` from Walrus |
| 🔍 **Independent Auditing** | Verify any proof page independently using only public Walrus aggregators and SHA-256 hashes |

---

## 🏗️ Architecture

The block diagram below showcases the interaction between the Client, API, Decentralized Storage (Walrus), Agent Memory (MemWal), and LLM layer.

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#1e1b4b",
    "primaryTextColor": "#e0e7ff",
    "primaryBorderColor": "#6366f1",
    "lineColor": "#a5b4fc",
    "secondaryColor": "#0f172a",
    "tertiaryColor": "#0c4a6e",
    "background": "#0f172a",
    "fontFamily": "Inter, sans-serif",
    "fontSize": "14px",
    "edgeLabelBackground": "#1e1b4b",
    "clusterBkg": "#020617",
    "titleColor": "#a5b4fc"
  }
}}%%
flowchart TB
  subgraph CLIENT["🖥️ Client Layer (Next.js App)"]
    direction LR
    User["👤 Writer"]
    Wallet["🔑 Sui Wallet Connect"]
    Dashboard["📊 Dashboard UI"]
    Editor["✍️ Focused Editor"]
  end

  subgraph API["⚙️ API Layer (Route Handlers)"]
    direction TB
    CheckAPI["📌 POST /api/checkpoint"]
    ProofAPI["📄 POST /api/proof"]
    AgentAPI["🤖 POST /api/agent/analyze"]
    ShareAPI["🔗 POST /api/session-share"]
  end

  subgraph WALRUS["🌊 Walrus Storage Network (Decentralized Blobs)"]
    direction LR
    WalrusCP["📦 Checkpoint JSONs"]
    WalrusProof["🏅 Proof HTML Page"]
    WalrusManifest["📋 Session Manifest"]
  end

  subgraph MEMWAL["🧠 MemWal (Agent Memory Layer)"]
    direction LR
    MemSession["🗂️ Session Namespace"]
    MemChain["🔗 Checkpoint Index Chain"]
    AgentMem["🤖 Agent Analysis Memory"]
  end

  subgraph LLM["🤖 LLM Layer"]
    OpenAI["GPT-4o-mini"]
  end

  User --> Wallet
  Wallet --> Dashboard
  Dashboard --> Editor
  Editor --> CheckAPI
  Dashboard --> AgentAPI
  Dashboard --> ProofAPI
  Dashboard --> ShareAPI

  CheckAPI --> WalrusCP
  CheckAPI --> MemSession
  MemSession --> MemChain

  AgentAPI --> MemChain
  AgentAPI --> WalrusCP
  AgentAPI --> OpenAI
  AgentAPI --> AgentMem

  ProofAPI --> MemChain
  ProofAPI --> WalrusCP
  ProofAPI --> WalrusProof

  style CLIENT fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
  style API fill:#0c4a6e,stroke:#0ea5e9,color:#e0f2fe
  style WALRUS fill:#0d3b2e,stroke:#10b981,color:#d1fae5
  style MEMWAL fill:#2d1b4e,stroke:#a855f7,color:#ede9fe
  style LLM fill:#451a03,stroke:#f97316,color:#ffedd5
```

---

## 🌊 Data Flow

This sequence diagram illustrates the lifecycle of a writing session, starting from wallet connection through to checkpoint sealing, LLM agent analysis, and proof publishing.

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#0f172a",
    "primaryTextColor": "#f1f5f9",
    "primaryBorderColor": "#38bdf8",
    "lineColor": "#22d3ee",
    "secondaryColor": "#164e63",
    "tertiaryColor": "#0d3b2e",
    "noteBkgColor": "#1e293b",
    "noteTextColor": "#e2e8f0",
    "activationBorderColor": "#818cf8",
    "activationBkgColor": "#1e1b4b",
    "fontFamily": "Inter, sans-serif"
  }
}}%%
sequenceDiagram
  autonumber
  actor User as 👤 Writer
  participant UI as 🖥️ Next.js UI
  participant API as ⚙️ API Route
  participant Walrus as 🌊 Walrus
  participant MemWal as 🧠 MemWal
  participant LLM as 🤖 OpenAI

  User->>UI: Connect Sui Wallet
  UI-->>User: Connected (0x...)

  Note over User,LLM: ✍️ Editor Auto-Save Flow
  loop Every 60s (or manual "Seal Now")
    User->>UI: Types document content
    UI->>API: POST /api/checkpoint {content, sessionId, index}
    API->>Walrus: Store raw draft blob (Content-Type: application/json)
    Walrus-->>API: returns blobId
    API->>MemWal: remember(checkpointDetails, namespace)
    MemWal-->>API: Memory certified ✅
    API-->>UI: returns {blobId, timestamp, index, wordCount}
    UI->>UI: Log checkpoint locally & update state
  end

  Note over User,LLM: 🤖 AI Writing Agent Intelligence
  UI->>API: POST /api/agent/analyze {sessionId}
  API->>MemWal: recallSession(sessionId)
  MemWal-->>API: returns ordered blobIds
  API->>Walrus: Fetch latest checkpoint contents
  Walrus-->>API: returns raw text excerpts
  API->>LLM: Analyze writing evolution & style
  LLM-->>API: returns structured JSON analysis
  API->>MemWal: remember(agentInsights, namespace)
  MemWal-->>API: Memory certified ✅
  API-->>UI: returns {themes, styleNotes, agentSummary}
  UI-->>User: Display agent insights in dashboard panel

  Note over User,LLM: 🏅 Verifiable Proof Publishing
  User->>UI: Click "Generate Proof"
  UI->>API: POST /api/proof {sessionId}
  API->>MemWal: recallSession(sessionId)
  MemWal-->>API: returns checkpoint chain
  API->>Walrus: Fetch all checkpoints
  Walrus-->>API: returns document history
  API->>API: Compile self-contained proof page with SHA-256 integrity logs
  API->>Walrus: Store proof page (Content-Type: text/html)
  Walrus-->>API: returns proofBlobId
  API-->>UI: returns proofUrl (permanent link)
  UI-->>User: Open & share cryptographic proof page!
```

---

## 🤖 AI Agent Integration

Provenance fulfills the requirements of the Walrus Track by introducing a **Writing Intelligence Agent** powered by a persistent, verifiable memory stack:

1. **Memory Recovery:** When a session is loaded, the agent queries MemWal to reconstruct the history of writing milestones.
2. **Context Assembly:** It retrieves actual draft contents from the decentralized Walrus storage network using content-addressed blob IDs.
3. **LLM Reasoning:** Excerpts are passed to a customized model prompt designed to evaluate creative progress, style modifications, argument developments, and writing speed.
4. **Verifiable Storage:** The agent's output is recorded back to MemWal inside the session namespace, ensuring the agent's insights are portable and auditable.

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- A Sui-compatible wallet browser extension (Sui Wallet, Slush, etc.)
- A [MemWal delegate account key](https://memwal.ai)

### 1. Clone & Install
```bash
git clone https://github.com/SumitRaikwar18/Provenance.git
cd Provenance
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory:
```env
# MemWal Agent Memory (Server-Side Only)
MEMWAL_KEY=your_memwal_delegate_private_key_hex
MEMWAL_ACCOUNT_ID=0x_your_memwal_account_id
MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz

# Walrus API endpoints
WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space

# AI Agent Configuration
OPENAI_API_KEY=your_openai_api_key

# Public (Browser-Safe)
NEXT_PUBLIC_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
NEXT_PUBLIC_APP_NAME=Provenance
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```
> [!WARNING]
> Keep `.env.local` out of your git commits. The `MEMWAL_KEY` and `OPENAI_API_KEY` are sensitive keys and should never be exposed to the client.

### 3. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📡 API Reference

### `POST /api/checkpoint`
Seals a new writing checkpoint to Walrus and records its reference in MemWal.
```json
{
  "sessionId": "xY8zW2",
  "walletAddress": "0x7a23...b9c1",
  "content": "This is the updated draft text...",
  "checkpointIndex": 1
}
```
**Response:**
```json
{
  "success": true,
  "blobId": "M4hsZGQ1oCVZt-e3s...W7_4BUk",
  "timestamp": "2026-06-17T06:00:00.000Z",
  "checkpointIndex": 1,
  "wordCount": 7
}
```

### `POST /api/agent/analyze`
Triggers the AI agent to read Walrus files, compile the history, analyze progress, and store memory.
```json
{
  "sessionId": "xY8zW2",
  "walletAddress": "0x7a23...b9c1"
}
```
**Response:**
```json
{
  "success": true,
  "insight": {
    "themes": ["Cryptographic accountability", "Decentralized state systems"],
    "styleNotes": "The user writes with a formal, academic tone using active voice constructions.",
    "paceSummary": "Writing momentum is consistent, adding roughly 7 words per checkpoint.",
    "keyIdeas": ["Decentralization of memory structures", "Walrus as an auditing back-bone"],
    "agentSummary": "Your thesis is shaping up beautifully. The structural transition between checkpoints 1 and 2 shows strong reasoning.",
    "analyzedAt": "2026-06-17T06:01:00.000Z",
    "checkpointCount": 2
  }
}
```

---

## ✅ Verification & Auditing

Anyone can verify a generated proof page independently using raw tools.

1. Open the proof's public Walrus aggregator URL.
2. In the *Integrity Log*, copy any target `Blob ID` and the expected `SHA-256 Hash`.
3. Fetch the raw blob from the aggregator:
   ```bash
   curl https://aggregator.walrus-testnet.walrus.space/v1/blobs/<Blob-ID>
   ```
4. Verify the `content` field of the returned JSON. Compute its SHA-256 hash:
   ```bash
   echo -n "<Content-Text>" | shasum -a 256
   ```
5. Compare the output to the expected hash displayed on the proof page. If they match, the proof is authentic and un-tampered.

---

## 🏆 Hackathon Checklist Status

- [x] **State Persistence:** MemWal keeps track of all checkpoint links.
- [x] **File Portability:** Checkpoint files and proof HTML pages are saved on Walrus, readable anywhere.
- [x] **AI Workflow:** AI agent analyzes writing progress and saves thoughts to the delegate's memory.
- [x] **Sui Integration:** Identity bound to the user's active wallet account.
- [x] **Aesthetic UI:** Complete responsiveness with customized dark mode.

---

## 📜 License
MIT © 2026 [Sumit Raikwar](https://github.com/SumitRaikwar18) — Developed for Sui Overflow 2026.
