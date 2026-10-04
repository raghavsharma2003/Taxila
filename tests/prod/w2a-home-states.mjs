// W2-A acceptance: the home states (STUDENT-FLOW §4.2, SF1; BUILD-PLAN §4 W2-A #9). On the real child client at 360×640:
//   - each of the five Home states (first, start, homework, test_window, safety_hold) renders EXACTLY ONE primary action;
//     done renders none (F1: "one primary action or none"; done never offers one more lesson);
//   - safety_hold offers no lesson start, no practice, no Ask; it shows the Help sheet with both helplines;
//   - the home after a 1-day and a 30-day gap is the same layout apart from the topic and plant states (F7);
//   - the parent's Controls reach the child: homework on, a test window, tap-and-type per child.
// safety_hold is set on the TEST child's conductor_state row through TAXILA_DB_URL (the target's database; a local run
// uses the Neon test branch) — never through a real disclosure, which would reach the human safeguarding queue.
//   NODE_USE_ENV_PROXY=1 node tests/prod/w2a-home-states.mjs        (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, launch, BASE, dbq, targetDbUrl } from "./lib.mjs";
import { driveLesson } from "./_w1c.mjs";
import { setPin, addChild } from "./_w1a.mjs";

const OPEN = { hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 };
const istDay = (plusDays = 0) => new Date(Date.now() + 330 * 60_000 - 4 * 3600_000 + plusDays * 86_400_000).toISOString().slice(0, 10);

