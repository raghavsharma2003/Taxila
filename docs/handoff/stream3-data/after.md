| stage | n | p50 | p90 | min | max |
|---|---|---|---|---|---|
| end of speech → server VAD stop | 117 | 1073 | 1120 | 851 | 1645 |
| → final transcript | 117 | 1569 | 1658 | 1376 | 3283 |
| → turn POST | 117 | 1569 | 1658 | 1377 | 3284 |
| server @prefetch_adopted | 114 | 59 | 72 | 42 | 223 |
| server @classified | 117 | 407 | 725 | 43 | 1690 |
| server @noted | 109 | 1138 | 1667 | 67 | 2030 |
| server @planned | 117 | 1096 | 1615 | 86 | 2032 |
| server @replied | 117 | 2081 | 3606 | 115 | 5282 |
| server @stored | 117 | 2140 | 3693 | 188 | 5366 |
| server total | 117 | 2140 | 3693 | 188 | 5366 |
| turn round trip (client) | 117 | 2143 | 3695 | 191 | 5370 |
| → turn response | 117 | 3788 | 5245 | 2305 | 6976 |
| response → first PCM byte | 117 | 393 | 449 | 26 | 1370 |
| TTS prewarm age at tts-stream | 117 | 61 | 89 | 48 | 165 |
| → first PCM byte | 117 | 4125 | 5608 | 2610 | 7398 |
| → reply audible (+60 lead +50 nominal out) | 117 | 4238 | 5718 | 2720 | 7508 |
| → echo audible (played only) | 17 | 2285 | 2494 | 2045 | 3393 |
| → first sound (echo or reply) | 117 | 4160 | 5718 | 2045 | 7508 |
| SHADOW reply audible, s1 early | 117 | 4235 | 5718 | 2669 | 7508 |
| SHADOW gain on locked turns | 53 | 57 | 84 | 47 | 145 |
| first sound, graded answers | 24 | 2426 | 4772 | 2045 | 5718 |
| first sound, non-answers | 93 | 4339 | 5955 | 2720 | 7508 |
| model grok-4-1-fast-non-reasoning (prefetch) | 109 | 809 | 1061 | 403 | 2113 |
| model grok-4-1-fast-non-reasoning | 3 | 764 | 1322 | 549 | 1322 |
| model taxila-fast (speculative) | 113 | 1237 | 1502 | 793 | 1650 |
| model taxila-fast | 43 | 1210 | 1630 | 869 | 2775 |
| model taxila-gpt6 (prefetch) | 2 | 1610 | 1610 | 1507 | 1610 |
| model taxila-gpt6 | 3 | 1669 | 1966 | 1337 | 1966 |
{"turns":117,"speculation":"85/117 hit","prefetchAdopted":"114/117","rewrites":34,"echoPlayed":"17/24 graded","earlyLocked":"53/117 locked, 52 kept s1","earlyWhy":{"no_pinned_question":26,"turn_kind":22,"s1_script":2,"s1_screen":7,"s1_leak":1,"min_same":2,"min_long":2,"s1_praise":1,"min_bare":1},"under900":"0/117 reply ≤ 900 ms"}
