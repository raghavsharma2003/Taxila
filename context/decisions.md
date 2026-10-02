# Decisions

Each decision carries its rationale AND what evidence would reverse it.

## infra-segment
**Taxila lives in its own Foundry project and its own Neon project.** (2026-10-02)
- Azure: Foundry project `taxila` on the existing `raghavsharma1729-compan-resource` (eastus2).
  Deployments are account-level, so every Taxila deployment is prefixed `taxila-` and tagged
  `product=taxila` to make cost attributable. A new resource group was the first choice, but the
  service principal is scoped to `rg-raghavsharma1729-7190` and cannot create one
  (AuthorizationFailed on `resourcegroups/write`).
- Quota at creation: gpt-realtime-2.1 capped at 10 RPM, gpt-image-2 at 4 RPM — `taxila-realtime`
  and `taxila-image` were deployed at those caps.
- Neon: new project `taxila` (`billowing-glitter-91836156`), aws-ap-southeast-1 (Singapore) —
  ap-south-1 (Mumbai) is not offered to this org. The NEON_URL the owner pasted points at the
  **meera** project and is deliberately NOT used.
- Vercel functions pinned to `sin1` to sit next to the DB.
- Reverse if: subscription-level rights are granted (move to `rg-taxila` for clean billing), or
  Neon offers Mumbai (DPDP optics + ~30 ms closer for Indian users).

## voice-realtime-model
**The live teacher voice is gpt-realtime-2.1 (full), driven turn-by-turn.** (2026-10-02)
- Rests on `realtime-teacher-bakeoff-2026-10-02`: the full model + a per-turn instruction hits a
  kid-register 25 words/turn with correct pedagogy; mini does not (38 words, factual hedging, latency outliers).
- Mechanism, not style: brevity asked for in the brief does nothing (64 words). Brevity delivered as the
  LAST line plus a per-`response.create` instruction works. This is html-portfolio's "position is mechanism"
  rule (0/8 mid-brief → 8/8 last) reproducing on a different model family.
- Consequence for architecture: auto-response from server VAD is turned OFF (`create_response:false`); the
  client issues `response.create` itself with the director's current move attached. The director (text model)
  never sits on the critical path — its latest plan is already on the client when the child stops talking.
