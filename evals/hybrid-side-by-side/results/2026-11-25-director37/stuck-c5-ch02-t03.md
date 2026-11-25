# stuck-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [hook · beat s1:hook:hook · ready 1479 ms]: Aaj hum dekhenge ki alag numbers wale fraction bhi barabar ho sakte hain. Toh shuru karte hain?

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2802 ms]: Achha, pehle main dikhati hoon. Roti aadhi modi, ek aadhe par ghee lagaya. Kaagaz ki patti par yahi: beech se modi, toh 2 barabar hisse; rang wala hissa patti ka 1/2 hai. Yahan tak saaf hai?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** nahi  _(no_evidence)_

**Asha** [practice · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 5564 ms · guard answerinq,long]: Ek roti do bachche barabar baantein, toh har ek ko aadhi roti milti hai. Is patti ka rang wala hissa bhi waisa hi hai: do barabar mein se ek. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 2142 ms · guard answerinq,long,twoq]: Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 2684 ms · guard answerinq,ask]: Achha, ab Hindi mein bolti hoon. 10 chhote hisson wali patti mein, aadhi patti kitne hisson ki hogi?
  > card: 10 chhote hisson wali patti mein, aadhi patti kitne hisson ki hogi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 1608 ms · guard answerinq,long,twoq]: Patti ko beech se moda, toh do barabar hisse bane. Rang ek hisse mein hai, isliye rang aadhi patti par hai. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 5 hisson jitna  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 1920 ms · guard mustsay,answerinq]: Haan, bilkul theek, kyunki 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** chhe  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 1921 ms · guard mustsay,leak,noconfirm]: Sahi jawab. 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 1497 ms · guard screenmismatch]: Yahan line ek patti ban gayi hai: aath barabar hisse, aur pehle aadhe hisson mein rang, theek beech tak. 0 se 3/4 tak pahunchne ke liye, is line par 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 (1 miss) · board up · ready 1054 ms · guard uncorrected]: 3 sahi nahi hai. Is line par 3/4 tak 3 gap nahi hain: har gap 1/8 hai, jo 1/4 se chhota hai, isliye 3/4 tak 3 se zyada gap lagenge. Ab tum batao.
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** chhah  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1902 ms · guard noconfirm]: Haan, sahi hai: line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Aao, yeh sawaal main aur tum saath mein karenge. Sana ek rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [reteach · beat s1:worked:worked:step1 · board up · ready 2643 ms · guard quiz]: Kaagaz ko ek baar modkar kholo, aur dekho ki pehle ka ek hissa ab kitne hisson mein bata hai. Ek rumal ko teen baar, har baar aadha moda; kholne par kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""}]}}

