// Round 4 · stream 2: the tray under the Kaksha skin (owner directive "modern, futuristic, Gen-Alpha"; main session
// 2026-10-10). One palette source: the board, the stage, the skeletons and the module frame consume Kaksha's --k-*
// tokens; this branch holds none of its own. Checked here without a browser:
//   - the board role mapping (palette.ts kakshaBoardSkin) and its absence without the tokens (today's board stays)
//   - every board ink against the board ground ≥ 5:1 in both themes (Kaksha's bar; the product floor is 4.5:1), on the
//     theme values in the dev mirror of Kaksha's tokens.css (until Kaksha lands on base)
//   - the frame's init only takes --k-* names with safe values (protocol.ts)
//   - the skin's CSS blocks carry no colour literal of their own (studio.css, frame.css)
// The rendered proof (legibility at 360 / 412 / 1366, both families, before / after) is tests/prod/r4-content-skin-shots.mjs.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { kakshaBoardSkin, isNumeric, paletteFor } from "../src/modules/whiteboard/palette.ts";
import { parseHostToModule } from "../src/modules/frame/protocol.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const css = fs.readFileSync(path.join(ROOT, "tests", "fixtures", "kaksha-tokens.mirror.css"), "utf8");
const block = (sel) => { const i = css.indexOf(sel); const b = css.slice(css.indexOf("{", i) + 1, css.indexOf("}", i)); return Object.fromEntries([...b.matchAll(/(--k-[a-z0-9-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])); };
const NIGHT = block('.kx, .kx[data-ktheme="night"]');
const DAWN = { ...NIGHT, ...block('.kx[data-ktheme="dawn"]') };

const lum = (hex) => { const h = hex.replace("#", ""); const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)]; return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

describe("r4: the tray under the Kaksha skin", () => {
  it("the dev mirror is Kaksha's token file (both themes present)", () => {
    assert.match(css, /DEV MIRROR, NOT A TOKEN SET/);
    assert.ok(NIGHT["--k-deep"] && DAWN["--k-deep"] && NIGHT["--k-deep"] !== DAWN["--k-deep"]);
  });
  it("the board maps Kaksha's roles; without the tokens there is no skin (today's board)", () => {
    assert.equal(kakshaBoardSkin(() => "", "chalk"), null);
    const s = kakshaBoardSkin((n) => NIGHT[n] ?? "", "grid");
    assert.equal(s.palette.ground, NIGHT["--k-deep"]);
    assert.equal(s.palette.ink.ink, NIGHT["--k-ink"]);
    assert.equal(s.palette.ink.accent, NIGHT["--k-ion"]);
    assert.equal(s.palette.grid, NIGHT["--k-line"]);
    assert.equal(s.palette.ink.mark, NIGHT["--k-look"], "mark is Kaksha's 'look again' role; --k-her is hers alone (K, 2026-10-10)");
    assert.ok(!Object.values(s.palette.ink).includes(NIGHT["--k-move"]), "the tray never uses the your-move colour");
    assert.equal(kakshaBoardSkin((n) => NIGHT[n] ?? "", "chalk").palette.grid, undefined, "chalk and paper draw no grid");
    assert.match(s.numFont, /Geist Mono|mono/i);
    assert.notEqual(paletteFor("chalk").ground, s.palette.ground, "today's chalkboard stays for everyone else");
    assert.ok(isNumeric("1/2 × 1/2 = 1/4") && isNumeric("?") && !isNumeric("Picture") && !isNumeric("2 groups"));
  });
  for (const [name, T] of [["night (Older)", NIGHT], ["dawn (Young)", DAWN]]) {
    it(`${name}: every board ink is ≥ 5:1 on the board ground`, () => {
      const s = kakshaBoardSkin((n) => T[n] ?? "", "paper");
      const bad = Object.entries(s.palette.ink).map(([k, v]) => [k, Math.round(ratio(v, s.palette.ground) * 100) / 100]).filter(([, r]) => r < 5);
      assert.deepEqual(bad, []);
    });
  }
  for (const [name, T] of [["night (Older)", NIGHT], ["dawn (Young)", DAWN]]) {
    it(`${name}: the skeleton's text pairs (K's roles) are ≥ 5:1`, () => {
      const mix = (a, b, p) => "#" + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * p + parseInt(b.slice(1 + i, 3 + i), 16) * (1 - p)).toString(16).padStart(2, "0")).join("");
      assert.ok(ratio(T["--k-void"], T["--k-ink"]) >= 5, "Check: --k-void on --k-ink");
      assert.ok(ratio(T["--k-ink"], mix(T["--k-ion"], T["--k-raise"], 0.18)) >= 5, "picked: --k-ink on the ion wash over --k-raise");
      assert.ok(ratio(T["--k-ink"], T["--k-raise"]) >= 5, "a button at rest: --k-ink on --k-raise");
    });
  }
  it("the frame takes only --k-* names with safe values from init", () => {
    const m = parseHostToModule({ type: "init", moduleId: "m", engine: "geoboard@1", params: {}, skin: { "--k-deep": "#0A0D16", "--fx-bg": "#fff", "--k-ink": "url(x)", "--k-ion": "red; x:y", "--k-sans": '"Space Grotesk", system-ui' } });
    assert.deepEqual(m.skin, { "--k-deep": "#0A0D16", "--k-sans": '"Space Grotesk", system-ui' });
    assert.equal(parseHostToModule({ type: "init", moduleId: "m", engine: "e", params: {} }).skin, undefined, "no skin: the init is as before");
  });
  it("the skin's CSS holds no colour of its own (one palette source)", () => {
    for (const [file, start] of [["src/studio/studio.css", '[data-skin="kaksha"] .st-stage'], ["src/modules/frame/frame.css", ':root[data-skin="kaksha"]']]) {
      const src = fs.readFileSync(path.join(ROOT, file), "utf8");
      assert.ok(src.includes(start), `${file}: the skin block exists`);
      // every rule whose selector names the skin, and nothing else
      const rules = [...src.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]*)\{([^{}]*)\}/g)].filter((m) => m[1].includes('data-skin="kaksha"')).map((m) => m[2]).join("\n");
      assert.ok(rules.length > 0);
      assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b|rgba?\(/, `${file}: a literal colour in the skin block`);
    }
  });
});
