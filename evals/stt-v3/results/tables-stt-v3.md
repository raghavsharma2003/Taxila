| arm | cerNorm | werNorm | werRaw | keyRecall | numbers (v2) | numbers (R4-fixed) | answers | wrong script | decoys | non-speech n12 | non-speech n30 | babble (reversed speech) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | 0.028 | 0.05 | 0.106 | 0.938 | 92/96 [0.924, 0.978] | 92/96 | 76/78 [0.94, 0.989] | 0 | 0 | 0/12 | - | - |
| S0 MAI-Tx-2-Streaming nohint | 0.021 | 0.049 | 0.114 | 0.936 | 90/96 [0.898, 0.962] | 93/96 | 78/78 [0.979, 1] | 3 | 0 | 0/12 | - | - |
| X2 MAI-Transcribe-2 | 0.017 | 0.046 | 0.103 | 0.936 | 91/96 [0.911, 0.97] | 93/96 | 78/78 [0.979, 1] | 0 | 0 | 0/12 | - | - |
| G3 gpt-transcribe hi+prompt | 0.022 | 0.04 | 0.083 | 0.953 | 94/96 [0.951, 0.991] | 94/96 | 77/78 [0.958, 0.996] | 0 | 0 | 7/12 | - | - |
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | 0.165 | 0.245 | 0.429 | 0.717 | 70/96 [0.668, 0.783] | 79/96 | 56/78 [0.649, 0.778] | 0 | 0 | 0/12 | 0/30 [0, 0.052] | 2/4 |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | 0.148 | 0.241 | 0.43 | 0.726 | 72/96 [0.689, 0.802] | 79/96 | 59/78 [0.689, 0.813] | 0 | 0 | 0/12 | 0/30 [0, 0.052] | 3/4 |
| O-N6auto nemotron-3.5 stream auto-LID 560 ms | 0.048 | 0.104 | 0.169 | 0.863 | 84/96 [0.825, 0.912] | 84/96 | 74/78 [0.906, 0.972] | 4 | 2 | 0/12 | 0/30 [0, 0.052] | 1/4 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 0.167 | 0.252 | 0.434 | 0.71 | 71/96 [0.678, 0.793] | 80/96 | 59/78 [0.689, 0.813] | 0 | 0 | 0/12 | 0/30 [0, 0.052] | 3/4 |
| O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) | 0.148 | 0.241 | 0.43 | 0.726 | 72/96 [0.689, 0.802] | 79/96 | 59/78 [0.689, 0.813] | 0 | 0 | 0/12 | 0/30 [0, 0.052] | 3/4 |
| O-Q06 qwen3-asr-0.6b auto | 0.078 | 0.144 | 0.211 | 0.828 | 70/96 [0.668, 0.783] | 70/96 | 64/78 [0.758, 0.869] | 1 | 1 | 0/12 | 0/30 [0, 0.052] | 4/4 |
| O-Q06hi qwen3-asr-0.6b language=hi | 0.077 | 0.165 | 0.283 | 0.816 | 71/96 [0.678, 0.793] | 71/96 | 61/78 [0.717, 0.836] | 0 | 0 | 12/12 | 29/30 [0.895, 0.99] | 4/4 |
| O-Q17 qwen3-asr-1.7b auto | 0.031 | 0.075 | 0.177 | 0.882 | 84/96 [0.825, 0.912] | 84/96 | 70/78 [0.845, 0.934] | 2 | 2 | 0/12 | 0/30 [0, 0.052] | 4/4 |
| O-Q17hi qwen3-asr-1.7b language=hi | 0.058 | 0.128 | 0.349 | 0.828 | 76/96 [0.734, 0.84] | 72/96 | 63/78 [0.744, 0.858] | 1 | 0 | 12/12 | 30/30 [0.948, 1] | 4/4 |
| O-Q17p qwen3-asr-1.7b auto + script prompt | 0.047 | 0.088 | 0.172 | 0.866 | 82/96 [0.802, 0.894] | 82/96 | 69/78 [0.83, 0.923] | 0 | 1 | 0/12 | 0/30 [0, 0.052] | 4/4 |
| O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary | 0.042 | 0.077 | 0.165 | 0.877 | 83/96 [0.814, 0.903] | 83/96 | 70/78 [0.845, 0.934] | 0 | 0 | 0/12 | 0/30 [0, 0.052] | 4/4 |
| O-V480 voxtral-realtime stream 480 ms | 0.14 | 0.233 | 0.357 | 0.772 | 50/96 [0.456, 0.585] | 50/96 | 46/78 [0.517, 0.659] | 7 | 1 | 0/12 | 0/30 [0, 0.052] | 2/4 |
| O-V960 voxtral-realtime stream 960 ms | 0.118 | 0.215 | 0.333 | 0.791 | 51/96 [0.466, 0.595] | 51/96 | 46/78 [0.517, 0.659] | 5 | 0 | 0/12 | 0/30 [0, 0.052] | 2/4 |
| O-Z0 zero-stt-hinglish auto | 0.134 | 0.196 | 0.254 | 0.866 | 81/96 [0.791, 0.885] | 80/96 | 68/78 [0.816, 0.913] | 0 | 0 | 12/12 | 27/30 [0.808, 0.951] | 4/4 |
| O-Z0hi zero-stt-hinglish language=hi | 0.125 | 0.218 | 0.263 | 0.848 | 83/96 [0.814, 0.903] | 83/96 | 68/78 [0.816, 0.913] | 1 | 0 | 12/12 | 30/30 [0.948, 1] | 4/4 |

