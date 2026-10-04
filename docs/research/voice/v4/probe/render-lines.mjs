// render-lines.mjs — renders the v4 rewrites (../lines.mjs) for screening and a round-3 blind page, 2026-10-04.
// Arms per line variant:
//   diya-text    new text, NO plan (the text lever alone)
//   diya-plan    new text + DeliveryPlan compiled to DragonHD SSML (Devanagari runs in <lang hi-IN>)
//   diya-planall new text + plan, the WHOLE clause inside <lang hi-IN> (one-accent lever: English words said by the hi-IN front end)
//   nova-plan    Nova 2 Sonic kiara, reader prompt + band + scene + clause plan (prose shape)
// Plus the script probe: the ORIGINAL L1 line in Devanagari vs Roman Hinglish (what the hinglish lane actually emits).
// Run: cd /home/user/Taxila; set -a; . ./.env.local; set +a; NODE_USE_ENV_PROXY=1 SDK_FROM=<dir with @aws-sdk>/ node docs/research/voice/v4/probe/render-lines.mjs [armRegex]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LINES, SCENES, textOf, validate, compileDragonHD, plainDragonHD, compileNova } from "../lines.mjs";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEY = process.env.AZURE_OPENAI_API_KEY;
const FILTER = process.argv[2] ? new RegExp(process.argv[2]) : null;
const MF = path.join(HERE, "lines-renders.json");
const man = fs.existsSync(MF) ? JSON.parse(fs.readFileSync(MF, "utf8")) : { v: "taxila-v4-lines/1", date: "2026-10-04", renders: [] };
const put = (e) => { man.renders = man.renders.filter((r) => r.id !== e.id); man.renders.push(e); fs.writeFileSync(MF, JSON.stringify(man, null, 1)); };

async function azure(ssml) {
  for (let a = 0; a < 3; a++) {
    const t0 = performance.now();
    const r = await fetch("https://eastus2.tts.speech.microsoft.com/cognitiveservices/v1", { method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "riff-24khz-16bit-mono-pcm", "User-Agent": "taxila-v4-lines" }, body: ssml });
    if (r.ok) return { buf: Buffer.from(await r.arrayBuffer()), ms: Math.round(performance.now() - t0) };
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 2000 * (a + 1))); continue; }
    return { err: `HTTP ${r.status} ${(await r.text()).slice(0, 160)}` };
  }
  return { err: "retries" };
}
const out = (id) => { const f = path.join(HERE, "wav-lines", `${id}.wav`); fs.mkdirSync(path.dirname(f), { recursive: true }); return f; };

let novaMod = null;
for (const l of LINES) {
  const errs = validate(l); if (errs.length) { console.log(l.id, l.v, "INVALID", errs); continue; }
  const scene = SCENES[l.id].scene, text = textOf(l);
  const arms = {
    "diya-text": () => azure(plainDragonHD(l)),
    "diya-plan": () => azure(compileDragonHD(l)),
    "diya-planall": () => azure(compileDragonHD(l, { langWrap: "all" })),
    "nova-plan": async () => { novaMod ??= await import("./nova.mjs"); const p = compileNova(l, scene); const r = await novaMod.sonic("kiara", p.system, p.text); return { ...r, system: p.system }; },
  };
  for (const [arm, fn] of Object.entries(arms)) {
    const id = `${l.id}${l.v}__${arm}`;
    if (FILTER && !FILTER.test(id)) continue;
    let r = await fn(); if (!r.buf && arm === "nova-plan") r = await fn();
    if (!r.buf) { console.log(id, "ERR", r.err); put({ id, line: l.id, v: l.v, arm, error: r.err }); continue; }
    const f = out(id); fs.writeFileSync(f, r.buf);
    put({ id, line: l.id, v: l.v, arm, file: path.relative(HERE, f), text, said: r.said, system: r.system,
      ssml: arm.startsWith("diya") ? (arm === "diya-text" ? plainDragonHD(l) : compileDragonHD(l, { langWrap: arm === "diya-planall" ? "all" : "runs" })) : undefined });
    console.log(id, (r.buf.length / 48000).toFixed(2), "s", r.said ? `said=${r.said.slice(0, 60)}` : "");
  }
}

// script probe: the hinglish lane writes Roman script (compile.js LANGUAGE, brain/say.js SCRIPT_OK); the stimuli were Devanagari
const ORIG_DEVA = SCENES["L1-think"].text;
const ORIG_ROMAN = "Sattaais aur paintees. Pehle tens jodte hain, bees aur tees, pachaas. Phir saat aur paanch, baarah. Toh total hua baasath!";
const sp = (b) => `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-IN"><voice name="en-IN-Diya:DragonHDLatestNeural">${b}</voice></speak>`;
const probes = {
  "script__deva-runs": sp(ORIG_DEVA.replace(/[ऀ-ॿ][ऀ-ॿ\s,!?।\-]*[ऀ-ॿ।!?]?/g, (m) => `<lang xml:lang="hi-IN">${m}</lang>`)),
  "script__roman-en": sp(ORIG_ROMAN),
  "script__roman-hi": sp(`<lang xml:lang="hi-IN">${ORIG_ROMAN}</lang>`),
};
for (const [id, ssml] of Object.entries(probes)) {
  if (FILTER && !FILTER.test(id)) continue;
  for (let t = 1; t <= 2; t++) {
    const r = await azure(ssml); const tid = `${id}__t${t}`;
    if (!r.buf) { console.log(tid, r.err); continue; }
    const f = out(tid); fs.writeFileSync(f, r.buf);
    put({ id: tid, line: "L1-think", v: "orig", arm: id, file: path.relative(HERE, f), text: id.includes("roman") ? ORIG_ROMAN : ORIG_DEVA, ssml });
    console.log(tid, (r.buf.length / 48000).toFixed(2), "s");
  }
}
process.exit(0);