- Gemini Live (Meera's measured voice path) is not on Azure Foundry and the owner's directive is Azure-first;
  it stays the fallback if a browser-audio test fails barge-in (<600 ms) or children's speech recognition.
- Reverse if: a blind listening test with Indian children/parents prefers another voice; or real-audio
  barge-in/latency from India fails the bar; or mini closes the quality gap (cost is ~1/4).

## voice-turn-config
**v1 live-call turn config: server_vad threshold 0.6, silence 900 ms, prefix 300 ms, server auto-response,
interrupt on, director refreshes `instructions` via `session.update` between turns.** (2026-10-02)
- Rests on `realtime-audio-in-2026-10-02`: 600 ms silence and semantic_vad both split a child's mid-thought
  pause (n=1 each, synthetic); 900 ms did not. Auto-response saves ~300 ms over client-issued response.create.
- Supersedes the per-`response.create` mechanism in `voice-realtime-model`: brevity holds from the last-line
  session rule alone, so per-turn instructions are unnecessary; the director's latest move is appended LAST to
  the session instructions with `session.update` while the child is listening.
- Known cost: ~2.1–2.4 s from a child's last word to the teacher's first sound (endpoint ~0.9 s + model
  ~0.9–1.5 s). Human-adult gaps are ~0.2–0.5 s, but children answer ~1.5× slower and a teacher waiting a beat
  reads as patience, not lag. Not yet measured from India or on real children.
- Reverse if: real-child sessions show semantic_vad does NOT split pauses (it reacted ~500 ms sooner); or
  measured latency from India exceeds ~3 s; or children report "she cuts me off".

## deploy-vercel-single-function
**Taxila deploys as Vercel project `taxila` (team raghav-carbonsettle's projects), Git-linked to
raghavsharma2003/Taxila, one catch-all function `api/[...route].js` in sin1, Vite static build.** (2026-10-02)
- First deploy `dpl_D5MD3qYvMPKGg4fjwfHVyzk9HDb7` READY; `/api/health` 200 served from sin1.
- One function, one in-process router (`server/router.js`): Hobby plans cap functions per deployment and a single
  warm function avoids N cold starts. Server code is plain JS ESM (html-portfolio's proven Vercel shape); the client
  is TS; `shared/contracts.ts` holds the seams.
- Vercel Authentication (SSO) is ON for all non-custom domains — the app is private to the team until launch.
- Reverse if: a route needs a different runtime/timeout (e.g. long consolidation → split it out), or Vercel Pro
  makes multiple functions free of cold-start cost.

## forge-models
**Forge (content factory) coder = `taxila-codex` (gpt-5.3-codex, 500 cap); designer/planner = `taxila-brain`
(gpt-5.6-sol); fast planning = `taxila-fast`; video = `taxila-sora` (sora-2 2025-12-08, preview).** (2026-10-02)
- codex smoke test: correct JS in 2.36 s via `/openai/v1/responses` (n=1).
- Claude Opus 5.5 was the first choice for game code and is blocked by billing (`claude-on-foundry-credits`).
- Reverse if: the Marketplace purchase is unblocked AND Claude beats codex on the Forge QA pass rate for the same
  game briefs (measure, don't assume).

## forge-infra-azure
**Forge workers run on Azure Container Apps (env `taxila-env`, eastus2, Consumption profile, default domain
nicebay-a0d3a12f.eastus2.azurecontainerapps.io); artifacts go to Blob Storage `taxilaforge`/`forge` (public
blob read, CORS GET from *).** (2026-10-02)
- Why not Vercel: an agentic build + headless-Chromium validation loop runs for minutes; Vercel functions cap at
  60 s here. Why Azure: the owner's credits; the service principal can create Microsoft.App and Microsoft.Storage
  resources in `rg-raghavsharma1729-7190` (verified: both PUTs accepted).
- Generated games are static files under `forge/<childId?>/<artifactId>/index.html`; the app loads them in a
  sandboxed iframe (no same-origin) — public URLs carry unguessable ids, never child names.
- Reverse if: per-student isolation needs real sandboxes (→ Container Apps dynamic sessions), or blob public read
  becomes unacceptable (→ SAS-signed URLs minted by the API).

## azure-only-compute
**Constraint (owner directive, 2026-10-02): all paid AI and compute comes from the Azure startup grant —
Azure AI Foundry first-party (Azure OpenAI) models and Azure services only.** Neon stays (separate owner grant).
- Allowed models: taxila-realtime (gpt-realtime-2.1), gpt-realtime-2.1-mini, taxila-live (gpt-live-1),
  taxila-brain (gpt-5.6-sol), taxila-fast (gpt-5.6-luna), taxila-codex (gpt-5.3-codex), taxila-image (gpt-image-2),
  taxila-sora (sora-2), gpt-4o-mini-tts, taxila-transcribe (gpt-4o-transcribe), taxila-live-transcribe,
  text-embedding-3-small.
- Removed: taxila-opus / taxila-sonnet deployments deleted (Marketplace; `claude-on-foundry-credits`).
- Excluded from builds even where research recommends them: ElevenLabs, Sarvam, Simli, HeyGen, Tavus, D-ID, Suno,
  Meshy/Tripo SaaS, Vercel Sandbox, E2B. Open-source code run on Azure compute is fine (e.g. MuseTalk on an Azure
  GPU, three.js avatars in the browser).
- Hosting: migrate web + API from Vercel to Azure Container Apps (`taxila-env`), images built in ACR `taxilacr`
  (Basic, eastus2). Vercel stays only until the Azure deployment is verified, then the Vercel project is removed.
- Reverse if: the owner adds another grant/budget, or a required capability has no Azure-native option (escalate
  to the owner instead of silently adding a vendor).

## hosting-azure-container-apps
**Web + API run on Azure Container Apps `taxila-web` (env `taxila-env`, eastus2, 0.5 vCPU / 1 GiB, min 1 / max 5
replicas, HTTP scale at 50 concurrent) at https://taxila-web.nicebay-a0d3a12f.eastus2.azurecontainerapps.io — image built by ACR `taxilacr` from the GitHub branch.**
(2026-10-02) Supersedes `deploy-vercel-single-function`; the Vercel project is PAUSED (reversible).
- Verified: ACR run ch1 built the Dockerfile from GitHub in 50 s; `/` 200, SPA fallback 200, `/api/health` 200,
  guardian signup + `/api/me` round-trip through Neon from the Azure container.
- Deploy: `git push` then `node scripts/deploy-azure.mjs` (refuses an unpushed HEAD; builds `taxila-web:<sha>`,
  rolls the revision, waits for health). Secrets live in Container App secrets, never in the image.
- Long-lived Node process: no 60 s function cap, so Forge status streams, WebSocket observers and multi-minute jobs
  are possible on the same platform.
- Region trade-off: eastus2 (next to Azure OpenAI) while Neon is in Singapore — every DB query crosses the Pacific
  (~200 ms). Measure /api/lesson/turn; if DB latency dominates, move Neon to US East (aws-us-east-1/2 are offered).
- Reverse if: latency from India is unacceptable (→ Central India region for the app + Azure Front Door), or
  Container Apps cost exceeds the grant budget.

## scope-classes-1-9
**Owner directive (2026-10-02): Taxila serves every class from 1 to 9 at launch — not the classes 6-8 wedge
recommended in `docs/research/tech-and-market.md` §8.** Subjects: Maths 1-9, EVS 3-5 / Science 6-9, English 1-9,
Hindi 1-9, Social Science 6-9 (classes 1-2: EVS content is integrated into language/maths under NCF-SE 2023 — covered
through those kits, verified by the curriculum-fill workflow).
- Consequence: the foundational stage (ages 6-8, pre- and early readers) is first-class from day one — voice-first
  UI, oral placement (ASER-style), phonics/varnamala engines, tap-to-answer fallback when ASR confidence is low,
  10-20 min sessions, a care-receiving protégé for teach-back.
- Reverse if: owner narrows scope; or measured learning/engagement for classes 1-2 is far below other bands and
  needs a dedicated product track.

## forge-sandbox-lanes
**Per-student execution environment (owner asked for "a VM per student"; decided 2026-10-02): a VM per BUILD, a
folder per STUDENT, a sandboxed iframe per PLAY.** Source: `docs/research/factory/sandboxes-per-student.md`.
- Compile/validate: untrusted Forge builds (LLM-written code) run in an ephemeral per-build sandbox — Phase 0 an
  ACA Job `forge-runner` (2 vCPU/4 GiB, Playwright image, no ingress, reverse-connects to the orchestrator, holds no
  model key); trusted engine-param validation on a warm `forge-validator` Chromium pool. Phase 1: Azure Container
  Apps Sandboxes (`Microsoft.App/sandboxGroups`, hardware-isolated microVMs from pre-warmed snapshots, default-deny
  egress, $0 when stopped; available eastus2 + centralindia) behind the same `SandboxProvider` interface.
- Store: per-child workspace = Postgres rows + private Blob prefix. Shared builds are content-addressed
  (`forge/b/<sha>/`), never contain child data; per-child params arrive at runtime via the bridge `init`.
- Run: generated code executes ONLY in the child's browser — separate-origin iframe, `sandbox="allow-scripts"`,
  CSP `connect-src 'none'`; Python (classes 8-9) via Pyodide in a Worker inside that iframe.
- Cost: ~$0.04 compute per build vs $1.5-3.5 LLM; storage+ops < $0.02/student-month.
- Supersedes ACA dynamic sessions with custom containers (billed as Dedicated E16 ≈ $1.65/h ≈ $1,200/month per warm node).
- Reverse if: Sandbox snapshot start P90 > 10 s (stay on Jobs); >~7 concurrent builds 24/7 (re-price dedicated);
  a real need for per-child process continuity appears (per-child Sandbox in disk mode, 7-day auto-delete).
- Owner actions for Phase 1: raise `SandboxCores` quota (currently 1) and grant the service principal the
  Sandboxes data-plane role.
