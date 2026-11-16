# W5: strings left for a per-string decision (round 7 F, 2026-11-04)

`scripts/kits/w5-filter-numerals.mjs` rewrote 339 counting "teen" to "3" in her Hinglish text. These 45 keep "teen" because the word IS the exercise (a number name), is quoted (the child reads or says exactly that), or is the English "teen". Under the open item open-r143-kit-filter-collisions, each needs a decision: Devanagari "तीन" in place, a reworded prompt, or keep it. No change is made without that decision. Measuring whether each actually trips the filter needs model calls, so it is spend-gated.

**Decided (main, 2026-11-04):**
- "teen-chauthai" stays in words. It is the Hindi name of the fraction 3/4, and "3-chauthai" is neither a numeral nor a word.
- Anything a child's answer is graded against (answer, acceptable and option forms, such as the spoken pictograph option) stays exactly as the kit has it. W5 never rewrites those.

The other rows below are still open.

| file · path | why kept | text |
|---|---|---|
| `c1-english.json.topics[8].items[11].prompt_hi` | number name | Apne teddy ko Tara ke rainbow ki kahani do-teen sentence mein sunao. |
| `c1-maths.json.topics[6].items[10].hints[0]` | number name | Count in Hindi: ek, do, teen... |
| `c1-maths.json.topics[12].items[5].hints[3]` | English 'teen' | Because 10 plus some ones is quick to read as a teen number — no counting all. |
| `c1-maths.json.topics[24].misconceptions[0].diagnostic.prompt_hi` | quoted | Kya "teen do" (2 ke 3 group) aur 2 + 2 + 2 ek hi baat hai? |
| `c1-maths.json.topics[24].items[6].prompt_hi` | quoted | "Teen do" aur "2 + 2 + 2" — ek jaise ya alag? |
| `c2-english.json.topics[1].items[12].prompt_hi` | number name | Bittu ne kabhi chhupan-chhupai nahi kheli. Usse do-teen chhote sentences mein batao kaise khelte hain. |
| `c3-maths.json.topics[13].misconceptions[0].diagnostic.prompt_hi` | number name | 'Three hundred five' (teen sau paanch) ko number mein likho. |
| `c3-maths.json.topics[28].items[11].prompt_hi` | number name | TV pe cricket match saadhe teen baje shuru hoga. Tumhari ghadi mein 3 baje hain. Kitni der rukna padega? |
| `c4-english.json.topics[8].items[12].prompt_hi` | number name | Doosre state ke ek dost ko Hekko kaise khelte hain, teen-chaar sentences mein samjhao. |
| `c4-evs.json.topics[13].items[17].prompt_hi` | number name | Do ek jaise paper helicopters ke wings same hain. Ek ke neeche ek paper clip hai, doosre ke neeche teen. Saath chhodne par kaun pehle zameen par pahunchega: ek clip wala ya 3 clips wala? |
| `c4-maths.json.topics[4].items[6].prompt_hi` | quoted | A1 se A4 jaane ke liye Tara ginti hai 'A1 ek, A2 do, A3 teen, A4 chaar' aur kehti hai 4 step upar. Kya woh sahi hai? |
| `c4-maths.json.topics[7].misconceptions[1].diagnostic.prompt_hi` | quoted | 'Teen hazaar chhe' kaunsa number hai? |
| `c4-maths.json.topics[7].items[0].prompt_hi` | number name | Numbers mein likho: do hazaar teen sau paintalees. |
| `c4-maths.json.topics[7].items[5].prompt_hi` | number name | Teen hazaar paanch sau, aur teen hazaar paanch dahaai. Kya dono same number hain? Dono likho. |
| `c4-maths.json.topics[7].items[5].prompt_hi` | number name | Teen hazaar paanch sau, aur teen hazaar paanch dahaai. Kya dono same number hain? Dono likho. |
| `c4-maths.json.topics[28].items[3].prompt_hi` | number name | Key: 1 aam ki picture = 4 aam. Ek row mein 3 pictures aur aadhi picture hai. Pehle guess karo: 3, saadhe teen, ya 14 aam? |
| `c5-english.json.topics[0].items[11].prompt_hi` | number name | Tumhari chhoti cousin ko joke samajh nahi aaya. Use do-teen sentences mein samjhao — kya hua aur funny kyun hai. |
| `c5-evs.json.topics[0].items[4].prompt_hi` | number name | Aadhe cup paani mein do chammach namak ghol do, plate mein daal ke do-teen din dhoop mein rakh do. Guess karo: plate mein kya bachega? |
| `c5-evs.json.topics[3].items[3].prompt_hi` | number name | Geeli mitti wale gamle mein ek kele ka chhilka aur ek plastic ka wrapper daba do. Teen hafte baad lakdi ya chammach se nikaalo (aur baad mein haath dhona). Guess karo dono kaise dikhenge. |
| `c5-evs.json.topics[13].items[15].prompt_hi` | number name | Class trip ke liye 30 students ek bus mein ya teen-teen students wali das petrol cars mein ja sakte hain. Kul milakar kis choice se zyada fuel bachega? |
| `c5-evs.json.topics[13].items[15].prompt_hi` | number name | Class trip ke liye 30 students ek bus mein ya teen-teen students wali das petrol cars mein ja sakte hain. Kul milakar kis choice se zyada fuel bachega? |
| `c5-evs.json.topics[15].items[2].prompt_hi` | number name | Gehre rang ka purana kapde ka tukda dhoop wali khidki pe rakho aur uska aadha hissa gatte se dhak do. Do-teen hafte chhod do. Guess karo: dono hisse kaise dikhenge? |
| `c5-maths.json.topics[0].items[0].prompt_hi` | number name | Numerals mein likho: chaubees hazaar teen sau saath. |
| `c5-maths.json.topics[0].items[8].prompt_hi` | quoted | Pinky ne 30,050 ko 'teen hazaar pachaas' padha. Kya woh sahi hai? Sahi kaise padhenge? |
| `c5-maths.json.topics[5].items[9].prompt_hi` | number name | Ek dance step mein tum clockwise teen-chauthai ghoomte ho. Anticlockwise kaunsa ek turn tumhe usi jagah pahuncha dega? |
| `c5-maths.json.topics[5].items[10].prompt_hi` | quoted | Instruction hai 'teen-chauthai turn anticlockwise'. Ghadi par sui 12 se shuru karke dikhao. Sui kahaan rukegi? |
| `c5-maths.json.topics[5].items[15].prompt_hi` | number name | School play ki spotlight pehle teen-chauthai chakkar aur phir usi disha mein ek-chauthai chakkar ghoomti hai. Kul kitne poore chakkar hue? |
| `c5-maths.json.topics[24].items[17].prompt_hi` | number name | School event mein rehearsal teen-chauthai ghante ki aur performance aadhe ghante ki hai. Dono milakar kitne minute lagenge? |
| `c6-english.json.topics[0].items[5].prompt_hi` | number name | Tumhara chhota cousin sochta hai ki sage ke magic words ne gold banaya. Use do-teen sentences mein samjhao ki Rama Natha asal mein ameer kaise bana. |
| `c6-maths.json.topics[4].items[8].prompt_hi` | number name | Chaar gaon hain, koi teen ek seedhi line mein nahi. Har gaon har doosre gaon se seedhi sadak se juda hai. Kitni sadakein? |
| `c6-maths.json.topics[9].items[8].prompt_hi` | English 'teen' | Teen numbers ke liye Kaprekar 6174 pe pahuncha. Kya sirf isse keh sakte ho ki yeh HAR 4-digit number ke liye chalega? |
| `c6-maths.json.topics[13].items[1].prompt_hi` | number name | Key: 1 picture = 10 ped. Class 6B ki saadhe teen pictures hain. Kitne ped? |
| `c6-maths.json.topics[13].items[8].prompt_hi` | number name | Van Mahotsav: key 1 picture = 12 ped. Class 6A ki 5 pictures aur 6B ki saadhe teen. 6A ne kitne zyada ped lagaye? |
| `c6-maths.json.topics[32].items[14].prompt_hi` | number name | Ek round badge par centre ke around teen ek jaise dots barabar doori par hain, aur koi mark nahi hai. Iska sabse chhota rotational symmetry angle kya hai? |
| `c6-science.json.topics[10].items[14].prompt_hi` | number name | Magnet teen ek-jaise dikhne wale game tokens ko attract karta hai. Har token ko palatkar dobara test karne par sirf P aur R attract hote hain. Kin tokens ka magnetic test result dono baar ek jaisa hai? |
| `c7-english.json.topics[0].items[11].prompt_hi` | number name | Chhoti cousin ko samjhao — nadi aur ladki wali kahani ka asli sandesh kya hai? Do-teen line mein. |
| `c7-maths.json.topics[3].items[16].prompt_hi` | number name | Kaunsi situation (240 − 3 × 40) ÷ 4 se match karti hai? A: Chaar dost ₹240 mein se 3 ₹40 tickets saath kharidkar bache paise baantte hain. B: Har dost ko ₹240 milte hain aur woh 3 tickets kharidta hai. C: Chaar dost ₹240 baantkar har ek teen baar ₹40 deta hai. |
| `c7-maths.json.topics[11].items[11].prompt_hi` | English 'teen' | Dost ko sikhao ki lagatar teen numbers (jaise 6, 7, 8) ka jod hamesha beech wale ka 3 guna kyun hota hai. |
| `c7-maths.json.topics[41].items[15].prompt_hi` | number name | School event ke teen ek-jaise badges ka total ₹114 hai, jismein ₹18 delivery fee bhi hai. Ek badge ki keemat kya hai? |
| `c7-science.json.topics[5].items[7].prompt_hi` | quoted | Is description ko circuit diagram mein badlo: 'Teen cell ki battery, ek switch aur do bulb, sab ek hi loop mein.' Phir batao tumhare drawing ka har symbol kaisa dikhta hai. |
| `c7-science.json.topics[13].items[0].hints[0]` | quoted | Ask what we call the 'teen' years |
| `c8-maths.json.topics[26].items[9].prompt_hi` | quoted | 60 mithaaiyan 1 : 2 : 3 mein baantni hain. Sumit ne har ek ko 20 di, 'kyunki teen bachche hain'. Use theek karo. |
| `c9-english.json.topics[11].items[12].prompt_hi` | number name | Koi gaana jo udaasi mein madad karta hai? Do-teen sentence, kam se kam do music words ke saath. |
| `c9-science.json.topics[36].items[8].prompt_hi` | number name | Do column ki table banao: 'biodiversity ke khatre' aur 'bachaane ke tareeke', teen-teen rows. |
| `c9-science.json.topics[36].items[8].prompt_hi` | number name | Do column ki table banao: 'biodiversity ke khatre' aur 'bachaane ke tareeke', teen-teen rows. |
