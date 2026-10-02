// household-sim.mjs — conductor-sim persona `three_siblings_one_phone` (gap-fill G3-household-siblings).
// Reference implementation of the pure household allocator `allocate()` (household.md §3) plus a minimal per-child
// Conductor (plan length, re-plan into the delivered window, the no-cascade rule), the per-guardian notify_slot cap,
// the per-device anchor reminder, profile switches, wrong-profile sessions with session.reassign, and an erasure of
// one sibling in week 4. 8 seeds x 4 simulated weeks. Prints the arm tables plus five negative controls.
// Run: node docs/research/conductor/household-sim.mjs        (no deps; ~1 s)
// [sim] A model of a household, not a household. It gates the design's invariants, never real behaviour.

// ---------- pure allocator (household.md §3.3; byte-deterministic in its input) ----------
export function allocate(inp) {
  const { household: H, members, cfg, now } = inp;
  const gap = cfg.handoverMin;
  const lanes = Array.from({ length: H.phones }, () => []);
  const out = [];
  const act = members.filter((m) => !m.leaving).slice().sort((a, b) => a.ref - b.ref);
  for (const m of act) for (const [i, s] of m.sittings.entries()) {   // 1. facts: started / ended sittings are fixed
    const iv = s.state === 'started' ? [s.startedAt, Math.max(s.plannedEnd, now)] : [s.startedAt, s.endedAt];
    lanes[s.lane].push({ from: iv[0], to: iv[1], ref: m.ref });
    out.push({ ref: m.ref, seq: i + 1, lane: s.lane, from: iv[0], to: iv[1], state: s.state === 'started' ? 'frozen' : 'done' });
  }
  const order = (a, b) => H.orderMode === 'parent_fixed' ? (a.fixedPos - b.fixedPos) || (a.ref - b.ref)
                                                         : (b.birthYear - a.birthYear) || (a.ref - b.ref);
  const pending = act.filter((m) => m.sittings.length === 0 && !m.doneForDay).sort(order);
  const cursor = lanes.map(() => H.anchor);
  const overlaps = (lane, f, t, g) => lanes[lane].some((iv) => f < iv.to + g && t + g > iv.from);
  const fitAfter = (lane, t, len) => {
    let f = t, moved = true;
    while (moved) {
      moved = false;
      for (const iv of lanes[lane]) if (f < iv.to + gap && f + len + gap > iv.from) { f = iv.to + gap; moved = true; }
    }
    return f;
  };
  while (pending.length) {
    let lane = 0;
    for (let l = 1; l < cursor.length; l++) if (cursor[l] < cursor[lane]) lane = l;
    const t = cursor[lane];
    let idx = pending.findIndex((m) => m.earliest <= t);   // younger-first among the children available at t
    if (idx < 0) { cursor[lane] = Math.min(...pending.map((m) => m.earliest)); continue; }
    const m = pending.splice(idx, 1)[0];
    const len = m.requestedMin;
    const from = fitAfter(lane, Math.max(t, m.earliest), len);
    let w = { ref: m.ref, seq: 0, lane, from, to: Math.min(from + len, m.latestEnd), state: 'planned' };
    if (w.to - w.from < cfg.minWindowMin) w = { ref: m.ref, seq: 0, lane, from: null, to: null, state: 'none' };
    const p = m.prev;                                      // hysteresis: keep the delivered window if it still fits
    if (p && p.state === 'planned' && w.state === 'planned' && p.lane === lane &&
        Math.abs(p.from - w.from) < cfg.hysteresisMin && Math.abs(p.to - w.to) < cfg.hysteresisMin &&
        p.from >= m.earliest && p.to <= m.latestEnd && !overlaps(lane, p.from, p.to, 0)) w = { ...p, ref: m.ref, seq: 0 };
    if (w.state === 'planned') { lanes[lane].push({ from: w.from, to: w.to, ref: m.ref }); cursor[lane] = Math.max(cursor[lane], w.to + gap); }
    else cursor[lane] = Math.max(cursor[lane], t);
    const changed = !p || p.state !== w.state || p.lane !== w.lane || p.from !== w.from || p.to !== w.to;
    out.push({ ...w, changed });
  }
  return out.sort((a, b) => a.ref - b.ref || a.seq - b.seq);
}

