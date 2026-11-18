# steady-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3430 ms · guard mustsay,answerinq,long]: Socho, ek roti ko beech se modkar aadhe hisse par ghee lagaya, phir roti ko ek baar aur moda. Yeh kaagaz ki patti beech se modi gayi hai, toh iske 2 barabar hisse bane. Ek hisse mein rang hai, woh patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 3  _(incorrect)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 1531 ms · guard uncorrected]: 3 sahi nahi hai. Pehli patti ke rang wale hisse ke theek neeche dekho, aur doosri patti ke jo hisse wahan tak aate hain, unhe gino. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** 5 hisse  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 2651 ms · guard mustsay,answerinq,long]: Haan, bilkul theek, kyunki 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 chhote hisson mein hai, yaani 2/4. Rang na badha, na ghata, isliye 1/2 = 2/4. Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 2461 ms · guard answerinq,twoq]: Pehle dekho ki pehli patti ke ek hisse ke neeche doosri patti ke kitne hisse aate hain. Phir rang wale hisson ke neeche dekho. 12 hisson wali patti mein kitne hisson mein rang bharen ki rang pehli patti jitna ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 7  _(incorrect)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 1173 ms]: Yeh jawab sahi nahi hai. Roti ko aadha modo, phir ek baar aur: kholne par 4 barabar hisse milte hain, aur aadhi roti ab 2 hisse hai. Roti utni hi hai, bas hisse chhote ho gaye. Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Doosri patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** 6  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 2615 ms · guard mustsay,leak,twoq]: Sahi jawab. Dekho, rang wale 2 hisse teen guna hue, yaani 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** 6  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1309 ms · guard long]: Haan, sahi hai: line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Ab agla sawaal kadam-kadam, milkar hal karte hain. Sana ek chaukor rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Har baar aadha modne par hisson ki ginti ka kya hota hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** dugni  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 2240 ms · guard affirms]: Haan, har mod par hisse dugne ho jaate hain: har hissa do mein bant-ta hai. Teeno mod ke baad hisse gino: 2, phir 4, phir 8 barabar hisse, kyunki rumal teen baar moda gaya. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""}]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 4031 ms · guard leak]: Rumal yahan do ek jaise gol ban gaya hai: pehla do barabar hisson mein, ek mein rang, aur doosra aath barabar hisson mein. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** mujhe lagta hai 4  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 3950 ms · guard long,noconfirm]: Haan, bilkul theek. Dekho, hisse badle, par rumal par rang utna hi raha. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** Anjali  _(misconception)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more · board up · ready 2243 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Ise alag tareeke se dekhte hain. Dono patti ek jitni lambi hain, pehli 2 hisson mein aur doosri 4 mein. Doosri ke hisse chhote hain: uske 2 hisse pehli ke ek hisse jitne hain. Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** Zoya  _(misconception)_

**Asha** [hint · beat s1:check:then:c5-maths-ch02-t03-m-more-pieces-more · check script:c5-maths-ch02-t03-s1:then:c5-maths-ch02-t03-m-more-pieces-more (1 miss) · board up · ready 2129 ms · guard uncorrected]: Abhi yeh sahi nahi hai. Chocolate ke 6 hisson ke teen barabar dher socho, aur dekho ki ek dher mein kitne hisse aate hain. Farhan ke 1/3 aur Zoya ke 6 mein se 2 hisson mein, zyada kisne khaya, ya barabar?
  > card: Farhan ne chocolate ka 1/3 khaya; Zoya ne waisi chocolate ke 6 barabar hisson mein se 2. Kiska zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** dono ne barabar  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 (1 miss) · board up · ready 3508 ms · guard long,noconfirm]: Sahi jawab, kyunki 6 barabar hisson mein se 2 hisse 2/6 hain, aur 2/6 = 1/3, isliye dono ne barabar khaya. Ab us sawaal par lautte hain jo humne pehle chhoda tha. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 (1 miss) · board up · ready 2335 ms]: Haan, pehle tum try karo.
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":6,"shade":0,"label":""}]}}

