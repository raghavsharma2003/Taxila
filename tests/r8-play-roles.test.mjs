// Round 8, Design's patch 002 (docs/patches/to-games/002-tx-roles/README.md) and the rulings of 2026-11-11 (night, "Also")
// and 2026-11-15 (row "3D engines"): the play art's role colours.
//   - kagaz and raat hold Design's values: focus, answer, mix-up (both), and the action (kagaz; raat's README value is lime,
//     which the rulings put outside green, so raat's action is held to "outside the green family" only);
//   - the action hue (ArtTokens.you) is outside the green family in every art, keeps the deuteranopia distance ≥ 0.15 from
//     focus, answer and mix-up (Studio's measure, tests/theme-palette.test.mjs), its text reads on it, and on the dark arts it
//     stands ≥ 3:1 on the ground;
//   - the action hue is never a painter role (no figure in it: laws.mjs fails a canvas "you" on every served level);
//   - the play chrome (play.css) carries the same action, its ink and the focus for every art, and the [data-tx] block;
//   - the 3D engines draw a selection in the focus token, read through lawColor (yantra's ring and kit, khand's cursor,
//     antariksh's aim): no lime left in src/play.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.join(new URL(".", import.meta.url).pathname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const { ART, LAW_ROLES, lawColor, roleColor, contrast } = await import("../src/play/core/styles.ts");
const L = await import("../server/forge3/qa/laws.mjs");

