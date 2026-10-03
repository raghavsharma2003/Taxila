// Reduced re-run of the G1 notation probe with arm R = the WRITTEN item rendered by server/voice/spoken.js
// toSpoken() (the shipped renderer), spoken by gpt-4o-mini-tts on Azure. Everything else is the probe's own:
// voice marin, the probe's TTS_NOTE per mode, both ASR passes (A: language forced + script prompt; B: no hint),
// and the probe's judge (taxila-brain) with the SAME system prompt and mode rules, read from scored.json.
// Baselines = the probe's own TTS W (written) and TTS P (hand-authored spoken) rows on the same items.
// Run: set -a; . /home/user/Taxila/.env.local; set +a; NODE_USE_ENV_PROXY=1 node rerun-tospoken.mjs
// Never prints the key.
import fs from "fs";
import { ITEMS } from "./items.mjs";
import { toSpoken, RENDERER_VERSION } from "../../../../server/voice/spoken.js";

const KEY = process.env.AZURE_OPENAI_API_KEY;
const OAI = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
const BASE = OAI.replace(/\/openai\/v1$/, "");
const TR = process.env.DEPLOY_TRANSCRIBE || "taxila-transcribe";
const BRAIN = process.env.DEPLOY_BRAIN || "taxila-brain";
const DIR = new URL("./rerun-tospoken/", import.meta.url);
const CLIPS = new URL("./clips/", DIR);
fs.mkdirSync(CLIPS, { recursive: true });
const OUT = new URL("./raw.json", DIR);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const probeScored = JSON.parse(fs.readFileSync(new URL("./scored.json", import.meta.url), "utf8"));

// The worst classes in the probe (large numbers, currency, exponents, roots, negatives, units) plus a spread.
const IDS = ["L1", "L2", "L3", "L4", "L5", "C1", "C2", "D5", "E1", "E2", "E3", "E4", "R1", "R2", "N1", "N2", "N3",
  "U1", "U3", "U7", "F1", "F3", "D3", "D4", "P1", "P3", "TM1", "H1", "S1", "S2"];
const CELL = {
  en: { mode: "english", schoolMedium: "english", ageBand: "10-15" },
  hl: { mode: "hinglish", schoolMedium: "english", ageBand: "10-15" },
  hi: { mode: "hindi", schoolMedium: "hindi", ageBand: "10-15" },
  // helplines only, in the two cells the probe did not run
  hlh: { mode: "hinglish", schoolMedium: "hindi", ageBand: "10-15" },
  hie: { mode: "hindi", schoolMedium: "english", ageBand: "10-15" },
};
const WRITTEN_FROM = { en: "en", hl: "hl", hi: "hi", hlh: "hl", hie: "hi" };
const RULE_FROM = { en: "en", hl: "hl", hi: "hi", hlh: "hi", hie: "hl" };
const ASR_LANG = { en: "en", hl: "hi", hi: "hi", hlh: "hi", hie: "hi" };
const TTS_NOTE = {
  en: "A warm Indian school teacher speaking clear Indian English to a child.",
  hl: "A warm Indian school teacher speaking natural Hinglish to a child, Hindi frame with English school words.",
  hi: "A warm Indian school teacher speaking clear Hindi to a child.",
};
const ASR_PROMPT = { en: "Verbatim transcript. Write every number, symbol and unit as the spoken words, never as digits or symbols.",
  hl: "Verbatim transcript in Latin script. Write every number, symbol and unit as the spoken words, never as digits or symbols.",
  hi: "Verbatim transcript in Devanagari. Write every number, symbol and unit as the spoken words, never as digits or symbols." };
const ASR2_PROMPT = "Verbatim transcript. Write each word in the language it was spoken in; write every number, symbol and unit as the spoken words, never as digits or symbols.";

const wav = (pcm) => { const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40); return Buffer.concat([h, pcm]); };

