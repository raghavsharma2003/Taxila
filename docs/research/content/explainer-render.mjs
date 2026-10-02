// explainer-render: the PRE-RENDER path, measured end to end (animation-video.md §7).
// explainer@1 (template) → Azure Speech TTS with one <bookmark/> per beat (beat sync) + word boundaries (karaoke)
// → retime beats to narration → compile → GSAP player in headless Chromium → seek-per-frame capture → ffmpeg MP4.
// Also writes the "ship the DSL, not the video" byte budget (explainer JSON + Opus narration) for comparison.
// Run: SDK_DIR=<dir with node_modules/{gsap,microsoft-cognitiveservices-speech-sdk}> OUTDIR=<scratch> node docs/research/content/explainer-render.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { validateCall, compile } from "./explainer-dsl.mjs";

const HERE = path.dirname(new URL(import.meta.url).pathname);
for (const line of fs.readFileSync(path.join(HERE, "../../../.env.local"), "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const req = createRequire(path.join(process.env.SDK_DIR, "package.json"));
const sdk = req("microsoft-cognitiveservices-speech-sdk"); const GSAP = fs.readFileSync(req.resolve("gsap/dist/gsap.min.js"), "utf8");
const OUTDIR = process.env.OUTDIR; fs.mkdirSync(path.join(OUTDIR, "frames"), { recursive: true });
const OUT = path.join(HERE, "explainer-render-2026-10-02.json"); const res = { date: "2026-10-02", from: "cloud build container (US) -> eastus2" };
const save = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));

// 1) the explainer (template call as the live model would emit it; narration lines are a separate offline pass)
const L = (en, hi, hi_latn) => ({ en, hi, hi_latn });
const call = { template: "combine-count@1", title: L("Putting together", "जोड़ना", "Jodna"), slots: { a: 3, b: 4, op: "add", sprite: "obj.mango" },
  notes: ["three mangoes appear; count with her", "four more arrive; count", "push the groups together", "count all of them", "show the number sentence"] };
const TTS = ["देखो, यहाँ तीन आम हैं। एक, दो, तीन।", "अब चार और आम आए। एक, दो, तीन, चार।", "चलो, दोनों को एक साथ रख देते हैं।", "अब सब गिनो: एक, दो, तीन, चार, पाँच, छह, सात!", "तीन plus चार बराबर सात।"];
const v = validateCall(call, { topic_id: "c1-maths-ch05-t01", band: "B1" }); res.lint = { ok: v.ok, codes: v.errs.map((e) => e.code) };
v.ex.beats.forEach((b, i) => (b.tts = { en: "-", hi: TTS[i] }));

// 2) TTS with bookmarks → beat offsets
const cfg = sdk.SpeechConfig.fromSubscription(process.env.AZURE_OPENAI_API_KEY, process.env.SPEECH_REGION || "eastus2");
const pu = new URL(process.env.HTTPS_PROXY); cfg.setProxy(pu.hostname, Number(pu.port));
cfg.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Riff24Khz16BitMonoPcm;
cfg.setProperty(sdk.PropertyId.SpeechServiceResponse_RequestSentenceBoundary, "true");
const synth = new sdk.SpeechSynthesizer(cfg, null); const marks = []; const words = [];
synth.bookmarkReached = (_, e) => marks.push({ mark: e.text, t_ms: e.audioOffset / 10000 });
synth.wordBoundary = (_, e) => words.push({ t_ms: e.audioOffset / 10000, d_ms: e.duration / 10000, text: e.text });
const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="hi-IN"><voice name="hi-IN-SwaraNeural"><prosody rate="-8%">` +
  v.ex.beats.map((b) => `<bookmark mark="${b.id}"/>${b.tts.hi}<break time="400ms"/>`).join("") + `</prosody></voice></speak>`;
const t0 = performance.now(); const tr = await new Promise((ok, no) => synth.speakSsmlAsync(ssml, ok, no)); synth.close();
const wav = path.join(OUTDIR, "narration.wav"); fs.writeFileSync(wav, Buffer.from(tr.audioData));
const audioMs = tr.audioDuration / 10000;
res.tts = { voice: "hi-IN-SwaraNeural", synth_wall_ms: Math.round(performance.now() - t0), audio_ms: Math.round(audioMs), chars: TTS.join("").length, bookmarks: marks, word_count: words.length, first_words: words.slice(0, 6) };
const retime = {}; marks.forEach((m, i) => (retime[m.mark] = Math.round((i + 1 < marks.length ? marks[i + 1].t_ms : audioMs) - m.t_ms - 250)));

// 3) compile (retimed) and capture
const plan = compile(v.ex, { lang: "hi", retime }); res.plan = { duration_s: +plan.duration.toFixed(2), labels: plan.labels, bytes: JSON.stringify(plan).length, explainer_bytes: JSON.stringify(v.ex).length };
const PLAYER = `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:${plan.bg}}svg{display:block;font-family:'Noto Sans Devanagari','Noto Sans',sans-serif}</style>
<svg id="st" viewBox="0 0 ${plan.stage.w} ${plan.stage.h}" width="854" height="480"></svg><script>${GSAP}</script><script>
const P=${JSON.stringify(plan)};const NS="http://www.w3.org/2000/svg";const st=document.getElementById("st");const el={};
const mk=(t,a,p)=>{const n=document.createElementNS(NS,t);for(const k in a)n.setAttribute(k,a[k]);p.appendChild(n);return n;};
for(const e of P.els){const g=mk("g",{id:e.id,opacity:e.op},st);g._x=e.x||0;g._y=e.y||0;gsap.set(g,{x:g._x,y:g._y});el[e.id]=g;
 if(e.t==="g")for(const k of e.kids){k.t==="circle"?mk("circle",{cx:k.cx,cy:k.cy,r:k.r,fill:k.fill,stroke:k.stroke||"none"},g):mk("text",{x:k.x,y:k.y,"font-size":k.s,"text-anchor":"middle",fill:"#1F1A14"},g).textContent=k.txt;}
 else if(e.t==="text"){const t=mk("text",{x:0,y:0,"font-size":e.s,"text-anchor":"middle","dominant-baseline":"middle",fill:"#1F1A14"},g);t.textContent=e.txt;g._wipe=true;}
 else if(e.t==="circle")mk("circle",{cx:0,cy:0,r:e.r,fill:e.fill},g);else if(e.t==="rect")mk("rect",{x:-e.w/2,y:-e.h/2,width:e.w,height:e.h,rx:12,fill:e.fill},g);
 else if(e.t==="path"){gsap.set(g,{x:0,y:0});const p=mk("path",{d:e.d,fill:e.fill,stroke:e.stroke,"stroke-width":4},g);g._path=p;}}
