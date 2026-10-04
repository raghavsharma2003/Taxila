| kind | arm | n | pass 1st | pass ≤2 repairs | TTFT p50 s | stream paint p50 s (hit/n) | gen p50 s | gate p50 s | time-to-playable p50 / max s (passed) | $/build mean | $/passed build |
|---|---|---|---|---|---|---|---|---|---|---|---|
| photosynthesis_anim | sol-low | 3 | 2/3 | 3/3 | 9.0 | 19.8 (3/3) | 32.5 | 6.3 | 38.8 / 72.7 | 0.1220 | 0.1220 |
| photosynthesis_anim | codex-low | 3 | 0/3 | 3/3 | 15.0 | 26.2 (3/3) | 41.2 | 6.4 | 78.6 / 89.1 | 0.1418 | 0.1418 |
| photosynthesis_anim | codex-med | 3 | 0/3 | 3/3 | 23.8 | 32.3 (3/3) | 46.2 | 6.5 | 95.1 / 124.3 | 0.2054 | 0.2054 |
| photosynthesis_anim | terra-low | 3 | 0/3 | 3/3 | 5.3 | 13.8 (3/3) | 25.7 | 6.2 | 62.9 / 92.4 | 0.1102 | 0.1102 |
| photosynthesis_anim | dsv4-flash | 3 | 0/3 | 0/3 | 1.3 | 5.3 (3/3) | 19.8 | 6.2 | - / - | 0.0073 | - |
| photosynthesis_anim | dsv4-pro | 3 | 0/3 | 0/3 | 1.7 | 10.7 (3/3) | 40.3 | 6.2 | - / - | 0.0704 | - |
| photosynthesis_anim | grok-4.3 | 3 | 0/3 | 1/3 | 24.0 | 27.1 (3/3) | 41.4 | 6.2 | 139.6 / 139.6 | 0.0310 | 0.0931 |

Race of two (seed-aligned pairs s = 0..n-1; pass if either arm passes; time = the faster passer):
| kind | pair | pass | ttp p50 s |
|---|---|---|---|
| photosynthesis_anim | sol-low + codex-low | 3/3 | 38.8 |
| photosynthesis_anim | sol-low + codex-med | 3/3 | 38.8 |
| photosynthesis_anim | sol-low + terra-low | 3/3 | 38.8 |
| photosynthesis_anim | sol-low + dsv4-flash | 3/3 | 38.8 |

Failing checks (count over all rounds):
- photosynthesis_anim:labels_no_overlap_in_view: 19
- photosynthesis_anim:science_direction_of_flows: 17
- photosynthesis_anim:words_from_table: 11
- photosynthesis_anim:label_text_from_table: 10
- photosynthesis_anim:pause_freezes: 4
- photosynthesis_anim:no_hscroll: 4
- photosynthesis_anim:only_table_keys: 4
- photosynthesis_anim:done_called: 3
- photosynthesis_anim:targets_in_viewport: 2
- photosynthesis_anim:targets_ge_40px: 1
- photosynthesis_anim:labels_present: 1

Overall: n=21, pass first 2, pass after ≤2 repairs 13; total spend $2.06
Repair recovered 11/19 first-try gate failures (excludes stream errors).