async function tts(text, noteMode) {
  for (let a = 1; a <= 5; a++) {
    let r;
    try {
      r = await fetch(`${OAI}/audio/speech`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, signal: AbortSignal.timeout(60_000),
        body: JSON.stringify({ model: process.env.DEPLOY_TTS || "gpt-4o-mini-tts", voice: "marin", input: text, instructions: TTS_NOTE[noteMode], response_format: "pcm" }) });
    } catch { await sleep(3000 * a); continue; }
    if (r.status === 429 || r.status >= 500) { await sleep(5000 * a); continue; }
    if (!r.ok) throw new Error(`tts HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
    return Buffer.from(await r.arrayBuffer());
  }
  throw new Error("tts retries exhausted");
}
async function asr(buf, { language, prompt }) {
  for (let a = 1; a <= 5; a++) {
    const fd = new FormData();
    fd.append("file", new Blob([buf], { type: "audio/wav" }), "a.wav");
    if (language) fd.append("language", language);
    fd.append("prompt", prompt);
    let r;
    try { r = await fetch(`${BASE}/openai/deployments/${TR}/audio/transcriptions?api-version=2025-03-01-preview`, { method: "POST", headers: { "api-key": KEY }, body: fd, signal: AbortSignal.timeout(90_000) }); }
    catch { await sleep(3000 * a); continue; }
    if (r.status === 429 || r.status >= 500) { await sleep(4000 * a); continue; }
    if (!r.ok) return `ERR HTTP ${r.status}`;
    return (await r.json()).text || "";
  }
  return "ERR retries";
}
async function judge(r, it) {
  const user = `ITEM ${r.id} (${r.cls}) intended value: ${it.value}${it.digitExact ? ` [HELPLINE, must be digit-exact ${it.digitExact}]` : ""}
MODE: ${probeScored.mode_rule[RULE_FROM[r.cell]]}
ENGINE: text-to-speech (read the given text)
GIVEN TEXT: ${r.input}
ENGINE TRANSCRIPT: (none: TTS)
HEARD-A: ${r.asr}
HEARD-B: ${r.asr2}`;
  for (let a = 1; a <= 5; a++) {
    let res;
    try { res = await fetch(`${OAI}/chat/completions`, { method: "POST", headers: { "api-key": KEY, "Content-Type": "application/json" }, signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({ model: BRAIN, messages: [{ role: "system", content: probeScored.sys }, { role: "user", content: user }], response_format: { type: "json_object" } }) }); }
    catch { await sleep(3000 * a); continue; }
    if (res.status === 429 || res.status >= 500) { await sleep(4000 * a); continue; }
    if (!res.ok) return { err: `HTTP ${res.status}` };
    try { return JSON.parse((await res.json()).choices[0].message.content); } catch { return { err: "parse" }; }
  }
  return { err: "retries" };
}

const byId = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")).rows : [];
const done = new Map(prev.filter((r) => r.score && !r.score.err && !r.err).map((r) => [`${r.cell}|${r.id}`, r]));
const jobs = [];
for (const id of IDS) for (const cell of ["en", "hl", "hi"]) jobs.push({ id, cell });
for (const id of ["S1", "S2"]) for (const cell of ["hlh", "hie"]) jobs.push({ id, cell });
const rows = [];
let k = 0;
async function worker() {
  while (k < jobs.length) {
    const j = jobs[k++];
    const key = `${j.cell}|${j.id}`;
    if (done.has(key)) { rows.push(done.get(key)); continue; }
    const it = byId[j.id];
    const written = it.w[WRITTEN_FROM[j.cell]];
    const row = { cell: j.cell, id: j.id, cls: it.cls, written, input: toSpoken(written, CELL[j.cell]), renderer: RENDERER_VERSION };
    try {
      const pcm = await tts(row.input, RULE_FROM[j.cell]);
      row.audio_s = +(pcm.length / 48000).toFixed(2);
      const buf = wav(pcm);
      const f = `tts-R-${j.cell}-${j.id}.wav`;
      fs.writeFileSync(new URL(f, CLIPS), buf);
      row.clip = `rerun-tospoken/clips/${f}`;
      row.asr = await asr(buf, { language: ASR_LANG[j.cell], prompt: ASR_PROMPT[RULE_FROM[j.cell]] });
      row.asr2 = await asr(buf, { prompt: ASR2_PROMPT });
      row.score = await judge(row, it);
    } catch (e) { row.err = String(e.message || e); }
    rows.push(row);
    console.log(`${row.cell.padEnd(3)} ${row.id.padEnd(4)} ${row.err ? "ERR " + row.err : `${row.audio_s}s | ${row.input.slice(0, 60)} || A=${String(row.asr).slice(0, 50)}`}`);
    fs.writeFileSync(OUT, JSON.stringify({ date: "2026-10-02", renderer: RENDERER_VERSION, tts: "gpt-4o-mini-tts marin", asr: TR, judge: BRAIN, rows }, null, 1));
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
fs.writeFileSync(OUT, JSON.stringify({ date: "2026-10-02", renderer: RENDERER_VERSION, tts: "gpt-4o-mini-tts marin", asr: TR, judge: BRAIN, rows }, null, 1));

// ── tables: R against the probe's own TTS W and TTS P rows on the same items ──
const ok = rows.filter((r) => r.score && !r.score.err);
const base = probeScored.rows.filter((r) => r.engine === "tts" && IDS.includes(r.id) && r.score && !r.score.err);
const pct = (a, n) => (n ? `${a}/${n} (${Math.round((100 * a) / n)}%)` : "-");
const line = (lab, set) => {
  const n = set.length, f = (p) => set.filter(p).length;
  return `| ${lab} | ${n} | ${pct(f((r) => r.score.render_error), n)} | ${pct(f((r) => r.score.render_error && !r.score.asr_suspect), n)} | ${pct(f((r) => r.score.mixed_convention), n)} | ${pct(f((r) => r.score.mixed_convention && !r.score.asr_suspect), n)} | ${pct(f((r) => r.score.number_misread), n)} | ${pct(f((r) => r.score.number_misread && !r.score.asr_suspect), n)} | ${pct(f((r) => r.score.render_error || r.score.mixed_convention || r.score.number_misread), n)} |`;
};
const out = [`renderer ${RENDERER_VERSION}; ${ok.length} scored clips (${rows.filter((r) => r.err).length} engine errors); items: ${IDS.join(" ")}`, "",
  "| arm (gpt-4o-mini-tts) | n | rendering error | (excl. asr-suspect) | mixed convention | (excl.) | number misread | (excl.) | any flag |", "|---|---|---|---|---|---|---|---|---|"];
const three = (r) => ["en", "hl", "hi"].includes(r.cell);
out.push(line("probe W (written)", base.filter((r) => r.arm === "W")));
out.push(line("probe P (hand-authored spoken)", base.filter((r) => r.arm === "P")));
out.push(line("R (toSpoken)", ok.filter(three)));
for (const m of ["en", "hl", "hi"]) {
  out.push(line(`probe W ${m}`, base.filter((r) => r.arm === "W" && r.mode === m)));
  out.push(line(`probe P ${m}`, base.filter((r) => r.arm === "P" && r.mode === m)));
  out.push(line(`R ${m}`, ok.filter((r) => r.cell === m)));
}
out.push("", "| class | probe W err/mix/mis | probe P | R |", "|---|---|---|---|");
for (const c of [...new Set(IDS.map((i) => byId[i].cls.split("-")[0]))]) {
  const cell = (set) => { const s = set.filter((r) => r.cls.split("-")[0] === c); return `${s.filter((r) => r.score.render_error).length}/${s.filter((r) => r.score.mixed_convention).length}/${s.filter((r) => r.score.number_misread).length} of ${s.length}`; };
  out.push(`| ${c} | ${cell(base.filter((r) => r.arm === "W"))} | ${cell(base.filter((r) => r.arm === "P"))} | ${cell(ok.filter(three))} |`);
}
out.push("", "helpline digit-exact (judge; hand-check A/B below):");
for (const r of ok.filter((x) => x.cls === "helpline")) out.push(`- R ${r.cell} ${r.id}: ${r.score.digit_exact} :: A=${r.asr} :: B=${r.asr2}`);
out.push("", "flagged rows:");
for (const r of ok.filter((x) => x.score.render_error || x.score.mixed_convention || x.score.number_misread)) out.push(`- ${r.cell} ${r.id}: ${r.score.render_error ? "R" : ""}${r.score.mixed_convention ? "M" : ""}${r.score.number_misread ? "N" : ""}${r.score.asr_suspect ? " (asr-suspect)" : ""} :: in=${r.input} :: A=${r.asr} :: B=${r.asr2} :: ${r.score.note}`);
fs.writeFileSync(new URL("./tables.md", DIR), out.join("\n"));
console.log(out.join("\n"));