// write = left-to-right clip wipe (never per-character splitting: it breaks Devanagari matras and conjuncts)
const tl=gsap.timeline({paused:true});for(const k in P.labels)tl.addLabel(k,P.labels[k]);
for(const w of P.tweens){const g=el[w.id];if(!g)continue;const to={...w.to};if(to.x!==undefined)to.x=g._x+to.x;if(to.y!==undefined)to.y=g._y+to.y;
 if(w.wipe){tl.fromTo(g,{clipPath:"inset(0 100% 0 0)",opacity:1},{clipPath:"inset(0 0% 0 0)",duration:w.d,ease:"none"},w.at);continue;}
 if(w.draw&&g._path){const L=g._path.getTotalLength();g._path.style.strokeDasharray=L;tl.set(g,{opacity:1},w.at).fromTo(g._path,{strokeDashoffset:L},{strokeDashoffset:0,duration:w.d,ease:"power1.inOut"},w.at);continue;}
 if(w.count){const kids=[...g.querySelectorAll("circle")];kids.slice(0,w.count).forEach((c,i)=>tl.to(c,{attr:{r:+c.getAttribute("r")*1.3},duration:0.18,yoyo:true,repeat:1},w.at+i*Math.min(0.6,w.d/Math.max(1,w.count))));continue;}
 if(w.yoyo){tl.to(g,{...to,duration:w.d/2,yoyo:true,repeat:1,ease:"sine.inOut",transformOrigin:"50% 50%"},w.at);continue;}
 if(Object.keys(to).length)tl.to(g,{...to,duration:w.d,ease:"power2.inOut"},w.at);}
tl.to({}, {duration:Math.max(0.01,P.duration-tl.duration())});window.__dur=tl.duration();window.__seek=(t)=>{tl.seek(t,false);};window.__ready=true;</script>`;
fs.writeFileSync(path.join(OUTDIR, "player.html"), PLAYER);
const browser = await chromium.launch({ executablePath: fs.existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 854, height: 480 } }); await page.goto("file://" + path.join(OUTDIR, "player.html")); await page.waitForFunction("window.__ready");
const dur = await page.evaluate("window.__dur"); const FPS = 24; const N = Math.ceil(dur * FPS); const c0 = performance.now();
for (let i = 0; i < N; i++) { await page.evaluate((t) => window.__seek(t), i / FPS); await page.screenshot({ path: path.join(OUTDIR, "frames", `f${String(i).padStart(5, "0")}.jpg`), type: "jpeg", quality: 85 }); }
const capMs = performance.now() - c0; await browser.close();
res.capture = { fps: FPS, frames: N, video_s: +(N / FPS).toFixed(2), wall_ms: Math.round(capMs), realtime_factor: +((N / FPS) / (capMs / 1000)).toFixed(2), cores: (await import("node:os")).cpus().length };
// 4) encode: H.264 480p + AAC; and the DSL-mode alternative (JSON + Opus)
const mp4 = path.join(OUTDIR, "explainer.mp4"); const e0 = performance.now();
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(OUTDIR, "frames", "f%05d.jpg"), "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "28", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "48k", "-shortest", mp4]);
const opus = path.join(OUTDIR, "narration.opus"); execFileSync("ffmpeg", ["-v", "error", "-y", "-i", wav, "-c:a", "libopus", "-b:a", "20k", opus]);
const mp4B = fs.statSync(mp4).size, opusB = fs.statSync(opus).size; const vs = N / FPS;
res.encode = { wall_ms: Math.round(performance.now() - e0), mp4_bytes: mp4B, mp4_kbps: +((mp4B * 8) / vs / 1000).toFixed(1), opus20_bytes: opusB,
  dsl_mode_bytes: opusB + res.plan.explainer_bytes, mp4_mb_per_min: +((mp4B / vs) * 60 / 1e6).toFixed(2), dsl_mode_mb_per_min: +(((opusB + res.plan.explainer_bytes) / vs) * 60 / 1e6).toFixed(3) };
// 5) Devanagari: why `write` is a wipe, not a per-character reveal
const w = "छाया"; res.devanagari = { word: w, naive_split: [...w], graphemes: [...new Intl.Segmenter("hi", { granularity: "grapheme" }).segment(w)].map((s) => s.segment) };
execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-vf", "fps=0.8,scale=427:-1,tile=4x2", "-frames:v", "1", path.join(OUTDIR, "sheet.png")]);
save(); console.log(JSON.stringify(res, null, 1));
