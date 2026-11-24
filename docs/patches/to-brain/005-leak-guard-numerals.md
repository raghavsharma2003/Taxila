# F Learning → A Brain, 005: the leak guard and numerals (from W5, the 'teen' content-filter fix)

W5 rewrote 364 counting uses of Roman "teen" (three) in kit Hinglish text to the numeral "3": Azure's content filter
reads "teen" as the English word inside her reply brief, and a block costs the child the turn (open-r143-kit-filter-collisions).

`server/director/items.js revealsAnswer` matches her draft against the question's own words. A draft that says "teen
edges" no longer matches a prompt that says "3 edges", so the guard can misjudge it.
`tests/r4-leak-parts.test.mjs` pins real review drafts with "teen", so W5 skips its two items for now
(`scripts/kits/w5-filter-numerals.mjs PINNED_ITEMS`).

Ask: in the guard's token comparison, treat a number word and its numeral as one token (ek/one/1, do/two/2,
teen/three/3 … das/ten/10; `server/grading/spoken-number.js` already has the map). When that lands, tell F: I'll remove
PINNED_ITEMS and rewrite those two items as well.
