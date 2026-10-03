// PRODUCT-DESIGN-V2 §14 B4 (workstream b4-polish-site): the Playwright battery for the marketing site and the public
// pages, on the SHIPPED build. Standalone (needs Chromium; not part of `npm test`):
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-b4-polish-site.mjs [--dist <built SPA>] [--shots <dir>] [--quick]
//
// It builds the production SPA (no dev routes) into a temp dir unless --dist is given, serves it with server/serve.mjs
// on a spare port, and answers /api/* with 401 (a signed-out visitor) unless a case says otherwise. Checks, each with a
// negative control that must trip it:
//   V-SIG-2    0 [data-lamp] and no lamp colour painted on any public route (G-LAMP-1: the landing carries 0)
//   V-EN-1     English chrome: no Devanagari and no Hinglish chrome word outside [data-speech]
//   V-NAME-1   every button / link / input has an accessible name
//   V-LAYOUT   no horizontal scroll; no element off screen; no empty box > 48 px; at 360 x 640 the CTA sits above
//              the 584 dp fold (§6.1.1)
//   V-TGT      every visible control >= 48 px (inline links in running text exempt)
//   V-COPY     parent copy: no "!", no dashes, digits; no teacher pronoun and no catalogue teacher name in text or
//              accessible names (P5: the child names the teacher); no claim about an unshipped feature (WhatsApp notes)
//   V-FACE     every teacher face on the site is a look the picker offers (shared/tutors.js live; audit #4)
//   V-AUDIO    no clip plays on the site unless it is in the no-name clip registry (empty today: the only clips are
//              the named onboarding greeting)
//   V-ART      the hero comes through the art ledger when it has landed; with the ledger blocked every image falls
//              back to its designed flat shape and the page stays whole; pending promise art renders its fallback
//   V-STATES   signed in → "Go to Taxila"; /trust → /promises; unknown path → the 404 with Go home; /help puts the
//              tel: helplines first; FAQ and promise rows toggle aria-expanded; /leaving names the host and refuses
//              javascript:, data: and protocol-relative links; every site destination (CTA, Sign in, help links) opens
//              a real screen, and a control the help copy names exists on its route
//   V-MOTION   reduced motion (OS and data-motion) collapses the motion tokens to 1 ms; nothing spins
//   V-BRAND    favicon.svg, the PNG icons and the web manifest are served and sized as declared
//   V-PERF     LCP (median of 5) on "/" at 360, Fast-3G + 4x CPU, served by server/serve.mjs AS SHIPPED; while the
//              server does not compress this is a KNOWN failure owned by the server (reported, never shown as a pass);
//              the gzip arm is a projection, not a gate
//   L-UI       scripts/lint-ui.mjs: 0 findings over the whole of src/, and its content-vs-chrome rules trip on chrome
// Shots: 360x640 (DPR 2, touch) and 1280x800, light and dark, into docs/design/build/b4-polish-site/.
import http from "http";
import fs from "fs";
import os from "os";
import path from "path";
import zlib from "zlib";
import { spawn, execFileSync } from "child_process";
import { chromium } from "playwright";
import { lint, lintSource } from "../scripts/lint-ui.mjs";
import { TUTORS, NAME_SUGGESTIONS } from "../shared/tutors.js";

/** Faces the picker can offer (eligibleTutors drops drafts) and the names the site must never print. */
const LIVE_LOOKS = TUTORS.filter((t) => t.status === "live").map((t) => t.id);
const TEACHER_NAMES = [...new Set([...TUTORS.map((t) => t.displayName.roman), ...NAME_SUGGESTIONS])];
/** Clips the site may play: recorded lesson samples that carry no teacher name. Empty until they exist. */
const NO_NAME_CLIPS = [];

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const QUICK = process.argv.includes("--quick");
const SHOTS = arg("--shots", `${ROOT}docs/design/build/b4-polish-site`);
fs.mkdirSync(SHOTS, { recursive: true });

const results = [];
const measures = {};
const check = (name, ok, detail = "") => {
  detail = String(detail).replace(/\s+/g, " ").trim();
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail.slice(0, 400)}` : ""}`);
};
/** A check that fails today for a reason another owner holds: recorded as NOT passing (never in the pass count), with
 *  its owner, and it does not fail the battery's exit code. When it starts passing it is reported as a pass. */
const known = [];
const knownFail = (name, ok, detail, owner) => {
  if (ok) return check(name, true, detail);
  detail = String(detail).replace(/\s+/g, " ").trim();
  known.push({ name, owner, detail });
  console.log(`KNOWN-FAIL (${owner}) ${name} — ${detail.slice(0, 400)}`);
};