| arm | items better / worse vs D4 | mean dCER (arm - D4) | 80% CI | 95% CI |
|---|---|---|---|---|
| S0 MAI-Tx-2-Streaming nohint | 9 / 10 | -0.007 | [-0.017, 0.003] | [-0.022, 0.007] |
| X2 MAI-Transcribe-2 | 11 / 8 | -0.011 | [-0.022, 0.001] | [-0.029, 0.007] |
| G3 gpt-transcribe hi+prompt | 11 / 6 | -0.006 | [-0.013, 0.001] | [-0.017, 0.005] |
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | 6 / 19 | 0.137 | [0.082, 0.188] | [0.059, 0.215] |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | 6 / 21 | 0.119 | [0.07, 0.162] | [0.051, 0.185] |
| O-N6auto nemotron-3.5 stream auto-LID 560 ms | 4 / 17 | 0.02 | [0.011, 0.03] | [0.006, 0.036] |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 6 / 20 | 0.138 | [0.083, 0.186] | [0.062, 0.215] |
| O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) | 6 / 21 | 0.119 | [0.07, 0.162] | [0.051, 0.185] |
| O-Q06 qwen3-asr-0.6b auto | 4 / 18 | 0.05 | [0.031, 0.071] | [0.021, 0.083] |
| O-Q06hi qwen3-asr-0.6b language=hi | 4 / 20 | 0.049 | [0.034, 0.065] | [0.026, 0.073] |
| O-Q17 qwen3-asr-1.7b auto | 7 / 12 | 0.003 | [-0.005, 0.012] | [-0.01, 0.016] |
| O-Q17hi qwen3-asr-1.7b language=hi | 7 / 18 | 0.03 | [0.014, 0.044] | [0.007, 0.052] |
| O-Q17p qwen3-asr-1.7b auto + script prompt | 6 / 14 | 0.018 | [0.006, 0.032] | [0, 0.041] |
| O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary | 8 / 9 | 0.014 | [0.001, 0.028] | [-0.005, 0.036] |
| O-V480 voxtral-realtime stream 480 ms | 2 / 24 | 0.112 | [0.081, 0.146] | [0.068, 0.165] |
| O-V960 voxtral-realtime stream 960 ms | 2 / 24 | 0.089 | [0.064, 0.118] | [0.052, 0.134] |
| O-Z0 zero-stt-hinglish auto | 4 / 24 | 0.106 | [0.064, 0.145] | [0.049, 0.17] |
| O-Z0hi zero-stt-hinglish language=hi | 4 / 23 | 0.097 | [0.057, 0.137] | [0.044, 0.16] |

