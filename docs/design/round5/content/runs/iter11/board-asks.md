# Board asks: 35/40

```json
{
 "date": "2026-10-15T07:45:22.321Z",
 "base": "http://localhost:8097",
 "n": 40,
 "passed": 35,
 "share": 87.5,
 "byKind": {
  "numline": "6/6",
  "shape": "6/6",
  "example": "4/4",
  "picture": "8/11",
  "game": "3/3",
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
| c1-numline | number line pe dikhao 1 se 9 tak | yes |  | 0 · 1 · 9 | Dekho: 1, 2, 3, 4, 5, 6, 7, 8, 9; har number ek barabar step hai. 1 aur 9 ke beech kitne steps? |
| c1-shapes | circle aur triangle draw karke dikhao | yes |  | triangle | Circle gol hota hai, triangle ke teen kone hote hain; dono ke sketches ban rahe hain. Tum kaise sort karoge? |
| c1-example | ek example do | yes |  | ₹20 · ball · ₹12 · ₹20 ? ₹12 | Jaise tumhare paas 20 rupees hain, ball 12 rupees ki hai; tumhare paise enough hain ya nahi? |
| c1-mango | aam dikhao | yes |  | aam · 1 ? ? · once · no skip · no twice | Aam peela, gol fruit hota hai; ismein ek beej hota hai. Aam mein kitne beej dikh rahe hain? |
| c2-triangle | triangle draw karo | yes |  | side · corner · triangle | Triangle aise dikhta hai: teen seedhi sides milkar teen corners banati hain. Tum kitne corners dekh rahe ho? |
| c2-coin-photo | sikke ki photo dikhao | **no** | no picture and no honest can't |  | Dekho: sikka gol hota hai; uspar number, jaise 5 ya 10, likha hota hai. Tumhe kaunsa number dikhega? |
| c2-game | game khelna hai | yes |  |  | Screen par 12 aur 4 dekho: game mein 12 balls ko 4 players mein baanto. Har turn ek ball—pehli kisko? |
| c2-hindi-draw | isko draw karo | **no** | no page |  | Teen boxes—subah, shaam, raat. Pehle box mein daadi aur Neema: subah kya hua? |
| c3-plant-pic | plant ka picture dikhao | yes |  | plant | Kiko, plant dekho: neeche roots, beech mein stem, uspar leaves, flowers aur fruits with seeds. Tumhe pehle kya dikha? |
| c3-river | nadi dikhao | **no** | no picture and no honest can't |  | Dekho, nadi ek lambi, behati paani ki dhaar hoti hai. Nadi se paani kahan ja sakta hai? |
| c3-numline-add | number line pe dikhao 23 plus 14 | yes |  | 23 · 23 · 14 equal jumps · ? | Kiko, 23 se shuru karo: 14 equal jumps aage—pehla jump kis number par aayega? |
| c3-clock | ghadi draw karo | yes |  | Short hand · Long hand · Shows the hour · Shows the · minutes · Between | Dekho, ghadi gol hai: andar 1 se 12 numbers; short hand hour, long hand minutes dikhati hai. Short hand pehle? |
| c3-aloo | aloo dikhao | yes |  | aloo · aloo | Aloo gol-brown hota hai; andar safed, chilka bahar. Poora aloo aur kata aloo hai—tum kya dekhte ho? |
| c3-equal-parts | equal parts draw karke dikhao | yes |  | equal parts · equal parts | Dekho: ek circle ke beech seedhi line—do parts, dono same size. Isse kya kehte hain? |
| c4-shadow | shadow kaise banta hai draw karke dikhao | yes |  | Sun low · in east · Long west · shadow · Sun high · at noon | Dekho: Sun ki light ball ko rokti hai, aur ball ke peeche dark shadow banti hai. Tum shadow kahan dekhoge? |
| c4-beak-photo | chidiya ki chonch ki photo dikhao | yes |  | Bird beaks · Bird feet · Hooked · Webbed feet · Long and · pointed | Kiko, chidiya ki chonch kuch birds mein hooked, aur kuch mein long-pointed hoti hai; tum kaunsi shape dekhoge? |
| c4-half | half ka picture banao | yes |  | one-half · one-quarter · more equal parts | Kiko, half ka matlab: ek poori cheez ko do barabar parts mein baantna. Dono parts mein se ek part kaunsa hoga? |
| c4-example-again | ek aur example do | yes |  | choose next number · ? , ? , 17 , 22 , 27 · rule = add ? | Jaise school mein pencils 3, 6, 9 milen, har baar 3 add; next number kya hoga? |
| c4-moon | chaand dikhao | yes |  | chaand · 2 | Dekho, Moon kabhi poora gol, kabhi aadha, kabhi patla dikhta hai. Tum abhi kaunsa shape dekh rahe ho? |
| c4-game | game khelte hain | yes |  |  | Chalo spoken activity: main object bolungi, tum batao fold karne par dono sides milengi? Ball ya bat—pehla choose karo. |
| c5-ice-steam | baraf aur bhaap ka diagram dikhao | **no** | no page |  | Baraf safed, thandi aur sakht hoti hai; bhaap garam, halki dhund jaisi hoti hai. Arrows aur labels changes dikhate hain. Aap bataiye: baraf pighalne par kya ban |
| c5-numline-frac | number line pe 1/4 dikhao | yes |  | 0 · 1 · 1/4 | Kiko, 1/4, 0 aur 1 ke beech hai; 0 se 1 tak 4 equal parts mein baantkar, pehle mark par rakhiye. Aap kaunsa number dekhenge? |
| c5-flag | tiranga dikhao | yes |  | tiranga | Tiranga teen rangon ka jhanda hai: upar kesariya, beech mein safed Ashoka Chakra, neeche hara. Aap bataiye, beech mein kya hota hai? |
| c5-hexagon | hexagon draw karo | yes |  | six · hexagon · octagon | Kiko, hexagon chhe sides aur chhe corners wali shape hoti hai; board par iska outline aur “six” label dikh raha hai. Isme sides giniye. |
| c5-directions | map pe direction dikhao | yes |  | north · east · south | Dekhiye: north upar, east daayen, south neeche; board par teen equal boxes isi seedhi line mein dikhte hain. Beech ke box se upar kaunsa direction hai? |
| c6-lifecycle | plant ki life cycle draw karo | yes |  | plant ki life cycle | Kiko, plant life cycle: seed → sprout → young plant → flowering plant → fruit with seeds. Is cycle ka first stage kya hai? |
| c6-numline-neg | number line pe minus 3 dikhao | yes |  | 0 · -3 | Dekhiye: −3, −4 aur −2 ke beech, zero se left, 3 equal steps par hota hai. −3 ke dono neighbours kaunse hain? |
| c6-example | ek example do | yes |  | ? = ? · same amount | Jaise pizza ke 2 out of 4 slices aur 1 out of 2 slices same amount hain. Aap batayiye: 2 out of 4 ko kaise likhenge? |
| c6-evaporation | evaporation ka diagram banao | yes |  | evaporation · ? | Kiko, evaporation mein liquid water dheere-dheere water vapour banta hai; garam surface se vapour upar jaata hai. Aap batayiye, paani kis form mein badla? |
| c6-mountain-photo | pahad ki photo dikhao | **no** | no picture and no honest can't |  | Dekhiye: pahad ka neecha hissa garam, upar wala hissa thanda; unchai badhne par hawa thandi hoti hai. Upar jaakar temperature ka kya hoga, batayiye. |
| c7-circuit | circuit draw karke dikhao | yes |  | Cell is source · Switch · closes gap · Circuit path · complete · Bulb lights | Dekhiye: Cell — Switch — Bulb — wire se wapas Cell; closed path banne par bulb lights. Switch gap ko close karta hai. Aap bataiye, gap open ho toh bulb kya kare |
| c7-numline-dec | number line pe 0.5 dikhao | yes |  | 0 · 1 · 0.5 | Dekhiye: 0.5, 0 aur 1 ke beech hai; 0 se 1 tak 10 equal parts mein, paanchve part par. Aap 0.5 ko 0.45 se compare kijiye. |
| c7-eclipse | solar eclipse ka picture dikhao | yes |  | Solar eclipse · Lunar eclipse · Moon between · Sun Earth · Earth between · Sun Moon | Dekhiye: Sun, beech mein Moon, aur Earth—Moon ki shadow Earth par padti hai. Is arrangement ko Solar eclipse kehte hain. Aap beech mein kaun hai, batayiye? |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: har number ke last digit ko dekhein; pehle 7 batayein—odd ya even? |
| c8-cell | cell ka diagram banao | yes |  | Plant cells · Animal cells · Cell wall · Cell membrane · Chloroplasts · Cytoplasm | Dekhiye: cell ek chhota box jaisa; bahar cell wall, andar cell membrane aur nucleus. Plant cell mein wall hoti hai; animal cell mein nahi. Aap kis cell ka naam  |
| c8-square | isko draw karke samjhao | yes |  | 3 × 3 = 9 | 3 rows, har row mein 3 dots: 3, 6, 9. Total 9; ise 3 ka square kehte hain. Aap 4 rows count kijiye. |
| c8-example | ek example do na | yes |  | Find 1% · Find ?% · Add GST · Final price | Example: ₹500 ke bat par 10 percent discount. Pehle 1 percent, yani ₹5; phir 10 percent kitne honge, aap bataiye. |
| c9-flower | phool ke parts draw karo | yes |  | phool ke parts | Kiko, phool ka real picture kuch seconds mein aayega; sepal baahar, petals rangin, stamen pollen banata, pistil beech mein hota—pistil ka pehla part batayiye. |
| c9-aloo-offtopic | aloo dikhao | yes |  | aloo | Aloo gol-matol, bhoora, mitti ke neeche ugta hai; sketch mein chilka aur andar ka hissa dikh raha hai. Is pattern ka next number boliye. |
| c9-numline-rational | number line pe 3/4 dikhao | yes |  | 0 · 1 · 3/4 | Kiko, 3/4, 0 aur 1 ke beech hai: 0 se 1 tak 4 equal parts; teesre part par point—3/4. Aap 1/4 kahan rakhenge? |