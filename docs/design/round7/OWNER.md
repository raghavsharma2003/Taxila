# Round 7: for the owner

Updated by the main loop at each integration. Last update: 2026-11-05 noon UTC, at integration 6 (`int/r6` c6c9ab91c,
tsc + build green; 4469 of 4482 unit tests pass single-process. The 1 failure is a Studio test-isolation bug,
fixed in tests only; 11 are skipped; 1 is a known todo). Live model calls so far: only the lesson-brain runs
(~$3.3 in total, on the stream's 2026-10-10 AI keys). Nothing is released: deploying needs the full key set.

## 1. Decisions only you can make

| # | What | Options / note |
|---|---|---|
| 1 | **Azure keys (the blocker).** Nothing has been tried live and nothing can be released without them. | Re-add the keys as environment variables, then the main loop runs `node scripts/handoff/write-env-local.mjs`. |
| 2 | **Spend batch** (section 2) | Approve all, some tiers, or none. Nothing runs until you say yes. |
| 3 | **Teacher face**: r8 / lamp2 / lamp2 + new jaw | Everything you need is on one page: `face/OWNER-FACE-REVIEW.md` (on claude/r7-face, PR #49). It covers the look, the greeting clips, the pose stills and the low-end-phone pass, with evidence for each. Lip timing within ±50 ms: r8 89%, lamp2 67% (its mouth barely moves), lamp2 + jaw 100%. |
| 4 | Account for the owner test cohorts | They are keyed to an email that matches no guardian, e.g. the guardian of the test child "Kiko". |
| 5 | Staging app (~$40/mo, scripted: `scripts/staging.mjs`, on the TEST DB by construction); India D5 relay (one 0.5-vCPU replica always on in South India: `scripts/region/d5-relay.mjs`); Front Door (~$35/mo); India cutover vs stopping taxila-cin-pg | All scripted and dry-run by default; each waits for your yes and the keys. |
| 6 | Volt-emblem avatars; on-device speaker matching | Parked until you decide. |
| 6b | **India map outline** | Any map that draws India's outline must show the official Survey of India boundary. Code can't draw a correct one from memory, so maps today are places pinned at true lat/long on a grid with a compass, and no outline. Provide or approve an official SoI source to enable outlines (`dc-r7-maps-no-outline`). |
| 7 | **URGENT, Founders Hub $25k (Milestone 3).** Microsoft: "If you don't qualify for Milestone 3 (5+ Azure workloads over a sustained period of 60 days) within 180 days of Business Verification, the sponsorship is cancelled and the subscription is converted to pay-as-you-go." If verification was 2026-07-08, the 60 days must start by **2026-11-06**. | Built and ready, not applied: `claude/r7-m3`, page `docs/design/round7/M3.md`. Two daily Azure jobs keep 6-7 services above $1/day, plus a daily cost check that emails the subscription Owner. ~$11-15/day including what already runs. You need to: (1) re-add the keys today; (2) send the business-verification date from the Founders Hub portal and the balance from microsoftazuresponsorships.com; (3) say yes/no to the extra VM (~$1.40/day) and to downsizing the unused `taxila-cin-pg` (saves ~$3.70/day). If you can't add the keys today, in the portal: `taxilacr` → Premium, plus one small Linux VM (D2as_v5, Central India, no public IP) in a new group `taxila-m3-rg`. Also: is the spending limit back on? |

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
| Maths | 63 of 141, plus kila (factors and multiples) and naksha (grids) |
| Science | 17 |
| SST | 6 (kaal), plus naksha (latitude and longitude) |
| English | 6 |
| Hindi | 0 (waits for G1) |
