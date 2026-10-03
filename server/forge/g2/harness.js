// The Forge G2 builder harness (FACTORY.md §3): S3 BUILD + S4 LOGIC REPAIR rounds on taxila-codex through the
// Responses API, then S6 FINAL on the full (visible + held-out) levels. A thin, own harness (decision forge-harness-own):
// the model sees exactly six tools, no shell, no network; the workspace is one allowlisted file; every check is our
// code (lint.js, qa.js); held-out items never reach the builder (QA R10); a fresh conversation per repair round with
// a handoff (C14); budgets per §3.6 with a footer on every observation; binding rules LAST in the prompt.
import { readFileSync } from "fs";
import { respond, usd } from "./model.js";
import { buildBundle } from "./bundle.js";
import { lintMechanic } from "./lint.js";
import { staticGate, browserGate, summarise } from "./qa.js";

const KIT_MD = readFileSync(new URL("./kit/KIT.md", import.meta.url), "utf8");
const GOLDEN = {
  choice: readFileSync(new URL("./goldens/stepping-stones.js", import.meta.url), "utf8"),
  build: readFileSync(new URL("./goldens/tower-build.js", import.meta.url), "utf8"),
};
const GOLDEN_DESIGNS = JSON.parse(readFileSync(new URL("./goldens/designs.json", import.meta.url), "utf8"));

export const DEFAULT_BUDGET = { steps: 30, wallMs: 25 * 60_000, usd: 3.5, formatErrors: 3, stepsPerRound: { S3: 12, S4: 6, S5: 6 }, rounds: { S4: 3 } };
export const HARNESS_VERSION = "g2-harness@1";

