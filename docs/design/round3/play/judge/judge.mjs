#!/usr/bin/env node
// Play · two blind cross-family model judges (docs/design/round3/play/RUBRIC.md). Advisory only (rj-holistic-model-judge-gate):
// atomic checks first, pass/fail computed in code, 1-5 scores reported as given, both judges side by side.
//
//   NODE_USE_ENV_PROXY=1 node --env-file=.env.local docs/design/round3/play/judge/judge.mjs [--part a|b|ab] [--only mode,…]
//
// Part A: per game, three screens (360 × 800, 412 × 915, 1366 × 768) in three art directions, from shots/all/*.jpg.
// Part B: blind pairs, "before" (the studio-v2 engine as production showed it on a 360 phone; shots/before-*.png) vs the play
// family on the same idea at 360 × 800 (shots/all/<mode>-p360-<art>.jpg), each pair asked twice with the order swapped.
// Two "before" variants: "tray" (the engine at the 181 × 113 tray box production gave it) and "full" (the same engine given
// the play world's own 360 × 576 box, shots/before-*-p360-full.png): the second separates the box from the engine.
// The judges are never told what made a screen. Results: judge/results-<date>.json (raw answers + code verdicts).
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, "..", "shots");
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const PART = arg("part", "ab"), ONLY = arg("only", "")?.split(",").filter(Boolean), TAG = arg("tag", "");
// --mistakes: Part A also shows a fourth screen, the 412 × 915 phone right after a typical mistake (shots/mistake/), so that
// D2 (feedback that teaches) and B4 (a visible consequence) are judged on a state that can show them
const MISTAKES = process.argv.includes("--mistakes");
const E = (process.env.AZURE_OPENAI_ENDPOINT ?? "").replace(/\/+$/, ""), K = process.env.AZURE_OPENAI_API_KEY;
if (!E || !K) { console.error("AZURE_OPENAI_ENDPOINT / AZURE_OPENAI_API_KEY missing (run with --env-file=.env.local)"); process.exit(2); }
const JUDGES = ["taxila-brain", "grok-4-20-reasoning"];
const ARTS = ["kagaz", "chalk", "blueprint", "raat"];
const MODES = ["atoms", "atoms-hcf", "strips-compare", "strips-add", "bundles", "balance", "equality", "line-place", "line-compare", "line-round",
  "lab-predict", "lab-golu", "lab-magnet", "lab-ice", "lab-leaf", "lab-mould"].filter((m) => !ONLY.length || ONLY.includes(m));
/** before (studio-v2 engine as shipped) ↔ the play mode on the same idea */
const PAIRS = [["slice-at", "strips-compare"], ["vault-heist", "bundles"], ["balance-beam", "balance"], ["catch-on-line", "line-place"], ["shadow-play", "lab-predict"]];
const VARIANTS = { tray: "", full: "-full" };

const RUBRIC = readFileSync(join(HERE, "..", "RUBRIC.md"), "utf8");
const section = (from, to) => { const a = RUBRIC.indexOf(from), b = to ? RUBRIC.indexOf(to, a + 1) : RUBRIC.length; return RUBRIC.slice(a, b).trim(); };
const A_TEXT = section("### A1. Atomic checks", "## Part B");
const B_TEXT = section("## Part B", null);

const img = (file) => ({ type: "image_url", image_url: { url: `data:image/${file.endsWith(".png") ? "png" : "jpeg"};base64,${readFileSync(file).toString("base64")}`, detail: "high" } });
const PROMPT_A = `You are a strict, experienced reviewer of children's learning games (ages 9-13), judging still screenshots. You will see THREE screenshots of ONE game: screen 1 is a 360 x 800 phone, screen 2 a 412 x 915 phone, screen 3 a 1366 x 768 laptop, each in a different art direction, mid-play.${MISTAKES ? " A FOURTH screenshot (screen 4) shows the same 412 x 915 phone right after the child made a typical mistake (a wrong move a child with a common misconception makes); use it for anything about feedback on wrong actions." : ""} You do not know who made it. You cannot play it; judge only what you can see, and say "cannot tell" in a reason when a still cannot show it.

Apply this rubric exactly:

${A_TEXT}

Score strictly, decimals allowed, never round up. Reply with JSON only, this shape:
{"checks":{"B1":{"yes":true,"why":"..."},"B2":{...},"B3":{...},"B4":{...},"B5":{...},"B6":{...},"B7":{...},"B8":{...}},
 "scores":{"D1":{"score":0,"vs":{"Duolingo":"better|about equal|worse","Prodigy":"...","Brilliant":"...","DragonBox":"..."},"why":"..."},"D2":{...},"D3":{...},"D4":{...},"D5":{...},"D6":{...}},
 "top_defects":["the most damaging visible defects, most damaging first, with screen number"],"what_it_teaches":"one line: the idea a child would practise"}`;
