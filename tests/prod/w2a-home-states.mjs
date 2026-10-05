// W2-A acceptance: the home states (STUDENT-FLOW §4.2, SF1; BUILD-PLAN §4 W2-A #9). On the real child client at 360×640:
//   - each of the five Home states (first, start, homework, test_window, safety_hold) renders EXACTLY ONE primary action;
//     done renders none (F1: "one primary action or none"; done never offers one more lesson);
//   - safety_hold offers no lesson start, no practice, no Ask; it shows the Help sheet with both helplines; the API
//     REFUSES every start (lesson, practice, Ask) with 409 state safety_hold, and a typed lesson URL goes home;
//   - every state also holds at 1280 (one primary, no horizontal scroll); the Made for you shelf renders (fixture rows
//     on the test branch) without overflow at 360 and 1280;
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
    const wide = async (cid, want, primaries = 1) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      const w = await home(page, cid);
      ok(w.state === want && w.primaries === primaries && !w.hscroll, `${want} at 1280: ${primaries} primary, no horizontal scroll (${w.state}, ${w.primaries}, hscroll ${w.hscroll})`);
      await page.setViewportSize({ width: 360, height: 640 });
    };
    const one = async (h, want, cid) => {
      ok(h.state === want, `home state ${want} (got ${h.state})`);
      ok(h.primaries === 1, `${want}: exactly one primary action (${h.primaries}: ${h.primaryIds.join(", ")})`);
      ok(!h.hscroll, `${want}: no horizontal scroll at 360`);
      if (cid) await wide(cid, want);
    };

    // first: no lesson ever
    await one(await home(page, riya.id), "first", riya.id);

    // start: a lesson row exists (an accidental short start), nothing done today
    const s0 = await api("POST", "/api/lesson/start", { childId: aarav.id, mode: "text" });
    await api("POST", "/api/lesson/end", { lessonId: s0.lessonId });
    await one(await home(page, aarav.id), "start", aarav.id);

    // homework: the parent's "Homework help today" (Controls) reaches the child's home; today's lesson stays as a link
    const c1 = await parent("POST", "/api/parent/controls", { childId: aarav.id, homeworkToday: true });
    ok(c1.controls.homeworkToday === true, "Controls saves Homework help today");
    const hw = await home(page, aarav.id);
    await one(hw, "homework");
    ok(await page.locator('[data-testid="homework-lesson"]').count() === 1, "homework: today's lesson is the second card (a link, not a second primary)");
    await parent("POST", "/api/parent/controls", { childId: aarav.id, homeworkToday: false });

    // test_window: a school test covering today; the card names the subject, the lesson revises it
    const k0 = await api("POST", "/api/lesson/start", { childId: kabir.id, mode: "text" });
    await api("POST", "/api/lesson/end", { lessonId: k0.lessonId });
    const tw = await parent("POST", "/api/parent/test-window", { childId: kabir.id, subject: "maths", from: istDay(-1), to: istDay(3) });
    ok(tw.window?.subject === "maths", "Controls saves the school test window");
    const tp = await api("GET", `/api/child/plan?childId=${kabir.id}`);
    ok(tp.state === "test_window" && tp.testWindow?.subject === "maths" && tp.topic?.subject === "maths", `plan: test_window, revising maths (${tp.state}, ${tp.topic?.subject})`);
    await one(await home(page, kabir.id), "test_window", kabir.id);
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
    await wide(meera.id, "done", 0);

    // Made for you: one revealed Studio piece (fixture rows in 017's shape on the target's DB) → the shelf renders on
    // the done home, inside the page, at 360 and 1280; the parent's "Made for {child}" card names it
    if (!targetDbUrl()) warn("no TAXILA_DB_URL for this target: Made for you shelf check skipped");
    else {
      const sha = `w2a-test-${Date.now().toString(36)}`;
      const [ml] = await dbq("select l.id from lesson l join child c on c.id = l.child_id join guardian g on g.id = c.guardian_id where l.child_id = $1 and g.email like '%@taxila.test' order by l.started_at desc limit 1", [meera.id]);
      try {
        await dbq(`insert into studio_build(build_sha, identity, archetype, kind, fragment, plan, record) values ($1, $1, 'fraction-pizza', 'game', 'x', $2, $3)`,
          [sha, JSON.stringify({ kind: "game", title: "Pizza slices", topicId: "c7-maths-ch08-t01" }), JSON.stringify({ title: "Pizza slices for Meera" })]);
        await dbq(`insert into studio_mount(lesson_id, intent_id, build_sha, source, kind, archetype, topic_id, revealed_at) values ($1, $2, $3, 'live', 'game', 'fraction-pizza', 'c7-maths-ch08-t01', now())`,
          [ml.id, `intent-${sha}`, sha]);
        for (const vp of [{ width: 360, height: 640 }, { width: 1280, height: 800 }]) {
          await page.setViewportSize(vp);
          await home(page, meera.id);
          const shelf = await page.evaluate(() => {
            const el = document.querySelector('[data-testid="madefor-shelf"]');
            if (!el) return null;
            const r = el.getBoundingClientRect();
            const kids = [...el.querySelectorAll(".madefor-item")].map((x) => x.getBoundingClientRect());
            return { items: kids.length, inside: r.left >= 0 && r.right <= innerWidth + 1 && kids.every((k) => k.left >= r.left - 1 && k.right <= r.right + 1),
              hscroll: document.documentElement.scrollWidth > innerWidth + 1, text: el.textContent };
          });
          ok(shelf && shelf.items === 1 && /Pizza slices/.test(shelf.text), `Made for you shelf shows the piece at ${vp.width} (${JSON.stringify(shelf && { items: shelf.items })})`);
          ok(shelf && shelf.inside && !shelf.hscroll, `Made for you shelf fits at ${vp.width}, no horizontal scroll`);
        }
        await page.setViewportSize({ width: 360, height: 640 });
        const pm = await parent("GET", `/api/parent/made-for?childId=${meera.id}`);
        ok(pm.items?.some((x) => /Pizza slices/.test(x.title)), `parent Made for ${meera.firstName ?? "child"} lists the piece (${pm.items?.length ?? 0})`);
      } finally {
        await dbq("delete from studio_mount where build_sha = $1", [sha]).catch(() => {});
        await dbq("delete from studio_build where build_sha = $1", [sha]).catch(() => {});
      }
    }

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
      await one(sh, "safety_hold", riya.id);
      ok(!sh.start && !sh.practice && !sh.ask, `safety_hold: no lesson start, no practice, no Ask (${JSON.stringify({ start: sh.start, practice: sh.practice, ask: sh.ask })})`);
      const sub = await page.locator(".hpc-sub").first().textContent().catch(() => "");
      ok(/trust/.test(sub ?? "") && !/at home/i.test(sub ?? ""), `safety_hold copy names a grown-up the child trusts, never "at home" (${sub})`);
      // a typed lesson / practice URL (or a stale tab) never opens a lesson over the hold
      for (const path of ["lesson/new", "practice"]) {
        await page.goto(`${BASE}/c/${riya.id}/${path}`);
        await page.waitForTimeout(1500);
        const url = page.url();
        const deskOrRefused = await page.evaluate(() => ({ home: !!document.querySelector('[data-testid="home"]'), refused: document.querySelector('[data-testid="lesson-refused"]')?.getAttribute("data-state") ?? null }));
        ok(deskOrRefused.home || deskOrRefused.refused === "safety_hold", `/${path} during safety_hold goes home or shows the hold card (${url.replace(BASE, "")}, ${JSON.stringify(deskOrRefused)})`);
      }
      await home(page, riya.id);
      await page.click('[data-testid="hold-help"]');
      ok(await page.locator('[data-testid="help-1098"]').count() === 1 && await page.locator('[data-testid="help-14416"]').count() === 1, "safety_hold: Help shows Childline 1098 and Tele-MANAS 14416");
      for (const purpose of ["lesson", "practice", "doubt"]) {
        const ref = await api("POST", "/api/lesson/start", { childId: riya.id, mode: "text", purpose, ...(purpose === "doubt" ? { firstText: "1/2 bada ya 1/4?" } : {}) }, [201, 409]);
        if (ref.lessonId) await api("POST", "/api/lesson/end", { lessonId: ref.lessonId }).catch(() => {});
        ok(!ref.lessonId && ref.state === "safety_hold" && ref.control === "safety", `API: a ${purpose} start is refused (409) during safety_hold (${ref.lessonId ? "STARTED" : `${ref.state}/${ref.control}`})`);
      }
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
