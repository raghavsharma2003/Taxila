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
  subjects: [{ subject: "maths", book: "Ganita Prakash", chapters: [{ id: `c${CLS}-maths-ch07`, number: 7, title: "Fractions", sealed: false, here: true, secure: 2, total: 5,
    topics: [{ id: `c${CLS}-maths-ch07-t01`, title: "Fractional units", skills: SKILLS.slice(0, 2) }] }] }],
};

const API = {
  "/api/me": ME,
  "/api/child/boot": { me: ME, plan: PLAN },
  "/api/child/plan": PLAN,
  "/api/child/map": MAP,
  "/api/tutors": { tutors: [], current: "asha" },
  "/api/lesson/list": { lessons: [] },
  "/api/notebook": { items: [] },
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
};

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await ctx.addCookies([{ name: "tx_in", value: "1", url: BASE }]);
    await ctx.addInitScript(() => { try { localStorage.setItem("taxila.child.6fc3f68e-0000-4000-8000-000000000001.prefs", JSON.stringify({ hello: true })); } catch { /* */ } });
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
      const file = join(OUT, `${name}-c${CLS}-${w}x${h}.png`);
      await page.screenshot({ path: file });
      console.log(file, errors.length ? `ERRORS: ${errors.splice(0).join(" | ")}` : "");
    }
    await ctx.close();
  }
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
