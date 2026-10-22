#!/usr/bin/env node
// Round 5 (stream 4A): the blind-label set for the covert comprehension read (server/director/read.js). Labels come from
// VERIFIED keys and predicates, never from a model:
//   correct      the item's key, as written                                            → understood
//   correct_hi   a two-rater "complete" form in Devanagari (data/kits-parts.json), else the Hindi item's key in a
//                Hindi frame                                                           → understood
//   partial      a two-rater "partial" form of a multi-part key (data/kits-parts.json)  → partly
//   misconception the option a kit's verified diagnostic ties to a misconception id     → not + that id
//   wrong        another item's key from the same topic that is not this key or an acceptable form → not
//   bluff        a claim of understanding with no evidence ("haan haan samajh gaya")    → partly (light check)
//   dont_know    "pata nahi" and kin, both scripts                                      → not
//   silence      an empty turn                                                          → not
//   correct_framed / misconception_framed  the same verified content inside a child's sentence ("mujhe lagta hai …")
//   wrong_number  a numeric key perturbed (k±1, ×10, +10, -2), never equal to an acceptable form → not
// Deterministic (seeded); stratified over classes 1-9, every type in every class. The system under test never sees the label.
//
//   node evals/comprehension-r5/build-set.mjs [--per 2] [--seed 2026] > evals/comprehension-r5/set.json
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 ? process.argv[i + 1] : d; };
const PER = Number(arg("per", 2));
let seed = Number(arg("seed", 2026));
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = (a) => a[Math.floor(rnd() * a.length)];
const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

