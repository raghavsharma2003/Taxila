// To Brain 048 G4 (docs/patches/to-brain/048-script-cards-hear-hindi-as-spoken.md): a script card hears the answer the way a
// child says it. Every keyed card of every live script (data/lesson-scripts/) and the two staged rewrites
// (c4-maths-ch01-t02, c6-maths-ch07-t01; from LESSON_SCRIPTS_DIR, default data/lesson-scripts-staged) is answered in the
// spoken forms of its right answer (digits, Latin Hindi, Devanagari and English number words from the READER'S OWN tables,
// fractions said four ways, yes / no said six ways, an option without its shared noun, the key in Devanagari) and of its
// named wrong answer(s) and their nearest neighbours (another number, the fraction turned over, the other option, a sum with
// an operand gone or its operator swapped, a division turned round, a list reversed, the key denied). A right form must grade
// correct or go to the model; a wrong form must grade wrong, as the mix-up, or go to the model — NEVER correct (a false key
// fails a lesson). Pure: no model, no network, no database.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { classifyFast } from "../server/director/classify.js";
import { scriptAskItem, scriptCheckItem, scriptThenItem, scriptQuickItem, scriptStepAskItem } from "../server/director/script.js";
import { fillFriendDeep } from "../server/director/friend.js";
import { READER_TABLES as T, spokenNumber } from "../server/grading/spoken-number.js";
import { canon, sameAnswer, numberOf, optionsIn, wrongList } from "../server/grading/script-answer.js";
import { toDevanagari } from "../server/voice/translit/index.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const grade = (item, say) => {
  const target = { mode: "item", item, key: item.answer, also: item.acceptable || [] };
  const r = classifyFast({ target, childText: say, typed: false, asrConfidence: 0.95 });
  return r?.result?.outcome ?? "model";
};
const card = (key, accept = [], wrongIfMis = null, prompt = "Kitne?") => ({ id: "probe", skillId: "s", kind: "practice", prompt_hi: prompt, prompt_en: prompt,
  answer: key, acceptable: accept, scriptCheck: { wrongIfMis, targets: wrongIfMis ? "m-probe" : null } });

// ───────────── the speller, from the reader's own tables ─────────────
const hiOf = (n) => (n >= 1 && n <= 99 ? T.hi99[n - 1] : null);
const devOf = (() => { const m = new Map(); for (const [w, v] of Object.entries(T.dev)) if (!m.has(v)) m.set(v, w); return (n) => m.get(n) ?? null; })();
const enOf = (n) => (n < 20 ? T.en1[n] : n < 100 ? [Object.entries(T.en10).find(([, v]) => v === n - (n % 10))?.[0], n % 10 ? T.en1[n % 10] : null].filter(Boolean).join(" ") : null);
/** n (0..99999) said in words: lang "hi" (Latin Hindi), "dev" (Devanagari), "en". */
function spell(n, lang) {
  if (!Number.isInteger(n) || n < 0 || n > 99999) return null;
  const small = lang === "hi" ? hiOf : lang === "dev" ? devOf : enOf;
  const [H, K] = lang === "hi" ? ["sau", "hazaar"] : lang === "dev" ? ["सौ", "हज़ार"] : ["hundred", "thousand"];
  if (n === 0) return lang === "en" ? "zero" : lang === "dev" ? "शून्य" : null;
  const parts = [];
  const k = Math.floor(n / 1000), h = Math.floor((n % 1000) / 100), r = n % 100;
  if (k) parts.push(small(k), K);
  if (h) parts.push(small(h), H);
  if (r) parts.push(small(r));
  return parts.every(Boolean) ? parts.join(" ") : null;
}

