# The approval lane: generated content in front of a child (STUDIO-11)

Studio, 2026-11-10. **A proposal, not built.** Main replies before any of it is built. It costs no Azure money to read;
the one paid step (generation, below) waits for main's OK.

## What is generated today, and where it stops

| What | Made by | Checks it passes | Reaches a child? |
|---|---|---|---|
| **Catalogue** (`data/studio-catalogue/topics`, 385 topics: a game spec, an explainer, boards) | a Foundry model, offline | schema, kit ids, unsafe strings; a blind cross-check by **DeepSeek-V4-Flash** (`check.verdict`); render certificates at all three sizes (`server/forge3/certs/catalogue.json`) | **Yes**, through the Stagecraft reveal where certified (D8). 13 topics are withheld (STUDIO-02/03). The scripted pilots' runs record no Stagecraft reveal: the held board has the tray on every scripted turn. |
| **Live spec** (Stagecraft `generated_spec`, `taxila-fast-bg`) | a Foundry call during the lesson | schema, kit ids, `keysVerified` (a model never grades), Q8 Content Safety on new strings, on-topic | **No.** The tray gate needs a judge verdict at three sizes, and nothing gives one. Since 24898262f the rung is not launched without a judge lane. |
| **Image rung**, **live code** | (unwired) | n/a | **No.** `productionDeps` has no image call or build race; the live gate is not wired (STUDIO-12: `rolldown` is missing from the image) |
| **Pictures** (`server/studio/picture.js`) | the image lane, live | fixed kid-safe template; Content Safety on the pixels, failing closed; 4 per lesson | Only for allow-listed guardians (`TAXILA_PICTURES_FOR`) |
| Boards, G1 fills, scenes | code | lint, certificates | Yes (not generated) |

So the only generated content a child sees today was judged by a Foundry model before the 2026-10-27 directive. Nothing
generated reaches a scripted lesson.

## What a Claude judge pass in this session adds

The predicate checks prove shape: it validates, fits at 14 px, cites real kit ids, grades only verified keys, and has no
unsafe string. They cannot prove the piece is **true and on the beat**. The seven catalogue failures are all of that kind:
oxygen sorted as "Burns", a "-10" rule on 50, 45, 40, a ₹550 key for ₹36,250 + ₹18,750, a round that gives its answer away.

A Claude pass reads the rendered piece next to its beat and scores a fixed rubric:
1. Every number and claim is true against the kit key and the card.
2. It shows what her line about it will say, and nothing the card asks before it is asked (the S10 rule).
3. The misconception it targets is the beat's.
4. Its words fit the class and register.
5. Nothing in it is unsafe for a child.

Each verdict carries its reasons and the hash of the piece. This follows the directive (judges use Claude), costs nothing
on Azure, and is the same judging the director runs already get.

## The smallest lane: one generated visual inside one scripted lesson, approved offline

The approval happens **ahead of the lesson, not live**. No judge service and no live wait.

1. **Pick.** Learning names one beat in one pilot, with what the visual is for. For example, c5-t01 s1's worked example:
   "find 1/4 on the line" as a `catch-on-line` round.
2. **Generate.** `scripts/studio-approve.mjs gen <topic> <beat>` makes the spec through the existing `generatedSpec`
   builder: one Foundry call, about $0.0013. This is the paid step.
3. **Check by predicate.** All of today's checks run, then the render at the three sizes, locally in Playwright through
   the forge3 harness. That gives `byViewport`, which is the gate's own measure.
4. **Judge.** This Claude session scores the rubric above on the renders and the spec. It writes `verdict.md` with reasons.
   Any rubric miss is a reject. A reject either regenerates once or drops the beat's piece.
5. **Approve.** `data/studio-approved/<topic>/<beat>.json` holds the spec, its hash, the render verdict, the judge's verdict
   with reasons, who judged and when. The commit is the approval, and git review is where a person can veto it.
6. **Serve.** The tray gate accepts a `generated_spec` whose hash is in the approved store. That verdict takes the place
   of the live judge, a one-line change in `tray-gate.js` with a test. At that beat Studio reveals the approved piece in
   the tray, then gives the tray back to the held board.
   - Any failure (stale hash, refused at the device's size) → the held board, as today.

At the end, one child in one scripted lesson sees one generated visual that a predicate suite and a Claude judge both
passed. The same lane then extends beat by beat. Re-checking the 385 catalogue topics with the Claude rubric is the
obvious second use, and it is what un-withholds the 13.

## What it needs

- **Brain:**
  - A script beat field that asks Studio for an approved piece by id (`piece: "approved:<topic>/<beat>"`), and the tray
    handover: held board → piece → back to the held board on the next unit part.
  - A line part that introduces the piece, built from the piece's facts as the P6 picture line is.
  - The harness records the reveal.
- **Learning:**
  - Choose the beat and what the visual must show.
  - Author her line for it.
  - The beat's truth source for the rubric: the key, the card and the misconception.
- **Platform:** nothing for this lane, because the renders and the judge run in-session or in CI. For a live lane later:
  deploy the forge3-qa service (`FORGE3_QA_URL`) and fix STUDIO-12 (`rolldown`).
- **Main or the owner:** an OK for the one Foundry call per piece, and whether an approval also needs the owner's sign-off.
- **Studio** builds the rest: the approve script, the approved store, the tray-gate line, the reveal at the beat, and tests.

## Not in this lane

Live generation during a lesson, generated pictures, and generated code. Each needs the live judge service, which stays
off until this lane has shown one piece is worth it.
