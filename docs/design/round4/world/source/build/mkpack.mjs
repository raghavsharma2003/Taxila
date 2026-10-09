import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
const P = '/home/user/Taxila/public/face-puppet/r8/';
const geom = JSON.parse(readFileSync(P + 'geom.json', 'utf8'));
const imgs = {};
for (const f of readdirSync(P)) {
  if (!f.endsWith('.webp') || f.startsWith('rest-')) continue;
  imgs[f.replace('.webp', '')] = 'data:image/webp;base64,' + readFileSync(P + f).toString('base64');
}
const poster = {
  medium: 'data:image/webp;base64,' + readFileSync(P + 'rest-medium.webp').toString('base64'),
  close: 'data:image/webp;base64,' + readFileSync(P + 'rest-close.webp').toString('base64'),
};
const audio = 'data:audio/mpeg;base64,' + readFileSync('/home/user/Taxila/public/audio/hello-hinglish.mp3').toString('base64');
writeFileSync('pack.js', 'window.TX_PACK=' + JSON.stringify({ geom, imgs, poster, audio }) + ';');
console.log(Object.keys(imgs).length, 'imgs; rects:', Object.keys(geom.rects).join(','));
