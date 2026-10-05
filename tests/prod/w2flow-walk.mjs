// W2 integration: the whole student flow in the REAL client, walked like a family would (BUILD-PLAN §4 Wave 2 exit;
// owner priority 4: everything built appears inside its stage, sized to fit, never overflowing):
//   signup (class, teacher, promises, account, consent, child, PIN + hours, sound check, hand-over) → the first meeting
//   (Hello) → the first lesson → typed turns, including deliberate wrong answers (a re-teach), a Studio piece and a
//   whiteboard explanation → the lesson's end → the child home → the parent corner (home, the lesson card).
// At every key moment the page is shot at 360x800 AND 1366x768 (the same state, the viewport resized) into
// docs/design/gap-audit/w2-flow/ (W2FLOW_SHOTS overrides), and checked: no horizontal page overflow; a Studio stage or a
// module frame sits inside the Work tray, and its drawing inside the stage box.
// The account is deleted at the end (PIN unlock, then DELETE /api/account), and @taxila.test guardians are counted.
//   NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://127.0.0.1:8797 node tests/prod/w2flow-walk.mjs
import { ok, warn, done, BASE, countTestGuardians } from "./lib.mjs";
import { mkdirSync, readFileSync, existsSync } from "node:fs";

const SHOTS = process.env.W2FLOW_SHOTS || new URL("../../docs/design/gap-audit/w2-flow/", import.meta.url).pathname;
mkdirSync(SHOTS, { recursive: true });
const MAX_TURNS = Number(process.env.W2FLOW_TURNS || 26);
const PIN = "1357";
const VIEWS = { phone: { width: 360, height: 800 }, laptop: { width: 1366, height: 768 } };

/** The verified key of a kit item from the repo's kit file (prod sends no debug payload). */
function kitKey(itemId) {
  const m = /^(c\d+-[a-z]+)-/.exec(String(itemId ?? ""));
  if (!m) return null;
  const f = new URL(`../../data/kits/${m[1]}.json`, import.meta.url);
  if (!existsSync(f)) return null;
  try {
    for (const t of JSON.parse(readFileSync(f, "utf8")).topics ?? []) for (const it of t.items ?? []) if (it.id === itemId) return String(it.answer);
  } catch { /* unreadable kit */ }
  return null;
}

process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
const { chromium } = await import("playwright");
const before = await countTestGuardians().catch(() => null);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const context = await browser.newContext({ viewport: VIEWS.phone, ignoreHTTPSErrors: true });
const page = await context.newPage();
const st = Date.now(), rnd = Math.random().toString(36).slice(2, 6);
const email = `prod-w2flow+${st}${rnd}@${process.env.W2FLOW_DOMAIN || "taxila.test"}`, password = `prod-pw-${st}-${rnd}`;
let created = false, shotN = 0;
const errors = [];
page.on("pageerror", (e) => errors.push(String(e.message).slice(0, 160)));
const btn = (re) => page.locator("button", { hasText: re }).first();
const pause = (ms) => page.waitForTimeout(ms);

/** Overflow and containment facts for the current screen. */
const layout = () => page.evaluate(() => {
  const r = (el) => el?.getBoundingClientRect() ?? null;
  const inside = (a, b) => !!a && !!b && a.width > 0 && a.left >= b.left - 1 && a.top >= b.top - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1;
  const tray = r(document.querySelector('[data-testid="tray"]'));
  const box = r(document.querySelector('[data-testid="studio-box"]'));
  const stage = document.querySelector('[data-testid="studio-stage"]');
  const drawing = r(stage?.querySelector("svg, iframe, img, canvas"));
  const frame = r(document.querySelector('[data-testid="tray"] iframe'));
  return {
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    stageKind: stage?.getAttribute("data-kind") ?? null, stageState: stage?.getAttribute("data-state") ?? null,
    boxInTray: box ? inside(box, tray) : null, drawingInBox: box && drawing ? inside(drawing, box) : null,
    frameInTray: frame ? inside(frame, tray) : null,
  };
});

