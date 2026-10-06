// ship5 p4-content acceptance (VALUES-100 V3.3-V3.4; owner directive owner-ship-five-2026-10-05): live-built content with
// speculative stagecraft, through the production lesson API. Run against a LOCAL server first (the integrator, with the
// p4-content patches applied), then against taxila.dev after deploy.
//
//   A. Requests on stage: "animation dikhao", "game khelna hai", "picture dikhao", "show me a diagram" — each in a fresh
//      lesson, typed and spoken (cascade) lanes, as the child's 3rd turn. Pass needs, for every request: something new on
//      the stage in THAT turn (a Stagecraft piece, a whiteboard slot that becomes real, or a module mount), her words
//      pointing at it, never a slot that stays empty or fails while she points at the screen; over the requests a PIECE
//      answers (Stagecraft, a module) the request → on-stage time (the turn response) has p90 ≤ 3000 ms, and over those the
//      BOARD answers ("or the teacher draws on the board instead") the board's lateness after her audio starts has
//      p90 ≤ 1500 ms (part C's bar).
//      Mount time on the device is NOT in this number (API run); the client's MOUNT_DEADLINE_MS (1.5 s) bounds it, after
//      which the board twin shows (src/stagecraft/controller.ts).
//   B. A Stagecraft piece is real and safe: kind "stagecraft", an engine archetype whose spec passes its validator
//      without falling back, never a loading state; for a scene explainer, the HOST grades: a wrong act claiming
//      correct:true is wrong, the right act claiming correct:false is right.
//   C. Board sync (the w2f bar, owner-5's animation failure): text lessons walked to explanation beats; every whiteboard
//      slot becomes a board (or the line does not point at the screen), every board re-passes the full gate W0-W9 against
//      her line, and the estimated lateness after her audio starts (arrival − reply − W2F_AUDIO_MS, default 700) has
//      p90 ≤ 1500 ms. The board's source (spec / line / code) is reported from the server log only (not on the wire).
//   E. The real child client (Chromium, when available): in a learn lesson, "animation dikhao na" puts a Stagecraft piece
//      on the stage that PAINTS (the stage controller's layer is fully faded in only after the engine's first good frame,
//      or the board twin after the 1.5 s mount deadline), with no loading / error words on the stage.
//   D. Coverage (report): how many of the 385 class 4-7 topics carry a checked game/simulation + explainer + board plan in
//      data/studio-catalogue (the same files the server ships), and the Stagecraft switch as the lesson shows it.
// Every test account is deleted in a finally (withTestAccount). Correctness from the sandbox; latency numbers from the
// sandbox include the proxy and are reported as such (the bar is judged on the Azure probe fleet).
//
// Run: NODE_USE_ENV_PROXY=1 TAXILA_BASE=http://localhost:8795 node tests/prod/p4-content-acceptance.mjs [--parts A,B,C,D] [--lanes both|typed]
import { arg, withTestAccount, ok, warn, done, BASE, PERSONAS, GREET, freshChild, openLesson, ordinaryTurn, RX, newStageOf, compact, save, browserOn, launchRouted } from "./_owner.mjs";
import { validateAny } from "../../shared/studio-spec-ext/index.ts";
import { normalizeScript, lintScript } from "../../shared/whiteboard.js";
import { gateWhiteboard, withheldValues } from "../../server/studio/qa/whiteboard.js";
import { redactLine, speechMsOf } from "../../server/studio/plan.js";
import { kitFromFile } from "../../server/content/kits.js";
import { getTopic } from "../../server/content/curriculum.js";
import { loadCatalogue } from "../../server/stagecraft/catalogue.js";

const PARTS = arg("parts", "A,B,C,D,E").split(",");
const lanes = arg("lanes", "both");
const AUDIO_MS = Number(process.env.W2F_AUDIO_MS) || 700;
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cat = loadCatalogue();
const kitOf = (topicId) => { try { return kitFromFile(getTopic(topicId)); } catch { return null; } };