test("048 probe table: every right answer said in Hindi, Devanagari or English words is graded right (main, 2026-11-18)", () => {
  const P = "Kaunsi patti lambi hai: 8 wali patti ya 12 wali patti?";
  const rows = [["2", "do"], ["2", "do hain"], ["2", "do hisse"], ["2", "दो"], ["3", "तीन"], ["1500", "pandrah sau"], ["1500", "पंद्रह सौ"], ["130", "ek sau tees"],
    ["130", "एक सौ तीस"], ["600", "chhah sau"], ["25", "pachees"], ["25", "पच्चीस"], ["1/4", "एक बटा चार"], ["12 wali patti", "12 wali", P], ["12 wali patti", "बारह वाली", P],
    ["3", "teen"], ["3", "mujhe lagta hai teen"], ["4", "chaar hai na"], ["1500 m", "pandrah sau metre"], ["21", "ikkees"], ["1/2", "aadha"], ["2/8", "do bata aath"],
    ["7", "seven"], ["26", "twenty six"], ["1/4", "ek bata chaar"], ["25", "twenty five"], ["600", "छह सौ"]];
  const bad = rows.map(([k, s, p]) => [k, s, grade(card(k, [], null, p), s)]).filter(([, , g]) => g !== "correct");
  assert.deepEqual(bad, []);
  // and the nearest wrong answers, said the same ways, are never right
  const wrong = [["2", "teen"], ["2", "तीन"], ["2", "three"], ["1500", "pandrah"], ["1500", "solah sau"], ["130", "ek sau bees"], ["25", "chhabbees"], ["25", "छब्बीस"],
    ["1/4", "चार बटा एक"], ["1/4", "ek bata teen"], ["12 wali patti", "8 wali", P], ["12 wali patti", "आठ वाली", P], ["2/8", "1/4"], ["7", "six"], ["26", "twenty seven"],
    ["2", "mujhe bata do"], ["2", "मुझे बता दो"], ["25", "pachees se kam"], ["25", "पच्चीस नहीं"], ["3", "teen ya chaar"], ["1500 m", "pandrah sau cm"]];
  const leaks = wrong.map(([k, s, p]) => [k, s, grade(card(k, [], null, p), s)]).filter(([, , g]) => g === "correct");
  assert.deepEqual(leaks, []);
  // (main's probe 3: the right number, said as the card's own wrong answer's — "Sana ka 5 cm lamba" — is never right; said plainly or as
  // the asked one's, it stays right)
  const SP = "Rahul ka hissa Sana ke hisse se kitne cm lamba hai?";
  assert.notEqual(grade(card("5 cm", [], "Sana", SP), "Sana ka 5 cm lamba"), "correct");
  for (const s of ["5", "5 cm", "paanch cm", "5 cm lamba", "Rahul ka 5 cm lamba"]) assert.equal(grade(card("5 cm", [], "Sana", SP), s), "correct", s);
});

test("048 G7: a sum is not a bag of numbers; a division turned round, a list reversed and a denial moved are other answers", () => {
  const sum = card("84", ["24 + 18 + 24 + 18"], "42");
  for (const s of ["24 × 18", "24 + 18", "24 x 18", "24 + 18 + 24", "24 - 18 + 24 + 18", "24 guna 18", "42"]) assert.notEqual(grade(sum, s), "correct", s);
  for (const s of ["24 + 18 + 24 + 18", "18 + 24 + 18 + 24", "84"]) assert.equal(grade(sum, s), "correct", s);
  const div = card("30 ko 6 se bhaag", ["30 ÷ 6"], "6 ÷ 30");
  for (const s of ["6 ko 30 se bhaag", "6 ÷ 30", "6 ko 30 se bhaag do", "30 × 6"]) assert.notEqual(grade(div, s), "correct", s);
  for (const s of ["30 ÷ 6", "30 ko 6 se bhaag do"]) assert.equal(grade(div, s), "correct", s);
  const list = card("4/9, 4/7, 4/5", ["4/9 4/7 4/5"], "4/5, 4/7, 4/9");
  assert.equal(grade(list, "4/5, 4/7, 4/9"), "misconception");
  assert.notEqual(grade(card("4/9, 4/7, 4/5"), "4/5, 4/7, 4/9"), "correct");
  assert.notEqual(grade(card("4/9, 4/7, 4/5"), "4/7, 4/9, 4/5"), "correct");
  assert.equal(grade(card("4/9, 4/7, 4/5"), "4/9 4/7 4/5"), "correct");
  const deny = card("nahi", ["nahi, right angle hai"], "haan");
  for (const s of ["right angle nahi hai", "haan", "ji haan", "हाँ", "yes"]) assert.notEqual(grade(deny, s), "correct", s);
  for (const s of ["nahi, right angle hai", "nahi right angle hai", "nahi", "bilkul nahi", "नहीं", "no"]) assert.equal(grade(deny, s), "correct", s);
});

