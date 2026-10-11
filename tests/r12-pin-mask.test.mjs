// Release 12 packaged-tree check (ms-r12-pin-taps-recorded): the parent PIN pad's keys were recorded as ui.tap labels
// ("2", "5", "8", "0") for every account. The pad is a masked region now, and the recorder must honour it. Static checks
// of the three places that make that true (the DOM-level proof is the packaged-tree journey, re-run after this fix).
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

test("the shared PIN pad is a masked region and an rrweb block", () => {
  const src = read("src/ui/PinPad.tsx");
  assert.match(src, /data-trace-mask="pin"/);
  assert.match(src, /className="pin rr-block"/);
});
test("a tap inside a masked region is recorded only as [masked], before any label is read", () => {
  const src = read("src/trace/hooks.ts");
  const fn = src.slice(src.indexOf("export function describeTarget"));
  const maskAt = fn.indexOf('closest("[data-trace-mask]")'), labelAt = fn.indexOf("getAttribute(\"aria-label\")");
  assert.ok(maskAt > 0 && labelAt > 0 && maskAt < labelAt, "the mask check runs before the label is read");
  assert.match(fn, /label: "\[masked\]"/);
});
test("tier 2's DOM replay blocks masked regions", () => {
  assert.match(read("src/trace/tier2.ts"), /blockSelector: "\[data-trace-block\], \[data-trace-mask\]"/);
});
test("every PIN entry in the app goes through the shared PinPad (no second keypad to mask)", () => {
  for (const f of ["src/parent/Gate.tsx", "src/onboarding/ChildProfile.tsx", "src/onboarding/Setup.tsx", "src/parent/Pages.tsx"]) {
    const src = read(f);
    assert.ok(!/className="pin-key"/.test(src), `${f} draws its own PIN keys`);
  }
});