// ───────────────────────────── server ─────────────────────────────
let dist = arg("--dist");
if (!dist) {
  dist = fs.mkdtempSync(path.join(os.tmpdir(), "taxila-b4-dist-"));
  execFileSync("npx", ["vite", "build", "--outDir", dist, "--emptyOutDir"], { cwd: ROOT, stdio: "ignore", env: { ...process.env, VITE_DEV_ROUTES: "" } });
}
const freePort = () => new Promise((r) => { const s = http.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
const PORT = await freePort();
const BASE = `http://127.0.0.1:${PORT}`;
const srv = spawn(process.execPath, [path.join(ROOT, "server/serve.mjs")], { env: { ...process.env, PORT: String(PORT), TAXILA_DIST: dist }, stdio: ["ignore", "pipe", "pipe"] });
for (let i = 0; i < 100; i++) {
  try { if ((await fetch(`${BASE}/`)).ok) break; } catch { /* starting */ }
  await new Promise((r) => setTimeout(r, 150));
}
console.log(`app: ${BASE} (built ${dist})`);

const ROUTES = ["/", "/promises", "/privacy", "/help", "/leaving?to=https%3A%2F%2Fwww.childlineindia.org", "/no-such-page"];
const SLUG = (r) => r === "/" ? "landing" : r.startsWith("/leaving") ? "leaving" : r === "/no-such-page" ? "404" : r.slice(1);

const browser = await chromium.launch();
async function open(route, { w = 360, h = 640, theme = "light", me = null, reduced = "no-preference", block } = {}) {
  const phone = w < 500;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: phone ? 2 : 1, isMobile: phone, hasTouch: phone, colorScheme: theme, reducedMotion: reduced });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await page.route("**/api/**", (r) => (me && r.request().url().endsWith("/api/me")
    ? r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(me) })
    : r.fulfill({ status: 401, contentType: "application/json", body: '{"error":"signed out"}' })));
  if (block) await page.route(block, (r) => r.abort());
  await page.goto(BASE + route, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  return { ctx, page, errors };
}

// ───────────────────────────── page probes (run in the page) ─────────────────────────────
const HINGLISH = (() => {
  const src = fs.readFileSync(`${ROOT}src/ui/copy.ts`, "utf8");
  const body = /HINGLISH_CHROME\s*=\s*\[([\s\S]*?)\]/.exec(src)?.[1] ?? "";
  return [...body.matchAll(/"([a-z ]+)"/g)].map((m) => m[1]).concat(["kya", "kaun", "padhega"]);
})();

/** Visible chrome text outside [data-speech]: Devanagari and wordlist hits. */
const enProbe = (words) => {
  const out = [];
  const re = new RegExp(`\\b(${words.join("|")})\\b`, "i");
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const el = n.parentElement;
    if (!el || el.closest("[data-speech],script,style,noscript")) continue;
    const t = n.textContent.trim();
    if (!t) continue;
    if (/[ऀ-ॿ]/.test(t)) out.push(`deva: ${t.slice(0, 60)}`);
    const m = t.match(re);
    if (m) out.push(`word "${m[1]}": ${t.slice(0, 60)}`);
  }
  for (const el of document.querySelectorAll("[aria-label],[alt],[title]")) {
    if (el.closest("[data-speech]")) continue;
    const t = [el.getAttribute("aria-label"), el.getAttribute("alt"), el.getAttribute("title")].filter(Boolean).join(" ");
    if (/[ऀ-ॿ]/.test(t) || re.test(t)) out.push(`attr: ${t.slice(0, 60)}`);
  }
  return out;
};

/** Lamp: no [data-lamp], and no element paints the lamp hue family (#FFB21E and its wash/ring/ink). */
const lampProbe = () => {
  const LAMP = ["rgb(255, 178, 30)", "rgb(255, 243, 219)", "rgb(122, 72, 0)", "rgb(92, 54, 0)", "rgb(61, 44, 8)", "rgb(255, 210, 122)"];
  const hits = [];
  if (document.querySelector("[data-lamp]")) hits.push("[data-lamp] present");
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    for (const p of ["color", "backgroundColor", "borderTopColor", "outlineColor", "fill", "stroke"]) {
      const v = cs[p];
      if (LAMP.includes(v) && (p !== "borderTopColor" || parseFloat(cs.borderTopWidth) > 0) && (p !== "outlineColor" || cs.outlineStyle !== "none")) hits.push(`${el.tagName.toLowerCase()}.${el.className?.baseVal ?? el.className} ${p} ${v}`);
    }
  }
  return hits.slice(0, 10);
};

const nameProbe = () => {
  const bad = [];
  for (const el of document.querySelectorAll("button, a[href], input, select, textarea, [role=button]")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || getComputedStyle(el).visibility === "hidden") continue;
    const label = el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") && document.getElementById(el.getAttribute("aria-labelledby"))?.textContent || el.textContent || el.getAttribute("title") || el.getAttribute("placeholder") || (el.id && document.querySelector(`label[for="${el.id}"]`)?.textContent);
    if (!String(label ?? "").trim()) bad.push(el.outerHTML.slice(0, 80));
  }
  return bad;
};

const layoutProbe = () => {
  const vw = document.documentElement.clientWidth;
  const out = { hscroll: document.documentElement.scrollWidth > vw + 1, offscreen: [], empty: [] };
  for (const el of document.querySelectorAll("main *, header *, footer *")) {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || el.closest("[hidden]")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if (r.right > vw + 1 || r.left < -1) if (!el.closest(".sr-only,.skip")) out.offscreen.push(`${el.tagName}.${el.className?.baseVal ?? el.className} ${Math.round(r.left)}..${Math.round(r.right)}`);
    if (r.height > 48 && !el.children.length && !el.textContent.trim() && !["IMG", "SVG", "svg", "INPUT", "path", "rect", "circle", "BR", "HR"].includes(el.tagName) && !el.closest("svg") && getComputedStyle(el).backgroundImage === "none"
      && !el.closest("[data-art]") && !el.matches(".rig-portrait, .rig-portrait *")) out.empty.push(`${el.tagName}.${el.className} ${Math.round(r.height)}px`);
  }
  out.offscreen = out.offscreen.slice(0, 8); out.empty = out.empty.slice(0, 8);
  return out;
};