// Studio's deuteranopia measure (tests/theme-palette.test.mjs: Viénot 1999 in linear RGB)
const rgb = (hex) => { const h = hex.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); };
function deutan(hex) {
  const [r, g, b] = rgb(hex).map((v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const rr = 0.29275 * r + 0.70725 * g, bb = -0.02234 * r + 0.02234 * g + b;
  return [rr, rr, bb].map((c) => Math.max(0, Math.min(1, c)));
}
const apart = (a, b) => { const [p, q] = [deutan(a), deutan(b)]; return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };

test("kagaz and raat hold Design's role values (focus, answer, mix-up; kagaz's action and both actions' ink)", () => {
  for (const [id, want] of Object.entries(L.DESIGN_ROLES)) {
    const a = ART[id];
    assert.equal(lawColor(a, "focus").toUpperCase(), want.focus, `${id} focus`);
    assert.equal(lawColor(a, "answer").toUpperCase(), want.answer, `${id} answer`);
    assert.equal(lawColor(a, "mixup").toUpperCase(), want.mixup, `${id} mix-up`);
    if (want.action) assert.equal(a.you.toUpperCase(), want.action, `${id} action`);
    assert.equal(a.youInk.toUpperCase(), want.actionInk, `${id} action ink`);
    assert.deepEqual(L.tokenBreaks(a), [], id);
  }
  // the same four as Design's tokens (src/styles/tx-tokens.css theme A; theme B for focus, answer, mix-up)
  const css = read("src/styles/tx-tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const block = (sel) => { const i = css.indexOf(sel); const body = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i)); return Object.fromEntries([...body.matchAll(/--(tx-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toUpperCase()])); };
  const A = block(':root, [data-tx="a"]'), B = block('[data-tx="b"], :root:where(:has');
  assert.deepEqual([A["tx-focus"], A["tx-ans"], A["tx-mix"], A["tx-move"], A["tx-on-move"]], Object.values(L.DESIGN_ROLES.kagaz));
  assert.deepEqual([B["tx-focus"], B["tx-ans"], B["tx-mix"], B["tx-on-move"]], [L.DESIGN_ROLES.raat.focus, L.DESIGN_ROLES.raat.answer, L.DESIGN_ROLES.raat.mixup, L.DESIGN_ROLES.raat.actionInk]);
});

test("the action hue is outside green in every art, apart from focus / answer / mix-up for a red-green-blind child, and readable", () => {
  for (const a of Object.values(ART)) {
    const h = L.hueOf(a.you);
    assert.ok(L.actionOutsideGreen(a.you), `${a.id} action ${a.you} hue ${h}`);
    for (const k of ["focus", "answer", "mixup"]) {
      const d = apart(a.you, lawColor(a, k));
      assert.ok(d >= 0.15, `${a.id} action ${a.you} and ${k} ${lawColor(a, k)}: ${d.toFixed(3)} < 0.15`);
    }
    // Design's own measure on the three meaning roles (the README's table): still ≥ 0.15 pairwise
    for (const [x, y] of [["focus", "answer"], ["focus", "mixup"], ["answer", "mixup"]]) assert.ok(apart(lawColor(a, x), lawColor(a, y)) >= 0.15, `${a.id} ${x}-${y}`);
    assert.ok(contrast(a.youInk, a.you) >= 4.5, `${a.id} the button's text on the action ${contrast(a.youInk, a.you).toFixed(2)}`);
    // the dark arts' action was chosen here: ≥ 3:1 on the ground (kagaz's marigold is Design's, a filled button whose
    // edge is its text's 8.35:1, measured 1.74:1 on the paper)
    if (a.dark) assert.ok(contrast(a.you, a.ground) >= 3, `${a.id} action on ground ${contrast(a.you, a.ground).toFixed(2)}`);
    for (const k of ["focus", "good", "look", "q1", "q2", "q3", "q4"]) assert.notEqual(a.you.toLowerCase(), a[k].toLowerCase(), `${a.id} action vs ${k}`);
  }
});

test("the action hue is not a painter role: roleColor never returns it and no family view asks for \"you\"", () => {
  for (const a of Object.values(ART)) for (const r of ["q1", "q2", "q3", "q4", "panel", "ink", "ink2", "ink3", "good", "look", "ground2", "focus", "you"]) assert.notEqual(roleColor(a, r), a.you, `${a.id} ${r}`);
  assert.deepEqual(LAW_ROLES, { answer: "good", focus: "focus", mixup: "look" });
  const views = [];
  const walk = (dir) => { for (const e of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) { const rel = path.join(dir, e.name); if (e.isDirectory()) walk(rel); else if (/\.tsx?$/.test(e.name)) views.push(rel); } };
  walk("src/play");
  const hits = [];
  for (const f of views) {
    const src = read(f);
    if (/role:\s*"you"|color\("you"\)|"you" as Role|\b(?:art|a|T)\.you\b(?!Ink)/.test(src) && !f.endsWith("core/styles.ts")) hits.push(f);
    if (/0xcbff4d|#cbff4d|#c2f542|0x5b7a00|#5b7a00/i.test(src)) hits.push(`${f} (lime literal)`);
  }
  assert.deepEqual(hits, [], "a figure or a 3D selection in the action hue");
});

test("negative controls: lime as an action, a moved focus, and a canvas \"you\" are caught", async () => {
  assert.ok(L.tokenBreaks({ ...ART.raat, you: "#CBFF4D" }).some((b) => /green family/.test(b.what)), "raat lime action");
  assert.ok(L.tokenBreaks({ ...ART.chalk, you: "#C2F542" }).some((b) => /green family/.test(b.what)), "chalk lime action");
  assert.ok(L.tokenBreaks({ ...ART.kagaz, you: "#5B7A00" }).length >= 2, "kagaz olive action: not Design's and green");
  assert.ok(L.tokenBreaks({ ...ART.kagaz, focus: "#3B47B1" }).some((b) => /focus/.test(b.what)), "kagaz focus off by one");
  // the painter reports the role asked for, so the law sees a canvas "you" (laws.mjs fails it on every served level)
  const { Painter, newAudit } = await import("../src/play/core/styles.ts");
  const audit = newAudit("kagaz", false), P = new Painter(ART.kagaz, audit, false);
  P.color(/** @type {any} */ ("you"));
  assert.ok(audit.uses.some((u) => u.role === "you"));
});

test("the play chrome carries the same action, its ink and the focus per art, and the [data-tx] block", () => {
  const css = read("src/play/play.css");
  const vars = (sel) => { const i = css.indexOf(sel); assert.ok(i >= 0, sel); const body = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i)); return Object.fromEntries([...body.matchAll(/--(pl-[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim().toUpperCase()])); };
  const base = vars(".pl-root {");
  for (const a of Object.values(ART)) {
    const v = a.id === "kagaz" ? base : { ...base, ...vars(`.pl-root[data-art="${a.id}"] {`) };
    assert.equal(v["pl-you"], a.you.toUpperCase(), `${a.id} --pl-you`);
    assert.equal(v["pl-you-ink"], a.youInk.toUpperCase(), `${a.id} --pl-you-ink`);
    assert.equal(v["pl-focus"], a.focus.toUpperCase(), `${a.id} --pl-focus`);
  }
  const tx = vars("[data-tx] .pl-root.pl-root {");
  assert.equal(tx["pl-you"], "VAR(--TX-MOVE)"); assert.equal(tx["pl-focus"], "VAR(--TX-FOCUS)"); assert.equal(tx["pl-bg"], "VAR(--TX-BG)");
  const txB = vars('[data-tx="b"] .pl-root.pl-root {');
  assert.equal(txB["pl-you"], ART.raat.you.toUpperCase(), "theme B's action is raat's (outside green), not tx-move's lime");
  assert.match(css, /\.pl-btn\[aria-pressed="true"\] \{ outline: 3px solid var\(--pl-focus\)/);
});

test("the 3D engines' selection is the focus token (one token change moves the 2D painter and the engines)", async () => {
  const { THEMES } = await import("../src/play/engines/yantra/palette.ts");
  const num = (hex) => parseInt(hex.slice(1), 16);
  for (const [id, T] of Object.entries(THEMES)) {
    assert.equal(T.focus, num(ART[T.focusArt].focus), `yantra ${id} ring`);
    assert.equal(T.labels.focus, num(ART[T.labelArt].focus), `yantra ${id} label`);
    assert.ok(!("you" in T) && !("you" in T.labels), `yantra ${id} has no "you"`);
  }
  const W = await import("../src/play/engines/antariksh/world.ts");
  assert.equal(W.VOLT, num(ART.raat.focus));
  for (const t of Object.values(W.THEMES)) assert.equal(t.labels.focus, num(ART.raat.focus));
  const khand = read("src/play/engines/khand/scene.ts");
  assert.match(khand, /lawColor\(ART\[WORLD_FOCUS_ART\], "focus"\)/); assert.doesNotMatch(khand, /art\.you\b/);
  assert.match(khand, /new LineBasicMaterial\(\{ color: focus,/, "her cursor"); assert.match(khand, /new MeshBasicMaterial\(\{ color: focus, transparent: true, opacity: 0\.28/, "her drag box");
  const { WORLD_FOCUS_ART } = await import("../src/play/engines/khand/palette.ts");
  assert.ok(WORLD_FOCUS_ART in ART);
});
