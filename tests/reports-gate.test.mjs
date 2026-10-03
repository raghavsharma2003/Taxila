// Parent reports, pure parts (server/reports/**): the banned-word and overclaim gate THROWS (never trims), every
// template in every language passes its own lexicon, numbers come only from slots, the calibration gate locks the
// mastery words, voice features are never a source, and the same snapshot renders the same text (E-R9).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "fs";
import { BANNED, LOCKED, bannedHits, lockedHits, norm } from "../server/reports/lexicon.js";
import { SHAPES, FIXED, CONNECTIVES, HOME_OBJECT, renderShape, renderFixed } from "../server/reports/templates.js";
import { ReportGateError, gateReport, lineViolations } from "../server/reports/gate.js";
import { buildClaims } from "../server/reports/claims.js";
import { renderLang } from "../server/reports/render.js";
import { assemble, laneAOrder, orderForVoice, validateOrder } from "../server/reports/writer.js";
import { LANGS, VOICE_WORDS } from "../server/reports/config.js";
import { dayFacts, SKILLS } from "./fixtures/report-facts.mjs";

const SAMPLE = { name: "Riya", skill: "Compares fractions with the same numerator", belief: "A bigger denominator means a bigger fraction",
  interest: "cricket", n: 7, k: 3, d: 2, lessons: 2, days: 2, min: 41, date: { y: 2026, m: 10, d: 9 }, object: "maths" };
const slotsFor = (shapeId) => Object.fromEntries(Object.keys(SHAPES[shapeId].slots).map((k) => [k, SAMPLE[k]]));

function assembled(facts, { k7 = false } = {}) {
  const built = buildClaims(facts, { k7 });
  const cadence = facts.window.cadence;
  const renders = {};
  for (const L of LANGS) {
    const R = renderLang({ cadence, ...built }, facts.child, L);
    const o = laneAOrder(R.lines, L, cadence);
    R.voice = { order: o.order, text: assemble(o.order, R.lines, L) };
    renders[L] = R;
  }
  return { built, body: { cadence, claims: built.claims, renders } };
}

test("lexicon: catches traits, labels, comparison, pressure and causal words in EN, Devanagari (nukta-insensitive) and Roman Hindi", () => {
  for (const s of ["She is lazy", "a weak student", "better than her brother", "the topper", "He forgets things", "only 3 days left", "because she tried",
    "ज़िद्दी है", "जिद्दी है", "कमज़ोर", "बाक़ी बच्चे", "woh kamzor hai", "padhai mein mann nahi lagta", "Great work!", "her test marks", "voice was shaky"]) {
    assert.ok(bannedHits(s).length > 0, `missed: ${s}`);
  }
  for (const s of ["Practised the topic", "Taxila will use it in examples", "habitat of a frog", "right on the first try", "मंदिर", "darwaza"]) {
    assert.deepEqual(bannedHits(s), [], `false hit on: ${s}`);
  }
  assert.ok(lockedHits("is now pakka").length && lockedHits("she understood it").length && lockedHits("समझ गया").length);
});

test("lexicon recall (E-R4 lite): every banned entry, inflected and embedded mid-sentence, in any case, is caught", () => {
  let n = 0, hit = 0;
  for (const [cat, list] of Object.entries(BANNED)) {
    for (const e of list) {
      const word = e.endsWith("*") ? e.slice(0, -1) + (/[a-z]$/.test(e.slice(0, -1)) ? "ing" : "") : e;
      for (const frame of [(w) => `Riya ${w} today.`, (w) => `${w.toUpperCase()} — yes`, (w) => `(${w})`]) {
        n++;
        if (bannedHits(frame(word)).some((h) => h.category === cat || true)) hit++;
        else assert.fail(`${cat}:${e} missed in "${frame(word)}"`);
      }
    }
  }
  for (const e of LOCKED) { n++; if (lockedHits(`Riya ${e.replace("*", "y")} now`).length) hit++; else assert.fail(`locked ${e} missed`); }
  assert.equal(hit, n);
});

