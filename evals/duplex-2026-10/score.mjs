// duplex bake-off 2026-10: score every arm × variant on one gold timeline per scenario (assemble.mjs gold; the realtime
// arms are re-anchored to HER ACTUAL playback, arms-rt.mjs `childAt` / `her`).
//   echo false barge-in   a yield while ONLY her voice (and its echo) is in the mic: her line before the child's onset, or
//                         all of it when the child answers after her (F1/F2/F5) or never speaks (F12)
//   true barge-in (F7)    a yield within 1,500 ms of the child's onset over her; latency from the onset
//   continuer (F8)        a yield within 1,500 ms of the child's "hmm"/"haan" over her = a false yield
//   end of turn (F1/F2/F5) decision (our cascade: commit; duplex: commit; realtime: response.created) minus the child's
//                         true end: p50/p90; a decision inside a gold THINKING pause = a cut-off; none within 6 s = missed
//   first audio           realtime arms: the reply's first audio delta minus the child's true end
//   transcript            what the turn-taker hands on (cascade / Voice Live front end: the final transcript; duplex: the
//                         committed turn text; realtime: the input transcript). Hinglish skeleton CER: both sides romanised (a Devanagari → Latin map), vowels dropped, similar
//                         consonants merged, so "छप्पन" and "Chappan" compare equal. Approximate; relative between arms only
//   tokens                realtime arms: response usage summed per session (cost per child-hour in BAKEOFF.md)
//   node evals/duplex-2026-10/score.mjs --bake <dir> [--out file.json]
import fs from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : d; };
const BAKE = arg("--bake"), OUT = arg("--out", null);
const q = (a, p) => { if (!a.length) return null; const z = [...a].sort((x, y) => x - y); return Math.round(z[Math.min(z.length - 1, Math.floor((z.length - 1) * p))]); };
const THINK = new Set(["filler", "hesitation", "hold_request", "word_search", "repair_open", "mid_explanation", "drift_pause"]); // TaxilaFDB: word_search_long / hold_long allow a listed CUT_IN, never a cut-off

// ── a crude Devanagari → Latin consonant skeleton (shared by both sides) ──
const DEV = { "क": "k", "ख": "k", "ग": "g", "घ": "g", "ङ": "n", "च": "c", "छ": "c", "ज": "j", "झ": "j", "ञ": "n", "ट": "t", "ठ": "t", "ड": "d", "ढ": "d", "ण": "n", "त": "t", "थ": "t", "द": "d", "ध": "d", "न": "n", "प": "p", "फ": "f", "ब": "b", "भ": "b", "म": "m", "य": "y", "र": "r", "ल": "l", "व": "v", "श": "s", "ष": "s", "स": "s", "ह": "h", "ड़": "r", "ढ़": "r", "क़": "k", "ख़": "k", "ग़": "g", "ज़": "j", "फ़": "f", "ं": "n", "ँ": "n" };
export function skeleton(s) {
  let t = String(s ?? "").toLowerCase().normalize("NFC");
  t = [...t].map((ch) => DEV[ch] ?? ch).join("");
  t = t.replace(/ph/g, "f").replace(/ch/g, "c").replace(/sh/g, "s").replace(/[kg]h/g, (m) => m[0]).replace(/[tdbj]h/g, (m) => m[0]).replace(/w/g, "v").replace(/z/g, "j").replace(/q/g, "k").replace(/x/g, "ks");
  t = t.replace(/[^a-z\s]/g, " ").replace(/[aeiou]/g, "").replace(/(.)\1+/g, "$1");
  return t.replace(/\s+/g, " ").trim();
}
function cer(ref, hyp) {
  const a = skeleton(ref).replace(/ /g, ""), b = skeleton(hyp).replace(/ /g, "");
  if (!a.length) return null;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return Math.min(1, d[a.length][b.length] / a.length);
}

