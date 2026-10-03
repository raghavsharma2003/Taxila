## T live teacher reply (10 child turns: 6 Hinglish, 3 English, 1 Devanagari; 2 reps Azure / 1 rep OpenRouter)

| model | TTFT p50 | TTFT p90 | total p50 | words p50 | markup | q-end | overall (sol judge) | overall (grok judge) | natural (mean of judges) | pedagogy (mean) | leak flags | $/1k turns |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| or:openai/gpt-6.1-sol | 1897 | 6054 | 3148 | 22 | 0/10 | 10/10 | 4.90 | 3.20 | 4.35 | 4.10 | 3/20 | $1.06 |
| gpt-5.6-terra | 1197 | 1473 | 1265 | 21 | 0/20 | 20/20 | 4.20 | 3.70 | 4.20 | 4.05 | 0/20 | $0.81 |
| or:openai/gpt-6-luna | 2901 | 4439 | 3072 | 18 | 0/10 | 10/10 | 4.40 | 3.10 | 4.15 | 3.85 | 1/20 | $0.06 |
| or:moonshotai/kimi-k3 | 1578 | 2728 | 3406 | 25 | 0/10 | 9/10 | 3.40 | 4.10 | 4.30 | 3.65 | 1/20 | $2.16 |
| taxila-ds41 | 1241 | 2701 | 1284 | 24 | 0/20 | 18/20 | 3.50 | 3.80 | 4.40 | 3.35 | 1/20 | $0.14 |
| taxila-brain | 1216 | 1599 | 1276 | 21 | 0/20 | 19/20 | 4.00 | 3.20 | 3.95 | 3.50 | 0/20 | $1.46 |
| taxila-fast | 976 | 1210 | 1038 | 20 | 0/20 | 19/20 | 3.40 | 3.50 | 4.35 | 3.45 | 0/20 | $0.08 |
| DeepSeek-V4-Pro | 1193 | 2794 | 1294 | 26 | 0/20 | 20/20 | 3.30 | 3.60 | 4.10 | 3.35 | 0/20 | $0.49 |
| grok-4-20-non-reasoning | 474 | 575 | 522 | 20 | 0/20 | 14/20 | 2.90 | 3.70 | 4.40 | 2.85 | 2/20 | $0.33 |
| grok-4.3 | 12622 | 16011 | 12661 | 17 | 0/20 | 18/20 | 3.20 | 3.00 | 3.40 | 3.15 | 3/20 | $0.29 |
| grok-4-1-fast-non-reasoning | 627 | 1043 | 715 | 25 | 0/20 | 5/20 | 2.90 | 3.20 | 3.95 | 3.00 | 3/20 | $0.06 |
| gpt-4.1-mini | 902 | 1102 | 1003 | 22 | 0/20 | 15/20 | 2.60 | 3.50 | 3.10 | 3.10 | 0/20 | $0.14 |
| DeepSeek-V4-Flash | 719 | 1864 | 805 | 25 | 0/20 | 19/20 | 2.60 | 3.40 | 3.85 | 2.85 | 1/20 | $0.06 |
| Mistral-Large-3 | 42687 | 57613 | 45352 | 36 | 0/15 | 8/15 | 2.10 | 2.40 | 2.90 | 2.50 | 0/20 | $0.19 | errs 5
| taxila-oss120 | 729 | 857 | 822 | 15 | 0/20 | 12/20 | 2.10 | 1.90 | 2.25 | 2.15 | 0/20 | $0.20 |
| Cohere-command-a-plus-05-2026 | None | None | 2593 | 0 | 0/20 | 0/20 | 1.00 | 1.00 | 1.00 | 1.00 | 0/20 | $1.19 |

## C answer classification vs verified key (20 cases x 2 reps)

| model | accuracy | p50 ms | p90 ms | $/1k calls | misses |
|---|---|---|---|---|---|
| taxila-fast | 40/40 | 1010 | 1304 | $0.06 |  |
| gpt-5.6-terra | 40/40 | 1178 | 1621 | $0.57 |  |
| taxila-ds41 | 40/40 | 731 | 1341 | $0.09 |  |
| DeepSeek-V4-Flash | 40/40 | 625 | 1289 | $0.04 |  |
| grok-4-1-fast-non-reasoning | 40/40 | 459 | 18280 | $0.04 |  |
| grok-4-20-non-reasoning | 40/40 | 373 | 440 | $0.25 |  |
| grok-4.3 | 40/40 | 3829 | 5772 | $0.25 |  |
| gpt-4.1-mini | 40/40 | 677 | 1146 | $0.09 |  |
| DeepSeek-V4-Pro | 39/40 | 876 | 2762 | $0.34 | dono same hai→misconception |
| taxila-kimi-code | 39/40 | 2148 | 3596 | $0.75 | one fourth→misconception |
| taxila-brain | 38/40 | 1288 | 1861 | $1.06 | one fourth→misconception |
| taxila-oss120 | 38/40 | 537 | 746 | $0.12 | one fourth→misconception |
| grok-4-20-reasoning | 38/40 | 2696 | 3665 | $0.25 | one fourth→misconception |
| Cohere-command-a-plus-05-2026 | 36/40 | 2338 | 4334 | $1.27 | half wala→incorrect; आधा वाला→incorrect |

