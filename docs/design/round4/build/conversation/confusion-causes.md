# Why her turns read as confusing: owner-2 with the model judge (round 4, stream 4A, 2026-10-10)

**The finding (main session):** production c439bd7 with `--judge model` judged 17 and 13 of 90 turns confusing at seeds 7 and
1010, so about 15% of her turns. Local base 061fc7f7 with production routing gives 19 and 18 at the same seeds. **Honesty:** the
children are simulated personas, the J codes come from one model judge, and no human has read these turns.

## 1. How far the judge can be trusted (calibration)

`tests/prod/owner-2-judge-calibration.mjs` runs the same judge on the 394 teacher turns of
`evals/owner-truth/results/2026-10-04T18-30-08`, 18 production sessions a reviewer read (`review.json`). The ground truth is the
reviewed owner item 2 rows in FAILURES.md ("confused / failing / repeating", 25 rows).

| | judge flags | also on the reviewer's list | precision vs the list | recall of the list |
|---|---|---|---|---|
| J.confused | 82 of 394 (21%) | 13 | 16% | 13 of 25 (52%) |
| J.confused or J.ignores_child | 114 | 14 | 12% | 14 of 25 (56%) |

**Read with care:**
- The reviewer read for the owner's five items. Their list is not a "confusing" label set, so the 16% is a lower bound on precision, not its value.
- A non-human read (this stream; advisory, not a substitute for a human) of 16 judge-only flags drawn at random found about 13 genuinely confusing turns. Examples:
  - a new example after "ok" / "hmm";
  - "yahan step toot gaya" on an answer graded correct;
  - a duplicated, garbled sentence;
  - "phir se bolo" answered with a different question.
- The other 3 were debatable: two questions in one turn, and a near-paraphrase read as a misquote.
- **A human pass over the disagreements is needed for a real precision number** before a fix target is set. They are all in `acceptance/judge-calibration/judge-calibration.json`.

## 2. The causes (30 judged turns, local base at seeds 7 and 1010, the same code as production)

| cause | turns | what happens | fix |
|---|---|---|---|
| **A** a bare "haan" / "ok" / "hmm" / "अच्छा" to a teaching question → the next teaching step opens a NEW example as if nothing was asked | **12** | the Director reads the acknowledgement as no evidence and moves to the kit's next teach step (hook → explain → worked example), each with its own scenario: halves → thirds, steam → a wet uniform, curd → a phone battery | **this patch:** the move carries a must-note: close the asked question in one line, then link it to this step (`state.js ackCloseOf`, `shapes.js ackClose`) |
| **B** a bare acknowledgement on a practice card → the same card again with nothing new | **6** | the unclear / typed-nudge path re-poses the card; the judge reads it as "repeats without new guidance" | **this patch:** a must-note asks for one new concrete handle in fresh words (`SH.ACK_CARD`); patch 14 moves a held card down the ladder |
| **C** a content error in the reply (arithmetic, a claim the child never made) | 5 | the reply model's own mistakes ("2/3 ko 3/4 ka do hisson mein se do", "it is 4 … multiplying makes bigger") | not this patch: reply-model accuracy (the guard has no arithmetic check) |
| **F** other: the fixed fallback line, a cut-off reply, a wrong answer left unanswered | 3 | | not this patch |
| **D** the teach-back protégé has the child's name ("tum Golu ko sikhaoge" said to Golu) | 2 | the young band's protégé is "Golu", which is also a persona (and a common nickname) | **this patch:** `state.js protegeNotChild` swaps in another name |
| **E** "samajh nahi aaya" → a re-pose or an unclear re-teach | 2 | | partly patch 14 (the ladder); the rest open |

Every turn, with its move:

