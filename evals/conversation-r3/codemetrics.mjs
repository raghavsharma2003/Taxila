// Round 3 (conversation stream, 2026-10-09): code metrics over every turn of a conversation-r3 battery run dir
// (lessons/*.json written by evals/conversation-r3/run.mjs against a LOCAL server, which serves the turn's debug read).
// No model calls. What it counts, per turn with a teacher reply:
//   rewrite      the reply guard (brain/say.js textReply) made a second model call (guard.rewritten): the brief's
//                "rewrite rate" (60 % on 2026-10-06, m-lat-rewrite-share-2026-10-06; target ~10 %)
//   caught       the guard codes on the FIRST draft (guard.caught), alone and as combinations
//   repaired     fixed in code with no model call (guard.repaired and not rewritten)
//   leadSlot     the lead slot wrote the turn (guard.leadSlot), and the lead-only repair (guard.leadRepair)
//   final        codes still on the words that shipped (guard.final)
//   bare         a probe or setup turn (the child said a case line) answered with the card question and < 4 own words
//                (round 2's measure, evals/conversation-r2/codemetrics.mjs)
//   repeatJ08    Jaccard >= 0.8 to an earlier teacher line of the same lesson (round 2's measure)
//   fallbackLine the fixed model-failure line
//   ownWords     her words besides the pinned kit question (p50 / p90): the "short turns" measure
//   uptakeProxy  on the child's case lines: her own words share a content word with what they said (Demszky et al. 2021's
//                "building on what the student said", as a crude lexical proxy, not their model)
//   sensible     the word "sensible" in her reply (recited from a prompt note, rj: anything sentence-shaped is recited)
//   praiseWords  the owner checker's praise-of-the-answer pattern (tests/prod/_owner.mjs RX.praiseAny) on a turn whose
//                verdict (server, debug) is not "correct": praise before or without a verdict
//   ms           turn wall time from the harness (p50 / p90), and the server's own turn ms
//   replyStage   the reply stage alone (the plan's @kernel / @planned mark to @replied: the reply call, every rewrite and
//                repair), and the reply-model calls per turn (taxila-fast, speculative ones included)
// Usage: node evals/conversation-r3/codemetrics.mjs <runDir> [--json out.json] [--examples N]
import fs from "fs";

const argv = process.argv.slice(2);
const dir = argv[0];
const outJson = argv.includes("--json") ? argv[argv.indexOf("--json") + 1] : null;
const EXN = argv.includes("--examples") ? Number(argv[argv.indexOf("--examples") + 1]) : 0;
const W = (t) => String(t ?? "").trim().split(/\s+/).filter(Boolean);
const norm = (t) => String(t ?? "").toLowerCase().normalize("NFKC").replace(/[^\p{L}\p{N}/]+/gu, " ").trim();
const jac = (a, b) => { const A = new Set(norm(a).split(" ").filter(Boolean)), B = new Set(norm(b).split(" ").filter(Boolean)); let i = 0; for (const x of A) if (B.has(x)) i++; return i / Math.max(1, A.size + B.size - i); };
const FALL = /meri baat atak gayi|lost my words for a second/i;
const STOP = new Set(["hain", "haan", "nahi", "nahin", "kya", "kyun", "kaise", "mujhe", "tumhe", "aapko", "aapka", "tumhara", "please", "this", "that", "what", "with",
  "have", "your", "about", "just", "like", "karo", "karte", "kijiye", "batao", "bataiye", "kuch", "bhi", "abhi", "sakte", "sakta", "sakti", "theek", "achha"]);
// tests/prod/_owner.mjs RX.praiseAny, copied (the owner checker is the bar; kept in step by hand)
const PRAISE_ANY = /\b(?:aapne|tumne|you)\b[^.!?]{0,60}\b(?:sahi|correct(?:ly)?|right)\s+(?:kaha|bataya|likha|likhi|likhe|pehchana|pehchaana|jodi|joda|chuni|chuna|socha|pakda|nikala|got|said|found|identified)\b|\bsahi (?:jawab|answer)\b(?!\s*(?:kya|kaun|hoga))|\bthat'?s (?:right|correct)\b/iu;
const pct = (a, b) => (b ? `${a}/${b} (${(100 * a / b).toFixed(1)}%)` : `${a}/0`);
const q = (xs, p) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : null; };

