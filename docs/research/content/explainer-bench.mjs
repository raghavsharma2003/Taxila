// explainer-bench: can the LIVE path produce a valid narrated explainer animation in seconds? (animation-video.md §6)
// Arms: template (model picks one of 8 templates + fills slots + one note per beat; code computes geometry) vs free
// (model writes the whole explainer@1 cast + beats). Strict structured outputs on Azure /chat/completions.
// Run from repo root: node docs/research/content/explainer-bench.mjs   → explainer-bench-2026-10-02.json (no secrets, synthetic briefs)
import fs from "node:fs";
import path from "node:path";
import { jsonSchemas, validateCall, validateFree, compile, TEMPLATE_NAMES } from "./explainer-dsl.mjs";
import { SPRITES } from "./genui-scene-dsl.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
for (const line of fs.readFileSync(path.join(HERE, "../../../.env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const BASE = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/+$/, ""); const KEY = process.env.AZURE_OPENAI_API_KEY;
const OUT = path.join(HERE, "explainer-bench-2026-10-02.json");
const BRIEFS = [
  { topic_id: "c1-maths-ch05-t01", band: "B1", title: "Putting together (addition within 9)", ask: "first exposure; child is 6; Hindi-medium; mangoes are her favourite" },
  { topic_id: "c4-evs-ch10-t01", band: "B2", title: "The Sun and shadows during the day", ask: "child thinks the shadow is longest at noon" },
  { topic_id: "c6-science-ch10-t02", band: "B3", title: "Conditions for germination", ask: "show what happens to a seed after it gets water; root vs shoot direction" },
  { topic_id: "c7-science-ch07-t04", band: "B3", title: "The water cycle and groundwater", ask: "child confuses evaporation and condensation" },
  { topic_id: "c6-maths-ch07-t01", band: "B3", title: "Fractional units and equal shares", ask: "sharing one roti equally among 4 siblings" },
  { topic_id: "c6-maths-ch10-t03", band: "B3", title: "Adding and subtracting integers", ask: "3 + (−5) on a number line; child answers 8" },
  { topic_id: "c7-science-ch09-t01", band: "B3", title: "Digestion in humans", ask: "the journey of a bite of roti through the digestive tract" },
  { topic_id: "c8-science-ch11-t01", band: "B4", title: "Phases of the Moon", ask: "child thinks the Earth's shadow causes the phases" },
];
const COMMON = [
  "Output JSON only, matching the schema. Hindi in Devanagari in `hi`; Hinglish in Roman script in `hi_latn`.",
  "Each beat = one idea, one visual change, ≤ 14 words of note for B1, ≤ 18 B2, ≤ 24 B3, ≤ 28 B4.",
  "Notes are SHAPES for the live teacher (what to point at, what to ask), never a quotable line; no quotation marks.",
  "Motion only where the motion is the concept; nothing decorative moves; at most 2 things move at once.",
  "Numbers, counts, angles and positions must be physically and arithmetically right for the topic.",
];
const SYS_T = ["role: choose ONE explainer template for the lesson brief and fill its slots.",
  "templates: combine-count@1 (objects join or are taken away, then the number sentence) · cycle@1 (3-6 stages in a loop) · process-steps@1 (2-6 ordered steps; each step appears/grows/moves down/moves up/shrinks) · split-share@1 (a whole cut into equal parts; some taken; the fraction) · number-line-hop@1 (start, hops ±n, result) · sun-shadow@1 (sun at morning/noon/evening; shadow geometry is computed) · moon-phase@1 (sequence of phases; lighting computed) · path-trace@1 (a mover travels through 2-6 labelled stations).",
  "notes: one per beat, in beat order. The template decides the beats: combine-count add = 5 beats, take_away = 4; cycle = stages+1; process-steps = steps; split-share = 4; number-line-hop = hops+2; sun-shadow = times; moon-phase = phases; path-trace = stations.",
  "probe (optional): a predict question asked BEFORE the reveal beat (before_beat ≥ 2).", ...COMMON].join("\n");
const SYS_F = ["role: write a complete explainer@1 animation for the lesson brief.",
  "stage: 16:9, a 6x6 anchor grid: columns A-F left→right, rows 1-6 top→bottom; `at` is a cell (C4) or a region (B2:C3). Never put two content actors on the same cell at the same time.",
  "cast kinds: sprite (lib from the sprite list), shape (circle|rect|ring|line), text (L10n), math (tex), repeat (n copies of a sprite, layout row|grid|cluster), arrow (from,to actor ids), path (pts = anchor list), axis ({from,to,step}). role: content | label | context (context never moves). hidden:true = revealed later by enter/draw/write.",
  "acts: enter, exit, draw (stroke reveal), write (text wipe), move (to anchor), follow (along path), grow, shrink, split (repeat: n leave; shape: n equal parts), merge (into another repeat; counts add), count (repeat only; n must equal the copies on stage), morph, pulse, focus, set. `with:true` runs in parallel with the previous act. ms 150-6000.",
  "beats: 2-8, each { id b1.., note, cue turn|auto|tap, acts 1-5 }. checks: predicates the renderer verifies at a beat end: count(id)==n, parts(id)==n, visible(id), moved(id,down|up|left|right), grew(id), above(a,b), below(a,b), x(id)==px.",
  `sprites: ${SPRITES.join(" ")}`, ...COMMON].join("\n");
const schemas = jsonSchemas();

async function chat(model, sys, user, schema, effort) {
  const body = { model, messages: [{ role: "system", content: sys }, { role: "user", content: user }], max_completion_tokens: 12000, reasoning_effort: effort,
    response_format: { type: "json_schema", json_schema: { name: "out", strict: true, schema } } };
  const t0 = performance.now();
  try { const r = await fetch(BASE + "/chat/completions", { method: "POST", headers: { "api-key": KEY, "content-type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(180000) });
    const j = await r.json(); const ms = Math.round(performance.now() - t0);
    if (!r.ok) return { ok: false, ms, err: String(j.error?.message ?? r.status).slice(0, 300) };
    const u = j.usage ?? {}; return { ok: true, ms, text: j.choices[0].message.content, finish: j.choices[0].finish_reason, usage: { in: u.prompt_tokens, out: u.completion_tokens, reasoning: u.completion_tokens_details?.reasoning_tokens ?? 0 } };
  } catch (e) { return { ok: false, ms: Math.round(performance.now() - t0), err: String(e.message).slice(0, 200) }; }
}
const ARMS = [["template", "taxila-fast", "none"], ["template", "taxila-fast", "low"], ["template", "taxila-brain", "none"], ["free", "taxila-fast", "low"], ["free", "taxila-brain", "low"]];
const res = { method: { date: "2026-10-02", from: "cloud build container (US) -> eastus2", api: "/openai/v1/chat/completions, strict json_schema", validator: "explainer-dsl.mjs (zod + lint E1-E12 + simulator checks)", briefs: BRIEFS.length, reps: 1, arms: ARMS.map((a) => a.join("/")), template_schema_chars: JSON.stringify(schemas.templateCall).length, free_schema_chars: JSON.stringify(schemas.explainerLLM).length }, runs: [] };
const save = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
for (const [arm, model, effort] of ARMS) {
  await Promise.all(BRIEFS.map(async (b) => {
    const user = `brief: topic ${b.topic_id} · "${b.title}" · band ${b.band} · ${b.ask}`; const meta = { topic_id: b.topic_id, band: b.band };
    const r = await chat(model, arm === "template" ? SYS_T : SYS_F, user, arm === "template" ? schemas.templateCall : schemas.explainerLLM, effort);
    const run = { arm: `${arm}/${model}/${effort}`, topic: b.topic_id, ms: r.ms, ok_http: r.ok, usage: r.usage, finish: r.finish, err: r.err };
    if (r.ok) { let raw; try { raw = JSON.parse(r.text); } catch { run.parse = false; }
      if (raw) { let v; try { v = arm === "template" ? validateCall(raw.call ?? raw, meta) : validateFree(raw.meta ? { ...raw, meta: { ...raw.meta, topic_id: b.topic_id, band: b.band } } : raw);
        } catch (e) { v = { ok: false, stage: "crash", errs: [{ code: "X.validator_crash", msg: String(e.message).slice(0, 160) }] }; }
        if (raw.call) raw = raw.call;
        run.pass = v.ok; run.stage = v.stage; run.codes = v.errs.map((e) => e.code); run.errs = v.errs.slice(0, 5); run.template = raw.template; run.output = raw;
        if (v.ex) { const t0 = performance.now(); let plan; try { plan = compile(v.ex); } catch (e) { run.pass = false; run.codes.push("X.compile_crash"); plan = null; }
          if (plan) { run.compile_ms = +(performance.now() - t0).toFixed(2); } if (plan) run.plan = { els: plan.els.length, tweens: plan.tweens.length, duration_s: +plan.duration.toFixed(1), explainer_bytes: JSON.stringify(v.ex).length, plan_bytes: JSON.stringify(plan).length }; } } }
    res.runs.push(run); save(); console.log(JSON.stringify({ arm: run.arm, topic: b.topic_id, ms: r.ms, pass: run.pass, tpl: run.template, codes: run.codes?.slice(0, 4), out: r.usage?.out, err: r.err }));
  }));
}
console.log("wrote", OUT);
