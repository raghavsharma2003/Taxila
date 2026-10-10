// K1: the Kaksha Desk skin (patch K-P2) and the Debrief (BUILD-SPEC §3.3, §3.5). Static and pure checks; the rendered
// checks (sizes, contrast, Pause → 1098 / 14416 on screen, the lamp, "Now secure") are tests/prod/r4-kaksha-desk-shots.mjs.
// Run: node --test tests/r4-kaksha-desk.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { nowSecure } from "../src/ui-v3/kaksha/lesson/debrief.ts";

const ROOT = new URL("..", import.meta.url).pathname;
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
const CAT = JSON.parse(read("data/kaksha/catalog.json"));
const K = (id, state, title = id, subject = "maths") => ({ skillId: id, title, subject, state });

test("TRUTH: Now secure = secure at the end AND not secure at the start; nothing else", () => {
  const before = { skills: [K("a", "secure"), K("b", "got_it", "Equivalent fractions"), K("c", "practising"), K("d", "got_it")] };
  const after = { skills: [K("a", "secure"), K("b", "secure", "Equivalent fractions"), K("c", "got_it"), K("d", "got_it")] };
  const s = nowSecure(before, after, CAT);
  assert.deepEqual(s.map((x) => x.skillId), ["b"], "only the crossing; today's first success (c → got_it) never shows");
  assert.equal(s[0].title, "Equivalent fractions");
  assert.ok(s[0].structure, "the structure it raises is named");
});

test("TRUTH: unknown is not none: a failed, empty or private read claims nothing", () => {
  const after = { skills: [K("a", "secure")] };
  assert.equal(nowSecure(null, after, CAT), null);
  assert.equal(nowSecure({ skills: [] }, after, CAT), null, "an empty 'before' (a failed read) would make every secure skill look new");
  assert.equal(nowSecure({ hidden: true, skills: [] }, after, CAT), null);
  assert.equal(nowSecure({ skills: [K("a", "got_it")] }, null, CAT), null);
  assert.equal(nowSecure({ skills: [K("a", "got_it")] }, { hidden: true, skills: [] }, CAT), null);
});

test("TRUTH property: over random maps, Now secure is exactly the set difference (0 false secure)", () => {
  const STATES = ["not_started", "practising", "got_it", "secure"];
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  for (let i = 0; i < 300; i++) {
    const ids = Array.from({ length: 1 + Math.floor(rnd() * 14) }, (_, j) => `c6-maths-ch0${j % 9}-t0${j}-s1`);
    const before = { skills: ids.map((id) => K(id, STATES[Math.floor(rnd() * 4)])) };
    // the ledger only moves forward within a session, but the diff must hold for any pair
    const after = { skills: before.skills.map((k) => (rnd() < 0.3 ? { ...k, state: STATES[Math.min(3, STATES.indexOf(k.state) + 1)] } : k)) };
    const s = nowSecure(before, after, CAT);
    const want = after.skills.filter((k) => k.state === "secure" && !before.skills.some((b) => b.skillId === k.skillId && b.state === "secure")).map((k) => k.skillId).sort();
    assert.deepEqual(s.map((x) => x.skillId).sort(), want);
    for (const x of s) assert.equal(after.skills.find((k) => k.skillId === x.skillId).state, "secure");
  }
});

