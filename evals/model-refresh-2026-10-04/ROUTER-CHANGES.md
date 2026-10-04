# Router changes from the 2026-10-04 model refresh: what the main loop changes in server/

This file is the change list. The routing table and its evidence are in
`docs/research/models/MODEL-ROUTER.md` §0. Nothing below has been applied: this workflow edited no product code.
Each change must pass the repo gates (`npx tsc -b && npx vite build && npm test`) before it ships.

## What production runs today

Read from ARM on 2026-10-04, read-only, for both `taxila-web` (eastus2) and `taxila-sin-staging` (South India).

| role | env / code | value today |
|---|---|---|
| live reply | `DEPLOY_REPLY` (unset) → `DEPLOY.fast` | `taxila-fast` = gpt-5.6-luna |
| classify + distress backup | `DEPLOY_CLASSIFY` (set by `scripts/deploy-azure.mjs:384`) | `grok-4-1-fast-non-reasoning`, hedge 1500 ms |
| cascade live STT | `TAXILA_STT_MODEL` (unset) → `DEPLOY_TRANSCRIBE` | `taxila-transcribe` = **gpt-4o-transcribe@2025-03-20** |
| realtime-lane input transcription | `routes/lesson.js:688` `DEPLOY.transcribe` | same gpt-4o-transcribe |
| lesson-end record (summary, parentNote, memories) | `routes/lesson.js:1503` `DEPLOY.fast` | `taxila-fast` |
| report Lane B | `reports/writer.js:107` `[DEPLOY.brain, DEPLOY.fast]` | `taxila-brain` → `taxila-fast` |
| closed grader | `DEPLOY_GRADE` / `DEPLOY_GRADE_FALLBACK` | `DeepSeek-V4-Pro` → `taxila-brain` |
| Forge G2 designer, critic, Q8; mini-kit | `DEPLOY_BRAIN` | `taxila-brain` (must not move with the report change) |

The reply, classify and distress roles have **no** model fallback in code. A fallback named in the router is only
an intention until a fallback path exists.

---

## A. Ship now: no further measurement needed, only the normal gates

**A1. gpt-6 parameter fix. This blocks every gpt-6 row.** It is in `server/azure.js:124`.
- Change the regex:
  - old: `const REASONING_FAMILY = /^(taxila-(fast|brain|codex)|gpt-5|o\d)/i;`
  - new: `const REASONING_FAMILY = /^(taxila-(fast|brain|codex|gpt6|gpt61)|gpt-5|gpt-6|o\d)/i;`
  - `taxila-gpt6` also prefix-matches `taxila-gpt6-luna` and `taxila-gpt6-astra`.
- In `chat()`, add an effort floor:
  - `const EFFORT_FLOOR = /^(taxila-gpt61-sol|taxila-gpt6-astra|gpt-6\.1|gpt-6-astra)/i;`
  - if `opts.effort === "none"` and the deployment matches, send `"low"`.
- **Why.** Today every gpt-6 call returns HTTP 400 ("max_tokens is not supported"). With
  `DEPLOY_CLASSIFY=taxila-gpt6-luna`, the real `classify()` gave 40/40 model errors, and the distress backup failed
  open: 6/10 right, 4 indirect cases missed (`gpt6-reasoning-family-regex-400`).
- **Side effect, intended.** `classifyHedgeMs()` returns 0 for the reasoning family, so gpt-6 deployments get no
  hedge, the same as taxila-fast.
- **Tests.**
  - Add unit cases to the azure test: `isReasoningFamily("taxila-gpt6-luna") === true`, and the effort floor for
    gpt61.
  - Re-run `node evals/classify-accuracy.mjs --models taxila-gpt6-luna,taxila-gpt6 --reps 2`. It must match the shim
    run: 34/40 and 38/40 exact, 0 graded wrong, distress 10/10.

**A2. Passive-ideation predicate gap.** It is in `server/director/safety.js`, `scanSafety()`.
- **Gap, measured during synthesis.** `scanSafety()` returns `distress:false` for both of these:
  - "I don't want to wake up tomorrow"
  - "kabhi kabhi lagta hai main na rahun toh"
- The production classifier catches both (S2 16/16), but mistral-m35 missed the first one 2/2, and ds41 missed
  both. The floor should not depend on which model holds the slot: safety by predicate.
- **Fix.** Add these shapes to the self-harm family, with tests and a benign-control check:
  - English: "don't/do not want to wake up", "wish I wasn't/weren't here", "better if I wasn't around".
  - Hinglish: "main na rahun", "main na rahu", "na rahun toh".
  - Devanagari: "मैं न रहूँ", "न रहूं तो".
