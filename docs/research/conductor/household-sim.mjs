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
  const X = { ...{ notifyScope: 'guardian', planning: 'household', noCascade: true, eraseRealloc: false, slotFk: 'set_null', reminders: 'device' }, ...arm };
  const M = { days: 0, sittings: 0, plannedOverlap: 0, deviceOverlap: 0, waits: 0, capBreach: 0, bedtimeBreach: 0,
    reassignOverCapMin: 0, passes: 0, deliveries: 0, maxDelivPerMemberPass: 0, maxPassesPerTrigger: 0, reports: 0,
    eraseDisturb: 0, replayMismatch: 0, memberErasedPasses: 0, squeezedOut: 0, switches: 0, resumes: 0, reassigns: 0,
    maxLearnGW: 0, maxWbGW: 0, maxRemDay: 0, maxRemWeek: 0, transientConflictMax: 0 };
  const household = { anchor: hm(16, 30), phones: 1, orderMode: 'younger_first' };
  const est = { 1: 20, 2: 25, 3: 45 };                   // household_member.est_min (allocator-owned)
  const log = [];                                         // household_decision: {input, output}
  const erased = new Set();
  let remPausedIgnored = 0, remPaused = false, remWeek = 0;
  const slots = new Map();                                // notify_slot: key → {child}
  let learnWeek = new Map(), wbWeek = new Map();          // per guardian-week counters (pointer pushes sent)

  for (let d = 0; d < 28; d++) {
    const dow = d % 7;                                    // 0 = Monday
    const off = dow >= 5;
    if (dow === 0) { remWeek = 0; learnWeek = new Map(); wbWeek = new Map(); }
    if (d === 14) household.anchor = hm(17, 0);           // parent moves the weekday anchor (household.routine_changed)
    const anchor = off ? hm(11, 0) : household.anchor;
    M.days++;
    const kids = PERSONA.filter((p) => !erased.has(p.ref) && !(p.ref === ERASE.ref && d > ERASE.day));
    const C = {};
    for (const p of kids) {
      const b = BAND[p.band];
      let earliest = off ? hm(10, 0) : p.schoolEnd + p.rec;
      if (!off && p.tuition?.includes(dow + 1)) earliest = Math.max(earliest, hm(18, 15));
      const latestEnd = Math.min(p.allowedTo, p.bedtime - 60);
      const testWin = p.ref === 3 && d >= 7 && d < 12;
      const base = Math.min(testWin ? Math.floor(0.7 * b.cap) : b.session + Math.floor(r() * (b.hwMax + 1)), Math.floor(0.7 * b.cap));
      const skip = r() < (off ? 0.35 : 0.1);
      const jumper = r() < 0.12;
      C[p.ref] = { p, b, earliest, latestEnd, hardStop: p.bedtime - 30, base, cap: b.cap, used: 0, skip, jumper,
        hh: null, plannedMin: null, reported: null, opened: false, sitting: null, done: false, resumeUntil: null,
        remaining: null, wrongOn: null, voidPending: false, planVersions: 0, replanAt: null, jitter: gauss(r) * 8 };
    }
    // events: [t, kind, data]; process in time order
    const Q = [];
    const push = (t, k, x) => { Q.push([t, k, x]); Q.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1])); };
    let lane = null;                                      // the one phone: {ref, onRef, start, plannedEnd}
    const waiting = [];
    let inbox = [], passScheduled = false, hhVersion = 0, triggerId = 0;
    const delivered = {};                                 // ref → last delivered window (prev)
    const sitFacts = {};                                  // ref → sitting fact for the allocator
    const trigPasses = new Map();
    const report = (t, ref, kind, causeTrig) => {
      M.reports++; const id = causeTrig ?? ++triggerId; inbox.push({ ref, kind, trig: id });
      trigPasses.set(id, trigPasses.get(id) ?? 0);
      if (!passScheduled) { passScheduled = true; push(t + CFG.debounceMin, 'pass', null); }
    };
    const memberInputs = (t) => Object.values(C).filter((c) => !erased.has(c.p.ref)).map((c) => ({
      ref: c.p.ref, birthYear: c.p.birthYear, fixedPos: c.p.ref, earliest: c.earliest, latestEnd: c.latestEnd,
      requestedMin: c.reported ?? est[c.p.ref], sitting: sitFacts[c.p.ref] ?? null, prev: delivered[c.p.ref] ?? null, leaving: false }));
    const runPass = (t) => {
      passScheduled = false;
      if (!inbox.length) return;
      const trigs = new Set(inbox.map((x) => x.trig)); inbox = [];
      const input = { v: 1, household: { ...household, anchor }, day: d, now: t, members: memberInputs(t), cfg: CFG };
      const output = allocate(JSON.parse(JSON.stringify(input)));
      hhVersion++; M.passes++;
      for (const k of trigs) trigPasses.set(k, trigPasses.get(k) + 1);
      log.push({ day: d, input, output });
      // I-H1: placed rows never overlap within a lane (the exclusion constraint)
      const rows = output.filter((w) => w.state !== 'none');
      for (let i = 0; i < rows.length; i++) for (let j = i + 1; j < rows.length; j++)
        if (rows[i].lane === rows[j].lane && rows[i].from < rows[j].to && rows[j].from < rows[i].to) M.plannedOverlap++;
      const perMember = {};
      for (const w of output) {
        if (w.state === 'frozen' || w.state === 'done' || !w.changed) continue;
        perMember[w.ref] = (perMember[w.ref] ?? 0) + 1;
        delivered[w.ref] = { lane: w.lane, from: w.from, to: w.to, state: w.state };
        M.deliveries++;
        push(t + CFG.courierMin, 'deliver', { ref: w.ref, win: { ...w, v: hhVersion }, trigs: [...trigs] });
      }
      for (const v of Object.values(perMember)) M.maxDelivPerMemberPass = Math.max(M.maxDelivPerMemberPass, v);
    };
    const planLen = (c, t) => {                           // the child's planDay length (pure in its inputs)
      const hw = c.hh && c.hh.state === 'planned' && X.planning === 'household' ? c.hh : null;
      const start = hw && hw.from > t ? hw.from : t;
      const room = Math.max(0, c.latestEnd - start);
      let len = Math.min(c.base, room, c.cap - c.used);
      if (hw && hw.from > t) len = Math.min(len, hw.to - hw.from);
      return Math.max(0, Math.floor(len));
    };
    const tryStart = (t) => {
      if (lane) return;
      const ready = waiting.filter((x) => x.at <= t).sort((a, b) => b.c.p.birthYear - a.c.p.birthYear);
      for (const w of ready) {
        const c = w.c;
        waiting.splice(waiting.indexOf(w), 1);
        if (erased.has(c.p.ref)) continue;
        const resume = c.resumeUntil != null;
        if (resume && t > c.resumeUntil) { c.resumeUntil = null; c.done = true; continue; }
        if (!resume && (t >= c.latestEnd || t < c.earliest)) { if (t >= c.latestEnd) M.squeezedOut++; c.done = true; continue; }
        const capLeft = c.cap - c.used;
        if (capLeft < 5) { c.done = true; continue; }    // admission: a 5-min block must fit (I-C3)
        let len = resume ? c.remaining : (planLen(c, t) || 0);
        if (len < 3) { M.squeezedOut++; c.done = true; continue; }
        const roll = r();
        let actual = roll < 0.3 ? len + r() * 8 : roll < 0.45 ? len * (0.3 + 0.6 * r()) : len;
        if (actual > capLeft && r() < 0.05) { c.cap += 10; }   // parent "+10" behind the PIN raises today's cap
        actual = Math.min(actual, c.cap - c.used, c.hardStop - t);
        if (actual <= 0) { c.done = true; continue; }
        // wrong profile: a sibling's tap lands on this profile (p .04); the session books to the wrong child
        let onRef = c.p.ref;
        if (!resume && r() < 0.04) { const o = Object.values(C).find((x) => x !== c && !erased.has(x.p.ref) && !x.sitting); if (o) onRef = o.p.ref; }
        lane = { ref: c.p.ref, onRef, start: t, plannedEnd: t + len, end: t + actual };
        c.sitting = { startedAt: t }; c.resumeUntil = null;
        if (resume) M.resumes++; else M.sittings++;
        sitFacts[onRef === c.p.ref ? c.p.ref : onRef] = { state: 'started', startedAt: t, plannedEnd: t + len, lane: 0 };
        report(t, onRef, 'sitting_started');
        // profile switch: a younger sibling grabs the phone mid-sitting (p .08)
        const younger = Object.values(C).find((x) => x.p.birthYear > c.p.birthYear && !x.sitting && !x.done && !x.skip && !erased.has(x.p.ref));
        if (younger && !resume && r() < 0.08) {
          const at = t + actual * (0.2 + 0.5 * r());
          push(at, 'switch', { c, by: younger });
        } else push(t + actual, 'end', { c, reason: 'completed' });
        return;
      }
    };
    const endSitting = (t, c, reason) => {
      if (!lane || lane.ref !== c.p.ref) return;
      const mins = t - lane.start;
      const onC = C[lane.onRef];
      onC.used += mins;
      if (onC.used > onC.cap + 1e-9) M.capBreach++;
      if (t > c.hardStop + 1e-9) M.bedtimeBreach++;
      sitFacts[lane.onRef] = { state: 'ended', startedAt: lane.start, endedAt: t, lane: 0 };
      report(t, lane.onRef, 'sitting_ended');
      if (lane.onRef !== c.p.ref) push(t + 5 + r() * 115, 'reassign', { from: onC, to: c, mins, start: lane.start, end: t });
      lane = null;
      tryStart(t + 2);
      push(t + 2, 'tick', null);
    };
    // device anchor reminder: one per DEVICE per day (control: one per child)
    const remN = X.reminders === 'device' ? 1 : kids.length;
    if (!remPaused) { M.maxRemDay = Math.max(M.maxRemDay, remN); remWeek += remN; M.maxRemWeek = Math.max(M.maxRemWeek, remWeek); }
    let openedInWindow = false;

    // opens
    for (const c of Object.values(C)) {
      if (c.skip) continue;
      const tOpen = c.jumper ? anchor - r() * 25 : anchor + (c.p.ref - 1) * 25 + c.jitter;   // initial guess; refined on delivery
      push(Math.max(tOpen, c.earliest - 5), 'open', { c });
    }
    if (d === ERASE.day) push(ERASE.at, 'erase', null);
    // per-child planning control: windows from each child's own routine only (no household)
    if (X.planning === 'per_child') {
      const ws = Object.values(C).map((c) => { const f = Math.max(anchor, c.earliest); return [f, f + c.base]; });
      for (let i = 0; i < ws.length; i++) for (let j = i + 1; j < ws.length; j++) if (ws[i][0] < ws[j][1] && ws[j][0] < ws[i][1]) M.plannedOverlap++;
    }

    let guard = 0;
    while (Q.length && guard++ < 5000) {
      const [t, k, x] = Q.shift();
      if (k === 'pass') { runPass(t); continue; }
      if (k === 'deliver') {
        const c = C[x.ref]; if (!c || erased.has(x.ref)) continue;
        if (c.hh && c.hh.v >= x.win.v) continue;          // stale courier: folded only if newer (monotonic hhVersion)
        c.hh = x.win;
        if (c.opened && !c.sitting && !c.done) c.replanAt = t + CFG.replanDebounceMin, push(t + CFG.replanDebounceMin, 'replan', { c, trigs: x.trigs });
        else if (!c.opened && x.win.state === 'planned' && !c.jumper) {   // not yet opened: the parent hands the phone over near the window
          for (const q of Q) if (q[1] === 'open' && q[2].c === c) q[0] = Math.max(x.win.from + c.jitter, c.earliest - 5);
          Q.sort((a, b) => a[0] - b[0] || a[1].localeCompare(b[1]));
        }
        continue;
      }
      if (k === 'replan') {
        const c = x.c; if (c.replanAt !== t || c.sitting || c.done || erased.has(c.p.ref)) continue;
        const len = planLen(c, t); c.planVersions++;
        if (len !== c.plannedMin) {
          c.plannedMin = len;
          // NO-CASCADE: a household-caused re-plan never reports (control: it reports when it moved ≥ 5 min)
          if (!X.noCascade && Math.abs(len - (c.reported ?? 0)) >= 5) { c.reported = len; for (const tr of x.trigs) report(t, c.p.ref, 'plan', tr); }
        }
        continue;
      }
      if (k === 'open') {
        const c = x.c; if (erased.has(c.p.ref) || c.done) continue;
        openedInWindow ||= t >= anchor && t < anchor + 60;
        if (!c.opened) {
          c.opened = true; c.plannedMin = planLen(c, t); c.planVersions++;
          if (c.reported == null || Math.abs(c.plannedMin - c.reported) >= 5) { c.reported = c.plannedMin; est[c.p.ref] = c.plannedMin; report(t, c.p.ref, 'plan'); }
        }
        if (lane) M.waits++;
        waiting.push({ c, at: t });
        tryStart(t);
        continue;
      }
      if (k === 'tick') { tryStart(t); continue; }
      if (k === 'end') { endSitting(t, x.c, x.reason); x.c.done = true; continue; }
      if (k === 'switch') {
        const c = x.c; if (!lane || lane.ref !== c.p.ref) continue;
        M.switches++;
        const used = t - lane.start, planned = lane.plannedEnd - lane.start;
        // one session per device: the old session is torn down BEFORE the new child's token (I-H8)
        endSitting(t, c, 'profile_switch');
        c.remaining = Math.max(0, planned - used); c.resumeUntil = t + 15; c.sitting = null;
        if (c.remaining >= 3) waiting.push({ c, at: t });
        if (!waiting.find((w) => w.c === x.by)) { x.by.opened = true; x.by.plannedMin = planLen(x.by, t); waiting.push({ c: x.by, at: t }); }
        // the grabber goes now (no handover gap): the lane is free at t
        const wi = waiting.findIndex((w) => w.c === x.by); const w = waiting.splice(wi, 1)[0]; waiting.unshift(w);
        tryStart(t);
        continue;
      }
      if (k === 'reassign') {
        // session.reassign (same guardian): minutes move to the real child; money only within headroom (I-C7)
        M.reassigns++;
        x.from.used -= x.mins; x.to.used += x.mins;
        if (x.to.used > x.to.cap) M.reassignOverCapMin += x.to.used - x.to.cap;   // a fact, not a governor breach
        sitFacts[x.from.p.ref] = { state: 'void' };       // the profile owner never sat: a fresh window if time remains
        if (!sitFacts[x.to.p.ref] || sitFacts[x.to.p.ref].state === 'void') sitFacts[x.to.p.ref] = { state: 'ended', startedAt: x.start, endedAt: x.end, lane: 0 };
        report(t, x.from.p.ref, 'sitting_void');
        continue;
      }
      if (k === 'erase') {
        // erasure fence (2b): wait for an in-flight pass, mark the member leaving, cascade. NO re-allocation (I-H6).
        const before = Object.fromEntries(Object.entries(delivered).filter(([ref]) => +ref !== ERASE.ref).map(([k2, v]) => [k2, JSON.stringify(v)]));
        erased.add(ERASE.ref); delete delivered[ERASE.ref]; delete sitFacts[ERASE.ref];
        inbox = inbox.filter((i) => i.ref !== ERASE.ref);
        for (const L of log) if (L.input.members.some((m) => m.ref === ERASE.ref)) L.memberErased = true;   // decision_member cascade
        for (const [key, v] of slots) if (v.child === ERASE.ref) slots.set(key, X.slotFk === 'set_null' ? { child: null } : undefined);
        for (const [key, v] of [...slots]) if (v === undefined) slots.delete(key);
        if (X.eraseRealloc) { inbox.push({ ref: 0, kind: 'member_left', trig: ++triggerId }); trigPasses.set(triggerId, 0); runPass(t); }
        for (const [ref, v] of Object.entries(before)) if (JSON.stringify(delivered[ref]) !== v) M.eraseDisturb++;
        continue;
      }
    }
    if (lane) endSitting(lane.end, C[lane.ref], 'completed');
    // reminders: ignored = no open by any household profile within an hour of the anchor (device-level)
    if (!remPaused) { remPausedIgnored = openedInWindow ? 0 : remPausedIgnored + 1; if (remPausedIgnored >= 3) remPaused = true; }
    if (openedInWindow || Object.values(C).some((c) => c.opened)) { if (remPaused && Object.values(C).some((c) => c.opened)) { remPaused = false; remPausedIgnored = 0; } }
    for (const n of trigPasses.values()) M.maxPassesPerTrigger = Math.max(M.maxPassesPerTrigger, n);

    // ---------- notifications for the day (per-guardian notify_slot: slot 1 family letter, slot 2 any other) ----------
    const iso = Math.floor(d / 7);
    const take = (scope, slot, child) => {
      const key = X.notifyScope === 'guardian' ? `${scope}:${iso}:${slot}` : `${scope}:${iso}:${child}:${slot}`;
      if (slots.has(key)) return false; slots.set(key, { child }); return true;
    };
    const sentL = (n) => { learnWeek.set(iso, (learnWeek.get(iso) ?? 0) + n); M.maxLearnGW = Math.max(M.maxLearnGW, learnWeek.get(iso)); };
    for (const c of Object.values(C)) {
      if (erased.has(c.p.ref)) continue;
      const forced = (d === 21 && c.p.ref === 2) || (d === 24 && c.p.ref === 3);
      if (forced || r() < 0.5 / 7) { if (take('learn', 2, c.p.ref)) sentL(1); }          // milestone
      if (d === 7 && c.p.ref === 3) { if (take('learn', 2, c.p.ref)) sentL(1); }         // test_window
      if (r() < 0.1 / 7) { if (take('wb', 1, c.p.ref)) { wbWeek.set(iso, (wbWeek.get(iso) ?? 0) + 1); M.maxWbGW = Math.max(M.maxWbGW, wbWeek.get(iso)); } }
    }
    if (dow === 6) {                                      // the weekly letter day
      if (X.notifyScope === 'guardian') { if (take('learn', 1, null)) sentL(1); }
      else for (const c of Object.values(C)) if (!erased.has(c.p.ref) && take('learn', 1, c.p.ref)) sentL(1);
    }
  }
  // I-H4: allocator replay is byte-equal on every recorded pass whose members all still exist
  for (const L of log) {
    if (L.memberErased) { M.memberErasedPasses++; continue; }
    if (JSON.stringify(allocate(JSON.parse(JSON.stringify(L.input)))) !== JSON.stringify(L.output)) M.replayMismatch++;
  }
  return M;
}

