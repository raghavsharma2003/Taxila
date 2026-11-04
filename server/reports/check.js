// INDEPENDENT claim checker (PARENT-REPORT.md §10.3 E-R6, RRI1; CONDUCTOR §7.2 "a claim-checker that can be built").
// Given a STORED report, it re-reads every cited row straight from the database and re-derives each claim's slot
// values from those rows with its own code. It imports nothing from the generator (claims.js / derive.js / facts.js):
// the outcome names it needs are written out here from LEARNER-MODEL §6.1, so a generator bug cannot be "confirmed"
// by the same bug. It also checks COMPLETENESS (a count claim must cite every row that counts, not a convenient
// subset) and that every rendered line maps to an admitted claim or registered fixed copy.
import { NOT_PLACEMENT } from "../learner/kt/placement.js";

const ITEM = { "item.open": ["C0", "C1", "C2", "C3", "C4", "IDK", "NA"], "item.mcq2": ["first_correct", "wrong"], "item.mcq3": ["first_correct", "wrong"],
  "item.mcq4": ["first_correct", "wrong"], solo: ["C0", "C1", "fail"] };
const PROBE = { "probe.why": ["full", "partial", "none", "misconception"], "probe.teachback": ["high", "mid", "low", "misconception"],
  "probe.transfer.near": ["pass", "fail"], "probe.transfer.far": ["pass", "fail"], "probe.errorspot": ["caught_fixed", "caught", "missed"] };
const nameOf = (r) => (ITEM[r.cls] ?? PROBE[r.cls])?.[Number(r.outcome)];
const plain = (r) => !r.teach && !r.contaminated && !r.assisted;
const scored = (r) => plain(r) && !!ITEM[r.cls] && nameOf(r) !== undefined && nameOf(r) !== "NA";
const firstTry = (r) => scored(r) && ["C0", "first_correct"].includes(nameOf(r)) && !r.pre_attempt_help && Number(r.entry_rung) === 0;
const explained = (r) => plain(r) && r.via !== "game" && ((r.cls === "probe.why" && nameOf(r) === "full") || (r.cls === "probe.teachback" && ["high", "mid"].includes(nameOf(r))));
const transfer = (r) => plain(r) && r.via !== "game" && ["probe.transfer.near", "probe.transfer.far"].includes(r.cls) && nameOf(r) === "pass";
const fixedSpot = (r) => plain(r) && r.via !== "game" && r.cls === "probe.errorspot" && nameOf(r) === "caught_fixed";
const delayedOk = (r) => plain(r) && !r.pre_attempt_help && Number(r.entry_rung) === 0
  && (["C0", "first_correct"].includes(ITEM[r.cls] ? nameOf(r) : "") || (r.cls === "probe.transfer.near" && nameOf(r) === "pass") || fixedSpot(r));
const ms = (x) => new Date(x).getTime();
const localDate = (at, tz) => new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(at));
const learningDate = (at, tz) => localDate(ms(at) - 4 * 3600_000, tz);
const dateSlot = (at, tz) => { const [y, m, d] = localDate(at, tz).split("-").map(Number); return { y, m, d }; };
const sameDate = (a, b) => a && b && a.y === b.y && a.m === b.m && a.d === b.d;
// round 7 F (S6): hinted = an item answer that needed one or more hints; solved-after-hint = then right with them
const hintedR = (r) => scored(r) && ((r.cls === "item.open" && ["C1", "C2", "C3", "C4"].includes(nameOf(r))) || (r.cls === "solo" && nameOf(r) === "C1"));
const solvedR = (r) => scored(r) && ((r.cls === "item.open" && ["C1", "C2"].includes(nameOf(r))) || (r.cls === "solo" && nameOf(r) === "C1"));

/**
 * @param {{ q: (text: string, params?: any[]) => Promise<any[]> }} db
 * @param {any} report a parent_report row (claims, renders, window_from/to, child_id, cadence)
 * @param {{ skillTitle: (id: string) => Promise<string|null>, belief: (id: string) => Promise<string|null> }} lookup
 * @returns {Promise<{ claims: { id: string, shapeId: string, ok: boolean, why: string[] }[], lines: { total: number, mapped: number }, supported: number, total: number }>}
 */
