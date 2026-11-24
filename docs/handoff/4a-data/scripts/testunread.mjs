// READ-ONLY: every child turn on the TEST branch, checked for another script's token. The url is never printed.
import fs from "node:fs";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const { readability } = await import("/home/user/Taxila/server/safety/normalize.js");
const rows = await q(`select t.id, t.text from turn t where t.speaker = 'child' and length(t.text) > 0`);
const out = [];
for (const r of rows) { const x = readability(r.text); if (x.unreadable) out.push({ id: r.id, share: x.share, letters: r.text.split(/\s+/).filter((w) => /\p{L}/u.test(w)).length, bad: x.tokens, readable: x.readable, text: r.text }); }
fs.writeFileSync(process.argv[2], JSON.stringify(out));
console.log(rows.length, "child turns;", out.length, "with another script");
for (const th of [0.15, 0.2, 0.25, 0.34, 0.5]) console.log(`share < ${th}: ${out.filter((x) => x.share < th).length}; and >= 3 readable letter words: ${out.filter((x) => x.share < th && x.letters - x.bad.length >= 3).length}`);
process.exit(0);