// ---------- tables ----------
const SEEDS = [11, 12, 13, 14, 15, 16, 17, 18];
const sum = (rows, k) => rows.reduce((a, m) => a + m[k], 0);
const max = (rows, k) => Math.max(...rows.map((m) => m[k]));
function table(label, arm) {
  const rows = SEEDS.map((s) => run(s, arm));
  return { label, rows };
}
const main = table('design', {});
const K = ['sittings', 'resumes', 'switches', 'reassigns', 'waits', 'squeezedOut', 'passes', 'deliveries', 'reports',
  'plannedOverlap', 'capBreach', 'bedtimeBreach', 'maxLearnGW', 'maxWbGW', 'maxRemDay', 'maxRemWeek',
  'maxDelivPerMemberPass', 'maxPassesPerTrigger', 'eraseDisturb', 'replayMismatch', 'memberErasedPasses', 'reassignOverCapMin'];
console.log('household-sim: persona three_siblings_one_phone (B1 Riya, B2 Kabir w/ tuition Tue+Thu, B4 Meera), 1 phone, 4 weeks; Kabir erased day 22');
console.log('seed | ' + K.join(' | '));
for (let i = 0; i < SEEDS.length; i++) console.log(SEEDS[i] + ' | ' + K.map((k) => (+main.rows[i][k].toFixed(1))).join(' | '));
console.log('\nGATES (must hold on 8/8 seeds):');
const gate = (name, ok, got) => console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${got}`);
gate('I-H1 planned slot overlap = 0', sum(main.rows, 'plannedOverlap') === 0, sum(main.rows, 'plannedOverlap'));
gate('I-C3 cap breach (governor) = 0', sum(main.rows, 'capBreach') === 0, sum(main.rows, 'capBreach'));
gate('DC7 sitting past bedtime-30 = 0', sum(main.rows, 'bedtimeBreach') === 0, sum(main.rows, 'bedtimeBreach'));
gate('I-H2 learning pushes per guardian-week <= 2', max(main.rows, 'maxLearnGW') <= 2, max(main.rows, 'maxLearnGW'));
gate('I-H2 wellbeing pointers per guardian-week <= 1', max(main.rows, 'maxWbGW') <= 1, max(main.rows, 'maxWbGW'));
gate('I-H9 anchor reminders per device: <= 1/day, <= 5/week', max(main.rows, 'maxRemDay') <= 1 && max(main.rows, 'maxRemWeek') <= 5, `${max(main.rows, 'maxRemDay')}/day, ${max(main.rows, 'maxRemWeek')}/week`);
gate('I-H3 deliveries per member per pass <= 1', max(main.rows, 'maxDelivPerMemberPass') <= 1, max(main.rows, 'maxDelivPerMemberPass'));
gate('I-H3 passes caused per trigger <= 1', max(main.rows, 'maxPassesPerTrigger') <= 1, max(main.rows, 'maxPassesPerTrigger'));
gate('I-H6 erasure disturbs no sibling window', sum(main.rows, 'eraseDisturb') === 0, sum(main.rows, 'eraseDisturb'));
gate('I-H4 allocator replay byte-equal', sum(main.rows, 'replayMismatch') === 0, `${sum(main.rows, 'replayMismatch')} mismatches; ${sum(main.rows, 'memberErasedPasses')} passes skipped as member_erased`);
console.log(`facts: reassigned minutes over the target's cap (screen time really used; never a governor breach): ${sum(main.rows, 'reassignOverCapMin').toFixed(1)} min over ${sum(main.rows, 'reassigns')} reassigns`);

console.log('\nNEGATIVE CONTROLS (each must trip):');
const ctl = (label, arm, k, trip, agg = sum) => { const t = table(label, arm); const v = agg(t.rows, k); console.log(`${trip(v) ? 'TRIPPED' : 'DID NOT TRIP'} ${label} :: ${k} = ${+v.toFixed(1)}`); };
ctl('C1 notify_slot scoped per (guardian, child)', { notifyScope: 'child' }, 'maxLearnGW', (v) => v > 2, max);
ctl('C2 per-child planning (no household windows)', { planning: 'per_child' }, 'plannedOverlap', (v) => v > 0);
ctl('C3 household re-plan reports again (no-cascade off)', { noCascade: false }, 'maxPassesPerTrigger', (v) => v > 1, max);
ctl('C4 erasure re-allocates the remaining members', { eraseRealloc: true }, 'eraseDisturb', (v) => v > 0);
ctl('C5 notify_slot.child_id ON DELETE CASCADE (erasure frees a slot)', { slotFk: 'cascade' }, 'maxLearnGW', (v) => v > 2, max);
ctl('C6 anchor reminder per child', { reminders: 'child' }, 'maxRemDay', (v) => v > 1, max);
