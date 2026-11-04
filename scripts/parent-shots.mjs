// Parent-screen screenshots for a milestone, without a database (round 7 F; main 2026-11-04: "screenshots of the parent
// screens per milestone, as App does"). Serves the built app (dist/, run `npx vite build` first) and answers /api/* from
// fixtures. The report text is the REAL report pipeline (claims → renderer → gate) run on the test fixture child, so what
// the shot shows is what a parent would read for those facts.
//
//   node scripts/parent-shots.mjs [outDir]      → <outDir>/parent-notes-monthly.png, parent-controls-household.png
import { createServer } from "node:http";
import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { dayFacts, SKILLS } from "../tests/fixtures/report-facts.mjs";
import { buildClaims } from "../server/reports/claims.js";
import { renderLang } from "../server/reports/render.js";
import { assemble, laneAOrder } from "../server/reports/writer.js";
import { gateReport } from "../server/reports/gate.js";
import { LANGS } from "../server/reports/config.js";
import { APPROACH, whyLines } from "../server/reports/teaching.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const OUT = process.argv[2] ?? join(ROOT, "docs/design/round7/learning/shots");
const CID = "11111111-1111-4111-8111-111111111111", CID2 = "22222222-2222-4222-8222-222222222222";

// ───────────── the monthly report for the fixture child (the real pipeline) ─────────────
const at = (day, min = 0) => new Date(Date.parse(`${day}T11:30:00.000Z`) + min * 60_000).toISOString();
const { A, B, C } = SKILLS;
const f = dayFacts({ cadence: "monthly", period: "2026-10", lang: "english", extra: [
  { sessionId: "S1", at: at("2026-10-05", 8), skillIds: [C], cls: "teach", outcome: -1, teach: true, itemKey: "" },
  { sessionId: "S3", at: at("2026-10-20", 1), skillIds: [A], cls: "item.open", outcome: 0 },
  { sessionId: "S3", at: at("2026-10-20", 2), skillIds: [B], cls: "item.open", outcome: 1 },
  { sessionId: "S3", at: at("2026-10-20", 3), skillIds: [B], cls: "item.open", outcome: 4 },
  { sessionId: "S3", at: at("2026-10-20", 4), skillIds: [C], cls: "item.open", outcome: 0 },
] });
f.lessons = [
  { id: "L1", topicId: "c5-maths-ch01-t01", startedAt: at("2026-10-05", 0), endedAt: at("2026-10-05", 20) },
  { id: "L2", topicId: "c5-maths-ch01-t01", startedAt: at("2026-10-06", 0), endedAt: at("2026-10-06", 24) },
  { id: "L3", topicId: "c5-maths-ch02-t02", startedAt: at("2026-10-20", 0), endedAt: at("2026-10-20", 30) },
];
f.jar = [{ id: "j1", learning: true, createdAt: at("2026-10-05", 10), answeredAt: at("2026-10-06", 2) }, { id: "j2", learning: true, createdAt: at("2026-10-20", 5), answeredAt: null }];
f.skills[A].nextReviewAt = "2026-11-04T11:30:00.000Z";
f.skills[B].nextReviewAt = "2026-11-02T11:30:00.000Z";
f.testWindows = [];
const built = buildClaims(f, { now: "2026-11-01T00:00:00.000Z" });
const renders = {};
for (const L of LANGS) {
  const R = renderLang({ cadence: "monthly", ...built }, f.child, L);
  const o = laneAOrder(R.lines, L, "monthly");
  R.voice = { order: o.order, text: assemble(o.order, R.lines, L) };
  renders[L] = R;
}
gateReport({ cadence: "monthly", claims: built.claims, renders }, { firstName: f.child.firstName });
const report = { id: "", cadence: "monthly", period: "2026-10", window: { from: f.window.from, to: f.window.to }, days: { first: f.window.firstDay, last: f.window.lastDay },
  k7: false, preview: true, createdAt: null, claims: built.claims.map((c) => ({ id: c.id, section: c.section, shapeId: c.shapeId, facts: c.factIds.length })),
  renders: Object.fromEntries(Object.entries(renders).map(([l, R]) => [l, { title: R.title.text,
    lines: R.lines.filter((x) => !x.voiceOnly).map((x) => ({ key: x.key, kind: x.kind, claimId: x.claimId ?? null, section: x.section, text: x.text })), voice: R.voice.text }])) };

// ───────────── API fixtures ─────────────
const child = (id, name, cl) => ({ id, first_name: name, class_level: cl, board: "CBSE", school_medium: "english", language_pref: "english", teacher_id: "asha", avatar: null, interests: [] });
const me = { guardian: { id: "g1", email: "parent@example.com", name: "Parent", locale: "en-IN" }, children: [child(CID, "Riya", 5), child(CID2, "Kabir", 8)],
  consents: ["core_tutoring", "memory", "learning_profile"].map((p) => ({ child_id: null, purpose: p, granted: true, version: "v1", created_at: "2026-10-01T00:00:00Z" })) };
