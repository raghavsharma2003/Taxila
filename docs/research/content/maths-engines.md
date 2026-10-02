# Taxila maths engines: the manipulative library for Classes 1–9

**Date:** 2026-10-02 · **Scope:** every maths chapter in `data/curriculum/c{1..9}-maths.json` (120 chapters, 304 topics, 344 seeded misconceptions) · **Builds on:** `tech-and-market.md` §3 (T0/T1 engines, postMessage bridge, 1.7 observations) and `learning-science.md` (§2.4 multimedia, §7 probe catalogue P1–P24, §7.2 fusion rules). Neither is repeated here.
**Companion data:** `maths-engine-map.json` maps all 304 topic ids to a primary engine plus secondary engines. The coverage numbers below are computed from it, not estimated.

| tag | meaning |
|---|---|
| **[V]** | verified today against the primary source (paper PDF or abstract, NCERT chapter PDF, repo) |
| **[S]** | secondary: search summary or abstract page, not checked against the full text |
| **[M]** | from memory of the literature, not re-checked this session (the session ran out of web-search budget part-way through) |
| **[U]** | our design hypothesis or estimate. Taxila must measure it before relying on it |

Topic shorthand: `c4-05-01` means `c4-maths-ch05-t01`.

---

## 0. TL;DR (decisions)

1. **25 engines cover all 304 maths topics.** Ten P0 engines are the primary engine for **163 topics (53.6%)**, and P0+P1 (21 engines) for **275 (90.5%)**. Class 9 is the exception: P0+P1 reaches only **71%**, because probability, solids, algorithms and expression-manipulation are P2. If Class 9 is a launch class (it is the new *Ganita Manjari* book, where little aligned content exists yet), pull `chance` and `solids` forward. Reversal condition: launch-class decision.
2. **Every engine is a three-stage concreteness-fading engine, not a toy.** It has `stage: concrete | pictorial | abstract`, plus a `linked` mode that puts the live symbol next to the model. Each concept ends at the abstract stage. Evidence: fading beat concrete-only and abstract-only on transfer for 2nd and 3rd graders (Fyfe, McNeil & Borjas 2015) **[S]**. Children who were fluent with blocks did no better on written symbols when the two were never linked (Resnick & Omanson 1987, via Willingham 2017) **[S]**.
3. **Concrete means bland and familiar, never toy-like.** Use seeds, matchstick bundles, flat-shaded rotis and ribbons. Do not use characters or animal counters. Perceptually rich objects that children already know hurt preschool counting (Petersen & McNeil 2013, n = 133) **[S]**. Bland manipulatives gave larger effects on transfer and problem-solving (Carbonneau et al. 2013) **[S]**.
4. **The voice teacher is the "high guidance" that the manipulative literature says is the main moderator.** Engines never run unguided free play. They emit semantic events that the teacher narrates around (Carbonneau 2013: high guidance gives larger effects) **[S]**.
5. **The number line is the hub representation.** Every number engine can project to it, and it carries the cheapest continuous number-sense metric we have: percent absolute error (PAE) on unticked lines. The evidence: Number-line training transferred to fraction comparison; area-model training did not (Hamdan & Gunderson 2017, n = 114) **[V]**. Number-line performance correlates r = .33–.43 with maths, but only β = .13 after controlling for cognitive ability (Ünal et al. 2024, 162 studies) **[V]**. So PAE is a proxy metric, not a lever to optimise directly.
6. **Misconception detection lives in the engine, as deterministic rules over semantic events.** A detector emits `misc_signal`, which only *schedules a verifying probe* (learning-science §7.2 rule 2). It never moves mastery itself.
7. **All 25 engines support `predict` and `contrast` (probes P5 and P8), and 21 support `translate` (P14).** The four without translate (`symmetry`, `geo-construct`, `algebra-moves`, `rule-lab`) work inside a single representation by design. Probe correctness is computed by engine maths, never by the LLM.
8. **Follow NCERT's own models where the book has them.** Ganita Prakash 6 Ch 10 teaches integers with a lift in "Bela's Building of Fun" (floors −5 to +6), green and red tokens with zero pairs, bank credits and debits, sea level, and temperature **[V]**. The `integers` engine reproduces exactly these, and `algebra-tiles` reuses the same colours, so zero pairs carry over from Class 6 to Class 9.
9. **Licences.** PhET sim *code* is GPL-3.0 **[V]**. Write our own engines and use PhET designs only as reference. Historical sims can still be embedded as-is under CC BY 4.0 (tech-and-market §3.1). The Math Learning Center apps are licensed only for personal or internal use **[S]**. They are reference only. Rupee images are stylised drawings, not replicas (§5 E14).

---

## 1. Evidence → design rules

| finding | source | rule it forces |
|---|---|---|
| Virtual manipulatives vs other instruction: **d = 0.35** (66 reports; 32 with data; 82 effect sizes). Virtual vs physical: small **d = 0.15** favouring virtual (38 comparisons) | Moyer-Packenham & Westenskow 2013 **[S]** | On-screen manipulatives are a legitimate main path, not a poor substitute |
| Concrete manipulatives vs symbols only: small-to-moderate; **moderate-large on retention, small on transfer**. High guidance gives bigger effects; **bland > rich on distal tasks**; **least effective at ages 3–6** | Carbonneau, Marley & Selig 2013 (*J Ed Psych* 105:380) **[S]** | Teacher-guided only (R3); bland skins (R2); 6-year-olds get a short concrete stage and a fast fade |
| Concreteness fading beats concrete-only and abstract-only on equivalence transfer (balance scale → worksheet → numerals), grades 2–3 | Fyfe, McNeil & Borjas 2015 (*L&I* 35:104) **[S]**; review: Fyfe et al. 2014 (*EPR*) **[M]** | R1: three stages per engine, ending abstract |
| Fading is less generalisable outside maths; benefit clearest at delayed test for low-prior-knowledge learners | conceptual analysis, *EPR* 2021 (ERIC EJ1310124) **[S]** | Stage choice depends on mastery: experts start abstract with a "show me" fallback (expertise reversal) |
| Rich, familiar objects hurt counting (dual representation); realistic simulations sped learning but hurt transfer; detailed play money cut conceptual errors but raised calculation errors | Petersen & McNeil 2013; Goldstone & Sakamoto 2003; McNeil et al. 2009, via Willingham 2017 **[S]** | R2: concrete skins are flat, low-detail, culturally familiar, and have no play meaning |
| Fluency with Dienes blocks did not transfer to written subtraction | Resnick & Omanson 1987 via Willingham **[S]** | R4: simultaneous linking (live symbolic readout) is on by default from the pictorial stage |
| Affordances of virtual manipulatives: *focused constraint, creative variation, simultaneous linking, efficient precision, motivation* | Moyer-Packenham & Bolyard 2016 **[S]** | Engines enforce maths constraints (equal parts, exact angles) unless the probe is about the constraint (R5) |
| Number line > area model for fraction magnitude transfer (n = 114, grades 2–3, two 30-min sessions) | Hamdan & Gunderson 2017 **[V]**; unidimensionality is the active feature (Gunderson et al. 2019) **[S]** | Fractions default to the bar plus number line; circles are for part-whole only |
| Linear (not circular) number board games improve low-income preschoolers' magnitude, estimation and counting for at least 9 weeks; meta-analysis: 18 studies, 123 effect sizes, nine moderators incl. dosage and board features | Siegler & Ramani 2009 **[S]**; Nelson et al. 2025 (*RER*) **[S]** | Games on a number track must be linear and numbered 1→N left to right |
| Number-line estimation vs maths: r = .33 (whole), .41 (fractions), .43 (broad); β = .13 after cognitive ability (162 studies, 33,101 people) | Ünal et al. 2024 (*Dev Sci*) **[V]** | PAE is logged as a proxy metric. It is never optimised for its own sake |
| Balance model: 34 articles, "a clear pattern could not be identified" **[V]**. Reviewed studies report it struggles with negatives, subtraction and equations detached from the model **[S]** | Otten, Van den Heuvel-Panhuizen & Veldhuis 2019 | `balance` covers positive-term equality and simple equations. Negatives hand off to tokens and tiles |
| Equal sign read as "do something": 8 + 4 = __ + 5 → 12 | Falkner, Levi & Carpenter 1999; Knuth et al. 2006, cited in Otten 2019 **[V]** | `balance` runs from Class 1 (c1-05-01), not only at algebra |
| Mental abacus, Vadodara RCT (n = 190, 3 yrs): arithmetic gains, mediated by baseline spatial working memory. One-year US trial (n = 180): no arithmetic gain, and only **21%** of first graders could decode a multi-digit abacus | Barner et al. 2016 **[S]**; Barner et al. 2018 (*J Numerical Cognition*) **[V]** | The abacus is an optional non-proportional *view* inside `place-value` (C3+, and base-n in C8). It is never a primary model |
| Grade 7, n = 1,850, 9 × 30 min: DragonBox **g = .269**, From Here to There (legal-moves-only dynamic algebra) **g = .135** vs active control. Earlier: DragonBox high engagement but weak link to paper algebra | Decker-Woodrow et al. 2023 (*AERA Open*) **[V]**; Dolonen & Kluge 2015 **[S]** | `algebra-moves` is worth building, and every game session ends with a symbolic step |
| Clock reading: of 725 Belgian children, the 154 with maths difficulties did worse at clock reading **[S]**. In a later study's interviews with 20 third graders at dyscalculia risk, 12 confused the hour and minute hands **[S]** | Burny, Valcke & Desoete 2012; ERIC EJ1258500 (2020) | `clock` geared hands; detector for swapped hands |
| Seductive details hurt (retention d = −0.30, transfer d = −0.48); songs only for verbatim content | learning-science §2.4 (Rey 2012) **[S]** | R6: no decorative animation, confetti or mascots inside an engine |

**Binding rules for every engine**

- **R1 Stages.** `concrete → pictorial → abstract`. The planner picks the start stage from mastery and age band. Default: concrete for unseen skills at ages 6–9, pictorial at ages 10–15. Promotion and demotion are in §3.4.
- **R2 Bland concrete.** Indian everyday objects in a flat style: imli seeds, matchstick bundles (as in TaRL classrooms **[M]**), rotis, atta bags, milk pouches, a tarazu. No faces, animals or branded toys.
- **R3 Guided.** Every mount has a goal or a probe. After `idle ≥ 20 s` the engine emits `idle`, and the teacher re-engages (tech-and-market §1.7).
- **R4 Simultaneous linking.** From the pictorial stage onward, the symbolic readout (numeral, fraction, equation) updates live. At the concrete stage it appears after the child commits.
- **R5 Focused constraint.** Engines enforce the maths (exactly equal parts, exact angles, legal algebra moves). A probe can relax a constraint to diagnose it, for example `equalOnly: false` asks "are these halves?".
- **R6 No seductive details.** Feedback is a short tick or shake and a sound cue. The only reward is the teacher's voice.
- **R7 Correctness by engine maths.** The LLM fills `params`, `goals` and `probe`. The engine computes truth: exact rational arithmetic (numerator and denominator as integers, never floats), integer paise, integer minutes.
- **R8 Tap-first.** Every action is possible with taps (tap source, tap target). Drag is optional. Hit targets are ≥ 48 dp at ages 6–9 and ≥ 40 dp at 10–15. Everything works at 360 × 640 in an Android WebView **[U]**.
- **R9 Bilingual.** Labels have `{en, hi}`. Spoken Hinglish comes from the teacher, not the engine. Numerals default to Latin digits (`numerals: "latn"`), with `"deva"` available. Number names are shown in both languages, because Hindi 1–99 names are largely irregular **[S, non-academic sources]**. Whether that irregularity drives the "46 → 406" type of error is **[U]**.
- **R10 Deterministic.** Engines are seedable and serialisable (`getState()` / `setState()`), so a lesson replays exactly and golden tests are stable.