const targetProbe = () => {
  const small = [];
  for (const el of document.querySelectorAll("button, a[href], input, select, [role=button]")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height || el.closest("[hidden]") || el.classList.contains("skip")) continue;
    // inline links inside running text are exempt (WCAG 2.5.8 inline exception)
    if (el.tagName === "A" && !el.className && el.parentElement && /^(P|LI|SPAN|STRONG)$/.test(el.parentElement.tagName) && el.parentElement.textContent.trim().length > el.textContent.trim().length + 8) continue;
    if (r.height < 47.5 || r.width < 47.5) small.push(`${el.tagName} "${(el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  return small;
};

const copyProbe = (names) => {
  const main = document.querySelector("main");
  // the sample evidence card is about Riya ("her own words" is hers); every other "her" would be the teacher's
  const sample = main?.querySelector(".evidence")?.innerText ?? "";
  const text = (main?.innerText ?? "").replace(sample, "");
  const out = [];
  if (/!/.test(text)) out.push(`"!" in: ${text.match(/[^.\n]*!/)[0].slice(-50)}`);
  if (/[—–]| - /.test(text)) out.push(`dash in: ${text.match(/.{0,30}([—–]| - ).{0,20}/)[0]}`);
  const pron = [...text.matchAll(/[^.\n]*\b(she|her|hers|herself|he|him|his|himself)\b[^.\n]*/gi)].map((x) => x[0]);
  if (pron.length) out.push(`teacher pronoun: ${pron[0].slice(0, 80)}`);
  const nameRe = new RegExp(`\\b(${names.join("|")})\\b`, "i");
  const attrs = [...document.querySelectorAll("[aria-label],[alt],[title]")].filter((e) => !e.closest("[aria-hidden=true]"))
    .map((e) => [e.getAttribute("aria-label"), e.getAttribute("alt"), e.getAttribute("title")].filter(Boolean).join(" "));
  const nm = [document.body.innerText, document.title, ...attrs].join("\n").match(nameRe);
  if (nm) out.push(`teacher name "${nm[1]}"`);
  if (/whatsapp/i.test(text)) out.push("claims WhatsApp delivery (not shipped: server/routes/parent.js)");
  return out;
};

// ───────────────────────────── L-UI: the lint, with its controls ─────────────────────────────
{
  const f = lint();
  check("L-UI lint-ui: 0 findings over the whole of src/", f.length === 0, f.slice(0, 5).map((x) => `${x.rule} ${x.file}:${x.line}`).join("; ") || "0");
  const rules = (file, text) => lintSource(file, text).map((x) => x.rule);
  const cases = [
    ["chrome Devanagari trips", rules("src/app/X.tsx", 'const label = "अभ्यास";'), ["L-DEVA"]],
    ["one spoken string marked lint-ui: speech on its line passes", rules("src/app/X.tsx", 'const said = "अभ्यास"; // lint-ui: speech'), []],
    ["a marker on the line ABOVE no longer exempts the next line", rules("src/app/X.tsx", '// lint-ui: speech\nconst said = "अभ्यास";'), ["L-DEVA"]],
    ["a marker on a ternary of labels does not exempt it", rules("src/app/X.tsx", 'const l = hi ? "हाँ" : "Yes"; // lint-ui: speech'), ["L-DEVA"]],
    ["text inside a [data-speech] element passes", rules("src/child/X.tsx", '<p data-speech="">नमस्ते</p>'), []],
    ["chrome after a [data-speech] element on the same line trips", rules("src/child/X.tsx", '<p data-speech="">{cap}</p><button>Haan</button>'), ["L-HING"]],
    ["Devanagari chrome after a [data-speech] element trips", rules("src/child/X.tsx", '<q data-speech="">{a}</q> <span>हाँ</span>'), ["L-DEVA"]],
    ["a .ts copy table is scanned: \"Ruko\" in src/child/copy.ts trips", rules("src/child/copy.ts", '  wait: "Ruko",'), ["L-HING"]],
    ["a .ts string table is scanned: \"हाँ\" in src/child/strings.ts trips", rules("src/child/strings.ts", '  yes: "हाँ",'), ["L-DEVA"]],
    ["the speech pipeline (src/lesson/*.ts) is not chrome", rules("src/lesson/x.ts", 'const yes = "हाँ";'), []],
    ["an engine's lesson-language triplet passes", rules("src/modules/frame/engines/x.tsx", 'a: tri("Same", "Barabar", "बराबर"),'), []],
    ["a frame control as chrome() passes", rules("src/modules/frame/kit/i18n.ts", '  check: chrome("Check"),'), []],
    ["the same triplet as frame chrome trips", rules("src/modules/frame/bootstrap.tsx", 'soon: { english: "Soon", hinglish: "Jald", hindi: "जल्द" },'), ["L-DEVA"]],
    ["a Devanagari regex range passes", rules("src/x/y.tsx", "const isHi = /[ऀ-ॿ]/.test(s);"), []],
    ["a danda inside a regex class passes", rules("src/x/y.ts", "const parts = s.split(/(?<=[.!?।])\\s+/);"), []],
    ["a Hinglish chrome word on a button trips", rules("src/app/X.tsx", '<span>{young ? "Haan" : "Yes"}</span>'), ["L-HING"]],
    ["the address value 'tum' passes", rules("src/app/X.tsx", 'options={[{ value: "tum", label: "Casual" }]}'), []],
    ["lower-case Hinglish 'todo' passes, upper-case TODO trips", [...rules("src/modules/frame/engines/e.tsx", 'down: tri("break 1", "1 ko 10 mein todo", "x"),'), ...rules("src/x/e.tsx", 'const t = "TODO";')], ["L-HOLD"]],
  ];
  for (const [name, got, want] of cases) check(`L-UI control: ${name}`, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}`);
}

