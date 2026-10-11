// Release 11 (dc-r4-volt-everywhere), stream K: before / after sheets of EVERY child-mode page from real pages, plus the
// certificates. Three LOCAL production builds on this stream's Neon TEST branch (never production):
//   BEFORE         base efc0e721 with no cohort: what every account saw (the classic child app)     TAXILA_BEFORE  :5192
//   BEFORE_COHORT  the same base build with this account in TAXILA_UI_KAKSHA: the Kaksha the owner     TAXILA_COHORT  :5193
//                  cohort saw. The PARITY reference: what each screen SAYS must be unchanged
//   AFTER          this branch with NO cohort env: Kaksha + Volt by default for everyone             TAXILA_BASE    :5190
// One guardian, two children (class 3 → young, class 7 → older). Pages: /who, hello, home, world, hangar, ask, notebook, me,
// teacher, practice, the lesson's first screen (its /api/lesson/start answer recorded once and replayed to every build).
// Per AFTER page: the U1 in-page lint (text ≥ 14 px, Devanagari ≥ 16 px, targets ≥ 44 px, contrast on the composited
// ground, no horizontal overflow), LOOK-1 (the page is in the Volt look), AI-1 (her AI label wherever her face shows),
// SAYS-1 (the visible words equal BEFORE_COHORT's for the same page, after normalising whitespace and the clock greeting).
// Run: NODE_USE_ENV_PROXY=1 node --env-file=.env.local tests/prod/r11-k-sheets.mjs
// Writes docs/design/round4/build/r11/k/{shots/*.webp, sheet-*.webp, r11-k-pages.json}; exit 1 on any AFTER finding.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { apiClient, ok, done } from "./lib.mjs";
import { inPage } from "./r4-kaksha-inpage.mjs";

const ROOT = new URL("../..", import.meta.url).pathname;
const local = (u) => /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(u);
const BUILDS = {
  before: (process.env.TAXILA_BEFORE || "http://127.0.0.1:5192").replace(/\/+$/, ""),
  cohort: (process.env.TAXILA_COHORT || "http://127.0.0.1:5193").replace(/\/+$/, ""),
  after: (process.env.TAXILA_BASE || "http://127.0.0.1:5190").replace(/\/+$/, ""),
};
for (const u of Object.values(BUILDS)) if (!local(u)) { console.log(`refusing: ${u} is not local`); process.exit(1); }
const EMAIL = "r11-k-sheets@taxila.test"; // the BEFORE_COHORT server lists it in TAXILA_UI_KAKSHA; AFTER has no cohort env
const OUT = path.join(ROOT, "docs/design/round4/build/r11/k");
const SHOTS = path.join(OUT, "shots");
const VIEWS = (process.env.VIEWS ?? "360x800,412x915,1366x768").split(",").map((v) => v.split("x").map(Number));
const PAGES = ["/who", "hello", "", "map", "hangar", "ask", "notebook", "me", "teacher", "practice", "lesson/new"];
const name = (pg) => (pg === "" ? "home" : pg.replace(/^\//, "").replace("/", "-"));

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("playwright");
const browser = await chromium.launch();
fs.mkdirSync(SHOTS, { recursive: true });

const api = apiClient(BUILDS.after);
const password = `r11-k-${Date.now()}`;
const rows = [];
const tot = { pages: 0, small: 0, deva: 0, targets: 0, contrast: 0, overflow: 0, look: 0, ai: 0, says: 0, errors: 0 };
let signed = false;

async function capture(base, k, pg, [w, h], cookie) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1, timezoneId: "Asia/Kolkata", reducedMotion: "reduce" });
  const i = cookie.indexOf("="); await ctx.addCookies([{ name: cookie.slice(0, i), value: cookie.slice(i + 1), url: base }]);
  const p = await ctx.newPage();
  const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
  if (pg === "lesson/new" || pg === "practice") {
    if (pg === "lesson/new") await p.route("**/api/lesson/start", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(k.start) }));
    await p.route(/\/api\/(lesson\/(turn|stream|ack|tts|end|event)|duplex|speech|realtime)/, (r) => r.abort());
  }
  await p.addInitScript(([cid, hello]) => {
    try {
      localStorage.clear();
      if (hello) localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true }));
    } catch {}
  }, [k.child.id, pg !== "hello"]);
  const url = pg.startsWith("/") ? `${base}${pg}` : `${base}/c/${k.child.id}/${pg}`;
  await p.goto(url, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(2200);
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((im) => im.decode().catch(() => {}))); });
  const lint = await p.evaluate(inPage);
  const facts = await p.evaluate(() => {
    const out = [];
    const looked = !!document.querySelector(".tx-child[data-klook], .kx[data-klook]");
    const face = document.querySelector(".teacher-window, [data-testid='teacher-window'], .kx-comms");
    if (face && !/\bAI\b/.test(document.body.innerText)) out.push("AI-1 her face without AI");
    // her live question on the card is the model's words for THIS session (practice starts a new set on every load), not
    // the screen's chrome: SAYS-1 compares everything else
    const card = document.querySelector('[data-testid="question-card"] .dk-card-ask');
    const live = card ? card.innerText : "";
    const says = document.body.innerText.replace(live, "<her question>").replace(/\s+/g, " ").replace(/\b(Morning|Evening|Hi|Good (morning|afternoon|evening)),/g, "<greet>,").trim();
    return { out, looked, says, url: location.pathname.replace(/\/c\/[0-9a-f-]{36}/, "/c/:cid") };
  });
  const png = await p.screenshot();
  await ctx.close();
  return { lint, facts, png, errs };
}