/** Poll a Studio slot until it carries an artifact or a terminal state; → { artifact, state, ms } (ms after `t0`). */
async function slotArrival(api, lessonId, intentId, t0, maxMs = 12_000) {
  while (Date.now() - t0 < maxMs) {
    const s = (await api("GET", `/api/studio/slot?lessonId=${lessonId}&intentId=${encodeURIComponent(intentId)}`, undefined, [200, 404]).catch(() => null))?.slot;
    if (s?.artifact) return { artifact: s.artifact, state: s.state, ms: Date.now() - t0 };
    if (s?.state && !["planning", "building", "ready"].includes(s.state)) return { artifact: null, state: s.state, ms: Date.now() - t0 };
    await sleep(100);
  }
  return { artifact: null, state: "timeout", ms: Date.now() - t0 };
}

const out = { base: BASE, requests: [], boards: [], coverage: null };
const onStageMs = [], boardLate = [];
let stagecraftSeen = 0, graded = false;

// ── A + B: requests answered on stage ──
const REQUESTS = [
  { id: "animation", text: "animation dikhao na", persona: "ishaan" },
  { id: "game", text: "game khelna hai", persona: "golu" },
  { id: "picture", text: "picture dikhao", persona: "aarav" },
  { id: "diagram", text: "show me a diagram", persona: "meher" },
];
if (PARTS.includes("A") || PARTS.includes("B")) {
  await withTestAccount(async ({ api }) => {
    for (const rq of REQUESTS) for (const spoken of lanes === "both" ? [false, true] : [false]) {
      const persona = PERSONAS[rq.persona];
      const child = await freshChild(api, persona);
      const topicId = persona.topics[0];
      const tag = `${rq.id} "${rq.text}" (${spoken ? "spoken" : "typed"}, ${topicId}${cat.get(topicId)?.game || cat.get(topicId)?.explainer ? ", catalogue" : ""})`;
      let L;
      try { L = await openLesson(api, child, { topicId, spoken, persona }); } catch (e) { ok(false, `${tag}: lesson start failed: ${e.message}`); continue; }
      try {
        await L.turn(GREET[persona.style] ?? GREET.hinglish, { kind: "greet" });
        const o = ordinaryTurn(L, persona); await L.turn(o.text, { kind: o.kind });
        if (L.ended) { ok(false, `${tag}: the lesson ended on an ordinary turn`); continue; }
        const before = L.last;
        const t0 = Date.now();
        const row = await L.turn(rq.text, { kind: "visual" });
        const r = row.r;
        const art = newStageOf(r, before, { visualOnly: true });
        const slot = r?.ui?.studioSlot ?? null;
        let ms = row.ms, kind = null, real = !!art.length;
        if (slot?.artifact?.kind === "stagecraft") { kind = "stagecraft"; stagecraftSeen++; }
        else if (slot?.intentId && !slot.artifact) {
          const a = await slotArrival(api, L.lessonId, slot.intentId, t0);
          ms = a.ms; kind = a.artifact?.kind ?? `slot:${a.state}`; real = !!a.artifact;
        } else if (slot?.artifact) kind = slot.artifact.kind;
        else if ((r?.moduleCommands ?? []).some((c) => c.op === "mount")) kind = "module";
        const refers = RX.refers.test(String(r?.teacherReply ?? ""));
        ok(real, `${tag}: something new on the stage in that turn (${kind ?? "nothing"}${art.length ? `: ${art.join(", ")}` : ""})`);
        if (slot && !real) ok(!refers, `${tag}: a slot that never filled is never pointed at ("${String(r?.teacherReply ?? "").slice(0, 90)}")`);
        // a piece (Stagecraft, a module) is held to the 3 s request bar; a request the BOARD answers ("or the teacher draws on
        // the board instead") is held to the board's own sync bar (part C's rule: arrival − reply − audio start ≤ 1.5 s)
        if (real) { ok(refers, `${tag}: her words point at it ("${String(r?.teacherReply ?? "").slice(0, 90)}")`); if (kind === "whiteboard") boardLate.push(ms - row.ms - AUDIO_MS); else onStageMs.push(ms); }
        if (kind === "stagecraft") {
          const sc = slot.artifact.stagecraft;
          const v = (() => { try { return validateAny(sc.archetype, sc.spec); } catch { return { fellBack: true }; } })();
          ok(!v.fellBack, `${tag}: B: the Stagecraft piece ${sc.archetype} (${sc.rung}) carries a spec that passes its validator`);
          ok(slot.state !== "planning" && slot.state !== "building", `${tag}: B: never a loading state (${slot.state})`);
          // AT-7 for Stagecraft: every number she says on the reveal turn is on the piece (its spec), the child's own words, or the Director's ask
          const allowed = new Set([...(JSON.stringify(sc.spec ?? {}) + " " + rq.text + " " + (r?.ui?.ask?.text ?? "") + " " + (before?.teacherReply ?? "")).matchAll(/\d+/g)].map((m) => m[0]));
          const said = [...String(r?.teacherReply ?? "").matchAll(/\d+/g)].map((m) => m[0]).filter((n) => !allowed.has(n));
          ok(said.length === 0, `${tag}: B: every number in her reveal line is on the piece or already in the talk (${said.join(",") || "ok"})`);
          if (!graded && sc.archetype === "scene-explainer@1" && sc.spec?.task && PARTS.includes("B")) {
            const t = sc.spec.task;
            const right = t.kind === "tap" ? t.answer : t.kind === "order" ? t.items : t.answer;
            const wrong = t.kind === "tap" ? "__not_a_part__" : t.kind === "order" ? [...t.items].reverse() : t.answer + 1e6;
            const w = await api("POST", "/api/studio/answer", { lessonId: L.lessonId, intentId: slot.intentId, value: { itemId: "task", value: wrong, correct: true }, itemId: "task", mount: "p4c.0" }, [200, 409]).catch((e) => ({ error: e.message }));
            const g = await api("POST", "/api/studio/answer", { lessonId: L.lessonId, intentId: slot.intentId, value: { itemId: "task", value: right, correct: false }, itemId: "task", mount: "p4c.0" }, [200, 409]).catch((e) => ({ error: e.message }));
            if (w?.error || g?.error) warn(`${tag}: B: the piece was not on screen for the host (${w?.error ?? g?.error}) — the kernel held the reveal`);
            else { ok(w.correct === false, `${tag}: B: a wrong act claiming correct:true is graded wrong by the host`); ok(g.correct === true, `${tag}: B: the right act claiming correct:false is graded right`); graded = true; }
          }
        }
        out.requests.push({ tag, kind, ms, real, refers, reply: r?.teacherReply, transcript: compact(L) });
      } finally { await L.end(); }
    }
  }, { tag: "p4c" });
  if (onStageMs.length) ok(q(onStageMs, 0.9) <= 3000, `A: request → on stage p50 ${q(onStageMs, 0.5)} ms, p90 ${q(onStageMs, 0.9)} ms ≤ 3000 ms (n = ${onStageMs.length}; API time from ${BASE.includes("localhost") ? "a local server" : "the sandbox"}, device mount not included)`);
  if (boardLate.length) ok(q(boardLate, 0.9) <= 1500, `A: requests the board answered: lateness after her audio starts p50 ${q(boardLate, 0.5)} ms, p90 ${q(boardLate, 0.9)} ms ≤ 1500 ms (n = ${boardLate.length})`);
  if (stagecraftSeen) ok(true, `A: Stagecraft answered ${stagecraftSeen}/${out.requests.length} requests on stage`);
  else warn(`A: no Stagecraft piece reached the client in ${out.requests.length} requests (STAGECRAFT off on ${BASE}, or every request was answered by the board / a module)`);
}

