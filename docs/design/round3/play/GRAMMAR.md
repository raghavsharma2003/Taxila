# Play grammar `play@1` — the contract (round 3, stream play)

**Source of truth:** `shared/play.ts` (types + pure helpers, erasable TS, importable by client, server and tests). This page
explains it for the streams that target it (forge: live composition and visual QA; the lesson/Director owners: the seam).
If this page and the file disagree, the file wins and this page is the bug. Published 2026-10-09, first part of the stream.

---

## 1. Who writes what

| thing | written by | never written by |
|---|---|---|
| a level (`PlayLevel`): numbers, positions, set-ups, the goal | a family **generator** in code (`src/play/families/<f>/logic.ts`), solver-checked | any model |
| the key / the true outcome | the family's **law** (`apply`, `solve`) | any model, the frame, the device |
| the grade and the evidence | the **server** replaying raw acts (`server/play/grade.js` → `FamilyLogic.grade`) | the frame's claim (`CLAIM_KEYS` are stripped) |
| child-facing words in play | the authored bank `data/play/reactions.json`, filled with on-screen facts by `server/play/react.js`; a shape true in one context only starts with a condition (`{?why=not_enough}`, `{?mal=include-one}`, `{?mode=strips}`, `{?goal=equal}`, `{?predicted}`) and is skipped elsewhere; every `law_refused` shape names its refusal | a model (no model call exists on the play path) |
| which art direction | `pickArt()` (pure) from the family, topic, class, child choice and last art shown | a model |
| which context skin | the coverage file's `contexts` ∩ the child's interest tags (code) | a model writing a new context |
| when play appears | the Director / Stagecraft policy (other streams), admitting by **skill** via `playFor(skillId)` | topic-tag or keyword matching (`rj-studio-fraction-mention-as-topic`) |

The forge stream may compose a play piece live (choose the family/mode the coverage file admits for the skill, ask the play
server for a level, choose among `FAMILY_ARTS` and the listed contexts). It may not author a level, a key, a string a child
sees, or an art direction outside the list.

## 2. Identifiers

- `FAMILIES`: `todo-jodo` (split and merge), `taraazu` (balance), `nishana` (number line), `kyun-lab` (fair test).
- `MODES[family]`: `todo-jodo` → `atoms` | `strips` | `bundles`; `taraazu` → `equation` | `equality`; `nishana` → `place` |
  `compare`; `kyun-lab` → `fair-test`.
- `ARTS`: `kagaz` | `chalk` | `blueprint` | `raat`; `FAMILY_ARTS[family]` lists what each family can wear (all four today).
- `Fade`: 1 world · 2 world + live symbol · 3 the symbol is the controller. Stage 4 (the bare item) is never a play level.
- `Door`: `garam` (in band) | `teekha` (harder). Both are valid levels; neither carries a reward.

## 3. The level envelope

```ts
interface PlayLevel<P> {
  v: "play@1"; levelId; family; mode; topicId; skillId; fade; goal;   // goal = a closed per-family predicate id
  params: P;                                                          // family-specific, validated by FamilyLogic.validate
  targets: string[];                                                  // kit misconception ids it tells apart
  slip?: { misconceptionId; by: "bittu" | "golu" } | null;           // spot-the-slip: the apprentice's labelled work
  door?: Door; context: string; seed: number;
  proof: { solvable: true; shortcutFree: true; minActs; solutions; discriminates: string[]; pFirstTry; score; genMs };
}
```
`proof.shortcutFree` and `proof.solvable` are literal `true`: a level that fails either is never constructed.

Family params (abridged; full types in `src/play/families/<f>/logic.ts`):
- **atoms:** `{ n: number; goal: "atoms" | "two-trees" | "hcf" | "lcm"; m?: number; benchSplit?: [a, b] }`
- **strips:** `{ bars: { d: number; shaded: number[] }[]; goal: "make" | "equal" | "compare" | "add" | "sub" | "unit"; target?: [n, d] }`
- **bundles:** `{ a: number; b: number; places: number; goal: "subtract" }`
- **balance:** `{ L: { bags, units }; R: { bags, units }; x: number; goal: "solve" | "fill" }`
- **line:** `{ lo; hi; major; minor; values: { text, num, den }[]; tol: number; goal: "place" | "compare" | "round"; to?: number }`
  (round: the line runs between two neighbouring landmarks `lo`, `hi = lo + to`; place the value, then round to the nearer end)
