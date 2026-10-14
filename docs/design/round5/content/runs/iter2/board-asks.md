# Board asks: 33/40

```json
{
 "date": "2026-10-14T17:34:46.343Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 33,
 "share": 82.5,
 "byKind": {
  "numline": "4/6",
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 1 9 · 1 · ? · ? · once | Dekho: 1 aur 9, dono number line par; 1 se 9 tak har number ek barabar step par hai. Tum 1 se 9 bolo. |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, triangle ke teen straight sides hote hain. Tum inhe kis rule se saath rakhoge? |
| c1-example | ek example do | yes |  | money · price · enough? · money · price | Jaise tumhare paas 10 rupees hain, aur ball 7 ki hai; kya tumhare paise enough hain? |
| c1-mango | aam dikhao | yes |  | aam · 1 · ? · ? | Dekho, aam peela, gol aur ek hota hai; tum batao, is aam ko ginte waqt kaunsa number bolenge? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Triangle aise dikhta hai: teen seedhi lines milkar ek band shape banati hain. Iske kitne corners dikh rahe hain? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke · 5 | Dekho, sikka gol hota hai; uspar number likha hota hai, jaise 5. Tumhe kaunsa number dikh raha hai? |
| c2-game | game khelna hai | yes |  |  | Kiko, screen par 12 aur 4 dekho; ek-ek karke 12 balls 4 players ko do. Har player ko kitni? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par flow dekho: subah, shaam, raat ke teen boxes; pehle box mein dadi aur Neema dekho—kya ho raha hai? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant · ? | Dekho, plant ke picture mein roots, stem, leaves, flowers aur fruits dikhte hain. Tum sabse neeche kya dekhte ho? |
| c3-river | nadi dikhao | yes |  | paani · samundar · nadi | Dekho, nadi pahaadon se neeche behti lambi paani ki dhaar hoti hai; kya nadi samundar tak pahunchti hai? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 14 23 · 35 · +10 · ? · ones digit same | Dekho: 23 ke beech 20 aur 30; 14 ke 10 aur 4 parts. Pehle 23 se 10 jump karo—kahan? |
| c3-clock | ghadi draw karo | **no** | no page |  | Dekho, ghadi gol hai: chhota hand hour, bada hand minutes; minute hand 9 par ho, to kitne minutes? |
| c3-aloo | aloo dikhao | yes |  | aloo · food part · aloo → plant? | Aloo gol-bhura hota hai, andar se safed; yeh zameen ke neeche plant ka food part hai. Kya aloo plant se aata hai? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | Whole · 2 equal parts · ? equal parts · 2 quarters · make a half · ? quarters | Dekho: ek circle ko beech se kaato—do same-size parts bante hain; kya dono parts equal hain? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki light object se rukti hai, isliye uske peeche dark shadow banti hai. Tum shadow kis taraf dekhoge? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Chidiya ki chonch chhoti, pointed aur aksar kaali ya peeli hoti hai; tum iska kaam kya sochte ho? |
| c4-half | half ka picture banao | yes |  | one-half · one-quarter · more equal parts | Tum kya badloge? |
| c4-example-again | ek aur example do | yes |  | Find each · change · Check · every step · Write the rule · Find the | Jaise ghar mein plates: 3, 6, 9, 12—har baar 3 plates badh rahi hain. Agla number kya hoga? |
| c4-moon | chaand dikhao | yes |  | chaand · ? · shape | Kiko, chaand kabhi gol, kabhi aadha, kabhi patli line jaisa dikhta hai. Tumhe kaunsi shape dikhi? |
| c4-game | game khelte hain | **no** | no interactive piece (mounts: -; studio: -) | mirror images · line of symmetry | Tum batao. |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf safed, thos aur tukde jaisi hoti hai; bhaap garam, rangheen gas jaisi, hawa mein phailti hai. Dono water ke forms hain—baraf ya bhaap? |
| c5-numline-frac | number line pe 1/4 dikhao | **no** | no number line |  | Aap batayiye, kyun? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka flag hai: upar kesari, beech safed, neeche hara; beech mein neela Ashoka Chakra hota hai. Aap bataiye, 26 January kis baat se  |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Dekhiye, hexagon mein 6 sides aur 6 corners hote hain—jaise honeycomb cell. Aapke hexagon mein kitne corners ginenge? |
| c5-directions | map pe direction dikhao | yes |  | North · South · East · West · direction | Dekhiye: upar North, neeche South, right East, left West. Map mein arrow kis direction ki taraf ja raha hai? |
| c6-lifecycle | plant ki life cycle draw karo | **no** | no page |  | Plant life cycle: seed se chhota sprout, phir leafy plant, flower, aur flower se fruit mein naye seeds. Isme pehla stage kya hoga? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | -3 -2 -1 0 · ? | Dekhiye: minus 3, minus 2 aur zero ke beech, zero se 3 equal steps left hota hai. Minus 3, zero se kitne steps door hai? |
| c6-example | ek example do | **no** | page has no worked content | 3 4 | Example: pizza ke 4 mein 3 slices khaaye, ya 8 mein 6 slices—dono same amount hain. Aap 3/4 ke barabar fraction batayiye. |
| c6-evaporation | evaporation ka diagram banao | yes |  | evaporation | Evaporation mein surface ka liquid water heat lekar water vapour banta hai. Paani ke particles upar jaate dikhaiye—yeh process kab tez hoga? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, dekhiye: pahad neeche chauda, upar chhota aur dhalan wala dikhta hai. Iski dhalan par kheti kaise hogi, aap bataiye? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Kiko, dekhiye: Cell → wire → Switch → wire → Bulb → wire → Cell. Switch gap band karta hai. Gap khula ho toh bulb jalega? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 0.5 1 · ? | Kiko, 0.5, 0 aur 1 ke beech bilkul beech mein hai; number line par iski jagah ke paas kaunsa number dikhta hai? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Dekhiye: Surya, beech mein Moon, aur sabse peeche Earth—Moon ki shadow Earth par padti hai. Is picture mein beech wala object kaunsa hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: har number ke liye jodiyan banaiye—kiske players poore pair honge, aur kaun bachega? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · cell wall · no cell wall · chloroplasts · cell membrane | Dekhiye: cell ek chhoti boundary jaisa hota hai; andar cytoplasm, nucleus aur vacuole jaise parts hote hain. Kaunsa part control centre hai? |
| c8-square | isko draw karke samjhao | **no** | no page |  | Screen par 3 rows aur 3 columns ka geoboard dekhiye: 3 groups of 3. Aap total points gin kar bataiye. |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% GST · Add GST · to price · Check · final price | Example: ₹500 ke bat par 10% discount, 1% = ₹5; isliye 10% = ₹50. Aap bataiye, discount ke baad price kya hoga? |
| c9-flower | phool ke parts draw karo | yes |  | sepals · petals · stamen · pistil · stigma · phool ke parts | Phool ko chhote rang-birange cup jaisa sochiye: bahar sepals, andar petals, beech stamen aur pistil; pistil ke top par stigma hota hai. Stigma ka role kya hoga? |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo | Aloo gol, halka bhura, zameen ke andar ugta hai. Board ka sketch uske parts aur numbers dikhata hai: start, step, term. Aap sequence ka step batayiye. |
| c9-numline-rational | number line pe 3/4 dikhao | **no** | no number line |  | Aap iski jagah 1/2 ko kahan dekhenge? |