test("048 G8: wrongIfMis may be a list, and dono / both / sab beside an equal word are filler", () => {
  const c = card("1/2", ["aadha"], ["barabar", "dono barabar", "same"]);
  for (const s of ["barabar", "dono barabar", "dono same", "both equal", "same", "sab barabar", "दोनों बराबर"]) assert.equal(grade(c, s), "misconception", s);
  assert.equal(grade(card("1/2", [], "barabar"), "dono barabar"), "misconception");
  assert.equal(grade(c, "aadha"), "correct");
});

test("048 G3: the noun may be dropped only when exactly one option qualifies", () => {
  const P = "Kiska kaam zyada hai: Neha ka kaam ya Ravi ka kaam?";
  const c = card("Neha ka kaam", [], "Ravi ka kaam", P);
  assert.equal(grade(c, "Neha"), "correct");
  assert.equal(grade(c, "Neha ka"), "correct");
  assert.equal(grade(c, "Ravi"), "misconception");
  for (const s of ["Neha ya Ravi", "Neha nahi", "Neha aur Ravi dono", "Neha se zyada Ravi"]) assert.notEqual(grade(c, s), "correct", s);
  // two options that share every word but one number: the number picks
  const p2 = card("12 wali patti", [], null, "Kaunsi lambi hai: 8 wali patti ya 12 wali patti?");
  assert.equal(grade(p2, "12"), "correct");
  assert.notEqual(grade(p2, "8"), "correct");
  assert.notEqual(grade(p2, "8 aur 12"), "correct");
});

test("048 G2: a Devanagari reply is compared in Devanagari and is never wrong in code for its spelling", () => {
  const c = card("baad", ["1/2 ke baad", "after"], "pehle", "1/3 kahaan aayega: 1/2 se pehle ya 1/2 ke baad?");
  assert.equal(grade(c, "बाद"), "correct");
  assert.equal(grade(c, "1/2 के बाद"), "correct");
  assert.equal(grade(c, "पहले"), "misconception");
  assert.notEqual(grade(c, "बाद नहीं"), "correct");
  // another spelling the code cannot place goes to the model, never to wrong
  assert.equal(grade(c, "आधे के उसके बाद में ही"), "model");
  // a number that differs from a number key is still wrong in code
  assert.equal(grade(card("25"), "तीस"), "incorrect");
  assert.equal(grade(card("25"), "पच्चीस"), "correct");
});

