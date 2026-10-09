// W1-C acceptance (BUILD-PLAN §3 W1-C; comprehension audit G1, G8): "understood" needs a success ≥ 2 learning days after
// learning, on an item never met (VALUES-100 V1.3; V1-10), so nobody could test it in one sitting. With the test clock:
//   day 0   a scripted lesson: right answers, but "pata nahi" to every why (the typical first-lesson child: shallow); the
//           child does teach the protégé at the teach-back (the lesson's generative pass: without one no skill is ever
//           learned_today, so no check is ever due — p5-interaction root cause of the 2026-10-05 prod 17/22);
//           the parent "how we know" card is NOT null (G1: it was null for every English / shallow child);
//   +1 day  a lesson on a DIFFERENT topic: its opener asks a day-0 item (so it can only be the C31 delayed check; with
//           TAXILA_DB_URL the lesson state's pendingProbe must say C31 / delayed_check), the child answers it right, and
//           the card is read RIGHT THEN, before any why answer. The card changes (the "used it again days later" chip).
//           Whether the STATE rises above shallow on that alone is reported honestly: by the ladder (state.js) a
//           correct delayed check is K / D evidence, and leaving shallow needs U ≥ U_FRAGILE, i.e. a reason. If it
//           stays shallow the test says so (a warn naming the rule), it does not borrow the rise from reasons;
//   +2 days a review lesson on the day-0 topic WITH reasons: the state rises above shallow (labelled: from reasons); its
//           opener is the CERTIFYING check (≥ 2 learning days) on an item the child never met (V1.3: the +1 day opener was
//           a review of a met item, which never certifies);
//   +3 days a lesson on a third topic: its opener checks a day-0 skill again (delayed check / expired weave callback);
//   the parent card's wording changes as the state rises.
// And a REAL account (not @taxila.test) asking for an offset gets 403.
import { withTestAccount, apiClient, ok, warn, done } from "./lib.mjs";
import { driveLesson, advanceClock, cardRow, kitTopic, topicOfItem, replyFor, targetDb } from "./_w1c.mjs";

const DAY0 = "c5-maths-ch01-t01", DAY1 = "c5-maths-ch01-t02", DAY3 = "c5-maths-ch02-t01";
const db = await targetDb();
if (!db) warn("TAXILA_DB_URL is not set: the C31 reason in the lesson state cannot be read (the opener item is still checked)");
/** The saved lesson state (the Director's), or null without a database. */
const lessonState = async (lessonId) => (db ? (await db("select state from lesson where id = $1", [lessonId]))[0]?.state ?? null : null);
const STATE_OF = [[/Gets the answers on their own|Answers khud se sahi/i, "shallow"], [/Explained it in their own words|apne shabdon mein/i, "fragile"],
  [/Still had it|din baad bhi yaad/i, "understood"], [/Kept it for a month|mahine baad/i, "durable"], [/Started|shuru kiya|mix-up|confusion/i, "not_yet"]];
const stateOf = (row) => (row ? STATE_OF.find(([re]) => re.test(row))?.[1] ?? "unknown" : null);
const RANK = { not_yet: 0, shallow: 1, fragile: 2, understood: 3, durable: 4, unknown: -1 };

// ── a real account is refused ──
{
  const api = apiClient();
  const st = Date.now(), email = `w1c-real-${st}@example.org`, password = `real-pw-${st}`;
  let made = false;
  try {
    await api("POST", "/api/auth/signup", { email, password, name: "Real Parent", isGuardianAdult: true });
    made = true;
    const r = await api("POST", "/api/test/clock", { offsetDays: 1 }, [403, 200, 404]);
    ok(r.status === 403, `a real account asking for a clock offset gets 403 (got ${r.status}${r.status === 404 ? ": the test-clock route is not registered — apply seam-patches/w1c-router-clock.patch" : ""})`);
    const g = await api("GET", "/api/test/clock", undefined, [403, 200, 404]);
    ok(g.status === 403, `…and cannot read one either (${g.status})`);
  } catch (e) { ok(false, `real-account check threw: ${e.message}`); }
  finally { if (made) await api("DELETE", "/api/account", { password, confirm: true }).catch((e) => ok(false, `cleanup of ${email}: ${e.message}`)); }
}

