// Item sets the v2 judge rates. Each row: { id, class, subject, prompt, answer, options? }.
import { readFileSync, existsSync, readdirSync } from "node:fs";

const V1 = new URL("../../content-level/out/", import.meta.url);
const OUT = new URL("../out/", import.meta.url);
const read = (u) => JSON.parse(readFileSync(u, "utf8"));
const row = (r) => ({ id: r.id, class: r.class, subject: r.subject, prompt: r.prompt ?? r.prompt_en, answer: r.answer, ...(r.options ? { options: r.options } : {}) });

export async function loadSet(set) {
  if (set === "bank240") return read(new URL("samples.json", V1)).bank.map(row);
  if (set === "precision40") {
    const ids = read(new URL("precision-sample.json", V1));
    const full = new Map(read(new URL("full.json", V1)).map((r) => [r.id, r]));
    return ids.map((id) => row(full.get(id)));
  }
  if (set === "served-old" || set === "served-new") {
    const f = new URL(`${set}.json`, OUT);
    if (!existsSync(f)) throw new Error(`run node evals/content-level-v2/served.mjs first (${set}.json missing)`);
    // Dedupe: the same item may head several queues? No — ids are per topic; positions 1-2 only.
    return read(f).filter((r) => r.pos <= 2).map(row);
  }
  if (set === "relevel") {
    const dir = new URL("../../../data/kits-relevel/", import.meta.url);
    const rows = [];
    for (const f of readdirSync(dir).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
      const d = read(new URL(f, dir));
      for (const t of d.topics) for (const it of [...(t.openers || []), ...(t.ongrade || []), ...(t.harder || [])]) rows.push(row({ ...it, class: d.class, subject: d.subject }));
    }
    return rows;
  }
  if (set === "placement") {
    const dir = new URL("../../../data/placement/", import.meta.url);
    const rows = [];
    for (const f of readdirSync(dir).filter((x) => /^c\d-[a-z]+\.json$/.test(x))) {
      const d = read(new URL(f, dir));
      for (const it of d.items) rows.push(row({ ...it, class: d.class, subject: d.subject, options: it.options?.map((o) => o.text) }));
    }
    return rows;
  }
  throw new Error(`unknown set ${set}`);
}
