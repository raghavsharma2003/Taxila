| arm | cerNorm | werNorm | werRaw | keyRecall | numbers (v2) | numbers (R4-fixed) | answers | wrong script | decoys | non-speech n12 | non-speech n30 | babble (reversed speech) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | 0.028 | 0.05 | 0.106 | 0.938 | 92/96 [0.924, 0.978] | 92/96 | 76/78 [0.94, 0.989] | 0 | 0 | 0/12 | - | - |
| S0 MAI-Tx-2-Streaming nohint | 0.021 | 0.049 | 0.114 | 0.936 | 90/96 [0.898, 0.962] | 93/96 | 78/78 [0.979, 1] | 3 | 0 | 0/12 | - | - |
| X2 MAI-Transcribe-2 | 0.017 | 0.046 | 0.103 | 0.936 | 91/96 [0.911, 0.97] | 93/96 | 78/78 [0.979, 1] | 0 | 0 | 0/12 | - | - |
| G3 gpt-transcribe hi+prompt | 0.022 | 0.04 | 0.083 | 0.953 | 94/96 [0.951, 0.991] | 94/96 | 77/78 [0.958, 0.996] | 0 | 0 | 7/12 | - | - |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 0.977 | 1 | 1 | 0 | 0/4 [0, 0.291] | 0/4 | 0/4 [0, 0.291] | 4 | 0 | 2/2 | - | - |
| O-Q06 qwen3-asr-0.6b auto | 3.39 | 1.469 | 1.469 | 0 | 0/4 [0, 0.291] | 0/4 | 0/4 [0, 0.291] | 4 | 0 | 2/2 | - | - |
| O-V480 voxtral-realtime stream 480 ms | 8.144 | 3.171 | 4.007 | 0 | 0/4 [0, 0.291] | 0/4 | 0/4 [0, 0.291] | 1 | 0 | 2/2 | - | - |

| arm | items better / worse vs D4 | mean dCER (arm - D4) | 80% CI | 95% CI |
|---|---|---|---|---|
| S0 MAI-Tx-2-Streaming nohint | 9 / 10 | -0.007 | [-0.017, 0.003] | [-0.022, 0.007] |
| X2 MAI-Transcribe-2 | 11 / 8 | -0.011 | [-0.022, 0.001] | [-0.029, 0.007] |
| G3 gpt-transcribe hi+prompt | 11 / 6 | -0.006 | [-0.013, 0.001] | [-0.017, 0.005] |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 0 / 4 | 0.955 | [0.932, 0.978] | [0.922, 0.988] |
| O-Q06 qwen3-asr-0.6b auto | 0 / 4 | 3.368 | [1.517, 5.218] | [0.809, 6.265] |
| O-V480 voxtral-realtime stream 480 ms | 0 / 4 | 8.122 | [3.632, 12.611] | [0.956, 15.288] |

| arm | clean | white 10 dB | pink 10 dB |
|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | 0.021 / 32/32 | 0.032 / 30/32 | 0.031 / 30/32 |
| S0 MAI-Tx-2-Streaming nohint | 0.017 / 30/32 | 0.027 / 30/32 | 0.019 / 30/32 |
| X2 MAI-Transcribe-2 | 0.011 / 31/32 | 0.02 / 31/32 | 0.021 / 29/32 |
| G3 gpt-transcribe hi+prompt | 0.013 / 31/32 | 0.034 / 32/32 | 0.02 / 31/32 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 1 / 0/2 | 1 / 0/1 | 0.909 / 0/1 |
| O-Q06 qwen3-asr-0.6b auto | 4.363 / 0/2 | 3.833 / 0/1 | 1 / 0/1 |
| O-V480 voxtral-realtime stream 480 ms | 1 / 0/2 | 11.667 / 0/1 | 18.909 / 0/1 |

| arm | hinglish | hindi | english | hesitant |
|---|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | 0.017; ans 24/24; script 0 | 0.031; ans 24/24; script 0 | 0.007; ans 10/12; script 0 | 0.074; ans 18/18; script 0 |
| S0 MAI-Tx-2-Streaming nohint | 0.029; ans 24/24; script 0 | 0.004; ans 24/24; script 0 | 0.002; ans 12/12; script 0 | 0.06; ans 18/18; script 3 |
| X2 MAI-Transcribe-2 | 0.032; ans 24/24; script 0 | 0.004; ans 24/24; script 0 | 0.014; ans 12/12; script 0 | 0.016; ans 18/18; script 0 |
| G3 gpt-transcribe hi+prompt | 0.015; ans 24/24; script 0 | 0.018; ans 24/24; script 0 | 0.014; ans 11/12; script 0 | 0.056; ans 18/18; script 0 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 1; ans 0/1; script 1 | 0.909; ans 0/1; script 1 | 1; ans 0/1; script 1 | 1; ans 0/1; script 1 |
| O-Q06 qwen3-asr-0.6b auto | 0.667; ans 0/1; script 1 | 1; ans 0/1; script 1 | 3.833; ans 0/1; script 1 | 8.059; ans 0/1; script 1 |
| O-V480 voxtral-realtime stream 480 ms | 1; ans 0/1; script 0 | 18.909; ans 0/1; script 0 | 11.667; ans 0/1; script 1 | 1; ans 0/1; script 0 |

