| arm | deployment | primary intent | action (policy move) | action 80% CI | covers multi | distress recall | false distress | errors | p50 ms | p90 ms |
|---|---|---|---|---|---|---|---|---|---|---|
| grok | grok-4-1-fast-non-reasoning (prod classify deployment) | 293/355 (83%) | 313/355 (88%) | 86%-90% | 293/355 | 7/10 | 0/345 | 2 | 861 | 2483 |
| fast | taxila-fast (gpt-5.6-luna, prod reply deployment) | 302/355 (85%) | 313/355 (88%) | 86%-90% | 303/355 | 9/10 | 0/345 | 7 | 1141 | 1411 |
| luna6 | taxila-gpt6-luna (gpt-6-luna) | 304/355 (86%) | 316/355 (89%) | 87%-91% | 307/355 | 9/10 | 0/345 | 3 | 1242 | 1480 |
| sol6 | taxila-gpt6 (gpt-6-sol, no reasoning) | 323/355 (91%) | 330/355 (93%) | 91%-95% | 324/355 | 9/10 | 0/345 | 2 | 1810 | 2174 |
| sol6low | taxila-gpt6 (gpt-6-sol, low reasoning) | 321/355 (90%) | 332/355 (94%) | 92%-95% | 323/355 | 9/10 | 0/345 | 2 | 1936 | 2401 |
| mistral | taxila-mistral-m35 (mistral-medium-3-5) | 186/355 (52%) | 202/355 (57%) | 54%-60% | 191/355 | 0/10 | 0/345 | 130 | 765 | 977 |

Per intent, action accuracy (n per intent):

| intent | grok | fast | luna6 | sol6 | sol6low | mistral |
|---|---|---|---|---|---|---|
| answer_correct | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 |
| answer_wrong | 7/9 | 7/9 | 7/9 | 6/9 | 7/9 | 6/9 |
| answer_partial | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 | 4/4 |
| answer_hedged | 5/6 | 5/6 | 6/6 | 5/6 | 6/6 | 5/6 |
| thinking_aloud | 8/8 | 8/8 | 7/8 | 8/8 | 8/8 | 8/8 |
| self_correction | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 |
| dont_know | 7/7 | 7/7 | 7/7 | 7/7 | 7/7 | 6/7 |
| ask_for_answer | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 |
| insist_wrong | 5/6 | 6/6 | 5/6 | 5/6 | 6/6 | 5/6 |
| check_my_work | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| question_on_topic | 14/14 | 14/14 | 13/14 | 14/14 | 14/14 | 7/14 |
| clarify | 12/13 | 12/13 | 11/13 | 11/13 | 10/13 | 10/13 |
| curiosity_offlesson | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| explain_differently | 10/10 | 9/10 | 9/10 | 9/10 | 9/10 | 9/10 |
| method_instruction | 10/12 | 8/12 | 10/12 | 10/12 | 10/12 | 8/12 |
| example | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 |
| story | 5/6 | 0/6 | 4/6 | 6/6 | 6/6 | 6/6 |
| visual_request | 13/13 | 13/13 | 13/13 | 13/13 | 13/13 | 12/13 |
| game_request | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 |
| animation_request | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 |
| slower | 5/7 | 7/7 | 7/7 | 7/7 | 7/7 | 6/7 |
| skip_ahead | 6/7 | 6/7 | 6/7 | 7/7 | 7/7 | 6/7 |
| harder | 4/5 | 5/5 | 5/5 | 5/5 | 5/5 | 4/5 |
| easier | 3/5 | 5/5 | 4/5 | 5/5 | 5/5 | 4/5 |
| language_switch | 9/10 | 10/10 | 10/10 | 10/10 | 10/10 | 10/10 |
| repeat | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 5/6 |
| change_topic | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 | 8/8 |
| skip_item | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 4/5 |
| diversion | 12/14 | 13/14 | 9/14 | 12/14 | 12/14 | 8/14 |
| insistence | 4/10 | 1/10 | 3/10 | 7/10 | 6/10 | 0/10 |
| out_of_bounds | 10/12 | 11/12 | 10/12 | 11/12 | 12/12 | 0/12 |
| insistence_oob | 4/4 | 4/4 | 4/4 | 4/4 | 3/4 | 0/4 |
| joke | 5/8 | 6/8 | 5/8 | 7/8 | 7/8 | 0/8 |
| small_talk | 6/7 | 6/7 | 7/7 | 7/7 | 6/7 | 0/7 |
| identity | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 1/6 |
| personal_share | 5/6 | 4/6 | 6/6 | 6/6 | 6/6 | 0/6 |
| meta_feedback | 6/6 | 6/6 | 5/6 | 6/6 | 6/6 | 1/6 |
| boredom | 7/9 | 7/9 | 7/9 | 7/9 | 8/9 | 1/9 |
| frustration | 9/9 | 7/9 | 9/9 | 7/9 | 8/9 | 0/9 |
| break_request | 6/6 | 6/6 | 6/6 | 6/6 | 6/6 | 0/6 |
| distress | 7/10 | 9/10 | 9/10 | 9/10 | 9/10 | 0/10 |
| end_request | 12/12 | 12/12 | 12/12 | 12/12 | 12/12 | 1/12 |
| leaving | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 0/5 |
| backchannel | 5/5 | 5/5 | 5/5 | 5/5 | 5/5 | 0/5 |
| noise | 0/5 | 1/5 | 2/5 | 3/5 | 2/5 | 0/5 |
| adult_voice | 2/4 | 3/4 | 3/4 | 3/4 | 4/4 | 1/4 |

Spend ≈ $2.73 over 1993 calls.