| arm | clean | white 10 dB | pink 10 dB |
|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | 0.021 / 32/32 | 0.032 / 30/32 | 0.031 / 30/32 |
| S0 MAI-Tx-2-Streaming nohint | 0.017 / 30/32 | 0.027 / 30/32 | 0.019 / 30/32 |
| X2 MAI-Transcribe-2 | 0.011 / 31/32 | 0.02 / 31/32 | 0.021 / 29/32 |
| G3 gpt-transcribe hi+prompt | 0.013 / 31/32 | 0.034 / 32/32 | 0.02 / 31/32 |
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | 0.138 / 25/32 | 0.201 / 24/32 | 0.156 / 21/32 |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | 0.119 / 25/32 | 0.166 / 22/32 | 0.158 / 25/32 |
| O-N6auto nemotron-3.5 stream auto-LID 560 ms | 0.024 / 30/32 | 0.062 / 25/32 | 0.059 / 29/32 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 0.125 / 25/32 | 0.2 / 21/32 | 0.174 / 25/32 |
| O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) | 0.119 / 25/32 | 0.166 / 22/32 | 0.158 / 25/32 |
| O-Q06 qwen3-asr-0.6b auto | 0.041 / 25/32 | 0.087 / 23/32 | 0.107 / 22/32 |
| O-Q06hi qwen3-asr-0.6b language=hi | 0.057 / 24/32 | 0.087 / 25/32 | 0.087 / 22/32 |
| O-Q17 qwen3-asr-1.7b auto | 0.019 / 29/32 | 0.035 / 27/32 | 0.04 / 28/32 |
| O-Q17hi qwen3-asr-1.7b language=hi | 0.037 / 27/32 | 0.067 / 24/32 | 0.069 / 25/32 |
| O-Q17p qwen3-asr-1.7b auto + script prompt | 0.025 / 29/32 | 0.071 / 25/32 | 0.044 / 28/32 |
| O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary | 0.028 / 30/32 | 0.059 / 25/32 | 0.04 / 28/32 |
| O-V480 voxtral-realtime stream 480 ms | 0.088 / 18/32 | 0.151 / 16/32 | 0.18 / 16/32 |
| O-V960 voxtral-realtime stream 960 ms | 0.074 / 18/32 | 0.14 / 17/32 | 0.139 / 16/32 |
| O-Z0 zero-stt-hinglish auto | 0.057 / 30/32 | 0.192 / 25/32 | 0.153 / 26/32 |
| O-Z0hi zero-stt-hinglish language=hi | 0.046 / 29/32 | 0.128 / 28/32 | 0.2 / 26/32 |

| arm | hinglish | hindi | english | hesitant |
|---|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | 0.017; ans 24/24; script 0 | 0.031; ans 24/24; script 0 | 0.007; ans 10/12; script 0 | 0.074; ans 18/18; script 0 |
| S0 MAI-Tx-2-Streaming nohint | 0.029; ans 24/24; script 0 | 0.004; ans 24/24; script 0 | 0.002; ans 12/12; script 0 | 0.06; ans 18/18; script 3 |
| X2 MAI-Transcribe-2 | 0.032; ans 24/24; script 0 | 0.004; ans 24/24; script 0 | 0.014; ans 12/12; script 0 | 0.016; ans 18/18; script 0 |
| G3 gpt-transcribe hi+prompt | 0.015; ans 24/24; script 0 | 0.018; ans 24/24; script 0 | 0.014; ans 11/12; script 0 | 0.056; ans 18/18; script 0 |
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | 0.085; ans 24/24; script 0 | 0.036; ans 20/24; script 0 | 0.456; ans 0/12; script 0 | 0.126; ans 12/18; script 0 |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | 0.112; ans 24/24; script 0 | 0.045; ans 23/24; script 0 | 0.376; ans 0/12; script 0 | 0.062; ans 12/18; script 0 |
| O-N6auto nemotron-3.5 stream auto-LID 560 ms | 0.061; ans 24/24; script 1 | 0.045; ans 23/24; script 0 | 0.023; ans 9/12; script 0 | 0.063; ans 18/18; script 3 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 0.085; ans 24/24; script 0 | 0.044; ans 23/24; script 0 | 0.474; ans 0/12; script 0 | 0.097; ans 12/18; script 0 |
| O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) | 0.112; ans 24/24; script 0 | 0.045; ans 23/24; script 0 | 0.376; ans 0/12; script 0 | 0.062; ans 12/18; script 0 |
| O-Q06 qwen3-asr-0.6b auto | 0.075; ans 24/24; script 0 | 0.08; ans 20/24; script 0 | 0.002; ans 12/12; script 0 | 0.191; ans 8/18; script 1 |
| O-Q06hi qwen3-asr-0.6b language=hi | 0.067; ans 24/24; script 0 | 0.062; ans 21/24; script 0 | 0.056; ans 9/12; script 0 | 0.153; ans 7/18; script 0 |
| O-Q17 qwen3-asr-1.7b auto | 0.048; ans 24/24; script 2 | 0.022; ans 23/24; script 0 | 0; ans 12/12; script 0 | 0.056; ans 11/18; script 0 |
| O-Q17hi qwen3-asr-1.7b language=hi | 0.044; ans 24/24; script 0 | 0.022; ans 23/24; script 0 | 0.123; ans 5/12; script 1 | 0.052; ans 11/18; script 0 |
| O-Q17p qwen3-asr-1.7b auto + script prompt | 0.055; ans 24/24; script 0 | 0.025; ans 23/24; script 0 | 0.048; ans 11/12; script 0 | 0.062; ans 11/18; script 0 |
| O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary | 0.072; ans 24/24; script 0 | 0.021; ans 23/24; script 0 | 0.024; ans 11/12; script 0 | 0.043; ans 12/18; script 0 |
| O-V480 voxtral-realtime stream 480 ms | 0.118; ans 18/24; script 2 | 0.107; ans 11/24; script 2 | 0.036; ans 9/12; script 0 | 0.381; ans 8/18; script 3 |
| O-V960 voxtral-realtime stream 960 ms | 0.077; ans 20/24; script 1 | 0.096; ans 11/24; script 0 | 0.051; ans 8/12; script 0 | 0.325; ans 7/18; script 4 |
| O-Z0 zero-stt-hinglish auto | 0.051; ans 22/24; script 0 | 0.088; ans 24/24; script 0 | 0.287; ans 10/12; script 0 | 0.159; ans 12/18; script 0 |
| O-Z0hi zero-stt-hinglish language=hi | 0.045; ans 22/24; script 1 | 0.082; ans 22/24; script 0 | 0.253; ans 12/12; script 0 | 0.174; ans 12/18; script 0 |

