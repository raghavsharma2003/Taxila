# Stage C: the live 2D puppet (lamp1), gate by gate

2026-10-10. Method: the r8 arm-P method (layers cut from her approved front, membrane fills, the lip shell and the
Hindi / Hinglish mouth set, lid keys, a turn field from painted three-quarter keys with flat violet shadow planes,
breathing, spring locks), driven by the production `PuppetDriver` (`src/face-puppet/driver.ts`, unchanged).

| gate (r8) | result | evidence |
|---|---|---|
| rest SSIM >= 0.97 on the head crop | **pass**: 0.9734 (1024 px), 0.9741 (720 px) | `evidence/rest-ssim-*.json` |
| no seam, smear, swim or pop | **fail** by the blind judges: "proportions swim", mouth interior "changes between consecutive frames", stray lock tip at the collar | `evidence/judge-live-tally.md` |
| bilabials close | **pass** with the text rule (9/9, gap <= 0.12 px); 5/9 from Azure's visemes alone | `evidence/stageC-log-412.json` |
| blink reads | **pass**: a fully closed frame at 5.0 s on every slot | `evidence/frames-412.webp` |
| fps >= 50 at 4x throttle, smallest slot | **pass** (headless, SwiftShader): 80 px row 57.3 fps; the 375 x 405 desk window is 10.5 fps on software GL | `evidence/fps-*.json` |
| pack <= 250 KB | **pass**: 156.8 KB on the wire, 183 KB raw (+ 50.7 KB poster) | `art/character/puppet2d/lamp1/pack-report.json` |
| blind n = 5, two families: childish <= 1/5 | **pass** 0/5 every round | `evidence/judge-live-tally.md` |
| uncanny / moving photo <= 1/5 | **fail**: uncanny 4, 5, 3, 4 /5 (C1-C4); moving photo 1, 1, 1, 0 /5 | same |
| same person >= 4/5 | **pass** 5/5 every round | same |
| safety-floor calm face | **pass**: smile 0 while she speaks, no nods | `evidence/stageC-log-412-calm.json` |

Calibration: the shipped r8 puppet through the same page, scene, slot and prompt: uncanny 0/5, premium 3.6 (lamp1 2.6).
Three polish rounds were spent (glance, tilt, turn, mouth tints, neck follow, upward gaze). Kill rule: stopped.

Deliverables: `art/character/puppet2d/lamp1/` (pack + `demo.html`), `scripts/character/puppet2d/lamp1/` (every step),
`clips/asha-{360,412,1366}.mp4`, `clips/asha-412-calm.mp4`, `evidence/frames-{360,412,1366}.webp`.
