// render SVG files to PNG with the sandbox Chromium:  node render-svg.mjs <size> <out.png> <in.svg> [<out2.png> <in2.svg> ...]
import fs from "node:fs";
import { chromium } from "/home/user/Taxila/node_modules/playwright/index.mjs";
const [size, ...pairs] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: undefined });
const pg = await b.newPage({ viewport: { width: +size, height: +size }, deviceScaleFactor: 1 });
for (let i = 0; i < pairs.length; i += 2) {
  const svg = fs.readFileSync(pairs[i + 1], "utf8");
  await pg.setContent(`<html><body style="margin:0;background:#FBE5BC"><div style="width:${size}px;height:${size}px">${svg.replace("<svg ", '<svg style="width:100%;height:100%;display:block" ')}</div></body></html>`);
  await pg.screenshot({ path: pairs[i], clip: { x: 0, y: 0, width: +size, height: +size } });
}
await b.close();