**child:** the same  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1193 ms]: Haan, bilkul theek: 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. 0 ke baad paanchve mark par gol ghera hai. Woh mark 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. 0 ke baad paanchve mark par gol ghera hai. Woh mark 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** chhota hai  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 1223 ms]: Haan, sahi hai, kyunki 0 ke baad paanchva mark 5/12 hai, aur 1/2 = 6/12 chhatthe mark par hai, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Yahan tak theek hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [explain · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 3809 ms · guard mustsay,long]: Cricket ki baat bhi zaroor karenge, thodi der mein. Ab yeh kaam poora karte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** hindi mein batao na  _(no_evidence · language)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 4012 ms · guard ask]: Haan, ise doosre shabdon mein samjhaati hoon. Doosri patti bhi utni hi lambi hai, bas uska har hissa 2 chhote hisson mein kata hai. Pehli patti ke 2 rang wale hisse, doosri patti mein kitne chhote hisse ban jaate hain?
  > card: Doosri patti bhi utni hi lambi hai, bas uska har hissa 2 chhote hisson mein kata hai. Pehli patti ke 2 rang wale hisse, doosri patti mein kitne chhote hisse ban jaate hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 6  _(incorrect)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (1 miss) · board up · ready 2910 ms · guard samecard,uncorrected]: 6 sahi nahi hai. Pehli patti ke ek rang wale hisse ke neeche doosri patti ke hisse gino, phir doosre rang wale hisse ke neeche bhi. Pehli patti ke rang wale 2 hisse, doosri patti ke kitne chhote hisse bante hain?
  > card: Doosri patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, doosri patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** chaar  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 1259 ms]: Haan, bilkul theek. Dekho, pehli patti ka har hissa doosri mein 2 chhote hisse bana, toh rang wale 2 hisse 2 × 2 = 4 hue. Yahan tak saaf hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 3758 ms · guard flat]: Jaisa kaha tha, ab cricket par aate hain, uski sabse achhi baat kya hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 3166 ms · guard mustsay]: Achha, toh tumhe sixer sabse achha lagta hai. Ab padhai ki taraf mudte hain. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Dekho: neeche 5 × 2 = 10 aur upar 2 × 2 = 4; dono ek hi number se guna hue. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** 10/6  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 1777 ms · guard long]: Nahi, 10/6 theek nahi. Ek aur raasta aazmaate hain. Patti ka har hissa 2 mein kaato, toh rang wala hissa bhi 2 mein katta hai. Isliye neeche ke saath upar ka number bhi 2 se guna hota hai. Zoya ne 2/6 ke barabar fraction 2/12 likha. Usne kaunsa number guna karna chhod diya: upar wala ya neeche wala?
  > card: Zoya ne 2/6 ke barabar fraction 2/12 likha. Usne kaunsa number guna karna chhod diya: upar wala ya neeche wala?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** neeche wala  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only (1 miss) · board up · ready 2494 ms · guard uncorrected]: Yeh jawab sahi nahi hai. Dekho neeche wala number kaise bada hua. Ab dekho ki upar wale ke saath bhi wahi hua ya nahi. 2/6 se 2/12 banane mein Zoya ne kaunsa number guna nahi kiya, upar wala ya neeche wala?
  > card: Zoya ne 2/6 ke barabar fraction 2/12 likha. Usne kaunsa number guna karna chhod diya: upar wala ya neeche wala?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** top  _(correct)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 (1 miss) · board up · ready 1585 ms]: Haan, bilkul theek: neeche 6 × 2 = 12 hua, par upar ka 2 waisa hi raha; upar 2 × 2 = 4 chahiye tha. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":2,"label":"2/6"},{"parts":12,"shade":4,"label":"4/12"}]}}