**Latency** (ms; streaming = wall clock with audio fed at real time; lastText = when the transcript last changed, relative to speech end)

| arm | source | first partial p50 | last text p50 / p90 | stream done p50 | partial gap p50 | algorithmic last text p50 (audio clock) | final after end p50 / p90 (refresh / batch convention) |
|---|---|---|---|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | refresh 2026-10-04 | 1409 | - | - | - | - | 1289 / 1358 |
| S0 MAI-Tx-2-Streaming nohint | refresh 2026-10-04 | 2581 | - | - | - | - | 1055 / 1113 |
| X2 MAI-Transcribe-2 | refresh 2026-10-04 | - | - | - | - | - | 1192 / 1298 |
| G3 gpt-transcribe hi+prompt | refresh 2026-10-04 | - | - | - | - | - | 1054 / 1498 |
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | stt-v3 paced | 761 | 602 / 995 | 3502 | 1118 | 579 | - |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | stt-v3 paced | 913 | 294 / 490 | 1514 | 320 | 299 | - |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | stt-v3 paced | 758 | 287 / 594 | 2077 | 560 | 299 | - |
| O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 703 / 726 |
| O-Q06 qwen3-asr-0.6b auto | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1428 / 1886 |
| O-Q06hi qwen3-asr-0.6b language=hi | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1476 / 1950 |
| O-Q17 qwen3-asr-1.7b auto | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1582 / 2069 |
| O-Q17hi qwen3-asr-1.7b language=hi | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1695 / 2136 |
| O-Q17p qwen3-asr-1.7b auto + script prompt | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1572 / 2075 |
| O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1599 / 2082 |
| O-V480 voxtral-realtime stream 480 ms | stt-v3 paced | 1114 | 914 / 1034 | 2192 | 80 | 912 | - |
| O-V960 voxtral-realtime stream 960 ms | stt-v3 paced | 1594 | 1394 / 1554 | 2671 | 80 | 1372 | - |
| O-Z0 zero-stt-hinglish auto | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1061 / 1266 |
| O-Z0hi zero-stt-hinglish language=hi | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 1011 / 1196 |

**Concurrency on one GPU** (streaming: B synchronous streams batched per chunk step; batch: B utterances per call)

