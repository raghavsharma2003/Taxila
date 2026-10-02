// gsap-render-probe.mjs — Taxila factory/video-animation-gen (2026-10-02).
// Q: can one renderer serve BOTH live on-screen animation (GSAP timeline in the app) and pre-rendered MP4 export
// (same timeline, deterministic seek per frame in headless Chromium → ffmpeg)? Measures export throughput.
// Usage: node docs/research/factory/gsap-render-probe.mjs --gsap <path/to/gsap.min.js> --out <dir> [--fps 30] [--secs 30]
import fs from "node:fs"; import path from "node:path"; import { spawn } from "node:child_process";
import { chromium } from "playwright";
const arg = (k, d) => { const i = process.argv.indexOf("--" + k); return i > 0 ? process.argv[i + 1] : d; };
const GSAP = fs.readFileSync(arg("gsap"), "utf8"); const OUT = arg("out", "/tmp/gsap-probe"); fs.mkdirSync(OUT, { recursive: true });
const FPS = Number(arg("fps", 30)), SECS = Number(arg("secs", 30)), W = 1280, H = 720;
// A representative explainer scene: place value 345 (hundreds flats, tens rods, ones cubes, labels, equation), ~60 nodes.
const html = `<!doctype html><meta charset=utf-8><style>html,body{margin:0;background:#1F3B30}text{font-family:sans-serif;fill:#F5F2E8}</style>
<svg id=s width=${W} height=${H} viewBox="0 0 ${W} ${H}"></svg><script>${GSAP}</script><script>
const NS="http://www.w3.org/2000/svg",s=document.getElementById('s');
const el=(t,a)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);s.appendChild(e);return e};
const title=el('text',{x:640,y:90,'font-size':72,'text-anchor':'middle',opacity:0});title.textContent='345';
const flats=[0,1,2].map(i=>el('rect',{x:120+i*110,y:220,width:100,height:100,fill:'#7FB8E6',opacity:0}));
const rods=[0,1,2,3].map(i=>el('rect',{x:540+i*40,y:220,width:28,height:100,fill:'#E8743B',opacity:0}));
const ones=[0,1,2,3,4].map(i=>el('rect',{x:820+i*34,y:292,width:26,height:26,fill:'#6DB35A',opacity:0}));
const lab=(x,t)=>{const e=el('text',{x,y:370,'font-size':34,'text-anchor':'middle',opacity:0});e.textContent=t;return e};
const L=[lab(275,'3 hundreds'),lab(600,'4 tens'),lab(900,'5 ones')];
const V=[[275,'300'],[600,'40'],[900,'5']].map(([x,t])=>{const e=el('text',{x,y:190,'font-size':44,'text-anchor':'middle',opacity:0});e.textContent=t;return e});
const eq=el('text',{x:640,y:520,'font-size':60,'text-anchor':'middle',opacity:0});eq.textContent='345 = 300 + 40 + 5';
const tl=gsap.timeline({paused:true});
tl.to(title,{opacity:1,duration:1}).to(flats,{opacity:1,stagger:.4,duration:.5},'+=1').to(L[0],{opacity:1},'<')
  .to(rods,{opacity:1,stagger:.3,duration:.4},'+=2').to(L[1],{opacity:1},'<').to(ones,{opacity:1,stagger:.2,duration:.3},'+=2').to(L[2],{opacity:1},'<')
  .to(V,{opacity:1,y:'-=10',stagger:.8,duration:.6},'+=2').to(rods,{scale:1.15,transformOrigin:'50% 50%',yoyo:true,repeat:3,duration:.4},'+=1')
  .to(eq,{opacity:1,duration:1},'+=2').to({}, {duration:${SECS}-tl.duration()>0?${SECS}-tl.duration():0.01});
window.__tl=tl; window.__dur=tl.duration();
</script>`;
const page0 = path.join(OUT, "scene.html"); fs.writeFileSync(page0, html);
const browser = await chromium.launch({ executablePath: process.env.PWX || undefined });
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto("file://" + page0); const dur = await page.evaluate(() => window.__dur);
const n = Math.round(Math.min(dur, SECS) * FPS); const mp4 = path.join(OUT, "scene.mp4");
const ff = spawn("ffmpeg", ["-v", "error", "-y", "-f", "mjpeg", "-framerate", String(FPS), "-i", "pipe:0", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", mp4], { stdio: ["pipe", "inherit", "inherit"] });
ff.on("error", (e) => { console.error("ffmpeg", e); process.exit(1); });
const t0 = Date.now(); let shotMs = 0;
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => { window.__tl.seek(t, false); }, i / FPS); // return void: the timeline object is circular
  const a = Date.now(); const buf = await page.screenshot({ type: "jpeg", quality: 85 }); shotMs += Date.now() - a;
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end(); await new Promise((r) => ff.on("close", r)); const wall = (Date.now() - t0) / 1000;
await browser.close();
const res = { date: "2026-10-02", fps: FPS, frames: n, timeline_s: dur, wall_s: wall, realtime_factor: +(wall / (n / FPS)).toFixed(2), mean_screenshot_ms: +(shotMs / n).toFixed(1), bytes: fs.statSync(mp4).size, html_bytes: html.length - GSAP.length, gsap_bytes: GSAP.length };
console.log(JSON.stringify(res)); fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "gsap-render-probe-2026-10-02.json"), JSON.stringify(res, null, 2));