// ---------- persona ----------
const BAND = { B1: { cap: 30, session: 20, hwMax: 5 }, B2: { cap: 40, session: 25, hwMax: 8 }, B4: { cap: 75, session: 45, hwMax: 15 } };
const hm = (h, m = 0) => h * 60 + m;
const PERSONA = [
  { ref: 1, name: 'Riya', band: 'B1', birthYear: 2020, schoolEnd: hm(13, 30), rec: 60, bedtime: hm(20, 30), allowedTo: hm(20, 0) },
  { ref: 2, name: 'Kabir', band: 'B2', birthYear: 2018, schoolEnd: hm(14, 0), rec: 60, bedtime: hm(21, 0), allowedTo: hm(20, 30), tuition: [2, 4] },
  { ref: 3, name: 'Meera', band: 'B4', birthYear: 2013, schoolEnd: hm(15, 0), rec: 45, bedtime: hm(22, 0), allowedTo: hm(21, 30) },
];
const ERASE = { ref: 2, day: 25, at: hm(17, 10) };       // Kabir erased on week-4 Friday, mid-afternoon
const CFG = { handoverMin: 5, hysteresisMin: 10, minWindowMin: 3, debounceMin: 1, courierMin: 0.25, replanDebounceMin: 5 };

function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = (r) => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());