// ───────────────────────────── per-route battery ─────────────────────────────
const SIZES = QUICK ? [[360, 640]] : [[360, 640], [1280, 800]];
const THEMES = QUICK ? ["light"] : ["light", "dark"];
for (const route of ROUTES) {
  for (const [w, h] of SIZES) for (const theme of THEMES) {
    const tag = `${SLUG(route)} ${w}x${h} ${theme}`;
    const { ctx, page, errors } = await open(route, { w, h, theme });
    if (theme === "light") {
      const en = await page.evaluate(enProbe, HINGLISH);
      check(`V-EN-1 ${tag}`, en.length === 0, en.join("; "));
      const names = await page.evaluate(nameProbe);
      check(`V-NAME-1 ${tag}`, names.length === 0, names.join("; "));
      const tg = await page.evaluate(targetProbe);
      check(`V-TGT ${tag}`, tg.length === 0, tg.join("; "));
      const cp = await page.evaluate(copyProbe, TEACHER_NAMES);
      check(`V-COPY ${tag}`, cp.length === 0, cp.join("; "));
    }
    const lamp = await page.evaluate(lampProbe);
    check(`V-SIG-2 ${tag}`, lamp.length === 0, lamp.join("; "));
    const lay = await page.evaluate(layoutProbe);
    check(`V-LAYOUT ${tag}`, !lay.hscroll && !lay.offscreen.length && !lay.empty.length, JSON.stringify(lay));
    check(`no page errors ${tag}`, errors.length === 0, errors.join("; "));
    await page.screenshot({ path: `${SHOTS}/${SLUG(route)}__${w}x${h}__${theme}.png`, fullPage: route === "/" ? false : true });
    if (route === "/") await page.screenshot({ path: `${SHOTS}/landing-full__${w}x${h}__${theme}.png`, fullPage: true });
    await ctx.close();
  }
}

// ───────────────────────────── negative controls for the DOM probes ─────────────────────────────
{
  const { ctx, page } = await open("/");
  await page.evaluate(() => {
    const b = document.createElement("button"); b.textContent = "Abhyaas"; b.className = "btn"; document.querySelector("main").append(b);
    const d = document.createElement("div"); d.setAttribute("data-lamp", ""); d.style.background = "rgb(255, 178, 30)"; d.textContent = "x"; document.querySelector("main").append(d);
    const e = document.createElement("button"); e.className = "btn"; document.querySelector("main").append(e);
    const p = document.createElement("p"); p.textContent = "She will love it!"; document.querySelector("main").append(p);
  });
  check("V-EN-1 negative control: an \"Abhyaas\" button trips", (await page.evaluate(enProbe, HINGLISH)).length > 0);
  check("V-SIG-2 negative control: a [data-lamp] marigold box trips", (await page.evaluate(lampProbe)).length > 0);
  check("V-NAME-1 negative control: an empty button trips", (await page.evaluate(nameProbe)).length > 0);
  check("V-COPY negative control: \"She will love it!\" trips", (await page.evaluate(copyProbe, TEACHER_NAMES)).length >= 2);
  await page.evaluate(() => { const p = document.createElement("p"); p.textContent = "Meet Asha. A weekly note comes on WhatsApp. Ask her anything."; document.querySelector("main").append(p); });
  const cp2 = await page.evaluate(copyProbe, TEACHER_NAMES);
  check("V-COPY negative control: a teacher name, \"her\" and a WhatsApp claim each trip", ["teacher name", "teacher pronoun", "WhatsApp"].every((k) => cp2.some((x) => x.includes(k))), JSON.stringify(cp2));
  await ctx.close();
}