test("Debrief and frame: no clock, no randomness, no polling, nothing on the turn path", () => {
  for (const f of ["src/ui-v3/kaksha/lesson/debrief.ts", "src/ui-v3/kaksha/lesson/Debrief.tsx", "src/ui-v3/kaksha/lesson/KakshaLesson.tsx"]) {
    const s = strip(read(f));
    assert.doesNotMatch(s, /Date\.now|new Date\(|Math\.random|performance\.now/, `${f}: clock or randomness`);
    assert.doesNotMatch(s, /setInterval|requestAnimationFrame/, `${f}: a loop`);
    assert.doesNotMatch(s, /\bfetch\(|postJson|\/api\/lesson/, `${f}: a network call of its own (only the injected map read)`);
  }
  // the map is read once at lesson start (useState initialiser) and once when the Debrief shows
  const fr = strip(read("src/ui-v3/kaksha/lesson/KakshaLesson.tsx"));
  assert.match(fr, /const \[before\] = useState\(\(\) => loadMap\(cid\)\)/);
});

test("Debrief keeps the Summary's hooks and the safety floor ('AI teacher' by her name)", () => {
  const s = read("src/ui-v3/kaksha/lesson/Debrief.tsx");
  for (const id of ["summary", "didcards", "finish", "summary-show-yes", "summary-show", "now-secure"]) assert.match(s, new RegExp(`data-testid="${id}"`), id);
  assert.match(s, /<b>\{m\.teacher\.name\}<\/b><span className="kx-ai">\{kt\("aiTeacher"\)\}<\/span>/);
  assert.match(s, /showName=\{false\}/, "the small face does not repeat the name; the header prints it with AI teacher");
  assert.match(s, /disabled=\{s\.ending\}/, "Finish waits while the lesson is being saved, as the Summary does");
  assert.match(s, /const closing = closingLine\(m\.caption\.text, m\.ask\?\.text\);/, "a question or open prompt is never shown as her closing line (tests/r4-kaksha-audit.test.mjs B05)");
});

test("Skin CSS: tokens only, scoped to the Kaksha frame/skin, hides nothing, keeps the lamp on the dock", () => {
  const css = strip(read("src/ui-v3/kaksha/lesson/desk.kaksha.css"));
  assert.doesNotMatch(css, /#[0-9a-fA-F]{3,8}\b/, "no raw hex");
  assert.doesNotMatch(css, /\brgba?\(/, "no raw rgb");
  assert.doesNotMatch(css, /display\s*:\s*none|visibility\s*:\s*hidden|opacity\s*:\s*0\s*[;}]/, "the skin never hides an element");
  // every rule is under the skin or the Kaksha frame: the classic Desk is untouched with the flag off
  const sels = [...css.replace(/@media[^{]*\{/g, "").replace(/@keyframes[^{]*\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, "").matchAll(/([^{}]+)\{[^}]*\}/g)].map((m) => m[1].trim()).filter(Boolean);
  const bad = sels.flatMap((sel) => sel.split(/,(?![^(]*\))/).map((x) => x.trim())).filter((x) => !/^(\.kx\b|\.dk\[data-skin="kaksha"\]|\.kx-debrief|\.kx-db-)/.test(x) && !/^\.kx\[data-ktheme/.test(x) && !/^(0%|60%|100%|from|to)$/.test(x));
  assert.deepEqual(bad, [], "unscoped selectors");
  // the lamp: only the dock carries [data-lamp] styling
  for (const m of css.matchAll(/([^{}]*\[data-lamp\][^{}]*)\{/g)) assert.match(m[1], /data-zone="dock"/, m[1]);
  // the font floor
  for (const m of css.matchAll(/font(?:-size)?\s*:[^;]*?(\d+(?:\.\d+)?)px/g)) assert.ok(+m[1] >= 14, `font ${m[1]}px`);
});

test("K-P2 wiring: Desk takes a skin and an end screen; LessonScreen mounts Kaksha only behind the flag and the cohort", () => {
  const desk = read("src/child/lesson/Desk.tsx");
  assert.match(desk, /"data-skin": skin \|\| undefined/);
  assert.match(desk, /renderSummary \? renderSummary\(\{ m, meters: media\.meters, onFinish: a\.finish \}\) : <Summary /, "absent → today's Summary");
  for (const z of ["teacher", "window", "caption", "card", "tray", "strip", "dock", "top"]) assert.match(desk, new RegExp(`data-zone="${z}"`), z);
  const ls = read("src/child/lesson/LessonScreen.tsx");
  assert.match(ls, /lazy\(\(\) => import\("\.\.\/\.\.\/ui-v3\/kaksha\/lesson\/KakshaLesson\.tsx"\)\)/, "a lazy chunk");
  assert.match(ls, /kakshaEnabled\(\(me as \{ ui\?: \{ kaksha\?: boolean \} \}\)\.ui\?\.kaksha\)/, "the server's cohort answer gates it");
  assert.match(ls, /\) : desk\(\)\}/, "flag off: the Desk with no skin, exactly as before");
});