const TOOLS = [
  { type: "function", name: "read_file", description: "Read one workspace file.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["path"], properties: { path: { type: "string", enum: ["KIT.md", "design.json", "golden.js", "src/mechanic.js"] } } } },
  { type: "function", name: "write_mechanic", description: "Write the whole of src/mechanic.js (replaces it). Returns the lint result.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["content"], properties: { content: { type: "string" } } } },
  { type: "function", name: "edit_mechanic", description: "Replace one exact, unique snippet of src/mechanic.js. Returns the lint result.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["old", "new"], properties: { old: { type: "string" }, new: { type: "string" } } } },
  { type: "function", name: "run_check", description: "lint: static rules. play: build the bundle and play it headless to the goal (visible items).", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["name"], properties: { name: { type: "string", enum: ["lint", "play"] } } } },
  { type: "function", name: "note", description: "Record a plan or hypothesis (kept in the handoff).", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["text"], properties: { text: { type: "string" } } } },
  { type: "function", name: "submit", description: "Finish this stage: runs the play check; accepted only when green.", strict: true,
    parameters: { type: "object", additionalProperties: false, required: ["summary"], properties: { summary: { type: "string" } } } },
];

function systemPrompt(design) {
  const golden = GOLDEN[design.archetype];
  return [
    `Role: implement ONE mechanic for the tgk-lite@1 kit: archetype ${design.archetype}, file src/mechanic.js.`,
    "Environment: six tools (read_file, write_mechanic, edit_mechanic, run_check, note, submit). No shell, no network, no other files. Every tool result ends with a budget footer.",
    "", "=== KIT.md ===", KIT_MD,
    "", `=== golden.js (a working ${design.archetype} mechanic; same API, different idea) ===`, golden,
    "", "Workflow: read design.json → write_mechanic → run_check lint → run_check play → fix the first failure → submit. Never repeat a failed action unchanged.",
    "Binding rules: edit only src/mechanic.js; reduce is pure and the only state change; no Math.random, Date, timers, this, class, async, regex; words only by strings-table key; values only through ctx.refs and draw.numeral; quantity pictures only through draw.model(ref), never hand-drawn parts or dots; no words or pictures under target rects; every word inside the world and clear of other words; do not copy the golden's idea, build the design's idea; under 20% budget make the smallest change that turns the current failure green.",
  ].join("\n");
}

function designDoc(design, levels) {
  const items = levels.flatMap((l) => l.items);
  return JSON.stringify({
    ...design,
    itemShape: design.archetype === "build"
      ? { units: items[0]?.units?.map((u) => u.label), note: "units: tens then ones; numbers 1-99" }
      : { optionsPerItem: [...new Set(items.map((i) => 1 + i.distractors.length))], longestLabelChars: Math.max(...items.flatMap((i) => [i.key.label, ...i.distractors.map((d) => d.label)]).map((s) => s.length)) },
    levels: levels.length, itemsPerLevel: levels.map((l) => l.items.length),
  }, null, 1);
}

class Ledger {
  constructor(budget) { this.budget = budget; this.t0 = Date.now(); this.steps = 0; this.usd = 0; this.inTok = 0; this.cachedTok = 0; this.outTok = 0; this.calls = 0; this.formatErrors = 0; }
  add(model, usage) { this.calls++; this.usd += usd(model, usage); this.inTok += usage?.input_tokens || 0; this.cachedTok += usage?.input_tokens_details?.cached_tokens || 0; this.outTok += usage?.output_tokens || 0; }
  check() {
    if (this.steps >= this.budget.steps) return "steps";
    if (this.usd >= this.budget.usd) return "usd";
    if (Date.now() - this.t0 >= this.budget.wallMs) return "wall";
    return null;
  }
  footer(stage, round) {
    const mm = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
    return `\n---\nbudget: ${this.steps}/${this.budget.steps} steps · $${this.usd.toFixed(2)}/$${this.budget.usd.toFixed(2)} · ${mm(Date.now() - this.t0)}/${mm(this.budget.wallMs)} · ${stage} round ${round}`;
  }
  low() { return this.steps >= 0.8 * this.budget.steps || this.usd >= 0.8 * this.budget.usd; }
  toJSON() { return { steps: this.steps, calls: this.calls, usd: +this.usd.toFixed(4), inTok: this.inTok, cachedTok: this.cachedTok, outTok: this.outTok, wallMs: Date.now() - this.t0 }; }
}

function lintSummary(src, design) {
  const r = lintMechanic(src, { stringKeys: design.strings.map((s) => s.key) });
  return r.ok ? "LINT PASS" : `LINT FAIL\n` + r.errors.slice(0, 10).map((e) => `- ${e.code} ${e.detail} (line ${e.line})`).join("\n");
}

/** Closest line to a failed edit anchor (Aider-style "did you mean"). */
function closest(src, old) {
  const first = String(old).split("\n").find((l) => l.trim()) || "";
  const lines = src.split("\n");
  let best = -1, score = 0;
  const words = new Set(first.trim().split(/\W+/).filter(Boolean));
  lines.forEach((l, i) => { const s = l.split(/\W+/).filter((w) => words.has(w)).length; if (s > score) { score = s; best = i; } });
  if (best < 0) return "no similar line";
  return lines.slice(Math.max(0, best - 3), best + 4).map((l, i) => `${Math.max(0, best - 3) + i + 1}: ${l}`).join("\n");
}

/**
 * @param {{ design: object, levels: { visible: object[], heldOut: object[], all: object[] }, topicId: string, ageBand: string,
 *           browser?: object, budget?: object, log?: (e: object) => void, respondFn?: typeof respond }} o
 */
export async function buildMechanic(o) {
  const budget = { ...DEFAULT_BUDGET, ...(o.budget || {}) };
  const ledger = new Ledger(budget);
  const log = o.log || (() => {});
  const respondFn = o.respondFn || respond;
  const model = o.builder || process.env.DEPLOY_CODEX || "taxila-codex";
  const design = o.design;
  const ws = { src: null, notes: [] };
  const trajectory = [];
  let lastPlay = null;
  const playCheck = async (levels, extra = {}) => {
    if (!ws.src) return { green: false, text: "FAIL: src/mechanic.js does not exist yet (write_mechanic first)", gates: [] };
    const bundle = buildBundle(ws.src, design);
    const st = staticGate({ mechanicSrc: ws.src, design, bundle });
    let gates = st.gates;
    if (st.lint.ok) {
      const br = await browserGate({ html: bundle.html, levels, topicId: o.topicId, ageBand: o.ageBand, browser: o.browser, ...extra });
      gates = [...gates, ...br.gates];
      lastPlay = { bundle, gates, frames: br.frames, trace: br.trace, metrics: br.metrics };
    }
    return { green: gates.every((g) => g.status === "pass"), text: summarise(gates), gates, bundle };
  };

  const exec = async (name, args) => {
    switch (name) {
      case "read_file":
        if (args.path === "KIT.md") return { ok: true, text: KIT_MD };
        if (args.path === "golden.js") return { ok: true, text: GOLDEN[design.archetype] };
        if (args.path === "design.json") return { ok: true, text: designDoc(design, o.levels.visible) };
        if (args.path === "src/mechanic.js") return ws.src ? { ok: true, text: ws.src.split("\n").map((l, i) => `${i + 1}: ${l}`).join("\n") } : { ok: false, text: "src/mechanic.js does not exist yet" };
        return { ok: false, text: "not readable" };
      case "write_mechanic": {
        if (typeof args.content !== "string" || args.content.length > 40_000) return { ok: false, text: "content missing or > 40k chars" };
        ws.src = args.content;
        const l = lintSummary(ws.src, design);
        return { ok: l.startsWith("LINT PASS"), text: `wrote src/mechanic.js (${ws.src.split("\n").length} lines)\n${l}` };
      }
      case "edit_mechanic": {
        if (!ws.src) return { ok: false, text: "src/mechanic.js does not exist yet" };
        const n = ws.src.split(args.old).length - 1;
        if (n !== 1) {
          // second pass: whitespace-trimmed line match (seek_sequence rstrip/trim passes)
          const norm = (s) => s.split("\n").map((l) => l.trim()).join("\n");
          const lines = ws.src.split("\n"), oldLines = norm(args.old).split("\n");
          let at = -1, hits = 0;
          for (let i = 0; i + oldLines.length <= lines.length; i++) if (lines.slice(i, i + oldLines.length).map((l) => l.trim()).join("\n") === oldLines.join("\n")) { at = i; hits++; }
          if (hits !== 1) return { ok: false, text: `edit failed: snippet found ${n} times exactly, ${hits} times trimmed. Closest lines:\n${closest(ws.src, args.old)}` };
          lines.splice(at, oldLines.length, ...args.new.split("\n"));
          ws.src = lines.join("\n");
        } else ws.src = ws.src.replace(args.old, () => args.new);
        const l = lintSummary(ws.src, design);
        return { ok: true, text: `edited src/mechanic.js\n${l}` };
      }
      case "run_check":
        if (args.name === "lint") { if (!ws.src) return { ok: false, text: "no src yet" }; const l = lintSummary(ws.src, design); return { ok: l.startsWith("LINT PASS"), text: l }; }
        { const r = await playCheck(o.levels.visible); return { ok: r.green, text: r.text }; }
      case "note": ws.notes.push(String(args.text).slice(0, 400)); return { ok: true, text: "noted" };
      case "submit": { const r = await playCheck(o.levels.visible); return { ok: r.green, text: r.green ? "ACCEPTED" : `REFUSED\n${r.text}`, submitGreen: r.green }; }
      default: return { ok: false, text: `unknown tool ${name}` };
    }
  };

  const runRound = async (stage, round, firstInput) => {
    let prev = null, input = firstInput;
    const failed = new Map();
    for (let step = 0; step < budget.stepsPerRound[stage]; step++) {
      const cap = ledger.check();
      if (cap) return { kind: "capped", reason: cap };
      const effort = round >= 2 ? "high" : "medium";
      let res;
      try {
        res = await respondFn({ model, input, tools: TOOLS, parallel_tool_calls: false, tool_choice: "auto", max_output_tokens: 16000,
          reasoning: { effort }, ...(prev ? { previous_response_id: prev } : {}), prompt_cache_key: `g2:${design.archetype}:${HARNESS_VERSION}`, store: true });
      } catch (e) {
        trajectory.push({ stage, round, step, error: String(e.message).slice(0, 200) });
        if (e.code === "content_filter") return { kind: "content_filter" };
        return { kind: "model_error", reason: String(e.message).slice(0, 200) };
      }
      ledger.steps++; ledger.add(model, res.usage);
      prev = res.id;
      const calls = res.output.filter((x) => x.type === "function_call");
      if (!calls.length) {
        ledger.formatErrors++;
        trajectory.push({ stage, round, step, ms: res.ms, noTool: true, status: res.status });
        if (ledger.formatErrors >= budget.formatErrors) return { kind: "format_fail" };
        input = [{ role: "user", content: "Use one of the tools. Next: " + (ws.src ? "run_check play, then fix or submit." : "write_mechanic.") + ledger.footer(stage, round) }];
        continue;
      }
      ledger.formatErrors = 0;
      const outs = [];
      let submitted = null;
      for (const c of calls.slice(0, 1)) {
        let args = {};
        try { args = JSON.parse(c.arguments || "{}"); } catch { /* strict schema: should not happen */ }
        const sig = `${c.name}:${JSON.stringify(args).slice(0, 2000)}`;
        const t0 = Date.now();
        const r = await exec(c.name, args);
        trajectory.push({ stage, round, step, tool: c.name, ok: r.ok, ms: res.ms, toolMs: Date.now() - t0, usage: res.usage, obs: r.text.slice(0, 300) });
        log({ stage, round, step, tool: c.name, ok: r.ok, ledger: ledger.toJSON() });
        let text = r.text;
        if (!r.ok) { const k = (failed.get(sig) || 0) + 1; failed.set(sig, k); if (k === 2) text += "\nNOTE: this exact action already failed once."; if (k >= 3) return { kind: "stuck" }; }
        if (ledger.low()) text += "\nLOW BUDGET: smallest change that turns the current failure green.";
        outs.push({ type: "function_call_output", call_id: c.call_id, output: (text + ledger.footer(stage, round)).slice(0, 12_000) });
        if (c.name === "submit") submitted = r;
      }
      for (const c of calls.slice(1)) outs.push({ type: "function_call_output", call_id: c.call_id, output: "ignored: one tool call per turn" });
      if (submitted?.submitGreen) return { kind: "green" };
      input = outs;
    }
    return { kind: "round_steps" };
  };

  const prefix = systemPrompt(design);
  let outcome = await runRound("S3", 1, [{ role: "developer", content: prefix }, { role: "user", content: `design.json:\n${designDoc(design, o.levels.visible)}\nBuild it.` }]);
  for (let r = 1; outcome.kind !== "green" && r <= budget.rounds.S4 && !["capped", "content_filter", "format_fail"].includes(outcome.kind); r++) {
    if (ledger.check()) { outcome = { kind: "capped", reason: ledger.check() }; break; }
    const red = ws.src ? (await playCheck(o.levels.visible)).text : "src/mechanic.js missing";
    const handoff = `design.json:\n${designDoc(design, o.levels.visible)}\n\nsrc/mechanic.js (current):\n${ws.src || "(none)"}\n\nnotes: ${ws.notes.slice(-4).join(" | ") || "-"}\n\nlast check:\n${red}\n\nFix the first failure, run_check play, then submit.`;
    outcome = await runRound("S4", r + 1, [{ role: "developer", content: prefix }, { role: "user", content: handoff }]);
  }
  // S6 FINAL: rebuild from the stored source (the bytes that ship) and gate on ALL levels, held-out included, new seed
  const finalGate = async () => {
    if (!ws.src) return null;
    const r1 = buildBundle(ws.src, design), r2 = buildBundle(ws.src, design);
    const full = await playCheck(o.levels.all, { seed: 101, capture: true });
    return { gates: [{ id: "Q10.rebuild_sha", status: r1.sha === r2.sha && r1.sha === full.bundle?.sha ? "pass" : "fail", detail: r1.sha.slice(0, 16) }, ...full.gates],
      bundle: r1, frames: lastPlay?.frames, trace: lastPlay?.trace, metrics: lastPlay?.metrics, src: ws.src };
  };
  let final = await finalGate();
  // S5 POLISH (§3.1: builder ← Q6-Q8 + advisory Q9): only after a fully green final gate; the critic's items are
  // evidence for ONE short round, never a gate. A polish that breaks any hard gate is discarded (last green kept).
  let polish = null;
  if (o.critic && final && final.gates.every((g) => g.status === "pass") && !ledger.check()) {
    const before = await o.critic(final.frames);
    const flags = (before.items || []).filter((c) => c.pass === false);
    polish = { before: flags.map((c) => c.criterion), after: null, kept: false, usage: [before.usage].filter(Boolean) };
    if (flags.length) {
      const green = { src: ws.src, final };
      const evidence = flags.map((c) => `- ${c.criterion} (frame ${c.frame}): ${String(c.evidence).slice(0, 300)}`).join("\n");
      const handoff = `design.json:\n${designDoc(design, o.levels.visible)}\n\nsrc/mechanic.js (current, passes every check):\n${ws.src}\n\nA reviewer looked at the screens and noted:\n${evidence}\n\nFix these with the smallest change (edit_mechanic; the source above is current, no need to read it), then run_check play, then submit — within 5 tool calls.`;
      const po = await runRound("S5", 1, [{ role: "developer", content: prefix }, { role: "user", content: handoff }]);
      polish.outcome = po.kind;
      const next = po.kind === "green" ? await finalGate() : null;
      if (next && next.gates.every((g) => g.status === "pass")) {
        const after = await o.critic(next.frames);
        if (after.usage) polish.usage.push(after.usage);
        polish.after = (after.items || []).filter((c) => c.pass === false).map((c) => c.criterion);
        polish.critique = after.items;
        final = next; polish.kept = true;
      } else { ws.src = green.src; final = green.final; polish.critique = before.items; }
    } else polish.critique = before.items;
  }
  return { outcome, src: ws.src, final, ledger: ledger.toJSON(), trajectory, notes: ws.notes, polish };
}
