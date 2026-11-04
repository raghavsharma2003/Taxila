# Round 7: for the owner

Updated by the main loop at each integration. Last update: 2026-11-04, after integration 2 (`int/r6` 88a6147e,
tsc + build + 3932 unit tests green). Nothing in round 7 has run live yet: the Azure keys are missing.

## 1. Decisions only you can make

| # | What | Options / note |
|---|---|---|
| 1 | **Azure keys (the blocker).** Nothing has been tried live and nothing can be released without them. | Re-add the keys as environment variables, then the main loop runs `node scripts/handoff/write-env-local.mjs`. |
| 2 | **Spend batch** (section 2) | Approve all, some tiers, or none. Nothing runs until you say yes. |
| 3 | **Teacher face**: r8 / lamp2 / lamp2 + new jaw | Side by side: `face/route-b-vs-r8-sheet.png`. Try it yourself with `?jaw=1` once your account is re-keyed. |
| 4 | Account for the owner test cohorts | They are keyed to an email that matches no guardian, e.g. the guardian of the test child "Kiko". |
| 5 | Staging app (~$40/mo, or reuse taxila-sin-staging); Front Door (~$35/mo); India cutover vs stopping taxila-cin-pg | Needed before release; see the Platform release plan below. |
| 6 | Volt-emblem avatars; on-device speaker matching | Parked until you decide. |
| 7 | The Founders Hub Milestone-3 usage plan; whether the subscription spending limit is back on | From the cost work on 2026-10-24. |

## 2. Spend batch (Azure Foundry, Direct): Azure only authors

Claude does all checking in-session, so the checks cost nothing on Azure: the blind-solve of every key, the form
equivalence check, adjudication and level rating. Figures come from the scripts' own dry runs
(`node scripts/kits/run.mjs all`). Dry run is the default. Spending needs `--run --cap N`, and runs are resumable.
(Corrected 2026-11-04: the first estimate of ~$127 had counted Azure checkers.)

| Tier | Work | Azure calls | ~Cost | Unblocks |
|---|---|---|---|---|
| 1 | G1 sentence-train grammar items (55 skills) | 83 | $2.66 | English and Hindi grammar games (Games) |
| 1 | W1a Hinglish/Devanagari answer forms | 30 | $0.60 | Hinglish answers graded correctly |
| 2 | W1b Hindi worked-example steps, class 4-7 maths | 141 | $2.62 | Worked examples in Hindi |
| 2 | W1c explain plans per skill, class 4-7 maths (424 skills) | 424 | $15.26 | Richer explanations (Brain) |
| 3 | W3 language kits on real texts, class 4-7 English/Hindi (101 topics) | 101 | $4.85 | English/Hindi lessons on real passages |
| 3 | W4 placement banks, class 9 maths/science | 8 | $0.36 | Placement for class 9 |
| — | W2 relevel, all classes | 0 | $0 | Level match (OWNER-RESET #2): rated by Claude in-session, no approval needed |
| — | Face: the 27 daily-greeting clips (DragonHD) | 27 | cents | Her spoken home greeting |
| — | Face: painted pose stills (wave, reading, …) via Azure images | tbd | small | Replaces stand-in stills |
| **All** | | **~815** | **~$26 (≈ ₹2,200)** | |

Recommendation: approve it all. At ~$26 it is less than one test-battery day was in October. If you'd rather approve
in parts, start with tiers 1 and 2 (~$21).

## 3. What you can look at now (all in `docs/design/round7/`)

- **App** (stage-first lesson, one nav, steer chips, the stop check-in, hands-free dock, class 4 in the older look): `app/shots-m1/*.png`.
  Made from fixture pages and a mocked API, not a live lesson.
- **Games**
  - Week 1 maths (angles, integer hops, bar graphs and pictographs): `games/w1/*.mp4` and `*-strip.png`.
  - Week 2 science (mirror beam, periscope, circuit, pendulum): `games/w2/`.
- **Studio**: the fraction split animation, `studio/split-*.mp4`. The number-line jump comes with integration 3.
- **Face**
  - `face/r7-face-fallback-sheet.png`: the same Asha on every fallback path.
  - `face/stills-sheet.png`.
  - `face/lite-mouth-strip.png`: weak phones.
  - `face/route-b-vs-r8-sheet.png`.

## 4. Calls the main loop took that you may want to reverse

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

## 6. Coverage today (classes 4-7, real games where the skill is the mechanic)

| Subject | Topics |
|---|---|
| Maths | 63 of 141 |
| Science | 17 |
| SST | 6 |
| English | 6 |
| Hindi | 0 (waits for G1) |