const PARTS = JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits-parts.json"), "utf8")).items;
const DEV = /[ऀ-ॿ]/;
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[.,!?;:'"()।]/g, " ").replace(/\s+/g, " ").trim();
const BLUFF = ["haan haan samajh gaya", "haan samajh gayi", "हाँ हाँ समझ गया", "ok samajh aa gaya", "haan ji samajh gaya didi", "samajh gaya", "हाँ समझ गई", "yes I understood"];
const DONT_KNOW = ["pata nahi", "mujhe nahi pata", "पता नहीं", "nahi pata didi", "I don't know", "मुझे नहीं पता"];

const kits = {};
for (const f of fs.readdirSync(path.join(ROOT, "data/kits")).filter((x) => x.endsWith(".json"))) {
  for (const t of JSON.parse(fs.readFileSync(path.join(ROOT, "data/kits", f), "utf8")).topics ?? []) {
    const c = Number(t.topicId.match(/^c(\d)/)?.[1]);
    (kits[c] ??= []).push(t);
  }
}
const keysOf = (i) => [i.answer, ...(i.acceptable ?? [])].map(norm).filter(Boolean);
const shortKey = (i) => String(i.answer ?? "").length <= 60;
const out = [];
const add = (c, type, t, item, childText, label, extra = {}) => out.push({ id: `${type}:${item?.id ?? t.topicId}:${out.length}`, class: c, type, topicId: t.topicId, itemId: item?.id ?? null,
  diagnostic: extra.diagnostic ?? null, childText, label, ...(extra.misconceptionId ? { misconceptionId: extra.misconceptionId } : {}) });

for (let c = 1; c <= 9; c++) {
  const topics = shuffle(kits[c] ?? []);
  const items = topics.flatMap((t) => (t.items ?? []).filter((i) => i.verified?.agrees !== false && shortKey(i) && i.kind !== "teachback" && i.kind !== "why").map((i) => ({ t, i })));
  const pool = shuffle(items);
  const take = (pred, n) => { const r = []; for (const x of pool) { if (r.length >= n) break; if (!x.used && pred(x)) { x.used = true; r.push(x); } } return r; };
  // correct: the key as written
  for (const { t, i } of take(() => true, PER)) add(c, "correct", t, i, String(i.answer), "understood");
  // correct_hi: a two-rater complete form in Devanagari, else the key in a Hindi frame
  for (const { t, i } of take((x) => Object.entries(PARTS[x.i.id]?.acceptable ?? {}).some(([k, v]) => v === "complete" && DEV.test(k)) || /^\d+(?:\s*\S{0,6})?$/.test(String(x.i.answer).trim()), PER)) {
    const hi = Object.entries(PARTS[i.id]?.acceptable ?? {}).find(([k, v]) => v === "complete" && DEV.test(k))?.[0];
    add(c, "correct_hi", t, i, hi ?? `मेरे हिसाब से जवाब ${String(i.answer).trim()} है`, "understood");
  }
  // partial: a two-rater partial form of a multi-part key
  for (const { t, i } of take((x) => Object.values(PARTS[x.i.id]?.acceptable ?? {}).includes("partial"), PER)) {
    const part = pick(Object.entries(PARTS[i.id].acceptable).filter(([, v]) => v === "partial").map(([k]) => k));
    add(c, "partial", t, i, part, "partly");
  }
  // misconception: a verified diagnostic option tied to a misconception id
  const diags = shuffle(topics.flatMap((t) => (t.misconceptions ?? []).filter((m) => m.diagnostic?.options?.some((o) => o.misconceptionId === m.id)).map((m) => ({ t, m }))));
  for (const { t, m } of diags.slice(0, PER)) {
    const opt = m.diagnostic.options.find((o) => o.misconceptionId === m.id);
    add(c, "misconception", t, null, opt.text, "not", { misconceptionId: m.id, diagnostic: { misconceptionId: m.id } });
  }
  // wrong: another item's key from the same topic, not this key or any acceptable form
  for (const { t, i } of take((x) => (x.t.items ?? []).some((o) => o.id !== x.i.id && shortKey(o) && !keysOf(x.i).includes(norm(o.answer)) && !keysOf(x.i).some((k) => norm(o.answer).includes(k) || k.includes(norm(o.answer)))), PER)) {
    const other = pick((t.items ?? []).filter((o) => o.id !== i.id && shortKey(o) && !keysOf(i).includes(norm(o.answer)) && !keysOf(i).some((k) => norm(o.answer).includes(k) || k.includes(norm(o.answer)))));
    add(c, "wrong", t, i, String(other.answer), "not");
  }
  // framed: the same verified content inside a child's sentence, so the model (not an exact match) decides
  const FR = ["mujhe lagta hai {x}", "मेरे ख्याल से {x}", "I think it is {x}", "{x} hoga na?", "shayad {x}"];
  for (const { t, i } of take(() => true, PER)) add(c, "correct_framed", t, i, pick(FR).replace("{x}", String(i.answer)), "understood");
  for (const { t, m } of diags.slice(PER, 2 * PER)) {
    const opt = m.diagnostic.options.find((o) => o.misconceptionId === m.id);
    add(c, "misconception_framed", t, null, pick(FR).replace("{x}", opt.text), "not", { misconceptionId: m.id, diagnostic: { misconceptionId: m.id } });
  }
  // a numeric key perturbed (never equal to the key or an acceptable form)
  for (const { t, i } of take((x) => /^\d+$/.test(String(x.i.answer).trim()) && Number(x.i.answer) >= 2, PER)) {
    const k = Number(String(i.answer).trim());
    const w = pick([k + 1, k - 1, k * 10, k + 10, Math.max(0, k - 2)].filter((v) => v !== k && !keysOf(i).includes(String(v))));
    add(c, "wrong_number", t, i, String(w), "not");
  }
  for (const { t, i } of take(() => true, PER)) add(c, "bluff", t, i, pick(BLUFF), "partly");
  for (const { t, i } of take(() => true, PER)) add(c, "dont_know", t, i, pick(DONT_KNOW), "not");
  for (const { t, i } of take(() => true, PER)) add(c, "silence", t, i, "", "not");
}
process.stdout.write(JSON.stringify({ built: "evals/comprehension-r5/build-set.mjs", per: PER, n: out.length, cases: out }, null, 1) + "\n");
