# steady-c6 · c6-maths-ch06-t01

## Director

**Asha** [greet]: Hello Riya, main Asha, tumhari AI teacher hoon. Aaj cricket pitch jaise shapes ka perimeter, yani boundary length, nikaalenge. Tumhe cricket mein kya pasand hai?

**child:** haan  _(no_evidence)_

**Asha** [hook · beat s1:hook:hook · ready 2746 ms · guard twoq]: Cricket pasand hai—pitch ke chaaron taraf ek round chaloge, toh kitni doori tay hogi? Is doori ko perimeter kehte hain.

**child:** pata nahi  _(no_evidence)_

**Asha** [explain · beat s1:explain:e1 · board up · ready 2796 ms]: Koi baat nahi, Riya. Boundary ki poori lambai perimeter hoti hai—rectangle mein chaaron sides ko trace karte hain. Apne words mein perimeter batao.
  > screen: board measured@1 {"labels":"6 cm | 5 cm | ? cm","numbers":"6 5"} · ref {"template":"measured@1","params":{"shape":"triangle","unit":"cm","sides":[4,5,6],"trace":true}}

**child:** 4  _(no_evidence)_

**Asha** [explain · beat s1:explain:e2 · board up · ready 2202 ms]: Tumne 4 sides notice ki—achha. Par perimeter sides ki ginti nahi, har side ki length jodna hai. Apne words mein perimeter bolo.
  > screen: board shape@1 {"labels":"A"} · ref {"template":"shape@1","params":{"shape":"hexagon","names":["A","B","C","D","E","F"]}}

**child:** kyun?  _(no_evidence)_

**Asha** [explain · beat s1:explain:e3 · board up · ready 2616 ms]: Kyunki perimeter poori boundary ki length hai; 4 sirf sides ki ginti batata hai. Rectangle ki edge par ungli chalaakar batao, kya measure hoga?
  > screen: board measured@1 {"labels":"6 cm | ? cm","numbers":"6"} · ref {"template":"measured@1","params":{"shape":"rect","unit":"cm","w":6,"h":4,"trace":true}}

**child:** achha samajh gaya  _(no_evidence)_

**Asha** [reteach · ready 3929 ms · guard screen]: Riya, rectangle ki length 50 m aur breadth 30 m hain; perimeter ke liye chaaron sides ki lengths jodte hain. Kaunsi chaar lengths hongi?

**child:** 6  _(no_evidence)_

**Asha** [worked_example · beat s1:worked:worked · board up · ready 2110 ms]: 6 sides nahi—rectangle ki 4 sides hoti hain: 50 m, 30 m, 50 m, 30 m. Diya hai: the flower bed is a closed five-sided shape (pentagon), sides: 4 m, 5 m, 3 m, 6 m, 2 m. Pehle: P = 4 + 5 + 3 + 6 + 2. Phir: 4 + 5 = 9 m. Phir: 9 + 3 = 12 m. Phir: 12 + 6 = 18 m. Phir: 18 + 2 = 20 m. Toh jawab: 20 m. Ab tak samajh aaya?
  > screen: board shape@1 {} · ref {"template":"shape@1","params":{"shape":"pentagon"}}

**child:** ek aur example do  _(no_evidence · example)_

**Asha** [reteach · ready 2264 ms]: Jaise school garden ki rectangular boundary: length 50 m, breadth 30 m; perimeter 2 times 80, yani 160 m. Is example mein kya notice hota hai?

**child:** theek hai  _(no_evidence)_

**Asha** [practice · beat s1:check:c1 · check script:c6-maths-ch06-t01-s1:c1 · ready 2547 ms]: Ab practice: L-shaped room ki 6 sides 8, 3, 5, 4, 3 aur 7 metre hain. Sab lengths jodkar perimeter nikaalo. Try karo.
  > card: Going round from one corner, the sides are 8 m, 3 m, 5 m, 4 m, 3 m and 7 m. What is the perimeter of the room?

**child:** 8  _(incorrect)_

**Asha** [reteach · beat s1:remediation:rem:c6-maths-ch06-t01-m-missing-sides · board up · ready 2513 ms · guard uncorrected]: 8 sahi nahi hai. Riya, 8 sirf pehli side hai; perimeter ke liye walk poori boundary par: 8 plus 3 plus 5 plus 4 plus 3 plus 7. Jodkar batao.
  > screen: board shape@1 {"labels":"A"} · ref {"template":"shape@1","params":{"shape":"hexagon","names":["A","B","C","D","E","F"]}}

**child:** bas ho gaya  _(no_evidence · stop)_

**Asha** [break · ready 2473 ms]: Samajh gaya—tum rokna chahti ho. Continue karna, chhota pause lena, ya aaj ke liye end karna—kya choose karogi?

## Agent


