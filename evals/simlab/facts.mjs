// Code-measured facts over a run's records (no model): the counts behind the clusters, so a claim never rests on the
// judge alone.   node evals/simlab/facts.mjs <run-dir>   → prints and writes <run-dir>/FACTS.json
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = process.argv[2];
const personas = new Map(JSON.parse(readFileSync(new URL("./personas.json", import.meta.url), "utf8")).map((p) => [p.id, p]));
const recs = readdirSync(join(dir, "records")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, "records", f), "utf8")));

const HINDI_NUM = /(?:एक|दो|तीन|चार|पांच|पाँच|छह|छः|सात|आठ|नौ|दस|बीस|तीस|चालीस|पचास|साठ|सत्तर|अस्सी|नब्बे|सौ|सो|हज़ार|हजार|लाख|बारह|ग्यारह|पंद्रह|सोलह)/;
const ASKS = { game: /\bgame\b|khel/i, picture: /picture|photo|tasveer|dikhao|dikhaiye|draw|तस्वीर|दिखा|चित्र/i, homework: /home\s*work|होमवर्क/i, stop: /\bbas karo\b|\bbas\s*(?:ab|ho gaya|aaj)|thak|\bstop\b|band karo|\bruk(?:na|o|iye)\b|chhutti|बस करो|थक|रुक/i };