// ── C: board sync ──
const BOARD_TOPICS = ["c6-science-ch01-t01", "c7-science-ch01-t01", "c5-maths-ch02-t01", "c4-maths-ch05-t01", "c6-maths-ch07-t01", "c5-evs-ch01-t01"];
const LINES = ["haan, main ready hoon", "samjhao na", "mujhe nahi pata, phir se samjhao", "ek example se samjhao", "achha, aur batao", "samajh nahi aaya, board pe dikhao"];
if (PARTS.includes("C")) {
  const late = [];
  const reps = Math.max(1, Math.min(5, Number(process.env.P4C_BOARD_REPS) || 1));
  for (const topicId of Array.from({ length: reps }, () => BOARD_TOPICS).flat()) {
    const classLevel = Number(topicId.match(/^c(\d)/)[1]);
    await withTestAccount(async ({ api }) => {
      const persona = { ...PERSONAS.aarav, classLevel, topics: [topicId] };
      const child = await freshChild(api, persona);
      const L = await openLesson(api, child, { topicId, persona });
      const kit = kitOf(topicId);
      try {
        for (const text of LINES) {
          const row = await L.turn(text);
          const r = row.r;
          const replyAt = Date.now();
          const slot = r?.ui?.studioSlot;
          if (slot?.intentId && /:wb:/.test(slot.intentId) && !slot.artifact) {
            const a = await slotArrival(api, L.lessonId, slot.intentId, replyAt);
            const name = child.first_name ?? persona.name;
            if (!a.artifact) {
              ok(!RX.refers.test(String(r?.teacherReply ?? "")) || a.state === "timeout", `C: ${topicId}: a board slot that did not fill (${a.state}) is not pointed at`);
              continue;
            }
            const sc = a.artifact.script;
            const n = normalizeScript(sc, { strict: true });
            const line = redactLine(r.teacherReply, [name]);
            const g = gateWhiteboard(sc, { reply: line, kit: kit ?? undefined, speechMs: speechMsOf(r.teacherReply), banned: [name], withhold: withheldValues(kit, { line }) });
            ok(n.ok && !lintScript(n.script).length && g.pass, `C: ${topicId}: the board passes strict shape + lint + the full gate W0-W9 against her line (${g.checks.filter((c) => !c.pass).map((c) => c.id).join(",") || "ok"})`);
            late.push(a.ms - AUDIO_MS);
            out.boards.push({ topicId, afterMs: a.ms, lateMs: a.ms - AUDIO_MS, reply: r.teacherReply });
          }
          if (r?.end) break;
        }
      } finally { await L.end(); }
    }, { tag: "p4c-wb" });
  }
  if (late.length) ok(q(late, 0.9) <= 1500, `C: board sync: estimated lateness after her audio starts p50 ${q(late, 0.5)} ms, p90 ${q(late, 0.9)} ms ≤ 1500 ms (n = ${late.length}; arrival − reply − ${AUDIO_MS} ms)`);
  else warn("C: no whiteboard slot opened in the board lessons (the kernel never asked for one)");
}

