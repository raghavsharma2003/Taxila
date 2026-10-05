// W2-A acceptance: G-PARENT-1, one parent truth (BUILD-PLAN §4 W2-A #1-#4; flows G7, G10, G11, G12; comprehension G4).
// Three children on one test account (no answers · mixed · strong). For each, the SAME facts must read the same on every
// surface: child home (plan), child map, parent home (overview), Progress (syllabus), the lesson card, the evidence sheet
// and Notes (the weekly letter preview): state per skill, the next topic, lessons and minutes. Then:
//   - the no-answer child shows "Not started" and no sprout; the evidence sheet shows the real question and the child's words;
//   - every lesson card summary is built from facts and passed the server's claim checker (≥ W2A_SUMMARIES, default 20);
//   - Practice: ≤ 5 items (ui.practice.of), no greeting (WARN while the Director half is W2-C's); the client counter;
//   - a school test window: the next topic is the same on child home, parent home, Progress, "Next time", a start with
//     no topic and the lesson-end summary; the lesson card carries ONE count and its ticks never exceed the engine's;
//     Notes claims name skills in the same state as the map; a reset kills the account's other outstanding links;
//   - Ask: a fractions question is filed under fractions and the top bar is titled by the question;
//   - Forgot password works end to end with the test-mailbox token (needs TAXILA_OPS_KEY; else WARN).
//   NODE_USE_ENV_PROXY=1 node tests/prod/w2a-parent-truth.mjs        (TAXILA_BASE for a local server)
import { withTestAccount, ok, warn, done, launch, BASE, apiClient } from "./lib.mjs";
import { driveLesson, replyFor } from "./_w1c.mjs";
import { setPin, addChild } from "./_w1a.mjs";

const SUMMARIES = Number(process.env.W2A_SUMMARIES ?? 20);
const SHAPE = { unseen: "not_started", practising: "practising", learned_today: "got_it", mastered: "secure" };
const enc = encodeURIComponent;

/** Every surface's word for every skill the child has touched, plus next topic and counts. */
async function surfaces(api, cid) {
  const [plan, map, ov, syl, lessons, week] = await Promise.all([
    api("GET", `/api/child/plan?childId=${cid}`), api("GET", `/api/child/map?childId=${cid}`), api("GET", `/api/parent/overview?childId=${cid}`),
    api("GET", `/api/parent/syllabus?childId=${cid}`), api("GET", `/api/parent/lessons?childId=${cid}`),
    api("GET", `/api/parent/report?childId=${cid}&cadence=weekly&preview=1`),
  ]);
  return { plan, map, ov, syl, lessons: lessons.lessons, week };
}

