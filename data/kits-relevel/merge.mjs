// Merge the RS-6 re-levelled overlay (data/kits-relevel/c{C}-{subject}.json) into kit files, writing to an OUTPUT dir.
// Never writes data/kits unless that is passed explicitly as --out (the integration step, after the human pass).
//
//   node data/kits-relevel/merge.mjs --out <dir> [--kits data/kits]
//
// Per topic:
//   - drop the items in `drop` (the dice opener c4-maths-ch01-t01-i01; the two verbatim class-4 copies in c6-maths ch09);
//   - add every overlay item (openers, ongrade, harder) whose key the blind solver agreed with and that neither rater put
//     two classes below (tooEasy). Each carries ge (rater-calibrated), demand, relevel role, verified;
//   - set `ge` on old items with a measured grade (topic.oldGE), so the F0 queue uses it instead of the difficulty proxy;
//   - replace the hints of items whose solver note said a hint gives the answer (hintFixes);
//   - rewrite the dice-picture diagnostic at class-4 level (diagnosticRewrite).
// The kit loader must carry `ge` and `demand` through normalizeKit (patch 02-kits-ge.patch).
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const HERE = new URL(".", import.meta.url).pathname;

/** Merge one kit file object with its overlay; pure. Returns { kit, stats }. */
export function mergeKit(kit, overlay) {
  const stats = { added: 0, skippedUnverified: 0, skippedTooEasy: 0, dropped: 0, hintFixes: 0, oldGE: 0, diagnostics: 0 };
  if (!overlay) return { kit, stats };
  const byTopic = new Map(overlay.topics.map((t) => [t.topicId, t]));
  const topics = kit.topics.map((t) => {
    const o = byTopic.get(t.topicId);
    if (!o) return t;
    const drop = new Set(o.drop || []);
    const fixes = new Map((o.hintFixes || []).map((h) => [h.id, h.hints]));
    let items = t.items.filter((i) => !drop.has(i.id) || !(stats.dropped += 1)).map((i) => {
      let it = i;
      if (fixes.has(i.id)) { it = { ...it, hints: fixes.get(i.id), hintsFixed: "rs6-2026-10-04" }; stats.hintFixes++; }
      const g = o.oldGE?.[i.id];
      if (g && typeof g.ge === "number") { it = { ...it, ge: g.ge, geSource: "raters-v2" }; stats.oldGE++; }
      return it;
    });
    const extra = [...(o.openers || []), ...(o.ongrade || []), ...(o.harder || [])].filter((it) => {
      if (it.verified?.agrees !== true) { stats.skippedUnverified++; return false; }
      if (it.tooEasy || typeof it.ge !== "number") { stats.skippedTooEasy++; return false; }
      return true;
    }).map((it) => ({
      id: it.id, skillId: it.skillId, kind: it.kind,
      difficulty: it.role === "harder" ? 4 : 3,
      prompt_en: it.prompt_en, prompt_hi: it.prompt_hi, answer: it.answer, acceptable: it.acceptable, hints: it.hints,
      ge: it.ge, geSource: "raters-v2", demand: it.demand, relevel: it.role, verified: it.verified,
    }));
    stats.added += extra.length;
    items = items.concat(extra);
    let misconceptions = t.misconceptions;
    if (o.diagnosticRewrite) {
      const dr = o.diagnosticRewrite;
      misconceptions = t.misconceptions.map((m) => {
        if (m.id !== dr.misconceptionId || !Array.isArray(dr.options)) return m;
        stats.diagnostics++;
        const visible = /\b3\b/;
        return { ...m, diagnostic: { prompt_en: dr.prompt_en, prompt_hi: dr.prompt_hi,
          options: dr.options.map((op) => ({ text: op.text, correct: !!op.correct, misconceptionId: op.correct ? null : visible.test(op.text) ? m.id : null })) } };
      });
    }
    return { ...t, items, misconceptions };
  });
  return { kit: { ...kit, topics, relevel: { overlay: overlay.date, generator: overlay.generator } }, stats };
}

export function mergeDir(kitsDir, overlayDir, outDir) {
  mkdirSync(outDir, { recursive: true });
  const total = {};
  for (const f of readdirSync(kitsDir).filter((x) => /^c\d+-[a-z]+\.json$/.test(x))) {
    const kit = JSON.parse(readFileSync(join(kitsDir, f), "utf8"));
    const of = join(overlayDir, f);
    const overlay = existsSync(of) ? JSON.parse(readFileSync(of, "utf8")) : null;
    const { kit: merged, stats } = mergeKit(kit, overlay);
    writeFileSync(join(outDir, f), JSON.stringify(merged, null, 1));
    for (const [k, v] of Object.entries(stats)) total[k] = (total[k] || 0) + v;
  }
  return total;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(HERE, "merge.mjs")) {
  const out = arg("--out");
  if (!out) { console.error("usage: node data/kits-relevel/merge.mjs --out <dir> [--kits data/kits]"); process.exit(2); }
  const kits = resolve(arg("--kits", join(HERE, "../kits")));
  console.log(JSON.stringify(mergeDir(kits, HERE, resolve(out))));
}
