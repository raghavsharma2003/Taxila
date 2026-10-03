// shared/engine-catalog.js — the list the Director plans from — against the frame registry and the kits:
// every catalogue id is a registered frame engine and back, every alias names a real engine, the class 4-7
// coverage floor holds, and every item plan that binds a kit item agrees with the frame's own verdict logic
// (evals/engines-coverage.mjs replays each bound plan through src/modules/frame/engines/*.logic.ts).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "fs";
import * as NL from "../src/modules/frame/engines/numberLine.logic.ts";
import * as PV from "../src/modules/frame/engines/placeValue.logic.ts";
import * as MD from "../src/modules/frame/engines/multiplyDivide.logic.ts";
import * as FR from "../src/modules/frame/engines/fractions.logic.ts";
import * as MS from "../src/modules/frame/engines/measure.logic.ts";
import * as PT from "../src/modules/frame/engines/patterns.logic.ts";
import * as DG from "../src/modules/frame/engines/dataGraphs.logic.ts";
import { ENGINES, ENGINE_IDS, HINT_ALIASES, pickEngine, planEngine, resolveHint, wordsToNumber } from "../shared/engine-catalog.js";
import { run } from "../evals/engines-coverage.mjs";

const root = new URL("..", import.meta.url).pathname;

/**
 * The text a mounted engine puts on screen BEFORE the child acts, derived from the frame's own normalize() as
 * each view renders it (prompt line, tick labels, pre-commit readouts). Drawn quantities (icons, bars, dots,
 * pieces) are not text.
 */
function visibleText(engine, params) {
  switch (engine) {
    case "number-line@1": {
      const c = NL.normalize(params);
      const prompt = c.question ?? (c.roundTo ? `${c.roundTo} ${NL.fmtValue(c, c.point)}` : c.mode === "read" ? "" : c.target ? NL.fmtValue(c, c.target) : "");
      // tick labels are the instrument (placing on a labelled line is the task): the target's own tick is not a leak
      const tk = c.target ? NL.indexOf(c, c.target) : null;
      const labels = Array.from({ length: c.ticks + 1 }, (_, k) => (k === tk ? null : NL.labelAt(c, k))).filter(Boolean);
      return [prompt, ...labels].join(" | ");
    }
    case "place-value@1": {
      const c = PV.normalize(params);
      if (c.mode === "build") return c.name ?? String(c.value);
      if (c.mode === "compare") return `${c.a} | ${c.b}`;
      return ""; // read: pieces only
    }
    case "multiply-divide@1": {
      const c = MD.normalize(params);
      if (c.mode === "array") return c.ask === "product" && !c.showExpr ? "" : `${c.a} × ${c.b}`;
      return c.mode === "share" ? `${c.n} ÷ ${c.k}` : String(c.n);
    }
    case "fractions@1": {
      const c = FR.normalize(params);
      return [c.target ? FR.fmt(c.target) : "", ...c.fractions.map(FR.fmt)].join(" | ");
    }
    case "patterns@1": return PT.normalize(params).terms.join(", ");
    case "geoboard@1": return "";
    case "measure@1": { const c = MS.normalize(params); return `${c.min} | ${c.max}`; }
    case "data-graphs@1": {
      const c = DG.normalize(params);
      return c.view === "table" ? c.cats.map((x) => `${x.label} ${x.value}`).join(" | ") : `${c.scale} | ${c.cats.map((x) => x.label).join(" | ")}`;
    }
    default: return JSON.stringify(params);
  }
}