test("every claim template and every fixed copy, in every language, passes the gate on sample slots (our own strings are clean)", () => {
  for (const [id, sh] of Object.entries(SHAPES)) {
    for (const lang of LANGS) {
      const text = renderShape(id, lang, slotsFor(id));
      const v = lineViolations(text, { shapeId: id, slots: slotsFor(id), lang, k7: !!sh.locked, firstName: "Riya" });
      assert.deepEqual(v, [], `${id}/${lang}: ${JSON.stringify(v)} in "${text}"`);
    }
  }
  for (const id of Object.keys(FIXED)) for (const lang of LANGS) {
    const slots = /disclosure|home.generic/.test(id) ? { name: "Riya" } : {};
    assert.deepEqual(lineViolations(renderFixed(id, lang, slots), { fixedId: id, slots, lang, firstName: "Riya" }), [], `${id}/${lang}`);
  }
  for (const [id, t] of Object.entries(CONNECTIVES)) for (const lang of LANGS) assert.deepEqual(bannedHits(t[lang]), [], `${id}/${lang}`);
  for (const o of Object.values(HOME_OBJECT)) for (const lang of LANGS) assert.deepEqual(bannedHits(o[lang]), []);
});

test("overclaim: the pakka shape is refused until the calibration gate passes; locked words in a template text are refused", () => {
  const s = slotsFor("st.pakka");
  const v = lineViolations(renderShape("st.pakka", "en", s), { shapeId: "st.pakka", slots: s, lang: "en", k7: false, firstName: "Riya" });
  assert.ok(v.some((x) => x.rule === "overclaim"));
  assert.deepEqual(lineViolations(renderShape("st.pakka", "hi", s), { shapeId: "st.pakka", slots: s, lang: "hi", k7: true, firstName: "Riya" }), []);
});

test("numbers: a digit that is not a slot value is a violation; digits inside a curriculum title are masked", () => {
  const slots = { skill: "Numbers up to 1,00,000", n: 4, k: 3 };
  const good = renderShape("row.work", "en", slots);
  assert.deepEqual(lineViolations(good, { shapeId: "row.work", slots, lang: "en", firstName: "Riya" }), []);
  const v = lineViolations(good.replace("4 questions", "5 questions"), { shapeId: "row.work", slots, lang: "en", firstName: "Riya" });
  assert.ok(v.some((x) => x.rule === "number_not_in_slots") && v.some((x) => x.rule === "text_mismatch"));
});

// TEMPLATE DIGIT HYGIENE only: each line is rendered from its own slots and its digits checked against those slots,
// so this shows the templates add no stray digit. It is NOT numeric correctness (the digit check is set membership:
// "4 of 3" with n and k swapped passes it). Numeric fidelity is check.js re-deriving every slot from the cited rows,
// measured by the sim-week mutants (swap_n_k, slot±1, date+1).
test("template digit hygiene: 2,000 random slot sets render with no digit outside the slots, in every language", () => {
  let seed = 7;
  const rnd = (m) => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed % m; };
  const ids = Object.keys(SHAPES).filter((id) => !SHAPES[id].locked);
  for (let i = 0; i < 2000; i++) {
    const id = ids[rnd(ids.length)];
    const slots = slotsFor(id);
    for (const k of ["n", "k", "d", "lessons", "days", "min"]) if (k in slots) slots[k] = 1 + rnd(400);
    if ("date" in slots) slots.date = { y: 2026, m: 1 + rnd(12), d: 1 + rnd(28) };
    for (const lang of LANGS) {
      const v = lineViolations(renderShape(id, lang, slots), { shapeId: id, slots, lang, firstName: "Riya" });
      assert.deepEqual(v, [], `${id}/${lang} ${JSON.stringify(slots)}`);
    }
  }
});

test("a template bug that renders a JS value is caught, not shown", () => {
  const v = lineViolations("Still working on “x”: 1 of 3 right. It comes back on [object Object].", { shapeId: "tricky.work", slots: { skill: "x", n: 3, k: 1, date: { y: 2026, m: 10, d: 8 } }, lang: "en", firstName: "Riya" });
  assert.ok(v.some((x) => x.rule === "template_bug"));
});

