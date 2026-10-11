// Release 11 stream 5 (dc-r4-volt-everywhere): set-up and sign-in wear K's Volt identity. Presentation only:
// the same five steps, fields, validation and consent words. Source-level (the onboarding is .tsx).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const css = src("src/onboarding/volt.css");
const rules = css.replace(/\/\*[\s\S]*?\*\//g, "");

test("every set-up screen is scoped Volt night with K's tokens (StepFrame is the one frame)", () => {
  const layout = src("src/onboarding/Layout.tsx");
  assert.match(layout, /className="onb onb-v2 kx onb-volt" \{\.\.\.VOLT_NIGHT\}/);
  assert.match(layout, /VOLT_NIGHT = \{ "data-klook": "volt", "data-ktheme": "night" \}/);
  assert.match(layout, /import "\.\.\/ui-v3\/kaksha\/tokens\.css"/);
  for (const f of ["Account.tsx", "Forgot.tsx", "Consent.tsx", "ChildProfile.tsx", "steps/Class.tsx"]) assert.match(src(`src/onboarding/${f}`), /<StepFrame/, f);
  assert.match(layout, /STEPS: readonly Step\[\] = \["class", "promises", "phone", "consent", "child"\]/, "the same five steps");
});

test("volt.css: no colour literal, no font host; only K's tokens and color-mix of them", () => {
  assert.doesNotMatch(rules, /#[0-9a-fA-F]{3,8}\b/, "no hex");
  assert.doesNotMatch(rules, /\b(rgba?|hsla?|oklch|lab)\(/, "no rgb/hsl literal");
  assert.doesNotMatch(rules, /@import|@font-face|url\(/, "no font host or remote asset");
  for (const m of rules.matchAll(/var\(--([a-z0-9-]+)/g)) assert.ok(/^(k-|onb-|nib|on-nib|d4|focus)/.test(m[1]) || m[1] === "k-sans", `token ${m[1]}`);
});

test("one lime element per screen: lime is the primary action only", () => {
  // the PIN pad's OK, the brand mark, the promise icons and a disabled primary are re-pointed off lime
  assert.match(rules, /\.pin-key\.btn-primary \{[^}]*background: color-mix\(in srgb, var\(--k-ion\)/);
  assert.match(rules, /\.brand \{ --nib: var\(--k-ion\)/);
  assert.match(rules, /\.promise-icon \{ background: color-mix\(in srgb, var\(--k-ion\)/);
  assert.match(rules, /\.btn-primary:disabled[^{]*\{[^}]*background: var\(--k-bar\)/);
  // the only declarations that paint --k-move are the primary action and the v2 --nib re-point it feeds
  const lime = [...rules.matchAll(/([^{}]+)\{[^}]*var\(--k-move\)[^}]*\}/g)].map((m) => m[1].trim());
  for (const sel of lime) assert.ok(/btn-primary|\.kx\.onb-volt/.test(sel), `lime outside the primary: ${sel}`);
});

test("the moments that face the child use her family look; the floors hold", () => {
  const layout = src("src/onboarding/Layout.tsx");
  assert.match(layout, /kidLook = \(classLevel: number \| undefined\) =>\s*\(\{ "data-klook": "volt", "data-ktheme": kakshaThemeFor\(familyOf\(bandForClass\(classLevel \?\? 5\)\)\) \}\)/);
  assert.match(src("src/onboarding/steps/Class.tsx"), /<section className="kx onb-volt onb-kid" \{\.\.\.kidLook\(c\.classLevel\)\}>/);
  assert.match(src("src/onboarding/ChildProfile.tsx"), /<section className="kx onb-volt onb-kid" \{\.\.\.kidLook\(cl\)\}>/);
  // text >= 14 px: every px font size in the layer
  for (const m of rules.matchAll(/(\d+)px\/[\d.]+ var\(--k-(sans|mono)\)|font-size: (\d+)px/g)) assert.ok(Number(m[1] ?? m[3]) >= 14, m[0]);
  // the decorative » is not part of the button's accessible name
  assert.match(rules, /content: "»" \/ ""/);
  // "I am a student": a 48 px ghost button, same words, same destination (main's review)
  assert.match(src("src/onboarding/steps/Class.tsx"), /<Link to="\/start\/student" className="btn btn-secondary onb-ghost" data-testid="i-am-student">I am a student<\/Link>/);
  assert.match(rules, /\.onb-ghost \{[^}]*min-height: 48px/);
  // the title takes focus but draws no box
  assert.match(rules, /\.onb-title:focus-visible \{ outline: none/);
});

test("consent and the AI-honesty promise: word for word", () => {
  const consent = src("src/onboarding/Consent.tsx");
  for (const s of ["What Taxila may do", "Agree and continue", "a computer teacher, not a person, at the first hello and whenever asked.",
    "We do not use your child's data for research now. If that changes, we will ask you here first."])
    assert.ok(consent.includes(s) || consent.includes(s.replace("'", "’")), s);
  assert.ok(consent.includes("title: `${rec.name} is an AI and says so`"));
});
