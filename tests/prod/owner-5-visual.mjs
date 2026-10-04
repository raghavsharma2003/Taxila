// OWNER TEST 2026-10-04 item 5 — "Show me a diagram" is ignored.
// Owner intent: any request for a diagram / picture / whiteboard / game / animation produces it INSIDE THE STAGE
// (library, live build or whiteboard) within the lesson, with the teacher referring to it.
//
// Each request is made in a fresh lesson, mid-lesson, on the typed and the spoken (cascade) lane. Pass needs ALL of:
//   1. an artifact on the stage, in the reply to the request or the turn after: a module mount, a NEW image board
//      (UiDirectives.whiteboard kind "image"; a text / math board is the written problem, not a picture), a Studio slot (ui.studioSlot) that becomes real (GET /api/studio/slot reports an artifact /
//      revealed within 25 s), or a Studio reveal. For "game", an interactive activity already in the tray counts only
//      when she sends the child to it;
//   2. her words refer to what is on the stage (look / the board / the diagram / here …) on that turn;
//   3. never a text "diagram" (ASCII art; read aloud on the spoken lane), never "I can't draw / show pictures", never
//      "you draw it" or "imagine it" instead of showing (the F16 failure modes, verbatim from the owner's session);
//   4. the common bar (no error / fallback / bare re-ask / defer / unasked end).
// With --browser (default when Chromium exists), the typed-lane "show me a diagram" is also replayed in the REAL child
// client (routed Chromium, 400 x 800): the stage must show something visible (tray or Studio stage) within 25 s.
//
// Run: NODE_USE_ENV_PROXY=1 node tests/prod/owner-5-visual.mjs [--base URL] [--seed N] [--lanes both|typed|spoken] [--no-browser] [--judge model]
import { arg, withTestAccount, ok, warn, done, BASE, SEED, PERSONAS, GREET, freshChild, openLesson, ordinaryTurn, RX, rubric, modelJudge, floorContentOf, newStageOf, stageOf,
  compact, save, tally, browserOn, launchRouted, OUT } from "./_owner.mjs";

const lanes = arg("lanes", "both");
const REQUESTS = [
  { id: "diagram", text: "show me a diagram", persona: "meher" },
  { id: "picture", text: "picture dikhao", persona: "aarav" },
  { id: "draw", text: "draw it", persona: "zoya" },
  { id: "whiteboard", text: "whiteboard pe bana ke samjhao", persona: "kabir" },
  { id: "game", text: "game khelna hai", persona: "golu" },
  { id: "animation", text: "animation dikhao na", persona: "ishaan" },
];