---

## 2. Prior art: what to copy, what to avoid

| product | what it gets right | licence / use for Taxila |
|---|---|---|
| **PhET** maths sims (Fractions Intro, Number Line: Integers, Equality Explorer, Make a Ten, Area Model, Mean: Share and Balance, Plinko Probability **[M: titles]**) | research-tested designs, implicit scaffolding | sim content CC BY 4.0 for the historical collection, **new sims CC BY-NC since 2026-03-29** (tech-and-market) **[V]**; **source code GPL-3.0** **[V]**. Use as design reference and embed as-is; do not copy code into proprietary engines. Telemetry needs licensed PhET-iO |
| **Math Learning Center** apps (Number Frames, Number Pieces, Geoboard, Money Pieces, Fractions, Number Line, Math Clock, Pattern Shapes) | canonical primary-grade app set; the de facto feature list | "personal or internal business purposes" licence **[S]**: reference only |
| **Mathigon Polypad** (now Amplify) | best-in-class tile, fraction and algebra-tile canvas | proprietary **[M]**: reference only |
| **GeoGebra / Desmos** | dynamic geometry and graphing | GeoGebra needs a commercial licence **[U]**; Desmos (Amplify) is proprietary **[M]**. Build `geo-construct` on JSXGraph (LGPL/MIT dual **[U: legal check]**) |
| **CODAP** (Concord Consortium) | data-moves for school data | MIT **[M]**. Could back the advanced `data-graphs` views |
| **DragonBox / FH2T (Graspable Math)** | legal-moves-only algebra; strongest RCT evidence among algebra games | evidence only (§1); `algebra-moves` is our own implementation |
| **Synthesis Tutor** | AI teacher driving hand-built manipulatives: the quality bar | product reference (tech-and-market §3.1) |
| **NCERT books** | Bela's lift, token model, "Grandmother's quilt" area, Virahanka rhythms, mean as balance | **use the book's own representations**, so Taxila agrees with school; write our own text (NCERT copyright, tech-and-market §7.2) |

Gap no product fills: a manipulative that **streams semantic events and misconception signals to a live voice teacher**. MLC, Polypad and Desmos are silent canvases, and PhET-iO is a licensed research API. This contract (§3) is Taxila's actual differentiator in the engine layer **[U]**.

---

## 3. Common contract (all engines)

### 3.1 Manifest and module spec

```ts
// packages/engines/core/types.ts
export type Stage = "concrete" | "pictorial" | "abstract";
export type ProbeKind = "predict" | "contrast" | "translate" | "diagnose" | "spot_error" | "construct" | "estimate";
export type L10n = { en: string; hi: string };
export type MathValue =
  | { t: "int"; v: number } | { t: "frac"; n: number; d: number } | { t: "dec"; s: string }   // "0.125", exact
  | { t: "money"; paise: number } | { t: "time"; min: number } | { t: "point"; x: number; y: number }
  | { t: "expr"; s: string }                                                                // parsed by the engine's CAS-lite
  | { t: "state"; preset: string };                                                         // engine-specific preset id

export interface EngineManifest<P> {
  id: `${string}@${number}`;            // "fractions@1"
  title: L10n;
  paramsSchema: import("zod").ZodType<P>;  // LLM output → safeParse; engine clamps ranges (tech-and-market §3.3)
  describe: string;                      // ≤ 600 chars; becomes the show_module tool's engine description
  stages: Stage[];
  representations: string[];             // translate endpoints, e.g. ["symbol","bar","circle","numberline","story"]
  probes: ProbeKind[];
  events: string[];                      // semantic event types this engine can emit (namespaced, §3.2)
  detectors: MiscDetectorDecl[];
  budget: { gzipKB: number; maxNodes: number };   // P0 target ≤ 120 kB gz each, solids/geo ≤ 400 kB lazy [U]
}

export interface ModuleSpec<P> {
  engine: string; module_id: string; objective_ids: string[]; topic_ids: string[];
  lang: "en" | "hi" | "hi-Latn+en"; numerals: "latn" | "deva";
  stage: Stage; linked: boolean;
  fade?: { auto: boolean; promoteAfter: number; demoteAfterErrors: number };   // defaults 3 / 2
  skin?: string;                          // concrete skin id: "roti", "matchstick-bundles", "tarazu"...
  locks?: string[];                       // disabled actions (focused constraint)
  params: P;
  goals?: { id: string; say: L10n; check: Check }[];   // Check = engine predicate id + args; evaluated in-engine
  probe?: ProbeSpec;
}

export type ProbeSpec = { id: string; ask: L10n } & (
  | { kind: "predict"; commit: Commit; reveal: "animate" | "run" | "show"; expect: Expect }
  | { kind: "contrast"; cases: string[] /* 2–3 state presets differing ONLY in the target feature */;
      question: "which_is" | "what_differs" | "same_or_different"; property: string; expect: Expect }
  | { kind: "translate"; from: { rep: string; value: MathValue }; to: string }     // child builds `to`; checked for maths equivalence
  | { kind: "diagnose"; options: { value: MathValue; misc?: MiscId }[] }           // P7: each distractor maps to a misconception
  | { kind: "spot_error"; worked: string /* preset */; planted: MiscId; errorAt: string }   // P6; only after basic mastery
  | { kind: "construct"; constraints: Check[]; minSolutions?: number }              // P3/P13
  | { kind: "estimate"; value: MathValue; lo: MathValue; hi: MathValue });          // unticked line → PAE
export type Check = { pred: string; args?: Record<string, MathValue | number | string> };   // engine-defined predicate id
export type Commit = "tap_option" | "place_marker" | "set_value" | "build" | "voice";   // voice: host relays the ASR answer
export type Expect = { correct: MathValue; distractors?: { value: MathValue; misc: MiscId }[] };
export type MiscId = `MC.${string}`;    // e.g. "MC.FRAC.BIGGER_DENOM"; joined to curriculum topic misconceptions
export interface MiscDetectorDecl { misc: MiscId; topics: string[]; on: string; rule: string; strength: "weak" | "strong"; verify: ProbeKind[] }
```

### 3.2 Events (iframe → host)

Engine events ride in the existing bridge (tech-and-market §3.4), with a flat `payload` of at most 12 keys of type string, number or boolean. **Proposed bridge v2:** extend `ModuleEvent.event` with `"action" | "probe_open" | "probe_commit" | "probe_result" | "misc_signal" | "stage_change" | "state"`, keeping the existing `ready | param_change | goal_met | answer | idle | error`. When `event` is `"action"`, `payload.type` is the namespaced engine event, such as `fr.cut`.

| event | payload (flat) | emitted when |
|---|---|---|
| `action` | `type`, engine fields (see each engine), `seq` | each semantic act, **not** raw pointer moves; ≤ 4 Hz after debounce |
| `probe_open` / `probe_commit` | `probe_id`, `kind`; on commit also `value` (serialised MathValue), `latency_ms`, `changes` (edits before commit) | commit = the child locks an answer (latency feeds P18 as a tie-breaker only) |
| `probe_result` | `probe_id`, `outcome: correct\|misc\|other`, `misc?`, `attempt` | the engine evaluates against `expect` |
| `misc_signal` | `misc`, `strength`, `source` (event type), `count_session` | a detector rule fires |
| `goal_met` | `goal_id`, `attempts`, `hints`, `ms` | goal predicate true |
| `stage_change` | `from`, `to`, `reason: promote\|demote\|teacher` | fading machine or teacher command |
| `state` | `summary` (≤ 240 chars), `hash` | reply to `snapshot`, and on every milestone |
| `idle` | `ms` | no action for 20 s (R3) |

### 3.3 Host → engine commands and the teacher's "eyes"

`HostCmd.cmd` gains `set_stage`, `open_probe {probe}`, `demo {moves[]}`, `highlight {target}`, `lock {actions}`, `snapshot`, and `record_answer {probe_id, value, source:"voice"}`.
- `demo` animates a scripted move list, so the teacher's narration and the engine stay in step (temporal contiguity).
- `record_answer` lets a spoken answer close a probe.

Each engine implements `summarize(state, recent): string`. It produces the debounced observation that tech-and-market §1.7 injects as a conversation item, in the format `[module m_12 fractions] child cut bar into 4 equal parts, shaded 3 (3/4). Predicted 1/2+1/3 = 2/5 (wrong; signal MC.FRAC.ADD_ACROSS). 1 undo.`

The host requests a spoken response only on milestones:
- `probe_result`
- `goal_met`
- the same `misc_signal` three times
- `idle`

### 3.4 Fading state machine (shared code, per module)

```ts
// promote: `promoteAfter` consecutive correct goal/probe outcomes at this stage with hints == 0
//          → next stage, with linked = true for the next 2 items (the bridging step)
// demote:  `demoteAfterErrors` errors at this stage → previous stage, linked = true; emit stage_change{reason:"demote"}
// end:     a concept is only "learned-today" after ≥ 1 correct outcome at stage "abstract" (Fyfe 2015; ends on symbols)
// teacher: set_stage overrides, logged as reason "teacher"
```
Whether the auto-fade thresholds (3 and 2) are right is **[U]**. They are tuned by experiment M2 in §6.

### 3.5 Worked example (T1 spec the LLM fills, plus the resulting stream)

```jsonc
{ "engine": "fractions@1", "module_id": "m_12", "objective_ids": ["MATH6.FRAC.ADD"], "topic_ids": ["c6-maths-ch07-t05"],
  "lang": "hi-Latn+en", "numerals": "latn", "stage": "pictorial", "linked": false,
  "params": { "model": "bar", "wholes": 1, "partitions": [1], "equalOnly": true, "mode": "add",
              "operands": [{"t":"frac","n":1,"d":2},{"t":"frac","n":1,"d":3}], "showSymbol": "after_commit" },
  "probe": { "id": "p1", "kind": "predict", "ask": {"en":"What will 1/2 + 1/3 make?","hi":"1/2 और 1/3 मिलकर कितना?"},
             "commit": "tap_option", "reveal": "animate",
             "expect": { "correct": {"t":"frac","n":5,"d":6},
                         "distractors": [{ "value": {"t":"frac","n":2,"d":5}, "misc": "MC.FRAC.ADD_ACROSS" },
                                         { "value": {"t":"frac","n":2,"d":6}, "misc": "MC.FRAC.ADD_NUM_MULT_DEN" }] } } }
```
The resulting stream:
1. `probe_commit{p1, value:"2/5", latency_ms:4100}`
2. `probe_result{outcome:"misc", misc:"MC.FRAC.ADD_ACROSS"}`
3. The reveal animates both pieces onto one bar. The child is asked to refine to sixths, giving `action{type:"fr.refine", from_d:2, to_d:6}`.
4. `state{summary:"…"}`

The lesson state machine then schedules a verifying `contrast` probe: "is 2/5 bigger or smaller than 1/2?". If the child answers "smaller", that exposes the contradiction. The signal alone never lowers mastery.

---

## 4. Coverage map: chapter clusters → engines

Primary is the engine the planner mounts first. Secondary engines serve translate and contrast probes or later stages. The full per-topic map is in `maths-engine-map.json`.

