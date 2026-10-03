// G-EN-1 / B1-A8 (static half): the shell and lesson chrome is English. No Devanagari, no Hinglish chrome words in
// the copy table or in any chrome string literal of the Desk; no lamp tokens outside the dock; no raw hex outside
// tokens.css; no placeholder strings. Each scan has a negative control that must trip it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { EN, chromeViolation, t } from "../src/ui/copy.ts";

const ROOT = new URL("../", import.meta.url).pathname;
const walk = (dir, out = []) => {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
};

test("copy table: every string passes G-EN-1, no exclamation marks, no dashes as punctuation", () => {
  for (const [k, v] of Object.entries(EN)) {
    assert.equal(chromeViolation(v), null, `${k}: ${v}`);
    assert.ok(!v.includes("!"), `${k} has an exclamation mark`);
    assert.ok(!/\s[—–-]\s/.test(v), `${k} uses a dash`);
  }
  assert.equal(t("help.childline"), "Call Childline 1098");
  assert.equal(t("help.telemanas"), "Call Tele-MANAS 14416");
  assert.equal(t("floor.speaking", { T: "Arjun" }), "Arjun is talking");
});

test("G-EN-1 negative controls trip", () => {
  assert.ok(chromeViolation("Abhyaas"));
  assert.ok(chromeViolation("घर"));
  assert.ok(chromeViolation("Phir se"));
});

const DESK = walk(join(ROOT, "src/child/lesson")).filter((p) => /\.(tsx|ts)$/.test(p) && !p.includes("/dev/"));
// useDesk holds the child's REQUEST phrases (sent to the Director, not chrome); captions.ts splits her SPEECH at the danda.
const DESK_CHROME_FILES = DESK.filter((p) => !/(useDesk|captions)\.ts$/.test(p));

test("Desk sources: no Devanagari in chrome files; no placeholder strings", () => {
  for (const f of DESK_CHROME_FILES) {
    const src = readFileSync(f, "utf8");
    assert.ok(!/[ऀ-ॿ]/.test(src), `${f} has Devanagari`);
    assert.ok(!/coming soon|jald aa rahi|Not available yet|TODO/i.test(src), `${f} has a placeholder`);
  }
});

test("G-LAMP-1 static: lamp tokens appear only on the dock rule; no raw hex outside tokens.css (Desk + ui)", () => {
  const css = walk(join(ROOT, "src")).filter((p) => /\.(css|tsx)$/.test(p));
  for (const f of css) {
    const src = readFileSync(f, "utf8");
    if (f.endsWith("styles/tokens.css")) continue;
    const lamp = src.split("\n").filter((l) => /var\(--lamp/.test(l));
    for (const l of lamp) assert.ok(/dk-dock\[data-lamp\]|\[data-lamp\]/.test(l) || l.includes("dk-dock[data-lamp]"), `${f}: lamp outside the dock: ${l.trim()}`);
  }
  for (const f of walk(join(ROOT, "src/child/lesson")).concat(walk(join(ROOT, "src/ui"))).filter((p) => /\.(css)$/.test(p))) {
    const src = readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    assert.ok(!/#[0-9a-fA-F]{3,8}\b/.test(src), `${f} has raw hex`);
  }
});

test("G-LAMP-1 negative control: a lamp token on a button is caught by the same rule", () => {
  const line = ".dk-btn { background: var(--lamp); }";
  assert.equal(/dk-dock\[data-lamp\]|\[data-lamp\]/.test(line), false);
});
