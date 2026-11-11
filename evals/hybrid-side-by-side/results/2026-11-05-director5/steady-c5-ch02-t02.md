# steady-c5-ch02-t02 · c5-maths-ch02-t02

## Director

**Asha** [greet]: Namaste Riya, main Asha, tumhari AI teacher. Aaj fractions compare karenge—jaise cooking mein kaunsa hissa zyada. Tumhe cooking mein kya banana pasand hai?

**child:** haan, samajh aaya  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2331 ms]: Theek hai Riya—ab cake socho: ek 4 tukdon mein, doosra 8 mein. Sirf ek tukda lena ho, kis cake ka tukda bada hoga?

**child:** pata nahi, aap batao  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · check script:c5-maths-ch02-t02-s1:ask:e1 · board up · ready 4078 ms · guard screen]: Yeh ek poori patti hai; iske 4 barabar hisse hain, aur ek hissa 1/4 hai. Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > card: Isi patti ko 8 barabar hisson mein kaatein, toh ek hissa pehle se bada hoga ya chhota?
  > screen: board fraction-parts@1 {"labels":"4 equal parts","numbers":"4 1"} · ref {"template":"fraction-parts@1","params":{"parts":4,"shade":1,"whole":"bar"}}

**child:** chhota hoga  _(correct)_

**Asha** [probe · ready 1241 ms]: Haan, chhota. Tumne kaise jaana ki 8 hisse karne par har hissa chhota ho jaata hai, Riya?

**child:** samajh nahi aaya  _(no_evidence · another)_

**Asha** [explain · beat s1:explain:e2 · check script:c5-maths-ch02-t02-s1:ask:e2 · board up · ready 3542 ms · guard mustsay]: Aadhi roti ko 2 tukdon mein kaatoge, toh har tukda chhota hoga. 1/8 mein 8 barabar hisse hote hain. Toh ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > card: Toh ek hissa kaunsa bada hai, 1/4 ya 1/8?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 1"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":1,"whole":"bar"}}

**child:** 1/4 bada hai  _(correct)_

**Asha** [explain · beat s1:explain:e3 · check script:c5-maths-ch02-t02-s1:ask:e3 · board up · ready 2735 ms · guard mustsay]: Bilkul, tumne sahi dekha: sankhya rekha par 1/8 < 1/4. Do ek jaise cake hain. Ek cake ka 1/3 tukda, doosre ka 1/7 tukda. Kaunsa tukda bada hai, 1/3 ya 1/7?
  > card: Do ek jaise cake hain. Ek cake ka 1/3 tukda, doosre ka 1/7 tukda. Kaunsa tukda bada hai, 1/3 ya 1/7?
  > screen: board fraction-line@1 {"labels":"1/8","numbers":"0 1 1/8"} · ref {"template":"fraction-line@1","params":{"den":8,"from":0,"to":1,"marks":[{"num":1,"label":"1/8"},{"num":2,"label":"1/4"}]}}

**child:** 1/3 bada hai  _(correct)_

