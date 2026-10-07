// duplex-real: score the shadow → live switch criteria (docs/design/round2/duplex-real/CRITERIA.md) from result files.
//   node evals/duplex-real/criteria.mjs [--e1 results/eot-MAI-after.json] [--e1d4 results/eot-D4-after.json]
//        [--e2 results/ami-raw-D4-after-real.json] [--shadow shadow-report.json] [--json out.json]
// Every row says what it measured, on what (n), and PASS / FAIL / NO DATA. Nothing here is a child result unless the
// shadow file comes from child lessons; adult real-speech rows are labelled ADULT.
import fs from "node:fs";
import path from "node:path";

const HERE = path.dirname(new URL(import.meta.url).pathname);
const read = (f) => { if (!f) return null; const p = path.isAbsolute(f) ? f : path.join(HERE, f); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : null; };

/** The criteria (CRITERIA.md §2-§3). `get` returns { value, n, pass } or null (no data). */
export function criteria({ e1, e1d4, e2, shadow }) {
  const rows = [];
  const add = (id, stage, what, bar, r, src) => rows.push({ id, stage, what, bar, src, ...(r ?? { value: null, n: 0, pass: null }) });
  // ── R: real adult speech through the real STT (this stream) ──
  if (e1) {
    const c = e1.pauseCutoff_500, s9 = e1.silence900_500;
    add("R1", "R", "thinking-pause cut-offs, holds >= 500 ms (ADULT Hindi, India lane)", "<= 3 % and <= silence-900 on the same holds", { value: c.rate, n: c.n, ci95: c.ci95, pass: c.rate <= 0.03 && c.rate <= s9.rate }, e1.id);
    const g = e1.decisionGap;
    add("R2", "R", "decision gap p50 after the annotated turn end (ADULT Hindi, India lane, measured from the US sandbox)", "<= 350 ms (measured from India; a US number is an upper bound)", { value: g.p50, n: g.decided, missed: g.missed, pass: g.p50 !== null && g.p50 <= 350 }, e1.id);
    add("R2b", "R", "turns with no decision within 5 s", "<= 2 %", { value: g.n ? g.missed / g.n : null, n: g.n, pass: g.n ? g.missed / g.n <= 0.02 : null }, e1.id);
    add("R1b", "R", "commits while the speaker is still voicing (in-speech)", "<= 1 % of turns", { value: e1.turns ? e1.inSpeechCommits / e1.turns : null, n: e1.turns, pass: e1.turns ? e1.inSpeechCommits / e1.turns <= 0.01 : null }, e1.id);
  }
  if (e1d4) {
    const c = e1d4.pauseCutoff_500;
    add("R1-D4", "R", "thinking-pause cut-offs on the eastus2 fallback lane (D4)", "<= 3 %", { value: c.rate, n: c.n, ci95: c.ci95, pass: c.rate <= 0.03 }, e1d4.id);
  }
  if (e2) {
    const k = e2.continuer_keepTalking;
    add("R3", "R", "keeps talking through continuers (ADULT English AMI, real STT)", ">= 90 %", { value: k.rate, n: k.n, ci95: k.ci95, pass: k.rate >= 0.9 }, e2.id);
    const b = e2.bargeIn_stop;
    add("R4", "R", "barge-in: her audio stops (hush or yield), p50 among real barge-ins", "p50 <= 200 ms and stopped in >= 90 %", { value: b.p50, n: b.n, stopped: b.stopped, pass: b.p50 !== null && b.p50 <= 200 && b.stopped / Math.max(1, b.n) >= 0.9 }, e2.id);
    const rt = e2.roomTalk_falseYield;
    add("R5", "R", "false yields to other adults in the room (proxy for TV / sibling; not a child sibling)", "<= 10 %", { value: rt.rate, n: rt.n, ci95: rt.ci95, pass: rt.rate <= 0.1 }, e2.id);
    const ec = e2.echo_selfYield;
    add("R6", "R", "self-yields on her own bleed (headset bleed, not a speakerphone)", "<= 2 %", { value: ec.rate, n: ec.n, ci95: ec.ci95, pass: ec.rate <= 0.02 }, e2.id);
  }
  // ── S: prod shadow telemetry (real lessons) ──
  if (shadow) {
    add("S0", "S", "shadow volume", ">= 300 child turns over >= 30 lessons", { value: shadow.turns, n: shadow.lessons, pass: shadow.turns >= 300 && shadow.lessons >= 30 }, "shadow");
    const ec = shadow.engine_cutoff;
    add("S1", "S", "engine would cut the child off (shadow, real lessons)", "<= 3 % (Wilson upper <= 5 %) and <= the shipped path's own rate", { value: ec.rate, n: ec.n, ci95: ec.ci95, pass: ec.n > 0 && ec.rate <= 0.03 && ec.ci95[1] <= 0.05 && ec.rate <= (shadow.shipped_cutoff.rate ?? 1) }, "shadow");
    const ud = shadow.engine_undecided;
    add("S2", "S", "turns the engine never decided before the shipped final", "<= 8 %", { value: ud.rate, n: ud.n, pass: ud.n > 0 && ud.rate <= 0.08 }, "shadow");
    add("S3", "S", "safety: the engine's safety acts vs the server's safeguards (joined per lesson hash, reviewed by hand)", "0 unexplained disagreements", { value: shadow.engine_safety_rows, n: shadow.lessons, pass: null }, "shadow");
  }
  return rows;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const argv = process.argv.slice(2);
  const opt = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };
  const rows = criteria({ e1: read(opt("--e1", "results/eot-MAI-after.json")), e1d4: read(opt("--e1d4", "results/eot-D4-after.json")), e2: read(opt("--e2", null)), shadow: read(opt("--shadow", null)) });
  for (const r of rows) console.log(`${r.pass === null ? "NO VERDICT" : r.pass ? "PASS" : "FAIL"}  ${r.id.padEnd(6)} ${r.what}: ${r.value === null ? "no data" : typeof r.value === "number" && r.value < 1 && r.value > 0 && !/gap|p50/.test(r.what) ? `${(100 * r.value).toFixed(1)} %` : r.value} (n ${r.n}${r.ci95 ? `, 95% CI ${r.ci95.map((x) => (100 * x).toFixed(1)).join("-")} %` : ""}) — bar ${r.bar} [${r.src}]`);
  if (opt("--json", null)) fs.writeFileSync(opt("--json"), JSON.stringify(rows, null, 1));
}
