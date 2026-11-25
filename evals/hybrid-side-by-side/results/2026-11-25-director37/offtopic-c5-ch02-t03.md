# offtopic-c5-ch02-t03 · c5-maths-ch02-t03

## Director

**Asha** [greet]: Riya, main Asha hoon, tumhari AI teacher. Chalo, shuru karein?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 · board up · ready 3681 ms · guard answerinq,long]: Roti aadhi modi, ek aadhe par ghee lagaya. Kaagaz ki patti par yahi: beech se modi, toh 2 barabar hisse; rang wala hissa patti ka 1/2 hai. Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":2,"shade":1,"whole":"bar"}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s1:explain:e1 · check script:c5-maths-ch02-t03-s1:ask:e1 (1 miss) · board up · ready 810 ms · guard uncorrected]: 1 sahi nahi hai. Rang wala aadha pehli patti ka ek bada hissa hai, par doosri patti ke hisse chhote hain; ek bade hisse mein kai chhote hisse aate hain. Pehli patti ka rang wala aadha, 10 hisson wali doosri patti ke kitne hisson jitna hai?
  > card: Doosri patti bilkul utni hi lambi hai, par 10 barabar hisson mein kati hai. Pehli patti ka rang wala aadha, doosri patti ke kitne hisson jitna hai?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":0,"label":""}]}}

**child:** paanch hisse  _(correct)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 · board up · ready 1863 ms · guard mustsay,answerinq]: Haan, sahi hai. 10 hisson ka aadha 5 hisse hai. Ab wahi patti ek baar aur modi, toh 4 barabar hisse bane. Rang wala aadha ab 2 hisson mein hai, yaani 2/4; rang utna hi raha, isliye 1/2 = 2/4. Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":10,"shade":5,"label":"5/10"}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s1:explain:e2 · check script:c5-maths-ch02-t03-s1:ask:e2 (1 miss) · board up · ready 825 ms · guard uncorrected]: Nahi, 2 theek nahi. Nayi patti ke hisse pehli patti ke hisson se chhote hain. Isliye utni hi jagah rangne ke liye 2 se zyada hisse lagenge. 12 hisson wali patti mein kitne hisson mein rang bharen ki rang pehli patti jitna ho?
  > card: Nayi patti utni hi lambi hai, par 12 barabar hisson mein kati hai. Ismein kitne hisson mein rang bharen ki rang pehli patti jitna hi ho?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":0,"label":""}]}}

**child:** chhah  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t03-s1:ask:e3 · board up · ready 1886 ms · guard mustsay,noconfirm]: Bilkul sahi: 4 × 3 = 12, toh rang wale 2 × 3 = 6. Yeh number line 0 se 1 tak 8 barabar gap mein kati hai. Beech ka mark 4/8 hai, aur wahi 1/2 bhi hai aur 2/4 bhi. Toh 1/2 = 2/4 = 4/8: ek jagah, teen naam. Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > card: Isi line par 0 se chalkar 3/4 tak pahunchna hai. 1/8 wale kitne gap chalne honge?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":4,"shade":2,"label":"2/4"},{"parts":12,"shade":6,"label":"6/12"}]}}

**child:** six  _(correct)_

**Asha** [worked_example · beat s1:worked:worked:step1 · board up · ready 1118 ms · guard noconfirm]: Haan, bilkul theek, kyunki line par har 1/4 mein 1/8 wale 2 gap hain, toh 3/4 tak 3 × 2 = 6 gap, yaani 6/8. Aao, yeh sawaal main aur tum saath mein karenge. Sana ek rumal ko aadha modti hai aur ek aadhe mein rang bharti hai. Phir use do baar aur aadha modti hai. Teeno mod ke baad rumal kholo, toh kul kitne barabar hisse dikhenge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":4,"label":"1/2"},{"num":6,"label":"3/4 = 6/8"}]}}

