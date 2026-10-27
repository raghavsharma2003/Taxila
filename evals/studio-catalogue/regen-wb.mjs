// Round 5 (main's GO 2026-10-15): re-author the catalogue whiteboard beats code could not repair (repair-cuts.mjs), one
// beat at a time, on the catalogue's own Azure author (taxila-fast-bg: taxila-fast's background twin, its own quota, so a
// catalogue run never touches children's live lane). The model gets the old script, the line she says and the kit facts,
// and returns the same drawing with every cell whole; code keeps it only if it passes the strict shape, the stage lint,
// W15, W16 and the cut check against its kit and line (3 attempts, the failures fed back). A beat that still fails is
// DROPPED (script null). Spend is appended to data/studio-catalogue/spend.jsonl and capped (--budget, default $3).
import fs from "node:fs";
import { chat, normUsage, usdOf } from "../../server/azure.js";

const AUTHOR = process.env.CATALOGUE_AUTHOR || "taxila-fast-bg";
const SPEND = "data/studio-catalogue/spend.jsonl";
const BUDGET = Number(process.argv.includes("--budget") ? process.argv[process.argv.indexOf("--budget") + 1] : 3);
let spent = 0;

const clip = (s, n) => String(s ?? "").slice(0, n);
const factsOf = (kit) => ({ expectations: (kit?.expectations ?? []).map((e) => clip(e, 260)),
  workedExample: kit?.workedExample ? { problem: clip(kit.workedExample.problem, 300), steps: (kit.workedExample.steps ?? []).slice(0, 6).map((s) => clip(s, 200)) } : null,
  terms: (kit?.items ?? []).slice(0, 10).map((i) => clip(i.prompt_en ?? i.prompt_hi, 160)) });

function messages(old, line, kit, feedback) {
  const sys = [
    "You fix ONE whiteboard script: what a teacher draws on a chalkboard while she says one line. Our code draws the ops in sync with her voice.",
    "Return ONLY JSON {\"script\":{...}}: the same script (same v, scriptId, line, anchor, board, mode, durationMs, the same op ids, the same drawing and timing) with these fixed:",
    "- every number-work (numwork) cell is ONE whole word, number or symbol, never part of a word: a cell holds at most 6 characters in column_add / column_sub / column_mul / fraction / number_line layouts and at most 12 in equation / long_div; a longer word or a phrase goes in a text op (max 24 characters), never cut;",
    "- every word and number drawn appears in the line or the KIT facts, spelled in full as there;",
    "- when the line names a shape (rectangle, square, triangle, circle) the script draws that shape (a rect, a polygon with right-angled corners, a circle);",
    "- coordinates stay inside the board with a 20 px margin; no two texts overlap.",
  ].join("\n");
  const user = `Line she says: ${JSON.stringify(line)}\nKIT facts: ${JSON.stringify(factsOf(kit))}\nOld script: ${JSON.stringify(old)}` + (feedback ? `\n\nThe last attempt still failed these checks, fix them: ${feedback}` : "");
  return [{ role: "system", content: sys }, { role: "user", content: user }];
}

async function call(msgs, tag) {
  if (spent > BUDGET) throw new Error(`budget: $${spent.toFixed(2)} > $${BUDGET}`);
  const t0 = Date.now();
  const res = await chat(AUTHOR, msgs, { json: true, timeoutMs: 120_000, retries: 1, quotaLane: "background", maxTokens: 8000, effort: "low" });
  const u = normUsage(res.usage), usd = usdOf(AUTHOR === "taxila-fast-bg" ? "taxila-fast" : AUTHOR, u);
  spent += usd;
  fs.appendFileSync(SPEND, JSON.stringify({ at: new Date().toISOString(), tag, deployment: AUTHOR, ms: Date.now() - t0, in: u?.in ?? 0, out: u?.out ?? 0, reasoning: u?.reasoning ?? 0, usd: +usd.toFixed(6) }) + "\n");
  return res.json;
}

/** → [{ topicId, line, outcome: "model" | "dropped", why, attempts }] ; writes the topic files unless dry. */
export async function regenBeats(list, { kitOf, lineOf, beatFailures, dry = false }) {
  const out = [];
  const byFile = new Map();
  for (const x of list) byFile.set(x.file, [...(byFile.get(x.file) ?? []), x]);
  for (const [file, xs] of byFile) {
    const rec = JSON.parse(fs.readFileSync(file, "utf8"));
    const kit = kitOf(rec.topicId);
    for (const x of xs) {
      const b = rec.whiteboard.beats.find((y) => y.line === x.line);
      const line = lineOf(rec, b);
      let feedback = x.why.join("; "), got = null, attempts = 0;
      for (; attempts < 3 && !got; attempts++) {
        let raw;
        try { raw = await call(messages(b.script, line, kit, feedback), `wbfix:${rec.topicId}:${b.line}`); }
        catch (e) { if (String(e.message).startsWith("budget")) { attempts = 99; break; } feedback = `not usable JSON (${String(e.message).slice(0, 80)})`; continue; }
        const s = raw?.script && typeof raw.script === "object" ? raw.script : raw;
        const f = beatFailures(s, kit, line);
        if (f.loadable && !f.why.length) got = s;
        else feedback = (f.loadable ? f.why : ["shape/lint: " + f.why.join(", ")]).join("; ").slice(0, 600);
      }
      if (got) { b.script = got; b.repaired = `cut-words (re-authored on ${AUTHOR})`; out.push({ topicId: rec.topicId, line: b.line, outcome: "model", was: x.why, attempts }); }
      else { b.dropped = { why: x.why, lastFeedback: feedback, at: new Date().toISOString() }; b.script = null; b.ok = false; out.push({ topicId: rec.topicId, line: b.line, outcome: "dropped", was: x.why, lastFeedback: feedback, attempts }); }
      console.log(`${out.at(-1).outcome.padEnd(7)} ${rec.topicId} ${b.line} (${attempts} tries) $${spent.toFixed(3)}`);
    }
    if (!dry) fs.writeFileSync(file, JSON.stringify(rec, null, 1));
  }
  return out;
}
