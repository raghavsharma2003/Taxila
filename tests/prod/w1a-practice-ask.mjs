// W1-A acceptance (BUILD-PLAN §3 W1-A; flows G1, smooth G8): after a finished lesson, Practice and Ask start (201) and
// reach a first turn, in the API and on the real child client at 360×640. A child outside the lesson hours sees the
// designed resting screen (the control named, the opening time), and one parent tap ("Open now for 1 hour") opens a lesson.
//   NODE_USE_ENV_PROXY=1 node tests/prod/w1a-practice-ask.mjs        (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, launch, BASE } from "./lib.mjs";
import { driveToGraded, turner, closedHours, setPin, addChild } from "./_w1a.mjs";

await withTestAccount(async ({ api, child, password }) => {
  // ── 1. a finished lesson (one graded answer, ended) → today is "done" ──
  const s = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "lesson" });
  ok(s.status === 201, `lesson starts (${s.ms} ms)`);
  const { last } = await driveToGraded(api, s.lessonId, s);
  ok(!!last?.ui?.verdict, `a graded answer landed (verdict ${last?.ui?.verdict ?? "none"})`);
  await api("POST", "/api/lesson/end", { lessonId: s.lessonId });
  const plan = await api("GET", `/api/child/plan?childId=${child.id}`);
  ok(plan.state === "done", `home says done after the lesson (state ${plan.state})`);

  // ── 2. API: a lesson is refused with the control named; Practice and Ask pass ──
  const again = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text" }, [409]);
  ok(again.state === "done" && again.control === "done", `another lesson → 409 done, control "${again.control}"`);
  const p = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "practice" });
  ok(p.status === 201, `Practice after the lesson → 201 (${p.ms} ms)`);
  const pt = await turner(api, p.lessonId).say("haan, ready");
  ok(!!pt.move?.kind, `Practice reaches a first turn (${pt.move?.kind})`);
  await api("POST", "/api/lesson/end", { lessonId: p.lessonId });
  const d = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", purpose: "doubt" });
  ok(d.status === 201, `Ask after the lesson → 201 (${d.ms} ms)`);
  const dt = await turner(api, d.lessonId).say("1/2 bada kyun hai 1/3 se?");
  ok(!!dt.move?.kind && typeof dt.teacherReply === "string", `Ask reaches a first turn (${dt.move?.kind})`);
  await api("POST", "/api/lesson/end", { lessonId: d.lessonId });

  // ── 3. the real client at 360×640: Practice and Ask open a lesson, never "We couldn't start the lesson" ──
  const { browser, page } = await launch({ viewport: { width: 360, height: 640 }, cookieFrom: api });
  try {
    await page.addInitScript((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } }, child.id);
    const starts = [];
    page.on("request", (r) => { if (r.url().endsWith("/api/lesson/start")) starts.push(JSON.parse(r.postData() || "{}")); });
    const startStatus = (purpose) => page.waitForResponse((r) => r.url().endsWith("/api/lesson/start") && JSON.parse(r.request().postData() || "{}").purpose === purpose, { timeout: 30_000 });
    let resp = startStatus("practice");
    await page.goto(`${BASE}/c/${child.id}/practice`);
    const pr = await resp.catch(() => null);
    ok(pr?.status() === 201, `client Practice → start ${pr?.status()} with purpose "practice"`);
    await page.waitForSelector('[data-testid="dock"]', { timeout: 30_000 }).catch(() => {});
    ok(await page.locator('[data-testid="dock"]').count() > 0 && await page.getByText("couldn't start", { exact: false }).count() === 0, "client Practice shows the Desk, not the error screen");
    // Ask: type a question, send
    await page.goto(`${BASE}/c/${child.id}/ask`);
    await page.fill("#ask-q", "Why is 1/2 bigger than 1/3?");
    resp = startStatus("doubt");
    const turnP = page.waitForResponse((r) => r.url().endsWith("/api/lesson/turn"), { timeout: 45_000 });
    await page.click('[data-testid="ask-go"]');
    const ar = await resp.catch(() => null);
    ok(ar?.status() === 201, `client Ask → start ${ar?.status()} with purpose "doubt"`);
    const at = await turnP.catch(() => null);
    ok(at?.status() === 200, `client Ask reaches a first turn (${at?.status()})`);
    ok(starts.every((b) => ["practice", "doubt", "lesson"].includes(b.purpose)), `every client start carries a purpose (${starts.map((b) => b.purpose).join(", ")})`);
  } finally { await browser.close(); }

  // ── 4. outside the lesson hours: the resting screen, then one parent tap opens a lesson ──
  const hours = closedHours();
  const kid = await addChild(api, { firstName: "Kabir", classLevel: 6, languagePref: "hinglish", interests: ["space"] }, { ...hours, dailyMinutes: 120 });
  const refused = await api("POST", "/api/lesson/start", { childId: kid.id, mode: "text" }, [409]);
  ok(refused.state === "resting" && refused.control === "hours" && !!refused.opensAt, `outside the hours → 409 resting, control "${refused.control}", opens ${refused.opensAt}`);
  ok(refused.window?.from === hours.hoursStart && refused.window?.to === hours.hoursEnd, `the refusal carries the hours window (${JSON.stringify(refused.window)})`);
  const b2 = await launch({ viewport: { width: 360, height: 640 }, cookieFrom: api });
  try {
    await b2.page.addInitScript((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } }, kid.id);
    await b2.page.goto(`${BASE}/c/${kid.id}/lesson/new`);
    const screen = b2.page.locator('[data-testid="lesson-refused"]');
    await screen.waitFor({ timeout: 30_000 }).catch(() => {});
    ok(await screen.getAttribute("data-state").catch(() => null) === "resting", "the child sees the resting screen (not the error screen)");
    const text = (await screen.innerText().catch(() => "")).replace(/\s+/g, " ");
    ok(/lessons open at/i.test(text) && /lesson hours/i.test(text), `it names the control and the time: "${text.slice(0, 140)}"`);
    await b2.page.goto(`${BASE}/c/${kid.id}`);
    await b2.page.waitForSelector('[data-testid="primary-card"][data-state="resting"]', { timeout: 20_000 }).catch(() => {});
    ok(await b2.page.locator('[data-testid="resting-control"]').count() > 0, "home's resting card names the lesson hours");
  } finally { await b2.browser.close(); }
  // the parent's one tap (Controls → "Open now for 1 hour"), inside an unlocked Parent corner
  await setPin(api, password);
  // On the real client first (Controls at 360×640, the parent's one tap); the API call is the fallback when the corner
  // shows its gate in this browser (the check then says so).
  let opened = null;
  const b3 = await launch({ viewport: { width: 360, height: 640 }, cookieFrom: api });
  try {
    await b3.page.goto(`${BASE}/parent/controls?c=${kid.id}`);
    const btn = b3.page.locator('[data-testid="open-now-button"]');
    await btn.waitFor({ timeout: 20_000 }).catch(() => {});
    if (await btn.count()) {
      const respP = b3.page.waitForResponse((r) => r.url().endsWith("/api/lesson/open-now"), { timeout: 20_000 });
      await btn.click();
      const resp = await respP.catch(() => null);
      opened = resp?.ok() ? await resp.json().catch(() => null) : null;
      ok(resp?.status() === 200, `Controls: one tap on "Open now for 1 hour" → ${resp?.status()}`);
      const status = await b3.page.locator('[data-testid="open-now"] [role="status"]').innerText({ timeout: 5000 }).catch(() => "");
      ok(/open until/i.test(status), `Controls says until when: "${status}"`);
    } else warn("Controls showed no Open now button in this browser (corner gate); opening through the API instead");
  } finally { await b3.browser.close(); }
  opened ??= await api("POST", "/api/lesson/open-now", { childId: kid.id });
  ok(!!opened.openUntil && opened.plan?.state !== "resting", `open now → open until ${opened.openUntil}, home state ${opened.plan?.state}`);
  const s2 = await api("POST", "/api/lesson/start", { childId: kid.id, mode: "text" });
  ok(s2.status === 201, `after one parent tap a lesson starts (${s2.status})`);
  await api("POST", "/api/lesson/end", { lessonId: s2.lessonId }).catch(() => warn("end of the opened lesson failed"));
}, { tag: "w1a-pa" });
done();
