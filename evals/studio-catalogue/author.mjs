// VALUES-100 V3.2 catalogue pipeline: author a validated game/simulation spec, a scene explainer and a whiteboard plan
// for every explanation beat, for every class 4-7 topic, from the topic's verified kit slice; then cross-check the
// content against the kit with a second model. Azure-only (owner directive): authoring on taxila-fast, the blind
// cross-check on DeepSeek-V4-Flash (a different model family), spend capped.
//
//   NODE_USE_ENV_PROXY=1 npx tsx evals/studio-catalogue/author.mjs [--only id,id] [--limit n] [--concurrency 6]
//        [--budget 30] [--stages game,explainer,wb,check] [--force]
//
// Writes data/studio-catalogue/topics/<topicId>.json (resumable: finished stages are kept unless --force) and appends
// every call's cost to data/studio-catalogue/spend.jsonl. Never prints a key or a payload.
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { loadEnv } from "../../infra/azure.mjs";
import { chat, normUsage, usdOf } from "../../server/azure.js";
import { ENGINE_SPECS } from "../../shared/studio-spec.ts";
import { ENGINE_SPECS_EXT, validateAny, SAFETY_EXCLUDED } from "../../shared/studio-spec-ext/index.ts";
import { sceneSeconds } from "../../shared/studio-spec-ext/scene.ts";
import { lintScript, normalizeScript, scriptTokens } from "../../shared/whiteboard.js";
import { FT_MODELS } from "../../shared/studio-spec-ext/fair.ts";
import { PROP_OF, PROP_VALUES, TOOLS } from "../../shared/studio-spec-ext/sort.ts";
import { RULES } from "../../shared/studio-spec-ext/sieve.ts";
import { PATTERNS } from "../../shared/studio-spec-ext/rule.ts";
import { EXCLUDED, LANG_GAME, PLAN } from "./plan.mjs";

loadEnv();
const ROOT = path.resolve(new URL("../..", import.meta.url).pathname);
const OUT = path.join(ROOT, "data/studio-catalogue/topics");
const SPEND = path.join(ROOT, "data/studio-catalogue/spend.jsonl");
fs.mkdirSync(OUT, { recursive: true });
const args = process.argv.slice(2), opt = (k, d) => (args.includes(k) ? args[args.indexOf(k) + 1] : d);
const ONLY = opt("--only", "") ? new Set(opt("--only").split(",")) : null;
const LIMIT = +opt("--limit", 9999), CONC = +opt("--concurrency", 6), BUDGET = +opt("--budget", 30), FORCE = args.includes("--force");
const STAGES = new Set(opt("--stages", "game,explainer,wb,check").split(","));
// taxila-fast-bg is taxila-fast's BACKGROUND twin (own quota, so a catalogue run never touches children's live lane);
// it is the same model, so it is priced as taxila-fast (server/azure.js PRICES has no row for the twin).
const AUTHOR = process.env.CATALOGUE_AUTHOR || "taxila-fast-bg", CHECKER = process.env.CATALOGUE_CHECKER || "DeepSeek-V4-Flash";

// ── spend guard ──
let spent = 0; try { for (const l of fs.readFileSync(SPEND, "utf8").split("\n")) if (l.trim()) spent += JSON.parse(l).usd; } catch { /* first run */ }
const startSpent = spent;
async function call(deployment, messages, o, tag) {
  if (spent > BUDGET) throw new Error(`budget: $${spent.toFixed(2)} > $${BUDGET}`);
  const t0 = Date.now();
  const res = await chat(deployment, messages, { json: true, timeoutMs: 240_000, retries: 1, quotaLane: "background", ...o });
  const u = normUsage(res.usage), usd = usdOf(deployment === "taxila-fast-bg" ? "taxila-fast" : deployment, u);
  spent += usd; fs.appendFileSync(SPEND, JSON.stringify({ at: new Date().toISOString(), tag, deployment, ms: Date.now() - t0, in: u?.in ?? 0, out: u?.out ?? 0, reasoning: u?.reasoning ?? 0, usd: +usd.toFixed(6) }) + "\n");
  return res.json;
}