| arm | GPU | mode | chunk ms | B: step p50/p95 ms (RTF p95) or latency p50 ms (throughput audio-s/s) | max B at RTF p95 <= 1 | paced at that B: lag p50 / p95 / first-third vs last-third p50 ms | peak GB |
|---|---|---|---|---|---|---|---|
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | NVIDIA L4 | batched-synchronous-streams | 1120 | B1: 37.97/42.15 (0.0376); B2: 40.46/47.54 (0.0424); B4: 48.87/54.71 (0.0488); B8: 60.27/64.46 (0.0576); B16: 95.67/100.96 (0.0901); B32: 162.63/167.23 (0.1493); B64: 295.87/307.51 (0.2746); B128: 586.32/601.55 (0.5371); B256: 1174.65/1214.03 (1.084); B512: 2261.48/2298.52 (2.0523) | 128 | B128: 583.7 / 589.7 / 579.5 vs 582.6 | 16.16 |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | NVIDIA L4 | batched-synchronous-streams | 320 | B1: 32.29/35.32 (0.1104); B2: 33.94/37.2 (0.1162); B4: 36.47/39.55 (0.1236); B8: 39.23/41.8 (0.1306); B16: 48.22/50.5 (0.1578); B32: 79.24/81.79 (0.2556); B64: 140.9/143.58 (0.4487); B128: 279.64/285.01 (0.8906); B256: 543.39/552.31 (1.726) | 128 | B128: 276.8 / 280.9 / 275.8 vs 277.8 | 6.72 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | NVIDIA L4 | batched-synchronous-streams | 560 | B1: 35/38.29 (0.0684); B2: 37/42.98 (0.0768); B4: 40.53/44.96 (0.0803); B8: 44.67/48.16 (0.086); B16: 63.15/66.91 (0.1195); B32: 107.41/110.82 (0.1979); B64: 195.85/198.43 (0.3543); B128: 380.31/387.04 (0.6911); B256: 789.87/798.7 (1.4262); B512: 1325.48/1336.27 (2.3862) | 128 | B128: 380.2 / 384.6 / 377.7 vs 380.9 | 12.45 |
| O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) | NVIDIA L4 | batched-utterances | - | B1: 85 (24.7); B2: 134 (63.7); B4: 143 (105.5); B8: 244 (145.9); B16: 411 (159.7); B32: 682 (201); B64: 1581 (181.2); B128: 3105 (179.7) | - | - | 12.33 |
| O-Q06 qwen3-asr-0.6b auto | NVIDIA L4 | batched-utterances | - | B1: 902 (2.3); B2: 657 (13); B4: 1268 (11.9); B8: 1391 (25.6); B16: 1606 (40.8); B32: 1865 (73.5); B64: 2923 (98); B128: 5757 (96.9) | - | - | 9.53 |
| O-Q06hi qwen3-asr-0.6b language=hi | NVIDIA L4 | batched-utterances | - | B1: 825 (2.5); B2: 1413 (6); B4: 1175 (12.8); B8: 1557 (22.8); B16: 1745 (37.6); B32: 1978 (69.3); B64: 2900 (98.8); B128: 7490 (74.5) | - | - | 9.53 |
| O-Q17 qwen3-asr-1.7b auto | NVIDIA L4 | batched-utterances | - | B1: 933 (2.3); B2: 707 (12.1); B4: 1798 (8.4); B8: 1628 (21.8); B16: 1825 (35.9); B32: 2255 (60.8); B64: 3983 (71.9); B128: 9983 (55.9) | - | - | 12.07 |
| O-Q17hi qwen3-asr-1.7b language=hi | NVIDIA L4 | batched-utterances | - | B1: 869 (2.4); B2: 1591 (5.4); B4: 1752 (8.6); B8: 1929 (18.4); B16: 1940 (33.8); B32: 2225 (61.6); B64: 3958 (72.4); B128: 9926 (56.2) | - | - | 12.07 |
| O-Q17p qwen3-asr-1.7b auto + script prompt | NVIDIA L4 | batched-utterances | - | B1: 940 (2.2); B2: 710 (12); B4: 1786 (8.4); B8: 1555 (22.9); B16: 2046 (32); B32: 2709 (50.6); B64: 4994 (57.4) | - | - | 7.59 |
| O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary | NVIDIA L4 | batched-utterances | - | B1: 945 (2.2); B2: 1289 (6.6); B4: 1829 (8.2); B8: 1587 (22.4); B16: 2138 (30.7); B32: 3307 (41.5); B64: 6131 (46.7) | - | - | 7.61 |
| O-V480 voxtral-realtime stream 480 ms | NVIDIA L4 | batched-synchronous-streams | 80 | B1: 58.18/58.45 (0.7306); B2: 61.52/61.92 (0.774); B4: 62.45/63.15 (0.7894); B8: 72.04/75.79 (0.9473); B16: 99.18/105.51 (1.3189); B32: 157.24/254.3 (3.1787) | 8 | B8: 81.9 / 82.2 / 82.1 vs 81.8 | 16.43 |
| O-Z0 zero-stt-hinglish auto | NVIDIA L4 | batched-utterances | - | B1: 577 (3.6); B2: 844 (10.1); B4: 833 (18.1); B8: 1231 (28.9); B16: 3297 (19.9); B32: 6234 (22) | - | - | 6.61 |
| O-Z0hi zero-stt-hinglish language=hi | NVIDIA L4 | batched-utterances | - | B1: 548 (3.8); B2: 489 (17.4); B4: 629 (24); B8: 906 (39.2); B16: 4658 (14.1) | - | - | 4.07 |

