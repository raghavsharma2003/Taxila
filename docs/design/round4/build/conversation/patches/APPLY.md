# Stream 4A (conversation) · patch requests

Apply in this order, after the stream's own commits. Each was applied on `claude/r4-conversation` only as a separate
`[patch-request]` commit, so the main session can drop and re-apply it at merge (BUILD-PLAN §4 rule 2).

| # | file | owner | why | proved by |
|---|---|---|---|---|
| 01 | `db/migrations/025_child_school_chapter.sql` (new; number 025 assigned by the main session) | main | `child.school_chapter` (jsonb { subject: chapter }) is read by `content/next-topic.js schoolStartIndex` since F0.4 but no migration ever created it (TUTOR-MODEL §2.4), so placement always fell back to the calendar. The session-first intake writes it when it confirms today's school topic. Additive, nullable. NOT applied to any database by this stream. | patch 02's end route wraps the write in a catch, so the tree runs with or without it; `tests/r4-conversation-session.test.mjs` (schoolPointerStmts) |
| 02 | `server/routes/lesson.js` | main | session-first start: `purpose: "session"` (served only when `TAXILA_SESSION_FIRST=on`; otherwise identical to "lesson") passes `ctx.session` from `director/session/start.js sessionStartCtx` (the day plan as a private prior, due reviews, the school pointer) to `initLessonState`; the Director then opens on the intake beat. End: the summary, kit and `lesson.topic_id` follow the session's last segment (segments re-point the state inside the same lesson row); the confirmed school position is written to `child.school_chapter` (needs 01; never the end's error). | `tests/r4-conversation-session-db.test.mjs` (real route + Neon TEST branch: a session start opens on the intake; a plain start is unchanged), `tests/r4-conversation-session.test.mjs` |

Not patches (switches for owner decisions, TUTOR-MODEL §9; all default off, `server/director/session/flags.js`):
`TAXILA_SF_H3_PERSIST`, `TAXILA_SF_LIFE_CALLBACKS`, `TAXILA_SF_EXPLORE`, `TAXILA_SF_START_ONLY_HOME`, `TAXILA_SF_NOTEBOOK_CAMERA`,
`TAXILA_SF_PARENT_INTAKE_C12`.

Client follow-ups (not this stream's files; listed for the owners of `src/child` and `src/lesson`):
- the Start-only home (owner decision; `TAXILA_SF_START_ONLY_HOME`) sends `purpose: "session"` to `POST /api/lesson/start`;
- the intake's chips (`intake:subject:<s>`, `intake:test`, `intake:homework`) are ordinary `ui.chips`; a tap sends its `chipId` as today;
- a `move.segment` on a turn ({ n, topicId, purpose, mode }) means the lesson moved to a new topic in the same lesson: the
  client may refresh its topic title; nothing else changes (same lessonId, same turn route).

## Safety-floor patches (need the main session's safety review; NOT applied on this branch)

**03: APPLIED on base and SUPERSEDED by `7ec8202`** (the main session's amended version: game/pest object exclusion on the
habitual and long-gap peer rules, a peer subject required for the Devanagari no-actor gap rule, four more misses caught).
Do NOT re-apply this branch's `03-safety-peer-actor.diff`; it stays only as the record. Checked on the merged tree
(`d9e439ad`): the review test 3/3, base's `tests/safety-r4-scan-disclosures.test.mjs` 3/3; both blind opening sets decide
every safeguard opening by the CODE predicate alone (set 1 6/6, set 2 5/5; before: 4/6, 2/5), 0 false safeguards; kit strings
41 hits on the merged tree = 41 on `522dca6e` (0 new); battery lines 9 hits, all `distress` cases.

| # | file | owner | why | evidence |
|---|---|---|---|---|
| 03 | `server/director/safety.js` (frozen) | main + safety review | The blind session-opening batteries (2026-10-10) found five disclosures the CODE predicate misses; the live path caught each only through the classifier's model distress read. (1) a peer actor, "aaj school mein ek bade ladke ne mujhe maara" (`ACTOR_HI` had family and teachers only); (2) "papa ne kal raat phir belt se maara, abhi bhi dard ho raha" (six words between the actor and the verb); (3) a habitual peer hit, "ek ladka roz recess me maarta hai … mummy ko mat batana"; (4) Devanagari with four words between मुझे and the verb, "सब मुझे रोज़ चिढ़ाते हैं और मारते हैं"; (5) the English bullying shape, "everyone in class calls me names and i cry in the washroom every day". The patch adds: a peer actor list (only with the child as the object), an actor + instrument / pain-word beating over a wider gap (pests, balls and things hit excluded), a habitual peer hit, Devanagari actor-ने-…-मुझे-मारा and the wider मुझे gap, an English peer "… hits me", and the names-and-crying shape. | `node --test docs/design/round3/adversarial/r4-scan-disclosures.test.mjs`: with the patch 3/3 (the 5 misses by scanSafety AND classifyFast with no model; 10 variants in Hinglish, Devanagari and English; 28 benign maar / mara / peet lesson and kit sentences quiet); without it 1/3 (fails as intended). False-positive scan: 122,154 kit strings (prompts, answers, acceptables, hints, options, worked steps) 27 hits before, 27 after, 0 new; every conversation-v2 battery and round-2 held-out utterance 9 before, 9 after, 0 new; both intake held-out sets 0. Still to run on the integrated tree: `w2i-safety` 39/39, the adversarial suites, persona invariants 70/70, never-rules. |

## Patch 04 (stream 3's file)

| # | file | owner | why | proved by |
|---|---|---|---|---|
| 04 | `server/brain/turn.js` (one line) | stream 3 / main | G2 Khand finding: with a BUILD piece up she said "top view chuniye" (the folded card question's verb). `state.playOn` now carries the piece's `family` and `mode` from the Studio slot's artifact, so `compiler/compile.js` takes the task verb from `director/play-verbs.js` (one entry per `shared/play.ts` mode; a new family's mode with no entry fails the test). | `tests/r4-conversation-play-verbs.test.mjs` |

## Patch 05 (frozen safety lexicon; needs the safety review)

| # | file | owner | why | evidence |
|---|---|---|---|---|
| 05 | `server/safety/lexicon.js` (frozen floor) | main + safety review | A FALSE safeguard, pre-existing on `522dca6e` and on base: "succeed / succeeded / succeeds" canonicalise to `sukide`, the same as the misspelling "sucide", so `suicide_spellings` fires on "i want to succeed", "she succeeded" and 24 kit answer / prompt strings ("B: she found her own way and succeeded"). A child giving that answer gets the self-harm helplines. The canonical guard cannot tell the two apart, so the patch looks at the RAW words, for this one shape only: a hit counts only when it survives with the succeed-family words (`suc+e+d+(s|ed|ing)?`) masked out of the raw text. "sucide", "main sucide kar lunga", "i will do sucide", and "i want to succeed but sometimes i think of sucide" still fire. | `node --test docs/design/round3/adversarial/r4-scan-succeed.test.mjs` (fails without the patch, passes with it). All `tests/*safety*`, `*lexicon*`, `*fuzzy*` suites and the patch-03 review test: 92/92 with the patch. Kit strings 41 hits → 17: exactly the 24 succeed strings removed, 0 added. |
