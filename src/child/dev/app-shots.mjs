// App shots (r7 stream E, never shipped): the REAL child app on the vite dev server with every /api read answered by
// fixtures (Playwright route interception), photographed at 360x800, 412x915 and 1280x800. No server, no DB, no Azure.
//   node src/child/dev/app-shots.mjs [--base http://localhost:5173] [--out <dir>] [--class 6] [--only home,world]
// Start the dev server first: npx vite --port 5173
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://localhost:5173");
const OUT = arg("out", "shots");
const CLS = Number(arg("class", "6"));
const ONLY = arg("only", "")?.split(",").filter(Boolean) ?? [];
const SIZES = (arg("sizes", "360x800,412x915,1280x800")).split(",").map((s) => s.split("x").map(Number));
const CID = "6fc3f68e-0000-4000-8000-000000000001";

const ME = {
  guardian: { id: "g1", email: "owner@example.com", name: "Owner" },
  children: [{ id: CID, first_name: "Riya", class_level: CLS, board: "cbse", language_pref: "hinglish", teacher_id: "asha", teacher_name: null, avatar: "fox", interests: ["cricket", "space"] }],
  ui: { kaksha: true },
};
const PLAN = {
  state: "start", topic: { id: `c${CLS}-maths-ch07-t01`, title: "Fractions", shortTitle: "Fractions", chapter: "Fractions", subject: "maths", minutes: 15 },
  resume: null, did: [], tried: null, opensAt: null, surfaces: { map: true, notebook: true, resume: true }, packReady: false, madeFor: [], textOnly: false,
};
// --plan start|done|homework|test_window|capped|resting (r7 app-home-plan-states)
const PLAN_STATE = arg("plan", "start");
PLAN.state = PLAN_STATE;
if (PLAN_STATE === "done") {
  PLAN.today = { lessonId: "l1", summary: { cards: [{ ask: "How many quarters make one half?", answer: "two", verified: true, withHelp: false }], tried: 3, nextTopic: null } };
  PLAN.madeFor = [{ id: "m1", kind: "game", title: "Fraction pizza", topicTitle: "Fractions", at: "2026-11-04T10:00:00Z", still: null, because: null }];
}
if (PLAN_STATE === "homework") PLAN.homework = { until: "20:00" };
if (PLAN_STATE === "test_window") PLAN.testWindow = { subject: "science", from: "2026-11-05", to: "2026-11-08" };
if (PLAN_STATE === "start") PLAN.jar = { waiting: 2 };
if (PLAN_STATE === "resting") PLAN.opensAt = "16:00";
const skill = (id, title, subject, state) => ({ skillId: id, title, subject, state });
const SKILLS = [
  skill(`c${CLS}-maths-ch07-t01-s1`, "Fractional units and equal shares", "maths", "secure"),
  skill(`c${CLS}-maths-ch07-t03-s1`, "Equivalent fractions", "maths", "secure"),
  skill(`c${CLS}-maths-ch02-t01-s1`, "Angles and how to measure them", "maths", "secure"),
  skill(`c${CLS}-science-ch04-t01-s1`, "Magnets and their poles", "science", "secure"),
  skill(`c${CLS}-english-ch01-t01-s1`, "Summarising a story", "english", "got_it"),
];
const MAP = {
  mode: "sky", hidden: false, empty: false, skills: SKILLS,
  subjects: [{ subject: "maths", book: "Ganita Prakash", chapters: [{ id: `c${CLS}-maths-ch07`, number: 7, title: "Fractions", sealed: false, here: true, school: true, secure: 2, total: 5,
    topics: [{ id: `c${CLS}-maths-ch07-t01`, title: "Fractional units", skills: SKILLS.slice(0, 2) }] },
    { id: `c${CLS}-maths-ch02`, number: 2, title: "Lines and Angles", sealed: true, here: false, school: false, secure: 1, total: 1,
      topics: [{ id: `c${CLS}-maths-ch02-t01`, title: "Angles", skills: SKILLS.slice(2, 3) }] }] }],
};

