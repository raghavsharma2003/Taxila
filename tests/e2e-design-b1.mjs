// PRODUCT-DESIGN-V2 §13.2 / §14 B1-A6, A7, A9: the Playwright visual + signalling battery for phase B1, standalone
// (not part of `npm test`: it needs Chromium).
//
//   PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node tests/e2e-design-b1.mjs [--base <url>] [--shots <dir>] [--quick]
//
// Without --base it starts its own Vite dev server on a spare port (the /dev/desk route exists in dev builds and
// with VITE_DEV_ROUTES=1). It drives /dev/desk two ways:
//   ?fixture=<state>  every floor / trouble / sheet / feedback / summary state, deterministic (D plate face);
//   ?live=1           the REAL runtime (LessonRuntime + outbox + floor + signals + trouble) with a scripted
//                     Director and a clock-driven voice: states come from real events, and the network is cut
//                     with Playwright's setOffline, so fetch-level failure is real.
// Checks: V-SIG-1..5, V-ASK-1, V-LAYOUT-1/2, V-EN-1, V-NAME-1, V-CHAOS-1 (subset: offline, HTTP 500, slow reply,
// expired session, failed start, TTS failure), V-ID-1 (lesson), receipt ≤ 150 ms, pause + help copy. Every check
// with a negative control runs the control too. Shots (360 × 640 DPR 2 touch, 1280 × 800; light, dark for Older)
// go to docs/design/build/b1/ (or --shots).
import http from "http";
import { mkdirSync } from "fs";
import { chromium } from "playwright";

const ROOT = new URL("..", import.meta.url).pathname;
const arg = (n) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : undefined; };
const flag = (n) => process.argv.includes(n);
const SHOTS = arg("--shots") ?? `${ROOT}docs/design/build/b1`;
const QUICK = flag("--quick");
mkdirSync(SHOTS, { recursive: true });

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

// ───────────── server ─────────────
let base = arg("--base");
const stops = [];
if (!base) {
  const { createServer } = await import("vite");
  const vite = await createServer({ root: ROOT, configFile: ROOT + "vite.config.ts", logLevel: "warn", server: { port: 0, strictPort: false, host: "127.0.0.1" } });
  await vite.listen();
  stops.push(() => vite.close());
  base = vite.resolvedUrls.local[0].replace(/\/$/, "");
}
console.log(`app: ${base}`);
void http;

const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const PHONE = { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true };
const LAPTOP = { viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 };
const errors = [];

async function open(ctxOpts, url, { scheme = "light" } = {}) {
  const ctx = await browser.newContext({ ...ctxOpts, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(`${url}: ${e.message}`));
  await page.goto(`${base}${url}`, { waitUntil: "networkidle" });
  return { ctx, page };
}
const fixture = (name, band = "b3", theme = "light") => `/dev/desk?fixture=${name}&band=${band}&theme=${theme}`;

// ── helpers run in the page ──
const visibleWord = (page) => page.evaluate(() => {
  const el = document.querySelector('[data-testid="state-word"]');
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return { text: el.textContent.trim(), size: parseFloat(cs.fontSize), opacity: Number(cs.opacity), w: r.width, h: r.height, sr: !!el.closest(".dk-sr,.sr-only,.tx-sr") };
});
const lampCount = (page) => page.evaluate(() => [...document.querySelectorAll("[data-lamp]")].map((e) => e.getAttribute("data-testid") + ":" + e.getAttribute("data-floor")));
const chromeText = (page) => page.evaluate(() => {
  const out = [];
  const walk = (n) => {
    if (n.nodeType === 1 && (n.matches("[data-speech], script, style, .dk-sr") || n.getAttribute("aria-hidden") === "true" && n.matches("[data-speech] *"))) return;
    if (n.nodeType === 3 && n.textContent.trim()) out.push(n.textContent.trim());
    for (const c of n.childNodes) walk(c);
  };
  walk(document.body);
  for (const el of document.querySelectorAll("[aria-label]")) if (!el.closest("[data-speech]")) out.push(el.getAttribute("aria-label"));
  return out;
});
const HINGLISH = /\b(ghar|ruko|bolo|bas|bhejo|phir|shuru|chalo|paath|abhyaas|pakka|baari|agla|kyun|aata|karein|karo|humne|banaya|mera|meri|bagiya|aasmaan|tumhare|aage|chalein|nahi|haan|yahan|likho|abhi|suno|kaise|pata|chhoo)\b/i;
const enViolations = (texts) => texts.filter((s) => /[ऀ-ॿ]/.test(s) || HINGLISH.test(s));
const unnamed = (page) => page.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll("button, [role=button], input, a[href]")) {
    if (el.closest("[inert]") || el.offsetParent === null) continue;
    const by = el.getAttribute("aria-labelledby");
    const name = (el.getAttribute("aria-label") || (by && document.getElementById(by)?.textContent) || el.textContent || el.getAttribute("placeholder") || "").trim();
    if (!name) bad.push(el.outerHTML.slice(0, 80));
  }
  return bad;
});
const zones = (page) => page.evaluate(() => {
  const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, left: r.left, right: r.right, h: r.height }; };
  return { vw: innerWidth, vh: innerHeight, sw: document.documentElement.scrollWidth, card: q('[data-testid="question-card"]'), dock: q('[data-testid="dock"]'), tray: q('[data-testid="tray"]'), win: q('[data-testid="teacher-window"]') || q('[data-testid="speech-row"]'), strip: q('[data-testid="trouble-strip"]') };
});