| cluster | chapters | primary | secondary | flagship misconception (topic) |
|---|---|---|---|---|
| Pre-number: compare, sort, position | C1 ch1 | collections, data-graphs | coord-grid (scene) | spread row "has more" (c1-01-02) |
| Counting & numbers to 20 | C1 ch3–4; C2 ch1; C3 ch1 | collections | place-value, number-line | last number ≠ how many (c1-03-01) |
| Add/subtract within 20 | C1 ch5–6 | collections | balance, number-line | "=" means "write answer" (c1-05-01) |
| Place value & large numbers | C1 ch8; C2 ch3; C3 ch3,6; C4 ch4; C5 ch1; C7 ch1 | place-value | number-line, number-grid | 46 → "406" (c1-08-01); lakh/crore commas (c7-01-01) |
| Multi-digit add/subtract | C2 ch6; C3 ch12; C4 ch7; C5 ch4 | place-value (column) | number-line (open line) | smaller-from-larger (c2-06-02) |
| Number grid & mental strategy | C1 ch8; C2 ch3; C3 ch9; C4 ch3,10 | number-grid | number-line | down a row "adds 1" (c2-03-03) |
| Multiplication & division | C1 ch11; C2 ch8; C3 ch7; C4 ch9,13; C5 ch6,9 | multiply-divide | number-line, tape-diagram | 23 × 4 = 212 (c4-13-01) |
| Factors, multiples, primes, HCF/LCM | C5 ch13; C6 ch5; C7 ch11; C8 ch5 | multiply-divide, number-grid | number-line (jumps) | factors vs multiples (c5-13-01) |
| Fractions | C3 ch8; C4 ch5; C5 ch2; C6 ch7; C7 ch8 | fractions | number-line, tape-diagram | 1/8 > 1/4 (c5-02-02) |
| Decimals & percent | C7 ch3,12; C8 ch8 | place-value, fractions (grid100), number-line | tape-diagram | 0.125 > 0.5 (c7-03-03) |
| Integers | C6 ch10; C7 ch10 | integers | number-line, algebra-tiles | −7 > −2 (c6-10-02) |
| Patterns & sequences | C1 ch9; C3 ch14; C4 ch3; C5 ch7; C6 ch1; C9 ch8 | patterns | coord-grid | a + nd for nth term (c9-08-02) |
| Number play, tricks, proof, algorithms | C3 ch4; C6 ch3; C7 ch6; C8 ch13; C9 ch9,11 | rule-lab | number-grid, place-value | few cases "prove" it (c9-09-02) |
| Expressions & identities | C7 ch2,4; C8 ch2,6,13; C9 ch2,4 | algebra-tiles | algebra-moves | (a+b)² = a²+b² (c8-06-02) |
| Equations | C1 ch5; C7 ch2,15 | balance, tape-diagram | algebra-moves | move across "=" without inverse (c7-15-02) |
| Ratio, proportion, percent change | C8 ch7,8,10 | tape-diagram | coord-grid, multiply-divide | ratio as difference (c8-07-01) |
| Squares, cubes, exponents | C8 ch1,2 | patterns, geoboard | solids, algebra-moves | 5² = 10 (c8-01-01) |
| Number systems & reals | C8 ch3; C9 ch3 | place-value, number-line | geoboard (√2) | nothing between 0.1 and 0.2 (c9-03-02) |
| Length, mass, capacity | C1 ch7; C2 ch7; C3 ch10–11; C4 ch6,8; C5 ch5,8 | measure, balance | fractions | measure from 1 (c3-10-01); 500 ml > 1 l (c4-08-02) |
| Time & calendar | C1 ch10; C2 ch9; C3 ch13; C4 ch12; C5 ch12 | clock-calendar | number-line | hands swapped (c3-13-01) |
| Money | C1 ch12; C2 ch10; C3 ch12 | money | tape-diagram | bigger coin = more value (c1-12-01) |
| 2D shapes, lines, tiling | C1 ch2; C2 ch4–5; C3 ch5; C5 ch7; C7 ch14; C8 ch4; C9 ch12 | shape-lab | geo-construct | square is not a rectangle (c8-04-01) |
| Symmetry | C3 ch14; C4 ch11; C5 ch10; C6 ch9 | symmetry | shape-lab | copies half without flipping (c4-11-02) |
| Angles, lines, transversals | C4 ch1; C5 ch3; C6 ch2; C7 ch5,7; C8 ch4 | angles | geo-construct | longer arms = bigger angle (c6-02-02) |
| Constructions, congruence, circles | C6 ch2,8; C7 ch7,9,14; C9 ch5,6,12 | geo-construct | angles, measure | AAA ⇒ congruent (c7-09-02) |
| Area & perimeter | C4 ch1,6; C5 ch11; C6 ch6; C8 ch9,14; C9 ch6 | geoboard | geo-construct | same perimeter ⇒ same area (c5-11-01) |
| Solids, views, nets, SA/volume | C1 ch2; C2 ch2,4; C3 ch2; C4 ch1–2; C8 ch1,11; C9 ch14 | solids | shape-lab | any 6 squares fold to a cube (c8-11-02) |
| Position, maps, coordinates, linear graphs | C1 ch1; C4 ch2; C5 ch14; C9 ch1,2,13 | coord-grid | patterns, measure | (3,2) = (2,3) (c9-01-01) |
| Data handling | C1 ch13; C2 ch11; C4 ch14; C5 ch15; C6 ch4; C7 ch13; C8 ch10,12; C9 ch10 | data-graphs | tape-diagram | counts icons, ignores key (c4-14-01) |
| Probability | C9 ch7 | chance | data-graphs | heads is "due" (c9-07-02) |

**Per-engine load (computed from the map).** "Primary" counts topics where the engine is mounted first; "any" counts topics where it is primary or secondary.

| engine | tier | primary topics | any | classes |
|---|---|---|---|---|
| place-value | P0 | 25 | 39 | 1–8 |
| multiply-divide | P0 | 22 | 27 | 1–8 |
| number-line | P0 | 21 | **47** | 1–7, 9 |
| data-graphs | P0 | 20 | 22 | 1–9 |
| patterns | P0 | 18 | 19 | 1, 3–9 |
| fractions | P0 | 15 | 19 | 3–8 |
| geoboard | P0 | 15 | 20 | 3–6, 8–9 |
| collections | P0 | 13 | 17 | 1–4, 7 |
| tape-diagram | P0 | 10 | 17 | 1–5, 7–9 |
| balance | P0 | 4 | 9 | 1–4, 7 |
| geo-construct | P1 | 17 | 23 | 6–9 |
| measure | P1 | 16 | 21 | 1–5, 8–9 |
| shape-lab | P1 | 12 | 18 | 1–9 |
| number-grid · angles | P1 | 11 · 11 | 14 · 12 | 1–8 · 2,4–8 |
| clock-calendar · coord-grid | P1 | 10 · 10 | 10 · 15 | 1–5 · 1,4,5,8,9 |
| algebra-tiles · symmetry | P1 | 8 · 7 | 11 · 8 | 3,7–9 · 3–6 |
| integers · money | P1 | 5 · 5 | 6 · 7 | 6,7,9 · 1–4,8 |
| solids · rule-lab · algebra-moves · chance | P2 | 13 · 8 · 5 · 3 | 14 · 13 · 10 · 3 | 1–4,8,9 · 3,6–9 · 7–9 · 9 |

`balance` and `integers` are in their tiers for **leverage, not count**. The equal-sign misconception gates all later equation work. Both engines are also cheap and follow the textbook's own models.

Per class, P0+P1 coverage of primary engines is: C1 97%, C2 88%, C3 91%, C4 93%, C5 100%, C6 94%, C7 95%, C8 89%, **C9 71%**.

---

## 5. Engine specifications

Each block lists params (zod-able TS), child actions, events (the `payload.type` values of `action`), the misconceptions each one surfaces (the detector is `slug ← rule`, with the topic id in parentheses), supported probes, and the three stages. All engines also emit the common events in §3.2. Across the 25 blocks, about 240 named detectors cover **259 of the 304 topics**. Detectors for the remaining 45 topics are written at build time from each topic's `misconceptions` field.

### E01 `number-line@1` · P0 · hub
**Covers:** jumps and skip counting, ordering, rounding, fractions, decimals and integers on the line, estimation, density of rationals, irrationals (C1–C9).
```ts
{ min: MathValue; max: MathValue; numberKind: "whole"|"fraction"|"decimal"|"integer"|"real";
  ticks: { major: number; minor?: number; labels: "all"|"ends"|"none" }; orientation: "h"|"v";
  partition?: { d: number; childCuts: boolean }; zoom?: { enabled: boolean; maxDepth: number };
  markers?: { value: MathValue; label?: L10n; draggable: boolean }[];
  jumps?: { enabled: boolean; sizes?: MathValue[]; arcLabels: boolean }; skin: "road"|"track"|"ribbon"|"plain" }
```
- **Actions:** place or drag a marker; make a jump (tap start then end, or a `+k` button); cut a unit into d parts; zoom an interval; say the value aloud.
- **Events:** `nl.place {value, target, abs_err, pae}` · `nl.jump {from, to, size}` · `nl.partition {unit, d, equal}` · `nl.zoom {lo, hi, depth}`.
- **Surfaces:** `JUMP_COUNTS_START ← counts ticks rather than intervals` (c3-04-03); `UNEQUAL_SPACING ← in a construct probe, hundreds placed unevenly` (c3-09-01); `FRAC_NOT_NUMBER ← refuses or misplaces 5/4 within [0,1]` (c5-02-01, c6-07-02); `LONGER_DECIMAL_BIGGER ← places 0.125 right of 0.5` (c7-03-03); `ROUND_IN_STEPS ← 1450 → 2000` (c4-04-03); `NO_NUMBER_BETWEEN ← zoom probe answered "none"` (c9-03-02); `POINT_NINE_REPEAT_LESS` (c9-03-04)
- **Probes:** estimate (unticked line → PAE, the standing number-sense metric), predict ("3 jumps of 25 from 40?"), translate (the **hub**: bar, token set, decimal grid or clock duration ↔ point), contrast (same point on two scales), diagnose. **Stages:** concrete: kadam (footsteps) on a village road with milestones; pictorial: ticked line with jump arcs; abstract: endpoints only, plus numeral entry **Evidence:** Hamdan & Gunderson 2017 **[V]**; Siegler & Ramani 2009 (keep it linear) **[S]**; Ünal 2024 **[V]**.