try {
  await api("POST", "/api/auth/signup", { email: EMAIL, password, name: "R11 Sheets", isGuardianAdult: true });
  signed = true;
  const kids = [];
  for (const [first, cls] of [["Riya", 3], ["Kabir", 7]]) {
    const { child } = await api("POST", "/api/children", { firstName: first, classLevel: cls, languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    const { status: _s, ms: _m, ...start } = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" });
    await api("POST", "/api/lesson/end", { lessonId: start.lessonId }).catch(() => {});
    kids.push({ child, family: cls <= 4 ? "young" : "older", start });
  }
  const cookie = api.cookie();
  for (const view of VIEWS) for (const k of kids) for (const pg of PAGES) {
    if (pg === "/who" && k.family === "young") continue; // one /who per account (it shows both children)
    const [b, c, a] = [await capture(BUILDS.before, k, pg, view, cookie), await capture(BUILDS.cohort, k, pg, view, cookie), await capture(BUILDS.after, k, pg, view, cookie)];
    const tag = `${k.family}-${name(pg)}__${view[0]}x${view[1]}`;
    for (const [which, r] of [["before", b], ["after", a]]) {
      const f = path.join(SHOTS, `${which}-${tag}.png`); fs.writeFileSync(f, r.png);
      execFileSync("python3", ["-c", `from PIL import Image;Image.open('${f}').save('${f.replace(".png", ".webp")}','WEBP',quality=76,method=6)`]); fs.rmSync(f);
    }
    const out = [...a.facts.out];
    if (!a.facts.looked) out.push("LOOK-1 not in the Volt look");
    // SAYS-1: the words are the cohort Kaksha's (pages Kaksha drew before) or the classic page's (pages it re-skins)
    const ref = c.facts.says;
    if (a.facts.says !== ref) out.push(`SAYS-1 words differ from the cohort reference`);
    tot.pages++; for (const key of ["small", "deva", "targets", "contrast"]) tot[key] += a.lint[key].length;
    tot.overflow += a.lint.overflow > 0 ? 1 : 0; tot.look += out.filter((x) => x.startsWith("LOOK")).length; tot.ai += out.filter((x) => x.startsWith("AI")).length;
    tot.says += out.filter((x) => x.startsWith("SAYS")).length; tot.errors += a.errs.length;
    const n = a.lint.small.length + a.lint.deva.length + a.lint.targets.length + a.lint.contrast.length + (a.lint.overflow > 0 ? 1 : 0) + out.length + a.errs.length;
    const row = { page: tag, url: a.facts.url, lint: { small: a.lint.small, deva: a.lint.deva, targets: a.lint.targets, contrast: a.lint.contrast, overflow: a.lint.overflow, texts: a.lint.texts }, checks: out, errors: a.errs.slice(0, 3) };
    if (out.some((x) => x.startsWith("SAYS"))) row.saysDiff = { cohort: ref.slice(0, 600), after: a.facts.says.slice(0, 600) };
    rows.push(row);
    if (n) console.log(tag, JSON.stringify({ out, s: a.lint.small, t: a.lint.targets, k: a.lint.contrast, o: a.lint.overflow, e: a.errs.slice(0, 2) }).slice(0, 700));
  }
} catch (e) {
  ok(false, `harness threw: ${e?.stack ?? e}`);
} finally {
  if (signed) await api("DELETE", "/api/account", { password, confirm: true }).then(() => console.log("cleanup: account deleted"), (e) => ok(false, `cleanup failed: ${e.message}`));
  await browser.close();
}

// sheets: per viewport and family, BEFORE (top) / AFTER (bottom), one column per page
execFileSync("python3", ["-c", `
import glob, os
from PIL import Image, ImageDraw, ImageFont
OUT=${JSON.stringify(OUT)}
pages=${JSON.stringify(PAGES.map(name))}
f=ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",20)
for view in ${JSON.stringify(VIEWS.map(([w, h]) => `${w}x${h}`))}:
  w,h=map(int,view.split("x"))
  for fam in ["young","older"]:
    cols=[p for p in pages if os.path.exists(f"{OUT}/shots/after-{fam}-{p}__{view}.webp")]
    if not cols: continue
    tw = 220 if w < 500 else 420
    th = int(tw*h/w)
    W=12+len(cols)*(tw+12); H=44+2*(th+40)
    s=Image.new("RGB",(W,H),(14,14,18)); d=ImageDraw.Draw(s)
    d.text((12,10),f"release 11 · K · {fam} family · {view} · BEFORE (top, what every account saw) / AFTER (bottom, the default now)",fill=(240,240,240),font=f)
    for r,which in enumerate(["before","after"]):
      for c,p in enumerate(cols):
        im=Image.open(f"{OUT}/shots/{which}-{fam}-{p}__{view}.webp").convert("RGB").resize((tw,th))
        x=12+c*(tw+12); y=44+r*(th+40)
        d.text((x,y),f"{which} · {p}",fill=(200,200,210),font=f); s.paste(im,(x,y+26))
    s.save(f"{OUT}/sheet-{fam}__{view}.webp","WEBP",quality=80,method=6)
`]);
fs.writeFileSync(path.join(OUT, "r11-k-pages.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10),
  method: "local production builds on the stream's Neon TEST branch: BEFORE = base efc0e721 (no cohort), BEFORE_COHORT = the same base with the account in TAXILA_UI_KAKSHA (the parity reference), AFTER = this branch with no cohort env; one account, class 3 + class 7 children; U1 in-page lint + LOOK-1 + AI-1 + SAYS-1 on AFTER", totals: tot, pages: rows }, null, 1));
console.log(JSON.stringify(tot));
ok(tot.small + tot.deva + tot.targets + tot.contrast + tot.overflow + tot.look + tot.ai + tot.errors === 0, `AFTER: ${tot.pages} pages under the Volt look, 0 floor findings`);
ok(tot.says === 0, `SAYS-1: every AFTER page says what the cohort Kaksha said (${tot.says} differ)`);
done();