// ── topics ──
const SUBJECTS = ["maths", "science", "evs", "sst", "english", "hindi"];
const topics = [];
for (const s of SUBJECTS) for (const c of [4, 5, 6, 7]) {
  const kp = path.join(ROOT, `data/kits/c${c}-${s}.json`), cp = path.join(ROOT, `data/curriculum/c${c}-${s}.json`);
  if (!fs.existsSync(kp)) continue;
  const kit = JSON.parse(fs.readFileSync(kp, "utf8")), cur = fs.existsSync(cp) ? JSON.parse(fs.readFileSync(cp, "utf8")) : { chapters: [] };
  const titles = new Map(); for (const ch of cur.chapters ?? []) for (const t of ch.topics ?? []) titles.set(t.id, { title: t.title, chapter: ch.title, outcomes: t.outcomes ?? [] });
  for (const t of kit.topics) topics.push({ ...t, subject: s, cls: c, meta: titles.get(t.topicId) ?? { title: t.topicId, chapter: "", outcomes: [] } });
}
const planFor = (t) => PLAN[t.topicId] ?? ((t.subject === "english" || t.subject === "hindi") ? (t.topicType === "T1" ? LANG_GAME.T1 : LANG_GAME.other) : null);

// ── prompt material ──
const RS4_ACT = {
  "catch-on-line@1": "Landfall: values fall toward a number line; steer the dock to where each lands", "circuit-bench@1": "Circuit Lab: build and test circuits", "slice-at@1": "Fraction Slice: cut bars into equal parts at the asked fraction",
  "line-runner@1": "Gate Runner: run through the gate at the asked value on a number line", "area-claim@1": "Plot: claim regions of a given area/perimeter on a grid", "vault-heist@1": "Vault Heist: dial number codes by place value",
  "angle-cannon@1": "Turret: set angles to hit targets", "food-web@1": "Balance the Forest: food web simulation; remove or add species", "phase-shift@1": "Phase Shift: heat and cool water through its states",
  "balance-beam@1": "Tilt: balance beam equations", "shadow-play@1": "Shadow Play: light, objects and shadows", "data-rush@1": "Traffic Census: count a live stream into a bar graph and read it",
};
/** Closed vocabularies the JSON Schema cannot express (values valid only inside one model). */
const EXTRA = {
  "fair-test@1": () => `Models (set top-level "model" to one id; every setup must give EVERY var of that model one of its value ids; "design.vary" and "conclude.options" are var ids): ${JSON.stringify(Object.values(FT_MODELS).map((m) => ({ id: m.id, outcome: m.outcome, matters: m.matters, vars: m.vars.map((v) => ({ id: v.id, values: v.values.map((x) => x.id) })) })))}. Predict setups must DIFFER from each other.`,
  "sort-storm@1": () => `Tools ${JSON.stringify(TOOLS)} test these props ${JSON.stringify(PROP_OF)} with values ${JSON.stringify(PROP_VALUES)}. With "byProp", the bins' ids MUST be that prop's values and every item needs props[byProp]; without byProp, items carry "bin" = a bin id and tools may be [] (sorting by meaning).`,
  "sieve-storm@1": () => `Rules ${JSON.stringify(RULES)}; multiple/factor/divisible/coprime need "a"; common/cfactor need "a" and "b". The stream is generated from lo/hi/count/hitRate/seed by code.`,
  "rule-machine@1": () => `Op tiles are strings like "+3", "-2", "×4", "÷2", "²". Growing patterns available: ${JSON.stringify(PATTERNS)}.`,
};
const toSchema = (s) => { try { return JSON.stringify(z.toJSONSchema(s, { unrepresentable: "any" })); } catch { return "{}"; } };
function defOf(arch) { const e = ENGINE_SPECS_EXT[arch]; if (e) return { schema: e.schema, def: e.defaultSpec, act: e.act, title: e.title }; const b = ENGINE_SPECS[arch]; return { schema: b.schema, def: b.defaultSpec, act: RS4_ACT[arch] ?? b.title, title: b.title }; }
const clip = (s, n) => (s && s.length > n ? s.slice(0, n) + "…" : s ?? "");
function kitSlice(t) {
  const items = (t.items ?? []).slice(0, 14).map((i) => ({ id: i.id, q: clip(t.subject === "hindi" ? i.prompt_hi ?? i.prompt_en : i.prompt_en ?? i.prompt_hi, 220), a: clip(String(i.answer ?? ""), 160) }));
  return {
    topicId: t.topicId, class: t.cls, subject: t.subject, chapter: t.meta.chapter, title: t.meta.title, outcomes: t.meta.outcomes,
    expectations: (t.expectations ?? []).map((e) => clip(e, 260)), misconceptions: (t.misconceptions ?? []).map((m) => ({ id: m.id, belief: clip(m.belief, 200) })),
    items, workedExample: t.workedExample ? { problem: clip(t.workedExample.problem, 300), steps: (t.workedExample.steps ?? []).slice(0, 6).map((s) => clip(s, 200)) } : null,
  };
}
const LANG_RULE = (t) => t.subject === "hindi" ? `This is a HINDI lesson: set "lang": "hi"; every child-visible text (titles, subs, lines, labels, options) in Devanagari Hindi taken from the lesson; ALSO provide "strings" with every UI label translated into short simple Hindi (keep the same keys).` : `Set "lang": "en"; omit "strings" (defaults are used).`;

