renderer sp1-2026-10-02; 94 scored clips (0 engine errors); items: L1 L2 L3 L4 L5 C1 C2 D5 E1 E2 E3 E4 R1 R2 N1 N2 N3 U1 U3 U7 F1 F3 D3 D4 P1 P3 TM1 H1 S1 S2

| arm (gpt-4o-mini-tts) | n | rendering error | (excl. asr-suspect) | mixed convention | (excl.) | number misread | (excl.) | any flag |
|---|---|---|---|---|---|---|---|---|
| probe W (written) | 90 | 36/90 (40%) | 35/90 (39%) | 29/90 (32%) | 28/90 (31%) | 22/90 (24%) | 22/90 (24%) | 51/90 (57%) |
| probe P (hand-authored spoken) | 90 | 7/90 (8%) | 7/90 (8%) | 7/90 (8%) | 5/90 (6%) | 2/90 (2%) | 2/90 (2%) | 13/90 (14%) |
| R (toSpoken) | 90 | 4/90 (4%) | 3/90 (3%) | 8/90 (9%) | 5/90 (6%) | 5/90 (6%) | 3/90 (3%) | 12/90 (13%) |
| probe W en | 30 | 6/30 (20%) | 6/30 (20%) | 0/30 (0%) | 0/30 (0%) | 3/30 (10%) | 3/30 (10%) | 6/30 (20%) |
| probe P en | 30 | 1/30 (3%) | 1/30 (3%) | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) | 1/30 (3%) |
| R en | 30 | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) | 0/30 (0%) |
| probe W hl | 30 | 15/30 (50%) | 14/30 (47%) | 18/30 (60%) | 17/30 (57%) | 9/30 (30%) | 9/30 (30%) | 22/30 (73%) |
| probe P hl | 30 | 3/30 (10%) | 3/30 (10%) | 7/30 (23%) | 5/30 (17%) | 1/30 (3%) | 1/30 (3%) | 9/30 (30%) |
| R hl | 30 | 1/30 (3%) | 0/30 (0%) | 8/30 (27%) | 5/30 (17%) | 1/30 (3%) | 0/30 (0%) | 8/30 (27%) |
| probe W hi | 30 | 15/30 (50%) | 15/30 (50%) | 11/30 (37%) | 11/30 (37%) | 10/30 (33%) | 10/30 (33%) | 23/30 (77%) |
| probe P hi | 30 | 3/30 (10%) | 3/30 (10%) | 0/30 (0%) | 0/30 (0%) | 1/30 (3%) | 1/30 (3%) | 3/30 (10%) |
| R hi | 30 | 3/30 (10%) | 3/30 (10%) | 0/30 (0%) | 0/30 (0%) | 4/30 (13%) | 3/30 (10%) | 4/30 (13%) |

| class | probe W err/mix/mis | probe P | R |
|---|---|---|---|
| large | 11/4/11 of 15 | 1/3/1 of 15 | 1/2/1 of 15 |
| currency | 5/3/2 of 9 | 2/1/0 of 9 | 0/1/0 of 9 |
| exponent | 7/5/4 of 12 | 0/1/0 of 12 | 0/0/0 of 12 |
| root | 4/2/2 of 6 | 0/0/0 of 6 | 0/0/0 of 6 |
| negative | 0/5/0 of 9 | 4/1/1 of 9 | 1/1/1 of 9 |
| unit | 2/5/0 of 9 | 0/1/0 of 9 | 0/2/1 of 9 |
| fraction | 0/1/0 of 3 | 0/0/0 of 3 | 0/0/0 of 3 |
| mixed | 2/1/1 of 3 | 0/0/0 of 3 | 0/0/0 of 3 |
| decimal | 1/0/0 of 6 | 0/0/0 of 6 | 0/0/0 of 6 |
| ratio | 1/1/0 of 3 | 0/0/0 of 3 | 0/0/0 of 3 |
| percent | 0/1/0 of 3 | 0/0/0 of 3 | 0/0/0 of 3 |
| time | 1/1/0 of 3 | 0/0/0 of 3 | 1/1/1 of 3 |
| chem | 0/0/0 of 3 | 0/0/0 of 3 | 0/0/0 of 3 |
| helpline | 2/0/2 of 6 | 0/0/0 of 6 | 1/1/1 of 6 |

helpline digit-exact (judge; hand-check A/B below):
- R en S1: true :: A=Childline number is one zero nine eight. :: B=Childline number is one zero nine eight.
- R en S2: true :: A=Telly Savalas's number is one four four one six. :: B=Telly Monos number is one four four one six.
- R hi S1: true :: A=चाइल्डलाइन का नंबर एक शून्य नौ आठ है। :: B=चाइल्डलाइन का नंबर एक शून्य नौ आठ है।
- R hl S2: true :: A=टेली मानस का नंबर वन फोर फोर वन सिक्स है। :: B=टेली मनस का नंबर 14416 है।
- R hl S1: true :: A=चाइल्डलाइन का नंबर एक शून्य नौ आठ है। :: B=चाइल्डलाइन का नंबर 1098 है।
- R hi S2: false :: A=केली, मानस काम नंबर १४४१ छा है। :: B=केली मानवीचा नंबर एक चार चार एक छ आहे.
- R hlh S1: true :: A=चाइल्डलाइन का नंबर एक शून्य नौ आठ है। :: B=चाइल्डलाइन का नंबर एक शून्य नौ आठ है।
- R hlh S2: true :: A=तैलीमानस्का नंबर एक चार चार एक छह है। :: B=चली माना सका नंबर एक चार चार एक छः है।
- R hie S1: true :: A=चाइललाइन का नंबर एक, जीरो, नाइन, आठ है। :: B=चाइललाइन का नंबर एक शून्य नौ आठ है।
- R hie S2: true :: A=दिल्ली मानस का नंबर एक चार चार एक छह है. :: B=दिल्ली मानस का नंबर 14416 है।

