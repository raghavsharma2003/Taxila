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


<!-- merged from inbox/design.json -->
## ds-layout-dp-budget
**The live-lesson stage is laid out in dp budgets solved for a 584 dp floor (360 x 640 phone, and the ~650 dp web viewport) and a 744 dp comfortable case, with a micro layout below 584 and a keyboard-open mode; geometry (L1-L5) changes only at phase boundaries.** (2026-10-02)
- Rationale: lesson-arc's percentage shares overflow (see `ds-rejected-percentage-layout`); ui-teardown's 744 dp budgets assumed a best-case phone. Every column of the new tables sums exactly; minimums (band targets, mic hit, caption, canvas 184 dp Young L3, faceMin) are never broken; the ledge overlays the stage below 680 dp. Holding one geometry per phase removes reflow jank on tier C and gives her pointing a large canvas in P3.
- Gate: PD-G1 (layout fit on the real signed-in lesson across 9 containers x font scale 1.0/1.3/2.0 x keyboard), PD-G3 (geometry stability).
- Reverse if: M-UT-2 shows the teacher-below-content order wins by >= 15% on YOUR TURN latency for B1-B2; or a pilot shows tiles inside the canvas lower answer accuracy vs a control-bar row; or M-ARC-1 shows P3 explanation needs a larger face (then give P3 its own L2 explain geometry, still switching only at a phase boundary).
- Source: `docs/research/design/PRODUCT-DESIGN.md` §3.3.

## ds-mic-tap-default
**Tap-to-toggle talk is the default for every band when audio plays on the loudspeaker. Open mic (server VAD per `voice-turn-config`) is opt-in for B3-B4 and offered only on a headset or after a 10 s EchoProbe passes. End of speech: a second tap, or a local silence ramp of 3 s (Young) / 2 s (Older), +1.5 s after a filler, shown as a draining ring. Hold-to-talk is never required; "tap instead" is present from turn one.** (2026-10-02)
- Rationale: three sibling critiques independently flagged open mic on shared loudspeaker phones (self-echo, siblings, TV) and short endpoints cutting off children who pause mid-thought; `realtime-audio-in-2026-10-02` already showed 600 ms splitting a child's pause, and its 900 ms result is synthetic, n=1. Long-press is banned for Young, so tap-to-toggle is the only safe manual mode.
- Reverse if: M-LE-6 + M-UX-3 show open mic on loudspeaker with EchoGuard has self-interrupt and cut-off rates no worse than tap mode; or M-LE-15 on real child audio shows the 3 s / 2 s ramp cuts off < 2% of turns at a shorter value (then shorten it).
- Source: `docs/research/design/PRODUCT-DESIGN.md` §3.9.

## ds-status-carriers
**Each of the four states (YOUR TURN, LISTENING, THINKING, SPEAKING) is carried by a teacher pose, a glyph beside the mic, a sound rule and an accessible name; colour is the last carrier. The marigold ring appears only in YOUR TURN on one element, drawn as an outline with a darkened `#7A4800` ring. YOUR TURN requires a hand-over (`handover` != chain); with no pending hand-over the honest state is THINKING.** (2026-10-02)
- Rationale: `design-token-contrast-2026-10-02` shows done vs stop 13.0 (deutan) / 14.1 (protan), listen vs think 14.4 (tritan), listen vs brand jamun 10.4 (deutan), all below the dE 15 floor, so colour cannot carry state; the kids-ux ring had only 3.01:1 against its own fill. `src/lesson/status.ts` currently falls through to your_turn whenever nothing is pending, which would ring an ambiguous idle screen.
- Gates: PD-G2 (one ring, exhaustive), PD-G5 (status from events), PD-G6 (glyph + greyscale/CVD screenshots).
- Reverse if: M-ARC-1 shows > 15% of YOUR TURN windows reach the tap fallback (add a spoken cue, never a second ring); or the glyph row tests as noise with no effect on missed turns in the accessibility pilot M-ARC-12.
- Source: `docs/research/design/PRODUCT-DESIGN.md` §3.9.

## ds-captions-by-reading-level
**Caption defaults follow measured reading level, not class: R0 gets an icon strip (phir se, slower) and no text; R1 gets the phrase with one or two words lit at her pace; R2 (B3-B4 included) gets a plain one-line subtitle, on by default. A captions-always switch is one child tap away (CC pictogram) and settable at onboarding ("hard to hear") and by the parent. Word highlighting ships only if transcript lead >= 150 ms (E-8) or the lane moves to Voice Live; the lit word keeps its weight and gets a 2 dp jamun bar.** (2026-10-02)
- Rationale: sibling docs conflicted (karaoke on for Young; off for R0 as text noise; on for every band as an access need). Both access and text load hold, so the default is by reading level and access is a switch, not a default. The WebRTC lane carries no word timestamps, so a drifting highlight would teach the wrong word.
- Reverse if: M-UX-8 shows captions on for R0 improve delayed recall or word recognition (then default the phrase line on for R0); or R1 follow-along shows no benefit over a static phrase line.
- Source: `docs/research/design/PRODUCT-DESIGN.md` §3.8.

## ds-band-fork-older
**B3-B4 get a distinct fork, not B1-B2 with fewer tiles: Mukta 700 display (no Baloo), flat bordered tiles with no press ledge, radii 16/10, a study-tool home with doubts and test-week windows, a phase word instead of progress, face / small / voice-only presentation modes from day one, explainer notes instead of a protégé (B3 opt-in), honest-purpose placement framing, the child owning tum/aap, earcons off by default, two teacher characters (woman, man) the child chooses.** (2026-10-02)
- Rationale: NN/g and ICO evidence via kids-ux (babyish design repels; teens respond to respect), and every sibling critique found the Older path wearing the B1 costume (Baloo display, protégé creature, walkie-talkie art, story-framed diagnostic).
- Reverse if: M-VI-8 (embarrassment) and M-UX-5 / MW-M5 (who is this app for) show no difference between the forked and unforked Older treatments at n >= 8-15 per band; or B3 week-4 return drops against the unforked arm with no learning gain.
- Source: `docs/research/design/PRODUCT-DESIGN.md` §5.

## ds-progress-no-meters
**No in-lesson progress meter for any band (Young: nothing, she says where we are; Older: the current phase word). Progress lives in a monotone, absence-invariant map of the parent's ledger (Bagiya for Young, Aasmaan for Older, child-switchable) with a list view as the source of truth. The review-due bird renders only from a server `recheck_scheduled` row; v1 has no protégé props, no bed name boards, no persistent family-reaction chip (reactions are relayed once in speech).** (2026-10-02)
- Rationale: stepping stones that fill are a goal-gradient bar (four critiques); FSRS retrievability is time-dependent and broke the 365-day invariance gate; props and chips are surprise drops and visible absence of approval (motivation critique C1-C4).
- Gates: PD-G19 (absence invariance), PD-G20 (no meters or time grids importable from child routes).
- Reverse if: MW-M1 / MW-M7 show a lesson-position cue raises free-choice persistence with delayed retention unchanged (a position cue only, never a fill); or MW-M2 shows children cannot find their place without one.
- Source: `docs/research/design/PRODUCT-DESIGN.md` §8.

## ds-parent-gate-pin-default
**The guardian PIN (set at onboarding) is the default gate for the Parent corner; "use phone lock" (BiometricPrompt / KeyguardManager) is an option. Consent-grade actions (consent change, export, delete, co-parent, PIN reset) re-authenticate by OTP; PIN recovery needs a factor off the shared device or a 24 h delay with a WhatsApp notice, with OTP autofill disabled on the reset screen.** (2026-10-02)
- Rationale: on shared family phones children often know the unlock pattern, and the OTP lands on the very device the child holds (kids-ux critique C6.1, parent-experience critique B20); a maths gate is solved by a Class 6 child.
- Reverse if: M-UX-9 (1-week home diary, 20 families) shows zero child entries with the phone-lock gate and parents prefer it (then make phone lock the default where the parent says the child does not know it).
- Source: `docs/research/design/PRODUCT-DESIGN.md` §6.2.


<!-- merged from inbox/learner.json -->
## learner-legal-mode-ratchet
**Every learner layer writes through one module that checks `child.legal_mode` (M0 stateless, M1 academic record, M2 school mode under a DPA, M3 full consumer). A layer not permitted in a mode has no write path. Consumer default at launch is M1; the mode only ratchets down, and every change is audited.** (2026-10-02)
- Rationale: each sibling learner doc invented its own persistence flag (KT_MODE, VibeMode, PP_MODE, profile_enabled, cri_persist), and every sibling review independently found its layer inside the DPDP s.9(3) exposure. One flag enforced in code (dpdp-deep NM-1) makes the narrow mode real and testable: M0 is built from M1 by deleting every learner row in one transaction. NM-3 items (latency, affect, engagement, vibe estimates, trust, format posteriors, free text about the child) are never persisted in any mode.
- Gate: schema test (no NM-3 columns outside M3-only tables), M1->M0 ratchet test leaves zero learner rows, erasure cascade test.
- Reverse if: counsel's written opinion on dpdp-deep Q1 permits a layer in a lower mode, or a s.9(5) notification issues; then that layer's mode floor moves. Nothing else about the ratchet changes.
- Source: `docs/research/learner/LEARNER-MODEL.md` §4, §12.

## learner-safety-gate-first
**A single safety predicate (distress, self-harm, abuse or secrecy disclosure, unsafe adult) runs first on every child and parent utterance. A fired gate yields a safeguard move, writes only an incident row, and freezes MRT arms, solo rounds, wait timers, verify budgets, vibe adaptation and memory candidates for the lesson. Simulated traffic routes to a sink.** (2026-10-02)
- Rationale: seven sibling reviews (need, motivation, affect, onboarding, metacognition, personalisation, simulators) each found the same missing hook; silence-in-solo-round and wait-time invariants would otherwise override the child-safety floor. Safety by predicate, not instruction (inherited law).
- Gate: crisis battery inside a solo round still passes; sim safety-sink test (SM12) before any --live run.
- Reverse if: never (the predicate set and thresholds change; the position does not).
- Source: `docs/research/learner/LEARNER-MODEL.md` §2, §10.

## learner-bktr-ledger
**The knowledge ledger is BKT-R per (child, skill): categorical hint-ladder outcomes (C0-C4 plus idk and no-attempt), grader confusion folded into emissions (LLM default diagonal 0.7), a symmetric FSRS-6 retrievability gate (so LR(C0) >= 1, never 1.5), one learning transition per item-episode, a per-(skill, session) evidence budget (1/j weights per class, clamp +/- log 50), cold-start pL0 = (P-g)/(1-g-s), and a separate retention = pL*R that the tutor and parent read. States: learned_today, mastered (delayed >= 20 h success), durable (7 d and 30 d).** (2026-10-02)
- Rationale: kt-algorithms D1-D7 with its review R1-R4, R7, R14, R20, R27, R30 applied. Without the budget, three strong same-session events take pL 0.39 -> 0.997; with it the in-session ceiling from that prior is 0.970 (computed), so mastery needs diversity and a delayed success. Updates run in the evidence route on Azure Container Apps under a per-child advisory lock ordered by server seq; refits run as an ACA scheduled job.
- Gate: property tests (LR(C0) >= 1 for all R, ASR-dropped events change nothing, absence never lowers display, shuffled-arrival replay = online fold, every class x outcome has an emission), simulator R2b false mastery <= 5% under both truth families.
- Reverse if: PFA, Elo or a small neural KT beats BKT-R by >= 0.02 AUC on delayed items in 2 consecutive monthly refits (K6).
- Source: `docs/research/learner/LEARNER-MODEL.md` §6.1.