const M = { turns: 0, modelTurns: 0, withDbg: 0, rewrite: 0, repairedOnly: 0, leadSlot: 0, leadRepair: 0, firstClean: 0, unavailable: 0,
  bare: 0, probeTurns: 0, uptake: 0, sameOpener: 0, theekHai: 0, codeLead: 0, repeatJ08: 0, fallbackLine: 0, sensible: 0, praiseWords: 0, finalLeft: 0 };
const caught = {}, combos = {}, finals = {}, byMove = {}, own = [], ms = [], sms = [], replyMs = [], replyCalls = [], ex = { bare: [], praise: [], sensible: [], rewrite: [] };
// the reply stage: from the plan (@kernel, else @planned) to @replied, and the reply-model calls in it (taxila-fast)
const stageOf = (calls) => {
  const at = (k) => calls.find((c) => c.k === k)?.ms;
  const a = at("@kernel") ?? at("@planned"), b = at("@replied");
  return typeof a === "number" && typeof b === "number" && b >= a ? b - a : null;
};
for (const f of fs.readdirSync(`${dir}/lessons`).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(`${dir}/lessons/${f}`, "utf8"));
  let said = [], lid = null, prevOpen = null;
  for (const t of j.turns ?? []) {
    if (t.lessonId !== lid) { said = []; lid = t.lessonId; prevOpen = null; }
    const r = t.teacherReply;
    if (!r || t.error || t.who !== "child") { if (r) said.push(r); continue; }
    M.turns++;
    if (typeof t.ms === "number") ms.push(t.ms);
    const g = t.dbg?.guard ?? null;
    if (t.dbg) {
      M.withDbg++; if (typeof t.dbg.ms === "number") sms.push(t.dbg.ms);
      const st = stageOf(t.dbg.calls ?? []); if (st != null) replyMs.push(st);
      replyCalls.push((t.dbg.calls ?? []).filter((c) => c.k === "chat" && /taxila-fast/.test(String(c.dep))).length);
    }
    const kind = t.move?.kind ?? "?";
    const bm = (byMove[kind] ??= { n: 0, rewrite: 0 });
    bm.n++;
    if (g) {
      const c = g.caught ?? [];
      if (c.includes("unavailable") || c.includes("content_filter")) M.unavailable++;
      else {
        M.modelTurns++;
        if (!c.length) M.firstClean++;
        for (const x of c) caught[x] = (caught[x] ?? 0) + 1;
        if (c.length) { const k = [...c].sort().join("+"); combos[k] = (combos[k] ?? 0) + 1; }
        if (g.rewritten) { M.rewrite++; bm.rewrite++; if (ex.rewrite.length < EXN) ex.rewrite.push(`[${kind}] ${c.join(",")} :: ${t.childText} -> D: ${String(g.firstDraft ?? "").slice(0, 140)} || F: ${r.slice(0, 140)}`); }
        else if (g.repaired) M.repairedOnly++;
        if (g.leadSlot) M.leadSlot++;
        if (g.leadRepair) M.leadRepair++;
        if (g.final?.length) { M.finalLeft++; for (const x of g.final) finals[x] = (finals[x] ?? 0) + 1; }
      }
    }
    const ask = t.ui?.ask?.itemId ? t.ui.ask.text : null;
    const ownT = ask ? r.split(ask).join(" ") : r;
    own.push(W(ownT).length);
    const meaningful = /^(probe|setup):/.test(t.tag ?? "");
    if (meaningful) {
      M.probeTurns++;
      // uptake proxy (Demszky et al. 2021: building on what was said): her own words share a content word (>= 4 letters, not
      // a function word) with the child's line, or quote a number they said
      const cw = (x) => new Set(norm(x).split(" ").filter((w) => (w.length >= 4 && !STOP.has(w)) || /\d/.test(w)));
      const kid = cw(t.childText), hers = cw(ownT);
      if ([...kid].some((w) => hers.has(w))) M.uptake++;
    }
    if (meaningful && ask && W(ownT).length < 4) { M.bare++; if (ex.bare.length < EXN) ex.bare.push(`${t.tag}: ${t.childText} -> ${r.slice(0, 120)}`); }
    if (said.some((p) => jac(p, r) >= 0.8)) M.repeatJ08++;
    if (FALL.test(r)) M.fallbackLine++;
    // the same two opening words as her previous turn of the lesson ("Theek hai, … / Theek hai, …"): a monotone tell
    const open2 = norm(r).split(" ").slice(0, 2).join(" ");
    if (prevOpen && open2 === prevOpen) M.sameOpener++;
    if (/^theek hai\b/.test(norm(r))) M.theekHai++;
    prevOpen = open2;
    if (t.dbg?.guard?.codeLead) M.codeLead++;
    if (/\bsensible\b/i.test(r)) { M.sensible++; if (ex.sensible.length < EXN) ex.sensible.push(r.slice(0, 120)); }
    const v = t.dbg?.verdict ?? null;
    if (v && v !== "correct" && PRAISE_ANY.test(r)) { M.praiseWords++; if (ex.praise.length < EXN) ex.praise.push(`[${v}] ${t.childText} -> ${r.slice(0, 140)}`); }
    said.push(r);
  }
}
const out = {
  dir: dir.split("/").filter(Boolean).pop(), turns: M.turns, withDebug: M.withDbg,
  rewriteRate: pct(M.rewrite, M.modelTurns), firstDraftClean: pct(M.firstClean, M.modelTurns), repairedInCodeOnly: pct(M.repairedOnly, M.modelTurns),
  leadSlot: pct(M.leadSlot, M.modelTurns), leadRepair: M.leadRepair, unavailableOrFiltered: M.unavailable, finalProblemsLeft: pct(M.finalLeft, M.modelTurns),
  caught: Object.fromEntries(Object.entries(caught).sort((a, b) => b[1] - a[1])),
  combos: Object.fromEntries(Object.entries(combos).sort((a, b) => b[1] - a[1]).slice(0, 15)),
  final: Object.fromEntries(Object.entries(finals).sort((a, b) => b[1] - a[1])),
  rewriteByMove: Object.fromEntries(Object.entries(byMove).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => [k, `${v.rewrite}/${v.n}`])),
  bare: pct(M.bare, M.probeTurns), uptakeProxy: pct(M.uptake, M.probeTurns), sameOpenerAsPrevious: pct(M.sameOpener, M.turns), opensTheekHai: pct(M.theekHai, M.turns),
  codeLead: M.codeLead, repeatJ08: pct(M.repeatJ08, M.turns), fallbackLine: M.fallbackLine, sensible: M.sensible, praiseWordsNotCorrect: M.praiseWords,
  ownWords: { p50: q(own, 0.5), p90: q(own, 0.9), mean: own.length ? +(own.reduce((a, b) => a + b, 0) / own.length).toFixed(1) : null },
  turnMs: { p50: q(ms, 0.5), p90: q(ms, 0.9) }, serverMs: { p50: q(sms, 0.5), p90: q(sms, 0.9) },
  replyStageMs: { p50: q(replyMs, 0.5), p90: q(replyMs, 0.9), n: replyMs.length },
  replyModelCallsPerTurn: replyCalls.length ? +(replyCalls.reduce((a, b) => a + b, 0) / replyCalls.length).toFixed(2) : null,
};
console.log(JSON.stringify(out, null, 1));
if (EXN) for (const [k, v] of Object.entries(ex)) if (v.length) console.log(`\n--- ${k}\n${v.join("\n")}`);
if (outJson) fs.writeFileSync(outJson, JSON.stringify(out, null, 1));