// ---------- one run ----------
function run(seed, arm) {
  const r = mulberry32(seed);
  const X = { notifyScope: 'guardian', planning: 'household', eraseRealloc: false, slotFk: 'set_null', reminders: 'device', ...arm };
  const M = { sittings: 0, resumes: 0, switches: 0, reassigns: 0, waits: 0, squeezedOut: 0, passes: 0, deliveries: 0,
    reports: 0, plannedOverlap: 0, deviceOverlap: 0, capBreach: 0, bedtimeBreach: 0, maxLearnGW: 0, maxWbGW: 0,
    maxRemDay: 0, maxRemWeek: 0, maxDelivPerMemberPass: 0, maxPassesPerTrigger: 0, eraseDisturb: 0,
    eraseEventsToSiblings: 0, replayMismatch: 0, replayed: 0, unreplayableAfterErase: 0, reassignOverCapMin: 0 };
  const household = { anchor: hm(16, 30), phones: 1, orderMode: 'younger_first' };
  const est = { 1: 20, 2: 25, 3: 45 };                   // household_member.est_min (allocator-owned)
  const log = [];                                         // household_decision {input, output}
  const erased = new Set();
  let remIgnored = 0, remPaused = false, remWeek = 0;
  const slots = new Map();                                // notify_slot rows: key → {child}
  let learnWeek = 0, wbWeek = 0;
  let seqNo = 0;

  for (let d = 0; d < 28; d++) {
    const dow = d % 7, off = dow >= 5;                    // d = 0 is a Monday
    if (dow === 0) { remWeek = 0; learnWeek = 0; wbWeek = 0; }
    if (d === 14) household.anchor = hm(17, 0);           // the parent moves the weekday anchor (household.routine_changed)
    const anchor = off ? hm(11, 0) : dow === 2 ? hm(19, 0) : household.anchor;   // Wednesdays the phone comes home at 19:00
    const C = {};
    for (const p of PERSONA) {
      if (erased.has(p.ref)) continue;
      const b = BAND[p.band];
      let earliest = off ? hm(10, 0) : p.schoolEnd + p.rec;
      if (!off && p.tuition?.includes(dow + 1)) earliest = Math.max(earliest, hm(18, 15));
      const testWin = p.ref === 3 && d >= 7 && d < 12;
      const base = Math.min(testWin ? 99 : b.session + Math.floor(r() * (b.hwMax + 1)), Math.floor(0.7 * b.cap));
      C[p.ref] = { p, b, earliest, latestEnd: Math.min(p.allowedTo, p.bedtime - 60), hardStop: p.bedtime - 30, base,
        cap: b.cap, used: 0, skip: r() < (off ? 0.35 : 0.1), jumper: r() < 0.12, jitter: gauss(r) * 8,
        hh: null, plannedMin: null, reported: null, opened: false, sittings: [], doneForDay: false,
        resumeUntil: null, remaining: 0, replanAt: null };
    }
    const Q = [];
    const push = (t, k, x) => { Q.push([t, ++seqNo, k, x]); Q.sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
    let lane = null;                                      // the one phone: {c, onC, start, plannedEnd, token}
    const waiting = new Set();
    let inbox = [], passAt = null, hhVersion = 0, trig = 0;
    const delivered = {};                                 // ref → window last delivered (the allocator's `prev`)
    const trigPasses = new Map();
    const report = (t, ref, kind, cause) => {
      M.reports++; const id = cause ?? ++trig; inbox.push({ ref, kind, trig: id });
      if (!trigPasses.has(id)) trigPasses.set(id, 0);
      if (passAt == null) { passAt = t + CFG.debounceMin; push(passAt, 'pass', null); }
    };
    const inputs = (t) => ({ v: 1, household: { ...household, anchor }, day: d, now: t, cfg: CFG,
      members: Object.values(C).filter((c) => !erased.has(c.p.ref)).map((c) => ({
        ref: c.p.ref, birthYear: c.p.birthYear, fixedPos: c.p.ref, earliest: c.earliest, latestEnd: c.latestEnd,
        requestedMin: c.reported ?? est[c.p.ref], sittings: c.sittings.map((s) => ({ ...s })), doneForDay: c.doneForDay,
        prev: delivered[c.p.ref] ?? null, leaving: false })) });
    const runPass = (t) => {
      passAt = null;
      if (!inbox.length) return;
      const trigs = [...new Set(inbox.map((x) => x.trig))]; inbox = [];
      const input = inputs(t);
      const output = allocate(JSON.parse(JSON.stringify(input)));
      hhVersion++; M.passes++;
      for (const k of trigs) trigPasses.set(k, trigPasses.get(k) + 1);
      log.push({ day: d, input, output });
      const rows = output.filter((w) => w.state !== 'none');       // I-H1, as the exclusion constraint sees it
      for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++)
        if (rows[i].lane === rows[j].lane && rows[i].from < rows[j].to && rows[j].from < rows[i].to) M.plannedOverlap++;
      const per = {};
      for (const w of output) {
        if (w.seq !== 0 || !w.changed) continue;
        per[w.ref] = (per[w.ref] ?? 0) + 1; M.deliveries++;
        delivered[w.ref] = { lane: w.lane, from: w.from, to: w.to, state: w.state };
        push(t + CFG.courierMin, 'deliver', { ref: w.ref, win: { ...delivered[w.ref], v: hhVersion }, trigs });
      }
      for (const v of Object.values(per)) M.maxDelivPerMemberPass = Math.max(M.maxDelivPerMemberPass, v);
    };
    const planLen = (c, t) => {                            // the child's planDay length (pure in its inputs)
      const w = X.planning === 'household' && c.hh?.state === 'planned' && c.hh.from > t ? c.hh : null;
      const start = w ? w.from : t;
      let len = Math.min(c.base, c.latestEnd - start, c.cap - c.used);
      if (w) len = Math.min(len, w.to - w.from);
      return Math.max(0, Math.floor(len));
    };
    const start = (c, t, resume) => {                     // admission + lesson start on the phone
      waiting.delete(c);
      let onC = c;                                        // wrong profile (p .04): a sibling's tile was tapped
      if (!resume && r() < 0.04) { const o = Object.values(C).find((x) => x !== c && !x.sittings.length && !x.opened && !erased.has(x.p.ref)); if (o) onC = o; }
      if (!resume && (t >= onC.latestEnd || t < onC.earliest)) { if (t >= onC.latestEnd) M.squeezedOut++; c.doneForDay = true; return false; }
      if (onC.cap - onC.used < 5) { c.doneForDay = true; return false; }     // the 5-min block must fit (I-C3)
      const len = resume ? c.remaining : planLen(onC, t);
      if (len < 3) { M.squeezedOut++; c.doneForDay = true; return false; }
      const roll = r();
      let actual = roll < 0.3 ? len + r() * 8 : roll < 0.45 ? len * (0.3 + 0.6 * r()) : len;
      if (actual > onC.cap - onC.used && r() < 0.05) onC.cap += 10;          // the parent's "+10" behind the PIN
      actual = Math.min(actual, onC.cap - onC.used, onC.hardStop - t);       // block reserve + hardStopAt wrap
      if (actual <= 0) { c.doneForDay = true; return false; }
      const token = ++seqNo;
      lane = { c, onC, start: t, plannedEnd: t + len, token };
      onC.sittings.push({ state: 'started', startedAt: t, plannedEnd: t + len, lane: 0 });
      c.resumeUntil = null;
      resume ? M.resumes++ : M.sittings++;
      report(t, onC.p.ref, 'sitting_started');
      const younger = Object.values(C).find((x) => x.p.birthYear > c.p.birthYear && !x.sittings.length && !x.doneForDay && !x.skip && !erased.has(x.p.ref));
      if (younger && !resume && r() < 0.08) push(t + actual * (0.2 + 0.5 * r()), 'switch', { token, by: younger });
      else push(t + actual, 'end', { token });
      return true;
    };
    const tryStart = (t) => {
      if (lane) return;
      const ready = [...waiting].sort((a, b) => b.p.birthYear - a.p.birthYear);   // present children, younger first
      for (const c of ready) {
        if (erased.has(c.p.ref)) { waiting.delete(c); continue; }
        const resume = c.resumeUntil != null;
        if (resume && t > c.resumeUntil) { waiting.delete(c); c.resumeUntil = null; c.doneForDay = true; continue; }
        if (start(c, t, resume)) return;
        waiting.delete(c);
      }
    };
    const endSitting = (t) => {
      const { c, onC } = lane;
      const mins = t - lane.start;
      onC.used += mins;
      if (onC.used > onC.cap + 1e-9) M.capBreach++;
      if (t > onC.hardStop + 1e-9) M.bedtimeBreach++;
      const s = onC.sittings[onC.sittings.length - 1];
      onC.sittings[onC.sittings.length - 1] = { state: 'ended', startedAt: s.startedAt, endedAt: t, lane: 0 };
      report(t, onC.p.ref, 'sitting_ended');
      if (onC !== c) push(t + 5 + r() * 115, 'reassign', { from: onC, to: c, mins, startedAt: s.startedAt });
      lane = null;
    };
    const remN = X.reminders === 'device' ? 1 : Object.keys(C).length;     // anchor reminder: per DEVICE
    if (!off && !remPaused && remWeek < 5) { M.maxRemDay = Math.max(M.maxRemDay, remN); remWeek += remN; M.maxRemWeek = Math.max(M.maxRemWeek, remWeek); }
    let openedNearAnchor = false, anyOpen = false;
    for (const c of Object.values(C)) if (!c.skip)
      push(Math.max(c.jumper ? anchor - r() * 25 : anchor + (c.p.ref - 1) * 25 + c.jitter, c.earliest - 5), 'open', { c });
    if (d === ERASE.day) push(ERASE.at, 'erase', null);
    if (X.planning === 'per_child') {                    // C2: each child plans from its own routine only
      const ws = Object.values(C).map((c) => { const f = Math.max(anchor, c.earliest); return [f, f + c.base]; });
      for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) if (ws[i][0] < ws[j][1] && ws[j][0] < ws[i][1]) M.plannedOverlap++;
    }

    while (Q.length) {
      const [t, , k, x] = Q.shift();
      if (k === 'pass') { if (t === passAt) runPass(t); continue; }
      if (k === 'deliver') {
        const c = C[x.ref]; if (!c || erased.has(x.ref)) continue;
        if (c.hh && c.hh.v >= x.win.v) continue;          // stale courier: fold only a newer hhVersion
        c.hh = x.win;
        if (c.opened && !c.sittings.length && !c.doneForDay) { c.replanAt = t + CFG.replanDebounceMin; push(c.replanAt, 'replan', { c }); }
        else if (!c.opened && x.win.state === 'planned' && !c.jumper)       // the phone is handed over near the window
          for (const q of Q) if (q[2] === 'open' && q[3].c === c) q[0] = Math.max(x.win.from + c.jitter, c.earliest - 5, t);
        Q.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
        continue;
      }
      if (k === 'replan') {                               // household-caused: NO household report (no-cascade, I-H3)
        const c = x.c; if (c.replanAt !== t || c.sittings.length || c.doneForDay || erased.has(c.p.ref)) continue;
        c.plannedMin = planLen(c, t);
        continue;
      }
      if (k === 'open') {
        const c = x.c; if (erased.has(c.p.ref) || c.doneForDay) continue;
        anyOpen = true; openedNearAnchor ||= t >= anchor - 30 && t < anchor + 60;
        if (!c.opened) {
          c.opened = true; c.plannedMin = planLen(c, t);
          if (c.reported == null || Math.abs(c.plannedMin - c.reported) >= 5) { c.reported = c.plannedMin; est[c.p.ref] = c.plannedMin; report(t, c.p.ref, 'plan'); }
        }
        if (lane) M.waits++;
        waiting.add(c); tryStart(t);
        continue;
      }
      if (k === 'tick') { tryStart(t); continue; }
      if (k === 'end') {
        if (!lane || lane.token !== x.token) continue;
        const c = lane.c; endSitting(t); c.doneForDay = true; push(t + 2, 'tick', null);   // 2-min hand-over
        continue;
      }
      if (k === 'switch') {                               // profile switch mid-sitting (I-H8: teardown first)
        if (!lane || lane.token !== x.token) continue;
        M.switches++;
        const c = lane.c, planned = lane.plannedEnd - lane.start, used = t - lane.start;
        endSitting(t);
        c.remaining = Math.max(0, planned - used); c.resumeUntil = t + 15;   // resumable like 'network' (15 min)
        if (c.remaining >= 3) waiting.add(c); else c.doneForDay = true;
        const g = x.by; if (!g.opened) { g.opened = true; g.plannedMin = planLen(g, t); }
        if (!start(g, t, false)) push(t + 2, 'tick', null);
        continue;
      }
      if (k === 'reassign') {                             // session.reassign: minutes → the real child; money ≤ headroom
        M.reassigns++;
        const { from, to } = x;
        from.used -= x.mins; to.used += x.mins;
        if (to.used > to.cap) M.reassignOverCapMin += to.used - to.cap;      // a fact, never a governor breach
        const i = from.sittings.findIndex((s) => s.startedAt === x.startedAt);
        if (i >= 0) to.sittings.push(from.sittings.splice(i, 1)[0]);
        to.sittings.sort((a, b) => a.startedAt - b.startedAt);
        report(t, from.p.ref, 'sitting_voided');
        continue;
      }
      if (k === 'erase') {
        // erasure fence (2b) then cascade. The fence waits for an in-flight pass; nothing re-allocates (I-H6).
        if (passAt != null) runPass(t);                   // the in-flight pass commits first
        const snap = JSON.stringify(Object.fromEntries(Object.entries(delivered).filter(([ref]) => +ref !== ERASE.ref)));
        const before = M.deliveries;
        erased.add(ERASE.ref); delete delivered[ERASE.ref];
        if (lane && (lane.c.p.ref === ERASE.ref || lane.onC.p.ref === ERASE.ref)) lane = null, push(t + 2, 'tick', null);
        inbox = inbox.filter((i) => i.ref !== ERASE.ref);
        for (const L of log) if (L.input.members.some((m) => m.ref === ERASE.ref)) L.memberErased = true;   // decision_member cascade
        for (const [key, v] of [...slots]) if (v.child === ERASE.ref) X.slotFk === 'set_null' ? slots.set(key, { child: null }) : slots.delete(key);
        if (X.eraseRealloc) { inbox.push({ ref: 0, kind: 'member_left', trig: ++trig }); trigPasses.set(trig, 0); runPass(t); }
        if (JSON.stringify(Object.fromEntries(Object.entries(delivered).filter(([ref]) => +ref !== ERASE.ref))) !== snap) M.eraseDisturb++;
        M.eraseEventsToSiblings += M.deliveries - before;
        continue;
      }
    }
    // I-H1 on the device: actual sittings never overlap (one session per device)
    const iv = Object.values(C).flatMap((c) => c.sittings.map((s) => [s.startedAt, s.endedAt ?? s.plannedEnd])).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < iv.length; i++) if (iv[i][0] < iv[i - 1][1] - 1e-9) M.deviceOverlap++;
    if (!off && !remPaused) { remIgnored = openedNearAnchor ? 0 : remIgnored + 1; if (remIgnored >= 3) remPaused = true; }
    else if (remPaused && anyOpen) { remPaused = false; remIgnored = 0; }  // any open re-arms (device-level)
    for (const n of trigPasses.values()) M.maxPassesPerTrigger = Math.max(M.maxPassesPerTrigger, n);
    for (const L of log.filter((L) => L.day === d && !L.memberErased)) {        // nightly allocator replay (I-H4)
      M.replayed++;
      if (JSON.stringify(allocate(JSON.parse(JSON.stringify(L.input)))) !== JSON.stringify(L.output)) M.replayMismatch++;
    }

    // notifications: notify_slot per GUARDIAN (slot 1 = the family letter, slot 2 = any other learning class)
    const iso = Math.floor(d / 7);
    const take = (scope, slot, child) => {
      const key = X.notifyScope === 'guardian' ? `${scope}:${iso}:${slot}` : `${scope}:${iso}:${child}:${slot}`;
      if (slots.has(key)) return false; slots.set(key, { child }); return true;
    };
    for (const c of Object.values(C)) {
      if (erased.has(c.p.ref)) continue;
      const forced = (d === 21 && c.p.ref === 2) || (d === 26 && c.p.ref === 3);     // around the erasure (day 25)
      if ((forced || r() < 0.5 / 7) && take('learn', 2, c.p.ref)) learnWeek++;      // milestone
      if (d === 7 && c.p.ref === 3 && take('learn', 2, c.p.ref)) learnWeek++;       // test_window
      if (r() < 0.1 / 7 && take('wb', 1, c.p.ref)) wbWeek++;
    }
    if (dow === 6) {                                      // the guardian's letter day
      if (X.notifyScope === 'guardian') { if (take('learn', 1, null)) learnWeek++; }
      else for (const c of Object.values(C)) if (!erased.has(c.p.ref) && take('learn', 1, c.p.ref)) learnWeek++;
    }
    M.maxLearnGW = Math.max(M.maxLearnGW, learnWeek); M.maxWbGW = Math.max(M.maxWbGW, wbWeek);
  }
  M.unreplayableAfterErase = log.filter((L) => L.memberErased).length;
  return M;
}