**child:** 8 hisse  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked · board up · ready 1872 ms · guard answerinq]: Haan, kholne par 8 barabar hisse dikhenge. Rumal ke 8 barabar hisse hain, toh har chhota hissa poore rumal ka 1/8 hai. Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (1 miss) · board up · ready 1614 ms · guard script,uncorrected]: 8 sahi nahi hai. Kholne par rumal ke kul hisse 8 hain. Par rang modne se phailta nahi: woh sirf usi aadhe ke chhote hisson par rehta hai jismein pehle bhara tha. Kholne par rumal ke 8 hisson mein se kitne hisson mein rang hoga?
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** 8  _(misconception)_

**Asha** [hint · beat s1:worked:worked · check script:c5-maths-ch02-t03-s1:ask:worked (2 miss) · board up · ready 748 ms · guard uncorrected]: Nahi, 8 theek nahi. Pehle mod ke baad rang ek aadhe mein tha. Agle do mod ne us rang wale aadhe ko bhi kaata; socho woh kitne hisson mein bata. Ab tum batao.
  > card: Kholne par 8 hisson mein se kitne hisson mein rang dikhega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":""},{"parts":8,"shade":0,"label":""}]}}

**child:** aadhe hisson mein  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t03-s1:c1 · board up · ready 2108 ms]: Haan, sahi hai. Hisse badle, par rumal par rang utna hi raha. Toh poora jawab: kholne par 8 barabar hisse hain aur 4 mein rang, yaani 4/8, jo 1/2 ke barabar hai. Chalo, ab tumhari apni baari. Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > card: Do ek jaisi chocolate hain. Mohit ne ek chocolate ka 1/2 khaya. Anjali ne doosri ke 6 barabar hisson mein se 3 khaaye. Zyada kisne khaya: Mohit ne, Anjali ne, ya dono ne barabar khaya?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":8,"shade":4,"label":"4/8"}]}}

**child:** dono ne  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 903 ms]: Bilkul sahi: 6 barabar hisson mein se 3 hisse 3/6 hain, aur 3/6 = 1/2, isliye dono ne barabar khaya. Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":1,"label":"1/2"},{"parts":6,"shade":3,"label":"3/6"}]}}

**child:** pata nahi  _(no_evidence)_

**Asha** [hint · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 1815 ms · guard twoq]: Pehle dhoondo ki 12 gap wali line ka beech, yaani 1/2, kaunse mark par aata hai. Phir 5/12 ka mark dhoondkar usse milaao. 0 se 1 tak 12 barabar gap wali line par, 5/12 aur 1/2 mein: 5/12 bada hai, chhota hai, ya barabar?
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"target":[5,12]}}

**child:** drawing karke samjhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:check:c2 · check script:c5-maths-ch02-t03-s1:c2 · board up · ready 2515 ms · guard samecard]: Line ki jagah yahan do barabar lambi patti hain: upar wali beech se do hisson mein bati hai, neeche wali chhote barabar hisson mein. Apna jawab tum khud bolo.
  > card: Yeh number line 0 se 1 tak 12 barabar gap mein kati hai. Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":2,"shade":0,"label":""},{"parts":12,"shade":0,"label":""}]}}

**child:** 1/2 bada hai  _(correct)_

**Asha** [repair · beat s2:bridge:bridge · board up · ready 831 ms]: Haan, bilkul theek, kyunki 5/12 is line par paanchve mark par hai, aur 1/2 = 6/12 chhatthe mark par, isliye 5/12 chhota hai. Modne par 1/2 se 2/4 bana: kul hisse aur rang wale hisse, dono dugne hue, aur rang utna hi raha. Ab bina mode, guna karke barabar fraction banayenge. Yahan tak saaf hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** aapko virat pasand hai?  _(no_evidence · uptake)_

**Asha** [explain · beat s2:explain:e1 · board up · ready 2560 ms · guard mustsay,long]: Main AI teacher hoon, isliye meri apni koi pasand nahi hoti. Tumhe Virat ke baare mein sabse achha kya lagta hai?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** sixer  _(no_evidence · aside)_