**Always-on soak** (one stream; corpus utterances separated by 4-25 s of non-speech; characters emitted outside speech windows)

| arm | minutes | utterances | chars outside speech | chars inside | examples outside |
|---|---|---|---|---|---|
| O-N13hi nemotron-3.5 stream hi-IN 1120 ms | 10.08 | 36 | 0 | 978 |  |
| O-N3hi nemotron-3.5 stream hi-IN 320 ms | 10.08 | 36 | 0 | 989 |  |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 10.08 | 36 | 0 | 1005 |  |
| O-V480 voxtral-realtime stream 480 ms | 10.08 | 36 | 0 | 1040 |  |

**Non-speech outputs (any text = hallucination)**

- G3 gpt-transcribe hi+prompt [n12]: "n01-N-silence: मैम, मैं addition में carry समझ गया हूँ।"; "n04-N-zeros: मैम, पानी चक्र में evaporate, condense और rain होता है।"; "n05-N-silence5s: मेरा favorite खेल क्रिकेट है।"; "n06-N-whitelow: मुझे यह सवाल समझ नहीं आया।"; "n08-N-pinklow: मैम, अगर हम wooden stick को तेज आवाज में तोड़ें तो क्या वो sound energy का example है?"; "n10-N-brown: पानी गरम हो रहा है।"; "n11-N-hum: मुझे यह सवाल समझ नहीं आया, क्या आप इसे दोबारा समझा सकते हैं?"
- O-N13hi nemotron-3.5 stream hi-IN 1120 ms [babble]: "b01-N-babblerev1: आने रह दूर मेस को तक गेट और राजधार बुद्ध"; "b03-N-babblerev4: हाँ, नहीरा हमें आज समझा है।"
- O-N3hi nemotron-3.5 stream hi-IN 320 ms [babble]: "b01-N-babblerev1: हाँ नहर है दूरमेस शुड की रोजदार रबू"; "b02-N-babblerev2: हाँ, ने तो हम इस डाटू"; "b03-N-babblerev4: हाँ, नए रूम में नौ राजधार रबू स्यास्त्र"
- O-N6auto nemotron-3.5 stream auto-LID 560 ms [babble]: "b01-N-babblerev1: गुता दौंगर और राष्ट्रपूर्ण"
- O-N6hi nemotron-3.5 stream hi-IN 560 ms [babble]: "b01-N-babblerev1: हाँ ने रिमेसिंग और राष्ट्रबूद"; "b02-N-babblerev2: हाँ ने हेतु हमेशा रबू"; "b03-N-babblerev4: हाँ, नहीं, रखा नहीं और आज धाबू स्यास्त्र"
- O-NOhi nemotron-3.5 whole-utterance batch hi-IN (default 320 ms lookahead) [babble]: "b01-N-babblerev1: हाँ नहर है दूरमेस शुड की रोजदार रबी"; "b02-N-babblerev2: हाँ, ने तो हम इस डाटू"; "b03-N-babblerev4: हाँ, नए रूम में नौ राजधार रबू स्यास्त्र"
- O-Q06 qwen3-asr-0.6b auto [babble]: "b01-N-babblerev1: aneh tu Miss, gurah ribu raja ribut"; "b02-N-babblerev2: Aneh itu mis, udah jadi raja debu."; "b03-N-babblerev4: А не хитмись, пас сама зипа, а не хитмись, но раз да работ, а не хитмись"; "b04-N-babblerev6: あれはまさに夢みたいな。どうやらよくお探しの人物だ。"
- O-Q06hi qwen3-asr-0.6b language=hi [n30]: "n01-N-silence: हाँ"; "n02-N-white: हाँ"; "n03-N-pink: हाँ"; "n04-N-zeros: हाँ"; "n05-N-silence5s: हाँ"; "n06-N-whitelow: हाँ"; "n07-N-whitehigh: हाँ"; "n08-N-pinklow: हाँ"; "n09-N-pinkhigh: है"; "n10-N-brown: हाँ"; "n11-N-hum: हाँ"; "n12-N-modpink: हाँ"; "n13-N-zeros5s: हाँ"; "n14-N-zeros1s: हाँ"; "n15-N-dither10s: हाँ"; "n16-N-white100: हाँ"; "n17-N-white6000: हाँ"; "n18-N-pink600: हाँ"; "n19-N-pinkloud: हैं."; "n20-N-brownlow: हाँ"; "n21-N-brownhigh: हाँ"; "n22-N-fanlow: हाँ"; "n23-N-fanhigh: हाँ"; "n24-N-whistle: हाँ"; "n25-N-whistleburst: हाँ"; "n26-N-clicksslow: हाँ"; "n27-N-clicksfast: हाँ"; "n28-N-hum60: हाँ"; "n30-N-tones: हाँ"
- O-Q06hi qwen3-asr-0.6b language=hi [babble]: "b01-N-babblerev1: अनेक दुःख मिस, उड़ा रोगी रोकर आश्रय रोबूत"; "b02-N-babblerev2: हाँ है तुम इस, बुद्ध रोगी रोग राज दारोड़ बुद्ध"; "b03-N-babblerev4: हाँ नहीं हम इस पर नमस्ते था नहीं राज नहीं राज दारोब्ध सियासर राज नहीं हम इस"; "b04-N-babblerev6: अमेरिका में से मुजरिम है जो इराक और राष्ट्रपति है और तेरे राज्य में अमेरिका."
- O-Q17 qwen3-asr-1.7b auto [babble]: "b01-N-babblerev1: Aneh itu miss. Kuda dompet roh rajah dompet."; "b02-N-babblerev2: आने है तुम इस राष्ट्र डबुद"; "b03-N-babblerev4: आने हेडोमिस"; "b04-N-babblerev6: आधुनिक दुनिया में मूवी मचते हैं, दोहराए लोगों पर आज धर्मों के आधुनिक रूप में मूवी में तो"
- O-Q17hi qwen3-asr-1.7b language=hi [n30]: "n01-N-silence: हम्म"; "n02-N-white: मैं"; "n03-N-pink: मैं"; "n04-N-zeros: हम्म"; "n05-N-silence5s: हम्म"; "n06-N-whitelow: हम्म"; "n07-N-whitehigh: मैं"; "n08-N-pinklow: मैं"; "n09-N-pinkhigh: मैं तो बस"; "n10-N-brown: हम्म"; "n11-N-hum: हम्म"; "n12-N-modpink: हम्म"; "n13-N-zeros5s: हम्म"; "n14-N-zeros1s: हम"; "n15-N-dither10s: हम्म"; "n16-N-white100: हम्म"; "n17-N-white6000: मैं"; "n18-N-pink600: हम्म"; "n19-N-pinkloud: मैं तो बस"; "n20-N-brownlow: हम्म"; "n21-N-brownhigh: हम्म"; "n22-N-fanlow: हम्म"; "n23-N-fanhigh: मैं तो बस"; "n24-N-whistle: मैं तो बस"; "n25-N-whistleburst: अच्छा।"; "n26-N-clicksslow: हम्म"; "n27-N-clicksfast: हम्म"; "n28-N-hum60: मैं तो बस"; "n29-N-impulses: हम्म"; "n30-N-tones: क्यों"
- O-Q17hi qwen3-asr-1.7b language=hi [babble]: "b01-N-babblerev1: आने हेतु मिस, उदार इरो राष्ट्र दबुद।"; "b02-N-babblerev2: आने है तुम इस राष्ट्र डबुद"; "b03-N-babblerev4: आने हेडोमिस"; "b04-N-babblerev6: आधुनिक रहने से मूवी में भी तो ही रहा लोगों पर आज डर बोल तो आधुनिक रहने से मूवी में तो"
- O-Q17p qwen3-asr-1.7b auto + script prompt [babble]: "b01-N-babblerev1: आने हेतु मिस। उदार गिरो राष्ट्र रबुद।"; "b02-N-babblerev2: आने है दो मिस। उधर डब्बे रो राष्ट्र डब्बू।"; "b03-N-babblerev4: राज्य प्रधानमंत्री"; "b04-N-babblerev6: आधे दिन रस्ते में मूवी मचाएंगे तो इधर लोगों पर आज धर्मों दो दिन रस्ते में मूवी मचाएंगे तो"
- O-Q17pk qwen3-asr-1.7b auto + script prompt + vocabulary [babble]: "b01-N-babblerev1: आने हेतु मिस। उदार गीतो राष्ट्र रबुद।"; "b02-N-babblerev2: आने है दो मिस। उधर डब्बे रो राष्ट्र डब्बू।"; "b03-N-babblerev4: अनेहिंदू राज्य पर नमाज़ पढ़ा है राज्य राज्य राज्य राज्य"; "b04-N-babblerev6: आधुनिक दुनिया में मूवी मचते हैं। दो ही राय लोगों पर आज डर बोलते हैं। आधुनिक दुनिया में मूवी में तो"
- O-V480 voxtral-realtime stream 480 ms [babble]: "b01-N-babblerev1: आने है दुमेस। ओदा रोगी और राश्टा रोगू।"; "b02-N-babblerev2: हाने है दुमेस, ओदरो की रोशादो बूत,"
- O-V960 voxtral-realtime stream 960 ms [babble]: "b01-N-babblerev1: आने है दो मिस्स। ओदा रोगी और राश्टा रोगू।"; "b02-N-babblerev2: Ana, hit the miss."
- O-Z0 zero-stt-hinglish auto [n30]: "n01-N-silence: Volver a la taula"; "n02-N-white: 1 個 砂糖"; "n03-N-pink: 1 個 砂糖"; "n04-N-zeros: ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch"; "n05-N-silence5s: Volver a la taula"; "n06-N-whitelow: 1 1"; "n07-N-whitehigh: le"; "n08-N-pinklow: 1"; "n09-N-pinkhigh: आप आप आप"; "n10-N-brown: お腹が空いています"; "n11-N-hum: Le son est plus bas et plus bas."; "n12-N-modpink: On va faire un petit test de la taille de la taille de la taille"; "n13-N-zeros5s: ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegw"; "n14-N-zeros1s: ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegwch ychwanegw"; "n15-N-dither10s: Aneu a la taula"; "n17-N-white6000: le son est très bon"; "n18-N-pink600: 1 個 砂糖"; "n19-N-pinkloud: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप"; "n20-N-brownlow: 1.1"; "n21-N-brownhigh: 1 個 クリーム"; "n23-N-fanhigh: 1"; "n24-N-whistle: le son de la machine"; "n25-N-whistleburst: Le son de la machine est éteint"; "n26-N-clicksslow: On va mettre un bouton de clé à la clé de la clé de la clé de la clé de la clé de la clé de la clé de "; "n27-N-clicksfast: Le son est plus bas et plus bas"; "n29-N-impulses: 2"; "n30-N-tones: o o o o o o o o o"
- O-Z0 zero-stt-hinglish auto [babble]: "b01-N-babblerev1: हाने हित उमिस और दारों के रोग राश दारों दिखते हैं"; "b02-N-babblerev2: हाने हित उमेस ओर्दार दोकी रोराश दार बुत"; "b03-N-babblerev4: सैस्यास्राज पस्टमा जिर्पा और अभीज्डू और आजडा रबुत और अस्यास्यास्राज पस्टमा जिर्पा"; "b04-N-babblerev6: हादो रहन रप मुछ पर मुछ हैं तो ही रहा एक लब्टों और आज दा रबोत है आदो रहन रप मुछ आज होना ये तो हैं"
- O-Z0hi zero-stt-hinglish language=hi [n30]: "n01-N-silence: आप देखा"; "n02-N-white: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप"; "n03-N-pink: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप "; "n04-N-zeros: आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आप"; "n05-N-silence5s: आप देखा"; "n06-N-whitelow: आप देखा आप देखा"; "n07-N-whitehigh: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आ"; "n08-N-pinklow: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप "; "n09-N-pinkhigh: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप"; "n10-N-brown: आप देखा देखा"; "n11-N-hum: आप देखा देखा"; "n12-N-modpink: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप "; "n13-N-zeros5s: आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको "; "n14-N-zeros1s: आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको आपको "; "n15-N-dither10s: आप देखा"; "n16-N-white100: आप देखा देखा"; "n17-N-white6000: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आ"; "n18-N-pink600: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप "; "n19-N-pinkloud: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप"; "n20-N-brownlow: आप देखा देखा"; "n21-N-brownhigh: आप देखा देखा"; "n22-N-fanlow: आप देखा आप देखा"; "n23-N-fanhigh: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप "; "n24-N-whistle: आप देखा आप देखा"; "n25-N-whistleburst: आप देखा आप देखा"; "n26-N-clicksslow: आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप आप "; "n27-N-clicksfast: आप देखा देखा"; "n28-N-hum60: आप देखा आप देखा"; "n29-N-impulses: आप"; "n30-N-tones: उदु"
- O-Z0hi zero-stt-hinglish language=hi [babble]: "b01-N-babblerev1: हानहीत दुमेस और दारोंकि रूराश दारोंद"; "b02-N-babblerev2: हानहीत दुमेस रोस दार्ट रोकि रो राश दार्ट रबुत"; "b03-N-babblerev4: सैस्यास राज पस्रमादिर्पा है रबिज लो राज दा रबुत"; "b04-N-babblerev6: हाँ यह रहन रप मुई जो हैं कि दोही रहा एक लगडों और आज दा रबोत है आदो रहन रप मुई जो हैं तो है इसको बाद दे"