/** One run → { yields[], decisions[], transcripts[], firstAudio[], herSpan, shift, usage } on the run's own clock. */
function normalise(run, meta) {
  const g = meta.gold;
  if (run.arm === "cascade" || run.arm.startsWith("voicelive-ref")) {
    const ev = run.events;
    return {
      shift: 0, herSpan: [g.herSpan.start, g.herSpan.end],
      yields: ev.filter((e) => e.type.endsWith("speech_started")).map((e) => e.t),
      decisions: ev.filter((e) => e.type.endsWith("buffer.committed")).map((e) => e.t),
      transcripts: ev.filter((e) => e.type.endsWith("transcription.completed")).map((e) => ({ t: e.t, text: e.text ?? "" })),
      firstAudio: [], usage: null,
    };
  }
  if (run.arm === "duplex" || run.arm.startsWith("d5")) {
    return {
      shift: 0, herSpan: [g.herSpan.start, g.herSpan.end],
      yields: run.acts.filter((a) => a[1] === "pause" || a[1] === "stop").map((a) => a[0]),
      // her voice effectively off: the hush (gain ≤ 0.05, −26 dB) or a pause / stop; and the first duck of any depth
      silenced: run.acts.filter((a) => a[1] === "pause" || a[1] === "stop" || (a[1] === "duck" && a[2] <= 0.05)).map((a) => a[0]),
      ducks: run.acts.filter((a) => a[1] === "duck" && a[2] < 1).map((a) => a[0]),
      decisions: run.acts.filter((a) => a[1] === "commit").map((a) => a[0]),
      // what the Director receives: the engine's committed turn text (it strips her own echoed words), not the raw ASR
      // (a repeat of the same words is the open-loop harness re-committing when no reply of hers follows: counted once)
      // D5: the ear's own finals (what Voice Live heard, the same basis as the speech-to-speech arms; a stop request is a
      // yield, never a committed turn, so committed text would under-count what was heard)
      transcripts: run.arm.startsWith("d5")
        ? (run.stt ?? []).filter((e) => /transcription\.completed$/.test(e.type ?? "")).map((e) => ({ t: e.t, text: e.text ?? "" }))
        : run.acts.filter((a) => a[1] === "commit").map((a) => ({ t: a[0], text: a[2] ?? "" })).filter((x, i, all) => !all.slice(0, i).some((y) => y.text === x.text)),
      firstAudio: [], usage: null,
    };
  }
  // realtime arms: the child track's ms 0 sits at session ms `childAt`; her span is her actual playback
  const ev = run.events;
  const herEnd = run.her.stoppedAt ?? run.her.endAt;
  const usage = ev.filter((e) => e.type === "response.done" && e.usage).reduce((u, e) => {
    const d = e.usage, i = d.input_token_details ?? {}, o = d.output_token_details ?? {};
    u.inText += i.text_tokens ?? 0; u.inAudio += i.audio_tokens ?? 0; u.outText += o.text_tokens ?? 0; u.outAudio += o.audio_tokens ?? 0; u.cached += i.cached_tokens ?? 0;
    return u;
  }, { inText: 0, inAudio: 0, outText: 0, outAudio: 0, cached: 0 });
  return {
    shift: run.childAt ?? 0, herSpan: [run.her.startAt ?? 0, herEnd ?? run.her.startAt ?? 0],
    yields: ev.filter((e) => e.type === "speech_started").map((e) => e.t),
    decisions: ev.filter((e) => e.type === "response.created" && e.resp >= 1).map((e) => e.t),
    transcripts: ev.filter((e) => e.type === "transcript").map((e) => ({ t: e.t, text: e.text ?? "" })),
    firstAudio: ev.filter((e) => e.type === "reply.first_audio").map((e) => e.t),
    usage, herCut: run.her.stoppedAt !== null && run.her.stoppedAt < (run.her.endAt ?? Infinity),
  };
}

function scoreOne(run, meta) {
  const n = normalise(run, meta), g = meta.gold, sh = n.shift;
  const fam = meta.family;
  const onset = g.childOnset !== null && g.childOnset !== undefined ? g.childOnset + sh : null;
  const trueEnd = g.trueEnd !== undefined && g.trueEnd !== null ? g.trueEnd + sh : null;
  const after = meta.child?.start?.mode === "after_her";
  const r = { id: meta.id, family: fam, sub: meta.sub };
  // echo-only window: her playback while no child voice
  const echoEnd = !meta.child ? n.herSpan[1] + 300 : after ? Math.min(n.herSpan[1] + 300, onset ?? Infinity) : (onset ?? n.herSpan[1]);
  r.echoFalseYield = n.yields.some((t) => t >= n.herSpan[0] + 100 && t < echoEnd);
  if (fam === "F7" && onset !== null) {
    const y = n.yields.find((t) => t >= onset - 50 && t <= onset + 1500); r.bargeOk = y !== undefined; r.bargeMs = y !== undefined ? Math.max(0, Math.round(y - onset)) : null;
    // speech-to-speech arms stop playback at speech_started: their silencing IS the yield
    const sl = (n.silenced ?? n.yields).find((t) => t >= onset - 50 && t <= onset + 1500); r.silencedMs = sl !== undefined ? Math.max(0, Math.round(sl - onset)) : null;
    const dk = (n.ducks ?? n.yields).find((t) => t >= onset - 50 && t <= onset + 1500); r.duckMs = dk !== undefined ? Math.max(0, Math.round(dk - onset)) : null;
  }
  if (fam === "F8" && onset !== null) r.contFalseYield = n.yields.some((t) => t >= onset - 50 && t <= onset + 1500);
  if (after && trueEnd !== null) {
    const pauses = (g.pauses ?? []).map((p) => ({ start: p.start + sh, end: p.end + sh, cls: p.cls ?? p.kind ?? p.class }));
    r.cut = n.decisions.some((t) => pauses.some((p) => THINK.has(p.cls) && t > p.start + 100 && t < p.end));
    const d = n.decisions.find((t) => t >= trueEnd - 200 && t <= trueEnd + 6000);
    r.eotMs = d !== undefined ? Math.round(d - trueEnd) : null;
    const fa = n.firstAudio.find((t) => t >= trueEnd - 200);
    r.firstAudioMs = fa !== undefined ? Math.round(fa - trueEnd) : null;
  }
  if (meta.child && onset !== null) {
    const hyp = n.transcripts.filter((x) => x.t >= onset - 200).map((x) => x.text).join(" ");
    r.cer = cer(meta.child.text, hyp);
    // a LONE word (हाँ, रुको, छप्पन; continuers are F8's): transcribed = its words reached the turn-taker; noticed = it was
    // transcribed, or acted on (a yield for a stop request, a turn — an empty one is the Director's re-ask)
    if (fam !== "F8" && meta.child.text.trim().split(/\s+/).length === 1) {
      r.lone = { transcribed: r.cer !== null && r.cer <= 0.5, noticed: (r.cer !== null && r.cer <= 0.5) || n.yields.some((t) => t >= onset - 50) || n.decisions.some((t) => t >= onset) };
    }
    r.hyp = hyp.slice(0, 120); r.ref = meta.child.text.slice(0, 120);
  }
  r.usage = n.usage; r.herCut = n.herCut ?? null;
  return r;
}

