// render.mjs — round-3 candidate renders for the five situations (2026-10-04).
// Arms (one line per situation; line choice and take rule are fixed in RULES below, before any screen or listen):
//   A  dhd-diya anchor     the exact round-2 Diya clip (copied by build.py, not rendered here)
//   B  dhd-diya text       v4 spoken-register line, plain SSML (Devanagari runs in <lang hi-IN>, no prosody) = lines.mjs plainDragonHD
//   C  dhd-diya plan       same line + its per-clause DeliveryPlan compiled to DragonHD SSML  = lines.mjs compileDragonHD (langWrap "runs")
//   D  nova-kiara plan     Nova 2 Sonic kiara, reader rule + band + the scene + the clause plan as prose = lines.mjs compileNova
// K = 3 takes per arm-line, rendered in order t1..t3; build.py picks the take by the pre-registered rule.
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 SDK_FROM=<dir containing node_modules/@aws-sdk>/ \
//        node docs/research/voice/v4/renders/render.mjs [idRegex]
// Never prints a key. Re-runs skip takes already on disk.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LINES, SCENES, textOf, validate, compileDragonHD, plainDragonHD, compileNova } from "../lines.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const RULES = {
  lines: "variant A of each v4 line (TALKING-RULES section 6 uses A as the primary), except L3-surprise, where A keeps 'बहुत लोग गलत करते हैं' (a comparison with other children, forbidden by Arjun's sheet and the safety floor), so the primary is L3 B; L3 A is rendered as a reserve so the owner can still pick it",
  takes: 3,
  take_rule: "per arm-line, the first take in render order (t1, t2, t3) that passes every clip gate: (1) no reference word missed by BOTH STTs (gpt-transcribe and Azure hi-IN), 'burp' excepted as known STT noise; (2) no number word missed by both STTs and none inserted by both; (3) longest internal silence <= 1.5 s; (4) no mid-phrase pause >= 0.3 s (a pause after a word with no punctuation, placed by CTC forced alignment). If no take passes, take 1, flagged in the manifest. Arm A has one clip (the round-2 file). Written 2026-10-04 before any render of this set was screened or heard.",
  stt_equivalences_added_before_screening: { "पच्चास": "पचास", "ट्रिकी": "tricky", "सेकंड/सेकेंड": "second" },
};
const PICK = [["L1-think", "A", "primary"], ["L2-laugh", "A", "primary"], ["L3-surprise", "B", "primary"], ["L3-surprise", "A", "reserve"],
  ["L4-correct", "A", "primary"], ["L5-wonder", "A", "primary"]];
const KEY = process.env.AZURE_OPENAI_API_KEY;
const FILTER = process.argv[2] ? new RegExp(process.argv[2]) : null;
const MF = path.join(HERE, "renders.json");
const man = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, "utf8")) : { v: "taxila-voice-r3-renders/1", date: "2026-10-04", rules: RULES, renders: [] };
const put = (e) => { man.renders = man.renders.filter((r) => r.id !== e.id); man.renders.push(e); fs.writeFileSync(MF, JSON.stringify(man, null, 1)); };
const VOICE = "en-IN-Diya:DragonHDLatestNeural";

async function azure(ssml) {
  for (let a = 0; a < 4; a++) {
    const t0 = performance.now();
    const r = await fetch("https://eastus2.tts.speech.microsoft.com/cognitiveservices/v1", { method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-v4-r3" }, body: ssml });
    if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), ttfb_ms: Math.round(performance.now() - t0) };
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * (a + 1))); continue; }
    return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` };
  }
  return { err: "retries" };
}

let nova = null;
let chars = 0;
for (const [lineId, v, role] of PICK) {
  const l = LINES.find((x) => x.id === lineId && x.v === v);
  const errs = validate(l); if (errs.length) throw new Error(`${lineId}${v} plan invalid: ${errs.join("; ")}`);
  const scene = SCENES[lineId].scene, text = textOf(l);
  const arms = {
    B: { arm: "dhd-diya-text", run: async () => { const ssml = plainDragonHD(l, { voice: VOICE }); return { ...(await azure(ssml)), ssml }; } },
    C: { arm: "dhd-diya-plan", run: async () => { const ssml = compileDragonHD(l, { voice: VOICE }); return { ...(await azure(ssml)), ssml }; } },
    D: { arm: "nova-kiara-plan", run: async () => { nova ??= await import("../probe/nova.mjs"); const p = compileNova(l, scene); const r = await nova.sonic("kiara", p.system, p.text); return { ...r, buf: r.buf, ttfb_ms: r.ttfb, system: p.system }; } },
  };
  for (const [k, a] of Object.entries(arms)) {
    for (let t = 1; t <= RULES.takes; t++) {
      const id = `${k}__${a.arm}__${lineId}${v}__t${t}`;
      if (FILTER && !FILTER.test(id)) continue;
      const f = path.join(HERE, "wav-takes", `${id}.wav`);
      if (fs.existsSync(f)) continue;
      fs.mkdirSync(path.dirname(f), { recursive: true });
      let r = await a.run(); if (!r.buf && k === "D") r = await a.run();
      if (!r.buf) { console.log(id, "ERR", r.err); put({ id, arm: k, engine_arm: a.arm, line: lineId, v, role, take: t, error: r.err }); continue; }
      fs.writeFileSync(f, r.buf);
      if (r.ssml) chars += r.ssml.length;
      put({ id, arm: k, engine_arm: a.arm, line: lineId, v, role, take: t, file: path.relative(HERE, f), text,
        voice: k === "D" ? "amazon.nova-2-sonic-v1:0 / kiara (us-east-1)" : `${VOICE} (eastus2)`,
        ssml: r.ssml, system: r.system, said: r.said, said_stage: r.said_stage, ttfb_ms: r.ttfb_ms, usage: r.usage });
      console.log(id, (r.buf.length / 48000).toFixed(2), "s", r.said ? `said=${r.said.slice(0, 50)}` : "");
    }
  }
}
console.log("ssml chars this run", chars);
process.exit(0);
