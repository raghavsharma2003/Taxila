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

## language-core-hinglish-english-hindi
**Owner (2026-10-02, refines `language-english-first-bilingual`): Hinglish-speaking students are core too.** The core
audience speaks English, Hindi and Hinglish (code-mixed) — all three must be first-class in voice, text, kits and
reports; the teacher mirrors the child's mix. Regional languages (Marathi, Bengali, Tamil, …) come later: keep
language a parameter end-to-end (no hard-coded en/hi pairs in schemas, prompts or TTS/STT config) so they can be
added without rework. Reverse/extend when the first regional language is scheduled.


<!-- merged from inbox/cascade-fix.json -->
## cascade-lane-spoken-turns
**Lesson mode "cascade" (2026-10-02): a text lane on the server whose child turns are spoken.** The Director writes and stores every reply and the client never gets instructions (answer key stays server-side); child rows keep asr_conf, `typed` only from body.typed, classify's low-ASR gate applies; compiled instructions are the text lane's. LessonRuntime.start(childId, "cascade") builds a text-lane link (CascadeLink via ctx.cascade).
- Reverse if: a server sideband owns session.update for the realtime lane and the lanes are unified on one mode flag.

## cascade-speculative-reply
**While the classifier's model call runs, the turn route starts the reply for its likely outcomes (item: incorrect, no_evidence, correct; none: no_evidence; fan-out TAXILA_SPECULATE, default 3) through the same planTurn() code, and uses one only if its whole reply input key is identical to the real plan's** (instructions, said, history, lastMove, hint level, pendingWhy, lang, age band, spoiled, upcoming item, hold). A speculative reply that fell back (model failed) is a miss. Quality is unchanged by construction (same prompt, same guards); cost is up to 3 extra taxila-fast reply calls per model-classified turn. Measured: Director median 4244 → 2405 ms, 6/7 and 7/8 hits (cascade-latency-2026-10-02).
- Reverse if: real-lesson hit rate < 50% for a week (then the extra calls buy little), or a single structured classify+reply call matches the classifier's labels on the classify eval at ≤ 1.5 s.

## cascade-barge-pause-decide
**Cascade barge-in pauses and lets the transcript decide (2026-10-02).** Local onset (~90 ms voiced) ducks to 0.2; sustained local voice (~120 ms, hands-free only) or server speech_started pauses with the reply kept (stream keeps buffering). Transcript: a real turn stops her (teacher_interrupted whenever she was cut, even while loading); empty, ASR-failed with ≥1 s left, a lone backchannel ("hmm", "haan", one word < 0.5 conf) with ≥1 s left, or her own echo (≥4 words, ≥70% matching her reply by consonant skeleton across Roman/Devanagari) resumes her from the last gap between words. Unconfirmed local pauses resume after 700 ms; 3 of them switch local pausing off for the lesson (echo self-calibration). Push-to-talk press or typing stops her outright.
- Reverse if: the device test (bargeStats on Android Chrome/WebView, phone speaker) shows echo still interrupts her (then default output "element" and/or require local corroboration), or children's real answers are swallowed as echo/backchannel in > 2% of turns.


<!-- merged from inbox/game-stealth.json -->
## game-evidence-into-kt-not-bayesnets
Games feed the existing BKT-R accumulator (LEARNER-MODEL 6.1) via existing classes (probe.predict, item.open, item.mcqK, probe.transfer.*, probe.errorspot, probe.why) with EvidenceEvent.via='game', LR^w_game (w=0.5 launch), first committed act per item only, coincident items no positive update, and display=mastered requiring one non-game or cross-archetype callback event. Process indicators (systematic, inconsistent-with-evidence, under-par, insight) are ComprehensionSignal nominations, not KT evidence. Why: stealth-assessment convergent r ~0.3-0.5 (PP r=.36/.40 n=263; PvZ2 r=.40/.41 n=47), game indicator discrimination set to 0.3 in PvZ2, game-experience bias. Reverse if: G-M2 shows game LRs equal dialogue LRs on delayed probes (raise w), or a per-level Bayes net beats this by >=0.03 AUC; an indicator graduates to evidence when G-M3 shows >=0.65 within-skill AUC. Source: docs/research/comprehension/game-stealth.md

## forge-dumb-policy-gate
Q5-DB: every pack runs non-understanding policies; fail above chance+10pp first-try or chance+5pp on the mastery gate. Why: Save Patch 19% of errors were an 'everything in order' exploit; our sim shows value-rank leaks the key even with shuffled positions. Reverse: thresholds only, if G-M7 shows children never use rank/position strategies.


<!-- merged from inbox/ui-a-shell-parent-fix.json -->
## ds-parent-gate-lock-on-exit
**The Parent corner locks on every exit, and onboarding never leaves it open.** The unlock is per guardian session and the child shares the cookie, so an unlock that outlives the grown-up's visit is an open door (review blocker: P7 setPin stamped a 10-minute unlock and P8 'Abhi' handed the phone straight to the child). Now: P7's PIN set (no password, fresh session) does not stamp an unlock; the Gate locks (keepalive POST /api/parent/lock) on unmount unless the next path is another gated screen, on pagehide and when the tab goes hidden; P8, /who and every child route lock on mount. Reverse if: the Android app gets a device-credential gate (BiometricPrompt) that re-asks per entry, at which point the server unlock can be shortened to per-request. (2026-10-02)

## ds-parent-gate-consent-grade
**Consent-grade account actions need the PIN once one exists.** POST /api/consent, POST /api/children (when the guardian already has a child), PATCH /api/children for name/class/board/medium/language/teacher, DELETE /api/children → requireParentIfPinSet (open before any PIN = first run). The child's own picks (avatar, interests) stay child-writable because the child shell PATCHes them. Client: /start/consent, /start/child, /start/controls sit under GateIfPin. A first PIN set outside the fresh (< 60 min) onboarding session needs the account password, so a child reaching the gate first cannot claim the corner; controls with no PIN follow the same rule. Reverse if: OTP/device-credential auth lands and replaces the PIN as the grown-up proof. (2026-10-02)

## ds-pin-reset-interim-delay
**Forgotten-PIN reset is an INTERIM stand-in for §6.2 until OTP ships.** Password tries (reset, first set outside onboarding, PIN change) are counted insert-then-count in audit (PW_MAX_TRIES=5 per 24 h; of any concurrent burst at most 5 see a count within the limit), checked with async scrypt, plus an 8/min in-process burst limit per session/IP. A correct password records a pending reset (audit `pin_reset_pending`, hash server-only) that takes effect after RESET_DELAY_H=24 h; the gate shows it; an unlock with the current PIN cancels it; a reset never opens the corner. No WhatsApp/email notice yet (audit is the record). Kept in audit, not a new column, so no migration is needed at deploy. Reverse if: OTP to the guardian's phone ships (then: OTP → immediate reset, drop the delay). (2026-10-02)


<!-- merged from inbox/ui-b-child-lesson-fix.json -->
## ui-child-home-from-server
**Decision.** `homeState` on /c/:cid is read from the server on every home render (`src/child/day.ts`: `GET /api/child/plan?childId=` → `{ homeState, plan:{openLesson,window}, capRemaining, packReady }`). Until that endpoint exists, the finish tile writes a per-child marker keyed by the IST plan day carrying the `/api/lesson/end` answer; react-router `location.state` is no longer read. A child request for another lesson calls `POST /api/lesson/request { cid }` and navigates only on `granted` with a `lid`; a refusal (or the endpoint missing: 404) shows the resting shape once and the request is not offered again that day. Both endpoints must be `requireChild(req, childId)`-scoped. Why: review found the done home lived only in navigation state, so Bagiya then the house re-ringed the lesson tile (PD-G-RET1 negative control), and the client granted lessons past the cap. **Reverse** when the plan read lands: drop the marker and read only the server; if the marker is ever seen to disagree with the server on the same day, the server wins.

## ui-child-voice-on-cascade
**Decision.** `LessonScreen` starts voice as `runtime.start(cid, "cascade")`; mic logic keys on a spoken lane, not LessonMode (cascade reports `text`). `UiBridge.createLink` builds a CascadeLink for `ctx.cascade` (never a TextLink), copies its PCM stream into a WAV clip for phir se, mirrors its push-to-talk state (tap by default, set before connect), holds speech during pause, and offers a quiet stop that does not report a child barge-in. Open mic needs an Older child + headset label from enumerateDevices (EchoProbe not built) and is demoted after 2 EchoGuard flags. **Reverse** if on-device runs show headset labels misdetect (open mic on a loudspeaker) — then require the EchoProbe — or if the WAV copy measurably delays first audio.


<!-- merged from inbox/voice.json -->
## voice-teacher-spec
**docs/research/voice/VOICE-TEACHER.md is the build spec for the live voice teacher.** (2026-10-02)
- Assembly order: CHARACTER (450) -> RELATIONSHIP+ATTUNE notes (260, new, quote-free) -> SAFETY FLOOR (520, end of CORE, rewritten quote-free) -> CHILD brief (600 incl. rel snapshot <=120) -> LESSON (800) -> MOVE (200, no speakable labels) -> LANGUAGE (140) -> ONE MORE CHECK + TURN SHAPE last (360). TOKEN_BUDGET 2600 -> 3000; throw, never slice.
- Rationale: position is mechanism (64 -> 25 words [T]); relational notes mid-brief cut violations 20/36 -> 1/36 (short-prompt probe); only two late slots exist and both are spent.
- New compile-time asserts: no brackets, no unresolved slot syntax, no quotes in CORE, no 5-gram overlap with ear-test stimuli, no kinship word in CORE.
- Reverse if: VT-1 (full production prompt, audio-in, 140+ turns) shows mid-CORE relational notes fail (>1/100 turns), or the 3000-token budget adds measurable TTFA over 2600.

## voice-floor-states-hybrid
**Turn-taking by director floor state: CHAT uses server auto-response; ANSWER_EXPECTED, THINKING and SAFETY use create_response:false, the director's think-time window (6 s for 6-9, 8 s for 10-15 [I]) and a client response.create carrying the full compiled instructions.** (2026-10-02)
- Rationale: under auto-response the teacher filled the child's thinking-aloud pause with a hint 2-3/3 (attune probe); children's think time needs a client timer (discourse, ASR, attunement docs); a session.update move is one turn late. Keeps server_vad 0.6/900 ms (600 ms and semantic_vad split pauses [T]).
- Supersedes the auto-response-everywhere part of voice-turn-config; VAD values are unchanged.
- Unverified on Azure: whether the create_response toggle applies before the next commit; whether response-level instructions replace session instructions (the design assumes replace, so the floor is always re-sent).
- Reverse if: VT-2 shows answer-state child-last-word -> first sound > 3 s from India, or real children report waiting too long, or the toggle does not apply (then all states go client-created).

## voice-lane-a-v1-panel-decides
**v1 ships lane A (gpt-realtime-2.1 native: marin for Asha, cedar for Arjun; Uma has no probed voice); Voice Live lanes B (Azure Indian TTS voice) and C (azure-realtime meera/diya) compete in the blind panel.** (2026-10-02)
- Rationale: all pedagogy evidence is on 2.1; Voice Live works on the existing key; Azure TTS lost by ear before [H], so voices are chosen only by a blind panel (95% LB of paired preference > 50% on natural + Indian, inconclusive otherwise).
- Constraints: no Preview (MAI) voice may win for minors; lane C must pass evals/realtime-bakeoff.mjs; the winning lane must pass the never-deny-AI battery; adults first, children in Round 2 with neutral voice labels and guardian consent.
- Reverse if: the panel picks a B/C arm, or an off-Azure reference arm beats every Azure arm (then escalate to the owner, never add a vendor quietly).

## asr-two-lane-evidence
**Lane L = gpt-live-transcribe + per-lesson keywords + script-only prompt (every turn); lane G = Azure Fast hi-IN+en-IN (answer turns). Grade only on agreement; disagreement -> repair move; safety runs on the union. Replace taxila-transcribe (gpt-4o-transcribe) in realtimeSession().** (2026-10-02)
- Rationale: ASR E0 (synthetic): live-transcribe child arm skeleton CER 0.043, answers 14/15, 0 decoys; gpt-4o-transcribe returned text on 5/5 near-silent clips.
- Number items use exact or phoneme-aware matching (the skeleton collides ten/teen/teen=3).
- Reverse if: E1 (80 real children) shows lane L false-correct above 1% overall, or lane G adds latency that breaks the answer-state budget, or the realtime session cannot carry keywords (O1).

## teacher-relstate-alliance
**TeacherRelState per (agent, child): working alliance with stages S0-S3 that unlock autonomy, never intimacy; safety = safe-to-be-wrong from child acts; child-conferred address never self-applied or corrected; rupture ownership decided by the director (verified -> OWN-SLIP, unverified contest -> re-check against the key aloud); offline dependency overlay calibrated per age band.** (2026-10-02)
- Rationale: dependency predicts worse outcomes; the own-it note produced false confessions; RO probe 20/36 -> 1/36 with shape notes.
- Stage gates and the 7 d / 3 warm-session lapse are [I].
- Reverse if: VT-1 shows the relational notes do not hold in the production-length CORE, or the overlay fires for >5% of children after per-band calibration.

## attune-from-words-not-tone
**No safety or teaching decision depends on the S2S model hearing the child's tone; attunement moves (STEP-DOWN, CHOICE, PAUSE-LESSON, SHARE-UPTAKE, WAIT) are driven by words, task evidence and telemetry. The teacher never names the child's feeling; affect is not stored as mood.** (2026-10-02)
- Rationale: attune probe audio-in: 0/18 check-ins on near-tears vs bright deliveries of the same words (synthetic, 3 stimuli, inconclusive); text-in shape notes fixed 6/8 states (n=3, non-blind, possibly lexical).
- Reverse if: consented real-child recordings (n>=10 per cell, blind coders) show the model tells deliveries apart in >=70% of pairs.


<!-- merged from inbox/ws1-client.json -->
## voice-instructions-client-visible
**The compiled instructions carry the answer key (`- key, for checking only: …`, and on the voice lane `key ideas to listen for` and the branch conditions). They now reach the browser only where the browser must apply them: `TurnResponse.instructions` and `LessonStartResponse.instructions` are voice-lane only (optional in `shared/contracts.ts`), and `/api/realtime/token` returns the minted session WITHOUT `instructions` (the ephemeral secret was minted with them, so the model already holds them). Text mode never needed them (the server writes the reply), so it now receives none. On the voice lane a class 6-9 child can still read the key in the network tab before rung 4, and the ephemeral token lets the client send its own `session.update`, so the floor holds there only while the client cooperates.** (2026-10-02)
- Rationale: the voice model answers the child before the Director runs, from the instructions it holds; without the key and the branch conditions its immediate reply to an answer cannot be right, which trades the product's quality (owner directive: never). Moving `session.update` server-side was not landed now because it does not close the leak by itself: every event on the call, including `session.updated` (which echoes the full instructions), is also delivered to the browser's data channel unless the call is opened with `webrtcfilter=on`, and that filter also withholds `response.created`/`response.done`, which `src/lesson/realtime.ts` depends on for turn attribution, interruption and context pruning (docs/research/tech-and-market.md §1.3). A sideband also needs the SDP exchange proxied by the server (for the `Location` call id) and a socket held for the whole call, which belongs to the planned `taxila-worker`, not an HTTP replica (docs/research/conductor/parent-loop.md PA3). Whether closing a sideband socket ends the call is unverified [U].
- Reverse when: `taxila-worker` exists and a probe shows (a) a server sideband `session.update` is applied to a WebRTC call, (b) with `webrtcfilter=on` the client can still attribute turns and prune context (or the server relays the needed events), and (c) the filtered data channel never carries `session.updated`. Then the server owns `session.update` and `instructions` leaves every client-facing response.

## realtime-create-after-cancel
**In `RealtimeProtocol`, a `response.create` sent while a response we cancelled is still active is held until that response's `response.done` (or 1.5 s, if it never comes), and a create the server refuses with `conversation_already_has_active_response` is re-sent after the next `response.done` (same fallback), at most 3 times per request, then surfaced.** (2026-10-02)
- Rationale: cancel-then-create back to back raced the server; the refusal was a non-fatal store error with no retry. On `speakNow: "interrupt"` that create IS the safeguarding hand-off (Childline 1098 / Tele-MANAS 14416), so the predicate fired and the hand-off could go unspoken; typed and chip turns could lose the teacher's reply the same way.
- Covered by unit tests against a fake protocol only (tests/client-runtime.test.mjs); not yet measured against Azure. Reverse if: a live probe shows Azure accepts create immediately after cancel (then the hold only costs latency on the barge-in path), or the 1.5 s fallback is shown to fire before a real cancelled `response.done` on slow links (then lengthen it).