export async function checkReport(db, report, lookup) {
  const child = (await db.q(`select c.id, c.first_name, coalesce(cr.tz, 'Asia/Kolkata') as tz from child c left join child_routine cr on cr.child_id = c.id where c.id = $1`, [report.child_id]))[0];
  const from = ms(report.window_from), to = ms(report.window_to);
  const inWin = (at) => ms(at) >= from && ms(at) < to;
  const out = [];
  for (const c of report.claims) {
    const why = [];
    const ids = { ev: [], lesson: [], skill: [], jar: [], test: [] };
    for (const f of c.factIds) {
      const [kind, ...rest] = String(f).split(":");
      const id = rest.join(":");
      if (kind === "kt_evidence") ids.ev.push(id); else if (kind === "lesson") ids.lesson.push(id);
      else if (kind === "kt_skill_state") ids.skill.push(id);
      else if (kind === "question_jar") ids.jar.push(id);
      else if (kind === "test_window") ids.test.push(id);
      else why.push(`unknown fact kind ${kind}`);
    }
    const ev = ids.ev.length ? await db.q("select * from kt_evidence where child_id = $1 and id = any($2::text[]) order by seq", [report.child_id, ids.ev]) : [];
    const lessons = ids.lesson.length ? await db.q("select * from lesson where child_id = $1 and id::text = any($2::text[])", [report.child_id, ids.lesson]) : [];
    const sks = ids.skill.length ? await db.q("select * from kt_skill_state where child_id = $1 and skill_id = any($2::text[])", [report.child_id, ids.skill]) : [];
    if (ev.length !== ids.ev.length) why.push(`kt_evidence: ${ids.ev.length - ev.length} cited row(s) not this child's or missing`);
    if (lessons.length !== ids.lesson.length) why.push(`lesson: ${ids.lesson.length - lessons.length} cited row(s) missing`);
    if (sks.length !== ids.skill.length) why.push("kt_skill_state row missing");
    const s = c.slots ?? {};
    if (s.name !== undefined && s.name !== child.first_name) why.push("name slot is not the child's name");
    const title = s.skill !== undefined && c.skillId ? await lookup.skillTitle(c.skillId) : null;
    if (s.skill !== undefined && title !== s.skill) why.push("skill slot is not the kit title of the cited skill");
    const onSkill = (r) => (r.skill_ids || []).includes(c.skillId);
    if (ev.some((r) => c.skillId && !onSkill(r) && !c.shapeId.startsWith("header"))) why.push("a cited row is on another skill");
    // completeness reads: every row in the window on this skill
    const all0 = c.skillId ? await db.q(`select * from kt_evidence where child_id = $1 and $2 = any(skill_ids) and occurred_at < $3 and ${NOT_PLACEMENT} order by seq`, [report.child_id, c.skillId, report.window_to]) : [];
    // a row with a late correction (`<id>:late`) is replaced by it: the correction is the row that counts
    const corrected = new Set(all0.map((r) => String(r.id)).filter((id) => id.endsWith(":late")).map((id) => id.slice(0, -5)));
    const all = all0.filter((r) => !corrected.has(String(r.id)));
    const allIn = all.filter((r) => inWin(r.occurred_at));
    const exact = (pred, label) => {
      const want = allIn.filter(pred).map((r) => r.id).sort().join(",");
      const got = ev.filter(pred).map((r) => r.id).sort().join(",");
      if (want !== got) why.push(`${label}: cited set is not every qualifying row in the window`);
      if (ev.some((r) => !pred(r))) why.push(`${label}: a cited row does not qualify`);
    };
    const delayedPair = (inside) => {
      if (ev.length !== 2) return why.push("a delayed claim cites exactly 2 rows");
      const [p, e] = ev;
      if (!delayedOk(e)) why.push("later row is not a first-try unaided success");
      if (p.session_id === e.session_id) why.push("both rows in one session");
      const between = all.filter((r) => Number(r.seq) > Number(p.seq) && Number(r.seq) < Number(e.seq));
      if (between.length) why.push("the earlier row is not the previous contact with the skill");
      const gap = ms(e.occurred_at) - ms(p.occurred_at);
      if (gap < 20 * 3600_000) why.push("gap under 20 h");
      if (Math.max(1, Math.round(gap / 86_400_000)) !== s.d) why.push("d slot ≠ the gap in days");
      if (inside !== inWin(e.occurred_at)) why.push(inside ? "success not in the window" : "success not before the window");
      if (!inside && !sameDate(s.date, dateSlot(e.occurred_at, child.tz))) why.push("date slot ≠ the success date");
    };
    /** The growth edge's action part: a re-check date equal to the skill's next_review_at, or (no date) a skill not learned yet. */
    const action = () => {
      const sk = sks[0];
      if (!sk) return why.push("growth edge cites no kt_skill_state row");
      if (c.shapeId.endsWith("_next")) { if (!["unseen", "introduced", "practising"].includes(sk.display)) why.push("'comes back' without a date needs a skill not learned yet"); }
      else if (!sk.next_review_at || !sameDate(s.date, dateSlot(sk.next_review_at, child.tz))) why.push("date slot ≠ kt_skill_state.next_review_at");
      // "It comes back on <date>" is a promise: the date must still be ahead when the report was made (after the window)
      else if (ms(sk.next_review_at) < Math.max(to, report.created_at ? ms(report.created_at) : to)) why.push("re-check date already past when the report was made");
    };
    switch (c.shapeId) {
      case "header.daily": case "header.weekly": case "header.monthly": case "header.zero": case "header.zero_month": case "header.nolesson": {
        // a lesson counts when something in it was graded or it ran ≥ 5 min, and it was not an abandoned start
        const win0 = await db.q("select id, started_at, ended_at, state from lesson where child_id = $1 and started_at >= $2 and started_at < $3", [report.child_id, report.window_from, report.window_to]);
        const win = win0.filter((l) => {
          const st = l.state ?? {};
          if (String(st.abandoned) === "true") return false;
          if (Array.isArray(st.did) && st.did.length) return true;
          return !!l.ended_at && ms(l.ended_at) - ms(l.started_at) >= 300_000;
        });
        if (win.map((l) => String(l.id)).sort().join(",") !== lessons.map((l) => String(l.id)).sort().join(",")) why.push("header does not cite exactly the window's lessons");
        if (c.shapeId === "header.zero" || c.shapeId === "header.zero_month") { if (win.length) why.push("zero header but lessons exist"); break; }
        if (c.shapeId === "header.nolesson") {
          if (win.length) why.push("no-lesson header but lessons exist");
          const inside = await db.q(`select id from kt_evidence where child_id = $1 and occurred_at >= $2 and occurred_at < $3 and ${NOT_PLACEMENT}`, [report.child_id, report.window_from, report.window_to]);
          if (!inside.length || inside.map((r) => r.id).sort().join(",") !== ev.map((r) => r.id).sort().join(",")) why.push("no-lesson header does not cite exactly the window's evidence");
          break;
        }
        if (s.lessons !== win.length) why.push("lessons slot ≠ lesson rows");
        // an open lesson (ended_at null) runs to its last evidence row in the window (session_id = lesson id), else 0 min
        const winEv = await db.q(`select id, session_id, occurred_at from kt_evidence where child_id = $1 and occurred_at >= $2 and occurred_at < $3 and ${NOT_PLACEMENT} order by seq`, [report.child_id, report.window_from, report.window_to]);
        const endOf = (l) => { if (l.ended_at) return ms(l.ended_at); const es = winEv.filter((r) => r.session_id === String(l.id)); return es.length ? Math.max(...es.map((r) => ms(r.occurred_at))) : ms(l.started_at); };
        const min = Math.round(win.reduce((a, l) => a + endOf(l) - ms(l.started_at), 0) / 60_000);
        if (s.min !== min) why.push(`min slot ${s.min} ≠ ${min}`);
        if ((c.shapeId === "header.weekly" || c.shapeId === "header.monthly") && s.days !== new Set(win.map((l) => learningDate(l.started_at, child.tz))).size) why.push("days slot ≠ distinct learning days");
        break;
      }
      case "st.delayed": delayedPair(true); break;
      case "st.delayed_before": delayedPair(false); break;
      case "st.pakka": {
        const succ = ev.filter(delayedOk);
        if (new Set(succ.map((r) => r.item_key)).size < 2 || succ.length !== s.k) why.push("pakka needs ≥ 2 delayed successes on distinct items, k = their count");
        if (!report.k7) why.push("pakka rendered without the calibration gate");
        break;
      }
      case "st.explained": exact(explained, "explained"); if (ev.filter(explained).length !== s.k) why.push("k ≠ count"); break;
      case "st.transfer": exact(transfer, "transfer"); if (ev.filter(transfer).length !== s.k) why.push("k ≠ count"); break;
      case "st.errorspot": exact(fixedSpot, "error-spot"); if (ev.filter(fixedSpot).length !== s.k) why.push("k ≠ count"); break;
      case "row.work": case "tricky.work": case "tricky.work_next": {
        exact(scored, "attempts");
        if (ev.length !== s.n || ev.filter(firstTry).length !== s.k) why.push(`n/k slots ${s.n}/${s.k} ≠ rows ${ev.length}/${ev.filter(firstTry).length}`);
        if (c.shapeId !== "row.work") {
          if (!(s.n >= 3 && 2 * s.k < s.n)) why.push("tricky rule (n ≥ 3, 2k < n) not met");
          action();
        }
        break;
      }
      case "row.started": {
        if (!ev.length || ev.some((r) => !r.teach || !inWin(r.occurred_at))) why.push("started cites teach rows in the window only");
        if (allIn.some(scored)) why.push("started, but a scored attempt exists in the window");
        break;
      }
      case "tricky.mixup": case "tricky.mixup_next": {
        const m = c.ref?.misconceptionId;
        const disc = (r) => !r.teach && !r.contaminated && !r.assisted && (r.discriminates === m || r.misconception_id === m);
        const want = all.filter(disc).map((r) => r.id).sort().join(",");
        if (!m || want !== ev.map((r) => r.id).sort().join(",")) why.push("mix-up does not cite exactly the diagnostic set to date");
        const k = ev.filter((r) => r.misconception_id === m).length;
        if (ev.length !== s.n || k !== s.k || s.n < 3 || s.k < 2) why.push("n/k slots ≠ the diagnostic set");
        if (!ev.some((r) => r.misconception_id === m && inWin(r.occurred_at))) why.push("no matching answer in the window");
        if (m && (await lookup.belief(m)) !== s.belief) why.push("belief slot ≠ the kit's belief text");
        action();
        break;
      }
      case "home.skill": if (!ev.length) why.push("home activity cites no success"); exact(firstTry, "home activity: first-try successes"); break;
      // ───────────── round 7 F: monthly sections and the weekly exam line ─────────────
      case "hold.week": case "hold.few": {
        // every scored answer in the window whose previous contact with each of its skills (any row) was ≥ 7 days earlier
        const rows0 = await db.q(`select * from kt_evidence where child_id = $1 and occurred_at < $2 and ${NOT_PLACEMENT} order by seq`, [report.child_id, report.window_to]);
        const late = new Set(rows0.map((r) => String(r.id)).filter((id) => id.endsWith(":late")).map((id) => id.slice(0, -5)));
        const rows = rows0.filter((r) => !late.has(String(r.id)));
        const last = new Map(), want = [];
        for (const r of rows) {
          const prev = (r.skill_ids || []).map((k) => last.get(k)).filter((x) => x !== undefined);
          if (inWin(r.occurred_at) && scored(r) && prev.length && Math.min(...prev.map((p) => ms(r.occurred_at) - p)) >= 7 * 86_400_000) want.push(r);
          for (const k of r.skill_ids || []) last.set(k, ms(r.occurred_at));
        }
        if (want.map((r) => r.id).sort().join(",") !== ev.map((r) => r.id).sort().join(",")) why.push("holding-up line does not cite exactly the window's after-a-week answers");
        if (s.n !== want.length) why.push(`n slot ${s.n} ≠ ${want.length}`);
        if (c.shapeId === "hold.week") { if (want.length < 3) why.push("hold.week needs ≥ 3"); if (s.k !== want.filter(firstTry).length) why.push("k slot ≠ first-try answers"); }
        else if (want.length >= 3) why.push("hold.few used with ≥ 3");
        break;
      }
      case "hard.hint": {
        const winEv = await db.q(`select * from kt_evidence where child_id = $1 and occurred_at >= $2 and occurred_at < $3 and ${NOT_PLACEMENT} order by seq`, [report.child_id, report.window_from, report.window_to]);
        const late = new Set(winEv.map((r) => String(r.id)).filter((id) => id.endsWith(":late")).map((id) => id.slice(0, -5)));
        const rows = winEv.filter((r) => !late.has(String(r.id)));
        const hinted = rows.filter(hintedR);
        if (hinted.map((r) => r.id).sort().join(",") !== ev.map((r) => r.id).sort().join(",")) why.push("hint line does not cite exactly the window's hinted answers");
        if (s.h !== hinted.length || s.k !== hinted.filter(solvedR).length) why.push(`h/k slots ${s.h}/${s.k} ≠ ${hinted.length}/${hinted.filter(solvedR).length}`);
        if (rows.filter(scored).length < 5) why.push("fewer than 5 scored answers in the month");
        break;
      }
      case "curious.asked": case "curious.asked_open": {
        const all = await db.q("select id, learning, created_at, answered_at from question_jar where child_id = $1 and created_at >= $2 and created_at < $3",
          [report.child_id, report.window_from, report.window_to]).catch(() => []);
        const asked = all.filter((j) => j.learning);
        if (asked.map((j) => String(j.id)).sort().join(",") !== [...ids.jar].sort().join(",")) why.push("curiosity line does not cite exactly the month's own questions");
        if (s.q !== asked.length) why.push(`q slot ${s.q} ≠ ${asked.length}`);
        // answered as of when the report was made (a question answered after that does not change what it said)
        const made = report.created_at ? ms(report.created_at) : to;
        const back = asked.filter((j) => j.answered_at && ms(j.answered_at) <= made).length;
        if (c.shapeId === "curious.asked" ? s.k !== back || back < 1 : back !== 0) why.push("k slot ≠ questions answered by the time of the report");
        break;
      }
      case "routine.days": {
        const win0 = await db.q("select id, started_at, ended_at, state from lesson where child_id = $1 and started_at >= $2 and started_at < $3", [report.child_id, report.window_from, report.window_to]);
        const win = win0.filter((l) => { const st = l.state ?? {}; if (String(st.abandoned) === "true") return false; if (Array.isArray(st.did) && st.did.length) return true; return !!l.ended_at && ms(l.ended_at) - ms(l.started_at) >= 300_000; });
        if (win.map((l) => String(l.id)).sort().join(",") !== lessons.map((l) => String(l.id)).sort().join(",")) why.push("routine line does not cite exactly the month's lessons");
        if (s.n !== new Set(win.map((l) => learningDate(l.started_at, child.tz))).size) why.push("n slot ≠ distinct learning days");
        if (s.d !== Math.round((to - from) / 86_400_000)) why.push("d slot ≠ days in the month");
        const winEv = await db.q(`select session_id, occurred_at from kt_evidence where child_id = $1 and occurred_at >= $2 and occurred_at < $3 and ${NOT_PLACEMENT}`, [report.child_id, report.window_from, report.window_to]);
        const mins = win.map((l) => { const e = l.ended_at ? ms(l.ended_at) : Math.max(ms(l.started_at), ...winEv.filter((r) => r.session_id === String(l.id)).map((r) => ms(r.occurred_at))); return Math.round((e - ms(l.started_at)) / 60_000); }).sort((a, b) => a - b);
        const med = mins.length % 2 ? mins[(mins.length - 1) / 2] : Math.round((mins[mins.length / 2 - 1] + mins[mins.length / 2]) / 2);
        if (s.m !== med) why.push(`m slot ${s.m} ≠ median ${med}`);
        break;
      }
      case "next.recheck": {
        const sk = sks[0];
        if (!sk?.next_review_at || !sameDate(s.date, dateSlot(sk.next_review_at, child.tz))) why.push("date slot ≠ kt_skill_state.next_review_at");
        else if (ms(sk.next_review_at) < Math.max(to, report.created_at ? ms(report.created_at) : to)) why.push("re-check date already past when the report was made");
        break;
      }
      case "exam.review": {
        const st = (await db.q("select state->'school'->'testWindows' as tw from conductor_state where child_id = $1", [report.child_id]).catch(() => []))[0];
        const tws = Array.isArray(st?.tw) ? st.tw : [];
        const lastDay = localDate(to - 86_400_000, child.tz), firstDay = localDate(from + 4 * 3600_000, child.tz);
        const ok = ids.test.length === 1 && tws.some((t) => `${t.subject}:${t.from}:${t.to}` === ids.test[0] && t.subject === s.subject && t.from <= lastDay && t.to >= firstDay);
        if (!ok) why.push("exam line does not cite a parent-entered test window overlapping the week");
        break;
      }
      default: why.push(`no check for shape ${c.shapeId}`);
    }
    out.push({ id: c.id, shapeId: c.shapeId, ok: !why.length, why });
  }
  // every rendered line maps to an admitted claim or a registered fixed copy id
  const claimIds = new Set(report.claims.map((c) => c.id));
  let total = 0, mapped = 0;
  for (const R of Object.values(report.renders)) for (const l of R.lines) {
    total++;
    if ((l.kind === "claim" && claimIds.has(l.claimId)) || (l.kind === "fixed" && typeof l.fixedId === "string")) mapped++;
  }
  return { claims: out, lines: { total, mapped }, supported: out.filter((x) => x.ok).length, total: out.length };
}