function gameMessages(t, plan, feedback) {
  const d = defOf(plan.game), slice = kitSlice(t);
  const sys = [
    `You author ONE JSON spec for the Studio engine "${plan.game}" (${d.title}). The engine is a real-time interactive game/simulation for Indian children aged 9-15; it computes every answer key itself from the spec, so the spec only sets up the rounds.`,
    `What the child does: ${d.act}.`,
    `Rules:`,
    `- Output ONLY one JSON object valid against the JSON Schema below (respect every maxLength, min/max and enum). "archetype" must be "${plan.game}".`,
    `- "skills": ["${t.topicId}"] first (you may add up to 2 closely related topic ids from the same subject and class that appear in the schema pattern).`,
    `- Content must come from the KIT below: its expectations, items, misconceptions, worked example. Do not invent facts, dates, names or claims that the kit does not support. For maths you may choose new numbers (the engine computes keys), but keep them in the kit's range and class level.`,
    `- Target at least one kit misconception: set "targets" on the round that tests it, using an id from the kit's misconceptions list exactly.`,
    `- Where a round or element comes from a kit item, you may set "src" to that item id (only where the schema allows it).`,
    `- Never put the answer in a title, sub, prompt or label (no "find 12, the answer is 12").`,
    `- 2 to 4 rounds, easy to hard, using different modes where the engine has modes. ${plan.hint ? "Plan for this topic: " + plan.hint + "." : ""}`,
    `- ${LANG_RULE(t)}`,
    `- Short, warm, concrete wording for children; Indian contexts (names, money in ₹, places) where natural.`,
    `JSON Schema: ${toSchema(d.schema)}`,
    EXTRA[plan.game] ? EXTRA[plan.game]() : "",
    `A valid example spec (a different topic; copy its SHAPE, not its content): ${JSON.stringify(d.def)}`,
  ].join("\n");
  const user = `KIT: ${JSON.stringify(slice)}` + (feedback ? `\n\nYour previous spec was repaired or rejected by the validator. Fix exactly these problems and output the full corrected JSON: ${feedback}` : "");
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}
function explainerMessages(t, feedback) {
  const d = defOf("scene-explainer@1"), slice = kitSlice(t);
  const sys = [
    `You author ONE JSON spec for "scene-explainer@1": a cinematic 2D explainer (60-120 s) narrated by the teacher's voice line by line, with scenes of nodes, arrows, bars, glyphs and a myth-bust, ending in an interactive check the host grades.`,
    `Rules:`,
    `- Output ONLY one JSON object valid against the JSON Schema below (respect every maxLength, min/max and enum). "archetype": "scene-explainer@1".`,
    `- "skills": ["${t.topicId}"]. Build the explanation of the topic's central idea from the KIT only (expectations, worked example, misconceptions). No invented facts.`,
    `- Bust one kit misconception: a "myth" element showing the wrong belief (short), busted while the narration explains why; set "targets" to that misconception id.`,
    `- "text" holds the spoken lines (L1, L2 ...): 6-12 lines, each one or two short spoken sentences a teacher would say; plain and exact. Each beat shows/animates elements in time with its line.`,
    `- End with a "task" (tap / order / place per the schema) whose answer follows from the explainer; "src" a kit item id if one matches. The task prompt must not contain its answer.`,
    `- Every element id referenced by cues/arrows/task must exist; keep element text short (labels, not sentences).`,
    `- ${LANG_RULE(t)}`,
    `JSON Schema: ${toSchema(d.schema)}`,
    `A valid example (different topic; copy the SHAPE): ${JSON.stringify(d.def)}`,
  ].join("\n");
  const user = `KIT: ${JSON.stringify(slice)}` + (feedback ? `\n\nYour previous spec was repaired or rejected by the validator. Fix exactly these problems and output the full corrected JSON: ${feedback}` : "");
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}
const WB_EXAMPLE = { v: 1, scriptId: "c6-science-ch08-t02-wb-L3", line: { lessonId: "catalogue" }, anchor: "line_audio_start", board: { w: 800, h: 500, ground: "chalk" }, mode: "fresh", durationMs: 5200,
  ops: [{ id: "sun", op: "circle", c: [120, 90], r: 40, fill: "accent", startMs: 0, endMs: 600, ink: "accent" }, { id: "pud", op: "ellipse", c: [400, 420], rx: 160, ry: 30, startMs: 400, endMs: 1200, ink: "chalk" }, { id: "a1", op: "arrow", from: [400, 380], to: [400, 200], startMs: 1400, endMs: 2400, ink: "mark" }, { id: "l1", op: "label", at: [470, 290], text: "vapour", to: [405, 290], startMs: 2400, endMs: 3000 }, { id: "l2", op: "text", at: [400, 470], text: "puddle", size: "m", align: "middle", startMs: 1000, endMs: 1400 }] };
