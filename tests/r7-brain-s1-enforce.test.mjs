// round 7 S1 (main's director2 decision: "guards ENFORCE. A flagged draft never ships"): every teacher line of the director2 run
// (evals/hybrid-side-by-side/results/2026-11-04-director2/) is replayed as the model's answer to EVERY call (draft, rewrite and
// repairs alike), in the state the Director reaches with that lesson's child lines and reads. Whatever the model says, the
// line that ships carries no enforced problem. Pure (no model, no DB).
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { initLessonState, step } from "../server/director/state.js";
import { textReply, replyDeps, ENFORCED } from "../server/brain/say.js";
import { chat } from "../server/azure.js";
import { kitFromFile } from "../server/content/kits.js";
import { getTopic } from "../server/content/curriculum.js";
import { CTX, cls } from "./fixtures/kit.mjs";

const DIR = new URL("../evals/hybrid-side-by-side/results/2026-11-04-director2/", import.meta.url);
const R7_FLAGS = ["TAXILA_R7_PARK_TOPIC", "TAXILA_R7_BYE_CHECKIN", "TAXILA_R7_FRUSTRATION"];
const KEEP = {};
describe("S1: no flagged line ships (director2 replayed through the guards)", () => {
  beforeEach(() => { for (const k of R7_FLAGS) { KEEP[k] = process.env[k]; delete process.env[k]; } });
  afterEach(() => { replyDeps.chat = chat; for (const k of R7_FLAGS) { if (KEEP[k] === undefined) delete process.env[k]; else process.env[k] = KEEP[k]; } });

  for (const f of readdirSync(DIR).filter((x) => x.endsWith(".json") && x !== "meter.json")) {
    test(`director2 ${f}: every replayed line ships clean of enforced problems`, async () => {
      const run = JSON.parse(readFileSync(new URL(f, DIR), "utf8"));
      const K = kitFromFile(getTopic(run.topicId));
      let r = step(initLessonState({ topicId: K.topicId, kit: K, ctx: { ...CTX, classLevel: run.classLevel, ageBand: "10-15", lang: "hinglish" }, seed: 3, now: 0 }), { event: "start", kit: K, now: 0 });
      const rows = run.director;
      const history = [];
      const shipped = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (row.who === "child") {
          history.push({ who: "child", text: row.text });
          r = step(r.state, { event: "turn", kit: K, cls: cls(row.read ?? "no_evidence"), text: row.text, now: (r.state.turn + 1) * 20_000 });
          if (r.end) break;
          const said = rows.slice(i + 1).find((x) => x.who === "teacher")?.text;
          if (!said || ["safeguard", "wrap"].includes(r.move.kind)) continue;
          replyDeps.chat = async () => ({ text: said });
          const out = await textReply({ instructions: "x", state: { ...r.state, mode: "text" }, kit: K, childText: row.text,
            verdict: ["correct", "incorrect", "partial", "misconception"].includes(row.read) ? row.read : "ungraded", history: history.slice(-6), ui: r.ui, module: null });
          // (the one let-through by design: a leak in an example the child ASKED for, its next item marked spoiled instead)
          const left = (out.guard.final ?? []).filter((p) => ENFORCED.has(p) && !(p === "leak" && out.guard.spoilsAhead && r.state.lastMove?.request));
          shipped.push({ said, reply: out.reply, left });
          history.push({ who: "teacher", text: out.reply });
        } else if (i === 0) history.push({ who: "teacher", text: row.text });
      }
      const bad = shipped.filter((x) => x.left.length);
      assert.equal(bad.length, 0, bad.map((x) => `${x.left.join(",")}: ${x.reply}`).join("\n"));
      assert.ok(shipped.length >= 5, `replayed ${shipped.length} turns`);
    });
  }
});
