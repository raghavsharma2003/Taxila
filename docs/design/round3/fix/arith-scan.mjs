// every string in every kit through arithmeticSlip: kits are blind-solved, so a hit is a false flag or a kit error
import { readFileSync, readdirSync } from "node:fs";
const { arithmeticSlip } = await import("/home/user/Taxila/server/brain/arith.js");
let n = 0; const hits = [];
const walk = (v, where) => { if (typeof v === "string") { n++; const h = arithmeticSlip(v); if (h) hits.push({ where, claim: h.claim, value: h.value, text: v.slice(0, 140) }); } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, where)); else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, where); };
for (const f of readdirSync("/home/user/Taxila/data/kits").filter((x) => /^c\d-.*\.json$/.test(x))) walk(JSON.parse(readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")), f);
console.log(JSON.stringify({ strings: n, hits: hits.length }));
for (const h of hits.slice(0, 40)) console.log(JSON.stringify(h));
