import fs from "node:fs";
const R = process.argv[2];
const { kitFromFile } = await import(R + "/server/content/kits.js");
const { getTopic } = await import(R + "/server/content/curriculum.js");
const load = (f) => { const m = new Map(); for (const [fam, ex, ok] of JSON.parse(fs.readFileSync(f, "utf8"))) { const k = fam + "|" + ex; const c = m.get(k) ?? [0, 0]; c[0]++; c[1] += ok; m.set(k, c); } return m; };
const b = load(process.argv[3]), x = load(process.argv[4]);
for (const [k, [, ok]] of x) { const o = b.get(k); if (!o || ok <= o[1]) continue;
  const [fam, rest] = k.split("|"); const id = rest.split(/[: ]/)[0]; const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0];
  const it = kitFromFile(getTopic(tp)).items.find((i) => i.id === id);
  console.log(`${fam} | ${id} [${it.kind}]\n     Q: ${String(it.prompt_en).slice(0, 110)}\n     KEY: ${String(it.answer).slice(0, 140)}\n     REPLY: ${rest.slice(id.length + 1, id.length + 150)}`); }