function wbMessages(t, explainer, feedback) {
  const lines = Object.entries(explainer.text ?? {}).map(([k, v]) => ({ line: k, text: v, ms: Math.round((String(v).split(/\s+/).length / 141) * 60000) + 600 }));
  const sys = [
    `You write WHITEBOARD SCRIPTS: what the teacher draws on a chalkboard while she says each line of an explainer. Our code draws the ops (hand-drawn strokes, shapes, labels, arrows, number work) in sync with her voice.`,
    `Output ONLY JSON: {"scripts":[{"line":"L1","script":{...}}, ...]} with one script for EVERY line given, in order.`,
    `Each script: v:1, scriptId "${t.topicId}-wb-<line>", line {"lessonId":"catalogue"}, anchor "line_audio_start", board {"w":800,"h":500,"ground":"chalk"}, mode "fresh" for the first line and whenever the drawing changes topic, else "continue"; durationMs = the line's ms given; ops start at 0 and end by durationMs.`,
    `Ops (fields exactly): stroke{points}, line{from,to,dashed?}, arrow{from,to,bend?,head?}, rect{at,w,h,fill?,round?}, circle{c,r,fill?}, ellipse{c,rx,ry,fill?}, polygon{points,fill?}, sector{c,r,fromDeg,toDeg,fill?}, text{at,text,size:"s"|"m"|"l",align?}, label{at,text,to?|target?}, numwork{at,layout:"column_add"|"column_sub"|"column_mul"|"long_div"|"fraction"|"equation"|"number_line",rows:[[cells]],range?}, highlight{target,style:"circle"|"underline"|"pulse"}, erase{target}. Every op has id, startMs, endMs, optional ink ("chalk"|"accent"|"ink"|"mark"|"good"|"soft") and weight 1-3.`,
    `numwork rows are arrays of SHORT STRING cells, e.g. {"id":"eq","op":"numwork","at":[200,220],"layout":"equation","rows":[["speed","=","distance","÷","time"]],"startMs":0,"endMs":1500}; each cell takes about 60 px of width and each row about 50 px of height from "at" (top-left), so keep the whole block inside the board.`,
    `Rules: coordinates inside the 800x500 board (leave a 20 px margin); 3-14 ops per script; text ops are LABELS, numbers and short terms only (max 24 characters, never a sentence); every number or label drawn must appear in the line or in the KIT facts; do not overlap text; highlight/erase/label target only ids from earlier ops in the same or a previous "continue" script.`,
    `Example script: ${JSON.stringify(WB_EXAMPLE)}`,
  ].join("\n");
  const user = `Lines: ${JSON.stringify(lines)}\nKIT facts: ${JSON.stringify({ expectations: kitSlice(t).expectations, workedExample: kitSlice(t).workedExample })}` + (feedback ? `\n\nFix these problems and output all scripts again: ${feedback}` : "");
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}
function checkMessages(t, game, explainer, keys) {
  const sys = [
    `You are a strict, independent fact-checker for children's lesson content (NCERT, India, classes 4-7). You did not write it.`,
    `Compare the CONTENT against the KIT (the verified source). Report only real problems: a claim that contradicts the kit or is factually wrong; a round that names a kit item ("src") or retells a kit scenario but changes its facts; numbers that are physically unrealistic for the story (a person walking at 60 m/s); a round whose own text contradicts its own numbers; anything unsuitable for a 9-15 year old (romance, gore, fear, unsafe advice); text in the wrong language; an answer given away in a prompt.`,
    `NOT problems: maths/science rounds that use NEW numbers different from the kit's items (that is allowed: the engine computes the key for the round's own numbers, and those keys are correct by construction); different wording; extra correct detail.`,
    `Output ONLY JSON: {"issues":[{"where":"game|explainer|key","what":"...","severity":"high|low"}],"verdict":"pass|fail"}. "fail" only for high-severity issues. Empty issues and "pass" when it is all right.`,
  ].join("\n");
  const visible = (o) => JSON.stringify(o, (k, v) => (["strings", "cues", "beats", "narration", "points"].includes(k) ? undefined : v));
  const user = `KIT: ${JSON.stringify(kitSlice(t))}\nCONTENT game (${game.archetype}): ${clip(visible(game.spec), 6000)}\nCONTENT explainer: ${clip(visible(explainer.spec), 5000)}\nCOMPUTED KEYS (each line: the question the round poses → the correct answer computed by code from the spec's own data): ${clip((Array.isArray(keys) ? keys : []).map((k) => `${k.itemId}: ${k.prompt ?? ""} → ${k.key}${k.src ? ` (from kit item ${k.src})` : ""}`).join("\n"), 2500)}`;
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}