test("catalogue ids = frame registry ids; aliases name built engines; topic map names built engines", () => {
  const reg = readFileSync(root + "src/modules/frame/registry.ts", "utf8");
  const ids = [...reg.matchAll(/^\s*"([a-z0-9-]+@\d+)":\s*\(\)\s*=>\s*import\(/gm)].map((m) => m[1]).sort();
  assert.deepEqual(ids, [...ENGINE_IDS].sort());
  for (const [hint, a] of Object.entries(HINT_ALIASES)) assert.ok(ENGINES[a.engine], `${hint} → ${a.engine}`);
  const map = JSON.parse(readFileSync(root + "shared/engine-topic-map.json", "utf8"));
  for (const [t, e] of Object.entries(map)) assert.ok(ENGINES[e], `${t} → ${e}`);
});

test("resolveHint / pickEngine", () => {
  assert.equal(resolveHint("Fraction strips")?.engine, "fractions@1");
  assert.equal(resolveHint("shadow_stick_sim")?.engine, "sky@1");
  assert.deepEqual(resolveHint("shadow_stick_sim").preset, { scene: "shadow" });
  assert.equal(resolveHint("number-line")?.engine, "number-line@1");
  assert.equal(resolveHint("sky@1")?.engine, "sky@1");
  assert.equal(resolveHint("scene"), null, "scene@1 is for Forge fills, never a kit hint");
  assert.equal(resolveHint("read-along"), null);
  const kit = { topicId: "c5-maths-x", formats: { engineHints: ["read-along", "pizza-cutter", "number-line"] } };
  assert.equal(pickEngine(kit).engine, "fractions@1", "first hint that resolves");
  assert.equal(pickEngine(kit, "use a number line").engine, "number-line@1", "representation word wins");
  assert.equal(pickEngine({ topicId: "c4-maths-ch01-t03", formats: { engineHints: ["nope"] } }, null, { "c4-maths-ch01-t03": "geoboard@1" }).via, "topic");
  assert.equal(pickEngine({ formats: { engineHints: ["nope"] } }), null);
});

test("planEngine (every kit): what a bound plan SHOWS (via the frame's normalize) never holds a key the prompt does not", () => {
  const topicMap = JSON.parse(readFileSync(root + "shared/engine-topic-map.json", "utf8"));
  let bound = 0;
  for (const f of readdirSync(root + "data/kits").filter((f) => /^c\d-.*\.json$/.test(f)))
    for (const kit of JSON.parse(readFileSync(root + "data/kits/" + f, "utf8")).topics)
      for (const item of kit.items ?? []) {
        const p = planEngine({ kit, item, lang: "english", topicMap });
        if (!p?.bindItem) continue;
        bound++;
        const shown = visibleText(p.engine, p.params);
        const key = String(p.key);
        if (new RegExp(`(^|[^\\d/])${key.replace(/[/.]/g, "\\$&")}([^\\d/]|$)`).test(shown))
          assert.ok(String(item.prompt_en).replace(/,/g, "").includes(key), `${item.id}: key ${key} is shown (${shown}) but the prompt does not show it`);
      }
  assert.ok(bound >= 95, `bound plans: ${bound}`);
});

test("planEngine shapes: unbound activity keeps the Director's mode; science predict asks a POE first", () => {
  const kit = { topicId: "c6-science-x", formats: { engineHints: ["shadow_stick_sim"] }, items: [] };
  const p = planEngine({ kit, item: { id: "i1", prompt_en: "Why are shadows long in the evening?", answer: "the Sun is low" }, lang: "hindi", mode: "predict" });
  assert.equal(p.engine, "sky@1");
  assert.equal(p.bindItem, false, "a free-text key cannot be checked by the sim: unbound");
  assert.equal(p.params.scene, "shadow");
  assert.equal(p.params.predict, true);
  assert.equal(p.params.lang, "hindi");
  const q = planEngine({ kit: { topicId: "c4-maths-y", formats: { engineHints: ["sharing-plates"] } }, item: { id: "i2", prompt_en: "Share 15 bananas equally among 3 monkeys. How many does each get?", answer: "5" } });
  assert.deepEqual([q.engine, q.params.mode, q.params.n, q.params.k, q.bindItem], ["multiply-divide@1", "share", 15, 3, false], "dealing one each always reaches the fair share: activity, not evidence");
  assert.equal(q.params.itemId, undefined, "an unbound plan carries no itemId");
  const box = planEngine({ kit: { topicId: "c4-maths-y", formats: { engineHints: ["sharing-plates"] } }, item: { id: "i3", prompt_en: "48 ladoos are packed in boxes of 6. How many boxes?", answer: "8" } });
  assert.equal(box.bindItem, false, "quotitive division is not the share engine's action");
  assert.equal(wordsToNumber("two thousand three hundred forty-five"), 2345);
  assert.equal(wordsToNumber("four lakh twenty-five thousand"), 425000);
  assert.equal(wordsToNumber("forty thousand and six"), 40006);
  assert.equal(wordsToNumber("many"), null);
});

test("coverage floor and planner↔frame agreement over the class 4-7 kits", () => {
  const r = run({ classes: /^c[4-7]-/ });
  assert.equal(r.topics.all.hint.n, 385);
  assert.ok(r.topics.all.hint.share >= 34, `hint coverage ${r.topics.all.hint.share}%`);
  assert.ok(r.topics.mathsScienceEvs.hint.share >= 52, `maths+science+EVS ${r.topics.mathsScienceEvs.hint.share}%`);
  assert.equal(r.topics.all.before.covered, 4, "before: only fraction-bars topics resolved");
  assert.ok(r.items.bound >= 60, `bound items ${r.items.bound}`);
  assert.equal(r.items.disagreeCount, 0, JSON.stringify(r.items.disagree.slice(0, 3)));
  assert.equal(r.items.agree, r.items.bound, "every bound plan replays right in the frame logic");
  assert.equal(r.items.negOk, r.items.bound, "and a perturbed key replays wrong");
});

test("every kit (c1-c9): bound plans replay right as the child's action, wrong on a perturbed key; fallbacks use the item", () => {
  const r = run();
  assert.ok(r.items.bound >= 95, `bound items ${r.items.bound}`);
  assert.equal(r.items.disagreeCount, 0, JSON.stringify(r.items.disagree.slice(0, 3)));
  assert.equal(r.items.agree, r.items.bound);
  assert.equal(r.items.negOk, r.items.bound);
  // an unbound fallback mounts only when the engine builds its activity from the item's values
  assert.ok(r.unbound.demoDefault / Math.max(1, r.unbound.maths) < 0.03, `demo-default fallback mounts ${r.unbound.demoDefault}/${r.unbound.maths}`);
});
