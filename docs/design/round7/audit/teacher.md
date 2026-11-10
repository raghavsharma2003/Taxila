# Audit: teacher (round 7, 2026-11-10)

Area 1 of the whole-project audit (`BRIEF.md`). Audit only: the Brain stream is building in these files, so no product
code is changed here. Small, certain fixes are written as patches under `docs/patches/to-brain/` with a test.

Base: `claude/r7-audit` (int/r6 at integration 21a, `8bb6b188`, plus the brief).

## What a child gets today (default flags)

- **Lane: the Director.** `server/agent/flags.js laneFor` gives the Teacher agent lane only when `TAXILA_TEACHER=agent`
  or the guardian is on `TAXILA_TEACHER_AGENT_FOR` (the owner cohort). Nothing in `infra/`, the deploy scripts or CI sets
  `TAXILA_TEACHER`, so every other child is on the Director lane. The agent lane is live for the owner cohort only.
- **Script walk: on, for four topics.** `server/director/script.js scriptOn` is on unless `TAXILA_R7_SCRIPT=off`, and it
  walks a skill only when `data/lesson-scripts/<topic>.json` exists and validates. Four files exist (c4 maths ch05 t01,
  c5 maths ch02 t01 and t02, c6 maths ch06 t01). Every other topic (826 of the 830 kit topics) runs the kit path of the
  Director (`director/state.js`, the hint ladder, `brain/say.js` reply plus guards).
- **Start lane: cascade.** `routes/lesson.js startModeOf`: no mode, or an unknown one, is the cascade lane; realtime voice
  only with an explicit `mode: "voice"`.
- **Session-first start:** off unless `TAXILA_SESSION_FIRST=on` or the guardian is on `TAXILA_SESSION_FIRST_FOR`.

## Grading: where an answer is judged

- **Keyed items (every lane):** `server/director/classify.js classify`. Code first (`classifyFast`: exact key, numbers via
  the one reader `grading/spoken-number.js`, options, chips, module answers). When code cannot decide, a model LABELS the
  reply against the listed key, misconceptions and options (never a free grade), and `grading/corroborate.js` keeps a
  "correct" only when the child's words carry a complete form of the key. This is the one grader for keyed items; the
  agent lane is told this grade (`agent/agent.js gradeOf`), it never grades.