**Asha** [practice · beat s2:explain:e1 · board up · ready 1732 ms · guard drift]: Oho, sixer! Isi mein tumhe maza aata hai. Chalo, jahan the wahin se aage chalte hain. Is patti ke 5 barabar hisse hain aur 2 mein rang, yaani 2/5. Neeche ka 5 saare hisse ginta hai, aur upar ka 2 rang wale. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-line@1","params":{"den":12,"from":0,"to":1,"marks":[{"num":5,"label":"5/12"},{"num":6,"label":"6/12 = 1/2"}]}}

**child:** kal maine cricket khela, sixer maara  _(no_evidence)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2245 ms]: Achha, cricket par thodi der mein zaroor lautenge. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":5,"shade":2,"whole":"bar"}}

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2863 ms · guard ask]: Theek hai, yeh Hindi mein suno. Rang wale hisse 2 hain, aur har ek ke do ho gaye. Ab rang wale hisse kitne hain?
  > card: Rang wale hisse 2 hain, aur har ek ke do ho gaye. Ab rang wale hisse kitne hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** mujhe khud try karne do  _(no_evidence · selftry)_

**Asha** [practice · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 · board up · ready 2064 ms]: Haan, pehle tum try karo.
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (1 miss) · board up · ready 1093 ms · guard uncorrected]: 2 sahi nahi hai. Har hissa 2 mein kata, toh rang wala har hissa bhi 2 chhote hisse bana. Isliye rang wale hisse utne hi nahi rehte; woh bhi dugne hote hain. Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 2  _(misconception)_

**Asha** [hint · beat s2:explain:e1 · check script:c5-maths-ch02-t03-s2:ask:e1 (2 miss) · board up · ready 835 ms · guard uncorrected]: Nahi, 2 theek nahi. Pehli patti ke ek rang wale hisse ke neeche nayi patti ke hisse gino, phir doosre rang wale hisse ke neeche bhi. Pehli patti ke rang wale 2 hisse, nayi patti ke kitne chhote hisse bante hain?
  > card: Nayi patti utni hi lambi hai, par har hissa 2 chhote hisson mein kata hai. Pehli patti ke rang wale 2 hisse, nayi patti mein kitne chhote hisse bante hain?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":0,"label":""}]}}

**child:** 4  _(correct)_

**Asha** [repair · beat s2:explain:e1 · board up · ready 1351 ms]: Haan, sahi hai. Pehli patti ka har hissa nayi mein 2 chhote hisse bana, toh rang wale 2 hisse 2 × 2 = 4 hue. Sixer ki baat tumne ki thi: tab tumhare saath kaun tha?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** Rohit  _(no_evidence · aside)_

**Asha** [explain · beat s2:explain:e2 · board up · ready 2573 ms · guard long]: Achha, toh Rohit! Yeh batane ke liye shukriya. Ab wapas apne kaam par aate hain. Is patti mein rang 4/10 hai, aur yahi 2/5 bhi hai. Neeche 5 × 2 = 10 aur upar 2 × 2 = 4: dono ek hi number se guna hue. Ab tak samajh aaya?
  > screen: board fraction-parts@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":5,"shade":2,"label":"2/5"},{"parts":10,"shade":4,"label":"4/10"}]}}

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · beat s2:explain:e2 · check script:c5-maths-ch02-t03-s2:ask:e2 · board up · ready 2163 ms]: Haan, cricket, yeh tumne bataya tha na! Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > card: Ab 5/6 ke upar aur neeche, dono ko 2 se guna karo. Kaunsa barabar fraction banega?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-parts@1","params":{"parts":10,"shade":4,"whole":"bar"}}

**child:** das bata barah  _(correct)_