const API = {
  "/api/me": ME,
  // the set-up's child step asks whether a parent PIN exists (r7 to-app/007 review shots)
  "/api/parent/pin": { hasPin: false },
  "/api/child/boot": { me: ME, plan: PLAN },
  "/api/child/plan": PLAN,
  "/api/child/map": MAP,
  "/api/tutors": { tutors: [], current: "asha" },
  "/api/lesson/list": { lessons: [] },
  "/api/notebook": { items: [] },
  "/api/studio/made-for": { cards: [
    { id: "m1", title: "Fraction pizza", kind: "game", topicId: `c${CLS}-maths-ch07-t01`, at: "2026-11-05T10:05:00Z", replay: null },
    { id: "m2", title: "Halves and quarters", kind: "animation", topicId: `c${CLS}-maths-ch07-t01`, at: "2026-11-04T10:09:00Z", replay: null },
    { id: "m3", title: "Magnet tug", kind: "game", topicId: `c${CLS}-science-ch04-t01`, at: "2026-11-02T09:00:00Z", replay: null },
  ] },
  "/api/child/jar": { items: [
    { id: "j1", topic: "Why do magnets stick to the fridge?", subject: "science", share: false, at: "2026-11-03T10:00:00Z", state: "waiting", answeredAt: null },
    { id: "j2", topic: "Is zero a fraction?", subject: "maths", share: false, at: "2026-11-04T10:00:00Z", state: "waiting", answeredAt: null },
    { id: "j3", topic: "What is half of a half?", subject: "maths", share: false, at: "2026-11-01T10:00:00Z", state: "answered", answeredAt: "2026-11-04T10:20:00Z" },
  ] },
  "/api/voice/transcribe": { text: "Why does a magnet not stick to a steel spoon?", asrConfidence: 0.92 },
  "/api/homework/match": { match: { rung: "topic", topicId: `c${CLS}-maths-ch07-t01`, subject: "maths", chapter: 7, topicTitle: "Fractions" } },
  "/api/child/memory": arg("memory", "on") === "off" ? { keeps: false, items: [] } : { keeps: true, items: [
    { id: "11", text: "I like bowling more than batting.", at: "2026-11-03T10:00:00Z" },
    { id: "12", text: "My cat is called Chiku.", at: "2026-10-30T10:00:00Z" },
  ] },
  "/api/studio/notebook": arg("notebook", "1") === "0" ? { hidden: false, pages: [] } : { hidden: false, pages: [
    { lessonId: "l2", topicId: `c${CLS}-maths-ch07-t03`, title: "Equivalent fractions", startedAt: "2026-11-04T10:00:00Z", ended: true, boards: 3, first: null },
    { lessonId: "l1", topicId: `c${CLS}-maths-ch07-t01`, title: "Fractional units", startedAt: "2026-11-03T10:00:00Z", ended: true, boards: 1, first: null },
  ] },
};

