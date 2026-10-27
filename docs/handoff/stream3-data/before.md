| stage | n | p50 | p90 | min | max |
|---|---|---|---|---|---|
| end of speech → server VAD stop | 58 | 1084 | 1107 | 1038 | 3355 |
| → final transcript | 58 | 1599 | 1661 | 1520 | 4029 |
| → turn POST | 58 | 1599 | 1662 | 1520 | 4030 |
| server @classified | 58 | 848 | 1104 | 60 | 1384 |
| server @noted | 54 | 1429 | 1925 | 695 | 2248 |
| server @planned | 58 | 1430 | 1923 | 107 | 2251 |
| server @replied | 58 | 2629 | 4081 | 1162 | 4802 |
| server @stored | 58 | 2689 | 4155 | 1219 | 4856 |
| server total | 58 | 2689 | 4155 | 1219 | 4856 |
| turn round trip (client) | 58 | 2699 | 4162 | 1224 | 4860 |
| → turn response | 58 | 4317 | 5837 | 2886 | 8039 |
| response → first PCM byte | 58 | 785 | 847 | 71 | 1654 |
| TTS prewarm age at tts-stream | 58 | 60 | 78 | 51 | 97 |
| → first PCM byte | 58 | 5073 | 6602 | 3301 | 8909 |
| → reply audible (+60 lead +50 nominal out) | 58 | 5183 | 6712 | 3411 | 9019 |
| → echo audible (played only) | 10 | 2971 | 3122 | 2910 | 3182 |
| → first sound (echo or reply) | 58 | 5134 | 6302 | 2910 | 9019 |
| first sound, graded answers | 13 | 2995 | 4221 | 2910 | 4737 |
| first sound, non-answers | 45 | 5271 | 6994 | 3411 | 9019 |
| model grok-4-1-fast-non-reasoning | 54 | 771 | 960 | 621 | 1309 |
| model taxila-fast (speculative) | 28 | 1192 | 1454 | 790 | 1512 |
| model taxila-fast | 51 | 1280 | 1582 | 918 | 2042 |
| model taxila-gpt6 | 53 | 1361 | 1859 | 1089 | 2403 |
{"turns":58,"speculation":"17/54 hit","prefetchAdopted":"0/58","rewrites":15,"echoPlayed":"10/13 graded","under900":"0/58 reply ≤ 900 ms"}
