# Round 2 · stream content · RESEARCH: a visual exactly when the teacher refers to it

Stream brief (V3, live content timing and coverage): on prod (web ee97e9c), "show me a diagram" failed 2/2 (owner-5),
request → stage p90 3304 ms (bar 3000), board lateness p90 2332 ms (bar 1500), w1b-mounts: 3 maths topics with no
item-bound fraction activity, the p4 acceptance timed out. Labels: **[M]** measured here (n, method, date), **[V]** read
in the source, **[S]** search-level summary (abstract or secondary source, not read in full).

## 0. What production actually did (measured first, not assumed)

Source: production container logs (Log Analytics workspace of `taxila-env`, app `taxila-web`, revision
`taxila-web--see97e9c-6v0v`), every `[studio] whiteboard …` line 2026-10-06 15:10-19:08 UTC. n = 189 whiteboard asks. [M]

| outcome | n | ask → board (server) |
|---|---|---|
| drawn, `code` rung (kit's own board, at the 1.9 s sync deadline) | 78 | p50 1900 · p90 1913 ms |
| drawn, `line` rung (model plans the board from her finished line) | 45 | p50 2448 · p90 4866 · max 6605 ms |
| drawn, `spec` rung (speculative plan from the predicted line) | 35 | p50 22 · p90 4118 ms |
| **not drawn** (every rung failed the drawing gate) | **31 (16.4%)** | — |
| all drawn | 158 | **p50 1900 · p90 3211 ms** |

Not-drawn reasons (gate check ids): W4.numbers_from_truth 19, W9.no_reveal 6, W6.timing 7, W8.counts_match_line 3,
W2/W3 layout 7, W0 shape 4, W1 1, W7 1, nothing to draw 1 (a line can fail several).

**The owner-5 "show me a diagram" failure is not prod-only infrastructure.** Studio was reachable, the token, deployment
names and quota were fine: the two failing asks are the log lines `whiteboard not drawn W8.counts_match_line 4991ms` and
`W6.timing,W8.counts_match_line 7001ms` at 16:39:51 and 16:40:10, the exact times of the two Meher requests. Her line
was "3 equal groups, each with 5 dots" (fractional units, c6-maths-ch07-t01). The kit's code board for that move
(equal-groups@1: 3 groups of 5 = 15 dots) is the right picture, but W8's count reader takes `3` from "3 equal groups"
and never reads "each with 5" as 3 × 5, so it refused a 15-dot board [M, reproduced offline in
`tests/round2-content.test.mjs`]. Locally the model happened to say other words (14/14), which is why it looked prod-only:
the failure is a property of her free line meeting a strict gate, so it shows up at a rate, not on a host.

The deeper cause is ordering. The board is planned **after** her line exists and has to chase whatever she said; 16% of
the time nothing kit-true matches, and the board is late by construction (the code rung waits the full 1.9 s deadline
for the model rung to maybe win).

Second finding, from the same code path: the authored catalogue (`data/studio-catalogue`, 3011 boards, the "board plan
379/385 topics" in the ship-five coverage) is drawn on 800 × 500 boards. At the phone tray (312 × 274) that is 0.39 scale,
so an 18-unit label is 7 px against the 11 px bar: **2886/3011 (95.8%) fail W1.fits_stage at the live gate and can never
be shown** [M, `evals/content/coverage.mjs`]. The ship-five coverage counted boards by shape and lint only.

## 1. What the research says about timing a visual to the words

1. **Temporal contiguity is one of the strongest multimedia effects.** Ginns (2006, Learning and Instruction) meta-analysis:
   13 experiments, d = 0.87 for simultaneous over successive narration and animation. Mayer's own tests: 9/9
   experiments, median d = 1.22 (transfer). A 2025 meta-analysis of Mayer's corpus finds a smaller multivariate effect
   (g = 0.13) that rises to g = 0.53 univariate once seductive-detail studies are separated (ScienceDirect
   S1747938X25000673). [S] Boundary condition: the effect shrinks when the presentation alternates in short learner-paced
   segments (Mayer et al. 1999 "small bites") [S]. That is our case: one short line per turn. So the bar is "the board is
   up when she starts pointing at it", not millisecond lock-step. The 1.5 s lateness bar after audio start is consistent
   with that; a board that is ready with the reply (before audio) is strictly better.
2. **Signalling / deixis.** "Look at the screen" is a deictic cue; for children, verbal deixis plus a visible referent
   directs attention, and a cue to a referent that is not there is worse than no cue (the joint-attention literature on
   multiple deictic cues, e.g. Psychological Research 2022 on ASD children; tandfonline 2024 on gaze and pointing in L2
   vocabulary) [S]. Product rule: she may say "screen par dekho" only about something that IS on screen. That is the
   AT-7 rule here, and the honest reading of owner-5's complaint.
3. **Authored whiteboard video decides the drawing and narrates it.** Khan-style lectures, and the 2026 work on
   speech-synchronised whiteboard generation (arXiv 2603.25870: Qwen2-VL-7B + LoRA predicting stroke sequences
   conditioned on speech timestamps, 24 narrated Excalidraw demos, 8 STEM domains, five-fold topic-stratified CV;
   "timestamp conditioning significantly improves temporal alignment") [V abstract]. Even the learned system aligns
   strokes to an existing script. Live, we can do better than chase: commit the drawing first (kit-true, gated), then
   have her line written FROM its facts. Then contiguity and deixis hold by construction.
4. **Khanmigo's latency program** (Khan Academy blog, Oct 2025-Apr 2026) [V]: faster model −0.3 s (1.35 M threads),
   shorter outputs −3 s mean (352 k threads), smaller math context −0.4 s, pre-check routing −0.3 s (1.04 M threads).
   Their interactive diagrams are generated when "a visual may help" and react to the student's manipulation; no
   published diagram-timing numbers. Transfer: the reply path, not the visual, dominates request → stage (owned by the
   latency stream this round). Content must not ADD to it: no model call between the ask and the board.
5. **Speculative execution for agents** ("Speculate with Memory", arXiv 2607.12236; PASTE "Act While Thinking",
   arXiv 2603.18897; Dynamic Speculative Agent Planning, arXiv 2509.01920) [S]: predict the next action, pre-launch it,
   keep it on a hit, discard on a miss; the win is bounded by prediction accuracy times the hidden latency, the cost by
   misses. Our measured speculative board (`spec` rung) hit 35/158 drawn boards, and its p90 was still 4.1 s because it
   is a model call. A speculation that costs ~16 ms and no model call can be taken on every accepted ask.

## 2. What transfers to a Hindi-English voice tutor for 9-15 year olds on Azure only

- No third-party visual service; every board is kit-grounded code or authored catalogue data, gated by our own W0-W9.
  Azure models stay only where they add value (the line plan and spec rungs remain as fallbacks).
- The child's language does not change the board (labels come from kit or catalogue, both bilingual where authored); her
  line is in the child's register. The row given to the reply is telegraphic values only (never a sentence: the inherited
  "sentence-shaped prompt text gets recited" law).
- Safety floor: nothing is preselected on a safeguarding turn or after one (same guards as `requestIntent`); W9
  (no answer reveal) and W7 (SEVERE / PII predicates) are on the preselect gate too.

## 3. The design chosen: board-first, then her words

1. **Preselect at kernel time** (`server/stagecraft/board-first.js`, new): when the kernel accepts a whiteboard ask, pick
   the kit's explain-rung board (code pick, library) or a catalogue board, made legible
   (`server/stagecraft/board-legible.js`), gated against the predicted line on every check that does not depend on her
   exact words (W0-W4, W7, W9). Pure, about 16 ms, no model call.
2. **Her line is written from it.** Its facts become one `on screen now … board · …` row in the move's content, so the
   reply names what is drawn.
3. **Re-gate on her real line, show at once.** `requestIntent` re-times the preselected board to her line and re-runs the
   FULL gate W0-W9. A pass is drawn synchronously, and the slot rides the turn response with its artifact (ready before
   her audio starts). A fail falls through to the existing ladder unchanged, so this can only add boards.
4. **W8 reads "N groups, each with M"** as N × M (the owner-5 prod failure), narrowly: a partition count she said times
   another number she said.
5. **Legibility fit for catalogue boards**: geometry shrunk so the smallest text reaches 11 px; text sizes untouched.
   Every shrunk board is re-gated (overlaps it causes are refused, not hidden).
6. **Fraction modes** (w1b-mounts): `fractions@1` gains `name` (a fixed shaded shape; the child builds n/d) and `of`
   (N objects; the child regroups and gives a/b of N). The adapters bind items whose key the engine's own logic computes,
   and the server re-grades the raw act (`recheck.js`), never the frame's `correct`.

Rejected alternatives (and why), logged to `context/inbox/content.json`:
- Waiting longer for the model board (raise the 7 s budget): the board is already late. Every extra second is lateness.
- Loosening W8 / W4 generally: they are the "drawn counts are her counts, numbers from truth" guarantees. Only the
  multiplicative reading is added.
- Pushing the piece on the Studio SSE before the reply returns: the client opens that stream only when a stage mounts,
  so the first reveal of a lesson could not use it. And a picture 2 s ahead of her words is exactly the successive
  presentation contiguity warns against. The latency stream owns the reply path.

Pre-registered expectations (stated before the after-runs): preselect covers ≥ 90% of explain and worked-example asks
over the 385 class 4-7 topics (offline, measured 745/770 = 96.8%). On the battery, board lateness p90 ≤ 1500 ms, with
most boards in the turn response itself. Request → stage for pieces is unchanged by this stream (it is the reply time).
