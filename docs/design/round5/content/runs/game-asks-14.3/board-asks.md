# Board asks: 4/4

```json
{
 "date": "2026-10-15T10:31:27.372Z",
 "base": "http://localhost:8097",
 "n": 4,
 "passed": 4,
 "share": 100,
 "byKind": {
  "game": "4/4"
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
| c2-game | game khelna hai | yes |  |  | Screen par 12 balls aur 4 players dekho; ek-ek ball baantkar pehli baar mein kitni doge? |
| c4-game | game khelte hain | yes |  |  | Chalo spoken activity: main cheez bolungi, tum batao beech ki line se dono hisse milenge? Pehli cheez: butterfly. |
| c7-game | koi game khilao | yes |  |  | Screen par 7 aur 100 dekhiye: number ko pairs mein baantiye; pehle 7 ka turn—ek pair banega, ya ek bachega? |
| c7-game-frac | mujhe game khelna hai | yes |  |  | Screen par pizza dekhiye: marked hissa ginne ka game hai—kitne chhote pieces marked hain, aur total kitne? Aap boliye. |