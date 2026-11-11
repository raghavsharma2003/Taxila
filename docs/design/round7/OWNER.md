# Round 7: for the owner

Updated by the main loop at each integration. Header, row 1, row 7, section 3b (last entry) and section 6 corrected 2026-11-09 at integration 21a (`int/r6` 8bb6b188) by the docs audit, from M3.md, the director16 judgement and `data/play/coverage.json`. Everything else is as last written at integration 9 (2026-11-06).
- **Build checks:** tsc and the build are green.
- **Unit tests:** 6293 of 6306 pass, 0 failures, single-process included (director16 judgement, on integration 20).
- **Live model calls so far:** the lesson-brain runs director1–16, about $1 a run since director14 (director16: 1,472 calls, about $1.00).
- **Production is release 19** (commit `59ae352`, integration 34) since 2026-11-11 06:15 UTC, web and worker together. Over release 18 (`d71c2ca`, 2026-11-10 21:21 UTC) it adds the self-hosted maths face on the board, answer marks on 438 boards, progress dots in every game in place of a numbered counter, game play folded into the home page with a why-line, "In games this week" on the parent Teaching page, three distinct forms of every joining line in all 34 scripts, and a recorded reason whenever what is known about the child changes a game level. No database change. Not in it yet: her model-written reply to an aside (measured 76 of 80 clean on 2026-11-11, joins the next release) and the design revamp (waits on the owner's pick). Release 18, over release 17 (`9004a0b`, 19:52 UTC the same day: the director19 speech fixes, the picture fix, Learning's re-authored joining lines, the phone change and round 8's reader of the child's history) it adds the new board drawing (stacked fractions, marks by role, answer marks), her one-sentence reaction to the child's reply about their own story (on live model output it fell back to a neutral line in 2 of 3 cases: n = 3, with Brain), the practice phase explained by the child's history, and the game engine fixes. Release 16 (`e807f07`, 14:24 UTC) was the first round 7 release, on the owner's word that production can be replaced because nobody is using it; the database was migrated then through the Neon connector (backup branch `pre-release-e807f07`, 16 migrations, one transaction). No staging app. Roll back with `node scripts/release.mjs d71c2ca --rollback`.
- **Founders Hub (row 7): done, nothing to apply.** The automation (`scripts/m3.mjs`) has been live since 2026-11-06 08:24 UTC and the M4 hardening since about 10:55 UTC the same day. Day 1 of the 60 is 2026-11-06, counted with 8 services; the clock completes on 2027-01-04. `taxila-cin-pg` was downsized to B2s and is one of the counted services. Details: `M3.md`.

## 1. Decisions only you can make