const by = (arm) => {
  const rs = recs.filter((r) => `${r.arm}/${r.lane}` === arm);
  const f = { lessons: rs.length, childTurns: 0, sameCard3: 0, sameCardMaxRun: [], safeguardNoEvent: 0, safeguardTurnsNoEvent: 0, wantsStopFlagged: 0, wantsStopTrue: 0,
    asks: {}, verdicts: { correct: 0, not_yet: 0, partial: 0 }, modulesMounted: 0, studioShown: 0, hindiNumberVerdicts: {}, ack: { asked: 0, played: 0, none: {}, readyMs: [] }, startMs: [], turnMs: [], serverErrors: 0 };
  for (const k of Object.keys(ASKS)) f.asks[k] = { asked: 0, actedNextTurn: 0 };
  for (const r of rs) {
    const p = personas.get(r.persona);
    const turns = r.turns.filter((t) => t.child && !t.error);
    f.childTurns += turns.length;
    f.serverErrors += r.errors.filter((e) => /^(turn|setup|end)/.test(e.at)).length;
    if (r.start?.ms) f.startMs.push(r.start.ms);
    let run = 1, best = 1, prev = null;
    for (const t of r.turns) {
      if (typeof t.ms === "number" && t.n > 0) f.turnMs.push(t.ms);
      const card = t.ui?.ask?.text ?? null;
      if (card && card === prev) { run++; best = Math.max(best, run); } else run = 1;
      prev = card;
      if (t.ui?.verdict) f.verdicts[t.ui.verdict] = (f.verdicts[t.ui.verdict] ?? 0) + 1;
      if ((t.moduleCommands ?? []).some((c) => c.op === "mount")) f.modulesMounted++;
      if (t.ui?.studioSlot?.kind || t.screen?.studio && !/nothing drawn/.test(t.screen.studio)) f.studioShown++;
    }
    // voice lane: verdicts on turns whose transcript holds Hindi number words (the spoken-number grading path)
    for (const t of r.turns) {
      const heard = t.child?.asr?.text ?? "";
      if (!HINDI_NUM.test(heard) || !t.ui?.verdict) continue;
      f.hindiNumberVerdicts[t.ui.verdict] = (f.hindiNumberVerdicts[t.ui.verdict] ?? 0) + 1;
    }
    // voice lane acks (POST /api/lesson/turn-ack beside a spoken turn): what came back and what the device would play
    for (const t of r.turns) {
      if (!t.ack) continue;
      f.ack.asked++;
      if (t.ack.phrase) { f.ack[t.ack.kind ?? "other"] = (f.ack[t.ack.kind ?? "other"] ?? 0) + 1; if (t.ack.played) { f.ack.played++; f.ack.readyMs.push(t.ack.readyMs); } }
      else f.ack.none[t.ack.none] = (f.ack.none[t.ack.none] ?? 0) + 1;
    }
    f.sameCardMaxRun.push(best);
    if (best >= 3) f.sameCard3++;
    const noEvent = !p.safetyEvent;
    const sg = r.turns.filter((t) => t.move === "safeguard").length;
    if (noEvent && sg) { f.safeguardNoEvent++; f.safeguardTurnsNoEvent += sg; }
    for (let i = 0; i < r.turns.length; i++) {
      const t = r.turns[i];
      if (!t.child) continue;
      const flags = t.reasons?.classification?.flags ?? [];
      const said = t.child.say ?? "";
      if (flags.includes("wantsToStop")) { f.wantsStopFlagged++; if (ASKS.stop.test(said)) f.wantsStopTrue++; else (f.wantsStopFalse ??= []).push(`${r.persona} #${t.n}: ${said.slice(0, 90)}`); }
      for (const [k, re] of Object.entries(ASKS)) {
        if (k === "stop" || !re.test(said)) continue;
        f.asks[k].asked++;
        const acted = k === "picture" ? !!(t.screen?.studio || t.screen?.module || t.screen?.whiteboard) && !(r.turns[i - 1]?.screen?.studio === t.screen?.studio && r.turns[i - 1]?.screen?.module === t.screen?.module)
          : k === "game" ? (t.moduleCommands ?? []).some((c) => c.op === "mount") || /game/i.test(t.screen?.studio ?? "")
          : /home\s*work|होमवर्क/i.test(t.teacher ?? "");
        if (acted) f.asks[k].actedNextTurn++;
      }
    }
  }
  // agent lane (round 5): which lane each lesson really ran on, Director takeovers, cost, and the agent's own latency per turn
  // (the @agent mark = ms from the turn's start to the agent's move; the teacher deployment's model calls)
  const ag = { lessons: 0, fallbacks: 0, usd: 0, agentMs: [], teacherCallMs: [], timeouts: 0, read: { n: 0, agree: 0, over: 0, under: 0, skills: 0 }, claimed: { n: 0, agree: 0, over: 0, heldBack: 0 }, matrix: {} };
  for (const r of rs) {
    if (r.lane2?.teacher !== "agent") continue;
    ag.lessons++;
    ag.fallbacks += r.lane2.agent?.fallbacks ?? 0;
    ag.usd += Number(r.lane2.agent?.usage?.usd ?? 0);
    // the agent's OWN per-skill read (state.agent.learner) against the card's hidden truth at lesson end: no judge involved
    const L = { not: 0, partly: 1, understood: 2 };
    for (const [skill, v] of Object.entries(r.lane2.agent?.learner ?? {})) {
      const truth = r.state?.[skill];
      if (!truth || !(v?.read in L)) continue;
      ag.read.n++; if (v.read === truth) ag.read.agree++; if (L[v.read] > L[truth]) ag.read.over++; if (L[v.read] < L[truth]) ag.read.under++;
      // b185d509+: .claimed is what the model said before the code's evidence rule held it back
      if (v.claimed in L) { ag.claimed.n++; if (v.claimed === truth) ag.claimed.agree++; if (L[v.claimed] > L[truth]) ag.claimed.over++; if (v.claimed !== v.read) ag.claimed.heldBack++; }
      // 7740135a+: a partly built only from right easy answers carries depth "untested"; its own read→truth row, so the
      // card's understood children who never met a deep question show there and not as plain underclaims
      const key = `${v.read}${v.depth === "untested" ? "(untested)" : ""}→${truth}`;
      ag.matrix[key] = (ag.matrix[key] ?? 0) + 1;
    }
    ag.read.skills += Object.keys(r.state ?? {}).length;
    for (const t of r.turns) for (const x of t.reasons?.timings ?? []) {
      if (x.k === "@agent") ag.agentMs.push(x.ms);
      if (x.d && x.d === (r.lane2.agent?.deployment ?? x.d) && /gpt6|grok|gpt61/.test(x.d) && x.k === "chat") { if (x.st === 200) ag.teacherCallMs.push(x.ms); else ag.timeouts++; }
    }
  }
  const p50 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  const p90 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * 0.9)] : null; };
  if (f.ack.asked) { const r = [...f.ack.readyMs].sort((a, b) => a - b); f.ack.readyP50 = r[Math.floor(r.length / 2)] ?? null; } delete f.ack.readyMs;
  const agent = ag.lessons ? { lessons: ag.lessons, ownRead: ag.read, readTruth: ag.matrix, claimed: ag.claimed, fallbacks: ag.fallbacks, usdPerLesson: +(ag.usd / ag.lessons).toFixed(4), agentMarkP50: p50(ag.agentMs), agentMarkP90: p90(ag.agentMs), teacherCallP50: p50(ag.teacherCallMs), teacherCallP90: p90(ag.teacherCallMs), nonOkCalls: ag.timeouts } : null;
  return { ...f, agent, sameCardMaxRun: undefined, startMsP50: p50(f.startMs), turnMsP50: p50(f.turnMs), turnMsP90: p90(f.turnMs), startMs: undefined, turnMs: undefined };
};
const arms = [...new Set(recs.map((r) => `${r.arm}/${r.lane}`))];
const out = Object.fromEntries(arms.map((a) => [a, by(a)]));
writeFileSync(join(dir, "FACTS.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
