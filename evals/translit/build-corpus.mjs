// build-corpus.mjs — RS-7 translit eval corpus: real Director replies from the repo's RECORDED transcripts (production and
// staging runs), Hinglish/Hindi lane only, deduplicated. Written to evals/translit/data/corpus.json.
//   node evals/translit/build-corpus.mjs
// Sources: evals/owner-truth/** (production owner-truth runs), evals/conversation-v2/results/** (staging battery lessons),
// evals/results/lesson-truth-*.json, evals/relational-os/results/** (cascade + realtime lane batteries),
// docs/design/gap-audit/shots/live-content/** (prod probe). Only string fields named teacherReply / reply.
// Split: dev vs test by a hash of the SOURCE FILE (not the line), so a lesson's replies never straddle the split and the
// lexicon (grown from dev only) cannot have seen a test lesson.
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const SOURCES = ["evals/owner-truth/results", "evals/conversation-v2/results", "evals/results", "evals/relational-os/results", "docs/design/gap-audit/shots/live-content"];
const KEYS = new Set(["teacherReply", "reply"]);
// Hindi function words in Roman script: a reply needs >= 2 distinct ones to count as Hinglish/Hindi-lane text.
const HI = /\b(hai|hain|hoon|ho|nahi|nahin|kya|kaise|kyun|toh|aur|ya|chalo|accha|achha|acha|karo|kariye|kijiye|dekho|dekhiye|matlab|bilkul|tum|aap|aapka|aapne|main|mujhe|hum|yeh|ye|woh|wo|kitne|kitna|kitni|ek|do|teen|char|paanch|ke|ki|ka|ko|se|mein|par|pe|bhi|abhi|phir|sahi|bahut|zara|lekin|agar|jab|tab)\b/gi;
const LANG_OK = (file, obj) => {
  const f = file.toLowerCase();
  if (/-english-(text|voice)/.test(f)) return false;
  if (obj?.lang && !/hinglish|hindi/i.test(obj.lang)) return false;
  return true;
};
const out = new Map();
function visit(o, file, ctxLang) {
  if (!o || typeof o !== "object") return;
  if (Array.isArray(o)) { o.forEach((x) => visit(x, file, ctxLang)); return; }
  const lang = typeof o.lang === "string" ? o.lang : typeof o.language === "string" ? o.language : ctxLang;
  for (const [k, v] of Object.entries(o)) {
    if (KEYS.has(k) && typeof v === "string") {
      const t = v.trim();
      if (t.length < 20 || /[ऀ-ॿ]/.test(t)) continue;               // already Devanagari: not this lane's problem
      if (lang && !/hinglish|hindi/i.test(lang)) continue;
      const hits = new Set((t.match(HI) || []).map((w) => w.toLowerCase()));
      if (hits.size < 2) continue;
      if (!out.has(t)) out.set(t, { text: t, source: path.relative(ROOT, file), lang: lang || "unknown" });
    } else visit(v, file, lang);
  }
}
function walk(d) {
  if (!fs.existsSync(d)) return;
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { walk(p); continue; }
    if (!/\.(json|jsonl)$/.test(f.name) || fs.statSync(p).size > 30e6) continue;
    const s = fs.readFileSync(p, "utf8");
    const objs = [];
    if (f.name.endsWith(".jsonl")) for (const l of s.split("\n")) { try { objs.push(JSON.parse(l)); } catch {} }
    else { try { objs.push(JSON.parse(s)); } catch {} }
    for (const o of objs) if (LANG_OK(p, o)) visit(o, p, undefined);
  }
}
for (const s of SOURCES) walk(path.join(ROOT, s));
const rows = [...out.values()].map((r, i) => {
  const h = createHash("sha256").update(r.source).digest()[0];
  return { id: `r${String(i).padStart(4, "0")}`, split: h % 4 === 0 ? "test" : "dev", ...r };
});
const bySplit = rows.reduce((a, r) => ((a[r.split] = (a[r.split] || 0) + 1), a), {});
fs.writeFileSync(path.join(ROOT, "evals/translit/data/corpus.json"), JSON.stringify({ v: "taxila-translit-corpus/1", built: new Date().toISOString().slice(0, 10), sources: SOURCES, n: rows.length, bySplit, rows }, null, 1));
console.log("replies", rows.length, bySplit, "sources", new Set(rows.map((r) => r.source)).size);