// ───────────── G4: every keyed card of the scripts ─────────────
const STAGED = ["c4-maths-ch01-t02", "c6-maths-ch07-t01"];
const STAGED_DIR = join(ROOT, process.env.LESSON_SCRIPTS_DIR || "data/lesson-scripts-staged");
function scripts() {
  const live = join(ROOT, "data/lesson-scripts");
  const out = readdirSync(live).filter((f) => f.endsWith(".json")).map((f) => [f.replace(/\.json$/, ""), join(live, f)]);
  for (const id of STAGED) { const p = join(STAGED_DIR, `${id}.json`); if (existsSync(p)) out.push([`staged:${id}`, p]); }
  return out;
}
/** Every keyed card of a script, as the walk builds it (director/script.js). */
function cardsOf(s) {
  const out = [];
  for (const sk of s.skills ?? []) {
    const id = sk.id ?? sk.skillId;
    (sk.explain ?? []).forEach((b) => {
      if (b.ask && typeof b.ask === "object" && "key" in b.ask) out.push([`${id}/explain:${b.id}`, scriptAskItem(id, b.id, b.ask)]);
      if (b.quick && typeof b.quick === "object" && "key" in b.quick) out.push([`${id}/quick:${b.id}`, scriptQuickItem(id, b.id, b.quick)]);
    });
    const we = sk.workedExample ?? {};
    (we.steps ?? []).forEach((st, k) => { if (st.ask && typeof st.ask === "object" && "key" in st.ask) out.push([`${id}/step${k}`, scriptStepAskItem(id, k, st.ask)]); });
    if (we.yourStep && "key" in we.yourStep) out.push([`${id}/yourStep`, scriptAskItem(id, "worked", we.yourStep)]);
    (sk.checks ?? []).forEach((c) => out.push([`${id}/${c.id}`, scriptCheckItem(id, c)]));
    (sk.remediation ?? []).forEach((r) => { if (r.then && typeof r.then === "object" && "key" in r.then) out.push([`${id}/then:${r.targets}`, scriptThenItem(id, r)]); });
  }
  return out.map(([w, it]) => [w, fillFriendDeep(it, "")]);
}
const metaOf = (it) => it.scriptAsk ?? it.scriptCheck ?? it.scriptThen ?? {};
const dev = (s) => toDevanagari(String(s), { force: true, fallback: "rules" });
const UNIT_RE = /\s*(?:kilometres?|kilometers?|km|metres?|meters?|cm|mm|m|kg|g|grams?|litres?|l|rupees?|rs)\.?$/i;
const YES = ["haan", "हाँ", "ji haan", "yes", "haan ji", "bilkul haan"], NO = ["nahi", "नहीं", "bilkul nahi", "no", "nahi ji", "ji nahi"];

