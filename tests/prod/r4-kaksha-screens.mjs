// The Kaksha look on EVERY child screen (main session 2026-10-10: "the owner never meets a mixed look"), for a real
// cohort account on a LOCAL production build of this branch (TAXILA_UI_KAKSHA = the cohort email; Neon TEST branch).
// One guardian, two children: class 3 (young → bright) and class 7 (older → dark). Per child, look (volt = the default,
// holo = the ?look= alternate) and viewport (360x800, 412x915, 1366x768):
//   hello · home · world · hangar · ask · notebook · me · teacher · the lesson's first screen (its /api/lesson/start
//   answer recorded once from a real start and replayed) · the same with a 180-character question (WRAP-1)
// Per page: the U1 in-page lint (text ≥ 14 px, Devanagari ≥ 16 px, targets ≥ 44 px, WCAG contrast on the composited
// ground, no horizontal overflow) and LOOK-1: the page is under the look (ChildShell carries data-klook, or a Kaksha .kx
// root does), so no screen renders the old look inside Kaksha. AI-1: "AI teacher" wherever her face is.
// Run (servers as tests/prod/r4-timeline/README.md; the branch server with TAXILA_UI_KAKSHA=r4k-screens-owner@taxila.test):
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:5190 node --env-file=.env.local tests/prod/r4-kaksha-screens.mjs
// Writes docs/design/round4/build/kaksha/screens/*.webp and screens/lint-screens.json; exit 1 on any finding.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { apiClient, ok, done } from "./lib.mjs";
import { inPage } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const B = (process.env.TAXILA_BASE || "http://127.0.0.1:5190").replace(/\/+$/, "");
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(B)) { console.log(`refusing: ${B} is not local`); process.exit(1); }
const COHORT = "r4k-screens-owner@taxila.test";
const OUT = path.join(ROOT, "docs/design/round4/build/kaksha/screens");
const VIEWS = [[360, 800], [412, 915], [1366, 768]];
const SHOT = new Set(["360x800", "1366x768"]);
const LOOKS = ["volt", "holo"];
const PAGES = ["hello", "", "map", "hangar", "ask", "notebook", "me", "teacher", "lesson/new", "lesson/new#long"].filter((x) => !process.env.PAGES_ONLY || process.env.PAGES_ONLY.split(",").includes(x));
// main 2026-10-10: 4A's fix (7565adf, release 9) shows whole questions up to 180 characters (69 kit prompts are 121-180),
// so the card must wrap, never clamp. A 180-character, kit-shaped question on the real Desk (WRAP-1).
const LONG = "Riya has a chocolate bar with 12 equal pieces. She gives 3 pieces to Kabir and 2 pieces to Meera. What fraction of the bar is left with her, and is that more or less than one half?";

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("playwright");
const browser = await chromium.launch();
fs.mkdirSync(OUT, { recursive: true });