async function checkChild(api, cid, label) {
  const s = await surfaces(api, cid);
  // 1. the next topic: one function
  const next = s.plan.topic?.title ?? null;
  ok(!!next, `${label}: the child home names a next topic (${next})`);
  ok(s.ov.next?.topic?.title === next, `${label}: parent home next = child home next ("${s.ov.next?.topic?.title}" vs "${next}")`);
  ok(s.syl.next?.title === next, `${label}: Progress next = child home next ("${s.syl.next?.title}")`);
  if (s.plan.today) ok(s.plan.today.summary.nextTitle === next, `${label}: the child's "Next time" = child home next ("${s.plan.today.summary.nextTitle}")`);
  // 2. the state per skill, on every surface
  const touched = s.map.skills.filter((x) => x.state !== "not_started");
  const ovBy = new Map(s.ov.skills.map((x) => [x.skillId, SHAPE[x.key]]));
  const sylBy = new Map(s.syl.subjects.flatMap((su) => su.chapters.flatMap((c) => c.topics.flatMap((t) => (t.skills ?? []).map((k) => [k.skillId, SHAPE[k.key]])))));
  let agree = 0;
  for (const sk of touched) {
    const ev = await api("GET", `/api/parent/evidence?childId=${cid}&skill=${enc(sk.skillId)}`);
    const words = [sk.state, ovBy.get(sk.skillId), sylBy.get(sk.skillId), SHAPE[ev.state.key]];
    if (words.every((w) => w === sk.state)) agree++;
    else ok(false, `${label}: ${sk.skillId} reads ${JSON.stringify(words)} (map, parent home, Progress, evidence)`);
  }
  ok(agree === touched.length, `${label}: ${agree}/${touched.length} tried skills read the same on map, parent home, Progress and evidence`);
  ok(!s.ov.skills.some((x) => !touched.some((t) => t.skillId === x.skillId)), `${label}: the parent names no skill the child never tried`);
  // lesson cards: the same word per skill
  for (const l of s.lessons.filter((x) => x.counted).slice(0, 3)) {
    const card = await api("GET", `/api/parent/lesson?childId=${cid}&lessonId=${l.id}`);
    // ONE count on the card: no legacy did.tried; every "Right, on their own" tick is a first-try engine row of that turn
    ok(card.did?.tried === undefined, `${label}: the lesson card carries no second count (did.tried)`);
    const ownTicks = (card.did?.cards ?? []).filter((c) => c.kind === "item" && c.tick && !c.withHelp).length;
    if (card.summary) ok(ownTicks <= card.summary.counts.firstTry, `${label}: card ticks "on their own" ${ownTicks} ≤ engine first-try ${card.summary.counts.firstTry}`);
    if (card.summary && card.summary.counts.tried === 0) ok(!(card.did?.cards ?? []).some((c) => c.kind === "item" && c.tick), `${label}: no tick on a card whose engine checked nothing`);
    for (const k of card.skills) ok(k.unaided <= k.attempts, `${label}: ${k.skillId} unaided ${k.unaided} ≤ item attempts ${k.attempts}`);
    for (const k of card.skills) {
      const m = s.map.skills.find((x) => x.skillId === k.skillId);
      if (m) ok(SHAPE[k.key] === m.state, `${label}: lesson card ${k.skillId} = map (${SHAPE[k.key]} vs ${m.state})`);
    }
  }
  // Notes (weekly preview): every skill a claim names reads the same as the map (row.started = taught, Not started)
  for (const c of s.week.report?.claims ?? []) {
    if (!c.skillId) continue;
    const m = s.map.skills.find((x) => x.skillId === c.skillId)?.state ?? "not_started";
    if (c.shapeId === "row.started") ok(m === "not_started", `${label}: Notes "${c.shapeId}" ${c.skillId} = map ${m}`);
    else if (c.shapeId === "st.pakka") ok(m === "secure", `${label}: Notes "${c.shapeId}" ${c.skillId} = map ${m}`);
    else ok(m !== "not_started", `${label}: Notes "${c.shapeId}" names ${c.skillId}, which the map shows as tried (${m})`);
  }
  // 3. one lessons-and-minutes definition: parent home's week = the weekly letter's header
  const header = s.week.report?.renders?.en?.lines?.find((x) => x.section === "header")?.text ?? "";
  const m = /(\d+) lessons?\b.*?(\d+) min/.exec(header);
  if (m) ok(Number(m[1]) === s.ov.week.lessons && Number(m[2]) === s.ov.week.minutes, `${label}: parent home week ${s.ov.week.lessons} · ${s.ov.week.minutes} min = Notes "${header}"`);
  else ok(s.ov.week.lessons === 0, `${label}: no lessons this week on both (Notes "${header || s.week.skipped}")`);
  return s;
}

