# Stagecraft: context write-up (to append to `context/*.md` when the main loop merges `context/inbox/stagecraft.json`)

2026-10-05. Ids match the inbox nodes. `context/*.md` are existing files, so this text is staged here and not
written into them.

---

## For `context/decisions.md`

### `stagecraft-lossless-reveal`
The code policy (`server/stagecraft/policy.js wantAt`, called from the kernel by patch P4) picks the idea. Its input
has no portfolio field. Stagecraft only serves that idea, at the best fresh and checked rung.
- **Evidence.** Over 240 simulated lessons, 9208 of 9208 want points were identical with speculation off and on.
- **The bug the shadow arm caught.** The first build let the kernel's request state depend on which rung served (see
  `rj-sc-request-answered-only-on-reveal`).
- **Reverse if** E-ST7 shows that a readiness-aware policy improves host-graded outcomes with 0 stale, off-topic or
  safety regressions.

### `stagecraft-validity-key-at-reveal`
A candidate is fresh while its premise (`ValidityKey`) matches the state.
- **How.** Invalidation runs on every state input. The premise is then checked again at the reveal point (topic, skill,
  lesson, kit, language, band, item if item-bound, and a resolved target misconception).
- **Evidence.** 0 stale reveals over 5368 served points. The scripts include topic changes, language flips and
  repaired misconceptions.
- **Reverse if** stale reveals stay at 0 over at least 1000 points with the reveal-time check removed.

### `stagecraft-tiered-eagerness`
| tier | starts when |
|---|---|
| spec | on weak signals, just in time (lead ≤ 90 s), P(ready by deadline + 2.5 s) ≥ 0.15 |
| image | on stable intent, or plan lead ≥ 20 s and ≥ the tier's p90 |
| live | only on planned lookahead with lead ≥ 90 s (and ≤ 10 min); λ = 0 (the LIVE-STUDIO caps, router and breaker govern spend) |

**Reverse per tier** when that tier's measured p90 falls below the median child-turn length.

### `stagecraft-board-twin`
Every candidate carries a board twin built in code, with the same values.
- **Where it is used.** It answers "nothing is ready", and it replaces a piece whose mount failed.
- **Device side.** `src/stagecraft/stage.ts` never paints an empty stage or an unpainted piece (5000 random event
  streams).
- **Simulation.** 0 visible failures with 1% injected mount failures.
- **Reverse if** engine mount failures are 0 over at least 2000 real mounts.

### `stagecraft-reply-lane-isolation`
Stagecraft protects the reply lane in three ways:
- It never calls the reply deployment.
- It is quiet from `committed` until 1.5 s into `her_turn`.
- A reply 429 pauses spec launches for 60 s.

The spec chain is `taxila-stagecraft` (O-1, absent) → `taxila-fast-bg` → `taxila-gpt6-luna` →
`taxila-mistral-m35` → no build.

**E-ST4 result.** Reply TTFT p50 958 → 876 ms and p90 1173 → 1294 ms under load, with n = 30 each. That is too few
replies to resolve a 50 ms difference at p90.

**Reverse if** an n ≥ 200 run shows a p90 regression of 10 ms or less with no quiet window.

### `stagecraft-probe-then-contrast`
How the policy times a contrast piece:
- A misconception revealed this lesson is contrasted at the next reveal point. She probes ("kyun?") on the turn that
  revealed it.
- A misconception known from earlier sessions waits for the contrast beat.
- A misconception the child has repaired is not contrasted again.

The extra turn gives the spec time to build: contrast readiness was 0.90 (n 121), against 0.32 when built on demand.

**Reverse if** E-ST7 shows that an immediate contrast improves host-graded post-items.

### `stagecraft-shared-idea-families`
A request joins the family of the idea it asks for:

| the child says | family |
|---|---|
| "game" | practice |
| "diagram" / "animation" | explain |
| "dusre tarike se" | re_represent |