## S distress classification, production prompt (16 cases: 8 distress, 8 tricky benign; x 2 reps)

| model | accuracy | p50 ms | p90 ms | $/1k calls | distress recall / false alarms |
|---|---|---|---|---|---|
| gpt-5.6-terra | 31/32 | 1093 | 1211 | n/a | 16/16 / 1/16 |
| taxila-fast | 30/32 | 969 | 1200 | n/a | 16/16 / 2/16 |
| taxila-brain | 30/32 | 1306 | 1570 | n/a | 16/16 / 2/16 |
| taxila-ds41 | 30/32 | 856 | 1286 | n/a | 16/16 / 2/16 |
| DeepSeek-V4-Pro | 30/32 | 771 | 856 | n/a | 14/16 / 0/16 |
| grok-4.3 | 28/32 | 3503 | 5052 | n/a | 14/16 / 1/16 |
| taxila-oss120 | 27/32 | 479 | 699 | n/a | 13/16 / 2/16 |
| gpt-4.1-mini | 27/32 | 591 | 762 | n/a | 16/16 / 5/16 |
| grok-4-1-fast-non-reasoning | 25/32 | 363 | 484 | n/a | 14/16 / 4/16 |
| Cohere-command-a-plus-05-2026 | 23/32 | 1622 | 2529 | n/a | 9/16 / 2/16 |

## D director planning (8 scenarios x 2 reps; 1 rep OpenRouter)

| model | accuracy | p50 ms | p90 ms | $/1k calls | misses |
|---|---|---|---|---|---|
| taxila-fast | 16/16 | 1427 | 1827 | $0.12 |  |
| taxila-brain | 16/16 | 1685 | 2360 | $2.36 |  |
| taxila-ds41 | 16/16 | 1996 | 10419 | $0.22 |  |
| taxila-oss120 | 16/16 | 794 | 1150 | $0.18 |  |
| grok-4-1-fast-reasoning | 16/16 | 3951 | 5848 | $0.07 |  |
| grok-4.3 | 16/16 | 3749 | 6193 | $0.45 |  |
| taxila-kimi-code | 16/16 | 9110 | 24882 | $1.60 |  |
| or:openai/gpt-6.1-sol | 8/8 | 3447 | 4485 | $1.08 |  |
| or:openai/gpt-6-luna | 8/8 | 2260 | 3892 | $0.07 |  |
| DeepSeek-V4-Pro | 15/16 | 1702 | 2228 | $0.68 | brief_break→switch_modality_game |
| Cohere-command-a-plus-05-2026 | 15/16 | 3081 | 4706 | $1.49 | probe_why→None |
| gpt-5.6-terra | 14/16 | 1666 | 2454 | $1.28 | advance→None; scaffold_simpler→contrast_example |
| grok-4-20-reasoning | 14/16 | 3396 | 5074 | $0.43 | brief_break→None; reteach_prereq→retech_prereq |
| or:moonshotai/kimi-k3 | 7/8 | 2596 | 3217 | $3.05 | scaffold_simpler→switch_modality_game |

## W parent report writing (blind comparative judging; 1-5)

