# Audit: docs and project memory (area 10, docs-memory)

2026-11-09, on `int/r6` at integration 21a (`8bb6b188`) plus the brief. Scope: `HANDOFF.md`, `CLAUDE.md`, `docs/**`, `context/**`.

**In one paragraph.** The paths and commands in the entry docs are almost all still right. What has gone stale is *status*:
the pages a new person or the owner reads first still describe 2026-10-27 (HANDOFF) or 2026-11-06 (the owner page), and
several say the opposite of what has since happened (the Founders Hub automation is live, not "waiting to be applied").
The memory in `context/` has the same disease in a different form: a newer entry replaces an older one in words, but the
link that marks the old one as replaced is missing, so a query still returns the old answer as current. Links of that kind
were written by sessions and silently dropped at merge (229 by my count).

Abbreviations: PIPELINE, OWNER, M3, OWNERSHIP, SESSIONS are the files in `docs/design/round7/`; ARCH is
`docs/ARCHITECTURE.md`; ctx-arch is `context/architecture.md`.

## Findings

Status: **fix** = I fix it now under the phase-2 rule; **inbox** = proposed in `context/inbox/r7-audit-docs-memory.json`
(I may not edit `context/*.md` or `graph.json`); **main** = waits for main (deletion, outside my area, or main's call).

| id | sev | kind | owner | title | where | fix | status |
|---|---|---|---|---|---|---|---|
| DOCS-01 | P2 | inconsistent | main | Owner page says the Founders Hub automation is "not running", "apply by 2026-11-07" and still asks for a yes/no; it has been live since 2026-11-06 | OWNER:8, :22 | Replace with "done; live since 2026-11-06; clock completes 2027-01-04; only the secret rotation before 2027-03-09 remains" | fix |
| DOCS-02 | P2 | inconsistent | main | Owner page header is from integration 9: test counts, "nothing has been tried live", "$6 of model calls" | OWNER:3-7, :14 | Update to integration 21a figures from the director16 judgement | fix |
| DOCS-03 | P2 | inconsistent | main | Owner page's lesson-quality history stops at director8 and still gives "every sentence on its own board" as the rule; director16 took the opposite rule | OWNER:143-154 | Add the director16 entry and the held-board decision | fix |
| DOCS-04 | P2 | inconsistent | main | M3.md says the M4 hardening is "not applied … you run the apply"; memory records it applied 2026-11-06 | M3:3-4, :181-198 | State it live; mark section 7 steps done | fix |
| DOCS-05 | P2 | inconsistent | main | HANDOFF says "this branch (`handoff/2026-10-27`) is the whole project" and "next release 14.4.3 = this branch"; CLAUDE.md sends every new session there first; work is on `int/r6`, round 7 | HANDOFF:1-5, :41, :86-87; CLAUDE.md:26 | A dated "state on 2026-11-09" block at the top pointing to the round-7 docs; label §1-§3 as the 2026-10-27 snapshot | fix (HANDOFF); main (CLAUDE.md line) |
| DOCS-06 | P2 | inconsistent | main | HANDOFF §6: Founders Hub "plan proposed, owner decision pending", `taxila-cin-pg` "unused, ₹602/day" | HANDOFF:169-170, :177-185 | Point to M3.md: live since 2026-11-06, PG on B2s as one of the counted services | fix |
| DOCS-07 | P2 | inconsistent | main | Three different gates are written down: HANDOFF and three stream handoffs say `npm test` before a commit; CLAUDE.md says `npm run test:all`; the deploy gate itself runs `npm test` plus a prompt-budget check | HANDOFF:19, :134; docs/handoff/4b.md:96, qa.md:46, stream3.md:93-94; CLAUDE.md:52; infra/gate.mjs:23 | In HANDOFF say which is which (commit gate = CLAUDE.md's; deploy gate = `infra/gate.mjs`); a dated note in each stream handoff | fix |
| DOCS-08 | P2 | inconsistent | main | PIPELINE gives three stream branches that do not exist (`claude/r7-brain`, `-voice`, `-studio`) | PIPELINE:19, :51, :81, :267 | Use the branches in SESSIONS.md | fix |
| DOCS-09 | P2 | inconsistent | main | PIPELINE says integration is `int/r7`; it is `int/r6` | PIPELINE:227, :265, :267, :269 | Replace | fix |
| DOCS-10 | P2 | broken | main | PIPELINE tells main to write `OWNERSHIP.json` and `scripts/ownership-check.mjs` "which fails any merge…"; neither exists | PIPELINE:266, :334-335 | Say what is true: the table in OWNERSHIP.md, checked by review | fix |
| DOCS-11 | P2 | inconsistent | main | PIPELINE still plans a week-1 side-by-side to pick the default lane and "use them on BOTH lanes"; decided 2026-11-04 (Director default, agent lane frozen), then authored scripts | PIPELINE:358-362, :44, :48, :110, :272 | Add the decision to D.1; mark the items closed | fix |
| DOCS-12 | P2 | inconsistent | main | `shared/learner.ts` has two owners: OWNERSHIP gives it to Learning, PIPELINE and the file itself give the BANDS table to Brain | OWNERSHIP:13; PIPELINE:198, :407-408; shared/learner.ts:18 | Split the row: BANDS table = Brain | fix |
| DOCS-13 | P2 | inconsistent | main | "One owner per path" is false for 25 live paths (e.g. `data/lesson-scripts/**`, `server/pair/**`, `server/signin/**`, `evals/hybrid-side-by-side/**`, `scripts/kits/**`) | OWNERSHIP:5-14 | Assign them (proposal in the evidence note) | main |
| DOCS-14 | P2 | inconsistent | main | OWNERSHIP marks six built paths "(new)", lists two that no longer exist and three never built | OWNERSHIP:9-14 | Drop "(new)"; mark "(not built)"; remove the dead two | fix |
| DOCS-15 | P2 | no longer needed | main | PIPELINE's opening section "What a child can do end to end today" is the 2026-11-04 state (tap-to-talk for all, no placement, 74 topics with games) and "Merge-first" is done | PIPELINE:5-15, :253-261 | Retitle both as dated/done; keep the text | fix |
| DOCS-16 | P2 | inconsistent | main | ARCH is still "draft v0, 2026-10-02": realtime voice as the default lane, Vercel functions as the server, one route and one method that do not exist, 9 routes of ~25, "audio is never stored" | ARCH:9, :20, :28, :30, :49, :59-62, :111, :122, :127 | Correct those statements; say at the top what it is | fix |
| DOCS-17 | P2 | broken | main | 229 edges written in already-merged inbox files never reached the graph (25 of them "supersedes" with both ends present); the merger skips them without failing | context/inbox/merged/*; scripts/merge-inbox.mjs:23 | Re-propose the 96 valid ones; make the merger fail on an unknown relation | inbox (edges); main (script) |
| DOCS-18 | P2 | inconsistent | main | Memory reads as if production moved to India, the database is Neon Singapore, and AWS model APIs are allowed; none is true | decisions.md:5-19, :2149, :2341, :2377 | Three new decisions that supersede them | inbox |
| DOCS-19 | P2 | inconsistent | main | The 3D / multi-tutor face decisions read as live; one 2D teacher shipped | decisions.md:325, :2367, :2520 vs :5236, :5552; server/routes/tutor.js:3 | Supersedes edges | inbox |
| DOCS-20 | P2 | inconsistent | main | Five foundational decisions print `[live]`/`[provisioned]` in the default listing although an edge already supersedes each (Vercel hosting, realtime as the voice lane, …) | graph.json nodes `deploy-vercel-single-function`, `voice-realtime-model`, `voice-turn-config`, `forge-models`, `forge-infra-azure` | Set status `superseded` (needs a direct graph edit: the merger cannot change a status) | main |
| DOCS-21 | P2 | inconsistent | main | Six release measurements each name a different revision as live, unlinked | measurements.md:4375, :4403, :4422, :4652, :4788, :4893 | Chain them with supersedes | inbox |
| DOCS-22 | P2 | inconsistent | main | `open.md` lists as open six items the code or a later measurement has closed, and two more that are mostly closed | open.md:4, :20, :40, :43, :83, :87, :132, :193 | Closing entries / supersedes edges | inbox |
| DOCS-23 | P2 | inconsistent | main | ctx-arch carries about 20 dated "open / not built / not applied" entries the code has since closed, with no closing record | ctx-arch:16, :20, :22, :28, :32-40, :48, :64-68, :73, :76, :78, :89, :95, :173-180, :193, :211, :220-222, :236-249, :360 | One closing measurement listing each with the code line | inbox |
| DOCS-24 | P2 | not good enough | main | ctx-arch is headed "(filled in from the spec phase)" and never was: it is a dated log, and the code's largest parts (`server/brain`, `server/studio`, `server/forge3`, `server/learner`, `server/trace`) are not described in it at all (they appear only inside individual decisions) | ctx-arch:1-3 | Main writes a one-page current map (or regenerates it); say in the header what the file is | main |
| DOCS-25 | P2 | not good enough | main | `context.mjs --check` passes while all of the above is true: it does not read `open.md`, does not compare merged-inbox edges, and its heading match sees only about 230 of 2,415 headings | scripts/context.mjs | Extend the check (edges of merged inbox files present; status vs incoming supersedes) | main |
| DOCS-26 | P3 | inconsistent | main | Kit census in memory says 565 topics / 7,385 items; the repo has 830 / 12,597 | measurements.md:253 | New census measurement that supersedes it | inbox |
| DOCS-27 | P3 | inconsistent | main | 55 decisions are still "proposed", including the duplex engine that shipped and is on for everyone | decisions.md:3779, :5047; src/duplex/config.ts:80 | Status sweep (needs a direct graph edit) | main |
| DOCS-28 | P3 | inconsistent | main | Supersession stated in prose with no edge (5 cases); `deploy-classify-grok` has two headings that disagree | decisions.md:942 vs :978, :2292, :2407, :2446, :2452, :5711 | Edges; delete the first heading | inbox (edges); main (heading) |
| DOCS-29 | P3 | inconsistent | main | Reversal conditions that fired or point at retired nodes, with no linked follow-up | decisions.md:2348, :2416, :3680 | Edges as listed | inbox |
| DOCS-30 | P3 | inconsistent | main | PIPELINE D.9 and two Games items still plan to "revive ITEM-ARENA and Khand MEASURE"; both decided otherwise | PIPELINE:131, :134, :379 | Cite the two decisions | fix |
| DOCS-31 | P3 | inconsistent | main | Owner page game counts are from integration 9 (maths 63, science 17); coverage file says 129 and 40 | OWNER:176-182; data/play/coverage.json | Update | fix |
| DOCS-32 | P3 | inconsistent | main | PIPELINE's migration number reservations disagree with `db/migrations/README.md` | PIPELINE:266, :465-466 | Point to the README | fix |
| DOCS-33 | P3 | inconsistent | main | PIPELINE D.6 says session-first start "becomes the default for everyone"; the code default is off | PIPELINE:372-373; server/director/session/flags.js:19-21 | Say it is not switched on | fix |
| DOCS-34 | P3 | inconsistent | main | Small PIPELINE/OWNERSHIP drifts: "integration every 48 h" (five on 2026-11-09); frozen safety files named differently in the two docs | PIPELINE:269, :467, :472; OWNERSHIP:7-8 | Correct | fix |
| DOCS-35 | P3 | broken | main | Entry docs name inbox files that are not there: `context/inbox/r7-face.json`, `context/inbox/r1442-s2.json` | HANDOFF:110; docs/handoff/stream2.md:43 | Correct the paths | fix |
| DOCS-36 | P3 | broken | main | Three instructions name things that are gone: `BESIDE_NAME_WAIT_MS`, a `DEPLOY_WRITE` role "routed", `src/onboarding/steps/ChildProfile.tsx` | docs/handoff/stream3.md:117; docs/ops/MODEL-STACK.md:107; docs/patches/to-app/007-coldstart-answers.md:22 | Correct | fix |
| DOCS-37 | P3 | broken | main | The audit brief lists two area paths that do not exist (`src/stage`, `public/assets/gen/teacher`) | docs/design/round7/audit/BRIEF.md:161, :186 | Main's file, in use by 13 sessions: main corrects | main |
| DOCS-38 | P3 | inconsistent | main | CLAUDE.md: Deploy names only the web step (the round-7 command is `scripts/release.mjs`); Gates omits the prompt-budget check that CI and the deploy gate require; Layout says route tables live in `routes/*.js` (13 are elsewhere) | CLAUDE.md:40, :48-49, :52-56 | Three sentence edits (text in the evidence note) | main |
| DOCS-39 | P3 | inconsistent | main | `docs/patches`: one patch pending, one half-applied, one never applied though a gate test asserts on its text, one malformed; numbers collide (three `001`s in to-brain) | docs/patches/to-brain/011-script-scene-ref.patch, 017-harness-card-page.patch; to-app/001-handsfree-default.patch; to-platform/001-placement-routes.patch | Routed to the owning streams; an index file with status | main |
| DOCS-40 | P3 | no longer needed | main | Orphan: `docs/status/STATUS-2026-10-05.html`, a one-off status page nothing cites | docs/status/ | Delete | main |
| DOCS-41 | P3 | no longer needed | main | `docs/` is 2.78 GB in git, 2.3 GB of it media from finished probes (5,300 png, 3,250 wav/pcm, 970 mp3) and about 300 MB of handoff archives that also sit in Azure Storage | docs/research/voice (980 MB), docs/design/teacher (369 MB), docs/handoff (343 MB) | Move finished-probe media to Storage, keep the write-ups; needs main and the owner | main |
| DOCS-42 | P3 | not good enough | main | Gate tests import code from `docs/` and assert on patch text, so no old doc tree can be archived without breaking the gate | tests/scene-runtime.test.mjs:7, tests/spoken.test.mjs:8, tests/r4-kaksha-play.test.mjs:69 and 20 more | Move the two imported modules and the fixtures under `tests/fixtures/` first | main (tests-evals area) |
| DOCS-43 | P3 | broken | main | ctx-arch names three files that do not exist | ctx-arch:14, :33, :203 | Note in the closing entry | inbox |
| DOCS-44 | P3 | inconsistent | main | STARTUP-PROMPT tells a new session to check out `handoff/2026-10-27` and merge the round-4/5 branches | docs/handoff/STARTUP-PROMPT.md:10-22, :44 | Head it "used once on 2026-10-27; do not reuse" | fix |

Counts: 44 findings. By severity: P0 0, P1 0, P2 25, P3 19. By kind: broken 6, inconsistent 32, not good enough 3, no longer needed 3.

Nothing here is P0 or P1: no child or parent sees any of it. P2 is the right level for the top of the list because
these are the pages that decide what the next session, or the owner, does first.

## Evidence notes

**DOCS-01.** OWNER:8 "It is **not running**: this environment has no Azure keys"; OWNER:22 "Built and ready, not applied
… Apply by 2026-11-07". Against: M3:3 "**M3 is live** since 2026-11-06 08:24 UTC"; M3:48 "`taxila-cin-pg`, on B2s since
2026-11-06"; `context/measurements.md:5987-5994` (day 1 closed with 8 services; the clock completes 2027-01-04).

**DOCS-02.** OWNER:3 "Last update: 2026-11-06 … integration 9", :5 "4771 of 4783", :6 "director1–7, about $6", :14
"Nothing has been tried live". Against: `git log -1` is integration 21a; `judgements/director16-2026-11-09.md:13-14`
(6293 of 6306 pass, 0 fail; the run cost about $1.00); `context/measurements.md:5797-5805` (M4 applied live from this
environment, so keys were present). "Nothing is released" still holds: production is 14.4.2.

**DOCS-03.** OWNER:143-154 ends with `dc-r7-script-walk-v6` "put every sentence on its own board".
`judgements/director16-2026-11-09.md:81-98` takes `dc-r7-held-board`: one board per card, held.

**DOCS-04.** M3:3-4 "built and tested, but not applied: it is on branch `claude/r7-m4`, and you run the apply".
`context/measurements.md:5797-5805`: "M4 hardening applied live at ~10:55 UTC from int/r6 725ead5e9"; that commit is an
ancestor of HEAD.

**DOCS-05.** HANDOFF:3 "This branch (`handoff/2026-10-27`) is the whole project as of 2026-10-27"; :41 "Next release in
progress: 14.4.3 = this branch's code"; :86-87 lists as open "W2-H Studio in the lesson", "the 3D teacher rig". CLAUDE.md:26
"Start here after the 2026-10-27 handoff: `HANDOFF.md`". The only pointers to round 7 are two lines inside a table at HANDOFF:110-112.
SESSIONS:3 "integration branch `int/r6`". A new session following HANDOFF §7 → STARTUP-PROMPT checks out the wrong branch.

**DOCS-06.** HANDOFF:169-170 "`taxila-cin-pg` … ₹602/day. It is **unused**"; :177-185 "only Container Apps and PostgreSQL
hold ≥ $1/day … A plan was proposed, owner decision pending". Against M3:3, M3:48 (as DOCS-01).

**DOCS-07.** HANDOFF:134 "`npx tsc -b && npx vite build && npm test`"; CLAUDE.md:52 "`npx tsc -b && npx vite build && npm
run test:all` must pass"; `infra/gate.mjs:23` (the deploy gate) runs `npm test` and `scripts/check-prompt-budget.mjs`. None is
wrong alone; a reader of one page does not learn there are two gates. docs/handoff/stream3.md:94 also says `npm test` runs `tests/index.js`; `package.json` has
`"test": "node --test tests/"`.

**DOCS-08, 09.** PIPELINE:19 "(branch claude/r7-brain)", :51, :81; SESSIONS:7-9 gives `claude/r4-conversation`,
`claude/r4-duplex`, `claude/r4-content` ("session may push only there"). `git ls-remote --heads origin` has no
`claude/r7-brain`, `-voice`, `-studio`, and no `int/r7`. PIPELINE:472 itself says "into `int/r6`".

**DOCS-10.** `ls docs/design/round7/OWNERSHIP.json scripts/ownership-check.mjs` → both missing.

**DOCS-11.** `context/decisions.md:7005-7007` (`dc-r7-hybrid-director-default`): "The Director is the default lane. The
agent lane is frozen." `context/decisions.md:7283` (`dc-r7-teaching-scripts`). OWNER:76 agrees.

**DOCS-12.** OWNERSHIP:13 lists `shared/learner.ts` under F; `shared/learner.ts:18` "Brain owns this table (PIPELINE §A,
round 7)"; PIPELINE:407-408.

**DOCS-13.** Exist, owned by nobody in OWNERSHIP.md: `server/pair/`, `server/ops/`, `server/signin/`, `server/homework/`,
`server/shutdown.js`, `server/relay-ticket.js`, `server/seam-safe.js`, `src/signals/`, `src/pages/AvatarDev.tsx`,
`shared/scene.js`, `shared/scene-props.js`, `data/lesson-scripts/`, `data/lesson-scripts-staged/`, `data/geo/`,
`data/kits-parts.json`, `scripts/lesson-scripts/`, `scripts/kits/`, `scripts/m3.mjs`, `scripts/staging.mjs`,
`scripts/live-checks.mjs`, `scripts/test-shard.mjs`, `scripts/release-core.mjs`, `scripts/migrate-core.mjs`,
`evals/teacher-brain/`, `evals/hybrid-side-by-side/` (25 paths). Proposal: Learning takes lesson-scripts, kits scripts, homework,
kits-parts; Brain takes the two evals; Platform takes pair, ops, signin, shutdown, relay-ticket, m3, staging, the
`*-core` scripts, test-shard, live-checks; Studio takes scene*, geo, seam-safe; Voice takes `src/signals`; Face takes
AvatarDev. The brief (BRIEF.md:112) already treats lesson-scripts as Learning's. Main confirms before I write it.

**DOCS-14.** Marked "(new)" and present: `data/arena/` (39 files), `server/routes/placement.js`, `scripts/release.mjs`,
`scripts/cost.mjs`, `server/cost/`, `public/sw.js`. Marked "(new)" and absent: `data/studio-truth/`,
`public/assets/gen/teacher/`, `server/notify/`. Listed plain and absent: `src/stage/`,
`public/assets/teacher-candidates/` (moved out, `context/decisions.md:6891`). `Desk.tsx` is at `src/child/lesson/Desk.tsx`.

**DOCS-15.** PIPELINE:9 "Talking is tap-to-talk for every child" vs `server/duplex/config.js:22-23` (hands-free default);
"no placement round runs" vs `server/index.js:16`; "74 of 830 topics" vs `data/play/coverage.json` (185).
PIPELINE:253-261 names `docs/handoff/simlab.md` (missing) and is overridden by PIPELINE:387-388.

**DOCS-16.** ARCH:1 "draft v0, 2026-10-02". ARCH:9/:20/:59-61 realtime WebRTC as the path and the Director "off the
critical path" vs `server/routes/lesson.js:251-252` (a start with no mode lands on the cascade lane; realtime needs
`mode: 'voice'`). ARCH:28 "Vercel functions (sin1)" vs `Dockerfile:22` `CMD ["node","server/serve.mjs"]`. ARCH:122
"`GET/POST /api/children`" vs `server/router.js:173-175` (POST/PATCH/DELETE only; the GET does not exist). ARCH:127 "`POST /api/modules/scene`"
vs `git grep "modules/scene" -- server` → nothing. ARCH:30 "taxila-fast" classifier vs `scripts/deploy-azure.mjs:406`.
ARCH:111 "Audio is never stored" vs `server/trace/tier.js:4` (tier-2 clips for the owner cohort).

**DOCS-17.** A script over all 626 files in `context/inbox/merged/` compared every edge with `graph.json`: 229 of 3,062
are absent (the skeptic's own script agrees). 59 are valid as written, 37 use `from`/`to` keys (the merger accepts those
today, `merge-inbox.mjs:22`), 3 lack an endpoint, 130 use a relation the graph does not have (`informs` 51,
`implements` 13, `refines` 10, `supports` 10). `merge-inbox.mjs:23` prints "skip edge" and carries on. Example:
`stylised-teacher-build.json` has 9 supersedes edges, none in the graph.

**DOCS-18.** `india-move-southindia-azure-pg-2026-10-04` (decisions.md:2377) and `owner-india-region-2026-10-04` (:2149)
have no status and no incoming supersedes; HANDOFF:40-42, :169-170 and `scripts/deploy-azure.mjs:11` say production is
eastus2 + Neon us-east-1 and the move never cut over. `infra-segment` (decisions.md:5-19) names Neon project
`billowing-glitter`, Singapore, Vercel sin1; `dc-owner-other-neon-project-not-used` says prod is royal-fire, us-east-1.
`owner-aws-credit-funded-india-first-2026-10-04` (body at :2341) is unsuperseded; CLAUDE.md's Azure-only constraint forbids it and
`grep -rli "bedrock\|aws-sdk\|amazonaws" server src package.json` is empty. I propose no edge for this one: the memory's
Azure-only node is dated two days *before* the AWS decision, so which owner statement ended the AWS plan is main's to record.

**DOCS-19.** `avatar-tutor-selection` (decisions.md:325: the child picks from 2-4 tutors) vs `dc-r4-single-teacher-asha`
(:5552) and `server/routes/tutor.js:3` "ONE teacher". `owner-2d-bar-4-5-2026-10-04` (:2520) vs
`owner-2d-ship-at-4-2026-10-05` (:5236) "Supersedes the >= 4.5 ship gate; 3D stays dropped" — said in words, no edge.

**DOCS-20.** `node scripts/context.mjs` prints `deploy-vercel-single-function … [live]` while the graph has
`hosting-azure-container-apps supersedes deploy-vercel-single-function`. Same pattern for the other four.
`merge-inbox.mjs:17` skips any node whose id exists, so an inbox entry cannot change a status.

**DOCS-21.** `ms-r143-live`, `ms-r1431-live`, `ms-r1432-live`, `ms-r144-live`, `ms-r1441-live`, `ms-r1442-live` each
state a `taxila-web--…` revision as live. Only `ms-r1442-live` is current (HANDOFF:40). No supersedes edges among them.

**DOCS-22.** (a) open.md:4 `ledger-game-full-weight` → `server/learner/kt/bktr.js:57` has `SOURCE_WEIGHT`. (b) open.md:83
`w1c-late-double-count-reports` → `server/reports/check.js:52, :96-97`. (c) open.md:20 "no client consumes [pace]" →
`src/lesson/runtime.ts:860`. (d) open.md:40 `open-lt-client-wiring-2` → `src/child/lesson/Refused.tsx`,
`src/ui-v3/kaksha/screens/KakshaHome.tsx:49`. (e) open.md:43 `open-lt-evals-plan-gate` → mostly closed: three of four scripts fixed; only
`evals/cascade-latency.mjs:257` remains. (f) open.md:87 `w2e-open-2026-10-04` → mostly closed: bullets 1 and 2 done
(`server/studio/seam.js:910`, `server/compiler/compile.js:188`); bullet 3 open. (e) and (f) stay open; the entry should be narrowed. (g) open.md:132
`open-r143-kit-kind-pose-mismatch` → `rj-r145-kit-deep-marks` removed the marks it depends on; `grep -rl '"deep": *false'
data/kits` → 0. (h) open.md:193 `open-r7-m4-billing-assumptions` → all five questions answered in
`ms-r7-m4-day1-2026-11-06` (measurements.md:5987-6001).

**DOCS-23.** Every ctx-arch entry is dated, so none was false when written; the defect is that nothing records the close,
and the file is read as the current state. Each line is the ctx-arch claim → the code that closes it.
- :248 school chapter "no migration creates that column" → `db/migrations/025_child_school_chapter.sql`.
- :78 migrate "reads DATABASE_URL (production) by default" → `scripts/migrate.mjs:4` (test branch is the default).
- :64, :68 W1-B call sites "not applied" → `server/brain/turn.js:331, :402`.
- :20, :22, :65 engine re-check "not built" → `server/director/modules.js:25, :454-475`.
- :180 `kits-parts.json` "never shipped" → the file exists; `server/director/classify.js:11`.
- :173-174 Stagecraft "runs only in the simulator" → `server/stagecraft/lesson.js:28-31` (default on).
- :211, :220-221 games "unapplied / not implemented" → `server/index.js:38`, `server/play/levels.js:35`.
- :95 `TAXILA_STT_MODEL` "unset" → `scripts/deploy-azure.mjs:412`.
- :16 distress check "fails OPEN" → `server/director/classify.js:425` "fail CLOSED".
- :73 "Nothing calls planToday()" → `server/routes/child.js:213-217`.
- :32-40, :105-106 lesson purpose / resume → `src/child/lesson/LessonScreen.tsx:62`, `src/child/plan.ts:82`.
- :36, :236 Notebook "this device only" → `GET /api/studio/notebook`.
- :222 parent memory "no client calls" → `src/parent/api.ts:150, :152`.
- :238 "no go-deeper type" → `server/director/requests.js:101`.
- :193 stop phrase unread → `server/director/requests.js:431`.
- :48, :249 `fadedVersion`, `format_posterior` unread → `server/director/fading.js:146-152`, `server/learner/formats.js:105`.
- :360 agent picture/game tools missing → `server/agent/tools.js:5, :37-38`.
- :76 route crash not beaconed → `src/main.tsx:31-32`.
- :28 `FORGE_G2_CHILD_SALT` owed → `scripts/deploy-azure.mjs:430`.
- :89 "no custom domain" → `taxila-dev-live-2026-10-04` (decisions.md:2530) says taxila.dev serves the app; `scripts/trace.mjs:206` defaults to it.
Seven further entries (ctx-arch:96, :112, :130, :267, :289, :297, :302) say the code safety scan misses named lines; it
now catches all 13 (pure local call, no model). They are reported here as stale memory only; the safety code is frozen
and I propose nothing about it.

**DOCS-24.** ctx-arch:1-3 is the placeholder. `grep -c "server/brain" context/architecture.md` → 0; same for
`server/studio`, `server/forge3`, `server/learner`, `server/trace`. They are mentioned inside individual decisions
(`server/brain` 22 times in decisions.md), but no page says what the system is made of today.

**DOCS-25.** `node scripts/context.mjs --check` → "context graph ok" on this tree. `context.mjs:22` lists the files it reads
(no open.md); `context.mjs:83` matches only headings written as a backticked id.

**DOCS-26.** measurements.md:253 `kit-census-2026-10-02`; a count over `data/kits/` gives 830 topics, 12,597 items, 38 files.

**DOCS-27.** `duplex-verdict-delay-2s` [proposed] (decisions.md:3779) is in code at `src/duplex/config.ts:80`;
`duplex-stage-a-ships-2026-10-04` [proposed] (:5047) while hands-free is on for everyone (`server/duplex/config.js:22-23`).
55 nodes carry `proposed`; I checked 3 against code.

**DOCS-28.** decisions.md:942 "(proposed) … needs adoption" and :978 "Set in scripts/deploy-azure.mjs" are both headed
`deploy-classify-grok`; `scripts/deploy-azure.mjs:406` shows the second is true. Prose-only supersessions:
`image-default-flare-low-2026-10-04` (:2292), `owner-stt-cost-plan-2026-10-04` (:2446),
`owner-no-speech-gating-2026-10-04` (:2452), `stt-mai2-stream-primary-india-2026-10-04` (:2407),
`dc-r4dx-continuer-classifier-option-a` (:5711, its own text says SUPERSEDED).

**DOCS-29.** `w2h-studio-evidence-one-event-per-item` (decisions.md:3680) "Reverse if `ledger-game-full-weight`
resolves": it had (DOCS-22a); the follow-ups exist (:4801, :4816) but their edges are among the dropped ones (DOCS-17).
`scout-synthesis-no-challenger-2026-10-04` (:2348) and `model-router-v3-2026-10-04` (:2416) reverse on a rule in the
superseded `weekly-model-scout`.

**DOCS-30.** `context/decisions.md:6624-6626` (`dc-r7-games-measure-to-taraazu`), :6561-6562 (`dc-r7-games-arena-net`).

**DOCS-31.** `data/play/coverage.json`: `topicsCovered` 171; maths 129, science 40.

**DOCS-32.** `db/migrations/README.md:14, :56-58`; files 044-047 exist.

**DOCS-33.** `server/director/session/flags.js:19-21` `env("TAXILA_SESSION_FIRST") ?? "off"`.

**DOCS-34.** `git log` shows integrations 17, 18, 19, 20, 21a all dated 2026-11-09. PIPELINE:467 freezes four files;
OWNERSHIP:7 names "server/safety/**, the floor and safetyStrings".

**DOCS-35.** `ls context/inbox` → `merged` only. `r7-face.json` is not in `merged/` either (the graph records
`"source": "inbox/r7-face.json"`, so it was merged and the file lost). `r1442-s2.json` is in `merged/`.

**DOCS-36.** `git grep BESIDE_NAME -- server src shared scripts` → 0 (now `besideNameCapMs()`,
`server/director/classify.js:400-402`). `DEPLOY_WRITE` is not in `server/azure.js:15-31`. `ls src/onboarding/steps` →
`Class.tsx`, `Meet.tsx`; the file is `src/onboarding/ChildProfile.tsx`.

**DOCS-37.** `ls src/stage public/assets/gen/teacher` → both missing.

**DOCS-38.** Proposed text. Deploy: "`node scripts/release.mjs <rev>` (migrations, web, worker); `deploy-azure.mjs` is
the web-only step and refuses without a gate stamp." Gates: add "`&& node scripts/check-prompt-budget.mjs`"
(`infra/gate.mjs:23`, which also runs single-process `npm test`); "4 at a time" → "one per core" (`scripts/test-shard.mjs:31`). Layout: "route tables in
`routes/*.js` and in feature folders; `server/index.js` is the registry" (`server/index.js:14-46`). Line 26: "Start
here: `docs/design/round7/OWNER.md` and `PIPELINE.md`; `HANDOFF.md` is the 2026-10-27 snapshot."

**DOCS-39.** `git grep sceneRef -- server src shared tests` → 0 (to-brain/011 pending). `grep -n "cardPage\|ofCard"
evals/hybrid-side-by-side.mjs` → 0 (017's second hunk absent). `src/child/prefs.ts:46` still `talk: "tap"` while
`tests/r7-voice-handsfree.test.mjs:73-78` asserts on to-app/001's text. `git apply --check
docs/patches/to-platform/001-placement-routes.patch` → "No valid patches in input" (its change is in
`server/index.js:16`). Of 45 patches: 23 applied cleanly, 19 landed with drift, 1 part, 1 pending, 1 not applicable.

**DOCS-40.** `git grep -l "STATUS-2026-10-05"` → nothing. Checked: code, tests, scripts, evals, `package.json`,
Dockerfiles, the entry docs and the six context files. (`docs/harvest/json` looked like an orphan too, but two docs
cite it; dropped.)

**DOCS-41.** 17,289 files, 2.78 GB (`du`), no LFS. `docs/handoff/STORAGE.md` says fuller copies of the transcripts and
scratchpad are in container `handoff-2026-10-27`. Not safe to remove blindly: see DOCS-42 and the table below.

**DOCS-42.** `tests/scene-runtime.test.mjs:7` imports `docs/research/content/genui-scene-dsl.mjs`;
`tests/spoken.test.mjs:8` imports `docs/research/voice/notation-probe-2026-10-02/items.mjs`;
`tests/r4-kaksha-play.test.mjs:69`, `tests/round3-voicesig.test.mjs:311`, `tests/p3-voicesig-server.test.mjs:306` read
`.diff` files under old round trees.

**DOCS-43.** `src/child/tokens.css`, `scripts/teacher-stills.mjs`, `docs/design/round3/relational-human/listening/blind.html`
(only `blind.html.gz` exists).

**DOCS-44.** STARTUP-PROMPT:10-12 "branch handoff/2026-10-27 … Check out handoff/2026-10-27"; :44 reconnect Vercel.

## Doc trees: what depends on what (for DOCS-40 to 42)

"Hard" means a gate test reads files in the tree. "Memory" means only `context/` cites it as evidence.

| Tree | Files | Size | Verdict | What it was |
|---|---|---|---|---|
| docs/research/voice | 5,521 | 980 MB | hard (2 files); the audio is probe output | voice probes, Oct 2026 |
| docs/design/teacher | 1,163 | 369 MB | live (`scripts/character/**` reads it) | teacher face bake-offs |
| docs/design/round4 | 2,465 | 245 MB | hard | round-4 build packages |
| docs/design/reset | 707 | 204 MB | hard | owner-reset plan and prework |
| docs/design/round3 | 1,135 | 164 MB | hard | round-3 packages |
| docs/handoff/*-data, transcripts | 2,085 | 309 MB | archive; cited only by their own handoff notes | 2026-10-27 stream archives |
| docs/design/build | 770 | 125 MB | memory | screenshots written by old design e2e runs |
| docs/design/round7 | 983 | 101 MB | hard, current | — |
| docs/design/gap-audit | 543 | 84 MB | live (one eval reads it) | 2026-10-04 audit; superseded as a plan |
| docs/design/superhuman | 384 | 66 MB | live (3 scripts) | 2026-10-04 specs and voice probes |
| docs/design/round2 | 200 | 24 MB | memory | superseded by round 3 |
| docs/design/audit | 175 | 14 MB | memory | 2026-10-03 UX audit |
| docs/design/ship5 | 99 | 5 MB | hard only (tests read its patches) | applied packages |
| docs/design/round5, values, assets, voice-signals, stagecraft, signals, directions, v2 | 212 | 7 MB | live or memory | — |
| docs/research (rest), docs/harvest, docs/ops, docs/patches | ~840 | ~50 MB | live | — |
| docs/status | 1 | <0.1 MB | orphan | one-off status page, 2026-10-05 |

## Coverage

- **Read fully:** `HANDOFF.md`, `CLAUDE.md`, the five `docs/design/round7/*.md`, the director16 judgement,
  `docs/ARCHITECTURE.md`, `context/architecture.md` (428 lines), `context/open.md`, `docs/handoff/STARTUP-PROMPT.md`.
- **Checked by script, exhaustively:** every backticked path, command, route and flag in 92 instruction-type docs; all
  3,781 graph nodes and 3,029 edges (status against supersedes, duplicates, dates); all 2,415 headings in the five memory
  files; all 626 merged inbox files against the graph; every file under `docs/` for size and type; every `docs/…`
  reference in code, tests, entry docs and context; all 45 patches with `git apply --check` both ways.
- **Sampled:** about 45 of ctx-arch's ~200 "open" entries (those with a code anchor); about 20 of 45 `open.md` bullets;
  20 of ~430 round 5-7 reversal conditions; 3 of 55 "proposed" decisions; director14/15 judgements (release lines only).
- **Not read:** `decisions.md`, `measurements.md` and `rejected.md` end to end (4.6 MB; queried by id and grep); the
  718 rejections for whether each still holds; the bodies of old-round design docs and research (historical records:
  they naturally mention things since gone); director2-13; binary media; `.env*`.
- **Could not check:** anything needing live Azure or the database (current revision, applied migrations, billing).
  Git history is shallow from 2026-11-05, so "last touched" is not evidence for older trees.

## Skeptic pass

One sub-agent was given the 44 findings and their evidence, without my reasoning, and told to refute each, defaulting
to "refuted" when it could not reproduce the evidence. It re-ran the counts with its own scripts.

- **Refuted outright:** none.
- **Confirmed as written:** 33.
- **Partly, and corrected above:** 11.
  - DOCS-05, 21, 38: wrong line numbers.
  - DOCS-07: the deploy gate (`infra/gate.mjs`) itself runs `npm test`, so HANDOFF was not simply wrong; reworded as
    "three gates written down, nowhere explained".
  - DOCS-13: 25 paths, not "about 30". DOCS-17: 229 edges, not 231. DOCS-25: about 230 headings matched, not 507.
  - DOCS-22: six items closed, not eight; two are mostly closed and stay open.
  - DOCS-23: dropped three weak rows (Kaksha "built" records, the 429 overflow twin called a fallback chain).
  - DOCS-24: the big folders are named inside decisions; the claim now covers only the architecture page.
  - DOCS-27: dropped the claimed 2000 ms / 2500 ms contradiction (the two decisions agree).
  - DOCS-28: 5 prose supersessions, not 7. DOCS-29: cut to the three with evidence.
  - DOCS-35: dropped `evals/simlab/results/` (it describes another branch) and two handoff lines that already say "merged".
  - DOCS-40: dropped `docs/harvest/json` (two docs cite it).
- **Not re-checked by the skeptic:** the claim that the code safety scan now catches the 13 lines (DOCS-23, last paragraph);
  the split of the 22 drifted patches in DOCS-39.
