# Board asks: 36/40

```json
{
 "date": "2026-10-14T18:37:58.328Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 36,
 "share": 90,
 "byKind": {
  "numline": "5/6",
  "shape": "5/6",
  "example": "3/4",
  "picture": "11/11",
  "game": "2/3",
  "draw": "10/10"
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Kiko, number line mein 1 se 9 tak barabar steps hain; 1 ke baad kaunsa number aata hai? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, triangle ke teen sides aur teen corners hote hain. Tum inhe kis rule se sort karoge? |
| c1-example | ek example do | yes |  | Check money · and price · Add the prices · Pay the price · Find the · change | Jaise tumhare paas 10 rupees hain, aur pencil 6 ki hai: paise price se zyada hain. Kya khareed sakte ho? |
| c1-mango | aam dikhao | yes |  | aam | Aam gol-peela phal hai, upar ek chhoti dandi; picture mein 5 aam ek line mein hain. Kitne aam dikh rahe hain? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Dekho, triangle aisa hota hai: teen seedhi sides aur teen corners wala shape. Tum kitne corners gin rahe ho? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | 5 · sikke | Dekho: ₹5 ka sikka gol hai, beech mein 5 likha hai. Tum ₹5 ke kitne sikke loge? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 balls aur 4 players dekho; ek-ek ball baantkar pehle player ko kitni mili? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par dekho: teen boxes—subah, shaam, raat. Subah wale box mein Neema aur Daadi ko dekho. Kya dikh raha hai? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant · ? | Dekho, plant mein roots neeche, stem beech, leaves side, flower upar, aur fruit flower ke paas hota hai. Tum pehle kya dhoondhoge? |
| c3-river | nadi dikhao | yes |  | nadi · rain | Kiko, nadi ek lambi, behti water-line hoti hai; pahadon se nikal kar samundar tak ja sakti hai. Nadi kahan behti hai? |
| c3-numline-add | number line pe dikhao 23 plus 14 | **no** | no number line |  | Kiko, 23, 24, 25… 14 equal jumps aage: 23 se shuru karke har jump ka number bolo—pehla kya hoga? |
| c3-clock | ghadi draw karo | **no** | no page |  | Ghadi gol hai: chhoti hand hour, badi hand minute; numbers 1 se 12 tak. Chhoti hand ka kaam kya hai? |
| c3-aloo | aloo dikhao | yes |  | aloo | Aloo gol-brown hota hai, andar safed; ise raw bhi aur cooked bhi khate hain. Aloo kis group mein? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | whole · 1/2 · ? · equal parts | Dekho: ek poora circle do same-size parts mein hai—ye equal halves hain. Kya dono parts barabar dikh rahe hain? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki light tum par rukti hai, isliye tumhare peeche dark shadow banti hai. Shadow kis taraf hogi? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Chidiya ki chonch chhoti, nokili aur peeli-bhoori ho sakti hai; yeh face ke aage hoti hai. Tum uski shape batao. |
| c4-half | half ka picture banao | yes |  | half | Dekho, half ka picture: ek circle do equal parts mein; ek part shaded, ek part khaali. Tum kya dekh rahe ho? |
| c4-example-again | ek aur example do | yes |  | Find each · change · Check · every step · Write the rule · Find the | Jaise ghar mein plates: 3, 6, 9, 12. Har baar 3 judta hai. Agla number kya hoga? |
| c4-moon | chaand dikhao | yes |  | chaand | Kiko, chaand kabhi gol, kabhi aadha, kabhi patli si katori jaisa dikhta hai; tumne kaunsi shape dekhi? |
| c4-game | game khelte hain | **no** | no interactive piece (mounts: explainer@1; studio: -) |  | Tumhari baari. |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf safed, thos ice hoti hai; bhaap garam, bina rang ki water vapour hoti hai. Dono water ke forms hain—baraf pighalti hai, bhaap condense hoti hai. Aap batai |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Dekhiye: 1/4, 0 aur 1 ke beech hai; 0 se 1 tak 4 equal parts, aur yeh pehla part hai. 1/4 ke baad kaunsa fraction? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka flag hai: kesari, safed, hara; beech mein neela Ashoka Chakra hota hai. Aap bataiye, 26 January kis din hai? |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Aapko hexagon dikh raha hai: ismein 6 seedhi sides aur 6 corners hote hain. Aap sides gin kar batayiye—kitni? |
| c5-directions | map pe direction dikhao | yes |  | North · South · East · West · direction | Kiko, map mein upar North, neeche South, right East, aur left West hota hai. Aapke ghar se school right ho, toh direction kya hogi? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | seed · plant ki life cycle | Plant life cycle mein seed, sprout, young plant, flowering plant, fruit aur phir naye seeds hote hain. Aap pehla stage bataiye. |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Dekhiye: −3, −4 aur −2 ke beech, 0 se teen equal steps left hai. Iske bilkul paas kaunsa whole number hai? |
| c6-example | ek example do | **no** | page has no worked content | 2 4 | Example: pizza ke 2/4 hisson jitna khaana, 1/2 pizza ke barabar hai. Kya dono mein khaayi hui quantity same hai? |
| c6-evaporation | evaporation ka diagram banao | yes |  | liquid water · water vapour · puddle · evaporation · vapour? | Evaporation mein liquid water heat paakar vapour banta hai; puddle se upar jaate tiny water particles imagine kijiye. Ismein water kis form mein gaya? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad ko aise dekhiye: neeche chauda base, upar pointed peak, aur sides steep slopes. Aapko kaunsa hissa zyada khada dikh raha hai? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Kiko, dekhiye: Cell se wire Switch tak, phir Bulb tak, aur wire wapas Cell tak—poora path bulb jalata hai. Switch khula ho toh kya hoga? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | Dekhiye: 0 se 1 ke beech 10 equal parts hain; 0.5, paanchve part par, bilkul beech mein hai. 0.5 ke aas-paas 0.45 ya 0.405? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Dekhiye: Surya, beech mein Moon, aur sabse peeche Earth—Moon ki shadow Earth par padti hai. Ismein beech mein kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: dono ko do-do ki jodiyon mein baantiye; kis number mein ek akela bachega? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · cell wall · cell membrane · chloroplasts · cytoplasm | Dekhiye: ek plant cell ko box jaisa sochiye—bahar cell wall, andar cytoplasm, nucleus aur bada vacuole. Is shape se protection milti hai. Aap animal cell ko kai |
| c8-square | isko draw karke samjhao | yes |  | 3 columns · 3 rows | Screen par 3 rows aur 3 columns dekhiye—har khane mein ek player. Total khane gin kar bataiye: kitne players hain? |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% · Add to whole · Check · final price | Example: 100 runs mein 12 runs bonus hon, toh bonus 12 percent hai. 200 runs ka 12 percent kitna hoga? |
| c9-flower | phool ke parts draw karo | yes |  | phool ke parts | Kiko, flower ko chhote rangin petals gherte hain; andar stamen pollen banata hai, aur beech pistil ka stigma pollen receive karta hai. Stigma ka role kya hai? |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo · 6 · 12 · 18 · ? | Aloo gol, halka bhura vegetable hota hai, zameen ke andar ugta hai. Iska sketch ek gol shape aur chhote dots dikhata hai. Aloo 6, 12, 18 ke baad kitna hoga? |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | Dekhiye: 3/4, 0 aur 1 ke beech hai; 0 se 1 ko 4 equal parts mein baantkar, teesre part par rakhiye. Aap kaunsa point lenge? |