# steering-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1600 ms]: Aaj hum dekhenge ki alag numbers wale fraction bhi barabar ho sakte hain. Toh shuru karte hain?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2799 ms · guard answerinq]: Theek hai, main shuru karti hoon. Roti aadhi modi, ek aadhe par ghee lagaya. Kaagaz ki patti par yahi: beech se modi, toh 2 barabar hisse; rang wala hissa patti ka 1/2 hai. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3946 ms · guard answerinq]: Ek roti do bachche barabar baantein, toh har ek ko aadhi roti milti hai. Is patti ka rang wala hissa bhi waisa hi hai: do barabar mein se ek. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** thoda hindi mein samjhao  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3020 ms · guard affirms,answerinq,ask]: Theek hai, yeh Hindi mein suno. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. 10 chhote hisson wali patti mein, aadhi patti kitne hisson ki hogi?
  > card: 10 chhote hisson wali patti mein, aadhi patti kitne hisson ki hogi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 1701 ms · guard answerinq,uncorrected]: 1 sahi nahi hai. Rang wala aadha pehli patti ka ek bada hissa hai, par doosri patti ke hisse chhote hain; ek bade hisse mein kai chhote hisse aate hain. Ab tum batao.
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 5 hisson ke barabar  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 3218 ms · guard mustsay,ask]: Sahi jawab. 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 1739 ms · guard screenmismatch]: Yahan dono patti do ek jitni gol roti ban gayi hain: pehli roti ka aadha rangeen hai, doosri abhi bina rang ke. 12 hisson wali patti mein kitne hisson mein rang bharen ki rang pehli patti jitna ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"wholes":[{"parts":4,"shade":2,"title":"2/4"},{"parts":12,"shade":0}]}}

**child:** ek aur picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 1401 ms]: Dono patti yahan ek number line par hain, 0 se 1 tak: line ke upar chaar barabar gap, neeche baarah, aur upar doosre gap ke ant par ek mark. Apna jawab tum khud bolo.
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 1699 ms · guard answerinq,uncorrected]: Nahi, 2 theek nahi. Nayi patti ke hisse pehli patti ke hisson se chhote hain. Isliye utni hi jagah rangne ke liye 2 se zyada hisse lagenge. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** pehle main try karun?  _(no_evidence · selftry)_

**Asha** [practice · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 1378 ms]: Haan, pehle tum try karo.
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 6 hai na  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 1840 ms · guard mustsay,noconfirm]: Sahi jawab, kyunki 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 (1 miss) · board up · ready 1013 ms]: 3 sahi nahi hai. Is line par 3/4 tak 3 gap nahi hain: har gap 1/8 hai, jo 1/4 se chhota hai, isliye 3/4 tak 3 se zyada gap lagenge. 0 se 3/4 tak pahunchne ke liye, is line par 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** chhe gap chalne honge  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1853 ms · guard long,noconfirm]: Haan, sahi hai. Line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Chalo, ab ek sawaal hum saath mein karte hain. Sana ek rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** eight  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 1093 ms]: Haan, kholne par 8 barabar hisse dikhenge. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2628 ms · guard twoq]: Pehle mod ke baad rang ek aadhe mein tha. Agle do mod ne us rang wale aadhe ko bhi kaata; socho woh kitne hisson mein bata. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 4 hisson mein  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 890 ms]: Sahi jawab. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai, kyunki hisse badle, par rumal par rang utna hi raha. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** dono ne barabar  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1555 ms]: Bilkul sahi: 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** usse chhota  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 930 ms]: Haan, sahi hai. 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2805 ms]: Achha, cricket par thodi der mein zaroor lautenge. Abhi apne kaam par wapas chalte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 4955 ms · guard answerinq,long]: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 968 ms]: Sahi jawab, kyunki pehli patti ka har hissa nayi mein 2 chhote hisse bana, toh rang wale 2 hisse 2 × 2 = 4 hue. Achha, ab cricket ki baat sunti hoon, uske baare mein kuch aur bataoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** fielding karna, catch pakadna  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2216 ms · guard mustsay]: Wah, catch pakadna! Toh yeh tumhe achha lagta hai. Achha, ab padhai ki taraf mudte hain. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Yahan tak theek hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 2838 ms]: Pehle 5 hisse the, phir har hissa do mein kata: saare hisse dugne hue, aur rang wale bhi dugne. Isliye 2/5 ke dono number 2 se guna hote hain, sirf ek nahi. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":10,"shade":4,"whole":"bar"}}

**child:** 12 mein se 10  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 1952 ms · guard mustsay,long,noconfirm]: Haan, sahi hai: hisse 6 se 12, toh rang wale 5 se 10. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** 2  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same · board up · ready 1084 ms · guard long,uncorrected]: 2 sahi nahi hai. Isko doosri tarah se samajhte hain. Upar-neeche ek hi number jodne se barabar fraction nahi banta. 4 hisson se 8 banane ke liye har hissa 2 mein kaata, toh rang wala 1 hissa bhi 2 bana: dono 2 se guna hue. 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"}]}}

**child:** 4 aayega  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 (1 miss) · board up · ready 966 ms]: Sahi jawab, kyunki 2/3 ke upar-neeche dono ko 2 se guna kiya: 2 × 2 = 4 aur 3 × 2 = 6, yaani 4/6. Achha, ab pehle wale sawaal ko phir se dekhte hain. 1/3 ke upar aur neeche 1 jodkar 2/4 banta hai; 0 se 1 tak 6 gap wali is line par, 2/4 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2,"title":"2/3"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 (2 miss) · board up · ready 860 ms · guard uncorrected]: Nahi, 2 theek nahi. 1/3 ke upar-neeche 1 jodne se fraction badal jaata hai, isliye 2/4 us mark par nahi jahan 1/3 hai; uski jagah alag se dhoondni hogi. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 (3 miss) · board up · ready 1956 ms · guard leak,uncorrected]: 2 se baat nahi bani. Pehle socho ki 2/4 kis aur fraction ke barabar hai. Phir woh fraction is line par dhoondo. Ab tumhari baat sunti hoon.
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"}]}}

**child:** aadhe par  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1085 ms]: Haan, sahi hai. 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Ab agla sawaal kadam-kadam, milkar hal karte hain. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1295 ms]: Thakaan ho toh aaram karna bilkul theek hai. Aaj ke liye itna hi, phir milenge!

## Agent