const api = apiClient(B);
const password = `r4k-screens-${Date.now()}`;
const report = [];
const tot = { pages: 0, small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, look: 0, ai: 0, wrap: 0, errors: 0 };
let signed = false;
try {
  await api("POST", "/api/auth/signup", { email: COHORT, password, name: "Screens Test", isGuardianAdult: true });
  signed = true;
  ok((await api("GET", "/api/me")).ui?.kaksha === true, "the account is in the Kaksha cohort");
  const kids = [];
  for (const [name, cls] of [["Riya", 3], ["Kabir", 7]]) {
    const { child } = await api("POST", "/api/children", { firstName: name, classLevel: cls, languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const { status: _s, ms: _m, ...start } = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
    kids.push({ child, cls, family: cls <= 4 ? "young" : "older", start });
  }
  const c = api.cookie(); const ci = c.indexOf("=");
  for (const [w, h] of VIEWS) for (const look of LOOKS) for (const k of kids) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, timezoneId: "Asia/Kolkata" });
    await ctx.addCookies([{ name: c.slice(0, ci), value: c.slice(ci + 1), url: B }]);
    for (const pg of PAGES) {
      const p = await ctx.newPage();
      const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
      if (pg.startsWith("lesson/new")) {
        const body = pg.endsWith("#long") ? { ...k.start, ui: { ...(k.start.ui ?? {}), ask: { ...(k.start.ui?.ask ?? {}), text: LONG } } } : k.start;
        await p.route("**/api/lesson/start", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) }));
        await p.route(/\/api\/(lesson\/(turn|stream|ack|tts|end|event)|duplex|speech|realtime)/, (r) => r.abort());
      }
      await p.addInitScript(([cid, hello]) => { try { if (hello) localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch {} }, [k.child.id, pg !== "hello"]);
      // the long question in text mode: no audio in this harness, and in text mode her opening is text, so the question
      // pins on the card at once (in voice mode it pins after her first spoken frame)
      await p.goto(`${B}/c/${k.child.id}/${pg.replace("#long", "")}?look=${look}${pg.endsWith("#long") ? "&mode=text" : ""}`, { waitUntil: "networkidle" }).catch(() => {});
      await p.waitForTimeout(2200);
      const r = await p.evaluate(inPage);
      const flags = await p.evaluate((long) => {
        const out = [];
        if (long) { // WRAP-1: the whole question is in the card, wrapped, nothing clamped or clipped
          const card = document.querySelector('[data-testid="question-card"]');
          const ask = card?.querySelector(".dk-card-ask");
          const txt = (ask?.innerText ?? "").replace(/\s+/g, " ").trim();
          if (!ask) out.push("WRAP-1 no question card");
          else {
            if (!txt.includes(long)) out.push(`WRAP-1 text not whole: "${txt.slice(-60)}"`);
            for (let el = ask; el && el !== card.parentElement; el = el.parentElement) {
              const cs = getComputedStyle(el);
              if (cs.webkitLineClamp && cs.webkitLineClamp !== "none") out.push(`WRAP-1 line-clamp on .${el.className}`);
              if (cs.textOverflow === "ellipsis" || cs.whiteSpace === "nowrap") out.push(`WRAP-1 ${cs.textOverflow}/${cs.whiteSpace} on .${el.className}`);
              if (el.scrollHeight > el.clientHeight + 1 && /hidden|clip/.test(cs.overflowY)) out.push(`WRAP-1 clipped in .${el.className} (${el.scrollHeight} > ${el.clientHeight})`);
            }
            const a = ask.getBoundingClientRect(), c = card.getBoundingClientRect();
            if (a.bottom > c.bottom + 1) out.push(`WRAP-1 text runs out of the card (${Math.round(a.bottom - c.bottom)} px)`);
          }
        }
        const shell = document.querySelector(".tx-child");
        if (!shell?.getAttribute("data-klook") && !document.querySelector(".kx[data-klook]")) out.push("LOOK-1 no look on this page");
        const face = document.querySelector(".teacher-window, [data-testid='teacher-window'], .kx-comms");
        if (face && !/\bAI\b/.test(document.body.innerText)) out.push("AI-1 her face without AI");
        return { out, url: location.pathname.replace(/\/c\/[0-9a-f-]{36}/, "/c/:cid") };
      }, pg.endsWith("#long") ? LONG : null);
      const name = `${look}-${k.family}-${pg.replace("/", "-").replace("#", "-") || "home"}__${w}x${h}`;
      tot.pages++; for (const key of ["small", "deva", "targets", "contrast"]) tot[key] += r[key].length;
      tot.overflow += r.overflow > 0 ? 1 : 0; tot.look += flags.out.filter((x) => x.startsWith("LOOK")).length; tot.ai += flags.out.filter((x) => x.startsWith("AI")).length; tot.wrap += flags.out.filter((x) => x.startsWith("WRAP")).length; tot.errors += errs.length;
      report.push({ name, url: flags.url, ...r, checks: flags.out, errors: errs.slice(0, 3) });
      const n = r.small.length + r.deva.length + r.targets.length + r.contrast.length + (r.overflow > 0 ? 1 : 0) + flags.out.length + errs.length;
      if (n) console.log(name, flags.url, JSON.stringify({ c: flags.out, s: r.small, t: r.targets, k: r.contrast, o: r.overflow, e: errs.slice(0, 2) }).slice(0, 900));
      if (SHOT.has(`${w}x${h}`)) {
        const png = path.join(OUT, `${name}.png`);
        await p.screenshot({ path: png });
        execFileSync("python3", ["-c", `from PIL import Image;Image.open('${png}').save('${png.replace(".png", ".webp")}','WEBP',quality=78,method=6)`]);
        fs.rmSync(png);
      }
      await p.close();
    }
    await ctx.close();
  }
} catch (e) {
  ok(false, `harness threw: ${e?.stack ?? e}`);
} finally {
  if (signed) await api("DELETE", "/api/account", { password, confirm: true }).then(() => console.log("cleanup: account deleted"), (e) => ok(false, `cleanup failed: ${e.message}`));
  await browser.close();
}
fs.writeFileSync(path.join(OUT, "lint-screens.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10),
  method: `local production build of claude/r4-app-design, a cohort account (TAXILA_UI_KAKSHA), 2 children (class 3 young, class 7 older), ?look=${LOOKS.join("|")}, ${PAGES.length} pages x ${VIEWS.length} viewports; U1 in-page lint + LOOK-1 + AI-1`, totals: tot, pages: report }, null, 1));
console.log(JSON.stringify(tot));
ok(tot.small + tot.deva + tot.targets + tot.contrast + tot.overflow + tot.look + tot.ai + tot.wrap + tot.errors === 0, `every child screen under the look: ${tot.pages} pages, 0 findings`);
done();