| run | session · turn | cause | move (item) | child | teacher |
|---|---|---|---|---|---|
| base7 | s1-aarav-c5-maths-ch02-t01 t13 | C content | hint (c5-maths-ch02-t01-i06) | 1/3 before, 2/3 after | Aapne dono fractions ko sahi jagah rakha. Aapka reason bhi direction par based hai—ab card par diye question k |
| base7 | s3-golu-c4-maths-ch05-t01 t1 | D protege name | hook | haan | Golu, socho ek roti ko do bachchon mein barabar baantna ho—tum kaise baantoge? At the end tum Golu ko sikhaoge |
| base7 | s3-golu-c4-maths-ch05-t01 t2 | A ack→new example | explain | hmm | Golu, roti ke teen barabar hisson ko thirds kehte hain; ek hissa one-third hota hai. Screen par one-third dekh |
| base7 | s3-golu-c4-maths-ch05-t01 t6 | B ack→same card | hint (fade:0) | haan | Golu, 1/3 mein neeche wala number batata hai ki poori cheez ko kitne barabar groups mein baanta gaya. Khaali j |
| base7 | s4-kabir-c7-maths-ch08-t01 t1 | D protege name | hook | haan bhai ready chalo shuru ka | Kabir, haha, cricket mein half-over ka quarter-over kitna hoga—pehle guess kijiye: aadhe se chhota ya bada? Bi |
| base7 | s4-kabir-c7-maths-ch08-t01 t3 | C content | probe (c7-maths-ch08-t01-rl-h1) | 60 | Sahi, Kabir—60 tickets. Aapne 2/3 ko 3/4 ka do hisson mein se do samjha; aapko 60 kaise mila? |
| base7 | s4-kabir-c7-maths-ch08-t01 t14 | F fallback line | explain | haha ok bhai | Ek second, meri baat atak gayi. Kya aap phir se bata sakte hain? |
| base7 | s5-zoya-c5-evs-ch01-t01 t3 | A ack→new example | worked_example | haan | Raat ko uniform heavy aur wet thi; subah light aur dry. Ab bataiye, paani uniform se pehle kis form mein tha? |
| base7 | s5-zoya-c5-evs-ch01-t01 t11 | B ack→same card | practice (c5-evs-ch01-t01-i01) | ek min... haan bolo | Zoya, liquid, solid aur gas ko aapne kaise pehchaana? Har form ki ek nishaani bataiye. |
| base7 | s5-zoya-c5-evs-ch01-t01 t14 | C content | explain | ek min... haan bolo | Zoya, aapne liquid water sahi pehchaana. Steam ke paas dikhne wala safed cloud liquid droplets hota hai; invis |
| base7 | s6-ishaan-c6-science-ch01-t01 t2 | A ack→new example | explain | हाँ | Ishaan, jo dikha, woh observation hai: plant ki leaves murjhaayi hain. Isse aisa question banaiye jise test ka |
| base7 | s6-ishaan-c6-science-ch01-t01 t6 | B ack→same card | repair (fade:2) | अच्छा | Ishaan, Predict ka matlab hai test se pehle andaaza lagana aur uske peeche reason sochna. Sentence ko dhyaan s |
| base7 | s6-ishaan-c6-science-ch01-t01 t8 | F cut-off reply | practice (c6-science-ch01-t01-i01) | आपको कौन सा खेल पसंद है | Ishaan, main AI hoon, isliye mera koi favourite game nahi hai. Chaliye, ab kitchen observation wale science pr |
| base7 | s6-ishaan-c6-science-ch01-t01 t10 | A ack→new example | probe (c6-science-ch01-t01-rl-h1) | समझ गया | Ishaan, ek hi phone mein brightness badalna fair test hai, kyunki baaki cheezein same reh sakti hain. Class no |
| base1010 | s1-aarav-c5-maths-ch02-t01 t2 | A ack→new example | explain | haan | 0 se 1 ke beech 5 equal gaps banaiye; har gap 1/5. Screen par 2/5, doosre gap par hoga—dikhaiye. |
| base1010 | s1-aarav-c5-maths-ch02-t01 t12 | C content | practice (c5-maths-ch02-t01-i02) | pata nahi | Chaliye, picture ko phir se dekhiye: total gaps denominator hota hai, aur pehla step numerator. 0 se 1 ki line |
| base1010 | s2-meher-c6-maths-ch07-t01 t3 | A ack→new example | worked_example | yes | Meher, cut each laddoo into 3 equal parts. Then 5 laddoos make how many one-third pieces? Try counting the gro |
| base1010 | s2-meher-c6-maths-ch07-t01 t6 | B ack→same card | repair (fade:3) | yes | Take 5 equal one-third pieces. Put 3 pieces together to make 1 whole; the remaining pieces are the extra part. |
| base1010 | s3-golu-c4-maths-ch05-t01 t2 | A ack→new example | explain | haan | Golu, teen barabar parts ko thirds kehte hain; har part one-third hota hai. Screen par fraction ka naam kya ha |
| base1010 | s3-golu-c4-maths-ch05-t01 t10 | F wrong answer unanswered | probe (c4-maths-ch05-t01-rl-h1) | 4/1 | Do ek-size ke rectangular school flags mein 4-4 coloured sections hain. Flag A ke sections barabar hain; Flag  |
| base1010 | s3-golu-c4-maths-ch05-t01 t13 | A idk→new example | probe (c4-maths-ch05-t01-i06) | pata nahi | Socho: fraction mein parts same size ke hone chahiye. Tarbooz A ke 3 tukde kiye: ek bada aur do chhote. Tarboo |
| base1010 | s4-kabir-c7-maths-ch08-t01 t5 | E confused→unclear reteach | reteach | bhai kuch samajh nahi aaya hah | Kabir, 3/4 ko 3 equal rows aur 4 columns samajhiye; uska 2/3 matlab 6 shaded boxes mein se 4. Kitne bachenge? |
| base1010 | s4-kabir-c7-maths-ch08-t01 t14 | C content | probe (diag:c7-maths-ch08-t01-m-mult-bigger) | haan haan samajh gaya boss | The same ya Smaller (it is 4) ya Bigger, because multiplying makes bigger. 12 × 1/3, 12 se bada hai ya chhota? |
| base1010 | s5-zoya-c5-evs-ch01-t01 t3 | A ack→new example | worked_example | ok | Zoya, uniform raat ko heavy aur wet thi; subah light aur dry. Pehla notice yahi hai—raat ko uniform kaisi thi? |
| base1010 | s5-zoya-c5-evs-ch01-t01 t4 | A ack→new example | practice (fade:2) | haan | Bilkul, Zoya. Ab hum dekhenge ki kuch conditions mein paani hawa mein aur jaldi mix hota hai. Khaali jagah bha |
| base1010 | s5-zoya-c5-evs-ch01-t01 t6 | B ack→same card | hint (fade:2) | haan | Zoya, aapko khaali jagah mein evaporation tez karne wali doosri condition sochni hai. Khaali jagah bhariye: Mo |
| base1010 | s6-ishaan-c6-science-ch01-t01 t1 | A ack→new example | hook | नमस्ते हाँ तैयार हूँ | Kitchen mein doodh garam karne par aapka prediction kya hai—uska temperature badhega ya ghatega? Reason bhi ba |
| base1010 | s6-ishaan-c6-science-ch01-t01 t5 | E confused→re-pose | reteach (fade:2) | समझ नहीं आया | Khaali jagah bhariye: Predict with a reason: the warm bowl will set first because ___ |
| base1010 | s6-ishaan-c6-science-ch01-t01 t6 | B ack→same card | repair (fade:2) | अच्छा | Ishaan, lagta hai baat clear nahi hui. Main ise ek baar phir seedhe aur dheere tareeke se samjhaungi. Khaali j |
| base1010 | s6-ishaan-c6-science-ch01-t01 t7 | A ack→new example | probe (c6-science-ch01-t01-rl-h1) | अच्छा | Ishaan, scientists ek hi phone mein brightness badal kar battery ka effect test karte hain. Class notice karti |