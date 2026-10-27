// Forced-correct false credit, by family, base vs patched corroborate (14.5 Hinglish cover). Usage: node fc14.mjs <root>
import fs from "node:fs";
const R = process.argv[2];
const { kitFromFile } = await import(R + "/server/content/kits.js");
const { getTopic } = await import(R + "/server/content/curriculum.js");
const { targetFor, classifyFast } = await import(R + "/server/director/classify.js");
const C = await import(R + "/server/grading/corroborate.js");
console.info = () => {};
const OPP = [["band", "khula"], ["close", "open"], ["closed", "open"], ["saaf", "ganda"], ["clean", "dirty"], ["garam", "thanda"], ["hot", "cold"], ["covered", "open"], ["dhak", "khula"], ["more", "less"], ["zyada", "kam"]];
const swap = (t) => { for (const [a, b] of OPP) { const re = new RegExp(`\\b${a}\\b`, "i"); if (re.test(t)) return t.replace(re, b); const rb = new RegExp(`\\b${b}\\b`, "i"); if (rb.test(t)) return t.replace(rb, a); } return null; };
const credit = (target, text) => {
  const fast = classifyFast({ target, childText: text, typed: true });
  if (fast.result) return fast.result.outcome === "correct";
  return C.corroborate({ target, text, result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } }).outcome === "correct";
};
const fam = {}; const add = (f, ok, ex) => { (fam[f] ??= { n: 0, credited: 0, ex: [] }); fam[f].n++; if (ok) { fam[f].credited++; if (fam[f].ex.length < 4) fam[f].ex.push(ex); } };
let items = 0;
for (const file of fs.readdirSync(R + "/data/kits").filter((f) => f.endsWith(".json"))) {
  const d = JSON.parse(fs.readFileSync(R + "/data/kits/" + file, "utf8"));
  for (const t of d.topics ?? []) {
    const topic = getTopic(t.topicId); if (!topic) continue; const K = kitFromFile(topic); if (!K) continue;
    for (const item of K.items) {
      if (["why", "teachback"].includes(item.kind) || typeof item.answer !== "string") continue;
      const target = targetFor({ phase: "practice", hintLevel: 0, activeItemId: item.id }, K, item);
      if (target.mode !== "item" || C.plainNumberKey?.(target.key) != null || /^\s*[-\d.,/ ]+\s*$/.test(target.key)) continue;
      items++;
      const forms = C.completeForms(target);
      const hl = (target.also ?? []).filter((a) => /\b(aur|hai|ko|ka|ki|ke|se|mein|nahi|karo|na)\b/i.test(a));
      // F1 another item's answer (and its Hinglish acceptables), when it is not itself a form of this item
      const others = K.items.filter((o) => o.id !== item.id && typeof o.answer === "string").flatMap((o) => [o.answer, ...(o.acceptable ?? []).slice(0, 1)]).slice(0, 3);
      for (const o of others) if (!forms.some((f) => f.toLowerCase() === String(o).toLowerCase())) add("F1 other answer", credit(target, o), `${item.id}: ${o}`);
      // F2 negated
      for (const h of [...hl.slice(0, 1), forms[0]]) add("F2 negated", credit(target, `nahi, ${h} nahi hota`), `${item.id}: nahi, ${h} nahi hota`);
      // F3 opposite swapped
      for (const h of [...hl, ...(target.parts ?? []), forms[0]]) { const sw = swap(String(h)); if (sw) add("F3 opposite", credit(target, sw), `${item.id}: ${sw}`); }
      if (target.parts?.length >= 2) {
        // F4 one part only (a partial is never the whole credit)
        for (const p of target.parts) add("F4 one part", credit(target, p), `${item.id}: ${p}`);
        // F5 all parts, then taken back
        add("F5 all parts + taken back", credit(target, `${target.parts.join(", ")}. nahi nahi, galat, aisa nahi hai`), `${item.id}`);
        add("F5 all parts + other answer", credit(target, `${target.parts.join(", ")}? ya phir ${others[0] ?? "kuch aur"}`), `${item.id}`);
      }
      // F6 the key's concept words in a wrong claim
      const cw = [...new Set(String(forms[0]).toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3))].slice(0, 3);
      if (cw.length >= 2) {
        add("F6 concepts, wrong claim", credit(target, `${cw.join(" aur ")} se kuch nahi hota, sab theek hai, andar aane do`), `${item.id}: ${cw.join(",")}`);
        if (hl[0]) add("F6 concepts, wrong claim", credit(target, `${hl[0].replace(/\b(na|nahi)\b/gi, "").trim()} achha hai, aane do`), `${item.id}: ${hl[0]}`);
      }
    }
  }
}
console.log(JSON.stringify({ items, fam: Object.fromEntries(Object.entries(fam).map(([k, v]) => [k, { n: v.n, credited: v.credited }])) }));
for (const [k, v] of Object.entries(fam)) for (const e of v.ex) console.error(k, "|", e);