### E02 `collections@1` · P0
**Covers:** counting, cardinality, conservation, ten-frames, making 10, part-part-whole, tallies, estimation of collections, parity by pairing (C1–C4, C7 ch6).
```ts
{ items: { kind: "seed"|"stick"|"counter"|"dot"; n: number }[];
  layout: "scatter"|"row"|"five_frame"|"ten_frame"|"double_ten_frame"|"tally"|"pairs"|"groups";
  groupSize?: number; flashMs?: number /* subitise: show then hide */; allowMove: boolean;
  showCount: "never"|"after_commit"|"live"; compare?: { left: number; right: number; spreadSide?: "left"|"right" } }
```
- **Actions:** tap to count (each tap tags one item, and the engine keeps the tag order); drag into a frame; bundle or group; pair up; split a set into two parts; say the total.
- **Events:** `col.tag {i, said_n, double_tag, skipped}` · `col.total {claimed, actual, recounted}` · `col.frame {filled, of}` · `col.split {a, b}` · `col.group {size, groups, left}` · `col.compare {chosen, correct, spread_side}`.
- **Surfaces:** `ONE_TO_ONE ← repeat or skipped tags` (c1-03-01); `CARDINALITY ← recounts from 1 when asked "how many?"` (c1-03-01); `CONSERVATION ← picks the spread row` (c1-01-02); `COUNT_ALL ← restarts at 1 instead of counting on` (c1-05-01); `ONE_WAY_TEN ← construct probe yields only 5+5` (c1-04-01); `TALLY_FIFTH` (c2-11-01, c3-01-02); `ODD_DIGIT ← in pairs layout, says 34 is odd` (c4-03-01); `ODD_SUM_PARITY` (c7-06-01)
- **Probes:** predict (flash 7 in a ten-frame: how many empty?), contrast (spread vs bunched sets of equal size), translate (numeral → frame; tally → numeral), construct (all ways to make 10), estimate (flash 40 items, C2 ch1). **Stages:** imli seeds or matchsticks → dots → numeral with part-part-whole box. **Notes:** rich, familiar counters hurt (Petersen & McNeil 2013) **[S]**. Ages 6–7 sit at the low edge of manipulative benefit (Carbonneau 2013) **[S]**, so keep it guided and short.

### E03 `place-value@1` · P0 · highest load
**Covers:** tens and ones up to crores, Indian and international grouping, decimals to thousandths, column add/subtract with exchange, comparing, rounding support, base-n and number systems (C1–C8).
```ts
{ model: "bundles"|"blocks"|"disks"|"notes"|"abacus"|"chart"; base: number /* 2–10, default 10 (C8 ch3) */;
  places: ("crore"|"ten_lakh"|"lakh"|"ten_thousand"|"thousand"|"hundred"|"ten"|"one"|"tenth"|"hundredth"|"thousandth")[];
  grouping: "indian"|"international"; mode: "represent"|"compare"|"add"|"subtract"|"convert";
  value?: MathValue; operands?: MathValue[]; exchange: "manual"|"auto"|"off";
  showNumberName: boolean; abacusStyle?: "school_rods"|"soroban" }
```
- **Actions:** add or remove a piece in a place; bundle 10 into 1 (exchange up) or unbundle (exchange down); type a digit; combine operands column by column; read the result aloud.
- **Events:** `pv.piece {place, delta, count}` · `pv.exchange {from, to, dir}` · `pv.overflow {place, count}` (10+ left unexchanged) · `pv.write {written, value, ok}` · `pv.col {col, digit, carry, borrow}` · `pv.compare {a, b, chosen}`.
- **Surfaces:** `CONCAT_EXPANDED ← writes 406 for 46, 10025 for 125, 40050 for 4050` (c1-08-01, c3-03-01, c4-04-01); `ZERO_PLACEHOLDER ← 35 or 3005 for 305` (c3-06-01); `TEEN_REVERSAL ← 41 for fourteen` (c1-04-02); `SMALLER_FROM_LARGER ← column difference reversed where a borrow is due` (c1-06-02, c2-06-02, c3-12-02); `NO_REGROUP ← column sum ≥ 10 written whole: 312, 1115` (c2-06-01, c3-12-01); `WRONG_PLACE_INC ← 457 + 10 → 458` (c3-09-02); `COMPARE_FROM_RIGHT` (c4-04-02, c3-06-02, c2-03-02); `INTL_COMMAS_IN_LAKHS`, `CRORE_IS_MILLION` (c7-01-01); `ALIGN_RIGHT_DECIMALS ← 2.5 + 1.25 = 1.50` (c7-03-04); `ONETHS` (c7-03-02); `ROMAN_ZERO`, `ONLY_BASE10` (c8-03-01, c8-03-02)
- **Probes:** predict ("one more ten: what will it say?"), translate (number name ↔ bundles ↔ chart ↔ numeral ↔ ₹ notes), contrast (305 vs 350 built side by side), spot_error (a planted no-regroup sum), diagnose. **Stages:** matchstick bundles the child ties (proportional) → blocks, then disks, notes or abacus (non-proportional) → chart → digits. Proportional models come before non-proportional ones **[M: standard didactics]**. **Notes:** The abacus is a view, not a path (Barner 2016 **[S]**, Barner 2018: 21% decode rate **[V]**). Column ops carry a cryptarithm sub-mode with letter digits (C7 ch6, C8 ch5).

### E04 `fractions@1` · P0
**Covers:** equal shares, naming, equivalence, comparison, add/subtract, multiply (area overlay), divide (measure-out), decimals and percent on a 10×10 grid (C3–C8).
```ts
{ model: "bar"|"circle"|"set"|"grid100"|"wall"; wholes: number; partitions: number[]; equalOnly: boolean;
  shaded?: number[]; mode: "make"|"name"|"compare"|"equivalent"|"add"|"subtract"|"multiply"|"divide"|"percent";
  operands?: MathValue[]; showSymbol: "never"|"after_commit"|"live"; skin?: "roti"|"chocolate"|"ribbon"|"plain" }
```
- **Actions:** cut into n parts (exactly equal unless `equalOnly: false`); shade or unshade; lay one bar against another; stack a fraction wall; refine every part into k (equivalence); overlay two fractions (product = the double-shaded cells); measure out how many 1/4 fit in 3/4; drop the result onto the number line
- **Events:** `fr.cut {parts, equal}` · `fr.shade {shaded, parts}` · `fr.compare {a, b, chosen}` · `fr.refine {from_d, to_d}` · `fr.overlay {a, b, cells}` · `fr.measure {unit, count, rem}`.
- **Surfaces:** `UNEQUAL_PARTS ← accepts an unequal cut as halves or thirds` (c3-08-01, c4-05-01, c6-07-01); `BIGGER_DENOM ← 1/8 > 1/4` (c3-08-01, c4-05-01, c5-02-02, c6-07-01); `COUNT_PIECES ← 2/4 > 1/2; 3/4 = any 3 pieces` (c5-02-03, c4-05-02); `ADD_SAME_EQUIV ← 1/2 = 2/3` (c6-07-03); `ONE_PART_COMPARE` (c6-07-04); `ADD_ACROSS ← 1/2 + 1/3 = 2/5` (c6-07-05); `MULT_BIGGER`, `DIV_SMALLER`, `INVERT_WRONG` (c7-08-01, c7-08-02); `DEC_TIMES ← 0.3 × 0.2 = 0.6 on grid100` (c7-12-01); `TENTH_EQ_HUNDREDTH ← 0.5 = 0.05` (c7-03-01); `PERCENT_CAP_100` (c8-08-01)
- **Probes:** predict (1/2 + 1/3), contrast (2/4 vs 1/2; equal vs unequal "halves"), translate (bar → number line, circle → bar, grid → decimal → %), diagnose (Eedi-style distractors), construct (three fractions equal to 1/2). **Stages:** flat roti, chocolate bar or ribbon → bars and circles → symbols plus number line. **Notes:** Default to the **bar**. Use circles only for part-whole, never for magnitude (Hamdan & Gunderson 2017 **[V]**). Partitioning is exact by engine (focused constraint). Children's own circle cuts are inaccurate **[M]**.

### E05 `multiply-divide@1` · P0
**Covers:** equal groups, arrays, commutativity, ×0 and ×1, sharing vs grouping, remainders, area-model multi-digit multiplication, factors as rectangles, factor trees, HCF/LCM Venn, inverse proportion as constant area (C1–C8).
```ts
{ model: "groups"|"array"|"area"|"share"|"factor_rect"|"factor_tree"|"venn"|"jumps"; a?: number; b?: number; n?: number;
  mode: "build"|"share"|"group"|"multiply_multi"|"factor"|"hcf_lcm"|"inverse"; showPartialProducts: boolean;
  remainder: "show"|"hide"|"ask_meaning"; story?: L10n }
```
- **Actions:** make k groups of m; rotate an array; cut the area model into partial products; deal items one by one onto plates; make groups of size m; build every rectangle of n squares; split a factor-tree node; drop primes into a Venn diagram; stretch a fixed-area rectangle (workers × days).
- **Events:** `md.group {groups, size, total}` · `md.rotate {r, c}` · `md.partial {parts, sum}` · `md.deal {plates, each, left}` · `md.rect {w, h}` · `md.tree {node, a, b, prime_a, prime_b}` · `md.venn {a_only, both, b_only}`.
- **Surfaces:** `COUNT_GROUPS ← answers 3 for 3 groups of 4` (c1-11-01); `ORDER_MATTERS` (c2-08-01, c1-11-02); `SHARE_UNEQUAL` (c2-08-02); `TIMES_ZERO ← 6 × 0 = 6` (c4-09-01); `REMAINDER_IGNORED` (c4-09-02, c5-09-01, c5-09-02); `ONES_ONLY ← 23 × 4 = 212` (c4-13-01); `SHIFT_ZERO` (c5-06-01); `FACTOR_MULTIPLE` (c5-13-01, c6-05-01); `TRIVIAL_FACTORS` (c5-13-02); `TREE_STOPS_COMPOSITE` (c6-05-04); `COPRIME_PRIME` (c6-05-03); `LOWEST_CF`, `HCF_LCM_SWAP` (c7-11-01, c7-11-02); `INVERSE_AS_DIRECT` (c8-10-04)
- **Probes:** predict (rotate: same total?), contrast (12 ÷ 3 as sharing vs grouping), translate (story → array → expression), construct (all rectangles of 12), spot_error (23 × 4 = 212). **Stages:** laddoos on plates or mango crates → dot arrays → area model → algorithm.

### E06 `balance@1` · P0 · leverage engine
**Covers:** heavier/lighter, the equal sign as "same as", compensation, comparing expressions, positive-term linear equations, weight units (C1–C4, C7).
```ts
{ mode: "compare_weight"|"equality"|"expression"|"equation";
  left: Term[]; right: Term[];   // Term = { kind: "weight"|"unknown"; value?: number; sym?: string; count: number; label?: L10n }
  unknowns?: { sym: string; value: number; hidden: boolean }[]; units?: "g"|"kg"|"none";
  ops: ("add_both"|"remove_both"|"divide_both"|"swap_sides")[]; showEquation: "never"|"after_commit"|"live" }
```
- **Actions:** drop or remove an item on a pan; predict the tilt before releasing; apply an operation to both sides; split or merge weights; write the equation.
- **Events:** `bal.tilt {state, by}` · `bal.place {side, kind, value}` · `bal.op {op, arg, keeps_level}` · `bal.one_side {op}` · `bal.solve {sym, claimed, actual}`.
- **Surfaces:** `EQ_OPERATIONAL ← 8 + 4 = __ + 5 answered 12` (c1-05-01); `BIGGER_HEAVIER` (c1-07-03); `COTTON_IRON` (c3-11-02); `COMPENSATION ← believes +3 to both changes the difference; contrast with the sum` (c4-10-01); `MUST_COMPUTE_FIRST` (c7-02-01); `ONE_SIDED_OP ← operation applied to one pan` (c7-15-02); `UNKNOWN_LEFT_ONLY` (c7-15-02)
- **Probes:** predict (tilt), contrast (two balances, only one changed), translate (balance ↔ equation), spot_error, construct. **Stages:** tarazu with atta bags → pan diagram → equation with a fading ghost balance. **Notes:** Fyfe, McNeil & Borjas 2015 used exactly this sequence **[S]**. Balance breaks with negatives (reviewed in Otten 2019 **[S]**), so it does **not** do negatives; it hands off to `integers` or `algebra-tiles`.