// ── stages ──
function feedbackOf(v) { return v.fellBack ? `the spec was rejected and replaced by the default (${v.repairs.join("; ").slice(0, 600)})` : v.repairs.join("; ").slice(0, 800); }
function kitIdsOf(t) { return [t.topicId, ...(t.misconceptions ?? []).map((m) => m.id), ...(t.items ?? []).map((i) => i.id)]; }
function unknownIds(t, spec) { const ok = new Set(kitIdsOf(t)), out = []; JSON.stringify(spec ?? null, (k, v) => { if ((k === "targets" || k === "src") && typeof v === "string" && !ok.has(v)) out.push(v); return v; }); return [...new Set(out)]; }
async function authorSpec(t, arch, messagesFor, tag) {
  let feedback = "", best = null, attempts = 0;
  for (let k = 0; k < 3; k++) {
    attempts++;
    let raw; try { raw = await call(AUTHOR, messagesFor(feedback), { maxTokens: 16000, effort: k === 0 ? "medium" : "low" }, `${tag}:${t.topicId}`); } catch (e) { feedback = `your output was not usable JSON (${String(e.message).slice(0, 120)})`; continue; }
    const v0 = validateAny(arch, raw);
    // Cited ids are checked by predicate, not trusted to the prompt's "use the id exactly" (review v3 2026-10-05: 3 unknown
    // ids shipped in 2 of 20 topic files, one of them passed by the model cross-check). An unknown id makes the spec unusable.
    const bad = unknownIds(t, v0.spec);
    const v = bad.length ? { ...v0, fellBack: true, repairs: [...v0.repairs, ...bad.map((id) => `unknown kit id "${id}" (use one of: ${kitIdsOf(t).join(", ")})`)] } : v0;
    if (!v.fellBack && (!best || v.repairs.length < best.repairs.length)) best = { spec: v.spec, repairs: v.repairs };
    if (!v.fellBack && v.repairs.length === 0) break;
    feedback = feedbackOf(v);
  }
  return best ? { archetype: arch, ...best, attempts, model: AUTHOR } : { archetype: arch, spec: null, repairs: ["failed after 3 attempts"], attempts, model: AUTHOR };
}
/** Drawn tokens must be grounded: every word/number on the board appears in the spoken line or the kit (the live gate's rule). */
function grounding(script, lineText, kitText) { const hay = (lineText + " " + kitText).toLowerCase(); return [...new Set(scriptTokens(script))].filter((tok) => tok.length > 1 && !hay.includes(tok)); }
function lintWb(script, lineText = "", kitText = "") { const n = normalizeScript(script); if (!n.ok || !n.script) return { ok: false, errors: n.errors.slice(0, 6), script: null }; const issues = lintScript(n.script).slice(0, 6).map((i) => `${i.id}:${i.check}`), loose = grounding(n.script, lineText, kitText); if (loose.length) issues.push(`ungrounded tokens: ${loose.slice(0, 6).join(" ")}`); return { ok: issues.length === 0, errors: issues, fixes: n.fixes.length, script: n.script }; }
async function authorWb(t, explainer) {
  let feedback = "", out = null; const kitText = JSON.stringify(kitSlice(t));
  for (let k = 0; k < 3; k++) {
    let raw; try { raw = await call(AUTHOR, wbMessages(t, explainer, feedback), { maxTokens: 20000, effort: "low" }, `wb:${t.topicId}`); } catch (e) { feedback = `not usable JSON (${String(e.message).slice(0, 100)})`; continue; }
    if (process.env.DEBUG_RAW) fs.writeFileSync(process.env.DEBUG_RAW, JSON.stringify(raw, null, 1));
    // tolerate the shapes models actually return: {scripts:[{line, script}]}, {scripts:[script]}, [..], {L1: script}
    const list = Array.isArray(raw) ? raw : Array.isArray(raw?.scripts) ? raw.scripts : raw && typeof raw === "object" ? Object.entries(raw).map(([k, v]) => ({ line: k, script: v })) : [];
    const lineOf = (x, i) => (typeof x?.line === "string" ? x.line : undefined) ?? (typeof x?.scriptId === "string" ? x.scriptId.split("-wb-")[1] : undefined) ?? (typeof x?.script?.scriptId === "string" ? x.script.scriptId.split("-wb-")[1] : undefined) ?? Object.keys(explainer.text ?? {})[i];
    const res = Object.keys(explainer.text ?? {}).map((line) => { const i = list.findIndex((x, j) => lineOf(x, j) === line); const s = list[i]; if (!s) return { line, ok: false, errors: ["missing"], script: null }; const l = lintWb(s.script && typeof s.script === "object" ? s.script : s, String(explainer.text?.[line] ?? ""), kitText); return { line, ...l }; });
    if (!out || res.filter((r) => r.ok).length > out.filter((r) => r.ok).length) out = res;
    const bad = res.filter((r) => !r.ok); if (!bad.length) break;
    feedback = bad.map((b) => `${b.line}: ${b.errors.join(", ")}`).join(" | ").slice(0, 1200);
  }
  return { beats: out ?? [], model: AUTHOR };
}
function keysOf(arch, spec) { const e = ENGINE_SPECS_EXT[arch]; try { return e?.keys ? e.keys(spec) : []; } catch (err) { return [{ error: String(err.message) }]; } }

