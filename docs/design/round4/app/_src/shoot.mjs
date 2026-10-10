// Screenshots every journey state of each direction at 360x800 and 1366x768 into <dir>/shots/*.webp.
// node docs/design/round4/app/_src/shoot.mjs [dir ...]   (Playwright, Chromium at /opt/pw-browsers/chromium)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const APP = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['kaksha', 'nagar', 'chhaap'];
export const STATES = [
  ['1-open', 's=open', 1800],
  ['2-intake', 's=intake&at=plan', 2200],
  ['3-lesson-board', 's=lesson', 10500],
  ['3b-lesson-check', 's=lesson&at=check', 6500],
  ['4-game-launch', 's=game', 2600],
  ['4b-game-play', 's=game&at=play', 4200],
  ['5-end', 's=end', 5200],
  ['6-world', 's=world', 2600],
  ['6b-world-before', 's=world&at=before', 2000],
  ['7-parent', 's=parent', 1500],
  ['7b-parent-hindi', 's=parent&lang=hi', 1500],
  ['2b-intake-hindi', 's=intake&at=plan&lang=hi', 2200],
];
const VIEWS = [[360, 800], [1366, 768]];
const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const dir of dirs) {
  const out = path.join(APP, dir, 'shots'); fs.mkdirSync(out, { recursive: true });
  const file = url.pathToFileURL(path.join(APP, dir, 'index.html')).href;
  for (const [w, h] of VIEWS) {
    await Promise.all(STATES.filter(([n]) => !only || only.test(n)).map(async ([name, hash, wait]) => {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: w < 500 ? 2 : 1 });
      const p = await ctx.newPage();
      const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
      await p.goto(`${file}#${hash}&mute=1`);
      await p.waitForTimeout(wait);
      const png = path.join(out, `${name}__${w}x${h}.png`);
      await p.screenshot({ path: png });
      execFileSync('python3', ['-c', `from PIL import Image;im=Image.open('${png}');im.save('${png.replace('.png', '.webp')}','WEBP',quality=80,method=6)`]);
      fs.rmSync(png);
      if (errs.length) console.log(dir, name, w, 'ERR', errs.join(' | '));
      await ctx.close();
    }));
    console.log(dir, `${w}x${h}`, 'done');
  }
}
await browser.close();
