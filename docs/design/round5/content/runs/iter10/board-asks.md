# Board asks: 38/40

```json
{
 "date": "2026-10-14T21:37:41.580Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 38,
 "share": 95,
 "byKind": {
  "numline": "6/6",
  "shape": "5/6",
  "example": "4/4",
  "picture": "10/11",
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Dekho: number line 1 se 9 tak hai—har number ke beech ek barabar step; 1 aur 9 ke beech kitne steps? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | circle aur triangle | Circle gol hota hai, triangle ki teen sides hoti hain; tum dono ko shape ke hisaab se kaise group karoge? |
| c1-example | ek example do | yes |  | Check money · and price · Add two prices · Subtract price · from money · Find your | Jaise cricket bat 15 rupees ka, tumhare paas 20: 20 zyada hai, isliye paise enough hain. Tum batao? |
| c1-mango | aam dikhao | yes |  | aam · 1 · ? · ? · once | Aam peela ya hara, gol-sa hota hai; chhoti dandi aur ek badi guthli hoti hai. Tumne aam ginne hain? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Kiko, triangle teen seedhi lines wala shape hota hai, jisme teen corners bhi hote hain. Tum kitne sides ginoge? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke · ? | Dekho, sikke gol hote hain; un par number likha hota hai. Real coin picture kuch seconds mein aayegi. Tum kaunsa number dekhna chahoge? |
| c2-game | game khelna hai | yes |  |  | Kiko, screen par 12 objects aur 4 groups dekho; ek-ek karke baanto. Har group mein kitne aayenge? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par teen boxes dekho: subah, shaam, raat. Subah wale box mein daadi aur Neema ko dekho—kya ho raha hai? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant | Plant ka picture kuch seconds mein aayega: roots neeche, stem beech, leaves upar; tum pehle kya dekhoge? |
| c3-river | nadi dikhao | yes |  | nadi | Nadi lambi, tedhi water-line hoti hai; ismein baarish ka paani behkar aage jaata hai. Tumne nadi kahan dekhi? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 20 30 · 23 · 10 20 · 14 · ? | Kiko, 23 number 20 aur 30 ke beech, 3 parts aage; 14, 10 aur 20 ke beech, 4 parts aage. 23 kahan hoga? |
| c3-clock | ghadi draw karo | yes |  | hour · minutes · o'clock | Ghadi gol hai: chhota hand hour, bada hand minutes; numbers 1 se 12 tak. Hour hand kaun sa hai? |
| c3-aloo | aloo dikhao | yes |  | aloo · safed andar · plant · ya · animal | Aloo gol ya thoda lamba, bhure chilke wala hota hai; ise kaatne par andar safed hota hai. Aloo plant se aata hai—plant ya animal? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | equal parts · 1/2 · 1/2 · same size? | Dekho: ek roti ke 2 bilkul barabar hisse hain—har hissa half. Dono hisse same size dikh rahe hain; tum kya notice karte ho? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Look: Sun ki light ball par pade, ball ke peeche dark shadow banta hai. Shadow kis side dikhega? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Kiko, chidiya ki chonch chhoti, pointed, aur face ke aage hoti hai; kuch chonchein hooked hoti hain. Tumhari nazar mein chonch ka shape kaisa hoga? |
| c4-half | half ka picture banao | **no** | no page |  | Half ka picture kuch seconds mein aayega: ek poori roti do barabar pieces mein, ek piece half hota hai. Tum kitne pieces dekh rahe ho? |
| c4-example-again | ek aur example do | yes |  | choose next number · ? , ? , 17 , 22 , 27 · rule = add ? | Jaise ghar mein plates 3, 6, 9 ho, har baar 3 judta hai. Agli sankhya kya hogi? |
| c4-moon | chaand dikhao | yes |  | chaand | Kiko, chaand ka ek gol hissa roshni wala dikhta hai; tum batao, shape gol hai ya aadhi? |
| c4-game | game khelte hain | yes |  |  | Chalo spoken activity: imaginary paper fold karo; batao, cricket bat ko beech se fold karne par dono sides milengi? |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Baraf safed, thos tukda hota hai; bhaap garam, rangheen gas jaisi hoti hai, jo hawa mein milti hai. Diagram mein ye forms aur changes dikhte hain. Aap batayein, |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Dekhiye: 1/4, 0 aur 1 ke beech hai; line ko 4 equal parts mein baantkar pehla mark 1/4 hota hai. Aap batayenge 3/4 ka mark kahan hoga? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka flag hai: kesariya, safed, hara; beech mein neela Ashoka Chakra hota hai. Aap isse kab dekhte hain? |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Dekhiye: hexagon ek band shape hai, jiske 6 straight sides aur 6 corners hote hain. Aap sides gin kar batayenge: kitni hain? |
| c5-directions | map pe direction dikhao | yes |  | north · east · south | Dekhiye: upar North, neeche South, daahine East, baayen West—jaise cricket pitch par chaar taraf ke raaste. Upar wali direction ka naam kya hai? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | beej · plant · plant ki life cycle | Kiko, plant cycle gol chakkar jaisi hoti hai: beej se naya plant, phir flower aur fruit bante hain. Aap batayiye, cycle kis stage se shuru hogi? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Dekhiye: 0 ke left mein -1, phir -2, phir -3; -3, -2 aur -4 ke beech hota hai. -3 ke baad kaunsa integer aata hai? |
| c6-example | ek example do | yes |  | 1/2 · = · 2/4 · 1/2 = ? | Jaise 1 pizza ka 2 mein se 1 hissa, 4 mein se 2 hisson ke barabar hota hai. Aap bataiye: 1/2 ke equal fraction kaunsa hai? |
| c6-evaporation | evaporation ka diagram banao | yes |  | evaporation | Dekhiye: dhoop ke neeche paani ki boondein chhoti hoti ja rahi hain aur hawa mein ja rahi hain—isse evaporation kehte hain. Aap kya dekh rahe hain? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad ka real picture kuch seconds mein aayega: steep sides, neeche valley, upar thandi hawa—dekhiye, sides seedhi hain ya dheere? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Kiko, dekhiye: Cell, wire, switch aur bulb ek poora loop banate hain; switch band ho to current flow hota hai. Switch khula ho to? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | Kiko, 0.5, 0 aur 1 ke beech aadha hai; line ko 10 equal parts mein baantne par yeh 5th mark hota hai. 0.5 ke paas kaunsa whole number hai? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Solar eclipse ka real picture kuch seconds mein aayega: Moon, Sun aur Earth ke beech hota hai, isliye Sun dhakha dikhta hai. Beech mein kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: har number ke liye pairs banaiye; ek bachhe to odd. Pehle 7 ka bataiye. |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · cell wall · cell membrane · chloroplasts · cytoplasm | Kiko, cell ko ek chhote room jaisa sochiye: bahar membrane, andar cytoplasm, beech mein nucleus. Plant cell mein wall bhi hoti hai. Kaunsa part centre mein hai? |
| c8-square | isko draw karke samjhao | yes |  | 3 columns · 3 rows | Screen par 3 rows aur 3 columns ka geoboard dekhiye; har row mein 3 points hain. Total points kitne dikh rahe hain? |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% · Add GST · Final price | Example: ghar mein 200 biscuits hain; unka 10 percent nikalna ho, pehle 1 percent, yaani 2 biscuits, nikaaliye. 10 percent kitne? |
| c9-flower | phool ke parts draw karo | yes |  | phool ke parts | Kiko, real picture kuch seconds mein aayegi; phool mein sepal, petal, stamen aur pistil hote hain—stamen pollen banata hai. Aap pollen wala part batayiye. |
| c9-aloo-offtopic | aloo dikhao | **no** | no picture and no honest can't |  | Aloo gol, halka bhura hota hai, aur mitti ke neeche ugta hai. Uska sketch aloo aur uske andar chhote dots dikhata hai. Isse sequence jodiye: har baar kya badla? |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | Kiko, 3/4, zero aur one ke beech hai; zero se one tak four equal parts hain, aur yeh third part par baitha hai. One tak kitne parts bachte hain? |