async function doTopic(t) {
  const file = path.join(OUT, `${t.topicId}.json`);
  let rec = fs.existsSync(file) && !FORCE ? JSON.parse(fs.readFileSync(file, "utf8")) : { topicId: t.topicId };
  Object.assign(rec, { title: t.meta.title, chapter: t.meta.chapter, subject: t.subject, class: t.cls, topicType: t.topicType });
  if (EXCLUDED.test(t.topicId) || SAFETY_EXCLUDED.test(t.topicId)) { rec.excluded = "child-safety floor: Adolescence chapter gets no generated game or animation (teacher-led only)"; fs.writeFileSync(file, JSON.stringify(rec, null, 1)); return rec; }
  const plan = planFor(t); rec.plan = plan;
  const save = () => fs.writeFileSync(file, JSON.stringify(rec, null, 1));
  if (STAGES.has("game") && !rec.game?.spec) { rec.game = await authorSpec(t, plan.game, (fb) => gameMessages(t, plan, fb), "game"); save(); }
  if (STAGES.has("explainer") && !rec.explainer?.spec) { rec.explainer = await authorSpec(t, "scene-explainer@1", (fb) => explainerMessages(t, fb), "explainer"); if (rec.explainer.spec) rec.explainer.seconds = Math.round(sceneSeconds(rec.explainer.spec)); save(); }
  if (STAGES.has("wb") && rec.explainer?.spec && !(rec.whiteboard?.beats?.length && rec.whiteboard.beats.every((b) => b.ok))) { rec.whiteboard = await authorWb(t, rec.explainer.spec); save(); }
  if (rec.game?.spec) rec.keys = keysOf(plan.game, rec.game.spec);
  const runCheck = async () => { try { return { ...(await call(CHECKER, checkMessages(t, rec.game, rec.explainer, rec.keys), { maxTokens: 2500 }, `check:${t.topicId}`)), model: CHECKER }; } catch (e) { return { error: String(e.message).slice(0, 160), model: CHECKER }; } };
  if (STAGES.has("check") && rec.game?.spec && rec.explainer?.spec && !rec.check) {
    rec.check = await runCheck(); save();
    // one regeneration pass for HIGH-severity findings, then a fresh blind check (both results are kept)
    const high = (rec.check.issues ?? []).filter((i) => i?.severity === "high");
    if (rec.check.verdict === "fail" && high.length) {
      const fb = (w) => high.filter((i) => i.where === w || (w === "game" && i.where === "key")).map((i) => String(i.what).slice(0, 240)).join(" | ");
      rec.firstCheck = rec.check;
      if (fb("game")) { const g2 = await authorSpec(t, plan.game, (f) => gameMessages(t, plan, `An independent fact-checker found: ${fb("game")}. ${f}`), "game-fix"); if (g2.spec) rec.game = g2; }
      if (fb("explainer")) { const e2 = await authorSpec(t, "scene-explainer@1", (f) => explainerMessages(t, `An independent fact-checker found: ${fb("explainer")}. ${f}`), "explainer-fix"); if (e2.spec) { rec.explainer = { ...e2, seconds: Math.round(sceneSeconds(e2.spec)) }; if (STAGES.has("wb")) rec.whiteboard = await authorWb(t, rec.explainer.spec); } }
      rec.keys = keysOf(plan.game, rec.game.spec); rec.check = await runCheck(); save();
    }
  }
  save(); return rec;
}

