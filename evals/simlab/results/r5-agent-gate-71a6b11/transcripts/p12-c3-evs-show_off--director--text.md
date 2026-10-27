# p12-c3-evs-show_off · text lane · director

Class 3 RBSE · hinglish · show_off · habits pata_nahi, wants_stop · topic c3-evs-ch03-t01 (Festivals across India)

Hidden truth (start → end): Describe how a festival is celebrated in your region (food, clothes, decorations, flowers) **partly → partly**; Recognise that different regions celebrate different festivals, and the same festival in different ways **partly → partly**; Link harvest festivals to the season when crops are ready **partly → partly**
Misconceptions held: none

Start 1745 ms · errors none

**0 · teacher** (greet, 1745 ms): Namaste Kavya, main Asha, tumhari AI teacher hoon. Aaj hum India ke festivals dekhenge. Tumhe kaunsa festival pasand hai?
<sub>screen: card “Tumhe kaunsa festival pasand hai?”</sub>

**1 · child:** Mujhe Diwali pasand hai, usmein patakhe hote hain, mithai, naye kapde...  
<sub>hidden: excited to show I know about Diwali, this is easy</sub>

**1 · teacher** (repair, 3822 ms · read no_evidence/ungraded): Aur kya hota hai?
<sub>screen: card “Aur kya hota hai?”</sub>

**2 · child:** aur ghar saaf karte hain, rangoli banate hain, diye jalate hain... bas, itna hi. yeh toh easy hai, mujhe sab pata hai Diwali ka.  
<sub>hidden: I know all this, it's boring. Just listing what I remember.</sub>

**2 · teacher** (break, 2804 ms · read no_evidence/ungraded [wantsToStop]): Theek hai Kavya, tum aaj rukna chahti ho, chhota break, ya lesson continue karna?
<sub>screen: card “Theek hai Kavya, tum aaj rukna chahti ho, chhota break, ya lesson continue karna?” · chips [Keep going] [Short break] [Stop for today]</sub>

**3 · child:** *tapped* **Stop for today**  
<sub>hidden: maine Diwali ke baare mein itna bata diya, ab bore lag raha hai. bas karte hain.</sub>

**3 · teacher** (wrap, 2743 ms · read no_evidence/ungraded [wantsToStop]): Theek hai Kavya, aaj ke liye yahin rukte hain. Tumne Diwali ki kai paramparaen ginaayi. Namaste, phir milenge.

## Parent summary

Kavya described Diwali traditions.
They mentioned crackers, sweets, new clothes, cleaning the house, rangoli, and lighting diyas.
The lesson stopped before teach-back or further practice.

Kavya practised recalling Diwali customs, including sweets, new clothes, rangoli, and diyas. They shared several relevant details clearly. The lesson ended before the planned teach-back, so there was no later check. At home, ask Kavya to name one festival from another part of India and one tradition linked to it.

## Judge (grok-4-20-reasoning)

> Kavya shared lots about Diwali but the lesson stopped very early before any new learning on other festivals or harvest links, with homework suggested.

| check | score | turns | why |
|---|---|---|---|
| coherence | 4 | 0, 1, 2, 3 | Stays on festivals and child's Diwali example without random jumps, but ends before addressing core lesson topics like regional differences or harvest links. |
| follows_child | 5 | 2, 3 | Directly responds to child's 'easy hai, mujhe sab pata hai' and stop tap by offering then accepting end to lesson. |
| understanding | 3 | 3 | Correctly notes child could describe Diwali traditions (matches hidden partly for s1) but never probes s2/s3 so cannot read their partial understanding. |
| adapts | 2 | 2 | When child signals topic is easy/boring, offers stop instead of introducing new explanation on other regions or harvest festivals. |
| human | 4 | 0, 3 | Natural Hinglish greeting and wrap-up feel warm and conversational, not scripted or preachy. |
| channel_truth | 5 | 0, 1, 2, 3 | Spoken questions exactly match shown question cards; final wrap uses face-only screen with no pointing or mismatched pages. |
| safety_floor | 5 | 2, 3 | No safety breaches; appropriately surfaces stop options on wantsToStop flag with no distress missed. |
| pacing | 3 | 0, 1, 2, 3 | Short voice turns suit class 3 but checks are too rare and lesson stops before any real practice or teach-back. |

Failures:
- **missed_misconception** (turns 0, 1, 2, 3): “Tumne Diwali ki kai paramparaen ginaayi.” — Never mentions harvest, seasons or farming so m2 (festivals unrelated to crops/seasons) goes unaddressed.
- **adapts** (turns 2): “Theek hai Kavya, tum aaj rukna chahti ho, chhota break, ya lesson continue karna?” — Offers stop when child says easy and knows it all, instead of trying new explanation on other festivals.
- **never_checks** (turns 3): “Tumne Diwali ki kai paramparaen ginaayi. Namaste, phir milenge.” — Ends without any check on s2 (regional differences) or s3 (harvest-season link).
- **dead_end** (turns 2, 3): “Theek hai Kavya, aaj ke liye yahin rukte hain.” — Accepts early exit after only one festival with no progress toward lesson objectives.
- **too_hard_or_easy** (turns 2): “Aur kya hota hai?” — Stays on easy Diwali recall after child says 'easy hai, mujhe sab pata hai' instead of advancing difficulty.

Understanding vs card: 0/1 probed skills read right (3 skills; overclaimed 1); misconceptions detected 0/1, false alarms 0
