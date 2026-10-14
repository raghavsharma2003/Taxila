# Board asks: 29/40

```json
{
 "date": "2026-10-14T17:45:57.600Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 29,
 "share": 72.5,
 "byKind": {
  "numline": "2/6",
  "shape": "5/6",
  "example": "3/4",
  "picture": "9/11",
  "game": "2/3",
  "draw": "8/10"
 },
 "failures": {
  "repeat": 0,
  "overlay": 0,
  "pointing": 0
 },
 "method": "local server on the Neon TEST branch, real Azure models; per case a fresh child, the spoken lane, one 'haan' then the ask; board read from board_page/studio_mount (TEST) after up to --wait ms; scored by code predicates (subject words, shapes, number line, interactive mount, repeat, overlay, pointing). Adult-run harness: no child."
}
```

| case | ask | pass | why | board texts | she said |
|---|---|---|---|---|---|
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 1 9 · 1 · ? · ? · 1 ? ? · once | Dekho: number line par 1 se 9 tak 9 barabar steps hain. 1 pehle, 9 aakhri—1 aur 9 ke beech kitne numbers hain? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, triangle ke teen sides aur teen corners hote hain. Tum shape ke hisaab se kaise group banaoge? |
| c1-example | ek example do | yes |  | Check money · and price · Add two prices · Subtract price · from money · Find change | Example: tumhare paas 10 rupees, pencil 6 ki; 10 zyada hai, isliye money enough. Kya 8-rupee eraser le sakte ho? |
| c1-mango | aam dikhao | yes |  | aam · ? | Aam peela ya hara, gol aur thoda lamba hota hai; ek aam mein kitni ginti karoge? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Dekho, triangle teen straight sides aur teen corners wala shape hota hai; tum kitne corners gin sakte ho? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke · 10 · ? | Dekho, ₹10 ka sikka gol hota hai; uspar 10 likha hota hai. Tumhe kaunsa number dikh raha hai? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 balls aur 4 players dekho; ek-ek ball baantna game hai. Pehli ball kisko doge? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par flow dekho: subah, shaam, raat. Subah wale box mein Neema aur dadi ko dekho—pehle kya hua? |
| c3-plant-pic | plant ka picture dikhao | **no** | no picture and no honest can't |  | Dekho, plant mein roots neeche, stem beech, leaves side, flower upar, aur fruit mein seeds hote hain. Tum roots kahan dekhoge? |
| c3-river | nadi dikhao | yes |  | nadi | Kiko, nadi ek lambi, tedhi water-line hoti hai; iska paani pahadon se neeche behkar aata hai. Nadi kahan ja sakti hai? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 23 24 25 · … · 14 jumps | Dekho: 23, 24, 25… 14 equal jumps aage; pehle 3 jumps karke tum kis number par pahunche? |
| c3-clock | ghadi draw karo | **no** | no page |  | Kiko, ghadi mein chhoti sui hour dikhati hai, badi sui minutes; badi sui 9 par ho toh kitne minutes? |
| c3-aloo | aloo dikhao | yes |  | aloo · plant · animal · ? | Aloo zameen ke andar ugta hai; gol-bhura hota hai, chhilke ke andar safed hissa hota hai. Aloo plant se hai ya animal se? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | Whole · 2 equal parts · ? equal parts · 2 quarters · make a half · ? quarters | Dekho: ek gol roti ke beech se seedhi line—do bilkul same parts. Tum batao, har part ko kya kahenge? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki roshni ball ko rokne par, ball ke peeche zameen par dark shadow banti hai. Shadow kis taraf hogi? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Photo nahi hai; chidiya ki chonch chhoti, pointed, aksar brown ya black hoti hai, face ke aage. Tum uski shape batao? |
| c4-half | half ka picture banao | yes |  | 1/3 · half | Dekho, ek roti ko teen barabar parts mein baanto; har part one-third hai. Tum kitne equal parts dekh rahe ho? |
| c4-example-again | ek aur example do | yes |  | Find each · change · Check · every step · Write the rule · Find the | Jaise tum 3, 6, 9, 12 balls count karo—har baar 3 badhta hai. Next number kya hoga? |
| c4-moon | chaand dikhao | **no** | no picture and no honest can't |  | Kiko, chaand kabhi gol, kabhi aadha, kabhi patli lakeer jaisa dikhta hai; tumne aaj kaunsa dekha? |
| c4-game | game khelte hain | **no** | no interactive piece (mounts: -; studio: whiteboard) | line of symmetry | Ek second, meri baat atak gayi. Kya tum phir se bata sakte ho? |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf safed, thos tukda hoti hai; bhaap garam, rangheen gas hoti hai. Baraf pighalti, bhaap thandi hokar water banati hai—kaunsi process? |
| c5-numline-frac | number line pe 1/4 dikhao | **no** | no number line | 0 · 1 · 1/4 | Aap ise kahan rakhenge? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka flag hai: upar kesari, beech safed, neeche hara; beech mein neela Ashoka Chakra hota hai. Iska beech wala rang batayiye. |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Kiko, hexagon ek band shape hai, jiske seedhe sides aur corners hote hain. Aap iski sides ginne ka pehla step batayiye. |
| c5-directions | map pe direction dikhao | yes |  | North · South · East · West · direction? | Kiko, direction aise dikhti hain: upar North, neeche South, right East, left West. Aap North ke opposite direction ka naam batayiye. |
| c6-lifecycle | plant ki life cycle draw karo | **no** | no page |  | Plant life cycle mein seed, sprout, young plant, flowering plant, aur fruits with new seeds hote hain. Aap pehla stage kaunsa rakhenge? |
| c6-numline-neg | number line pe minus 3 dikhao | **no** | no number line |  | Kiko, dekhiye: minus 3, minus 2 aur 0 ke beech, 3 equal steps left hai. Minus 3 ke turant baad kaunsa number hai? |
| c6-example | ek example do | **no** | page has no worked content | 1 2 | Jaise 1 pizza ke 2 mein se 1 tukda, ya 4 mein se 2 tukde: dono same amount hain. Aapke hisaab se 1/2 ke barabar kya hoga? |
| c6-evaporation | evaporation ka diagram banao | **no** | no page |  | Evaporation mein paani heat se vapour banta hai: neeche paani, upar uthti vapour. Aap batayein, heat dene par paani kis form mein gaya? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad ko aise dekhiye: neeche chaurai, upar choti, aur side steep slopes. Aapko iski kaunsi side zyada khadi dikh rahi hai? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Dekhiye: Cell — wire — Switch — wire — Bulb — wire — wapas Cell; closed path complete ho, tab bulb lights. Switch gap kahan banata hai? |
| c7-numline-dec | number line pe 0.5 dikhao | **no** | no number line | 0 · 1 · 0.5 | Dekhiye, 0.0.5 se bada kaunsa number hai: 0.45 ya 0.405? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Dekhiye: Sun — Moon — Earth ek line mein; Moon ki shadow Earth par padti hai. Ismein beech mein kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 hain: har number ke dots ko pairs mein baantiye; ek akela bache toh odd—pehle 7 dekhiye, kya bachega? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · cell wall · cell membrane · chloroplasts · cytoplasm | Dekhiye, cell ek chhota room jaisa hota hai: bahar membrane, andar cytoplasm, beech mein nucleus. Aap bataiye, nucleus kahan hoga? |
| c8-square | isko draw karke samjhao | yes |  | 3 × 3 = ? | Screen par geoboard mein 3 by 3 dots dekhiye: teen rows, har row mein teen. Total dots gin kar batayiye. |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% · Add to · quantity · Check · final price | Jaise 100 rupaye ke bat par 12 percent discount: 1 percent 1 rupaya, toh 12 percent 12 rupaye. Aap 200 ka 12 percent bataiye? |
| c9-flower | phool ke parts draw karo | yes |  | phool ke parts | Phool ko imagine kijiye: bahar green sepal, rangin petals, andar pollen wale stamens, beech mein pistil. Aap pistil ka role batayiye. |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo · ? | Aloo gol-matol, halka bhura, zameen ke andar ugta hai. Isse sequence samajhne ke liye bataiye: har baar kya badal raha hai? |
| c9-numline-rational | number line pe 3/4 dikhao | **no** | no number line | 0 · 1 · 3/4 | Aap bataiye, kyun? |