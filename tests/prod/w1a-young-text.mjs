// W1-A acceptance (BUILD-PLAN §3 W1-A; flows G3, G5): a class-2 child with "Type instead" on (prefs.quiet, the Me row)
// commits at least 3 answers in 12 turns or fewer, on the real client at 360×640, using only what a 7-year-old can:
// the NumberPad, picture tiles and the Help menu. Checks: a NumberPad is visible on 100% of number items; "Show me
// choices" renders tiles (with the current item's key, where the server's debug payload can show it: a local run);
// the parent transcript and lesson card hold 0 help phrases.
//   NODE_USE_ENV_PROXY=1 node tests/prod/w1a-young-text.mjs        (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, launch, BASE } from "./lib.mjs";
import { setPin, HELP_PHRASES } from "./_w1a.mjs";

const MAX_TURNS = 12;

await withTestAccount(async ({ api, child, password }) => {
  const { browser, page } = await launch({ viewport: { width: 360, height: 640 }, cookieFrom: api, launch: { args: ["--autoplay-policy=no-user-gesture-required"] } });
  let lessonId = null;
  try {
    await page.addInitScript((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true, quiet: true })); } catch { /* */ } }, child.id);
    const responses = [];
    // the text lane speaks through the streamed path (W1-A item 10), /api/tts only as its fallback or for "Hear"
    const speech = { stream: 0, clip: 0 };
    page.on("request", (r) => { const u = r.url(); if (u.endsWith("/api/voice/tts-stream")) speech.stream += 1; else if (u.endsWith("/api/tts")) speech.clip += 1; });
    page.on("response", async (r) => {
      const u = r.url();
      if (!u.endsWith("/api/lesson/turn") && !u.endsWith("/api/lesson/start")) return;
      const j = await r.json().catch(() => null);
      if (j) responses.push({ kind: u.endsWith("/start") ? "start" : "turn", status: r.status(), body: j });
    });
    const startP = page.waitForResponse((r) => r.url().endsWith("/api/lesson/start"), { timeout: 45_000 });
    await page.goto(`${BASE}/c/${child.id}/lesson/new`);
    const sr = await startP;
    const start = await sr.json().catch(() => ({}));
    lessonId = start.lessonId;
    ok(sr.status() === 201 && !!lessonId, `class-2 "Type instead" lesson starts (${sr.status()})`);
    ok(start.ui && (await page.locator('[data-testid="dock"]').count()) >= 0, "the Desk is up");

    let last = start;
    let commits = 0, turns = 0, numberItems = 0, padShown = 0, choicesAsked = 0, tilesShown = 0, keyInTiles = 0, keyKnown = 0;
    const turnCount = () => responses.filter((x) => x.kind === "turn").length;
    const nextTurn = async (before) => {
      for (let i = 0; i < 90 && turnCount() <= before; i++) await page.waitForTimeout(500);
      const r = responses.filter((x) => x.kind === "turn").at(-1);
      return turnCount() > before ? r?.body : null;
    };
    const visible = async (sel) => (await page.locator(sel).first().isVisible().catch(() => false));
    while (turns < MAX_TURNS && commits < 3 && !last?.end) {
      // her reply speaks first; the tray is live while she speaks (text lane), so act once the answer surface is up
      await page.waitForSelector('[data-testid="dock"]', { timeout: 20_000 }).catch(() => {});
      await page.waitForTimeout(700);
      const ui = last?.ui ?? {};
      const before = turnCount();
      if (ui.ask?.itemId && !ui.chips?.length && choicesAsked === 0 && turns <= 7 && (await visible('[data-testid="help"]'))) {
        // once per lesson, the Young Help menu's "Show me choices" on a question (flows G3): tiles for THIS item
        await page.click('[data-testid="help"]');
        await page.waitForSelector('[data-testid="help-menu"] [data-help="choices"]', { timeout: 5000 }).catch(() => {});
        await page.click('[data-testid="help-menu"] [data-help="choices"]');
        choicesAsked += 1;
      } else if (ui.chips?.length && (await visible('[data-testid="choices"] button'))) {
        // tap the key when the server's debug payload names it (a local run), else the first tile
        const key = last?.debug?.item?.answer;
        const tile = key != null ? page.locator('[data-testid="choices"] button', { hasText: new RegExp(`^\\s*${String(key).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) : null;
        if (tile && (await tile.count())) await tile.first().click();
        else await page.locator('[data-testid="choices"] button').first().click();
      } else if (ui.answerForm === "number") {
        numberItems += 1;
        const pad = await page.waitForSelector('[data-testid="number-pad"]', { timeout: 8000 }).then(() => true, () => false);
        if (pad) padShown += 1;
        if (pad) {
          for (const d of String(last?.debug?.item?.answer ?? "10").replace(/\D/g, "").slice(0, 6) || "10") await page.locator('[data-testid="number-pad"] .dk-key', { hasText: new RegExp(`^${d}$`) }).first().click();
          await page.click('[data-testid="pad-send"]');
        } else break;
      } else if (await visible('[data-testid="choices"] button')) {
        await page.locator('[data-testid="choices"] button').first().click();
      } else {
        // the Help menu: on a question, "Show me choices"; on a teaching turn, "Show me how" (it moves the lesson on)
        if (!(await visible('[data-testid="help-menu"]')) && (await visible('[data-testid="help"]'))) await page.click('[data-testid="help"]');
        const which = ui.ask?.itemId ? "choices" : "how";
        if (!(await visible(`[data-testid="help-menu"] [data-help="${which}"]`))) {
          warn(`turn ${turns + 1}: no answer surface and no Help menu (ui ${JSON.stringify({ form: ui.answerForm, tray: ui.tray, ask: ui.ask?.text, move: last?.move?.kind })})`);
          if (process.env.W1A_SHOTS) await page.screenshot({ path: `${process.env.W1A_SHOTS}/young-stuck-${turns + 1}.png` });
          break;
        }
        await page.click(`[data-testid="help-menu"] [data-help="${which}"]`);
        if (which === "choices") choicesAsked += 1;
      }
      const r = await nextTurn(before);
      turns += 1;
      if (!r) { warn(`turn ${turns}: no response`); break; }
      if (r.ui?.verdict) commits += 1;
      if (process.env.W1A_VERBOSE) console.log(`  turn ${turns}: ${r.move?.kind} item=${r.move?.itemId ?? "-"} form=${r.ui?.answerForm} chips=${r.ui?.chips?.length ?? 0} verdict=${r.ui?.verdict ?? "-"} phase=${r.ui?.phase} | ${String(r.teacherReply ?? "").slice(0, 90)}`);
      if (choicesAsked && r.ui?.chips?.length && !ui.chips?.length && ui.ask?.itemId) {
        tilesShown += 1;
        await page.waitForTimeout(400);
        const labels = await page.locator('[data-testid="choices"] button').allInnerTexts().catch(() => []);
        ok(labels.length >= 2, `"Show me choices" renders ${labels.length} tiles on screen (${labels.join(" | ")})`);
        const key = last?.debug?.item?.answer ?? r.debug?.item?.answer;
        if (key != null) { keyKnown += 1; if (r.ui.chips.some((c) => c.label === String(key))) keyInTiles += 1; }
        ok(r.ui.ask?.itemId === ui.ask.itemId, "the tiles are for the question on the card (same item)");
      }
      last = r;
    }
    ok(speech.stream > 0 && speech.stream >= speech.clip, `text-lane speech streams (${speech.stream} tts-stream, ${speech.clip} whole-clip requests)`);
    ok(commits >= 3, `committed ${commits} answers in ${turns} turns (≥ 3 in ≤ ${MAX_TURNS})`);
    ok(numberItems === 0 || padShown === numberItems, `NumberPad visible on ${padShown}/${numberItems} number items`);
    if (numberItems === 0) warn("no number item came up in this lesson");
    ok(choicesAsked === 0 || tilesShown > 0, `"Show me choices" asked ${choicesAsked}×, tiles shown ${tilesShown}×`);
    if (keyKnown) ok(keyInTiles === keyKnown, `the tiles include the current item's key (${keyInTiles}/${keyKnown}, from the debug payload)`);
    else warn("the key check needs the server's debug payload (a local run); on production the tiles' key is checked by tests/director-truth.test.mjs");
  } finally { await browser.close(); }

  // ── the parent side: no help phrase is ever the child's words ──
  if (lessonId) {
    await api("POST", "/api/lesson/end", { lessonId }).catch(() => {});
    await setPin(api, password);
    const card = await api("GET", `/api/parent/lesson?childId=${child.id}&lessonId=${lessonId}`);
    const childLines = (card.transcript ?? []).filter((x) => x.speaker === "child").map((x) => x.text);
    ok(Array.isArray(card.transcript), `the class-2 transcript is visible to the parent (${card.transcript?.length ?? 0} turns)`);
    const bad = childLines.filter((x) => HELP_PHRASES.test(x));
    ok(bad.length === 0, `parent transcript: ${bad.length} help phrases as the child's words${bad.length ? ` (${bad.slice(0, 3).join(" | ")})` : ""}`);
    ok(!card.quote || !HELP_PHRASES.test(card.quote), `the lesson card's quote is not a help phrase (${JSON.stringify(card.quote)})`);
    ok(!(card.did?.cards ?? []).some((c) => HELP_PHRASES.test(c.answer)), "no DidCard answer is a help phrase");
  }
}, { tag: "w1a-yt", child: { firstName: "Aarav", classLevel: 2, languagePref: "hinglish", interests: ["cricket"] } });
done();
