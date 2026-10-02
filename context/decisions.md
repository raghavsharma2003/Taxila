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