// C3 fixture: the no-cascade rule. 3 members, requested [21, 28, 45]; member 2 has the R2 late latch (a sitting
// starting >= 20:00 gets the minimum segment set, 12 min). Trigger: the parent moves the anchor 19:20 -> 20:00.
export function cascadeFixture(noCascade) {
  const mem = [
    { ref: 1, birthYear: 2020, fixedPos: 1, earliest: hm(15), latestEnd: hm(19, 30), requestedMin: 21, sittings: [], doneForDay: false, prev: null, leaving: false },
    { ref: 2, birthYear: 2018, fixedPos: 2, earliest: hm(15), latestEnd: hm(20, 30), requestedMin: 28, sittings: [], doneForDay: false, prev: null, leaving: false, r2: true },
    { ref: 3, birthYear: 2013, fixedPos: 3, earliest: hm(15), latestEnd: hm(21, 0), requestedMin: 45, sittings: [], doneForDay: false, prev: null, leaving: false },
  ];
  const H = { anchor: hm(19, 20), phones: 1, orderMode: 'younger_first' };
  const plan = (m, w) => w.state !== 'planned' ? 0 : m.r2 && w.from >= hm(20) ? 12 : Math.min(m.requestedMin, w.to - w.from);
  const pass = () => {
    const out = allocate({ v: 1, household: H, day: 0, now: 0, cfg: CFG, members: mem.map(({ r2, ...m }) => m) });
    let deliv = 0;
    for (const w of out) { const m = mem.find((x) => x.ref === w.ref); if (w.changed) { m.prev = { lane: w.lane, from: w.from, to: w.to, state: w.state }; deliv++; } }
    return { out, deliv };
  };
  pass();                                                  // the morning allocation
  H.anchor = hm(20, 0);                                    // the trigger: one routine change
  let passes = 0, deliveries = 0, replans = 0, pending = true;
  while (pending && passes < 10) {
    pending = false; const { out, deliv } = pass(); passes++; deliveries += deliv;
    for (const w of out) {
      if (!w.changed) continue;
      const m = mem.find((x) => x.ref === w.ref); const len = plan(m, w); replans++;
      if (!noCascade && Math.abs(len - m.requestedMin) >= 5) { m.requestedMin = len; pending = true; }   // re-report
    }
  }
  return { passes, deliveries, replans };
}

