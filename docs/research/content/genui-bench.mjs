// genui-bench: measures the T1 / T2a / T2b generation paths on Taxila's Azure deployments (genui-reliability.md §6).
// Run from the repo root: node docs/research/content/genui-bench.mjs [--only t1,cold,t2a,t2b] [--reps 1]
// Writes docs/research/content/genui-bench-<date>.json. Prints no secrets and stores no child data (briefs are synthetic).
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { validate, expandTemplate, TEMPLATES, jsonSchemas, toStrict, SPRITES, COLORS } from "./genui-scene-dsl.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
for (const line of fs.readFileSync(path.join(HERE, "../../../.env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const args = process.argv.slice(2); const only = (args[args.indexOf("--only") + 1] ?? "t1,cold,t2a,t2b").split(","); const REPS = +(args.includes("--reps") ? args[args.indexOf("--reps") + 1] : 1);
const OUT = path.join(HERE, `genui-bench-2026-10-02.json`);
const results = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : { method: {}, runs: [] };
const save = () => fs.writeFileSync(OUT, JSON.stringify(results, null, 1));

async function chat(model, messages, { schema, json = false, effort = "none", max = 3000, name = "out" } = {}) {
  const body = { model, messages, max_completion_tokens: max, reasoning_effort: effort };
  if (schema) body.response_format = { type: "json_schema", json_schema: { name, strict: true, schema } };
  else if (json) body.response_format = { type: "json_object" };
  const t0 = performance.now(); const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 180000);
  try {
    const r = await fetch(BASE + "/chat/completions", { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
    const j = await r.json(); const ms = Math.round(performance.now() - t0);
    if (!r.ok) return { ok: false, ms, status: r.status, err: String(j.error?.message ?? "").slice(0, 300) };
    const c = j.choices[0]; const u = j.usage ?? {};
    return { ok: true, ms, status: 200, text: c.message.content ?? "", finish: c.finish_reason,
      usage: { in: u.prompt_tokens, out: u.completion_tokens, reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0, cached: u.prompt_tokens_details?.cached_tokens ?? 0 },
      engine: u.latency_checkpoint ?? null };
  } catch (e) { return { ok: false, ms: Math.round(performance.now() - t0), status: 0, err: String(e.message).slice(0, 200) }; }
  finally { clearTimeout(timer); }
}
const record = (r) => { results.runs.push({ at: new Date().toISOString(), ...r }); save(); console.log(JSON.stringify({ exp: r.exp, arm: r.arm, case: r.case, ms: r.ms, ok: r.pass, out: r.usage?.out, codes: r.codes?.slice(0, 4) })); };

// ───────────── T1: fill a fractions@1 spec (maths-engines §3.5) ─────────────
const MISC = ["MC.FRAC.ADD_ACROSS", "MC.FRAC.ADD_NUM_MULT_DEN", "MC.FRAC.BIGGER_DENOM", "MC.FRAC.WHOLE_NUMBER_BIAS"];
const Frac = z.strictObject({ n: z.number().int().min(0).max(100), d: z.number().int().min(1).max(100) });
const T1Spec = z.strictObject({
  stage: z.enum(["concrete", "pictorial", "abstract"]), linked: z.boolean(),
  params: z.strictObject({ model: z.enum(["bar", "circle", "numberline"]), mode: z.enum(["add", "compare", "partition"]), operands: z.array(Frac).min(2).max(2), showSymbol: z.enum(["always", "after_commit", "never"]) }),
  probe: z.strictObject({ kind: z.enum(["predict", "diagnose"]), ask: z.strictObject({ en: z.string().max(80), hi: z.string().max(80), hi_latn: z.string().max(80) }),
    expect: z.strictObject({ correct: Frac, distractors: z.array(z.strictObject({ value: Frac, misc: z.enum(MISC) })).min(1).max(3) }) }),
});
const T1_SCHEMA = toStrict(z.toJSONSchema(T1Spec, { target: "draft-2020-12" }));
const T1_SYS = [
  "role: fill the params of engine fractions@1 for the live lesson move below. Output JSON only.",
  "engine fractions@1: bar | circle | numberline models; modes add, compare, partition; operands are fractions {n,d}; stages concrete → pictorial → abstract (concreteness fading).",
  "probe: predict = child commits an answer before the engine animates; distractors must each map to one misconception id from the enum.",
  "rules: operands come from the kit item, never invented; numbers exact; ask ≤ 12 words, in the child's register; hi in Devanagari, hi_latn = Hinglish in Roman script.",
  "stage choice: unseen skill + age 6-9 → concrete; 10-15 → pictorial; mastered → abstract.",
].join("\n");
const T1_ITEMS = [[1, 2, 1, 3], [1, 4, 1, 2], [2, 5, 1, 5], [1, 3, 1, 6], [3, 8, 1, 4], [2, 3, 1, 4], [1, 2, 2, 5], [3, 4, 1, 8], [1, 6, 1, 3], [2, 7, 3, 7]];
const gcd = (a, b) => (b ? gcd(b, a % b) : a);
function t1Check(spec, [a, b, c, d]) {
  const errs = []; const ops = spec.params.operands;
  if (ops[0].n * b !== a * ops[0].d || ops[1].n * d !== c * ops[1].d) errs.push("operands_changed");
  const n = a * d + c * b, dd = b * d; const k = spec.probe.expect.correct;
  if (k.n * dd !== n * k.d) errs.push("correct_wrong");                                    // engine maths would override this (R7)
  if (spec.probe.expect.distractors.some((x) => x.value.n * k.d === k.n * x.value.d)) errs.push("distractor_equals_correct");
  const across = { n: a + c, d: b + d }; const hasAcross = spec.probe.expect.distractors.some((x) => x.value.n * across.d === across.n * x.value.d && x.misc === "MC.FRAC.ADD_ACROSS");
  if (!hasAcross) errs.push("no_add_across_trap");
  if (!/[ऀ-ॿ]/.test(spec.probe.ask.hi)) errs.push("hi_not_devanagari");
  return errs;
}
async function runT1() {
  const arms = [["taxila-fast", "none"], ["taxila-fast", "low"], ["taxila-brain", "none"], ["taxila-brain", "low"]];
  for (let rep = 0; rep < REPS; rep++) for (const [model, effort] of arms) for (const [i, it] of T1_ITEMS.entries()) {
    const user = JSON.stringify({ move: { kind: "probe", probe: "P5 predict" }, kit_item: { prompt_en: `What is ${it[0]}/${it[1]} + ${it[2]}/${it[3]}?`, skillId: "MATH6.FRAC.ADD" },
      child: { firstName: "Aarav", classLevel: 6, ageBand: "10-15", languagePref: "hinglish", interests: ["cricket"], activeMisconceptions: ["MC.FRAC.ADD_ACROSS"] }, mastery: "practising" });
    const r = await chat(model, [{ role: "system", content: T1_SYS }, { role: "user", content: user }], { schema: T1_SCHEMA, effort, max: 1500, name: "fractions_spec" });
    let codes = [], pass = false;
    if (r.ok) { try { const p = T1Spec.safeParse(JSON.parse(r.text)); if (!p.success) codes = ["schema"]; else { codes = t1Check(p.data, it); pass = codes.length === 0; } } catch { codes = ["bad_json"]; } } else codes = [`http_${r.status}`];
    record({ exp: "t1", arm: `${model}/${effort}`, case: `${it.join("_")}`, rep, ms: r.ms, usage: r.usage, engine: r.engine, pass, codes });
  }
}
// Cold vs warm schema: each pair uses a never-seen schema (salted enum) then repeats it.
async function runCold() {
  for (let i = 0; i < 5; i++) {
    const salt = `s${Date.now().toString(36)}${i}`; const sch = structuredClone(T1_SCHEMA); sch.properties.stage = { type: "string", enum: ["concrete", "pictorial", "abstract", salt] };
    for (const phase of ["cold", "warm"]) {
      const r = await chat("taxila-fast", [{ role: "system", content: T1_SYS }, { role: "user", content: JSON.stringify({ kit_item: { prompt_en: "What is 1/2 + 1/3?" }, child: { classLevel: 6, ageBand: "10-15" } }) }], { schema: sch, effort: "none", max: 1500, name: `cold_${salt}` });
      record({ exp: "cold", arm: phase, case: salt, ms: r.ms, usage: r.usage, engine: r.engine, pass: r.ok, codes: r.ok ? [] : [r.err] });
    }
  }
}

// ───────────── T2: briefs (synthetic) ─────────────
const BRIEFS = [
  { id: "b1_sort_habitat", band: "B2", cls: 3, subj: "EVS", lang: "hi-Latn+en", want: "Sort 6 animals by where they mainly live: land or water. Many children put the frog on land only; tag that." },
  { id: "b2_share_rotis", band: "B1", cls: 2, subj: "Maths", lang: "hi-Latn+en", want: "Share 6 rotis equally on 2 plates (equal sharing, early division). Children often make unequal shares; tag that." },
  { id: "b3_sun_shadow", band: "B4", cls: 6, subj: "Science", lang: "en", want: "A 2 m pole: a slider for the Sun's height above the horizon (10-80 degrees) and the shadow length it makes (shadow = 2 / tan(height)). Goal: make the shadow longer than the pole." },
  { id: "b4_germination", band: "B3", cls: 5, subj: "EVS", lang: "hi-Latn+en", want: "Put the steps of sprouting moong in order: soak overnight, drain, wrap in a wet cloth, wait two days, sprouts appear. Start shuffled." },
  { id: "b5_more_apples", band: "B2", cls: 1, subj: "Maths", lang: "hi-Latn+en", want: "Which group has more: 5 apples spread wide or 8 apples packed close? Children judge by how wide the group looks; tag that." },
  { id: "b6_wet_cloth", band: "B3", cls: 4, subj: "EVS", lang: "hi-Latn+en", want: "Predict, then watch: a wet cloth left in the sun. Does the water go away, stay in the cloth, or turn to ice? Reveal after the child commits." },
  { id: "b7_flower_parts", band: "B3", cls: 7, subj: "Science", lang: "en", want: "Label the parts of a flower: petal, sepal, stamen, pistil. The child drags each label to its part." },
  { id: "b8_square_area", band: "B4", cls: 8, subj: "Maths", lang: "en", want: "A slider for the side of a square (1-10 cm) with live area and perimeter readouts. Goal: find the side where area equals perimeter." },
];
const meta = (b) => ({ band: b.band, lang: b.lang, title: { en: "x", hi: "x" }, objective_ids: [], topic_ids: [] });
const CATALOG = [
  "scene@1 reference. Stage width 1000 units; height by aspect 4:3=750, 1:1=1000, 3:4=1333. (x,y) is the CENTRE of a node, in stage units. Children of a group with a layout (row|column|grid|circle|scatter) are placed by the layout; their x,y are ignored. line/poly pts are relative to the node's x,y (default 0,0 at root).",
  "Hit sizes: every draggable or tappable node's short side ≥ 214 units in B1/B2, ≥ 160 in B3/B4. Controls size themselves; reserve space for them: choice tile per option 373 (B1) 320 (B2) 213 (B3/B4) square, 2x2 grid when layout=grid; button and slider thickness 214 (B1/B2) 160 (B3/B4); order item strip 760 wide x 214 (B1/B2) or 160 (B3/B4) tall per item; text height ≈ 90 units (label) 100 (caption) 125 (title).",
  "Words on stage ≤ 8 (B1) 20 (B2) 40 (B3) 60 (B4) — the teacher speaks, the stage shows. Choice options ≤ 2 (B1) 3 (B2) 4 (B3/B4). Keypad only B3/B4.",
  `Colours (tokens only): ${Object.keys(COLORS).join(" ")}. Text uses ink or ink2; tints c1..c6 carry ink text; darks c1d..c6d for strokes.`,
  `Sprites (lib ids only): ${SPRITES.join(" ")}.`,
  "Node kinds: rect{w,h,r?} circle{r} ellipse{rx,ry} wedge{r,a0,a1,r0?} line{pts:[[x,y],[x,y]],head?} poly{pts,closed} text{text:{en,hi,hi_latn?}|{fmt:{en,hi,hi_latn?}} with {var} placeholders, size:label|caption|title|numeral, w?(wrap width), align?} math{tex,size} sprite{lib,w,h} image{asset,w,h} group{layout?} repeat{count,item:{kind:circle|rect|sprite,w?,h?,r?,lib?,tags?,drag?},layout} axis{from,to,step,len,orient} connector{from,to,head} zone{w,h,shape,accepts:[tags],cap?,label?,visible,arrange} slider{var,len,orient,value} stepper{var} toggle{var,label} choice{var(enum var),options:[{id,label?|sprite?|tex?,misc?}],layout,commit} button{label,act:check|reset|play|next,timeline?} order{items:[{id,label?|sprite?}],orient,start?} keypad{var,digits}.",
  "Common node fields: id (lower_snake ≤24 chars), parent (a group id), x, y, rot, scale, op, fill, stroke, sw, show, z, role (content|control|label|feedback|context; context never animates), tags (matched by zone.accepts; a node's own id also counts as a tag), tl (teacher label, English ≤32), say ({en,hi}, spoken on tap), drag{axis:xy|x|y,snap:zone|grid|none,back,in?}, tap{act:select|toggle|set|say,var?,value?}.",
  "Numbers may be {\"$\":\"expr\"}. expr: + - * / % ^ == != < <= > >= && || ! ?: ; min max abs round(x,d) floor ceil sqrt sind cosd tand atand clamp lerp; state: count(zone[,tag]) has(zone,node) at(node) order(list) — order() returns ids joined by commas, compare with a 'quoted' string. Names = var ids and derive ids.",
  "vars:[{id,type:num|int|bool|enum,init,min,max,step,options?,tl,unit?}] (num/int need min and max) · derive:[{id,expr,tl,unit?,dp?}] · timelines:[{id,on:mount|host|button|commit|goal,ref?,steps:[{t,ms,do:tween|show|hide|pulse|set|cue|trace|count,target?,prop?,to?,var?,value?,cue?,ease?}]}] total ≤ 30 s · goals:[{id,when,tl}] · probe:{id,kind:predict|diagnose|classify|sequence|estimate|construct,ask,commit:{via:choice|check|order|voice,node?},correct,traps:[{when,misc:\"MC.SUBJ.NAME\"}],reveal?} · feedback:on_commit|on_drop|none.",
  "Rules: one idea per scene. Every scene has a goal or a probe. A goal's `when` is false at mount and reachable. A choice probe has exactly one correct option; tag every distractor with misc. A trap is never true together with the correct answer. Nothing decorative moves. No draggable starts on a zone unless drag.in names it. Prefer groups with row/column/grid layout to hand arithmetic. Keep everything inside the stage.",
].join("\n");
const EXAMPLE = (() => { const ex = expandTemplate("compare-choice@1", { title: { en: "Which jar has more?", hi: "किस बर्तन में ज़्यादा?" }, question: { en: "Which has more?", hi: "किसमें ज़्यादा?" },
  left: { label: { en: "Left", hi: "बायाँ" }, sprite: "obj.coin1", count: 4 }, right: { label: { en: "Right", hi: "दायाँ" }, sprite: "obj.coin1", count: 6 }, ask: "more", misc_wrong: "MC.NUM.COMPARE_BY_SPREAD" },
  { band: "B3", lang: "en", title: { en: "x", hi: "x" }, objective_ids: [], topic_ids: [] }); return JSON.stringify(ex.scene); })();
const briefMsg = (b) => JSON.stringify({ class: b.cls, subject: b.subj, band: b.band, lang: b.lang, teacher_wants: b.want });

// T2a: choose a template and fill its slots
const TPL_IDS = Object.keys(TEMPLATES);
const T2A_SCHEMA = toStrict({ type: "object", properties: { template: { type: "string", enum: [...TPL_IDS, "none"] },
  slots: { anyOf: [...TPL_IDS.map((t) => z.toJSONSchema(TEMPLATES[t].slots, { target: "draft-2020-12", io: "input" })), { type: "null" }] } }, required: ["template", "slots"] });
const T2A_SYS = ["role: pick one scene template for the teacher's request and fill its slots. JSON only. If no template fits, template = none and slots = null.",
  "templates: " + TPL_IDS.map((t) => `${t} → slots ${JSON.stringify(z.toJSONSchema(TEMPLATES[t].slots, { io: "input" }).properties ? Object.keys(z.toJSONSchema(TEMPLATES[t].slots, { io: "input" }).properties) : [])}`).join("; "),
  "slot rules: ids lower_snake; L10n = {en, hi (Devanagari), hi_latn (Hinglish, Roman)}; sprites from the library only; misc ids look like MC.SUBJ.NAME; slider expressions use only the input id and functions min max abs round floor ceil sqrt sind cosd tand clamp.",
  `sprite library: ${SPRITES.join(" ")}`,
  "fit to band: B1/B2 at most 8 sort items, 12 draggables, 4 sequence steps; B3/B4 at most 8 sort items, 15 draggables, 6 steps."].join("\n");
async function runT2a() {
  for (let rep = 0; rep < REPS; rep++) for (const [model, effort] of [["taxila-fast", "none"], ["taxila-fast", "low"]]) for (const b of BRIEFS) {
    const r = await chat(model, [{ role: "system", content: T2A_SYS }, { role: "user", content: briefMsg(b) }], { schema: T2A_SCHEMA, effort, max: 3000, name: "template_fill" });
    let codes = [], pass = false, template = null;
    if (r.ok) { try { const j = JSON.parse(r.text); template = j.template;
      if (j.template === "none") codes = ["no_template"]; else { const ex = expandTemplate(j.template, j.slots, meta(b)); if (!ex.ok) codes = ex.errors.map((e) => e.code); else { const v = validate(ex.scene); pass = v.ok; codes = v.errors.map((e) => e.code); } } } catch (e) { codes = ["bad_json"]; } }
    else codes = [`http_${r.status}`];
    record({ exp: "t2a", arm: `${model}/${effort}`, case: b.id, rep, ms: r.ms, usage: r.usage, engine: r.engine, pass, codes, template, raw: r.ok ? r.text.slice(0, 6000) : r.err });
  }
}
// T2b: free composition in the DSL, strict schema vs json_object, plus one repair round
const { strict: SCENE_STRICT } = jsonSchemas();
const T2B_SYS = ["role: compose ONE interactive scene in the scene@1 JSON DSL for the teacher's request. JSON only.", CATALOG, "example of a valid scene (different topic):", EXAMPLE].join("\n");
async function runT2b() {
  const arms = [["taxila-fast", "low", "strict"], ["taxila-fast", "low", "json"], ["taxila-brain", "low", "strict"]];
  for (let rep = 0; rep < REPS; rep++) for (const [model, effort, mode] of arms) for (const b of BRIEFS) {
    const msgs = [{ role: "system", content: T2B_SYS }, { role: "user", content: briefMsg(b) }];
    const opt = { schema: mode === "strict" ? SCENE_STRICT : undefined, json: mode === "json", effort, max: 16000, name: "scene" };
    const r1 = await chat(model, msgs, opt); const a1 = assess(r1);
    let r2 = null, a2 = null;
    if (r1.ok && !a1.pass && a1.repairable) {
      const errs = a1.errors.slice(0, 10).map((e) => `${e.path}: ${e.msg}`).join("\n");
      r2 = await chat(model, [...msgs, { role: "assistant", content: r1.text }, { role: "user", content: `The scene failed validation. Fix every error and return the full corrected scene.\n${errs}` }], opt); a2 = assess(r2);
    }
    record({ exp: "t2b", arm: `${model}/${effort}/${mode}`, case: b.id, rep, ms: r1.ms, usage: r1.usage, engine: r1.engine, pass: a1.pass, codes: a1.codes, fixes: a1.fixes,
      repair: r2 ? { ms: r2.ms, usage: r2.usage, pass: a2.pass, codes: a2.codes } : null, raw: r1.ok ? r1.text.slice(0, 12000) : r1.err, raw2: r2?.ok ? r2.text.slice(0, 12000) : undefined });
  }
}
function assess(r) {
  if (!r?.ok) return { pass: false, codes: [`http_${r?.status}`], repairable: false, errors: [] };
  if (r.finish === "length") return { pass: false, codes: ["truncated"], repairable: false, errors: [] };
  let j; try { j = JSON.parse(r.text); } catch { return { pass: false, codes: ["bad_json"], repairable: false, errors: [] }; }
  const v = validate(j); return { pass: v.ok, codes: [...new Set(v.errors.map((e) => e.code))], errors: v.errors, fixes: v.fixes, repairable: true };
}

results.method = { date: "2026-10-02", from: "cloud build container (US) → eastus2", deployments: { "taxila-fast": "gpt-5.6-luna", "taxila-brain": "gpt-5.6-sol" },
  api: "/openai/v1/chat/completions", validator: "genui-scene-dsl.mjs (zod schema + lint S1–S7 + solver)", t2b_max_tokens: 16000, briefs: BRIEFS.length, t1_items: T1_ITEMS.length, reps: REPS };
if (only.includes("t1")) await runT1();
if (only.includes("cold")) await runCold();
if (only.includes("t2a")) await runT2a();
if (only.includes("t2b")) await runT2b();
save(); console.log("done", results.runs.length, "runs →", OUT);