- **Gates.** `evals/persona-invariants.mjs` and the predicate tests must pass. Check the benign-control set too, for
  example "neend nahi aa rahi, kal jaldi uthna hai" must stay false.

**A3. Live STT, eastus2 app: move off gpt-4o-transcribe.** Do it after the smoke in A3a. This is env only.
- **Change.**
  - `TAXILA_STT_MODEL`: unset → `taxila-live-transcribe`. Set it in the Container App env, or add it to the
    `deploy-azure.mjs` host-env block next to `DEPLOY_CLASSIFY`.
  - Leave `DEPLOY_TRANSCRIBE` alone. It also drives the push-to-talk batch `/audio/transcriptions`
    (`voice/speech.js:246`) and the realtime-lane transcription, and live-transcribe on those paths was not measured.
- **Why.** On the synthetic child Hinglish set (n=180 speech + 12 non-speech):

  | | gpt-live-transcribe (D4) | gpt-4o-transcribe (nearest arms to production) |
  |---|---|---|
  | CER | 0.028 | 0.236-0.294 |
  | item CER difference vs D4 | — | +0.208 [0.192, 0.224], worse on 30/30 items |
  | graded answers right | 76/78 [0.94, 0.99] | 49-53/78 [0.56, 0.74] |
  | output on non-speech clips | 0/12 | 4/12-12/12 |

  The router chose live-transcribe on 2026-10-03, but it was never applied.
- **A3a smoke, required, about 30 minutes.** live-transcribe returned no logprobs in a transcription session
  (n=1, 2026-10-02). With the switch, `asrConfidence` becomes undefined, and classify's low-ASR gate
  (`classify.js:303`) stops firing. Before shipping:
  1. Mint `sttSession({ model: "taxila-live-transcribe" })` through the real route and check that the session
     accepts `include: ["item.input_audio_transcription.logprobs"]`. If it rejects the field, drop `include` for this
     model only.
  2. Speak 5 utterances and confirm that deltas and `completed` events arrive.
  3. Run `evals/cascade-latency.mjs` (n≥20) with `TAXILA_STT_MODEL=taxila-live-transcribe`.
- **Note.** Losing the gate is accepted on the measured balance: the gate existed to catch gpt-4o-transcribe
  inventing text, and live-transcribe invented none (0/12). The owner should still hear this trade-off.
- **Keywords.** Wiring per-lesson keywords, which `stt.js` marks "not wired yet", is a separate code change worth
  about -0.016 CER (prompt-only arm vs D4).

**A4. Image lanes: offline scripts and the future Studio image lane.** There is no server image route today.
- Set `DEPLOY_IMAGE` to `taxila-image25-flare` with `quality: "low"`. Fall back to `taxila-image` with `quality: "low"`
  on a 429 or a filter refusal, then to `taxila-image25-sunburst` low for diagrams where correctness outweighs
  about 28 s.
- Never use `quality: "medium"`.
- Keep the human label check, and keep labels as kit-term overlays (`diagram-router-no-baked-labels`).
- Flare quota is 4 RPM for the whole subscription (`image-capacity-pool-2026-10-04`), so the gpt-image-2 regional
  pool carries overflow.

**A5. Infra and eval hygiene. This is not product code.**
- Delete the `taxila-flux2-flex` deployment (measurement only; rejected).
- Fix `evals/live-studio/run.mjs`. Its repair prompt crashes on `JSON.stringify(c.detail).slice` when `detail` is
  undefined, and failed builds vanish from the results. Guard it with `JSON.stringify(c.detail ?? null)`.

---

## B. Ship after the A1 fix plus a named check (no more n needed)

**B1. Lesson-end record → gpt-6-sol.**
- **Change.**
  - Add the role `get write() { return process.env.DEPLOY_WRITE || "taxila-gpt6"; }` to `DEPLOY` in `server/azure.js`.
  - `routes/lesson.js:1503`: change `chat(DEPLOY.fast, …)` to `chat(DEPLOY.write, …)`, and on a model error retry
    once on `DEPLOY.brain`.
  - Do **not** set `DEPLOY_BRAIN=taxila-gpt6`. That would also move the Forge G2 designer, critic and Q8 safety
    classifier and the mini-kit blind solve, and none of those were benched on gpt-6-sol.
- **Evidence.** W2, hard sheet (n=10 per model per judge, out-of-family judges):
  - fast vs brain -0.35 [-0.50, -0.20]
  - gpt-6-sol vs brain +0.40 [0.20, 0.60]
  - These intervals do not overlap.
  - The internal note leaked 0/10 for every model.
  - About $0.008 per record.
