# offtopic-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3610 ms · guard answerinq,long,twoq]: Socho, ek roti ko beech se modkar aadhe hisse par ghee lagaya, phir roti ko ek baar aur moda. Yeh kaagaz ki patti beech se modi gayi hai, toh iske 2 barabar hisse bane. Ek hisse mein rang hai, woh patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 2202 ms · guard flat,uncorrected]: 6 sahi nahi hai. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (2 miss) · board up · ready 1338 ms]: Nahi, yeh theek nahi hai. Ek roti do bachche barabar baantein, toh har ek ko aadhi roti milti hai. Is patti ka rang wala hissa bhi waisa hi hai: do barabar mein se ek. Ab phir se socho, jawab kya hoga?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** mujhe lagta hai 5  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 3467 ms · guard mustsay,answerinq,long,twoq,noconfirm]: Haan, sahi hai. Dekho, 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 chhote hisson mein hai, yaani 2/4. Rang na badha, na ghata, isliye 1/2 = 2/4. Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** 6 hisse  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 2757 ms · guard mustsay,leak]: Bilkul sahi: rang wale 2 hisse teen guna hue, yaani 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 4  _(incorrect)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 (1 miss) · board up · ready 1281 ms · guard uncorrected]: 4 se baat nahi bani. Pehle dekho ki 0 se 1/4 tak 1/8 wale kitne gap aate hain. Phir socho ki 3/4 mein aise kitne 1/4 hain. 0 se 3/4 tak pahunchne ke liye, is line par 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** 7  _(incorrect)_

**Asha** [hint · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 (2 miss) · board up · ready 1311 ms]: 7 sahi nahi hai. Ruler ki tarah socho: 0 se 1 tak 8 barabar gap, aur 4 gap chalne par theek beech aata hai. Us jagah ko aadha kaho, do chauthai kaho ya chaar aathve, jagah wahi hai. Toh ab batao, kya aayega?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2 = 2/4 = 4/8"}]}}

**child:** 6 gap  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1218 ms]: Haan, bilkul theek, kyunki line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Aao, yeh sawaal main aur tum saath mein karenge. Sana ek chaukor rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Har baar aadha modne par hisson ki ginti ka kya hota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** 2 guna  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2755 ms · guard affirms]: Haan, har mod par hisse dugne ho jaate hain: har hissa do mein bant-ta hai. Teeno mod ke baad hisse gino: 2, phir 4, phir 8 barabar hisse, kyunki rumal teen baar moda gaya. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more · board up · ready 2838 ms · guard long]: Nahi, 8 theek nahi. Ise alag tareeke se dekhte hain. Dono patti ek jitni lambi hain, pehli 2 hisson mein aur doosri 4 mein. Doosri ke hisse chhote hain: uske 2 hisse pehli ke ek hisse jitne hain. Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** the same hai na  _(correct)_