/** The spoken forms of an answer string: [form, kind]. */
function spokenForms(ans, { prompt, decorate = true } = {}) {
  const a = String(ans).trim();
  const out = new Set([a]);
  if (decorate) for (const f of [`${a} hai`, `${a} hai na`, `${a} wala`, `${a} wali`, `mujhe lagta hai ${a}`, `shayad ${a}`]) out.add(f);
  const c = canon(a);
  const unit = a.match(UNIT_RE)?.[0]?.trim() ?? "";
  const bare = unit ? a.slice(0, -a.match(UNIT_RE)[0].length).trim() : a;
  const n = numberOf(c);
  if (n != null && /^\d+$/.test(bare)) {
    const v = Number(bare);
    for (const lang of ["hi", "dev", "en"]) { const w = spell(v, lang); if (w) { out.add(w); if (unit) out.add(`${w} ${unit}`); } }
    if (unit) out.add(bare);
  }
  const fm = bare.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (n != null && fm) {
    const [p, q] = [Number(fm[1]), Number(fm[2])];
    for (const f of [`${p}/${q}`, `${hiOf(p)} bata ${hiOf(q)}`, `${p} by ${q}`, `${devOf(p)} बटा ${devOf(q)}`]) { if (!f.includes("null")) { out.add(f); if (unit) out.add(`${f} ${unit}`); } }
  }
  if (c.seq.length === 1 && c.seq[0].t === "haan") YES.forEach((f) => out.add(f));
  if (c.seq.length === 1 && c.seq[0].t === "nahi") NO.forEach((f) => out.add(f));
  // G3: an option key without the words every option shares
  const opts = optionsIn(prompt);
  if (opts.length >= 2) {
    const oc = opts.map(canon);
    const i = oc.findIndex((o) => sameAnswer(o, c));
    if (i >= 0) {
      const shared = (w) => opts.every((o) => o.toLowerCase().split(/\s+/).includes(w));
      const kept = opts[i].split(/\s+/).filter((w) => !shared(w.toLowerCase())).join(" ");
      if (kept && kept !== opts[i]) { out.add(kept); out.add(dev(kept)); }
    }
  }
  if (/[a-z]/i.test(a)) out.add(dev(a));
  return [...out].filter((f) => f && !/null|undefined/.test(f));
}
/** The nearest wrong answers to a right one (G7 and G1's neighbours). */
function nearWrongs(ans, prompt, rights) {
  const a = String(ans).trim(), out = new Set();
  const c = canon(a);
  const n = numberOf(c);
  const unit = a.match(UNIT_RE)?.[0] ?? "";
  const bare = unit ? a.slice(0, -unit.length).trim() : a;
  if (n != null && /^\d+$/.test(bare)) {
    const v = Number(bare);
    for (const d of [-1, 1, 10]) { const w = v + d; if (w < 0) continue; out.add(`${w}${unit}`); for (const lang of ["hi", "dev", "en"]) { const s = spell(w, lang); if (s) out.add(s); } }
  }
  const fm = bare.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fm && fm[1] !== fm[2]) { out.add(`${fm[2]}/${fm[1]}`); out.add(`${+fm[1] + 1}/${fm[2]}`); out.add(`${hiOf(+fm[2])} bata ${hiOf(+fm[1])}`); }
  // an operator: one operand gone, the operator swapped, turned round
  const opM = a.match(/^(.*?)(\d+)\s*([+×x*÷-])\s*(\d+)(.*)$/);
  if (opM) {
    const [, pre, l, op, r, post] = opM;
    for (const o of ["+", "×", "÷", "-"]) if (o !== op && !(o === "×" && op === "x")) out.add(`${pre}${l} ${o} ${r}${post}`);
    out.add(`${pre}${l}${post}`.trim());
    if (/[÷-]/.test(op)) out.add(`${pre}${r} ${op} ${l}${post}`);
    const nums = a.match(/\d+/g) ?? [];
    if (nums.length >= 3) out.add(nums.slice(0, -1).join(" + "));
  }
  const ko = a.match(/^(\d+)\s+ko\s+(\d+)\s+se\s+(.*)$/);
  if (ko) out.add(`${ko[2]} ko ${ko[1]} se ${ko[3]}`);
  // a list of values, reversed
  const vals = c.nums;
  if (vals.length >= 2 && !c.ops && new Set(vals).size === vals.length) out.add([...(a.match(/\d+(?:\/\d+)?/g) ?? [])].reverse().join(", "));
  // the key denied ("12 nahi"), a yes / no turned over
  if (c.seq.length === 1 && c.seq[0].t === "haan") NO.slice(0, 3).forEach((f) => out.add(f));
  else if (c.seq.length === 1 && c.seq[0].t === "nahi") YES.slice(0, 3).forEach((f) => out.add(f));
  else if (!c.neg) out.add(`${a} nahi`);
  // a denial moved: "nahi, right angle hai" (the child disagreeing) said as the claim itself, "right angle nahi hai"
  const lead = a.match(/^(?:nahi|nahin|no)[,\s]+(.+?)(?:\s+(hai|hain|is|are))?$/i);
  if (lead) { out.add(`${lead[1]} nahi ${lead[2] ?? "hai"}`); out.add(`${lead[1]} nahi`); out.add(dev(`${lead[1]} nahi ${lead[2] ?? "hai"}`)); }
  // the other options of the prompt, and those without their shared noun
  const opts = optionsIn(prompt);
  if (opts.length >= 2) {
    const oc = opts.map(canon);
    const i = oc.findIndex((o) => sameAnswer(o, c));
    if (i >= 0) opts.forEach((o, j) => {
      if (j === i) return;
      out.add(o);
      const shared = (w) => opts.every((x) => x.toLowerCase().split(/\s+/).includes(w));
      const kept = o.split(/\s+/).filter((w) => !shared(w.toLowerCase())).join(" ");
      if (kept) { out.add(kept); out.add(dev(kept)); }
    });
  }
  // never a wrong form that is itself a listed right one
  const rc = rights.map(canon);
  return [...out].filter((f) => f && !/null|undefined/.test(f) && !rc.some((r) => sameAnswer(r, canon(f))) && !rights.includes(f));
}

