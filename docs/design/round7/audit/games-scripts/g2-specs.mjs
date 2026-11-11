// Games audit: the Forge G2 level expansion (server/forge/g2/levels.js) against the kits it reads. For every kit topic and both
// archetypes, every spec it emits: is a distractor really wrong (not the key, not an acceptable form, not equal in value to the
// key), are the options distinct, are the labels inside the label limit, does a kit diagnostic offer two options of equal value
// where only one is marked correct.
//   node docs/design/round7/audit/games-scripts/g2-specs.mjs
import { readdirSync, readFileSync } from "node:fs";
import { eligibleSpecs } from "../../../../../server/forge/g2/levels.js";
import { parseValue, eq } from "../../../../../server/forge/kitmath.js";
const dir = new URL("../../../../../data/kits/", import.meta.url);
const val = (s) => { try { return parseValue(String(s)); } catch { return null; } };
const sameVal = (a, b) => { const x = val(a), y = val(b); return x && y && eq(x, y); };
const res = { topics: 0, specs: 0, distractorIsKey: [], distractorIsAcceptable: [], distractorEqualValue: [], dupOptions: [], longLabel: [], diagEqualValueOptions: [] };
for (const f of readdirSync(dir).filter((n) => /^c\d+-[a-z]+\.json$/.test(n))) {
  const kit = JSON.parse(readFileSync(new URL(f, dir), "utf8"));
  for (const t of kit.topics ?? []) {
    res.topics++;
    for (const arch of ["choice", "build"]) {
      const { specs } = eligibleSpecs(t, arch);
      for (const s of specs) {
        res.specs++; const tag = `${t.topicId} ${s.id} ${arch}`;
        const opts = [s.key.v, ...s.distractors.map((d) => d.v)];
        if (new Set(opts.map((o) => String(o).trim().toLowerCase())).size !== opts.length) res.dupOptions.push(`${tag} ${JSON.stringify(opts)}`);
        for (const d of s.distractors) {
          if (d.v === s.key.v) res.distractorIsKey.push(`${tag} ${d.v}`);
          else if ((s.acceptable ?? []).some((a) => String(a).trim() === String(d.v).trim())) res.distractorIsAcceptable.push(`${tag} distractor ${d.v} is an acceptable form of ${s.key.v}`);
          else if (s.truth !== "diagnostic" && sameVal(d.v, s.key.v)) res.distractorEqualValue.push(`${tag} ${d.v} = ${s.key.v}`);
          if (String(d.label).length > 28) res.longLabel.push(`${tag} ${d.label}`);
        }
        if (s.truth === "diagnostic") { const vs = opts.map(val); for (let i = 0; i < vs.length; i++) for (let j = i + 1; j < vs.length; j++) if (vs[i] && vs[j] && eq(vs[i], vs[j])) res.diagEqualValueOptions.push(`${tag} ${opts[i]} = ${opts[j]}`); }
      }
    }
  }
}
for (const [k, v] of Object.entries(res)) console.log(k, Array.isArray(v) ? v.length : v);
for (const k of Object.keys(res)) if (Array.isArray(res[k])) for (const x of res[k].slice(0, 8)) console.log(`  ${k}: ${x}`);