### E07 `integers@1` · P1 · textbook-native
**Covers:** NCERT C6 ch10 models and C7 ch10 operations.
```ts
{ context: "lift"|"tokens"|"thermometer"|"sea_level"|"passbook"|"line"; range: [number, number] /* lift default [-5, 6] */;
  start?: number; ops: ("add"|"subtract"|"multiply"|"divide")[]; allowZeroPairs: boolean;
  showExpression: "never"|"after_commit"|"live"; colours: { pos: "green"; neg: "red" } }
```
- **Actions:** press the lift's + or − button; drop green or red tokens; cancel a zero pair; add zero pairs so a take-away is possible; log a credit or debit; read a temperature; project to the number line.
- **Events:** `int.press {button, n, floor}` · `int.token {sign, delta, pos, neg}` · `int.zero_pair {op, n}` · `int.take {sign, n, zero_pairs_needed}` · `int.answer {expr, claimed, actual}` · `int.compare {a, b, chosen}`.
- **Surfaces:** `NEG_MAGNITUDE ← −7 > −2; contrast with "which floor is lower?"` (c6-10-02); `SUB_SMALLER ← 3 − (−2) < 3` (c6-10-03); `NEG_NEG_ADD_POS` (c6-10-03); `NEG_NOT_REAL` (c6-10-01); `NEGxNEG_NEG` (c7-10-01); `DIV_NEG_IMPOSSIBLE` (c7-10-02)
- **Probes:** predict (floor +2, press −3), translate (lift ↔ tokens ↔ expression ↔ line), contrast ((+5)+(−3) vs (+5)−(−3)), spot_error. **Stages:** lift, thermometer or passbook → tokens → expression. For multiplication: a pattern table 3×2, 3×1, 3×0, 3×(−1)… plus repeated removal of zero pairs **[M]**. **Evidence:** the models are the textbook's own (Ganita Prakash 6 §10.1–10.3) **[V]**.

### E08 `geoboard@1` · P0
**Covers:** area by counting, perimeter, same area or different shape, dissect-and-rearrange, triangle, parallelogram and trapezium areas, squares on a diagonal, Baudhayana–Pythagoras, perimeter–area paradoxes (C3–C9).
```ts
{ grid: { kind: "square"|"dot"|"isometric"; w: number; h: number; unit: "cm"|"m"|"unit" };
  mode: "area"|"perimeter"|"both"|"dissect"|"pythagoras"|"compare"; shapes?: Polygon[];
  tools: ("band"|"count"|"cut"|"move"|"half_square")[]; constraints?: { area?: number; perimeter?: number };
  showFormula: "never"|"after_commit"|"live" }
```
- **Actions:** stretch a band peg to peg; tap-count unit squares; cut along a segment and move the piece; tilt a square onto a diagonal; build squares on the sides of a triangle; write the unit.
- **Events:** `geo.shape {n_vertices, area, perimeter, is_rect}` · `geo.count {counted, actual, double}` · `geo.cut_move {area_before, area_after}` · `geo.claim {qty, claimed, actual}` · `geo.unit {written}`.
- **Surfaces:** `AREA_PERIM_SWAP` (c5-11-01); `SAME_PERIM_SAME_AREA` (c5-11-01, c6-06-02); `LONGER_MORE_AREA` (c5-11-03); `TWO_SIDES_PERIM` (c4-06-02, c5-11-02, c6-06-01); `LINEAR_UNIT_FOR_AREA` (c6-06-02); `TRI_LxB` (c6-06-03); `REARRANGE_CHANGES_AREA` (c3-05-02); `DOUBLE_SIDE_DOUBLE_AREA` (c8-09-01); `SLANT_HEIGHT` (c8-14-01); `SUM_SIDES_AREA` (c8-14-02); `PYTH_NON_RIGHT` (c8-09-02); `LONGER_BOUNDARY_MORE` (c9-06-04)
- **Probes:** contrast (same perimeter, different area), construct (area 12 and perimeter 16; every rectangle with perimeter 20), predict (cut and move: does the area change?), translate (shape ↔ formula), spot_error. **Stages:** tiling a floor or "Grandmother's quilt" patches (C5 ch11) → grid → dimensions and formula only.

### E09 `data-graphs@1` · P0
**Covers:** sorting, tallies, tables, pictographs with a key, bar, line, pie and stacked charts, mean, median and mode, weighted averages (C1–C9).
```ts
{ data: { label: L10n; value: number; group?: string }[] | { raw: (string | number)[] };
  view: "sort"|"tally"|"table"|"pictograph"|"bar"|"line"|"pie"|"stacked"|"dot_plot"|"mean_level"|"mean_balance";
  scale?: { key?: number; start: number; step: number }; editable: ("data"|"scale"|"bars"|"key")[];
  summary?: ("mean"|"median"|"mode"|"range")[]; weights?: number[] }
```
- **Actions:** sort items into bins and name the rule; tally; place icons by key (including half icons); drag a bar to a height; set the scale; join or unjoin points; drag a pie slice; level towers (mean as fair share); slide the fulcrum (mean as balance point); add an outlier
- **Events:** `dat.sort {rule, bins, misplaced}` · `dat.icon {row, icons, claimed, key}` · `dat.bar {cat, height}` · `dat.scale {start, step}` · `dat.read {cat, claimed, actual, via}` · `dat.level {moves}` · `dat.fulcrum {pos, mean}` · `dat.join {joined, kind}` · `dat.pie {sum_deg}`.
- **Surfaces:** `SPACE_IS_MORE ← reads by visual length, not count` (c1-13-01, c1-13-02, c2-11-02); `ICON_IGNORES_KEY` (c4-14-01, c6-04-02); `HALF_ICON_WHOLE` (c5-15-01); `WIDTH_AS_VALUE` (c4-14-02); `NONZERO_BASELINE` (c5-15-02, c6-04-03); `RAW_IS_ORGANISED` (c6-04-01); `MEAN_IS_A_VALUE`, `MEAN_IS_MIDDLE` (c7-13-02, c8-12-01); `TRUSTS_SCALE` (c7-13-03); `JOIN_CATEGORICAL` (c8-12-02); `PIE_OVER_360` (c8-10-03); `AVG_OF_AVGS` (c9-10-01); `PIE_ALWAYS_BEST` (c9-10-02); `SORT_COLOUR_ONLY` (c1-01-03)
- **Probes:** contrast (same data on two scales; big vs small icons), predict (add an outlier: where does the mean go?), translate (table ↔ pictograph ↔ bar ↔ pie), spot_error (a misleading graph), construct (data with mean 5 but no 5 in it). **Stages:** real objects (toys, fruit) stacked → icons → bars and axes → numbers only. **Notes:** PhET *Mean: Share and Balance* has the same two mean views **[M]**.

