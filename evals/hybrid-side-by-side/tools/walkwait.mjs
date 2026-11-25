// Usage: node evals/hybrid-side-by-side/tools/walkwait.mjs <topic> <card|step> <lines: try|haan|aside|give|hindi|wrong|right, "|"-separated> [skip]
//   walks to the topic's first (or skip-th) card or asked step, plays the lines (code's real read first), prints her turns; FLAGS=gated|all|<names> lists flags, DUMP=<file> writes rows.
// (cause B's driver, round d37 builder b3: step() and brain/say.js textReply driven directly, the reply stubbed; moved here by the closing
// builder. Every played child line is read by the REAL code read first — classify.js classifyFast against the open item's target — and
// only a line code cannot read takes the stub reading. tests/r8-d37-close.test.mjs pins b3/ROWS4.md's twelve walks at 0 gated flags.)
const ROOT = new URL("../../../", import.meta.url).href;
const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const LINES = { try: ["pehle main try karun?", { outcome: "no_evidence", request: { type: "selftry" } }], haan: ["haan", { outcome: "no_evidence" }],
  aside: ["kal maine cricket khela, sixer maara", { outcome: "no_evidence", request: { type: "uptake" } }], give: ["pata nahi", { outcome: "no_evidence", flags: { dontKnow: true } }],
  hindi: ["hindi mein bolo", { outcome: "no_evidence", request: { type: "language" } }], wrong: ["7", { outcome: "incorrect" }] };