test("048 G4: every keyed card of the live scripts and the two staged rewrites hears its right answer and refuses its wrong ones", (t) => {
  const counts = { scripts: 0, cards: 0, noForms: [], right: 0, rightCorrect: 0, rightModel: 0, wrongTried: 0, wrongModel: 0 };
  const rightBad = [], wrongBad = [];
  for (const [name, path] of scripts()) {
    counts.scripts++;
    const s = JSON.parse(readFileSync(path, "utf8"));
    for (const [where, it] of cardsOf(s)) {
      counts.cards++;
      const prompt = it.prompt_hi ?? it.prompt_en;
      const rights = [it.answer, ...(it.acceptable ?? [])].map(String);
      const forms = new Set(spokenForms(it.answer, { prompt }));
      for (const acc of it.acceptable ?? []) forms.add(String(acc));
      if (!forms.size) { counts.noForms.push(`${name} ${where}`); continue; }
      const wl = wrongList(metaOf(it).wrongIfMis);
      const wc = wl.map(canon);
      for (const f of forms) {
        // (a spoken form that is itself the named wrong answer is not a right form: the card's lists decide)
        if (wc.some((w) => sameAnswer(w, canon(f)))) continue;
        counts.right++;
        const g = grade(it, f);
        if (g === "correct") counts.rightCorrect++;
        else if (g === "model") counts.rightModel++;
        else if (g === "no_evidence") { if (process.env.G4_PRINT) console.log("no_evidence:", name, where, JSON.stringify(f)); }
        else rightBad.push(`${name} ${where} key=${JSON.stringify(it.answer)} said ${JSON.stringify(f)} → ${g}`);
      }
      const wrongs = new Set();
      for (const w of wl) { spokenForms(w, { prompt }).forEach((f) => wrongs.add(f)); }
      // (main's probe 3: a numeric key said as the named wrong answer's — "<wrongIfMis> ka <key>")
      if (numberOf(canon(it.answer)) != null) for (const w of wl) if (numberOf(canon(w)) == null && canon(w).words.length) wrongs.add(`${w} ka ${it.answer}`);
      for (const r of rights) nearWrongs(r, prompt, rights).forEach((f) => wrongs.add(f));
      for (const f of wrongs) {
        // (a "wrong" form that is a listed right one, in either script, is no wrong form: "nahi sahi" moved is "sahi nahi")
        if (rights.some((r) => sameAnswer(canon(r), canon(f)) || sameAnswer(canon(dev(r)), canon(f)))) continue;
        counts.wrongTried++;
        const g = grade(it, f);
        if (g === "model") counts.wrongModel++;
        if (g === "correct") wrongBad.push(`${name} ${where} key=${JSON.stringify(it.answer)} said ${JSON.stringify(f)} → correct`);
      }
    }
  }
  t.diagnostic(`scripts ${counts.scripts}, cards ${counts.cards}, right forms ${counts.right} (correct ${counts.rightCorrect}, model ${counts.rightModel}), ` +
    `wrong forms ${counts.wrongTried} (model ${counts.wrongModel}), cards with no forms ${counts.noForms.length}${counts.noForms.length ? `: ${counts.noForms.join("; ")}` : ""}`);
  if (process.env.G4_PRINT) console.log(JSON.stringify(counts));
  assert.equal(counts.scripts, 5 + STAGED.length, "five live scripts and the two staged rewrites");
  assert.deepEqual(rightBad, [], "a right answer graded wrong or as the mix-up");
  assert.deepEqual(wrongBad, [], "a wrong answer graded right (a false key)");
});

