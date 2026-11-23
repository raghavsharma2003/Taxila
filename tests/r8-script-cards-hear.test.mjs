// To Brain 048 G4 (docs/patches/to-brain/048-script-cards-hear-hindi-as-spoken.md): a script card hears the answer the way a
// child says it. Every keyed card of every live script (data/lesson-scripts/) and the two staged rewrites
// (c4-maths-ch01-t02; c6-maths-ch07-t01 live since director32; from LESSON_SCRIPTS_DIR, default data/lesson-scripts-staged) is answered in the
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
import { canon, sameAnswer, numberOf, optionsIn, wrongList, undenied, NO_ANSWER_WORDS } from "../server/grading/script-answer.js";
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
  const YN = "Ek chhota tukda pizza ka ek-tihaai hai, haan ya nahi?", KM = "1/8 ka hissa 1/2 se kam hai ya zyada?";
  const rows = [["2", "do"], ["2", "do hain"], ["2", "do hisse"], ["2", "दो"], ["3", "तीन"], ["1500", "pandrah sau"], ["1500", "पंद्रह सौ"], ["130", "ek sau tees"],
    ["130", "एक सौ तीस"], ["600", "chhah sau"], ["25", "pachees"], ["25", "पच्चीस"], ["1/4", "एक बटा चार"], ["12 wali patti", "12 wali", P], ["12 wali patti", "बारह वाली", P],
    ["3", "teen"], ["3", "mujhe lagta hai teen"], ["4", "chaar hai na"], ["1500 m", "pandrah sau metre"], ["21", "ikkees"], ["1/2", "aadha"], ["2/8", "do bata aath"],
    ["7", "seven"], ["26", "twenty six"], ["1/4", "ek bata chaar"], ["25", "twenty five"], ["600", "छह सौ"],
    // (d32: a closing "hai na" / "na?" / "haina" / ", right?" after an answer is a tag asking for agreement, never a denial)
    ["No", "No hai na", YN], ["No", "nahi hai na", YN], ["No", "No haina", YN], ["No", "nahi, right?", YN], ["4", "4 hai na"], ["4", "4 haina"],
    ["kam", "kam hai na", KM]];
  const bad = rows.map(([k, s, p]) => [k, s, grade(card(k, [], null, p), s)]).filter(([, , g]) => g !== "correct");
  assert.deepEqual(bad, []);
  // and the nearest wrong answers, said the same ways, are never right
  const wrong = [["2", "teen"], ["2", "तीन"], ["2", "three"], ["1500", "pandrah"], ["1500", "solah sau"], ["130", "ek sau bees"], ["25", "chhabbees"], ["25", "छब्बीस"],
    ["1/4", "चार बटा एक"], ["1/4", "ek bata teen"], ["12 wali patti", "8 wali", P], ["12 wali patti", "आठ वाली", P], ["2/8", "1/4"], ["7", "six"], ["26", "twenty seven"],
    ["2", "mujhe bata do"], ["2", "मुझे बता दो"], ["25", "pachees se kam"], ["25", "पच्चीस नहीं"], ["3", "teen ya chaar"], ["1500 m", "pandrah sau cm"],
    // (d32: "nahi" before the tag stays a denial)
    ["4", "4 nahi hai na"], ["kam", "kam nahi hai na", KM], ["Yes", "nahi hai na", YN], ["No", "haan hai na", YN]];
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
// (director32: c6-maths-ch07-t01 went live and is walked from data/lesson-scripts with the others)
const STAGED = ["c4-maths-ch01-t02"];
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
  assert.equal(counts.scripts, 6 + STAGED.length, "six live scripts (c6-maths-ch07-t01 live since director32) and the staged rewrite");
  assert.deepEqual(rightBad, [], "a right answer graded wrong or as the mix-up");
  assert.deepEqual(wrongBad, [], "a wrong answer graded right (a false key)");
});