/** One driven walk → { at, log: [printed lines], rows: [lesson rows], n0: the row index where the played lines start, script }. */
export async function walkWait(TOPIC, which, seq, skip = 0, { stubRead = false } = {}) {
  const { initLessonState, step } = await import(ROOT + "server/director/state.js");
  const { kitFromFile } = await import(ROOT + "server/content/kits.js");
  const { getTopic } = await import(ROOT + "server/content/curriculum.js");
  const { findItem } = await import(ROOT + "server/director/items.js");
  const { textReply, replyDeps } = await import(ROOT + "server/brain/say.js");
  const { classifyFast, targetFor } = await import(ROOT + "server/director/classify.js");
  const { scriptFor } = await import(ROOT + "server/director/script.js");
  const chat0 = replyDeps.chat, stream0 = replyDeps.chatStream;
  replyDeps.chat = async () => ({ text: STUB }); replyDeps.chatStream = replyDeps.chat;
  try {
    const kit = kitFromFile(getTopic(TOPIC));
    const realRead = (s, text) => { const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null; const f = classifyFast({ target: targetFor(s, kit, it), childText: text, lang: s.ctx?.lang, classLevel: 4, typed: true }); return f.result ?? null; };
    const ctx = { firstName: "Riya", teacherName: "Asha", teacherId: "asha", protege: { name: "Golu", what: "a pretend little friend" }, ageBand: "10-15", lang: "hinglish",
      interests: ["cricket"], firstMeeting: true, hasCallback: false, topicTitle: TOPIC, classLevel: 4, sessionId: "b-walk", lessonKey: "b-walk", teacher: "director" };
    let r = step(initLessonState({ topicId: TOPIC, kit, ctx, seed: 7, now: 0 }), { event: "start", kit, now: 0 });
    const say = async (r, text) => textReply({ instructions: "x", state: r.state, kit, childText: text, history: r.state.recent ?? [], ui: r.ui, module: null });
    const t0 = await say(r, "");
    r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t0.reply }];
    const rows = [{ child: null, text: t0.reply, lm: r.state.lastMove ?? {}, seams: t0.guard?.seams ?? [] }];
    let playing = false;
    const turn = async (text, cls) => {
      const s = r.state;
      const s1 = { ...s, recent: [...(s.recent ?? []), { who: "child", text }] };
      const real = stubRead || !playing ? null : realRead(s, text);
      r = step(s1, { event: "turn", kit, text, cls: real ?? { confidence: 0.9, flags: {}, ...cls }, now: (s.turn + 1) * 20_000 });
      const t = await say(r, text);
      r.state.recent = [...(r.state.recent ?? []), { who: "teacher", text: t.reply }];
      // (the record's page parts, as far as skillRemediation and orderRemediation read them — only on a turn that says a remediation)
      const pp = !/^rem:/.test(String(r.state.lastMove?.scriptBeat?.beatId ?? "")) ? [] : (t.guard?.parts?.list ?? []).map((x) => ({ part: x.part, beat: x.part === "body" ? r.state.lastMove?.scriptBeat?.beatId ?? null : ["card", "alt"].includes(x.part) ? r.state.lastMove?.cardBeat?.beatId ?? null : null }));
      rows.push({ child: text, text: t.reply, lm: r.state.lastMove, seams: t.guard?.seams ?? [], pageParts: pp, check: r.ui?.ask?.itemId ? { itemId: r.ui.ask.itemId, scripted: String(r.ui.ask.itemId).startsWith("script:"), misses: r.state.misses?.[r.ui.ask.itemId] ?? 0, gave: !!r.state.lastMove?.gave } : null, cardQ: !!(t.guard?.cardQuestionOnly || t.guard?.cardHeldForTry), read: real ? `${real.outcome}/${real.source}` : "stub", outcome: (real ?? cls)?.outcome ?? "no_evidence" });
      return t;
    };
    let found = false, sk = Number(skip ?? 0);
    for (let i = 0; i < 300 && !found; i++) {
      const s = r.state;
      const isStep = !!(s.lastMove?.stepAsk?.prompt && !s.lastMove.splitClose);
      const isCard = String(s.lastUi?.ask?.itemId ?? "").startsWith("script:") && !isStep;
      if ((which === "card" && isCard) || (which === "step" && isStep)) { if (sk-- <= 0) { found = true; break; } }
      const it = s.activeItemId ? findItem(s, kit, s.activeItemId) : null;
      await turn(it ? String(it.answer) : "haan", { outcome: it ? "correct" : "no_evidence" });
    }
    playing = true;
    const at = (r.state.recent ?? []).filter((x) => x.who === "teacher").at(-1)?.text;
    const log = [];
    const played = seq.split("|");
    for (const k of played) {
      let text, cls;
      if (k === "right") { const it = findItem(r.state, kit, r.state.activeItemId); text = String(it?.answer); cls = { outcome: "correct" }; } else [text, cls] = LINES[k];
      const t = await turn(text, cls);
      const lm = r.state.lastMove;
      log.push(`child: ${text}${rows.at(-1).read !== "stub" ? ` [real read: ${rows.at(-1).read}]` : ""}\n  her (${t.reply.split(/\s+/).length}w; waitN ${lm.waitN ?? "-"} heardCap ${lm.heardCap ?? "-"} told ${lm.stepReply?.told ?? "-"} gave ${!!lm.gave}; ${(t.guard?.seams ?? []).map((x) => x.right).join(">")}): ${t.reply}`);
    }
    const L = [];
    for (const x of rows) { if (x.child !== null) L.push({ who: "child", text: x.child, read: x.outcome }); L.push({ who: "teacher", text: x.text, cell: x.lm.cell, seams: x.seams, ...(x.pageParts?.length ? { pageParts: x.pageParts } : {}), ...(x.cardQ ? { cardQ: true } : {}), ...(x.check ? { check: x.check } : {}), waitN: x.lm.waitN, ...(x.lm.heardCap ? { heardCap: x.lm.heardCap } : {}), ...(x.lm.stepReply ? { stepAnswer: { beat: `${x.lm.stepReply.skillId}:worked:step${x.lm.stepReply.step + 1}`, right: !!x.lm.stepReply.right, told: x.lm.stepReply.told ?? null } } : {}) }); }
    return { found, at, log, rows: L, n0: L.length - 2 * played.length, script: scriptFor(kit).script };
  } finally { replyDeps.chat = chat0; replyDeps.chatStream = stream0; }
}

/** The gated (or named) flags of a walk's played rows: [{ row (from the first played line), predicate, why }]. */
export async function walkFlags(w, want = ["gated"]) {
  const { lessonFlags, PENDING } = await import(ROOT + "evals/hybrid-side-by-side/dry-predicates.mjs");
  return lessonFlags({ rows: w.rows, script: w.script }).filter((x) => want.includes("all") || want.includes(x.predicate) || (want.includes("gated") && !PENDING.has(x.predicate)))
    .filter((x) => x.row >= w.n0).map((x) => ({ row: x.row - w.n0, predicate: x.predicate, why: x.why }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [TOPIC, which, seq, skip] = process.argv.slice(2);
  if (!TOPIC || !which || !seq) { console.error("usage: walkwait.mjs <topic> <card|step> <lines|…> [skip]"); process.exit(2); }
  const w = await walkWait(TOPIC, which, seq, Number(skip ?? 0), { stubRead: !!process.env.STUB_READ });
  console.log("AT:", w.at);
  for (const x of w.log) console.log(x);
  if (process.env.DUMP) (await import("node:fs")).writeFileSync(process.env.DUMP, JSON.stringify({ topicId: TOPIC, director: w.rows }));
  if (process.env.FLAGS) for (const x of await walkFlags(w, process.env.FLAGS.split(","))) console.log("FLAG", x.row, x.predicate, x.why.slice(0, 120));
}