**child:** 10 by 12  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 3007 ms · guard mustsay,long]: Sahi jawab, kyunki dono number 2 se guna hue. Kuch bachche 1/2 ke upar aur neeche 1 jodkar 2/3 likh dete hain. Number line par 1/2 aur 2/3 alag jagah hain, barabar nahi. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai, jo 1/2 ke barabar hai. Toh 2/4, 1/3 se bada hai, chhota hai, ya barabar?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai, jo 1/2 ke barabar hai. Toh 2/4, 1/3 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** zyada  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1470 ms]: Haan, sahi hai. Dekho, 2/4 = 1/2 hai, aur isi line par 1/2 ka mark 1/3 se aage hai, isliye 2/4 bada hai. Aao, yeh sawaal main aur tum saath mein karenge. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 ko 2 se guna kiya. Upar ke 3 ka kya karein?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** 3 × 2  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 3020 ms · guard affirms]: Haan, upar ke 3 ko bhi 2 se guna karna hoga. Upar ka number nikaalo: 3 × 2 = 6, toh 3/5 = 6/10, kyunki upar aur neeche dono 2 se guna hue. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** nau  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 1451 ms]: Bilkul sahi: har baar upar aur neeche ko ek hi number se guna kiya: pehle 2 se, phir 3 se. Toh poora jawab: upar ke number 6 aur 9 hain: 3/5 = 6/10 aur 3/5 = 9/15. Ab agla sawaal tumhare liye. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction ka upar wala number kya hoga?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction ka upar wala number kya hoga?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":3,"label":""}]}}

**child:** 4 hai na  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 2810 ms]: Haan, bilkul theek. Dekho, neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Zoya ne 3/4 ke upar aur neeche dono mein 1 jodkar 4/5 likha, aur kaha ki dono barabar hain. Kya yeh sahi hai, haan ya nahi?
  > card: Zoya ne 3/4 ke upar aur neeche dono mein 1 jodkar 4/5 likha, aur kaha ki dono barabar hain. Kya yeh sahi hai, haan ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":1,"label":"1/3"},{"parts":12,"shade":4,"label":"4/12"}]}}

**child:** nahi  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 1379 ms]: Sahi jawab, kyunki 3/4 ke upar aur neeche ko ek hi number se guna karke 4/5 nahi banta; 1 jodne se maatra badal jaati hai. 1/4 ke barabar kaunsa fraction hai: 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 3/12 ya 9/12?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":5,"shade":4,"label":"4/5"}]}}

**child:** pehla  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1599 ms]: Haan, sahi hai: neeche 4 × 3 = 12 hua, toh upar 1 × 3 = 3, isliye 1/4 = 3/12. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak theek hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":1,"label":"1/4"},{"parts":12,"shade":3,"label":"3/12"}]}}

**child:** maine dobara check kiya  _(no_evidence)_

**Asha** [explain · beat s3:explain:e1 · check script:c5-maths-ch02-t03-s3:ask:e1 · board up · ready 3920 ms · guard mustsay,long]: Is number line par 0 se 1 tak 8 barabar gap hain. 6 gap chalkar 6/8 aata hai, aur wahi mark 3/4 bhi hai. Zoya ka kehna hai ki 1/4 aur 2/8 barabar nahi ho sakte, kyunki number alag hain. Isi line ko dekho: kya yeh baat sahi hai, haan ya nahi?
  > card: Zoya ka kehna hai ki 1/4 aur 2/8 barabar nahi ho sakte, kyunki number alag hain. Isi line ko dekho: kya yeh baat sahi hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":6,"label":"3/4 = 6/8"}]}}

**child:** nahi  _(correct)_

**Asha** [explain · beat s3:explain:e2 · check script:c5-maths-ch02-t03-s3:ask:e2 · board up · ready 1841 ms · guard mustsay]: Bilkul sahi. Dekho, 2/8 aur 1/4 ek hi mark par hain. Bina tasveer ke jaanchne ka tareeka: dekho ki upar aur neeche, dono ek hi number se guna hue ya nahi. 2/3 aur 6/9 mein upar 2 × 3 = 6, neeche 3 × 3 = 9, toh 2/3 = 6/9. Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > card: Ab 1/2 aur 5/10 ko isi tarah jaancho. Upar aur neeche, dono kis ek number se guna hue?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":2,"label":"1/4 = 2/8"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** 5 se  _(correct)_