So lookahead and signal speculation serve requests too: request readiness was 0.85 (n 967), against 0.77 on demand. A
newer request un-pins a shared family; it does not kill it.

**Reverse if** at least 20% of the requests in E-ST7 want a piece other than the planned idea.

### `stagecraft-spec-default-deployment`
Until O-1, specs run on `taxila-fast-bg`.
- **Why not `taxila-gpt6-luna`.** It carries the live whiteboard (`w2f-luna-reserved-for-whiteboard`).
- **E-ST4 comparison:**

| deployment | usable | p50 / p90 | $ per spec |
|---|---|---|---|
| `taxila-fast-bg` | 28/30 | 5373 / 7949 ms | 0.0013 |
| `taxila-gpt6-luna` | 30/30 | 5797 / 8216 ms | 0.0006 |

**Reverse if** the whiteboard gets its own deployment. Luna is then the cheaper choice.

### `stagecraft-frequency-target`
Targets per 25-minute lesson: at least 6 child-specific generated pieces and at least 12 stage moments.
- **Simulated.** 20.3 pieces and 35.0 moments (W2 today: 1.7 and 12.9).
- **Open risk.** The stage is active 0.85 of the lesson, above the 35-55% band. Seductive detail is the risk; see
  `open-stagecraft-stage-too-busy`.
- **Reverse (lower)** on E-ST7 harm. **Raise** if there is no harm at 1.5×.

### `stagecraft-max-families-6`
Stagecraft allows at most 6 open families, and bounds only speculative candidates (at most 24).
- **Evidence (E-ST3, 80 lessons).** At 4 families, readiness was 0.86 and waste $0.0675 per hour. At 6, readiness was
  0.89 and waste $0.0528 per hour.
- **Reverse if** a sweep of at least 200 lessons shows 4 families within 0.01 readiness at lower waste.

---

## For `context/measurements.md`