- **Check.** The lesson-end tests must pass, including the memories rules: no religion, caste, health or names, and
  every memory cites a child turn. Then read one replayed lesson by hand.

**B2. Report Lane B → gpt-6-sol.**
- **Change.** `reports/writer.js:107`: deployments `[DEPLOY.brain, DEPLOY.fast]` → `[DEPLOY.write, DEPLOY.brain]`.
  In `reports/config.js:55`, add `"taxila-gpt6": { in: 2, out: 10 }` to `PRICE_MICRO_USD`. Without it the budget
  pre-check prices gpt-6-sol at the `{4, 20}` default.
- **Why.** It costs half as much per token as brain, and W2 does not show it worse. Lane B only orders approved ids,
  so the W2 writing win is indirect evidence: this is a cost tie-break.
- **Check.** Replay the `reports-lane-b-brain-2026-10-03` harness. The invalid-output rate must be no higher than
  brain's, and the spoken-script budget must still hold.

---

## C. Needs more n before shipping

**C1. Live reply primary → `taxila-gpt6-luna`** (`DEPLOY_REPLY=taxila-gpt6-luna`).
- **Evidence.** On the production prompt it beat fast by +0.53 [0.08, 1.00], with fewer guard fires (12/36 vs 16/36).
  On the toy prompt it tied: 0.00 [-0.30, 0.30].
- **Cost.** +226 ms TTFT at p50.
- **Needs.**
  - The A1 fix.
  - `evals/cascade-latency.mjs` on the full guarded turn, n≥20.
  - The Hindi ear panel.
  - Speculation is cheaper, not dearer: about $0.11 vs $0.23 per 1k replies.

**C2. Studio race → gpt-6-sol low + terra low, with gpt-6-luna low as the third arm.**
- **Change.** In the Live Studio arm config (W2 stream, not in `server/` yet):
  - Remove `taxila-brain` and `taxila-studio-sol` from the race.
  - Keep `taxila-codex` for 429s only.
- **Evidence.** P(passed build by 60 s): 15/15 [0.90, 1.00] vs 10/15 [0.50, 0.80] for today's pair (n=15).
- **Needs.** n=10 per archetype, and the A5 harness fix first.

**C3. Fallback paths for reply and classify.** This is a code change (main loop); today there are none.
- **Reply.**
  - Fall back to `taxila-mistral-m35` on a timeout or 5xx from `DEPLOY.reply`.
  - The fallback reply must go through the same guards.
  - Record Mistral's minimum-age and acceptable-use terms (R7) before this ships.
- **Classify.**
  - Fall back to `taxila-fast` (OpenAI family; 37/40 on the real `classify()`, S2 16/16).
  - **Not** mistral-m35. That replaces the text-lane recommendation, because mistral missed passive ideation
    (S2 14/16) and the classifier's model also reads distress.
- **One option, unmeasured.** Point the classify hedge's duplicate at `taxila-fast` instead of the same grok
  deployment. That would give a cross-family fallback at no extra latency. Measure hang rate and accuracy first.

**C4. India-lane STT → MAI-Transcribe-2-Streaming** (`stt-mai2-stream-primary-india-2026-10-04`, main-loop
decision). It is not wired.
- **Before children use it:**
  - The Cost Management check on 2026-10-06 must show its charge on an Azure Speech meter in our subscription (R5).
  - The owner must sign off that a Preview model may process children's audio.
  - A barge-in check is needed, because its first partial arrives at 2.6 s vs 1.4 s.
- **Fallback.** `taxila-live-transcribe`.

---

## Not changing

- **Classify primary.** It stays `grok-4-1-fast-non-reasoning`. In the same-day head to head on the real
  `classify()` (n=40):

  | model | exact | p50 |
  |---|---|---|
  | grok-4-1-fast-nr | 38/40 [0.89, 0.98] | 726 ms |
  | mistral-m35 | 40/40 [0.96, 1.00] | 693 ms |
  | taxila-fast | 37/40 [0.85, 0.96] | 1063 ms |

  The intervals overlap, and the latency difference is noise. On S/S2, grok-4-1 scored 16/16 and 16/16 at about
  470 ms p50. Files: `synthesis/results/classify-h2h-2026-10-04.json`, `synthesis/results/S-2026-10-04.json`.
- **Distress primary and fallback.** They are unchanged.
- **The code kernel.** It keeps every per-turn and per-beat decision (orchestration probe).
- **Premium voice, cascade TTS, OCR and embeddings.** They were not re-measured.
