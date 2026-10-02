// M-K2 desktop proxy: boot + frame-rate benchmark for candidate game runtimes (game-kit-frameworks.md §2.3).
//
// Setup (any scratch dir):
//   npm i phaser@4.2.1 phaser3@npm:phaser@3.90.0 kaplay@3001.0.19 pixi.js@8.22.0 excalibur@0.32.0 \
//         littlejsengine@1.23.1 three@0.186.1 @babylonjs/core@9.29.0 esbuild playwright
//   npx playwright install chromium-headless-shell
//   cp -r <this folder>/entries b
//   for f in b/[a-z]*.js; do n=$(basename $f .js); npx esbuild $f --bundle --minify --format=esm \
//       --outfile=bo/$n.js --conditions=production --define:process.env.NODE_ENV='"production"'; \
//     printf '<!doctype html><meta charset=utf-8><style>body{margin:0;background:#000}</style><script type=module src="%s.js"></script>' $n > bo/$n.html; done
//   (p4d/p3d.html load node_modules/phaser*/dist/phaser.min.js copied to bo/p4dist.js / bo/p3dist.js,
//    plus b/_common.js bundled as bo/common.iife.js with --format=iife --global-name=C)
//   PWX=<path to chrome-headless-shell> node bench.mjs phaser4,phaser3,pixi,littlejs <runs> <cpuThrottle>
//
// Each page draws 200 moving sprites + one text label at 360x640, DPR 2, and records performance.now() at the
// first update after the scene is live (window.__firstFrame) and frames/5 s (window.__fps). Runs are interleaved
// across runtimes. SwiftShader WebGL: fps is CPU-side engine cost + software raster, NOT phone GPU throughput.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { chromium } from 'playwright';
const root = path.resolve('bo'); const srv = http.createServer((q,s)=>{ const f=path.join(root, q.url.split('?')[0]); if(!fs.existsSync(f)){s.writeHead(404);return s.end();} s.writeHead(200,{'content-type': f.endsWith('.js')?'text/javascript':'text/html'}); s.end(fs.readFileSync(f)); }).listen(8767);
const names = process.argv[2].split(','); const RUNS=+process.argv[3]||5; const THROTTLE=+process.argv[4]||6;
const browser = await chromium.launch({ executablePath: process.env.PWX, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const res = {};
for (const n of names) res[n]=[];
for (let r=0;r<RUNS;r++){ for (const n of names) { const ctx = await browser.newContext({viewport:{width:360,height:640}, deviceScaleFactor:2}); const page = await ctx.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(e.message));
    const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate',{rate:THROTTLE}); await cdp.send('Performance.enable');
    await page.goto(`http://localhost:8767/${n}.html`); 
    try { await page.waitForFunction(()=>window.__fps!==undefined,null,{timeout:40000}); } catch(e){ errs.push('timeout'); }
    const v = await page.evaluate(()=>({ff:window.__firstFrame, fps:window.__fps}));
    const m = (await cdp.send('Performance.getMetrics')).metrics; const heap = m.find(x=>x.name==='JSHeapUsedSize').value/1048576;
    res[n].push({...v, heap:+heap.toFixed(1), errs:errs.slice(0,1)}); await ctx.close(); }
}
await browser.close(); srv.close();
const med=a=>{const s=[...a].sort((x,y)=>x-y);return s[Math.floor(s.length/2)]};
for (const [n,rs] of Object.entries(res)) console.log(n.padEnd(10), 'firstFrame_ms med', Math.round(med(rs.map(r=>r.ff??NaN))), 'range', Math.round(Math.min(...rs.map(r=>r.ff))), '-', Math.round(Math.max(...rs.map(r=>r.ff))), '| fps med', med(rs.map(r=>r.fps??NaN)), '| heapMB med', med(rs.map(r=>r.heap)), rs[0].errs.join(';'));
