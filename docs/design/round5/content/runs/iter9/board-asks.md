# Board asks: 36/40

```json
{
 "date": "2026-10-14T21:31:57.646Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 36,
 "share": 90,
 "byKind": {
  "numline": "6/6",
  "shape": "4/6",
  "example": "2/4",
  "picture": "11/11",
  "game": "3/3",
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Dekho: number line par 1 se 9 tak har number ek-ek barabar step par baitha hai. 1 aur 9 ke beech kitne steps hain? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, triangle ke teen kone hote hain; inhe shape ke rule se ek group mein rakho—kaunsa group? |
| c1-example | ek example do | **no** | no page |  | Jaise cricket ball 10 rupees ki, tumhare paas 15; money zyada hai, isliye tum ball le sakte ho. Kya money enough hai? |
| c1-mango | aam dikhao | yes |  | aam · 1 · ? · ? | Aam peela, gol phal hota hai; iska chhota tana aur ek beej hota hai. Tumne aam mein kya dekha? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Triangle teen seedhi lines wala shape hai; uske teen sides aur teen corners hote hain. Tum sides ginoge ya corners? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke · value · pieces · not always worth more | Dekho, ₹1, ₹2, ₹5 aur ₹10 ke sikke: gol hote hain, upar number unki value batata hai. Tum kaunsa pehchante ho? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 aur 4 dekho; numbers ko use karke sharing game khelo: 12 balls, 4 players—har ek ko kitni? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par teen boxes dekho: pehla “subah”, phir “shaam”, phir “raat”. Pehle box mein kya dikh raha hai? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant | Ek real plant ka picture abhi aa raha hai; usmein roots, stem aur leaves pehle dekho. Tumhe kaunsa part dikha? |
| c3-river | nadi dikhao | yes |  | Rain · River or · ground · Pump · Tank · Pipe | Kiko, nadi lambi behti paani ki dhaar hoti hai; ismein paani pahadon se neeche jaata hai. Nadi kahan jaati hogi? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 14 23 · 35 · +? · ? · 35 to ? · ones digit same | Dekho: 23, 24 ke beech 3 parts; 14, 15 ke beech 4 parts. 23 se 14 jumps karoge—kahan pahunchoge? |
| c3-clock | ghadi draw karo | **no** | no page |  | Dekho, ghadi gol hai: 1 se 12 numbers; chhoti sui hour, badi sui minutes dikhati hai. 7 aur 8 ke beech chhoti sui ho toh hour kya hoga? |
| c3-aloo | aloo dikhao | yes |  | aloo | Aloo gol-bada, bhure chilke wala hota hai; andar safed-peela hissa. Tum aloo raw khaoge ya cooked? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | equal parts | Dekho: roti do barabar hisson mein hai; dono parts same size dikhte hain. Tumhe kitne equal parts dikh rahe hain? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki light ball ko rokne par, ball ke peeche zameen par dark shadow banta hai; Sun kis taraf hai? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Chidiya ki chonch chhoti, pointed, aur aksar dark colour ki hoti hai; photo kuch seconds mein aayegi. Tum uski shape batao. |
| c4-half | half ka picture banao | **no** | no page |  | Kiko, half ka picture: ek poori roti ko do barabar parts mein kaato; ek part half hai. Tum kitne equal parts dekh rahe ho? |
| c4-example-again | ek aur example do | yes |  | choose next number · ? , ? , 17 , 22 , 27 · rule = add ? | Jaise tum 3 biscuits, phir 6, phir 9 lo—har baar 3 badh rahe hain. Next number kya hoga? |
| c4-moon | chaand dikhao | yes |  | chaand | Dekho, chaand kabhi gol, kabhi aadha, kabhi patli curve jaisa dikhta hai. Tumne kaunsa shape dekha? |
| c4-game | game khelte hain | yes |  |  | Chalo, spoken activity: kisi cheez ki beech wali line socho; dono sides milti hain? Cricket bat par try karo. |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf safed, thandi aur solid hoti hai; bhaap garam, colourless gas hoti hai. Real picture kuch seconds mein aayegi. Bhaap kahan milti hai? |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Dekhiye: 1/4, 0 aur 1 ke beech hai; is gap ko 4 equal parts mein baantkar pehla mark 1/4 hota hai. Aap pehla mark batayiye. |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka flag hai: kesariya, safed, hara; beech mein neela Ashoka Chakra hota hai. Yeh kis desh ka flag hai? |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Hexagon mein 6 sides aur 6 corners hote hain—jaise halka sa stretched honeycomb. Aap iske sides gin kar kitna bolenge? |
| c5-directions | map pe direction dikhao | yes |  | north · east · south | Dekhiye: north upar, east daayen, south neeche. Teen equal boxes mein upar wala north, beech wala east, neeche wala south hai. East kis taraf hai? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | plant cycle · ? · plant ki life cycle | Kiko, plant cycle: seed, sprout, small plant, flowering plant, fruit with seeds. Aap batayiye, cycle mein seed ke baad kya aata hai? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Dekhiye: 0 ke left mein 1, 2, 3 equal steps—minus 3, minus 2 aur minus 4 ke beech nahi, minus 2 se ek step left. Aap bataiye, minus 3 kis taraf hai? |
| c6-example | ek example do | **no** | no page |  | Jaise 12 chocolates mein 6 khaaye: 6/12, yani aadha; 2 se baantkar 3/6 bhi wahi amount hai. Aap 3/6 ko aur kaise likhenge? |
| c6-evaporation | evaporation ka diagram banao | yes |  | evaporation · water · water vapour | Evaporation mein dhoop se paani vapour banta hai: neeche bowl mein water, upar hawa mein water vapour. Aap bataiye, paani kis direction mein ja raha hai? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad ki real photo kuch seconds mein aayegi; dekhiye, uski choti, dhalan aur neeche ka maidan—kaunsa hissa sabse ooncha hai? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Kiko, dekhiye: cell, wire, switch, bulb aur wire milkar ek poora loop banate hain. Switch band ho, bulb jalta hai—loop mein gap hai ya nahi? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | Kiko, 0.5, 0 aur 1 ke beech, paanch equal parts mein 0 ke baad paanchve mark par hota hai. 0.5 kis fraction ke barabar hai? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Solar eclipse mein Moon, Sun aur Earth ke beech hota hai; Moon ki shadow Earth par padti hai. Picture kuch seconds mein aayegi—beech mein kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: har number ke objects ko pairs mein sochiye—7 mein kitne bachenge, 100 mein kitne? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · Cell wall · No cell wall · Chloroplasts · Cell membrane | Kiko, plant cell ko box jaisa sochiye: bahar cell wall, andar cell membrane, beech nucleus, aur ek bada vacuole. Ismein sabse bahar kya hai? |
| c8-square | isko draw karke samjhao | yes |  | 3 × 3 = ? | Screen par 3 by 3 geoboard dekhiye: 3 rows, har row mein 3 points. Har row gin kar total points kitne dikh rahe hain? |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% GST · Add GST · Final price | Example: 800 rupaye ke bat par 12% GST. 1% equals 8 rupaye, isliye 12% GST equals 96 rupaye. 1% kaise mila? |
| c9-flower | phool ke parts draw karo | yes |  | sepal · petal · stamen · pistil · Pollen? | Kiko, real picture kuch seconds mein aayegi; meanwhile board flower ke 4 parts dikhata hai: sepal, petal, stamen, pistil. Inmein pollen kahan banta hai? |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo | Aloo gol-matol, halka bhura, zameen ke andar ugta hai; real picture kuch seconds mein aayegi. Is aloo ko sequence ke first term se kaise jodenge? |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | 3/4, 0 aur 1 ke beech hai: 0 se 1 tak 4 equal parts, aur 3 parts aage. Aap ise mark kahan karenge? |