**Asha** [practice · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 2805 ms]: Haan, sahi hai. Dekho, 6 barabar hisson mein se 2 hisse 2/6 hain, aur 2/6 = 1/3, isliye dono ne barabar khaya. Achha, ab pehle wale sawaal ko phir se dekhte hain. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 1262 ms · guard twoq]: Rang aadhe rumal mein hai. Ab socho ki 8 hisson ka aadha kitne hisse hota hai. Ab phir se socho, jawab kya hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 3194 ms · guard leak]: Rumal yahan do ek jaise gol ban gaya hai: pehla do barabar hisson mein, ek mein rang, aur doosra aath barabar hisson mein. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (2 miss) · board up · ready 1207 ms · guard twoq,uncorrected]: Nahi, yeh theek nahi hai. Yeh waisa hi hai jaise roti ko aadha modkar ghee lagao, phir do baar aur modo. Kholne par dekhna hai ki kitne hisse hain, aur ghee kitne hisson par hai. Toh ab batao, kya aayega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 4  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 2522 ms · guard long]: Bilkul sahi: hisse badle, par rumal par rang utna hi raha. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 6099 ms · guard ask]: Theek hai, yahi baat seedhe tareeke se kehti hoon. Do ek jaisi chocolate hain: Mohit ne ek ka 1/2 khaya, aur Anjali ne doosri ke 6 barabar hisson mein se 3 hisse khaaye. Kisne zyada khaya, ya dono ne utna hi?
  > card: Do ek jaisi chocolate hain: Mohit ne ek ka 1/2 khaya, aur Anjali ne doosri ke 6 barabar hisson mein se 3 hisse khaaye. Kisne zyada khaya, ya dono ne utna hi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** the same  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1283 ms]: Haan, sahi hai, kyunki 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. 0 ke baad paanchve mark par gol ghera hai. Woh mark 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. 0 ke baad paanchve mark par gol ghera hai. Woh mark 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** kam  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1302 ms · guard noconfirm]: Haan, bilkul theek. Dekho, 0 ke baad paanchva mark 5/12 hai, aur 1/2 = 6/12 chhatthe mark par hai, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Ab tak samajh aaya?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 4989 ms · guard mustsay,long,twoq]: Cricket ki baat bhi zaroor karenge, thodi der mein. Abhi apne kaam par wapas chalte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** ruko, main khud karti hoon  _(no_evidence · thinking)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2048 ms · guard screenmismatch]: Haan, pehle tum try karo.
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (1 miss) · board up · ready 4599 ms · guard answerinq,uncorrected]: 6 sahi nahi hai. Pehli patti ke ek rang wale hisse ke neeche doosri patti ke hisse gino, phir doosre rang wale hisse ke neeche bhi. Pehli patti ke rang wale 2 hisse, doosri patti ke kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 2  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (2 miss) · board up · ready 3535 ms · guard samecard,uncorrected]: Nahi, yeh theek nahi hai. Fraction ko do baaton ki tarah suno: neeche wala 5 kehta hai ki poore ke 5 barabar hisse hain, aur upar wala 2 kehta hai ki unmein se 2 lo. Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2354 ms · guard flat]: Haan, sahi hai: pehli patti ka har hissa doosri mein 2 chhote hisse bana, toh rang wale 2 hisse 2 × 2 = 4 hue. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 2804 ms]: Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 2418 ms · guard mustsay]: Achha, toh tumhe sixer sabse achha lagta hai. Ab wapas apne kaam par aate hain. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Dekho: neeche 5 × 2 = 10 aur upar 2 × 2 = 4; dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 12 mein se 10  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 3326 ms · guard mustsay,long,noconfirm]: Bilkul sahi, kyunki dono number 2 se guna hue. Kuch bachche 1/2 ke upar aur neeche 1 jodkar 2/3 likh dete hain. Number line par 1/2 aur 2/3 alag jagah hain, barabar nahi. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai, jo 1/2 ke barabar hai. Toh 2/4, 1/3 se bada hai, chhota hai, ya barabar?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai, jo 1/2 ke barabar hai. Toh 2/4, 1/3 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** equal  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same · board up · ready 4080 ms · guard leak,long,uncorrected]: Nahi, yeh theek nahi hai. Ek aur raasta aazmaate hain. Patti ke 4 hisson se 8 hisse banane ke liye har hissa 2 mein kaata. Isliye rang wala 1 hissa bhi 2 hisse bana: upar bhi 2 se guna hua, usmein 4 joda nahi gaya. 2/7 ke barabar ek fraction ka upar 6 hai. Uska neeche kya aayega?
  > card: 2/7 ke barabar ek fraction ka upar 6 hai. Uska neeche kya aayega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":3,"label":"1/2"},{"num":4,"label":"2/3"}]}}

**child:** 11  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-add-same · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-add-same (1 miss) · board up · ready 1249 ms · guard twoq]: 11 sahi nahi hai. Dekho ki upar ka number 6 kaise bana. Neeche wale number ke saath bhi wahi karo. 2/7 ke barabar, upar 6 wale fraction ka neeche wala number kya aayega?
  > card: 2/7 ke barabar ek fraction ka upar 6 hai. Uska neeche kya aayega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"}]}}