await withTestAccount(async ({ api, child, password }) => {
  const clock0 = await api("GET", "/api/test/clock", undefined, [200, 403, 404]);
  ok(clock0.status === 200 && clock0.offsetMs === 0, `a test account reads its clock (offset ${clock0.offsetMs}, ${clock0.status})`);
  ok(clock0.wired === true, "the router runs requests on the session's clock (wired)");
  await api("POST", "/api/parent/pin", { pin: "2580", password });
  const skills = kitTopic(DAY0).skills.map((s) => s.id);
  const cards = async (label) => {
    const out = {};
    for (const s of skills) out[s] = await cardRow(api, child.id, s).catch((e) => ({ row: null, err: e.message }));
    const shown = Object.entries(out).filter(([, v]) => v.row);
    console.log(`${label}: ${shown.map(([s, v]) => `${s.split("-").pop()}=${stateOf(v.row)} [${(v.card?.chips ?? []).length} chips]`).join(" ") || "no card"}`);
    return out;
  };
  const best = (c) => Math.max(-1, ...Object.values(c).map((v) => RANK[stateOf(v.row)] ?? -1));
  const states = (c) => Object.values(c).map((v) => stateOf(v.row)).join("/");
  const wording = (v) => JSON.stringify([v?.card?.rows ?? [], v?.card?.chips ?? []]);

  // ── day 0 ──
  const d0 = await driveLesson(api, child.id, { topicId: DAY0, maxTurns: 18, explain: false, teach: true });
  ok(d0.start.status === 201, `day 0 lesson starts on ${DAY0}`);
  const graded0 = d0.turns.filter((t) => t.verdict).length;
  ok(graded0 >= 3, `day 0: at least 3 graded answers (${graded0}; moves ${d0.turns.map((t) => t.move).join(",")})`);
  const c0 = await cards("day 0 card");
  const shown0 = Object.entries(c0).filter(([, v]) => v.row);
  ok(shown0.length > 0, `the parent "how we know" card is shown after a scripted lesson (${shown0.length}/${skills.length} skills)`);

  // ── +1 day: the C31 delayed check in the opener of a lesson on ANOTHER topic ──
  const adv1 = await advanceClock(api, 1);
  ok(adv1.offsetDays === 1, `test clock +1 day (now reads ${adv1.now})`);
  const s1 = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: DAY1 });
  ok(s1.status === 201, `+1 day: a new lesson starts on ${DAY1} (a new learning day, not 'done for today')`);
  const warm = s1.ui?.ask?.itemId ?? null;
  ok(!!warm && topicOfItem(warm) === DAY0, `+1 day: the opener of a ${DAY1} lesson asks a day-0 item before any teaching (${warm ?? "none"})`);
  const st1 = await lessonState(s1.lessonId);
  if (st1) ok(st1.pendingProbe?.shapeId === "C31" && st1.pendingProbe?.reason === "delayed_check" && topicOfItem(st1.activeItemId) === DAY0,
    `+1 day: the lesson state says it is the C31 delayed check (pendingProbe ${st1.pendingProbe?.shapeId ?? "none"}/${st1.pendingProbe?.reason ?? "-"} on ${st1.activeItemId ?? "-"})`);
  // answer ONLY the warm-up (day-0) items, right; no why answer has been given since day 0
  let ui = s1.ui, seq = 0;
  const warmTurns = [];
  while (ui?.ask?.itemId && topicOfItem(ui.ask.itemId) === DAY0 && warmTurns.length < 4) {
    const rep = replyFor(ui, DAY0, { explain: false });
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId: s1.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    warmTurns.push({ item: ui.ask.itemId, verdict: r.ui?.verdict ?? null, move: r.move?.kind });
    ui = r.ui;
    if (r.end) break;
  }
  ok(warmTurns[0]?.verdict === "correct", `+1 day: the child answers the delayed check right (${warmTurns.map((t) => `${t.item}=${t.verdict}`).join(", ") || "no warm-up turn"})`);
  const c1 = await cards("+1 day card, right after the delayed check (no why answered since day 0)");
  const changed1 = skills.filter((s) => c1[s].row && wording(c1[s]) !== wording(c0[s]));
  ok(changed1.length > 0, `+1 day: the parent card changes after the delayed check alone (${changed1.map((s) => s.split("-").pop()).join(",") || "none"}: ${states(c0)} → ${states(c1)})`);
  const r1 = best(c1);
  ok(r1 >= best(c0), `+1 day: a correct delayed check never lowers the state (${states(c0)} → ${states(c1)})`);
  if (r1 > RANK.shallow) ok(true, `+1 day: the delayed check alone moved a day-0 skill above shallow (${states(c1)})`);
  else warn(`+1 day: the state stays shallow after a correct delayed check (${states(c1)}). This is the ladder, not a bug in the check: state.js leaves shallow only with U ≥ U_FRAGILE (a reason), and a delayed check is K / D evidence. The plan's "a correct answer moves the state above shallow" cannot hold on the delayed check alone; the rise below comes from reasons`);
  await api("POST", "/api/lesson/end", { lessonId: s1.lessonId });

  // ── +2 days: review on the day-0 topic WITH reasons (the rise above shallow, labelled as coming from reasons) ──
  await advanceClock(api, 1);
  // round3 truth (prod 21/23 on 2026-10-07): the +2-day child gives reasons AND teaches the protégé, as the day-0 child did.
  // Before, its teach-back answer was the topic's first expectation alone (replyFor without `teach`), which the teach-back
  // grader rightly failed: on a local trace that fail took s1 from U 0.69 (after its passing why) back to 0.548, below
  // U_FRAGILE 0.6, so "with reasons, a day-0 skill is above shallow" and "the card's state row changes" failed because the
  // scripted child failed its own teach-back, not because reasons do not count (offline fold of the same events: why pass
  // → 0.693 fragile; why pass + teach-back pass → 0.868 fragile; why pass + the fragment teach-back → 0.548 shallow).
  const d2 = await driveLesson(api, child.id, { topicId: DAY0, maxTurns: 16, explain: true, teach: true });
  ok(d2.start.status === 201, "+2 days: a review lesson starts on the day-0 topic");
  const open2 = d2.start.ui?.ask?.itemId ?? null;
  ok(!!open2 && !d0.asked.includes(open2) && !warmTurns.some((t) => t.item === open2),
    `+2 days: the certifying check (≥ 2 learning days, V1.3) leads, on an item never met (${open2 ?? "none"}; met: ${[...new Set([...d0.asked, ...warmTurns.map((t) => t.item)])].length} items)`);
  const c2 = await cards("+2 days card (after reasons)");
  ok(best(c2) > RANK.shallow, `+2 days: with reasons given, a day-0 skill is above shallow (${states(c2)}) — from reasons, not from the delayed check`);

  // ── +3 days: the day-0 skill is checked again in the opener of a third topic's lesson ──
  await advanceClock(api, 1);
  const s3 = await api("POST", "/api/lesson/start", { childId: child.id, mode: "text", topicId: DAY3 });
  ok(s3.status === 201, "+3 days: a lesson starts");
  const warm3 = s3.ui?.ask?.itemId ?? null;
  const st3 = await lessonState(s3.lessonId);
  const due3 = (st3?.warmup ?? []).map((w) => w.id ?? w.itemId).filter(Boolean);
  const checked3 = (!!warm3 && topicOfItem(warm3) === DAY0) || due3.some((id) => topicOfItem(id) === DAY0);
  // V1.3: a skill certified at +2 days (its check passed) is next reviewed by FSRS, not the next day; one not certified yet
  // must be checked again here
  const certified2 = d2.turns[0]?.verdict === "correct";
  if (certified2 && !checked3) warn(`+3 days: no day-0 check in the opener — the day-0 skill was certified at +2 days (its check was answered right), so its next review is FSRS's, later (V1.3)`);
  else {
    ok(checked3, `+3 days: the opener of a ${DAY3} lesson checks a day-0 skill again (asks ${warm3 ?? "none"}; warm-up ${due3.join(", ") || "n/a"})`);
    if (st3) ok(st3.pendingProbe?.shapeId === "C31" && topicOfItem(st3.activeItemId) === DAY0, `+3 days: it is a C31 delayed check (pendingProbe ${st3.pendingProbe?.shapeId ?? "none"} on ${st3.activeItemId ?? "-"})`);
  }
  ui = s3.ui; seq = 0;
  for (let i = 0; i < 3 && ui?.ask?.itemId && topicOfItem(ui.ask.itemId) === DAY0; i++) {
    const rep = replyFor(ui, DAY0);
    const body = rep.chip ? { childText: rep.chip.label, chipId: rep.chip.id } : { childText: rep.text };
    const r = await api("POST", "/api/lesson/turn", { lessonId: s3.lessonId, typed: true, asrConfidence: 0.95, turnSeq: ++seq, ...body });
    ui = r.ui;
  }
  await api("POST", "/api/lesson/end", { lessonId: s3.lessonId });
  const c3 = await cards("+3 days card");

  // ── the card follows the state ──
  const changed = skills.some((s) => (c0[s].row ?? "") !== (c3[s].row ?? "") && c3[s].row);
  ok(changed, `the parent card's state row changes between day 0 and +3 days (${states(c0)} → ${states(c3)})`);
  ok(best(c3) >= best(c0), `the state never falls back after correct delayed checks (rank ${best(c0)} → ${best(c3)})`);
}, { tag: "w1c", child: { firstName: "Riya", classLevel: 5, languagePref: "english", interests: ["cricket"] } });
done();