test("pipeline: a day with lessons renders header → strength → rows → tricky in all three languages and passes the gate", () => {
  // a memory row shaped like the lesson-end writer's output (free model paraphrase): never quoted, no interest line
  const { built, body } = assembled(dayFacts({ memories: [{ id: "9", kind: "interest", text: "loves cricket", createdAt: "2026-10-06T11:40:00.000Z" }] }));
  assert.deepEqual(built.claims.map((c) => c.section), ["header", "strength", "row", "tricky"]);
  for (const L of LANGS) assert.ok(!body.renders[L].lines.some((l) => /cricket/.test(l.text)), `${L}: memory text reached a parent line`);
  assert.equal(built.claims.find((c) => c.section === "strength").shapeId, "st.delayed");
  assert.equal(built.claims.find((c) => c.section === "tricky").shapeId, "tricky.mixup");
  assert.ok(gateReport(body, { firstName: "Riya" }));
  for (const L of LANGS) {
    const text = body.renders[L].lines.map((l) => l.text).join("\n");
    assert.deepEqual(lockedHits(text), [], `${L}: a locked word reached parent text before K7`);
    assert.ok(body.renders[L].voice.text.split(/\s+/).length <= VOICE_WORDS.daily);
  }
});

test("calibration gate: with K7 passed, two delayed successes on distinct items ≥ 1 day apart read pakka; without it, evidence only", () => {
  const extra = [{ sessionId: "S3", at: "2026-10-08T11:31:00.000Z", skillIds: [SKILLS.A], cls: "item.open", outcome: 0 }];
  const f = dayFacts({ cadence: "weekly", period: "2026-W41", extra });
  assert.equal(assembled(f, { k7: true }).built.claims.find((c) => c.section === "strength").shapeId, "st.pakka");
  const off = assembled(f, { k7: false });
  assert.equal(off.built.claims.find((c) => c.section === "strength").shapeId, "st.delayed");
  assert.ok(gateReport(off.body, { firstName: "Riya" }));
});

test("gate THROWS on a cap overrun, an injected banned word and an over-budget script; nothing is trimmed to pass", () => {
  const base = () => assembled(dayFacts()).body;
  const extraRow = base();
  const row = extraRow.claims.find((c) => c.section === "row");
  for (let i = 0; i < 2; i++) {
    const dup = { ...row, id: `row:row.work:${"abcdef012" + i}` };
    extraRow.claims.push(dup);
    for (const L of LANGS) extraRow.renders[L].lines.splice(3, 0, { kind: "claim", key: dup.id, claimId: dup.id, section: "row", text: renderShape("row.work", L, dup.slots) });
  }
  assert.throws(() => gateReport(extraRow, { firstName: "Riya" }), (e) => e instanceof ReportGateError && e.violations.some((v) => v.rule === "cap"));
  const dirty = base();
  const l = dirty.renders.en.lines.find((x) => x.section === "row");
  l.text = l.text.replace("Practised", "Smart work, practised");
  assert.throws(() => gateReport(dirty, { firstName: "Riya" }), (e) => e.violations.some((v) => v.rule === "banned") && e.violations.some((v) => v.rule === "text_mismatch"));
  const long = base();
  long.renders.hi.voice.text += " और" + " शब्द".repeat(200);
  assert.throws(() => gateReport(long, { firstName: "Riya" }), (e) => e.violations.some((v) => v.rule === "voice_text_mismatch" || v.rule === "voice_budget"));
  const fx = assembled(dayFacts({ cadence: "weekly", period: "2026-W41" })).body;
  fx.claims.find((c) => c.section === "home").slots.name = "Golu";
  assert.throws(() => gateReport(fx, { firstName: "Riya" }), (e) => e.violations.some((v) => v.rule === "name_slot"));
});

test("zero-lesson week still renders (RRI14): no-lessons header, the latest earlier delayed success, the generic home activity", () => {
  const f = dayFacts({ cadence: "weekly", period: "2026-W42", lessons: [] });
  const { built, body } = assembled(f);
  assert.equal(built.claims[0].shapeId, "header.zero");
  assert.equal(built.claims.find((c) => c.section === "strength")?.shapeId, "st.delayed_before");
  assert.ok(built.fixedHome);
  assert.ok(body.renders.en.lines.some((l) => l.fixedId === "home.generic"));
  assert.ok(gateReport(body, { firstName: "Riya" }));
  assert.equal(buildClaims(dayFacts({ period: "2026-10-10", lessons: [] })), null, "a daily window with no lesson and no evidence has no note");
});

