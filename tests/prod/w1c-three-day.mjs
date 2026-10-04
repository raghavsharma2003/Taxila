// W1-C acceptance (BUILD-PLAN §3 W1-C; comprehension audit G1, G8): "understood" needs a success ≥ 20 h after learning,
// so nobody could test it in one sitting. With the test clock:
//   day 0   a scripted lesson: right answers, but "pata nahi" to every why (the typical first-lesson child: shallow);
//           the parent "how we know" card is NOT null (G1: it was null for every English / shallow child);
//   +1 day  the opener checks a day-0 skill (C31, the delayed check) and the child answers it right; the review lesson on
//           the same topic, now with reasons, moves the state above shallow;
//   +3 days the day-0 skill is checked again (woven, or its expired weave entry as a callback);
//   the parent card's wording changes as the state rises.
// And a REAL account (not @taxila.test) asking for an offset gets 403.
import { withTestAccount, apiClient, ok, warn, done } from "./lib.mjs";
import { driveLesson, advanceClock, cardRow, kitTopic, topicOfItem } from "./_w1c.mjs";

const DAY0 = "c5-maths-ch01-t01", DAY3 = "c5-maths-ch02-t01";
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
    console.log(`${label}: ${shown.map(([s, v]) => `${s.split("-").pop()}=${stateOf(v.row)}`).join(" ") || "no card"}`);
    return out;
  };

  // ── day 0 ──
  const d0 = await driveLesson(api, child.id, { topicId: DAY0, maxTurns: 18, explain: false });
  ok(d0.start.status === 201, `day 0 lesson starts on ${DAY0}`);
  const graded0 = d0.turns.filter((t) => t.verdict).length;
  ok(graded0 >= 3, `day 0: at least 3 graded answers (${graded0}; moves ${d0.turns.map((t) => t.move).join(",")})`);
  const c0 = await cards("day 0 card");
  const shown0 = Object.entries(c0).filter(([, v]) => v.row);
  ok(shown0.length > 0, `the parent "how we know" card is shown after a scripted lesson (${shown0.length}/${skills.length} skills)`);

  // ── +1 day: the delayed check in the opener ──
  const adv1 = await advanceClock(api, 1);
  ok(adv1.offsetDays === 1, `test clock +1 day (now reads ${adv1.now})`);
  const d1 = await driveLesson(api, child.id, { topicId: DAY0, maxTurns: 16, explain: true });
  ok(d1.start.status === 201, "+1 day: a new lesson starts (a new learning day, not 'done for today')");
  // the opener's retrieval items come before the topic's own teaching (moves "retrieval" first)
  // the warm-up: items asked BEFORE the lesson's first teaching move (day 0 opened straight on a hook, with no item)
  const firstTeach = d1.turns.findIndex((t) => ["hook", "explain", "worked_example"].includes(t.move));
  const before = [d1.start.ui?.ask?.itemId, ...d1.turns.slice(0, firstTeach < 0 ? 3 : firstTeach).map((t) => t.itemId)].filter(Boolean);
  ok(before.some((id) => topicOfItem(id) === DAY0), `+1 day: the opener checks a day-0 skill before any teaching (C31) — warm-up asks ${before.join(", ") || "none"}; moves ${d1.turns.slice(0, 5).map((t) => t.move).join(",")}`);
  const firstCheck = d1.turns.find((t, i) => i < 6 && t.verdict);
  ok(!!firstCheck && firstCheck.verdict === "correct", `+1 day: the child answers the delayed check right (${firstCheck?.verdict ?? "no verdict"})`);
  const c1 = await cards("+1 day card");
  const r1max = Math.max(-1, ...Object.values(c1).map((v) => RANK[stateOf(v.row)] ?? -1));
  ok(r1max > RANK.shallow, `+1 day: a day-0 skill is above shallow after the delayed check and the reasons (${Object.values(c1).map((v) => stateOf(v.row)).join("/")})`);

  // ── +3 days: the woven check (or its callback) ──
  await advanceClock(api, 2);
  const d3 = await driveLesson(api, child.id, { topicId: DAY3, maxTurns: 12 });
  ok(d3.start.status === 201, "+3 days: a lesson starts");
  const checked3 = d3.asked.filter((id) => topicOfItem(id) === DAY0);
  ok(checked3.length > 0, `+3 days: an earlier skill is checked again (woven or callback) — asked ${d3.asked.slice(0, 6).join(", ")}`);
  const c3 = await cards("+3 days card");

  // ── the card follows the state ──
  const best = (c) => Math.max(-1, ...Object.values(c).map((v) => RANK[stateOf(v.row)] ?? -1));
  const r0 = best(c0), r3 = best(c3);
  const changed = skills.some((s) => (c0[s].row ?? "") !== (c3[s].row ?? "") && c3[s].row);
  ok(changed, `the parent card wording changes between day 0 and +3 days (${Object.values(c0).map((v) => stateOf(v.row)).join("/")} → ${Object.values(c3).map((v) => stateOf(v.row)).join("/")})`);
  ok(r3 >= r0, `the state never falls back after correct delayed checks (rank ${r0} → ${r3})`);
  if (r3 <= RANK.shallow) warn("no skill rose above shallow by +3 days: the live lane's U evidence is why-probes only (W3-A widens it)");
  void c1;
}, { tag: "w1c", child: { firstName: "Riya", classLevel: 5, languagePref: "english", interests: ["cricket"] } });
done();
