# Board asks: 38/40

```json
{
 "date": "2026-10-14T20:23:33.506Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 38,
 "share": 95,
 "byKind": {
  "numline": "6/6",
  "shape": "5/6",
  "example": "4/4",
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Dekho: 1 se 9 tak line mein har number ek-ek equal step aage hai. 1 aur 9 ke beech kitne steps hain? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, triangle ke teen kone hote hain; inhe colour ke hisaab se kaise sort karoge? |
| c1-example | ek example do | yes |  | money · price · money · balloon · change · costs | Jaise tumhare paas 20 rupees hain, aur balloon 12 ka hai; kya tumhare paise enough hain? |
| c1-mango | aam dikhao | yes |  | aam · 1 · ? · ? · once | Aam peela, gol sa hota hai; uske paas 5 aam dekho. Tum kitne aam ginoge? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Triangle teen seedhi lines aur teen corners wala shape hota hai. Tum iske corners kitne gin pa rahe ho? |
| c2-coin-photo | sikke ki photo dikhao | yes |  | sikke | Dekho: ₹5 ka sikka gol hota hai, uspar “5” likha hota hai. Tumhe ₹5 ke kitne sikke dikh rahe hain? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 balls aur 4 players dekho; game rule: ek-ek ball baanto. Pehli ball kisko doge? |
| c2-hindi-draw | isko draw karo | yes |  | सुबह · शाम · रात | Screen par dekho: teen boxes—subah, shaam, raat. Pehle box mein Daadi Neema ke baal bana rahi hain. Tum kya dekh rahe ho? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant · roots · stem · leaves · flowers · fruits | Dekho, picture mein plant ke five parts hain: roots, stem, leaves, flowers aur fruits; tum roots kahan dekhte ho? |
| c3-river | nadi dikhao | yes |  | nadi | Nadi ek lambi, tedhi water-stream hoti hai, jo pahadon se behkar talaab ya samundar tak jaati hai. Ismein paani kis taraf bahega? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 14 23 · 3 parts · 4 parts · ? tens | Dekho: 23, 24 ke beech 3 parts; 14, 15 ke beech 4 parts—23 se 14 jumps aage, pehle kitne tens? |
| c3-clock | ghadi draw karo | **no** | no page |  | Ghadi gol hai: chhota hand hour, bada hand minutes; 7 aur 8 ke beech chhota hand hai—hour kya hai? |
| c3-aloo | aloo dikhao | yes |  | aloo · plant · ya · animal | Aloo zameen ke andar ugta hai; bahar brown chilka, andar safed-peela hissa. Aloo plant se aata hai—plant ya animal? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | equal parts | Dekho: ek circle ke do bilkul barabar tukde—har tukda half hai. Dono tukde same size kyun hone chahiye? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki roshni ball ko rokne par, ball ke peeche dark shadow banti hai. Ball ke peeche shadow kahan hogi? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Chidiya ki chonch ka photo nahi hai; woh chhoti, pointed, brown beak hoti hai, face ke aage. Tum shape batao? |
| c4-half | half ka picture banao | yes |  | half · ? | Dekho: ek poora circle do barabar parts mein banta hai; ek part half hota hai. Tum kitne parts dekh rahe ho? |
| c4-example-again | ek aur example do | yes |  | Find each · change · Check · every step · Write the rule · Find the | Jaise tum har din 3 toffees paate ho: 3, 6, 9, 12. Agla number kya hoga? |
| c4-moon | chaand dikhao | yes |  | chaand | Chaand kabhi gol, kabhi aadha, kabhi patli katori jaisa dikhta hai. Tumne aaj kaunsa shape dekha? |
| c4-game | game khelte hain | **no** | no interactive piece (mounts: -; studio: -) |  | Chalo “mirror line” game: imaginary fold socho; kya left aur right side ek-doosre par match hongi? |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | yes |  | evaporates · condenses · freezes · melts | Kiko, baraf thandi, sakht aur safed hoti hai; bhaap garam, halki aur aankhon ko lagbhag adrishya. Dono water ke forms hain—baraf ya bhaap kab banti hai? |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Kiko, 1/4, 0 aur 1 ke beech hota hai; is gap ko chaar barabar parts mein baantkar pehle point par rakhiye. Aap 3/4 kahan rakhenge? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen horizontal rangon ka jhanda hai: upar kesariya, beech safed, neeche hara; beech mein neela Ashoka Chakra hota hai. Aap batayenge, 26 January 1950 k |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Dekhiye: hexagon chhe sides aur chhe corners wala band shape hota hai. Board aapke liye chhe sides dikhata hai. Aap sides gin kar batayiye. |
| c5-directions | map pe direction dikhao | yes |  | north · east · south | Dekhiye: teen equal boxes line mein—upar North, beech East, neeche South. East, North ke right side hota hai. Aap East ke opposite kaunsa direction dekhenge? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | seed · sprout · leafy plant · flower · fruit + seeds | Kiko, plant life cycle: seed mitti mein, sprout, leafy plant, flower, phir flower se fruit aur naye seeds. Pehla stage kaunsa hai? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Kiko, −3, −2 aur −1 ke beech hota hai; zero se 3 equal steps left. −3 ke dono paas ke numbers kaunse hain? |
| c6-example | ek example do | yes |  | 1/2 = 2/4 · same amount | Jaise pizza ke 4 tukdon mein 2 khaaye, ya 8 tukdon mein 4—dono aadha pizza hain. Aap bataiye: 6 mein kitne tukde aadha hoga? |
| c6-evaporation | evaporation ka diagram banao | yes |  | liquid water · water vapour · evaporation · ? | Evaporation mein liquid water garam hokar water vapour banta hai; surface se vapour upar jaata hai. Aap batayein, water kis form mein gaya? |
| c6-mountain-photo | pahad ki photo dikhao | yes |  | Steep mountain · slopes · Rain · washes soil · Cut steps · Soil and | Kiko, pahad aise dikhta hai: neeche chaudi zameen, upar choti; kinare dhalan wale. Is tasveer mein aapko choti ke paas kya dikh raha hai? |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Dekhiye: Cell source hai, wires path banate hain, switch gap close karta hai, bulb jalta hai. Aap batayiye, switch open ho toh bulb? |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | 0.5, 0 aur 1 ke beech hai; 0 se 1 tak 10 equal parts, aur 0.5 paanchve part par. Aap 0.45 ko kahan rakhenge? |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Dekhiye: Solar eclipse mein Sun, Moon ke peeche nahi—Moon Sun aur Earth ke beech hota hai. Is picture mein beech wala kaun hai? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: har number ko pairs mein baantiye; jo akela bache, woh odd. 7 mein kya bachega? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · Cell wall · No cell wall · Chloroplasts · Cell membrane | Kiko, dekhiye: cell ek chhote room jaisa—bahar cell membrane, andar cytoplasm, beech mein nucleus. Aap bataiye, nucleus kahan hoga? |
| c8-square | isko draw karke samjhao | yes |  | 3 columns · 3 rows | Screen par 3 rows aur 3 columns dekhiye; har row mein 3 dots hain. Aap total dots gin kar batayiye. |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% · Add GST · Final price | Example: 200 runs ka 10 percent nikaalne ke liye pehle 1 percent, yaani 2 runs, nikaaliye. 10 percent kitne runs honge? |
| c9-flower | phool ke parts draw karo | yes |  | phool ke parts | Phool mein baahar se sepal, rangin petal, pollen-wala stamen, aur beech mein stigma-wala pistil hota hai. Inmein pollen kahan banta hai? |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo | Aloo gol-matol, bhura chilka, andar safed; yeh zameen ke neeche ugta hai. Iske badhne ko sequence mein kaise likhenge? |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | 3/4, 0 aur 1 ke beech hai; 0 se 1 ko 4 equal parts mein baantiye, teesre mark par 3/4 hai. Aap bataiye, 1/4 kahan hoga? |