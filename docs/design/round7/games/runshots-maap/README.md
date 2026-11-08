# Run shots, r7 Games: maap (fractions of a measure on taraazu weigh / fill; 360 px, real Chromium)

c4-maths-ch05-t02 (fractions in measurement) runs on the taraazu weigh and fill modes. The parcel or vessel says "¾ kg",
"½ l" or "½ kg + ¼ kg". The weight box / jug counter holds no weight equal to the label (no 250 g at all, and no 500 g on a
½ label), so the fraction of the kg / l has to be made in grams / ml. The `weigh-tap-*` and `fill-tap-*` shots used no
dispatch. Every weight and jug went in by `page.mouse` on the canvas targets the view registered (the first one dragged
onto the pan, the rest tapped), and Weigh / Check / Undo were pressed as buttons. The other shots came from
`/home/user/runshots-tool.mjs` (the law's `solve()` / `malActs()` through `window.__play.dispatch`) or from the play cert.
They were taken at 2x and are stored here at 1x, 64 colours.

| File | What it shows |
|---|---|
| `weigh-start-half-plus-quarter-kg` | weigh, opening board (fade 1): an onion sack labelled "½ kg + ¼ kg", the beam locked, the box with 500 / 200 / 100 / 50 / 20 / 10 g |
| `weigh-tap-half-is-50` | half-is-50 by real taps: 200 g + 100 g (½ kg taken as 50 g, so 50 + 250 = 300 g); Weigh; the beam tips to the sack, "about 450 g less" (fade 1) |
| `weigh-tap-quarter-is-4-f3` | quarter-is-4 by real taps at fade 3: 500 + 200 + 200 (¼ kg taken as 400 g, so 900 g); the beam tips to the weights, no amount said |
| `weigh-tap-loaded-500-200-50` | after Undo ×2, the right load by touch (500 g dragged, 200 g and 50 g tapped); still locked, the list but never the total |
| `weigh-tap-solved-door` | the next level ("¼ kg + ½ kg", courier) reached through the Spicy door and solved by taps: level, tick, the two doors |
| `fill-start-three-quarter-l` | fill, opening board (fade 1): "¾ l" on the dal pot, jugs 500 / 200 / 100 / 50 ml, the fill line drawn (fade 1 only) |
| `fill-tap-pieces-not-size-f3` | pieces-not-size by real taps at fade 3: three 100 ml jugs for "¾ l" (any 3 pieces); Check: "Not enough yet" |
| `fill-solved-f1` | ¾ l poured as 500 + 200 + 50 ml and checked: the water meets the line, "Exactly right", the doors |
| `cert-fill-sum-p360` | the play cert's p360 board for the fill entry: "½ l + ¼ l" with the 200 / 100 / 50 ml jugs |
