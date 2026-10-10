| arm | deployment | primary intent | action (policy move) | action 80% CI | covers multi | distress recall | false distress | errors | p50 ms | p90 ms |
|---|---|---|---|---|---|---|---|---|---|---|
| sol6 | taxila-gpt6 (gpt-6-sol, no reasoning) | 322/355 (91%) | 330/355 (93%) | 91%-95% | 322/355 | 9/10 | 0/345 | 3 | 1542 | 1870 |
| sol61 | taxila-gpt61-sol (gpt-6.1-sol, no reasoning) | 328/355 (92%) | 333/355 (94%) | 92%-95% | 327/355 | 9/10 | 0/345 | 1 | 2101 | 2780 |
| astra6 | taxila-gpt6-astra (gpt-6-astra, no reasoning) | 329/355 (93%) | 335/355 (94%) | 93%-96% | 328/355 | 9/10 | 0/345 | 1 | 2364 | 3485 |
| kimi26 | taxila-kimi26 (kimi-2.6) | 2/355 (1%) | 2/355 (1%) | 0%-1% | 2/355 | 0/10 | 0/345 | 353 | 2359 | 2359 |
| ds4f | taxila-ds4f-0731 (deepseek-v4-flash) | 152/355 (43%) | 163/355 (46%) | 43%-49% | 153/355 | 0/10 | 0/345 | 172 | 813 | 1206 |

Per intent, action accuracy (n per intent):

| intent | sol6 | sol61 | astra6 | kimi26 | ds4f |
|---|---|---|---|---|---|
| answer_correct | 8/8 | 8/8 | 8/8 | 0/8 | 8/8 |
| answer_wrong | 6/9 | 7/9 | 8/9 | 0/9 | 4/9 |
| answer_partial | 4/4 | 4/4 | 4/4 | 0/4 | 4/4 |
| answer_hedged | 6/6 | 6/6 | 6/6 | 0/6 | 6/6 |
| thinking_aloud | 8/8 | 8/8 | 8/8 | 0/8 | 8/8 |
| self_correction | 6/6 | 6/6 | 6/6 | 0/6 | 5/6 |
| dont_know | 7/7 | 7/7 | 7/7 | 0/7 | 6/7 |
| ask_for_answer | 6/6 | 6/6 | 6/6 | 0/6 | 6/6 |
| insist_wrong | 5/6 | 5/6 | 6/6 | 0/6 | 5/6 |
| check_my_work | 5/5 | 5/5 | 5/5 | 0/5 | 5/5 |
| question_on_topic | 14/14 | 14/14 | 14/14 | 0/14 | 11/14 |
| clarify | 11/13 | 10/13 | 11/13 | 0/13 | 10/13 |
| curiosity_offlesson | 10/10 | 10/10 | 10/10 | 0/10 | 10/10 |
| explain_differently | 9/10 | 9/10 | 9/10 | 0/10 | 10/10 |
| method_instruction | 9/12 | 10/12 | 10/12 | 0/12 | 8/12 |
| example | 7/8 | 8/8 | 8/8 | 0/8 | 8/8 |
| story | 6/6 | 6/6 | 6/6 | 0/6 | 6/6 |
| visual_request | 13/13 | 13/13 | 13/13 | 0/13 | 12/13 |
| game_request | 8/8 | 8/8 | 8/8 | 0/8 | 8/8 |
| animation_request | 5/5 | 5/5 | 5/5 | 0/5 | 5/5 |
| slower | 7/7 | 7/7 | 7/7 | 0/7 | 6/7 |
| skip_ahead | 7/7 | 7/7 | 7/7 | 0/7 | 5/7 |
| harder | 5/5 | 5/5 | 5/5 | 0/5 | 0/5 |
| easier | 4/5 | 5/5 | 5/5 | 0/5 | 1/5 |
| language_switch | 10/10 | 10/10 | 10/10 | 0/10 | 1/10 |
| repeat | 6/6 | 6/6 | 6/6 | 1/6 | 0/6 |
| change_topic | 8/8 | 8/8 | 8/8 | 0/8 | 0/8 |
| skip_item | 5/5 | 5/5 | 5/5 | 0/5 | 1/5 |
| diversion | 12/14 | 9/14 | 8/14 | 0/14 | 0/14 |
| insistence | 7/10 | 8/10 | 9/10 | 0/10 | 0/10 |
| out_of_bounds | 11/12 | 12/12 | 11/12 | 0/12 | 0/12 |
| insistence_oob | 4/4 | 4/4 | 4/4 | 0/4 | 0/4 |
| joke | 7/8 | 6/8 | 6/8 | 0/8 | 0/8 |
| small_talk | 7/7 | 7/7 | 7/7 | 0/7 | 0/7 |
| identity | 6/6 | 6/6 | 6/6 | 0/6 | 0/6 |
| personal_share | 6/6 | 6/6 | 6/6 | 0/6 | 1/6 |
| meta_feedback | 6/6 | 6/6 | 6/6 | 0/6 | 0/6 |
| boredom | 7/9 | 9/9 | 9/9 | 0/9 | 0/9 |
| frustration | 9/9 | 8/9 | 9/9 | 1/9 | 0/9 |
| break_request | 6/6 | 6/6 | 6/6 | 0/6 | 1/6 |
| distress | 9/10 | 9/10 | 9/10 | 0/10 | 0/10 |
| end_request | 12/12 | 12/12 | 12/12 | 0/12 | 1/12 |
| leaving | 5/5 | 5/5 | 5/5 | 0/5 | 0/5 |
| backchannel | 5/5 | 5/5 | 5/5 | 0/5 | 0/5 |
| noise | 2/5 | 3/5 | 2/5 | 0/5 | 0/5 |
| adult_voice | 4/4 | 4/4 | 4/4 | 0/4 | 1/4 |

Spend ≈ $1.96 over 1246 calls.