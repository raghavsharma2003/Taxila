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
