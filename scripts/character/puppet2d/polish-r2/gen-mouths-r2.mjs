// P5: the painted mouth set. Every patch is a MASKED edit of the 4x close-up of c-front's lower face
// (work/mouth-base.png = c-front[402:658, 484:740] upscaled 4x), so everything around the mouth is c-front.
// Prompts describe mouth shapes, never lines she could say.
//   NODE_USE_ENV_PROXY=1 node scripts/character/puppet2d/P/gen-mouths.mjs [--only a,b] [--force] [--suffix v2]
import fs from "node:fs";
import { edit } from "./imgapi.mjs";
// r2: two shapes the expression emitters lacked (the "hmm" of thinking and the attentive parted lips of listening).
//   NODE_USE_ENV_PROXY=1 node scripts/character/puppet2d/polish-r2/gen-mouths-r2.mjs --ref art/character/puppet2d/P/work/mouth-ref-cfront.png
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const OUT = opt("--out", "art/character/puppet2d/polish-r2/work/mouths-r2");
const BASE = opt("--base", "art/character/puppet2d/P/work/mouth-base-blank.png");
const MASK = opt("--mask", "art/character/puppet2d/P/work/mouth-mask2.png");
const REFIMG = opt("--ref", null);
fs.mkdirSync(OUT, { recursive: true });
const PRE = "Close-up of the same 3D emoji-avatar character's lower face: identical style, matte soft Memoji shading, lighting and warm skin colour. "
  + "Paint her mouth in the editable area (it is blank skin now), centred under the nose: soft muted dusty-rose lips, a thin upper lip and a slightly fuller soft lower lip, "
  + "a small cute mouth whose relaxed width is about the width of the nose plus a third on each side; include the mouth corners and their soft creases appropriate to the shape. "
  + "The nose, cheeks, chin and jaw outline stay exactly where they are. "
  + "If teeth show they are one smooth soft white row inside the lips, never poking out; the mouth interior is a soft dark warm red. The mouth: ";
const REFPRE = "The second image shows her real mouth at rest: copy its lips exactly - the same thin delicate upper lip, the same modest lower lip, the same muted mauve-rose lip colour with soft matte shading and no gloss, the same mouth width - and only change the pose of the mouth. ";
export const SHAPES = {
  hmm: "thinking it over: a small mouth with the lips closed and gently pursed forward, the whole mouth shifted a little toward the viewer's right, the viewer's-right corner tucked up into a small dimple and the other corner level, asymmetric, no smile, no teeth.",
  attentive: "attentive and listening: the lips softly parted a little, relaxed, corners level, no smile, a thin dark gap between the lips and the barely visible edge of the upper teeth.",
};
const only = opt("--only", Object.keys(SHAPES).join(",")).split(",");
const suffix = opt("--suffix", "");
const quality = opt("--quality", "medium");
const queue = only.filter((n) => argv.includes("--force") || !fs.existsSync(`${OUT}/${n}${suffix}.png`));
const worker = async () => {
  while (queue.length) {
    const n = queue.shift();
    try {
      const buf = await edit({ tag: `mouth-${n}${suffix}`, quality, prompt: (REFIMG ? REFPRE : "") + PRE + SHAPES[n] + " No text.", images: REFIMG ? [{ file: BASE }, { file: REFIMG }] : [{ file: BASE }], mask: MASK });
      fs.writeFileSync(`${OUT}/${n}${suffix}.png`, buf);
    } catch (e) { console.log(`[mouths] FAIL ${n}: ${e.message}`); }
  }
};
await Promise.all([worker(), worker(), worker()]);