**Asha** [explain · beat s2:explain:e3 · check script:c5-maths-ch02-t03-s2:ask:e3 · board up · ready 2991 ms · guard mustsay,math,long,noconfirm]: Bilkul sahi: hisse 6 se 12, toh rang wale 5 se 10. Kuch bachche 1/2 ke upar-neeche 1 jodkar 2/3 likhte hain; number line par 1/2 aur 2/3 alag jagah hain. Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > card: Isi line par 1/3, 0 ke baad doosre mark par hai. 1/3 ke upar aur neeche 1 jodo, toh 2/4 banta hai. 2/4 is line par 0 ke baad kaunse mark par aayega?
  > screen: board fraction-line@1 {} · ref {"template":"fraction-bars@1","params":{"bars":[{"parts":6,"shade":5,"label":"5/6"},{"parts":12,"shade":10,"label":"10/12"}]}}

**child:** beech wala  _(correct)_

**Asha** [worked_example · beat s2:worked:worked:step1 · board up · ready 1047 ms]: Haan, bilkul theek, kyunki 2/4 = 1/2 = 3/6, yaani 0 ke baad 3 gap; 1/3 sirf 2 gap par hai. Chalo, ab ek sawaal hum saath mein karte hain. Neha ko 3/5 ke barabar do fraction likhne hain: ek jiska neeche wala number 10 ho, aur ek jiska 15. Neeche 5 se 10 bana. Upar ke 3 ke saath kya karoge?
  > screen: board fraction-bars@1 {} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":2,"label":"1/3"},{"num":3,"label":"2/4 = 1/2"},{"num":4,"label":"2/3"}]}}

**child:** guna karo 2 se  _(correct)_

**Asha** [worked_example · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked · board up · ready 2440 ms · guard affirms]: Haan, upar ke 3 ko bhi 2 se guna karna hoga. Upar 3 × 2 = 6 hua, toh 3/5 aur 6/10 barabar hain. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board wholes@1 {} · ref {"template":"compare@1","params":{"left":{"title":"3/5","items":["upar 3 × 2 = 6","neeche 5 × 2 = 10"]},"right":{"title":"6/10","items":["dono × 2","barabar"]}}}

**child:** 3  _(misconception)_

**Asha** [reteach · beat s2:remediation:rem:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only · board up · ready 2003 ms · guard leak,long,uncorrected]: 3 sahi nahi hai. Ise alag tareeke se dekhte hain. Patti ka har hissa 2 mein kaato, toh kul hisse bhi dugne hote hain aur rang wale hisse bhi. Isliye upar aur neeche, dono number 2 se guna hote hain, koi ek nahi. 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":3}]}}

**child:** 1  _(misconception)_

**Asha** [hint · beat s2:check:then:c5-maths-ch02-t03-m-one-part-only · check script:c5-maths-ch02-t03-s2:then:c5-maths-ch02-t03-m-one-part-only (1 miss) · board up · ready 946 ms · guard twoq,uncorrected]: Nahi, 1 theek nahi. 12 hisson wali patti ka ek hissa, 6 hisson wali patti ke ek hisse se chhota hai. Isliye upar 1 hi rakhne se rang kam ho jaata hai. Neeche 12 ho, toh 1/6 ke barabar fraction ka upar wala number kya aayega?
  > card: 1/6 ke barabar fraction mein neeche 12 likha hai. Upar ka number kitna hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1}]}}

**child:** 2/12  _(correct)_

**Asha** [practice · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked (1 miss) · board up · ready 777 ms]: Haan, sahi hai. Neeche 6 × 2 = 12, toh upar bhi 1 × 2 = 2, yaani 2/12. Achha, ab pehle wale sawaal ko phir se dekhte hain. Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":6,"shade":1,"title":"1/6"},{"parts":12,"shade":2,"title":"2/12"}]}}

**child:** 3  _(misconception)_

**Asha** [hint · beat s2:worked:worked · check script:c5-maths-ch02-t03-s2:ask:worked (2 miss) · board up · ready 1023 ms]: 3 se baat nahi bani. 3/15 mein rang sirf 3 chhote hisson mein hai, jo 3/5 se bahut kam hai: kaatne par rang wale hisson ki ginti bhi badhti hai. Neeche 15 ho, toh 3/5 ke barabar fraction ka upar wala number kya hoga?
  > card: Ab doosra fraction: uska neeche wala number 15 hai. 3/5 ke barabar is fraction ka upar wala number kya hoga?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":3}]}}

