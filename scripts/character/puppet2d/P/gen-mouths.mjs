// P5: the painted mouth set. Every patch is a MASKED edit of the 4x close-up of c-front's lower face
// (work/mouth-base.png = c-front[402:658, 484:740] upscaled 4x), so everything around the mouth is c-front.
// Prompts describe mouth shapes, never lines she could say.
//   NODE_USE_ENV_PROXY=1 node scripts/character/puppet2d/P/gen-mouths.mjs [--only a,b] [--force] [--suffix v2]
import fs from "node:fs";
import { edit } from "./imgapi.mjs";
const argv = process.argv.slice(2);
const opt = (f, d) => (argv.includes(f) ? argv[argv.indexOf(f) + 1] : d);
const OUT = "art/character/puppet2d/P/work/mouths";
fs.mkdirSync(OUT, { recursive: true });
const PRE = "Close-up of the same 3D emoji-avatar character's lower face: identical style, matte soft Memoji shading, lighting and warm skin colour; "
  + "lips the same soft dusty-rose colour and thickness as the input (a thin upper lip, a fuller soft lower lip). "
  + "Only the mouth inside the editable area changes; the nose, cheeks, chin and jaw outline stay exactly where they are, the mouth stays the same width or narrower. "
  + "If teeth show they are one smooth soft white row inside the lips, never poking out; the mouth interior is a soft dark warm red. The mouth: ";
export const SHAPES = {
  // warm (speaking) column: c-front's gentle pleasant register
  PP: "lips gently pressed together for the 'p / b / m' sound: closed, slightly flattened and pressed, a faint pleasant upturn at the corners.",
  FF: "the 'f / v' sound: the lower lip tucked lightly up under the upper front teeth, the edge of the upper teeth visible resting on the lower lip, corners relaxed.",
  TH: "the dental 'th' sound: mouth slightly open, the pink tongue tip visible between the upper and lower front teeth.",
  DD: "the Hindi dental 't / d' sound: mouth a little open, the upper teeth row visible, the pink tongue tip pressed against the back of the upper front teeth and visible just below them.",
  RETRO: "the Hindi retroflex 'T / D' sound: mouth a little open, the upper teeth visible, the tongue tip curled back and up toward the roof of the mouth so the darker underside of the tongue shows in the opening.",
  LL: "the 'l' sound: mouth slightly open, the broad tongue tip raised and touching the ridge just behind the upper teeth, visible in the opening.",
  kk: "the 'k / g' sound: mouth open a little, teeth slightly apart, the tongue held back so the front of the mouth interior is dark.",
  CH: "the 'ch / sh / j' sound: lips pushed slightly forward and squared, teeth close together and visible between the lips.",
  SS: "the 's' sound: upper and lower teeth together and visible, lips parted and slightly spread.",
  RR: "the 'r' sound: mouth slightly open, lips a little rounded, the tongue tip lifted behind the upper teeth.",
  aa: "a wide-open vowel sound as when singing a long note: the lips form a soft rounded opening, the edge of the upper teeth showing, a soft dark mouth inside.",
  E: "the 'e' vowel as in 'ek': lips spread and half open, the upper and lower teeth visible slightly apart.",
  I: "the 'ee' vowel: lips spread wide in a slight smile, nearly closed, both teeth rows visible close together.",
  O: "the 'o' vowel: lips rounded into an open oval, pushed slightly forward.",
  U: "the 'oo' vowel: lips puckered forward into a small round opening.",
  open_sm: "a small relaxed half-open speaking mouth: lips just parted, a hint of the upper teeth edge.",
  // delight column
  grin: "a broad warm closed-mouth smile: corners lifted high, lips closed, cheeks lifted.",
  laugh: "a big delighted open smile: mouth open wide in a soft D shape, the upper teeth row visible, tongue low, corners high, cheeks lifted.",
  grin_E: "a broad happy smile while talking: lips parted, both teeth rows visible, corners high.",
  grin_sm: "a happy smile with the lips slightly parted, the upper teeth edge showing, corners high.",
  // concern column
  concern: "gentle concern: lips softly closed and pressed a little, the corners turned slightly down, no smile.",
  concern_sm: "gentle concerned talking: lips slightly parted, the corners slightly down, a small opening.",
  concern_aa: "concerned open vowel: mouth open moderately, the corners slightly down, upper teeth edge visible.",
  concern_O: "concerned rounded 'o': lips rounded into a small oval, the corners slightly down.",
  // specials
  neutral: "relaxed neutral closed lips, no smile, corners level.",
  aside: "thinking: lips closed and pushed toward the viewer's left side, slightly pursed, asymmetric, the viewer's-right corner pulled in.",
  surprise: "surprised: mouth open in a rounded tall 'O', the jaw dropped a little.",
  playful: "a playful lopsided closed smile: the corner on the viewer's right lifted higher than the other, a small smirk, no teeth.",
};
const only = opt("--only", Object.keys(SHAPES).join(",")).split(",");
const suffix = opt("--suffix", "");
const quality = opt("--quality", "medium");
const queue = only.filter((n) => argv.includes("--force") || !fs.existsSync(`${OUT}/${n}${suffix}.png`));
const worker = async () => {
  while (queue.length) {
    const n = queue.shift();
    try {
      const buf = await edit({ tag: `mouth-${n}${suffix}`, quality, prompt: PRE + SHAPES[n] + " No text.", images: [{ file: "art/character/puppet2d/P/work/mouth-base.png" }], mask: "art/character/puppet2d/P/work/mouth-mask.png" });
      fs.writeFileSync(`${OUT}/${n}${suffix}.png`, buf);
    } catch (e) { console.log(`[mouths] FAIL ${n}: ${e.message}`); }
  }
};
await Promise.all([worker(), worker(), worker()]);
