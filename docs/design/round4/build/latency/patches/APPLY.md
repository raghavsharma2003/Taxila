# Stream 3 (latency) patch requests

Apply in order. Each is also on `claude/r4-latency` as a separate commit titled `[patch-request] ...`.

| # | file(s) | owner | why | proof |
|---|---|---|---|---|
| 01 | `src/child/lesson/AnswerDock.tsx` | stream 2 | BUILD-PLAN §1 "removed" list and §3.3 L1: the dock's "Thinking… N s" seconds counter goes; her face carries the wait (`rj-symbolic-wait-indicator`: symbolic wait indicators pulled gaze off the face and did not shorten the perceived wait). The copy key `floor.thinking_s` and `StateWord`'s seconds branch stay (no caller passes seconds now), so the diff is one file. | `npx tsc -b`; `npx vite build`; `npm test` (no test asserts the counter); the `thinking-4s` fixture in `tests/e2e-design-b1.mjs` now shows "Thinking…" / the plain thinking word. |