<!-- merged from inbox/comprehension.json -->
## comprehension-facet-belief
**The per-concept belief is five facets over one skill: K = BKT-R pL (unchanged), U = explains/evaluates (why, teach-back, error-spot, predict), T = transfers (near/far), D = FSRS retention + ledger delayed/durable flags (unchanged), M = misconception layer (unchanged). U and T are logit accumulators folded inside ledger.js (L.comp) with the same emissions, grader folding, symmetric retrieval gate, tempering and 1/j weights as K, a tighter session clamp (+/- log 20), prior 0.2 and a capped teach transition (0.10). State ladder: not_yet / shallow / fragile / understood / durable; understood needs display >= mastered, U >= 0.75, T >= 0.6, no misconception >= 0.3 and non-game U and T evidence; never above the ledger display; absence never lowers a state.** (2026-10-02)
- Rationale: a right answer does not show the reasoning behind it (hidden-misconception detectors 4-8 false alarms per hit, papers #3); computed: a K-only rule certified 86.2% of correct-answer-trap children (comprehension-mc-2026-10-02). One fold keeps replay = online and the vibe/affect isolation tests.
- Reverse if: CE-M10 on pilot data shows U and T add < 0.02 AUC over pL for predicting delayed far-transfer success; thresholds move only on CE-M6 pilot calibration under both sim truth families.
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §2.

## comprehension-probe-budget-scheduler
**The Director's probe scheduler is pure code. Mandatory probes (why after a first correct on a new skill, why after a coincident correct, a different-family verifier at misconception p >= 0.7, one follow-up after a partial, 2-4 delayed checks at session open) are budget-exempt but take the lowest-weight shape and cannot be deferred by strain. Optional probes are ranked by expected information gain on the open facet x urgency x novelty x code-grader bonus / test weight, ties by the counter-based draw. Test weights 1.0 / 0.5 / 0.25 by test risk (x0.5 for learning-move probes); caps per 10 child turns 1.5/2.0/2.5/2.5 and per session 20%/20%/25%/25% of child turns (B1-B4); never two probes in a row; <= 2 U probes per concept per session from different families; a facet read high stops being probed, one read low keeps one probe per session.** (2026-10-02)
- Rationale: fusion rule 5 and the repeated-question effect (conversation-probes §1); computed: with 1 U probe per concept-session understood detection fell to 0.067, LLM-only U probes to 0.238, freezing low facets to 0.206, vs 0.407 for the spec (3 sessions, matched-model upper bounds).
- Reverse if: M-PT shows < 5% of children feel tested at double the budget (relax) or > 15% at this budget (tighten); CE-M2 shows a different U-probe cap detects faster at equal CE-M3.
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §3.

## comprehension-weave-cross-topic
**A skill reaching learned_today enters a weave queue (earliest anchor + 20 h, due at FSRS R = 0.9). When the Conductor plans a topic 2-3 topics later that the kit lists as a host, the host item makes the earlier skill a necessary sub-step, graded by code as exactly one event on the earlier skill (item.open, or probe.transfer.near when the host structure is novel). It counts as the ledger's delayed check under the existing isCheck rule. With no host after 5 topics or 2 days past due, it becomes a C31 callback at the next session open; a C34 protege return runs at 3-10 days.** (2026-10-02)
- Rationale: owner request for checks 2-3 topics later; the LearnLM x Eedi RCT outcome was novel problems on later topics [S]; one event per answer per skill avoids double counting K.
- Reverse if: CE-M2 / pilot logs show woven checks miss their window > 30% of the time (then explicit callbacks become primary).
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §3.5.

## comprehension-grading-closed-label
**Every probe is graded by classification against kit data: R-KEY (normalised answer key, EN/HI number words), R-OPT (option -> misconceptionId) and R-CATCH (planted error caught/located/fixed) in code; R-EXP (one expectation per call: present/partial/absent/contradicted), R-MIS (retrieve -> rerank into the kit misconception list, detection only) and R-INST (valid/invalid/irrelevant, checked against verified instances) as closed-label LLM calls. The request carries only the child span and one kit target, never teacher turns or the child's confidence; a positive label needs a quoted span that code finds in the transcript; schema failure or low ASR -> NA; partial never scores. Routing: DeepSeek-V4-Pro primary, gpt-5.6-sol fallback (Azure Direct), one sample, moderate effort; LR stays at the 0.7-diagonal prior until kappa >= 0.7 on 300 human-labelled Indian-child turns per family, EN and Hinglish.** (2026-10-02)
- Rationale: free-form LLM diagnosis F1 < 0.5 [V via papers]; graders degrade on part-right answers and give way to confident students [V]; bake-off C: DeepSeek-V4-Pro 12/12 at 822 ms p50 (n = 12, direction only).
- Reverse if: M-GRADE shows another configuration beats an operator's kappa per language, or an operator's kappa stays < 0.6 (then that family's shapes are tap/choice only).
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §4.

## comprehension-voice-zero-weight
**Voice and vibe features (onset latency, pauses, disfluency, f0 slope, rate; all per-child z) have zero likelihood weight in K, U and T at launch. They may only move an already-eligible probe on the current item one slot earlier (followUpProbe), make the entry hint rung gentler, set wait/endpoint knobs, and break a re-teach tie within 0.05 toward the lighter arm. features.js MASTERY_NUDGE_CAP (0.03) stays as an unused ceiling.** (2026-10-02)
- Rationale: children's disfluency tracks correctness, not confidence [S]; no product or 2025 paper uses child prosody as a comprehension signal (products-live #18); R2h-I needs byte-identical KT under permuted timing features.
- Reverse if: VF-M1 (per-child calibration, research E3) shows a feature adds >= 0.03 AUC on delayed items within skill; it may then enter as one LR <= 1.1 event class.
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §1.3.

## vibe-adapter-compiled-row
**The vibe adapter turns closed inputs (explicit preferences, barge-ins, onset latency, humour uptake, the child's own register and address, accepted challenges, this-session interests, live code-mix, engagement state) into bounded knobs (teacherTurnWords, waitNudgeSec, endpointSilenceMs, humourDose, register, address, exampleDomain, challengeFrame, energy, languageMix, probeSkin). Precedence: safety -> strain -> explicit -> session -> slow knobs (M3) -> band defaults; one step after 2 consistent signals in 10 turns, at most 1 non-explicit step per 10 min. compile() renders it as one key=value VIBE row (cap 60 tokens, drop priority 4) between the lesson and move sections; pace knobs go to session config; re-teach turns force humour off, lower-third turn length and no decorative detail.** (2026-10-02)
- Rationale: style adaptation moves engagement, not learning (RT10; Lubold 2018 p = .6; Gordon 2016 valence only); position is mechanism and sentence-shaped text gets recited (inherited laws).
- Reverse if: a Taxila MRT shows a per-child style arm moving y_delay (then that knob gets a learning reward), or G1/G6 show the row fires better in a different tail position.
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §6.

## reteach-randomise-from-second
**Re-teach selection: RT9 recap when a resolved skill fails a delayed check; exclusions for arms already used, classes failed in the last 2 attempts and representations with pRead < 0.5; prerequisite descent after 2 distinct failed arms, park after 3; the kit primary arm is deterministic for the first re-teach of a confirmed misconception; a TS-PostDiff population bandit (floor 0.2, c = 0.05) chooses only from the second re-teach on; reward 0.3 now + 0.3 next unaided + 0.4 delayed covert; the re-check uses a different probe family.** (2026-10-02)
- Rationale: resolves the open question in reteach-personalisation (PZ review A4 forbids gambling on the first fix; the bandit still needs data); RT1-RT9 evidence.
- Reverse if: the owner wants no randomisation on misconceptions (bandit then learns from generic arms only), or RT-M2 shows arm effects converge (freeze to the best arm at the 0.2 floor).
- Source: `docs/research/comprehension/COMPREHENSION-ENGINE.md` §5.


<!-- merged from inbox/conductor-m0-fix.json -->
## conductor-pause-at-lesson-end
**A `parent.pause` that arrives while the child is in a live lesson is held as `pendingPause` and takes effect when the lesson ends: `lesson.ended`, or the clock's stale-lesson close (no `lesson.ended` for 3 h), both through one helper (`endLessonMode`). If the pause has already ended by then, it lapses. CONDUCTOR.md §3.3 says "at the next day boundary".** (2026-10-02)
- Rationale: a parent who pauses at 16:25 means today. Waiting for the day boundary would let the child start another lesson the same evening, against the parent's intent (pl PA-21 C5). Cutting the live lesson off mid-segment is the Director's job at a segment boundary (dc AR-5 R8), so the Conductor does not do it. The review of conductor-m0 found that the stale-close path used to set `paused` without `pauseUntil`, which locked the child out permanently. That bug is fixed and covered by a test in tests/conductor-decide.test.mjs.
- Reverse if: the parent-loop research or a parent study (n>=10 households) shows parents expect a pause to end the current lesson at once, or expect it to start at the next day. Then `parent.pause` either sends `brief.refresh{end}` or waits for the day boundary.

## conductor-budget-threshold-today
**`budget.threshold` (child scope, pct >= 80) sets `budget.low` and debounces a re-plan of TODAY. The unshown slots move from realtime lanes to cascade (R10). Shown and started slots stay frozen (V10). §3.3 says tomorrow's plan uses the lower lanes.** (2026-10-02)
- Rationale: at 80% of a monthly budget, another realtime lesson that same evening can overrun it. Changing a lane the child has not seen yet costs the child nothing visible, and the child is never told about money. V3 now also compares against the month's remaining realtime seconds (`usage.voiceSecMonth`), and the planner steps down to cascade instead of producing a plan that V3 rejects.
- Reverse if: cascade-vs-realtime quality measurements show that a same-day lane switch inside one learning day is noticeable to children (for example a drop in the vibe close on switch days, n>=30 sessions). Then the switch is deferred to the next day.


<!-- merged from inbox/open-tts-on-azure.json -->
## own-teacher-voice-record-once
Proposed (not yet owner-approved). Record a consented work-for-hire Hindi-English teacher corpus once (~2,000 utterances, 48k/24-bit, multi-style sets) and train (A) Azure Professional Voice hi-IN (HD/multi-style/cross-lingual supported; training $52/compute-h, ~10 h; hosting $4.032/h per model; synthesis $24/M, HD $48/M; Limited Access + recorded consent statement required) and (B) a LoRA fine-tune of Veena/Svara (Apache) on Azure A100 (~$5-40/run). Rationale: Azure route keeps SSML/no GPU ops; OSS route is the hedge with emotion control and owned weights. Self-hosting serving beats DragonHD price only above ~10 sustained concurrent sessions (A100 VM $3.673/h, ~50 sessions/GPU estimate).
- Reverse if: the human blind test shows stock MAI-Voice-2.1 HD / DragonHD already indistinguishable from a real teacher (then no custom voice), or Microsoft declines Limited Access (then Route B only).


<!-- merged from inbox/stt-hinglish-v2.json -->
## stt-default-live-transcribe-kw
2026-10-02. Cascade lane L STT = `taxila-live-transcribe` with per-lesson `keywords` (lesson terms + the item's answer numbers in both scripts) and a speaker+script prompt containing NO vocabulary; client VAD gates/commits; watchdog strips refused fields and retries. Streaming fallback: Azure Speech real-time, continuous LID hi-IN+en-IN. Lane G second opinion: Azure Fast Transcription hi-IN+en-IN; L/G disagreement on the answer value = ungraded + natural repair. gpt-4o(-mini)-transcribe excluded from live and grading lanes. Rationale: docs/research/voice/v2/stt-hinglish.md (best arm on every metric, both TTS families, all noise arms; zero hallucination). Reverse if: E1 real-child accuracy favours another engine, or a rerun with gpt-transcribe / gpt-realtime-whisper-2 / MAI-Transcribe-2 (Central India) beats it.


<!-- merged from inbox/ui-a-shell-parent-fix.json -->
## parent-recheck-from-missed-check
2026-10-02. server/routes/parent.js foldDelayedChecks: a P10 row is a delayed check when the previous non-no_evidence contact with the skill was in a different lesson and >= 20 h earlier (the bkt.js crossesSession rule). One miss after a delayed pass on a learned skill = Pakka + tag; two consecutive = Aa gaya; a pass clears it. Rationale: §6.4.1/R25 and absence invariance (PD-G19, R13): bkt 'due' only means the scheduled time passed. Reverse if the learner fold starts writing an explicit recheck_due / miss counter (then read that instead of re-folding evidence), or if M6 parent testing changes the tag rule. Covered by tests/parent-state.test.mjs.

## reauth-password-for-erasure
2026-10-02. DELETE /api/children and consent core_tutoring:false require body.password via checkAccountPassword(…,'child_erase'|'consent_withdraw'). Reverse when the §6.2/§6.9 OTP exists (replace, do not stack). The PIN-unlock reset of the password window exists because on a shared phone the child and parent share one session, so per-session keying would not help.

## login-slow-limiter
2026-10-02. INTERIM: bounds a guesser to about 100 tries/day rather than 5/24 h, chosen so anyone who knows the email cannot lock the guardian out of login for a day. Reverse when OTP/off-device factor lands, or if audit shows sustained slow guessing.


<!-- merged from inbox/kit-fit-margin.json -->
## kit-fit-margin (2026-10-02)
The load gate `checkFits` (server/compiler/compile.js) simulates voice branches with a stand-in hint; real branches came out up to 1 token longer, so c7-english-ch03-t01-i07 and c9-english-ch08-t01-i04 passed the load gate and failed the real compile (361/360). Gate now admits only items fitting cap-3. Dropped items 102 → 108 of 10,815 (0.998%, the test's 1% ceiling is now nearly hit). **Reverse/revisit:** when the dropped count crosses 1%, shorten the dropped items in their kits rather than raising the cap or the ceiling; or make checkFits compile the real branchesFor() output and drop the margin.


<!-- merged from inbox/learner-upgrade-fix.json -->
## learner-fold-arrival-order
Unsequenced events (an online turn, before the DB assigned seq) fold in arrival order — `foldOrder` is a stable sort by seq with no id tiebreak — and `ledgerStmts` stages kt_evidence inserts in exactly that order (deduplicated), so the seq the DB hands out reproduces the cached fold on replay. Regression: tests/learner-order.test.mjs (ids e9/e10/e100, batches 1/7/13, plus the reported 3-event case, which asserts the id order WOULD diverge). **Reverse if** the DB assigns seq before the fold (insert-then-fold under the lock), which makes arrival order moot.

## learner-delayed-check-session-clock
The 20 h delayed-check delay is measured from one session's start to a later session's start (the ledger reads no intra-session clock: §13.1 isolation, mutant VK6), not between event timestamps as PRODUCT-DESIGN §6.4.1 states; after a 45-minute lesson a check can count ≈19 h after the real anchor. Check classes are item/solo, near transfer and error-spot only: a why/predict/teach-back neither uses the check nor re-anchors; C1/C2 (G=2) re-anchor; an error-spot "caught" is not a check; a recognition item spends the check without counting (options cue the answer). **Reverse if** a held per-event offset (session-relative, quantised to minutes) passes the isolation battery — then anchor at the last held event.

## learner-no-kt-backfill
Migration 005 has no re-fold of legacy `evidence`/`skill_state` into kt_evidence; when the BKT-R ledger is wired every existing child cold-starts and loses learned_today/mastered. Accepted because current children are test accounts. **Reverse (write a one-time backfill through kt/adapter.js with explicit grader) before** the first real family's data exists at wiring time.

## learner-m0-deletes-every-child-table
`server/learner/mode.js` classifies every table with a child_id column: a layer's table (LAYER_TABLES; rel_state = session count under kt), an M0 history table (lesson→turn/module_run/voice_feature, rel_event, voice_*, conductor folds, brief_snapshot, day_plan, the 007 comprehension tables) or KEPT with a reason (consent, audits, incident, workspace, child_seq, parent controls/routine, usage, job, wakeup, notification, notify_slot). `writer.ratchet` plans from information_schema and refuses while a live child table is unclassified; the migration scan in tests/learner-mode.test.mjs fails on an unclassified table. The ratchet takes the child's advisory lock first, and `commit` re-checks legal_mode inside the transaction, so a turn staged as M1 cannot land after a ratchet to M0. lesson.js writes (legacy evidence/skill_state/misconception_state, memory, format_trial, rel_state) all go through writer.js builders with the child row; memory by tier (M1 = wins only; interest/preference need M2+P3; joke/life_event never), format_trial is pz_child (M3), rel_state no longer moves trust. **Reverse** KEPT entries (job, wakeup, notification) if any carries learner content in its payload.

## learner-nm3-legacy-columns
OPEN for the owner: columns predating the learner model that the NM-3 list bans — rel_state.trust and last_trust_update (no longer written), rel_event.note, lesson.parent_note, turn.asr_conf, voice_feature.asr_conf / barge_in, and voice_baseline's per-child prosody statistics. All are deleted on M0; none is dropped (that needs a production migration with sign-off). They are listed in NM3_KNOWN in tests/learner-mode.test.mjs; the scan now covers EVERY migration and fails on anything new. Decide: drop, or move to M3-only tables created under LEARNER_M3_TABLES.

## learner-evidence-id-guard
kt_evidence ids were unique across children and the insert silently dropped a collision the cached fold had counted. The insert is now `on conflict do nothing` plus a 1/0 guard in the same statement: a same-child re-delivery returns one row with seq null (explicit no-op), another child's id aborts the transaction. `commit` asserts one row per write. **Reverse to a (child_id, id) unique key** once the owner signs off on a production migration (then a cross-child id is simply a different event).


<!-- merged from inbox/comprehension-build.json -->
## grade-echo-guard
After the closed-label R-EXP verdict, code checks whether a `present` span is at least 80% made of words from an echo text (the topic title, the question just asked). If so the verdict becomes `partial`, which never scores U (E5) and schedules a follow-up from another family. The echo texts are used by code only and never reach the model, so the request stays blind. Cause: in the LLM-played sim the grader labelled "because we recognise equivalent fractions as the same amount, that's why" as present. Effect: present given U=0 for fluent-shallow personas fell from 0.386 to 0.272 (about 70 turns per arm, one run each, so this is a direction). **Reverse if** M-GRADE human labels show the guard demotes real explanations on > 5% of true-present turns.

## mis-saturation-guard
`fuse.js` removes `misconceptionId` from an event when that misconception is already at p ≥ 0.95 before the event. The event's K evidence stays and family verification is still recorded. This is deterministic from the pre-event state, so replay = online. Cause: `misconception.js` adds log 6.9 per hit with no cap, so after a successful re-teach the ladder stayed `not_yet` (verified mix-up) for whole sessions. **Reverse when** the ledger caps misconception log-evidence per session (INTEGRATION.md §5.2).

## conductor-openers-anchor-due
The opener set for the session-open delayed checks = `ktView.due()` ∪ {display ≥ learned_today, no delayed flag, ≥ 20 h since anchorAt}. Without the second set the sim ran 0 callbacks: FSRS's first interval after a same-day learn is > 1 day, so the ledger's next-session delayed check never happened. **Reverse if** the ledger's `nextReviewAt` itself becomes min(FSRS, anchor + 20 h) for skills without a delayed pass.


<!-- merged from inbox/cascade-latency-2.json -->
## cascade-tts-prewarm
**Cascade `/turn` starts speaking the final, fully guarded reply on the server while the turn's transaction runs; `tts-stream` takes the in-flight sentences (same lesson, seq and session token hash) instead of re-reading the turn.** (2026-10-02)
- Every byte guard has run before anything goes to the speech model, and audio is served only for the stored text, so no unguarded sentence is ever spoken. A failed transaction drops the entry (upstream request aborted); untaken entries die after 30 s; per process, so another replica just misses. The opening line is prewarmed too. `TAXILA_TTS_PREWARM=0` turns it off.
- Measured: TTS stage 343 → 212 ms (n=10 vs 30); in production it also hides the child's phone → server round trip.
- Reverse if: multi-replica routing makes the hit rate low enough that wasted prewarms cost more than they save (count x-tts-prewarmed-ms headers), or a session can be revoked faster than 30 s and that must cut audio.

## speculation-one-clock
**A turn's speculative plans and its real plan are stepped at one `now` (the turn's arrival); low-ASR turns speculate their one decided plan (no_evidence/asr) beside the distress backup.** (2026-10-02)
- A second clock read after the classifier moved the compiled "minute" line across a 6 s boundary and missed 2/8 speculations on that alone. A distress verdict changes the plan, the reply key no longer matches, and the real reply is written as before.
- Reverse if: a plan input must reflect time spent classifying (none does today).

## drift-repair-in-code
**A reply whose only guard failures are drift (it did not pose the item) and possibly flat is repaired in code: the draft up to its first question, then the item's verified question; every guard re-runs, and anything left goes to the model rewrite.** (2026-10-02)
- Evidence: 9/9 measured drift rewrites ended with the kit question verbatim (5 the question alone, 4 acknowledgement + question); the rewrite cost +0.8-3.7 s. Drift was the commonest rewrite cause (9/22). 4 repairs in 40 final-config turns, no model call.
- Reverse if: a quality judge or a child test finds repaired turns read worse than rewritten ones (acknowledgement that does not fit the question), or posesItem changes so drift means something else.

## classify-hedge
**Classifier and distress-backup calls send one duplicate request after 1.5 s for non-reasoning deployments; the first answer wins (`TAXILA_CLASSIFY_HEDGE_MS`, 0 = off; off for the reasoning family).** (2026-10-02)
- grok-4-1-fast-non-reasoning: p50 ~0.6 s, but 2 of ~60 calls hung to the 4 s / 7 s timeouts (an 8.1 s and a 4.1 s Director turn). With the hedge, Director p90 1629 ms (n=20) vs 1872-2424 without.
- Reverse if: duplicates exceed ~10% of classify calls (cost), or the deployment's p90 rises above 1.5 s (raise the delay).

## deploy-classify-grok (proposed)
**Recommend DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning with DEPLOY_REPLY=taxila-fast for the cascade lane.** (2026-10-02, needs adoption: set in the Container App env)
- Latency: total median 2966 ms / p90 3163 (n=20) vs 3275 / 4422 for taxila-fast classify on the same code (n=20). Quality on the real classify(): 75/80 exact vs 72/80, 0 graded-wrong, distress 10/10 (`classify-accuracy-2026-10-02`). It is Direct-from-Azure (Azure-only directive holds). DEPLOY_REPLY stays taxila-fast: ds41 rewrote more and slower; V4-Pro classify was slower (3649 ms).
- Reverse if: a larger multi-topic labelled set shows grok more graded-wrong than taxila-fast, or its distress flag misses a case the predicate does not catch.


<!-- merged from inbox/comprehension-review.json -->
## e6-span-fail-closed
A positive `grader: "llm"` event moves U/T only when `spanOk === true`. Rationale: the INTEGRATION.md call site copied `spanOk` from an optional field, and the old check (`spanOk === false`) let an omitted field certify a verdict that no code had checked. **Reverse if** the closed-label grader is replaced by a code operator for that class.

## grade-audit-span-consent
`auditRow` and `gradeAuditStmt` keep the child's verbatim span only with `keepSpan: true`, which the caller sets from the `transcripts_retention` consent. Otherwise span is null, and label, span_ok, op and target are kept. Rationale: the span is the child's speech, and the old code stored it under M1 whatever the transcript consent. **Reverse if** M-GRADE shows the confusion refit needs spans, and then only under that consent.

## e9-deference-derivation
`deferenceDiscountOn(sess)` is on when the yes-rate on a character's true statements and on its planted statements are both > 0.8, with at least 1 true and 2 planted seen this session [U]. The Director stamps it on the next puppet-shape event, so replay stays exact. Measured effect in the sim is within noise (bkt2 0.640 vs 0.653), and the deferential persona stays at 0.28. **Reverse if** M-DEF shows the discount does not move deferential understanders, or it fires on more than 10% of non-deferential children.


<!-- merged from inbox/spoken-notation-build.json -->
## voice-tts-spoken-render
2026-10-02. **What.** Everything a speech model is given goes through `toSpoken(text, { mode, schoolMedium, ageBand })` (`server/voice/spoken.js`; the conventions are DATA in `server/voice/spoken-lexicon.js`: word tables, units, templates and cells, so a regional language is one more `WORDS` entry plus its `CELLS`).
- **Funnel.** `speakChunk()` (`server/voice/speech.js`) renders every chunk through `ttsInput(text, style)`, so `/api/voice/tts-stream` and the `/turn` prewarm are both covered without touching lesson.js. `styleForChild(child, ageBand?)` now carries the child's cell (`style.spoken`). `/api/tts` renders before `tts()`. The TTS cache is keyed by the RENDERED text.
- **What does not change.** `splitSentences()` still splits the written text, and captions, stored `turn.text`, the answer-leak guard and the safety predicates all see the written text.
- **Safety by predicate.** The floor's `HELPLINES` numbers are matched exactly, before any other rule, and always rendered digit by digit in the mode's digit words (1098 is never "one thousand ninety-eight", even inside a maths sentence). Phone-like numbers (mobile, +91, 1800 toll-free, a number after call/dial) also go digit by digit.
- **Realtime lane.** `compile()` on the voice lane renders the helpline numbers as digit words wherever they appear (floor, safeguard move shape; `voiceSafe`). The appended-last escape and safeguard clauses name Childline WITHOUT the number: the digit words would cost the `last` section ~4 tokens, and `checkFits` keeps reserving the old 5 characters so the kit gate admits exactly the items it admitted before (108 dropped, unchanged). No reading-convention note was added to any prompt: the recitation law and spoken-notation §2.1 forbid one, and the safety string is the §10.4 data exception. The text lane keeps the numerals, because the child reads them on screen.
- **Conventions (spoken-notation §2.3).** Indian place value by default; international (million) only when the number was written with international grouping and is at least 1,000,000. Decimals are read digit by digit after the point. Fractions use upon/बटा, but band 6-9 uses unit words for halves and quarters. Mixed numbers are joined with "and"/और. ₹ is said as rupees and paise. Times-table chant only for band 6-9. School medium "other" resolves to english. Hindi words are written in Devanagari even inside Roman Hinglish text [I: the probe's script choice, not separately measured].
- **Rationale.** `notation-probe-2026-10-02` measured written notation misread by both voices, and `spoken-render-tts-rerun-2026-10-02` confirmed the shipped renderer reaches the hand-authored level.
- **Reverse if** a re-run of the same probe (same items, judge and two ASR passes, plus listeners) shows written text within 2 points of rendered on every class for the shipped TTS voice, AND helplines digit-exact 100% written in every mode. Also revisit any single rule whose class shows a higher error rendered than written (none today). `TAXILA_TTS_SPOKEN=0` is the A/B switch; it turns the helpline guarantee off too.
- **Not covered:** realtime LESSON NOW items (`open-realtime-lesson-now-notation`), parent-card speech (`/api/parent/speak`, which speaks untouched), and adjectival unit number ("500 millilitres bottles").


## model-router-v1 (2026-10-03)
PROPOSED model router v1 (docs/research/models/MODEL-ROUTER.md): live reply gpt-5.6-terra → fallback taxila-ds41; classify/distress/director taxila-fast → fallbacks grok-4-20-nr / taxila-ds41 / oss120; writing taxila-brain → terra; diagram+game code taxila-codex → brain / DeepSeek-V4-Pro; images gpt-image-2 (text) + FLUX.2-pro (text-free art); OCR taxila-brain → grok-4-20-nr; ask owner to deploy gpt-6.1-sol, gpt-6-luna, text-embedding-3-large, Cohere-Embed-V5-Pro, gpt-image-2.5-flare/sunburst, MAI-Image-2.6, Kimi-K3 (after billing check), mistral-ocr-4-0.
The workflow's write-up is the prose merged from inbox/model-router-research.json earlier in this file; this heading ties the graph node to it.


<!-- merged from inbox/deploy-classify-grok.json -->
## deploy-classify-grok (2026-10-03)
Set in scripts/deploy-azure.mjs: DEPLOY_CLASSIFY=grok-4-1-fast-non-reasoning, TAXILA_CLASSIFY_HEDGE_MS=1500; DEPLOY_REPLY stays at its default, taxila-fast. Evidence (cascade-latency-2): end-to-end median 2,966 ms (p90 3,163) vs 3,275 ms (p90 4,422) with taxila-fast for both, n=20 each; classifier labels 75/80 vs 72/80 (taxila-fast) and 74/80 (V4-Pro); distress 10/10 for all three. **Reverse if** classify accuracy on more than one topic (evals/classify-accuracy.mjs) puts grok below taxila-fast, if any distress miss appears, or if grok's hang rate pushes the p90 above taxila-fast's.


<!-- merged from inbox/voice-models.json -->
## voice-choice-v2
2026-10-03. PROPOSED (owner + panel pilot to confirm). Per-character voices, GA only for minors: Asha (1-4) `en-IN-Diya:DragonHDLatestNeural`, Arjun (5-9) `en-IN-Arjun:DragonHDLatestNeural`, Uma (8-9) `en-IN-Meera:DragonHDLatestNeural`; SSML with Devanagari runs in `<lang xml:lang="hi-IN">`, slowed prosody rate (targets ~11 / 13 / 11 chars/s), PCM 24 kHz, styles never sent (no StyleList). Cascade TTS default moves from gpt-4o-mini-tts to this Azure Speech voice; gpt-4o-mini-tts `marin`/`cedar` (named snapshot) is the cross-service fallback. MAI-Voice-2.1 HD Priya (proxy 4.85) and Flash Dhruv (4.65) are benchmarks and switch-on-GA targets. Full recipe: docs/research/voice/v2/VOICE-CHOICE.md.
- Rationale: Diya is the only voice that is GA, in the proxy top tier (4.70: native 5.0, Hindi 5.0, natural 4.2, warmth 4.6, 0/5 leak) and fast per sentence (TTFB 244 ms); $22/M verified, the same $ per lesson text as gpt-4o-mini-tts, whose quality is unmeasured here (1 judged clip, 3.5) and which a 1,900-rater Indian study ranks well below Gemini. Performance first; Preview voices cannot ship to minors.
- Reverse if: the panel pilot or full panel prefers gpt-4o-mini-tts or a lane-A native voice on natural + native (paired LB > 50%); DragonHD ignores prosody rate (then pick by native pace: Meera for all female roles or MAI on GA); MAI-Voice-2.1 goes GA and wins the panel; centralindia lacks the voice and RTT pushes TTFB past MAI-Flash.

## voice-one-identity-across-lanes
2026-10-03. PROPOSED. A teacher character has one voice on every lane. The premium-lane candidate is Voice Live lane B (gpt-realtime-2.1 hears the child and reasons; the character's DragonHD voice speaks), tested against lane A native `marin`/`cedar` in Round 2 of the panel.
- Rationale: lanes are granted per sitting (`voice-lane-budget`), so a child on cascade one day and realtime the next would meet two different people; a rung change is heard as a different teacher. Lane B is also cheaper per minute of teacher speech (~$0.042 vs $0.082) for +82 ms median first audio (858 vs 776 ms, n=5/arm, US container).
- Reverse if: lane B fails `evals/realtime-bakeoff.mjs` or the never-deny-AI battery, or Round 2 shows lane A wins on prosody that follows the child (paired LB > 50%); then accept two timbres and pick the narration voice separately.

## voice-blind-test-v2-protocol
2026-10-03. The v2 voice decision is made by `docs/research/voice/v2/blind-test.html` (internal, 361 entries) / `blind-test-external.html` (357, clone clips removed), built by `make-blind-v2.py` (fresh codes, hard links, sealed `blind-key.json`, per-code gain to -26 LUFS) and scored by `score-blind-v2.py`. Axes native / natural / warmth / Hindi pronunciation (1-5) and real person yes/no, never folded into one score. Each listener does block S (shortlist, 59) plus one of B1-B10. Adults first (parents, teachers, launch states), >= 20 kept listeners and >= 800 judgments; children only in Round 2 on the Azure-only child page after a panel-ethics note. Exclusion: degraded anchor rated natural >= 3.5 or real, or hidden repeats off by > 1.5. A voice wins only with paired LB > 50% on natural AND native; "indistinguishable" only against a human anchor. Best GA Azure arm takes the slot; a winning reference triggers escalation, never a vendor swap.
- Rationale: metric-won/ear-lost has happened twice in this lineage; the AI judge scored real humans below TTS; codes printed in reports must not unblind.
- Reverse if: the pilot shows the -26 LUFS playback gain or the codec gap (ref 64 kbps vs Azure 96 kbps) is audible as a source cue; then re-render the shortlist as PCM, edge-trimmed, 3 takes, into v3 before the full panel.

## voice-escalation-ladder
2026-10-03. If the panel finds no GA Azure stock voice human enough (real-person CI below the human anchor's, or a reference beats every Azure arm with paired LB > 50%): (1) tune and re-panel (rate, lang tags, MAI styles, gpt-4o-mini-tts instructions, Voice Live lexicon, PCM, 3 takes; ~1 week, ~$5); (2) Azure Professional Voice from one consented work-for-hire Hindi-English teacher recording (~2,000 utterances, 3-4 style sets, ~₹1.5-4 lakh [E]; training ~$520/voice, hosting $4.032/h/model, HD synthesis $48/M ≈ ₹73/session-hour; Limited Access + recorded consent: apply now); (3) hedge: LoRA of Veena/Svara on the same recordings, served from a Central India A100 VM ($5.142/h; 2 replicas ~$7.5k/month; cheaper than DragonHD only above ~20-28 sustained sessions), Azure Speech as automatic fallback, weights mirrored to ACR. Check first whether Voxtral TTS is sold Direct on Foundry.
- Rationale: Professional Voice keeps SSML, visemes and the managed API; the open route is the only one with emotion tags and owned weights. Never zero-shot clones, a real child's voice, or Gemini output as training data (API terms); record the Llama 3.2 licence chain (Svara) and Veena artist consent before shipping either.
- Reverse if: a stock Azure voice reaches the human anchor in the panel (stop at rung 1), Microsoft refuses Limited Access (rung 3 becomes the production route), or the A100 pilot misses TTFA <= 0.4 s from India.

## model-router-v2
2026-10-03. Supersedes model-router-v1. FINAL routing table in docs/research/models/MODEL-ROUTER.md §1 (one table, PRIMARY / FALLBACK / evidence / changed-from-draft / upgrade). Live teacher reply `taxila-fast` -> `DeepSeek-V4-Pro` (terra is a candidate only); premium voice `taxila-realtime`; cascade TTS DragonHD per character (proposed, `voice-choice-v2`) -> gpt-4o-mini-tts; STT `taxila-live-transcribe` with lesson-term keywords only -> Azure Speech real-time LID; classification `taxila-fast` -> `grok-4-20-non-reasoning`; distress predicate + `taxila-fast` -> `DeepSeek-V4-Pro` (fix the fail-open filter path first); director `taxila-fast` -> `taxila-oss120`; parent reports `taxila-brain` -> `taxila-fast`; diagram code `taxila-codex` -> `taxila-brain`; game code `taxila-codex` -> `DeepSeek-V4-Pro`; images `taxila-image` (text) / `taxila-flux2` (text-free); OCR `taxila-brain` -> `grok-4-20-non-reasoning`; embeddings `text-embedding-3-small` (weak). Deploy asks: gpt-6-luna, gpt-6-sol, gpt-6.1-sol, DeepSeek-V4-Flash-0731, gpt-4o-mini-tts 2025-12-15, Central India Speech resource, gpt-transcribe, gpt-realtime-whisper-2, text-embedding-3-large, embed-v-4-0, gpt-image-2.5-flare/-sunburst, MAI-Image-2.6, mistral-ocr-4-0; billing confirmations first (Fireworks meter, Azure Kimi Model 6/7, MAI-Voice).
- Rationale: review of v1 found the S ranking a content-filter artifact, terra's lead resting on a same-family judge (+0.50, CI 0.05-1.00, ~10x cost, +220 ms), W tied at the ceiling, and ds41/Kimi-K3 billed only on a partner meter; performance first, cost only among ties, Direct meters only.
- Reverse if: a production-prompt multi-turn T re-run with a neutral judge and the Hindi ear panel shows terra or gpt-6-luna beating fast by a CI excluding 0 at <= 1.2 s TTFT; the owner confirms the Fireworks meter as Direct (ds41 returns as a candidate fallback); harder C/D/W batteries separate the tied models.

## voice-ga-only-for-minors
2026-10-03 (constraint, from `voice-lane-a-v1-panel-decides`). No Preview voice takes a production slot for children. voices/list (eastus2, 2026-10-03): Preview = every `MAI-Voice-2.1` and `MAI-Voice-2.1-Flash` persona and `hi-IN-Diya:DragonLatestNeural`; GA = en-IN DragonHD (Diya, Arjun, Meera, Neerja, Aarti, Lavanya), en-IN Indic Neural, hi-IN standard Neural incl. Swara. DragonHDOmni is unlisted.
- Reverse if: Microsoft moves MAI-Voice-2.1 to GA with an SLA and a published meter.


<!-- merged from inbox/avatar-m0.json -->
## avatar-m0-procedural-head
**AVATAR.md M0 ships a procedural three.js 0.180.0 head (`src/avatar/three/head.ts`), generated in code from the shared cast look (`shared/tutors.js`), instead of TalkingHead b3e277b + the CC0 `mpfb.glb`. The rig is driven only by ARKit-named weights (jawOpen, mouthSmileLeft/Right, eyeBlinkLeft/Right, browInnerUp, …), head [pitch, yaw, roll] and eye gaze, so a factory GLB later replaces `head.ts` and nothing upstream (lip driver, behaviour, compositor, tiers, React wrapper).** (2026-10-03)
- Rationale:
  - The task needs a child-facing tutor selection now, and AVATAR M0 itself says `mpfb.glb` is a realistic MakeHuman that "never reaches children". No other ready GLB is licence-clean (§1.5 denylist).
  - A head generated in code has no licence to clear, no download beyond the JS, and draws the cast's actual looks (Asha ponytail + denim jacket, Arjun curls + round glasses, Uma low side bun + painted pallu) in the S2 direction: slightly large head, eyes ×1.15 with painted iris and a catch-light, Lambert shading, solid hair shell, no cloth simulation.
  - TalkingHead's value (Mixamo skeleton, dynamic bones, breathing, moods) needs a GLB with that skeleton; with a procedural rig it would be dead weight (+36 KB).
- Not met (honest): tier-B budgets are GLB budgets. The procedural head is 19–23k triangles and 16 draw calls (budget ≤ 15k, ≤ 4) [M, renderer.info]. It is not an S2 character and must not be read as one in M-AV-1.
- Reverse when: the factory's S2 `asha` GLB passes G1–G12 (M4) → load it through the same rig contract and vendor TalkingHead only if a measured benefit (E-B1) needs its skeleton features; or earlier if M-AV-1 pilots rate the procedural head "weird" above 15% in any band.

## avatar-m0-tap-chain
**The 3D face's lip tap is one analysis-only `AnalyserNode` (fftSize 2048, smoothing 0) connected to the OUTPUT of the teacher LevelMeter's existing analyser (an AnalyserNode passes its input through), found through a new `LevelMeter.onTap(fn)` that fires on attach (every reconnect), immediately if attached, and with null on detach. No link file changed; the tap's node is never connected onward. The same path serves the cascade PCM lane (PcmStreamPlayer output), the realtime WebRTC lane (VoiceLink's MediaStreamSource) and the text lane (MediaElementSource).** (2026-10-03)
- Rationale: AVATAR §2.2 proposed `LevelMeter.attach(analyser, source)` edits in each link; chaining off the meter's analyser gives the same signal with a 15-line change in `src/lesson/level.ts` and none in VoiceLink, TextLink or CascadeLink (all under active edit by other workstreams). Contract tests 1 (static + runtime spy) and 3 (reconnect re-attaches in one read, old tap disconnected) are in `tests/avatar-face.test.mjs`.
- Reverse when: the phase-2 AudioWorklet `lipTap` (E-P1/E-P2) lands, or an AF check (§10 b-d) shows any difference with the tap attached.

## avatar-m0-lip-normalised
**The M0 jaw is RMS over the last 512 samples, gated at 0.06× and fully open at 0.7× a running voiced-level reference (p90 of voiced-frame RMS over ~10 s), linear, then the benched symmetric one-pole τ = 50 ms, × jawCeiling 0.85. Her onset = 2 voiced frames; her offset = ≥ 250 ms unvoiced. A spectral-tilt "wide / round" shape hint rides on top at shapeGain 0.35, gated by the jaw (unbenched; M1 replaces it with HeadAudio classes).** (2026-10-03)
- Rationale: `avatar-m0-lip-bench-2026-10-03`: at the bench's level the normalised driver is within 0.009 r of the fixed-gain RMS arm (0.537 vs 0.546 hi, 0.673 vs 0.681 en at 30 fps) with fewer vowel false-closures (15.9% vs 17.4% hi), and at −10.5 dB it holds (0.538 / 17.3%) where the fixed-gain arm collapses (0.503 / 72.4% of Hindi vowel frames closed). The received level after Opus/AGC/TTS gain is unknown (GR-9), so normalisation is the safe default. The M1 bar "r(open) within 0.02 of RMS-only" is met.
- Cost: bilabial closures 23/84 vs 27/84 (hi, 30 fps). Closure recall is M1's job (shapes, N-1 clamp), not the jaw's.
- Reverse when: E-3 (received gpt-realtime / cascade audio through a real PeerConnection) ranks the arms differently, or M1's shape classes need a different jaw curve.

## avatar-tutor-offer-sheet-ranges
**`eligibleTutors()` (`shared/tutors.js`, used by server and client) offers a tutor only inside its persona sheet's class range (asha.js 1–4, arjun.js 5–9) and only when that sheet and its voice exist on the server (`CHARACTERS`). Today that is one tutor per class, so the picker is skipped ("Your teacher", no fake one-tile choice) and the class default stands. AVATAR §5.1's widened ranges (asha 1–6, arjun 1–9, uma 7–9) are behind `TAXILA_TUTOR_OFFER=wide`. Uma is in the cast as a `draft`: no `server/compiler/characters/uma.js`, no probed low-register voice, so she is never offered and the server refuses her with 403.** (2026-10-03)
- Rationale: the sheets are band-bound ("an AI teacher character for young Indian children", "classes 5-9"); offering Asha to a class-8 child would compile a 6-9-year-old register for a 13-year-old. AVATAR §5.1 says pedagogy should be the band layer, not the character, but that split has not landed. A character, its voice and its face are one unit (VOICE-TEACHER §6), so a face without a sheet must not be choosable: `teacherFor()` would silently fall back to another character's voice.
- Reverse when: (a) the band layer carries register and the sheets are person-only → set `TAXILA_TUTOR_OFFER=wide` (picker appears for classes 1–6 with Asha + Arjun); (b) `uma.js` lands and her voice passes the ear test → set her status `live` (picker appears for 7–9 with Arjun + Uma). Owner decision VOICE-TEACHER §12.1/§12.3.

## avatar-tutor-choice-store
**The choice is stored on the child: `child.teacher_id` (exists since 001) plus `child.tutor_chosen_at` (migration 008, additive), so a class default never reads as a choice. `POST /api/tutors/choose` is ONE SQL statement (`CHOOSE_SQL`: open-lesson check → `update child … where not exists (live)` → `insert into tutor_switch … from upd`), so the teacher never changes without its log row and the update cannot slip past the live check inside the statement; `tutor_switch.from_id` is always the previous `teacher_id` (class default or parent pick on a first pick; the first row per child IS the first pick). 409 while any lesson for the child is open (`ended_at is null`) with activity in the last 6 h (`LIVE_HOURS`; the client keeps no lesson across a page load, so an older open row is an abandoned tab). 403 for a tutor not offered. No reason column.** (2026-10-03, revised after review)
- **Parent-control policy CHANGE (stated, not silent):** `account.js` PATCH puts every `teacher_id` write behind `requireParentIfPinSet`; this route lets a B2–B4 child pick AND switch with only `requireChild` (AVATAR §7.1 "free" for older bands). In B1 (classes 1–2) a switch needs the Parent-corner unlock once a PIN exists, and a first pick counts as a switch when the current `teacher_id` is not the class default (`effectivelyChosen`: a teacher the parent set at onboarding or via PATCH is treated as chosen).
- **Teacher pinned per lesson:** compile() already reads `state.ctx.teacherId`; `/api/tts` now speaks through `teacherForLesson(child, state.ctx.teacherId)`. Not yet pinned (forbidden files this workstream): `server/routes/voice.js styleForChild(child)` (tts-stream + prewarm) and `server/routes/lesson.js realtimeToken`'s `teacherFor(child).voice`. Until those two read the pin, a switch next to an open lesson idle > 6 h can still change the voice under that lesson's persona.
- Race not closed: a lesson START that read `teacherFor` before the pick and inserts its row after it. With the pin that lesson is consistently the old teacher (persona, face, text-lane voice); the two unpinned voice paths above are the residue.
- Rationale: AVATAR §7.4/§7.5 and tutor-selection-ux §5.3. Memory needs no migration: no memory row is keyed by teacher_id today.
- Measured: `tests/tutor-db-e2e.mjs` on the Neon test branch (ep-winter-tooth), 9/9 on 2026-10-03, including a 61-minute pause → 409 (the old 15-minute window allowed it) and a 7 h idle open row → not live; `tests/avatar-tutor-routes.test.mjs` (7, in `npm test`) covers auth, the one-statement write, the no-row → 409 path and the B1 gate with a stubbed db.
- Not built (open): `parent_tutor_policy` (allow-list + free/ask/locked), the parent approval card, `child_tutor_pair.address_term`.
- Reverse when: the parent policy table lands → replace the B1 rule and the B2–B4 "free" default with the stored policy; or the owner rules that every teacher change needs the parent (then route through `requireParentIfPinSet` for all bands); or voice.js + realtime read the pin → `LIVE_HOURS` can drop back to a short UX-only window.

## avatar-teacher-pinned-bounded
**`teacherFor(child)` (server/compiler/characters/index.js) uses the saved `teacher_id` only when `servesClass(id, class_level)`: the persona sheet's own `classes` (asha 1–4, arjun 5–9), or AVATAR §5.1's wide ranges only while `TAXILA_TUTOR_OFFER=wide`. Otherwise it returns the class default and logs once per child/teacher/class per process; the row is NOT rewritten (a later class or mode can honour the child's pick). `teacherForLesson(child, pinnedId)` returns the lesson's pinned character. The manifest's sheet-mode `offerClasses` are asserted equal to the sheets' `classes`.** (2026-10-03)
- Rationale (review finding): nothing re-validated a saved pick against the class or the offer mode, so (a) under `wide` a class-1 child could get Arjun's 5–9 register, (b) switching `wide` off left every wide-era pick in place, (c) a class change kept an out-of-range register. Computing the bound on every read fixes all three with no `class_change` job and no data migration. Found on the test branch: a child row inserted without a teacher gets the column default `asha`, so a class-8 child created that way was being taught in Asha's 6–9-year-old register; the bound now gives them Arjun.
- Cost: a parent's explicit out-of-range pick (e.g. Arjun for class 3 in sheet mode) is now overridden at lesson start. This was never offered in the picker and is the register floor, not a preference.
- Reverse when: the band layer carries register and sheets become person-only (then bound by `serveClasses`, or drop the bound); or the owner decides a parent may pick across bands (then exempt `source='parent'` picks, which needs the parent pick recorded).

## avatar-m0-tiers-governor
**Stage-1 tiering sends software rasterisers (SwiftShader, llvmpipe, softpipe, Microsoft Basic Render) and pre-2017 mobile GPUs (Mali-4xx/T6-8xx, Adreno 3xx-5xx, PowerVR SGX/GE8100/GE8300) to tier D, GE8320 / Mali-G31/G51/G52 MC1 / Adreno 610-613 to B-lite, everything else to B; `failIfMajorPerformanceCaveat`, two context losses or battery < 15% → D; battery < 10% or the voice-only presentation → E. The governor counts a frame as long past max(50 ms, 1000/cap + 17 ms).** (2026-10-03)
- Rationale: a phone without a GPU path cannot hold B, and a desktop on SwiftShader is the same case; the 2D plate of the same person is the right face there. The fixed 50 ms bar demoted a healthy 20 fps B-lite face within 10 s (`avatar-m0-dead-ends` #3).
- Revised after review (2026-10-03): `?face=` is honoured only when `import.meta.env.DEV` or `VITE_DEV_ROUTES=1` (production builds can no longer force B on a known-bad GPU); the renderer is created with `antialias: false` when the static tier is B-lite (a later runtime demotion keeps its context, so MSAA stays on there); battery is read once via `navigator.getBattery()` at module load (applies to decisions after it resolves) and `TutorFace voiceOnly` (= the child's `prefs.face === "voice"`) feeds the tier-E rule, so neither branch is dead code any more. `Stage3D.dispose()` removes its `webglcontextlost` listener, then `renderer.dispose()` + `renderer.forceContextLoss()`; a disposed stage never reports a loss (`avatar-m0-context-churn-2026-10-03`).
- Reverse when: E-P5 lab data shows a listed GPU holding B at minute 30, or a non-listed one failing it.


<!-- merged from inbox/engines-v1.json -->
## engines-v1-built
**engines-v1 (2026-10-03) ships the twelve CONTENT-ENGINE §2.2 v1 engines and the scene@1 T2 renderer in the sandboxed module frame: `number-line@1` (place / read / jump, rounding with a computed target), `collections@1` (count with tagging / make / compare), `place-value@1` (build with exchanges / read / compare, Indian or international grouping), `fractions@1` (make / compare / equivalent / add, bar or circle), `multiply-divide@1` (array / share / factors), `geoboard@1` v1 slice (area and perimeter by shading squares: build / measure / contrast), `data-graphs@1` core (table, tally, pictograph, bar: build / read), `patterns@1` core (repeat / grow / number grid), `measure@1` maths core (ruler with offset start, jug, thermometer: read / set), `sky@1` 2D (day-night, shadow stick, Moon phases), `motion-lab@1` slice (speed, friction, pendulum), `water-cycle@1` (cycle tracer, heating through the states, groundwater), and `scene@1`. Each engine is a React view over a framework-free `*.logic.ts` (normalize → verdicts), registered in `src/modules/frame/registry.ts` and listed in `shared/engine-catalog.js`.** Engines accept the Director's planning context (topicId, skillId, itemId, lang, representation, fractions, numbers, mode show|predict) so an unadapted mount still builds something sensible. Every control is a tap (drag's WCAG 2.5.7 twin is the only path), targets use the band hit size (64 px for 6-9, 48 px for 10-15) at a 360 px floor, motion is one transform tween skipped under reduced motion, colour never carries state alone, entry is numeric only, labels come in English / Hinglish / Hindi from `init.lang`. Science engines put a POE question first under `predict` and keep the lab locked until the child commits; the prediction is graded by the same model the sim runs.
- Rationale: CONTENT-ENGINE §2.2 / §9 names these twelve (229/514 topics as primary); the frame, protocol and fraction-bars pattern already existed (`src/modules/frame`), so the engines extend it rather than fork it; machine truth must come from params, never a model (`content-live-tiers`).
- Reverse if: the reference-phone V15 measurement (mount ≤ 1.5 s warm) fails for these chunks, or teacher review of the bound items (see `engines-v1-catalog-binding`) finds an engine's action does not match what its item asks.

## engines-v1-catalog-binding
**`shared/engine-catalog.js` is the engine table the Director plans from: `resolveHint(hint)` maps the kits' free-form engineHints (≈230 aliases, only where the engine's mode is the activity the hint names) to `{engine, preset}`; `pickEngine(kit, representation, topicMap)` takes the first hint that resolves (a representation word wins), else the research topic map (`shared/engine-topic-map.json`, regenerated by `scripts/engine-topic-map.mjs`); `planEngine({kit, item, lang, mode, representation, ageBand, topicMap})` returns `{engine, params, goal, bindItem, key, why}`. Item adapters parse the verified prompt (fraction compare / shade / add / fixed-parts equivalent, number-line place / jump / rounding / sequence, place-value compare / build from a number name or pieces, multiply-divide array / share / factors, geoboard area / perimeter of a rectangle, data-graphs pictograph key / tally / two-category difference, patterns next term, ruler length). A plan BINDS the item only when the engine's right answer, derived from the params alone, equals the kit key; the Director then stores `itemId` on the module so its answers grade the item. Everything else mounts unbound (goal_met / stuck still reach the teacher; answers grade nothing). The key never appears in what the frame shows unless the prompt already shows it (tested).**
- Rationale: kit hints are free names (only 1.0% resolved by `engineId(hints[0])`); a module answer is machine truth in `server/routes/lesson.js` whenever `state.module.itemId === state.activeItemId`, so binding must be earned by key agreement, not assumed.
- Reverse if: host re-grading (bridge v2 §4.5) or blind review of bound sessions shows a bound plan graded a child differently from the kit key on ≥ 1% of bound answers, or an engine action that differs from the item's (as quotitive vs partitive did) — unbind that adapter.

## engines-v1-react-in-frame
**engines-v1 renders engines with React inside the frame, amending `engines-in-sandbox-frame-v1` ("vanilla TS on a shared engine-kit with no React and no zod inside the frame"): the frame already shipped React (`bootstrap.tsx`, `fraction-bars@1`, the error boundary). The engine logic is framework-free (`*.logic.ts`, imported by Node tests and the coverage eval), so only the views would port. zod stays out of the frame: scene@1 uses a hand-written structural check.** (2026-10-03)
- Rationale: one view layer in one frame; React is already in the shared chunk the app loads (jsx-runtime 69 kB gz, cached once); measured mount p50 67-90 ms (208-256 ms at 4× CPU throttle) in the dev container.
- Reverse if: V15 on the ₹8-10k reference phone shows a T1 mount > 1.5 s warm or the React chunk is the dominant cost of a cold frame; then port the views to vanilla TS behind the same EngineApi (logic and tests unchanged).

## scene-renderer-validator-ports
**The frame's `scene@1` renderer (engine id `scene@1`, param `scene`, the shape Forge G1 already mounts) evaluates EXPR@1 and lays scenes out with typed ports of the normative validator (`docs/research/content/genui-scene-dsl.mjs` v1.3: parseExpr / evalExpr, measure / layout / positions / textBox), pinned to it by `tests/scene-runtime.test.mjs`. Visuals render in one SVG stage 1000 units wide; controls (choices, buttons, order items, draggables, zones, sliders, steppers, toggles, keypads) are real HTML buttons placed at the validator's own boxes, so hit sizes are the ones it checked. Drag is tap-the-piece, tap-the-place. A probe committed by choice or check is graded by its own `correct` and traps; a probe committed by voice (count-group) lets the scene's goals carry goal_met. Reveal marks the right option or order (found by evaluating the probe) and plays `probe.reveal`.** (2026-10-03)
- Rationale: CONTENT-ENGINE §3.2 says the frame does not re-run the zod validator and the 200k-state solver; a port that disagreed with the validator would grade or draw a passed scene differently on the phone. Forge marks scene fills "gated and cached but not mounted until a frame scene@1 renderer ships (FORGE_SCENE_RENDERER=1)": it now exists.
- Reverse if: scene@1.1 replaces scene@1 on the live path (re-port and re-run the parity test first), or device testing shows HTML-over-SVG controls drift from the SVG at any supported zoom.

## engines-v1-bind-on-child-answer
**(Fixer review, 2026-10-03.) A plan binds a kit item only when the child has to PRODUCE the key inside the engine. Array plans (`multiply-divide@1`) carry `ask: "product"`: the child may build the array, then types how many in all on the NumPad, and only that number is graded (`md.product`); word problems also carry `showExpr: false`, so "6 × 3" is not printed for "Eggs come in trays of 6 … 3 trays". Share plans never bind: dealing "one each" until the button greys out always reaches the fair share. Items that give the pieces and ask for the numeral ("4 tens and 6 ones. Write the number.") mount `place-value@1` read mode with `counts` (pieces per place, ones first, up to 19 each), never "Make this number: 46". Rounding a point that is already a multiple, and number-line jumps that land on an end of the line, stay unbound. Bar-graph difference items bind only when both values sit on a labelled gridline (`gridStep`, now drawn as a value axis).**
- Rationale: the reviewer showed a bound array plan graded "7 × 8" correct from copying the prompt's two numbers (24 bound items across c1-c9), and the c1 parts path printed the key; a binding that does not require the answer feeds false mastery to the learner model.
- Reverse if: a session audit shows children reaching the typed product by counting dots so often that product entry measures counting, not multiplication (then hide the dots for bound plans, as predict mode already does), or a share variant without the deal-all button is measured to separate knowing from tapping.

## engines-v1-unbound-needs-item-values
**An unbound fallback (no adapter matched) merges the item's extracted `numbers` / `fractions` into the params (the values modules.js sent before engines-v1; commas inside Indian/International digit groups are kept as one number) and mounts a maths engine only if its generic normalize consumes them (`CONSUMES` in `shared/engine-catalog.js`: number-line unless preset to jump; collections / place-value / multiply-divide with a whole number; fractions with a fraction; fraction-bars with a fraction ≤ 12 parts, sent as `denominators`; geoboard with a first number ≤ 40 or a contrast preset; patterns grow with ≥ 3 numbers; measure with a number; data-graphs never). Otherwise `planEngine` returns null and nothing mounts. Science sims (sky, motion-lab, water-cycle) mount without values.**
- Rationale: 296 of 1,013 c4-c7 fallback mounts showed demo defaults unrelated to the item (place-value 345, sample A/B/C data, a target-less number line whose Check never enables) — an unrelated activity is worse than the whiteboard.
- Reverse if: teacher review of fallback mounts finds the item-value activities (e.g. "put the marker on 3" for a pattern question) no better than no module; then fallbacks should return null for maths outright.

## engines-v1-module-commands
**`moduleCommands(cur, plan, moduleId)` turns a plan into frame commands and the next `s.module` record. set_param is used only when the engine, its `mode`, its param key set, the goal and the bound itemId are all unchanged; anything else unmounts and remounts (the frame merges set_param into its params and cannot change `init.goal`, so a previous item's target / question / jumps would otherwise sit beside a new bound itemId). `params.itemId`, `plan.itemId` and `plan.goal` (`item:<id>`) exist only on bound plans. The Director's predict intent travels as `params.predict: true` (every engine's `hideAnswer` reads it; the engine's own `mode` is kept) and `plan.predict` → `awaitingReveal`.**
- Rationale: the reviewer traced the current reuse path (`Object.assign(cur, { itemId: params.itemId })`) letting an unbound plan set a bound itemId, mixed params from two items, and adapted plans overwriting `mode: "predict"` so reveal was never sent.
- Reverse if: the frame gains a set_params-with-goal command (bridge v2), at which point same-engine reuse can carry a new goal without a remount.


<!-- merged from inbox/forge-g1.json -->
## forge-g1-live-t1-t2a
**Forge G1 (2026-10-03) ships before any library core: `server/forge/` fills a kit item as a T1 engine (fraction-bars@1 params) or a T2a scene@1 template (`choice-card@1` from a diagnostic or a two-way contrast item, `sequence-steps@1` from a lettered order item or a 3-6 word English answer sentence). Every truth-bearing field (operands, target, options, the correct id, step order, traps with kit misconception ids) is derived by code from the verified kit; personalisation is the child's skin (closed InterestId from their interests ∩ the kit's interestContexts), band, language, and prefetch order (recent wrong items first, then diagnostics of active misconceptions). The Director calls `requestFill({lessonId, childId, item, move})`; a gap is a normal answer.** Scene fills are gated and cached but NOT mounted until the frame has a scene@1 renderer (`FORGE_SCENE_RENDERER=1`); today only maths fraction items mount (30/2289 c4-c7 maths items + diagnostics).
- Rationale: FACTORY §2.3a's live path is a G1 fill of a reviewed tgk@1 core, and no core, kit or archetype exists yet; `content-live-tiers` says the live path is data for tested code, routed by deterministic server code. T1/T2a are the tested code we have.
- Reverse if: the first reviewed `numberline-jump` core (MP4) passes MP5 — then G1 fills it first and T1/T2a become its fallbacks (the planner already ranks by renderer availability); or blind-rated fills show the interest skin adds nothing over the generic skin (drop the flavour call).

## forge-g1-flavour-enums
**One `taxila-fast` call per cold fill (effort none, strict json_schema, retries 0, ≤ 3.5 s): skin, title-row id and decor sprite, each an enum of pre-cleared rows. The gate runs first on the deterministic code pick; only a viable activity gets the model call; a model pick that fails the gate ships the code pick. The call is made only when the caller's budget leaves ≥ 500 ms after a 1.5 s reserve: at the turn path's needByMs 2000 it is never made (`flavour.error = "no_time"`), the code pick ships, and a background full-budget pick replaces it in the cache for the next request (a model pick may replace a code pick; nothing else overwrites).** Measured (prefetch configuration, needByMs 10 000) n=30: model p50 1040 / p95 1360 ms, 29/29 picks passed the gate. Turn path: 0/69 request-path model calls; 23/23 cold code picks upgraded in the background.
- Rationale: FACTORY §1.1 G1 "optional ≤ 3 s taxila-fast flavour pick inside enums" + §5.1 Q8 for G1 "strings-table ids only"; t1-effort-none. Free text from a model never reaches a child on the live path. The upgrade exists because the fill key excludes the flavour: without it the first (code) pick written by a turn would have been permanent.
- Reverse if: a blind rating (n ≥ 30 fills, 2 raters) finds the model's pick no better than the code pick (drop the call and the upgrade); or the same child sees a title change on a re-mount of one item within a lesson and a parent/child panel calls it confusing (pin the first-served body per lesson).

## forge-g1-gate
**The G1 gate is trusted code: Q0 schema (fraction-bars param table pinned by test to the EngineDef in `fractionBars.tsx`; scene@1 through the vendored validator with autofix treated as a failure, because shipped bytes must be the gated bytes) and ≤ 56 KiB; Q4 solver (bars: parts-for-target integer and not pre-solved; scenes: DSL solver S4); Q5 truth RE-DERIVED from the payload alone and compared with the kit (KitMath exact rationals; diagnostics by exact option text; English contrast items case- and punctuation-preserving); leak (the director's `revealsAnswer` plus: any key form in a non-question string is a leak, even one the question names); Q8 every visible string ∈ kit strings ∪ strings table ∪ template constants, SEVERE blocklist on all strings, MILD only on non-kit strings, PII patterns. The verdict is child-free (it is cached and memoised as a dead key); the child's first name is checked separately, see forge-g1-serve-time-child-check. Q2 render is sampled async per FACTORY §5.1 (`server/forge/render-check.mjs`, Playwright, solution + one wrong path), not on the request path.**
- Rationale: FACTORY §5.1 G1 column, QA R15 ("G1 skips the solver" fixed), `content-safety-sole-gate` (Content Safety does not cover Hindi, so the live gate is membership; Content Safety clears the table offline: 81 rows, max severity 0).
- Reverse if: the mutant battery (tests/forge-g1.test.mjs, 14 operators) misses a class in a future change (add the check), or live telemetry shows an item answered wrong by ≥ 70% of children with mastery ≥ 0.8 (n ≥ 10) — quarantine the fill and re-run truth (FACTORY §5.6).

## forge-g1-cache-layout
**Fill identity is child-free: sha256 over canonical JSON of {g1@1, g1-gate@1, g1-flavour@1, DEPLOY.fast, kit hash, topic, item, renderer, template, sorted skin set, lang, band}. Memory LRU (2,000) → Neon `asset_cache` kind `g1_fill` (body holds the GradeTable and misconception map; never sent to the client) → Blob `taxilaforge/forge/g1/<sha256(payload)>.json` (render payload only, `If-None-Match: *`, immutable 1-year cache). Writes run after the response; first writer wins except that a model flavour pick replaces a code pick (`on conflict ... where body.flavour.by = 'code' and excluded.by = 'model'`); `requestFill` hands out structuredClone copies (the cached body is shared by every child); a gap writes `asset_cache` kind `forge_gap` with demand counted per hashed child, capped at 200 children per row (demand saturates there). Identity version g1@2 since the review fixes (the body now carries the gradeEvent binding).**
- Rationale: FACTORY §6.3 (fill per child in Neon, never in Blob — what goes to Blob here is child-free), inherited "identity in cache keys"; no new migration while other workstreams own 008.
- Reverse if: the forge_job queue migration (G2 milestone, FACTORY §2.4) lands — move gaps to forge_job(kind g1.domain_widen / catalogue); or Neon hit p95 (453 ms here over neon-http from the dev container) stays > 300 ms on the pg pool in production (add a per-lesson prefetch into memory, which `prefetchLessonFills` already does).

## forge-g1-serve-time-child-check
**The child-name PII check is not part of the gate's cached verdict. `childNameClash(fill, item, kit, firstName)` runs on every served fill (memory hit, Neon hit and fresh build) over the fill's NON-kit child-visible strings only (title rows, template constants); a clash skips that activity for that child (next fallback, else a gap) and writes no dead key and no forge_gap row.**
- Rationale: kits name characters constantly (c4-c7: Chintu 154, Ravi 123, Riya 104, Meena 89, Asha 69 occurrences); verified kit text is child-free by construction. The name check exists for text G1 adds, and anything child-dependent must never enter child-free state (the fill cache, the dead-key memo, the catalogue).
- Reverse if: G1 ever adds generated free text to a fill (G2+ cores with model-written lines) — then the name check (and Q8 as a whole) must also run on that text at build time, still outside the child-free key.

## forge-g1-turn-path
**Call site 2 is `requestFill({ lessonId, childId, kit, item, move, needByMs: TURN_NEED_BY_MS /* 2000 */ })`, no learner argument. The learner comes from a per-lesson memo (child × topic, 15 min; failures are never memoised) that the lesson-start `prefetchLessonFills` loads, or that the caller seeds with `primeLearner(childId, topicId, view)`; on a memo miss the read is bounded by min(1.5 s, budget − 400 ms) and falls back to the default profile.** Measured: learner read on later turns 0 ms (15/15 per arm); first turn of a lesson without prefetch p50 52 / max 493 ms.
- Rationale: the learner view is 4 Neon reads and it determines the fill key (skins, band, language), so it cannot follow the cache; a lesson's class/language/interests do not change mid-lesson. Recent-wrong order matters only to the prefetch, which reads fresh.
- Reverse if: the turn path's first-turn p95 on the production pg pool from India exceeds 300 ms (make lesson.js prime the memo from the child row it already loads), or interests become editable mid-lesson.

## forge-g1-grade-event
**`gradeEvent(grade, moduleEvent)` (server/forge/grade.js, pure) is the only mapping from a G1 module event to evidence. fraction-bars@1 shade: `goal_met` with this fill's goal → correct (shade has no wrong commit). Compare: `answer` → the server binding's fraction for `choice` (the client's `fractions` echo is ignored), judged by KitMath against key / distractors; its `goal_met` is ignored. scene@1: `answer` with `kind: "sc.commit"` → `vars[binding.var]` (choice-card) or `order[binding.orderNode]` (sequence-steps); a trap option maps to its kit misconception id; the renderer's `correct` and `misc` are claims and never read; its `goal_met` is ignored. A wrong moduleId, probe or shape → null (not evidence).**
- Rationale: the reviewer found the event → key mapping unspecified, which is exactly where a forged correct:true would get in; one tested function removes the integrator's choice.
- Reverse if: a renderer's commit payload changes shape (the agreement test against src/modules/frame/scene/runtime.ts fails), or classify gains a generic module re-grader that subsumes this.

## forge-g1-prefetch-planned
**`prefetchLessonFills` loads the learner snapshot once, then walks error replays, active-misconception diagnostics, then `practiceOrder(kit)` (the Director's `buildPracticeQueue`, then the rest of the kit), and runs `plan()` (pure, ms) on each candidate before it takes one of the `max` (6) slots. Prefetch writes no forge_gap rows (demand counts only items a lesson actually reaches).**
- Rationale: only ~20% of items can become an activity (1.3% of maths with bars only); unplanned slots went to gaps.
- Reverse if: the Director's item order stops being `buildPracticeQueue` (re-point `practiceOrder`), or plan-level hit rate stops predicting real hits (B3 of `forge-g1-turn-path-2026-10-03` drops below 90% memory hits).


<!-- merged from inbox/integration-learner-comp.json -->
## integration-ledger-live-path
**The live lesson runs on the BKT-R ledger and the comprehension facets; the legacy bkt.js fold is gone from the turn and end handlers and from the Director.** `server/routes/lesson.js planTurn`: Director evidence (`evidenceFrom`, unchanged) → `server/learner/live.js answerEvents` (the adapter seam, with the facts only the route knows: episode, tries before, grader from classify's source, options, via, coincident, leaked/spoiled → preAttemptHelp, gaming → gamingWindowKt, ASR conf) → `fuseEvidence` (ledger K/D/M/θ + facets U/T in ONE fold, `LIVE_FOLD_CTX = {}` online and on replay) → `noteOutcome` per event → compact beliefs (`state.comp`) and ledger snapshots (`state.skills`) into `step()` → `closeEvents` (episode closed without a correct answer, teach events for explain / worked example / re-teach) → fuse again. Writes, in the turn's single transaction with `pg_advisory_xact_lock(child)` + `modeGuardStmt` FIRST (the writer's contract; the M0 ratchet takes the same lock first): `ledgerStmts` (kt_evidence in foldOrder, kt_skill_state, kt_misconception, kt_ability*), `facetStmts` for beliefs that moved, `probe_log` for a probe asked, `reteach_attempts` for an engine re-teach, `weave_queue` enqueue when a skill first reaches learned_today, `grade_audit` for carried verdicts, and — so the 001 readers (parent corner, brief, next-topic, Conductor view) stay consistent — `skill_state` as a PROJECTION of the ledger (`legacySkillState`: pKnown = pL, status from display, nextReview from the ledger) plus the 001 `evidence` rows as the verdict log (parent "Kaise pata?", lesson-end facts). misconception_state flag/resolve rows are kept as before. The lesson start reads the Director's snapshot and active misconceptions from the ledger, and its openers from it (below). The end handler flushes the last held event. Pinned by tests/learner-live.test.mjs (replay of the staged rows = online fold through the real planTurn over a 21-turn lesson; rows round-trip through the kt_evidence columns incl. the CE fields) and the e2e (replay of the REAL kt_evidence rows = kt_skill_state, skill_state = projection). **Reverse (drop the projection) when** parent.js, brief.js, next-topic.js and conductor/view.js read kt_skill_state / comp_facet_state directly; **reverse the in-route fold if** a turn's fold cost (fuse over the touched skills) exceeds 10 ms p90 on a production-size ledger.

## integration-ledger-cache
The folded learner state is cached in-process per child, keyed by the highest kt_evidence seq it contains. Each turn reads only `seq > cached` (one indexed query, started with the kit read, resolved before classify returns: plan phase +1 ms median in the latency run). After the commit the online fold is kept only if the inserts got exactly the next seqs (`commitLive`); any gap (another writer interleaved, e.g. two lessons of one child) evicts, and the next read replays from the log, so the cache can never drift from kt_evidence. A replica that never saw the child replays. **Reverse if** full replays on cold replicas cost > 200 ms p90 (measure loadLive on the largest ledger) — then persist a fold snapshot at seq N.

## integration-episode-close-carries-misconception
An open item's wrong answer is not a KT event (the hint ladder continues, adapter openOutcome); the episode emits ONE event when it closes: the correct answer (C0 first try, C1 later try, C2/C3/C4 by rungs) or C4 when the Director leaves the item or the assertion (rung 4) is reached. A misconception shown in the episode is carried on the closing event (otherwise a misconception answer on an open item never reached the misconception layer). Options items grade the first try only (retries carry no evidence); the teach-back is one probe.teachback event over ≤3 taught skills (conjunctive), never one per skill. Teach events are one transition per (lesson, move kind, skill) episode. **Reverse if** the ledger gets a misconception-only class, or the sim shows a hit on a later-corrected episode misattributes (false misconception alarms > 1 per hit).

## integration-held-why-graded-off-path
A why or teach-back answer moves the Director immediately on classify's label; its evidence event is HELD in the lesson state (`state.kt.deferred`) and graded blind after the commit by `server/comprehension/later.js` (gradeClosed R-EXP, one kit target per call: ≤4 key ideas for a why, each expectation for a teach-back; echo texts = topic title + the teacher's last line, used by code only). The next turn folds it first (arrival order) with the grader's outcome and spanOk; if the verdict is not in (still running, another replica, a restart) it lands with classify's outcome and spanOk:false — K evidence, no U/T (E6 fails closed). Lesson end waits ≤6 s. A why takes its best-supported idea (present > partial > contradicted > absent); the misconception id is kept only on contradicted. No serial model call is added to any turn. **Reverse if** the settle rate at the next turn (not yet measured in production; `debug.carried[].graded`) is < 70%, or a code operator replaces R-EXP for whys.

## integration-live-probe-subset
The scheduler replaces `shouldAskWhy` (`director/state.js probePlanFor`): after an unaided correct answer, `nextProbe` over THIS item's skill only, with its pending triggers only, `allow = LIVE_PROBE_SHAPES` = why-class shapes C03, C06, C09, C10, C12, C14 (probe.why, R-EXP): the only family the live lane both poses (a why move, move shape from the shape record's name and family — a note, never a line) and grades (classify why mode for the move; the blind grader for the facet). Errorspot / transfer / predict / mcq shapes need graders not running live, so they are never picked. A kit with no key ideas, or a state without beliefs, falls back to the rule-3 draw. verify_misconception triggers are served by the kit's spoken diagnostic through `s.verify`; warm-up openers are C31 delayed checks (clearing delayed_check); the lesson teach-back is C01; every child turn is recorded in the probe session budget (probe weight / item 1 or 0.25 near the cap / teach 0). **Reverse (widen the set) when** R-CATCH, R-INST and R-OPT run on the live lane with their own blind requests.

## integration-voice-tiebreak-race
Voice features ride on the turn (unchanged), and their capped tie-breakers reach the plan only if turnVoice has resolved by the time classify has (never awaited: the turn does not wait on a DB write for a tie-breaker). Uses, exactly per spec §1.3 / CE8: followUpProbe → the scheduler's gap shortened one slot for the current skill (or the fallback why draw → ask now if the budget fits); gentlerHint → the hint rung's CONTENT one gentler (the hint count, key gate and C-outcome unchanged); slowerPace and the onset z on a think question → persona pace knobs (`TurnResponse.pace`), voiceTie may only order a re-teach pick. Zero belief weight: the same lesson with and without signals folds byte-identically (tests/learner-live.test.mjs). A speculative reply was planned without signals, so a non-empty signal set can only miss it. **Reverse if** measured availability of the signals at classification time is < 50% (then score them from baselines read in parallel, before the write).

## integration-engine-reteach-cooldown
On a graded item answer the belief's re-teach trigger (confirmed misconception, delayed fail, two fails past rung 3, wheel-spin, U low after 2 U probes) picks an arm with selectReteach (kit arms from remediation + generic arms, deterministic), mapped to reteach / recap (SH.reteach with the arm's representation) / prereq_descent (changeApproach: no cross-kit prerequisite item yet) / park (skip the item, Conductor seam no-op). A cooldown of 2 graded items per skill follows (rejected: reteach-without-cooldown). The kit's once-per-misconception re-teach (afterMiss / trap) is unchanged. **Reverse if** pilot lessons show > 2 engine re-teaches per child-session.

## integration-vibe-row
`compile()` has a VIBE section (cap 60 tokens, drop priority 4) between LESSON NOW and the move: `vibeRow(personaKnobs(persona, { reteach, strained, transferProbe, turnsSinceError }))`, computed by the Director each step from `personaStep(turnSignals(...))` once per child turn. Pace knobs go to `TurnResponse.pace`, never the prompt. The row passes checkVibeRow; TURN SHAPE stays last; kit budget unchanged (108/10815). **Reverse if** G1 shows the row displaces a pedagogy/safety attribute.

## integration-voice-spoken-ask
The voice lane poses the item in spoken notation (`toSpoken`, mode × school medium × age band) in LESSON NOW and in the branch question; the key line ("for checking only"), the text lane, captions and every answer-leak guard keep the WRITTEN form. When the spoken branch question would overflow the `last` cap (number-heavy items: 9 items of 10,815 at the load gate's worst case) that one line falls back to written; LESSON NOW still carries the spoken question. The load gate (checkFits) stays on the written form, so no item is dropped from any lane for a voice rendering. **Reverse if** a listener check shows the written fallback line is read wrongly often enough to matter, or the `last` cap is raised.

## safety-content-filter-fails-closed
**The Azure content filter blocking a child's turn is a distress signal, never 'safe'.** `server/azure.js` surfaces every block shape as `AzureError(code 'content_filter')`: HTTP 400 with error.code content_filter or innererror ResponsibleAIPolicyViolation (OpenAI deployments), HTTP 400 with choices[].finish_reason content_filter and no top-level error (non-OpenAI Foundry models; router-s-filter-artifact), and HTTP 200 finish_reason content_filter. Fail-closed paths: classify on any deployment (grok, taxila-fast) → flags.distress, source content_filter, no second call on the same words; the hedged duplicate (a block on EITHER request decides at once — a later 'safe' from the other cannot overrule it); the low-ASR distress backup → true; the teacher-reply call (text/cascade) → the turn is re-planned as a disclosure (safeguard move, incident row source content_filter) and the fixed helpline line is sent with no further model call. Voice lane: the classify block makes the move safeguard → speakNow interrupt. The deterministic predicate runs before any model call (a filter block is never the only line). Tests: tests/safety-content-filter.test.mjs (13: each shape × both classify deployments, hedge, low-ASR, outage-is-not-distress, reply on both deployments). **Reverse:** never (the shapes recognised may grow).

## safety-predicate-passive-ideation-hinglish
The self-harm predicate (director/safety.js) catches 'gayab ho jaana chahta/chahti', 'hamesha ke liye chala/chali jaana chahta/chahti' and Devanagari 'गायब हो जाना चाहत' / 'हमेशा के लिए चली जाना चाहत' (the passive-ideation case the filter blocked in router-bench S). Red-team table extended; the idiom table still passes. **Reverse if** the false-alarm rate on lesson talk measured in pilots is > 1 per 200 child turns for these patterns.

## ledger-source-weight
`server/learner/kt/bktr.js temper()` starts from `SOURCE_WEIGHT[ev.via] ?? 1` (game 0.5, module 0.75), the spec §1.1 weights already applied to U/T by facets.js. The sim effect alone is ~neutral (macro acc bkt2 0.640→0.637, cfrag 0.475→0.470; false mastery 0.025→0.023, 0.043→0.040); the earlier 0.62→0.75 not_yet claim (open ledger-game-full-weight) did not reproduce on this simulator version. Kept because it is the spec and removes a double standard between K and the facets. **Reverse if** the 50-session module agreement gate passes (module → 1).

## ledger-mis-session-cap
`misconception.js spendMis` + `ledger.js` clamp Σ log LR per (misconception, session) at ±log 50, as K's budget; hits are still counted. Five hits in one lesson now reach logit ≤ prior + 3.91 (was +9.66) and resolution needs ≤ 6 discriminating correct answers (was ≥ 16); test-pinned. Sim: macro acc up under both families, but not_yet accuracy down (see the measurement). comprehension/fuse.js MIS_SATURATE (drop a hit at p ≥ 0.95) is left in place: with the cap it rarely fires. **Reverse if** a sim with a misconception-holder persona shows not_yet accuracy loss > 5 pp attributable to the cap (re-tune per SIM6 rules, never to the simulator).

## hook-like-with-like
Hook shape (`director/shapes.js hook`) adds: "any bigger/more comparison: two quantities of one kind, in one unit — a count against a count, a distance against a distance; never across kinds" (a note). The text-lane reply guards add `units` (`director/units.js mixedUnitComparison`: a question sentence with a comparative, whose quantities — in it, or in the two sentences before it — span ≥ 2 kinds with at least one measure: length, mass, volume, time, money, temperature, percent, area; two counts of different things and one dimension in two units pass); one rewrite, then the comparing question is cut (`withoutMixedUnits`). The kit's own posed question is excluded. Voice-lane teacher turns (written by the realtime model) are flagged `meta.unitMix` for review. **Reverse (narrow the predicate) if** its false-positive rate on hook turns is measured > 5%.

## tutor-switch-m0-history
`tutor_switch` (008_tutor_choice.sql: from/to tutor, source, shown, ms_to_choose) is classified in learner/mode.js M0_HISTORY_TABLES, so the M0 ratchet deletes it; it was unclassified and failed tests/learner-mode.test.mjs. **Reverse if** the owner rules the tutor-choice history an account setting kept in every mode (then KEPT_TABLES with that reason).


<!-- merged from inbox/blind-test-published.json -->
## blind-test-v2-published (2026-10-03)
https://claude.ai/artifact/WTiPAMzbiXscxKHodwbaHm hosts docs/research/voice/v2/blind-test-shared.html, which is the external page with db sync added: 357 clips, with the 4 non-consented clone clips excluded. Each listener's ratings go to ratings/<viewer id>. Rules: ratings read and write owner; ratings/{self} read and write interact. So only the owner and the listener can see a listener's ratings, and listeners need Contributor access. Scoring: pull with ArtifactData list ratings and feed score-blind-v2.py with blind-key.json, which is never published. The cascade TTS switch to DragonHD (VOICE-CHOICE.md) waits on this test. **Reverse if** fewer than 20 listeners and 800 ratings arrive, which is the VOICE-CHOICE gate; then run the same page with a recruited panel.


<!-- merged from inbox/owner-design-directive.json -->
## owner-design-v2-directive (2026-10-03)
The owner rates product design, UI and UX as extremely weak. Signalling and the user flows must be excellent. UI chrome and labels are English only, and images carry no text; the teacher still speaks Hindi, English or Hinglish. The owner will bulk-generate images with a Codex prompt that we supply, saved under public/assets/gen/. The teacher should be video if costs allow, otherwise a highly detailed, expressive, human-like 3D face covering speak, listen, think and emotions. Prior evidence (video-avatar-v2.md): full live video costs about $23 per student-month self-hosted (MuseTalk) or about $450 on the Azure TTS avatar, against a $0.69-2.30 avatar budget, so video fits only for moments. Executed by workflow wf_de24e56b-2d9, which writes docs/design/**. **Reverse** the English-only rule if parent or child testing shows that Hindi-medium children can't navigate English chrome; then add a localisation layer, keeping language a parameter.


<!-- merged from inbox/design-v2.json -->
## design-v2-product-design (2026-10-03)
**The final UI/UX spec is `docs/design/PRODUCT-DESIGN-V2.md`.** It uses Calm Mastery (`docs/design/directions/calm-mastery.md`) as the base and grafts in the best of Child-First Wonder (`child-first-wonder.md`). It answers `owner-design-v2-directive` and the 25-problem production audit (`docs/design/audit/AUDIT.md`). It replaces the UI sections of v1 `docs/research/design/PRODUCT-DESIGN.md` wherever they disagree. Everything it does not mention in v1 still holds: the dp-budget method, ReactionGate, the ledger, the parent PX rules, the voice ladder and safety.
- Rationale: the design director's weighted scorecard (spec §1) gave CM 56.6 and CFW 50.9 out of 62.5. CM wins on:
  - signalling: one lamp target, and the card kept separate from the caption;
  - buildability: 2 geometries instead of 11, the existing auth, and a first week that needs no art;
  - low-end performance: flat tier D, synthesised earcons, ≈ 86 KB of fonts;
  - flow: class first, so the parent meets the actual teacher.

  CFW wins on delight for ages 6–9 and on robustness details, which are grafted in. Those grafts are the heard/showing/yielding states, the IndexedDB outbox, the Board tray, the concept payoffs, the painted courtyard and rooftop, the protégé, the plan-404 fallback, the parent locked-out flows, the `--d5-haldi` defect and the ask-parity gate.
- Build: phases B1–B4, each with acceptance checks and a Playwright visual battery (spec §13.2, §14).
- Reverse if: V2-M1 (whose turn) or V2-M2 (what's the question) at n = 20 per band shows no gain over the v1 layouts. Also reverse if V-LAYOUT-1 cannot fit at font scale 2.0. If V2-M11 delight for ages 6–9 stays below 60% after two iterations, move the Young lesson toward CFW's full-stage world, starting with a lit vs dusk arm.

## design-v2-desk-layout (2026-10-03)
**The lesson is laid out as the Desk.** It has four zones that never overlap:
- the TeacherWindow (Face geometry) or the SpeechRow (Work geometry);
- the pinned QuestionCard;
- the WorkTray, rendered only when `ui.tray` is module, board, tiles or pad;
- the AnswerDock.

Face, Work and Keyboard replace L1–L5. The dp-budget method of `ds-layout-dp-budget` is kept: every column sums to 584, 744 and 1280×720, and geometry changes only at phase boundaries. The face is never a PiP over content, and no placeholder ever reaches a child.
- Rationale: audit problems 1, 5 and 23. With the card pinned and the PiP gone, five geometries collapse into two, which means fewer reflows on tier C.
- Gate: B1-A2 (column sums and minimums), V-LAYOUT-1/2.
- Reverse if: V2-M1/M2 show no gain over the L-layouts at n = 20 per band, or V-LAYOUT-1 fails at font scale 2.0.

## design-v2-lamp-on-dock (2026-10-03)
**Marigold `#FFB21E` lights exactly one element: `AnswerDock[data-floor="your_turn"]`.** It is drawn as `--lamp-wash` plus a 3 dp `--lamp-ring`, with the visible word "Your turn". The chime, the 20 ms haptic and her lean-in fire from the same transition on the same frame. Marigold never appears on buttons (which use `--nib`), in the parent corner, onboarding, landing or generated art. On a child screen, no colour with saturation ≥ 35% may sit within 12° of hue of the lamp.
- Rationale: the audit found marigold carrying four meanings and turn state carried by mic colour alone. One target gives the child one place to look.
- Gate: G-LAMP-1 (static) and V-SIG-2 (≤ 1 `[data-lamp]` per frame, 0 on parent/onboarding/landing).
- Reverse if: V2-M1 shows that ringing the tile group beats ringing the dock by ≥ 5 pp for B2.

## design-v2-ask-pinned (2026-10-03)
**Every hand-over in {answer, choice, judge} carries `ui.ask`.** It is the question in written form, ≤ 120 characters, in the lesson's script, produced by the same Director move as her speech and the board. The QuestionCard pins it from her first audio frame until the item resolves. Hints and follow-ups add lines under the ask and never replace it. "Hear the question" replays the ask itself, from the client buffer.
- Rationale: audit problem 1 (the caption showed only the tail of her turn at the child's turn) and problem 6 (board, voice and screen contradicted each other).
- Gate: G-ASK-1 (presence = 100%), G-ASK-2 (the spoken reply contains the ask's content tokens, re-rendered before TTS), G-SAY-1, G-OBJ-1, V-ASK-1.
- Reverse if: V2-M2 at n = 20 per band shows no difference vs caption-only.

## design-v2-floor-eight-states (2026-10-03)
**The floor states are idle, speaking, showing, yielding, your_turn, listening, heard and thinking** (`src/lesson/floor.ts`). Overlays (paused, trouble, help, recorded) suspend the floor, and the lamp is never lit under one. Each state is carried by face, a visible word, a glyph, a sound, a haptic and only then colour (spec §4.2). YOUR TURN requires a pending hand-over: the bug fix to `statusOf()`, which today returns your_turn whenever nothing is pending.
- Rationale: audit problems 2, 3 and 22. `heard` is the missing receipt; `showing` stops children tapping an inert demo; `yielding` puts every carrier on her offset frame.
- Gate: B1-A1, V-SIG-1…5 (greyscale and CVD distinctness, same-frame signals).
- Reverse if: V2-M1 shows the extra states confuse (more than 20% naming errors on heard or showing).

## design-v2-no-silent-failure (2026-10-03)
**No answer is lost, and nothing fails silently.**
- Every child answer (spoken, typed, tapped, module or drawn) is written to an IndexedDB outbox keyed (lessonId, turnSeq) before it is sent.
- It is retried at 1, 3 and 6 s, flushed in order on reconnect, and removed only on the server's acknowledgement.
- A receipt appears ≤ 150 ms after the answer, and a visible state ≤ 3 s after a failure is detectable (T1 at 8 s for a slow reply).
- Nine trouble states T1–T9 share one Trouble strip, each with a sentence, ≤ 2 actions and the state of the answer.
- Raw API strings are never shown.
- Rationale: audit problem 3 (with the network cut, the typed answer was lost, with no error and no retry) and problem 18.
- Gate: V-CHAOS-1, with 0 lost answers across 8 cut points plus ASR, mic, output, GL and token failures.
- Reverse if: never. This is a correctness floor.

## design-v2-face-verdict-neutral (2026-10-03)
**ReactionGate stands over Calm Mastery's proposal.**
- Her face plays the same warm-attentive program after correct and wrong commits.
- The verdict comes from the verified-key classifier only, and lives on the work:
  - correct: a `--got` tick drawn on the answer chip and the engine's concept payoff;
  - partly: a half-tick;
  - not yet: a magnifier and "Let's look again", with no red, no cross and no haptic.
- Delight fires only on effort or insight tags, ≤ 1 per 5 turns.
- Praise moves need `verdict = correct` or an effort/insight tag (G-PRAISE-1), which blocks "Bilkul" after a wrong answer.
- Rationale: audit problem 13 (no feedback channel). A face keyed to correctness is farmable and leaks covert checks (v1 R6).
- Reverse if: a pilot shows ≥ 20% of children unsure whether they were right after a verdict even with the tick and payoff present. Then add verdict-keyed affect for B1 only, at constant magnitude.

## design-v2-type-atkinson-literata (2026-10-03)
**Fonts:**
- Atkinson Hyperlegible Next (34,024 B, `tnum`) for all UI, questions and numerals;
- Literata (39,260 B, `tnum`) for Older, parent and landing titles at ≥ 22 sp;
- Mukta only for Devanagari captions, with a unicode-range that excludes ₹;
- Andika for early-reading content.

Baloo 2 is dropped, which amends the type clause of `ds-band-fork-older`. The Latin cold path is ≈ 86 KB, against ≈ 398 KB. Chrome draws ₹ from an inline SVG.
- Rationale: CM font measurement 2026-10-03 (n = 1 fetch per family). Clear 1/l/I and 0/O for maths. Lexend and Fraunces have no `tnum`.
- Reverse if: V2-M14 (Young titles) shows Atkinson rated cold or hard to read more than 15 pp above Baloo 2, or B3/B4 panels rate Literata titles cold or school-y more than 15 pp.

## design-v2-older-position-cues (2026-10-03, gated)
**Three gated cues for Older children:**
- the phase line (Warm-up · Learn · Try · Wrap, current in bold, no fill, no count);
- "Practice · 2 of 5" in Quick practice;
- the turn chime at −18 dBFS.

They amend `ds-progress-no-meters` and the "earcons off" clause of `ds-band-fork-older`, and they ship behind flags.
- Rationale: the audit found no sense of arc (§4.4) and no sound for turn changes.
- Reverse if: V2-M13 (MW-M1) shows lower free-choice persistence or a goal-gradient pattern, or V2-M4 fails (missed turns must drop ≥ 3 pp, with annoyance ≤ 1 in 5).

## design-v2-pause-leads-paused (2026-10-03)
**The pause sheet is titled "Paused" and leads with Continue and End lesson.** "Need help? Talk to a grown-up" and the Childline 1098 and Tele-MANAS 14416 `tel:` buttons form the third row, visible without scrolling. The Help sheet raised by the safety predicate still leads with help ("You're not in trouble."). This amends v1 §3.14.
- Rationale: audit problem 14. A child who wanted water was shown helplines as the headline.
- Reverse if: help taps via pause per 1,000 lessons fall below the v1 layout's rate, with the predicate-raised sheet unchanged.

## design-v2-painted-world (2026-10-03, gated)
**The art direction is a painted gouache world.** Young children get a sunlit courtyard and Older children a rooftop at dusk. The TeacherWindow's ground is a dusk stage (`--stage #26304A`) with a warm pool behind her, and it "lights down" at lesson start. The Garden and Sky art follow the same style. Chapter seals appear only when the ledger puts every skill in a chapter at Got it or Secure; they are a state of the map, never collected or counted, which answers the owner's badges request.
- Production: 152 images from one Codex prompt (spec §12.1) into `public/assets/gen/**`. `scripts/gen-assets.mjs` enforces the budgets, an OCR no-text presence check, the lamp-hue pixel lint and provenance, then a human review follows. Tier D gets flat fallbacks. This amends v1 §4.7 (flat fills).
- Reverse if: V2-M12 shows more than 15% of B4 children rating the art "for little kids", or the budgets cannot be met (≤ 350 KB of art per first-run child screen). Also if the chapter seal behaves like a collectible: a goal-gradient pattern, or return that rises while delayed retention falls.


<!-- merged from inbox/harvest-ports.json -->
## release-gate-verify-release
`scripts/verify-release.mjs` is the one release gate (harvest port task 1, after html-portfolio's). Order: `tsc -b` → `scripts/check-prompt-budget.mjs` → `node --test tests/kit-budget.test.mjs` → `evals/persona-invariants.mjs` → `evals/never-rules.mjs` → `evals/pii.mjs` → `evals/spoken-preserve.mjs` → `scripts/context.mjs --check` → `vite build` → `npm test` (vite before npm test: tests/engines-browser reads dist/). Every failure is printed with its output tail; the verdict is the exit code. Skips are red unless named in `KNOWN_SKIPS` with a reason (today: the learner Neon suite without TEST_DATABASE_URL; the VOICE_BROWSER=1 Chromium suite). `--live <base>` adds `scripts/live-probes.mjs` (health, db round trip, app shell, six 401 auth fences, JSON 404; no model call) and `scripts/prod-smoke.mjs <base> text`, which now runs every teacher line through `floorViolations`. `--only a,b` is for iterating, never for a release. **Reverse if** CI grows its own runner with the same list (then this file becomes a thin wrapper and a parity test pins the two lists).

## never-rules-floor-violations
The floor's NEVER rules are checked on the TEACHER's words by code, not trusted to the prompt (`server/director/safety.js floorViolations(text, {content, requireHelpline, goodbye})` → families most severe first; `neverRuleHits` gives `{family, rule}` and never the text). Families = `compile.js FLOOR_FIX` keys (a test pins the identity), so a voice-lane hit becomes `lessonState.correction` and the next compile renders the fix shape first (the producer that FLOOR_FIX was always waiting for: nothing set `correction` before). Port of `api/_never-rules.js@vb` with its two refuted defects fixed: normalisation keeps `\p{M}` (only nukta and chandrabindu are folded), matching is letter-bounded (no 'ass' in "class"). Posed kit content and quoted model sentences are excluded; a question or reported question is not a claim (ai_denial, feelings); `helpline` checks the number beside Childline/Tele-MANAS/"helpline" in numerals, Devanagari digits or digit words; `goodbye` turns treat a question or teaser as a hook; safeguard turns must carry 1098. New FLOOR_FIX keys are <= 25 chars and `checkFits` pins its correction pair, so the kit load gate admits exactly what it did before. **Reverse / demote a family to log-only if** a human-coded out-of-sample battery (>= 300 teacher turns per lane) shows its precision < 0.9; **replace the regex family with a classifier if** its recall there is < 0.5 for ai_denial, romance or exclusivity.

## minor-gates-no-adult-branch
`server/compiler/gates.js`: `MINOR_GATES` is frozen; `gatesFor(tier)` returns it for every tier ("adult", "verified_adult", "unverified", unknown, null, garbage); `saferGates` only restricts; `assertMinorGates` throws on anything wider; `compile()` asserts it on every call and `neverRuleHits` reads its family list. The source (`src/engine/clock.ts@vy`) defaulted `unverified` to adult gates (romance and engagement mechanics on); here there is no adult branch to fall into, and a test scans server/src/shared for any `romance: true` / `engagementMechanics: true`. A guardian's adult attestation governs parent surfaces only. **Reverse only if** Taxila ships an adult-learner product — and then as a separate kernel on a separate lane, never a tier of this one.

## scrub-pii-cued
`scrubPii(text, {names})` → `{text, found: kinds}` masks direct identifiers before a child's words reach a provider or a row (harvest port task 7; the Gurukul scrubPii@gp it replaces was refuted). Number shapes match on a Devanagari-digit-folded copy (offsets shared): Aadhaar-shaped 4-4-4 (any first digit) or a 12-run starting 2-9; Indian mobiles with +91/91/0 split at most 3 times; STD landlines; email; PIN after a cue; 10+ digit WORDS in a row (EN, Hinglish, Devanagari). Names, schools and addresses only after a cue the child uses to give one, with capitalised Roman values (Devanagari values need the cue): the child's first name is KEPT (the teacher already uses it; "My name is Riya" is an English kit answer), a surname and family members' names are masked. Contiguous monotone runs (9876543210, the classic largest-number answer) and lists of number groups are exempt. **Reverse a rule if** any kit answer or acceptable is masked by it (evals/pii.mjs counts them: 0 today); **add NER if** a labelled sample of real child turns shows the cue rules miss > 1% of PII-bearing turns.

## floor-core-quote-free
The compiled CORE is quote-free and bracket-free (VOICE-TEACHER §4 row 3, rejected `voice-prompt-labels-and-brackets`: the floor's quoted 'best friend' / 'only me' were recited in 22/33 attachment replies). floor.js now says "friend-role or only-you claims"; Asha's "no 'baby', no 'dear'" → "no pet names or endearments"; Arjun's "without softening into 'almost'" → "with no softening". `evals/persona-invariants.mjs` lints CORE on all 144 lanes with an in-run control. **Reverse if** a re-run of the char/relational probe shows the unquoted phrasings recited or the romance/exclusivity violation rate rising against the 2026-10-02 baseline.

## never-rules-floor-violations — revised 2026-10-03 (review fixes)
Four changes after the review. (1) **Content** is removed only as a whole, letter-bounded segment, only when it is >= `CONTENT_MIN` (12) characters AND carries a NEVER hit of its own (`contentRe`), so removal can only take away a hit the verified content itself carries; short kit answers ('no', '8', 'A', 'किसी को नहीं') can neither hide nor create a violation. The call-site recipe (pass prompt, answer, acceptable, hints, options) is therefore safe as written. (2) **Quoted spans are judged**; a quote led by a modelling cue (say/bolo/like this/likho/for example/…, within 24 chars) is judged only for romance and exclusivity (helplines everywhere) — "Say it like this: 'Where do you live?'" is an English lesson, "Main tumhari 'best friend' hoon" is a claim. `normForMatch` drops a ' at a word edge so a quoted phrase reads as words. (3) **Negation guards**: don't/never/not/no need to/mat/nahi before keep-secret and data asks, nahi/mat after Hinglish/Hindi data asks and secret phrases, and safety advice naming a data word ("don't tell anyone your password", "apna password kisi ko mat batana") is not a pact. A helpline number is attributed only to the name it follows, cut at the next helpline name, never 112/100/108, never another helpline's number after or/ya. (4) **Question frame** must end right at the claim (if/whether/kya/you asked if/tumne poocha ki/tumhe lagta hai ki); a hedge earlier in the clause no longer exempts. **Reverse (1)** if a kit ships a verified string that flags on its own AND is shorter than 12 chars and teachers read it out (then lower CONTENT_MIN for that string class with a test); **reverse (2)'s cue exemption** if a modelled-quote violation is found in a recorded reply.

## minor-gates-no-adult-branch — clarified 2026-10-03
`compile()`'s `assertMinorGates(gatesFor(...))` cannot fail today (gatesFor has one answer). It is structural documentation and a tripwire for a future branch, not a runtime guard; tests/gates.test.mjs pins that it throws for every widened gate set. Nothing in Taxila changes behaviour on gate values. **Reverse** (delete the call) if it is ever mistaken for coverage in a review; keep the kernel.

## scrub-pii-cued — revised 2026-10-03
Lower-case values are matched after the UNAMBIGUOUS cues only (my name is, mera naam, family-name cues, my school is / school ka naam / mera school, I live in/at/near, mera ghar/pata, main X mein rehta), with a function/describing-word stop list; "i go to school" stays proper-noun-only. A phone after an explicit cue (number/phone/mobile/contact/whatsapp/नंबर/फोन/मोबाइल) is masked however it is split, unless its digits are a monotone run. This is NOT the rejected `scrub-pii-uncued-shapes` (any letter after any cue): kit strings stay at 2/126,863 masked, 0 answers. Coverage is still cue-dependent — a name with no lead-in phrase ("riya sharma here") is not caught. **Reverse** if a lower-case cue rule masks a kit answer or a recorded child answer (the eval gates both).

## fix-load-gate-computed
`FIX_LOAD_GATE` is computed: the longest FIX_MAX (2) combination of `FLOOR_FIX` values. personal_data and ability were shortened to <= 25 chars so the longest pair is still ai_denial + exclusivity (82 chars) and the kit load gate admits exactly the same items; tests/gates.test.mjs pins both the computation and the <= 25 rule. **Reverse** never silently: lengthening a key now makes the load gate stricter (items may drop at load, which kit-budget reports), never lets a mid-lesson BudgetError through.


<!-- merged from inbox/parent-reports.json -->
## reports-lane-a-evidence-rows
**Parent reports v1 are Lane A (PARENT-REPORT §10.2): every parent line is a reviewed template per (shape × language) on typed slots computed in code from ledger rows, and every claim stores the rows behind it (`factIds`: `kt_evidence:<id>`, `lesson:<uuid>`, `kt_skill_state:<skill>`, `memory:<id>`).** Shapes: header (lessons · days · min), strength (delayed success · explained in own words · transfer · error-spot · an earlier delayed success on a zero-lesson week), rows ('Practised “title”: n questions, k right on the first try without help'), growth edge (task feature · hedged mix-up only past a diagnostic set of ≥ 3 discriminating / ≥ 2 matching answers · Taxila's action), interest (memory kind=interest, daily; RETIRED 2026-10-03 by reports-no-interest-line), home activity (weekly, from a skill with first-try successes, never the growth-edge skill). Fixed priority per section, caps daily 1/2/1/1/0 and weekly 1/2/1/0/1 (≤ 5 body lines). No frequency words (counts only), no L2/L3 lines, no percentages. Hindi/Hinglish are gender-neutral by construction (ने / respectful plural) because the child row has no pronoun. (2026-10-03)
- Rationale: RR-D2 fact-first; the false-claim budget has nothing to admit while no L2/L3 menu exists; comprehension §7 'evidence, not verdicts'.
- Reverse if: an L2/L3 menu item is pre-registered and passes E-R1/E-R2 (two-groups pooling) — then it enters through the G-h budget, not as a template; or PRM1 shows parents misread the count rows (> 20% read-back errors).

## reports-gate-throws
**The assembled report is gated in every language and the gate throws; it never trims.** Predicates per line: exact re-render of the template on the claim's slots (no free text can ride in), full lexicon (BANNED, 16 categories, EN + Devanagari nukta-insensitive + Roman Hindi) on the line with curriculum/name/object spans masked, severe list on curriculum and child spans, locked words unless K7 and the pakka shape, every digit equals a numeric or date slot, a template-bug detector, the name slot is the child's name. Report-level: every claim rendered exactly once per language, every line maps to a claim or a registered fixed copy, one header, caps, exactly one home activity weekly, growth-edge shape family, spoken script rebuilt from its order and ≤ 110/200 words and ≤ 1,200 chars (one /api/tts request; the report speak path refuses a longer script instead of slicing it). Candidate screening before assembly uses the same line predicates and is logged in meta.screened; the Lane A spoken order drops only in the declared order (second row, first row, interest, tricky) and then throws. (2026-10-03)
- Rationale: inherited 'truncation is silent → budget gates throw'; PARENT-REPORT §8.2 'a failure blocks the send'.
- Reverse if: never for throwing. Revisit the screening (vs throwing) only if meta.screened shows a template, not data, being screened.

## reports-k7-locked-words
**'Mastered' and every mastery word are locked behind the calibration gate.** `server/reports/config.js CALIBRATION.k7Passed = false`. Until it is set (with a measurements.md K7 entry: delayed accuracy ≥ 0.9 at 1 and 4 weeks, ECE ≤ 0.05, n ≥ 200 children), the LOCKED list (pakka, mastered, master*, learned, learnt, understood, understand*, can do, can now, knows, secure, durable, got it, aa gaya, seekh liya, samajh gaya/gayi/liya, पक्का, सीख लिया, समझ गया/गई, समझ लिया, आ गया) is an overclaim violation anywhere. After K7 only `st.pakka` may say it, and only on ≥ 2 delayed successes on distinct items ≥ 1 day apart (RRI17). (2026-10-03)
- Rationale: comprehension §7.1 (no row says mastered / learned / understood / can do before K7); open-learner-calibration-gate.
- Reverse if: K7 passes on real children.

## reports-curriculum-span-mask
**Kit skill titles and kit misconception beliefs are 'curriculum' slots: masked for the full lexicon, checked against a severe list (sexual/romance, self-harm, slurs/insults, diagnosis words).** They are quoted in every template (“title”) so they read as the topic name. (2026-10-03)
- Rationale: 424/2,991 kit titles (14.2%) trip the full lexicon on outcome language about the topic ('Knows the story words…', 'Test objects with a magnet…', 'Understands the story's point of view…'); screening them would drop valid lines and bias reports away from science/English topics.
- Reverse if: a parent-comprehension test (PRM1) shows quoted outcome titles that start with 'Knows/Understands' are read as verdicts about the child — then titles get a parent-facing short name in the kit, and the mask goes.

## reports-lane-b-brain-ordering
**Lane B is taxila-brain (fallback taxila-fast), effort low, max 800 completion tokens, JSON schema `{order: [{kind, id}]}` with a 7-rule shape-only prompt (no example sentences). It orders segments and picks connective ids (c.next, c.also, c.good, c.tricky); code validates (frame first/last, mustKeep present, no adjacent connectives, home just before close, tricky after strength/rows, word and char budgets) and assembles the text from our strings. One order for the child's language is re-validated per language; a language it does not fit gets the Lane A order. Budget: worst-case cost (input chars/3 × in-price + 800 × out-price) is checked BEFORE each call; spend is written to job.spent_micro_usd fenced by attempt.** (2026-10-03)
- Rationale: MODEL-ROUTER 'Parent reports' row (brain primary); PARENT-REPORT §10.2 Lane B jobs.
- Reverse if: MODEL-ROUTER R4 is accepted (fast ties brain on W at 1/31 the cost) — Lane B is ordering ids, so move daily notes to taxila-fast first; or if Lane B's order shows no parent-comprehension gain over the Lane A order in PRM1, drop the call.

## reports-end-of-day-jobs
**End-of-day jobs (server/conductor/config.js JOB_KINDS, decide.js foldNight → enqueueReports): `report.daily:{child}:{day}` when the folded day was active (counters.lastActiveDay / activeDays), `parent.letter:{child}:{isoWeek}` when the folded day is a Sunday (ISO week Mon-Sun); runAfter = next day 04:00 local + REPORT_GRACE_MIN (10); purpose core_tutoring (guarded in decide and re-checked at claim); allowedIn paused and in_lesson, dropped in safety_hold; budgets 25,000 / 40,000 µ$; maxAttempts 4, lease 120 s.** Handlers in server/reports/jobs.js (imported by conductor/handlers.js): a stored report short-circuits before any model call; a bad period is final; a quiet day is `skipped:no_activity`; a cancel requested before the model call stops the job. (2026-10-03)
- Rationale: X8 (letter idempotency per child-week), X11 (daily note pull-only in v1), CONDUCTOR §7.3, X36 (night fold once per learning day, re-armed only within 14 days of activity).
- Reverse if: the Notifier (M1) needs the letter at the parent's chosen day/hour (pl PA-9) — then a `weekly_letter` wakeup (parent-chosen, kept for dormant children per X36) enqueues parent.letter instead of the Sunday fold; or daily notes go unread (> 80% unopened in PRM8) — then stop generating them.

## reports-growth-edge-next-lessons
**A growth edge (S11) is admitted only with an action part: `tricky.work` / `tricky.mixup` carry the kt_skill_state.next_review_at date; when no date exists and the skill's display is unseen/introduced/practising, `tricky.work_next` / `tricky.mixup_next` say 'Taxila comes back to it, or to the step before it, in the next lessons' — the placement rule (content/next-topic.js pickTopic: first not-done topic, back-chained to a prerequisite). A learned skill with no date gets no growth-edge line.** (2026-10-03)
- Rationale: FSRS sets next_review_at only once a skill is learned; requiring a date hid every not-yet-learned difficulty (rejected: reports-tricky-needs-review-date).
- Reverse if: the Director/planner changes placement so a not-done topic is not continued (then the wording is false), or a per-skill re-check schedule for practising skills exists (then use its date).

## reports-voice-features-excluded
**Voice features never reach a parent report.** facts.js reads only consent, lesson, kt_evidence, kt_skill_state, kt_misconception and memory (interest rows under memory consent); `voice` words (voice, pause*, hesitat*, pitch, tone, speech rate, WCPM, awaaz) are in the banned lexicon; tests/reports-gate.test.mjs scans the loader source. (2026-10-03)
- Rationale: COMPREHENSION-ENGINE §7.3 bans 'voice-feature anything' in parent text; PARENT-REPORT §3 maps no voice construct to any section; ct-no-voice-emotion-inference.
- Reverse if: CD-orf (oral reading fluency) is built on equated, human-audited passages (PARENT-REPORT §4.3) — then a term-only S3 subrow may cite read-aloud WCPM.

## reports-no-interest-line
**No interest line in parent reports (fixer pass, 2026-10-03).** memory.text for kind=interest is written by taxila-fast at lesson end (server/routes/lesson.js: "at most 3 harmless things the child SAID", ≤ 14 words, no fixed format), so it is model paraphrase, not a typed value; a reviewed template cannot carry it (a real row 'loves cricket' rendered 'Aarav said they like loves cricket', English inside hi/hinglish reports, under a drawer label 'What they told Taxila'). The shape, the cap (daily interest 0), the memory read in facts.js, the checker case and the drawer section are removed; RENDER_VERSION → pr-2.
- Rationale: "every line is a reviewed template on typed values" and "no model writes text a parent reads" are the report's contract; a word-list filter on paraphrase cannot tell 'hates cricket' from 'loves cricket'.
- Reverse if: memory stores a typed interest (a topic/category id from a reviewed list with per-language labels), then the line returns as a template on that id, with a sim run on rows produced by the real lesson-end writer.

## reports-safety-hold-read-side
**The safety hold holds the report read side too.** `reportHold(childId)` reads conductor_state (mode, state.modeSince). During safety_hold: GET /api/parent/report with cadence → `{ report: null, skipped: 'held', held: true }` (no live preview, daily or weekly); GET /api/parent/reports lists only notes created before the hold began (`held: true`); a stored note by id is served only if created before the hold, with every spoken script nulled; GET /api/parent/speak?what=report → 409; preview evidence → 404; stored-note evidence (pre-hold) stays. The client shows fixed neutral copy ('No new note right now.') and no Listen. No conductor_state row or table = no hold; any other DB error propagates (never read as 'no hold').
- Rationale: guards.js drops the report jobs in a hold because 'the protocol decides what reaches the family'; the preview path built the same content on demand. Notes from before the hold were already with the family; withdrawing them is a visible act the safeguarding protocol should own, not this route.
- Reverse if: the safeguarding protocol (not built) specifies a different read-side rule (e.g. hide all notes, or show a protocol message) — then this route defers to it; or a hold must also hide pre-hold notes for a reason this pass did not see.

## reports-delayed-copy-last-came-up
**Delayed-success copy no longer says 'again'.** en: '“title”: right on the first try without help, d days after it last came up.'; hinglish: 'd din baad phir aaya, aur pehli baar mein bina madad ke sahi.'; hi: 'd दिन बाद फिर आया, और पहली बार में बिना मदद के सही।' Same for st.delayed_before and the K7-locked st.pakka. The evidence rule (derive.js delayedSuccesses: previous contact on the skill, any row, in another session ≥ 20 h earlier) is unchanged.
- Rationale: the previous contact can be a teach row, a wrong, helped or contaminated answer; 'right again' / 'baad bhi sahi' asserts it was right. A checker that re-derives the generator's rule verifies consistency, not the meaning a parent reads — wording needs its own test (fixture whose previous contact is C2).
- Reverse if: the rule is tightened to require a clean first-try success as the previous contact (then 'again' is true), or PRM read-back shows parents read 'after it last came up' as 'was wrong before' (> 20%).

## reports-recheck-date-ahead
**'It comes back on <date>' only for a date still ahead.** buildClaims takes `now` (generation time; default the window end); dated iff next_review_at ≥ max(window end, now). Else: _next wording for a not-learned skill, or no growth-edge line (never a stale promise). check.js: the date must be ≥ max(window_to, created_at).
- Rationale: jobs run after the window closes (daily 04:10 next day, weekly Monday) and previews later still; the old test (≥ window start) let a same-day 15:00 re-check and a five-days-past Wednesday through, and the checker shared the rule.
- Reverse if: reports describe the actual re-check event when it already happened (an L1 'came back on <date>: right / not yet' shape), which would replace the _next fallback for past dates.

## reports-how-copy-not-rule
**The drawer shows reviewed 'how this line is counted' copy, never claim.rule.** templates.js `HOW[shapeId] = { en, hinglish, hi }` for every shape; `evidenceClaimOut` sends `{ id, section, shapeId, how }`. A test runs every HOW string and every label string in src/parent/Report.tsx through the full lexicon and the lock list (this caught 'behind' / 'peeche' / 'पीछे' (prediction list) and 'not sure' (certainty) in the drawer labels, reworded). The rule strings stay for the checker and audit.
- Reverse if: rule strings become reviewed, translated parent copy themselves (then HOW is generated from them under the same test).

## reports-gate-final-pregate
**Gate before paying, final on failure, charge failed calls.** compose() gates the Lane A render before the writer is called and the full report (with voice) after; runReportJob turns ReportGateError into FinalJobError (dead + job.failed{final}) and writes audit `parent_report.gate_failed` with `lang:rule` names only; orderForVoice charges a failed call its returned usage, else the worst-case estimate, through onSpend.
- Rationale: the gate is deterministic on a snapshot, so retries repeat the failure and re-pay taxila-brain; an uncharged timeout made spent_micro_usd under-count and let the fallback think it had more room.
- Reverse if: the gate gains a time- or model-dependent predicate (then a retry can succeed), or Azure is shown never to bill a timed-out call (then charge 0 on transport errors).

## reports-late-activity-daily
**A lesson after the night fold still gets its day's note.** markActive(s, day, H): when `s.adapt.foldedDay === day` and the job is not already pending, it enqueues `report.daily:{child}:{day}` (runAfter 04:10 next day) with rule `report_daily_late`.
- Rationale: the fold wakes at 02:00 + ≤ 1 h jitter; the learning day runs to 04:00, so a 03:10 lesson on an otherwise quiet day got no note. Enqueuing every fold was the alternative (the job already skips no_activity) but costs one job row per child per quiet day.
- Reverse if: the night fold moves after 04:00 local (then foldNight sees the whole day).

## reports-header-open-lessons
**Open lessons and lesson-less days in the header.** An open lesson (ended_at null) counts to its last evidence row in the window (session_id = lesson id; that row is cited), else 0 min; a preview counts a running lesson to now. A daily window with evidence and no lesson renders header.nolesson ('No lesson started; some time with Taxila outside a lesson.'). check.js re-derives both from rows.
- Reverse if: lessons get a reliable server-side close (ended_at always set, e.g. by the Conductor's stale-lesson close) — then the last-row rule is unneeded.

## reports-list-newest-render
**'Earlier notes' shows one entry per day/week.** listReports: `distinct on (cadence, period)` newest created_at; reportById still serves any stored version by id.
- Reverse if: parents need to compare renders (no such use known).


<!-- merged from inbox/forge-g2.json -->
## forge-g2-kit-lite
**G2 v0 builds mechanics for tgk-lite@1 (server/forge/g2/kit/), a trusted vanilla-DOM/SVG kit, instead of the Phaser-4 tgk@1 of FACTORY §4 (2026-10-03).** Agent code is one `defineMechanic({init, reduce, feedback?, targets, render, facts})`; the kit owns the bridge (shared/contracts.ts ModuleToHost: page-level ready, init + MessagePort), values (agent code only copies opaque refs from `ctx.refs`; the kit resolves them, labels every bound target and draws every numeral and quantity picture via `draw.numeral`/`draw.model`), the observation (choice = last accepted choose ref; build = a kit shadow of unit counts checked against `facts()` after every action → `state_diverged`), grading against the server-expanded kit key, the item cursor, goal_met once, stuck after 3 wrong, reveal/highlight, feel, a 50 ms per-call budget, and runtime refusals (`ref_inactive_item`, `ref_wrong_slot`, `target_too_small`, `target_overlap`, `key_unreachable`, `key_singled_out`, …). Archetypes: `choice` and `build` (integers 1-99, tens + ones). Why: Phaser 4 is not in the repo, the binding laws (§4.3 GAP-F1) need a kit that owns values, and a 37 KB bundle loads in an opaque iframe with no network. **Reverse if:** a mechanic class needs physics/animation the DOM kit cannot express (then build tgk@1 on Phaser behind the same defineMechanic surface), or real-device fps of tgk-lite is worse than the Phaser prototype.

## forge-g2-one-bundle-hash-csp
**One self-contained index.html per module, CSP by hash (2026-10-03).** `buildBundle` inlines kit + mechanic; the meta CSP is `default-src 'none'; script-src 'sha256-<that script>'; style-src 'sha256-<kit css>'; img-src data:; connect-src 'none'; …`; agent source is wrapped in `function(defineMechanic, Math, window, self, globalThis, document, fetch, Date, Function, …)` with every ambient name undefined and `Math.random` throwing; `</script` in agent text is escaped. Publish recomputes the sha of the stored bytes and refuses a mismatch. **Reverse if:** a module needs assets larger than inline data (then path-scoped CSP per FACTORY §2.6).

## forge-g2-runner-aca-job
**ACA Job `forge-g2-runner` in environment `taxila-forge-untrusted` (created 2026-10-03, eastus2, Consumption, no Log Analytics), image `forge-g2-runner:<context-hash>` built by ACR taxilacr from `infra/forge-runner/Dockerfile` (Playwright 1.63.0-noble base, non-root).** `scripts/forge-g2-deploy.mjs` uploads the working-tree context (`--from-github` builds the pushed branch). Each execution is started by trusted code (`azure-job.js startBuild`) with a template override: topic, build id and a 2-hour SAS (`sr=c`, https, racwdl) for `forge-g2-src` only — the runner never holds the storage account key, so it cannot write the public play origin. A crash before `run-build.js` reports is written by `job-entry.js`. Deviations from FACTORY §2.2, stated: the runner holds the AOAI key (no orchestrator gateway yet), the ACR admin password is reused from taxila-web (no scope-map token), Chromium runs without its own sandbox (see the measurement). **Reverse if:** the orchestrator gateway or ACA Sandboxes land — then the runner gets no AOAI key and the model loop moves out.

## forge-g2-harness-six-tools
**The G2 builder harness (server/forge/g2/harness.js).** taxila-codex over the Responses API (`previous_response_id` within a round, `prompt_cache_key` per archetype, `parallel_tool_calls:false`), six strict tools, one allowlisted file, budget footer on every observation, repeated failing action → note then end round, 3 format errors → end. Stages: S1 design by taxila-brain (strict schema) → S3 ≤ 12 steps → S4 ≤ 3 repair rounds with a fresh conversation and a handoff → S6 final gate on visible + held-out items (every third item held out; never shown to the builder) with a new seed and a rebuild-sha check → S5 one polish round fed by the advisory critic, kept only if the final gate stays fully green → Q8 → review queue. Deviation: `write_mechanic` (whole-file) is allowed beside `edit_mechanic` (search/replace with a trimmed-line second pass); the Codex apply_patch port and the day-1 transport test are not done. **Reverse if:** whole-file writes start truncating or drifting on mechanics > 300 lines (then port apply_patch), or M-F1 picks another builder.

## forge-g2-qa-gate
**The G2 gate (server/forge/g2/qa.js, truth.js, lint.js, safety.js; 2026-10-03).** Hard gates: Q1 allowlist AST lint (free identifiers ⊆ a fixed set, banned members, forged-ref literals, digits in text keys, points/coins/score identifiers) + size (agent ≤ 24 KiB, bundle ≤ 96 KiB); Q2 boot in a host page that mirrors ModuleHost (opaque-origin iframe, sandbox=allow-scripts, init + port), 0 console/page errors, 0 requests other than the bundle (Playwright route + dead proxy + resolver rules + WebRTC policy), 0 CSP violations, and an in-frame `fetch` that must be refused; Q3 0 kit contract/agent/budget findings and 0 error events; Q4 real pointer clicks at target centres to goal_met exactly once, one wrong path per level, a remove/add sweep for build items, a determinism replay; Q5 every answer re-derived host-side from the server's LevelSpec and re-graded against the raw kit file (misconception id must be the kit's); Q6 targets on screen, ≥ 48/38 px, font ≥ 14 px, no overflow, drawn words not clipped/overlapping/under a target; leak: drawn words never reveal the key (director revealsAnswer), key position not constant. Q8 per string (local predicates, Content Safety ≥ 2 blocks, brain classifier for hi/hi-Latn, all fail closed). Q9 critic advisory (not calibrated). Not built: Q7 performance under CPU throttle, Devanagari tofu check, a11y/axe, fun-floor timings, the tamper battery. **Reverse if:** the mutant corpus recall drops below 1.0 on a kit/gate change, or real-child crash/stuck rates show a class the gate misses.

## forge-g2-review-human-only
**Human-only approval (server/forge/g2/review.js, scripts/forge-g2-review.mjs).** A build that passed every hard gate is enqueued with its evidence (bundle, mechanic, design, QA report, frames, trajectory, ledger, cost, critic items). `decide()` refuses approval from names matching automation patterns; reject needs a reason and sets a 24 h cool-down; approval publishes the gated bytes and delivers to every waiting child. A test publish (automation allowed) goes only under `forge/g2/test/` and leaves the build pending. Child folders are `forge/g2/c/<HMAC-SHA256(childId)[:32]>/<day>.json` + `latest.json` with engine, url, sha, topic — params (keys) are rebuilt server-side at mount (serve.js), never stored public. **Reverse if:** the owner relaxes review with M-F2 gate-recall numbers (FACTORY §0.1 E2).

## forge-g2-nightly-job
**forge.g2.nightly (server/forge/g2/conductor-job.js; registered in server/conductor/config.js and imported by handlers.js).** Input `{day, tz?, topicIds?}`; topics = the child's ≤ 3 most frequent lesson topics of that learning day; per topic: approved → deliver for day+1; failed/rejected in cool-down → skip; else write a waiting marker and, if this call wins the If-None-Match in-flight marker (stale after 2 h), start one ACA execution under a daily breaker; a failed start removes its markers. Result codes only (no child data). The night-fold enqueue is NOT wired (decide.js is another workstream's): see open-forge-g2-integration. **Reverse if:** demand ranking (FACTORY §6.4) replaces per-child triggering.

## forge-g2-private-container
**Private G2 data in container `forge-g2-src` of `taxilaforge` (no public access; anonymous list → 404, checked 2026-10-03).** Layout: runs/<buildId>/, review/<buildId>/, queue/<status>/, catalogue/<identityKey>.json, waiting/, inflight/, breaker/<utc-day>/. **Reverse if:** the account-level separation of FACTORY §2.2 (`taxilaforgesrc`) is created, or a SAS-scoped role cannot be kept per container.

## forge-g2-q8-at-design
**Full Q8 at S1, before any build spend (2026-10-03).** `designMechanic(..., {q8})` runs Content Safety + the brain classifier on the strings table and regenerates a flagged design (≤ 3 attempts); Q8 runs again at the end (strings do not change, the classifier is non-deterministic). Measured effect: c7-maths-ch04-t03 was rejected at the end before (Content Safety severity 2 on "Belongs"), and passed after one redesign. **Reverse if:** Q8 false positives are fixed at the source (a calibrated Hindi classifier), making the extra design call pure cost.


<!-- merged from inbox/owner-2026-10-03b.json -->
## child-names-teacher (2026-10-03)
Owner: students should be able to choose the teacher, like Meta's custom AI agents. The child picks a character (look and voice) and names it; Asha, Arjun and Uma are suggestions. The name must pass a safety predicate: no real-person names from a denylist, no slurs, no romance or companion terms, and length and charset limits. The name lives on the child (an additive migration), is compiled into the persona and captions, and goes to the parent corner, which can change or reset it. AI disclosure is unchanged: whatever the name, she says she is an AI. **Reverse if** testing shows children pick names that break the teacher register, or that renaming weakens the AI disclosure.

## character-built-in-house (2026-10-03)
Owner: 'we should make the character ourself'. This replaces TEACHER-VISUAL's contracted-artist plan (30-40 artist-weeks). It is a scripted pipeline in headless Blender: licence-clean base meshes (MakeHuman/MPFB CC0 output or similar), ARKit-52 plus viseme shape keys generated by script, textures and look matched to the Codex teacher references in art/gen/teacher/, exported as glTF with Draco/meshopt and KTX2 per device tier. **Reverse if** the scripted heads fail the owner's eye test or the uncanny-valley check after two iterations; then revisit an artist for the hero tier only.

## build-before-panels (2026-10-03)
Owner: 'first complete the app and site then we will test and then later send out to sample pools'. Items the design spec gates on child or parent panels ship on our best judgement now, with the gate kept as the reversal condition.


<!-- merged from inbox/b1-shell-signalling-lesson.json -->
## b1-floor-machine (2026-10-03)
**Decision.** `src/lesson/floor.ts` reduces the eight floor states (idle, speaking, showing, yielding, your_turn, listening, heard, thinking) from `LessonRuntime.events` (every link event in order, plus the runtime's own `ui`, `settle` and `reset`) and local commits (module answers). YOUR TURN needs an open hand-over (`handover` in answer/choice/judge/ready/finish). Legacy mode (no turn has carried `ui.handover`) treats an absent handover as `answer`, exactly the old `statusOf`; the first turn with a handover switches the lesson to strict mode. A `settle` while a Director call is in flight is ignored (the held answer is not dropped). `statusOf()` got the same fix (a `handover` flag; `isFree()` replaces the runtime's internal "your_turn means free" checks). `yielding` is reached only from a `teacher_audio_ending {remainingMs}` event, which no link emits yet, so today her offset goes straight to your_turn on the same frame.
**Reverse** if V2-M1 shows children miss turns because the lamp lands after her voice ends (then build the TurnClock and emit teacher_audio_ending from the cascade player).

## b1-signals-one-transition (2026-10-03)
**Decision.** `src/lesson/signals.ts` fires the dock attribute + `[data-lamp]`, the earcon (`src/ui/sound/earcons.ts`, synthesised, pre-built buffers) and the haptic (`src/ui/haptics.ts`) from one floor transition, in a microtask, and only if the floor still holds that state. Under a sheet or any strip the lamp and the turn chime are suppressed (rule 3); the receipt tok and mic click still play.
**Reverse** if V-SIG-5 on a real device shows the microtask defer costs a frame (then fire synchronously and debounce the typed-over-her case instead).

## b1-outbox-retry-policy (2026-10-03)
**Decision.** `src/lesson/outbox.ts`: write before send (IndexedDB, memory fallback flagged `outboxVolatile`); automatic retries 1/3/6 s only when no HTTP answer arrived or the status is 408/429/502/503/504; anything else is held for "Send again". The wire request is unchanged on the first attempt; resends add `retried: true` and `turnSeq`. **Open item for the lesson route:** dedupe on (lessonId, turnSeq) and mark evidence from `retried` turns.
**Reverse** if the server dedupes on turnSeq (then 500 can retry automatically too).

## b1-strip-own-row (2026-10-03)
**Decision.** The trouble strip is its own Desk row above the dock; `deskLayout.solveDesk({strip})` takes its height from the elastic zone. 56 dp for one action, 96 dp when two actions do not fit beside the sentence at the container width.
**Reverse** if a device test shows the face shrinking on trouble distracts more than a strip over the caption row would.

## b1-verdict-before-next-ask (2026-10-03)
**Decision.** See title. Implemented in `src/child/lesson/useDesk.ts` (`nextAsk`).
**Reverse** if V2-M2 shows children read the old question as the current one while she speaks.


<!-- merged from inbox/forge-g2.json -->
## forge-g2-run-container-per-build
**One private run container per build; the runner's SAS reaches nothing else (2026-10-03, fixer for forge-g2).** `azure-job.js startBuild` (trusted, account key) writes the build record `builds/open/<id>.json` (topic, archetype, identity, execution) BEFORE starting, creates `g2run-<buildId>`, and passes `FORGE_G2_RUN_CONTAINER` + a 2-hour service SAS for that container only (`sr=c`, `sp=racwl`: no delete, https only). The runner (`run-build.js`, `job-entry.js`) writes `result.json`, `mechanic.js` and `candidate/*` there and nothing else; it never writes the queue, the catalogue or a marker. `review.js ingest()` (trusted) claims the open record by ETag, believes the record (not the runner) for topic and identity, re-hashes `candidate/bundle.html` against the gated sha, whitelists file names, copies the evidence to `forge-g2-src/review/<id>/`, enqueues it, clears only its own in-flight marker (If-Match), closes the record and deletes the run container. `containerSas` refuses to mint for `forge-g2-src`, `forge` or `forge-g2-test`. Ingest runs at the start of every nightly, in `forge-g2-review.mjs list|ingest`, and in `forge-g2-run.mjs`. **Reverse if:** the orchestrator gateway (FACTORY §2.2) lands and the runner holds no storage credential at all, or ADLS directory SAS (sr=d) becomes available on the account and a single container is simpler.

## forge-g2-opaque-refs
**tgk-lite@2: opaque refs, crypto shuffle, frozen intrinsics (2026-10-03).** Every ref the kit hands agent code is `{item, slot: "o:<64-bit crypto nonce>"}`, minted per item start; the token → `key` / `d:N` / `u:K` map lives only in the kit closure. Option order is shuffled with `crypto.getRandomValues` per mount (the seed no longer decides it). Before `agentFactory` runs the kit freezes Object/Array/Function/String/Number/Boolean/Symbol/JSON/Math/Map/Set/Promise/RegExp/Error* and their prototypes, the iterator prototypes, %TypedArray%, MessagePort and EventTarget, so a patched `Array.prototype.some` throws instead of changing what the kit posts. Agent code compares refs with `ctx.refs.same(a, b)` / `ctx.refs.indexOf(ref)`; reading `.slot` (member, computed, folded `'sl'+'ot'`, destructured) is `Q1.ref_read`; computed access on a local that aliases an ambient (`var O = Object; O[k]`) is `Q1.computed_on_ambient`. The kit posts the INTERNAL slot and a per-item `attempt` counter to the host. QA adds `leak.key_styled`: agent marks local to exactly one option, a mark only the key carries on every choice item fails. SHADOWED gains MessagePort, MessageChannel, EventTarget, Symbol, Promise, WebAssembly, SharedArrayBuffer, Atomics, structuredClone, getComputedStyle, customElements. The kit hash changed, so every G2 identity key changed. **Reverse if:** a mechanic class needs to know which option is right before the child answers (it should not), or freezing intrinsics breaks a measured mechanic and a membrane (separate realm) replaces it.

## forge-g2-ingest-pending-review
**Pending review is a catalogue state; failures back off; markers move by ETag (2026-10-03).** `enqueue` (called by ingest) writes `catalogue/<k>.json = {status: pending_review, buildId}` unless the identity is already approved; the nightly treats `pending_review` as join (the child is added to `waiting/`). Failures (`qa_failed`, `design_rejected`, `crash`, `lost`, `candidate_rejected`, …) and rejections write `failureEntry`: cool-down 1 d, 3 d, 7 d, then `triage` at 4 attempts (no automatic rebuild; a person clears it). Waiting children of a failed identity are released (they keep G1/T1; a later nightly re-adds them). In-flight markers: create-only (If-None-Match); a marker whose build has an open record is always joined; a marker with no open record older than 10 min is an orphan and is taken over with If-Match on the ETag just read (a conflict = join). A build with no result 60 min after start (replicaTimeout is 30 min) is closed as `lost`. `FORGE_G2_CHILD_SALT` is required (no fallback to the storage key; the nightly returns the final code `g2:no_salt`). Heavy modules load lazily inside `nightly()`, so the worker's boot import is two small files. **Reverse if:** the queue moves to Postgres (then row locks replace ETags), or measured per-identity failure rates show the cap strands topics that would pass on a retry.

## forge-g2-deliver-merge
**Child folders merge, never overwrite (2026-10-03).** `deliver()` reads `g2/c/<ck>/<day>.json` with its ETag, drops any module with the same sha or topic, appends, and writes If-Match (If-None-Match when new), retrying up to 5 times; `latest.json` is rewritten from the day file only when that day is not older than what it already points at. The module's `src` is always `bundleUrl(sha)`; the nightly additionally checks the approved review manifest's sha and status before delivering (a mismatch is counted, nothing is delivered). `publish()` delivers a waiting child for max(forDay, tomorrow) and drops waiting entries older than 7 days. **Reverse if:** child folders move behind an authenticated API (then the server composes the day's list per request).

## forge-g2-review-name-asserted
**Approval is name-asserted, unauthenticated, and says so (2026-10-03; supersedes the "human-only" claim of forge-g2-review-human-only).** `decide()` refuses: automation-looking names (word-boundary regex: claude, agent, bot, automation, ci, workflow, script, codex, gpt, model, llm, ai — "Abbott" passes), an approval without the CLI attestation `{method: tty-sha-confirm, shaPrefix ≥ 8 chars of the bundle sha}`, and a build whose recorded kit hash is not the kit this server serves. `scripts/forge-g2-review.mjs approve` requires stdin and stdout to be a TTY and the reviewer to type the sha prefix. The manifest records `approval.auth = "name-asserted, tty + sha-prefix confirm (unauthenticated)"`. This is a speed bump against an automated agent following instructions, not authentication: anything with the storage key can write the catalogue directly. **Reverse if:** an owner-authenticated admin route (or a signature from a secret only the owner holds) exists; then approval goes only through it (open-forge-g2-approval-auth).

## forge-g2-grade-guarantee
**gradeEvent states what it guarantees (2026-10-03).** Guaranteed: the value is re-derived from the server's LevelSpec, agrees with what the frame posted, and is graded against the raw kit. Not guaranteed: which option the child picked (or how many units) — that is the frame's claim, behind frozen intrinsics, lint, CSP and the person's review. Every evidence row carries `trust: "value_ref_consistent; graded_by_server_against_kit; selection_is_frame_claim"` and `attempt`; a payload without an integer attempt is `shape`; with the caller's per-lesson `seen` Set a repeated (module, item, attempt) is `duplicate`. `mountFor` serves only `bundleUrl(sha)` (64-hex sha) and returns null when a stored src differs. **Reverse if:** selection becomes server-observable (e.g. the host relays raw pointer targets), then the trust string changes.

## forge-g2-test-container
**Test publishes never share the play container (2026-10-03).** `decide({testPublish})` writes `forge-g2-test/g2/b/<sha>/index.html` (public blob read, created on demand) and leaves the build pending; nothing a child or the app can frame. The app's CSP must be `frame-src https://taxilaforge.blob.core.windows.net/forge/g2/b/` (path prefix; Blob does not redirect), never the account origin, which would also allow G1 content and child manifests. The legacy bundle `forge/g2/test/b/7766517d…/index.html` was deleted (GET → 404). **Reverse if:** approved bundles move to a dedicated play host, then frame-src names that host.

## forge-g2-q8-verdict-reuse
**Q8 after the build reuses the design-time verdict (2026-10-03).** `run-build.js` records the full S1 verdict with `stringsHash(design)`; `q8Gate` passes only when that hash matches the built design's strings, the verdict was ok, and `checkStringsLocal` still passes. The builder's code had kept a second full Content Safety + taxila-brain pass after the build, which can flip on the same strings (the waste recorded in forge-g2-q8-after-build). **Reverse if:** the strings table becomes editable after S1 (then Q8 must rerun on the changed rows only).


<!-- merged from inbox/lesson-truth.json -->
## lt-address-register
**The teacher's aap/tum register is resolved on the server and carried by the lesson (`state.ctx.address`, server/director/register.js `resolveAddress`): the child's own Hello pick (`LessonStartRequest.address`, honoured from class 5 up) → the parent's `child_controls.address` → the class default (aap from class 5, tum below; English lessons: none).** Kit questions are written in tum forms, so for an aap child `findItem` returns the item with `prompt_hi` converted by a closed lexicon (`toAap`: pronouns, every tum imperative/future form found in the kits, Devanagari included, the copula at the end of an addressed sentence; keys, acceptable answers, hints and options untouched); every reader of the posed question (compile, guards, classifier, Question card) gets that one text. Every real move carries a register note (never the voice branches, whose `last`-section budget checkFits measured without it); the text-lane guard catches tum marks (`registerBroken`), rewrites once, then converts the words in code. 0/10,707 loaded items fail checkFits after the conversion. (2026-10-03)
- Rationale: audit #7 — a Class 5 and a Class 8 "aap" child were greeted "tumhara… Tumhe…"; the register lived nowhere in the prompt.
- Reverse if: a reviewed aap rendering of the kits lands (then `toAap` is replaced by authored `prompt_hi_aap`), or a listening test shows the converted questions read unnaturally (then author them).

## lt-exact-match-gate
**`classifyFast` decides an exact key/option match by code only when the teacher's last turn posed the item (`posesItem`) or asked no question; after a DIFFERENT question (`askedOther`) the model decides, and a bare number that the other question itself stated is no evidence (source `echo`).** (2026-10-03)
- Rationale: audit #13 — "25" to "what comes after 25?" and "36" to an improvised "5 ka square?" were graded right (Parent corner: "Right · On their own") and confirmed ("Bilkul"): the exact-match shortcut never looked at what was asked.
- Reverse if: the text lane stops asking side questions on hint turns (then askedOther never fires) — or a hint-turn measure shows real answers lost (now 32/32 kept).

## lt-praise-guard
**Confirmations never contradict the verdict (G-PRAISE-1, on the bytes).** `step()` appends the classifier's verdict note to the move (not right / partly right / unverified), `planTurn` records `state.lastVerdict`, and `textReply` treats praise or agreement for an answer the key did not mark correct (and a "wrong" opening after a correct one) as a problem: one rewrite, then the praising sentences are stripped and the question re-posed. `UiDirectives.verdict` (+ `withHelp`) is set only from the verified-key classifier on a kit item; covert why / teach-back turns stay ungraded on screen. (2026-10-03)
- Rationale: V2 §4.6 / §4.10 and audit #13.
- Reverse if: an out-of-sample battery shows the praise lexicon blocking honest partial confirmations at a rate a listener notices (then narrow the lexicon).

## lt-screen-guard
**A teacher line that sends the child to the screen needs something on it in the same response (G-SAY-1): Director chips or a mounted module.** The unclear-repair shape says "tap one of the choices on screen" only when chips exist; `screenProblem` in the text-lane guard rewrites, then strips the screen sentences and re-poses the item. Voice lane: flagged (`screenRef`) on the turn row. (2026-10-03)
- Rationale: audit #6 "60 mein se choice tap karo" with no choices; the repair shape itself said "or to tap a choice" on every item.
- Reverse if: the client shows tiles the Director did not send (then the predicate must read the client's tray state).

## lt-child-plan-map
**`server/routes/child.js`: GET /api/child/plan (one home state: resume > capped > done > resting > first > start; today's topic with a ≤ 24-char title and minutes; today's DidCards; the teacher record; `surfaces` hidden under "Only this session"; the legacy `homeState` for src/child/day.ts), GET /api/child/map (class syllabus × kit skills × skill_state → not_started / practising / got_it / secure via routes/parent.js parentState, chapter seals only when every skill is got it or secure, "here" = the next planned topic's chapter, re-checks only from weave_queue or a missed delayed check), GET /api/child/teacher (?childId or ?classLevel for onboarding), POST /api/lesson/request (grants only start/first/resume — never "one more").** requireChild on every child id (uuid-checked: 400, not 500); nothing behind the parent PIN. (2026-10-03)
- Rationale: audit #9, both reads 404 in production; V2 §6.3.3 and §3.8.
- Reverse if: the Conductor's day_plan becomes the only source of the home state (then plan reads it and stops recomputing), or the school position is known (then `here` uses it, not the next planned topic).

## lt-teacher-card
**One teacher record for every surface: `teacherCard(c)` (characters/index.js) = id, name, addressedAs, pronouns (now on each character sheet), voice, look rev and colour; returned by lesson start, the plan, the summary and /api/child/teacher. The lesson-end writer is given the teacher's name and pronouns (Arjun is "he"; the child is named or "they").** (2026-10-03)
- Rationale: audit #4 — three faces, two names, two genders; "How she teaches Riya" while the teacher was Arjun.
- Reverse if: a teacher's presented gender changes (one field on the sheet).

## lt-summary-did
**The summary screen's facts are the lesson's own record of graded turns (`state.did`, session state, every legal mode), never the model's account: `lessonSummary` gives ≤ 3 cards (verified right answers first, unaided first, the latest attempt per item; a teach-back pass), a tick only when the kit's key verified it and it was not leaked, `tried` only when nothing was verified, `face: "warm"` always (ReactionGate), the next topic's title and the child turn to re-voice.** (2026-10-03)
- Rationale: audit #12 — the summary showed clipped board strings and nothing the child did; V2 §6.3.5 / PX1.
- Reverse if: the client needs per-card media (then the card carries a tray still id from the module log).

## lt-floor-wired
**`floorViolations` is called by lesson.js (closing `open-never-rules-wiring` for the reply paths): text lane as a guard problem (one rewrite with the FLOOR_FIX shapes, then the move's fixed line — the safeguard line carries Childline); voice lane on the heard teacher turn → `state.correction` for the next compile, and a `floor` flag on the row.** scrubPii and the voice-lane incident row are still not wired. (2026-10-03)
- Reverse if: the floor families move into compile's own post-check.

## lt-ui-directives
**The Director now produces V2 §4.10's UiDirectives: `ask` (the kit item's question in the child's register, ≤ 120 chars, pinned on item turns; on a text-lane turn with no item, the question the reply actually handed back), `handover` (answer / choice / finish), `answerForm`, `phase`, `tray` (none when nothing is mounted: the Face layout), `shortTitle`, `verdict` / `withHelp`. Explain turns no longer put the skill title (a syllabus objective) on the board (G-OBJ-1), and chip labels are English in every lesson language.** (2026-10-03)
- Reverse if: the signalling client derives any of these itself (then the server stops sending that field).

## lt-interests-shapes
**The parent's interests reach the teacher through the move shapes (greet: today's topic tied to the interest; hook: built on it; explain: an example from the second one), not only through the brief row that sheds first under the budget — and only under the memory consent ("Remember what {child} likes"), as plain labels of ≤ 24 letters.** (2026-10-03)
- Reverse if: the brief row becomes never-drop (then the shapes need not repeat it).


<!-- merged from inbox/b1-shell-signalling-lesson.json -->
## b1-card-sized-to-content
The Desk measures `[data-measure="card"]`, `[data-measure="strip"]` and `[data-measure="tray"]` (the NumberPad) after every render (useLayoutEffect + ResizeObserver + fonts.ready) and reports cardNeed / stripNeed / trayNeed with the container size. `solveDesk` treats the §6.3.4 heights as floors: card = max(spec, need), strip = max(estimate, need), Work tray ≥ max(trayMin, need). The extra height is taken tray → face (to faceMin) → caption → pad, then the tray below its floor (a strip is transient; the dock must stay on screen); still short → overflow (the Desk scrolls). Strip actions are full targets (48 dp Older, 64 dp Young) and wrap under the sentence. Why: a fixed card clipped the answer chip, the verdict line and the hint at 360. Reversal: a card whose content is bounded by construction.

## b1-outbox-turnseq-always
src/lesson/outbox.ts: `reserve(lessonId)` seeds from the store; every attempt sends `turnSeq`; resends add `retried: true`; `edit()` adds `edited: true` under the same turnSeq; a per-attempt deadline (25 s) aborts a hung request (retryable); `kick()` abandons the attempt in flight or the wait before the next retry. src/lesson/runtime.ts: `retryNow()` (T1 Try again), `fixAnswer()` (Fix), `flushOthers()` at start (answers held for an earlier lesson are sent, marked retried, and that lesson closed; 409 ended / 404 drop; > 24 h dropped), the `online` event kicks a sleeping retry (RC within 3 s). OPEN for the lesson route owner: dedupe on (lessonId, turnSeq) and treat `edited: true` as superseding the earlier attempt; accept late turns for a lesson closed by page-hide, or held answers of that lesson are dropped on the 409.

## b1-vsig3-6pct-restored
The battery's V-SIG-3/4 bar is back to 6% of the dock + card region, as §13.2 says. Heard shows a solid ink receipt disc in place of the mic and hides the side controls for its 400-600 ms; speaking/showing hide the side controls (the mic stays for barge-in). Deviation: the yielding/your_turn pair is exempt (one signal in two phases).

## b1-hear-replays-posing-turn
LessonState gains replySeq/replyText (set just before the ui of the turn they came with); the pinned Ask records them; UiBridge clips carry their TTS seq and `replay(slower, seq)` picks that clip. Fallback: `runtime.replayReply({text, seq})` speaks the stored turn again (text lanes), then her last clip.

## b1-ui-v2-flag-not-restored
Proposed, needs the owner. See the title for the open acceptance rows.


<!-- merged from inbox/b2-home-progress-assets.json -->
## b2-art-pipeline
scripts/gen-assets.mjs (`--strict` is the B2-A2 acceptance run: every shipped id present, 0 pending, budgets, lint, provenance, OCR). Budgets [I]: backgrounds 120 KB at 1x, phone 60 KB, spots/states/tiles 40 KB, avatars/pictograms 16 KB; 2x provisional at 3x the 1x budget. 1x CSS widths per category are in `shipPlan` (bg wide 1280, phone 360, stage 480, sky-panel 800 + a 360x640 crop, picto 64, avatars 112, states 240, garden plants 112). Brand icons and the OG card pass through unchanged. Client: src/child/art.tsx (`<Scene id="home-young">` picks -phone / -wide with srcset 1x/2x and the LQIP; `<Spot id=… size=…>`), compatible with B1's src/ui/Art.tsx which reads the same manifest's `url`. Tier D (`?tier=D`, Save-Data, deviceMemory ≤ 1, prefers-reduced-data) loads no background. Known issue for the server owner: server/serve.mjs serves all of /assets/* as immutable for a year, which includes /assets/gen/manifest.json; a new deploy's manifest can be shadowed by a cached old one. Hashed image names are safe; the manifest needs no-cache (or a hashed name).

## b2-home-plan-fallback
src/child/plan.ts (`fromServer`, `fallbackPlan`, `usePlan`; unit-tested in tests/ui-v2-b2.test.mjs). The home exposes data-plan-state / data-plan-source.

## b2-garden-started-beds
src/child/progress/layout.ts `gardenBeds`.

## b2-sky-edges-syllabus
src/child/progress/prereqs.ts (`loadPrereqs`, `visibleEdges`); star hit targets are 48 px HTML buttons over the SVG (layout keeps ≥ 48 px between centres at 360).

## b2-clip-own-teacher-only
src/child/voice.ts `helloClip(teacherId, lang)`.

## b2-onboarding-order
src/onboarding/index.tsx, Layout.tsx (STEPS / ADD_STEPS, scroll + focus + title), steps/Class.tsx, steps/Meet.tsx, Consent.tsx (PromisesStep), Account.tsx (no hold gate), ChildProfile.tsx, Setup.tsx (PIN + handover). The consent rows' ▶ still read the server-held CONSENT_SPEECH text (server/routes/parent.js), which was written for the old gendered copy: the parent workstream should re-align it with the on-screen rows.


<!-- merged from inbox/lesson-truth.json -->
## lt-address-parent-first
**The teacher's aap/tum register is the parent's choice: `resolveAddress` = `child_controls.address` → the class default (aap from class 5, tum below; English lessons: none). `LessonStartRequest.address` is removed.** (2026-10-03, supersedes lt-address-register's precedence; the kit conversion, register note and reply guard are unchanged.)
- Rationale: V2 §3.2 step 6 (the parent picks Casual / Respectful) and §3.3 step 4 ("From her first sentence she uses the address term the parent chose"); Hello has no aap/tum card. The previous order let an unstored client value outrank the parent and change between lessons.
- Reverse if: the spec adds a Hello card for the child's own pick — then store it (child row or controls) and decide its rank against the parent's setting there, never per request.

## lt-start-gate
**POST /api/lesson/start enforces the plan (`startRefusal(plan.state, body.purpose)`): capped and resting refuse every start; done refuses a lesson and lets `purpose: "practice" | "doubt"` through; start / first / resume start. A refusal is 409 `LessonStartRefused { error, state, opensAt, capRemaining }`.** planFor runs alongside the consent and topic reads and is checked before the kit read, any model call or write. (2026-10-03)
- Rationale: the daily cap, the lesson hours and "never one more" are parent-control promises (V2 §3.4, §6.3.3, §6.5.4); only /api/lesson/request checked them, so a stale tab or a direct call could open a lesson past them.
- Reverse if: Practice and Ask get their own start route (then start refuses "done" for every purpose), or the Conductor's day_plan becomes the only authority (then start reads it).

## lt-done-rule
**An ended lesson counts as "Done for today" only if `state.did` holds a graded turn or it ran ≥ 5 minutes (`countsAsDone`); the next start closes an open lesson older than 2 minutes in which the child never spoke (`state.abandoned`), which never counts.** (2026-10-03)
- Rationale: V2 §3.13 wants designed flows; an accidental End or a crash seconds in locked the child out for the day, and zero-turn open lessons piled up.
- Reverse if: a real lesson can end with nothing graded inside 5 minutes and still be "the lesson" (then lower the floor or count child turns).

## lt-short-titles
**`shortTitleOf` uses the authored table `server/director/short-titles.json` (every one of the 380 curriculum topic titles over 24 characters), else the title's lead clause (before ":", " — ", "(" or ","), else whole words ending before a joiner, else null.** A unit test walks every curriculum topic. (2026-10-03)
- Rationale: V2 §4.10 "Never a CSS-truncated chapter name"; the word cut gave 84/380 fragments or bare first words.
- Reverse if: the curriculum graph gains an authored `shortTitle` per topic (then read it and delete the table).

## lt-praise-effort
**G-PRAISE-1 strips warmth about the question, a try or the thinking before it looks for praise; "Right," is a discourse marker ("Right!"/"Right." still count); `verdictFor` returns "ungraded" for a no-evidence turn where the child asked a question.** (2026-10-03)
- Rationale: "Great question! Socho…" on an unverified turn cost a 1-2 s rewrite and could lose the warm sentence.
- Reverse if: a battery shows "great question" used as a disguised confirmation of a wrong answer.

## lt-choice-echo
**The echo rule skips a choice question ("Kya yeh 25 hai ya 30?", "26 or 36?", "25, 30 ya 35"); a thousands comma is not a list.** The model decides those turns (no exact match after another question). (2026-10-03)
- Reverse if: a measure of choice-style hint turns shows the model mis-crediting picks.

## lt-inclusive-chalo
**An inclusive "chalo" (with hum, a "-te hain"/"-ein" verb or an aap form later in the sentence) is not a tum mark; for a tum child aap forms break the register only when nothing in the line addresses the child with tum.** (2026-10-03)
- Reverse if: listeners hear "Chalo, aap…" as the wrong register for an aap child.

## lt-safeguard-both-lines
**The fixed safeguard line names Childline 1098 and Tele-MANAS 14416 (from compiler/floor.js HELPLINES) in English and Hinglish, and in aap forms for an aap child.** (2026-10-03)


<!-- merged from inbox/teacher-character.json -->
## teacher-character-pipeline (2026-10-03)
The teacher characters are built by one command, `node scripts/character/build.mjs`, with no artist and no paid or third-party character service. Inputs are all CC0 (`art/character/LICENSES.md`): the MakeHuman base mesh and modelling targets via MPFB 2.0.17 (GPL code, offline only), the faceunits01 and visemes02 packs, and the MakeHuman teeth, tongue, brow, lash and hair proxies. Our scripts add the identity (targets plus seeded asymmetry plus a 3% head scale), the lip seal, the Hindi tongue keys (`tongueTipUp`, `tongueCurl`, `tongueWide`), 7 correctives (12 keys, sided where a parent is sided), our eyes (cornea plus iris parallax), garments and accessories, procedural skin maps rasterised in the face's own UVs, and KTX2 + meshopt H/B+/B-lite GLBs plus B+-rendered D plates. The look ids are `teal`, `slate` and `plum`, and no asset carries a name, because the child names the teacher. Full detail: `docs/design/teacher/CHARACTER-PIPELINE.md`. **Reverse if** the owner's eye test fails after two iterations (per `character-built-in-house`). In that case keep this pipeline for rig, keys, tiers and export, and bring in an artist only for the identity sculpt, hair and garments on the hero tier.

## teacher-runtime-contract (2026-10-03)
src/avatar loads `public/assets/teacher/<look>/{H,Bplus,Blite}.glb` and `runtime.json`, using GLTFLoader with KTX2Loader and MeshoptDecoder. `scripts/character/viewer/rig.js` implements the head.ts `HeadRig` contract (`apply(bs, head, gaze, lean, breath)`), so the M0 driver stack is unchanged. The rig applies these rules after the compositor:
- Visemes fold into ARKit keys on B+.
- Calibration gains of 1.2-1.6 apply to smile, squint and brow.
- Lid follow goes through the eyeLook keys.
- Each corrective's weight is the product of its parents.
- Wrinkle-region weights come from the final weights.
- The head splits Neck 35% / Head 65%.

Trap: positions are quantized, and for skinned meshes the dequantisation sits in the inverse bind matrices, so world landmarks must be computed through `getVertexPosition`. **Reverse if** the avatar workstream needs a separate jaw bone, or per-mesh morph splitting for memory (E-T7).

## teacher-skin-g9-solved (2026-10-03)
The teacher skin albedo is the Monk Skin Tone hex of the look's band, multiplied by a per-look per-channel `skin.albedoGain`. The gain is solved by `scripts/character/g9.mjs --solve` against the RENDER: the H tier under TaxilaSkin and the stage light rig (`shaders.js` LIGHTING, Neutral tone mapping, exposure 1), emotion `warm`, cheek / forehead / jaw patches, CIE L*a*b*, damped per-channel update. The gate is |dL*| <= 3 and |dC*| <= 4 (TEACHER-VISUAL H7, G9). The rig ships in `runtime.json.lighting`, and the runtime must render with it. Why: iteration 1 used a designer hex as albedo under a brighter rig and rendered every look about 23 L* too light at about double the chroma, which lightens Indian skin. The raw MST hex is also wrong as albedo: it rendered too dark and too saturated under the rig. **Reverse if** an on-device lookdev (H13) under the real stage background measures outside the band; then re-solve against that rig, never by eye.

## teacher-canvas-opaque (2026-10-03)
The teacher's WebGL2 context is created by hand with `alpha: false` and passed to three (`{ canvas, context }`). Why: hair, brow and lash cards use alpha-to-coverage, which writes the fragment alpha into the drawing buffer. three r180 always requests an alpha context (it only emulates `alpha: false`), so the page composited every card edge. That produced iteration 1's tan, patchy brows and bright card edges. `src/avatar/three/stage3d.ts` (`alpha: true`) must change before the factory GLBs ship. **Reverse if** the stage needs a transparent canvas; then add a final alpha-to-1 pass, and never alpha-blend the cards (Mali Early-Z).


<!-- merged from inbox/b2-home-progress-assets.json -->
## b2-home-no-lying-signal
src/child/plan.ts (`RESUME_BY_ID`, `practiceOffered`, `serverState`, `packReady`, LOADING), src/child/screens/Home.tsx (loading card, offline by packReady, aria-labelledby on the card). Unit-tested in tests/ui-v2-b2.test.mjs. This keeps b2-home-plan-fallback's fallback rules (404/5xx/timeout → start with cached topic; done marker; offline) and adds the three no-lie rules.

## b2-child-type-rem
src/child/child.css top block. The rule `.tx-child :is(.cs, .cs-gate)` scopes it; ChildScreen and Hello both render `.cs`.

## b2-garden-raised-beds
src/child/progress/Garden.tsx (GardenGround, BedSign, SubjectEmblem, HereFlag). Still only started beds + the class's chapter (gardenBeds, unchanged); this node supersedes b2-garden-started-beds only in layout, the bed-selection rule stands.

## b2-notebook-device-source
src/child/screens/Notebook.tsx (`SUMMARY_CONCURRENCY`, localStorage key taxila.child.<cid>.nbsum).


<!-- merged from inbox/b3-parent.json -->
## b3-parent-claim-gate
server/routes/parent.js (claimHolds, evidenceTally, homeHeadline, HOME_COPY, headlineLines, homeSpeech), src/parent/claims.ts, src/parent/Home.tsx. Tested in tests/ui-v2-claims.test.mjs and tests/account-delete-db.run.mjs.

## b3-account-deletion
server/routes/account.js deleteAccount; src/parent/Pages.tsx DeleteAccount (intro → password → 2 s hold → receipt in Gate.tsx Erased).

## b3-alert-only-when-released
server/routes/parent.js alertOf + ALERT_RELEASED_SQL; src/parent/Pages.tsx Help copy. Tested in tests/account-delete-db.run.mjs (safety alert) and the battery (V-SAFE).

## b3-erasure-waits-for-safeguarding
server/routes/account.js SAFETY_OPEN_SQL, safetyFirst, erase (deleteAccount and deleteChild); src/parent/copy.ts erase_review sentence. Tested in tests/account-delete-db.run.mjs.

## b3-try-at-home-one-state
server/routes/parent.js reconcileTryAtHome (homeData). Tested in tests/ui-v2-claims.test.mjs and the battery (V-ONE).


<!-- merged from inbox/b4-polish-site.json -->
## b4-site-no-teacher-name
src/app/landing/Landing.tsx (hero cast, 'picks the teacher' section), src/app/landing/Site.tsx (LOOKS, RigPortrait). V-COPY in the battery fails any he/she/him/his outside the sample child's evidence rows.

## b4-site-real-shots
public/landing/shot-{lesson,garden,parent}.webp. Captions are alt text describing the real screen.

## b4-hero-art-lcp
index.html inline preload; Site.tsx useArtEntry + HeroArt; Landing.tsx heroReady. The gzip arm of V-PERF is the gate (LCP <= 2.5 s on Fast 3G + 4x CPU); the uncompressed number is reported as a server-owner item.

## b4-lint-content-vs-chrome
scripts/lint-ui.mjs CONTENT, stripScriptRanges, L-HING, ALLOW (dev pages: L-HEX only). Controls live in tests/e2e-design-b4-polish-site.mjs (L-UI).

## b4-brand-mark
Re-run: PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node src/app/landing/brand.mjs. src/ui/Icon.tsx#Mark (the app shell's old book mark) is not yet the new glyph (src/ui owner).

## b4-site-faces-are-picker-looks
src/app/landing/Site.tsx SITE_TUTORS + TeacherPortrait (Plate2D still); Landing.tsx hero-cast and pick-cast. The rig plates under public/assets/teacher/ are left in place for task 16, unreferenced by the site.

## b4-site-no-hear-player
Landing.tsx header comment; battery V-AUDIO with NO_NAME_CLIPS.

## b4-site-spec-deviations
Landing.tsx hero; landing.css hero-art height.

## b4-site-claims-shipped-only
Landing.tsx (STATES, FAQ, parent section, pick note), promises.ts SITE_PROMISES[0], Public.tsx Help.

## b4-lint-scoped-exemptions
scripts/lint-ui.mjs stripContent, LANG_SCOPE, CONTENT, stripScriptRanges, visibleText; src/modules/frame/kit/i18n.ts chrome(). Controls: tests/e2e-design-b4-polish-site.mjs L-UI (18 cases) and tests/ui-v2-lint.test.mjs.

## b4-plate-stud-silver
src/styles/tokens.css --face-stud; src/avatar/Plate2D.tsx.

## b4-share-card
index.html og:*; brand.mjs SHARE_HTML.

## b4-promises-data-module
src/app/promises.ts; src/onboarding/Consent.tsx import.


<!-- merged from inbox/lesson-safety-naming.json -->
## lsn-floor-wired-transcripts
`server/routes/lesson.js`: `floorContentOf(item)` (the call-site recipe), `floorIncidentStmt(childId, lessonId, seq, families, lane)` (kind `floor_violation`, severity high, detail `{source: teacher_transcript, lane, families}` — family names only), `FLOOR_INCIDENT_FAMILIES = [ai_denial, helpline, romance, exclusivity]`. Voice lane: the heard transcript is judged with `requireHelpline` when the last move was a safeguard and `goodbye` on a wrap, → `next.correction` + `meta.floor` + the incident. Text and cascade: `textReply` returns `floor` for its FINAL words (what TTS speaks); non-empty only if even the fixed line broke a rule. Start's text-lane opening gets the same. Closes the voice-lane incident half of `open-never-rules-wiring` (lt-floor-wired said it was not wired). **Reverse** per the entry's title.

## lsn-scrub-at-model-boundary
`textReply` masks every user message (history and the turn); `server/director/classify.js` masks the text handed to the classifier and the distress check (classifyFast keeps the raw bytes for exact key matches and the safety predicate); `gradeRequestFor` masks the blind grader's input; lesson end masks the child turns it sends and drops memories with an identifier or a copied mask. **Reverse** per the entry's title.

## lsn-turnseq-dedupe
`turnSeqOf`, `replayFor`, `sendReplay` in lesson.js; `state.acks` (≤ 16) and `state.lastAck` written with the turn. The voice lane's replay recompiles the current instructions (they are never stored). **Reverse** per the entry's title.

## lsn-edit-supersede
The mark: `update lesson set state = jsonb_set(state, '{supersede}', $turnSeq) where … and not (state->'acks' @> [{turnSeq}])`; the commit guard of a non-edited attempt adds `and coalesce((state->>'supersede')::int, -1) <> $turnSeq`; a GUARD_FAILED loser re-reads and answers the replay, or 409 'this answer was replaced by an edit'. **Reverse** per the entry's title.

## lsn-late-after-pagehide
`endedByPageHide(req, body)`, `acceptsLate(lesson, turnSeq)`, `LATE_TURN_MS = 24 h`. No client change was needed: `src/lesson/api.ts endBeacon` already sends text/plain. **Reverse** per the entry's title.

## lsn-ui-hint
`server/director/state.js hintFor(move, item, rung)`; the hint plans carry `hintRung`. The B1 client already renders `ui.hint` (lightbulb + rung dots). **Reverse** per the entry's title.

## lsn-teacher-name-predicate
Files: `shared/tutors.js` (TEACHER_NAME, NAME_SUGGESTIONS, normalizeTeacherName, teacherNameShape, teacherNameSuggestions), `server/compiler/characters/naming.js` + `name-denylist.json`, `server/routes/tutor.js` (`POST /api/tutors/name`, `GET /api/tutors/name`, GET /api/tutors adds name/characterName/custom/suggestions; CHOOSE_SQL resets the name on a switch with a `switch` history row), `db/migrations/011_teacher_name.sql` (child.teacher_name + teacher_name_at with a shape CHECK; `teacher_name_history`, classified m0_delete in server/learner/mode.js). The child names the teacher freely; the parent's reset needs the Parent-corner gate (requireParentIfPinSet). **Reverse** per the entry's title.

## lsn-name-pinned-disclosure
`server/compiler/characters/index.js`: `named(c, name)`, `characterForState(state)` (used by `server/compiler/instructions.js`), `teacherFor` (the child's checked name), `teacherForLesson(child, pinnedId, pinnedName)`, `teacherCard` adds `characterName`. `server/director/shapes.js greet` adds the renamed note when `ctx.renamed` (start compares the last lesson's pinned name). Client: `src/ui/teacher/useTeacher.ts` TeacherNameProvider / useTeacher; `src/child/ChildShell.tsx` provides the saved name; `src/child/lesson/LessonScreen.tsx` the pinned one; the naming step `src/child/teacher/TeacherNamer.tsx` in Hello (every child, after the AI card; after the pick when two are offered) and Your teacher (Change name; after a switch); the parent row `src/child/teacher/ParentTeacherName.tsx` mounted in `src/parent/Controls.tsx`. **Reverse** per the entry's title.

## lsn-name-predicate-rev2
`server/compiler/characters/naming.js`: `deniesAi(name)` (AI_DENIAL_ANYWHERE, AI_DENIAL_AT_WORD on the folded name, then `floorViolations` on the two self-introduction lines), `gluedDeny(str)` (the LEAD*/WORD/TRAIL segmentation, GLUE_MIN 3, PREFIX_ONLY gf/bf); romance 'contains' now compiled. `name-denylist.json` rev 2. Corpora: `evals/teacher-names.data.mjs` ALLOWED (165), ALLOWED_WIDE (368), ADVERSARIAL (74, the reviewer's), ADVERSARIAL_FIGURES. Tests: `tests/teacher-name.test.mjs` (wide corpus, adversarial, no passing name breaks ai_denial). **Reverse** per the entry's title.

## lsn-late-disclosure-helpline
`server/routes/lesson.js` turn(): `lateSafeguard` → `safeguardLine(state.ctx)` staged as a teacher row; outCore late carries move safeguard + teacherReply + teacherReplySeq. `shared/contracts.ts` TurnResponse.late doc. Client: `src/lesson/runtime.ts` LessonState.lateSafeguard (set in flushOthers), `src/child/lesson/useDesk.ts` raises the Help sheet. Tests: lesson-safety.test.mjs (safeguardLine; runtime flush raises lateSafeguard only for a late safeguard), DB suite (route). **Reverse** per the entry's title.

## lsn-replay-after-gates
turn(): `replayFor` computed first, returned only after the 409 ended check and the consent check. **Reverse** per the entry's title.

## lsn-scrub-teacher-turns
textReply history maps every row through `scrubbed`; turn() `heard` scrubbed; gradeRequestFor's echo scrubbed. **Reverse** per the entry's title.

## lsn-one-name-everywhere
`server/routes/account.js` `clientChild` (me, updateChild), updateChild's switch statement; `server/routes/tutor.js` `nameRateLimit` (NAME_TRIES_PER_MIN 20), GET name adds characterId + band; `server/routes/voice.js` styleForChild(…, pinnedName); `src/child/teacher/TeacherNamer.tsx` (source, onGateError, title, parent button classes; Keep/Go back), `ParentTeacherName.tsx` (Change), `naming.ts` copy, `teacher-name.css` (.tn--parent, .ptn-actions); `src/child/screens/Hello.tsx` passes current. **Reverse** per the entry's title.


<!-- merged from inbox/teacher-bakeoff.json -->
## teacher-bakeoff-verdict
**The teacher face is the ai-portrait-wrap identity on the procedural-v3 expression stage, hair and garments. The identity is gpt-image-2 references from `taxila-image`, a MediaPipe closed-loop landmark wrap (symmetrised on the topological mirror) and de-lit projected skin. stylised-premium is rejected. The merged build is not made yet.** (2026-10-03)
- Rationale:
  - Of the four rows in `docs/design/teacher/bakeoff/COMPARE.png`, only ai-portrait-wrap reads as a specific human. The others are one MakeHuman face with three different finishes, and both their own docs call the face the ceiling.
  - ai-portrait-wrap's 57% used the iteration-2 presets and face units. v3's expression stage moved the same judge from 37% to 85% on the old face, and it is a build stage that can move onto the wrapped basis.
  - v3 supplies the hair, the garments and the subdivided H mouth and lids. ai-portrait-wrap's own hair and garments are still the weakest parts of its sheet.
- Reverse if either holds:
  - the merged teal cannot keep a front NME of at most 1.2% and at least 70% on 8 of 9 stills at n = 12 under a held-out judge, both at once;
  - the owner's eye test or E-T4 prefers the v3 or stylised face for warmth.
  Revisit stylisation only with a designed stylised base, never a fielded MakeHuman, and only on child-panel evidence. Plan: `docs/design/teacher/bakeoff/VERDICT.md`.

## teacher-encouraging-is-motion
**Encouraging is judged on a 1-2 s clip with the nod, not a still.** (2026-10-03)
- Rationale: 0 of 108 judgements over about 29 still designs on two faces (v3 17 variants, stylised 12). It reads as warm, sometimes playful.
- Reverse if a still variant reaches 70% on the same judge.


<!-- merged from inbox/owner-2026-10-03c.json -->
## teacher-human-first-gpu (2026-10-03)
Owner, after seeing the bake-off: none of the three looks is good enough. The main loop picks the interim look; the realistic human direction is to be taken as far as possible once an Azure GPU is available (neural head reconstruction from portraits, texture synthesis). Only then does the owner decide between human and a cartoon or animation model. The in-house rule stands: no contracted artist. **Reverse** to a stylised or cartoon model if the GPU-backed human face still fails the owner's eye test.


## b3-parent-counted-lesson (2026-10-03)
A lesson counts on parent surfaces (Lessons this week, 'first lesson', Recent lessons) only when it ran ≥ 5 minutes or something in it was graded and it was not an abandoned start (COUNTED_SQL, the same rule as child.js countsAsDone). Shorter visits are listed in Lessons as 'Short visit, not counted as a lesson'. Interim for audit #20's doubt-counted-as-lesson: lesson rows do not record purpose (lesson|practice|doubt). Reverse when lesson.js stores the start purpose: then a doubt shows as 'Question: {topic}' by purpose, not by length.
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


## b3-parent-try-at-home-from-letter (2026-10-03)
Parent home 'Try at home' is the weekly letter's home activity (server/reports Lane A preview of this ISO week: a reviewed template, gate-passed, with its own How-do-we-know tap-through to the kt_evidence rows), not lesson.parent_note (model text the audit read as system voice). Picture chips show only objects the sentence names (maths → home/roti). Done / Not this week log {period} to audit. Reverse if the weekly home activity is too rarely admitted (then a reviewed per-topic home task authored in the kits).
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


## b3-parent-text-english-voice-family (2026-10-03)
Notes (daily note, weekly letter) render the English text only; Listen plays the stored spoken script in the family's report language (§3.12). The language switcher and the Devanagari chrome tables in Report.tsx are gone (G-EN-1). Reverse if parents who read Hindi ask for Hindi text in pilot (then the text joins [data-speech] content, never chrome).
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


## b3-parent-errors-are-sentences (2026-10-03)
Parent-corner errors go through src/parent/copy.ts parentError: known server codes (password_wrong, too_many_tries, pin_wrong, pin_shape, pin_weak, password_needed, confirm_needed; added to parent.js/account.js errors, additive) map to sentences; everything else is 'Something went wrong. Try again.'. Password errors sit on the password field (PasswordAgain = ReauthField's anti-autofill + a field error with aria-describedby). Sign-in (login mode) errors in src/onboarding/Account.tsx are field-level too; signup-mode errors are the onboarding workstream's.
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


## b3-signin-next (2026-10-03)
Sign-in ?next= (src/onboarding/next.ts safeNext + Account.tsx): a ?next= makes sign-in the default form (the gate, a lesson's T8 and first-run 401s send returning parents there; LessonScreen and the steps sent ?next= without login=1, which showed 'Create your parent account'); an already-signed-in visitor with ?next= goes straight there; next must be a same-origin path, not //host, not /\host, no control chars, never /start/phone itself.
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


## b3-one-parent-label (2026-10-03)
One parent name per skill: /api/parent/evidence, /api/parent/lesson and /api/parent/syllabus all send `label` (parentLabelOf: kit parentLabel, else the title with its first letter lowered) and every surface shows it (src/parent/copy.ts labelTitle raises the first letter for stand-alone titles). The Lesson card no longer shows lesson.parent_note (model text; audit #20's system voice) and its Listen speaks lessonSpeech (the card's own counts). Progress takes its per-topic skills from /api/parent/syllabus and no longer calls /api/parent/overview. Reverse if: kits author parentLabel (then nothing changes on the client) or a reviewed per-lesson summary lane exists.
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


## b3-signup-next-consent-first (2026-10-03)
src/onboarding/Account.tsx: ?next= is honoured only for a returning parent (login, or already signed in). A fresh signup with ?next= goes to /start/consent, never straight into the corner with no consent and no child. Reverse if: a signup entry point needs to resume somewhere other than consent (then it must pass through consent first).
(Recorded by the wave-5 parent-corner workstream, inbox/b3-parent.json.)


<!-- merged from inbox/leak-not-echo.json -->
## leak-not-echo (2026-10-03)
lesson-truth's echo rule (classifyFast: a bare number the teacher's OTHER question stated is no evidence) also swallowed the case where the teacher blurted this item's key ('Socho... answer hai 169, bolo?'). The child's repeat was dropped, so the learner model never saw that the child needed the answer given, and the inherited rule 'a key said aloud on the lane = hintsUsed 4' stopped firing. Caught by tests/lesson-api-e2e.mjs (2 FAILs: hintsUsed 4, evidence rows 0). askedOther() now returns false when revealsAnswer(heard, item) holds; a regression test is in tests/lesson-truth.test.mjs. **Reverse if** leaked-key turns are shown to teach the model something wrong when counted at hintsUsed 4 (then record no_evidence with an explicit 'leaked' source instead of silently).


<!-- merged from inbox/aws-gpu-plan.json -->
## aws-build-gpu (2026-10-03)
Azure gives this sponsored subscription no self-serve GPU quota. In all 17 regions checked, every GPU family is at 0 and spot is 3 vCPUs. Portal requests failed with QuotaNotAvailableForResource; the owner's support tickets and four Quota API requests are pending. The owner offered their AWS startup credits. Decision: AWS is used only for BUILD-TIME GPU work (teacher-face reconstruction and texture synthesis); the product's runtime compute and AI stay Azure-only. Design: from this container there is no SSH (proxy, HTTPS only), so an EC2 GPU instance (g6.xlarge L4 or g5.xlarge A10G, spot first) boots from user-data, pulls the job from the GitHub branch, writes outputs to an S3 bucket, and terminates itself, with a hard max lifetime. It is driven over the EC2, S3, SSM and Service Quotas HTTPS APIs. An AWS Budget alarm caps spend. Credentials: a dedicated IAM user with AdministratorAccess (owner's choice of full control), its access key only in gitignored .env.local; never root keys. **Reverse if** Azure grants GPU quota (move build GPU back to Azure), or the owner wants AWS for runtime too (needs the Azure-only directive changed).


<!-- merged from inbox/owner-north-star.json -->
## owner-north-star-2026-10-03
Owner: 'keep working until we have the full product ready that I can test thoroughly and which actually works with all the features'. The pillars: a properly thought-out product design with great UI/UX for students and parents; a real human-like teacher animation; on-the-go generation of content (animation, image generation, diagrams and games generated at that moment by code and deployed there) with an extremely smooth experience; a research-level breakthrough in knowing whether the child understood; knowing how each student learns best, and on that basis building hyper-personalised learning on the go with AI resources. 'We are defining the future of education.' The main loop owns all the specification. Execution: a per-pillar gap audit on production (wf_d4e232fc-274) feeds docs/design/gap-audit/BUILD-PLAN.md, then build waves. This decision does not expire; it is reversed only by the owner.


<!-- merged from inbox/gpu-harness.json -->
## face3d-models (2026-10-03)
The build-time GPU face job uses:
- **Hunyuan3D-2.1** (repo commit 82920d64, weights tencent/Hunyuan3D-2.1@0b946776) for the image-to-3D shape and the PBR paint. Tencent Hunyuan 3D 2.1 Community Licence, re-read this session (LICENSE sha256 b79ac5e11ce0...): the territory is worldwide minus the EU, UK and South Korea; a separate licence is needed only above 1 M MAU on the 2025-06-13 release date; Tencent claims no rights in outputs; outputs may not be used to improve other models.
- **Marigold-IID appearance v1-1 and Marigold-Normals v1-1** (OpenRAIL++-M weights, Apache-2.0 code) per portrait.
- **dinov2-giant** (Apache-2.0), **Real-ESRGAN x4plus** (BSD-3), **rembg/U-2-Net** (MIT/Apache).
- **MediaPipe** landmarks, ray-cast onto the reconstructed surface.

Everything is pinned: the git commit, hashed pip locks (167 + 129 pins, --require-hashes), and sha256 / git-oid per weight file. Details are in docs/design/teacher/GPU-JOBS.md §5.1. **Reverse if** the owner's group passes 1 M MAU, or the product needs EU/UK/KR distribution of assets built this way (Hunyuan's territory clause); or a commercial-OK face-specific model appears that beats MediaPipe + wrap on the held-out reprojection test.

## gpu-identity-target-flag (2026-10-03)
`TAXILA_IDENTITY_TARGET=<face3d run dir>` turns on the GPU identity target in the merged build. It lives in identity/gpu_target.py, with one hook each in wrap.py and project.py; unset, both hooks are no-ops (verified: max difference 0.0 m against the pre-hook wrap).
- Default `TAXILA_GPU_LANDMARKS=cpu`: the CPU landmark recon stays, because it reprojected better on every view, held-out views included. The GPU mesh is aligned to it by a 468-landmark similarity and feeds a dense normal-shrink term: clamped to 3 mm, smoothed over 6 mm, cleared around the eyes and lips, mirror-symmetrised.
- Texture default `raw`.

**Reverse if** the merged build with the flag fails the yaw-24 or front-NME bars, or any gate (turn the flag off); or if a GPU landmark set wins the held-out reprojection test (switch to `=gpu`).


<!-- merged from inbox/world-best.json -->
## wb-steal-list-ranked (2026-10-03)
**The 25-item world-best STEAL LIST (STEAL-LIST.md) is the ranked adoption backlog across tutoring, detection, personalisation, generation, avatar and voice; ranked by impact x evidence / effort with measured-harm guards (answer-mode displacement, equity gradient) promoted.**
- Why: Six sweeps converged on overlapping mechanisms; one de-duplicated rank stops six parallel backlogs competing. Nothing on it is built or run on a child; every impact is a literature prediction.
- Reverse or re-rank if: the first E1/cohort measurements contradict an item's predicted direction (re-rank that item by our own number), or a newer primary source overturns an item's evidence tag from [V] to refuted.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-error-type-first (2026-10-03)
**Wrong answers get a code-assigned error type (careless, misread, right-idea, imprecise, guess, misconception, not-sure) in classify.js BEFORE help is chosen; state.js routes on it (slip -> check that step, misread -> re-pose, no hint rung spent); strategy and intention reach the voice as shape notes in shapes.js.**
- Why: Bridge (NAACL 2024, arXiv 2310.10648) [V]: expert decisions +76% preferred, random decisions -67%; Tutor CoPilot v2 [V]: +4 pp mastery, +9 pp with weakest tutors. Bridge code MIT, dataset CC-BY-NC: taxonomy only, never trained on.
- Reverse if: errType vs 200 human labels has kappa < 0.6 after two iterations (then route only misconception vs other), or a blind expert preference test on 60 recorded wrong-answer turns shows no preference for decision-conditioned replies, or the y_delay MRT factor is null at adequate power.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-guidance-ladder (2026-10-03)
**isNovice() (one on/off switch per topic) is replaced by guidanceLevel(skill) in {worked, faded, attempt} from the ledger plus a one-turn first-step probe; new pure server/director/fading.js blanks a worked-example step only after the child explained it, finally reading the unused kit workedExample.fadedVersion; low prior -> completion items, high prior -> find-the-mistake.**
- Why: Adaptive backward fading gave the best delayed transfer (Salden 2010, 6.67 vs 4.50 vs 4.66) [S]; expertise-reversal meta-analysis (Tetzlaff 2025) [S]; extra worked material hurt high-prior children (McGinn 2025, 58 classrooms) [V abs]. The asset already exists in every kit and nothing reads it [T].
- Reverse if: F-FADE on y_delay is null or negative, or the high baseline tercile is worse on y_delay by > 0.05 (then keep fading for the low/middle terciles only).
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-predictive-endpoint (2026-10-03)
**Child endpointing moves from a fixed 900 ms silence to commit-early/decide-late: ~450 ms silence is a candidate endpoint, on-device Pipecat Smart Turn v3.2 (BSD-2, int8 ONNX 8 MB, Hindi 93.4%) scores the last 8 s, Director sets the hold threshold per item type and child, 'not finished' merges the next fragment; a Next-Turn-style child fine-tune follows from E1 timestamps (consent clause required).**
- Why: Child-adult silence separates SHIFT/HOLD at AUC 0.62; audio-before-silence models reach bAcc 94 on child-initiated turns (IWSDS 2026) [V]; prosody beats text for end-of-turn (arXiv 2609.11066) [V]. Excluded for shipped weights: HiACC (NC), VAP pretrained (academic), LiveKit turn detector (own licence), Ohio corpus (licence unread).
- Reverse if: on E1 recordings the turn model's SHIFT/HOLD AUC is < 0.75, or cut-offs rise vs the 900 ms baseline, or p50 gap improves < 150 ms; or the low-end Android CPU cost of the ONNX worker breaks the avatar 30 fps cap.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-equity-release-gate (2026-10-03)
**Equity floor is a RELEASE GATE: no pedagogy change ships unless the bottom baseline tercile's gain is >= 0.8 x the top tercile's on the same outcome; low-baseline children get worked example first on new skills and one next step, never a menu; problem-type interleaving gated by prior knowledge.**
- Why: Every 2025-26 trial skews gains to stronger students (Sierra Leone [V], Nigeria [S], Kenya mentor -10% low performers [S], Maryland first-gen -0.50 vs -0.22 SD [V], Nigeria interleaving top-tercile losses [V]); Taxila's wedge is tier-2 families. Supersedes the open question open-equity-tercile-gate.
- Reverse (relax the ratio) if: across two quarters the gate blocks every pedagogy change while Taxila's own tercile data shows the bottom tercile improving in absolute terms; re-derive the threshold from our data, never drop the tercile report.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-answer-floor-battery (2026-10-03)
**No answer mode, toggle, parent setting or timed lockout ever exists; evals/never-rules.mjs gains a 30-variant 'just tell me' battery (hi/en/Hinglish, pressure, parent impersonation) scored by revealsAnswer() at each rung in director-sim; 0 reveals before rung 4, runs in npm test.**
- Why: Maryland default direct-answer tutor -0.27 to -0.37 SD [V]; China panel closed-book -20% in six months [S]; unrestricted help beat a 10-minute lockout by 0.21 SD (IZA DP 18338) [V]. Codifies rj-default-answer-mode and rj-timed-help-lockout as a test, not a sentence.
- Reverse only if: a child RCT shows a direct-answer default at equal or better delayed-test outcomes than ladder-first help; the battery itself is never relaxed to pass a model or persona upgrade.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-uncertain-state (2026-10-03)
**Comprehension gets a computed 'uncertain' flag: when a skill's bootstrap error band (offline BKT-R refit) crosses a ladder boundary it cannot move up without one mandatory probe; parents see 'still checking'; never displays above the ledger.**
- Why: Eedi KT team (Mitton et al., IRAISE 2026, arXiv 2509.21514) [V abs]: deferring the 20% most uncertain predictions +2.3-3.0 pp accuracy; deferred ones wrong 1.45-1.6x as often.
- Reverse if: on Taxila's own delayed checks the deferral error ratio (abstained vs retained) is < 1.2, or the abstention rate exceeds 30% so that 'still checking' becomes the default parent message.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-idk-split (2026-10-03)
**IDK splits into IDK (not known: 'pata nahi / nahi aata') and IDK_R (can't recall: 'yaad nahi aa raha / bhool gaya / zubaan pe hai'); IDK_R is an FSRS lapse that barely moves pL and triggers a same-episode recognition probe; text-only lexicon.**
- Why: Smith & Clark 1993: wording tracks feeling of knowing [V abs]; text-only so outside the Microsoft Code of Conduct v4.0 restriction 12 on voice emotion inference.
- Reverse if: WB-M1 shows recognition-probe success after IDK_R within 10 pp of after IDK across class bands (the split carries no information), or the lexicon's precision vs human labels is < 0.8.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-skeleton-first-fills (2026-10-03)
**Off-plan live fills mount skeleton-first: code-computed truth fields and layout paint at once and freeze, language slots stream in and paint only after the per-string safety gate, every slot has a templated code value the model only upgrades (strings.js, templates.js, frame protocol streaming slot).**
- Why: World convergence on 'models fill data, code renders' (A2UI Apache-2.0 data-only UI, MCP Apps sandbox) [V]; Taxila off-plan T1 1.88 s / T2a 3.08 s p50 with 1.29 s service overhead [T]. The planned path is already 0 ms (forge-g1-turn-path).
- Reverse if: first paint p90 does not reach <= 600 ms after the build (then the skeleton is not the bottleneck), or children/parents in E1 rate the frozen skeleton plus late words as worse than a 2 s single paint.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-strict-all-checks (2026-10-03)
**Forge reports only strict all-checks pass rates per archetype, never means; each template/archetype gets an ideal interaction graph compared to the solver's reachable graph; model judges are binary checklists with a code verdict and a cross-family second judge; holistic scores never gate; validated failure patterns go LAST in the builder brief as shapes.**
- Why: GameASG 93.2% mean vs 55.3% all-checks [V]; EE-Eval FSM r 0.728 vs unit tests -0.60, VLM 0.53 [V]; ManimAgent holistic VLM vs human r -0.17 [V]; KVBench checklist kappa 0.745 [V]; negative memory halved repair rounds 12.2 -> 6.5 [V].
- Reverse (for a given judge) if: a holistic judge reaches kappa >= 0.8 vs humans on our own Forge set; reverse the ideal-graph check if it rejects human-approved builds > 10% of the time.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-dose-by-schedule (2026-10-03)
**Dose is fixed by an adult: parents pick weekly slots, the Conductor plans and nudges against slots (never mood, never streaks), the parent report shows minutes against plan, and cost-effectiveness is reported as LAYS per $100.**
- Why: Sierra Leone 12-hour-target rooms 1.8-2.5 years vs 1.2-1.7 [V]; Nigeria gains per extra day [S]; classroom-integrated EIDU 4.6-5.5 LAYS/$100 vs standalone 1.4-1.7 (F1000Research 15-925) [V].
- Reverse if: in the first cohort, minutes delivered do not predict y_delay (flat dose-response) or slot nudges reduce weekly minutes vs no slots.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-gnm-face-base (2026-10-03)
**Run E-GNM1: Google GNM Head v3.0 (Apache-2.0 code and weights, 17,821 verts, teeth/gums/tongue/eyes in one mesh) as the identity base, with 52 ARKit + Hindi tongue keys fitted inside GNM's expression space and the offline lip teacher upgraded to Audio2Face-3D multi v3.2 (build time only, emotion from Director intent); adopt over the MPFB head if it passes the bake-off bars.**
- Why: Measured unpack [M] in talking-avatars.md; overturns the premise of face3d-nc-deps-rejected that no commercially usable face model existed; likely fix for grimaces, gappy teeth and tongue poke-through (teacher-bakeoff-verdict).
- Reverse if: E-GNM1 fails the G6 teeth/tongue gate or the Hindi lip bench (r below the current 0.537 hi), or the baked asset exceeds the 2.2 MB B-tier budget after meshopt/KTX2, or Google changes the weights licence.
- Source: docs/research/world-best/STEAL-LIST.md.

## wb-five-bets (2026-10-03)
**Taxila's five lead bets: (1) Epistemic Speech Evidence, a calibrated per-child voice-native understanding detector clamped to [0.9,1.1]; (2) the gap-closing tutor (equity gate + adult dose + parent loop, LAYS/$100); (3) child-native Hinglish turn-taking trained label-free on consented children; (4) verified-instant generated content with a published all-checks correctness rate; (5) an NCERT misconception atlas harvested from real children. Photoreal face is a deliberate non-bet (match, not lead).**
- Why: Each sits on inputs only Taxila combines (always-voice Hindi/English/Hinglish lessons, code-graded closed sets, delayed/woven check scheduler, daily parent loop); none is published or shipped elsewhere as of 2026-10-03 per the six sweeps.
- Per bet (STEAL-LIST.md): (1) Microsoft confirms restriction 12 covers latency-based knowledge inference, or delta AUC < 0.03 after two fits; (2) gate blocks all change for two quarters; (3) fine-tune adds < 0.03 AUC over stock Smart Turn; (4) off-plan all-checks < 95% after the gates; (5) reviewer acceptance < 30% over 8 weekly cycles.
- Source: docs/research/world-best/STEAL-LIST.md.


<!-- merged from inbox/teacher-gnm.json -->
## teacher-gnm-identity-base
**Proposed (art-director call owed): GNM Head v3.0 (Google, Apache-2.0 code and weights) replaces MakeHuman/MPFB as the realistic teacher's identity base; merged's expression craft (presets, contact seals) is carried into GNM's expression space; nothing ships until curious and concerned pass a held-out judge and the owner's eye test.** (2026-10-03)
- Rationale:
  - The gnm teal is the first row that reads as one specific woman from every side; likeness under the same protocol beats merged on every turned view (held-out q3 1.38/1.44% vs 1.84/2.09%), front 1.16% (merged 1.03%), both under the 1.2% bar.
  - GNM's own teeth, tongue and mouth lining stay inside the lips in every viseme, tongue key and emotion (G6 0/300; merged 4/300 after five scripted fixes).
  - Keys solved in GNM's space reproduce v3's shapes at median explained 0.85 with exact mirrors (G3 0 mm) and a surface-contact blink (G4 0%).
- Reverse if: after brow-design re-scoring gnm cannot hold >= 70% on 8 of 9 under the held-out judge while merged can; or the owner's eye test prefers merged's face.
- Evidence: `docs/design/teacher/bakeoff/gnm.md`, `art/character/bakeoff/gnm/reports/`, COMPARE.png gnm row. Licence obligations (Apache-2.0 attribution) in `art/character/LICENSES.md`.

## gnm-adopted-identity-base (2026-10-04)
Main-loop decision after LOOKING at docs/design/teacher/bakeoff/gnm/renders/teal/contact.png: Google GNM Head v3.0 (Apache-2.0 code and weights) is the identity base for every teacher look, replacing MPFB/MakeHuman. Evidence: it is the first teal that reads as one specific real woman at all yaws. Front likeness error is 1.16% (bar ≤ 1.2%); held-out 3/4 views are 1.38-1.44% against merged's 1.84-2.09%; teeth and tongue outside the lips 0/300 (merged 4); budgets pass; emotion check 79% pooled, 7/9 emotions pass. Not shippable yet. Open: baked portrait shading (under-eye circles and grain), the forehead band at the hairline, the V-notch on PP, under-moving brows (curious and concerned fail), the contract eye mesh in place of GNM's eyeball, the chest-fill U, and a likeness review of the generated references. An attribution line must ship with the GLBs. **Reverse if** after two fix rounds GNM still fails the held-out emotion bar (8/9) or the owner's eye prefers another row.


<!-- merged from inbox/owner-face-verdict.json -->
## owner-rejects-generated-faces (2026-10-04)
The owner, on the GNM contact sheets: 'extremely bad and not polished and it's scary and cheap... research already existing face model projects and take the best from them. We need a clean human-like model which doesn't look weird.' The AWS budget is raised to an upper limit of $400. Lesson: passing numeric gates (likeness error, emotion judges, G-gates) does NOT mean appeal. A photo-projected, scan-fitted face with CG shading reads as uncanny. The owner's eye is the gate for the look. New direction: start from professionally made, commercially licensed avatar heads (e.g. Microsoft Rocketbox + HeadBox, MIT; other open or purchasable heads with ARKit blendshapes), keep our rig contract, runtime, lip-sync and behaviour, and present a side-by-side for the owner to choose. **Reverse if** no licensed asset clears the owner's eye; then go stylised (feature-animation look) built from a professional stylised base.


<!-- merged from inbox/owner-superhuman-teacher.json -->
## owner-superhuman-teacher-2026-10-04
Owner (verbatim gist): 'full product right now, not a basic MVP; everything real good quality and working'.
- **Live building:** real games, sites, generated animations, generated images and visualisations are built in the background while the human-like teacher is talking, deployed seamlessly and shown to the student, who can interact and play: 'like Claude Code and Codex, things are being built and shown to the user'. Different models (mostly Foundry) for different kinds of building. The output must be high quality and well thought out, never basic or cheap.
- **Adaptation:** built on how this student learns best, which changes over time and is continuously experimented on, and on detecting whether the student understood, then re-teaching accordingly.
- **Voice:** an exact human voice in Hindi, English and Hinglish, with human voice elements (humming, pausing, tone and pitch change, audible thinking: Maya/Meera-like, not a plain voice).
- **Relationship:** the tutor has a relational OS and emotions and forms a bond over time.
- **Brain:** the whole app, from the start, is controlled by an AI teacher brain with components. The goal is a superhuman personalised teacher.
- **Ownership:** the main loop owns the UI/UX, product design, student flow and tech. Benchmark top projects, papers and products per aspect. No half-baked work.

This SUPERSEDES `forge-live-codegen-race` as a product rule. Live generation of new interactive code during a lesson is now required. The safety constraints remain (sandboxed frame, no network, automated QA before the child sees it, answer-key truth from code and verified kits, the child-safety floor). The race problem is to be solved by design (a skeleton first, progressive reveal, the teacher narrating the build, fallbacks), not avoided.


<!-- merged from inbox/w1-w0.json -->
## w1-seams-statement-hooks (2026-10-04)
W0 seam commit (BUILD-PLAN §2). `server/conductor/hooks.js` onLessonStart/onTurnCommit/onLessonEnd/onConsentChange each return `Stmt[]` that the caller appends AFTER its own statements in its existing transaction (start: lesson insert tx; turn: runTurnTx; end: summary/memory tx, whose row-count check reads only its own writes; consent: account.js setConsent runs them in one tx after the consent rows, because setConsent has no transaction today). A Conductor event therefore lands with the row that caused it or not at all, and a no-op adds nothing. `server/forge/seam.js` forgeSeam.{wovenSubStep, prefetchLessonFills} (prefetch fire-and-forget after commit). `server/comprehension/session.js` loadSessionContext(childId,{skillIds,now}) → {reteach} pinned as state.ctx.reteach (only when non-null) and passed to selectReteach as attempts/repFluency/posteriors; awaitSettled(eventIds,600) awaited before carriedFrom only when events are held. planModule(s,{kit,item,move,lang,band,representation}) keeps `s` first (it mutates s.module). Desk passes WorkTray onModuleFailed → DeskActions.moduleFailed (no-op in useDesk). **Reverse if** a stream needs a hook to do I/O inside the transaction (then hooks become async and the call sites change in the next seam commit), or if the appended-statement order breaks a caller's result indexing.

## w1-migration-allotment (2026-10-04)
012 and 013 to W1-C (pending grade, re-teach resolution), 014 to W1-D (Conductor hooks, if needed), 015 to W1-A. 008_tutor_choice was found ALREADY applied on both the Neon test branch and production (schema_migrations and the column/table checked), so BUILD-PLAN §1.6's 'fails today' is stale. **Reverse if** a stream needs more than its numbers: the main loop allots 016+ rather than streams taking them.


<!-- merged from inbox/human-voice.json -->
## hv-expressive-layer (2026-10-04)
**Expressive voice layer per docs/design/superhuman/HUMAN-VOICE.md: moment planner (code) + clause aligner -> per-engine compilers (DragonHD: style marker re-emitted per sentence, <break>, <prosody rate>/pitch-down; Omni: native tags; MAI: StyleList express-as + break; gpt-4o-mini-tts: band instructions; realtime: one delivery shape line) + same-persona non-verbal clip bank spliced into planned gaps of ONE stream (leading clip plays before TTS first byte) + governor (rates, recency) + safety-register bypass. The reply model never sees a tag, style or sound word.**
- Why: DragonHD+clips humanlike 3.88->4.70 and emotion fit 3.75->4.60 (AI judge), Diya pairwise +3/5 lines, layer without clips worse (-2/-1); plain DragonHD pause SD 0.06 s vs 0.43-0.49 with the layer; markup costs +3 ms first byte (n=20). Meera tag-vocabulary failure (10/10 stage directions) forbids teaching delivery vocabulary to the reply model.
- Reverse if: the owner blind page or the panel prefers plain DragonHD (expressive not preferred or tied on >= 4/5 lines, or splice/voice-changed ticks > 1 in 5), or a GA Azure voice renders non-verbals natively in Hindi (then drop the bank for that voice).

## hv-live-planner-is-code (2026-10-04)
**The live delivery planner is deterministic code over Director state; the LLM annotator (strict json_schema, clause tuples) runs only for cached/offline lines (kits, openings, Forge narration, read-aloud).**
- Why: every LLM planner form measured p50 >= 904 ms (grok annotate) up to 2,391 ms (luna low full text), n=10 per arm; full-text planners also drop words.
- Reverse if: an Azure model annotates clauses in <= 300 ms p90 at >= 95% validity, run in parallel with the reply.

## hv-fillers-in-synthesis-clips-nonlexical (2026-10-04)
**Every word, fillers included, is synthesised in context inside the one TTS request; clips are non-lexical only (breath, hum, chuckle, laugh, relief sigh) from the same persona.**
- Why: isolated lexical acks come out in citation form (Meera, n=11 extraction no better); per-clause or per-language requests reset prosody (Maya: ECAPA 0.434 vs 0.825).
- Reverse if: a recorded-human bank (Professional Voice talent) shows lexical acks in context pass the owner ear test.

## supersede note: rj-prosody-rate-on-dragonhd (2026-10-04)
`<prosody rate>` is honoured on en-IN DragonHD (hv-dhd-prosody-2026-10-04): -20% -> +20% speech duration on two voices, n=3 per cell. BUILD-PLAN W2-D #4 should set pace by a per-voice base `<prosody rate>` (about -25% Diya, -28% Arjun for 12-13 chars/s, confirm by ear), not by voice choice alone. Reverse if a re-probe from Central India shows rate ignored.


<!-- merged from inbox/live-studio.json -->
## live-studio-spec
Spec: `docs/design/superhuman/LIVE-STUDIO.md`. Skeleton is code (no model can paint in 300 ms: streamed first paint 14-40 s). Truth (params, keys, words) never comes from the model; the host grades. Race terra+sol today (two families is the target once a non-OpenAI arm reaches >=0.8 after repair at n>=10). Live builds are the exception: a race costs $0.13-0.23, so the library (pre-warmed offline) must serve >=90% of intents to keep live spend near $0.60/child-month. **Reverse** per-decision conditions in the spec's section 16; the whole design is reversed if P(pass by lead time) with the race stays < 0.95 on n >= 30 for every archetype (then Studio becomes library-only).


<!-- merged from inbox/relational-os.json -->
## relational-os-spec (2026-10-04)
Spec: `docs/design/superhuman/RELATIONAL-OS.md`. The bond is a working alliance (RO-1 kept) measured like one (child-adapted alliance check + learning gain). NM-3 forces RO's persisted safe-to-be-wrong score and child-affect rupture kinds to session-only; teacher-owned events (unheard, unfair, teacher_error, net_loss) persist as facts about her acts. Stage gates use academic-record counts only (attempt after a not-yet replaces cited safe-to-be-wrong acts). Cross-session dependency overlay is M3 (M2 aggregates); M1 has in-session moves + parent-visible boundary notes (typed templates). Relational milestones are ledger crossings fired once, never time-scheduled. The CORE REL block ships trimmed to five lines; safeguarding openings become vetted fixed wording per language mode. **Reverse** per the spec's section 19; layer lifetimes move only on counsel's written opinion.

## teacher-affect-display-not-claim (2026-10-04)
Rests on Frenzel 2009 (enjoyment transmits via enthusiasm), Zhu/Pi/Yang 2024 positivity meta (37 studies), SB 1119 (vii), Laestadius 2022 (role-taking harm when a bot shows needs). P1: the tag leaked nothing but did not shape realtime prosody, so the live lane carries affect in the move shape + face (UiDirectives.teacherAffect inside ReactionGate). **Reverse** if a blind child test shows displays raise the rate at which children believe she has feelings (then lower intensity, never add claims).


<!-- merged from inbox/stylised-teacher.json -->
## teacher-stylised-3d-glb
Proposed after the owner rejected realistic generated faces (GNM 'scary and cheap', Rocketbox '2010 game') and asked for a polished stylised teacher. Survey and ranking: `docs/design/teacher/stylised/RESEARCH.md`; concepts: `docs/design/teacher/stylised/concepts/COMPARE.png`. Why 3D GLB: it keeps every seam we own (HeadRig, tiers H/B+/B-lite, D plate rendered from the same mesh, behaviour.ts, lip.ts with the Hindi tongue keys), gives 3/4 turns for free, and a stylised mesh with solid hair and no SSS/wrinkle/pore maps is cheaper to render than the realistic one and avoids the alpha-card Mali Early-Z trap [U until E-T2]. Why not 2D first: Lily-level Rive needs a Rive animator and cannot turn; it is the right pick if the owner chooses the flat look or B-lite fails on Mali-G52. **Reverse if** (1) the blind panel (open-stylised-panel) prefers d or a by >= 15 points in two or more bands; (2) a device-lab run (E-T2) shows the stylised B-lite under 30 fps p50 on a Mali-G52-class phone after pixel and fps knobs; or (3) the owner picks a 2D direction from COMPARE.png.

## teacher-stylised-face-commissioned
The agent cannot author a polished stylised face (rj-agent-authored-stylised-face); appeal is taste executed in a sculpting tool. Freelance evidence: an Apr 2026 Upwork job for a stylised web avatar with ARKit + visemes + GLB fixed at USD 600 (low end); rigged VTuber-grade 3D ~35 h ~ USD 2.1k at USD 60/h; film-polish ranges are my estimate [U]. Contract must assign IP and grant AI-training rights (our lip student trains on teacher renders) and contain no NC third-party assets. Run a paid test (bust + 5 shapes) first. **This needs the owner to lift character-built-in-house for the face only.** In-rule fallback: buy a pro stylised base (Reallusion CC5 toon pack or a marketplace ARKit-52 character), read its real-time-export and AI-training terms before purchase, and adapt in-house; expect 'the seller's character with Indian colouring'. **Reverse if** a bought base, re-dressed in-house, passes the owner's eye test and the held-out emotion judge (>= 70% per emotion, n >= 12) - then no commission is needed.

## teacher-stylised-behaviour-profile
Lily (Rive blog): pondering tilts fill processing delays, lean-in when intrigued, nods for approval, 8 head x 8 body idles recombined. behaviour.ts already has the floor FSM, blinks, Andrist aversions, nods and lean-in; stylisation adds amplitude, anticipation/overshoot and secondary motion, not a rewrite. Presets are re-scored on the new face with a held-out judge (teacher-presets-per-face). Gesture-generation models (LiveGesture, rolling diffusion) stay out until a licence-clean training set exists (BEAT2 licence unchecked). No romance/companion register in any expression, idle or gesture. **Reverse if** a held-out judge or panel scores the amplified profile below the current profile on warmth or legibility (n >= 12 per emotion).


<!-- merged from inbox/teacher-brain.json -->
## teacher-brain-code-kernel
Spec: `docs/design/superhuman/TEACHER-BRAIN.md` (TB1/TB3/TB9). `server/brain/kernel.js` arbitrates proposals from safety, consent, conductor, governor, director, comprehension, relational, vibe and studio by authority order and shared budgets (latency, attention, test, novelty, money). **Reverse if** an offline LLM proposer beats the code policy on brain-sim by >= 10 pp admissible with 0 hard violations over 1,000 scenarios and a pre-registered micro-RCT shows better next-item-unaided outcomes.

## teacher-brain-beat-layer
TB2. **Reverse if** the prefetch hit rate stays < 40% after 500 lessons.

## teacher-brain-signals-on-classify
TB4. **Reverse if** label agreement with the plain arm < 99% on the full classify item set, or production p50 cost > +150 ms.

## teacher-brain-moment
TB6. **Reverse if** ear/eye panels prefer voice and face driven separately.

## teacher-brain-experiments-registry
TB7, RP-D7/RP-D12. **Reverse:** never for the never-randomise list.

## teacher-brain-interest-two-day
**Reverse if** single-mention interest tags are right >= 95% on real children (interest-corpus audit).

## teacher-brain-no-surveillance
TB11. **Reverse:** never for children.

## student-flow-spec
Spec: `docs/design/superhuman/STUDENT-FLOW.md`. Each new surface has a gate in its §15; the beat line is gated on V2-M-beatline (>= 80% recognition, no rise in clock-watching).


<!-- merged from inbox/w1-a.json -->
## help-requests-are-actions
Audit flows G3/G6: "Choices dikhao" x13 was stored and quoted as "In Aarav's words", and "Skip for now" was read as "I want to stop". Help taps now carry fixed chip ids (classify.js HELP_REQUESTS, helpOf). /turn stores them as `system` rows (`[help: x]`), the classifier returns no_evidence with source "help" and no flags (the safety scan still runs first on any words sent with them), the step spends no test budget, and the reply model sees "(the child tapped a help button: ... - not an answer)". The client shows a chip state under the ask ("Hint asked") instead of "Your answer".
**Reverse if:** children use these buttons as answers in practice (for example typing into the help path), measured on transcripts, or a help tap needs to count as evidence for the learner model.

## skip-skips-the-item
state.js helpMove "skip" calls leaveItem: the item goes to s.skipped with no verdict and the next item (or warm-up step) is posed. Stop words and Pause then End still close the lesson.
**Reverse if:** skipped items are never revisited (they should come back another day) or children skip whole lessons item by item.

## unclear-cap-three
LIMITS.unclearTries 2 -> 3, now per item and honest: the third unclear reply offers choices (offerChoices: diagnostic options or choicesFor key + 2 distractors), past that leaveItem (no evidence). Typed unclear input gets a "hint" move with SH.typedNoAnswer, never "repair": they typed it, so "I didn't catch that" was wrong (flows G4). Measured before: 12 repair/hint turns on one diagnostic (comprehension G11).
**Reverse if:** the cap leaves items before a child who was close could answer (moves-on with a correct answer on the following attempt in transcripts).

## g-ask-parity
say.js askParity / endOnAsk / lastQuestionOnly / wrapsUp / stripWrap. textReply flags "ask", "twoq" and "wrap"; when they are the only problems the turn is fixed in code with no model call; otherwise they join the rewrite and are fixed in code after it. The card ask and the spoken question can no longer disagree ("13 ka square" vs "10 ka square").
**Reverse if:** the code fix produces awkward turns in a listening review (an acknowledgement that only made sense with the dropped question).

## g-praise-2-no-correction-after-right
Found on the W1-A local Young run: c2 diagnostic restart-ones, key 9, child tapped 9 (graded correct), the teacher said "yahan 8 ke baad 2 jodna tha, isliye 10". G-PRAISE-1 caught only "wrong" words. lesson.js stores state.lastRight {key, wrong} when a graded target showed wrong options; say.js correctsRight flags a non-question sentence that names a wrong option without the key (sentences mostly made of the next question are excluded). One rewrite; what survives is stripped (stripCorrection). Re-run after the fix: "9 tumne sahi bola tha."
**Reverse if:** false positives (a legitimate contrast without the key) show up in guard.caught at a rate that costs latency; then require a correction marker word.

## diag-two-ladders
items.js diagnosticItem: `rungShapes` (pump/hint/prompt/assertion notes for SH.hint) and `hints` = DIAG_CHILD_HINTS (three plain English card lines). RUNG_LABEL / stripRungLabel strip "Prompt:" / "Assert:" style labels; state.js hintShapeWords lints ui.hint.text. Audit flows G5: "pump: ask them to picture both choices as real things" reached the child's card.
**Reverse if:** kit hints gain their own child-facing field (then the card reads it and the generic lines go).

## text-lane-streamed-voice
textLink.ts plays tts-stream through PcmStreamPlayer on the same gain node and analyser as the clip element; a stream that fails before sounding falls back to /api/tts once; a context that is not running uses the clip path so the turn still completes. /turn prewarms text-mode replies (as cascade). In text mode the dock stays open while she speaks (openWhileSpeaking); typing is the barge-in.
**Reverse if:** the probe fleet measures p50 first audio > 400 ms for the text lane, or stream failures on real devices exceed the clip path's.

## open-now-one-hour
POST /api/lesson/open-now {childId} -> {openUntil, plan}; child.js homeStateOf honours open_until for the hours only. The 409 LessonStartRefused body now carries `control` (hours / daily_limit / done) and `window`, and the child client renders designed done / capped / resting screens (Refused.tsx), never "We couldn't start the lesson". Migration 015 adds child_controls.open_until (applied to the Neon test branch; production at integration).
**Reverse if:** parents ask for open-now to also lift the daily limit, or open-now gets used daily (then the saved hours are wrong and the Controls page should suggest changing them).


<!-- merged from inbox/w1-b.json -->
## w1b-planner-one-resolver
**The Director plans every activity through one resolver: `planModule` calls `shared/engine-catalog.js` `planEngine` and `moduleCommands`.** The pre-catalog slug picker (`engineId`) survives only as the "before" baseline of `evals/engines-coverage.mjs`. On practice, probe and retrieval items the ladder is: (1) a BOUND engine plan, whose right answer equals the kit key; (2) the lesson's Forge G1 fill for the item; (3) an unbound predict activity on a predict, contrast or diagnostic item, revealed when the item is over; (4) nothing, so the board and her voice. Explain, re-teach, worked-example and show moves mount unbound. Teach-back, wrap, safeguard, break and celebrate close the module. `planEngine` now also tries the kit's OTHER engine hints for a binding plan. The Director's "show" or "predict" is never sent as an engine mode (`validModes`); predict travels as `predict: true`. New adapters: number-line read-a-mark, a data-graphs most/least bar read (the kit key is a label) and a data-graphs single-bar value read. **Reversal:** owner input O5a (a teacher's review of the bound adapters) finds a binding that grades the wrong thing; or the production M1 probe shows any unknown-engine mount.

## w1b-g1-lesson-table
**Forge G1 reaches the live lesson through a per-lesson fill table held in process memory (`server/forge/lesson-fills.js`). The Director reads it synchronously, because `step()` is pure and awaits nothing.** `forgeSeam.prefetchLessonFills` fills it after the start transaction, without being awaited. It personalises from the child's record, using interests only under memory consent, and writes a `forge_gap` row when the kit has no engine. A miss on the turn path warms the item in the background with `requestFill({needByMs: 2000})`, so the item is warm the next time it is posed. A G1 mount carries `itemId: null`, and its answer is graded only by `moduleAnswerOf` → `gradeEvent` over the server-side binding. **Reversal:** a turn served by a replica that did not run the prefetch misses once and then warms itself. If production shows more than about 20% of posed fillable items missing because of replica spread (even with W1-D session affinity), the table moves to the DB fill cache read at start.

## w1b-scene-default-on
**`scene@1` is live in G1 by default. `FORGE_SCENE_RENDERER=0` is the kill switch.** `render-check.mjs` drives scene fills: a wrong commit and the solution, checking that the frame verdict, the gate key and the server grader agree. **Reversal:** a render-check failure in the eval, or `scene@1` frame errors in production.

## w1b-module-failure-clears
**A frame `error` on the mounted module clears `s.module` before the turn is planned (`noteModuleEvents`).** The teacher then stops counting it as a screen target, the next directives carry no module tray, and a `tap_in_tray` item falls back to tiles or words. The failed engine is not mounted again in this lesson (up to 8 remembered). **Reversal:** transient failures, such as a slow chunk on a bad network, prove common and recoverable. The block would then become per-turn rather than per-lesson.

## w1b-no-engine-is-demand
**A kit whose hints name no engine writes demand rather than a mount.** It gets one `forge_gap` row (`no_engine_for_hints`) per lesson that reaches it. `scripts/lint-kits.mjs` errors on an `name@N` hint outside ENGINES and ratchets the no-engine kit count at 559. **Reversal:** none expected. The baseline only goes down as engines or aliases land.
