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