test("048: the accept forms G7 made safe again refuse the wrong answers they once let in (the scripts' fix passes, 2026-11-18)", () => {
  const find = (path, pred) => { const s = JSON.parse(readFileSync(join(ROOT, path), "utf8")); const hit = cardsOf(s).find(([, it]) => pred(it)); assert.ok(hit, path); return hit[1]; };
  // perimeter: "24 + 18 + 24 + 18" took "24 × 18" and "24 + 18"
  const per = find("data/lesson-scripts/c6-maths-ch06-t01.json", (it) => it.answer === "jodkar do guna");
  assert.ok(per.acceptable.includes("24 + 18 + 24 + 18"));
  for (const s of ["24 + 18 + 24 + 18", "18 + 24 + 18 + 24"]) assert.equal(grade(per, s), "correct", s);
  for (const s of ["24 × 18", "24 + 18", "24 + 18 + 24", "24 x 18", "jodkar guna", "jodkar teen guna"]) assert.notEqual(grade(per, s), "correct", s);
  // fractional units: "30 ÷ 6" and its kin took "30 × 6", "30 + 6" and the division turned round
  const div = find(`${process.env.LESSON_SCRIPTS_DIR || "data/lesson-scripts-staged"}/c6-maths-ch07-t01.json`, (it) => it.answer === "30 ko 6 se bhaag");
  for (const f of ["30 ÷ 6", "30 ko 6 se divide", "30 divided by 6", "30 mein 6 kitni baar"]) { assert.ok(div.acceptable.includes(f), f); assert.equal(grade(div, f), "correct", f); }
  for (const s of ["30 × 6", "30 + 6", "6 ÷ 30", "6 ko 30 se divide", "6 divided by 30", "6 mein 30 kitni baar", "30 - 6", "6 ko 30 se bhaag", "6/30"]) assert.notEqual(grade(div, s), "correct", s);
  // angles: "nahi, right angle hai" took the claim it denies, "right angle nahi hai"
  const ang = `${process.env.LESSON_SCRIPTS_DIR || "data/lesson-scripts-staged"}/c4-maths-ch01-t02.json`;
  const sonu = find(ang, (it) => (it.acceptable ?? []).includes("nahi, right angle hai"));
  const carrom = find(ang, (it) => (it.acceptable ?? []).includes("nahi, chaaron right angle hain"));
  assert.equal(grade(sonu, "nahi, right angle hai"), "correct");
  assert.equal(grade(carrom, "nahi, chaaron right angle hain"), "correct");
  for (const s of ["right angle nahi hai", "right angle nahi", "haan", "ji haan", "हाँ", "yes"]) assert.notEqual(grade(sonu, s), "correct", s);
  for (const s of ["chaaron right angle nahi hain", "haan", "ji haan", "हाँ", "yes"]) assert.notEqual(grade(carrom, s), "correct", s);
});

test("048: the reader's own tables spell what the reader reads (the gate and the reader cannot drift apart)", () => {
  for (const n of [1, 2, 7, 12, 25, 26, 99, 130, 600, 1500, 2026]) for (const lang of ["hi", "dev", "en"]) {
    const w = spell(n, lang);
    if (w) assert.equal(spokenNumber(w), n, `${lang} ${w}`);
  }
});

test("d32 step 0: a reply said the way a right form is said, with other numbers, is the wrong answer in code (staged c6-ch07-t01 offtopic 14)", () => {
  const item = { id: "script:x:stepask:0", answer: "30 ko 6 se bhaag", acceptable: ["30 ÷ 6", "6 se bhaag", "bhaag"], scriptAsk: { wrongIfMis: null, targets: null }, prompt_hi: "Ganna kitne barabar hisson mein bata, yeh kis hisaab se nikaaloge?" };
  const t = { mode: "item", item, key: item.answer, also: item.acceptable, ideas: [], misconceptions: [], open: false };
  const g = (x) => classifyFast({ target: t, childText: x, typed: true })?.result?.outcome ?? null;
  assert.equal(g("27 ko 6 se bhaag"), "incorrect");
  assert.equal(g("27 ÷ 6"), "incorrect");
  assert.equal(g("30 ko 6 se bhaag"), "correct");
  assert.equal(g("30 ÷ 6"), "correct");
  // (a denial is still the model's to read)
  assert.equal(g("27 ko 6 se bhaag nahi"), null);
});