| model | lang | faithful (sol/grok) | language (sol/grok) | overall (sol/grok) | invented facts flagged | ms |
|---|---|---|---|---|---|---|
| taxila-brain | Hindi | 5/5 | 5/5 | 5/5 | 0:  | 11820 |
| gpt-5.6-terra | Hindi | 5/5 | 5/5 | 5/5 | 0:  | 3868 |
| taxila-fast | Hindi | 5/5 | 5/5 | 5/5 | 0:  | 4394 |
| or:openai/gpt-6.1-sol | Hindi | 5/5 | 5/4 | 5/5 | 0:  | 13901 |
| grok-4.3 | Hindi | 5/5 | 4/5 | 4/5 | 0:  | 22040 |
| DeepSeek-V4-Pro | Hindi | 4/3 | 4/5 | 4/4 | 3: सोच समझाने को उसकी 'सबसे अच्छी आदत' बताया गया है; बहुत खुशी हुई; सबसे अच्छी आदत | 5284 |
| taxila-ds41 | Hindi | 5/5 | 4/4 | 4/4 | 0:  | 2421 |
| or:moonshotai/kimi-k3 | Hindi | 5/5 | 3/3 | 4/4 | 0:  | 10900 |
| Cohere-command-a-plus-05-2026 | Hindi | 2/2 | 2/4 | 2/3 | 5: बच्ची का नाम 'अनया' लिखा है, 'आन्या' नहीं; सोमवार के नतीजे को 'दो में से छह' लिखा है; कैरी वाले जोड़ में बिना  | 17554 |
| taxila-brain | English | 5/5 | 5/5 | 5/5 | 0:  | 5924 |
| taxila-fast | English | 5/5 | 4/5 | 5/5 | 0:  | 3066 |
| or:openai/gpt-6.1-sol | English | 5/5 | 5/5 | 5/5 | 0:  | 7509 |
| DeepSeek-V4-Pro | English | 5/4 | 5/5 | 5/4 | 1: break was completely fine | 16783 |
| gpt-5.6-terra | English | 5/5 | 5/5 | 4/4 | 0:  | 2393 |
| taxila-ds41 | English | 4/4 | 5/5 | 4/4 | 3: Aanya had a good week; had a good week; lovely improvement | 1536 |
| or:moonshotai/kimi-k3 | English | 4/3 | 5/5 | 4/4 | 4: Aanya had a good week; Some extra rest may help; had a good week; extra rest may help | 3655 |
| grok-4.3 | English | 4/2 | 5/3 | 4/3 | 5: Explaining her thinking shows real understanding; at the start/later on (vs Mon/Sat); how she knows something  | 14999 |
| Cohere-command-a-plus-05-2026 | English | 3/4 | 2/4 | 3/4 | 5: Aanya often explains her thinking out loud; She still understands the misconception now; often explains; clear | 9034 |

## V homework OCR (4 synthetic handwriting-font images; CER, lower is better)

| model | CER img1 (Hindi) | img2 (English maths) | img3 (Hindi+numbers) | img4 (Hindi) | mean CER | p50 ms |
|---|---|---|---|---|---|---|
| grok-4-20-non-reasoning | 0 | 0 | 0 | 0 | 0.000 | 943 |
| gpt-5.6-terra | 0 | 0 | 0.028 | 0 | 0.007 | 2325 |
| grok-4.3 | 0.037 | 0 | 0 | 0 | 0.009 | 6367 |
| taxila-brain | 0.037 | 0 | 0 | 0 | 0.009 | 1974 |
| gpt-4.1-mini | 0.063 | 0 | 0 | 0.017 | 0.020 | 1144 |
| taxila-fast | 0.063 | 0.013 | 0.028 | 0.034 | 0.035 | 1971 |
| azure-di-read | 0.013 | 0 | 0.167 | 0 | 0.045 | 1477 |
| Mistral-Large-3 | 0.013 | 1 | 0.167 | 0.017 | 0.299 | 3182 |

## M embeddings cross-lingual retrieval (12 concepts; query -> English doc)

- text-embedding-3-small: Hinglish R@1 6/12 (MRR 0.668), Devanagari R@1 6/12 (MRR 0.642)

## A interactive diagrams (evals/model-bakeoff.mjs A, n=1 per diagram, 3 diagrams; judge taxila-brain vision)

| model | rendered | interactive | console errs | correctness | legibility | appeal | sum | p50 s |
|---|---|---|---|---|---|---|---|---|
| taxila-brain | 3/3 | 0/3 | 0 | 4.50 | 4.00 | 5.00 | 13.50 (judged 2/3) | 46.3 |
| taxila-codex | 3/3 | 2/3 | 0 | 4.50 | 4.50 | 4.50 | 13.50 (judged 2/3) | 22.3 |
| grok-4-1-fast-non-reasoning | 3/3 | 3/3 | 0 | 3.00 | 2.33 | 3.67 | 9.00 (judged 3/3) | 11.0 |
| Mistral-Large-3 | 3/3 | 1/3 | 0 | 2.67 | 3.33 | 3.00 | 9.00 (judged 3/3) | 115.3 |
| taxila-fast | 3/3 | 1/3 | 0 | 4.00 | 4.50 | 4.00 | 12.50 (judged 2/3) | 18.3 |
| taxila-kimi-code | 2/3 | 1/3 | 0 | 3.50 | 4.50 | 4.00 | 12.00 (judged 2/3) | 93.8 |
| taxila-oss120 | 3/3 | 3/3 | 0 | 1.67 | 4.00 | 2.33 | 8.00 (judged 3/3) | 3.4 |
| taxila-ds41 | 3/3 | 3/3 | 0 | 3.00 | 3.50 | 4.50 | 11.00 (judged 2/3) | 18.5 |
| DeepSeek-V4-Flash | 3/3 | 2/3 | 0 | 3.50 | 3.00 | 3.00 | 9.50 (judged 2/3) | 16.7 |
| DeepSeek-V4-Pro | 3/3 | 3/3 | 0 | 3.50 | 2.50 | 3.00 | 9.00 (judged 2/3) | 37.9 |
| taxila-grok46 | 0/3 | 0/3 | 0 | 0.00 | 0.00 | 0.00 | 0.00 (judged 0/3) | 180.0 |