**child:** mujhe nahi pata  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 3118 ms · guard answerinq]: Har mod par har hissa do mein bant-ta hai, isliye hisse har baar dugne hote hain, aur teen mod ke baad 8 ho jaate hain. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2071 ms · guard praise,affirms]: Haan, pehle tum try karo.
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 1215 ms · guard uncorrected]: 8 sahi nahi hai. Kholne par rumal ke kul hisse 8 hain. Par rang modne se phailta nahi: woh sirf usi aadhe ke chhote hisson par rehta hai jismein pehle bhara tha. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (2 miss) · board up · ready 949 ms · guard uncorrected]: Nahi, 8 theek nahi. Pehle mod ke baad rang ek aadhe mein tha. Agle do mod ne us rang wale aadhe ko bhi kaata; socho woh kitne hisson mein bata. Ab phir se socho, jawab kya hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** four  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 798 ms]: Haan, bilkul theek. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai, kyunki hisse badle, par rumal par rang utna hi raha. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** Anjali  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more · board up · ready 2454 ms · guard long,uncorrected]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Dono patti ek jitni lambi hain, pehli 2 hisson mein aur doosri 4 mein. Doosri ke hisse chhote hain: uske 2 hisse pehli ke ek hisse jitne hain. Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more (1 miss) · board up · ready 1855 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Hisse zyada hone se chocolate zyada nahi hoti: chocolate jitne zyada hisson mein kate, har hissa utna chhota. Ek bade hisse ke barabar kitne chhote hisse hain, woh socho. Farhan ke 1/3 aur Zoya ke 6 mein se 2 hisson mein, zyada kisne khaya, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more (2 miss) · board up · ready 1912 ms · guard uncorrected]: Nahi, yeh theek nahi hai. Chocolate ke 6 hisson ke teen barabar dher socho, aur dekho ki ek dher mein kitne hisse aate hain. Apna jawab tum khud bolo.
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more (3 miss) · board up · ready 3650 ms · guard leak,uncorrected]: Nahi, yeh jawab nahi hai. Ek roti ke 2 bade hisse karo, aur waisi hi doosri roti ke 4 chhote. Do chhote hisse milkar ek bada hissa bante hain, roti utni hi rehti hai. Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more (4 miss) · board up · ready 1753 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Board par ungli rakho: neeche wali patti ke hisse gino, jab tak upar wali patti ka pehla hissa khatam na ho. Farhan ke 1/3 aur Zoya ke 6 mein se 2 hisson mein, zyada kisne khaya, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** dono ne barabar khaya  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 (1 miss) · board up · ready 2986 ms · guard long]: Haan, bilkul theek. 2/6 = 1/3 hai: 6 wale do chhote hisse milkar 3 wala ek hissa banate hain, isliye dono ne barabar khaya. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** barabar  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 997 ms]: Sahi jawab, kyunki 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** smaller hai na  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1690 ms · guard noconfirm]: Haan, sahi hai. 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 1983 ms · guard mustsay,long]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · board up · ready 1725 ms · guard drift]: Wah, sixer! Toh tumhara favourite yahi hai. Chalo, jahan the wahin se aage chalte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 1533 ms]: Fraction ko do baaton ki tarah suno: neeche wala 5 kehta hai ki poore ke 5 barabar hisse hain, aur upar wala 2 kehta hai ki unmein se 2 lo. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** phir bhi samajh nahi aaya  _(no_evidence · another)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2826 ms · guard answerinq,long,twoq]: Pehli patti ke ek rang wale hisse ke neeche nayi patti ke hisse gino, phir doosre rang wale hisse ke neeche bhi. Pehli patti ke rang wale 2 hisse, nayi patti ke kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 1034 ms · guard mustsay]: Haan, bilkul theek: har rang wala hissa 2 bana, toh 4. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 10/6  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 2573 ms · guard leak,long,uncorrected]: 10/6 sahi nahi hai. Ek aur raasta aazmaate hain. Patti ka har hissa 2 mein kaato, toh kul hisse bhi dugne hote hain aur rang wale hisse bhi. Isliye upar aur neeche, dono number 2 se guna hote hain, koi ek nahi. 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only (1 miss) · board up · ready 2208 ms · guard leak,uncorrected]: Nahi, 1 theek nahi. 12 hisson wali patti ka ek hissa, 6 hisson wali patti ke ek hisse se chhota hai. Isliye upar 1 hi rakhne se rang kam ho jaata hai. Neeche 12 ho, toh 1/6 ke barabar fraction ka upar wala number kya aayega?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only (2 miss) · board up · ready 1922 ms · guard leak,uncorrected]: 1 se baat nahi bani. Pehle dekho ki 1/6 ka neeche wala number kis number se guna hokar 12 banta hai. Phir upar wale ko bhi usi se guna karo. Ab tumhari baat sunti hoon.
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1}]}}

**child:** upar 2  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 (1 miss) · board up · ready 1876 ms]: Sahi jawab, kyunki neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":12,"shade":2,"title":"2/12"}]}}

**child:** 10 bata 12  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2031 ms · guard mustsay,long]: Haan, bilkul theek. Hisse 6 se 12, toh rang wale 5 se 10. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** 2  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same · board up · ready 1083 ms · guard uncorrected]: 2 sahi nahi hai. Isko doosri tarah se samajhte hain. Upar-neeche ek hi number jodne se barabar fraction nahi banta. 4 hisson se 8 banane ke liye har hissa 2 mein kaata, toh rang wala 1 hissa bhi 2 bana: dono 2 se guna hue. 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"}]}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same (1 miss) · board up · ready 1638 ms]: Nahi, 5 theek nahi. 5/6 mein sirf ek chhota hissa khaali hai, par 2/3 mein ek bada hissa khaali hai. Isliye upar 3 jodne se rang badh gaya. 2/3 ke barabar, neeche 6 wale fraction ka upar wala number kya aayega?
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2}]}}

**child:** 5  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same (2 miss) · board up · ready 1005 ms · guard uncorrected]: 5 se baat nahi bani. 2/3 ke hisson se 6 hisse banane ke liye har hissa kaise kaatna padega, aur tab rang wale hisson ka kya hoga, yeh socho. Ab tum batao.
  > card: 2/3 ke barabar ek fraction ka neeche 6 hai. Uska upar kya aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2}]}}

**child:** upar 4  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 (1 miss) · board up · ready 803 ms]: Sahi jawab, kyunki 2/3 ke upar-neeche dono ko 2 se guna kiya: 2 × 2 = 4 aur 3 × 2 = 6, yaani 4/6. Chalo, pehle wale sawaal ki taraf wapas aate hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":2,"title":"2/3"},{"parts":6,"shade":4,"title":"4/6"}]}}

**child:** 3  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1361 ms · guard noconfirm]: Haan, bilkul theek: 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Chalo, ab ek sawaal hum saath mein karte hain. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · ready 844 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.

## Agent