export const SCREENS = {
  home: `/c/${CID}`,
  world: `/c/${CID}/map`,
  hangar: `/c/${CID}/hangar`,
  notebook: `/c/${CID}/notebook`,
  ask: `/c/${CID}/ask`,
  me: `/c/${CID}/me`,
  practice: `/c/${CID}/practice`,
  teacher: `/c/${CID}/teacher`,
  hello: `/c/${CID}/hello`,
  who: `/who`,
  homework: `/c/${CID}/ask?homework=1`,
  station: `/c/${CID}/map`,
  "ask-heard": `/c/${CID}/ask`,
  "notebook-made": `/c/${CID}/notebook?made=m1`,
  "notebook-jar": `/c/${CID}/notebook`,
  // r7 onboarding sweep: the parent set-up (Learning's src/onboarding, shot for review) and the child's first meeting
  "start-class": `/start/class`, "start-promises": `/start/promises`, "start-phone": `/start/phone`, "start-child": `/start/child`,
  "start-controls": `/start/controls`, "start-handover": `/start/handover`, "start-student": `/start/student`,
  "hello-ai": `/c/${CID}/hello`, "hello-picture": `/c/${CID}/hello`, "hello-likes": `/c/${CID}/hello`, "hello-feel": `/c/${CID}/hello`, "hello-hi": `/c/${CID}/hello`,
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  // a fake mic (Ask "Say it"): the permission is granted and the device is Chromium's test tone
  const browser = await chromium.launch({ args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream"] });
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await ctx.addCookies([{ name: "tx_in", value: "1", url: BASE }]);
    await ctx.grantPermissions(["microphone"], { origin: BASE }).catch(() => {});
    await ctx.addInitScript(() => { try { localStorage.setItem("taxila.child.6fc3f68e-0000-4000-8000-000000000001.prefs", JSON.stringify({ hello: true })); } catch { /* */ } });
    // r7 (to-app/007): the set-up's child step needs its draft (class chosen, a first name) or it goes back to the class step
    if (ONLY?.includes?.("start-child")) await ctx.addInitScript((cls) => { try { localStorage.setItem("tx.onboarding", JSON.stringify({ child: { classLevel: cls, firstName: "Riya" }, parentView: { maths: "hard" } })); } catch { /* */ } }, Number(CLS));
    await ctx.route("**/api/**", (route) => {
      const u = new URL(route.request().url());
      const body = API[u.pathname];
      if (body) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) });
      return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const [name, path] of Object.entries(SCREENS)) {
      if (ONLY.length && !ONLY.includes(name)) continue;
      await page.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(900);
      // homework: type a question and ask, so the shot is the "Is this from <topic>?" chip
      // station: the World with a station's sheet open (Practise this)
      if (name === "station") {
        await page.evaluate(() => document.querySelector(".kx-station")?.click()).catch(() => {});
        await page.waitForTimeout(600);
      }
      // Hello steps: click through to the step named (greet → ai → picture → likes/change → hi)
      const STEPS = { "hello-ai": ["hello-hear", "hello-next"], "hello-picture": ["hello-hear", "hello-next", "hello-gotit"], "hello-likes": ["hello-hear", "hello-next", "hello-gotit", "PIC", "hello-thatsme"],
        "hello-feel": ["hello-hear", "hello-next", "hello-gotit", "PIC", "hello-thatsme", "hello-done", "hello-right", "feel-maths-tricky"],
        "hello-hi": ["hello-hear", "hello-next", "hello-gotit", "PIC", "hello-thatsme", "hello-done", "hello-right", "hello-feel-next"] };
      for (const tid of STEPS[name] ?? []) {
        if (tid === "PIC") await page.evaluate(() => document.querySelector('[role="radio"]')?.click()).catch(() => {});
        else await page.evaluate((t) => document.querySelector(`[data-testid="${t}"]`)?.click(), tid).catch(() => {});
        await page.waitForTimeout(350);
      }
      if (name === "start-child") {
        await page.evaluate(() => document.querySelector('[data-testid="onb-feel"]')?.scrollIntoView({ block: "center" })).catch(() => {});
        await page.waitForTimeout(300);
      }
      if (name === "notebook-jar") {
        await page.click('[data-testid="nb-tab-jar"]').catch(() => {});
        await page.waitForTimeout(400);
      }
      if (name === "ask-heard") {
        await page.waitForTimeout(1200);
        await page.evaluate(() => document.querySelector('[data-testid="ask-say-done"]')?.click()).catch(() => {});
        await page.waitForTimeout(1200);
      }
      if (name === "homework") {
        await page.fill("textarea", "Riya ate 3/8 of a pizza and Aman ate 2/8. How much did they eat together?").catch(() => {});
        await page.click('[data-testid="ask-go"]').catch(() => {});
        await page.waitForTimeout(700);
      }
      const file = join(OUT, `${name}${PLAN_STATE !== "start" ? "-" + PLAN_STATE : ""}-c${CLS}-${w}x${h}.png`);
      await page.screenshot({ path: file });
      console.log(file, errors.length ? `ERRORS: ${errors.splice(0).join(" | ")}` : "");
    }
    await ctx.close();
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
