import { serve, open } from "./shoot.mjs";
const srv = await serve();
const { browser, page } = await open(srv, "capture=1&px=360");
const r = await page.evaluate(() => { const lv = []; for (let x = 0; x < 23.4; x += 1 / 60) { const o = window.P2D.renderAt(x); if (o.scene === "listening" && Math.round(x * 60) % 6 === 0) lv.push([+x.toFixed(2), +o.head[0].toFixed(2), o.state]); } return { nods: window.P2D.listener.nods, sample: lv.filter((_, i) => i % 5 === 0) }; });
console.log(JSON.stringify(r));
await browser.close(); srv.close();
