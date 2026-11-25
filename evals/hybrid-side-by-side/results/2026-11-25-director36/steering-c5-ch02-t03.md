# steering-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1691 ms]: Aaj hum dekhenge ki alag numbers wale fraction bhi barabar ho sakte hain. Toh shuru karte hain?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 2748 ms · guard answerinq,long]: Theek hai, main shuru karti hoon. Roti aadhi modi, ek aadhe par ghee lagaya. Kaagaz ki patti par yahi: beech se modi, toh 2 barabar hisse; rang wala hissa patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 984 ms · guard uncorrected]: 1 sahi nahi hai. Rang wala aadha pehli patti ka ek bada hissa hai, par doosri patti ke hisse chhote hain; ek bade hisse mein kai chhote hisse aate hain. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 1637 ms]: Theek hai, yeh Hindi mein suno. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. 10 chhote hisson wali patti mein, aadhi patti kitne hisson ki hogi?
  > card: 10 chhote hisson wali patti mein, aadhi patti kitne hisson ki hogi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 5 hisson jitna  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 2032 ms · guard mustsay,answerinq,long]: Sahi jawab. 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 1147 ms · guard uncorrected]: Nahi, 2 theek nahi. Nayi patti ke hisse pehli patti ke hisson se chhote hain. Isliye utni hi jagah rangne ke liye 2 se zyada hisse lagenge. 12 hisson wali patti mein kitne hisson mein rang bharen ki rang pehli patti jitna ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 3556 ms · guard answerinq,screenmismatch]: Yahan dono patti do ek jitni gol roti ban gayi hain: pehli roti ka aadha rangeen hai, doosri abhi bina rang ke. Ab tum batao.
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":2,"title":"2/4"},{"parts":12,"shade":0}]}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 2648 ms · guard answerinq]: Dono patti yahan ek number line par hain, 0 se 1 tak: line ke upar chaar barabar gap, neeche baarah, aur upar doosre gap ke ant par ek mark. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (2 miss) · board up · ready 970 ms · guard twoq,uncorrected]: 2 sahi nahi hai. Pehle dekho ki pehli patti ke ek hisse jitni jagah mein nayi patti ke kitne hisse aate hain. Phir rang wale dono hisson jitni jagah mein gino. 12 hisson wali patti mein kitne hisson mein rang bharen ki rang pehli patti jitna ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (2 miss) · board up · ready 1381 ms]: Haan, pehle tum try karo. Apna jawab tum khud bolo.
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 2  _(misconception)_

**Asha** [repair · beat s1:explain:e2 · board up · ready 1242 ms]: Abhi yeh sahi nahi hai. Is sawaal ka jawab 6 hai, kyunki 12 hisse 4 ke teen guna hain, toh rang wale 2 bhi teen guna hue: 2 × 3 = 6. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 3401 ms · guard mustsay,leak]: Achha, cricket par thodi der mein zaroor lautenge. Abhi apne kaam par wapas chalte hain. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** chhe gap chalne honge  _(correct)_

**Asha** [repair · beat s1:explain:e3 · board up · ready 1592 ms]: Sahi jawab, kyunki line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** Virat  _(no_evidence · aside)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 2985 ms · guard wrap]: Achha, toh Virat! Yeh batane ke liye shukriya. Chalo, ab ek sawaal hum saath mein karte hain. Sana ek rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2260 ms · guard quiz]: Kaagaz ko ek baar modkar kholo, aur dekho ki pehle ka ek hissa ab kitne hisson mein bata hai. Ek rumal ko teen baar, har baar aadha moda; kholne par kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2229 ms · guard long]: Har mod par har hissa do mein bant-ta hai, isliye hisse har baar dugne hote hain, aur teen mod ke baad 8 ho jaate hain. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** aadhe hisson mein  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 4326 ms]: Haan, sahi hai. Hisse badle, par rumal par rang utna hi raha. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** both  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1070 ms]: Sahi jawab, kyunki 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** kam  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 918 ms]: Bilkul sahi: 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 3128 ms · guard long]: Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** chaar bata das  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 1521 ms]: Haan, bilkul theek, kyunki har rang wala hissa 2 bana, toh 4. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 10/6  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 3358 ms · guard leak,long,uncorrected]: 10/6 sahi nahi hai. Isko doosri tarah se samajhte hain. Patti ka har hissa 2 mein kaato, toh kul hisse bhi dugne hote hain aur rang wale hisse bhi. Isliye upar aur neeche, dono number 2 se guna hote hain, koi ek nahi. 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** do  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 (1 miss) · board up · ready 750 ms]: Sahi jawab. Neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12. Achha, ab pehle wale sawaal ko phir se dekhte hain. 5/6 ke upar aur neeche ko 2 se guna karne par kaunsa fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":12,"shade":2,"title":"2/12"}]}}

**child:** 10/6  _(misconception)_

**Asha** [hint · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 (2 miss) · board up · ready 1422 ms · guard uncorrected]: Nahi, 10/6 theek nahi. Agar sirf upar ka number badle, toh fraction badal jaata hai. Patti ka har hissa kata hai, isliye kul hisse, yaani neeche wala number, bhi 2 se guna hoga. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 12 mein se 10  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2238 ms · guard mustsay,long,noconfirm]: Haan, sahi hai: hisse 6 se 12, toh rang wale 5 se 10. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** 3/6  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 2573 ms · guard quiz,noconfirm]: Bilkul sahi, kyunki 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Ab agla sawaal kadam-kadam, milkar hal karte hain. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 1173 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