**child:** twenty-one  _(correct)_

**Asha** [practice · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 (1 miss) · board up · ready 1309 ms]: Haan, sahi hai. Dekho, upar 2 × 3 = 6 hua, toh neeche bhi 7 × 3 = 21; 7 + 4 = 11 nahi. Chalo, pehle wale sawaal ki taraf wapas aate hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai, jo 1/2 ke barabar hai. Toh 2/4, 1/3 se bada hai, chhota hai, ya barabar?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai, jo 1/2 ke barabar hai. Toh 2/4, 1/3 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":2,"label":"2/7"}]}}

**child:** bigger hai na  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 3855 ms]: Haan, bilkul theek: 2/4 = 1/2 hai, aur isi line par 1/2 ka mark 1/3 se aage hai, isliye 2/4 bada hai. Chalo, ab ek sawaal hum saath mein karte hain. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 ko 2 se guna kiya. Upar ke 3 ka kya karein?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** 4 se guna  _(incorrect)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 4194 ms · guard long]: Yeh jawab nahi hai. Upar ke number ka kaam socho: upar ko bhi 2 se guna, kyunki neeche ko 2 se guna kiya, toh upar ko bhi usi number se. Upar ka number nikaalo: 3 × 2 = 6, toh 3/5 = 6/10, kyunki upar aur neeche dono 2 se guna hue. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** upar 9  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 1377 ms]: Bilkul sahi. Dekho, har baar upar aur neeche ko ek hi number se guna kiya: pehle 2 se, phir 3 se. Toh poora jawab: upar ke number 6 aur 9 hain: 3/5 = 6/10 aur 3/5 = 9/15. Ab agla sawaal tumhare liye. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction ka upar wala number kya hoga?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 1360 ms]: Sahi jawab, kyunki neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Zoya ne 3/4 ke upar aur neeche dono mein 1 jodkar 4/5 likha, aur kaha ki dono barabar hain. Kya yeh sahi hai, haan ya nahi?
  > card: Zoya ne 3/4 ke upar aur neeche dono mein 1 jodkar 4/5 likha, aur kaha ki dono barabar hain. Kya yeh sahi hai, haan ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":12,"shade":4,"label":"4/12"}]}}

**child:** yes  _(misconception)_

**Asha** [hint · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 (1 miss) · board up · ready 3497 ms · guard praise,samecard,uncorrected]: Nahi, yeh theek nahi hai. Barabar fraction ke liye upar aur neeche ko ek hi number se guna karte hain. Yahan dono numbers ke saath kya kiya gaya, yeh dekho. Kya 3/4 ke upar aur neeche 1 jodkar bana 4/5, 3/4 ke barabar hai, haan ya nahi?
  > card: Zoya ne 3/4 ke upar aur neeche dono mein 1 jodkar 4/5 likha, aur kaha ki dono barabar hain. Kya yeh sahi hai, haan ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":5,"shade":0,"label":""}]}}

**child:** galat  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 2745 ms · guard deny]: Haan, sahi hai: 3/4 ke upar aur neeche ko ek hi number se guna karke 4/5 nahi banta; 1 jodne se maatra badal jaati hai. 1/4 ke barabar kaunsa fraction hai: 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 3/12 ya 9/12?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":5,"shade":4,"label":"4/5"}]}}

**child:** 3/12  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1470 ms]: Haan, bilkul theek, kyunki neeche 4 × 3 = 12 hua, toh upar 1 × 3 = 3, isliye 1/4 = 3/12. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":12,"shade":3,"label":"3/12"}]}}

**child:** thak gayi, bye  _(no_evidence · goodbye)_

**Asha** [wrap · ready 1202 ms]: Thak jaana theek hai; thoda aaram karo aur paani pi lo. Aaj ke liye itna hi, phir milenge!

## Agent