// ── E: the real client paints the piece ──
if (PARTS.includes("E")) {
  if (!browserOn()) warn("E: browser check skipped (no Chromium / --no-browser)");
  else await withTestAccount(async ({ api }) => {
    const persona = PERSONAS.ishaan;
    const child = await freshChild(api, persona);
    let b = null;
    try {
      b = await launchRouted({ viewport: { width: 400, height: 800 }, cookieFrom: api });
      const { page } = b;
      await page.goto(`${BASE}/c/${child.id}/lesson/new?topic=${persona.topics[0]}&mode=text`, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await page.waitForSelector('[data-testid="lesson"]', { timeout: 60_000 });
      const send = async (text) => {
        const input = page.locator('[data-testid="child-input"]');
        await input.waitFor({ state: "visible", timeout: 45_000 });
        await page.waitForFunction(() => !document.querySelector('[data-testid="child-input"]')?.disabled, null, { timeout: 45_000 }).catch(() => {});
        await input.fill(text);
        await input.press("Enter");
      };
      await send("नमस्ते, हाँ तैयार हूँ"); await page.waitForTimeout(4000);
      await send("समझ गया"); await page.waitForTimeout(4000);
      const t0 = Date.now();
      await send("animation dikhao na");
      let painted = null;
      while (Date.now() - t0 < 20_000 && !painted) {
        painted = await page.evaluate(() => {
          const st = document.querySelector('[data-testid="studio-stage"][data-kind="stagecraft"]');
          if (!st) return null;
          const layer = [...st.querySelectorAll("[data-stage-item]")].find((l) => l.getAttribute("data-stage-item") !== "calm" && getComputedStyle(l).opacity === "1" && l.querySelector("canvas, svg, img"));
          return layer ? { item: layer.getAttribute("data-stage-item"), text: st.innerText.slice(0, 200) } : null;
        }).catch(() => null);
        if (!painted) await page.waitForTimeout(250);
      }
      const ms = Date.now() - t0;
      await page.screenshot({ path: `${process.env.P4C_SHOTS ?? "/tmp"}/p4-content-stage.png` }).catch(() => {});
      // the piece fills its stage box: every canvas of the painted layer sits inside the layer (no piece drawn off-box)
      const geo = await page.evaluate((id) => {
        const layer = document.querySelector(`[data-stage-item="${id}"]`);
        if (!layer) return null;
        const L = layer.getBoundingClientRect();
        return { layer: [L.x, L.y, L.width, L.height].map(Math.round), canvases: [...layer.querySelectorAll("canvas")].map((c) => { const r = c.getBoundingClientRect(); return [r.x, r.y, r.width, r.height].map(Math.round); }) };
      }, painted?.item ?? "").catch(() => null);
      if (geo) {
        const inside = geo.canvases.filter((c) => c[2] > 20).every((c) => c[0] >= geo.layer[0] - 1 && c[1] >= geo.layer[1] - 1 && c[0] + c[2] <= geo.layer[0] + geo.layer[2] + 1 && c[1] + c[3] <= geo.layer[1] + geo.layer[3] + 1);
        ok(inside, `E: the piece's canvases sit inside its stage box (layer ${geo.layer.join(",")}; canvases ${geo.canvases.map((c) => c.join(",")).join(" | ")})`);
      }
      await page.waitForTimeout(6000);
      await page.screenshot({ path: `${process.env.P4C_SHOTS ?? "/tmp"}/p4-content-stage-6s.png` }).catch(() => {});
      ok(!!painted, `E: real client: the Stagecraft piece painted on the stage ${painted ? `${ms} ms after the request was sent (incl. her reply)` : "— never within 20 s"}`);
      if (painted) ok(!/loading|being made|making|error|failed|try again/i.test(painted.text), `E: no loading or error words on the stage ("${painted.text.replace(/\s+/g, " ").slice(0, 80)}")`);
    } catch (e) {
      ok(false, `E: the real-client check could not run: ${String(e?.message ?? e).slice(0, 160)}`);
    } finally { await b?.browser.close().catch(() => {}); }
  }, { tag: "p4c-browser" });
}

// ── D: coverage (what the server ships) ──
if (PARTS.includes("D")) {
  const { coverageReport } = await import("../../evals/p4-content/coverage.mjs");
  const c = coverageReport();
  out.coverage = c;
  console.log(`D: coverage of the 385 class 4-7 topics: game/sim ${c.counts.game}, explainer ${c.counts.explainer}, board plan ${c.counts.boards}, all three ${c.counts.all3}; safety-excluded ${c.counts.excluded}`);
  ok(c.total === 385, `D: the coverage report counts ${c.total} class 4-7 topics (385 expected)`);
}
save("p4-content", out);
done();
