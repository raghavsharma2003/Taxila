// Code-measured facts over a run's records (no model): the counts behind the clusters, so a claim never rests on the
// judge alone.   node evals/simlab/facts.mjs <run-dir>   → prints and writes <run-dir>/FACTS.json
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

const dir = process.argv[2];
const personas = new Map(JSON.parse(readFileSync(new URL("./personas.json", import.meta.url), "utf8")).map((p) => [p.id, p]));
const recs = readdirSync(join(dir, "records")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, "records", f), "utf8")));

const ASKS = { game: /\bgame\b|khel/i, picture: /picture|photo|tasveer|dikhao|dikhaiye|draw|तस्वीर|दिखा|चित्र/i, homework: /home\s*work|होमवर्क/i, stop: /\bbas karo\b|\bbas\s*(?:ab|ho gaya|aaj)|thak|\bstop\b|band karo|\bruk(?:na|o|iye)\b|chhutti|बस करो|थक|रुक/i };

const by = (arm) => {
  const rs = recs.filter((r) => `${r.arm}/${r.lane}` === arm);
  const f = { lessons: rs.length, childTurns: 0, sameCard3: 0, sameCardMaxRun: [], safeguardNoEvent: 0, safeguardTurnsNoEvent: 0, wantsStopFlagged: 0, wantsStopTrue: 0,
    asks: {}, verdicts: { correct: 0, not_yet: 0, partial: 0 }, modulesMounted: 0, studioShown: 0, startMs: [], turnMs: [], serverErrors: 0 };
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
  const p50 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };
  const p90 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length * 0.9)] : null; };
  return { ...f, sameCardMaxRun: undefined, startMsP50: p50(f.startMs), turnMsP50: p50(f.turnMs), turnMsP90: p90(f.turnMs), startMs: undefined, turnMs: undefined };
};
const arms = [...new Set(recs.map((r) => `${r.arm}/${r.lane}`))];
const out = Object.fromEntries(arms.map((a) => [a, by(a)]));
writeFileSync(join(dir, "FACTS.json"), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