// ---------- tables ----------
const SEEDS = [11, 12, 13, 14, 15, 16, 17, 18];
const sum = (rows, k) => rows.reduce((a, m) => a + m[k], 0);
const max = (rows, k) => Math.max(...rows.map((m) => m[k]));
const runAll = (arm) => SEEDS.map((s) => run(s, arm));
const main = runAll({});
const K = ['sittings', 'resumes', 'switches', 'reassigns', 'waits', 'squeezedOut', 'passes', 'deliveries', 'reports',
  'plannedOverlap', 'deviceOverlap', 'capBreach', 'bedtimeBreach', 'maxLearnGW', 'maxWbGW', 'maxRemDay', 'maxRemWeek',
  'maxDelivPerMemberPass', 'maxPassesPerTrigger', 'eraseDisturb', 'eraseEventsToSiblings', 'replayed', 'replayMismatch',
  'unreplayableAfterErase', 'reassignOverCapMin'];
console.log('household-sim (gap-fill G3-household-siblings): persona three_siblings_one_phone = Riya B1 (6 y), Kabir B2 (8 y,');
console.log('tuition Tue+Thu to 18:00), Meera B4 (13 y, test window days 7-11); 1 phone; anchor 16:30 -> 17:00 from day 14,');
console.log('19:00 on Wednesdays, 11:00 on weekends; Kabir erased on day 25 at 17:10. 8 seeds x 28 days. [sim]');
console.log('seed | ' + K.join(' | '));
main.forEach((m, i) => console.log(SEEDS[i] + ' | ' + K.map((k) => +m[k].toFixed(1)).join(' | ')));
console.log('total | ' + K.map((k) => k.startsWith('max') ? max(main, k) : +sum(main, k).toFixed(1)).join(' | '));
console.log('\nGATES (8/8 seeds):');
const gate = (name, ok, got) => console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${got}`);
gate('I-H1 planned household_slot overlap = 0', sum(main, 'plannedOverlap') === 0, sum(main, 'plannedOverlap'));
gate('I-H1 device: actual sittings overlap = 0', sum(main, 'deviceOverlap') === 0, sum(main, 'deviceOverlap'));
gate('I-C3 governor cap breach = 0 (each child, own cap)', sum(main, 'capBreach') === 0, sum(main, 'capBreach'));
gate('DC7 sitting past bedtime - 30 = 0', sum(main, 'bedtimeBreach') === 0, sum(main, 'bedtimeBreach'));
gate('I-H2 learning pushes per guardian-week <= 2', max(main, 'maxLearnGW') <= 2, max(main, 'maxLearnGW'));
gate('I-H2 wellbeing pointers per guardian-week <= 1', max(main, 'maxWbGW') <= 1, max(main, 'maxWbGW'));
gate('I-H9 anchor reminders per device <= 1/day and <= 5/week', max(main, 'maxRemDay') <= 1 && max(main, 'maxRemWeek') <= 5, `${max(main, 'maxRemDay')}/day, ${max(main, 'maxRemWeek')}/week`);
gate('I-H3 deliveries per member per pass <= 1', max(main, 'maxDelivPerMemberPass') <= 1, max(main, 'maxDelivPerMemberPass'));
gate('I-H3 passes per trigger <= 1', max(main, 'maxPassesPerTrigger') <= 1, max(main, 'maxPassesPerTrigger'));
gate('I-H6 erasure: sibling windows unchanged, 0 events to siblings', sum(main, 'eraseDisturb') === 0 && sum(main, 'eraseEventsToSiblings') === 0, `${sum(main, 'eraseDisturb')} disturbed, ${sum(main, 'eraseEventsToSiblings')} events`);
gate('I-H4 nightly allocator replay byte-equal', sum(main, 'replayMismatch') === 0, `${sum(main, 'replayMismatch')}/${sum(main, 'replayed')}`);
console.log(`facts: ${sum(main, 'reassigns')} reassigns moved minutes onto the real child; ${sum(main, 'reassignOverCapMin').toFixed(1)} min landed over that child's cap (screen time really used; admission was never past a cap). ${sum(main, 'unreplayableAfterErase')} earlier passes became unreplayable after the erasure (expected: member inputs cascade).`);
const fx = [cascadeFixture(true), cascadeFixture(false)];
console.log(`C3 fixture (anchor 19:20 -> 20:00, member 2 R2-latched): with the no-cascade rule ${JSON.stringify(fx[0])}; without ${JSON.stringify(fx[1])}`);

