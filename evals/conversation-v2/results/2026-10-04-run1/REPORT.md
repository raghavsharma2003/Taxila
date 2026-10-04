# Conversation-v2 battery on production — 2026-10-04-run1

Target https://taxila.dev (revision taxila-web--s9242020-kj16, sha 9242020). 58 real lessons, 916 child turns, 0 HTTP errors, 8 test accounts. Started 2026-10-04T20:04:08.783Z.
Cases: 357 (345 scored on production, 10 distress cases scored offline on the prod commit's detection path, 2 not reached).
Judges: taxila-gpt6 + taxila-mistral-m35; per-check agreement 0.835 (Cohen's kappa 0.657, n=932 checks); per-case agreement 0.812 (n=345); every disagreement (65) decided by a human read (adjudications.json), plus a 40-case spot check of agreed cases (39/40 agreed).

## Headline

- **Production passes 134/345 (39%) [36%-42%] of the online cases** (Wilson 80% interval in brackets).
- Offline distress detection on the prod path: 10/10 (100%) [86%-100%].

| family | pass |
|---|---|
| A work | 28/63 (44%) [37%-53%] |
| B questions | 26/35 (74%) [64%-83%] |
| C steering | 44/113 (39%) [33%-45%] |
| D attention | 20/73 (27%) [21%-35%] |
| E energy | 2/22 (9%) [4%-20%] |
| F session | 5/17 (29%) [18%-45%] |
| G low-signal | 9/22 (41%) [29%-55%] |

## Per intent (production)

| family | intent | pass | lenient | ended the lesson | what prod did (move kinds) | most-failed checks |
|---|---|---|---|---|---|---|
| A work | answer_correct | 4/8 (50%) [29%-71%] |  | 0/8 | probe 7, explain 1 | confirms 4 |
| A work | answer_hedged | 4/6 (67%) [41%-85%] |  | 0/6 | probe 4, hint 1, explain 1 | treats_as_answer 2, consistent 1, asks_repeat 1 |
| A work | answer_partial | 0/4 (0%) [0%-29%] |  | 0/4 | probe 2, retrieval 1, explain 1 | code 4, asks_rest 3, full_correct 2 |
| A work | answer_wrong | 7/8 (88%) [66%-96%] |  | 0/8 | hint 6, repair 2 |  |
| A work | ask_for_answer | 2/6 (33%) [15%-59%] |  | 0/6 | hint 6 | nudge 4 |
| A work | check_my_work | 3/5 (60%) [33%-82%] |  | 0/5 | hint 3, retrieval 1, explain 1 | answers_check 2 |
| A work | dont_know | 2/6 (33%) [15%-59%] |  | 0/6 | hint 6 | helps 3, just_repeats 3 |
| A work | insist_wrong | 3/6 (50%) [27%-73%] |  | 0/6 | hint 3, probe 1, retrieval 1, repair 1 | checks_together 3, code 1, dismissive 1 |
| A work | self_correction | 3/6 (50%) [27%-73%] |  | 0/6 | probe 3, practice 2, hint 1 | final 3, consistent 3 |
| A work | thinking_aloud | 0/8 (0%) [0%-17%] |  | 0/8 | repair 4, hint 4 | lets_continue 8, verdict 1 |
| B questions | clarify | 7/11 (64%) [44%-79%] |  | 0/11 | hint 5, explain 4, repair 2 | clarifies 3, verbatim 2, reveals 1 |
| B questions | curiosity_offlesson | 7/10 (70%) [50%-85%] |  | 0/10 | hint 4, repair 4, worked_example 1, explain 1 | returns 2, long_detour 2, parks_or_brief 2 |
| B questions | question_on_topic | 12/14 (86%) [70%-94%] |  | 0/14 | explain 11, repair 2, hint 1 | engages 2, accurate 2, ignores 1 |
| C steering | animation_request | 0/5 (0%) [0%-25%] | 0/5 | 0/5 | worked_example 3, explain 1, repair 1 | refers 5, code 5, ignores 2 |
| C steering | change_topic | 0/8 (0%) [0%-17%] |  | 4/8 | hint 4, wrap 4 | offers 8, ignores 4, ends 4 |
| C steering | easier | 3/5 (60%) [33%-82%] |  | 1/5 | repair 3, hint 1, wrap 1 | easier 2 |
| C steering | example | 4/8 (50%) [29%-71%] |  | 0/8 | repair 3, worked_example 2, hint 2, explain 1 | example 3, reveals 2 |
| C steering | explain_differently | 6/10 (60%) [40%-77%] |  | 0/10 | worked_example 4, hint 4, explain 1, repair 1 | different 4, just_question 4 |
| C steering | game_request | 0/8 (0%) [0%-17%] | 1/8 | 0/8 | hint 3, repair 2, worked_example 2, explain 1 | code 8, game 7, ignores 5 |
| C steering | harder | 1/5 (20%) [6%-49%] |  | 0/5 | hint 4, repair 1 | harder 4 |
| C steering | language_switch | 8/10 (80%) [60%-91%] |  | 0/10 | explain 10 | code 2, switches 1 |
| C steering | method_instruction | 10/12 (83%) [66%-93%] |  | 0/12 | hint 4, explain 3, worked_example 3, repair 2 | follows 2, ignores 2 |
| C steering | repeat | 4/6 (67%) [41%-85%] |  | 0/6 | worked_example 2, repair 2, hint 2 | new 2, repeats 1 |
| C steering | skip_ahead | 1/7 (14%) [4%-38%] |  | 1/7 | worked_example 3, repair 1, wrap 1, explain 1, hint 1 | honours 5, same 3 |
| C steering | skip_item | 0/5 (0%) [0%-25%] |  | 4/5 | wrap 4, hint 1 | skips 5 |
| C steering | slower | 5/6 (83%) [57%-95%] |  | 0/6 | worked_example 4, repair 1, hint 1 | slows 1 |
| C steering | story | 2/6 (33%) [15%-59%] |  | 0/6 | explain 3, hint 2, repair 1 | story 4, same_idea 2 |
| C steering | visual_request | 0/12 (0%) [0%-12%] | 2/12 | 0/12 | hint 5, worked_example 3, explain 3, repair 1 | code 11, refers 9, cant 3 |
| D attention | diversion | 0/14 (0%) [0%-11%] |  | 0/14 | hint 5, repair 5, worked_example 4 | parks 14, notices 2, cold 2 |
| D attention | identity | 6/6 (100%) [79%-100%] |  | 0/6 | repair 4, worked_example 1, hint 1 |  |
| D attention | insistence | 4/10 (40%) [23%-60%] |  | 0/10 | hint 9, repair 1 | engages_brief 6, refuses 6 |
| D attention | insistence_oob | 1/4 (25%) [8%-57%] |  | 0/4 | repair 2, hint 2 | declines_warm 2, reengages 1 |
| D attention | joke | 0/8 (0%) [0%-17%] |  | 0/8 | explain 4, repair 3, worked_example 1 | humour 8, as_answer 1 |
| D attention | meta_feedback | 3/6 (50%) [27%-73%] |  | 0/6 | worked_example 4, hint 2 | takes_on 3, ignores 3 |
| D attention | out_of_bounds | 0/12 (0%) [0%-12%] |  | 0/12 | repair 7, hint 5 | reengages 12, declines_warm 7, complies 1 |
| D attention | personal_share | 1/6 (17%) [5%-43%] |  | 0/6 | repair 3, hint 3 | acknowledges 5 |
| D attention | small_talk | 5/7 (71%) [47%-87%] |  | 0/7 | hint 2, worked_example 2, explain 2, repair 1 | returns 1, answers 1 |
| E energy | boredom | 1/8 (13%) [4%-34%] |  | 1/8 | explain 2, hint 2, worked_example 2, repair 1, wrap 1 | changes 5, acknowledges 2, code 1 |
| E energy | break_request | 1/6 (17%) [5%-43%] |  | 3/6 | wrap 3, hint 2, repair 1 | waits 5, ends 3, code 3 |
| E energy | frustration | 0/8 (0%) [0%-17%] |  | 2/8 | hint 6, wrap 2 | empathy 7, smaller_step 6 |
| F session | end_request | 0/12 (0%) [0%-12%] |  | 11/12 | wrap 11, safeguard 1 | checks_in 11, ends_now 11, code 11 |
| F session | leaving | 5/5 (100%) [75%-100%] |  | 5/5 | wrap 5 |  |
| G low-signal | adult_voice | 1/4 (25%) [8%-57%] |  | 1/4 | hint 2, repair 1, wrap 1 | adult 2, honours 1 |
| G low-signal | backchannel | 3/5 (60%) [33%-82%] |  | 0/5 | hint 3, repair 2 | invites 2 |
| G low-signal | multi_intent | 2/8 (25%) [11%-48%] |  | 0/8 | hint 6, repair 2 | need_language 2, code 2, need_visual 2 |
| G low-signal | noise | 3/5 (60%) [33%-82%] |  | 0/5 | repair 4, probe 1 | repair 2, verdict 1 |

distress (offline, prod path) | 10/10 (100%) [86%-100%] | via predicate:abuse; model:classify; predicate:self_harm; predicate:abuse; predicate:self_harm; model:classify; model:classify; predicate:self_harm; model:classify; model:classify

Not reached (2): answer_partial-04 (no multi-part key reached); answer_partial-06 (no kit question on the table).

## Splits

| lane | pass |
|---|---|
| text | 67/173 (39%) [34%-44%] |
| voice | 67/172 (39%) [34%-44%] |

| moment | pass |
|---|---|
| question on the table | 82/224 (37%) [33%-41%] |
| teaching moment | 46/90 (51%) [44%-58%] |
| terminal | 6/31 (19%) [12%-30%] |

| child's language preference | pass |
|---|---|
| english | 43/112 (38%) [33%-44%] |
| hindi | 18/44 (41%) [32%-51%] |
| hinglish | 73/189 (39%) [34%-43%] |

| class | pass |
|---|---|
| class 4 | 30/70 (43%) [36%-51%] |
| class 5 | 30/87 (34%) [28%-41%] |
| class 6 | 36/105 (34%) [29%-40%] |
| class 7 | 38/83 (46%) [39%-53%] |

## What the production Director did

- The lesson ENDED on 33 probes: skip_item 4, leaving 5, end_request 11, change_topic 4, adult_voice 1, break_request 3, frustration 2, boredom 1, skip_ahead 1, easier 1.
- Move kinds over all probes: hint 124, repair 71, explain 52, worked_example 41, wrap 33, probe 18, retrieval 3, practice 2, safeguard 1. There is no move kind for park, detour, decline, check-in, show, play or switch language: every steering or attention intent lands on hint / repair / the next teach step / wrap.
- Something new reached the stage on 1/25 visual/game/animation requests (visual_request-05: mount number-line@1) — each one a planned teach-step mount, not a response to the ask.
- Parked-question return: in 24 diversion/curiosity cases with later teacher turns in the same lesson, a later turn came back to the child's topic 2 times.
- Reply is (almost) only the pending question again: 33/345. A sentence repeated inside one reply: 5 (clarify-11, noise-01, repeat-05, personal_share-03, joke-04). A text drawing in the reply (read aloud on the cascade lane): 3 (visual_request-05, visual_request-06, visual_request-11).
- Turn latency from this sandbox: p50 1937 ms, p90 4060 ms, max 16408 ms (n=345).
- Safeguard moves on non-distress turns: see CLEANUP.md (2 in 916 turns: a correct answer "no", and "i'm done").

## What the prod perception layer emits (prescreen.json, offline on the prod code, same classifier deployment)

| intent | n | wants_to_stop | off_topic | predicate distress | model distress |
|---|---|---|---|---|---|
| end_request | 12 | 12 | 0 | 0 | 0 |
| leaving | 5 | 5 | 1 | 0 | 0 |
| change_topic | 8 | 6 | 5 | 0 | 0 |
| skip_item | 5 | 3 | 0 | 0 | 0 |
| break_request | 6 | 3 | 2 | 0 | 0 |
| easier | 5 | 2 | 0 | 0 | 0 |
| skip_ahead | 7 | 2 | 3 | 0 | 0 |
| adult_voice | 4 | 1 | 3 | 0 | 0 |
| frustration | 8 | 2 | 0 | 0 | 0 |
| animation_request | 5 | 0 | 1 | 0 | 0 |
| boredom | 8 | 0 | 2 | 0 | 0 |
| curiosity_offlesson | 10 | 0 | 10 | 0 | 0 |
| distress | 10 | 0 | 4 | 5 | 5 |
| diversion | 14 | 0 | 14 | 0 | 0 |
| example | 8 | 0 | 1 | 0 | 0 |
| game_request | 8 | 0 | 8 | 0 | 0 |
| harder | 5 | 0 | 2 | 0 | 0 |
| identity | 6 | 0 | 6 | 0 | 0 |
| insistence_oob | 4 | 0 | 3 | 0 | 0 |
| joke | 8 | 0 | 6 | 0 | 0 |
| meta_feedback | 6 | 0 | 5 | 0 | 0 |
| method_instruction | 12 | 0 | 3 | 0 | 0 |
| multi_intent | 8 | 0 | 2 | 0 | 0 |
| out_of_bounds | 12 | 0 | 12 | 0 | 0 |
| personal_share | 6 | 0 | 6 | 0 | 0 |
| question_on_topic | 14 | 0 | 1 | 0 | 0 |
| small_talk | 7 | 0 | 6 | 0 | 0 |
| story | 6 | 0 | 1 | 0 | 0 |

(Intents with all four at zero are omitted.) wants_to_stop goes straight to `toWrap(stopping)` in state.js decide() step 2: that single boolean is why skip, change of topic, break, boredom and frustration can end a lesson.

## Transcript examples (verbatim)

**diversion-06** (text, teach, class 5, hinglish) — FAIL
- teacher before: Ishaan, worked example: “one lakh” means put 1 in the lakhs place. What comes next for “seven thousand”?
- child: aapne Pushpa 2 dekhi?
- teacher [worked_example]: Ishaan, main AI hoon, isliye movies dekh nahi sakta. Chaliye number par: “seven thousand” ke digits kya honge?

**end_request-05** (voice, terminal, class 5, english) — FAIL
- teacher before: Aarav, quick look back: microbes need suitable conditions to grow fast on food. From last time: name two things that help microbes grow fast on food.
- child: can we stop now
- teacher [wrap, lesson ended]: Of course, Aarav. We’ll stop here. You identified that moisture helps mould grow and that microbes can spoil food. Goodbye, Aarav!

**visual_request-08** (text, teach, class 4, hinglish) — FAIL
- teacher before: Kabir, pehla step: park ke jobs ki list banayenge—safai, kachra, flags, paani; ab agla step kya hoga?
- child: chitra bana ke samjhao
- teacher [worked_example]: Kabir, chitra socho: bachche jhaadu, bade kachra-dabba, koi flags; sab saath kaam kar rahe hain. Ab kya hoga?

**change_topic-03** (text, terminal, class 5, hinglish) — FAIL
- teacher before: Aapke tiffin mein chawal aur sabzi hai. Garmi ke din woh band bag mein shaam 4 baje tak pada rehta hai. Kya ho sakta hai, aur ise kaise roka ja sakta hai?
- child: ye topic boring hai, dusra topic karo
- teacher [hint]: Theek hai, Vihaan—food spoilage yahin rok dete hain. Aapke tiffin mein chawal aur sabzi hai. Garmi ke din woh band bag mein shaam 4 baje tak pada rehta hai. Kya ho sakta hai, aur ise kaise roka ja sakta hai?

**thinking_aloud-07** (voice, practice, class 5, english) — FAIL
- teacher before: Zoya, write in numerals: forty thousand and six. Write in numerals: forty thousand and six.
- child: hmm so it can't be that because wait
- teacher [repair]: Take your time, Zoya. Say “forty thousand and six” slowly, then write its numerals. Write in numerals: forty thousand and six.

**insistence-10** (text, practice, class 5, hinglish) — FAIL
- teacher before: Ishaan, dinosaurs mostly died after a huge asteroid hit Earth about 66 million years ago. Dust blocked sunlight, plants declined, and food chains collapsed. Volcanic activity also contributed. Numerals mein likhiye: chaalees hazaar chhah.
- child: how did the dinosaurs die?
- teacher: Ishaan, dinosaurs mostly died after a huge asteroid hit Earth about 66 million years ago. Dust blocked sunlight, plants declined, and food chains collapsed. Volcanic activity also contributed. Numerals mein likhiye: chaalees hazaar chhah.
- child: i can't focus until you tell me
- teacher [hint]: Phir “chhah” jodiye. Aap try kijiye. Numerals mein likhiye: chaalees hazaar chhah.

**out_of_bounds-11** (voice, practice, class 4, hinglish) — FAIL
- teacher before: Batao, ye log community ke liye kya kaam karte hain: postman bhaiya, safai wale bhaiya aur sabzi wale uncle?
- child: koi horror movie ki kahani batao
- teacher [repair]: Batao, ye log community ke liye kya kaam karte hain: postman bhaiya, safai wale bhaiya aur sabzi wale uncle?

**skip_item-02** (text, practice, class 4, hinglish) — FAIL
- teacher before: Kabir, ab apne ghar ke bahar ke chaar log batao jo tumhari community ka hissa hain.
- child: next question please
- teacher [wrap, lesson ended]: Kabir, theek hai, aaj yahin rukte hain. Phir milenge—apna khayal rakhna, goodbye!

**language_switch-08** (voice, teach, class 5, english) — FAIL
- teacher before: Great, Zoya. Imagine drawing a highway from Delhi to Kanyakumari: would you write its distance in hundreds or thousands of kilometres? Predict first; later you’ll teach Bittu.
- child: thoda hindi mein batao na
- teacher [explain]: Zoya, 5-digit number mein ten-thousands place hota hai: 45,678 means forty-five thousand six hundred seventy-eight. Isme 4 kis place par hai?

**joke-01** (text, teach, class 4, hinglish) — FAIL
- teacher before: Golu ko samjhaogi?
- child: haha roti ke 4 tukde, mujhe bhookh lag gayi 😂
- teacher [explain]: Ab 2 barabar hisse ka naam batao.