**Asha** [worked_example · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:ask:worked · board up · ready 2999 ms · guard long]: Aman ke paas 1/6 hai, Zoya ke paas 2/6 jitna. Toh bada tukda kise mila, Aman ko ya Zoya ko?
  > card: Aman ke paas 1/6 hai, Zoya ke paas 2/6 jitna. Toh bada tukda kise mila, Aman ko ya Zoya ko?
  > screen: board fraction-line@1 {"labels":"1/6","numbers":"0 1 1/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Aman  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2746 ms]: Aman nahi, Zoya: dono denominator 6 hain, isliye 2/6, 1/6 se bada hai. Ab batao, 1/5 ya 1/10 mein zyada juice kaunsa?
  > screen: board fraction-parts@1 {"labels":"8 equal parts","numbers":"8 2"} · ref {"template":"fraction-parts@1","params":{"parts":8,"shade":2,"whole":"bar"}}

**child:** mujhe lagta hai haan  _(no_evidence)_

**Asha** [practice · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · ready 3324 ms]: Theek hai Riya, pehle numerator aur denominator ko dhyaan se dekhenge; phir agla fraction question solve karenge. Asha aur Ravi ke paas ek jaisi juice ki bottle hai. Asha apni bottle ka 1/5 juice nikalti hai, Ravi apni bottle ka 1/10. Kisne zyada juice nikala, Asha ne ya Ravi ne?
  > card: Asha apni bottle ka 1/5 juice nikalti hai, Ravi apni bottle ka 1/10. Kisne zyada juice nikala, Asha ne ya Ravi ne?

**child:** picture dikhao  _(no_evidence · visual)_

**Asha** [reteach · beat s1:worked:worked · check script:c5-maths-ch02-t02-s1:then:c5-maths-ch02-t02-m-bigger-denominator · board up · ready 2099 ms · guard screenmismatch]: Ek-ek part kis mein bada dikhta hai?
  > card: Asha apni bottle ka 1/5 juice nikalti hai, Ravi apni bottle ka 1/10. Kisne zyada juice nikala, Asha ne ya Ravi ne?
  > screen: board fraction-line@1 {"labels":"1/6","numbers":"0 1 1/6"} · ref {"template":"fraction-line@1","params":{"den":6,"from":0,"to":1,"marks":[{"num":1,"label":"1/6"},{"num":2,"label":"1/3"}]}}

**child:** Asha, 1/5  _(correct)_

**Asha** [practice · beat s1:check:c1 · check script:c5-maths-ch02-t02-s1:c1 gave · ready 5574 ms · guard leak]: Pichhla sawaal: Ek hi size ke bar ko jitne zyada hisson mein kaato, har hissa utna chhota. 1/6 toh 1/3 ka aadha hai, isliye 6 bada number hote hue bhi 1/6 chhota tukda hai., yaani jawab Zoya ko bada tukda mila, kyunki 1/3 > 1/6.. Bilkul, Riya—tumne dekha ki kam parts mein kaata ho, toh har part bada hota hai. Do ek jaisi roti hain. Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?
  > card: Ek 10 barabar tukdon mein kati hai, doosri 5 barabar tukdon mein. Kaunsa ek tukda bada hai, 1/10 ya 1/5?

**child:** 1/5 hai na  _(correct)_

**Asha** [practice · beat s1:check:c2 · check script:c5-maths-ch02-t02-s1:c2 · ready 2498 ms]: Haan Riya, 1/5 sahi hai—5 tukde hone par har tukda 10 tukdon wale tukde se bada hota hai. Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.

**child:** 1/3, 1/6, 1/12  _(incorrect)_

**Asha** [hint · check script:c5-maths-ch02-t02-s1:c2 (1 miss) · ready 4072 ms · guard samecard,flat,uncorrected]: 1/3, 1/6, 1/12 sahi nahi hai. Denominator bada ho toh hissa chhota hota hai. In teenon ko chhote se bade kram mein kaise lagaaogi: 1/3, 1/12, 1/6?
  > card: Ek hi poore ke yeh teen bhinn chhote se bade ke kram mein lagao: 1/3, 1/12, 1/6.

**child:** 1/12, 1/6, 1/3  _(correct)_

**Asha** [practice · beat s1:check:c3 · check script:c5-maths-ch02-t02-s1:c3 · board up · ready 1130 ms]: Bilkul Riya, tumne fractions ko chhote se bade kram mein sahi lagaya. Yeh sankhya rekha 0 se 1 tak 4 barabar hisson mein bati hai. 0 ke baad pehla nishaan, jahan? Laga hai, 1/8 se bada hai ya chhota?
  > card: 0 ke baad pehla nishaan, jahan ? laga hai, 1/8 se bada hai ya chhota?
  > screen: board fraction-line@1 {"labels":"?","numbers":"0 1"} · ref {"template":"fraction-line@1","params":{"den":4,"from":0,"to":1,"mark":1}}

**child:** ruko, main khud karta hoon  _(no_evidence · thinking)_

**Asha** [repair · ready 2657 ms]: Theek hai, Riya. Tum apna tareeka poora karo.

**child:** bigger  _(correct)_

**Asha** [probe · ready 1414 ms]: Haan, bigger. Tumne kaise jaana ki 0 ke baad wala nishaan 1/8 se bada hai?

**child:** mujhe cricket pasand hai  _(no_evidence)_

**Asha** [practice · check c5-maths-ch02-t02-i01 · ready 2996 ms]: Cricket mein bhi ball ko boundary se compare karte hain. Usi pizza ka kaun bada hai: 1/4 ya 1/8?
  > card: Usi pizza ka kaun bada hai: 1/4 ya 1/8?

**child:** one quarter  _(correct)_

**Asha** [probe · check c5-maths-ch02-t02-i05 · ready 1273 ms]: Bilkul, Riya—tumne 1/4 ko 1/8 se bada pehchana. Ab isi tarah agle fractions ko dhyaan se compare karna. Do ek jaise laddoo: ek ke 6 barabar tukde honge, doosre ke 3. Kaatne se pehle andaaza lagao: kiska ek tukda bada hoga?
  > card: Do ek jaise laddoo: ek ke 6 barabar tukde honge, doosre ke 3. Kaatne se pehle andaaza lagao: kiska ek tukda bada hoga?

**child:** Hindi mein bolo  _(no_evidence · language)_

**Asha** [probe · check c5-maths-ch02-t02-i05 · ready 2258 ms]: Achha, ab Hindi mein baat karte hain. Riya, yeh sawaal pooch raha hai ki barabar laddoo ke tukdon ka aakar (size) kaise badalta hai. Ab tukdon ki ginti par dhyaan do. Do ek jaise laddoo: ek ke 6 barabar tukde honge, doosre ke 3. Kaatne se pehle andaaza lagao: kiska ek tukda bada hoga?
  > card: Do ek jaise laddoo: ek ke 6 barabar tukde honge, doosre ke 3. Kaatne se pehle andaaza lagao: kiska ek tukda bada hoga?

**child:** the one cut into 3  _(correct)_

**Asha** [teachback · ready 2841 ms]: Bilkul Riya, 3 tukdon wala ek tukda bada hoga, kyunki poora laddoo kam hisson mein bata hai. Ab 1/3 aur 1/6 mein bada kaunsa hai?

**child:** mujhe lagta hai haan  _(incorrect)_

**Asha** [teachback · ready 4272 ms · guard praise,uncorrected]: Nahi, yeh jawab nahi hai. Tumne bas “haan” kaha; ab Bittu ko samjhao: 1/3 bada kyun hai—3 ya 6 tukdon ke aadhar par?

**child:** haan  _(incorrect)_

**Asha** [wrap · ready 2418 ms]: Aaj tumne denominator dekhkar fractions ko chhote se bade kram mein lagaya. Achha kaam. Alvida, dhyaan rakhna.

## Agent


