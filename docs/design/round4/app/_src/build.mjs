// Builds each direction's self-contained, offline docs/design/round4/app/<dir>/index.html from <dir>/src.html.
// Directives inside src.html:
//   <!--@CORE-->                 shared runtime (core.js + journey.js) and the Asha puppet with its lamp1 layers
//   <!--@FONTS name=file[;css-descriptors] ...-->  subset (to the page's own characters) + inline woff2 @font-face
//   @img(assets/name.webp)       data URI for an image in _src/assets or <dir>/
// Usage: node docs/design/round4/app/_src/build.mjs [dir ...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import url from 'node:url';

const SRC = path.dirname(url.fileURLToPath(import.meta.url));
const APP = path.dirname(SRC);
const LAMP = path.resolve(APP, '../../../../art/character/puppet2d/lamp1');
const dirs = process.argv.slice(2).length ? process.argv.slice(2) : ['kaksha', 'nagar', 'chhaap'];
const TMP = fs.mkdtempSync('/tmp/claude-0/u1-build-');

const mime = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' };
const b64 = (p) => `data:${mime[path.extname(p)]};base64,${fs.readFileSync(p).toString('base64')}`;

function ashaPack() {
  const g = JSON.parse(fs.readFileSync(path.join(LAMP, 'geom.json'), 'utf8'));
  const names = Object.keys(g.rects).filter((k) => k !== 'bg');
  const L = {};
  for (const k of names) L[k] = b64(path.join(LAMP, k + '.webp'));
  return `window.ASHA_R=${JSON.stringify(Object.fromEntries(names.map((k) => [k, g.rects[k]])))};\nwindow.ASHA_L=${JSON.stringify(L)};`;
}

function subset(file, text, tag) {
  const tf = path.join(TMP, tag + '.txt');
  fs.writeFileSync(tf, text);
  const out = path.join(TMP, tag + '.woff2');
  execFileSync('pyftsubset', [path.join(SRC, 'fonts', file), `--text-file=${tf}`, `--output-file=${out}`, '--flavor=woff2',
    '--layout-features=*', '--no-hinting', '--desubroutinize'], { stdio: 'inherit' });
  return fs.readFileSync(out);
}

for (const dir of dirs) {
  const srcFile = path.join(APP, dir, 'src.html');
  let html = fs.readFileSync(srcFile, 'utf8');
  const core = ['core.js', 'journey.js', 'asha.js'].map((f) => fs.readFileSync(path.join(SRC, f), 'utf8')).join('\n');
  // text the fonts must cover: page + shared copy, plus ASCII
  let ascii = '';
  for (let c = 32; c < 127; c++) ascii += String.fromCharCode(c);
  const text = [...new Set(html + core + ascii + '₹–—‘’“”…·×÷→←↗✓')].join('');
  let fontBytes = 0;
  html = html.replace(/<!--@FONTS([\s\S]*?)-->/, (_, body) => {
    const css = [];
    body.trim().split(/\n+/).map((s) => s.trim()).filter(Boolean).forEach((line, i) => {
      const [family, rest] = line.split('=');
      const [file, ...desc] = rest.split(';');
      const buf = subset(file.trim(), text, `${dir}-${i}`);
      fontBytes += buf.length;
      css.push(`@font-face{font-family:"${family.trim()}";src:url(data:font/woff2;base64,${buf.toString('base64')}) format("woff2");font-display:block;${desc.join(';')}}`);
    });
    return `<style>${css.join('\n')}</style>`;
  });
  html = html.replace(/@img\(([^)]+)\)/g, (_, p) => {
    const a = [path.join(APP, dir, p), path.join(SRC, p)].find((f) => fs.existsSync(f));
    if (!a) throw new Error(`missing image ${p} in ${dir}`);
    return b64(a);
  });
  html = html.replace('<!--@CORE-->', () => `<script>${ashaPack()}\n${core}</script>`);
  if (/@img\(|<!--@/.test(html)) throw new Error(`unresolved directive in ${dir}`);
  const out = path.join(APP, dir, 'index.html');
  fs.writeFileSync(out, html);
  console.log(`${dir}/index.html ${(html.length / 1024).toFixed(0)} KB (fonts ${(fontBytes / 1024).toFixed(0)} KB)`);
}
fs.rmSync(TMP, { recursive: true, force: true });