test("048: the accept forms G7 made safe again refuse the wrong answers they once let in (the scripts' fix passes, 2026-11-18)", () => {
  const find = (path, pred) => { const s = JSON.parse(readFileSync(join(ROOT, path), "utf8")); const hit = cardsOf(s).find(([, it]) => pred(it)); assert.ok(hit, path); return hit[1]; };
  // perimeter: "24 + 18 + 24 + 18" took "24 × 18" and "24 + 18"
  // (main, d33: the step now asks what to do FIRST with 24 and 18 — key "jodenge", so that the doubling is the child's own step — and
  // "24 + 18" is a right answer to it. That a sum is not a bag of numbers stays pinned on the synthetic card of the G7 test below; here
  // the multiplication, the area mix-up this lesson is about, is still never right)
  const per = find("data/lesson-scripts/c6-maths-ch06-t01.json", (it) => it.answer === "jodenge");
  assert.ok(per.acceptable.includes("24 + 18 + 24 + 18"));
  for (const s of ["24 + 18 + 24 + 18", "18 + 24 + 18 + 24", "24 + 18", "jodenge"]) assert.equal(grade(per, s), "correct", s);
  for (const s of ["24 × 18", "24 + 18 + 24", "24 x 18", "jodkar guna", "jodkar teen guna", "guna karenge"]) assert.notEqual(grade(per, s), "correct", s);
  // fractional units: "30 ÷ 6" and its kin took "30 × 6", "30 + 6" and the division turned round
  const div = find("data/lesson-scripts/c6-maths-ch07-t01.json", (it) => it.answer === "30 ko 6 se bhaag");
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

test("048 follow-up: a form whose brackets decide it never matches in code a reply said without them — the model reads it", () => {
  const item = { id: "script:x:ask:e1", answer: "2 × (lambai + chaudai)", acceptable: ["2 × (lambai + chaudai)"], scriptAsk: { wrongIfMis: "lambai + chaudai", targets: null }, prompt_hi: "Rectangle ka parimap kaise nikaaloge?" };
  const t = { mode: "item", item, key: item.answer, also: item.acceptable, ideas: [], misconceptions: [], open: false };
  const r = (x) => classifyFast({ target: t, childText: x, typed: true });
  assert.equal(r("2 × (lambai + chaudai)").result?.outcome, "correct");
  for (const x of ["2 × lambai + chaudai", "2 into lambai plus chaudai"]) { assert.equal(r(x).result, null, x); assert.equal(r(x).scriptUnsure, "brackets", x); }
});

// ───────────── to-brain 050: at a script card, code says "wrong" only when it knows ─────────────
// (docs/patches/to-brain/050-script-grade-says-wrong-only-when-it-knows.md; main's probe on int/r6 ba3d5df61: every row below was `incorrect`)
const P050 = {
  guna: card("2 se guna", [], null, "Upar ke 3 ka kya karein?"),
  gap: card("2 gap chalo", [], null, "2/5 ke liye kya karoge?"),
  zyada: card("ek se zyada", [], null, "Ek tukda kaafi, ya zyada chahiye?"),
  baad: card("beech ke baad", [], null, "4/6 beech se pehle hai ya baad mein?"),
};
const TABLE050 = [["guna", "do se guna karo"], ["guna", "upar ko bhi 2 se guna karenge"], ["guna", "double karo"], ["guna", "6"], ["gap", "2 gap aage jayenge"],
  ["gap", "do gap chalenge"], ["gap", "2 gap"], ["zyada", "zyada chahiye"], ["zyada", "do tukde chahiye"], ["baad", "baad mein"], ["baad", "beech ke baad aayega"]];

test("050 table: no right answer in main's table is `incorrect` (each is `correct` or the model's)", () => {
  const bad = TABLE050.map(([c, s]) => [c, s, grade(P050[c], s)]).filter(([, , g]) => g !== "correct" && g !== "model");
  assert.deepEqual(bad, []);
});

test("050 W1: at a word key an unmatched reply goes to the model as `word_key`; code says wrong only for the four named reasons", () => {
  const raw = (item, say) => classifyFast({ target: { mode: "item", item, key: item.answer, also: item.acceptable || [] }, childText: say, typed: false, asrConfidence: 0.95 });
  // unmatched, no reason: the model's, with the reason named
  for (const s of ["2 gap aage jayenge", "guna karenge", "multiply"]) {
    const c = s === "2 gap aage jayenge" ? P050.gap : P050.guna;
    const r = raw(c, s);
    assert.equal(r.result, null, s);
    assert.equal(r.scriptUnsure, "word_key", s);
  }
  // reason 1: the listed wrong answer, or the same answer as one (the mix-up)
  const mis = card("2 se guna", [], "2 jodo", "Upar ke 3 ka kya karein?");
  assert.equal(grade(mis, "2 jodo"), "misconception");
  assert.equal(grade(mis, "do jodo"), "misconception");
  assert.equal(grade(mis, "2 jodo hai"), "misconception");
  // reason 2: it names exactly one option of the prompt, and another option is the right form
  const opt = card("Neha ka kaam", [], null, "Kiska kaam zyada hai: Neha ka kaam ya Ravi ka kaam?");
  assert.equal(grade(opt, "Ravi"), "incorrect");
  assert.equal(grade(opt, "Neha"), "correct");
  // reason 3: said the way a right form is said, with other numbers (the d32 shape rule)
  assert.equal(grade(P050.gap, "5 gap chalo"), "incorrect");
  assert.equal(grade(P050.guna, "3 se guna"), "incorrect");
  // reason 4: a bare yes / no to a card whose key is not one is an acknowledgement, never an answer — and never wrong in code
  for (const s of ["haan", "ok", "achha"]) assert.notEqual(grade(P050.guna, s), "incorrect", s);
  assert.notEqual(grade(P050.guna, "nahi"), "incorrect");
  // a reply whose only number is the number of a right form is never wrong in code
  for (const s of ["2 gap aage jayenge", "2", "do"]) assert.notEqual(grade(P050.gap, s), "incorrect", s);
});

test("050 W2: a key that is a number is graded as before; a word key with a bare-number form refuses another lone number", () => {
  assert.equal(grade(card("25"), "30"), "incorrect");
  assert.equal(grade(card("25"), "tees"), "incorrect");
  assert.equal(grade(card("25"), "तीस"), "incorrect");
  assert.equal(grade(card("25"), "pachees"), "correct");
  assert.equal(grade(card("8", [], null, "Kitne hisse?"), "aath hisse"), "correct");
  assert.equal(grade(card("8", [], null, "Kitne hisse?"), "saat hisse"), "incorrect");
  const A = card("2 se guna", ["2 guna", "6", "3 × 2"], null, "Neeche 5 ka 10 hua. Upar ke 3 ka kya karein?");
  assert.equal(grade(A, "6"), "correct");
  assert.equal(grade(A, "7"), "incorrect");
  // (the number of a right form is never wrong in code: "2" is the multiplier)
  assert.notEqual(grade(A, "2"), "incorrect");
});

test("050 (main's reader, c5-ch02-t03): a right form with a denial added, and a comparison turned round, are never `correct` — over every card", () => {
  const A = card("2 se guna", ["2 guna", "upar ko bhi 2 se guna karenge", "upar 2 se guna", "6", "3 × 2"], null, "Neeche 5 ka 10 hua. Upar ke 3 ka kya karein?");
  for (const s of ["2 se guna nahi", "2 se guna nahi karenge", "2 guna nahi"]) assert.notEqual(grade(A, s), "correct", s);
  const cmp = card("smaller", ["chhota", "1/2 se chhota", "5/12 chhota hai", "aadhe se kam"], "bigger", "Is line par 5/12, 1/2 se bada hai, chhota hai, ya barabar?");
  for (const s of ["1/2 chhota hai", "aadha chhota hai", "5/12 bada hai"]) assert.notEqual(grade(cmp, s), "correct", s);
  for (const s of ["1/2 se chhota", "5/12 chhota hai", "chhota"]) assert.equal(grade(cmp, s), "correct", s);
  const neg = card("no", ["nahi", "nahi, dono barabar hain", "barabar hain", "dono barabar"], "yes", "{friend} ka kehna hai ki 1/4 aur 2/8 barabar nahi ho sakte. Kya yeh baat sahi hai, haan ya nahi?");
  for (const s of ["nahi barabar", "nahi hain barabar", "nahi same"]) assert.notEqual(grade(neg, s), "correct", s);
  // the walls, over every card of every script
  const SWAP = { chhota: "bada", bada: "chhota", kam: "zyada", zyada: "kam", smaller: "bigger", bigger: "smaller", less: "more", more: "less" };
  const leaks = []; let denied = 0, turned = 0;
  for (const [name, path] of scripts()) for (const [where, it] of cardsOf(JSON.parse(readFileSync(path, "utf8")))) {
    const rights = [it.answer, ...(it.acceptable ?? [])].map(String), rc = rights.map(canon);
    const isRight = (f) => rc.some((r) => sameAnswer(r, canon(f)));
    for (const r of rights) {
      const c = canon(r);
      if (c.neg || !c.seq.length || c.seq.every((x) => x.t === "haan" || x.t === "nahi")) continue;
      // (a card that lists "nahi, X" as right — the child denying the friend — keeps "nahi X" right: that card's own choice)
      const listsNahiX = rc.some((x) => x.neg && x.seq[0]?.k === "neg" && undenied(x).seq.length);
      for (const f of [`${r} nahi`, ...(listsNahiX ? [] : [`nahi ${r}`]), `${r} nahi hai`]) { if (isRight(f)) continue; denied++; if (grade(it, f) === "correct") leaks.push(`${name} ${where} ${JSON.stringify(f)}`); }
      const ws = r.split(/\s+/);
      const k = ws.findIndex((w) => SWAP[w.toLowerCase()]);
      if (k >= 0) {
        const tries = [ws.map((w, j) => (j === k ? SWAP[w.toLowerCase()] : w)).join(" ")];
        for (const f of tries) { if (isRight(f)) continue; turned++; if (grade(it, f) === "correct") leaks.push(`${name} ${where} ${JSON.stringify(f)}`); }
      }
    }
  }
  assert.ok(denied > 500 && turned > 10, `the walls ran (denied ${denied}, turned ${turned})`);
  assert.deepEqual(leaks, []);
});

test("050 units: where a right form carries a unit, the key's number said with another unit is never `correct` (main's second and third readers)", () => {
  const c = card("5 cm", ["5", "5 centimetre", "paanch cm", "5 cm ka", "five", "paanch"], null, "Ab ek 15 cm ki patti ke 3 barabar hisse karne hain. Har hissa kitne cm ka hoga?");
  for (const s of ["5 metre", "5 m", "paanch metre"]) assert.equal(grade(c, s), "incorrect", s);
  for (const s of ["5 square cm", "5 sq cm", "5 वर्ग सेंटीमीटर", "5 kg"]) assert.notEqual(grade(c, s), "correct", s);
  for (const s of ["5", "5 cm", "paanch cm", "5 सेंटीमीटर", "5 centimetre"]) assert.equal(grade(c, s), "correct", s);
  // the wall, over every card of every script whose key carries one of these units
  const UNITS = ["cm", "m", "km", "g", "kg", "ml", "litre", "rupaye", "minute", "ghante", "square cm", "sq m"];
  const KEY_UNIT = /^\s*(\d+(?:\/\d+)?)\s*(cm|m|km|g|kg|ml|litre|litres|l|rupaye|rs|minute|minutes|ghante|ghanta)\.?\s*$/i;
  const leaks = []; let cards = 0, tried = 0;
  for (const [name, path] of scripts()) for (const [where, it] of cardsOf(JSON.parse(readFileSync(path, "utf8")))) {
    const m = String(it.answer).match(KEY_UNIT);
    if (!m) continue;
    cards++;
    const ku = canon(String(it.answer)).units;
    for (const u of UNITS) {
      const f = `${m[1]} ${u}`;
      if (canon(f).units.join() === ku.join()) continue;
      tried++;
      if (grade(it, f) === "correct") leaks.push(`${name} ${where} key=${JSON.stringify(it.answer)} said ${JSON.stringify(f)}`);
    }
  }
  // (main's fourth reader: the fault is general — every staged script too, not only the gate's two)
  if (existsSync(STAGED_DIR)) for (const f of readdirSync(STAGED_DIR).filter((x) => x.endsWith(".json") && !STAGED.includes(x.replace(/\.json$/, "")))) {
    let its; try { its = cardsOf(JSON.parse(readFileSync(join(STAGED_DIR, f), "utf8"))); } catch { continue; }
    for (const [where, it] of its) {
      const m = String(it.answer).match(KEY_UNIT);
      if (!m) continue;
      cards++;
      const ku = canon(String(it.answer)).units;
      for (const u of UNITS) { const f2 = `${m[1]} ${u}`; if (canon(f2).units.join() === ku.join()) continue; tried++; if (grade(it, f2) === "correct") leaks.push(`staged:${f} ${where} key=${JSON.stringify(it.answer)} said ${JSON.stringify(f2)}`); }
    }
  }
  console.log(`# 050 unit wall: ${cards} cards, ${tried} replies`);
  assert.ok(cards >= 3, `the wall found unit-keyed cards (${cards})`);
  assert.deepEqual(leaks, []);
});

test("050 working: spoken working that ends on the key's number is right when its sum is true, the model's when not; a minus between numbers is no sign", () => {
  const c = card("4 m", ["4", "chaar", "4 metre", "chaar metre", "four"], "18 m", "Tumhari baari: maali ki 35 m baad mein se kitni bachegi?");
  for (const s of ["35 - 31 = 4", "35 − 31 = 4", "35 minus 31, 4", "35 minus 31 barabar 4"]) assert.equal(grade(c, s), "correct", s);
  for (const s of ["35 - 18 = 4", "35 mein se 31 gaye, 4 bache"]) assert.notEqual(grade(c, s), "correct", s);
  for (const s of ["35 - 18 = 4", "35 − 18 = 17", "35 mein se 31 gaye, 4 bache", "31 lagi toh 4 bachi"]) assert.notEqual(grade(c, s), "incorrect", s);
  // (an answer said negative is still never the key: the v6.8 sign rule stands)
  assert.notEqual(grade(c, "-4"), "correct");
  const big = card("94 m", ["94", "94 metre"], null, "140 m mein se 46 m lagi. Kitni bachegi?");
  for (const s of ["140 − 46 = 94", "140 minus 46 = 94"]) assert.equal(grade(big, s), "correct", s);
});

test("050 W1 (main's third reader, the perimeter script): \"do\" and \"ek\" in a word key's plain phrasings are never wrong in code", () => {
  const find = (pred) => cardsOf(JSON.parse(readFileSync(join(ROOT, "data/lesson-scripts/c6-maths-ch06-t01.json"), "utf8"))).find(([, it]) => pred(it))?.[1];
  // (main, d33: the step's key is now "jodenge"; its plain phrasings with "do guna" are still right answers to it)
  const dbl = find((it) => it.answer === "jodenge"), lap = find((it) => it.answer === "ek chakkar");
  assert.ok(dbl && lap);
  for (const s of ["jodkar do guna karo", "jodo phir do guna karo", "pehle jodo phir do guna", "jod ka do guna karna hai", "jodkar double karo"]) assert.notEqual(grade(dbl, s), "incorrect", s);
  for (const s of ["ek chakkar nikalna hoga", "pehle ek chakkar ki doori nikalni hogi", "ek round ki doori"]) assert.notEqual(grade(lap, s), "incorrect", s);
  for (const s of ["24 + 18 + 24 + 18", "jodkar do guna"]) assert.equal(grade(dbl, s), "correct", s);
});

test("050 W4: a two-option prompt answered by its option's own words is graded by which form that option is", () => {
  assert.equal(grade(P050.baad, "baad mein"), "correct");
  assert.equal(grade(P050.baad, "pehle"), "incorrect");
  for (const s of ["pehle", "pehle hai", "beech se pehle"]) assert.notEqual(grade(P050.baad, s), "correct", s);
  // where the forms between them hold both options (a form naming another subject turns the comparison round), code decides nothing
  const two = card("Gopi se kam", ["kam", "Neha ka kam", "Gopi ke paas zyada"], "barabar", "Neha ne 3 liye, Gopi ne 6. Neha ka kam ya zyada?");
  for (const s of ["zyada", "more", "ज़्यादा"]) assert.notEqual(grade(two, s), "correct", s);
  assert.equal(grade(two, "kam"), "correct");
  // two options sharing their deciding word: the model reads it
  const same = card("bada wala", [], null, "Kaunsa: bada tukda ya bada hissa?");
  assert.notEqual(grade(same, "bada"), "incorrect");
});

test("050 (main): beside a comparison word \"se\" is content — \"X se kam\" and \"X kam\" never match each other in code; walls over every form of that shape", () => {
  const r = card("kam", ["Rahul se kam", "kam hai"], "zyada", "Mohan ne Rahul se kam khaya, zyada, ya barabar?");
  assert.notEqual(grade(r, "Rahul kam"), "correct");
  assert.equal(grade(r, "Rahul se kam"), "correct");
  const h = card("smaller", ["chhota", "1/2 se chhota"], "bigger", "Is line par 5/12, 1/2 se bada hai ya 1/2 se chhota?");
  for (const s of ["1/2 chhota hai", "1/2 chhota"]) assert.notEqual(grade(h, s), "correct", s);
  assert.equal(grade(h, "1/2 se chhota"), "correct");
  const CMPW = "kam|zyada|jyada|bada|badi|bade|chhota|chhoti|chhote|lamba|lambi|lambe|pehle|baad|aage|peeche|more|less|bigger|smaller|before|after";
  const withSe = new RegExp(`^(.*\\S)\\s+se\\s+(${CMPW})(\\b.*)$`, "i"), without = new RegExp(`^(.*\\S)\\s+(${CMPW})(\\b.*)$`, "i");
  const leaks = []; let shape = 0, tried = 0;
  for (const [name, path] of scripts()) for (const [where, it] of cardsOf(JSON.parse(readFileSync(path, "utf8")))) {
    const rights = [it.answer, ...(it.acceptable ?? [])].map(String), rc = rights.map(canon);
    for (const f of rights) {
      let m = f.match(withSe), say = null;
      if (m) say = `${m[1]} ${m[2]}${m[3]}`;
      else if ((m = f.match(without)) && !/\bse$/i.test(m[1])) say = `${m[1]} se ${m[2]}${m[3]}`;
      if (!say) continue;
      shape++;
      if (rc.some((x) => sameAnswer(x, canon(say))) || rights.includes(say)) continue;
      tried++;
      if (grade(it, say) === "correct") leaks.push(`${name} ${where} form ${JSON.stringify(f)} said ${JSON.stringify(say)}`);
    }
  }
  console.log(`# 050 se-wall: ${shape} forms of the shape, ${tried} replies tried`);
  assert.deepEqual(leaks, []);
});

test("050 W3: the plain ways of saying a word key are right by one rule; the wall — every card's wrong answers and other options, dressed in every filler, never right", () => {
  const W3 = [["guna", "do se guna karo"], ["guna", "upar ko bhi 2 se guna karenge"], ["guna", "double karo"], ["guna", "dugna kar do"], ["guna", "isko bhi 2 se guna karenge"],
    ["gap", "do gap chalenge"], ["gap", "2 gap"], ["baad", "baad mein"], ["baad", "beech ke baad aayega"]];
  for (const [c, s] of W3) assert.equal(grade(P050[c], s), "correct", s);
  // the wrong answers a child would give, dressed, never right
  for (const [c, s] of [["gap", "5 gap chalo"], ["gap", "5 gap chalenge"], ["guna", "2 jodo"], ["guna", "upar 2 jodo karenge"], ["guna", "3 hi rahega"], ["guna", "3 se guna karenge"],
    ["zyada", "ek kaafi"], ["zyada", "ek tukda kaafi hoga"], ["baad", "beech se pehle"], ["baad", "pehle aayega"], ["baad", "pehle"]]) assert.notEqual(grade(P050[c], s), "correct", s);
  // incomplete but not wrong: the model's
  for (const s of ["guna karenge", "upar bhi same", "multiply"]) assert.equal(grade(P050.guna, s), "model", s);
  const words = [...NO_ANSWER_WORDS].filter((w) => /^[a-z]+$/.test(w));
  const dress = (x) => [...words.flatMap((w) => [`${x} ${w}`, `${w} ${x}`]), `upar ${x} karenge`, `isko bhi ${x} karo`, `phir ${x} chalenge`, `${x} karna hoga`, `toh ${x} hai`];
  const leaks = []; let cards = 0, tried = 0;
  for (const [name, path] of scripts()) for (const [where, it] of cardsOf(JSON.parse(readFileSync(path, "utf8")))) {
    const kc = canon(String(it.answer));
    if (numberOf(kc) != null || (kc.seq.length && kc.seq.every((x) => x.t === "haan" || x.t === "nahi"))) continue;
    cards++;
    const prompt = it.prompt_hi ?? it.prompt_en;
    const rights = [it.answer, ...(it.acceptable ?? [])].map(String), rc = rights.map(canon);
    // (an option the prompt reader cut short — "wala number" of "…upar wala number ya neeche wala?" — that a right form holds whole is the
    // right option, not a wrong one: dressing it in "upar" says the key)
    const cutRight = (o) => { const c = canon(o); const k = canon(String(it.answer)); return c.seq.length && c.words.length < k.words.length && c.words.every((w) => k.words.includes(w)) && c.nums.join() === k.nums.join() && !c.ops && !c.neg; };
    const bad = [...wrongList(metaOf(it).wrongIfMis), ...optionsIn(prompt).filter((o) => !rc.some((r) => sameAnswer(r, canon(o))) && !cutRight(o))];
    for (const b of bad) for (const f of dress(b)) {
      if (rc.some((r) => sameAnswer(r, canon(f)))) continue;
      tried++;
      if (grade(it, f) === "correct") leaks.push(`${name} ${where} key=${JSON.stringify(it.answer)} said ${JSON.stringify(f)}`);
    }
  }
  console.log(`# 050 W3 wall: ${cards} word-keyed cards, ${tried} dressed wrong replies`);
  assert.ok(tried > 1000, `the wall ran (${tried})`);
  assert.deepEqual(leaks, []);
});

test("050 units (main's fourth reader): where the unit is the choice, a bare number of both a right form and a listed wrong answer decides nothing", () => {
  const c = card("30 metre", ["30 m"], "30 centimetre", "Kamre ki lambai kitni hogi: 30 metre ya 30 centimetre?");
  for (const s of ["30", "tees", "तीस"]) { const g = grade(c, s); assert.ok(g !== "correct" && g !== "misconception", `${s} → ${g}`); }
  assert.equal(grade(c, "30 metre"), "correct");
  assert.equal(grade(c, "30 centimetre"), "misconception");
  // a wrong answer that differs by its number too ("6 cm" against "600 cm") is as before: the bare "6" is the mix-up
  const d = card("600 cm", ["600"], "6 cm", "6 metre kitne cm?");
  assert.equal(grade(d, "6"), "misconception");
  assert.equal(grade(d, "600"), "correct");
  // the wall, over every card of every script (live, staged) whose right form and listed wrong carry one number in two units
  const leaks = []; let cards = 0;
  const dirs = [join(ROOT, "data/lesson-scripts"), ...(existsSync(STAGED_DIR) ? [STAGED_DIR] : [])];
  for (const dir of dirs) for (const f of readdirSync(dir).filter((x) => x.endsWith(".json"))) {
    let its; try { its = cardsOf(JSON.parse(readFileSync(join(dir, f), "utf8"))); } catch { continue; }
    for (const [where, it] of its) {
      const F = [it.answer, ...(it.acceptable ?? [])].map((x) => canon(String(x))).filter((x) => x.units.length && numberOf(x) != null);
      const W = wrongList(metaOf(it).wrongIfMis).map(canon).filter((x) => x.units.length && numberOf(x) != null);
      const both = F.map(numberOf).filter((n) => W.some((w) => numberOf(w) === n && w.units.join() !== F.find((x) => numberOf(x) === n).units.join()));
      if (!both.length) continue;
      cards++;
      for (const n of new Set(both)) { const g = grade(it, n.slice(1)); if (g === "correct" || g === "misconception") leaks.push(`${f} ${where} said ${n.slice(1)} → ${g}`); }
    }
  }
  console.log(`# 050 unit-choice wall: ${cards} cards`);
  assert.deepEqual(leaks, []);
});

test("050 (main): \"N mein se M\" — M out of N — is the fraction M/N, in digits, words and Devanagari; never wrong in code for its wording", () => {
  const c = card("10/12", ["10 bata 12"], null, "Kitna hissa?");
  for (const s of ["baarah mein se das", "12 mein se 10", "12 mein se 10 hisse", "12 mein 10", "बारह में से दस"]) assert.equal(grade(c, s), "correct", s);
  for (const s of ["12 mein se 9", "baarah mein se do", "10 mein se 12"]) assert.notEqual(grade(c, s), "correct", s);
  // ("30 mein 6 kitni baar" is a division said in words, never a fraction)
  const div = card("30 ko 6 se bhaag", ["30 mein 6 kitni baar"], "6 ÷ 30");
  assert.equal(grade(div, "30 mein 6 kitni baar"), "correct");
  assert.notEqual(grade(div, "6 mein 30 kitni baar"), "correct");
});

test("050 units (main's probe): where the choice is the unit, the unit said alone is graded by that unit; the bare number decides nothing", () => {
  const m = card("30 metre", [], "30 centimetre", "Corridor 30 centimetre ka hai ya 30 metre ka?");
  for (const s of ["metre", "metre ka", "30 metre ka", "metre mein", "30 metre"]) assert.equal(grade(m, s), "correct", s);
  for (const s of ["centimetre", "cm", "centimetre ka", "30 centimetre"]) assert.equal(grade(m, s), "misconception", s);
  for (const s of ["30", "tees"]) assert.equal(grade(m, s), "model", s);
  const c = card("6 centimetre", [], "6 metre", "Pencil 6 centimetre ki hai ya 6 metre ki?");
  for (const s of ["centimetre", "cm", "centimetre ki", "6 cm"]) assert.equal(grade(c, s), "correct", s);
  for (const s of ["metre", "metre ki", "6 metre"]) assert.equal(grade(c, s), "misconception", s);
  for (const s of ["6", "chhah"]) assert.equal(grade(c, s), "model", s);
});