const PROMPT_B = `You are a strict, experienced reviewer of children's learning games (ages 9-13). You will see two screenshots, Screen 1 and Screen 2, both on the same 360 x 800 phone, both about a closely related maths or science idea. You do not know who made either. Judge only what you can see.

${B_TEXT}

Reply with JSON only: {"legible":{"pick":1,"conf":1},"idea":{"pick":1,"conf":1},"craft":{"pick":1,"conf":1},"overall":{"pick":1,"conf":1},"why":"two lines"}`;

async function call(model, content) {
  const body = { model, max_completion_tokens: 8000, messages: [{ role: "user", content }] };
  if (model === "taxila-brain") { body.reasoning_effort = "medium"; body.response_format = { type: "json_object" }; }
  for (let a = 0; a < 3; a++) {
    try {
      const t0 = Date.now();
      const r = await fetch(`${E}/chat/completions`, { method: "POST", headers: { "api-key": K, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(240_000) });
      const j = await r.json().catch(() => ({}));
      if (r.status === 429) { await new Promise((s) => setTimeout(s, 8000 * (a + 1))); continue; }
      if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j).slice(0, 200)}`);
      const txt = (j.choices?.[0]?.message?.content ?? "").replace(/^```(json)?|```$/gm, "").trim();
      const s = txt.indexOf("{"), e = txt.lastIndexOf("}");
      return { v: JSON.parse(txt.slice(s, e + 1)), ms: Date.now() - t0, usage: j.usage ?? null };
    } catch (e) { if (a === 2) return { v: null, err: String(e.message ?? e).slice(0, 200) }; await new Promise((s) => setTimeout(s, 3000)); }
  }
  return { v: null, err: "429 after retries" };
}
async function pool(tasks, n = 4) { const out = []; let i = 0; await Promise.all(Array.from({ length: n }, async () => { while (i < tasks.length) { const k = i++; out[k] = await tasks[k](); } })); return out; }

const OUTF = join(HERE, `results-${new Date().toISOString().slice(0, 10)}${TAG ? "-" + TAG : ""}.json`);
const prev = existsSync(OUTF) ? JSON.parse(readFileSync(OUTF, "utf8")) : {};
const res = { at: new Date().toISOString(), judges: JUDGES, method: "still screenshots from the play dev harness (local production build of the working tree, headless Chromium); reference products described in words only (RUBRIC.md); advisory", mistakes: MISTAKES, tag: TAG || null, a: prev.a ?? [], b: prev.b ?? [] };

if (PART.includes("a")) {
  const tasks = [];
  MODES.forEach((m, mi) => {
    const files = [["p360", ARTS[mi % 4]], ["p412", ARTS[(mi + 1) % 4]], ["l1366", ARTS[(mi + 2) % 4]]].map(([vp, art]) => join(SHOTS, "all", `${m}-${vp}-${art}.jpg`));
    // the mistake screen's art follows the harness's own mode order, so it is found by name, not recomputed
    if (MISTAKES) { const f = existsSync(join(SHOTS, "mistake")) ? readdirSync(join(SHOTS, "mistake")).find((x) => x.startsWith(`mistake-${m}-p412-`) && x.endsWith(".jpg")) : null; files.push(join(SHOTS, "mistake", f ?? `mistake-${m}-missing.jpg`)); }
    if (!files.every(existsSync)) { console.log("skip (missing shots)", m); return; }
    for (const judge of JUDGES) tasks.push(async () => {
      const r = await call(judge, [{ type: "text", text: PROMPT_A }, { type: "text", text: "Screen 1 (phone 360 x 800):" }, img(files[0]), { type: "text", text: "Screen 2 (phone 412 x 915):" }, img(files[1]), { type: "text", text: "Screen 3 (laptop 1366 x 768):" }, img(files[2]),
        ...(MISTAKES ? [{ type: "text", text: "Screen 4 (phone 412 x 915, right after a typical mistake):" }, img(files[3])] : [])]);
      console.log(`A ${m} ${judge}: ${r.v ? "ok" : r.err}`);
      return { mode: m, judge, files: files.map((f) => f.replace(SHOTS + "/", "")), ...r };
    });
  });
  const got = await pool(tasks, 4);
  res.a = [...res.a.filter((x) => !got.some((g) => g.mode === x.mode && g.judge === x.judge)), ...got];
  writeFileSync(OUTF, JSON.stringify(res, null, 1));
}
if (PART.includes("b")) {
  const tasks = [];
  for (const [variant, suf] of Object.entries(VARIANTS)) PAIRS.forEach(([eng, mode], pi) => {
    const before = join(SHOTS, `before-${eng}-p360${suf}.png`), after = join(SHOTS, "all", `${mode}-p360-${ARTS[pi % 4]}.jpg`);
    if (!existsSync(before) || !existsSync(after)) { console.log("skip pair (missing)", variant, eng, mode); return; }
    for (const judge of JUDGES) for (const order of ["before-first", "after-first"]) tasks.push(async () => {
      const [s1, s2] = order === "before-first" ? [before, after] : [after, before];
      const r = await call(judge, [{ type: "text", text: PROMPT_B }, { type: "text", text: "Screen 1:" }, img(s1), { type: "text", text: "Screen 2:" }, img(s2)]);
      console.log(`B ${variant} ${eng}/${mode} ${judge} ${order}: ${r.v ? "ok" : r.err}`);
      return { variant, pair: `${eng}|${mode}`, judge, order, files: [s1, s2].map((f) => f.replace(SHOTS + "/", "")), ...r };
    });
  });
  const got = await pool(tasks, 4);
  res.b = [...res.b.filter((x) => !got.some((g) => g.variant === x.variant && g.pair === x.pair && g.judge === x.judge && g.order === x.order)), ...got];
}

// ── code verdicts
const yes = (v, id) => !!v?.checks?.[id]?.yes;
const summary = { a: {}, b: {} };
for (const judge of JUDGES) {
  const rows = res.a.filter((r) => r.judge === judge && r.v);
  const dims = ["D1", "D2", "D3", "D4", "D5", "D6"];
  summary.a[judge] = {
    n: rows.length,
    checks: Object.fromEntries(["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"].map((id) => [id, `${rows.filter((r) => yes(r.v, id)).length}/${rows.length}`])),
    meanScore: Object.fromEntries(dims.map((d) => { const s = rows.map((r) => Number(r.v.scores?.[d]?.score)).filter(Number.isFinite); return [d, s.length ? +(s.reduce((a, b) => a + b, 0) / s.length).toFixed(2) : null]; })),
    vs: Object.fromEntries(["Duolingo", "Prodigy", "Brilliant", "DragonBox"].map((p) => [p, Object.fromEntries(["better", "about equal", "worse"].map((k) => [k, rows.reduce((n, r) => n + dims.filter((d) => String(r.v.scores?.[d]?.vs?.[p] ?? "").toLowerCase().startsWith(k.split(" ")[0])).length, 0)]))])),
  };
}
// the code verdict per game: B1, B2, B3, B6, B8 yes on BOTH judges
const byMode = {};
for (const r of res.a) if (r.v) (byMode[r.mode] ??= {})[r.judge] = r.v;
summary.a.games = Object.fromEntries(Object.entries(byMode).map(([m, js]) => [m, { pass: JUDGES.every((j) => js[j] && ["B1", "B2", "B3", "B6", "B8"].every((id) => yes(js[j], id))), failed: Object.fromEntries(JUDGES.map((j) => [j, js[j] ? ["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"].filter((id) => !yes(js[j], id)) : ["no answer"]])) }]));
summary.a.passBoth = `${Object.values(summary.a.games).filter((g) => g.pass).length}/${Object.keys(summary.a.games).length}`;
summary.a.checkAgreement = Object.fromEntries(["B1", "B2", "B3", "B4", "B5", "B6", "B7", "B8"].map((id) => { const both = Object.values(byMode).filter((js) => JUDGES.every((j) => js[j])); return [id, `${both.filter((js) => yes(js[JUDGES[0]], id) === yes(js[JUDGES[1]], id)).length}/${both.length}`]; }));
// part B: a judge's vote counts only when it picks the same SCREEN in both orders
for (const variant of Object.keys(VARIANTS)) for (const judge of JUDGES) {
  const out = {};
  for (const crit of ["legible", "idea", "craft", "overall"]) {
    let after = 0, before = 0, flip = 0;
    for (const [eng, mode] of PAIRS) {
      const hit = (o) => res.b.find((r) => (r.variant ?? "tray") === variant && r.judge === judge && r.pair === `${eng}|${mode}` && r.order === o)?.v?.[crit]?.pick;
      const a1 = Number(hit("before-first")), a2 = Number(hit("after-first"));
      if (!(a1 === 1 || a1 === 2) || !(a2 === 1 || a2 === 2)) continue;
      const w1 = a1 === 2 ? "after" : "before", w2 = a2 === 1 ? "after" : "before";
      if (w1 !== w2) flip++; else if (w1 === "after") after++; else before++;
    }
    out[crit] = { after, before, positionDriven: flip };
  }
  (summary.b[variant] ??= {})[judge] = out;
}
res.summary = summary;
writeFileSync(OUTF, JSON.stringify(res, null, 1));
console.log(JSON.stringify(summary, null, 1));
console.log("wrote", OUTF);
