// r8: solver / rig numbers for a pose spec:  node probe-pose.mjs '<json spec>'
import { serve, open } from "./shoot.mjs";
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=720");
const out = await page.evaluate((spec) => { const P = window.P2D; P.pose(spec); const r = P.rig, s = r.solver; return { p: s.p, drop: s.lowerDrop(), jaw: s.jaw(), sur: s.surprised, joy: s.joy, pursed: s.pursed, fc: r._fc, eyes: Object.fromEntries(["L", "R"].map((k) => { const E = r.eyes[k]; let a = 0, a0 = 0; for (let i = 0; i < E.top.length; i++) { a += Math.max(0, E.bot[i] - E.top[i]); a0 += E.e.bot[i] - E.e.top[i]; } return [k, +(a / a0).toFixed(3)]; })), leanS: r.st.leanS }; }, JSON.parse(process.argv[2]));
console.log(JSON.stringify(out));
await browser.close(); srv.close();
