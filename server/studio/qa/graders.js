// The host graders, one per archetype grader id (LIVE-STUDIO D3, D12: the host grades, never the artifact). Pure and
// deterministic; a grader is created per session from the FULL params (including hostOnly truth the build never sees)
// and returns { correct, itemId?, complete } per answer. The gate and the lesson use the same function (W2-H's
// server/studio/grade.js wraps this module for kt_evidence, so a build is graded identically in QA and in a lesson).
//
// Answers arrive as JSON from an untrusted frame: anything malformed is simply wrong, never an exception.

const near = (a, b) => typeof a === "number" && typeof b === "number" && Math.abs(a - b) < 1e-6;
const num = (v) => (typeof v === "number" ? v : typeof v === "string" && /^-?\d+(\.\d+)?$/.test(v.trim()) ? Number(v) : NaN);

/** Items answered in order: `test(item, value)`; the pointer advances only on correct. */
function itemsGrader(items, test) {
  let i = 0;
  return (value) => {
    const it = items[i];
    if (!it) return { correct: false, complete: true };
    const correct = !!test(it, value);
    if (correct) i++;
    return { correct, itemId: it.id, complete: i >= items.length };
  };
}
/** One fixed answer key (any number of attempts). */
function keyGrader(key, itemId = "q") {
  let done = false;
  return (value) => {
    const correct = !done && typeof value === "string" && value === key;
    if (correct) done = true;
    return { correct, itemId, complete: done };
  };
}

const extremeKey = (rows, valueOf, which) => {
  const best = rows.reduce((a, b) => (which === "most" || which === "latest" ? (valueOf(b) > valueOf(a) ? b : a) : valueOf(b) < valueOf(a) ? b : a));
  return best.key;
};

export const GRADERS = {
  /** shade_fraction: {n, d} equal to the current item. */
  fraction_items: (p) => itemsGrader(p.items, (it, v) => !!v && num(v.n) === it.n && num(v.d) === it.d),
  /** number_line_jump: {value} equal to the current item's target. */
  value_items: (p) => itemsGrader(p.items, (it, v) => !!v && near(num(v.value), it.target)),
  /** balance_scale: {value} = sum(left) - sum(right). */
  balance_items: (p) => itemsGrader(p.items, (it, v) => !!v && near(num(v.value), it.left.reduce((s, x) => s + x, 0) - it.right.reduce((s, x) => s + x, 0))),
  /** bar_chart_read: the key of the most / least value. */
  extreme_key: (p) => keyGrader(extremeKey(p.data, (d) => d.value, p.question)),
  /** pictograph: the row with the most / least value. */
  extreme_rows: (p) => keyGrader(extremeKey(p.rows, (r) => r.value, p.question)),
  /** timeline: the earliest / latest event. */
  extreme_events: (p) => keyGrader(extremeKey(p.events, (e) => e.year, p.question)),
  /** hub_flows: the host-held answer key. */
  host_key: (p) => keyGrader(p.answer),
  /** labelled_parts: the asked part. */
  ask_key: (p) => keyGrader(p.ask),
  /** process_chain: the stage after askAfter. */
  next_stage: (p) => { const i = p.stages.indexOf(p.askAfter); return keyGrader(p.stages[(i + 1) % p.stages.length]); },
  /** slider_law: {value} = k * ask.x + b. */
  law_value: (p) => { const want = p.law.k * p.ask.x + p.law.b; let done = false;
    return (v) => { const correct = !done && !!v && near(num(v.value), want); if (correct) done = true; return { correct, itemId: "q", complete: done }; }; },
  /** sort_bins: {card, bin}; each card once; complete when every card is sorted. */
  card_bins: (p) => {
    const placed = new Set();
    return (v) => {
      const card = v?.card, bin = v?.bin;
      const correct = typeof card === "string" && !placed.has(card) && p.binOf?.[card] !== undefined && p.binOf[card] === bin;
      if (correct) placed.add(card);
      return { correct, itemId: typeof card === "string" ? card.slice(0, 16) : "?", complete: placed.size >= p.cards.length };
    };
  },
  /** sequence_steps: {key} must be the next step of the true order. */
  sequence: (p) => {
    let i = 0;
    return (v) => {
      const correct = i < p.order.length && v?.key === p.order[i];
      if (correct) i++;
      return { correct, itemId: `pos${i}`, complete: i >= p.order.length };
    };
  },
};

/** A grader session for an archetype's params. Throws on an unknown grader id (a library bug). */
export function graderFor(a, params) {
  const g = GRADERS[a.grader];
  if (!g) throw new Error(`no grader ${a.grader}`);
  return g(params);
}

/** The answer a correct child gives at each step, in order (the gate's right path; tests use it too). */
export function rightAnswers(a, p) {
  switch (a.grader) {
    case "fraction_items": return p.items.map((it) => ({ n: it.n, d: it.d }));
    case "value_items": return p.items.map((it) => ({ value: it.target }));
    case "balance_items": return p.items.map((it) => ({ value: it.left.reduce((s, x) => s + x, 0) - it.right.reduce((s, x) => s + x, 0) }));
    case "extreme_key": return [extremeKey(p.data, (d) => d.value, p.question)];
    case "extreme_rows": return [extremeKey(p.rows, (r) => r.value, p.question)];
    case "extreme_events": return [extremeKey(p.events, (e) => e.year, p.question)];
    case "host_key": return [p.answer];
    case "ask_key": return [p.ask];
    case "next_stage": { const i = p.stages.indexOf(p.askAfter); return [p.stages[(i + 1) % p.stages.length]]; }
    case "law_value": return [{ value: p.law.k * p.ask.x + p.law.b }];
    case "card_bins": return p.cards.map((c) => ({ card: c, bin: p.binOf[c] }));
    case "sequence": return p.order.map((k) => ({ key: k }));
    default: return [];
  }
}