const controls = { dailyMinutes: 30, hoursStart: "16:00", hoursEnd: "20:00", captionsAlways: false, comfortMode: false, address: "tum", reportChannel: "app",
  limitsOn: false, extraTime: "normal", dataSaver: false, textOnly: false, homeworkToday: false };
function api(path) {
  const u = new URL(path, "http://x");
  switch (u.pathname) {
    case "/api/me": return me;
    // a fresh load never inherits an unlock (Gate.tsx): the shot types a PIN, and /unlock opens the corner
    case "/api/parent/pin": return { hasPin: true, unlocked: false, unlockedUntil: null, lockedUntil: null };
    case "/api/parent/unlock": return { hasPin: true, unlocked: true, unlockedUntil: "2099-01-01T00:00:00Z", lockedUntil: null };
    case "/api/parent/reports": return { reports: [], today: "2026-11-01", thisWeek: "2026-W44", lang: "en", langs: LANGS, held: false };
    case "/api/parent/report": return u.searchParams.get("cadence") === "monthly" ? { report } : { report: null, skipped: "none", period: "x" };
    case "/api/parent/controls": return { controls, dayLimitsMode: "child", reportChannels: ["whatsapp", "app"] };
    case "/api/parent/household": return { eligible: true, shared: true };
    case "/api/parent/memory": return { keeps: "Short notes from lessons, to bring back what Riya likes.", remembered: [{ id: "m1", text: "Likes cricket examples", topic: "Fractions", at: "2026-10-20T12:00:00Z" }], fromLastLesson: [], forgotten: [] };
    case "/api/parent/teaching": return { teacher: "Asha", approach: APPROACH, madeFor: [], lessons: [
      { id: "L3", topic: "Fractions with the same numerator", startedAt: "2026-10-20T11:30:00Z", why: whyLines([
        { move: "explain", reasons: ["request.visual"] }, { move: "reteach", reasons: [], misconception_id: "m1" }, { move: "hint", reasons: [] }, { move: "teachback", reasons: [] }], { name: "Riya", T: "Asha" }) },
      { id: "L2", topic: "Numbers up to 1,00,000", startedAt: "2026-10-06T11:30:00Z", why: whyLines([{ move: "retrieval", reasons: [] }, { move: "worked_example", reasons: [] }], { name: "Riya", T: "Asha" }) },
    ] };
    default: return {};
  }
}

// ───────────── serve dist/ + shoot ─────────────
if (!existsSync(join(DIST, "index.html"))) { console.error("dist/ missing: run `npx vite build` first"); process.exit(2); }
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".woff2": "font/woff2", ".json": "application/json", ".webmanifest": "application/manifest+json" };
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(DIST, p);
  const f2 = existsSync(file) && extname(file) ? file : join(DIST, "index.html");
  res.writeHead(200, { "content-type": TYPES[extname(f2)] ?? "application/octet-stream" });
  res.end(readFileSync(f2));
}).listen(0);
const port = server.address().port;
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2 });
  await page.route("**/api/**", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(api(route.request().url())) }));
  await page.goto(`http://localhost:${port}/parent/notes?c=${CID}`, { waitUntil: "networkidle" });
  for (const d of ["1", "2", "3", "4"]) await page.getByRole("button", { name: d, exact: true }).click();
  const ok = page.getByRole("button", { name: "OK", exact: true });
  if (await ok.isVisible().catch(() => false)) await ok.click();
  await page.getByRole("tab", { name: "This month" }).click();
  await page.waitForTimeout(800);
  // a full-page capture paints fixed bars mid-page: put them back in the flow for the shot only
  const unfix = () => page.evaluate(() => { for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed") el.style.position = "static"; });
  await unfix();
  await page.screenshot({ path: join(OUT, "parent-notes-monthly.png"), fullPage: true });
  // in-app navigation (a reload would lock the corner again)
  await page.evaluate((u) => { history.pushState({}, "", u); dispatchEvent(new PopStateEvent("popstate")); }, `/parent/controls?c=${CID}`);
  const card = page.getByTestId("shared-phone");
  await card.waitFor({ timeout: 10_000 });
  await card.scrollIntoViewIfNeeded();
  await card.screenshot({ path: join(OUT, "parent-controls-household.png") });
  await page.evaluate((u) => { history.pushState({}, "", u); dispatchEvent(new PopStateEvent("popstate")); }, `/parent/teaching?c=${CID}`);
  await page.getByTestId("teaching").waitFor({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await unfix();
  await page.screenshot({ path: join(OUT, "parent-teaching.png"), fullPage: true });
  console.log(`wrote ${OUT}/parent-notes-monthly.png, parent-controls-household.png and parent-teaching.png`);
} finally {
  await browser.close();
  server.close();
}