- **Why and teach-back answers:** judged by models only. On the turn, the same labeller says which key ideas are covered
  (`parseClassification`, teach-back passes at 60 % covered); `corroborate` does not run for these modes
  (`corroborate.js:432`, `mode !== "item"` returns the model's label). The evidence is held and re-graded off the reply
  path by the blind grader (`comprehension/later.js`, learner area) with a code span check. So yes: for why and teach-back
  a model's label decides, by design (decision on probe shapes, `context/decisions.md:1155`). TEACHER-03 is where this
  leaks into something the child sees as verified.
- **Script cards:** graded in code (`TAXILA_R7_SCRIPT_GRADE`, on by default); `=off` sends them to the model labeller.
- Other graders outside this area (placement, games, Studio) are not counted here.

## Findings

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| TEACHER-01 | P1 | inconsistent | brain + face | Classes 1-3: she says "teach Golu, a baby elephant" while the screen shows a cloud pup, a pebble or a sprout | `server/compiler/characters/asha.js:25`, `server/director/shapes.js:44,50,438-440`, `src/ui/teacher/Protege.tsx:10-24` | one source of truth: the server picks the young protégé per child from the three sprites (name + `what`) and sends its kind on the lesson start; the client draws that kind | open |
| TEACHER-02 | P2 | broken | brain | The labeller and the understand note read only the START of her last line; on a long line her question (the last sentence) is cut off | `server/director/classify.js:241`, `server/conversation/understand.js:92` | keep the tail: `docs/patches/to-brain/010-heard-tail.patch` (+ test) | patch |
| TEACHER-03 | P2 | inconsistent | brain | A teach-back tick on the child's "What you did today" comes from the model label alone, never the blind grade | `server/brain/turn.js:1617-1619`, `server/routes/lesson.js:620-636` | record teach-back with `verified: false` until the blind verdict agrees, and require `verified` for the `taught` card | open |
| TEACHER-04 | P2 | inconsistent | brain | `ui.hint` is sent and read but is not in `UiDirectives` | `server/director/state.js:3587`, `src/child/lesson/useDesk.ts:43,330`, `shared/contracts.ts:91-152` | `docs/patches/to-brain/011-contracts-ui-hint.patch` (+ test) | patch |
| TEACHER-05 | P2 | broken | brain | `POST /api/lesson/turn` hands the child's words to listeners and takes the lesson's speculation BEFORE the request is authorised | `server/routes/lesson.js:902-904` (and `server/routes/voice.js:397-398`, voice's) | emit and take after the lesson is loaded for the signed-in guardian (inside `lessonTurn`, after its `requireChild`) | open |
| TEACHER-06 | P2 | not good enough | brain | The agent lane's prompt cuts kit text silently: 1,666 of 25,194 item prompts over 180 chars, 930 cards over 200, and 669 of 830 topics lose key ideas past the 4th | `server/agent/prompt.js:103-122` | measure the state message and throw (fall back to the Director, as any agent failure does) instead of `clip`; or raise the clips to the kit's own caps | open |
| TEACHER-07 | P2 | inconsistent | brain | `server/signals` (the per-turn signal layer) is built and tested but never called on any lesson path | `server/signals/index.js` (only `tests/signals-server.test.mjs`, `evals/signals/run.mjs` import it); `context/decisions.md:3242-3247` | either wire `step()` where the decision says (proposers read the frame) or record in context that it is unbuilt; until then it is not evidence of anything a child gets | open |
| TEACHER-08 | P2 | not good enough | brain | `textReply` judges every draft with one 50-predicate list, each switched by its own flag and each with its own repair; the next guard added will fight an existing one | `server/brain/say.js:1081-1164` | proposal: a guard table `{ id, applies, check, repair, order }` with a test that no two repairs undo each other (`teacher-proposals.md`) | proposal |
| TEACHER-09 | P3 | no longer needed | brain | `server/director/say.js.orig`, a 291-line merge leftover nothing reads | `server/director/say.js.orig` | delete | open |
| TEACHER-10 | P3 | no longer needed | brain | Five seam-patch files that neither apply nor reverse: their changes landed long ago; one comment still says "until then" | `server/brain/seam-patches/w2e-plan-whiteboard-hot.patch`, `server/director/seam-patches/w2c-lesson-purpose-talk.patch`, `server/relational/seam-patches/w2i-{compile-rel-shapes,state-stop-check,turn-say}.patch`; `server/director/safety.js:806-809` | delete the files (context cites them by name only as history), fix the comment | open |

## Evidence notes

**TEACHER-01.** `asha.js:25` young band: `protege: { name: "Golu", what: "a pretend baby elephant just starting school" }`.
`shapes.js:44,50` (hook: "mention once: at the end they will teach this to Golu (a pretend baby elephant…)") and
`shapes.js:438-440` (teach-back: "Golu (…) wants to learn today's idea… you voice Golu"). On screen, the young family's
teach-back shows `Protege.tsx`: `PROTEGE_KINDS = ["cloud-pup", "pebble-friend", "sprout-sprite"]`, picked by a hash of the
child's name (`protegeStaging` passes `m.childName`; the comment says child id). No path tells the client "elephant" or
tells the server which sprite is up. A class 1-3 child hears "teach Golu the baby elephant" next to a cloud pup.

**TEACHER-02.** `classify.js:241` `` `WHAT THE TEACHER LAST SAID: ${String(heard).slice(0, 500)}` ``. The system prompt's rule
(`classify.js:189`) is "if what the teacher last said asked a DIFFERENT question… label it no_attempt", and her question
is her last sentence. Her reply is up to 220 tokens (`brain/say.js:1186`); the realtime lane's `teacherText` has no cap.
`understand.js:92` does the same at 400. The patch exports `heardTail` and keeps the last 500 / 400 characters from a word
boundary. Classify (11) and filter-context (5) suites pass with it.

**TEACHER-03.** `noteDid` writes `{ kind: "teachback", verdict: cls.outcome === "correct" ? "correct" : undefined,
verified: kit.verified !== false }` from the turn's classifier label. `lessonSummary` puts it on the child's summary as a
tick card (`taught`, `lesson.js:633,636`) without reading `verified`, and its docstring says the screen comes "from the
verified-key classifier — never from a model's account". For a teach-back the classifier IS a model (`parseClassification`
teachback branch, no `corroborate`). When the blind grader later disagrees, `state.did` is never revised.

**TEACHER-04.** Producer `state.js:3586-3587`, `ui.hint = hintFor(...)` → `{ level, text }`. Consumer `useDesk.ts:330`
reads `ui.hint?.text`, typed by its own local `hint?: { level?: 1 | 2 | 3; text?: string }` (`useDesk.ts:43`).
`UiDirectives` (`contracts.ts:91`) has no `hint`. The patch adds it; `npx tsc -b` passes.

**TEACHER-05.** `lesson.js:902`: `emitChildText({ lessonId: body.lessonId, … text: body.childText })` and `:903`
`takeAgentSpec(body?.lessonId, body?.childText)` run before `lessonTurn` authorises anything. Today no in-process listener
subscribes (`onChildText` has no caller outside tests), so the emit is latent. The take is live: any caller who knows a
lesson id can, with different words, make `takeAgentSpec` drop that lesson's held speculation (`agentSpec.js:140`), or with
the same words take it (then the 401 settles and aborts it). The duplex partial route does it right
(`duplex/childText.js:76-78`: lesson read and `requireChild` before the emit). Owner-cohort impact (the speculation is the
agent lane's), but the emit becomes a cross-child leak the day Studio M4 subscribes.

**TEACHER-06.** `prompt.js:103` `clip = (s, n) => …slice(0, n)`; `:110` key ideas `.slice(0, 4)`, `:116` each offered
item's question `clip(…, 180)`, `:120` the card `clip(…, 200)`. The file header says "truncation is silent, so budget gates
throw"; no gate exists in this file. Counted over `data/kits/*.json`: 25,194 item prompts (hi + en), 1,666 over 180
characters, 930 over 200; 669 of 830 topics have more than 4 expectations. Example `c1-hindi-ch15-t01-i02` (220 chars). The
agent sees the start of a question it then poses. Owner cohort only.

**TEACHER-07.** Reachability from `server/serve.mjs` → `server/index.js`: `server/signals/{index,states,quality,session,
backstop,priors}.js` are reached by no product import (static or dynamic). `context/decisions.md:3247` ("exports one pure
function, `step(session, input, { off })`… the existing proposers read it") and the backstop decision describe it as part
of the turn. `shared/signals.ts` and `server/voicesig` mirror its priors.

**TEACHER-08.** `say.js:1081-1153`: 50 predicates in one array (`floor`, `praise`, `deny`, `claim`, `corrects`, `screen`,
`parts`, `register`, …, `noconfirm`, plus `checkInProblems`), switched by `p5Flag("GUARDS")`, `R3CONV`, `listenOn()`,
`scripted`, `pinned`, `rePose`, `checkin`; repairs by a separate `shapeFix` (`:1156`) and the model rewrite. Each round has
added one guard with a comment naming the run that needed it. The mechanism for the next bug: a new predicate whose repair
(e.g. `endOnAsk` for `ask`) re-trips an older one (`mustsay`, `bare`, `samecard`), and only a live run shows it. Not a
defect today; written as a proposal.

**TEACHER-09.** `git grep "say.js.orig"`: no hit. Last touched by the context commit `331b52c5` (a mass add). Not in
`package.json`, CI, Dockerfiles or tests.

**TEACHER-10.** `git apply --check` and `git apply --check -R` both fail for all five (the w2c one has no valid hunk
header at all). The changes they describe are in the tree (e.g. `compile.js:24,185-205` renders `REL_SHAPES`, the w2i
compile patch's item 1). `safety.js:806-809` still says the relational corrections wait "until W2-C applies
server/relational/seam-patches/w2i-compile-rel-shapes.patch"; `compile.js:96` shows `REL_FLOOR_FIX` landed. `context/`
names them in merged inbox history only (no evidence citation of the file's content).

## Coverage

Read fully: `server/routes/lesson.js`, `server/director/script.js`, `server/agent/flags.js`, `server/agent/prompt.js`,
`server/conversation/flags.js`, `server/compiler/gates.js`, `server/compiler/characters/asha.js`.
Read in part (targeted): `server/brain/say.js` (`textReply`, 947-1210), `server/brain/turn.js` (held grades, `noteDid`),
`server/director/classify.js` (prompts, parse, corroborate hand-off), `server/director/state.js` (`uiFor`, `hintFor`),
`server/director/shapes.js` (protégé shapes), `server/compiler/compile.js` (budget gate), `server/grading/corroborate.js`
(header, `corroborate`), `server/agent/agent.js` (grading), `server/conversation/understand.js` (prompt).
Machine checks over the whole area: import reachability from `server/serve.mjs`, unused named imports, seam-patch
apply state. Not yet read: the rest of `brain/say.js`, `brain/propose.js`, `director/state.js`, `relational/*`,
`persona/*`, `signals/*` internals, `evals/hybrid-side-by-side/*.mjs`.