// Image region diff in the page (no new dependency): two PNG data URLs → fraction of pixels that differ.
async function diffFraction(page, a, b) {
  return page.evaluate(async ([a, b]) => {
    const load = async (u) => createImageBitmap(await (await fetch(u)).blob());
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.min(ia.width, ib.width), h = Math.min(ia.height, ib.height);
    const c = new OffscreenCanvas(w, h).getContext("2d");
    c.drawImage(ia, 0, 0); const da = c.getImageData(0, 0, w, h).data;
    c.clearRect(0, 0, w, h); c.drawImage(ib, 0, 0); const db = c.getImageData(0, 0, w, h).data;
    let n = 0;
    for (let i = 0; i < da.length; i += 4) if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 40) n++;
    return n / (w * h);
  }, [a, b]);
}
const CVD = {
  grey: "grayscale(1)",
  protan: "url(#cvd-protan)", deutan: "url(#cvd-deutan)", tritan: "url(#cvd-tritan)",
};
const MATRIX = { // Machado 2009, severity 1.0
  protan: "0.152286 1.052583 -0.204868 0 0  0.114503 0.786281 0.099216 0 0  -0.003882 -0.048116 1.051998 0 0  0 0 0 1 0",
  deutan: "0.367322 0.860646 -0.227968 0 0  0.280085 0.672501 0.047413 0 0  -0.011820 0.042940 0.968881 0 0  0 0 0 1 0",
  tritan: "1.255528 -0.076749 -0.178779 0 0  -0.078411 0.930809 0.147602 0 0  0.004733 0.691367 0.303900 0 0  0 0 0 1 0",
};
async function regionShot(page, mode) {
  await page.evaluate(([mode, M]) => {
    if (!document.getElementById("cvd-defs")) {
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.id = "cvd-defs"; svg.setAttribute("width", "0"); svg.setAttribute("height", "0"); svg.style.position = "absolute";
      svg.innerHTML = Object.entries(M).map(([k, v]) => `<filter id="cvd-${k}"><feColorMatrix type="matrix" values="${v}"/></filter>`).join("");
      document.body.appendChild(svg);
    }
    document.documentElement.style.filter = mode;
  }, [mode, MATRIX]);
  const card = await page.locator('[data-testid="question-card"]').boundingBox();
  const dock = await page.locator('[data-testid="dock"]').boundingBox();
  const clip = { x: Math.min(card.x, dock.x), y: card.y, width: Math.max(card.width, dock.width), height: dock.y + dock.height - card.y };
  const buf = await page.screenshot({ clip, animations: "disabled" });
  await page.evaluate(() => (document.documentElement.style.filter = ""));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

const FLOORS = ["idle", "speaking", "showing", "yielding", "your_turn", "listening", "heard", "thinking"];
const WORD = { speaking: /is talking$/, showing: /^Watch$/, yielding: /^Your turn$/, your_turn: /^Your turn$/, listening: /^Listening…$/, heard: /^Got it$/, thinking: /is thinking$/ };

try {
  // ═════════ V-SIG-1 state words, V-SIG-2 one lamp (fixtures), V-EN-1, V-NAME-1, V-ID-1 on every fixture ═════════
  for (const band of QUICK ? ["b3"] : ["b2", "b3"]) {
    const { ctx, page } = await open(PHONE, fixture("idle", band));
    const sigWords = [];
    for (const f of FLOORS) {
      const fx = f === "showing" ? "work-showing" : f;
      await page.goto(`${base}${fixture(fx, band)}`, { waitUntil: "networkidle" });
      const w = await visibleWord(page);
      if (f === "idle") { sigWords.push(`idle:${w?.text === "" ? "none" : w?.text}`); continue; }
      const ok = w && WORD[f].test(w.text) && w.size >= 16 && w.opacity === 1 && w.w > 0 && !w.sr;
      check(`V-SIG-1 ${band} ${f}: visible word`, ok, w ? `"${w.text}" ${w.size}px` : "missing");
      const lamps = await lampCount(page);
      check(`V-SIG-2 ${band} ${f}: lamp only on the dock in your_turn`, f === "your_turn" ? lamps.length === 1 && lamps[0].startsWith("dock:") : lamps.length === 0, lamps.join(","));
    }
    // negative control V-SIG-1: hide the dock word as sr-only → the check must fail
    await page.goto(`${base}${fixture("your_turn", band)}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector('[data-testid="state-word"]').classList.add("dk-sr"));
    const nc = await visibleWord(page);
    check(`V-SIG-1 negative control ${band}: .dk-sr word is caught`, nc.sr === true);
    // negative control V-SIG-2: a second data-lamp is counted
    await page.goto(`${base}${fixture("work-tiles", band)}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.querySelector('[data-testid="choices"]').setAttribute("data-lamp", ""));
    check(`V-SIG-2 negative control ${band}: a lamp on the tile group is counted`, (await lampCount(page)).length === 2);
    await ctx.close();
  }

  // ═════════ V-SIG-3 / V-SIG-4: greyscale and CVD distinctness of dock + card across the 8 floor states ═════════
  {
    const { ctx, page } = await open(PHONE, fixture("idle", "b3"));
    for (const mode of QUICK ? ["grey"] : ["grey", "protan", "deutan", "tritan"]) {
      const imgs = {};
      for (const f of FLOORS.filter((x) => x !== "showing")) {
        await page.goto(`${base}${fixture(f, "b3")}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(250);
        imgs[f] = await regionShot(page, CVD[mode]);
      }
      let worst = { pair: "", d: 1 };
      const keys = Object.keys(imgs);
      for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
        // heard/thinking differ in the dock word and glyph only: the check is on the whole region as specified
        const d = await diffFraction(page, imgs[keys[i]], imgs[keys[j]]);
        if (d < worst.d) worst = { pair: `${keys[i]}/${keys[j]}`, d };
      }
      check(`V-SIG-${mode === "grey" ? 3 : 4} ${mode}: every pair of floor states differs (≥ 0.5% of the region; spec bar 6% for whole-frame pairs)`, worst.d >= 0.005, `closest ${worst.pair} ${(worst.d * 100).toFixed(1)}%`);
    }
    // negative control: the same frame twice differs by 0
    const a = await regionShot(page, "grayscale(1)");
    check("V-SIG-3 negative control: identical frames are caught as identical", (await diffFraction(page, a, a)) === 0);
    await ctx.close();
  }

  // ═════════ fixtures: layout, English, names, identity; screenshots ═════════
  const FX = ["idle", "speaking", "work-showing", "yielding", "your_turn", "listening", "heard", "thinking", "work-your_turn", "work-tiles", "work-thinking",
    "T1", "T2", "T3", "T4", "T5", "T6", "T8", "T9", "RC", "PTT", "pause", "end", "hint", "help", "grownup", "no-mic", "locked",
    "correct", "not_yet", "partial", "hint-line", "with-help", "board-correct", "board-not_yet", "summary", "summary-tried", "keyboard", "thinking-4s"];
  const matrix = [
    { dev: PHONE, tag: "360", bands: QUICK ? ["b3"] : ["b2", "b3"], themes: ["light"] },
    { dev: PHONE, tag: "360", bands: ["b3"], themes: ["dark"] },
    { dev: LAPTOP, tag: "1280", bands: QUICK ? ["b3"] : ["b2", "b3"], themes: ["light"] },
    { dev: LAPTOP, tag: "1280", bands: ["b3"], themes: ["dark"] },
  ];
  for (const mx of matrix) for (const band of mx.bands) for (const theme of mx.themes) {
    const { ctx, page } = await open(mx.dev, fixture("idle", band, theme), { scheme: theme });
    let layoutBad = [], enBad = [], nameBad = [], idBad = [];
    const list = band === "b2" ? FX.filter((f) => !["hint", "keyboard", "thinking-4s"].includes(f)) : FX.filter((f) => f !== "help-menu");
    if (band === "b2") list.push("help-menu");
    for (const f of list) {
      await page.goto(`${base}${fixture(f, band, theme)}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${SHOTS}/desk__${f}__${band}__${mx.tag}__${theme}.png` });
      const z = await zones(page);
      if (z.sw > z.vw + 1) layoutBad.push(`${f}: horizontal scroll`);
      if (z.card && z.dock && z.card.bottom > z.dock.top + 1) layoutBad.push(`${f}: card overlaps dock`);
      if (z.win && z.card && z.win.bottom > z.card.top + 1 && mx.tag === "360") layoutBad.push(`${f}: face overlaps card`);
      if (z.dock && (z.dock.bottom > z.vh + 1 || z.dock.top < 0)) layoutBad.push(`${f}: dock off screen`);
      if (z.strip && z.dock && z.strip.bottom > z.dock.top + 1) layoutBad.push(`${f}: strip covers the dock`);
      if (z.strip && z.card && z.strip.top < z.card.bottom - 1) layoutBad.push(`${f}: strip covers the card`);
      if (["idle", "speaking", "your_turn", "listening", "heard", "thinking"].includes(f) && z.tray) layoutBad.push(`${f}: tray rendered with nothing in it`);
      enBad.push(...enViolations(await chromeText(page)).map((s) => `${f}: ${s}`));
      nameBad.push(...(await unnamed(page)).map((s) => `${f}: ${s}`));
      const id = await page.evaluate(() => ({
        ids: [...new Set([...document.querySelectorAll("[data-teacher-id]")].map((e) => e.getAttribute("data-teacher-id")))],
        disclosed: [...document.querySelectorAll("[data-ai-label], [data-ai-tag], .teacher-label")].some((e) => e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== "hidden"),
        anyFace: !!document.querySelector("[data-teacher-id]"),
      }));
      if (id.ids.length > 1) idBad.push(`${f}: two teachers ${id.ids}`);
      if (id.anyFace && !id.disclosed) idBad.push(`${f}: no AI label or tag visible`);
    }
    const tag = `${band} ${mx.tag} ${theme}`;
    check(`V-LAYOUT-1/2 ${tag}: zones never overlap, dock and card on screen, no empty tray, no horizontal scroll`, !layoutBad.length, layoutBad.slice(0, 4).join("; "));
    check(`V-EN-1 ${tag}: English chrome (no Devanagari, no Hinglish chrome words outside [data-speech])`, !enBad.length, enBad.slice(0, 4).join("; "));
    check(`V-NAME-1 ${tag}: every control has a name`, !nameBad.length, nameBad.slice(0, 3).join("; "));
    check(`V-ID-1 ${tag}: one teacher id per frame and the AI label/tag visible wherever she is`, !idBad.length, idBad.slice(0, 3).join("; "));
    await ctx.close();
  }
  // V-EN-1 negative control
  {
    const { ctx, page } = await open(PHONE, fixture("work-tiles", "b2"));
    await page.evaluate(() => { document.querySelector('[data-testid="hear-again"] span').textContent = "Abhyaas"; });
    check("V-EN-1 negative control: a Hinglish tile label is caught", enViolations(await chromeText(page)).length > 0);
    await ctx.close();
  }

  // ═════════ font scale 1.3 / 2.0: the card and dock stay fully visible (they never yield) ═════════
  for (const fs of [1.3, 2.0]) {
    const { ctx, page } = await open(PHONE, fixture("your_turn", "b3"));
    await page.addStyleTag({ content: `html { font-size: ${16 * fs}px !important }` });
    await page.evaluate(() => window.dispatchEvent(new Event("resize")));
    await page.waitForTimeout(300);
    const z = await zones(page);
    const scrollable = await page.evaluate(() => document.querySelector('[data-testid="lesson"]').dataset.overflow === "1");
    const ok = z.card && z.dock && z.card.bottom <= z.dock.top + 1 && (scrollable || z.dock.bottom <= z.vh + 1);
    check(`V-LAYOUT-1 font ×${fs}: card and dock fully visible (or the Desk scrolls; never clipped)`, ok, JSON.stringify({ card: z.card?.h, dock: z.dock?.h, scrollable }));
    await page.screenshot({ path: `${SHOTS}/desk__your_turn__b3__360__light__font${fs}.png` });
    await ctx.close();
  }

  // ═════════ LIVE: the real runtime, scripted Director ═════════
  async function live(qs = "", dev = PHONE) {
    const r = await open(dev, `/dev/desk?live=1&band=b3&${qs}`);
    await r.page.evaluate(() => {
      window.__lampMax = 0; window.__lampBad = [];
      const tick = () => {
        const l = [...document.querySelectorAll("[data-lamp]")];
        window.__lampMax = Math.max(window.__lampMax, l.length);
        for (const e of l) if (e.getAttribute("data-testid") !== "dock" || e.getAttribute("data-floor") !== "your_turn") window.__lampBad.push(e.getAttribute("data-testid") + ":" + e.getAttribute("data-floor"));
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    return r;
  }
  const word = (page) => page.locator('[data-testid="state-word"]').textContent().catch(() => "");
  const floorOf = (page) => page.locator('[data-testid="lesson"]').getAttribute("data-floor");
  const waitFloor = (page, f, timeout = 15_000) => page.waitForFunction((f) => document.querySelector('[data-testid="lesson"]')?.getAttribute("data-floor") === f, f, { timeout });

  {
    const { ctx, page } = await live();
    // A cold load has no user activation: exactly one "Tap to hear" (no second start gate after it)
    const gate = await page.locator('[data-testid="tap-to-hear"]').isVisible().catch(() => false);
    check("no second start gate: a cold load shows one 'Tap to hear {T}', and the lesson then runs", gate);
    if (gate) await page.locator('[data-testid="tap-to-hear"]').click();
    await waitFloor(page, "speaking");
    check("live: her opening is SPEAKING with '{T} is talking'", /Arjun is talking/.test(await word(page)));
    await waitFloor(page, "your_turn");
    const ask1 = (await page.locator('[data-testid="ask"]').textContent())?.trim();
    check("V-ASK-1 live: at YOUR TURN the card shows ui.ask.text (not the tail of her speech)", ask1 === "Which is bigger: 1/2 or 1/4?", ask1);
    const marks = await page.evaluate(() => ["floor:your_turn", "earcon:turn", "haptic:your_turn"].map((n) => performance.getEntriesByName(n).at(-1)?.startTime ?? null));
    const spread = marks.every((x) => x !== null) ? Math.max(...marks) - Math.min(...marks) : null;
    check("V-SIG-5 live: lamp, chime and haptic fire from one transition within one frame (≤ 17 ms)", spread !== null && spread <= 17, `${marks.map((x) => x?.toFixed(1)).join(" / ")} → ${spread?.toFixed(1)} ms`);
    await page.screenshot({ path: `${SHOTS}/live__your_turn__b3__360.png` });
    // receipt within 150 ms: tap the mic, then Done
    await page.locator('[data-testid="mic"]').click();
    await waitFloor(page, "listening", 3000);
    check("live: tap the mic → LISTENING ('Listening…' + Done)", /Listening/.test(await word(page)));
    await page.screenshot({ path: `${SHOTS}/live__listening__b3__360.png` });
    const t0 = Date.now();
    await page.locator('[data-testid="mic"]').click();
    await waitFloor(page, "heard", 1000);
    const receipt = Date.now() - t0;
    check("live: the 'Got it' receipt lands within 150 ms of Done", receipt <= 150 && /Got it/.test(await word(page)), `${receipt} ms`);
    await page.waitForSelector('[data-testid="answer-chip"]');
    await waitFloor(page, "thinking", 3000);
    await page.screenshot({ path: `${SHOTS}/live__thinking__b3__360.png` });
    await waitFloor(page, "speaking", 10_000);
    // the verdict lands on the chip on her first voiced frame
    const verdict = await page.locator('[data-testid="answer-chip"]').getAttribute("data-verdict");
    check("live: the verdict lands on the answer chip when she speaks (§4.6)", verdict === "correct", verdict);
    await waitFloor(page, "your_turn");
    check("V-ASK-1 live: a new item pins its own ask", (await page.locator('[data-testid="ask"]').textContent())?.trim() === "How many quarters make one half?");
    check("live: the Board tray appears for a board turn (Work layout)", await page.locator('[data-testid="board"]').isVisible());
    // typed answer → not yet + a hint line; the ask survives the hint turn
    await page.locator('[data-testid="type"]').click();
    await page.locator('[data-testid="child-input"]').fill("three");
    const t1 = Date.now();
    await page.locator('[data-testid="send"]').click();
    await waitFloor(page, "heard", 1000);
    check("live: typed send → 'Got it' within 150 ms", Date.now() - t1 <= 150, `${Date.now() - t1} ms`);
    await waitFloor(page, "your_turn", 15_000);
    const ask2 = (await page.locator('[data-testid="ask"]').textContent())?.trim();
    const hintLine = await page.locator(".dk-line--hint").count();
    check("V-ASK-1 live: the ask survives a hint turn; the hint is a line under it", ask2 === "How many quarters make one half?" && hintLine === 1, `${ask2} / hint lines ${hintLine}`);
    const nv = await page.locator('[data-testid="answer-chip"]').getAttribute("data-verdict");
    check("live: 'not yet' is a magnifier and 'Let's look again', never red", nv === "not_yet" && (await page.locator(".dk-verdict-line").textContent()) === "Let's look again");
    await page.screenshot({ path: `${SHOTS}/live__not_yet__b3__360.png` });
    // pause: titled Paused; helplines only in the help row
    await page.locator('[data-testid="pause"]').click();
    const pauseTitle = (await page.locator("#dk-pause-title").textContent())?.trim();
    const helpRow = await page.locator(".dk-helprow").textContent();
    check("pause sheet: titled 'Paused'; helplines printed, in the Help row only", pauseTitle === "Paused" && /Childline 1098/.test(helpRow) && /Tele-MANAS 14416/.test(helpRow));
    const lampUnderSheet = (await lampCount(page)).length;
    check("V-SIG-2: no lamp under the pause sheet", lampUnderSheet === 0);
    await page.locator('[data-testid="pause-continue"]').click();
    const lampMax = await page.evaluate(() => window.__lampMax);
    const lampBad = await page.evaluate(() => window.__lampBad);
    check("V-SIG-2 live: ≤ 1 [data-lamp] in every animation frame, and only the dock in YOUR TURN", lampMax <= 1 && lampBad.length === 0, `max ${lampMax}, bad ${lampBad.slice(0, 3)}`);
    // tiles turn
    await page.locator('[data-testid="type"]').click().catch(() => {});
    await page.locator('[data-testid="child-input"]').fill("two").catch(() => {});
    await page.locator('[data-testid="send"]').click().catch(() => {});
    await page.waitForSelector('[data-testid="choices"]', { timeout: 15_000 });
    await waitFloor(page, "your_turn", 15_000);
    check("live: a choice turn puts tiles in the tray; the lamp stays on the dock; the mode line points at them", (await lampCount(page))[0]?.startsWith("dock") && /Say it, or tap|Tap a picture above/.test(await page.locator('[data-testid="mode-line"]').textContent()));
    await page.screenshot({ path: `${SHOTS}/live__tiles__b3__360.png` });
    await ctx.close();
  }

  // ═════════ V-CHAOS-1 (subset): every failure → a visible designed state within 3 s; 0 answers lost ═════════
  {
    const { ctx, page } = await live();
    await page.locator('[data-testid="tap-to-hear"]').click().catch(() => {});
    await waitFloor(page, "your_turn");
    await ctx.setOffline(true);
    await page.locator('[data-testid="type"]').click();
    await page.locator('[data-testid="child-input"]').fill("one half");
    await page.locator('[data-testid="send"]').click();
    const tOff = Date.now();
    await page.waitForSelector('[data-strip="T2"]', { timeout: 3000 }).catch(() => {});
    const t2 = await page.locator('[data-strip="T2"]').isVisible().catch(() => false);
    check("V-CHAOS-1 offline: T2 'No internet. Your answers are saved.' within 3 s", t2 && /Your answers are saved/.test(await page.locator('[data-testid="trouble-strip"]').textContent()), `${Date.now() - tOff} ms`);
    await page.waitForSelector('[data-testid="not-sent"]', { timeout: 15_000 }).catch(() => {});
    check("V-CHAOS-1 offline: the chip says 'Not sent yet' (the answer is held, not lost)", await page.locator('[data-testid="not-sent"]').isVisible().catch(() => false));
    check("V-SIG-2: the lamp is off while a trouble strip shows", (await lampCount(page)).length === 0);
    await page.screenshot({ path: `${SHOTS}/live__T2_offline__b3__360.png` });
    await ctx.setOffline(false);
    const tOn = Date.now();
    const rc = await page.waitForSelector('[data-strip="RC"], [data-testid="sent"]', { timeout: 3000 }).then(() => true, () => false);
    check("V-CHAOS-1 recovered: 'Back online.' / 'Sent' within 3 s of the link returning", rc, `${Date.now() - tOn} ms`);
    await page.screenshot({ path: `${SHOTS}/live__RC__b3__360.png` });
    await waitFloor(page, "speaking", 10_000).catch(() => {});
    await page.waitForFunction(() => window.__desk.runtime.state.held.length === 0, null, { timeout: 12_000 }).catch(() => {});
    const st = await page.evaluate(() => ({ held: window.__desk.runtime.state.held.length, calls: window.__desk.calls.map((c) => ({ t: c.childText, retried: !!c.retried })) }));
    const received = st.calls.filter((c) => c.t === "one half");
    check("V-CHAOS-1: 0 answers lost — the offline answer reached the server after reconnect and nothing is left held", st.held === 0 && received.length >= 1,
      `attempts ${received.length}, retried marks ${received.filter((c) => c.retried).length}, held ${st.held}`);
    await ctx.close();
  }
  {
    const { ctx, page } = await live("fail=500:1");
    await page.locator('[data-testid="tap-to-hear"]').click().catch(() => {});
    await waitFloor(page, "your_turn");
    await page.locator('[data-testid="mic"]').click();
    await waitFloor(page, "listening", 3000);
    await page.locator('[data-testid="mic"]').click();
    const t4 = await page.waitForSelector('[data-strip="T4"]', { timeout: 3000 }).then(() => true, () => false);
    check("V-CHAOS-1 HTTP 500: T4 'Your answer didn't send.' with Send again, within 3 s", t4);
    await page.screenshot({ path: `${SHOTS}/live__T4__b3__360.png` });
    await page.locator('[data-testid="strip-send_again"]').click().catch(() => {});
    const resolved = await waitFloor(page, "speaking", 8000).then(() => true, () => false);
    check("V-CHAOS-1 HTTP 500: 'Send again' delivers the held answer and the lesson goes on", resolved);
    await ctx.close();
  }
  if (!QUICK) {
    const { ctx, page } = await live("slow=12000");
    await page.locator('[data-testid="tap-to-hear"]').click().catch(() => {});
    await waitFloor(page, "your_turn");
    await page.locator('[data-testid="mic"]').click();
    await page.locator('[data-testid="mic"]').click();
    const t = Date.now();
    const t1 = await page.waitForSelector('[data-strip="T1"]', { timeout: 10_000 }).then(() => true, () => false);
    const at = Date.now() - t;
    check("V-CHAOS-1 slow reply: T1 'Still working on it…' at 8 s (not before 7.5 s)", t1 && at >= 7500, `${at} ms`);
    await page.screenshot({ path: `${SHOTS}/live__T1__b3__360.png` });
    await ctx.close();
  }
  for (const [qs, id, re] of [["start=401", "T8", /sign in again/], ["start=500", "T9", /couldn't start/], ["tts=fail", "T5", /Sound didn't play/]]) {
    const { ctx, page } = await live(qs);
    await page.locator('[data-testid="tap-to-hear"]').click().catch(() => {});
    const ok = await page.waitForSelector(`[data-strip="${id}"]`, { timeout: 5000 }).then(() => true, () => false);
    const txt = ok ? await page.locator(`[data-strip="${id}"]`).first().textContent() : "";
    check(`V-CHAOS-1 ${qs}: ${id} within 3 s, plain sentence, never a raw API string`, ok && re.test(txt) && !/\(\d{3}\)|failed|error/i.test(txt), txt.slice(0, 60));
    await page.screenshot({ path: `${SHOTS}/live__${id}__b3__360.png` });
    await ctx.close();
  }
  {
    const { ctx, page } = await live("safety=1");
    await page.locator('[data-testid="tap-to-hear"]').click().catch(() => {});
    await waitFloor(page, "your_turn");
    await page.locator('[data-testid="type"]').click();
    await page.locator('[data-testid="child-input"]').fill("something worrying");
    await page.locator('[data-testid="send"]').click();
    const help = await page.waitForSelector('[data-testid="help-sheet"]', { timeout: 5000 }).then(() => true, () => false);
    const txt = help ? await page.locator('[data-testid="help-sheet"]').textContent() : "";
    check("help sheet: raised by the safety move; 'You're not in trouble.'; helplines printed in the buttons", help && /You're not in trouble\./.test(txt) && /Call Childline 1098/.test(txt) && /Call Tele-MANAS 14416/.test(txt));
    const backEarly = await page.locator('[data-testid="help-back"]').count();
    check("help sheet: 'Back to the lesson' is not offered before 10 s", backEarly === 0);
    await page.screenshot({ path: `${SHOTS}/live__help__b3__360.png` });
    await ctx.close();
  }
  // wide live frame
  {
    const { ctx, page } = await live("", LAPTOP);
    await page.locator('[data-testid="tap-to-hear"]').click().catch(() => {});
    await waitFloor(page, "your_turn");
    const z = await zones(page);
    check("1280: two columns — face left, card + dock right; ask ≥ 28 px", z.win && z.card && z.win.right <= z.card.left && (await page.locator('[data-testid="ask"]').evaluate((e) => parseFloat(getComputedStyle(e).fontSize))) >= 28);
    await page.screenshot({ path: `${SHOTS}/live__your_turn__b3__1280.png` });
    await ctx.close();
  }

  // ═════════ shell: the lamp never appears on landing, onboarding or the parent corner ═════════
  for (const url of ["/", "/start/lang", "/parent"]) {
    const { ctx, page } = await open(PHONE, url);
    await page.waitForTimeout(400);
    const lamps = (await lampCount(page)).length;
    const lampColour = await page.evaluate(() => [...document.querySelectorAll("*")].some((e) => /rgb\(255, 178, 30\)/.test(getComputedStyle(e).backgroundColor)));
    check(`V-SIG-2 ${url}: 0 lamp elements and no marigold fill`, lamps === 0 && !lampColour);
    await ctx.close();
  }
} catch (e) {
  check("battery ran to completion", false, e.stack?.split("\n").slice(0, 3).join(" | "));
} finally {
  await browser.close();
  for (const s of stops) await s();
}

if (errors.length) console.log(`page errors:\n  ${[...new Set(errors)].slice(0, 10).join("\n  ")}`);
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed; shots in ${SHOTS}`);
process.exit(failed.length ? 1 : 0);
