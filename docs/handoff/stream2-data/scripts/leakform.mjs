import fs from "node:fs";
import { norm } from "/home/user/Taxila/server/director/items.js";
const r = JSON.parse(fs.readFileSync("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/reveals-new.json", "utf8"));
const kits = new Map();
const itemOf = (id) => { const m = /^(c\d+)-([a-z]+)-/.exec(id); const f = `/home/user/Taxila/data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, JSON.parse(fs.readFileSync(f, "utf8"))); for (const t of kits.get(f).topics) { const it = (t.items ?? []).find((i) => i.id === id); if (it) return it; } return null; };
const wordsOf = (t) => norm(t).replace(/(?<!\d)\.|\.(?!\d)/g, " ").split(" ").filter(Boolean);
const runAt = (ws, f) => { for (let i = 0; i + f.length <= ws.length; i++) if (f.every((w, j) => ws[i + j] === w)) return i; return -1; };
const NUMWORDS = new Set("ek do teen char chaar paanch chhe saat aath nau das one two three four five six seven eight nine ten zero shunya bees twenty एक दो तीन चार पांच छह सात आठ नौ दस शून्य".split(" "));
const by = { digit: 0, numberWord: 0, word: 0 }; const nw = [];
for (const x of r.rows.filter((x) => x.leak)) {
  const it = itemOf(x.itemId);
  const forms = [it.answer, ...(it.acceptable ?? [])].map((f) => norm(String(f))).filter(Boolean).map((f) => f.split(" "));
  const ws = wordsOf(x.line);
  const hit = forms.find((f) => runAt(ws, f) >= 0) ?? null;
  const kind = !hit ? "other(rule)" : hit.some((w) => /\d/.test(w)) ? "digit" : hit.every((w) => NUMWORDS.has(w)) ? "numberWord" : "word";
  by[kind] = (by[kind] ?? 0) + 1;
  if (kind === "numberWord") nw.push(`${x.lesson} #${x.turn} form=${hit.join(" ")} key=${JSON.stringify(it.answer)} | ${x.line.slice(0, 150)}`);
}
console.log(JSON.stringify(by));
console.log(nw.join("\n"));
// the child's own words on that turn (records: turn.child): did the child just say the key?
const path = await import("node:path");
const recs = new Map();
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
for (const f of walk("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec")) recs.set(path.basename(f), f);
let confirm = 0, notConfirm = 0;
for (const x of r.rows.filter((x) => x.leak)) {
  const rec = JSON.parse(fs.readFileSync(recs.get(x.lesson), "utf8"));
  const t = rec.turns.find((y) => y.n === x.turn);
  const it = itemOf(x.itemId);
  const forms = [it.answer, ...(it.acceptable ?? [])].map((f) => norm(String(f))).filter(Boolean).map((f) => f.split(" "));
  const cw = wordsOf(String(t?.child ?? ""));
  if (forms.some((f) => runAt(cw, f) >= 0)) confirm++; else notConfirm++;
}
console.log(JSON.stringify({ childJustSaidKey: confirm, childDidNot: notConfirm }));
