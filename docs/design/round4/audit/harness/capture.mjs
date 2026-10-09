// Round 4 audit capture: every screen a child and a parent see on taxila.dev, at 360x800, 412x915, 1366x768.
// Account: tests/prod/lib.mjs withTestAccount (the w0-smoke flow: API signup → child → consent → hours → body →
// DELETE /api/account in finally). Scratch script; writes only under docs/design/round4/audit/.
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=https://taxila.dev node cap.mjs
import { mkdirSync, writeFileSync, readFileSync, existsSync, renameSync, readdirSync } from "node:fs";
import { withTestAccount, ok, warn, done, BASE } from "/home/user/Taxila/tests/prod/lib.mjs";

const ROOT = process.env.AUDIT_OUT || "/home/user/Taxila/docs/design/round4/audit/";
const SHOTS = ROOT + "shots/";
const MOTION = ROOT + "motion/";
mkdirSync(SHOTS, { recursive: true });
mkdirSync(MOTION + "frames", { recursive: true });
const SIZES = [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1366, height: 768 }];
const PIN = "1357";
const log = [];
const L = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("/home/user/Taxila/node_modules/playwright/index.mjs");
// Chromium through the sandbox proxy fails (ERR_TOO_MANY_RETRIES on the first chunk); every request is routed through
// Node's fetch instead (NODE_USE_ENV_PROXY=1), exactly as tests/prod/_owner.mjs launchRouted does.
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
async function routed(ctx) {
  await ctx.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    if (!/^https?:/.test(url)) return route.continue();
    try {
      const h = { ...(await req.allHeaders()) }; delete h.host; for (const k of Object.keys(h)) if (k.startsWith(":")) delete h[k]; delete h["content-length"];
      const res = await fetch(url, { method: req.method(), headers: h, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer(), redirect: "manual" });
      const headers = {};
      res.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) headers[k] = v; });
      const sc = res.headers.getSetCookie?.() ?? [];
      if (sc.length) headers["set-cookie"] = sc.join("\n");
      return route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    } catch { return route.abort("failed").catch(() => {}); }
  });
  return ctx;
}

function kitKey(itemId) {
  const m = /^(c\d+-[a-z]+)-/.exec(String(itemId ?? ""));
  if (!m) return null;
  const f = `/home/user/Taxila/data/kits/${m[1]}.json`;
  if (!existsSync(f)) return null;
  try { for (const t of JSON.parse(readFileSync(f, "utf8")).topics ?? []) for (const it of t.items ?? []) if (it.id === itemId) return String(it.answer); } catch {}
  return null;
}

/** Type facts for the visible page: font families / sizes / weights in use, smallest text, overflow. */
const facts = (page) => page.evaluate(() => {
  const out = { overflowX: document.documentElement.scrollWidth > window.innerWidth + 1, sizes: {}, families: {}, weights: {}, minText: null, band: document.documentElement.dataset.band ?? null, buttons: 0, small: [] };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!n.textContent.trim()) continue;
    const el = n.parentElement;
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.opacity === "0") continue;
    const fs = parseFloat(cs.fontSize);
    out.sizes[fs] = (out.sizes[fs] ?? 0) + 1;
    const fam = cs.fontFamily.split(",")[0].replace(/"/g, "").trim();
    out.families[fam] = (out.families[fam] ?? 0) + 1;
    out.weights[cs.fontWeight] = (out.weights[cs.fontWeight] ?? 0) + 1;
    if (out.minText === null || fs < out.minText) out.minText = fs;
    if (fs < 14 && out.small.length < 6) out.small.push(`${fs}px "${n.textContent.trim().slice(0, 30)}"`);
  }
  out.buttons = [...document.querySelectorAll("button, a")].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 0; }).length;
  return out;
});

async function shoot(page, name, { sizes = SIZES, settle = 600, full = false } = {}) {
  const row = { name, url: page.url().replace(/\/c\/[0-9a-f-]+/, "/c/:cid"), at: new Date().toISOString(), sizes: {} };
  const orig = page.viewportSize();
  for (const s of sizes) {
    try {
      await page.setViewportSize(s);
      await page.waitForTimeout(settle);
      const p = `${SHOTS}${name}__${s.width}x${s.height}.png`;
      await page.screenshot({ path: p, fullPage: full });
      row.sizes[`${s.width}x${s.height}`] = await facts(page).catch((e) => ({ err: String(e.message).slice(0, 80) }));
    } catch (e) { row.sizes[`${s.width}x${s.height}`] = { err: String(e.message).slice(0, 120) }; }
  }
  if (orig) await page.setViewportSize(orig);
  log.push(row);
  writeFileSync(ROOT + "capture-log.json", JSON.stringify(log, null, 1));
  L("shot", name, row.url);
  return row;
}