**Latency** (ms; streaming = wall clock with audio fed at real time; lastText = when the transcript last changed, relative to speech end)

| arm | source | first partial p50 | last text p50 / p90 | stream done p50 | partial gap p50 | algorithmic last text p50 (audio clock) | final after end p50 / p90 (refresh / batch convention) |
|---|---|---|---|---|---|---|---|
| D4 live-tx kw+prompt (CURRENT) | refresh 2026-10-04 | 1409 | - | - | - | - | 1289 / 1358 |
| S0 MAI-Tx-2-Streaming nohint | refresh 2026-10-04 | 2581 | - | - | - | - | 1055 / 1113 |
| X2 MAI-Transcribe-2 | refresh 2026-10-04 | - | - | - | - | - | 1192 / 1298 |
| G3 gpt-transcribe hi+prompt | refresh 2026-10-04 | - | - | - | - | - | 1054 / 1498 |
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | stt-v3 paced | 381 | -213 / 437 | 8459 | 209 | -1601 | - |
| O-Q06 qwen3-asr-0.6b auto | stt-v3 batch: final = 600 ms endpoint hangover + request time | - | - | - | - | - | 30800 / 31370 |
| O-V480 voxtral-realtime stream 480 ms | stt-v3 paced | 1066 | 15108 / 19754 | 15108 | 256 | 2132 | - |

**Concurrency on one GPU** (streaming: B synchronous streams batched per chunk step; batch: B utterances per call)

| arm | GPU | mode | chunk ms | B: step p50/p95 ms (RTF p95) or latency p50 ms (throughput audio-s/s) | max B at RTF p95 <= 1 | paced at that B: lag p50 / p95 / first-third vs last-third p50 ms | peak GB |
|---|---|---|---|---|---|---|---|
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | ? | batched-synchronous-streams | 560 | B1: 932.98/1180.09 (2.1073) | - | - | - |
| O-V480 voxtral-realtime stream 480 ms | ? | batched-synchronous-streams | 80 | B1: 100.23/190.34 (2.3793); B2: 215.26/305.67 (3.8209) | - | - | - |

**Always-on soak** (one stream; corpus utterances separated by 4-25 s of non-speech; characters emitted outside speech windows)

| arm | minutes | utterances | chars outside speech | chars inside | examples outside |
|---|---|---|---|---|---|
| O-N6hi nemotron-3.5 stream hi-IN 560 ms | 1.05 | 3 | 12 | 0 | 0.49s "掠"; 0.49s "叫"; 0.49s "le"; 0.49s "叫" |

**Non-speech outputs (any text = hallucination)**

- G3 gpt-transcribe hi+prompt [n12]: "n01-N-silence: मैम, मैं addition में carry समझ गया हूँ।"; "n04-N-zeros: मैम, पानी चक्र में evaporate, condense और rain होता है।"; "n05-N-silence5s: मेरा favorite खेल क्रिकेट है।"; "n06-N-whitelow: मुझे यह सवाल समझ नहीं आया।"; "n08-N-pinklow: मैम, अगर हम wooden stick को तेज आवाज में तोड़ें तो क्या वो sound energy का example है?"; "n10-N-brown: पानी गरम हो रहा है।"; "n11-N-hum: मुझे यह सवाल समझ नहीं आया, क्या आप इसे दोबारा समझा सकते हैं?"
- O-N6hi nemotron-3.5 stream hi-IN 560 ms [n12]: "n01-N-silence: 掠掠掠掠掠掠掠掠掠掠叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫톱톱톱톱톱톱톱톱톱톱將將將將將將將將將將將將將將將將將將將將톱톱톱톱톱톱톱톱톱톱將將將將將將將將將將톱톱톱톱톱"; "n12-N-modpink: 掠掠掠掠掠掠掠掠掠掠叫叫叫叫叫叫叫叫叫叫lelelelelelelelelele叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫叫將將將將將將將將將將톱톱톱톱톱톱톱톱톱톱톱톱톱톱톱"
- O-Q06 qwen3-asr-0.6b auto [n12]: "n01-N-silence: >; James loud社保用车用车用车用车用车用车用车用车"; "n12-N-modpink: >; SyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntaxSyntax loud olması服务于"
- O-V480 voxtral-realtime stream 480 ms [n12]: "n01-N-silence: ưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưaưa"; "n12-N-modpink: ưaưaưaưaưaưaưaưaưaưaưaưa photographed photographed photographed photographed photographed photographed ph"