const todo = topics.filter((t) => !ONLY || ONLY.has(t.topicId)).slice(0, LIMIT);
console.log(`topics ${todo.length} · author ${AUTHOR} · checker ${CHECKER} · budget $${BUDGET} · spent so far $${spent.toFixed(2)}`);
let next = 0, done = 0; const keepAlive = setInterval(() => {}, 30_000);
async function worker() { while (next < todo.length) { const t = todo[next++]; try { const r = await doTopic(t); done++; console.log(`${done}/${todo.length} ${t.topicId} game:${r.game?.spec ? "ok" + (r.game.repairs.length ? `(${r.game.repairs.length}r)` : "") : r.excluded ? "excluded" : "FAIL"} expl:${r.explainer?.spec ? "ok" : r.excluded ? "-" : "FAIL"} wb:${r.whiteboard ? r.whiteboard.beats.filter((b) => b.ok).length + "/" + r.whiteboard.beats.length : "-"} check:${r.check?.verdict ?? (r.check?.error ? "err" : "-")} $${spent.toFixed(2)}`); } catch (e) { console.log(`ERR ${t.topicId}: ${String(e.message).slice(0, 200)}`); if (String(e.message).startsWith("budget")) break; } } }
await Promise.all(Array.from({ length: CONC }, worker));
clearInterval(keepAlive);
console.log(`done ${done} · this run $${(spent - startSpent).toFixed(3)} · total $${spent.toFixed(3)}`);