console.log('\nNEGATIVE CONTROLS (each must trip):');
const ctl = (label, ok, got) => console.log(`${ok ? 'TRIPPED' : 'DID NOT TRIP'} ${label} :: ${got}`);
let t;
t = runAll({ notifyScope: 'child' }); ctl('C1 notify_slot keyed per (guardian, child)', max(t, 'maxLearnGW') > 2, `max learning pushes per guardian-week = ${max(t, 'maxLearnGW')}, wb = ${max(t, 'maxWbGW')}`);
t = runAll({ planning: 'per_child' }); ctl('C2 per-child planning from own routine (no household windows)', sum(t, 'plannedOverlap') > 0, `planned overlaps = ${sum(t, 'plannedOverlap')}`);
ctl('C3 a household-caused re-plan re-reports its length', fx[1].passes > 1 && fx[0].passes === 1, `passes ${fx[0].passes} -> ${fx[1].passes}, deliveries ${fx[0].deliveries} -> ${fx[1].deliveries}`);
t = runAll({ eraseRealloc: true }); ctl('C4 erasure re-allocates the remaining members', sum(t, 'eraseDisturb') > 0, `seeds disturbed = ${sum(t, 'eraseDisturb')}/8, events to siblings = ${sum(t, 'eraseEventsToSiblings')}`);
t = runAll({ slotFk: 'cascade' }); ctl('C5 notify_slot.child_id ON DELETE CASCADE', max(t, 'maxLearnGW') > 2, `max learning pushes per guardian-week = ${max(t, 'maxLearnGW')}`);
t = runAll({ reminders: 'child' }); ctl('C6 anchor reminder scheduled per child', max(t, 'maxRemDay') > 1, `max reminders per device-day = ${max(t, 'maxRemDay')}, per week = ${max(t, 'maxRemWeek')}`);
{ // C7: a planted clock read inside the allocator must break replay (I-H4)
  const leaky = (i) => allocate({ ...i, now: i.now + (Date.now() % 7) + 1 });
  const inp = { v: 1, household: { anchor: hm(16, 30), phones: 1, orderMode: 'younger_first' }, day: 0, now: hm(16, 40), cfg: CFG,
    members: [{ ref: 1, birthYear: 2020, fixedPos: 1, earliest: hm(15), latestEnd: hm(19, 30), requestedMin: 21, doneForDay: false, prev: null, leaving: false,
                sittings: [{ state: 'started', startedAt: hm(16, 30), plannedEnd: hm(16, 35), lane: 0 }] },
              { ref: 2, birthYear: 2018, fixedPos: 2, earliest: hm(15), latestEnd: hm(20), requestedMin: 28, sittings: [], doneForDay: false, prev: null, leaving: false }] };
  const a = JSON.stringify(leaky(inp)); const b = JSON.stringify(allocate(JSON.parse(JSON.stringify(inp))));
  console.log(`${a !== b ? 'TRIPPED' : 'DID NOT TRIP'} C7 a clock read planted in allocate() :: replay byte-equal = ${a === b}`);
}