/** The home at 360: its primary card state, the count of primary actions, and a layout signature without text. */
async function home(page, cid) {
  await page.goto(`${BASE}/c/${cid}`);
  await page.waitForSelector('[data-testid="primary-card"]:not([data-state="loading"])', { timeout: 30_000 }).catch(() => {});
  return page.evaluate(() => {
    const root = document.querySelector('[data-testid="home"]');
    const card = document.querySelector('[data-testid="primary-card"]');
    const primaries = [...(root?.querySelectorAll(".cs-btn--primary") ?? [])].filter((e) => e.getClientRects().length);
    const sig = [...(root?.querySelectorAll("[data-testid]") ?? [])].map((e) => e.getAttribute("data-testid")).filter((x) => !/^did-card$/.test(x)).join(",");
    return { state: card?.getAttribute("data-state") ?? null, primaries: primaries.length, primaryIds: primaries.map((e) => e.getAttribute("data-testid")),
      sig, start: !!document.querySelector('[data-testid="start-lesson"]'), practice: !!document.querySelector('[data-testid="tile-practice"]'),
      ask: !!document.querySelector('[data-testid="tile-ask"]'), hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
  });
}

await withTestAccount(async ({ api, child, password }) => {
  await setPin(api, password);
  // the browser shares this session: every child screen locks the Parent corner (ChildMode), so unlock before parent calls
  const unlock = () => api("POST", "/api/parent/unlock", { pin: "2580" });
  const parent = async (...a) => { await unlock(); return api(...a); };
  const { browser, page } = await launch({ viewport: { width: 360, height: 640 }, cookieFrom: api });
  try {
    const kids = [child, ...await Promise.all([
      addChild(api, { firstName: "Aarav", classLevel: 4, languagePref: "hinglish", interests: ["animals"] }, OPEN),
      addChild(api, { firstName: "Kabir", classLevel: 6, languagePref: "english", interests: ["space"] }, OPEN),
      addChild(api, { firstName: "Meera", classLevel: 7, languagePref: "hinglish", interests: ["music"] }, OPEN),
    ])];
    await page.addInitScript((ids) => { try { for (const id of ids) localStorage.setItem(`taxila.child.${id}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } }, kids.map((k) => k.id));
    const [riya, aarav, kabir, meera] = kids;
    const one = (h, want) => {
      ok(h.state === want, `home state ${want} (got ${h.state})`);
      ok(h.primaries === 1, `${want}: exactly one primary action (${h.primaries}: ${h.primaryIds.join(", ")})`);
      ok(!h.hscroll, `${want}: no horizontal scroll at 360`);
    };

    // first: no lesson ever
    one(await home(page, riya.id), "first");

    // start: a lesson row exists (an accidental short start), nothing done today
    const s0 = await api("POST", "/api/lesson/start", { childId: aarav.id, mode: "text" });
    await api("POST", "/api/lesson/end", { lessonId: s0.lessonId });
    one(await home(page, aarav.id), "start");

    // homework: the parent's "Homework help today" (Controls) reaches the child's home; today's lesson stays as a link
    const c1 = await parent("POST", "/api/parent/controls", { childId: aarav.id, homeworkToday: true });
    ok(c1.controls.homeworkToday === true, "Controls saves Homework help today");
    const hw = await home(page, aarav.id);
    one(hw, "homework");
    ok(await page.locator('[data-testid="homework-lesson"]').count() === 1, "homework: today's lesson is the second card (a link, not a second primary)");
    await parent("POST", "/api/parent/controls", { childId: aarav.id, homeworkToday: false });

    // test_window: a school test covering today; the card names the subject, the lesson revises it
    const k0 = await api("POST", "/api/lesson/start", { childId: kabir.id, mode: "text" });
    await api("POST", "/api/lesson/end", { lessonId: k0.lessonId });
    const tw = await parent("POST", "/api/parent/test-window", { childId: kabir.id, subject: "maths", from: istDay(-1), to: istDay(3) });
    ok(tw.window?.subject === "maths", "Controls saves the school test window");
    const tp = await api("GET", `/api/child/plan?childId=${kabir.id}`);
    ok(tp.state === "test_window" && tp.testWindow?.subject === "maths" && tp.topic?.subject === "maths", `plan: test_window, revising maths (${tp.state}, ${tp.topic?.subject})`);
    one(await home(page, kabir.id), "test_window");
    const bad = await parent("POST", "/api/parent/test-window", { childId: kabir.id, subject: "maths", from: istDay(0), to: istDay(40) }, [400]);
    ok(/3 weeks/.test(bad.error), "a test window longer than 3 weeks is refused");

    // done: after a real lesson
    const st = await driveLesson(api, meera.id, { maxTurns: 10 });
    ok(st.turns.some((t) => t.verdict), "Meera: a graded answer landed");
    // done: F1 allows one primary or NONE; done has none by design ("never one more"); Practise something is a link
    const dn = await home(page, meera.id);
    ok(dn.state === "done", `home state done (got ${dn.state})`);
    ok(dn.primaries === 0 && !dn.start, `done: no primary action and no lesson start (${dn.primaries})`);
    ok(!dn.hscroll, "done: no horizontal scroll at 360");
    ok(await page.locator('[data-testid="practise-something"]').count() === 1, "done: Practise something is a link (not a second primary)");

    // tap and type per child: set from Controls, returned with the child's plan (any phone)
    await parent("POST", "/api/parent/controls", { childId: meera.id, textOnly: true });
    const mp = await api("GET", `/api/child/plan?childId=${meera.id}`);
    ok(mp.textOnly === true, "Tap and type only reaches the child's plan (server truth, not this phone)");

    // safety_hold: the Conductor's hold on the test child's row (DB), then the home
    if (!targetDbUrl()) warn("no TAXILA_DB_URL for this target: safety_hold check skipped");
    else {
      await dbq(`insert into conductor_state(child_id, state_v, mode, state) select c.id, 1, 'safety_hold', '{}'::jsonb from child c join guardian g on g.id = c.guardian_id
          where c.id = $1 and g.email like '%@taxila.test' on conflict (child_id) do update set mode = 'safety_hold'`, [riya.id]);
      const sp = await api("GET", `/api/child/plan?childId=${riya.id}`);
      ok(sp.state === "safety_hold", `plan: safety_hold (${sp.state})`);
      const sh = await home(page, riya.id);
      one(sh, "safety_hold");
      ok(!sh.start && !sh.practice && !sh.ask, `safety_hold: no lesson start, no practice, no Ask (${JSON.stringify({ start: sh.start, practice: sh.practice, ask: sh.ask })})`);
      await page.click('[data-testid="hold-help"]');
      ok(await page.locator('[data-testid="help-1098"]').count() === 1 && await page.locator('[data-testid="help-14416"]').count() === 1, "safety_hold: Help shows Childline 1098 and Tele-MANAS 14416");
      const ref = await api("POST", "/api/lesson/start", { childId: riya.id, mode: "text" }, [201, 409]);
      if (ref.status === 201) { warn("API: a lesson still STARTS during safety_hold (startRefusal is in lesson.js, W2-E's hot file: open item)"); await api("POST", "/api/lesson/end", { lessonId: ref.lessonId }); }
      else ok(true, "API: a lesson start is refused during safety_hold");
      // release the hold (the protocol's job in real life): an account in safety_hold cannot be erased without review
      await dbq("update conductor_state set mode = 'free' where child_id = $1", [riya.id]);
    }

    // F7: the home after a 1-day gap and after a 30-day gap is the same, apart from the topic and plant states
    await api("POST", "/api/test/clock", { advanceDays: 1 });
    await new Promise((r) => setTimeout(r, 2000));
    const d1 = await home(page, meera.id);
    await api("POST", "/api/test/clock", { advanceDays: 29 });
    await new Promise((r) => setTimeout(r, 2000));
    const d30 = await home(page, meera.id);
    ok(d1.state === d30.state && d1.sig === d30.sig && d1.primaries === d30.primaries, `F7: 1-day and 30-day homes match (${d1.state}/${d30.state}; ${d1.sig === d30.sig ? "same layout" : `${d1.sig} ≠ ${d30.sig}`})`);
  } finally { await browser.close(); await unlock().catch(() => {}); }
});
done();
