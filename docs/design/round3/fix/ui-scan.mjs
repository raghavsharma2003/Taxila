import { readFileSync, readdirSync } from "node:fs";
const { namesUiPart } = await import("/home/user/Taxila/server/brain/say.js");
let n = 0; const hits = [];
const walk = (v, where) => { if (typeof v === "string") { n++; if (namesUiPart(v)) hits.push({ where, text: v.slice(0, 140) }); } else if (Array.isArray(v)) v.forEach((x) => walk(x, where)); else if (v && typeof v === "object") for (const x of Object.values(v)) walk(x, where); };
for (const f of readdirSync("/home/user/Taxila/data/kits").filter((x) => /^c\d-.*\.json$/.test(x))) walk(JSON.parse(readFileSync("/home/user/Taxila/data/kits/" + f, "utf8")), f);
console.log(JSON.stringify({ strings: n, hits: hits.length }));
for (const h of hits.slice(0, 15)) console.log(JSON.stringify(h));