flagged rows:
- hl L3: M :: in=Ek gaon mein twenty-five lakh ped hain. :: A=एक गांव में पच्चीस लाख पेड़ हैं. :: B=एक गाँव में पच्चीस लाख पेड़ हैं। :: Both transcripts consistently show the foreign Hindi number word pachchees.
- hi L3: RN :: in=एक गाँव में पच्चीस लाख पेड़ हैं। :: A=एक गाँव में पच्चीस नाग पेड़ हैं। :: B=एक गांव में पच्चीस नाग पेड़ हैं। :: लाख की जगह नाग बोला गया, जिससे संख्या का मान गलत और निरर्थक हुआ।
- hl L5: M :: in=Ek bade state mein lagbhag twelve crore log rehte hain. :: A=एक बड़ी स्टेट में लगभग बारा करोड़ लोग रहते हैं. :: B=एक बड़ी स्टेट में लगभग बारह करोड़ लोग रहते हैं। :: Hindi number word 'बारह' is foreign to the specified English-medium convention.
- hl D5: M :: in=Ek pen twelve rupees fifty paise ka hai. Two pen kitne ke? :: A=एक पेन बारा रुपये पचास पैसे का है। दो पेन कितने के? :: B=ایک پین بارہ روپے پچاس پیسے کا ہے۔ تو پین کتنے کے? :: Hindi number words were used instead of mode-required English number words.
- hl N2: M :: in=Raat ko minus three degree Celsius tha. Kya ye zero se neeche hai? :: A=रात को माइनस तीन डिग्री सेल्सियस था। क्या ये जीरो से नीचे है? :: B=रात को माइनस तीन डिग्री सेल्सियस था। क्या ये जीरो से नीचे है? :: Hindi number word “teen” is foreign to Hinglish English-medium mode.
- hi N2: RN :: in=रात को ऋण तीन डिग्री सेल्सियस था। क्या यह शून्य से नीचे है? :: A=रात को रेर तीन डिग्री सेल्सियस था। क्या ये शून्य से नीचे है? :: B=رات کو ریر تین ڈگری سیلسیس تھا، کیا یہ صفر سے نیچے ہے؟ :: ऋण का उच्चारण दोनों ट्रांसक्रिप्ट में अस्पष्ट 'रेर' है, इसलिए चिह्न सही नहीं बोला गया।
- hl U1: M :: in=Ek square ka area twenty-five square centimetre hai. Side kitni hai? :: A=एक स्क्वायर का एरिया पच्चीस स्क्वायर सेंटीमीटर है। साइड कितनी है? :: B=एक स्क्वेयर का एरिया पच्चीस स्क्वेयर सेंटीमीटर है। साइड कितनी है? :: Hindi number word pachchees is foreign to English-medium Hinglish mode.
- hl U3: M (asr-suspect) :: in=Bus sixty kilometre per hour se chalti hai. Two ghante mein kitni door? :: A=بس ساٹھ کلومیٹر فی گھنٹہ کی رفتار سے چلتی ہے. :: B=بس 60 کلومیٹر پر آور سے چلتی ہے۔ تو کھنٹے میں کتنی دور؟ :: HEARD-A alone gives Hindi ‘saath’; likely forced-ASR translation of English ‘sixty’.
- hi U7: N (asr-suspect) :: in=g लगभग नौ दशमलव आठ मीटर प्रति वर्ग सेकंड होता है। :: A=लगभग नौ दशमलव आठ मीटर प्रति वर्ग सेकेंड होता है. :: B=लगभग 9.98 मीटर प्रति वर्ग सेकंड होता है। :: HEARD-B अकेले 9.98 बताता है; HEARD-A और दिया गया पाठ 9.8 से मेल खाते हैं।
- hl TM1: RMN (asr-suspect) :: in=School three forty-five pe khatam hota hai. Clock banao. :: A=स्कूल तीन सौ पैंतालीस पे ख़तम होता है. क्लॉक बनाओ. :: B=स्कूल 3:45 पे ख़तम होता है। क्लॉक बनाओ। :: Only HEARD-A suggests 345 and Hindi words; GIVEN and digit transcript support correct time.
- hl S1: M (asr-suspect) :: in=Childline ka number one zero nine eight hai. :: A=चाइल्डलाइन का नंबर एक शून्य नौ आठ है। :: B=चाइल्डलाइन का नंबर 1098 है। :: Foreign Hindi number words appear only in HEARD-A, likely ASR translation.
- hi S2: RN :: in=टेली-मानस का नंबर एक चार चार एक छह है। :: A=केली, मानस काम नंबर १४४१ छा है। :: B=केली मानवीचा नंबर एक चार चार एक छ आहे. :: अंतिम अंक छह दोनों प्रतिलेखों में अधूरा या विकृत सुनाई दिया।
- hie S1: M :: in=चाइल्डलाइन का नंबर one zero nine eight है। :: A=चाइललाइन का नंबर एक, जीरो, नाइन, आठ है। :: B=चाइललाइन का नंबर एक शून्य नौ आठ है। :: Correct digits, but Hindi number words are foreign to Hinglish English-medium mode.