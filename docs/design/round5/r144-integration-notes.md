# 14.4 context to log (main) — accumulate here, write the inbox at 14.4 integration

- rj-r144-tray-certificate-cited-as-content-gate (rejection, 2026-10-15): main's safety review of stream 2's D42 keepBoardSlot
  (94b2c0fe) passed it on "a kept board goes through gatedSlot against the CURRENT gate ctx, so an item opened later
  cannot have its key ride the kept page". False: gatedSlot runs certifyForTray, the tray / legibility certificate; a
  whiteboard's content is gated only when drawn (seam certifiedNow: "boards are gated when drawn"). Stream 2's test (b)
  reproduced it: a board writing "rectangle 160 m" kept while an item keyed 160 was open was re-sent with 160. Same gap in
  the unpushed late-board path (onScreenSlot, c47c8157). Lesson (same as rj-r5-unenforced-verdict-gate-cited): a gate is
  not a protection until a test shows the content refused; reviewers name the test, not the function. Fix: turn.js passes
  the open item's withheld values (whiteboard.js withheldValues, her line given) and a board writing any is not re-sent,
  failing closed when they cannot be computed.
- ms-r144-wb-grace-throttle (stream 2, 2026-10-15): prod build (vite preview), 360x800 DPR 2, API mocked, CDP
  setCPUThrottlingRate; board svg mount -> first frame p50/p95: 1x 11/15 (n=8), 4x 13/23 (8), 6x 35/41 (8), 10x 40/69 (5),
  20x 92/164 (5); board clock at the first frame 0 in 34/34; grace from mount 1208-1240 ms p50 (20x 1463). No product change;
  the earlier 2/8 test failures were the Vite dev server + a starved host. scripts/wb-grace-throttle.mjs.
- ms-r143-affirm-per-opportunity (sim lab, 2026-10-15, same transcripts as ms-r143-simlab-pet-tp): affirmOnNonCorrect per
  opportunity (not_yet / partial / empty turns) 1/34 (c07aa21a) vs 5/47 (9a30285d), Fisher p=0.39; partial only 1/10 vs 5/14
  (p=0.34); p66 alone 1/8 vs 5/15 (p=0.37); every hit p66 partial ("Haan, ... tumne reason bataya"). yesOnNoAnswer 1/4 vs 1/4.
  The before for 4A's ba413d78.
- 4A spoken fractions grader vs 4B fixture: 34/34 after two grader fixes ("2 बता दो" → 2/2; "एक बार और दिखा दो" → []);
  3,162 sim-lab child lines old vs new: 25 moved (21 ek baar narrative, 4 digit over digit), 0 unit readings; 208/208
  correct, 0/208 wrong forms credited.
- open: Hindi LANGUAGE rule follows a switch to English (4A (b)); needs data on Hindi-pref children writing English.
- stream 3 voicesig "never delay the turn": not a product delay (the bound timed the harness's synthesis of ~6 s of frames,
  169-252 ms; final → turn request 2-4 ms); fix proves order not time.
- QA pass on 94b2c0fe (DEFECTS.md @ e495fd09): catalogue 6/6 (maths/science/sst/english; whole words, no answer, matches
  her line); D42 fixed 3/3; D39 line side 1/3 still (fa2f04e7 "0 se 160 tak … Aap 160 par ungli rakhenge?"); NEW D43 (P2):
  the kept board stays into the next item (d4aa3f0b, e737d1a4) — same function as the blocker.
- dc (main): the verdict hold's device check is the owner's own D5 use (QA's container has no UDP: the WebRTC transcription
  call opened 0 times, every lesson ran the PTT fallback); ships on 4B's harness first-sound cost ≤ 250 ms p50 at today's R;
  QA reads the owner's next D5 traces after 14.4.
- stream 2: items.js revealsAnswer missed unit keys: key '160 m' vs her '160 par ungli rakhenge?' / '160 dikhao' → false (bare key '160' → true); fix: unit keys mirror bare-key behaviour, unit table, code only; for 14.4 on stream 2's branch with moved-line measurement.
- stream 3 3b1e317d (test-only): voicesig 'never delay the turn' proves ORDER (slow detector held open, the turn already sent while pending); whole file 10/10 alone; under 3 CPU-busy loops old 4/8 fail, new 0/8.