await withTestAccount(async ({ api, child, email, password }) => {
  await setPin(api, password);
  const quiet = await addChild(api, { firstName: "Aarav", classLevel: 5, languagePref: "hinglish", interests: ["cricket"] }, { hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  const mixed = await addChild(api, { firstName: "Kabir", classLevel: 6, languagePref: "english", interests: ["space"] }, { hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
  const strong = child; // Riya, class 5

  // ── the three children's lessons ──
  const q0 = await api("POST", "/api/lesson/start", { childId: quiet.id, mode: "text" });
  for (const said of ["hmm", "haan"]) await api("POST", "/api/lesson/turn", { lessonId: q0.lessonId, childText: said, typed: true, asrConfidence: 0.95 }).catch(() => null);
  await api("POST", "/api/lesson/end", { lessonId: q0.lessonId });
  const mx = await driveLesson(api, mixed.id, { maxTurns: 12, wrong: (i) => i % 2 === 1 });
  const st = await driveLesson(api, strong.id, { maxTurns: 12 });
  ok(st.turns.some((t) => t.verdict), `strong child: a graded answer landed (${st.turns.filter((t) => t.verdict).length})`);
  ok(mx.turns.some((t) => t.verdict), `mixed child: a graded answer landed`);

  // ── G-PARENT-1 across surfaces ──
  const sq = await checkChild(api, quiet.id, "no answers");
  ok(sq.map.empty === true && !sq.map.skills.some((x) => x.state !== "not_started"), `no answers: every skill "Not started", no sprout (empty ${sq.map.empty})`);
  ok(["none", "first", "too_early"].includes(sq.ov.headline.kind) && !sq.ov.headline.canNow && !sq.ov.headline.practising, `no answers: the parent home claims nothing (${sq.ov.headline.kind})`);
  await checkChild(api, mixed.id, "mixed");
  const ss = await checkChild(api, strong.id, "strong");

  // ── a school test window: ONE next topic on every surface, and on the lesson-end summary ──
  {
    const day = (n) => new Date(Date.now() + 330 * 60_000 - 4 * 3600_000 + n * 86_400_000).toISOString().slice(0, 10);
    await api("POST", "/api/parent/unlock", { pin: "2580" }).catch(() => {});
    const tw = await api("POST", "/api/parent/test-window", { childId: mixed.id, subject: "science", from: day(-1), to: day(3) });
    ok(tw.window?.subject === "science", "test window saved (science)");
    const s = await surfaces(api, mixed.id);
    const next = s.plan.topic?.title ?? null;
    ok(s.plan.topic?.subject === "science", `test window: the child home revises science (${s.plan.topic?.subject} · ${next})`);
    ok(s.ov.next?.topic?.title === next, `test window: parent home next = child home next ("${s.ov.next?.topic?.title}" vs "${next}")`);
    ok(s.syl.next?.title === next, `test window: Progress next = child home next ("${s.syl.next?.title}")`);
    if (s.plan.today) ok(s.plan.today.summary.nextTitle === next, `test window: the child's "Next time" = child home next ("${s.plan.today.summary.nextTitle}")`);
    const l = await api("POST", "/api/lesson/start", { childId: mixed.id, mode: "text", purpose: "practice" });
    ok(/-science-/.test(l.topic?.id ?? "") && l.topic?.title === next, `test window: a start with no topic revises science, the home's topic (${l.topic?.id} · ${l.topic?.title})`);
    const e = await api("POST", "/api/lesson/end", { lessonId: l.lessonId });
    const after = (await api("GET", `/api/child/plan?childId=${mixed.id}`)).topic?.title ?? null;
    ok(e.did?.nextTitle === after, `test window: the lesson-end "Next time" = child home next ("${e.did?.nextTitle}" vs "${after}")`);
    await api("POST", "/api/parent/unlock", { pin: "2580" }).catch(() => {});
    await api("DELETE", "/api/parent/test-window", { childId: mixed.id }).catch((e) => warn(`test window not cleared: ${e.message}`));
  }

  // ── the evidence sheet shows the real item and the child's words, and who checked it ──
  const sk = ss.map.skills.find((x) => x.state !== "not_started");
  if (sk) {
    const ev = await api("GET", `/api/parent/evidence?childId=${strong.id}&skill=${enc(sk.skillId)}`);
    const row = ev.rows[0];
    ok(!!row?.prompt, `evidence sheet: the real question is shown ("${row?.prompt?.slice(0, 60)}")`);
    ok(!!row?.words, `evidence sheet: the child's own words are shown ("${row?.words}")`);
    ok(["code", "llm"].includes(row?.grader) && !!row?.graderWords, `evidence sheet: the grader is named (${row?.graderWords})`);
  } else ok(false, "strong child: no tried skill to open the evidence sheet on");

  // ── Practice: ≤ 5 pinned items; summaries from facts, claim-checked (practice runs after the day's lesson) ──
  let summaries = 0, practiced = 0;
  for (let i = 0; i < SUMMARIES + 4 && summaries < SUMMARIES; i++) {
    const p = await api("POST", "/api/lesson/start", { childId: strong.id, mode: "text", purpose: "practice" });
    practiced++;
    if (i === 0) {
      ok(!p.ui?.practice || p.ui.practice.of <= 5, `Practice: at most 5 items (${p.ui?.practice ? `of ${p.ui.practice.of}` : "no ui.practice yet"})`);
      if (/^\s*(hi|hello|hey|namaste|good (morning|afternoon|evening))\b/i.test(p.reply ?? p.text ?? "")) warn(`Practice opens with a greeting ("${(p.reply ?? p.text).slice(0, 50)}"): the Director half is W2-C's`);
      else ok(true, "Practice: the first teacher line is not a greeting");
    }
    let ui = p.ui;
    for (let k = 0; k < 4; k++) {
      const rep = replyFor(ui, p.topic.id);
      const r = await api("POST", "/api/lesson/turn", { lessonId: p.lessonId, typed: true, asrConfidence: 0.95, turnSeq: k + 1, ...(rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text }) });
      ui = r.ui;
      if (r.end) break;
    }
    await api("POST", "/api/lesson/end", { lessonId: p.lessonId });
    const card = await api("GET", `/api/parent/lesson?childId=${strong.id}&lessonId=${p.lessonId}`);
    if (card.skills.some((x) => x.attempts > 0)) {
      if (card.summary) summaries++;
      else ok(false, `practice ${i + 1}: graded answers but the summary was withheld (its claim check failed)`);
    }
  }
  ok(summaries >= Math.min(SUMMARIES, practiced), `${summaries} lesson summaries built from facts and passed the claim checker (of ${practiced} practice lessons)`);

  // ── Ask: filed under fractions, titled by the question ──
  const q = "Why is 1/2 bigger than 1/3?";
  const d = await api("POST", "/api/lesson/start", { childId: strong.id, mode: "text", purpose: "doubt", firstText: q });
  ok(/fraction/i.test(`${d.topic.title} ${d.topic.chapter}`), `Ask: "${q}" is filed under "${d.topic.title}" (${d.topic.chapter})`);
  await api("POST", "/api/lesson/end", { lessonId: d.lessonId });

  // ── the real client at 360: Practice counter, Ask title ──
  const { browser, page } = await launch({ viewport: { width: 360, height: 640 }, cookieFrom: api });
  try {
    await page.addInitScript((cid) => { try { localStorage.setItem(`taxila.child.${cid}.prefs`, JSON.stringify({ hello: true })); } catch { /* */ } }, strong.id);
    await page.goto(`${BASE}/c/${strong.id}/practice`);
    const count = page.locator('[data-testid="practice-count"]');
    await count.waitFor({ timeout: 45_000 }).catch(() => {});
    const txt = await count.innerText().catch(() => "");
    ok(/^Practice · [1-5] of 5$|^That's the set$/.test(txt.trim()), `client Practice shows the counter ("${txt.trim()}")`);
    await page.goto(`${BASE}/c/${strong.id}/ask`);
    await page.fill("#ask-q", q);
    const startReq = page.waitForRequest((r) => r.url().endsWith("/api/lesson/start"), { timeout: 30_000 });
    await page.click('[data-testid="ask-go"]');
    const body = JSON.parse((await startReq.catch(() => null))?.postData() || "{}");
    ok(body.firstText === q && body.purpose === "doubt", `client Ask sends firstText with the start (${JSON.stringify({ purpose: body.purpose, firstText: body.firstText })})`);
    await page.waitForSelector(".dk-short", { timeout: 30_000 }).catch(() => {});
    const title = (await page.locator(".dk-short").first().innerText().catch(() => "")).trim();
    ok(title.length > 0 && q.startsWith(title.replace(/…$/, "")), `client Ask is titled by the question ("${title}")`);
  } finally { await browser.close(); }
  // the browser shared this session and its child screens locked the corner: unlock for the cleanup (DELETE /api/account)
  await api("POST", "/api/parent/unlock", { pin: "2580" }).catch(() => {});

  // ── Forgot password, end to end (the test mailbox token) ──
  const ops = process.env.TAXILA_OPS_KEY;
  if (!ops) warn("TAXILA_OPS_KEY not set: forgot-password end to end skipped (the route still answers 200)");
  const anon = apiClient();
  const f = await anon("POST", "/api/auth/forgot", { email }, [200], ops ? { "x-taxila-ops": ops } : {});
  ok(f.ok === true, "forgot password answers 200 { ok } (never says whether the account exists)");
  const nobody = await anon("POST", "/api/auth/forgot", { email: `nobody-${Date.now()}@taxila.test` }, [200], ops ? { "x-taxila-ops": ops } : {});
  ok(nobody.ok === true && !nobody.testToken, "an unknown email gets the same answer and no token");
  const bad = await anon("POST", "/api/auth/forgot", { email: "not-an-email" }, [400]);
  ok(bad.field === "email" && bad.code === "email.bad", `a bad email is a field error with a code (${bad.code})`);
  if (ops && f.testToken) {
    const fresh = `${password}-new`;
    const fB = await anon("POST", "/api/auth/forgot", { email }, [200], { "x-taxila-ops": ops });
    const r = await anon("POST", "/api/auth/reset", { token: f.testToken, password: fresh });
    if (fB.testToken) {
      const other = await anon("POST", "/api/auth/reset", { token: fB.testToken, password: `${fresh}-2` }, [200, 400]);
      ok(other.code === "reset.bad", "reset: every other outstanding link of the account dies with the reset");
    }
    ok(r.guardian?.email === email, "reset: the new password is set and this browser is signed in");
    const again = await anon("POST", "/api/auth/reset", { token: f.testToken, password: fresh }, [400]);
    ok(again.code === "reset.bad", "reset: the token is single use");
    await anon("POST", "/api/auth/login", { email, password }, [400]).then(() => ok(true, "the old password no longer signs in"));
    await anon("POST", "/api/auth/login", { email, password: fresh }).then(() => ok(true, "the new password signs in"));
    // put the original password back (a second reset), so the harness's cleanup deletes the account as usual
    const f2 = await anon("POST", "/api/auth/forgot", { email }, [200], { "x-taxila-ops": ops });
    if (f2.testToken) await anon("POST", "/api/auth/reset", { token: f2.testToken, password });
    await api("POST", "/api/auth/login", { email, password }).catch(() => ok(false, "could not restore the original password for cleanup"));
    await api("POST", "/api/parent/unlock", { pin: "2580" }).catch(() => ok(false, "could not unlock the corner again for cleanup"));
  } else if (ops) ok(false, "forgot password: no test token came back for a @taxila.test account with the operator key");
  // signup field errors (never a raw API string)
  const e1 = await anon("POST", "/api/auth/signup", { email: "", password: "x", name: "P", isGuardianAdult: true }, [400]);
  ok(e1.field === "email" && e1.code === "email.missing", `signup: an empty email is a field error (${e1.code})`);
});
done();