// ───────────────────────────── fold, art, states ─────────────────────────────
{
  const { ctx, page } = await open("/", { w: 360, h: 640 });
  const cta = await page.locator(".hero .site-cta").first().boundingBox();
  check("V-LAYOUT 360: \"Start free set-up\" sits above the 584 dp fold", cta && cta.y + cta.height <= 584, `bottom ${cta && Math.round(cta.y + cta.height)}`);
  const ctaText = (await page.locator(".hero .site-cta").first().textContent())?.trim();
  check("V-STATES signed out: the CTA reads \"Start free set-up\" and goes to /start/class", ctaText === "Start free set-up" && (await page.locator(".hero .site-cta").first().getAttribute("href")) === "/start/class", ctaText);
  const hero = await page.evaluate(() => { const i = document.querySelector('[data-art="bg/landing-hero"] img'); return i ? { src: i.getAttribute("src"), w: i.naturalWidth, prio: i.getAttribute("fetchpriority") } : null; });
  const man = JSON.parse(fs.readFileSync(`${ROOT}public/assets/gen/manifest.json`, "utf8"));
  const landed = man.assets.find((a) => a.id === "bg/landing-hero");
  check("V-ART the hero comes through the ledger (manifest url, loaded, high priority)", landed ? hero?.src === landed.url && hero.w > 0 && hero.prio === "high" : !hero, JSON.stringify(hero));
  const pend = man.assets.filter((a) => a.id.startsWith("promises/")).map((a) => a.id);
  const fb = await page.evaluate(() => [...document.querySelectorAll('[data-art^="promises/"]')].map((e) => [e.getAttribute("data-art"), e.hasAttribute("data-art-fallback")]));
  check("V-ART promise spots: landed ids show the image, pending ids their fallback", fb.length === 4 && fb.every(([id, isFb]) => isFb === !pend.includes(id)), JSON.stringify(fb));
  // lazy: scroll each visible frame into view (the parent shot is desktop only, hidden at 360, and must NOT load there)
  for (const el of await page.locator(".phone img").all()) if (await el.isVisible()) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); }
  const shots = await page.evaluate(() => [...document.querySelectorAll(".phone img")].map((i) => [i.getAttribute("src"), i.offsetParent !== null, i.naturalWidth > 0]));
  check("V-ART the real screenshots load where shown (360: lesson, garden; the parent shot is not fetched)", shots.length === 3 && shots.every(([, vis, ok]) => vis === ok), JSON.stringify(shots));
  // FAQ toggles
  const q = page.locator(".faq-q").first();
  check("V-STATES FAQ answers start collapsed", !(await page.locator("#faq-0").isVisible()));
  await q.click();
  check("V-STATES FAQ opens with aria-expanded and shows its answer", (await q.getAttribute("aria-expanded")) === "true" && await page.locator("#faq-0").isVisible());
  // faces: every face on the landing is one the picker offers, and drawn by the product's own plate (no rig plates)
  const faceProbe = (live) => {
    const ids = [...document.querySelectorAll("[data-tutor]")].map((e) => e.getAttribute("data-tutor"));
    const foreign = [...document.querySelectorAll("img")].map((i) => i.getAttribute("src") ?? "").filter((u) => /\/assets\/teacher\//.test(u));
    return { ids, bad: ids.filter((id) => !live.includes(id)), foreign, plates: document.querySelectorAll("[data-tutor] svg").length };
  };
  const faces = await page.evaluate(faceProbe, LIVE_LOOKS);
  check("V-FACE every landing face is a look the picker offers (shared/tutors.js live), drawn as its plate", faces.ids.length >= LIVE_LOOKS.length && !faces.bad.length && !faces.foreign.length && faces.plates === faces.ids.length, JSON.stringify(faces));
  await page.evaluate(() => { const s = document.createElement("span"); s.setAttribute("data-tutor", "uma"); document.querySelector("main").append(s); const i = document.createElement("img"); i.src = "/assets/teacher/teal/plate/plate.webp"; document.querySelector("main").append(i); });
  const faces2 = await page.evaluate(faceProbe, LIVE_LOOKS);
  check("V-FACE negative control: a draft look and a rig plate both trip", faces2.bad.includes("uma") && faces2.foreign.length === 1, JSON.stringify(faces2));
  await ctx.close();
}
{
  // audio: the site plays nothing that is not a registered no-name clip (the named greeting clips must never appear)
  const { ctx, page } = await open("/", { w: 1280, h: 800 });
  const reqs = [];
  page.on("request", (q) => { if (/\.(mp3|ogg|wav|m4a|opus)(\?|$)/.test(q.url())) reqs.push(new URL(q.url()).pathname); });
  for (const b of await page.locator("main button").all()) if (await b.isVisible()) { await b.click().catch(() => {}); await page.waitForTimeout(80); }
  await page.waitForTimeout(400);
  const clipProbe = () => [...document.querySelectorAll("audio, video, audio source, video source, [data-clip]")].map((e) => e.getAttribute("src") || e.getAttribute("data-clip") || e.tagName.toLowerCase());
  const clips = [...new Set([...(await page.evaluate(clipProbe)), ...reqs])];
  const src = fs.readFileSync(`${ROOT}src/app/landing/Landing.tsx`, "utf8") + fs.readFileSync(`${ROOT}src/app/landing/Site.tsx`, "utf8") + fs.readFileSync(`${ROOT}src/app/Public.tsx`, "utf8");
  const inSrc = [...src.matchAll(/["'`](\/audio\/[^"'`]+)["'`]/g)].map((m) => m[1]);
  const off = [...clips, ...inSrc].filter((c) => !NO_NAME_CLIPS.includes(c));
  check("V-AUDIO every clip the site can play is in the no-name registry (none today)", off.length === 0, JSON.stringify({ clips, inSrc }));
  const ctl = ["/audio/hello-en.mp3"].filter((c) => !NO_NAME_CLIPS.includes(c));
  check("V-AUDIO negative control: the named greeting clip is not in the registry", ctl.length === 1);
  await ctx.close();
}
{
  const { ctx, page } = await open("/", { w: 360, h: 640, block: "**/assets/gen/manifest.json" });
  const st = await page.evaluate(() => ({ heroFb: !!document.querySelector('[data-art="bg/landing-hero"][data-art-fallback]'), h1: document.querySelector("h1")?.textContent, cta: !!document.querySelector(".hero .site-cta") }));
  check("V-ART ledger blocked (tier D / no art): the hero renders its flat fallback, the page stays whole", st.heroFb && st.h1 && st.cta, JSON.stringify(st));
  await page.screenshot({ path: `${SHOTS}/landing-no-art__360x640__light.png` });
  await ctx.close();
}
{
  const { ctx, page } = await open("/", { w: 360, h: 640, me: { id: "g1", email: "x@example.com" } });
  await page.waitForTimeout(2800);
  const t = (await page.locator(".hero .site-cta").first().textContent())?.trim();
  check("V-STATES signed in: the CTA reads \"Go to Taxila\"", t === "Go to Taxila", t);
  const hd = (await page.locator(".site-signin").first().textContent())?.trim();
  check("V-STATES signed in: the header uses the same label as the CTA (\"Open Taxila\" is the installed app's)", hd === t, `${hd} / ${t}`);
  await ctx.close();
}
{
  const { ctx, page } = await open("/trust");
  check("V-STATES /trust redirects to /promises", new URL(page.url()).pathname === "/promises" && (await page.locator("h1").textContent()) === "Our promises", page.url());
  const b = page.locator(".promise-row .btn-quiet").first();
  const closedFirst = !(await page.locator(".promise-detail").first().isVisible()) && (await b.getAttribute("aria-expanded")) === "false";
  check("V-STATES promise rows open collapsed (the [hidden] detail is not shown)", closedFirst);
  await b.click();
  check("V-STATES a promise row expands to its detail (aria-expanded)", (await b.getAttribute("aria-expanded")) === "true" && await page.locator(".promise-detail").first().isVisible());
  await ctx.close();
}
{
  const { ctx, page } = await open("/help");
  const first = await page.evaluate(() => [...document.querySelectorAll("main a[href], main button")].slice(0, 2).map((a) => a.getAttribute("href")));
  check("V-STATES /help: the first actions are tel:1098 and tel:14416", JSON.stringify(first) === JSON.stringify(["tel:1098", "tel:14416"]), JSON.stringify(first));
  await ctx.close();
}
{
  const { ctx, page } = await open("/no-such-page");
  const t = await page.evaluate(() => ({ h1: document.querySelector("h1")?.textContent, home: [...document.querySelectorAll("main a")].some((a) => a.textContent === "Go home" && a.getAttribute("href") === "/") }));
  check("V-STATES 404: \"This page isn't here.\" with Go home", t.h1 === "This page isn't here." && t.home, JSON.stringify(t));
  await ctx.close();
}
{
  const { ctx, page } = await open("/leaving?to=https%3A%2F%2Fwww.childlineindia.org");
  const t = await page.locator("main").innerText();
  check("V-STATES /leaving names the host it hands over to", /www\.childlineindia\.org/.test(t));
  await ctx.close();
}
for (const bad of ["javascript:alert(1)", "//evil.example/x", "data:text/html,<b>x</b>", "ftp://evil.example/", ""]) {
  const { ctx, page } = await open(`/leaving?to=${encodeURIComponent(bad)}`);
  const t = await page.evaluate(() => ({ text: document.querySelector("main")?.innerText ?? "", open: [...document.querySelectorAll("main a")].filter((a) => a.textContent.startsWith("Open")).map((a) => a.getAttribute("href")) }));
  check(`V-STATES /leaving refuses ${JSON.stringify(bad)}: no Open link, "This link does not look right."`, !t.open.length && /This link does not look right\./.test(t.text), JSON.stringify(t.open));
  await ctx.close();
}
{
  // every destination the site sends a visitor to opens a real screen (not the 404, no page error)
  const { ctx, page } = await open("/", { w: 1280, h: 800 });
  const dests = await page.evaluate(() => [...new Set([...document.querySelectorAll("a[href^='/']")].map((a) => a.getAttribute("href").split("#")[0]).filter(Boolean))]);
  await ctx.close();
  const h = await open("/help", { w: 1280, h: 800 });
  const helpDests = await h.page.evaluate(() => [...document.querySelectorAll("main a[href^='/']")].map((a) => a.getAttribute("href")));
  const helpText = await h.page.locator("main").innerText();
  await h.ctx.close();
  const bad = [];
  for (const d of [...new Set([...dests, ...helpDests])]) {
    const o = await open(d, { w: 1280, h: 800 });
    const st = await o.page.evaluate(() => ({ h1: document.querySelector("h1")?.textContent ?? "", body: document.body.innerText.length }));
    if (/This page isn't here/.test(st.h1) || st.body < 20 || o.errors.length) bad.push(`${d}: ${st.h1 || "(blank)"} ${o.errors.join(" ")}`);
    await o.ctx.close();
  }
  check("V-STATES every site destination (CTA, Sign in, nav, help links) opens a real screen", bad.length === 0, bad.join("; ") || [...new Set([...dests, ...helpDests])].join(" "));
  // a control the help copy names ("choose \"X\"") must exist on the route it points to
  const named = [...helpText.matchAll(/choose "([^"]+)"/g)].map((m) => m[1]);
  const missing = [];
  for (const n of named) {
    const o = await open("/start/phone?login=1", { w: 1280, h: 800 });
    if (!(await o.page.getByText(n, { exact: true }).count())) missing.push(n);
    await o.ctx.close();
  }
  check("V-STATES /help names no control that does not exist (no \"Forgot password?\" dead end)", missing.length === 0 && !/choose "Forgot password\?"/.test(helpText), JSON.stringify({ named, missing }));
}

// ───────────────────────────── motion ─────────────────────────────
{
  const { ctx, page } = await open("/", { reduced: "reduce" });
  const m = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--m-enter").trim());
  check("V-MOTION OS reduced motion: --m-enter is 1ms", m === "1ms", m);
  await ctx.close();
  const b = await open("/");
  const m2 = await b.page.evaluate(() => { document.documentElement.setAttribute("data-motion", "reduce"); return getComputedStyle(document.documentElement).getPropertyValue("--m-enter").trim(); });
  check("V-MOTION in-app \"Less motion\" (data-motion=reduce): --m-enter is 1ms", m2 === "1ms", m2);
  const spin = await b.page.evaluate(() => { const d = document.createElement("div"); d.className = "spinner"; document.body.append(d); const a = getComputedStyle(d).animationName; d.remove(); return a; });
  check("V-MOTION the loading ring breathes, never spins", spin !== "tx-spin", spin);
  await b.ctx.close();
}

// ───────────────────────────── brand ─────────────────────────────
{
  const mf = await (await fetch(`${BASE}/manifest.webmanifest`)).json();
  const sizes = [];
  for (const ic of mf.icons) {
    const r = await fetch(BASE + ic.src);
    const buf = Buffer.from(await r.arrayBuffer());
    if (ic.type === "image/png") { const wpx = buf.readUInt32BE(16), hpx = buf.readUInt32BE(20); sizes.push([ic.src, r.ok && `${wpx}x${hpx}` === ic.sizes]); }
    else sizes.push([ic.src, r.ok && /<svg/.test(buf.toString())]);
  }
  check("V-BRAND the web manifest's icons are served at their declared sizes", sizes.every(([, ok]) => ok), JSON.stringify(sizes));
  const fav = await (await fetch(`${BASE}/favicon.svg`)).text();
  check("V-BRAND favicon.svg is the hand-drawn mark: ink and cream only, no lamp, no text", /#24346E/.test(fav) && /#F6F3EC/.test(fav) && !/#FFB21E|<text/i.test(fav));
  const html = await (await fetch(`${BASE}/`)).text();
  check("V-BRAND index.html links the manifest and the apple-touch-icon", /rel="manifest"/.test(html) && /apple-touch-icon/.test(html));
}

// ───────────────────────────── perf ─────────────────────────────
/** A compressing proxy in front of serve.mjs: what "/" would cost if the server gzipped (it does not today). */
const GZ_PORT = await freePort();
const gzSrv = http.createServer(async (req, res) => {
  const r = await fetch(BASE + req.url, { headers: { cookie: req.headers.cookie ?? "" } });
  const buf = Buffer.from(await r.arrayBuffer());
  const type = r.headers.get("content-type") ?? "";
  const h = { "content-type": type, "cache-control": r.headers.get("cache-control") ?? "no-cache" };
  if (/javascript|css|json|html|svg|manifest/.test(type) && /gzip/.test(req.headers["accept-encoding"] ?? "")) { res.writeHead(r.status, { ...h, "content-encoding": "gzip" }); res.end(zlib.gzipSync(buf, { level: 6 })); }
  else { res.writeHead(r.status, h); res.end(buf); }
}).listen(GZ_PORT, "127.0.0.1");
async function perf(label, { throttle, base = BASE }) {
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  // No page.route here: request interception turns off Chromium's HTTP cache and preload matching, which would
  // count the art ledger twice. /api/me goes to serve.mjs, which answers a signed-out visitor.
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  if (throttle) {
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  }
  const types = new Map(), bytes = {};
  cdp.on("Network.responseReceived", (e) => types.set(e.requestId, { type: e.type, url: e.response.url }));
  cdp.on("Network.loadingFinished", (e) => { const t = types.get(e.requestId); if (!t) return; const k = t.type === "Script" ? "js" : t.type === "Stylesheet" ? "css" : t.type === "Image" ? "img" : t.type === "Font" ? "font" : t.type === "Document" ? "html" : t.type.toLowerCase(); bytes[k] = (bytes[k] ?? 0) + e.encodedDataLength; });
  await page.addInitScript(() => {
    window.__lcp = 0; window.__lcpEl = ""; window.__long = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element?.tagName ?? "") + "." + (e.element?.className ?? ""); } }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => { window.__long += l.getEntries().filter((e) => e.duration > 50).length; }).observe({ type: "longtask", buffered: true });
  });
  const t0 = Date.now();
  await page.goto(`${base}/`, { waitUntil: "load" });
  await page.waitForTimeout(throttle ? 4000 : 1500);
  const r = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), el: window.__lcpEl, long: window.__long, fcp: Math.round(performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0) }));
  const kb = Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)]));
  measures[label] = { ...r, kb, wallMs: Date.now() - t0 };
  console.log(`  perf ${label}: ${JSON.stringify(measures[label])}`);
  await ctx.close();
  return measures[label];
}
const N = QUICK ? 1 : 5;
const median = (xs) => { const a = [...xs].sort((p, q) => p - q); return a.length % 2 ? a[(a.length - 1) / 2] : Math.round((a[a.length / 2 - 1] + a[a.length / 2]) / 2); };
const runs = async (label, o) => { const xs = []; for (let i = 0; i < N; i++) xs.push(await perf(`${label}#${i + 1}`, o)); return xs; };
const fast = await perf("unthrottled", { throttle: false });
const slowRuns = await runs("fast3g-cpu4", { throttle: true });
const gzRuns = await runs("fast3g-cpu4-gzip", { throttle: true, base: `http://127.0.0.1:${GZ_PORT}` });
const slowMed = median(slowRuns.map((r) => r.lcp)), gzMed = median(gzRuns.map((r) => r.lcp));
measures.lcpShipped = { n: N, medianMs: slowMed, runsMs: slowRuns.map((r) => r.lcp), el: slowRuns[0].el };
measures.lcpGzipProjection = { n: N, medianMs: gzMed, runsMs: gzRuns.map((r) => r.lcp), note: "a gzip proxy in front of serve.mjs: what ships once the server compresses; a projection, not a gate" };
console.log(`  LCP shipped median ${slowMed} ms ${JSON.stringify(measures.lcpShipped.runsMs)}; gzip projection median ${gzMed} ms ${JSON.stringify(measures.lcpGzipProjection.runsMs)}`);
// The gate is what ships: server/serve.mjs (the Dockerfile CMD). It sends JS/CSS uncompressed (server owner), so this
// is a KNOWN failure until compression lands; it is never counted as a pass. Bar: median <= 2.5 s, n = 5.
knownFail(`V-PERF LCP median (n=${N}) <= 2.5 s on Fast 3G + 4x CPU at 360, served by serve.mjs as shipped`, slowMed > 0 && slowMed <= 2500,
  `median ${slowMed} ms ${JSON.stringify(measures.lcpShipped.runsMs)}; gzip projection median ${gzMed} ms ${JSON.stringify(measures.lcpGzipProjection.runsMs)}; unthrottled ${fast.lcp} ms`,
  "server/serve.mjs: no gzip/brotli");
check("V-PERF fonts on the Latin path <= 90 KB (V-PERF-1)", (fast.kb.font ?? 0) <= 90, `${fast.kb.font ?? 0} KB`);
check("V-PERF art on the first screen <= 350 KB", (fast.kb.img ?? 0) <= 350, `${fast.kb.img ?? 0} KB`);
{
  // the JS/CSS the landing actually requested, and what it weighs gzipped (serve.mjs does not compress)
  const ctx = await browser.newContext({ viewport: { width: 360, height: 640 } });
  const page = await ctx.newPage();
  const files = new Set();
  page.on("request", (q) => { if (/\.(js|css)$/.test(new URL(q.url()).pathname)) files.add(new URL(q.url()).pathname); });
  await page.route("**/api/**", (r) => r.fulfill({ status: 401, contentType: "application/json", body: "{}" }));
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  let raw = 0, gz = 0;
  const list = [];
  for (const f of files) { const b = fs.readFileSync(path.join(dist, f)); raw += b.length; const g = zlib.gzipSync(b, { level: 9 }).length; gz += g; list.push(`${path.basename(f)} ${Math.round(g / 1024)}K`); }
  measures.bundle = { files: list, rawKB: Math.round(raw / 1024), gzipKB: Math.round(gz / 1024) };
  console.log(`  bundle on "/": ${JSON.stringify(measures.bundle)}`);
  check("V-PERF the landing does not load the 3D stage or the lesson (no stage3d / LessonScreen chunk)", ![...files].some((f) => /stage3d|LessonScreen|three/i.test(f)), list.join(", "));
  await ctx.close();
}

await browser.close();
srv.kill();
gzSrv.close();
fs.writeFileSync(`${SHOTS}/checks.json`, JSON.stringify({ at: new Date().toISOString(), results, known, measures }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed${failed.length ? `; FAILED:\n${failed.map((f) => `  - ${f.name}: ${f.detail.slice(0, 200)}`).join("\n")}` : ""}`);
if (known.length) console.log(`${known.length} KNOWN failure(s), not counted as passes:\n${known.map((k) => `  - [${k.owner}] ${k.name}: ${k.detail.slice(0, 200)}`).join("\n")}`);
process.exit(failed.length ? 1 : 0);
