import fs from "node:fs";
import { norm } from "/home/user/Taxila/server/director/items.js";
const r = JSON.parse(fs.readFileSync("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/reveals-new.json", "utf8"));
const old = new Map(JSON.parse(fs.readFileSync("/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/reveals-old.json", "utf8")).rows.map((x) => [x.lesson + "#" + x.turn, x.leak]));
const kits = new Map();
const itemOf = (id) => { const m = /^(c\d+)-([a-z]+)-/.exec(id); const f = `/home/user/Taxila/data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, JSON.parse(fs.readFileSync(f, "utf8"))); for (const t of kits.get(f).topics) { const it = (t.items ?? []).find((i) => i.id === id); if (it) return it; } return null; };
const NUMWORD = /\b(?:ek|do|teen|char|chaar|paanch|chhe|saat|aath|nau|das|one|two|three|four|five|six|seven|eight|nine|ten)\b|एक|दो|तीन|चार|पांच|पाँच|छह|सात|आठ|नौ|दस/iu;
const leaks = r.rows.filter((x) => x.leak);
const shape = { digitsOfKeyInLine: 0, noKeyDigitsInLine: 0, numberWordPresent: 0, newIn144: 0 };
const noDigit = [];
for (const x of leaks) {
  const it = itemOf(x.itemId);
  const forms = [it.answer, ...(it.acceptable ?? [])].map((f) => norm(String(f)));
  const nums = new Set(forms.flatMap((f) => f.match(/\d+(?:[./]\d+)?/g) ?? []));
  const line = norm(x.line);
  const has = [...nums].some((n) => new RegExp(`(^|[^\\d./])${n.replace(/[./]/g, "\\$&")}($|[^\\d./])`).test(line));
  if (has) shape.digitsOfKeyInLine++; else { shape.noKeyDigitsInLine++; noDigit.push({ ...x, forms }); }
  if (NUMWORD.test(x.line)) shape.numberWordPresent++;
  if (!old.get(x.lesson + "#" + x.turn)) shape.newIn144++;
}
console.log(JSON.stringify({ leaks: leaks.length, ...shape }));
for (const x of noDigit.slice(0, 40)) console.log(`${x.lesson} #${x.turn} forms=${JSON.stringify(x.forms)} | ${x.line.slice(0, 150)}`);