**Asha** [explain · beat s3:explain:e3 · check script:c5-maths-ch02-t03-s3:ask:e3 · board up · ready 1365 ms · guard mustsay,noconfirm]: Haan, bilkul theek: 1 × 5 = 5 aur 2 × 5 = 10. Yeh jaanch nahi bhi bol sakti hai. 2/3 aur 4/9 mein upar 2 × 2 = 4 hua, par neeche 3 × 3 = 9: upar ek number se, neeche doosre se, isliye barabar nahi. Isi tarah jaancho: kya 1/2 aur 2/6 barabar fraction hain, haan ya nahi?
  > card: Isi tarah jaancho: kya 1/2 aur 2/6 barabar fraction hain, haan ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** no  _(correct)_

**Asha** [worked_example · beat s3:worked:worked:step1 · board up · ready 3056 ms · guard math]: Sahi jawab, kyunki upar 1 × 2 = 2 hua par neeche 2 × 3 = 6; ek hi number nahi hai, isliye barabar nahi. Chalo, ab ek sawaal hum saath mein karte hain. Rahul ne ek chikki ka 3/4 khaya, aur Sita ne waisi hi chikki ka 9/12. Kya dono ne barabar chikki khayi? 4 ko 3 se guna karke 12 bana. Barabar ke liye upar kya chahiye?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** mujhe lagta hai 9  _(correct)_

**Asha** [worked_example · beat s3:worked:worked · check script:c5-maths-ch02-t03-s3:ask:worked · board up · ready 2586 ms · guard long]: Haan, upar 9 hona chahiye, kyunki upar bhi 3 se guna hoga. Ab Sita ka upar wala number dekho: Sita ka upar 9 hi hai, toh 3/4 = 9/12, kyunki upar aur neeche dono 3 se guna hue. Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > card: Mohan ne bhi waisi chikki ka 8/12 khaya. Mohan ne Rahul se kam khaya, zyada, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** thoda kam  _(correct)_

**Asha** [practice · beat s3:check:c1 · check script:c5-maths-ch02-t03-s3:c1 · board up · ready 3729 ms · guard leak]: Haan, sahi hai. Dekho, barabar hone ke liye upar aur neeche, dono ek hi number se guna hone chahiye. Toh poora jawab: Sita ne Rahul jitna khaya, 3/4 = 9/12; Mohan ne usse kam khaya, 8/12. Ab ek sawaal tum akele karo. Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10 ya 2/6?
  > card: Inmein se kaunsa fraction 1/5 ke barabar hai: 2/10 ya 2/6?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":3,"label":"3/4"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** pehla  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t03-s3:c2 · board up · ready 1572 ms]: Bilkul sahi: neeche 5 × 2 = 10 aur upar 1 × 2 = 2, isliye 1/5 = 2/10; 2/6 mein 1 joda gaya. Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai, haan ya nahi?
  > card: Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":1,"label":"1/5"},{"parts":10,"shade":2,"label":"2/10"},{"parts":6,"shade":2,"label":"2/6"}]}}

**child:** no  _(misconception)_

**Asha** [reteach · beat s3:remediation:rem:c5-maths-ch02-t03-m-different-numbers-unequal · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-different-numbers-unequal · board up · ready 2728 ms]: Yeh jawab sahi nahi hai. Isko doosri tarah se samajhte hain. Yeh do patti ek jitni lambi hain, pehli ke 4 hisse aur doosri ke 8. Doosri ke 2 hisse milkar pehli ka 1 hissa banate hain: number alag, maatra ek. Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > card: Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"mark":8}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t03-m-different-numbers-unequal · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-different-numbers-unequal (1 miss) · board up · ready 1450 ms · guard twoq]: Nahi, 0 theek nahi. Har fraction mein dekho ki neeche wala number upar wale ka theek teen guna hai ya nahi. 1/3 ke barabar kitne fraction hain, 3/9, 4/12 aur 5/12 mein se?
  > card: Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 0  _(misconception)_