## learner-ge-scale-one-cat
**One grade-equivalent scale with GE 0 = start of Class 1 (so 5.0 = start of Class 6) and one engine: a success-first Bayesian CAT on a 281-point grid with a 4PL item model and a mixture prior (0.6 on-track, 0.4 far-behind). Session 1 caps 6-8 items per strand, stops at SD < 0.55 after >= 4 items or on strain/exit/time, always closes on a likely success, and seeds skills only up to 'practising'. Placement stays provisional until ~16 items per strand via just-in-time items in lessons 2-3.** (2026-10-02)
- Rationale: three sibling docs used three scales and three stopping rules; the onboarding simulation showed SD < 0.35 is unreachable in 12 items and that a single class prior misplaces far-behind children (see onboarding-cat-sim-2026-10-02).
- Reverse if: M-OD-1 placement agrees with a trained ASER-style oral tester on < 70% of children, or the K4 cross-class 2PL pilot shows a non-linear grade scale fits >= 0.05 log-likelihood better.
- Source: `docs/research/learner/LEARNER-MODEL.md` §6.3; `docs/research/learner/onboarding-diagnostic.md`.

## learner-one-engagement-machine
**There is one engagement state machine, session-only: warming, engaged, strained, disengaging, stopped. Rule detectors (gaming, impasse/wheel-spin, confusion clock, frustration, drift) raise suspicions; a suspicion buys at most one budgeted no-regret verifying move; costly moves need the child's pick or a confirmed state. Strain suppression sits above explicit preferences; child META requests (stop, slow, break) are honoured the same turn. The 11-moment motivation filter is deferred.** (2026-10-02)
- Rationale: vibe, motivation and dialogue-affect each specified their own state; at published base rates (boredom 4-6% of observations) a boredom flag acted on directly has PPV about 0.20 (computed in dialogue-affect §6.1). Rule detectors transferred across systems at kappa 0.23-0.26 where ML fell to 0.00-0.06 (Paquette & Baker 2019, via dialogue-affect). The motivation review asked for the 5-state version first.
- Reverse if: MM2 shows the 11 causes are separable at kappa >= 0.6 and change the chosen move, or a Taxila-trained detector beats the rules by >= 0.10 kappa on held-out children.
- Source: `docs/research/learner/LEARNER-MODEL.md` §6.7.

## learner-brief-and-tail-order
**The realtime teacher's instructions are compiled in one order for every lane: PERSONA, CHILD brief (<= 600 tokens, key=value rows, drop-not-rewrite, no levels/gaps/day counts/labels/ids), LESSON NOW (rung-gated: no answer below ceiling 4), then a budgeted tail VIBE -> PEDAGOGY NOW -> SAFETY -> TURN SHAPE (last). Address lives in the CHILD row, so the pedagogy directive is byte-identical under identity swaps.** (2026-10-02)
- Rationale: vibe, personalisation, CLAUDE.md and the G1 gate each claimed the last position; position is mechanism (a rule mid-brief fired 0/8, last 8/8, inherited) and truncation is silent. A filled 17-row brief measured 1,086 chars, about 311 estimated tokens (computed), leaving room for Devanagari titles and one memory opener.
- Gate: G1 on a 2x fixture; identity-swap byte identity; R13 in the simulator battery.
- Reverse if: G1/G6 show a different tail order fires the safety and pedagogy attributes more often on the Taxila Tutor Bench.
- Source: `docs/research/learner/LEARNER-MODEL.md` §9.

