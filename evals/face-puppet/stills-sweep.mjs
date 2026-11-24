// Round 7 face (independent of the look decision): which face does every surface that shows her actually paint?
// One Asha on every surface: her live rig, or a still rendered FROM the rig (the look's rest poster
// /face-puppet/<look>/rest-*.webp, its light-mouth sprites, or a pose still /assets/teacher/asha-stills/<rev>/<look>-*.webp),
// never another face (TutorFace's Plate2D vector, an old portrait).
// Production build with dev routes, every /api/* the surfaces need mocked (one class-6 child, Asha, the r8 look), headless
// Chromium (SwiftShader), phone viewport. Per surface: every [data-face] host (its kind, phase, look, the images it
// paints, whether a live canvas is in it), every other image whose URL names the teacher, and a screenshot.
// A surface PASSES when it shows at least one face and every face it shows is the rig or a rig still.
//   node evals/face-puppet/stills-sweep.mjs [--dist <dir>] [--out <dir>]
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, execFileSync } from "node:child_process";
import { chromium } from "playwright";

const ROOT = new URL("../..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const OUT = arg("--out", path.join(ROOT, "docs/design/round7/face/stills-sweep"));
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-r7-face-sweep-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "1" } });
}
fs.mkdirSync(OUT, { recursive: true });
const PORT = await new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist, DATABASE_URL: "" }, stdio: "ignore" });
for (let i = 0; i < 100; i++) { try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 150)); }

const kid = { id: "c-kabir", first_name: "Kabir", class_level: 6, board: "cbse", language_pref: "english", teacher_id: "asha", teacher_name: null, avatar: "rocket", interests: ["Football"] };
const TEACHER = { id: "asha", name: "Asha", characterName: "Asha", pronouns: { subject: "she", object: "her", possessive: "her" } };
const plan = { state: "start", homeState: "default", plan: { openLesson: null }, topic: null, resume: null, today: null, capRemaining: 20, teacher: TEACHER, surfaces: { map: true }, source: { dayPlan: null } };

/** The surfaces that show her. `prefs` seeds the child's local prefs (hello seen, or not). */
const SURFACES = [
  { name: "landing", url: "/" },
  { name: "onboarding-start", url: "/start" },
  { name: "who", url: "/who" },
  { name: "hello", url: `/c/${kid.id}/hello`, prefs: { hello: false } },
  { name: "home", url: `/c/${kid.id}` },
  { name: "teacher", url: `/c/${kid.id}/teacher` },
  { name: "me", url: `/c/${kid.id}/me` },
  { name: "map", url: `/c/${kid.id}/map` },
  { name: "ask", url: `/c/${kid.id}/ask` },
  { name: "notebook", url: `/c/${kid.id}/notebook` },
  { name: "lesson-desk", url: "/dev/desk?live=1&band=b3&face=live" },
  { name: "lesson-summary", url: "/dev/desk?fixture=summary&band=b3&face=live" },
  { name: "lesson-help", url: "/dev/desk?fixture=help&band=b3&face=live" },
  { name: "lesson-trouble", url: "/dev/desk?fixture=T1&band=b3&face=live" },
  { name: "parent", url: "/parent" },
];

/** Is this image URL a rig face (pack poster, light-mouth sprite, pose still rendered from the rig)? */
const RIG = /\/face-puppet\/[a-z0-9]+\/(rest-(medium|close)|lite\/[a-z]+)\.webp|\/assets\/teacher\/asha-stills\/\d+\/[a-z0-9]+-[a-z]+\.webp/;
/** Does a URL name the teacher at all (an image of her that is not a rig still is a straggler)? */
const HER = /asha|teacher|tutor|face-puppet/i;

async function one(browser, s) {
  const ctx = await browser.newContext({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(([k, prefs]) => { localStorage.setItem(`taxila.child.${k}.prefs`, JSON.stringify(prefs)); }, [kid.id, s.prefs ?? { hello: true }]);
  await ctx.route("**/api/**", (route) => {
    const p = new URL(route.request().url()).pathname;
    const json = (body, st = 200) => route.fulfill({ status: st, contentType: "application/json", body: JSON.stringify(body) });
    if (p === "/api/face/config") return json({ puppet2d: true, visemes: true, rev: "r8", look: "r8" });
    if (p === "/api/me") return json({ guardian: { id: "g1", email: "p@example.test", name: "P" }, children: [kid] });
    if (p === "/api/child/plan") return json(plan);
    if (p === "/api/tutors/greeting") return json({ error: "none" }, 404);
    return route.continue();
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
  await page.goto(`${BASE}${s.url}${s.url.includes("?") ? "&" : "?"}puppet=1`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4000);
  const r = await page.evaluate(([rigSrc, herSrc]) => {
    const RIG = new RegExp(rigSrc), HER = new RegExp(herSrc, "i");
    const faces = [...document.querySelectorAll("[data-face]")].map((h) => {
      const imgs = [...h.querySelectorAll("img")].map((i) => i.currentSrc || i.src).filter(Boolean).map((u) => new URL(u, location.href).pathname);
      const live = !!h.querySelector("canvas.fp-canvas");
      const kind = h.getAttribute("data-face");
      const rig = kind === "puppet2d" && (live || imgs.some((u) => RIG.test(u)));
      const box = h.getBoundingClientRect();
      return { kind, phase: h.getAttribute("data-phase"), look: h.getAttribute("data-look"), imgs, live, rig, visible: box.width > 0 && box.height > 0 };
    }).filter((f) => f.visible);
    const loose = [...document.querySelectorAll("img")].filter((i) => !i.closest("[data-face]")).map((i) => new URL(i.currentSrc || i.src, location.href).pathname)
      .filter((u) => HER.test(u)).map((u) => ({ url: u, rig: RIG.test(u) }));
    return { path: location.pathname + location.search, faces, loose };
  }, [RIG.source, HER.source]);
  await page.screenshot({ path: path.join(OUT, `${s.name}.png`) });
  await ctx.close();
  const shown = r.faces.length + r.loose.length;
  const stragglers = [...r.faces.filter((f) => !f.rig).map((f) => `face ${f.kind}/${f.phase} ${f.imgs.join(" ") || "(no image)"}`), ...r.loose.filter((l) => !l.rig).map((l) => `image ${l.url}`)];
  return { surface: s.name, url: s.url, landed: r.path, shows: shown, pass: shown > 0 && stragglers.length === 0, stragglers, faces: r.faces, loose: r.loose, errors };
}

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
const rows = [];
try {
  for (const s of SURFACES) {
    const r = await one(browser, s);
    rows.push(r);
    console.log(`${r.pass ? "PASS" : r.shows ? "FAIL" : "NONE"} ${r.surface.padEnd(16)} faces=${r.faces.length} loose=${r.loose.length}${r.stragglers.length ? "  " + r.stragglers.join(" | ") : ""}${r.errors.length ? "  errors: " + r.errors.join(" / ") : ""}`);
  }
} finally {
  await browser.close();
  srv.kill();
}
fs.writeFileSync(path.join(OUT, "sweep.json"), JSON.stringify({ at: new Date().toISOString(), look: "r8", rows }, null, 1));
