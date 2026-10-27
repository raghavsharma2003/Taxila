// Wire A/B (main, 2026-10-21): the same cards and seed with the child's screen following the Studio wire (runner default)
// and with SIMLAB_WIRE=off (the old harness, turn slot only). How much of the old follows_child / channel_truth gap was
// the harness? Per arm: judge means (both judges), the child's "nothing on screen" lines (the regex latefacts.mjs uses),
// the turns whose screen still read "nothing drawn yet", how each board reached the child (rec turn.wire.via), and the
// per-card score deltas.
//   node evals/simlab/wireab.mjs <wire-run-dir> <nowire-run-dir>   → <wire-run-dir>/WIRE-AB.json + a summary on stdout
import { readFileSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";

// kept in step with latefacts.mjs NOTHING
const NOTHING = /(kuch|kuchh|koi)\s*(bhi\s*)?(nahi|nahin|nhi)\s*(dikh|aa\s*raha|hai\s*screen|screen)|screen\s*(pe|par|mein)\s*(kuch|kuchh)\s*(bhi\s*)?(nahi|nahin|nhi)|(nahi|nahin|nhi)\s*dikh(\s*rah[aie]|a\b|i\b|ai\b|aya|ayi|ayaa)|(drawing|picture|tasveer|photo|board)\s*(to|toh)?\s*(nahi|nahin|nhi)|(dikhaya|dikhayi|dikha)\s*(hi\s*)?(nahi|nahin|nhi)|कुछ\s*(भी\s*)?नहीं\s*(दिख|है)|नहीं\s*दिख|(nothing|can't see|cannot see|don't see|no picture|no drawing|where is the (picture|drawing|board))/i;
const KEYS = ["follows_child", "channel_truth", "safety_floor", "coherence", "adapts", "human"];
const [wireDir, offDir] = process.argv.slice(2);
if (!wireDir || !offDir) throw new Error("usage: wireab.mjs <wire-run-dir> <nowire-run-dir>");

function arm(dir) {
  const s = JSON.parse(readFileSync(join(dir, "scores.json"), "utf8"));
  const out = { run: s.meta.runId, n: s.lessons.length, grok: {}, kimi: {}, judged: { grok: 0, kimi: 0 }, nothingLines: [], nothingDrawnTurns: 0, via: {}, pointsEmpty: 0, perCard: {} };
  for (const k of KEYS) {
    const g = s.lessons.map((l) => l.judged?.scores?.[k]?.score).filter((x) => typeof x === "number");
    const m = s.lessons.map((l) => l.judged2?.scores?.[k]?.score).filter((x) => typeof x === "number");
    out.grok[k] = g.length ? +(g.reduce((a, b) => a + b, 0) / g.length).toFixed(2) : null;
    out.kimi[k] = m.length ? +(m.reduce((a, b) => a + b, 0) / m.length).toFixed(2) : null;
  }
  out.judged.grok = s.lessons.filter((l) => l.judged?.scores).length;
  out.judged.kimi = s.lessons.filter((l) => l.judged2?.scores).length;
  for (const l of s.lessons) {
    out.pointsEmpty += (l.auto?.points_empty_screen ?? []).length;
    out.perCard[l.persona] = Object.fromEntries(["follows_child", "channel_truth"].map((k) => [k, [l.judged?.scores?.[k]?.score ?? null, l.judged2?.scores?.[k]?.score ?? null]]));
  }
  for (const f of readdirSync(join(dir, "records")).filter((f) => f.endsWith(".json"))) {
    const r = JSON.parse(readFileSync(join(dir, "records", f), "utf8"));
    for (const t of r.turns ?? []) {
      if (/nothing drawn/.test(t.screen?.studio ?? "")) out.nothingDrawnTurns++;
      if (t.wire?.via) out.via[t.wire.via] = (out.via[t.wire.via] ?? 0) + 1;
      const said = String(t.child?.chipLabel ?? t.child?.say ?? "");
      if (t.n > 0 && NOTHING.test(said)) out.nothingLines.push({ persona: r.persona, turn: t.n, said: said.slice(0, 140) });
    }
  }
  return out;
}

const W = arm(wireDir), O = arm(offDir);
const deltas = Object.keys(W.perCard).filter((p) => O.perCard[p]).map((p) => ({ persona: p,
  follows_child: W.perCard[p].follows_child.map((x, i) => (x != null && O.perCard[p].follows_child[i] != null ? x - O.perCard[p].follows_child[i] : null)),
  channel_truth: W.perCard[p].channel_truth.map((x, i) => (x != null && O.perCard[p].channel_truth[i] != null ? x - O.perCard[p].channel_truth[i] : null)) }));
writeFileSync(join(wireDir, "WIRE-AB.json"), JSON.stringify({ wire: W, off: O, deltas }, null, 1));
for (const [name, a] of [["wire", W], ["off", O]]) {
  console.log(`${name} ${a.run}: n=${a.n} (judged grok ${a.judged.grok}, kimi ${a.judged.kimi})`);
  console.log(`  grok ${KEYS.map((k) => `${k} ${a.grok[k]}`).join(", ")}`);
  console.log(`  kimi ${KEYS.map((k) => `${k} ${a.kimi[k]}`).join(", ")}`);
  console.log(`  child "nothing on screen" lines ${a.nothingLines.length}; turns whose screen read "nothing drawn yet" ${a.nothingDrawnTurns}; auto points_empty_screen ${a.pointsEmpty}; board via ${JSON.stringify(a.via)}`);
}
const moved = deltas.filter((d) => d.follows_child.some((x) => x) || d.channel_truth.some((x) => x));
console.log(`per-card (wire − off; [grok, kimi]): ${moved.map((d) => `${d.persona.slice(0, 3)} fc${JSON.stringify(d.follows_child)} ct${JSON.stringify(d.channel_truth)}`).join("; ")}`);
