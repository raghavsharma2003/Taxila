// Recorded text corpora the safety evals measure against. Read-only; every loader skips a file mid-write.
import { readdirSync, readFileSync, existsSync } from "node:fs";

const ROOT = new URL("../../", import.meta.url);
const read = (rel) => { try { return JSON.parse(readFileSync(new URL(rel, ROOT), "utf8")); } catch { return null; } };

/**
 * The relational probe (docs/research/voice/relational-probe-2026-10-02*.json): 108 teacher replies to
 * attachment, secret, goodbye and identity scenarios, coded BLIND (arm hidden, order shuffled) against a rubric
 * fixed before any output was read. Returns [{ id, scenario, child, teacher, v: rubric violation codes }].
 */
export function relationalCoded(date = "2026-10-02") {
  const base = `docs/research/voice/relational-probe-${date}`;
  const blind = read(`${base}-blind.json`), codes = read(`${base}-codes.json`);
  if (!blind || !codes) return [];
  return blind.map((b) => ({ ...b, v: codes[b.id]?.v ?? [] }));
}

/** Rubric code → the never-rules family that covers it (relational-probe-score.mjs rubric). `defensive` has none. */
export const RUBRIC_FAMILY = {
  human: "ai_denial", love_miss: "romance", friend: "exclusivity", excl: "exclusivity", secret: "exclusivity",
  hook: "guilt", absence: "guilt", guilt: "guilt", ability: "ability", feel: "feelings",
};

/** Every string a kit hands the teacher to say or check against: prompts (en/hi), answers, hints, worked examples, diagnostics. */
export function kitStrings() {
  const dir = new URL("data/kits/", ROOT);
  const out = [];
  for (const f of readdirSync(dir).filter((n) => /^c\d+-[a-z]+\.json$/.test(n)).sort()) {
    const d = read(`data/kits/${f}`);
    for (const t of d?.topics ?? []) {
      const push = (s, where) => { if (typeof s === "string" && s.trim()) out.push({ text: s, where: `${t.topicId}:${where}` }); };
      for (const it of t.items ?? []) {
        push(it.prompt_en, `${it.id}.prompt_en`); push(it.prompt_hi, `${it.id}.prompt_hi`); push(it.answer, `${it.id}.answer`);
        (it.acceptable ?? []).forEach((a, i) => push(a, `${it.id}.acceptable${i}`));
        (it.hints ?? []).forEach((h, i) => push(h, `${it.id}.hint${i}`));
      }
      for (const m of t.misconceptions ?? []) {
        push(m.diagnostic?.prompt_en, `${m.id}.diag_en`); push(m.diagnostic?.prompt_hi, `${m.id}.diag_hi`);
        (m.diagnostic?.options ?? []).forEach((o, i) => push(o.text, `${m.id}.opt${i}`));
      }
      const we = t.workedExample;
      if (we) { push(we.problem, "we.problem"); (we.steps ?? []).forEach((s, i) => push(s, `we.step${i}`)); (we.fadedVersion ?? []).forEach((s, i) => push(s, `we.faded${i}`)); }
      (t.expectations ?? []).forEach((s, i) => push(s, `expect${i}`));
    }
  }
  return out;
}

/** Other recorded teacher turns (uncoded): probe outputs and eval results whose fields hold teacher speech. */
export function teacherTurns() {
  const out = [];
  const files = [
    "docs/research/voice/attune-probe-2026-10-02.json", "docs/research/voice/probe-2026-10-02-results.json",
    ...["cascade-latency-2026-10-03-integration-after.json", "cascade-latency-2026-10-03-integration-before.json",
      "hook-units-2026-10-03-cricket.json", "hook-units-2026-10-03-no-interest.json", "model-bakeoff-2026-10-02-B.json"].map((f) => `evals/results/${f}`),
  ];
  const KEYS = /^(teacher|teacherReply|reply|opening|teacherOpening|text|out|output|transcript)$/;
  for (const f of files) {
    if (!existsSync(new URL(f, ROOT))) continue;
    const j = read(f);
    (function walk(o, k) {
      if (Array.isArray(o)) return o.forEach((x) => walk(x, k));
      if (o && typeof o === "object") return Object.entries(o).forEach(([kk, v]) => walk(v, kk));
      if (typeof o === "string" && KEYS.test(k ?? "") && o.length >= 12 && /\s/.test(o) && !/^https?:/.test(o)) out.push({ text: o, where: `${f}#${k}` });
    })(j);
  }
  return out;
}

/**
 * Every question a kit hands the teacher to POSE, with what the reply guard passes as `content` for it (the
 * call-site recipe in context/inbox/harvest-ports.json): the prompt in each language, the answer, acceptable
 * answers, hints and diagnostic options. Returns [{ where, prompts: string[], content: string[] }].
 */
export function kitPosed() {
  const dir = new URL("data/kits/", ROOT);
  const out = [];
  const s = (x) => (typeof x === "string" && x.trim() ? [x] : []);
  for (const f of readdirSync(dir).filter((n) => /^c\d+-[a-z]+\.json$/.test(n)).sort()) {
    const d = read(`data/kits/${f}`);
    for (const t of d?.topics ?? []) {
      for (const it of t.items ?? []) {
        const prompts = [...s(it.prompt_en), ...s(it.prompt_hi)];
        out.push({ where: `${it.id}`, prompts, content: [...prompts, ...s(it.answer), ...(it.acceptable ?? []).flatMap(s), ...(it.hints ?? []).flatMap(s), ...(it.options ?? []).flatMap((o) => s(o?.text))] });
      }
      for (const m of t.misconceptions ?? []) {
        const g = m.diagnostic;
        if (!g) continue;
        const prompts = [...s(g.prompt_en), ...s(g.prompt_hi)];
        out.push({ where: `${m.id}.diag`, prompts, content: [...prompts, ...(g.options ?? []).flatMap((o) => s(o?.text))] });
      }
    }
  }
  return out;
}
