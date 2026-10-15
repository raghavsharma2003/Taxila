// Every deep-tagged kit item (agent.js DEEP_KINDS minus teachback) -> <dir>/items.json. Read-only on data/kits.
//   node evals/kit-deep-kinds/items.mjs --dir <work dir>
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { KITS, workDir } from "./lib.mjs";
const DIR = fileURLToPath(KITS), OUT = workDir();
const KINDS = new Set(["error_spot", "predict", "why", "contrast", "near_transfer", "far_transfer", "translate_rep"]);
const out = [];
for (const f of readdirSync(DIR).filter((x) => /^c\d-.+\.json$/.test(x)).sort()) {
  const [, cls, subject] = /^c(\d)-(.+)\.json$/.exec(f);
  const d = JSON.parse(readFileSync(DIR + f, "utf8"));
  for (const t of d.topics ?? []) {
    const sk = Object.fromEntries((t.skills ?? []).map((s) => [s.id, s.title]));
    for (const it of t.items ?? []) {
      if (!KINDS.has(it.kind)) continue;
      out.push({ topicId: t.topicId, itemId: it.id, kind: it.kind, class: Number(cls), subject, skillId: it.skillId, skill: sk[it.skillId] ?? "",
        prompt_en: it.prompt_en ?? "", prompt_hi: it.prompt_hi ?? "", answer: it.answer ?? "", agrees: it.verified?.agrees ?? null, demandField: it.demand ?? null });
    }
  }
}
writeFileSync(`${OUT}/items.json`, JSON.stringify(out));
const c = {}; for (const x of out) c[x.kind] = (c[x.kind] ?? 0) + 1;
console.log(out.length, c);