/** Shoot the current state at both sizes; returns the layout facts at each. */
async function shoot(name, { check = true } = {}) {
  const tag = String(++shotN).padStart(2, "0");
  const facts = {};
  for (const [v, size] of Object.entries(VIEWS)) {
    await page.setViewportSize(size);
    await pause(450);
    await page.screenshot({ path: `${SHOTS}${tag}-${name}__${v}-${size.width}x${size.height}.png` });
    facts[v] = await layout();
    if (check) {
      ok(!facts[v].overflowX, `${name} @${v}: no horizontal page overflow`);
      if (facts[v].boxInTray !== null) ok(facts[v].boxInTray, `${name} @${v}: the Studio stage box sits inside the Work tray`);
      if (facts[v].drawingInBox !== null) ok(facts[v].drawingInBox, `${name} @${v}: the ${facts[v].stageKind} is drawn inside the stage box`);
      if (facts[v].frameInTray !== null) ok(facts[v].frameInTray, `${name} @${v}: the module frame sits inside the Work tray`);
    }
  }
  await page.setViewportSize(VIEWS.phone);
  return facts;
}

try {
  // ───────── signup ─────────
  await page.goto(`${BASE}/start/class`, { waitUntil: "networkidle" });
  await shoot("signup-class");
  await btn(/^\s*Class 5\s*$/).click();
  await btn(/^\s*CBSE/).click();
  await btn(/Continue/).click();
  await pause(800);
  await btn(/Hindi and English mix/).click();
  await shoot("signup-meet-teacher");
  await btn(/Continue/).click();
  await pause(800);
  await btn(/Type the word parent/).click();
  await page.locator("input:visible").last().fill("parent");
  await page.keyboard.press("Enter");
  await pause(1000);
  await page.locator('input[autocomplete="name"]').fill("Prod Test");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await shoot("signup-account");
  await btn(/Create account/).click();
  created = true;
  await page.waitForURL(/\/start\/consent/, { timeout: 20_000 });
  await btn(/Yes, remember/).click();
  await btn(/^\s*Yes\s*$/).click();
  await btn(/Only in the app/).click();
  await shoot("signup-consent");
  await btn(/Agree and continue/).click();
  await page.waitForURL(/\/start\/child/, { timeout: 20_000 });
  await page.locator("input:visible").first().fill("Riya");
  await btn(/^\s*Casual\s*$/).click();
  await btn(/^\s*Cricket\s*$/).click();
  await btn(/^\s*Drawing\s*$/).click();
  await shoot("signup-child");
  await page.locator("button[type=submit]").click();
  await page.waitForURL(/\/start\/controls/, { timeout: 20_000 });
  const pin = async () => { for (const d of PIN) await page.locator("button", { hasText: new RegExp(`^\\s*${d}\\s*$`) }).first().click(); };
  await pin(); await btn(/^\s*Next\s*$/).click(); await pause(300);
  await pin(); await btn(/^\s*OK\s*$/).click(); await pause(500);
  // the whole day open, so the walk runs at any hour (the default hours are 07:00-21:00 IST)
  const times = page.locator("input[type=time]");
  await times.nth(0).fill("00:00");
  await times.nth(1).fill("23:59");
  await shoot("signup-pin-hours");
  await btn(/Looks good/).click();
  await page.waitForURL(/\/start\/check/, { timeout: 20_000 });
  await page.locator('[data-testid="check-skip"]').click();
  await page.waitForURL(/\/start\/handover/, { timeout: 20_000 });
  await shoot("signup-handover");
  await page.locator('[data-testid="handover-now"]').click();

  // ───────── the first meeting ─────────
  await page.waitForURL(/\/c\/[0-9a-f-]+\/hello/, { timeout: 20_000 });
  const childId = page.url().match(/\/c\/([0-9a-f-]+)\//)[1];
  ok(!!childId, "signup hands the phone to the child: the first meeting opens");
  for (let i = 0; i < 10 && /\/hello/.test(page.url()); i++) {
    await pause(900);
    await shoot(`hello-${i + 1}`);
    const av = page.locator('[role=radio][aria-label="tiger cub"]');
    if (await av.isVisible().catch(() => false)) await av.click();
    const keep = page.locator('[data-testid="name-keep"]');
    const next = (await keep.isVisible().catch(() => false)) ? keep : page.locator('[data-testid^="hello-"]:visible').last();
    await next.click();
    await pause(900);
  }
  ok(/\/lesson\//.test(page.url()), `the first meeting leads into the first lesson (${new URL(page.url()).pathname})`);

  // ───────── the first lesson ─────────
  const turns = [];
  let start = null;
  page.on("response", async (res) => {
    const u = res.url();
    if (!u.endsWith("/api/lesson/turn") && !u.endsWith("/api/lesson/start")) return;
    const j = await res.json().catch(() => null);
    if (!j) return;
    if (u.endsWith("/start")) start = j; else turns.push(j);
  });
  await page.waitForSelector('[data-testid="child-input"], [data-testid="type"]', { timeout: 45_000 });
  await pause(1500);
  await shoot("lesson-start");
  const notNow = btn(/^\s*Not now\s*$/);
  if (await notNow.isVisible().catch(() => false)) await notNow.click();

  const seen = { wrong: 0, reteach: 0, studio: 0, whiteboard: 0, frame: 0, verdicts: 0, ended: false };
  const wrongItems = new Set();
  let last = start;
  const send = async (text) => {
    const n = turns.length;
    const input = page.locator('[data-testid="child-input"]');
    if (!(await input.isVisible().catch(() => false))) await page.locator('[data-testid="type"]').click().catch(() => {});
    await input.fill(text);
    await page.locator('[data-testid="send"]').click();
    for (let i = 0; i < 120 && turns.length <= n; i++) await pause(500);
    return turns.length > n ? turns.at(-1) : null;
  };
  const tapChip = async (label) => {
    const n = turns.length;
    const chips = page.locator('[data-testid="choices"] button');
    const pick = label != null ? chips.filter({ hasText: new RegExp(`^\\s*${String(label).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) : chips;
    if (await pick.count()) await pick.first().click(); else await chips.first().click();
    for (let i = 0; i < 120 && turns.length <= n; i++) await pause(500);
    return turns.length > n ? turns.at(-1) : null;
  };
  /** A wrong answer of the same shape as the key (a number off by some, else an unlikely word). */
  const wrongOf = (key) => (/^-?\d+$/.test(String(key)) ? String(Number(key) + 7) : /^\d+\/\d+$/.test(String(key)) ? "1/9" : "pata nahi, shayad sau");

  for (let n = 0; n < MAX_TURNS && !last?.end; n++) {
    await pause(600);
    const ui = last?.ui ?? {};
    const itemId = ui.ask?.itemId ?? null;
    const key = last?.debug?.item?.answer ?? kitKey(itemId);
    let r;
    const chipsUp = (ui.chips?.length ?? 0) > 0 && (await page.locator('[data-testid="choices"] button').first().isVisible().catch(() => false));
    // the first two questions get a wrong answer once each (the re-teach path), every later try is right
    const goWrong = itemId && key != null && wrongItems.size < 2 && !wrongItems.has(itemId);
    if (chipsUp && itemId) {
      const labels = (ui.chips ?? []).map((c) => c.label);
      const wrongChip = labels.find((l) => String(l) !== String(key));
      r = await tapChip(goWrong && wrongChip ? wrongChip : key);
      if (goWrong) wrongItems.add(itemId);
    } else if (chipsUp) {
      r = await tapChip(null);
    } else if (itemId && key != null) {
      r = await send(goWrong ? wrongOf(key) : String(key));
      if (goWrong) wrongItems.add(itemId);
    } else {
      r = await send(n % 3 === 1 ? "samjhao na, ek diagram se" : n % 3 === 2 ? "ok, aage" : "haan");
    }
    if (!r) { warn(`turn ${n + 1}: no response`); break; }
    const kind = r.move?.kind;
    if (r.ui?.verdict) seen.verdicts += 1;
    if (r.ui?.verdict && r.ui.verdict !== "correct" && r.ui.verdict !== "right") seen.wrong += 1;
    if (/reteach|hint|worked_example|contrast/.test(String(kind)) && seen.wrong) seen.reteach += 1;
    console.log(`  turn ${n + 1}: ${kind} verdict=${r.ui?.verdict ?? "-"} tray=${r.ui?.tray ?? "-"} slot=${r.ui?.studioSlot?.intentId?.split(":").slice(-2).join(":") ?? "-"} | ${String(r.teacherReply ?? "").slice(0, 80)}`);
    // let the stage settle: a whiteboard script streams in after the reply (the planner), a piece reveals on her cue
    let f = await layout();
    if (r.ui?.tray === "studio" || r.ui?.studioSlot) {
      for (let i = 0; i < 16 && !(f.stageKind && f.drawingInBox !== null); i++) { await pause(500); f = await layout(); }
    } else await pause(900);
    f = await layout();
    const label = f.stageKind === "whiteboard" ? (seen.whiteboard++ < 2 ? "whiteboard" : null)
      : f.stageKind ? (seen.studio++ < 2 ? `studio-${f.stageKind}` : null)
      : f.frameInTray !== null ? (seen.frame++ < 2 ? "module" : null)
      : r.ui?.verdict && r.ui.verdict !== "correct" && seen.wrong <= 2 ? "wrong-answer"
      : seen.reteach === 1 && /reteach|worked_example|contrast/.test(String(kind)) ? "reteach" : null;
    if (label) await shoot(`lesson-t${String(n + 1).padStart(2, "0")}-${label}`);
    last = r;
  }

  // the lesson's end: a natural wrap, else the child's own stop (one warm check-in, then "stop for today")
  if (!last?.end) {
    const s1 = await send("bas, aaj ke liye itna hi");
    console.log(`  stop 1: ${s1?.move?.kind} end=${!!s1?.end} | ${String(s1?.teacherReply ?? "").slice(0, 80)}`);
    if (s1 && !s1.end) {
      ok(s1.move?.kind === "break" || s1.move?.kind === "wrap", `a first stop phrase gets one check-in (${s1.move?.kind})`);
      await pause(800);
      await shoot("lesson-stop-checkin");
      const stopChip = page.locator('[data-testid="choices"] button').filter({ hasText: /stop|bas|band|aaj ke liye/i });
      last = (await stopChip.count()) ? await tapChip(await stopChip.first().innerText()) : await send("haan, bas karo");
    } else last = s1;
  }
  seen.ended = !!last?.end;
  ok(seen.ended, `the lesson ends (${last?.move?.kind})`);
  await pause(2500);
  await shoot("lesson-end");
  ok(seen.verdicts >= 2, `answers were checked (${seen.verdicts} verdicts)`);
  ok(seen.wrong >= 1, `a wrong answer was marked as not yet (${seen.wrong})`);
  if (seen.wrong) ok(seen.reteach >= 1, `a wrong answer led to a hint or re-teach (${seen.reteach})`);
  ok(seen.whiteboard >= 1, `a whiteboard explanation was drawn inside the stage (${seen.whiteboard})`);
  if (!seen.studio) warn(`no Studio piece was revealed in this lesson (${MAX_TURNS} turns; whiteboards ${seen.whiteboard}, module shows ${seen.frame})`);

  // ───────── after the lesson: the child home ─────────
  const homeBtn = page.locator('[data-testid="summary-home"], a[href$="/home"], button:has-text("Home"), button:has-text("Back home")').first();
  if (await homeBtn.isVisible().catch(() => false)) await homeBtn.click(); else await page.goto(`${BASE}/c/${childId}`);
  await pause(2500);
  await shoot("child-home-after");

  // ───────── the parent corner ─────────
  await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
  await pause(1200);
  for (const d of PIN) { const k = page.locator("button", { hasText: new RegExp(`^\\s*${d}\\s*$`) }).first(); if (await k.isVisible().catch(() => false)) await k.click(); }
  await pause(2500);
  await shoot("parent-home");
  const lessonLink = page.locator('a[href*="/parent/lessons"], a[href*="lesson"]').first();
  if (await lessonLink.isVisible().catch(() => false)) { await lessonLink.click(); await pause(2500); await shoot("parent-lessons"); }
  const card = page.locator('a[href*="/parent/lesson/"], [data-testid^="lesson-card"]').first();
  if (await card.isVisible().catch(() => false)) { await card.click(); await pause(2500); await shoot("parent-lesson-card"); }
  ok(errors.length === 0, `no uncaught page errors (${errors.slice(0, 3).join(" | ") || "none"})`);
} catch (e) {
  ok(false, `walk threw: ${String(e?.message ?? e).split("\n")[0]}`);
  await page.screenshot({ path: `${SHOTS}zz-error.png` }).catch(() => {});
} finally {
  if (created) {
    await page.request.post(`${BASE}/api/parent/unlock`, { data: { pin: PIN } }).catch(() => {});
    const del = await page.request.delete(`${BASE}/api/account`, { data: { password, confirm: true } }).catch(() => null);
    ok(del?.status() === 200, `cleanup: the walk's account is deleted (${del?.status() ?? "no response"})`);
  }
  await browser.close();
  const after = await countTestGuardians().catch(() => null);
  if (before != null && after != null) ok(after <= before, `leftover @taxila.test guardians ${before} → ${after}`);
}
done();