### `stagecraft-sim-2026-10-05`
**Method.** E-ST1, `node evals/stagecraft/run.mjs --n 240`, 2026-10-05.
- 240 scripted lessons, classes 4-7, maths and science, with real kit topic ids and misconception ids. The lessons
  include fast and slow children, topic changes, misconceptions (some self-corrected), the four request kinds,
  disengagement, safety turns, 429 storms, failed specs (the bench's fall-back rate), bad late binding (5%) and mount
  failures (1%).
- Everything runs through the real `conductor.step()` and `policy.wantAt()`.
- Build times are lognormal, from the RS-4 spec bench (n = 30 per archetype), the router bench (n = 30 per archetype)
  and flare.

**Right artifact ready when needed, by arm:**

| arm | readiness |
|---|---|
| W2 today | 0.28 |
| Stagecraft, built on demand | 0.61 |
| Stagecraft, speculative | **0.89** |
| one candidate per family | 0.87 |

**Readiness by trigger (speculative arm):**

| trigger | readiness | n |
|---|---|---|
| plan-led | 0.85 | 2451 |
| request | 0.85 | 967 |
| contrast | 0.90 | 121 |
| signal | 0.89 | 623 |
| board reteach | 0.98 | 1206 |

**Other results:**
- Wrong, stale, safety, child-speaking and off-topic reveals, and visible failures: all 0.
- Spend: $0.081 per lesson-hour, of which $0.043 was wasted.
- Per 25 minutes: 20.3 generated pieces, 35.0 stage moments, 26.9 specs.
- Request to first frame: p50 2782 ms, p95 3397 ms. This is a modelled clock, not measured.
- Lossless: 9208/9208.

**Targets missed:** plan-led readiness 0.85 (target 0.95); stage active share 0.85 (band 35-55%); specs per 25 minutes
26.9 (target 60-150).

### `stagecraft-est4-real-2026-10-05`
**Method.** E-ST4, `evals/stagecraft/real-arm.mjs`, 2026-10-05. Spend: $0.876, plus $0.073 for the smoke run.

| what | n | result |
|---|---|---|
| specs, 3-wide, production builder | 60 | 58 usable; p50 5577 ms, p90 7949 ms (target p90 ≤ 6 s **missed**) |
| flare-low images | 10 | p50 15461 ms, p90 18483 ms; one 429 failed over to gpt-image-2 low |
| `buildRace` + local gate | 12 | 12 passed; p50 35.7 s, p90 51.8 s; $0.062 per race |
| reply TTFT, alone vs under load | 30 + 30 | p50 958 → 876 ms; p90 1173 → 1294 ms; 0 reply 429s |

### `stagecraft-est2-calibration-2026-10-05`
- **hit@1/3/5:** 0.272 / 0.844 / 0.932, over 4894 points.
- **Observed vs prior pNeed:**

| source | prior → observed |
|---|---|
| plan | 0.8 → 0.65; 0.5 → 0.30; 0.3 → 0.14 |
| partial | 0.45 → 0.35 |
| request | 1.0 → 0.81 |
| board | 0.35 → 0.45 |

- **ECE:** plan 0.17, request 0.19, signal 0.08.
- These values come from the simulator. Refit them on shadow logs.

### `stagecraft-est6-safety-2026-10-05`
- 80 lessons, each with a distress turn: 0 stage changes and 0 builds during the quarantine.
- 10,000 random input streams: every law held, and replay was deterministic.

### `stagecraft-storm-2026-10-05`
60 lessons: 65 429s and 65 failovers, 0 visible failures, readiness 0.90.

### `stagecraft-est3-sweeps-2026-10-05`
80 lessons per setting. Baseline: readiness 0.89, $0.089 per hour.

| setting | readiness | $ per hour |
|---|---|---|
| λ = 25 | 0.89 | — |
| λ = 100 | 0.83 | 0.069 |
| minPReadySpec = 0.4 | 0.89 | — |
| spec concurrency 2 | 0.88 | — |
| half-life 10 s | 0.89 | — |
| spec max lead 45 s | 0.86 | — |
| spec max lead 180 s | 0.90 | 0.090 |
| 4 families | 0.86 | 0.102 |

---

## For `context/rejected.md`

### `rj-sc-family-level-value-gain`
**Tried.** Scoring a spec's value gain against the best ready candidate in its whole family.

**What broke.** A sibling archetype's ready spec zeroed the gain for the archetype the policy actually picks. That spec
was never built, and the engine default served instead. The gain is now computed per (family, archetype).

### `rj-sc-request-own-family`
**Tried.** Giving each request its own family (`|req<seq>`).

**What broke.** The plan and signal speculation for the same idea never served the request.

### `rj-sc-unbounded-spec-lead`
**Tried.** Launching specs as soon as their beat appeared in the lookahead.

**What broke.** The specs went stale (4 minutes unrevealed) and were sent to the library before their beat came. The
fix is just in time: launch at a lead of 90 s or less.

### `rj-sc-reshow-after-retire`
**Tried.** Letting the policy want the same family again right after the seam retired it.

**What broke.** The piece ping-ponged back onto the stage: stage moments reached 42 per 25 minutes and stage active
share 0.94.

### `rj-sc-request-answered-only-on-reveal`
**Tried.** Treating a request as answered only when its outcome was a reveal.

**What broke.** The kernel's state started to depend on which rung served, and lossless fell to 0.9974. A request is
now answered as soon as its idea is on stage.

### `rj-sc-lambda-on-live`
**Tried.** Applying λ·cost (λ = 50 per USD) to live races.

**What broke.** Every race scored below zero, so no live build ever started for topics with no engine.

### `rj-sc-luna-default-spec`
**Tried.** `taxila-gpt6-luna` as the default spec deployment.

**What broke.** That deployment carries the live whiteboard.

### Rejected by design (STAGECRAFT.md §10)
- `rj-sc-reveal-when-ready`
- `rj-sc-model-decides-reveal`
- `rj-sc-live-build-from-partial`
- `rj-sc-same-archetype-k`