**child:** nau  _(correct)_

**Asha** [practice · beat s2:check:c1 · check script:c5-maths-ch02-t03-s2:c1 · board up · ready 3076 ms · guard long]: Bilkul sahi: har baar upar-neeche dono ek hi guna se badhe: pehle dugne, phir tigune. Toh poora jawab: upar ke number 6 aur 9 aaye, yaani 6/10 aur 9/15. Ab agla sawaal tumhare liye. 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > card: 1/3 ke barabar ek naya fraction banana hai, jiska neeche wala number 12 ho. Is naye fraction mein upar kaunsa number aayega?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":5,"shade":3,"title":"3/5 = 6/10 = 9/15"}]}}

**child:** four  _(correct)_

**Asha** [practice · beat s2:check:c2 · check script:c5-maths-ch02-t03-s2:c2 · board up · ready 2579 ms · guard noconfirm]: Haan, bilkul theek, kyunki neeche 3 × 4 = 12 hua, toh upar bhi 1 × 4 = 4, yaani 1/3 = 4/12. Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > card: Ek fraction 3/4 ke barabar hai, aur uska neeche 8 hai. Upar kaunsa number likhoge?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":3,"shade":1,"title":"1/3"},{"parts":12,"shade":4,"title":"4/12"}]}}

**child:** 6 aayega  _(correct)_

**Asha** [practice · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 · board up · ready 1907 ms · guard noconfirm]: Sahi jawab. 8 hisse banane ke liye har hissa do mein bata, toh 3 rang wale hisse 3 × 2 = 6 ho gaye. 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":3,"title":"3/4"},{"parts":8,"shade":6,"title":"6/8"}]}}

**child:** 1/12  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 (1 miss) · board up · ready 2757 ms · guard samecard,uncorrected]: 1/12 sahi nahi hai. 1/12 mein sirf neeche badla, upar wahi 1 raha. Jab 4 hisse 12 bane, toh rang wale hisse ka kya hua, socho. 1/12, 3/12 aur 9/12 mein se 1/4 ke barabar kaun hai?
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** 1/12  _(misconception)_

**Asha** [hint · beat s2:check:c3 · check script:c5-maths-ch02-t03-s2:c3 (2 miss) · board up · ready 3695 ms · guard leak,uncorrected]: Nahi, 1/12 theek nahi. Dekho ki 1/4 ka neeche wala number kis number se guna hokar baarah banta hai. Upar wale number ko bhi usi se guna karke dekho. Ab tumhari baat sunti hoon.
  > card: 1/4 ke barabar kaunsa fraction hai: 1/12, 3/12 ya 9/12?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1}]}}

**child:** beech wala  _(correct)_

**Asha** [repair · beat s3:bridge:bridge · board up · ready 1913 ms · guard flat]: Haan, sahi hai: neeche 4 × 3 = 12, toh upar 1 × 3 = 3, yaani 3/12; 1/12 mein upar guna nahi hua. Ab barabar fraction banana aa gaya. Ab ulta kaam: do fraction diye hon, toh kaise pata karein ki woh barabar hain ya nahi. Yahan tak theek hai?
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":12,"shade":3,"title":"3/12"}]}}

**child:** bas aaj ke liye itna hi  _(no_evidence · stop)_

**Asha** [break · board up · ready 1393 ms]: Theek hai, koi baat nahi. Hum aage chal sakte hain, thoda break le sakte hain, ya aaj ke liye stop kar sakte hain. Tum batao.
  > screen: board wholes@1 {} · ref {"template":"wholes@1","params":{"as":"bar","wholes":[{"parts":4,"shade":1,"title":"1/4"},{"parts":12,"shade":3,"title":"3/12"}]}}

## Agent