| # | What | Options / note |
|---|---|---|
| 1 | ~~Keys for the release.~~ **Closed 2026-11-10:** release 16 went out with the migrations applied through the Neon connector, so no Neon key is needed. | Nothing to do. Two Neon branches were made and are left in place: `pre-release-e807f07` (backup) and `rehearse-release-e807f07` (rehearsal); say if you want them removed. |
| 2 | **Spend batch** (section 2) | Approve all, some tiers, or none. Nothing runs until you say yes. |
| 3 | **Teacher face**: r8 / lamp2 / lamp2 + new jaw | Everything you need is on one page: `face/OWNER-FACE-REVIEW.md` (on claude/r7-face, PR #49). It covers the look, the greeting clips, the pose stills and the low-end-phone pass, with evidence for each. Lip timing within ±50 ms: r8 89%, lamp2 67% (its mouth barely moves), lamp2 + jaw 100%. |
| 4 | Account for the owner test cohorts | They are keyed to an email that matches no guardian, e.g. the guardian of the test child "Kiko". |
| 5 | Staging app (~$40/mo, scripted: `scripts/staging.mjs`, on the TEST DB by construction); India D5 relay (one 0.5-vCPU replica always on in South India: `scripts/region/d5-relay.mjs`); Front Door (~$35/mo); India cutover vs stopping taxila-cin-pg | All scripted and dry-run by default; each waits for your yes and the keys. |
| 6 | Volt-emblem avatars; on-device speaker matching | **Avatars, built and reversible:** App's onboarding sweep (2026-11-05) found the first pick a 13-year-old makes is a painted cartoon animal. Classes 4-9 now pick from 12 line emblems instead (orbit, comet, bolt, …); classes 1-3 keep the animals, and existing picks still render. One switch reverts it (`OLDER_AVATAR_SET`); say if you want the animals back. Speaker matching: still parked. |
| 6b | **India map outline** | Any map that draws India's outline must show the official Survey of India boundary. Code can't draw a correct one from memory, so maps today are places pinned at true lat/long on a grid with a compass, and no outline. Provide or approve an official SoI source to enable outlines (`dc-r7-maps-no-outline`). |
| 6c | Parent term report, section S18 (the term report itself is built) | S18 would show the child's own words ("what I liked this term") and let the parent write back. The child's quote needs a show-consent step from the child; a parent free-text reply breaks the rule that every parent-facing line is structured and checked. Recommendation: leave S18 out until the test phase. |
| 7 | **Founders Hub $25k / $50k (Milestones 3 and 4): running, no decision needed.** Microsoft: "If you don't qualify for Milestone 3 (5+ Azure workloads over a sustained period of 60 days) within 180 days of Business Verification, the sponsorship is cancelled and the subscription is converted to pay-as-you-go." | Live since 2026-11-06 (`M3.md`): two keepers (a Container Apps job and a small VM) hold 9 services above $1 a day, 7 are needed, and a verifier checks twice a day and alerts by email. The 60 days complete on 2027-01-04. Your only remaining step: rotate the deploy principal's secret before 2027-03-09. Still worth checking in the portal: is the spending limit back on? |

## 2. Spend batch (Azure Foundry, Direct): Azure only authors

Claude does all checking in-session, so the checks cost nothing on Azure: the blind-solve of every key, the form
equivalence check, adjudication and level rating. Figures come from the scripts' own dry runs
(`node scripts/kits/run.mjs all`). Dry run is the default. Spending needs `--run --cap N`, and runs are resumable.
(Corrected 2026-11-04: the first estimate of ~$127 had counted Azure checkers.)

| Tier | Work | Azure calls | ~Cost | Unblocks |
|---|---|---|---|---|
| 1 | G1 sentence-train grammar items (85 tagged skills, 444 items short) | 128 | $4.10 | English and Hindi grammar games (Games) |
| 1 | W1a Hinglish/Devanagari answer forms | 30 | $0.60 | Hinglish answers graded correctly |
| 2 | W1b Hindi worked-example steps, class 4-7 maths | 141 | $2.62 | Worked examples in Hindi |
| 2 | W1c explain plans per skill, class 4-7 maths (424 skills) | 424 | $15.26 | Richer explanations (Brain) |
| 3 | W3 language kits on real texts, class 4-7 English/Hindi (101 topics) | 101 | $4.85 | English/Hindi lessons on real passages |
| 3 | W4 placement banks, class 9 maths/science | 8 | $0.36 | Placement for class 9 |
| — | W2 relevel, all classes | 0 | $0 | Level match (OWNER-RESET #2): rated by Claude in-session, no approval needed |
| — | Face: the 27 daily-greeting clips (DragonHD) | 27 | cents | Her spoken home greeting |
| — | Face: painted pose stills (wave, reading, …) via Azure images | tbd | small | Replaces stand-in stills |
| — | Studio gate services: Azure AI Vision OCR + Content Safety (image moderation) | recurring | ~₹4,500/month at cap | Lets generated pictures be checked, so they can ever be shown |
| — | Studio image rung (needs the gate services) | per picture | $0.0066; ~$2.6 for a 200-lesson test; ~$13/day at 1,000 lessons/day | Pictures as lesson pieces |
| — | Studio dedicated spec deployment (owner action: create `taxila-stagecraft`) | 0 extra tokens | — | Spec builds stop sharing quota with the reply model |
| later | Studio Sora clips, a priced 5-clip test first | tbd | tbd | Only if code-built animation can't do it |
| **All** | | **~815** | **~$26 (≈ ₹2,200)** | |

Recommendation: approve it all. At ~$26 it is less than one test-battery day was in October. If you'd rather approve
in parts, start with tiers 1 and 2 (~$21).

## 3. What you can look at now (all in `docs/design/round7/`)

- **App** (stage-first lesson, one nav, steer chips, the stop check-in, hands-free dock, class 4 in the older look): `app/shots-m1/*.png`.
  Made from fixture pages and a mocked API, not a live lesson.
- **Games**
  - Week 1 maths (angles, integer hops, bar graphs and pictographs): `games/w1/*.mp4` and `*-strip.png`.
  - Week 2 science (mirror beam, periscope, circuit, pendulum): `games/w2/`.
- **Studio**:
  - motion boards: `studio/split-*.mp4`, `jump-*.mp4`;
  - history timelines: `timeline-*`;
  - tables: `table-*`;
  - labelled plant and circuit diagrams: `label-plant-*`, `label-circuit-*`;
  - beat cards: `beat-card-*`.
- **Games, more**:
  - 3D mirror, circuit and pendulum: `games/w2/yantra3d-*.png`;
  - the history river timeline (kaal), the sentence train (vakya), the kirana balance (taraazu) and the factor/multiple tower defence (kila).
- **Parent corner** (Learning): `learning/shots/parent-notes-monthly.png`, `parent-controls-household.png`, `parent-teaching.png`.
- **Face**
  - `face/r7-face-fallback-sheet.png`: the same Asha on every fallback path.
  - `face/stills-sheet.png`.
  - `face/lite-mouth-strip.png`: weak phones.
  - `face/route-b-vs-r8-sheet.png`.

## 3b. Lesson brain: which engine (decided 2026-11-04)

- The Director lane is the default. The freer agent lane is frozen; its strengths are being ported into the Director.
  Full run: 23 lessons.
  - Reply ready p50: 2.2 s for the Director vs 3.9 s for the agent.
  - The agent dropped class-6 children to counting drills.
  - Neither met the bar, and the worst defect was praising a wrong answer.
  - Write-up: `judgements/hybrid-full-2026-11-04.md`.
- Brain then fixed the 11 defects. The re-run showed the fixes were shallow, because the guards detected bad lines but didn't stop them. The next block is structural:
  - guards enforce;
  - worked examples are rendered from the kit;
  - one question is live at a time;
  - picture and game requests are real.
  
  Write-up: `judgements/director2-2026-11-04.md`.
- A stronger reply model (taxila-gpt6) was tried: no teaching gain, +0.7 s, about 6× the cost. Kept the fast model (`dc-r7-reply-model-fast`).
- 2026-11-05: **authored lesson scripts** (`dc-r7-teaching-scripts`). Claude writes the teaching per skill, a second
  Claude checks every answer blind, and the Director walks the script.
  - Pilot run (director4, 12 lessons, $0.20):
    - The maths is right now, and the lesson has a spine.
    - But she still walks the beats like a clock: a beat counts whether or not she taught it, the explanation beats ask no keyed question, and English script text is read aloud.
  - Next: format v2 plus beat-completion rules (`dc-r7-script-walk-v2`). No scale-out to 30 topics until director5 passes a measured gate. Write-up: `judgements/director4-2026-11-05.md`.
- 2026-11-05 evening: director5 (v2 scripts, a simulated child that answers right and wrong, 16 lessons, $0.65).
  - Clearly better than before:
    - Hinglish holds;
    - she comes back to the lesson after the child's detours;
    - every board shows;
    - she gives most answers a verdict.
  - Still failed the bar on every line, by hand count:
    - 39% of beats really taught;
    - 75% of answers judged;
    - at least 14 right answers called wrong, because she graded the reply to her "kaise jaana?" against the next question;
    - 25 places where her words don't match the screen.
  - Two code checks were also deleting correct teaching, and the written corrections were never spoken.
  - Decision (`dc-r7-script-walk-v3`): code now speaks the written corrections and worked examples nearly word for word. Explanations stay in her own words but fall back to the written line. Checks may never delete teaching. She grades only the question she just asked. Then director6. Write-up: `judgements/director5-2026-11-05.md`.
- 2026-11-05 night: director6 (16 lessons, $0.81). A big step, and just short of the bar.

  | Measure | director5 | director6 |
  |---|---|---|
  | Beats really taught | 39% | 79% |
  | Answers judged | 75% | 89% |
  | Right answers called wrong | ≥ 14 | 2 |
  | Places her words don't match the screen | 25 | 12 |

  - Her explanations now land almost every time.
  - What's left is mechanical:
    - checks still cut a correction down to the bare question;
    - a follow-up question longer than the card limit is cut;
    - the worked example comes out as one block;
    - she says her point twice;
    - one skill is skipped;
    - side-topics are never returned to.
  - Decision (`dc-r7-script-walk-v4`): fix those. Learning may now start writing the next 30 topics in the final format, held back from children until director7 passes.
  - Write-up: `judgements/director6-2026-11-05.md`.
  - Separately, a quiet-hour re-test showed Azure's model answers in about 1.4 s at any hour. Her ~3 s reply time is our own pipeline, so it's ours to cut.
- 2026-11-06: director7 (16 lessons, $0.79). **The teaching itself now works.**

  | Measure | director7 | Bar |
  |---|---|---|
  | Beats really taught | 97% | ≥ 80% |
  | Answers judged | 99% | ≥ 90% |
  | Answers marked wrongly, either way | 0 | 0 |

  - The worked example is real.
  - She walks all three skills in order.
  - Reply time is down to 2.65 s.
  - What still fails is what's on screen while she speaks: 51 places, because one board shows while she describes the next. Plus a "?" over numbers she says, and not acting on "samajh nahi aaya", "phir se bolo", "pehle main try karun" or a promised return to cricket.
  - Decision (`dc-r7-script-walk-v5`): switch the board mid-turn at the exact words, and treat those child requests as moves.
  - Write-up: `judgements/director7-2026-11-06.md`.
- 2026-11-06: director8 (16 lessons, $0.80). The teaching still works: 96% of beats taught, 99% of answers judged, 0 false "wrong"s. Bridges between skills are now spoken every time.
  - Screen/speech fails worse overall: 73 mismatches.
    - About 45 are a new Studio bug: its "?" rule now hides numbers she says.
    - About 22 are sentences shown on the wrong board (director7 had 51 of this kind).
  - One wrong answer key was spoken, and one right answer was called wrong.
  - She still doesn't act on "samajh nahi aaya", and never really comes back to cricket.
  - Faster:
    - Reply-ready time: 2.29 s.
    - In the real app path, the first spoken words are ready in 1.90 s (p50).
  - Decision (`dc-r7-script-walk-v6`): fix Studio's "?" rule; put every sentence on its own board; make requests and promised returns real.
  - The 30 new topics stay held.
  - Write-up: `judgements/director8-2026-11-06.md`.
- 2026-11-07 to 2026-11-09: director9 to director15, one write-up each in `judgements/`. Not summarised here.
- 2026-11-09: director16 (16 lessons, about $1.00).
  - 96% of beats taught (256 of 267) and every answer judged (263 of 263).
  - One wrong answer was called right; no wrong answer key was spoken.
  - Screen/speech mismatches are down to 8 (director8 had 73), but the limit was 5.
  - Her register passes in all four topics for the first time.
  - Reply-ready time: about 2.87 s.
  - Decision (`dc-r7-held-board`): "every sentence on its own board" is dropped. The board now follows the card she is on and is held; it changes at most once per turn, and a picture she is asked for is drawn beside it. Brain and Studio are building this for director17.
  - The 30 new topics stay held.
  - Write-up: `judgements/director16-2026-11-09.md`.
- 2026-11-10: director17 (16 lessons, about $1.02), the first run on the held board.
  - Every beat taught (283 of 283) and every answer judged (247 of 247). No misgrade, no wrong answer key.
  - The held board cost no teaching: no line was said over a board that does not show it.
  - It still fails the gate: 8 screen/speech mismatches, plus 8 turns where the next card's board went up before she had said anything about it (break menus, goodbye menus, the return to a side question).
  - Listening is 3 of 5 in all four topics. "Hindi mein bolo" is handled correctly about half the time.
  - Decision (`dc-r7-script-walk-v6-9`): the held board stays. Turns that teach nothing must hold the board too. How she answers each kind of request (Hindi, repeat, picture, "pata nahi", a side question) becomes one written table with a test per row, instead of one fix at a time.
  - The automatic mismatch counter is retired as a gate input: it caught 3 of 16. Judging by hand is the only screen.
  - The 30 new topics stay held.
  - Write-up: `judgements/director17-2026-11-10.md`.
- 2026-11-10: director18 (16 lessons, about $1.04).
  - 99% of beats taught (284 of 287) and every answer judged (248 of 248). No misgrade, no wrong answer key.
  - No board went up before she had spoken about it (director17 had 8), and no teaching was said over the wrong picture.
  - It still fails the gate on 9 screen/speech mismatches. All 9 are one bug: asked for a picture, she describes a second view that was not drawn. On the other 7 picture requests the view is drawn and true.
  - Listening is 3.5 of 5 in two topics (class 4 fractions, class 6 perimeter) and 3 in the two class 5 topics. Her register is 3 in two topics: the same side-question and "ab Hindi mein" sentences are said in every lesson.
  - Class 6 perimeter passes everything except its two picture rows.
  - Decision (`dc-r7-script-walk-v6-10`): one function draws the picture and writes its line, so she cannot describe what was not drawn. The request table's wrong and missing rows are fixed (asking for Hindi no longer uses up a card's help). The canned "yeh jaankar achha laga" is removed. Her joining sentences (parking a side question, coming back to it, switching to Hindi) are written per topic by Learning, three forms each.
  - The 30 new topics stay held from children. Learning regenerates them now under the current rules, still staged.
  - From here the pilot loop is one stream of three (Brain, Studio, Learning). The main effort moves to the learner model changing what is taught, and to generated content reaching a child.
  - Write-up: `judgements/director18-2026-11-10.md`.
- 2026-11-10: director19 (16 lessons, about $1.07).
  - Every beat taught but one (289 of 290) and every answer judged (262 of 262). No misgrade, no wrong answer key, no board up before she spoke about it.
  - Screen/speech mismatches: 9 → 1. The picture fault is fixed: 15 of 16 picture requests drew their second view, and for the one board that has none she said so.
  - It still fails the gate, on how she sounds. Register is 3 of 5 in all four topics and listening is 3 in three of them.
    - The new joining sentences are spoken wrongly by code: one of three forms is ever used, one parking sentence is said twice in a row, and coming back to the child's story she either drops or parrots the child's words.
    - She asks about the child's story and poses the next question in the same breath, so the child never gets to answer.
    - "Phir se dekho" ("look again") is said on questions she is asking for the first time.
  - A free 27-second dry run of the same 16 lessons shows the doubled sentence and the false "look again". Nobody was checking it; it is now a gate before any paid run.
  - Decision (`dc-r7-script-walk-v6-11`): that dry run becomes a gate; how she answers each kind of request is compiled from the script ahead of time instead of chosen while the lesson runs; coming back to the child's story gets its own turn, with one model-written sentence (behind a check) reacting to what the child said.
  - The small fixes go to production first as release 17. The 30 regenerated topics stay held from children.
  - Write-up: `judgements/director19-2026-11-10.md`.
- 2026-11-11: director20 (16 lessons, about $1.06), the latest run.
  - One topic (class 6 perimeter) passes every line of the gate, the first to do so. The other three pass every counted line and fail on the judges' axes.
  - No screen/speech mismatch in any of the 16 lessons (9, then 1, now 0). Every beat but a handful taught, every answer judged (256 of 256), no misgrade, no wrong answer key.
  - Nine of director19's ten faults are gone or nearly gone. One is not: a child who gives up after the help is used still gets the point again and no answer, on the same rows as last time. The free dry run said this was fixed, and it was not: its check knew only two ways a child says "I give up", so it never saw the fault. (I first blamed the model's reply being replaced; Brain showed the lesson logic itself drops the answer. The check is now wider and fails on these rows.)
  - New faults: 3 of 10 parked asides are never returned to; her model-written reply after an aside was odd or wrong 3 times in 7 and fell to "Achha." or "Theek hai." twice; "pata nahi" at a check-in is taken as a yes; she says "Hindi mein bolti hoon" and repeats the same card; after every hint she re-says the whole question card word for word.
  - Decision (`dc-r8-director20`): her reply after an aside is no longer written by the model: it comes from a small authored and judged set. Every parked aside must be returned to before the lesson ends. Authored lines are said as written without passing through the model, and the dry run's checks are also run over every live run's rows. The missing responses become entries in the compiled table. After a hint she re-asks only the question.
  - The 30 new topics stay held from children: all four judges said no.
  - Write-up: `judgements/director20-2026-11-11.md`.

