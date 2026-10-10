// Round 4 journey audit #12, the 5-step set-up cut (owner-approved via the main session, 2026-10-10): class + board +
// language · promises + 2-s hold · account · consent · the child's name + PIN + "Give the phone to {child}". The
// approval's first condition is checked here: the AI-disclosure card in Hello and the AI-honesty promise stay exactly as
// strong as today (same words, same place, not skippable). Source-level where the file is .tsx (node cannot import it).
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { levelOf, HEARD_LEVEL } from "../src/child/sayHi.ts";

const src = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const code = (s) => s.replace(/\/\/[^\n]*|\/\*[\s\S]*?\*\//g, "");

test("five set-up steps, in the approved order; adding a child is two", () => {
  const layout = code(src("src/onboarding/Layout.tsx"));
  assert.match(layout, /STEPS: readonly Step\[\] = \["class", "promises", "phone", "consent", "child"\]/);
  assert.match(layout, /ADD_STEPS: readonly Step\[\] = \["class", "child"\]/);
  // old links land on a live step
  const routes = code(src("src/onboarding/index.tsx"));
  for (const p of ["lang", "meet", "taste"]) assert.match(routes, new RegExp(`path="${p}" element={<Moved to="/start/class" />}`), p);
  // the language is asked on step 1, with her samples
  const cls = code(src("src/onboarding/steps/Class.tsx"));
  assert.match(cls, /LangTile/);
  assert.match(cls, /ready = !!c\.classLevel && !!c\.board && !!speak/);
});

test("the AI-honesty promise and the 2-s hold are unchanged", () => {
  const consent = src("src/onboarding/Consent.tsx");
  assert.ok(consent.includes("title: `${rec.name} is an AI and says so`"));
  assert.ok(consent.includes("a computer teacher, not a person, at the first hello and whenever asked."));
  assert.match(consent, /<HoldButton block typedWord="parent" showHint onConfirm={\(\) => nav\("\/start\/phone"\)}>Hold to continue<\/HoldButton>/);
});

test("Hello's AI disclosure is unchanged and comes before anything she chooses", () => {
  const copy = src("src/child/copy.ts");
  assert.ok(copy.includes('aiTeacher: "AI teacher"'));
  assert.ok(copy.includes(`aiLine1: "I'm a computer teacher, not a person."`));
  assert.ok(copy.includes('aiLine2: "Your grown-ups can see what we learn."'));
  const hello = code(src("src/child/screens/Hello.tsx"));
  assert.match(hello, /useState<Card>\("greet"\)/, "Hello opens on the greeting");
  assert.match(hello, /if \(card === "greet" && clip\.played\) setCard\("ai"\)/, "the greeting moves to the AI card");
  // the only ways out of the greeting go to the AI card; only "Got it" leaves the AI card
  assert.equal((hello.match(/setCard\("picture"\)/g) ?? []).length, 1);
  assert.match(hello, /onClick={\(\) => setCard\("picture"\)} data-testid="hello-gotit">{t\("gotIt"\)}/);
  assert.doesNotMatch(hello.slice(hello.indexOf('case "greet"'), hello.indexOf('case "ai"')), /finish\(|setCard\("(picture|likes|change|hi)"\)/);
  // she picks what she likes when the parent chose none; then "say hi" (Skip always there); then the lesson
  assert.match(hello, /afterPicture = \(\) => setCard\(parentPicks\.length \? "likes" : "change"\)/);
  assert.match(hello, /afterLikes = \(picks: string\[\]\) => { setLikes\(picks\); setCard\("hi"\); }/);
  const hi = hello.slice(hello.indexOf('case "hi"'));
  assert.match(hi, /data-testid="hello-skip"/);
  assert.match(hello, /if \(r === "none"\) setPrefs\({ quiet: true }\)/, "no mic: this device starts in tap-and-type");
});

test("step 5 writes the child, then the controls, then the PIN, locks, and hands over to Hello", () => {
  const s = code(src("src/onboarding/ChildProfile.tsx"));
  const at = (re) => { const m = s.search(re); assert.ok(m >= 0, String(re)); return m; };
  const child = at(/postJson<{ child: { id: string } }>\("\/api\/children"/);
  const controls = at(/postJson\("\/api\/parent\/controls"/);
  const pinLast = at(/postJson\("\/api\/parent\/pin", { pin: pin1 }\)/);
  const lock = at(/lockBeacon\(\);/);
  const go = at(/nav\(later \? "\/parent" : `\/c\/\${child\.id}\/hello`\)/);
  assert.ok(child < controls && controls < pinLast && pinLast < lock && lock < go, "child → controls → PIN → lock → Hello");
  assert.match(s, /Give the phone to \${first}/);
  assert.match(s, /\.\.\.defaultsFor\(cl\)/, "the daily time and hours are the class defaults");
  // the defaults the cut no longer asks
  assert.match(s, /address: classLevel <= 5 \? "tum" as const : "aap" as const/);
  assert.match(s, /schoolMedium: languagePref === "hindi" \? "hindi" : "english"/);
  // a parent with a PIN (adding a child) sees no pad; a stale sign-in needs the password before the first PIN
  assert.match(s, /hasPin === false && \(/);
  assert.match(s, /pin: pin1, password/);
});

test("say hi: the level and the threshold are the set-up check's", () => {
  assert.equal(HEARD_LEVEL, 0.04);
  assert.equal(levelOf(new Uint8Array(64).fill(128)), 0);
  assert.ok(levelOf(Uint8Array.from({ length: 64 }, (_, i) => (i % 2 ? 160 : 96))) > HEARD_LEVEL);
  const check = code(src("src/onboarding/Check.tsx"));
  assert.match(check, /import { levelOf } from "\.\.\/child\/sayHi\.ts"/, "one RMS for both");
  const hi = code(src("src/child/sayHi.ts"));
  assert.match(hi, /if \(ended\) return;/, "the stream closes once (the #15 page error)");
  assert.match(hi, /if \(ctx\.state !== "closed"\) void ctx\.close\(\)\.catch/);
});

test("migration 028 moves the column defaults to 06:30-21:30 and leaves saved rows alone", () => {
  const sql = code(src("db/migrations/028_child_controls_hours_default.sql").replace(/--[^\n]*/g, ""));
  assert.match(sql, /alter column hours_start set default '06:30'/);
  assert.match(sql, /alter column hours_end set default '21:30'/);
  assert.doesNotMatch(sql, /\bupdate\b/i);
});