- **lab:** `{ lab: string; setups: { [factor]: level }[]; test: string; goal: "fair" | "predict" | "golu"; judge: "design" | "predict" }`
  Labs (`src/play/families/kyun-lab/labs.ts`, each quoting its kit topic's expectations in `source`): ankur (germination),
  sukhao (drying / evaporation), jhoola (pendulum, T = 2π√(L/g)), jang (rusting), parchhai (shadow, similar triangles),
  rang (dark surfaces absorb heat), tairna (floating: material, shape, size), barf (ice, insulation and conduction),
  chumbak (magnetic materials, through paper), bijli (conductor tester), phaphoond (mould on roti), patta (starch test:
  light, chlorophyll, CO2). `exact: true` marks a law or a category; any other number is an illustrative model value and is
  shown with "lagbhag" (about).

## 4. Acts

Everything the child does travels as `PlayActEnvelope { seq, t, via: "touch" | "voice" | "key", act }`. The act unions per
mode are in `shared/play.ts` (`AtomsAct`, `StripsAct`, `BundlesAct`, `BalanceAct`, `LineAct` (incl. `round`), `LabAct`).
`sanitizeActs()` bounds the list (400), drops malformed acts and strips claim fields before any replay. `t` is never used to
grade.

**Voice is a press, not a parse of meaning** (`src/play/core/voice.ts`): `parseVoice(text)` maps a short committed utterance
(≤ 6 tokens, every word inside a closed Hinglish / Hindi / English grammar) to an intent, and `pressesFor(intent, controls)`
to the control ids on screen now; the presses are dispatched with `via: "voice"`. Anything outside the grammar, any
sentence, and the lesson's own words ("bas", "stop", "help", feelings) are never acts; the utterance is a normal lesson turn
either way.

## 5. Moments, reactions, seams

- `MOMENT_KINDS`: `first_act`, `progress`, `law_refused`, `misconception_consequence`, `near_miss`, `prediction_committed`,
  `prediction_violated`, `prediction_confirmed`, `new_strategy`, `impasse`, `solved`, `slip_found`. A moment carries on-screen
  `facts` only.
- `Reaction { id, moment, lang, text, channel: "micro" }`: an authored line filled with facts. `reactionProblems()` is the play
  guard (banned verdict/praise/pressure words, template bugs, a hidden value leaking); the server also runs the never-rules
  floor (`floorViolations`). The client applies the floor rules: ≤ 1 per 4 s, never while a finger is down or within 600 ms of
  release, never while the child holds the floor.
- `PlaySeam { kind, facts, bareItem? }`: when the Director should take a full turn; `playFactsRow(facts)` renders the
  telegraphic `PLAY` row (`key=value …`, never sentences).

## 6. Wire (server/play/routes.js)

| route | body → response |
|---|---|
| `POST /api/play/start` | `PlayStartRequest { childId, skillId? , topicId?, lessonId?, lang?, art?, fade? }` → `PlayStartResponse { sessionId, level, art, bank, world }` |
| `POST /api/play/act` | `PlayActRequest { sessionId, levelId, acts, final?, impasse? }` → `PlayActResponse { levelId, moments, reaction, grade?, doors?, seam? }` |
| `POST /api/play/next` | `PlayNextRequest { sessionId, door }` → `PlayNextResponse { level, art, bank }` |
| `GET /api/play/world?childId=` | `PlayWorldResponse { classLevel, families: PlayWorldFamily[] }` |
| `GET /api/play/say?sessionId=&id=` | `audio/mpeg` of a server-held reaction line (never free text) |
| `GET /api/play/admit?skillId=` | `{ play: true, family, mode, goal, topicId } | { play: false }` (the admission check) |
| `POST /api/play/level` | `{ sessionId } → { sessionId, level, art }` (the Studio renderer's mount) |

Inside a lesson (`lessonId` on start) a graded post also returns **`evidenceToken`** (the server's own evidence rows, HMAC
signed, bound to the child and the lesson) and a seam returns **`seamToken`** (the seam kind and its telegraphic `PLAY` row,
signed the same way). The client forwards tokens as module events of engine `play` and never reads them; the lesson turn
folds only a token that verifies for its own child and lesson, once per level (`server/play/evidence.js`, patch 03).

Every child route is `requireChild` (no IDOR); a session belongs to its child; the act route replays the whole level each time.

## 7. The lesson seam (applied by patch; see `APPLY.md`)

- `PlayArtifact { kind: "play"; play: { sessionId, family, mode, skillId, topicId, art, levelId } }` joins the Studio artifact
  union (`shared/studio.ts`) so a play segment rides the existing `ui.studioSlot`.
- The client renders it with `src/play/PlayStudioRenderer.tsx` → `PlaySession` → `PlayStage` **embedded** (the Desk shows the
  teacher, so play drops its own top bar and teacher strip); a box under `MIN_BOX` (300 × 440, `src/play/core/box.ts`) is
  refused with `{ type: "error", reason: "runtime", message: "layout" }` and forge's stage shows the board twin. The Desk's
  play mode (patch 04) folds the question card so the tray meets the box on phones ≥ 690 CSS px tall.
- Seams reach the lesson through `src/play/lessonBridge.ts` as module events of engine `play`: level end → `goal_met`, impasse
  or misconception → `stuck` (both call the Director at once), prediction and evidence → `interaction` (ride along). The
  verified seam row is added to the turn's activity line (`play <kind> key=value …`): her reply is grounded in what is on
  the screen (measured locally: "…prime factors mein todkar 2·2·5·13 tak pahunchaya…").
- Evidence: one `item.open` KT event per level, `via: "game"` (bktr.js SOURCE_WEIGHT 0.5), on the lesson's kit skills only;
  never the delayed check, never "unaided" (patch 02): only a bare item outside the game makes a skill learned or secure.

## 8. Art directions

`ArtTokens` (ground, panel, ink ×3, relevant-object hues q1-q4, `good` with a tick, `look` with a magnifier, the reserved
`you` hue, jitter, fonts, sound palette). Views draw only through `src/play/core/styles.ts`; a family that renders a colour
literal fails `tests/play-style-lint.test.mjs`. `pickArt()` rules: child choice when compatible; else the topic's preference
not shown last time in this subject; class 4-5 prefer light grounds; never the same direction twice in a row unless chosen.

## 9. The world

`PlayWorldFamily { family, stations: PlayStation[], routes: PlayRoute[] }`; `PlayStation.state: InkState` = `ahead` ·
`hatched` · `pencil` · `ink` from `inkOf()` over the skills' map states (the same truth as the Garden/Sky map); `recheck`
only from a server-scheduled re-check; `PlayRoute.cite` names the real edge (curriculum `prerequisites` or kit
`prereqSkillIds`). No counts, percentages, unlocks or clock inputs anywhere in the type.

## 10. Coverage file (`data/play/coverage.json`)

```json
{ "v": 1, "skills": { "<skillId>": { "family": "todo-jodo", "mode": "atoms", "goal": "atoms",
    "grammar": { "...": "family knobs" }, "misMap": { "<malRuleId>": "<kit misconception id>" },
    "arts": ["chalk", "kagaz"], "contexts": ["laddoo-tray"] } },
  "excluded": { "<topicId>": "reason" } }
```
A skill not in `skills` is not admitted to play (the lesson keeps its board and practice). Every `misMap` value is a real kit
misconception id (tested). Built by `server/play/tools/build-coverage.mjs` from the kits plus reviewed rules; the rule that
admitted each skill is kept in `why` so a reviewer can disagree with it.

## 11. Invariants the tests hold (`tests/play-*.test.mjs`)

1. Every served level: `solve()` non-null, `shortcut()` null, `validate()` round-trips.
2. `grade(level, solve(level))` → `solved`; every family mal-rule sequence → not `solved` or `partial` with its
   misconception id; a forged claim field never changes a grade.
3. No reaction line in the bank, filled with any reachable facts, has a `reactionProblems()` or `floorViolations` hit.
4. The world fold has no clock input and every route cites an edge.
5. Every family × art direction renders at 360 × 800, 412 × 915 and 1366 × 768 with text ≥ 14 px (16 px class 4-5) and
   targets ≥ 44 px, nothing outside the box, no label clipped (`audit.clipped` = 0; `Painter.textFit` wraps to two lines
   at the floor before it ever truncates).
6. No family file writes a colour literal (`tests/play-style-lint.test.mjs`); labs draw materials through `Painter.material`.