const btn = (page, re) => page.locator("button", { hasText: re }).first();
const vis = (loc) => loc.isVisible().catch(() => false);
/** Client-side navigation (no reload: a reload re-locks the parent corner). */
const spaGo = (page, path) => page.evaluate((p) => { history.pushState({}, "", p); dispatchEvent(new PopStateEvent("popstate")); }, path);

async function burst(page, name, n = 10, every = 120) {
  for (let i = 0; i < n; i++) {
    await page.screenshot({ path: `${MOTION}frames/${name}-${String(i).padStart(2, "0")}.png` }).catch(() => {});
    await page.waitForTimeout(every);
  }
}

async function cookieContext(api, opts = {}) {
  const ctx = await routed(await browser.newContext({ viewport: SIZES[0], ...opts }));
  const c = api.cookie();
  const i = c.indexOf("=");
  await ctx.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]);
  return ctx;
}

// ───────────────────────────── 1. public: landing + pre-account onboarding ─────────────────────────────
async function publicPart() {
  const ctx = await routed(await browser.newContext({ viewport: SIZES[0] }));
  const page = await ctx.newPage();
  try {
    await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(1500);
    await shoot(page, "landing", { settle: 900 });
    await shoot(page, "landing-full", { full: true, settle: 900 });
    for (const p of ["promises", "help"]) {
      await page.goto(`${BASE}/${p}`, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(800);
      await shoot(page, `public-${p}`);
    }
    await page.goto(`${BASE}/start/class`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shoot(page, "signup-1-class");
    await btn(page, /^\s*Class 5\s*$/).click();
    await btn(page, /^\s*CBSE/).click().catch(() => {});
    await shoot(page, "signup-1-class-picked");
    await btn(page, /Continue/).click();
    await page.waitForTimeout(1500);
    await shoot(page, "onboarding-2-meet-teacher");
    await btn(page, /Hindi and English mix/).click();
    await shoot(page, "onboarding-2-meet-teacher-picked");
    await btn(page, /Continue/).click();
    await page.waitForTimeout(1200);
    await shoot(page, "signup-3-promises");
    await btn(page, /Type the word parent/).click().catch(() => {});
    await page.waitForTimeout(400);
    await shoot(page, "signup-3-promises-type");
    await page.locator("input:visible").last().fill("parent").catch(() => {});
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    await shoot(page, "signup-4-account");
    // a second class pick: class 8 (Arjun's band) → meet
    await page.goto(`${BASE}/start/class`, { waitUntil: "networkidle" });
    await btn(page, /^\s*Class 8\s*$/).click();
    await btn(page, /^\s*CBSE/).click().catch(() => {});
    await btn(page, /Continue/).click();
    await page.waitForTimeout(1500);
    await shoot(page, "onboarding-2-meet-teacher-class8");
    await page.goto(`${BASE}/who`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(800);
    await shoot(page, "who-signed-out");
    await page.goto(`${BASE}/no-such-page`, { waitUntil: "networkidle" }).catch(() => {});
    await shoot(page, "not-found", { sizes: [SIZES[0], SIZES[2]] });
  } catch (e) {
    ok(false, `public part: ${String(e.message).split("\n")[0]}`);
    await page.screenshot({ path: `${SHOTS}zz-public-error.png` }).catch(() => {});
  } finally { await ctx.close(); }
}

// ───────────────────────────── 2. signed in ─────────────────────────────
async function lesson(page, { prefix, maxTurns = 14, shots = true, wantBoard = true }) {
  const turns = [];
  const onResp = async (res) => {
    const u = res.url();
    if (!u.endsWith("/api/lesson/turn") && !u.endsWith("/api/lesson/start")) return;
    const j = await res.json().catch(() => null);
    if (j) turns.push({ start: u.endsWith("/start"), ...j });
  };
  page.on("response", onResp);
  const seen = { wrong: 0, right: 0, board: 0, module: 0, studio: 0, pad: 0, tiles: 0 };
  try {
    await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
    await page.waitForTimeout(2500);
    if (shots) await shoot(page, `${prefix}-01-start`, { settle: 500 });
    if (shots) await burst(page, `${prefix}-teacher-speaking`, 14, 110);
    const notNow = btn(page, /^\s*Not now\s*$/);
    if (await vis(notNow)) { if (shots) await shoot(page, `${prefix}-02-mic-ask`); await notNow.click(); await page.waitForTimeout(800); }
    await page.waitForSelector('[data-testid="child-input"], [data-testid="type"], [data-testid="number-pad"], [data-testid="choices"] button', { timeout: 45_000 }).catch(() => {});
    const lastTurn = () => turns.at(-1);
    const waitTurn = async (n) => { for (let i = 0; i < 120 && turns.length <= n; i++) await page.waitForTimeout(500); return turns.length > n ? turns.at(-1) : null; };
    const send = async (text) => {
      const n = turns.length;
      if (await vis(page.locator('[data-testid="number-pad"]'))) {
        const hasComma = (await page.locator('[data-testid="number-pad"] .dk-key', { hasText: /^,$/ }).count()) > 0;
        const digits = String(text).replace(hasComma ? /[^\d,]/g : /\D/g, "").replace(/^,+/, "").slice(0, 12) || "0";
        for (const d of digits) await page.locator('[data-testid="number-pad"] .dk-key', { hasText: new RegExp(`^${d}$`) }).first().click().catch(() => {});
        await page.locator('[data-testid="pad-send"], [data-testid="number-pad"] .dk-key--send').first().click().catch(() => {});
        return waitTurn(n);
      }
      const input = page.locator('[data-testid="child-input"]');
      if (!(await vis(input))) await page.locator('[data-testid="type"]').click().catch(() => {});
      await page.waitForTimeout(300);
      if (await vis(page.locator('[data-testid="number-pad"]'))) return send(text);
      await input.fill(text).catch(() => {});
      await page.locator('[data-testid="send"]').click().catch(() => {});
      return waitTurn(n);
    };
    const tapChip = async (label) => {
      const n = turns.length;
      const chips = page.locator('[data-testid="choices"] button');
      const pick = label != null ? chips.filter({ hasText: new RegExp(`^\\s*${String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) : chips;
      if (await pick.count()) await pick.first().click(); else await chips.first().click();
      return waitTurn(n);
    };
    let last = lastTurn();
    let wrongDone = false;
    for (let k = 0; k < maxTurns && !last?.end; k++) {
      await page.waitForTimeout(700);
      const ui = last?.ui ?? {};
      const itemId = ui.ask?.itemId ?? null;
      const key = last?.debug?.item?.answer ?? kitKey(itemId);
      const chipsUp = (ui.chips?.length ?? 0) > 0 && (await vis(page.locator('[data-testid="choices"] button').first()));
      const padUp = await vis(page.locator('[data-testid="number-pad"]'));
      if (itemId && shots) {
        if (padUp && seen.pad++ < 1) await shoot(page, `${prefix}-04-question-pad`);
        else if (chipsUp && seen.tiles++ < 1) await shoot(page, `${prefix}-04-question-tiles`);
        else if (!padUp && !chipsUp && seen.pad + seen.tiles < 1) { seen.pad++; await shoot(page, `${prefix}-04-question-card`); }
      }
      let r, kind = "talk";
      if (itemId && key != null) {
        const goWrong = !wrongDone;
        const ans = goWrong ? (/^-?[\d,]+$/.test(key) ? String(Number(key.replace(/,/g, "")) + 7) : /^\d+\/\d+$/.test(key) ? "1/9" : "pata nahi, shayad sau") : key;
        if (chipsUp) {
          const labels = (ui.chips ?? []).map((c) => c.label);
          r = await tapChip(goWrong ? labels.find((l) => String(l) !== String(key)) ?? labels[0] : key);
        } else r = await send(ans);
        kind = goWrong ? "wrong" : "right";
        if (goWrong) wrongDone = true;
      } else if (chipsUp) { r = await tapChip(null); kind = "chip"; }
      else {
        const lines = wantBoard ? ["haan, main ready hoon", "samjhao na, ek diagram se", "board pe bana ke dikhao", "ok, aage", "haan"] : ["haan", "ok, aage", "haan"];
        r = await send(lines[k % lines.length]);
      }
      if (!r) { warn(`${prefix} turn ${k + 1}: no response`); break; }
      L(`  ${prefix} turn ${k + 1} (${kind}): ${r.move?.kind} verdict=${r.ui?.verdict ?? "-"} tray=${r.ui?.tray ?? "-"} | ${String(r.teacherReply ?? "").slice(0, 70)}`);
      // feedback right after the answer lands
      if (shots && (kind === "wrong" || kind === "right") && seen[kind]++ < 1) {
        await burst(page, `${prefix}-feedback-${kind}`, 10, 100);
        await page.waitForTimeout(400);
        await shoot(page, `${prefix}-05-feedback-${kind}`, { settle: 300 });
      }
      await page.waitForTimeout(1500);
      const stage = await page.evaluate(() => {
        const st = document.querySelector('[data-testid="studio-stage"]');
        const fr = document.querySelector('[data-testid="tray"] iframe');
        const tray = document.querySelector('[data-testid="tray"]');
        return { kind: st?.getAttribute("data-kind") ?? null, frame: !!fr, tray: !!tray };
      }).catch(() => ({}));
      if (shots && stage.kind === "whiteboard" && seen.board++ < 1) { await page.waitForTimeout(5000); await shoot(page, `${prefix}-06-board`); }
      else if (shots && stage.kind && stage.kind !== "whiteboard" && seen.studio++ < 2) { await page.waitForTimeout(3000); await shoot(page, `${prefix}-07-studio-${stage.kind}`); }
      else if (shots && stage.frame && seen.module++ < 1) { await page.waitForTimeout(2500); await shoot(page, `${prefix}-07-module`); }
      else if (shots && r.ui?.whiteboard && seen.board++ < 1) { await page.waitForTimeout(4000); await shoot(page, `${prefix}-06-board-ui`); }
      last = r;
    }
    if (!last?.end) {
      const s1 = await send("bas, aaj ke liye itna hi");
      if (s1 && !s1.end) {
        await page.waitForTimeout(800);
        if (shots) await shoot(page, `${prefix}-08-stop-checkin`);
        const stopChip = page.locator('[data-testid="choices"] button').filter({ hasText: /stop|bas|band|aaj ke liye/i });
        last = (await stopChip.count()) ? await tapChip(await stopChip.first().innerText()) : await send("haan, bas karo");
      } else last = s1;
    }
    const summary = await page.waitForSelector('[data-testid="summary"], [data-testid="summary-show"]', { timeout: 40_000 }).catch(() => null);
    ok(!!summary, `${prefix}: the end-of-lesson summary appears`);
    await page.waitForTimeout(1500);
    if (shots) await shoot(page, `${prefix}-09-end`);
    return { turns, seen };
  } finally { page.off("response", onResp); }
}

async function signedIn({ api, child, password }) {
  const riya = child;
  // siblings: class 4 (band b2, the Young family) and class 8 (band b4, Arjun)
  const sib = async (firstName, classLevel) => {
    const { child: c } = await api("POST", "/api/children", { firstName, classLevel, languagePref: "hinglish", interests: ["cricket"] });
    await api("POST", "/api/consent", { childId: c.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: c.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    return c;
  };
  const kabir = await sib("Kabir", 4);
  const meher = await sib("Meher", 8);
  L("children", riya.id, kabir.id, meher.id);

  const ctx = await cookieContext(api);
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
  try {
    // ── post-account onboarding steps (screens only, nothing submitted) ──
    await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await page.evaluate((cid) => localStorage.setItem("tx.onboarding", JSON.stringify({ lang: "hinglish", child: { classLevel: 5, board: "CBSE", languagePref: "hinglish" }, childId: cid })), riya.id);
    for (const [step, name] of [["consent", "signup-5-consent"], ["child", "onboarding-6-about-child"], ["controls", "onboarding-7-pin-hours"], ["check", "onboarding-8-sound-check"], ["handover", "onboarding-9-handover"]]) {
      await page.goto(`${BASE}/start/${step}`, { waitUntil: "networkidle" }).catch(() => {});
      await page.waitForTimeout(1500);
      await shoot(page, name);
      if (step === "child") await shoot(page, `${name}-full`, { full: true, sizes: [SIZES[0]] });
    }
    await page.goto(`${BASE}/who`, { waitUntil: "networkidle" }).catch(() => {});
    await page.waitForTimeout(1200);
    await shoot(page, "who-picker");

    // the PIN (password-verified first set: the corner opens for this session)
    await api("POST", "/api/parent/pin", { pin: PIN, password });

    // ── Riya, class 5 (b3): the first meeting, card by card ──
    await page.goto(`${BASE}/c/${riya.id}/hello`, { waitUntil: "networkidle" });
    for (let i = 0; i < 10 && /\/hello/.test(page.url()); i++) {
      await page.waitForTimeout(1200);
      const card = await page.locator('[data-testid="hello"]').getAttribute("data-card").catch(() => `${i}`);
      await shoot(page, `child-hello-${String(i + 1).padStart(2, "0")}-${card}`, { settle: 400 });
      const av = page.locator('[role=radio][aria-label="tiger cub"]');
      if (await vis(av)) await av.click();
      const keep = page.locator('[data-testid="name-keep"]');
      const next = (await vis(keep)) ? keep : page.locator('[data-testid^="hello-"]:visible').last();
      await next.click().catch(() => {});
      await page.waitForTimeout(900);
    }
    ok(/\/lesson\//.test(page.url()), `hello leads into the first lesson (${new URL(page.url()).pathname})`);

    // ── the first lesson (her default lane) ──
    if (/\/lesson\//.test(page.url())) await lesson(page, { prefix: "lesson-b3", maxTurns: 16 });
    const homeBtn = page.locator('[data-testid="finish"], [data-testid="summary-home"], button:has-text("Back home")').first();
    if (await vis(homeBtn)) { await homeBtn.click(); await page.waitForTimeout(2500); }

    // ── Riya's child screens ──
    const childScreens = async (c, tag, list) => {
      await page.evaluate((cid) => { try { const k = `taxila.child.${cid}.prefs`; const p = JSON.parse(localStorage.getItem(k) || "{}"); localStorage.setItem(k, JSON.stringify({ ...p, hello: true })); } catch {} }, c.id);
      for (const [path, name] of list) {
        await page.goto(`${BASE}/c/${c.id}${path}`, { waitUntil: "networkidle" }).catch(() => {});
        await page.waitForTimeout(2200);
        await shoot(page, `child-${tag}-${name}`);
      }
    };
    await childScreens(riya, "b3", [["", "home"], ["/map", "map"], ["/notebook", "notebook"], ["/ask", "ask"], ["/me", "me"], ["/teacher", "teacher"], ["/practice", "practice"]]);
    // the map below the fold and a star sheet
    await page.goto(`${BASE}/c/${riya.id}/map`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await shoot(page, "child-b3-map-full", { full: true, sizes: [SIZES[0], SIZES[2]] });
    const star = page.locator(".sky-star, .plant-btn").first();
    if (await vis(star)) { await star.click().catch(() => {}); await page.waitForTimeout(1200); await shoot(page, "child-b3-map-sheet"); }
    await page.goto(`${BASE}/c/${riya.id}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await shoot(page, "child-b3-home-full", { full: true, sizes: [SIZES[0]] });

    // ── Kabir, class 4 (b2, Young): hello card 1, home, garden, notebook, practice, a lesson start ──
    await page.evaluate((cid) => localStorage.removeItem(`taxila.child.${cid}.prefs`), kabir.id).catch(() => {});
    await page.goto(`${BASE}/c/${kabir.id}/hello`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shoot(page, "child-b2-hello-01");
    const av2 = page.locator('[data-testid^="hello-"]:visible').last();
    await av2.click().catch(() => {});
    await page.waitForTimeout(1000);
    await shoot(page, "child-b2-hello-02");
    await av2.click().catch(() => {});
    await page.waitForTimeout(1000);
    await shoot(page, "child-b2-hello-03-avatars");
    await childScreens(kabir, "b2", [["", "home"], ["/map", "map-garden"], ["/notebook", "notebook"], ["/me", "me"]]);
    await page.goto(`${BASE}/c/${kabir.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
    await lesson(page, { prefix: "lesson-b2", maxTurns: 6, wantBoard: false });

    // ── Meher, class 8 (b4, Arjun): home, map, a lesson start ──
    await childScreens(meher, "b4", [["", "home"], ["/map", "map"], ["/me", "me"]]);
    await page.goto(`${BASE}/c/${meher.id}/lesson/new?mode=text`, { waitUntil: "domcontentloaded" });
    await lesson(page, { prefix: "lesson-b4", maxTurns: 6, wantBoard: true });

    // ── the parent corner ──
    await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shoot(page, "parent-0-gate");
    for (const d of PIN) { const k = page.locator("button", { hasText: new RegExp(`^\\s*${d}\\s*$`) }).first(); if (await vis(k)) await k.click(); }
    const okKey = btn(page, /^\s*OK\s*$/);
    if (await vis(okKey)) await okKey.click();
    await page.waitForTimeout(3000);
    await shoot(page, "parent-1-home");
    await shoot(page, "parent-1-home-full", { full: true, sizes: [SIZES[0], SIZES[2]] });
    for (const [path, name] of [["/parent/progress", "parent-2-progress"], ["/parent/lessons", "parent-3-lessons"], ["/parent/controls", "parent-5-controls"], ["/parent/notes", "parent-6-notes"], ["/parent/more", "parent-7-more"], ["/parent/children", "parent-8-children"], ["/parent/help", "parent-9-help"]]) {
      await spaGo(page, `${path}?c=${riya.id}`);
      await page.waitForTimeout(2800);
      await shoot(page, name);
      if (name === "parent-3-lessons") {
        const card = page.locator('a[href*="/parent/lessons/"]').first();
        if (await vis(card)) {
          await card.click().catch(() => {});
          await page.waitForTimeout(3000);
          await shoot(page, "parent-4-lesson-card");
          await shoot(page, "parent-4-lesson-card-full", { full: true, sizes: [SIZES[0]] });
        }
      }
      if (name === "parent-2-progress") await shoot(page, `${name}-full`, { full: true, sizes: [SIZES[0]] });
    }
    ok(errors.length === 0, `no uncaught page errors (${errors.slice(0, 3).join(" | ") || "none"})`);
  } catch (e) {
    ok(false, `signed-in part: ${String(e.message).split("\n")[0]}`);
    await page.screenshot({ path: `${SHOTS}zz-signedin-error.png` }).catch(() => {});
  } finally { await ctx.close(); }

  // ── motion: a recorded context at 412x915 (transition, the teacher speaking, feedback after an answer) ──
  const vdir = MOTION + "raw/";
  mkdirSync(vdir, { recursive: true });
  const mctx = await cookieContext(api, { viewport: { width: 412, height: 915 }, recordVideo: { dir: vdir, size: { width: 412, height: 915 } } });
  const mp = await mctx.newPage();
  const vids = [];
  try {
    await mp.goto(`${BASE}/c/${riya.id}`, { waitUntil: "networkidle" });
    await mp.waitForTimeout(2500);
    await burst(mp, "transition-home-to-map", 1, 0);
    const mapLink = mp.locator('.cs-nav a[href$="/map"]').first();
    await mapLink.click().catch(() => {});
    await burst(mp, "transition-home-to-map", 12, 80);
    await mp.waitForTimeout(1500);
    await mp.locator('.cs-nav a[href$="/notebook"]').first().click().catch(() => {});
    await mp.waitForTimeout(1500);
    await mp.locator('.cs-nav a').first().click().catch(() => {});
    await mp.waitForTimeout(1500);
    await mp.locator('[data-testid="start-lesson"]').first().click().catch(() => {});
    await burst(mp, "transition-home-to-lesson", 14, 100);
    await lesson(mp, { prefix: "motion-lesson", maxTurns: 5, shots: false, wantBoard: false }).catch((e) => warn(`motion lesson: ${e.message}`));
    vids.push(await mp.video()?.path());
  } catch (e) { warn(`motion: ${e.message}`); }
  finally { await mctx.close(); }
  for (const v of vids.filter(Boolean)) { if (existsSync(v)) renameSync(v, MOTION + "session-412x915.webm"); }

  // unlock so DELETE /api/account (requireParentIfPinSet) succeeds in withTestAccount's finally
  await api("POST", "/api/parent/unlock", { pin: PIN }).catch((e) => warn(`unlock before delete: ${e.message}`));
}

try {
  await publicPart();
  await withTestAccount(async (ctx) => {
    try { await signedIn(ctx); }
    finally { await ctx.api("POST", "/api/parent/unlock", { pin: PIN }).catch(() => {}); }
  }, { tag: "r4audit" });
} finally {
  await browser.close();
  writeFileSync(ROOT + "capture-log.json", JSON.stringify(log, null, 1));
}
done();
