// RS-1 babyish-copy / visual lint for the ages 9-15 design system (DESIGN-V3 §1.2, §3, §7; RESET-PLAN RS-1 step 3;
// owner reset R1, R9, R10, R11, O-R1). Gates src/ui-v3/** today; after integration the same rules extend to src/** and the
// copy tables (PATCH 02 widens SCAN_ROOTS). Run: node --test tests/ui-v3-lint.test.mjs
//
// What it checks (each rule has a negative control below that must trip it):
//   L-WORDS     banned babyish / gimmick words in user-visible text (string literals + JSX text, comments excluded)
//   L-EXCLAIM   exclamation chains ("!!") or more than one "!" per file's visible text
//   L-EMOJI     emoji anywhere in visible text
//   L-MACHINE   build / generation / loading / error copy in visible text (R9: the child never learns things are built)
//   L-TALK      click-to-speak copy or imports (R10: hands-free; the mic is a readout)
//   L-NATIVE    native date/time pickers (R11)
//   L-RASTER    raster image or portrait references (O-R1: in-house face slot only, never the mockup portraits)
//   L-MASCOT    mascot / cartoon-animal asset words in code
//   L-FONT      bubbly or storybook fonts
//   L-CANDY     primary-candy colours; any colour within 12° of volt's hue except volt itself (one-volt law)
//   L-NAME      didi / bhaiya appended to a custom teacher name
//   L-ARTIFACT  overflow auto/scroll on any stage / artifact selector (DESIGN-V3 §6.2)
//   T-MIRROR    tokens.css mirrors every tokens.ts value; T-CONTRAST every TEXT_PAIRS pair ≥ 5:1 in Night and Day
//   S-FLOOR     AI disclosure on teacher surfaces; Childline 1098 and Tele-MANAS 14416 digit-exact where shown
//   P-TOAST     the toast predicate passes real-world facts and drops build-state copy
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { lintSource, MACHINE, TALK } from "../src/ui-v3/lint/rules.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const SCAN_ROOTS = (process.env.UI_LINT_ROOTS ?? "src/ui-v3").split(",").map((p) => path.join(ROOT, p.trim()));
const EXT = /\.(tsx?|css|html|mjs|js)$/;

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === "fonts" ? [] : walk(p);
    return EXT.test(e.name) ? [p] : [];
  });
}

// The predicate itself and the kit's deliberate blocked-toast demo name machinery words by design.
const ALL_RULES = ["L-WORDS", "L-EXCLAIM", "L-EMOJI", "L-MACHINE", "L-TALK", "L-NATIVE", "L-RASTER", "L-MASCOT", "L-FONT", "L-CANDY", "L-NAME", "L-ARTIFACT"];
// The rule definitions themselves (they must spell the banned patterns) are exempt.
const FILE_ALLOW = { "src/ui-v3/toast.ts": ["L-MACHINE", "L-WORDS"], "src/ui-v3/lint/rules.mjs": ALL_RULES };

const files = SCAN_ROOTS.flatMap(walk);
const rel = (f) => path.relative(ROOT, f);

test("the scan covers the v3 tree", () => {
  assert.ok(files.length >= 20, `expected ≥ 20 files under ${SCAN_ROOTS.map(rel)}, found ${files.length}`);
});

test("L-* babyish / visual lint: 0 hits across the scanned tree", () => {
  const all = [];
  for (const f of files) {
    const allow = FILE_ALLOW[rel(f)] ?? [];
    for (const h of lintSource(fs.readFileSync(f, "utf8"), f)) if (!allow.includes(h.rule)) all.push(`${rel(f)}:${h.line} ${h.rule} ${h.text}`);
  }
  if (process.env.UI_LINT_REPORT) fs.writeFileSync(process.env.UI_LINT_REPORT, JSON.stringify({ files: files.length, hits: all }, null, 1));
  assert.deepEqual(all, [], `\n${all.join("\n")}`);
});

test("negative controls: every rule trips on a seeded bad sample", () => {
  const bad = {
    "L-WORDS": `<p>Great job, superstar</p>`,
    "L-EXCLAIM": `const a = "Nice!!";`,
    "L-EMOJI": `const a = "Done \u{1F389}";`,
    "L-MACHINE": `<span>Generating your game…</span>`,
    "L-TALK": `<p>Tap the mic to speak</p>`,
    "L-NATIVE": `<input type="time" />`,
    "L-RASTER": `<img src="img/teacher-ira.webp" />`,
    "L-MASCOT": `import owl from "./mascot.svg";`,
    "L-FONT": `const f = "Fredoka One";`,
    "L-CANDY": `const c = "#FF0000"; const d = "#B5E61D";`,
    "L-NAME": "const t = `${teacherName} didi`;",
  };
  for (const [rule, src] of Object.entries(bad)) {
    const hits = lintSource(src, "neg.tsx").map((h) => h.rule);
    assert.ok(hits.includes(rule), `${rule} did not trip on ${src} (got ${hits.join(",") || "nothing"})`);
  }
  const css = lintSource(`.v3-stage-slot { overflow: auto; }`, "neg.css").map((h) => h.rule);
  assert.ok(css.includes("L-ARTIFACT"));
  // and comments never count
  assert.deepEqual(lintSource(`// Yay!! superstar loading 🎉 <input type="time">\nconst ok = 1;`, "c.tsx").filter((h) => h.rule !== "L-NATIVE"), []);
  // inline allow works
  assert.deepEqual(lintSource(`// lint-allow:L-MACHINE\nconst m = "Generating";`, "a.tsx"), []);
});