## 4. Calls the main loop took that you may want to reverse

- **Round 8 is planned** (`docs/design/round8/PLAN.md`). Its aim: a child's second lesson differs from her first because of what she did in the first, and every difference names the fact behind it. Today a scripted lesson is the same for every child apart from one interest line and the language.
  She will first know a child by choosing among checked material (which parts to shorten, which card first, which fix for her mix-up). Content generated during a lesson stays limited to pictures that code can check. (`dc-r8-selection-before-generation`, `dc-r8-one-reader-with-because`)

- **Khand MEASURE is not shipped.** Its 2D form was a number pad plus left/right buttons, exactly what OWNER-RESET #3 rejects.
  It is replaced by *taraazu* (a kirana pan balance with real weights, and pouring jugs) on the same four topics.
  The original is still on its branch. (`dc-r7-games-measure-to-taraazu`)
- **ITEM-ARENA** ("aim at one of 4 answers and fire") is back only as a last-resort net when no real game exists for a skill.
  It never counts as game coverage. The topics where it is the only game form the games backlog.
- **54 sentence items are not served.** They were a swap of two words in a sentence already printed in order, which is a quiz in costume.
- **Hands-free is the default for every child** (`dc-r7-handsfree-default`). In production it switches on at the next release.

## 5. Phone checks for you after the release (mid-range Android)

- Hands-free from her first line; mute.
- The Khand 3D games and the new maths and science levels, opened by saying "game khelna hai" in a lesson.
- The fraction split and the number-line jump: your taste on speed and height.
- Face fallbacks and the light mouth on a weak phone.
- The class 4 lesson register.

## 6. Coverage on 2026-11-09 (classes 4-7, real games where the skill is the mechanic; from `data/play/coverage.json`)

| Subject | Topics |
|---|---|
| Maths | 129 |
| Science | 40 |
| SST | 7 |
| English | 7 |
| Hindi | 0 (waits for G1) |
