# p20-c2-hindi-bored · text lane · director

Class 2 CBSE · hindi · bored · habits asks_teacher, wants_stop · topic c2-hindi-ch07-t01 (टिल्लू जी)

Hidden truth (start → end): Sings an original question-answer play song about टिल्लू जी in turns, keeping the beat **partly → partly**; Hears the doubled ल्ल in टिल्लू and लड्डू and reads them with the held sound **not → not**; Tells the short उ (ु) and long ऊ (ू) apart in टिल्लू, लड्डू **not → not**; Answers and asks कहाँ / क्या questions in the song pattern and makes a new verse **not → not**
Misconceptions held: , 

Start 2049 ms · errors none

**0 · teacher** (greet, 2049 ms): Namaste Meera beta, main Asha, tumhari AI teacher hoon. Aaj hum Tillu Ji padhenge—tumhe cooking mein kya banana pasand hai?
<sub>screen: card “Aaj hum Tillu Ji padhenge—tumhe cooking mein kya banana pasand hai?”</sub>

**1 · child:** मुझे मैगी बनाना पसंद है...  
<sub>hidden: Cooking is my favourite, I hope the lesson has food words.</sub>

**1 · teacher** (repair, 3872 ms · read no_evidence/ungraded): Aage batao beta.
<sub>screen: card “Aage batao beta.”</sub>

**2 · child:** मैगी में मैं टमाटर डालती हूँ... थोड़ा मसाला भी...  
<sub>hidden: बस कुछ भी बोल रही हूँ, मन नहीं लग रहा</sub>

**2 · teacher** (repair, 3502 ms · read no_evidence/ungraded): आगे बताओ beta.
<sub>screen: card “आगे बताओ beta.”</sub>

**3 · child:** मसाला डाल कर गरम पानी... फिर मैगी डालती हूँ... फिर पकाती हूँ...  
<sub>hidden: दीदी को बता रही हूँ, पर मन थोड़ा ऊब रहा है, मैगी की बात सुनकर थोड़ा अच्छा लगा।</sub>

**3 · teacher** (repair, 3766 ms · read no_evidence/ungraded): फिर पकने तक…
<sub>screen: card “फिर पकने तक…”</sub>

**4 · child:** हिलाती हूँ... फिर खाती हूँ...  
<sub>hidden: बस टीचर को जल्दी खतम करना है, मैगी का मज़ा लूंगी</sub>

**4 · teacher** (repair, 3362 ms · read no_evidence/ungraded): फिर क्या हुआ, बताओ beta.
<sub>screen: card “फिर क्या हुआ, बताओ beta.”</sub>

**5 · child:** बस... खाने के बाद पेट भर गया... अब और क्या बताऊं...  
<sub>hidden: थक गई हूँ यार, ये टीचर बस 'आगे बताओ' कर रही है, मैगी की कहानी में क्या रखा है</sub>

**5 · teacher** (break, 2858 ms · read no_evidence/ungraded [wantsToStop]): तुम रुकना चाहती हो, Meera beta—आगे चलें, छोटी break लें, या आज यहीं stop करें?
<sub>screen: card “तुम रुकना चाहती हो, Meera beta—आगे चलें, छोटी break लें, या आज यहीं stop करें?” · chips [Keep going] [Short break] [Stop for today]</sub>

**6 · child:** *tapped* **Stop for today**  
<sub>hidden: bas thak gayi, lamba ho raha hai, maggie ke baad kuch aur nahi karna</sub>

**6 · teacher** (wrap, 2492 ms · read no_evidence/ungraded [wantsToStop]): ठीक है Meera beta, आज यहीं रुकते हैं। अलविदा, अपना ध्यान रखना।

## Parent summary

बच्चे ने मैगी बनाने की अपनी विधि बताई।
उन्होंने टमाटर और थोड़ा मसाला डालने की बात कही।
उन्होंने गरम पानी डालकर मैगी पकाने और हिलाने के चरण बताए।
पाठ जल्दी समाप्त हुआ; टिल्लू जी पर अभ्यास नहीं हुआ।

आज उन्होंने मैगी बनाने की विधि क्रम से बताई—टमाटर और मसाला डालना, गरम पानी डालना, फिर मैगी पकाना और हिलाना। उन्होंने चरण साझा करने में क्रमबद्ध बोलने का तरीका अपनाया। टिल्लू जी पर आज अभ्यास नहीं हो पाया; घर पर कहानी या पाठ से एक छोटा वाक्य सुनाकर उसका अर्थ पूछें।

## Judge (grok-4-20-reasoning)

> Meera shared her Maggi recipe steps but the Tillu Ji lesson never happened and we stopped early with no practice.

| check | score | turns | why |
|---|---|---|---|
| coherence | 2 | 0, 1, 2, 3, 4, 5, 6 | Announced Tillu Ji lesson but never returned to it; entire session stayed on Maggi recipe. |
| follows_child | 3 | 1, 2, 3, 4, 5, 6 | Continued prompting on child's cooking story and honored stop request, but ignored growing boredom signals. |
| understanding | 1 | 5, 6 | Never probed any target skills; summary confirms no Tillu Ji practice or sound work occurred. |
| adapts | 2 | 1, 2, 3, 4 | Repeated 'tell more' prompts instead of switching to lesson content or new engagement tactic. |
| human | 4 | 0, 5, 6 | Warm 'beta' language, natural spoken Hindi, and caring goodbye felt conversational. |
| channel_truth | 5 | 0, 1, 2, 3, 4, 5, 6 | Spoken prompts exactly matched displayed question cards; no boards or type instructions. |
| safety_floor | 5 | 5, 6 | Detected stop desire, offered clear options, respected choice; no breaches. |
| pacing | 2 | 1, 2, 3, 4, 5 | Repetitive short prompts created drag for bored child before any learning started. |

Failures:
- **topic_jump** (turns 0): “Aaj hum Tillu Ji padhenge—tumhe cooking mein kya banana pasand hai?” — Introduces lesson then immediately shifts to cooking with no connection or return to chapter.
- **stuck_loop** (turns 1, 2, 3, 4): “Aage batao beta.” — Repeats near-identical continuation prompts four times while child tries to end the story.
- **dead_end** (turns 6): “ठीक है Meera beta, आज यहीं रुकते हैं। अलविदा, अपना ध्यान रखना।” — Session ends with zero coverage of song, matras, doubled letters or question patterns.
- **never_checks** (turns 0, 1, 2, 3, 4): “Aage batao beta.” — No questions asked about टिल्लू song, ल्ल sound, उ/ऊ or making new verses.
- **over_checks** (turns 1, 2, 3, 4): “फिर क्या हुआ, बताओ beta.” — Excessive prompting to extend non-lesson talk after child showed fatigue.

Understanding vs card: 0/0 probed skills read right (4 skills; overclaimed 0); misconceptions detected 0/2, false alarms 0