const runsDir = path.join(BAKE, "runs");
const metas = new Map();
const groups = new Map();
for (const f of fs.readdirSync(runsDir).filter((x) => x.endsWith(".json"))) {
  const run = JSON.parse(fs.readFileSync(path.join(runsDir, f), "utf8"));
  if (!metas.has(run.id)) metas.set(run.id, JSON.parse(fs.readFileSync(path.join(BAKE, `${run.id}.json`), "utf8")));
  const key = `${run.arm}/${run.variant}`;
  (groups.get(key) ?? groups.set(key, []).get(key)).push(scoreOne(run, metas.get(run.id)));
}
const pct = (k, n) => (n ? `${k}/${n} = ${((100 * k) / n).toFixed(0)} %` : "-");
const out = {};
for (const [key, rows] of [...groups.entries()].sort()) {
  const eot = rows.filter((r) => r.eotMs !== undefined);
  const fa = rows.map((r) => r.firstAudioMs).filter((x) => x !== null && x !== undefined);
  const cers = rows.map((r) => r.cer).filter((x) => x !== null && x !== undefined);
  const f7 = rows.filter((r) => r.family === "F7"), f8 = rows.filter((r) => r.family === "F8");
  const u = rows.reduce((a, r) => { if (r.usage) for (const k of Object.keys(r.usage)) a[k] = (a[k] ?? 0) + r.usage[k]; return a; }, {});
  out[key] = {
    n: rows.length,
    echoFalseBargeIn: pct(rows.filter((r) => r.echoFalseYield).length, rows.length),
    trueBargeIn: pct(f7.filter((r) => r.bargeOk).length, f7.length), bargeP50Ms: q(f7.map((r) => r.bargeMs).filter((x) => x !== null), 0.5),
    continuerFalseYield: pct(f8.filter((r) => r.contFalseYield).length, f8.length),
    bargeSilenced: { within1500: pct(f7.filter((r) => r.silencedMs !== null && r.silencedMs !== undefined).length, f7.length), within300: pct(f7.filter((r) => r.silencedMs !== null && r.silencedMs !== undefined && r.silencedMs <= 300).length, f7.length),
      p50: q(f7.map((r) => r.silencedMs).filter((x) => x !== null && x !== undefined), 0.5), duckP50: q(f7.map((r) => r.duckMs).filter((x) => x !== null && x !== undefined), 0.5) },
    loneWords: (() => { const l = rows.filter((r) => r.lone); return { n: l.length, transcribed: pct(l.filter((r) => r.lone.transcribed).length, l.length), noticed: pct(l.filter((r) => r.lone.noticed).length, l.length) }; })(),
    eot: { n: eot.length, p50: q(eot.map((r) => r.eotMs).filter((x) => x !== null), 0.5), p90: q(eot.map((r) => r.eotMs).filter((x) => x !== null), 0.9), missed: pct(eot.filter((r) => r.eotMs === null).length, eot.length), cutoffs: pct(eot.filter((r) => r.cut).length, eot.length) },
    firstAudio: { n: fa.length, p50: q(fa, 0.5), p90: q(fa, 0.9) },
    skeletonCER: { n: cers.length, mean: cers.length ? +(cers.reduce((a, b) => a + b, 0) / cers.length).toFixed(3) : null, p50: cers.length ? +[...cers].sort((a, b) => a - b)[Math.floor(cers.length / 2)].toFixed(3) : null },
    tokens: Object.keys(u).length ? u : null,
  };
}
console.log(JSON.stringify(out, null, 1));
if (OUT) fs.writeFileSync(OUT, JSON.stringify({ date: new Date().toISOString(), summary: out, rows: Object.fromEntries(groups) }, null, 1));
