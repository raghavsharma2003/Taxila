# Board asks: 35/40

```json
{
 "date": "2026-10-14T21:09:21.302Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 35,
 "share": 87.5,
 "byKind": {
  "numline": "6/6",
  "shape": "4/6",
  "example": "3/4",
  "picture": "10/11",
  "game": "3/3",
  "draw": "9/10"
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Dekho: 1 se 9 tak har number ek-ek step aage hai; 1 aur 9 ke beech kitne steps hain? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | circle aur triangle | Circle gol hota hai, triangle ke teen straight sides hote hain; ab rule choose karke dono ko kaise sort karoge? |
| c1-example | ek example do | **no** | no page |  | Jaise tumhare paas 10 rupees hain, pencil 6 ki hai; 10, 6 se zyada hai. Kya paisa enough hai? |
| c1-mango | aam dikhao | yes |  | aam · 5 · ? | Aam gol aur peele dikhte hain; tasveer mein 5 aam hain. Tum pehle kis aam ka naam loge? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Kiko, triangle teen seedhi lines wala shape hota hai, aur uske teen corners hote hain; tum kitne corners ginoge? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke | Kiko, sikke ki asli photo abhi ban rahi hai; isme gol shape aur ek number dikhega. Tum kaunsa number dekhna chahoge? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 aur 4 dekho—12 balls ko 4 players mein ek-ek karke baanto; pehli baari kisko? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par teen boxes dekho: subah, shaam, raat. Subah wale box mein Dadi aur Neema hain—tum kya dekh rahe ho? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant · Pehle kya? | Kiko, plant ka real picture kuch seconds mein aayega; usmein roots, stem, leaves, flowers aur fruits honge. Tum pehle kya dekhoge? |
| c3-river | nadi dikhao | yes |  | Rain · River or · ground · Pump · Tank · Pipe | Dekho, nadi ek lambi, behati water stream hoti hai; tum batao, nadi ka paani aage kahan ja sakta hai? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 14 23 · 14 · 23 | Dekho: 23, 24 ke beech 3 parts; 14, 15 ke beech 4 parts. Pehle kaunsa number line par aayega? |
| c3-clock | ghadi draw karo | **no** | no page |  | Ghadi gol hoti hai: chhota Short hand hour batata, lamba Long hand minutes; numbers 1 se 12 tak hote hain. Tum kya dekhoge? |
| c3-aloo | aloo dikhao | yes |  | aloo | Aloo zameen ke andar ugta gol bhura food hai; ise chilkar aksar cook karke khate hain. Tum aloo raw ya cooked khaoge? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | 1/2 · 1/2 · equal parts · same size? | Dekho, ek poora circle do barabar parts mein hai—har part half. Kya dono parts same size dikh rahe hain? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki roshni object se rukti hai; peeche ki zameen par dark shape banti hai—shadow. Uski shape kaisi dikhti hai? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Chidiya ki chonch ka real picture kuch seconds mein aayega; tum batao, chonch kis jagah hoti hai? |
| c4-half | half ka picture banao | **no** | no page |  | Kiko, half ka picture ban raha hai: ek poori roti do barabar parts mein banti hai—tum kitne parts dekh rahe ho? |
| c4-example-again | ek aur example do | yes |  | choose next number · ? , ? , 17 , 22 , 27 · rule = add ? | Jaise har din 3 aam milen: 3, 6, 9. Agle din kitne aam milenge? |
| c4-moon | chaand dikhao | **no** | no picture and no honest can't |  | Kiko, chaand kabhi gol, kabhi aadha, kabhi patli katori jaisa dikhta hai; tumhe kaunsi shape dikhi? |
| c4-game | game khelte hain | yes |  |  | Chalo, spoken activity: cricket bat ko seedha beech se fold socho; dono sides same hongi? Tum batao. |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf thandi, safed, sakht hoti hai; bhaap garam, rangheen, hawa mein faili hoti hai. Dono water ke forms hain—baraf kaise banti hai? |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Kiko, 1/4, 0 aur 1 ke beech hota hai: line ko 4 equal parts mein baantkar pehle mark par rakhiye. Aapka mark kahan hoga? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga aayatakar flag hai: upar kesari, beech safed, neeche hara, aur beech neela Ashoka Chakra; aap bataiye, yeh kab fahraaya jaata hai? |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Hexagon chhah sides aur chhah corners wala band shape hota hai. Aap batayiye, iske kitne sides hain? |
| c5-directions | map pe direction dikhao | yes |  | north · east · south | Dekhiye: upar North, daahine East, neeche South; board mein teen equal boxes isi order mein hain. Aap North ke opposite kaunsa direction dekhenge? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | seed · sprout · young plant · flowering plant · fruit · new seeds | Plant cycle mein seed, sprout, young plant, flowering plant, fruit aur phir naye seeds hote hain. Aap pehla stage kaunsa rakhenge? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Dekhiye: −3, −4 aur −2 ke beech, zero se left, teen equal steps par hai. −3 ke dono padosi kaun hain? |
| c6-example | ek example do | yes |  | 1/2 · = · 2/4 · 1/2 = ? | Jaise 1 pizza ka 2 mein se 1 hissa, 4 mein se 2 hisson ke barabar hai. Aap 1/2 ka ek aur equivalent fraction batayiye. |
| c6-evaporation | evaporation ka diagram banao | yes |  | evaporation | Kiko, evaporation mein liquid water se vapour upar jaata hai; garam dhoop wala puddle sochiye. Isme water kis direction mein move karega? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad ki real picture kuch seconds mein aa rahi hai. Ismein dekhiye: neeche valley, upar steep slopes, aur choti par peak. Aapko sabse upar kya dikhega? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Kiko, dekhiye: Cell source hai; wires switch aur bulb ko jodte hain. Switch close karne par complete path banta hai, bulb jalta hai. Switch open ho to? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | Dekhiye: 0.5, 0 aur 1 ke beech hai; line ko 10 equal parts mein baantkar, 0 se paanchva mark 0.5 hai. 0.5 kis ke paas hai? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Aapke liye solar eclipse ka real picture abhi ban raha hai: Moon, Sun aur Earth ke beech aakar Sun ko dhak raha hai. Ismein beech mein kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: har number ke objects ko pairs mein baantiye. Kiske saath ek object akela bachega—7 ya 100? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · cell wall · cell membrane · chloroplasts · cytoplasm | Dekhiye, cell ko ek chhote room jaisa sochiye: bahar cell membrane, andar cytoplasm, beech mein nucleus. Is room ka kaam kya hoga? |
| c8-square | isko draw karke samjhao | yes |  | 3 × 3 = ? | Screen par 3 rows dekhiye; har row mein 3 dots hain: 3 groups of 3. Aap total dots gin kar batayiye. |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% GST · Add GST · Final price | Jaise 200 rupaye ka 10 percent: pehle 1 percent, 2 rupaye; phir 10 percent, 20 rupaye. Aap 50 ka 20 percent nikaaliye. |
| c9-flower | phool ke parts draw karo | **no** | no page |  | Real flower picture kuch seconds mein aayegi; board simple sketch bana raha hai: sepal, petal, stamen, pistil—parts aur unke numbers. Aap pistil ka role bataiye |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo | Aloo gol, halka bhura, mitti ke neeche ugta hai; picture ban rahi hai. Is sequence mein har baar kitna step badh raha hai? |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | 3/4, 0 aur 1 ke beech hai; 0 se 1 tak 4 equal parts mein, third mark par. Aap bataiye, 1/4 kahan hoga? |