test("T-MIRROR: tokens.css carries every tokens.ts value for both themes", async () => {
  const t = await import(path.join(ROOT, "src/ui-v3/tokens.ts"));
  const css = fs.readFileSync(path.join(ROOT, "src/ui-v3/tokens.css"), "utf8").toLowerCase().replace(/\s+/g, " ");
  const kebab = (k) => "--" + k.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/([a-z])(\d)/g, "$1-$2");
  const night = css.slice(css.indexOf(".v3 {"), css.indexOf(".v3[data-theme"));
  const day = css.slice(css.indexOf(".v3[data-theme"));
  const missing = [];
  for (const [name, block, pal] of [["night", night, t.NIGHT], ["day", day, t.DAY]]) {
    for (const [k, v] of Object.entries(pal)) {
      const decl = `${kebab(k)}: ${String(v).toLowerCase()}`;
      if (!block.includes(decl)) missing.push(`${name} ${decl}`);
    }
  }
  assert.deepEqual(missing, []);
});

test("T-CONTRAST: every text pair ≥ 5:1 in Night and Day", async () => {
  const t = await import(path.join(ROOT, "src/ui-v3/tokens.ts"));
  const fails = [];
  const rows = [];
  for (const theme of ["night", "day"]) {
    const P = t.THEMES[theme];
    for (const [fg, bg, where] of t.TEXT_PAIRS) {
      // translucent grounds (glass) are composited over the stage background first
      const ground = t.parseColor(P[bg])[3] < 1 ? `rgb(${t.over(P[bg], P.stageBg).join(",")})` : P[bg];
      const c = t.contrast(P[fg], ground);
      rows.push([theme, fg, bg, c.toFixed(2)]);
      if (c < 5) fails.push(`${theme} ${fg} on ${bg} (${where}) = ${c.toFixed(2)}`);
    }
  }
  if (process.env.UI_CONTRAST_REPORT) fs.writeFileSync(process.env.UI_CONTRAST_REPORT, JSON.stringify(rows));
  assert.deepEqual(fails, []);
});

test("S-FLOOR: AI disclosure on every teacher surface; helplines digit-exact", () => {
  const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
  for (const p of ["src/ui-v3/Stage.tsx", "src/ui-v3/screens/Onboarding.tsx", "src/ui-v3/screens/common.tsx", "src/ui-v3/screens/Home.tsx"]) {
    assert.match(read(p), /AI teacher/, `${p} names the teacher without "AI teacher"`);
  }
  for (const p of ["src/ui-v3/screens/ParentCorner.tsx", "src/ui-v3/screens/LessonShell.tsx"]) {
    const s = read(p);
    assert.match(s, /Childline (<b[^>]*>)?1098/, `${p}: Childline 1098`);
    assert.match(s, /Tele-MANAS (<b[^>]*>)?14416/, `${p}: Tele-MANAS 14416`);
  }
  // no near-miss helpline digits anywhere in the tree
  for (const f of files) assert.doesNotMatch(fs.readFileSync(f, "utf8"), /\b(1099|1089|14414|14461|14146)\b/, rel(f));
});

test("P-TOAST: real-world facts pass, build state never renders", async () => {
  const t = await import(path.join(ROOT, "src/ui-v3/toast.ts"));
  const ok = ["Moved to Tue 6 Oct · 5:30 PM", "You're offline. She'll pick up where you left off.", "Mic is off. Type, or turn it on.", "Saved"];
  const no = ["Generating your game…", "Loading lesson", "Build failed", "Something went wrong", "AI is thinking", "Making this for you", "Server error 500", "Please wait", "Retry", "Nice!!", "Done \u{1F389}", "Oops, try again later"];
  for (const s of ok) assert.equal(t.toastAllowed(s).ok, true, s);
  for (const s of no) assert.equal(t.toastAllowed(s).ok, false, s);
  t._resetToastsForTests();
  assert.equal(t.pushToast("info", "Generating your game…"), 0);
  assert.ok(t.pushToast("saved", "Saved") > 0);
  assert.equal(t.blockedToastCount(), 1);
});

test("floor map: no state shows machinery; volt only where the spec puts it", async () => {
  const f = await import(path.join(ROOT, "src/ui-v3/floor.ts"));
  for (const s of f.ALL_FLOORS) {
    const v = f.floorView(s);
    assert.doesNotMatch(`${v.title} ${v.sub} ${v.tag}`, MACHINE, s);
    assert.doesNotMatch(`${v.title} ${v.sub}`, TALK, s);
    if (v.cue) assert.ok(["handover", "yielding"].includes(s), `${s} lights the cue`);
  }
  assert.equal(f.floorView("child_turn").wave, "volt");
  assert.equal(f.floorView("her_turn").ring, true);
  assert.equal(f.floorView("overlap").ring, false, "barge-in: ring off immediately");
  assert.equal(f.floorView("committed").tag, "Thinking");
  assert.equal(f.floorView("idle", { watching: true }).tag, "Watching");
  assert.match(f.floorView("her_turn", { muted: true }).title, /Mic off/);
});
