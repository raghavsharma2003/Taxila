// Forge G2 in the browser (split from forge-g2.test.mjs for gate speed, main 2026-11-05: the pure suites run in a unit
// shard, these in the browser shard): the browser gate on the goldens (key-marking mutants inert on the opaque kit, caught
// on a leaky one, frozen intrinsics) and a harness run with a scripted model. No network: model calls are scripted.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "fs";
import { buildBundle } from "../server/forge/g2/bundle.js";
import { briefFor } from "../server/forge/g2/brief.js";

const ROOT = new URL("..", import.meta.url).pathname;
const G = (f) => readFileSync(`${ROOT}server/forge/g2/goldens/${f}.js`, "utf8");
const D = JSON.parse(readFileSync(`${ROOT}server/forge/g2/goldens/designs.json`, "utf8"));
const browsersDir = process.env.PLAYWRIGHT_BROWSERS_PATH;
const haveChromium = !!browsersDir && existsSync(browsersDir) && readdirSync(browsersDir).some((d) => d.startsWith("chromium"));
const NO_BROWSER = process.env.FORGE_G2_BROWSER === "0" ? "FORGE_G2_BROWSER=0" : !haveChromium ? "no Chromium under PLAYWRIGHT_BROWSERS_PATH" : false;

// (the same env guard as forge-g2.test.mjs: every env write is undone when this file ends)
let ENV0;
before(() => { ENV0 = { ...process.env }; process.env.FORGE_PUBLIC_BASE = "https://pub"; });
after(() => {
  for (const k of Object.keys(process.env)) if (!(k in ENV0)) delete process.env[k];
  Object.assign(process.env, ENV0);
});

// ───────────── browser: goldens through the gate, and a harness run with a scripted model ─────────────
test("gate (browser): both goldens pass every check; key-marking mutants are lint errors, inert on the opaque kit, caught on a leaky one", { skip: NO_BROWSER, timeout: 240_000 }, async () => {
  const { browserGate, staticGate, launchBrowser } = await import("../server/forge/g2/qa.js");
  const browser = await launchBrowser();
  try {
    for (const [file, name, topic, arch] of [["stepping-stones", "stepping-stones@1", "c6-maths-ch07-t05", "choice"], ["tower-build", "tower-build@1", "c1-maths-ch04-t01", "build"]]) {
      const src = G(file), bundle = buildBundle(src, D[name]), b = briefFor(topic, { archetype: arch });
      const gates = [...staticGate({ mechanicSrc: src, design: D[name], bundle }).gates,
        ...(await browserGate({ html: bundle.html, levels: b.levels.all, topicId: topic, ageBand: b.brief.ageBand, browser })).gates];
      assert.deepEqual(gates.filter((g) => g.status !== "pass").map((g) => `${g.id} ${g.detail}`), [], name);
    }
    const { KIT_JS } = await import("../server/forge/g2/bundle.js");
    const leaky = KIT_JS.replace('return "o:" + a[0].toString(36) + a[1].toString(36); }', "return internal; }");
    assert.notEqual(leaky, KIT_JS);
    const b = briefFor("c6-maths-ch07-t05");
    const run = async (src, kitJs) => (await browserGate({ html: buildBundle(src, D["stepping-stones@1"], kitJs ? { kitJs } : {}).html, levels: b.levels.all, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser })).gates.filter((x) => x.status !== "pass").map((x) => x.id);
    const first = G("stepping-stones").replace("return { at: -1, hops: 0, opts: ctx.refs.options() };",
      "const o = ctx.refs.options(); const s = 'sl' + 'ot'; return { at: -1, hops: 0, opts: o.filter((r) => r[s] === \"key\").concat(o.filter((r) => r[s] !== \"key\")) };");
    const glow = G("stepping-stones").replace("draw.circle(fx, fy, 18", "const s2 = 'sl'; m.opts.forEach((o, i) => { if (o[s2 + 'ot'] === 'key') draw.circle(gap + i * (w + gap) + w / 2, 176, 9, { fill: 'sun' }); }); draw.circle(fx, fy, 18");
    assert.deepEqual(await run(first), [], "key-first is inert: tokens never say key and the order is crypto-shuffled");
    assert.deepEqual(await run(glow), [], "key-glow is inert on the opaque kit");
    assert.ok((await run(first, leaky)).includes("leak.key_position"), "the position detector still works if opacity regressed");
    assert.ok((await run(glow, leaky)).includes("leak.key_styled"), "the styling detector catches a key-only mark");
    const patch = G("stepping-stones").replace("return { at: -1, hops: 0, opts: ctx.refs.options() };", "const p = '__pro'; [][p + 'to__'].some = function () { return true; }; return { at: -1, hops: 0, opts: ctx.refs.options() };");
    assert.ok((await run(patch)).includes("Q3.binding"), "intrinsics are frozen: patching Array.prototype throws");
  } finally { await browser.close(); }
});
test("harness (browser): a scripted builder that writes a valid mechanic and submits ends green; a silent one hits the format cap", { skip: NO_BROWSER, timeout: 180_000 }, async () => {
  const { buildMechanic } = await import("../server/forge/g2/harness.js");
  const { launchBrowser } = await import("../server/forge/g2/qa.js");
  const browser = await launchBrowser();
  const b = briefFor("c6-maths-ch07-t05");
  const design = { ...D["stepping-stones@1"], id: "frog-hop@1" };
  const src = G("stepping-stones");
  let n = 0;
  const call = (name, args) => ({ id: `r${++n}`, status: "completed", ms: 1, usage: { input_tokens: 1000, input_tokens_details: { cached_tokens: 500 }, output_tokens: 100 },
    output: [{ type: "function_call", name, call_id: `c${n}`, arguments: JSON.stringify(args) }] });
  const script = [call("read_file", { path: "design.json" }), call("write_mechanic", { content: src }), call("run_check", { name: "play" }), call("submit", { summary: "done" })];
  try {
    const r = await buildMechanic({ design, levels: b.levels, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser, respondFn: async () => script.shift() });
    assert.equal(r.outcome.kind, "green");
    assert.equal(r.ledger.steps, 4);
    assert.ok(r.final.gates.every((g) => g.status === "pass"), JSON.stringify(r.final.gates.filter((g) => g.status !== "pass")));
    assert.ok(r.ledger.usd > 0);
    const silent = await buildMechanic({ design, levels: b.levels, topicId: "c6-maths-ch07-t05", ageBand: b.brief.ageBand, browser,
      budget: { rounds: { S4: 0 } }, respondFn: async () => ({ id: "x", status: "completed", ms: 1, usage: {}, output: [{ type: "message", content: [] }] }) });
    assert.equal(silent.outcome.kind, "format_fail");
    assert.equal(silent.final, null);
  } finally { await browser.close(); }
});