test("assisted and contaminated rows never count; the mix-up line needs the diagnostic set (≥ 3 discriminating, ≥ 2 matching)", () => {
  const f = dayFacts();
  for (const e of f.events) if (e.skillIds[0] === SKILLS.B && e.misconceptionId) e.assisted = "parent";
  const t = buildClaims(f).claims.find((c) => c.section === "tricky");
  assert.equal(t?.shapeId ?? "none", "none", "with the matching answers assisted, B no longer has 3 scored attempts on its own");
  const g = dayFacts();
  g.events.find((e) => e.misconceptionId === "m1").misconceptionId = null;
  assert.equal(buildClaims(g).claims.find((c) => c.section === "tricky").shapeId, "tricky.work");
});

test("determinism (E-R9): the same snapshot renders byte-identical Lane A text and claim ids", () => {
  const a = assembled(dayFacts()), b = assembled(dayFacts());
  assert.equal(JSON.stringify(a.body), JSON.stringify(b.body));
});

test("voice features are never a report source: facts.js reads no voice table and no claim cites one", () => {
  const src = readFileSync(new URL("../server/reports/facts.js", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  assert.ok(!/voice_feature|voice_baseline/.test(src));
  const { built } = assembled(dayFacts());
  assert.ok(built.claims.every((c) => c.factIds.every((f) => /^(kt_evidence|lesson|kt_skill_state|memory):/.test(f))));
});

test("Lane B: a valid order is used; invalid output twice falls back to Lane A; a zero budget never calls the model", async () => {
  const { body } = assembled(dayFacts({ cadence: "weekly", period: "2026-W41" }));
  const lines = body.renders.en.lines;
  const ids = lines.filter((l) => !l.appOnly).map((l) => l.key);
  const good = [{ kind: "segment", id: ids[0] }, ...ids.slice(1, -1).flatMap((id, i) => (i === 1 ? [{ kind: "connective", id: "c.good" }, { kind: "segment", id }] : [{ kind: "segment", id }])), { kind: "segment", id: "close" }];
  assert.equal(validateOrder(good, lines, "en", "weekly"), null);
  assert.match(validateOrder(good.filter((o) => o.id !== ids[1]), lines, "en", "weekly"), /must_keep/);
  assert.match(validateOrder([{ kind: "connective", id: "c.next" }, ...good], lines, "en", "weekly"), /connective_position/);
  assert.match(validateOrder([...good.slice(0, -1), { kind: "segment", id: "made-up" }, good.at(-1)], lines, "en", "weekly"), /unknown_segment/);
  let calls = 0;
  const llmOk = { chat: async () => { calls++; return { json: { order: good }, usage: { prompt_tokens: 900, completion_tokens: 200 } }; } };
  const ok = await orderForVoice({ lines, lang: "en", cadence: "weekly" }, { llm: llmOk, deployments: ["taxila-brain", "taxila-fast"] });
  assert.equal(ok.lane, "B"); assert.equal(ok.model, "taxila-brain"); assert.equal(ok.spentMicroUsd, 900 * 4 + 200 * 20);
  const llmBad = { chat: async () => { calls++; return { json: { order: [{ kind: "segment", id: "nope" }] }, usage: {} }; } };
  const bad = await orderForVoice({ lines, lang: "en", cadence: "weekly" }, { llm: llmBad, deployments: ["taxila-brain", "taxila-fast"] });
  assert.equal(bad.lane, "A"); assert.equal(bad.attempts.length, 2);
  const before = calls;
  const broke = await orderForVoice({ lines, lang: "en", cadence: "weekly" }, { llm: llmOk, budgetMicroUsd: 0 });
  assert.equal(calls, before); assert.equal(broke.lane, "A"); assert.match(broke.reason, /budget/);
});

test("lexicon normalisation is idempotent and strips the nukta", () => {
  assert.equal(norm("ज़रूर"), norm("जरूर"));
  assert.equal(norm(norm("ग़लती")), norm("ग़लती"));
});

test("growth edge with no re-check date: a not-learned skill reads 'comes back in the next lessons'; a learned one without a date gets no line", () => {
  const f = dayFacts();
  f.skills[SKILLS.B] = { display: "practising", nextReviewAt: null, refresh: false };
  const t = buildClaims(f).claims.find((c) => c.section === "tricky");
  assert.equal(t.shapeId, "tricky.mixup_next");
  assert.equal(t.slots.date, undefined);
  assert.ok(gateReport(assembled(f).body, { firstName: "Riya" }));
  const g = dayFacts();
  g.skills[SKILLS.B] = { display: "learned_today", nextReviewAt: null, refresh: false };
  assert.equal(buildClaims(g).claims.find((c) => c.section === "tricky"), undefined);
});

test("Lane B: a cancel requested before the call stops the job; the model is never called", async () => {
  const { body } = assembled(dayFacts());
  const { JobCancelled } = await import("../server/reports/jobs.js");
  await assert.rejects(orderForVoice({ lines: body.renders.en.lines, lang: "en", cadence: "daily" },
    { llm: { chat: async () => assert.fail("called after cancel") }, beforeCall: async () => { throw new JobCancelled(); } }), (e) => e.code === "cancelled");
});

// ───────────── review fixes (fixer pass, 2026-10-03) ─────────────
import { HOW } from "../server/reports/templates.js";
import { lessonEndMs } from "../server/reports/claims.js";
import { evidenceClaimOut, reportHold } from "../server/routes/parent.js";

test("no interest line exists: no shape, no cap, and facts.js never reads the memory table", () => {
  assert.equal(SHAPES.interest, undefined);
  const src = readFileSync(new URL("../server/reports/facts.js", import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  assert.ok(!/from memory\b/.test(src));
});

test("delayed success never claims the earlier time was right: the previous contact here was a C2 answer", () => {
  const f = dayFacts();
  const st = buildClaims(f).claims.find((c) => c.section === "strength");
  assert.equal(st.shapeId, "st.delayed");
  const prev = f.events.find((e) => `kt_evidence:${e.id}` === st.factIds[1]);
  assert.equal(prev.outcome, 2, "fixture: the previous contact was partly right (C2), not a success");
  const en = renderShape("st.delayed", "en", st.slots), hl = renderShape("st.delayed", "hinglish", st.slots), hi = renderShape("st.delayed", "hi", st.slots);
  assert.ok(!/\bagain\b/i.test(en) && /after it last came up/.test(en), en);
  assert.ok(!/\bbhi\b/.test(hl), hl);
  assert.ok(!/भी/.test(hi), hi);
  for (const id of ["st.delayed_before", "st.pakka"]) for (const L of LANGS) {
    const t = renderShape(id, L, slotsFor(id));
    assert.ok(!/\bagain\b|\bbhi\b|भी/i.test(t), `${id}/${L}: ${t}`);
  }
});

test("growth-edge date: a re-check inside the closed window or already past at generation is never stated; a future one is", () => {
  const f = dayFacts();                                                    // window 2026-10-06 04:00 → 10-07 04:00 IST
  f.skills[SKILLS.B] = { display: "practising", nextReviewAt: "2026-10-06T09:30:00.000Z", refresh: false };   // 15:00 IST, same day
  assert.equal(buildClaims(f, { now: "2026-10-06T22:40:00.000Z" }).claims.find((c) => c.section === "tricky").shapeId, "tricky.mixup_next");
  f.skills[SKILLS.B].nextReviewAt = "2026-10-08T11:30:00.000Z";            // ahead of the window, but the letter is made later
  assert.equal(buildClaims(f, { now: "2026-10-12T22:40:00.000Z" }).claims.find((c) => c.section === "tricky").shapeId, "tricky.mixup_next");
  const ok = buildClaims(f, { now: "2026-10-06T22:40:00.000Z" }).claims.find((c) => c.section === "tricky");
  assert.equal(ok.shapeId, "tricky.mixup");
  assert.deepEqual(ok.slots.date, { y: 2026, m: 10, d: 8 });
  f.skills[SKILLS.B] = { display: "learned_today", nextReviewAt: "2026-10-06T09:30:00.000Z", refresh: false };
  assert.equal(buildClaims(f, { now: "2026-10-06T22:40:00.000Z" }).claims.find((c) => c.section === "tricky"), undefined, "learned + past date → no line, never a stale promise");
});

test("header: an open lesson counts to its last evidence row (cited); evidence without a lesson gets the no-lesson header", () => {
  const open = dayFacts({ lessons: [{ id: "S2", topicId: "c5-maths-ch01-t01", startedAt: "2026-10-06T11:30:00.000Z", endedAt: null }] });
  const h = buildClaims(open).claims[0];
  assert.equal(h.shapeId, "header.daily");
  assert.equal(h.slots.min, 10, "S2's last row is at +10 min");
  assert.ok(h.factIds.includes("lesson:S2") && h.factIds.some((x) => x.startsWith("kt_evidence:")));
  const noRows = dayFacts({ lessons: [{ id: "L9", topicId: "x", startedAt: "2026-10-06T12:30:00.000Z", endedAt: null }] });
  assert.equal(lessonEndMs(noRows.lessons[0], [], null), Date.parse("2026-10-06T12:30:00.000Z"));
  assert.equal(buildClaims(noRows, { preview: true, now: "2026-10-06T12:45:00.000Z" }).claims[0].slots.min, 15, "a preview counts a running lesson to now");
  const none = dayFacts({ lessons: [] });
  const { built, body } = assembled(none);
  assert.equal(built.claims[0].shapeId, "header.nolesson");
  assert.ok(gateReport(body, { firstName: "Riya" }));
  assert.ok(!body.renders.en.lines.some((l) => /0 lessons|0 min/.test(l.text)));
});

test("'how this line is counted': reviewed copy for every shape in every language, lexicon- and lock-clean; the drawer never sends the internal rule", () => {
  for (const id of Object.keys(SHAPES)) for (const L of LANGS) {
    const t = HOW[id]?.[L];
    assert.ok(t, `${id}/${L} has no HOW copy`);
    assert.deepEqual([...bannedHits(t), ...lockedHits(t)], [], `${id}/${L}: "${t}"`);
  }
  const { built } = assembled(dayFacts());
  for (const c of built.claims) {
    const out = evidenceClaimOut(c);
    assert.equal(out.rule, undefined);
    assert.ok(!JSON.stringify(out).includes(c.rule));
  }
});

test("every parent-visible string in the report screen (src/parent/Report.tsx label maps) passes the lexicon and the lock list", () => {
  // B3: the screen is English chrome only (V2 §3.12: the text is English, Listen is in the family's language); its label
  // maps are `key: "string"` rows in Report.tsx and the shared parent words in src/parent/copy.ts
  const strings = ["../src/parent/Report.tsx", "../src/parent/copy.ts"].flatMap((f) => {
    const src = readFileSync(new URL(f, import.meta.url), "utf8");
    return [...src.matchAll(/^\s*(?:[a-z_]+): "([^"]+)",?\s*(?:\/\/.*)?$|\b[a-z_]+: "([^"]+)"/gm)].map((m) => m[1] ?? m[2]);
  });
  assert.ok(strings.length > 30, String(strings.length));
  for (const t of strings) assert.deepEqual([...bannedHits(t), ...lockedHits(t)], [], t);
});

test("safety hold read side: reportHold reads the Conductor mode; no row or no table = no hold", async () => {
  assert.deepEqual(await reportHold("c", async () => ({ mode: "safety_hold", since: "2026-10-06T10:00:00.000Z" })), { since: "2026-10-06T10:00:00.000Z" });
  assert.equal(await reportHold("c", async () => ({ mode: "free", since: null })), null);
  assert.equal(await reportHold("c", async () => null), null);
  assert.equal(await reportHold("c", async () => { throw Object.assign(new Error("x"), { code: "42P01" }); }), null);
  await assert.rejects(reportHold("c", async () => { throw Object.assign(new Error("down"), { code: "ECONNRESET" }); }), "a DB error is not read as 'no hold'");
});

test("Lane B: a call that fails after it was sent is charged (usage if present, else the worst case) and the fallback sees less room", async () => {
  const { body } = assembled(dayFacts());
  const lines = body.renders.en.lines;
  const spends = [];
  const timeout = { chat: async () => { throw Object.assign(new Error("timeout"), { code: "timeout" }); } };
  const r = await orderForVoice({ lines, lang: "en", cadence: "daily" }, { llm: timeout, deployments: ["taxila-brain", "taxila-fast"], onSpend: async (c) => spends.push(c) });
  assert.equal(r.lane, "A");
  assert.equal(spends.length, 2);
  assert.ok(spends[0] > 16_000, "brain worst case includes 800 out tokens × 20 µ$");
  assert.equal(r.spentMicroUsd, spends[0] + spends[1]);
  const withUsage = { chat: async () => { throw Object.assign(new Error("schema"), { usage: { prompt_tokens: 1000, completion_tokens: 50 } }); } };
  const u = await orderForVoice({ lines, lang: "en", cadence: "daily" }, { llm: withUsage, deployments: ["taxila-brain"] });
  assert.equal(u.spentMicroUsd, 1000 * 4 + 50 * 20);
  // budget room: after a charged brain failure, the fast fallback is skipped when the job budget is spent
  let calls = 0;
  const once = { chat: async () => { calls++; throw new Error("boom"); } };
  const b = await orderForVoice({ lines, lang: "en", cadence: "daily" }, { llm: once, deployments: ["taxila-brain", "taxila-fast"], budgetMicroUsd: spends[0] + 1 });
  assert.equal(calls, 1);
  assert.equal(b.attempts[1].skipped, "budget");
});

test("job: a deterministic gate failure is FINAL (no retry, no model call) and audited with rule names only", async () => {
  const { runReportJob } = await import("../server/reports/jobs.js");
  const f = dayFacts({ name: "Riya!" });                     // "!" in the disclosure line: the gate throws on every attempt
  const audits = [];
  const db = { q: async (text, params) => {
    if (/from parent_report/.test(text)) return [];
    if (/from child c left join child_routine/.test(text)) return [{ id: f.child.id, first_name: "Riya!", class_level: 5, language_pref: "hinglish", guardian_id: "g", tz: "Asia/Kolkata" }];
    if (/from consent/.test(text)) return [{ purpose: "core_tutoring", granted: true }];
    if (/from lesson/.test(text)) return f.lessons.map((l) => ({ id: l.id, topic_id: l.topicId, started_at: l.startedAt, ended_at: l.endedAt }));
    if (/from kt_evidence/.test(text)) return f.events.map((e) => ({ id: e.id, seq: e.seq, session_id: e.sessionId, occurred_at: e.at, skill_ids: e.skillIds, cls: e.cls, outcome: e.outcome,
      grader: e.grader, item_key: e.itemKey, teach: e.teach, pre_attempt_help: e.preAttemptHelp, entry_rung: e.entryRung, misconception_id: e.misconceptionId, discriminates: e.discriminates, via: e.via, contaminated: e.contaminated, assisted: e.assisted }));
    if (/from kt_skill_state/.test(text)) return Object.entries(f.skills).map(([k, v]) => ({ skill_id: k, display: v.display, next_review_at: v.nextReviewAt, refresh: v.refresh }));
    if (/from kt_misconception/.test(text)) return [];
    if (/insert into audit/.test(text)) { audits.push(params[0]); return []; }
    throw new Error(`unexpected sql ${text.slice(0, 60)}`);
  } };
  let calls = 0;
  const llm = { chat: async () => { calls++; return { json: { order: [] }, usage: {} }; } };
  const lookup = { skillTitle: async (id) => f.titles[id] ?? null, belief: async (id) => f.beliefs[id] ?? null };
  await assert.rejects(runReportJob({ id: 7, kind: "report.daily", child_id: f.child.id, input: { day: "2026-10-06" }, attempts: 1, budget_micro_usd: 25_000, spent_micro_usd: 0 },
    { heartbeat: async () => ({ alive: true, cancelRequested: false }) }, "daily", { db, llm, lookup }), (e) => e.final === true && /report gate/.test(e.message));
  assert.equal(calls, 0, "Lane A is gated before the writer is paid");
  assert.equal(audits.length, 1);
  assert.ok(audits[0].rules.length && !JSON.stringify(audits[0]).includes("Riya"));
});
