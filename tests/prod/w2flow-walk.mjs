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

/**
 * An API call made BY THE PAGE (same-origin fetch with the page's cookies). Round 3 integration: Playwright's
 * page.request does not send the session cookie's `Secure` flag over a LOCAL http://127.0.0.1 server (NODE_ENV=production
 * sets Secure), so cleanup answered 401 and leaked the account on the TEST branch; the page itself sends it (localhost is a
 * secure context). Same result against taxila.dev (https).
 */
const inPage = (method, path, data) => page.evaluate(async ([m, u, d]) => {
  const r = await fetch(u, { method: m, credentials: "same-origin", headers: { "content-type": "application/json" }, ...(d ? { body: JSON.stringify(d) } : {}) });
  return { status: r.status, ...(await r.json().catch(() => ({}))) };
}, [method, path, data ?? null]);

/** Overflow and containment facts for the current screen. */
const layout = () => page.evaluate(() => {
  const r = (el) => el?.getBoundingClientRect() ?? null;
  const inside = (a, b) => !!a && !!b && a.width > 0 && a.left >= b.left - 1 && a.top >= b.top - 1 && a.right <= b.right + 1 && a.bottom <= b.bottom + 1;
  const tray = r(document.querySelector('[data-testid="tray"]'));
  const box = r(document.querySelector('[data-testid="studio-box"]'));
  const stage = document.querySelector('[data-testid="studio-stage"]');
  // the first VISIBLE drawing: ship5 p4's Stagecraft keeps a hidden interim board canvas (display:none once the piece
  // paints) before the controller's own canvases, and a 0-width rect is never "inside"
  const drawing = [...(stage?.querySelectorAll("svg, iframe, img, canvas") ?? [])].map((e) => r(e)).find((x) => x && x.width > 0) ?? null;
  const frame = r(document.querySelector('[data-testid="tray"] iframe'));
  // round 3 forge camera (src/studio/boardView.ts, StudioStage.tsx st-frame): a FRAMED board draws the whole board at the
  // frame's scale, shifted so the frame fills the box, and the box clips (overflow hidden). Its <svg> is larger than the box
  // by design, so "drawn inside the box" means: the box clips, and every drawn label sits inside it (the camera never crops
  // a drawn op). Unframed boards and other pieces keep the old whole-drawing check.
  const boxEl = document.querySelector('[data-testid="studio-box"]');
  const framed = stage?.getAttribute("data-framed") === "1";
  const clips = !!boxEl && ["hidden", "clip"].includes(getComputedStyle(boxEl).overflowX) && ["hidden", "clip"].includes(getComputedStyle(boxEl).overflowY);
  const labels = framed ? [...stage.querySelectorAll("svg text")].map((e) => r(e)).filter((x) => x && x.width > 0) : [];
  const drawingInBox = !box || !drawing ? null : framed ? clips && labels.every((t) => inside(t, box)) : inside(drawing, box);
  return {
    overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
    stageKind: stage?.getAttribute("data-kind") ?? null, stageState: stage?.getAttribute("data-state") ?? null,
    boxInTray: box ? inside(box, tray) : null, drawingInBox, framed,
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
    // a number item shows the NumberPad: digits only (a key like "1,07,040" is typed as its digits)
    if (await page.locator('[data-testid="number-pad"]').isVisible().catch(() => false)) {
      const hasComma = (await page.locator('[data-testid="number-pad"] .dk-key', { hasText: /^,$/ }).count()) > 0;
      const digits = String(text).replace(hasComma ? /[^\d,]/g : /\D/g, "").replace(/^,+/, "").slice(0, 12) || "0";
      if (/,/.test(String(text))) ok(hasComma, `turn ${turns.length + 1}: the pad has a "," key for a key written with commas (${text})`);
      for (const d of digits) await page.locator('[data-testid="number-pad"] .dk-key', { hasText: new RegExp(`^${d === "," ? "," : d}$`) }).first().click();
      await page.locator('[data-testid="pad-send"], [data-testid="number-pad"] .dk-key--send').first().click();
      for (let i = 0; i < 120 && turns.length <= n; i++) await pause(500);
      return turns.length > n ? turns.at(-1) : null;
    }
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
  const wrongOf = (key) => (/^-?[\d,]+$/.test(String(key)) ? String(Number(String(key).replace(/,/g, "")) + 7) : /^\d+\/\d+$/.test(String(key)) ? "1/9" : "pata nahi, shayad sau");

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
    if (f.stageKind === "whiteboard") {
      // the board draws in step with her voice (anchored to her line's first audio sample; 1.2 s without a signal)
      let marks = 0;
      for (let i = 0; i < 16 && marks < 3; i++) { await pause(500); marks = await page.locator('[data-testid="studio-stage"] svg path, [data-testid="studio-stage"] svg text').count(); }
      ok(marks >= 3, `turn ${n + 1}: the whiteboard draws strokes and labels in the stage (${marks} marks)`);
      await pause(2500);
    }
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
  // the lesson's end summary comes once her closing line has played (or failed to play: headless has no audio)
  const summary = await page.waitForSelector('[data-testid="summary"], [data-testid="summary-show"]', { timeout: 30_000 }).catch(() => null);
  ok(!!summary, "the end-of-lesson summary appears");
  await pause(1200);
  await shoot("lesson-end");
  ok(seen.verdicts >= 2, `answers were checked (${seen.verdicts} verdicts)`);
  ok(seen.wrong >= 1, `a wrong answer was marked as not yet (${seen.wrong})`);
  if (seen.wrong) ok(seen.reteach >= 1, `a wrong answer led to a hint or re-teach (${seen.reteach})`);
  ok(seen.whiteboard >= 1, `a whiteboard explanation was drawn inside the stage (${seen.whiteboard})`);
  if (!seen.studio) warn(`no Studio piece was revealed in this lesson (${MAX_TURNS} turns; whiteboards ${seen.whiteboard}, module shows ${seen.frame})`);

  // ───────── after the lesson: the child home ─────────
  const homeBtn = page.locator('[data-testid="finish"], [data-testid="summary-home"], button:has-text("Back home")').first();
  if (await homeBtn.isVisible().catch(() => false)) await homeBtn.click(); else await page.goto(`${BASE}/c/${childId}`);
  await pause(2500);
  await shoot("child-home-after");

  // ───────── a Studio piece in the stage (a sibling's fractions lesson) ─────────
  // Studio reveals a built piece on her cue after the lesson's opening minutes (W2-H); the walk's first lesson is a big-
  // numbers lesson, so a sibling (class 5) runs the fractions topic W2-H's battery uses, with the @taxila.test clock moved
  // past that moment (POST /api/test/clock: test accounts only), until the stage shows a non-whiteboard piece.
  if (process.env.W2FLOW_STUDIO !== "0") {
    const api = (method, path, data) => inPage(method, path, data);
    await api("POST", "/api/parent/unlock", { pin: PIN });
    const kid = (await api("POST", "/api/children", { firstName: "Aarav", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] })).child;
    if (kid?.id) {
      await api("POST", "/api/consent", { childId: kid.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
      await api("POST", "/api/parent/controls", { childId: kid.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
      await page.evaluate((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } }, kid.id);
      const startP = page.waitForResponse((r) => r.url().endsWith("/api/lesson/start"), { timeout: 45_000 });
      await page.goto(`${BASE}/c/${kid.id}/lesson/new?mode=text&topic=c5-maths-ch02-t02`);
      const st2 = await (await startP).json().catch(() => ({}));
      await page.waitForSelector('[data-testid="child-input"], [data-testid="type"], [data-testid="number-pad"]', { timeout: 45_000 }).catch(() => {});
      if (await btn(/^\s*Not now\s*$/).isVisible().catch(() => false)) await btn(/^\s*Not now\s*$/).click();
      await pause(9000); // the prefetch plans its pieces
      const clock = await api("POST", "/api/test/clock", { advanceMs: 10 * 60_000 });
      if (clock.status !== 200) warn(`test clock refused (${clock.status}): a reveal may not come in this walk`);
      const lines2 = ["haan ready", "teen chauthai matlab 3 by 4", "mujhe nahi pata", "pizza ke 4 hisse", "ek baar aur samjhao", "theek hai", "2 hisse", "haan", "samajh gaya", "aage chalo", "ok", "haan"];
      let piece = null, l2 = st2;
      for (let i = 0; i < lines2.length && !piece && !l2?.end; i++) {
        const key = l2?.debug?.item?.answer ?? kitKey(l2?.ui?.ask?.itemId);
        const r2 = (l2?.ui?.chips?.length && await page.locator('[data-testid="choices"] button').first().isVisible().catch(() => false))
          ? await tapChip(key) : await send(l2?.ui?.ask?.itemId && key != null && i % 2 ? String(key) : lines2[i]);
        if (!r2) break;
        console.log(`  sibling turn ${i + 1}: ${r2.move?.kind} tray=${r2.ui?.tray ?? "-"} reveal=${r2.studio?.reveal ? "yes" : "-"} | ${String(r2.teacherReply ?? "").slice(0, 70)}`);
        let f2 = await layout();
        for (let k = 0; k < 12 && r2.ui?.tray === "studio" && !(f2.stageKind && f2.drawingInBox !== null); k++) { await pause(500); f2 = await layout(); }
        if (f2.stageKind && f2.stageKind !== "whiteboard") { await pause(2500); piece = f2.stageKind; await shoot(`studio-piece-${f2.stageKind}`); }
        l2 = r2;
      }
      ok(!!piece, `a Studio piece (game / skeleton / frame) appeared inside the stage (${piece ?? "none in 12 turns"})`);
      if (piece) {
        // fully interactive in place: a tap inside the piece reaches it (the frame or skeleton takes the pointer)
        const box = await page.locator('[data-testid="studio-box"]').boundingBox();
        if (box) { await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2); await pause(800); await shoot("studio-piece-after-tap"); }
      }
      if (l2?.end !== true && st2?.lessonId) await api("POST", "/api/lesson/end", { lessonId: st2.lessonId });
    } else warn("could not add the sibling for the Studio piece");
  }

  // ───────── the parent corner ─────────
  await page.goto(`${BASE}/parent`, { waitUntil: "networkidle" });
  await pause(1200);
  for (const d of PIN) { const k = page.locator("button", { hasText: new RegExp(`^\\s*${d}\\s*$`) }).first(); if (await k.isVisible().catch(() => false)) await k.click(); }
  const okKey = btn(/^\s*OK\s*$/);
  if (await okKey.isVisible().catch(() => false)) await okKey.click();
  await pause(2500);
  await shoot("parent-home");
  ok(/\/parent/.test(page.url()) && !(await btn(/^\s*OK\s*$/).isVisible().catch(() => false)), "the parent corner opens with the PIN");
  // inside the corner, move by its own navigation (a reload locks it again: the PIN unlock is per visit)
  await page.locator("a", { hasText: /^\s*Lessons\s*$/ }).last().click().catch(() => {});
  await pause(2500);
  await shoot("parent-lessons");
  const card = page.locator('a[href*="/parent/lessons/"]').first();
  ok(await card.isVisible().catch(() => false), "the lesson is listed for the parent");
  if (await card.isVisible().catch(() => false)) {
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await card.click({ timeout: 8000 }).catch(() => card.click({ force: true }));
    await pause(3000);
    ok(/\/parent\/lessons\/[^/?]+/.test(page.url()), `the parent lesson card opens (${new URL(page.url()).pathname})`);
    await shoot("parent-lesson-card");
    await page.goBack().catch(() => {});
    await pause(1500);
  }
  await page.locator("a", { hasText: /^\s*Progress\s*$/ }).last().click().catch(() => {});
  await pause(2500);
  await shoot("parent-progress");
  ok(errors.length === 0, `no uncaught page errors (${errors.slice(0, 3).join(" | ") || "none"})`);
} catch (e) {
  ok(false, `walk threw: ${String(e?.message ?? e).split("\n")[0]}`);
  await page.screenshot({ path: `${SHOTS}zz-error.png` }).catch(() => {});
} finally {
  if (created) {
    await inPage("POST", "/api/parent/unlock", { pin: PIN }).catch(() => {});
    const del = await inPage("DELETE", "/api/account", { password, confirm: true }).catch(() => null);
    ok(del?.status === 200, `cleanup: the walk's account is deleted (${del?.status ?? "no response"})`);
  }
  await browser.close();
  const after = await countTestGuardians().catch(() => null);
  if (before != null && after != null) ok(after <= before, `leftover @taxila.test guardians ${before} → ${after}`);
}
done();