### E10 `tape-diagram@1` · P0 · the translate engine
**Covers:** addition and subtraction stories, "how many more", multiplicative comparison, fraction-of problems, forming equations, ratio, dividing in a ratio, percent of a quantity, successive percentages, mixtures (C1–C5, C7–C9).
```ts
{ mode: "part_whole"|"compare"|"multiplicative"|"ratio"|"percent"|"before_after"|"equation";
  tapes: { id: string; label: L10n; units: number; unitValue?: number; known: boolean }[];
  unknown?: string; story?: L10n; allowSplit: boolean; showEquation: "never"|"after_commit"|"live" }
```
- **Actions:** draw a tape per quantity; align tapes; split into equal units; bracket the total or the difference; label known and unknown; write the equation; answer.
- **Events:** `tape.draw {id, units}` · `tape.align {aligned}` · `tape.split {id, parts}` · `tape.bracket {kind, ids}` · `tape.eq {written, equivalent}` · `tape.answer {claimed, actual}`.
- **Surfaces:** `KEYWORD_MORE_ADD` (c3-04-01); `HOW_MANY_MORE_ORDER` (c4-10-02); `LAST_OP_LEARNT` (c7-08-03); `WORD_ORDER_EQUATION` (c7-15-01); `RATIO_ADDITIVE ← 2:3 → 4:5` (c8-07-01, c8-10-01); `ALL_PROPORTIONAL` (c8-07-02); `PERCENT_SWAP ← 20% of 50 ≠ 50% of 20` (c8-08-02); `PERCENT_UP_DOWN_CANCEL` (c8-08-03); `DIVIDE_BY_LARGER_TERM` (c8-10-02); `CHANGE_EQUALS_PRICE` (c2-10-02, via money)
- **Probes:** translate (story → tape → equation: the library's richest P14), contrast (two stories with the same numbers but different structure), predict, spot_error. **Stages:** paper ribbons → tapes → equation. **Notes:** this is the Singapore "model method" **[M]**. It is the one engine whose main job is moving between representations, so it carries the translate probe for word problems everywhere.

### E11 `patterns@1` · P0
**Covers:** repeating patterns (shape, colour, sound, action), growing figure patterns, triangular, square and cube numbers, function machine, explicit vs recursive rules, AP/GP growth, Virahanka–Fibonacci, fractals, exponent growth (C1, C3–C9).
```ts
{ mode: "repeat"|"grow"|"sequence"|"function_machine"|"growth_compare"|"fractal";
  elements?: ("shape"|"colour"|"sound"|"action"|"number")[]; core?: string[];
  figure?: { kind: "dots"|"matchsticks"|"tiles"; rule: string /* "n^2", "2n+1" */ }; terms: number;
  rule?: { explicit?: string; recursive?: string }; hide: "next"|"nth"|"rule"|"none"; compare?: string[] }
```
- **Actions:** extend a pattern; bracket the repeating core; build the next figure; fill a table; enter a rule; feed the machine; toggle explicit and recursive rules; chart growth; tile a strip with 1-beat and 2-beat pieces (Virahanka).
- **Events:** `pat.extend {k, ok}` · `pat.core {len, ok}` · `pat.figure {n, pieces, expected}` · `pat.table {n, value, ok}` · `pat.rule {entered, fits_shown, fits_all}` · `pat.machine {in, out, guess}`.
- **Surfaces:** `COLOUR_ONLY` (c1-09-01); `RANDOM_IS_PATTERN` (c1-09-02); `REVERSED_DIFFERENT` (c3-14-02); `ONLY_INCREASING` (c4-03-02); `GUESS_NEXT` (c5-07-02); `FIRST_TWO_TERMS` (c6-01-01); `PICTURE_DECORATION` (c6-01-02); `SQUARE_IS_DOUBLE` (c8-01-01); `POWER_IS_PRODUCT ← 2³ = 6` (c8-02-01); `AP_N_NOT_N_MINUS_1` (c9-08-02); `AP_GP_SAME` (c9-08-03); `INCREASING_IS_LINEAR` (c9-02-02); `ONE_RULE_ONLY` (c9-08-01)
- **Probes:** predict (the 10th figure), contrast (3n+1 vs 2ⁿ), translate (figure ↔ table ↔ rule ↔ graph), construct. **Stages:** beads, rangoli tiles or claps → figures → rule. **Notes:** sound and action patterns *are* the C1 content. They are not songs added for fun (R6).

### E12 `number-grid@1` · P1
**Covers:** the 100 grid and windows of the 1000 grid, addition and multiplication charts, sieve of Eratosthenes, divisibility patterns, magic squares, number pyramids (C1–C8).
```ts
{ layout: "hundred"|"thousand_window"|"addition"|"multiplication"|"sieve"|"magic_square"|"pyramid";
  start: number; cols: number; rows: number; highlight?: { rule: string /* "multiple_of:4" */ }; mask?: number[]; editable: boolean }
```
- **Actions:** move a token by ±1 or ±10; colour multiples; run the sieve; fill a cell; state a pattern.
- **Events:** `grid.move {from, to, delta}` · `grid.mark {cell, ok}` · `grid.sieve {p, crossed, missed}` · `grid.fill {cell, value, valid}`.
- **Surfaces:** `NINE_BEFORE_ZERO ← 29 before 20` (c1-08-02); `ROW_ADDS_ONE` (c2-03-03); `PLUS10_ONES` (c3-09-02); `ODD_DIGIT` (c4-03-01); `ODD_IS_PRIME`, `ONE_IS_PRIME` (c6-05-02); `DIV4_LAST_DIGIT` (c6-05-05); `MAGIC_TRIAL_ONLY` (c7-06-02); `DIV6_BY3_ONLY` (c8-05-01); `ALGEBRA_XY_ONLY` (c8-13-02); `COMPENSATION` (c4-10-01)
- **Probes:** predict (where after +10?), contrast, construct (magic square), translate (a grid move ↔ an expression). **Stages:** pictorial and abstract only. The grid is already a representation, so there is no concrete stage.

### E13 `clock-calendar@1` · P1
**Covers:** sequencing a day, duration, analog and digital time, a.m./p.m., elapsed time, calendar durations, seconds and race timings (C1–C5).
```ts
{ view: "analog"|"digital"|"both"|"timeline"|"calendar"|"stopwatch"; time?: { h: number; m: number };
  geared: boolean; precision: 60|15|5|1; format: "12h"|"24h"; ampm: boolean;
  vocab: ("sawa"|"saadhe"|"paune"|"dedh"|"dhai")[]; calendar?: { year: number; month: number } }
```
- **Actions:** drag the minute hand (the hour hand follows when geared); set a digital time; say the time; order daily events on a timeline; mark start and end; count days; race the stopwatch.
- **Events:** `clk.set {h, m, hand}` · `clk.read {claimed, actual, err}` with `err` ∈ {hands_swapped, minute_as_number, hour_rounding, ok} · `clk.elapsed {claimed, actual}` · `cal.count {start, end, claimed, inclusive}` · `clk.order {ok}`.
- **Surfaces:** `HANDS_SWAPPED` (c3-13-01; Burny 2012, EJ1258500 **[S]**); `MINUTE_AS_NUMBER ← "3 minutes" for :15` (c3-13-01); `NOON_AM` (c4-12-01); `MINUTES_OVER_60` (c4-12-02); `DECIMAL_HOURS ← 1.5 h = 1 h 50 min` (c5-12-01); `BIGGER_TIME_FASTER` (c5-12-02); `MONTH_30` (c2-09-01); `INCLUSIVE_COUNT` (c3-13-02); `YESTERDAY_TOMORROW` (c1-10-01)
- **Probes:** predict (minute hand +15: where is the hour hand?), translate (analog ↔ digital ↔ Hindi time words), contrast (2:45 *paune teen* vs 3:15 *sawa teen*), spot_error. **Notes:** *dedh* (1:30) and *dhai* (2:30) are irregular, which makes them a likely error hotspot **[U]**. The same words are quantity words (*sawa kilo*, *dedh sau*, *dhai sau* = 250), so they also give cross-engine translate items with `fractions` and `money` **[M]**.

### E14 `money@1` · P1
**Covers:** recognising coins and notes, making amounts, paying and change, budgets, barter and exchange; supports profit and discount (C1–C3, C8).
```ts
{ denominations_paise: number[] /* coins 100,200,500,1000,2000; notes 1000–50000 */; series: "2019"|"mixed";
  wallet?: Record<number, number>; shop?: { items: { name: L10n; price_paise: number }[] };
  mode: "recognise"|"make_amount"|"pay"|"change"|"budget"|"barter"; style: "stylised" }
```
- **Actions:** drag coins and notes to a tray; exchange (₹10 → 5 × ₹2); pay; count change; plan a purchase within a budget.
- **Events:** `mon.tray {total_paise, pieces}` · `mon.exchange {from, to, equal}` · `mon.pay {price, paid, change_claimed}` · `mon.compare {a, b, chosen, by: value|count|size}`.
- **Surfaces:** `MORE_COINS_MORE` (c1-12-01); `BIGGER_COIN_MORE` (c1-12-01: the 2019 series sizes do rise with value, ₹1 20 mm, ₹2 23 mm, ₹5 25 mm, ₹20 27 mm, but the older 25 mm ₹1 is still legal tender and is larger than the new ₹2 **[S]**; `series:"mixed"` stages exactly this contrast); `NOTE_LESS_THAN_COINS ← one ₹50 vs five ₹10` (c2-10-01); `CHANGE_EQUALS_PRICE` (c2-10-02); `LEFTOVER_LOST` (c1-12-02); `BIGGER_COSTS_MORE` (c3-12-03)
- **Probes:** contrast (3 coins vs 1 note), translate ("dhai sau rupaye" → build ₹250), predict (the change), construct (₹37 with the fewest pieces). **Stages:** stylised coins and notes in a bazaar → value cards → paise arithmetic. **Notes:** Images are stylised flat drawings at non-replica size. No scans. Counterfeiting is an offence (IPC ss. 489A–E **[S]**, carried into the Bharatiya Nyaya Sanhita **[M]**). Get a legal check before shipping **[U]**. ₹2000 is excluded by default: its withdrawal was announced on 19 May 2023, though it is still legal tender **[S]**.

### E15 `measure@1` · P1
**Covers:** comparing lengths, non-standard units, rulers, capacity, mass readings, unit conversion, map scale, C/D by rolling a circle (C1–C5, C8–C9).
```ts
{ tool: "ruler"|"tape"|"handspan"|"footstep"|"jug"|"scale_kg"|"conversion_ladder"|"map_scale"|"circle_roll";
  object?: { kind: string; length_mm?: number; capacity_ml?: number; mass_g?: number };
  units: ("mm"|"cm"|"m"|"km"|"g"|"kg"|"ml"|"l")[]; rulerStart: "zero_at_edge"|"zero_inset"|"broken";
  actors?: { name: string; span_mm: number }[] }
```
- **Actions:** align an object; read a scale; measure with different people's hand-spans; pour between containers; step along the conversion ladder; roll a circle one turn.
- **Events:** `ms.align {start_mark}` · `ms.read {claimed, actual, unit, start_err}` · `ms.pour {from, to, overflow}` · `ms.convert {from, to, factor, ok}` · `ms.roll {C, D, ratio}`.
- **Surfaces:** `START_AT_ONE`, `START_AT_EDGE ← broken-ruler probe` (c3-10-01, c4-06-01); `ENDS_NOT_ALIGNED` (c1-07-01); `SAME_SPANS` (c1-07-02); `UNIT_BLIND` (c2-07-01, c5-05-02); `TALL_HOLDS_MORE` (c2-07-02, c3-11-01); `HALF_METRE_50M` (c3-10-02); `M_EQ_10CM`, `KG_EQ_100G`, `KM_EQ_100M` (c4-06-01, c4-08-01, c5-05-01); `ML_GT_L` (c4-08-02); `MIXED_UNIT_DECIMAL ← 2 kg 50 g = 2.50 kg` (c5-08-01, c5-08-02); `MULT_TO_LARGER` (c8-07-03); `PI_VARIES` (c9-06-01)
- **Probes:** predict (pour tall-thin into short-wide), contrast, translate (mixed units ↔ decimal ↔ single unit), spot_error. **Stages:** milk pouch, atta bag, a real ruler → scales → conversions.

### E16 `shape-lab@1` · P1
**Covers:** naming under rotation, sides and corners, straight and curved lines, composing with tangram and pattern blocks, the quadrilateral hierarchy, morphing, tiling (C1–C9). Also hosts the "statement vs converse" Venn for C9 ch9.
```ts
{ mode: "explore"|"compose"|"classify"|"morph"|"tile"|"lines"; pieces?: ("tangram"|"pattern_blocks"|"polygon")[];
  classes?: ("triangle"|"square"|"rectangle"|"rhombus"|"parallelogram"|"kite"|"trapezium"|"quadrilateral")[];
  sortView: "bins"|"venn"|"tree"; allowRotateFlip: boolean; tileTarget?: { region: Polygon } }
```
- **Actions:** rotate or flip and name a shape; fill a silhouette; sort into a Venn diagram or tree; drag a vertex while a constraint holds (square → rhombus → parallelogram); tile a region.
- **Events:** `shp.name {claimed, actual, orient_deg}` · `shp.sort {shape, bin, ok}` · `shp.morph {from, to, preserved}` · `shp.compose {pieces, area_kept}` · `shp.tile {gaps, overlaps}`.
- **Surfaces:** `ROTATION_RENAMES ← "diamond"` (c1-02-01, c2-04-01); `PROTOTYPE_TRIANGLE` (c2-04-02, c3-05-01, c5-07-01); `SLANT_NOT_STRAIGHT` (c2-05-01); `SQUARE_NOT_RECT` (c3-05-01, c8-04-01); `CIRCLE_CORNER` (c3-05-03); `RHOMBUS_TILTED` (c8-04-03); `EQUAL_SIDES_SQUARE` (c6-08-02); `REGULAR_ALL_TILE` (c7-14-02); `ONLY_REGULAR_TILE` (c9-12-03)
- **Probes:** contrast (rotated square vs rhombus), predict (will it tile?), translate (property list ↔ shape), construct (a rhombus that is not a square), diagnose.

### E17 `symmetry@1` · P1
**Covers:** line symmetry, completing figures, turn symmetry, rangoli design (C3–C6).
```ts
{ mode: "find_lines"|"complete"|"turn"|"design"; figure: string /* preset */ | { grid: number[][] };
  mirrorAngles: number[]; turnOrders?: number[]; tracing: boolean }
```
- **Actions:** place or rotate a mirror; fold to test; complete the other half; rotate a tracing and count the matches; design.
- **Events:** `sym.line {angle, valid}` · `sym.complete {ok_cells, wrong_cells, translated}` · `sym.turn {claimed, actual}` · `sym.design {lines, order}`.
- **Surfaces:** `VERTICAL_ONLY` (c3-14-01); `EXACTLY_ONE` (c4-11-01); `COPY_NOT_FLIP ← completed half is a translation, not a reflection` (c4-11-02); `MIRROR_ONLY` (c5-10-01); `TURN_IMPLIES_MIRROR` (c5-10-02, c6-09-02); `RECT_DIAGONALS` (c6-09-01)
- **Probes:** predict (fold on the diagonal: will it match?), contrast (rectangle vs square diagonals), construct (turn symmetry with no mirror line).

### E18 `angles@1` · P1
**Covers:** angle as an amount of turn, comparing angles, the protractor, angle types, intersecting and parallel lines, transversals, angle sums of triangles and quadrilaterals (C4–C8).
```ts
{ mode: "turn"|"compare"|"measure"|"classify"|"lines"|"transversal"|"angle_sum"; arms?: { len1: number; len2: number };
  angle?: number; protractor: { scales: "double"|"single"; draggable: boolean };
  lines?: { parallel: boolean; transversalDeg: number }; polygon?: 3 | 4 }
```
- **Actions:** rotate an arm; change arm length; place and read the protractor; classify; drag the transversal; tear off the corners and line them up.
- **Events:** `ang.set {deg}` · `ang.compare {chosen, longer_arms_chosen}` · `ang.read {claimed, actual, scale}` · `ang.pair {kind, claimed_eq, actual_eq}` · `ang.sum {claimed}`.
- **Surfaces:** `ARM_LENGTH` (c4-01-02, c6-02-02); `ANGLE_IS_LENGTH` (c5-03-01); `ORIENTATION` (c5-03-02); `WRONG_SCALE ← reads 180 − true value` (c6-02-03); `STRAIGHT_NOT_ANGLE` (c6-02-04); `VOA_VERTICAL` (c7-05-01); `CORR_EQ_NONPARALLEL` (c7-05-03); `PARALLEL_SAME_LENGTH` (c7-05-02); `BIG_TRIANGLE_BIG_SUM`, `BIG_QUAD_BIG_SUM` (c7-07-03, c8-04-02)
- **Probes:** contrast (short-wide vs long-narrow), predict (angle sum of a big triangle vs a small one), translate (degrees ↔ fraction of a full turn ↔ clock-hand positions, as in C5 ch3), spot_error (protractor misread), construct.

### E19 `algebra-tiles@1` · P1
**Covers:** letter-numbers, like terms, evaluating, distributivity, special products, identities in 2D and 3D, factorising quadratics, think-of-a-number tricks (C7–C9).
```ts
{ tiles: ("1"|"x"|"y"|"x2"|"y2"|"xy"|"x3")[]; dim: 2 | 3;
  mode: "build_expr"|"simplify"|"evaluate"|"multiply"|"factor"|"identity"|"mystery_bag";
  expr?: string; target?: string; xValue?: { show: boolean; value: number }; colours: { pos: "green"; neg: "red" } }
```
- **Actions:** drop tiles; flip a tile's sign; cancel a zero pair; group like tiles; build a rectangle on the mat (product or factor); slide x so the tiles show lengths as numbers; assemble (a+b)³ blocks.
- **Events:** `alg.tile {kind, sign, delta}` · `alg.zero_pair {kind}` · `alg.combine {kinds, legal}` · `alg.rect {w, h, area, complete}` · `alg.eval {x, claimed, actual}` · `alg.expr {written, equivalent}`.
- **Surfaces:** `LETTER_IS_OBJECT`, `DIFFERENT_LETTERS_DIFFERENT` (c7-04-01); `JUXTAPOSE ← 2x at x = 3 → 23` (c7-04-02); `COMBINE_UNLIKE ← 3a + 2b = 5ab` (c7-04-02); `DISTRIBUTE_FIRST ← a(b+c) = ab + c` (c8-06-01); `SQUARE_OF_SUM ← (a+b)² = a² + b², which leaves 2ab visibly missing` (c8-06-02); `CUBE_OF_SUM` (c9-04-01); `FACTOR_SUM_PAIR` (c9-04-02); `X_VS_X2` (c9-02-01)
- **Probes:** predict ((a+b)²: fill it with only a² and b²), translate (expression ↔ tiles ↔ area), contrast (2x vs x²), spot_error. **Notes:** green and red match NCERT's token model **[V]**, so a Class 6 zero pair is the same object in Class 8.

### E20 `coord-grid@1` · P1
**Covers:** position words, left/right relative to a viewer, grid maps and routes, map scale, the Cartesian plane, distance, linear relations, solutions of ax + by = c, slope (C1, C4–C5, C8–C9).
```ts
{ mode: "scene"|"map"|"plot"|"distance"|"line"|"solutions"|"slope"; extent: { x: [number, number]; y: [number, number] };
  quadrants: 1 | 4; scene?: { viewerFacing: "N"|"E"|"S"|"W"; objects: { name: L10n; at: [number, number] }[] };
  scaleBar?: { map_cm: number; real_m: number }; line?: { m: number; c: number; editable: ("m"|"c")[] };
  equation?: { a: number; b: number; c: number } }
```
- **Actions:** place by position words; rotate the viewer; give or follow a route in N/E/S/W steps; plot (x, y); drag a point; draw the distance right-triangle; drag the slope and intercept handles; test whether a point is on the line.
- **Events:** `crd.place {x, y, tx, ty, swapped}` · `crd.lr {facing, claimed, ok}` · `crd.route {steps, reached}` · `crd.dist {claimed, actual}` · `crd.line {m, c}` · `crd.test {x, y, on, claimed}` · `crd.slope {rise, run, claimed}`.
- **Surfaces:** `LR_ABSOLUTE` (c1-01-01, c4-02-02); `NORTH_IS_UP` (c5-14-01); `MAP_IS_REAL` (c5-14-02); `XY_SWAP` (c9-01-01); `DIST_NO_SQUARE` (c9-01-02); `LINE_THROUGH_ORIGIN` (c9-02-03); `ONE_SOLUTION` (c9-13-01); `OFF_LINE_SOLUTION` (c9-13-02); `RUN_OVER_RISE` (c9-13-03)
- **Probes:** predict (where is (−2, 3)?), contrast ((3,2) vs (2,3)), translate (table ↔ points ↔ equation ↔ story), construct (three solutions of x + y = 5).

### E21 `geo-construct@1` · P1 (JSXGraph)
**Covers:** points, segments, rays and lines; compass constructions; triangle inequality; altitudes; congruence criteria; circle chords and angles; mid-point theorem; medians and centroid; parallelogram properties; Heron's formula (C6–C9).
```ts
{ mode: "objects"|"compass"|"triangle"|"congruence"|"circle"|"quadrilateral"|"midpoint";
  tools: ("point"|"segment"|"ray"|"line"|"circle"|"compass"|"perp_bisector"|"angle_bisector"|"measure_len"|"measure_angle")[];
  given?: string /* construction preset */; sticks?: number[]; dragTest: boolean; measures: "live"|"on_tap"|"hidden" }
```
- **Actions:** construct with compass and straightedge; drag a free point (the drag test for invariance); try to close three sticks into a triangle; try to build a non-congruent triangle from given parts; slide a point around an arc.
- **Events:** `gc.construct {tool, ok}` · `gc.drag {object, invariant, held}` · `gc.sticks {a, b, c, closes}` · `gc.congruence {criterion, noncongruent_built}` · `gc.claim {property, from_diagram}`.
- **Surfaces:** `RAY_TWO_ENDS`, `LONGER_LINE_DIFFERENT` (c6-02-01); `RADIUS_VARIES` (c6-08-01); `RECT_DIAG_PERP` (c6-08-03); `ANY_THREE_LENGTHS` (c7-07-01); `ALTITUDE_INSIDE` (c7-07-02); `LOOKS_CONGRUENT` (c7-09-01); `AAA_CONGRUENT ← child builds two triangles with equal angles and different sizes` (c7-09-02); `ONLY_EQUILATERAL_EQUAL_ANGLES` (c7-09-03); `CHORD_THROUGH_CENTRE` (c9-05-01); `LONG_CHORD_FAR` (c9-05-02); `SEGMENT_ANGLE_VARIES` (c9-05-03); `FROM_DIAGRAM` (c9-12-01); `CENTROID_MIDPOINT` (c9-12-02); `HERON_FULL_PERIM` (c9-06-02)
- **Probes:** predict (drag the vertex: does the inscribed angle change?), contrast (AAA pair), construct, spot_error. **Notes:** the JSXGraph licence needs a legal check **[U]**.

### E22 `solids@1` · P2 (three.js, lazy)
**Covers:** roll, slide and stack; naming solids under orientation; faces, edges and vertices; views; nets; unit-cube volume; surface area by unrolling; cones and spheres (C1–C4, C8–C9).
```ts
{ mode: "explore"|"roll_slide_stack"|"faces_edges"|"views"|"net"|"surface_area"|"volume";
  solid: "cube"|"cuboid"|"cylinder"|"cone"|"sphere"|"hemisphere"|"pyramid"|"prism"; dims?: Record<string, number>;
  net?: { squares: [number, number][] }; render: "3d"|"iso2d" }
```
- **Actions:** rotate; tap faces, edges and vertices (hidden ones count once rotated into view); pick the top, front or side view; fold or unfold a net; fill with unit cubes; unroll a curved surface; test roll, slide and stack.
- **Events:** `sol.count {kind, claimed, actual, rotated}` · `sol.view {dir, chosen, ok}` · `sol.fold {closes}` · `sol.fill {cubes}` · `sol.unroll {area}` · `sol.motion {action, result}`.
- **Surfaces:** `ONLY_BALLS_ROLL` (c1-02-02); `ORIENTATION_RENAMES` (c2-02-01); `CONE_NO_SLIDE` (c2-02-02); `CURVED_NO_FLAT` (c3-02-01); `SAME_ALL_SIDES` (c3-02-02); `VISIBLE_FACES_ONLY` (c4-01-01); `CYL_TOP_RECT` (c4-02-01); `ANY_SIX_SQUARES` (c8-11-02); `CUBE_TIMES3` (c8-01-03); `SA_VS_VOLUME`, `DIAMETER_FOR_RADIUS` (c9-14-01); `VERTICAL_FOR_SLANT` (c9-14-02); `DOUBLE_R_DOUBLE_V` (c9-14-03)
- **Probes:** predict (will this net fold into a cube?), contrast (two nets), translate (solid ↔ net ↔ views), construct. **Notes:** the `iso2d` fallback serves low-end devices **[U]**.

### E23 `chance@1` · P2
**Covers:** the probability scale, experimental vs theoretical probability, sample spaces, two-dice sums, tree diagrams (C9 ch7).
```ts
{ device: "spinner"|"coin"|"die"|"two_dice"|"bag"; sectors?: { label: string; weight: number }[]; bag?: Record<string, number>;
  trials: { batch: 1 | 10 | 100 | 1000; max: number }; views: ("tally"|"bar"|"rel_freq"|"grid"|"tree")[]; seed: number; scale: boolean }
```
- **Actions:** predict a distribution; run batches of trials; place an event on the 0–1 scale; build the sample-space grid or tree; design a spinner for a target probability; bet after a streak.
- **Events:** `ch.predict {event, p}` · `ch.run {n, counts}` · `ch.scale {event, pos}` · `ch.space {ok_cells}` · `ch.design {target, achieved}` · `ch.bet {streak, choice}`.
- **Surfaces:** `FIFTY_FIFTY` (c9-07-01); `GAMBLERS_FALLACY ← bets the opposite after a streak` (c9-07-02); `SIX_IS_HARD` (c9-07-02); `SUMS_EQUALLY_LIKELY` (c9-07-03)
- **Probes:** predict (POE is this engine's core), contrast (fair vs biased spinner), translate (spinner ↔ fraction ↔ scale), construct. **Notes:** the RNG is seeded, so a replay is identical. Run-to-run variation is shown on purpose.

### E24 `algebra-moves@1` · P2
**Covers:** order of operations, brackets, sign distribution, laws of exponents, simplifying rational expressions, equation solving as legal moves, "mind the mistake" (C7–C9).
```ts
{ expr: string; goal?: string; showTree: boolean; mistakesEnabled: boolean;
  allowedMoves: ("commute"|"associate"|"distribute"|"factor_out"|"combine_like"|"cancel_factor"|"same_both_sides"|"evaluate"|"expand_power")[] }
```
- **Actions:** drag a term to commute it; tap an operator to evaluate (allowed only when precedence permits); drag a factor out; pull a term across "=" (the engine applies the inverse to both sides, visibly); cancel a common factor.
- **Events:** `am.move {move, legal}` · `am.illegal {attempt, reason}` · `am.goal {steps, illegal}`.
- **Surfaces:** `LEFT_TO_RIGHT ← 3 + 4 × 2 = 14` (c7-02-02); `MINUS_FIRST_TERM` (c7-02-02, c8-06-03); `ADD_BASES ← 2³ × 3² = 5⁵` (c8-02-02); `ZERO_POWER_ZERO` (c8-02-02); `CANCEL_TERMS ← (x+2)/2 = x` (c9-04-03); `NEAT_IS_RIGHT` (c7-15-03); `NEG_EXP_NEGATIVE` (c8-02-03)
- **Probes:** spot_error (the core probe), predict (which operator can go first?), contrast, construct. **Evidence:** FH2T g = .135, DragonBox g = .269 (Decker-Woodrow 2023) **[V]**. End every session with a pencil-style symbolic step (Dolonen & Kluge 2015 **[S]**).

### E25 `rule-lab@1` · P2
**Covers:** number tricks, Kaprekar and reverse-add palindromes, Collatz (an open problem), claim-testing and counterexamples, converses, Euclid's GCD, comparing algorithms (C3, C6–C9).
```ts
{ mode: "trace"|"claim_test"|"algorithm_race"|"cryptarithm"; rule?: "collatz"|"kaprekar"|"reverse_add"|"euclid_sub"|"euclid_mod"|"custom";
  customRule?: string; input?: number; claim?: { text: L10n; domain: string; predicate: string }; algorithms?: string[] }
```
- **Actions:** pick a start and step the rule; test a claim on chosen cases; search for a counterexample; state a verdict; race two GCD algorithms by counting steps.
- **Events:** `rl.step {n, value}` · `rl.case {input, holds}` · `rl.counterexample {input}` · `rl.conclude {verdict, cases}` · `rl.race {alg, steps}`.
- **Surfaces:** `TRICK_IS_MAGIC` (c3-04-02); `FEW_CASES_PROVE ← verdict "always" after ≤ 3 cases` (c6-01-03, c6-03-02, c8-13-01, c9-09-02); `ALL_KNOWN` (c6-03-03); `CONVERSE_TRUE` (c9-09-01); `ALGO_IS_PROGRAM` (c9-11-01); `EQUALLY_FAST`, `SHORT_IS_FAST` (c9-11-02, c9-11-03)
- **Probes:** predict (how many steps?), construct (find a counterexample), contrast (statement vs converse on the `shape-lab` Venn), spot_error.

---

## 6. Build order and the measurements that gate it

**Build waves.**
- **Wave 0** (shared core): types, zod schemas, the fading machine, the bridge v2 events, `summarize()`, seedable RNG, exact rationals, golden-test harness.
- **Wave 1:** `number-line`, `place-value`, `fractions`, `collections`, `multiply-divide`.
- **Wave 2:** `data-graphs`, `geoboard`, `tape-diagram`, `patterns`, `balance`.
- **Wave 3:** the P1 engines.
- **Wave 4:** the P2 engines, unless Class 9 launches first (§0.1).

Each engine ships with:
- its manifest and `describe()`
- about 20 golden specs, rendered in CI with Playwright (tech-and-market §3.3)
- every named detector, with a unit test that fires it from a scripted event stream
- one T1 prompt example per probe kind

| # | measurement | method | gate |
|---|---|---|---|
| M1 | Spec-fill validity per engine | the realtime/fast model fills 200 specs per engine from objective + profile; zod `safeParse` first try | ≥ 98% valid first try, 100% after one repair **[U]** |
| M2 | Auto-fade vs fixed-pictorial | within-child A/B on matched skills; outcome = delayed (next-session) transfer item (P10), not in-session accuracy | adopt auto-fade only if delayed transfer ≥ fixed; tune `promoteAfter`/`demoteAfterErrors` **[U]** |
| M3 | Detector precision | every `misc_signal` triggers a verifying probe; PPV = confirmed / fired, per detector | detectors below PPV 0.4 are demoted to `weak` and never shown to parents **[U]**; base-rate caution from learning-science §7.2 |
| M4 | Number-line PAE as a metric | log PAE from `estimate` probes per child per range (0–10, 0–100, 0–1000, 0–1 fractions) | track over time; check against school or benchmark scores; never a target in itself (β = .13, Ünal 2024 **[V]**) |
| M5 | Interface confound at ages 6–7 | intended-action rate (tap hit on intended object) and time-to-act on a ₹8k-class Android phone | ≥ 95% intended-action rate before an engine is used with Class 1–2 **[U]** |
| M6 | Translate-probe validity | teacher raters judge 300 translate attempts as "understands / doesn't"; compare with the engine's equivalence verdict | κ ≥ 0.7 **[U]**, or the translate checker is revised |
| M7 | Perceptual-richness check | bland vs illustrated concrete skins on `collections` and `fractions`, delayed transfer | keep bland unless illustrated wins on transfer (Carbonneau, Petersen & McNeil predict it will not) **[U]** |

**Open questions this document does not settle:**
- whether Hindi number-name irregularity measurably raises place-value errors for Hindi-dominant children (testable from `pv.write` logs by home language)
- whether the `money` drawings need RBI permission
- whether `balance` should carry experimental "balloons" for negatives, or hand off as specified

---

## 7. Sources

**Manipulatives and concreteness fading**
- Moyer-Packenham, P. S., & Westenskow, A. (2013). Effects of virtual manipulatives on student achievement and mathematics learning. *IJVPLE* 4(3):35–50. https://eric.ed.gov/?id=EJ1154970 **[S]**
- Moyer-Packenham, P. S., & Bolyard, J. J. (2016). Revisiting the definition of a virtual manipulative. https://www.semanticscholar.org/paper/2b4322f0a3dfac648c7ab225efa57ee6f3e7dbb7 **[S]**
- Carbonneau, K. J., Marley, S. C., & Selig, J. P. (2013). A meta-analysis of the efficacy of teaching mathematics with concrete manipulatives. *J Ed Psych* 105(2):380–400. https://asu.elsevierpure.com/en/publications/a-meta-analysis-of-the-efficacy-of-teaching-mathematics-with-conc/ **[S]**
- Fyfe, E. R., McNeil, N. M., & Borjas, S. (2015). Benefits of "concreteness fading" for children's mathematics understanding. *L&I* 35:104–120. https://www.researchgate.net/publication/268692319 **[S]**
- Fyfe, E. R., McNeil, N. M., Son, J. Y., & Goldstone, R. L. (2014). Concreteness fading in mathematics and science instruction: a systematic review. *EPR*. https://www.researchgate.net/publication/262943993 **[M]**
- One instructional sequence fits all? Applicability of concreteness fading across subjects (*EPR*, 2021). https://eric.ed.gov/?id=EJ1310124 **[S]**
- Petersen, L. A., & McNeil, N. M. (2013). Effects of perceptually rich manipulatives on preschoolers' counting performance. *Child Dev* 84:1020–1033. https://onlinelibrary.wiley.com/doi/abs/10.1111/cdev.12028 **[S]**
- Willingham, D. T. (2017). Ask the cognitive scientist: Do manipulatives help students learn? *American Educator*. https://www.aft.org/ae/fall2017/willingham **[S]** (secondary source for Resnick & Omanson 1987, McNeil et al. 2009, Goldstone & Sakamoto 2003)

**Number line, games, magnitude**
- Hamdan, N., & Gunderson, E. A. (2017). The number line is a critical spatial-numerical representation. *Dev Psych* 53(3):587–596. https://sites.temple.edu/cognitionlearning/files/2017/05/Hamdan-Gunderson-2017.pdf **[V]**
- Gunderson, E. A., et al. (2019). Number line unidimensionality is a critical feature for promoting fraction magnitude concepts. *JECP*. https://www.sciencedirect.com/science/article/abs/pii/S0022096518304867 **[S]**
- Ünal, Z. E., et al. (2024). The relation between number line performance and mathematics outcomes: two meta-analyses. *Dev Sci*. https://pmc.ncbi.nlm.nih.gov/articles/PMC11753455/ **[V]**
- Siegler, R. S., & Ramani, G. B. (2009). Playing linear number board games—but not circular ones—improves low-income preschoolers' numerical understanding. *J Ed Psych*. https://eric.ed.gov/?id=EJ861180 **[S]**
- Nelson, G., Boedeker, P., et al. (2025). Investigating main effects and moderators of linear number board games: a meta-analytic review. *RER*. https://doi.org/10.3102/00346543251383552 **[S]**

**Equations, algebra, abacus, time**
- Otten, M., Van den Heuvel-Panhuizen, M., & Veldhuis, M. (2019). The balance model for teaching linear equations: a systematic literature review. *IJ STEM Ed* 6:30. https://d-nb.info/1203464487/34 **[V]**
- Decker-Woodrow, L. E., et al. (2023). The impacts of three educational technologies on algebraic understanding in the context of COVID-19. *AERA Open*. https://pmc.ncbi.nlm.nih.gov/articles/PMC10125888/ **[V]**
- Dolonen, J. A., & Kluge, A. (2015). Algebra learning through digital gaming in school. *CSCL 2015*, 252–259 (via Chan et al. 2023, *BJET*). https://bera-journals.onlinelibrary.wiley.com/doi/full/10.1111/bjet.13304 **[S]**
- Barner, D., et al. (2016). Learning mathematics in a visuospatial format: a randomized, controlled trial of mental abacus instruction. *Child Dev* 87:1146–1158. https://pubmed.ncbi.nlm.nih.gov/27062391/ **[S]**
- Barner, D., et al. (2018). A one-year classroom-randomized trial of mental abacus instruction for first- and second-grade students. *J Numerical Cognition*. https://jnc.psychopen.eu/index.php/jnc/article/download/5761/5761.html?inline=1 **[V]**
- Burny, E., Valcke, M., & Desoete, A. (2012). Clock reading: an underestimated topic in children with mathematics difficulties. *J Learn Disabil*. https://www.semanticscholar.org/paper/ad4e6c313d92021fe027df93b45082da5f61a450 **[S]**
- Investigating clock reading skills of third graders with and without dyscalculia risk (2020). https://files.eric.ed.gov/fulltext/EJ1258500.pdf **[S]**

**Curriculum, India, licences**
- NCERT *Ganita Prakash* Class 6, Ch 10 "The Other Side of Zero" (§10.1 Bela's Building of Fun, §10.2 token model, §10.3 credits/debits, sea level, temperature). https://ncert.nic.in/textbook/pdf/fegp110.pdf **[V]**
- Coins of the Indian rupee (2019 series diameters; older ₹1 at 25 mm). https://en.wikipedia.org/wiki/Coins_of_the_Indian_rupee **[S]**
- Indian 2000-rupee note (withdrawal from circulation announced 19 May 2023; still legal tender). https://en.wikipedia.org/wiki/Indian_2000-rupee_note **[S]**
- IPC ss. 489A–489E (counterfeiting currency). https://sherloc.unodc.org/cld/en/legislation/ind/indian_penal_code/chapter_xviii/sections_489a489e/sections_489a-489e.html **[S]**
- PhET Equality Explorer source (GPL-3.0). https://github.com/phetsims/equality-explorer **[V]**
- The Math Learning Center, Apps Terms of Use. https://www.mathlearningcenter.org/apps/apps-terms **[S]**
- Taxila internal: `docs/research/tech-and-market.md` §1.7, §3.1–3.6, §4; `docs/research/learning-science.md` §2.4, §7.1–7.2; `data/curriculum/SOURCES.md`.