/** Poll the Studio slot until it is real (an artifact, revealed / ready) or `ms` passes. null when there is no such route. */
async function studioSlotReal(api, lessonId, slot, ms = 25_000) {
  if (!slot?.intentId) return { real: false, why: "no intentId on the slot" };
  const t0 = Date.now();
  let last = null;
  while (Date.now() - t0 < ms) {
    const r = await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(slot.intentId)}`, undefined, [200, 404]).catch((e) => ({ status: e.status ?? 0 }));
    if (r.status === 404 && !last) return { real: false, why: "GET /api/studio/slot → 404 (no Studio route on this build)" };
    last = r;
    const st = r.slot?.state ?? r.state;
    if (r.slot?.artifact || r.artifact || ["revealed", "ready", "shown", "playing"].includes(st)) return { real: true, state: st };
    if (["failed", "retired", "error"].includes(st)) return { real: false, why: `slot ${st}` };
    await new Promise((res) => setTimeout(res, 2500));
  }
  return { real: false, why: `slot never became real in ${ms / 1000} s (last state ${last?.slot?.state ?? last?.state ?? "?"})` };
}

const outcomes = [];
const transcripts = [];
await withTestAccount(async ({ api }) => {
  for (const q of REQUESTS) {
    const laneList = lanes === "both" ? [false, true] : [lanes === "spoken"];
    for (const spoken of laneList) {
      const persona = PERSONAS[q.persona];
      const child = await freshChild(api, persona);
      const tag = `${q.id} "${q.text}" (${spoken ? "spoken" : "typed"}, ${persona.name})`;
      let L;
      try { L = await openLesson(api, child, { topicId: persona.topics[0], spoken, persona }); } catch (e) { ok(false, `${tag}: lesson start failed: ${e.message}`); continue; }
      await L.turn(GREET[persona.style] ?? GREET.hinglish, { kind: "greet" });
      const o = ordinaryTurn(L, persona); await L.turn(o.text, { kind: o.kind });
      if (L.ended) { ok(false, `${tag}: the lesson ended on an ordinary turn`); await L.end(); continue; }
      const before = L.last;
      const r1row = await L.turn(q.text, { kind: "visual" });
      const r1 = r1row.r;
      const r2row = !L.ended ? await L.turn(ordinaryTurn(L, persona).text, { kind: "answer" }) : null;
      const r2 = r2row?.r ?? null;
      const problems = [];
      // 1. the artifact
      let art = newStageOf(r1, before, { visualOnly: true }), at = 1;
      if (!art.length && r2) { art = newStageOf(r2, r1, { visualOnly: true }); at = 2; }
      const slot = (at === 1 ? r1 : r2)?.ui?.studioSlot ?? r1?.ui?.studioSlot ?? null;
      if (art.some((a) => a.startsWith("studioSlot")) && art.every((a) => a.startsWith("studioSlot"))) {
        const real = await studioSlotReal(api, L.lessonId, slot);
        if (!real.real) { problems.push({ code: "V1.slot_not_real", why: `a Studio slot was opened but never became an artifact: ${real.why}` }); }
      }
      const existingGame = q.id === "game" && !art.length && stageOf(before).some((a) => a.startsWith("mount")) ? stageOf(before) : [];
      if (!art.length && !existingGame.length) problems.push({ code: "V1.nothing", why: "nothing new on the stage in that turn or the next (no mount, no new board, no Studio slot or reveal)" });
      // 2. she refers to it, on the turn that shows it
      const showing = at === 1 ? r1 : r2;
      const refers = RX.refers.test(String(showing?.teacherReply ?? "")) || (at === 2 && RX.refers.test(String(r1?.teacherReply ?? "")));
      if ((art.length || existingGame.length) && !refers) problems.push({ code: "V2.no_reference", why: "something is on the stage but her words never point at it" });
      // 3. the forbidden substitutes
      for (const [rr, which] of [[r1, "reply"], [r2, "next reply"]]) {
        const t = String(rr?.teacherReply ?? "");
        if (RX.asciiArt.test(t)) problems.push({ code: "V3.ascii", why: `a text 'diagram' in the ${which}${spoken ? " (spoken lane: read aloud)" : ""}` });
        if (RX.cantDraw.test(t)) problems.push({ code: "V3.cant_draw", why: `the ${which} says she cannot draw / show pictures` });
        if (RX.childDraws.test(t)) problems.push({ code: "V3.child_draws", why: `the ${which} tells the CHILD to draw it` });
        if (!art.length && RX.imagine.test(t)) problems.push({ code: "V3.imagine", why: `the ${which} asks the child to imagine it instead of showing it` });
      }
      // 4. the common bar on the request's reply
      problems.push(...rubric(r1, { kind: "visual", prevReply: before?.teacherReply ?? before?.teacherOpening ?? "", prevAsk: before?.ui?.ask?.itemId ? before.ui.ask.text : null, earlier: L.replies().slice(0, -2),
        askHistory: [], lane: L.mode, lang: persona.lang, floorContent: floorContentOf(L.item(r1)), expectEnd: false }).filter((d) => !["R6.ascii"].includes(d.code)));
      problems.push(...(await modelJudge({ previous: before?.teacherReply, child: q.text, reply: r1?.teacherReply, verdict: r1?.ui?.verdict })));
      ok(problems.length === 0, `${tag}: produced on the stage and referred to — ${problems.length ? problems.map((p) => `${p.code}: ${p.why}`).join("; ") : `yes (${[...art, ...existingGame].join(", ")})`} | teacher: "${String(r1?.teacherReply ?? "").slice(0, 110)}"`);
      outcomes.push({ id: q.id, spoken, persona: persona.name, ok: problems.length === 0, problems, artifact: art, at, reply: r1?.teacherReply, next: r2?.teacherReply });
      await L.end();
      transcripts.push({ tag, ...compact(L) });
    }
  }

  // ── the real child client (typed lane): the stage shows something after "show me a diagram" ──
  if (browserOn()) {
    const persona = PERSONAS.meher;
    const child = await freshChild(api, persona);
    let b = null;
    try {
      b = await launchRouted({ viewport: { width: 400, height: 800 }, cookieFrom: api });
      const { page } = b;
      await page.goto(`${BASE}/c/${child.id}/practice/${persona.topics[0]}?mode=text`, { waitUntil: "domcontentloaded", timeout: 60_000 });
      await page.waitForSelector('[data-testid="lesson"]', { timeout: 45_000 });
      const send = async (text) => {
        const input = page.locator('[data-testid="child-input"]');
        await input.waitFor({ state: "visible", timeout: 30_000 });
        await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 30_000 }).catch(() => {});
        await input.fill(text);
        await input.press("Enter");
        await page.waitForTimeout(2500);
      };
      const visibleStage = async () => page.evaluate(() => [...document.querySelectorAll('[data-testid="tray"], [data-testid="studio-stage"]')]
        .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 40 && r.height > 40 && getComputedStyle(e).visibility !== "hidden"; })
        .map((e) => ({ id: e.getAttribute("data-testid"), kind: e.getAttribute("data-kind"), state: e.getAttribute("data-state"), media: !!e.querySelector("iframe, canvas, svg, img") })));
      await send("hi! yes I'm ready");
      await send("okay");
      const beforeStage = JSON.stringify(await visibleStage());
      await send("show me a diagram");
      let seen = null;
      for (let k = 0; k < 10 && !seen; k++) {
        const now = await visibleStage();
        if (now.some((x) => x.media) && JSON.stringify(now) !== beforeStage) seen = now;
        else await page.waitForTimeout(2500);
      }
      await page.screenshot({ path: `${OUT}/owner-5-browser.png` }).catch(() => {});
      ok(!!seen, `real client: after "show me a diagram" the stage shows something new and visible within 25 s${seen ? ` (${JSON.stringify(seen)})` : ""}`);
    } catch (e) {
      ok(false, `real client check could not run: ${String(e.message).slice(0, 160)}`);
    } finally { await b?.browser.close().catch(() => {}); }
  } else warn("browser check skipped (no Chromium / --no-browser)");
}, { tag: "owner5", child: { firstName: "Riya" } });

const passed = outcomes.filter((x) => x.ok).length;
const path = save("owner-5.json", { base: BASE, seed: SEED, outcomes, transcripts });
console.log(`\nvisual requests produced on the stage and referred to: ${passed}/${outcomes.length}; problems: ${tally(outcomes.flatMap((x) => x.problems))}  → ${path}`);
ok(outcomes.length > 0 && passed === outcomes.length, `every diagram / picture / draw / whiteboard / game / animation request produced on the stage: ${passed}/${outcomes.length}`);
done();