## sim-code-truth-two-families
**The simulated student is a seeded code state machine with a verified language skin; it never decides with an LLM. Every learning-inference metric is reported under two truth families (bkt2, matching Taxila's KT, and cfrag: continuous mastery, transfer penalty, fragile knowledge, strategy mixture) and three gain tables (author, flat, inverted); a conclusion counts only if it holds under all. Metrics carry a validity scope and can never claim efficacy.** (2026-10-02)
- Rationale: LLM-decided sims are too competent and flip on 50-97% of feedback regardless of relevance (Do et al. 2026, via student-simulators); a BKT-generated child makes a BKT tutor look good by construction (simulators review B1); a single gain table measures agreement with its author (review A1).
- Gate: self-tests H2a-H2e and eight tutor controls plus mutation tests must pass for a run to be valid.
- Reverse if: a trained simulator passes the fidelity card F1-F8 on >= 300 consented pilot lessons; that family may then carry 'ranking' scope.
- Source: `docs/research/learner/STUDENT-SIM.md` §0-§11.


<!-- merged from inbox/avatar.json -->
## avatar-v1-stack
**The v1 3D tutor runs on three.js 0.180.0 + TalkingHead 1.7.0 vendored at commit b3e277b in `avatarOnly` mode with our own WebGLRenderer and GLTFLoader (KTX2Loader with `setWorkerLimit(1)` + MeshoptDecoder), plus HeadAudio vendored at d3af5f9 (MFCC + classifier modules only). It is WebGL2-only and mounted imperatively by `<TutorStage>` in the existing StageFrame. Assets are meshopt + KHR_mesh_quantization + KTX2 ETC1S. v1 ships face tier B (≤15k tris, ≤4 draws, GLB ≤1.5 MB, resident ≤20 MB, 30/30/20 fps), B-lite as runtime knobs on the same GLB, D (an illustrated plate + mouth strip rendered from the same GLB with the B shader) and E (voice-only). Tier C (sprite rig) is cut. Tier choice uses static facts, then a 2 s probe on the chosen tutor, then one merged governor. This supersedes PRODUCT-DESIGN §3.5's 2D Rive launch face (owner directive, 2026-10-02); M-AV-1 replaces M-UX-6.** (2026-10-02)
- Rationale:
  - TalkingHead already ships blinks, moods, gaze, dynamic bones and an avatarOnly mode. It is MIT.
  - JS size, measured: three + TalkingHead 217.5 KB gz, against Babylon at 777.8 KB. model-viewer has no morph API [V].
  - Android WebView has no WebGPU [V].
  - meshopt and ETC1S win on size, decode time and GPU memory (`avatar-asset-perf-2026-10-02`).
  - Rive costs 368–821 KB gz and would show a different-looking person.
  - TalkingHead's shipped defaults break or misbehave and must be patched: frame-cap judder (≈23 fps), the clamped-dt clock, no KTX2 loader, an AudioContext at construction, `getBoundingClientRect` on a null node, and an `mtRandomized` crash (patch list TH-1…TH-8 in AVATAR.md §1.3).
- Reverse if:
  - E-P3 fails the tier-B bars on the G85 at minute 30 (then tighten the budget), or passes with more than 2× headroom (then loosen it);
  - a WebView build on the lab phones exposes `navigator.gpu` and a morph benchmark beats WebGL2;
  - TalkingHead upstream diverges so that the patch list cannot be carried; then keep the scheduler ideas and drive three directly;
  - M-AV-1 fails at every stylisation level for a band, in which case that band defaults to the small or voice-only presentation and the owner is told.
- Source: `docs/research/avatar/AVATAR.md` §1, §6; `web-3d-talking-heads.md`; `performance-android.md`.

## avatar-lipsync-rms-jaw
**Lip-sync never touches the playback path. The `<audio>` element stays unmuted and plays the WebRTC stream. A second AnalyserNode (fftSize 2048) hangs off the `MediaStreamAudioSourceNode` that VoiceLink already creates. It is never connected to `destination`, and the avatar adds no AudioContext, worklet or DelayNode in phase 1.**
- The jaw follows the RMS envelope, with level-normalised gate and gain and the benched filter.
- Lip shape comes from HeadAudio classes, patched (aa fix, ring of 3, predict every frame), retrained on our Hindi tutor voices, and mapped to ARKit through a per-character `lipMatrix` at reduced weight. `mouthClose ≤ jawOpen` holds every frame.
- Her speech start and stop come from the tap's own VAD. `output_audio_buffer.*` events are hints only.
- A signed, per-output-route `faceDelay` delays the face (the face leads on Bluetooth). Audio is never delayed.
- Pass bar: −125 ms ≤ offset ≤ +45 ms after compensation, per route (E-P8). A phase-2 AudioWorklet → worker path ships only after E-P1, E-P2 and the audio-floor gate pass. (2026-10-02)

- Rationale:
  - RMS is the best mouth-openness driver measured at zero lag (`avatar-lipsync-bench-2026-10-02`). Classifiers win only on closure, and they add vowel chatter.
  - Remote audio replayed through WebAudio leaves Chromium's AEC reference path.
  - `output_audio_buffer.*` is undocumented and leads the audible sound by 60–400 ms [U].
  - The dead ends are in `avatar-lipsync-dead-ends`.
- Reverse if:
  - the v1.5 causal student beats this on the bench (hi r ≥ 0.65, PP recall ≥ 70%, vowel false-close ≤ 12%) and wins a blind A/B at ≥ 65%;
  - E-P8 shows the per-route offset cannot be brought inside the bar by delaying the face alone.
- Source: AVATAR.md §3; `web-3d-talking-heads.md` §5–6 + review; `audio-to-face-ml.md` G-2/G-3/G-8.

## avatar-behaviour-controller
**A client behaviour controller owns gaze, blinks, brows, head and lean; TalkingHead keeps lips, breathing, pose and rendering, with its random liveliness removed.**
- **Floor state machine.** States are idle, speaking, yielding, your_turn, listening and thinking, plus a barge transient.
  - Local signals drive the transitions: her tap VAD; the child's push-to-talk press or release and the echo-gated mic tap; module events.
  - Link events are hints only.
- **Gaze and head.**
  - Gaze distributions follow Andrist 2014 and Ho 2015.
  - Cognitive aversion starts 0.3 s after the child's local end of speech, and it is head-led on small tiles.
  - Eye-in-head is clamped to ±25°, with the head carrying up to 20°.
  - Nods use 4 ms substeps with a peak-normalised impulse.
- **Blinks.** Intervals are gamma-distributed. An event blink advances a scheduled blink rather than adding one, and a state change time-warps the pending interval. Listening blinks last at most 250 ms.
- **When the face may react.**
  - Continuer nods happen only in open turns.
  - THINKING is verdict-neutral: every expression is released within 300 ms.
  - Valence for the current answer comes from the engine's `answer.correct`, `goal_met`, or a praise lexicon on her own transcript. The Director's `ui.affect`, `ui.cues` and move are armed for the next audible onset.
- **Limits on expression.**
  - At most one big expression per 30 s, and at most one proud face per 5 turns.
  - Band scale is 1.0 / 0.9 / 0.7 / 0.55 (B1 to B4), applied to amplitudes only.
  - Never: head shakes, a sad face, mimicry, or emotion recognition.
- **CI gate.** `behaviour-proto/sim.mjs` grows into `tests/avatar-behaviour.mjs` with invariants I1–I14 plus a mutation check. (2026-10-02)

- Rationale:
  - TalkingHead's coin-flip gaze and its per-frame random morph jitter are uncontingent motion [V].
  - In the 40-lesson simulation (n = 421,161 frames, Node 22 on a 2.1 GHz Xeon), all invariants held and 6 of 6 mutations were caught. `update()` cost p99 8.4 µs.
  - The simulation found two bugs that would have shipped: redrawing blink timers on state changes, and adding event blinks on top of the schedule.
  - The review found five defects, each now with a fix: a crash, nods 4× too small, a smile snap, unclamped gaze, and a drifting clock.
- Reverse if:
  - E-B1 shows TalkingHead's defaults rate equal or better on "real teacher" and "weird";
  - E-B2 shows nods do not raise "she thought I was right" on wrong answers (then nods may extend to closed turns);
  - the Director moves onto the critical path with less than about 300 ms added (then it may own current-answer valence).
- Source: AVATAR.md §4; `behaviour-expressiveness.md` + GR-1…GR-10.

## avatar-cast-shared-mpfb-s2
**Every tutor is an S2 "feature-animation stylised" character: real adult proportions, eyes ×1.15–1.2 with stylised eye materials, painted albedo with AO and cavity only, Lambert or matcap shading, a solid hair shell plus alpha-test fringe cards.**
- **Topology.** All tutors share one MPFB (CC0) base topology. Each character is a sculpted identity delta.
- **Expression keys.** Every ARKit key is baked through the identity (`identity(neutral + δk)`), and the basis is baked to `identity(neutral)`. Eyeballs are scaled rigidly, never warped.
- **Export.** 52 ARKit morphs, position-only, on a morphed head split from an unmorphed torso; subdivision baking off; split normals cleared; all-zero targets dropped; visemes kept only as authoring targets for `lipMatrix`.
- **Launch identities.** `asha` (24 F, MST 6, offer classes 1–6), `arjun` (26 M, MST 7, 1–8), `nandini` (36 F, MST 8, 4–9), and `senior-m` (42 M, MST 5, 5–9; needs a new name and clearance). This gives 0 of 9 classes failing the roster lint.
- **Cast size** is bounded by voices that pass the blind ear test. If only two pass, ship `asha` + `arjun` with offer ranges widened to 1–9.
- **Gates.** G1–G12 run on the decoded, quantised GLB: lid seal by render, lip seal on the shipped PP mix, gaze ≤ 4 s, and rendered-skin L* inside the MST band.
- **Concept art** comes from the Azure image model only. Image-to-3D (TRELLIS.2, Hunyuan) and third-party services are excluded from shipped assets. (2026-10-02)

- Rationale:
  - Children older than about 9 find human-like minds creepy (Brink 2019), and a face-voice realism mismatch is eerie (Mitchell 2011). With an exactly-human voice, the face has to sit between the two risks.
  - The measured dead ends are in `avatar-asset-dead-ends`. MPFB runs headless in 1.3 s with a 4,048-vertex head [M].
- Reverse if:
  - M-AV-1, run on voiced tier-B captures with kids' panels split ≤ 9 / ≥ 10, shows S1 or S3 beating S2 for a band; then that band uses the warp-derived arm;
  - MPFB's face units cannot reach S2 mouth quality after correctives on character 1 (then commission per-character topology with lid and lip loops);
  - M-AV-2 voice-face pairing falls below 70%.
- Source: AVATAR.md §5; `character-creation.md` + R-0…R-10; `tutor-selection-ux.md` §6.5.

## avatar-tutor-selection
**The child picks the tutor at onboarding C1b, after picking their own avatar, in every band.**
- **Choice set.** 2 options for B1, 2–3 for B2, 2–4 for B3–B4. Eligibility follows the child's class, never their content level or device tier. Order is shuffled from a stable per-child seed, with no pre-highlighted default. "Pick for me" draws at random.
- **Previews.** One muxed MP4 per language: 512² H.264 Main, IDR per tutor segment, loaded as a Blob URL. It is rendered by the tier-B runtime with the live lip driver, in the realtime voice, loudness-matched to the live output.
- **First words.** The chosen tutor's first words play on a warmed 3D head, never over a still portrait.
- **Memory** is scoped to the child↔Taxila relationship: `scope='taxila'` plus `voiced_by`. A switch changes zero memory rows; only the address term and the first-meeting flag are per (child, character) pair.
- **Switching** happens only between lessons (409 during a live session) and only from Home. It is never offered by a tutor, and the child is never asked why.
- **Parents** get a per-child allow-list and a switch policy (free / ask / locked; B1 defaults to ask), with no reason field.
- **Never:** tutors gated by payment, rewards or streaks.
- This amends `ds-band-fork-older`'s "two teacher characters" clause and PRODUCT-DESIGN's "parent picks at P6" for B1–B2. (2026-10-02)

- Rationale:
  - Choice effects are strongest in children with 2–4 options (Patall 2008 [V]).
  - The picker-bias simulation (n = 4,000 per arm, seed 7; primacy ×1.6 and stickiness 0.3 are assumptions) gave 54/15/15/16% shares with a fixed order and default, against ≈ 25% each when shuffled with no default.
  - A per-character memory scope would silently empty the notebook on every switch.
  - The realtime API forbids changing voice after the first audio [V].
- Reverse if:
  - M-SEL-1 shows a default first lesson followed by an offer beats picking at C1;
  - M-SEL-2 or M-SEL-3 move the choice counts;
  - M-SEL-4 shows cross-tutor callbacks raise "kaise pata" or surprise by more than 5 pp, and the notebook disclosure does not fix it;
  - M-SEL-11 "same teacher?" falls below 85% (then the previews are overselling the live face).
- Source: AVATAR.md §7; `tutor-selection-ux.md` + G-0…G-8.

## avatar-v2-prerender-first
**v2a comes first: narration that is identical for every student is pre-rendered once as video.**
- **Renderer.** MuseTalk 1.5 (MIT code and weights) on Spot A100 in Central India, about $198 per character for a 30,000-minute library, plus about $0.12 per student-month to stream. The base clips come from a filmed consenting actor, a self-hosted OSS image-to-video model, or a single portrait. Azure Sora 2 rejects input images with faces [V].
- **Playback.** Only while the realtime session is idle and the uplink is disabled. Each clip carries a persistent AI label and C2PA provenance.
- **Live video (v2b)** is a Studio tier gated on all of these:
  - price: a tier of ₹2,999 or more with a per-utterance GPU pool, or moments-only in plans of ₹999 or more;
  - at least 600 subscribers on that tier;
  - an A/B lift over the 3D tutor;
  - added first-audio latency of 250 ms or less at p50 (400 ms at p95), and barge-in to silence in 150 ms or less;
  - bilabial closure on 90% or more of Hindi /p b m/;
  - the audio-floor gate unchanged;
  - GPU quota granted.
- **The renderer owns the audio clock.** Truncation on barge-in uses the client-reported playout position, and a hot-standby audio track keeps the voice alive if the renderer fails.
- **Rejected for lessons:** the Azure TTS avatar ($0.50–0.80 per minute, about $450 per student-month for full lessons, and it does not take our audio). Also rejected: InsightFace-based detectors (LivePortrait, Ditto, LatentSync) and Wav2Lip, all non-commercial. (2026-10-02)

- Rationale:
  - At 20% of revenue, plans from ₹299 to ₹2,999 leave $0.69–6.89 per student-month for the avatar.
  - Live MuseTalk with pinned sessions costs about $0.044 per session-minute: about $10.4 per student-month for hybrid, $1.74 for moments. The full-fleet peak is about $11.6–19k per month per 1,000 hybrid students.
  - Live latency is probably 450–700 ms [U].
  - The A100 has no NVENC.
- Reverse if:
  - the owner lifts the Azure-only constraint for avatars;
  - the Azure avatar is shown to take native gpt-realtime audio and drops below $0.05 per minute;
  - a model of 1B parameters or less reaches 4 or more streams per T4 at the latency bar;
  - an A/B shows video lifts paid conversion enough to fund it.
- Source: AVATAR.md §8; `video-avatar-v2.md` + R1…R6; `video-avatar-v2-cost.py`.


<!-- merged from inbox/market.json -->
## mk-wedge-k4-7-hinglish-tier2
**Decision.** Launch on classes 4-7 (product usable from class 3 through class 8). Use a CBSE/NCERT chapter graph, maths and science, a Hinglish voice teacher, and mid-fee affordable-private-school families (fees Rs500-2,000/month). Run two cells: Lucknow-Kanpur (school-seeded, parent-paid) and Patna (direct to parent). Classes 8-9 are for retention, not acquisition.

**Rationale.**
- Big tech serves 13+ for free, and four of five platforms stay out of under-13 consumer products by policy (bigtech.md).
- PW below class 9 is still human mega-batches (CuriousJr, ~Rs30k/yr).
- BaSE puts maths and science first among EdTech subjects (74% / 57%).
- UP has 32% of India's private unaided schools. Bihar has ~60% tuition incidence and 37% of SAM-1 (market-size.md).
- Low-income Rs400/month group-tuition homes are excluded: Taxila is not cheaper for them, and they buy custody and routine, which Taxila cannot replace (tutor-substitution.md).

**Reversal.**
- If UP school sign rate is below 15% after 60 qualified visits, move the school cell to Rajasthan.
- If Rajasthan B2C conversion comes within 30% of UP's, add Rajasthan B2C.
- If PW ships a K-8 AI tutor at under Rs300/month before the pilot, re-plan the wedge against it (op-pw-k8-ai-tutor-watch).
- Source: docs/research/market/MARKET-THESIS.md §1.3.

## mk-no-sales-no-emi-monthly
**Decision.**
- No outbound sales paid per conversion. No counsellor visits or calls.
- No EMI, NBFC or loan partners. No device bundles. No multi-year prepaid plans.
- Plans are monthly, or annual at 10x monthly with a stated pro-rata refund. Revenue is recognised over the term.
- Cancellation is one tap. A 48 h reminder goes out before the first charge, and the full price is shown when the mandate is set up.
- The diagnostic and the learner model never sell: a diagnostic reaches the parent only with a plan and a free next step.

**Rationale.**
- BYJU'S, WhiteHat Jr and Lido died of selling and financing, not content (failures.md B1-B3).
- Mis-selling, paywalls and refunds are the top parent complaints (india-incumbents.md §3).

**Reversal.** An A/B test shows assisted (non-commission) sales raise 90-day paid retention while refund requests stay at or below 5%, with zero pressure-selling complaints.

## mk-tiers-as-voice-budgets
**Decision.**
- Every paid tier is an absolute monthly budget of two-way voice minutes, split by lane: realtime, cascade, then tap.
- Saathi Rs299: 90 cascade minutes.
- Tutor Rs699: 300 cascade + 30 realtime minutes.
- Ghar Tutor Rs999: 420 cascade + 60 realtime minutes.
- The cost governor degrades realtime to cascade to tap when a budget runs out. The lesson never stops.
- The child never sees a counter; the parent sees usage.
- The free Shuru tier is cache-only (one-way narration). No live model calls, and no ads (DPDP s.9(3)).

**Rationale.**
- Hour-for-hour voice is at best at par with a tutor on any Azure lane (mk-azure-voice-cost-per-hour).
- The price advantage comes from the lane mix: about 30-35% voice, the rest tap with cached narration (pricing-unit-econ.md §3-7).

**Reversal.**
- If the PU-2 A/B shows cascade voice lowers M3 retention by more than 5 points vs realtime, re-price the tiers on realtime minutes.
- If Azure realtime prices fall by more than 3x, revisit the budgets.

## mk-year1-lead-699-999
**Decision.**
- In year 1, lead with Tutor Rs699 for tutor-substituting families and Ghar Tutor Rs999 (+Rs499 per sibling) for families paying a Rs1,500-3,000 tutor.
- Sell Saathi Rs299 at volume only after the grant-funded central catalogue pre-build. Per-lesson personalisation is capped at about $0.02.

**Rationale.**
- At $1.5 per child-month of year-1 Forge content, Rs299's gross margin falls from 55% to 8.5%, and contribution falls from Rs136 to Rs21 per payer-month.
- That makes year-1 LTV about Rs105, so the CAC ceiling is about Rs35, far below any measured channel.
- Rs699 and Rs999 hold 37-44% gross margin in year 1 (pricing-unit-econ.md §4).

**Reversal.** Measured year-1 Forge spend at or below $0.3 per child-month, or Rs299 cohort contribution positive by month 3.

## mk-school-seeded-parent-paid
**Decision.**
- GTM is school-seeded, parent-paid and carried on WhatsApp, which runs structured flows only: the diagnostic, weekly report, billing and referral. It never runs open-ended tutoring.
- Pilot 20 mid-fee APS in Lucknow-Kanpur in Nov 2026-Mar 2027, comparing Offer A (free to the school, parent upgrade) with Offer B (school-paid Lite at Rs600-1,200 per pupil per year).
- Patna D2C cell: CTWA + YouTube to mothers.
- Paid social is capped at 15% of acquisition spend.
- B2G waits for an independent result of at least 0.2 SD. Telco waits for ~100k payers.
- Ad audiences are parents and teachers only.

**Rationale.**
- Discovery is school/teacher 63% and ads 6% (mk-discovery-channels-base2025).
- The WhatsApp general-purpose chatbot ban applies from 2026-01-15.
- DPDP s.9(3) bans child-directed targeted ads from 13 May 2027.

**Reversal.**
- Measured install-to-payer at or above 8% makes paid social a primary channel.
- If Offer B beats Offer A on contribution per school-year by more than 1.5x, lead with B.
- If payers per Offer-A school stay below 7, redirect the school cell.

## mk-warmth-not-intimacy
**Decision.**
- The relational OS gives warmth, memory and continuity, never simulated intimacy: no "I love you", no "I'm real", and regular plain reminders that the teacher is an AI.
- The bond is three-way: teacher, child and parent.
- There are parent-set session caps and no guilt-tripping register.
- The persona is frozen and versioned. Persona-regression evals run before any model upgrade, and parents are told of any change the child would notice.

**Rationale.**
- Ello's published hard lines and SB 243 (global-ai-tutors.md).
- The Character.AI under-18 ban and the Replika Garante order (failures.md P4/P6).
- Childline 1098 / Tele-MANAS 14416 and the never-deny-being-an-AI rule are already product invariants.

**Reversal.** None on intimacy, which is a child-safety floor. The "cadence of AI reminders" may be tuned if a measured study shows a lower cadence does not raise dependency signals.


<!-- merged from inbox/psychology.json -->
## psych-claim-tiers
**Every psychological construct Taxila estimates is assigned, per age band, to one or more tiers: S (population science, published), K (internal teaching knob within bounded ranges, periodically re-randomised) and P (parent: L0 counts, L1 ledger states, L2 gated patterns, L3 term change rows). The never-per-child list is: learning rate, metacognitive efficiency (meta-d'/d'), habit-formation time, a format or teaching-move effect "for your child", personality/temperament, a growth rate over < 12 months, trajectory classes, and cognitive-process change over < 12 months. Parents also never see grade equivalents, trait/type/diagnosis/emotion words, ranks or predictions.** (2026-10-02)
- Rationale: per-child reliability from Taxila-shaped simulations: learning-rate slope .01-.04 below 210 observations (.23 at 100 skills x 10); durability .43 at 40 randomised-lag checks under the scheduler as specified; calibration offset .73-.75 at 30 bets but resolution mostly knowledge (r(dConf, d') = .85); help-need coupling .51 at 200 opportunities; habit-time r .26-.42; per-child format effect needs 78/217/487 delayed comparisons per arm at tau .5/.3/.2; GRR .35 at 6 months monthly. Literature: Fisher 2018 (group-to-individual), Hedge 2018 / Rouder 2023 (reliability paradox), Rahnev 2025 (M-Ratio ICC .42 at 400 trials). Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` §0 RP-D1/RP-D4, §3 catalogue; `docs/research/psychology/PARENT-REPORT.md` §3.
- Reverse if: a construct's own reversal measurement passes (LT1 slope SD with test-retest r >= .6; MS3 reliability at fewer bets; MH3 habit-time split-half >= .7; LAM3 tau >= .5 logit; S-TV1 trait-like signatures), or Paper 1 (`docs/research/psychology/PAPER-OUTLINE.md`) MP-H2/H3/H5 are falsified in deployment.

## decision-records-with-propensities
**Every decision the Director, Conductor, scheduler or a bandit makes that could be randomised writes a `decision_record`: decision id, point type, availability (+ reason), candidate set, propensity of each candidate, the random draw and seed ref, chosen action, policy version, hard constraints applied and a context vector without clock time. It is distinct from the Conductor's 90-day replay `decision_log` and is retained for the study + publication window under research consent. Replay audit must reproduce 100% of chosen actions (LAM1).** (2026-10-02)
- Rationale: Taxila's logs are policy outputs; without propensities neither MRT excursion effects (WCLS), IPW/MSM nor off-policy evaluation is possible (Klasnja 2015; Boruvka 2018; Qian 2022; Hadad 2021). Computed: Thompson sampling with no floor inflated naive type-I error to .111; a .10 floor restores it (.048). Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` §4.3 `DecisionRecord`, §4.7 migration list (`decision_record`, `schedule_record`, `format_trial.propensity`); `docs/research/psychology/learning-analytics-methods.md` LAM-D1.
- Reverse if: never; it is the precondition for every causal claim. Fields may change only if the replay audit still passes.

## psych-parent-claim-gate
**A parent-facing pattern (L2) is rendered only if code finds: an in-deployment reliability card with rho >= .80 at the claim's interval (level claims); distinctiveness P(|child - band default| > delta) >= .90; >= 70% re-appearance of the claim type in a non-overlapping window; for contrasts, a two-groups (spike-and-slab) empirical-Bayes posterior P(claim correct) >= .90 computed per pre-registered menu item (<= 6 candidates per section per month, screened count logged), and randomised allocations with logged propensities for anything with a causal reading. Admitted L2/L3 claims obey a report budget sum(1 - P) <= .2 weekly / .3 monthly, validated on simulated nulls and sparse mixtures before launch. L2/L3 lines are rendered from reviewed templates (Lane A); an Azure first-party model may only order/join segments and write <= 25-word cited episode clauses (Lane B), and every string passes lexicon, semantic, structure, child-read and pronoun predicates.** (2026-10-02)
- Rationale: PR methodologist review R1-R2; computed (`docs/research/psychology/research-program-synthsim.py` §A, 3,000 children/cell): independent Beta(1,1) priors admitted 4.89 claims per null report, all false, while the budget believed 0.21; normal-normal pooling believed 0.17 where 2.22 were false (10% real effects, n = 120/arm); two-groups pooling admitted 7.24 with 0.10 false vs 0.12 believed (30% real). At realistic 12-40 comparisons per arm the two-groups gate finds 0-16% of real effects, so the report is designed fact-first. Spec: `docs/research/psychology/PARENT-REPORT.md` §4, §10.
- Reverse if: PRM5 shows on real held-out delayed checks that a simpler gate is calibrated (stated P matches confirmation rate), or Paper 1 MP-H8 is falsified for the two-groups gate.

## psych-change-rule-term
**A "then -> now" change row needs: a pre-declared direction per row, evaluation once per term, windows matched for information (or an unpooled contrast), a magnitude floor (default .10 on proportions; >= 2*SEM_diff ~ 7 days for D28), posterior >= .95 (>= .975 when more than 4 rows are candidates), a transfer check for SRL rows, and band drift shown as context. Monthly reports show at most 2 change rows and only at a term boundary; term reports at most 4. Cognitive-process change (span, drift) is suppressed under 12 months. Release metric: < 0.1 false rows per child-year on simulated nulls.** (2026-10-02)
- Rationale: MS review P2 (the raw-count route gave 99% of children a false row a year); MH review R7-R8 (D28 block-to-block SD 3.1 days; multiplicity); CD review P1-P2 (change-score reliability .25 at rho .70, r12 .60; shrinkage manufactures 0.5 SD fake change). Computed (`docs/research/psychology/research-program-synthsim.py` §B, 4,000 children): corrected rule 0.107 false rows/yr with 6 rows at P >= .95, 0.071 with 4 rows, 0.050 at P >= .975. Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` RP-D6; `docs/research/psychology/PARENT-REPORT.md` §4.3, S14.
- Reverse if: the false-row audit (PRM12) on real data with shuffled windows exceeds 0.1 per child-year (tighten), or shows < 0.02 with materially higher yield under a looser rule (loosen).

## psych-no-clock-time-features
**No feature derived from clock time of day enters any product model, knob estimator or `DecisionRecord.context`; `IspContext.daypart` is removed. Overnight = local date change AND >= 8 h elapsed. Exceptions: (a) the after-bedtime safety predicate, stored as a boolean against the parent-declared bedtime; (b) a coarse daypart band in a restricted research-consent (P4) extract, used only for population balancing (LOT H5, CD S6); (c) parent-opted n-of-1 alternations analysed as a population study, with any individual line needing a directional rule plus posterior SD < delta_min.** (2026-10-02)
- Rationale: shared phones confound clock time with who holds the phone and why (LOT invariant 4, MHI3); phase delay is keyed to pubertal stage, which Taxila must not infer (CD review R8); the PR n-of-1 two-sided rule fired in 19% of null families (PR review R7). Resolves the CD S6 / TV daypart vs LOT/MH conflict. Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` RP-D8, §12 row 2.
- Reverse if: never for product models; the research extract's daypart band is dropped if the IEC objects.

## psych-umbrella-ald-study
**The flagship study ("How Indian children learn with an AI tutor") is an 18-month accelerated longitudinal design: classes 1-9 enrol at once (N ~ 4,000 research-consented, stratified by class x medium x region, Hindi-medium and government-school oversampled) plus a 600-child delayed-start efficacy sub-cohort in partner schools/waitlists. Measurement gates G0 instrumentation, G1 invariance, G1b dimensionality, G2 reliability, G3 external validity (r >= .60), G4 ASR, G5 simulation calibration pass before the hypotheses they protect. Ability is on a vertically linked logit scale with continuation-ratio scoring of hint outcomes (never grade equivalents); schooling is identified only by a fuzzy RD at the school-entry cutoff with calendar-period terms; exposure is descriptive. Confirmatory family PH1-PH8 (Holm): efficacy, learning-rate heterogeneity, forgetting by age equated by design, probe delivery (MRT), expertise reversal (MRT), per-child format personalisation equivalence (TOST +/-0.10 SD, ~2,570 children), competence -> self-initiated sessions (ages 10-15), context-consistent repetition. Sealed 70% holdout declared partial; Registered Reports for paper 1, PH1, PH4, PH6.** (2026-10-02)
- Rationale: LAM-D4/D5 and LAM review R1-R4 (GE metric, post-treatment covariates, APC constraint, MRT missing outcomes, H1 three-way reading, H6 n, H7 construct); computed power: MRT 3 pp at N=400 x 30 points = .83 (upper bound), band differences .54; MDES .162 SD for the efficacy sub-cohort; reliability CI +/-.05 at r=.7 needs 403/band. Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` §8; first paper `docs/research/psychology/PAPER-OUTLINE.md`.
- Reverse if: cohort x age non-convergence beyond the pre-set bound (report per-cohort curves only); attrition below 30% active at 12 months (re-plan E-PROFILE); an IEC requires a different design.

## psych-consent-assent-two-tier
**Consent is two-tier: P1 (service) covers production adaptation and never research-only randomisation; P4 (research) covers research arms, extracts and publication. Non-P4 children are excluded from extracts and research-only arms; declining research never changes the service. Assent follows ICMR 2017 Box 6.6: a willingness check at 6; oral, recorded, parent present at 7-11; written and co-signed from 12; re-asked at enrolment, age birthdays and annually; failure to object is not assent. A neutral narrator (never the tutor persona or voice) presents it. Research dissent triggers an assent re-check; task refusal is honoured pedagogically and is not withdrawal. B4 psychological report sections reach parents only on the adolescent's opt-in.** (2026-10-02)
- Rationale: ICMR 2017 (full text read by LAM): routine research on children is a minor increase over minimal risk (full-committee review) and the instructional-comparison exemption needs no linked identifiers; Ondrusek 1998: under-9s' understanding of research is poor; LAM review R7.2 resolved the LAM-D10 inconsistency; the tutor bond is a source of undue influence. Without IEC approval and assent nothing is publishable, so this holds despite compliance being deprioritised. Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` RP-D11, §9.
- Reverse if: the IEC rules otherwise after reviewing the scripts, or LAM8 shows < 80% of children understand they can stop and that data are used for research (redesign the scripts).

## open-durability-operating-point
**(open, owner decision)** The wellbeing invariant (no randomised check below predicted retention .6) and identifiability of per-child durability pull against each other: under the scheduler as specified, durability reliability is .43 at 40 checks and .49 at 80; the widest permitted window gives .52/.67; a durability line needs ~27 weeks per topic type at 4 sessions/week. Options: (a) keep the bound; (b) widest permitted window; (c) add exempt calibration probes (<= 5% of review slots, skills mastered >= 2 weeks, a failed probe triggers immediate review). Recommendation (b)+(c), LT6 to set the floor. Spec: `docs/research/psychology/RESEARCH-PROGRAM.md` §13 item 1.

## launch-focus-classes-4-7
**Owner (2026-10-02): launch focus = classes 4-7** (marketing, pilots, polish, QA depth), per MARKET-THESIS wedge.
Content and product still cover classes 1-9 (`scope-classes-1-9` stands); 4-7 get first priority wherever work is
sequenced. Reverse if pilots show a different band converting/retaining better.

## voice-lane-cascade-default
**Owner (2026-10-02): the default voice lane is the cascade — streaming STT (gpt-4o-transcribe / live-transcribe) →
Director + teacher reply (taxila-fast) → streaming TTS (gpt-4o-mini-tts).** ≈ ₹28/hour vs ₹512/hour for
gpt-realtime-2.1 (MARKET-THESIS §9). Realtime 2.1 becomes a premium, budgeted share of minutes per tier, enforced by
the cost governor. Supersedes `voice-realtime-model` as the DEFAULT (realtime stays available). The same `compile()`
feeds both lanes (one assembler). Bonus: the cascade puts the Director ON the reply path, so the one-turn lag of the
realtime lane disappears in the default lane.
- Reverse if: a blind ear test with children shows cascade latency/voice quality kills the "real teacher" feel and
  the realtime share must rise (cost permitting).

## voice-features-longitudinal
**Owner (2026-10-02): extract features from the child's voice to understand them better over time.** Implemented
on-device (WebAudio, no raw audio stored or uploaded): per-utterance pitch (f0 stats), energy, speaking rate,
pause structure, response onset latency, utterance length, disfluency + self-correction counts (from transcript),
reading fluency (words-correct-per-minute on read-aloud items), pronunciation confidence. Normalised per child
(z-scores against the child's own baseline), stored as features only.
- Uses: (a) in-session tie-breakers that may choose a gentler hint / slower pace / follow-up probe (never mastery
  changes beyond a small cap, per learning-science rule 7); (b) longitudinal trends (fluency growth, response
  confidence, reading WCPM) → learner model + parent report growth lines; (c) research dataset (RESEARCH-PROGRAM).
- Never: emotion labels or categorical affect classification (Azure Code of Conduct + child SER unreliability),
  voiceprints / speaker ID.
- Reverse if: per-child calibration (research E3) shows a feature adds no predictive value → drop it from decisions.

## compliance-deferred-to-launch
**Owner (2026-10-02): skip compliance work now; do everything necessary when launching.** The DPDP s.9 (13 May 2027)
and dark-pattern items flagged by MARKET-THESIS are parked as launch-blockers, not build-blockers. The child-safety
floor stays (product, not compliance).


<!-- merged from inbox/content.json -->
## content-live-tiers
**The live path generates data for tested code, never code: T1 = a hand-built engine whose params are filled by code plus `taxila-fast` at effort `none` (language fields only); T2a = a `scene@1` template chosen by the router on mechanic tags and slot-filled live; T2b = free `scene@1` composition, near-line only (requested >= 45 s ahead, cached, promoted after review); T3 = free HTML/p5/SVG offline only, behind gates V0-V9 and two-key human review. Images, video, songs and free code never run on the live path. The router is deterministic server code; the model never picks its tier, template or renderer.** (2026-10-02)
- Rationale: measured on our Azure deployments, T1 fills in 1.88 s p50 / 2.05 s p90 (10/10 valid) and T2a in 3.08 / 3.35 s, inside the teacher's 2-3 s spoken preamble; free composition takes 12-29 s per call plus 10-13 s per repair and still fails (`content-generation-bench-2026-10-02`, `live-free-generation`). Literature agrees: one-shot generated educational interactives pass 3.5% (69.3% after 10 critique rounds); functional correctness of generated pages 24.4 vs visual 64.3 (IWR-Bench); decoupled IR beats end-to-end 99.8% vs 82.5% (ALGOGEN). Template fit is a judgement no validator makes (flower labelling squeezed into sort-bins 2/2), hence routing by mechanic tag.
- Correctness is engine maths or the shared EXPR@1 solver, never the model; T1 gets zero model repairs, T2 one, T3 up to five keeping the Pareto-best build.
- Reverse if: a live free-form generator passes >= 7/8 lint+solver on the genui bench briefs at p90 <= 3.5 s (then T2b may go live for that model), or the A1/M-TV-1 style RCTs show template modules teach no better than board + voice (then shrink the tier).
- Source: `docs/research/content/CONTENT-ENGINE.md` §1, `genui-reliability.md` §0-§6.

## content-v1-engine-set
**v1 builds 12 hand-built engines for maths and science: number-line, collections, place-value, fractions, multiply-divide, data-graphs, patterns (with number grid), geoboard, measure (with science measure-lab), motion-lab (kinematics + forces + pendulum slice), sky (2D only), water-cycle. They are the primary engine for 229/514 maths+EVS+science topics (44.6%: maths 179/304, science 50/210); with the T2a template + diagram layer, 273/514 (53.1%). The full catalogue is 45 engines (21 maths, 14 science, 10 language/SST) after seven renderer merges.** (2026-10-02)
- Rationale: coverage computed by `docs/research/content/content-engine-coverage.py` over the verified engine maps. Pure greedy by topic count would take geo-construct (17 topics, 10+ days, JSXGraph licence check, C6-9 only) over water-cycle (10 topics), but water-cycle is the only science engine reaching C3/C5 EVS, where science coverage is otherwise near zero; motion-lab ships as a slice because the full engine is really four renderers (XL). balance is the first v1.1 engine despite 4 primary topics because it targets the Class 1 equal-sign misconception.
- The other 241 topics are served by explainer templates, flow/label diagrams, T2a templates or board + voice, each mount logging a gap ticket; v1.1 is ordered by topics gained per day.
- Reverse if: the launch classes are narrowed (e.g. Class 9 first: pull geo-construct presets and algebra-tiles forward, maths C9 is the weakest column at 15/41), or gap-ticket telemetry after 4 weeks shows a non-v1 engine's topics dominate fallback mounts.
- Source: `CONTENT-ENGINE.md` §2.2-§2.3, §9.

## bridge-v2-host-grades
**Every module (engines, scenes, diagrams, explainers) speaks one protocol, bridge v2.1: window `hello`, then `init` with a transferred `MessagePort`; strictly increasing seq; facts of <= 12 primitive keys from the engine manifest vocabulary; 8 KiB per event (64 KiB for init/restore/state blobs); token bucket 20/s burst 40; caps declared in `ready`. The host grades every answer with the engine's pure `grade()`, the verified kit key or the shared EXPR@1 evaluator; a module `claim` counts only for T0/T1 and only when it agrees. The teacher sees observation lines of key=value facts (never sentences, never module or child free text) in three lanes (log, fold every <= 2.5 s, milestone) behind a talk gate (hold while she speaks; >= 4 s apart, <= 3/min).** (2026-10-02)
- Rationale: four incompatible event dialects existed (shipped v1, tech-and-market, maths, science) plus diagram, explainer and chant additions; `classify.js` turned `moduleAnswer.correct` straight into evidence; sentence-shaped prompt text gets recited (html-portfolio 4/5 -> 0), so facts-only lines double as the prompt-injection firewall. Detectors only schedule verifying probes (<= 1 per 3 min) and need >= 2 independent signals before "likely".
- Reverse if: field logs show the facts-only line makes the teacher misreference the module (blind-rated, n >= 30 turns, worse than a template sentence) — then add a fixed-vocabulary renderer, never free text.
- Source: `CONTENT-ENGINE.md` §4-§5, `sandbox-telemetry.md` §4-§5.

## engines-in-sandbox-frame-v1
**In v1 every visual module, first-party T0/T1 engines included, mounts in the sandboxed opaque-origin iframe (`sandbox="allow-scripts"`, strict CSP, RTC* deleted, load-count kill), built as vanilla TS on a shared engine-kit with no React and no zod inside the frame; engine chunks and Devanagari fonts ship as hashed APK assets; raster bases arrive once in `init` as data: URLs. Components that own audio, the mic or the teacher stage (chant-track, pahada audio, the read-along speech window, board@1, pointer overlay, LockPanel, word-chain) are host-side first-party code.** (2026-10-02)
- Rationale: one protocol, one budget, one freeze/teardown path for every tier; generated code must be sandboxed (`forge-sandbox-lanes`), so first-party engines share the path rather than fork it. The diagrams review proposed host React components for T1 to avoid per-frame font, image and mount costs; the songs review showed audio cannot live in a frame with `microphone 'none'`/`media-src 'none'`. The frame shares the WebView main thread anyway (a 1.5 s busy loop froze the host 1.5 s), so isolation buys protocol hygiene, not thread safety; freezes are prevented by budgets.
- Reverse if: V15 on the reference ₹8-10k phone shows engine mount > 1.5 s warm or a Devanagari font fallback inside the frame; then move T0/T1 in-process behind the same bridge API (an in-page MessageChannel adapter), keeping T2/T3 in the frame.
- Source: `CONTENT-ENGINE.md` §0.2 A2, §1.5.

## diagram-router-no-baked-labels
**The renderer for a visual is chosen by its content shape, by a deterministic table: quantities/geometry/phenomena -> T1 engines; process/cycle -> flow@1 (dagre or a polar cycle layout); hierarchy -> concept-map@1; parts -> label-diagram@1 over a library base; equations -> formula@1 (KaTeX, named formulas by id); bespoke exact figures -> offline svg-figure@1 with an assertion manifest; mood/context -> illustration@1 (cached raster). No raster carries text; labels are kit-term overlays at human-verified anchors; no Mermaid, Graphviz or live free SVG in the child frame.** (2026-10-02)
- Rationale: gpt-image-2 spells well and places wrongly (Hindi leaders wrong 5/32, fully-correct Hindi images 1/6, VLM OCR passed a corrupted glyph); free SVG is accurate only when geometry is pinned and still too slow live (sol 12/12 at 8-25 s; luna 10/12 with a 13/19/148 deg triangle); Mermaid is 1.58 MB gz with sanitiser advisories; Graphviz mis-measures Devanagari by >= 70 px.
- Reverse if: n >= 40 labelled images per language reach >= 99% spelling and leader accuracy with zero science errors and two-rater kappa >= 0.8 (relax baked labels, possibly B4 English first); or a model reaches >= 99% on the extended free-SVG set at p95 <= 3 s.
- Source: `CONTENT-ENGINE.md` §6.1-§6.2, `diagrams-images.md` §0-§5.

## explainer-templates-live
**Live narrated animation is `explainer@1`: the model picks one of 8 templates and fills enum/number slots plus one note-shape per beat; code computes every count, coordinate, angle and shadow on a 6x6 anchor grid; a GSAP player (HTML layers on translate3d, one SVG overlay) plays one beat per teacher turn on the audio playback clock, pauses before a predict reveal, and grades the probe against a template-computed key. Pre-rendered explainers are the same DSL plus Azure Speech bookmarks (MP4 only for sharing and the lite tier). Generated video (Sora) is B-roll with no assertions, behind an off-by-default flag; no Remotion, Manim optional offline only.** (2026-10-02)
- Rationale: template arm 8/8 valid at 2.88 s p50 vs free-form 3/8 at 13.6 s and 2/8 at 29.7 s; Sora drew 3+3 apples under "3+4=7" and leaves opening underground, and OpenAI removed Sora from its own API on 2026-09-24; DSL delivery is 0.12 MB/min vs 0.48 MB/min MP4 and stays interactive. Per-template slot sanity rules are a ship blocker (split-share `take: 4` showed 4/4).
- Reverse if: free-form passes >= 7/8 under 5 s; or the per-template micro-RCT (A1) shows no delayed-retrieval gain over a static diagram + voice (that template becomes static); or a first-party Azure video model passes the count/direction/causality probe at >= 9/10.
- Source: `CONTENT-ENGINE.md` §6.3-§6.4, `animation-video.md`.

## chant-not-song-v1
**Verbatim content (पहाड़े, varnamala, barahkhadi, ginti, months, planets, public-domain poems) is taught with a beat-locked chant, not generated songs: one library of about 3,500 lines pre-rendered with deterministic Azure Speech hi-IN Swara, each clip gated by script-agnostic phonkey ASR (gate A) and a human ear (gate B); a host-side Web Audio track synthesises the groove and schedules each clip's p-centre on the beat. The realtime teacher frames the chant and reacts to a facts-only summary; she never holds the beat. Any window in which she is not listening is <= 60 s, with the crisis predicate applied to child audio in v1b. LLM surface: kitId, mode, tempo slow|base|fast, lines, passes, arc preset. Every pahada pass hands over to shuffled retrieval.** (2026-10-02)
- Rationale: no Azure first-party model sings (gpt-4o-mini-tts "sing" showed no measurable singing, n = 18); Swara is deterministic (one reviewed render stays reviewed) and fast (160 ms first byte); a realtime voice drifting 100-300 ms off a beat and leaking into VAD is worse than no beat; the song effect is largely pacing and chunking (Kilgour 2000) and serial recall needs random-access practice; ASR returned non-Devanagari script for 7-9/15 Hindi clips even with language=hi.
- Reverse if: an allowed singing model (open weights on Azure GPU) passes gates A and B at >= 95% on 20 lines (songs become an alternative mode); or M-SONG-5 shows chant does not beat spoken repetition on day-7 shuffled retrieval (drop chant from the default arc); or a measured realtime chant stays within +/-60 ms of a click track over 8 bars.
- Source: `CONTENT-ENGINE.md` §6.5, `songs-rhymes-audio.md`.

## teacher-stage-cue-scheduler
**The teacher stage owns one playback clock (her first played audio frame), one rAF loop and a CueScheduler. The Director emits board ops and pointer cues as data anchored to her next turn (`CueAt` say-strings that are numbers, symbols or kit terms, never sentences; <= 3 board ops, <= 2 point cues per turn). Placement is estimator L (rate until `response.done`, then text-proportional with the exact duration from audio_tokens = 20/s) with a 400 ms pre-roll, held to sentence end; pointers never fire before the previous cue's word + 300 ms and are skipped on no-match. Pointer marks are host-drawn over the module via a validated locate/rects handshake. Phrase captions ship; word-lit karaoke only with exact alignment. sprite2d in a worker is the tier C/D face; rive2d must earn tier B (p95 <= 4 ms).** (2026-10-02)
- Rationale: 16 real realtime turns, 60 anchors: transcript leads playback by 6.5 s median, but L places words at 372 ms median error; 400 ms pre-roll shows the mark at word onset in 86.7% of cues and never > 2.0 s early, inside the only measured harm boundary (-2 s, Porte et al. 2026).
- Reverse if: E-TV-5 or M-TV-1 shows another pre-roll or untimed writes do as well (M-TV-1 bar: >= 0.1 SD delayed recall); or E-TV-2 makes exact live alignment cheap (then word-lit captions may ship when >= 90% of words fall within +/-150 ms on 50 turns).
- Source: `CONTENT-ENGINE.md` §7, `teacher-visual.md` §2-§9.


<!-- merged from inbox/factory.json -->
## forge-live-is-g1-fill
**The game a child plays inside a lesson is a G1 fill: a human-reviewed game core filled, in code, with this child's recent wrong answers as trap levels, numbers at their KT target, their interest skin, pacing and language, gated by trusted kit code in <= 300 ms and requested at lesson start (<= 10 s p95 end to end). Agent-built mechanics (G2) grow the shared library in the background and reach children only after Q0-Q10 plus human review, typically the next day.** (2026-10-02)
- Rationale: measured codex turns (3.3-10.9 s on an 11k prefix) put an agentic build at P50 ~12-15 min, P90 > 20 min, with a 50-70% ship-rate prior and ~3 concurrent builds per 500k-TPM deployment (`forge-azure-capacity-2026-10-02`); the project law requires human review before generated code reaches a child (tech-and-market section 3.6; conductor `forge-live-codegen-race`). Personalisation as data is cacheable, validated and cheap (MO sim: core + skin + fill reuse 91.7% at 1k children).
- The owner's intent is stated honestly to the owner (`open-forge-owner-decisions` E2): the teacher never claims a game was built just for the child unless it was.
- Reverse if: QA-M2 hard-gate recall >= 0.95 with 0 false alarms, the tamper battery rejects 6/6, held-out gap <= 15 pp over 50 builds, 200 reviewed G2 cores show <= 1% post-review defects, G2 P90 including the final gate <= 6 min at >= 3 concurrent builds, AND the owner relaxes the review law.
- Source: `docs/research/factory/FACTORY.md` sections 0.1, 1.1, 2.3, 11.

## forge-builder-provider-neutral
**Forge's builder is `taxila-codex` (gpt-5.3-codex, Responses API, own apply_patch tool, `parallel_tool_calls:false`, `prompt_cache_key` + 24 h retention); the G2 designer, vision critic, Hindi safety classifier and blind solver A are `taxila-brain`; G1 flavour picks and T1/T2a/explainer template fills are `taxila-fast`; blind solver B is codex. All calls go through one `ModelAdapter`; an Anthropic Messages adapter is compiled but throws PolicyDenied unless the owner lifts the Azure-only directive.** (2026-10-02)
- Supersedes `forge-models` (which named Claude Opus the first choice and `taxila-sora` the video lane).
- Rationale: the workflow brief listed `taxila-opus`/`taxila-sonnet` as available; both return 404 DeploymentNotFound today (`claude-deployments-404-2026-10-02`) and CLAUDE.md bars Anthropic-on-Foundry. Codex passed the Phaser 4 familiarity probe 8/8 (GK M-K0, n=8). The bake-off arms are codex medium, codex high and brain-as-builder.
- Reverse if: the owner lifts the directive, the Claude deployment answers, and it beats codex on M-F1 ship rate per dollar on the same 40 briefs.
- Source: `docs/research/factory/FACTORY.md` sections 0.1 E1, 3.7.

## forge-kit-grades-reducer
**Forge games target `tgk@1` = Phaser 4.2.1 (pinned; 3.90 compiled behind one flag) behind `@taxila/game-kit`. Agent code writes only `MechanicV11` (pure `init/reduce/targets/facts` over a frozen JSON model + view-only `mount/render` through a `DrawApi` subset; the agent scene has no InputPlugin or Loader). The kit emits every observation with a value bound to the committing target (or the archetype's `readout`), grades it against kit keys and executable misconception rules, emits all telemetry, and the host re-grades before evidence reaches the learner model. The DOM hit layer is the only discrete-input path. Judged physics is kinematic choreography from a law evaluator.** (2026-10-02)
- Rationale: "a model never grades" applied to agent-written game code (GK K1-K5, LG P7, sandbox-telemetry 4.6); the probe's own failures were silent win-logic bugs (GK M-K0). Only 22% of kit items are blind-verified (`kit-census-2026-10-02`), so v1 archetypes start where KitMath can recompute truth (fractions, integers, place value, money).
- Reverse never for kit-owned grading (it is the law). Reverse the runtime (flip to 3.90) if real-device fps p10 (M-K2b) is >= 15% below v3; the DOM hit layer if it costs > 4 ms/frame on the reference phone.
- Source: `docs/research/factory/FACTORY.md` section 4.

## forge-qa-ladder
**One ladder Q0-Q10 supersedes G0-G7 and V0-V7. Programmatic oracles (state-injection keypoints, independent solver, negative-path grading sweep, KitMath truth, geometry, calibrated perf counters) block; model judges (taxila-brain vision on deduped event frames) are advisory until a criterion reaches precision >= 0.90 / recall >= 0.60 at n >= 30 on the mutant corpus. Bots run in-page via headlessStep (replay, solver, misc, novice, this-child, fuzz split lock/chance, speed, interrupt) plus a programmatic fun floor. Text safety = per-string Content Safety at severity >= 2 + a local Hinglish-normalised blocklist + a taxila-brain classifier for hi/hi-Latn (refusal = unsafe) + curriculum allowances. The seam is an external frozen file injected at test time; 30% of keypoints and all fuzz seeds are held out and never feed repair. The mutant corpus (QA-M2) and tamper battery run before the M-F1 bake-off.** (2026-10-02)
- Rationale: GameGen-Verifier 92.2% vs 58.8% for agent-as-verifier [S]; AgentRewardBench judges <= 70% precision [S]; compile/static pass rates do not predict quality (GameASG-Bench 97.7-99.6% static vs 14.9-55.3% strict) [S]; `content-safety-sole-gate`.
- Reverse if: QA-M2 shows a simpler subset (Q0-Q4 + Q8) reaches the same recall on all mutant classes; Q9 becomes permanently advisory if QA-M3 finds no criterion at precision 0.9.
- Source: `docs/research/factory/FACTORY.md` section 5.

## forge-untrusted-lane-single-use
**LLM-written code executes only in Chromium renderers inside single-use `forge-runner` ACA Job executions in a separate managed environment (`taxila-forge-untrusted`): no identity, no secrets, no queue or storage credential, a dead `--proxy-server`, WebRTC UDP disabled, resolver rules, IMDS blocked, `chromiumSandbox:true` attempted and recorded. The orchestrator (own Container App, min 2, 600 s grace) is the only scheduler: it starts each execution with a burn-once BOOT_TOKEN template override, holds all file state (patches.jsonl) and resumable loop state in Neon, and talks to the runner over an outbound WSS protocol with idempotent call ids and resume. The job queue is a Neon table (SKIP LOCKED leases, single-flight on identity key), not a Storage Queue. Publishing requires the trusted rebuild sha (pinned esbuild in the orchestrator) to equal the runner's and a fresh-lease final gate; the shipped bundle is the gated bundle.** (2026-10-02)
- Part of `forge-sandbox-lanes` (VM per build, folder per student, iframe per play stays). Replaces its KEDA-queue trigger, per-lesson pre-start and shared pool token (SB R2-R4, R7, R8, S1-S5).
- Phase 1 (ACA Sandboxes, egress Deny, trafficInspection Full) is blocked on owner actions (`open-forge-owner-decisions` E4).
- Reverse if: Microsoft documents per-replica VM isolation on Consumption (then the separate env is hygiene, not a wall); keep the fresh lease for held-out tests even after Phase 1.
- Source: `docs/research/factory/FACTORY.md` sections 2.2, 2.4, 2.8, 3.11.

## forge-play-delivery-csp
**Games are served from the public account `taxilaforge` (`forge` container at `blob` access level, never `container`; CORS `*` GET/HEAD; immutable 1-year caching) holding only approved, content-addressed, child-free bytes at `forge/kit/<kitHash>/`, `forge/b/<sha256(dist)>/`, `forge/a/<assetId>`; a new private account `taxilaforgesrc` (`allowBlobPublicAccess=false`) holds runs, candidates, quarantine and learner data. The host fetches each build's assets and transfers them to the frame as buffers over the bridge port (proposed bridge v2.1 `assets` message), so the frame CSP (a meta tag, first in `<head>`) can be network-free: `script-src`/`font-src` path-scoped to the kit and build prefixes, `connect-src blob:`, `img-src blob: data:`, `media-src blob:`; the agent scene has no Phaser Loader. Fallback if transfer is too slow: path-scoped `connect-src`/`img-src` with `imageLoadType: HTMLImageElement`. The kit bootstrap deletes RTC constructors, captures the outbound path, seeds randomness, freezes intrinsics, refuses to boot unframed, and the host kills a frame on its second load. `init` carries no free text; names and memories render in a host overlay. Quarantine is a signed denylist fetched every session.** (2026-10-02)
- Supersedes `forge-infra-azure`'s artifact layout (`forge/<childId?>/<artifactId>/`, one account, CSP `connect-src 'none'` with Phaser's XHR loader, which breaks at boot [V Phaser Config.js]). Workers still run on Azure Container Apps. Constrained by the content decisions `bridge-v2-host-grades` and `engines-in-sandbox-frame-v1` (one protocol and one frame path for every module; tgk@1 is their game profile).
- Reverse if: Front Door + a play-origin Container App ships header CSP and `frame-ancestors` (then move policy to headers, keep the meta tag as defence in depth).
- Source: `docs/research/factory/FACTORY.md` sections 2.2, 4.2, 6.3, 8.2, 9.

## forge-capacity-governor
**Forge admission is decided by token buckets per deployment before dollars: codex TPM (catalogue only; reserve prompt + 8k output per step; plan 3 concurrent builds per 500k-TPM deployment until M-F6), taxila-fast TPM (>= 70% reserved for live fills 16:30-21:30 IST), taxila-brain TPM (judges, designs, live safety share), taxila-image RPM (0 during 17:00-21:30 IST; counts requests). Dollar lines: `child_content` derived from the tier as (tier x (1 - voice share - margin)) / 30 with placeholders soft $0.015 / hard $0.03 per child-day; a library fund (~$150/day at launch) for catalogue builds, greedy by demand/cost with failed builds costed at 1/pass-rate; a daily breaker that never touches live lanes. Single-flight per identity key; 24 h cool-down after a failed build; no in-lesson build race.** (2026-10-02)
- Rationale: `forge-azure-capacity-2026-10-02` (500k TPM limiter appears to count cached tokens; image quota counts requests); MO review R2/R4 (the design's own spend crossed its own 25%-of-tier line).
- Reverse if: codex quota >= 2M TPM or measured tokens per build <= 0.5M (relax admission); image quota >= 30 RPM and VLM-human agreement >= 0.9 on people-free objects (allow an off-peak race lane for objects only).
- Source: `docs/research/factory/FACTORY.md` section 6.5.

## forge-media-lanes
**No pixel-video lane. Time-based media is `explainer@1` (scene@1 timelines + narration segments + beats) with three deterministic renderers: the in-app frame runtime (GSAP core + DrawSVG, bundled), a seek exporter that adds segments to one paused master timeline and only calls `master.seek(t, false)`, and Manim CE fed by a `manim_seg@1` JSON IR compiled by our own generator (no LLM-written Python runs in Phase 0). Live = template fills only (<= 5 s; p50 3.47 s measured); free-form explainers are near-line (>= 45 s ahead). Default in-lesson explainers to cached clip mode in the teacher's voice; performed mode receives goals and must-say terms, never lines. Images are library assets, never live in the peak, never carrying text or numerals. Pin gpt-4o-mini-tts to 2025-12-15 and fail `verify` on any deployment within 30 days of retirement.** (2026-10-02)
- Supersedes the `taxila-sora` lane in `forge-models`; caused by `sora-for-curriculum`.
- Rationale: VA section 0 and review R1/R2/R5/R6/R8 (GSAP seek ignores a child timeline's timeScale and skips callbacks; `from manim import *` exposes `os`; free-form p90 24-41 s).
- Reverse if: a GA first-party Azure video model with a >= 12-month lifecycle passes a 20-clip check (labels/numbers >= 95%, Devanagari correct, object permanence) AND children prefer it (V-7).
- Source: `docs/research/factory/FACTORY.md` section 7.


<!-- merged from inbox/conductor.json -->
## conductor-code-reducer
**The Conductor (the AI that runs a child's whole day) is code: one virtual actor per child, made of a state row (`conductor_state`), a mailbox (`student_event`) and a pure reducer `decide(state, event, ctx) -> {state', commands}`. Language models are called only to *propose* typed objects (an LLM day plan in shadow from M2, letter wording, engine params, scene DSL), and code validates every proposal (validator V1-V14) and may reject it. A code planner always exists and is always computed.** (2026-10-02)
- Rationale: learning-science rule 14 (Kestin: the prompt "could not reliably provide enough structure"); 12-factor agents "own your control flow / stateless reducer"; MAST attributes 41.8% of multi-agent failures to specification and 36.9% to inter-agent misalignment [S]. Agents never call each other: results return as events. The Director owns the minute and the Conductor owns the day; lessons change only at boundaries. Authority order: safety > consent > parent controls > policy caps > cost governor > plan > Director > vibe, enforced as ordered guards. Spec: `docs/research/conductor/CONDUCTOR.md` §1, §3, §4.5. Models are limited to the azure-only-compute list (no Claude, no gpt-5.6-terra).
- Reverse if: an LLM controller running in shadow beats code reducer + code planner on delayed retrieval (DRS-7) and session completion in a pre-registered micro-RCT, with zero invariant violations over 10k simulated student-weeks (CM3).

## conductor-substrate-neon
**The Conductor's substrate is Neon Postgres. Per-child event seq is assigned by `ingest_event()` under a `child_seq` row lock, so read order equals commit order. All outbound work (jobs, wakeups, notifications, day_plan, decision_log) is written in ONE interactive JS transaction with the state CAS, using a per-invocation lease token. Small SQL functions make the cross-writer hand-offs atomic (`ingest_event`, `fire_wakeups`, `complete_job` with attempt fencing and erasure fencing, `create_commitment`). Caps are inserts (`conductor_usage` minute reservation, `notify_slot`, `rate_bucket` headroom). The job queue is home-grown at M0. Four rules came from the second review pass. (1) Global lock order: `child_seq` is the LAST row any multi-table writer locks, so the commit goes `conductor_state` -> `job` -> `wakeup` -> `notification`/`notify_slot` -> `child_seq`; SQLSTATE 40P01 is retried like 40001. (2) There is no `conductor.step` job kind: `child_seq.pending_since` is the dirty set, read without `FOR UPDATE`, and `step()` uses the lease as the mutex. (3) Replay never commits; it gets no write handle (I-R9), and reducer upgrades go through `upgradeState`. (4) `decision_log` stores a brief digest, and the values live once in `brief_snapshot(child_id, digest)`.** (2026-10-02)
- Rationale: a global identity seq skips events that commit late (event-driven.io [V]), and the original ticker, job completion and step hand-offs were dual writes (orchestration R2). With the `pg` Pool at 9-12 ms/query (`db-driver-latency-2026-10-02`), the plpgsql jsonb commit is no longer forced. `complete_job` must ingest `job.done` atomically, which is why the queue is ours. Taking `child_seq` first deadlocks (`conductor-commit-child-seq-first`). No-lost-wake-up correctness rests on the `child_seq` lock plus `has_more`, not on `conductor_state` locking (orch R10 B2). A `step:{child}:{toSeq}` job minted about 20 mostly-skipped jobs per lesson (B4). After retention pruning, a committing replay would re-send letters (B5). Storing the brief on every row grows to about 550 GB/year at 100k children [U] (B8). Verified by `conductor-substrate-pg16-2026-10-02`. Spec: CONDUCTOR.md §2-§3, X29-X31, X34.
- Reverse if: CM9 (claim latency + Neon CU-hours at 1k/10k simulated children) shows pg-boss (MIT; transactional send) is cheaper to run, or the home-grown queue costs more than 1 engineer-day/month; or claims exceed ~500/s sustained, which would warrant a managed queue. The lock order is reversed only by a probe showing a different order with zero deadlocks against every writer in CONDUCTOR.md §3.4.
## conductor-hosting-lanes
**Placement of Conductor work on Azure. `taxila-web` (HTTP-scaled) serves requests plus inline work of <= 10 s: one inline `step()` after each ingest, admission, sync, code planning, T1/T2 Forge, and job-row-backed homework extraction. A new ACA app, `taxila-worker` (min 1 / max 2, no ingress, DIRECT unpooled Neon URL), runs the leader-elected ticker (session advisory lock), the dirty-set step loop, the fast and slow job lanes (polled 1 s while busy, backing off to 5 s when idle; `pg_notify` is a hint only), letter fan-out, TTS voice notes and WhatsApp inbound processing. From M1, a separate ACA app, `taxila-observer` (scaled on live-lesson count, no leader), holds the realtime observer WebSockets. ACA scheduled jobs (cron in UTC) run the canary and the nightly rollups/census, so the detectors outlive the worker. ACA Sandboxes run offline Forge T3 builds (M3). Deploys freeze 18:00-21:30 IST. Nothing runs on Vercel, and there is no Azure OpenAI Batch lane in v1.** (2026-10-02)
- Rationale: ACA sends SIGTERM and then SIGKILL 30 s later on scale-in [V], so `taxila-web` cannot host timers or sockets. Neon's pooler supports neither session advisory locks nor LISTEN/NOTIFY [V], and Neon scales to zero only after 5 idle minutes [V], so the poll's always-on compute is a cost line (CM2). On the worker, a revision roll would drop every observer at once, and job-loop contention skews staleness timestamps (observability V9 B29). Vercel `waitUntil` shares the function timeout [V], and the project is paused (`hosting-azure-container-apps`). This resolves the day-cycle review's "ticker inside taxila-web" in favour of the worker. **Rejected alternative, Azure OpenAI Batch** for weekly reports and night work (orchestration §5.4, parent-loop §2): it needs a separate GlobalBatch/DataZoneBatch deployment, and the supported-model table does not list the gpt-5.6 family. Batch "doesn't expire jobs that take longer", so a send-2 h standard-API fallback double-bills unless the batch is cancelled [V Azure batch docs]. It would save about $0.04/child-month. Revisit above 50k children if gpt-5.6 appears in the Batch table; never put Batch on an overnight critical path. Spec: CONDUCTOR.md §8, X1, X7, X30, X35, X37.
- Reverse if: CPU-heavy work starves the worker's fast lane (then split the slow lane into ACA jobs); a managed durable-execution service on Azure removes the need for our own worker; or CM2 shows the always-on poll costs more than a NOTIFY-from-direct-connection design that has been measured to lose no work.
## voice-lane-budget
**Every planned slot and lesson segment carries a voice lane (`realtime | realtime_mini | cascade | tap`). `realtime` is wanted only for teach, teach-back, transfer and wrap. Retrieval and practice are tap. Homework help is always cascade (luna text -> code leak pre-check -> gpt-4o-mini-tts); the validator rejects realtime homework. A sitting is one call (homework -> lesson -> wrap with the recall folded in). Lanes are granted at lesson start from the tier's monthly voice budget and never change mid-lesson except for an outage. DC4's 20/25/35/45 min are session lengths, not realtime minutes. The idle hang-up that saves realtime minutes fires only on audio that is not the child (VAD commits whose transcript is empty or low-confidence, or 90 s with no child speech after a hand-over). Off-topic child speech gets a redirect shape and never a hang-up.** (2026-10-02)
- Rationale: read literally, the day-cycle plan cost $37-92/child-month on rt-2.1 against ~$3.1 revenue (day-cycle-review-cost.py [I]). The realtime lane cannot be pre-checked for answer leaks; cascade can. One call per sitting cuts session starts ~3x against the 10 RPM cap. A rung change mid-lesson is heard as a different teacher. The first idle rule ("2 turns with no kit-relevant child utterance") would have hung up on children chatting or thinking aloud, which are the rapport moments (orchestration R10 B6). CM10 counts non-child audio and off-topic child speech separately.
- Reverse if: blind-ear tests show children cannot tell cascade from realtime and DRS is equal (then default lower), or realtime prices fall enough that the tier budget covers whole lessons.

## no-vm-per-student
**The owner's "little VM per student" is implemented logically. Each child has: the Conductor actor (state row + mailbox, costs nothing idle), Postgres tables keyed by `child_id` and registered in `WORKSPACE_MAP` (enforced by a schema test), one private Blob prefix (eastus2), and a device replica (Android SQLite / web IndexedDB) that is a cache plus an outbox and never the truth. Isolated compute exists per Forge job (ACA Sandboxes), never per child. No cells, per-child DEK or archive segments in v1.** (2026-10-02)
- Rationale: an always-on container is ~$15-20/child-month [U] and a suspended per-child sandbox adds ~$0.57/child-month plus ~10,400 cores at 1M children, against ~$3.1 revenue. The logical workspace costs ~$0.02-0.04/child-month [V prices, U usage] (student-workspace.md §4). ACA dynamic sessions have no persistent storage [V]. Spec: CONDUCTOR.md §5.
- Reverse if: a feature needs a per-child process alive between events (e.g. a creations studio with long-running builds) and suspended sandbox snapshots priced per child fit the tier.

## safety-parent-notice-settle
**Every safety incident puts the child in `safety_hold`: a warm hold screen with 1098/14416, no "suspended" language, nothing revealed on a shared phone. This holds until the safeguarding protocol owner rules on a severity split (D-SAFE). Letting `high` incidents keep lessons running under monitoring (orchestration R4/R7.4) is a [U] proposal, not a rule, because the Conductor never decides safety. The child-side safety floor (care + Childline 1098 / Tele-MANAS 14416 on the same turn, no secrecy promise) never waits. The parent-side S notice goes through `safetyParentNotice()`: moderation flags -> none. If `familyImplicated` is yes or unknown, or the category is abuse/neglect/violence_at_home -> human safeguarding queue, never auto-sent. Self-harm with an explicit "no family" -> sent when the protocol script closes or 10 min have passed [U, advisor sets]. Dedupe is per incidentId, and the push names nothing (content behind the PIN). At M0, EVERY S notice goes to the human. A delivery ladder runs: WhatsApp + push -> SMS/PSTN -> "parent unreachable" to the human at 30 min. Two named adults, with a 2 h escalation.** (2026-10-02)
- Rationale: perpetrators are often named turns later or never (parent-loop review PA1); the original gate sent immediately and checked suppression only at gate time. A single WhatsApp number backs a "cannot be turned off" promise that no mechanism delivers (PA2). day-cycle's `mayNotify` bypassed the suppression branch for safety (AR-6.1).
- Reverse if: the safeguarding owner logs a severity split (then only the incidents it names lock the app); a safeguarding advisor specifies a different settle window or routing; or PLM14 shows the human queue misses its 2 h acknowledgement target (then staff a rota, never auto-send).

## azure-billed-open-models
**Owner (2026-10-02): open models may be used for any task where they win — DeepSeek, Kimi, gpt-oss, Llama, Mistral,
Grok, Phi, FLUX image models — as long as they are sold *Direct from Azure* on Foundry (Azure-metered, covered by the
startup credits).** Narrows `azure-only-compute`'s "first-party Azure OpenAI only" to "Azure-billed Foundry models";
Marketplace partner models (Anthropic/Claude) stay excluded (`claude-on-foundry-credits`).
- Deployed for the bake-off: taxila-ds41 (DeepSeek-V4.1-Flash), taxila-kimi-code (Kimi-K2.7-Code, 100), taxila-oss120
  (gpt-oss-120b), taxila-grok46 (grok-4.6), taxila-flux2 (FLUX.2-pro, 1 RPM quota), taxila-kontext (FLUX.1-Kontext-pro);
  pre-existing DeepSeek-V4-Flash/Pro, grok-4-1-fast-non-reasoning, Mistral-Large-3 all answer on the same
  `/openai/v1/chat/completions` endpoint + key (smoke test n=1: 0.99-1.90 s).
- Model choice per task is decided by `evals/model-bakeoff.mjs` (diagrams / teacher reply / classification) and recorded
  in `server/models/router` as a routing table with fallbacks — measured, not assumed.
- Reverse if: a model is moved to Marketplace billing, or output quality/safety for children fails on a model.

## language-english-first-bilingual
**Owner (2026-10-02): the core audience is English-medium; English responses, voice and resources must be superior,
and Hindi/Hinglish equally high.** Every quality gate (voice choice, model router, kits, reports) measures BOTH
English and Hindi/Hinglish; the teacher mirrors the child's language. Reverse if pilots show a Hindi-medium majority.

## comprehension-engine-program
**Owner (2026-10-02): "crack" covert understanding detection at research level** — no quiz/MCQ-style checking as the
main signal; evidence comes from conversation (why-after-correct, teach-back, explain-to-a-friend), game behaviour
(Forge telemetry: strategies, error patterns, transfer levels), delayed probes 2-3 topics later and in later sessions,
transfer to new contexts, and voice/vibe features as tie-breakers; fused into an interpretable per-concept belief;
when not understood, re-teach using the representation that this child's own history shows works. Also: the whole
tutor persona (pace, humour, formality, examples, challenge framing) adapts to the child's vibe profile.
Built as `server/comprehension/**` with a simulator-based evaluation before any claim.