**Asha** [hint · beat s3:check:then:c5-maths-ch02-t03-m-different-numbers-unequal · check script:c5-maths-ch02-t03-s3:then:c5-maths-ch02-t03-m-different-numbers-unequal (2 miss) · board up · ready 2739 ms · guard leak,uncorrected]: Abhi yeh sahi nahi hai. Barfi ki ek patti ko 4 hisson mein kaato aur 1 lo; waisi patti ko 8 mein kaato aur 2 lo. Haath mein barfi utni hi aati hai, bas naam alag hain: 1/4 aur 2/8. Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > card: Teen fraction suno: 3/9, 4/12 aur 5/12. Inmein se kitne fraction 1/3 ke barabar hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":0,"label":""},{"parts":12,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** do fraction  _(correct)_

**Asha** [practice · beat s3:check:c2 · check script:c5-maths-ch02-t03-s3:c2 (1 miss) · board up · ready 2706 ms · guard leak,screenmismatch]: Haan, bilkul theek, kyunki 1/3 ko 3 se guna karke 3/9 aur 4 se guna karke 4/12 banta hai; 5/12 nahi, isliye 2. Chalo, pehle wale sawaal ki taraf wapas aate hain. Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai, haan ya nahi?
  > card: Yeh number line 0 se 1 tak 10 barabar gap mein kati hai. 0 ke baad aathve mark par ghera hai. Kya woh mark 4/5 ke barabar hai, haan ya nahi?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":9,"shade":3,"label":"3/9"},{"parts":12,"shade":4,"label":"4/12"},{"parts":12,"shade":5,"label":"5/12"}]}}

**child:** barabar  _(correct)_

**Asha** [practice · beat s3:check:c3 · check script:c5-maths-ch02-t03-s3:c3 · board up · ready 1535 ms]: Sahi jawab. Dekho, 0 ke baad aathva mark 8/10 hai, aur 4/5 ke upar aur neeche ko 2 se guna karke 8/10 banta hai. Zoya ka kehna hai ki 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Zoya ki baat sahi hai, haan ya nahi?
  > card: Zoya ka kehna hai ki 3/7 aur 4/8 barabar hain, kyunki dono mein neeche ka number upar se 4 zyada hai. Zoya ki baat sahi hai, haan ya nahi?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":10,"from":0,"to":1,"marks":[{"num":8,"label":"8/10 = 4/5"}]}}

**child:** barabar nahi  _(correct)_

**Asha** [teachback · beat end:teachback:teachback · board up · ready 3 ms]: Haan, sahi hai: 4/8 theek aadha hai, par 3/7 aadhe se kam hai, kyunki 3 ka dugna 6 hi hai, 7 nahi. Aaj ki saari baatein jodne wala ek hi sawaal bacha hai. Ek patti ke 3 barabar hisse hain aur 2 mein rang hai, yaani 2/3. Ab har hissa 4 chhote barabar hisson mein kaat diya. Rang wale hisse ko ab kaunse fraction se bolenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":7,"shade":3,"label":"3/7"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** 8/12  _(correct)_

**Asha** [teachback · beat end:teachback:teachback:answer · board up · ready 2151 ms]: Bilkul sahi, kyunki har hissa 4 mein kata, toh kul hisse 3 × 4 = 12 hue aur rang wale 2 × 4 = 8; rang utna hi raha, isliye 2/3 = 8/12. Ab tak samajh aaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":3,"shade":2,"label":"2/3"},{"parts":12,"shade":8,"label":"8/12"}]}}

**child:** maine dobara check kiya  _(no_evidence)_

**Asha** [wrap · ready 1263 ms]: Theek hai, main yeh yaad rakhungi. Patti ko modne par hisse badhte hain par rang utna hi rehta hai, isliye 1/2 = 2/4 = 4/8. Upar aur neeche ko ek hi number se guna karne par barabar fraction banta hai, kuch jodne par nahi. Do fraction tab barabar hain jab upar aur neeche ek hi number se guna hue hon. Aaj ka paath kaisa laga?

**child:** maza aaya  _(no_evidence)_

**Asha** [wrap · ready 955 ms]: Achha, tumne dil se bataya. Aaj tumne upar aur neeche ke farak wali galti pakdi. Aaj ke liye itna hi, phir milenge!

## Agent


