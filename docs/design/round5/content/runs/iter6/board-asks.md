# Board asks: 35/40

```json
{
 "date": "2026-10-14T18:42:27.346Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 35,
 "share": 87.5,
 "byKind": {
  "numline": "6/6",
  "shape": "5/6",
  "example": "3/4",
  "picture": "11/11",
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Number line: 1 — 2 — 3 — 4 — 5 — 6 — 7 — 8 — 9. Kiko, 1 aur 9 ke beech kitne steps hain? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, ball jaisa; triangle ke teen seedhe sides aur teen corners hote hain. Tum inhe kaise sort karoge? |
| c1-example | ek example do | yes |  | 10 rupees · Juice 7 · ? | Jaise ghar par tumhare paas 10 rupees hain, juice 7 ka hai; kya tumhare paise enough hain? |
| c1-mango | aam dikhao | yes |  | aam · ? | Aam peela, gol fruit hota hai; teen aam: ek, do, teen. Tumne kitne aam gine? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Dekho, triangle mein teen seedhi lines milkar teen kone banati hain. Tum iske sides kitne ginoge? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke | Dekho, sikka gol hota hai; uspar number likha hota hai, jaise 5. Tumhe kaunsa number dikh raha hai? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 balls aur 4 players dekho; ek-ek ball baanto—pehle player ko kitni mili? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par teen boxes dekho: subah, shaam, raat. Pehle box mein daadi aur Neema dikhenge—tum kya dekh rahe ho? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant · roots | Dekho, plant picture mein roots neeche, stem beech, leaves upar; tum roots kis jagah dekh rahe ho? |
| c3-river | nadi dikhao | yes |  | Rain · River or · ground · Pump · Tank · Pipe | Dekho, nadi ek lambi, behti hui paani ki dhaar hoti hai; tum batao, nadi ka paani kahan jaata hoga? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 10 14 20 23 30 · 3 parts · 4 parts · ? jumps | 23, 20 aur 30 ke beech, 3 parts baad; 14, 10 aur 20 ke beech, 4 parts. 23 se 14 jumps kitne? |
| c3-clock | ghadi draw karo | **no** | no page |  | Yeh ghadi dekho: chhoti hand 7 par, badi hand 9 par; badi hand 45 minutes batati hai. Ghanta kya hai? |
| c3-aloo | aloo dikhao | yes |  | aloo · raw ya cooked? | Aloo zameen ke andar ugta hai; bhure chilke aur andar safed-gola hota hai. Aloo plant se hai—raw ya cooked? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | equal parts · 1/2 = 1/2 · 2 equal? | Dekho: ek roti ko beech se kaatne par 2 same-size parts bante hain—ye equal halves hain. Kya dono parts barabar hain? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki roshni ball ko rokta hai, isliye uske peeche zameen par dark shadow banti hai. Ball ke peeche shadow kahan hogi? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Chidiya ki chonch chhoti, pointed aur hard hoti hai; kya tum uska shape describe karoge? |
| c4-half | half ka picture banao | yes |  | half | Dekho: ek poori roti ko beech se kaato; do barabar parts milte hain. Unmein ek part kya kehlaayega? |
| c4-example-again | ek aur example do | yes |  | Find each · change · Check · every step · Write the rule · Find the | Jaise tumhare tiffin mein 3, 6, 9 biscuits hon, har baar 3 badh rahe hain; next number kya hoga? |
| c4-moon | chaand dikhao | yes |  | chaand | Dekho, chaand ka ek patla tukda dikh raha hai, jaise cricket bat ka halka curve. Tumhe kitna hissa dikhta hai? |
| c4-game | game khelte hain | **no** | no interactive piece (mounts: -; studio: -) |  | Chalo spoken game: main shape bolungi, tum batao fold karne par dono sides milengi ya nahi. Pehla: heart shape? |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf safed, thos tukda hota hai; bhaap garam, dikhne wali halki mist hoti hai. Dono water ke forms hain—baraf ya bhaap kab banti hai? |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Kiko, 1/4, 0 aur 1 ke beech hai; 0 se 1 tak 4 equal parts honge, aur yeh pehle part par baithega. 1/4 ke baad kaunsa mark aayega? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka jhanda hai: upar kesari, beech safed, neeche hara; beech mein neela Ashok Chakra hota hai. Aap Republic se kaunsi date jodenge |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Hexagon chhe sides wala polygon hota hai—jaise honeycomb cell. Ismein sides ginke batayiye: hexagon mein kitni sides hoti hain? |
| c5-directions | map pe direction dikhao | **no** | no page |  | Dekhiye: upar North, neeche South, right East, left West. Beech ka point start hai. Start se right jaane par kaunsi direction hogi? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | seed · sprout · young plant · flowering plant · fruit · new seeds | Kiko, plant cycle mein seed, sprout, young plant, flowering plant, fruit aur phir naye seeds bante hain. Pehla stage kaunsa hai? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Dekhiye: −3, −4 aur −2 ke beech, zero se 3 equal steps left hota hai. −3 ke dono padosi kaunse hain? |
| c6-example | ek example do | **no** | page has no worked content | 4 8 | Jaise aap 8 mein se 4 runs lete hain: 4/8, aur divide karke 2/4; dono same amount. Aap 2/4 ko aur kaise likhenge? |
| c6-evaporation | evaporation ka diagram banao | yes |  | water vapour · evaporation | Evaporation mein liquid water garam hokar water vapour banta hai. Sochiye: dhoop mein puddle ka water dheere-dheere kahan gaya? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad ko aise dekhiye: neeche ghaati, beech mein dhalan, upar choti; dhalan par seedhi kheti ki pattiyan. Aapko kaunsa hissa dikhta hai? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Dekhiye: cell, wires, switch aur bulb ek band loop mein jude hain; switch band hone par bulb light karta hai. Switch khula ho toh kya hoga? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | Dekhiye: 0 se 1 ke beech 10 equal parts hain; 0.5, paanchve mark par hai. 0.5 ke aas-paas 0.45 kahan hoga? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Dekhiye: Sun — Moon — Earth; Moon ki shadow Earth par padti hai. Is picture mein beech mein kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: even-odd game—har number ke liye batayein, pair poori banegi ya ek bachega? Pehle 7. |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · cell wall · cell membrane · chloroplasts · cytoplasm | Kiko, dekhiye: cell ek chhota dabba jaisa; baahar cell membrane, andar cytoplasm, beech mein nucleus. Iska shape aapko kaisa dikh raha hai? |
| c8-square | isko draw karke samjhao | yes |  | 3 × 3 = ? | Screen par 3 rows aur har row mein 3 dots dekhiye. Ab sab dots gin kar total batayiye. |
| c8-example | ek example do na | yes |  | 100 rupees ka 20 percent · 100 × 20 · 100 · 20 rupees · 50 ka 20 percent = ? | Jaise 100 rupees ka 20 percent: 100 ko 20 se multiply karke 100 se divide karenge, yani 20 rupees. Aap 50 ka 20 percent batayenge? |
| c9-flower | phool ke parts draw karo | **no** | no page |  | Phool ko picture mein sochiye: baahar green sepal, rangin petal; andar stamen pollen banata, pistil mein stigma hota. Stigma ka kaam kya hoga? |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo | Aloo gol-sa, bhura, zameen ke andar ugta hai; uska sketch aur parts ke numbers dikhaye gaye hain. Recursive rule mein agla number kaise milega? |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | Kiko, dekhiye: 3/4, 0 aur 1 ke beech hai; 0 se 1 ko 4 equal parts mein baantkar, teesre point par rakhiye. Aap kaunsa point count karenge? |