// r3 painted keys (gpt-image-2 edit, c-front as the identity reference): yaw +-25 plates for the turn keyforms and a
// closed / mid lid pair for the blink rebuild. Ledger + hard stop in imgapi.mjs.
//   node scripts/character/puppet2d/polish-r4/gen-keys.mjs <which...>   (yawL yawR closed mid)
import fs from "node:fs";
import { edit, spent } from "./imgapi.mjs";
const K = "art/character/puppet2d/polish-r4/keys";
const SRC = "art/character/puppet2d/polish-r4/c-front.png";
const STYLE = "Identical character, identity, face proportions, colours, matte soft Memoji-style 3D shading, line weight, lighting, hair masses and grooves, gold stud earrings, bindi, teal kurta with orange piping, plain warm-cream background. No text.";
const JOBS = {
  yawL: { images: [{ file: SRC, name: "front.png" }, { file: `${K}/q3-left.png`, name: "pose.png" }], prompt: `Image 1 is the character, image 2 shows the same character from a three-quarter view. Repaint image 1 with ONLY her head turned about 25 degrees toward the LEFT edge of the image (a small turn: less than image 2; both eyes fully visible, the far eye only slightly narrower), shoulders, neck and kurta exactly as in image 1, the same framing, size and position as image 1, looking where her face points, gentle closed-mouth smile exactly like image 1. ${STYLE}` },
  yawR: { images: [{ file: SRC, name: "front.png" }, { file: `${K}/q3-right.png`, name: "pose.png" }], prompt: `Image 1 is the character, image 2 shows the same character from a three-quarter view. Repaint image 1 with ONLY her head turned about 25 degrees toward the RIGHT edge of the image (a small turn: less than image 2; both eyes fully visible, the far eye only slightly narrower), shoulders, neck and kurta exactly as in image 1, the same framing, size and position as image 1, looking where her face points, gentle closed-mouth smile exactly like image 1. ${STYLE}` },
  closed: { images: [{ file: SRC, name: "front.png" }], mask: `${K}/eyemask.png`, prompt: `The same image with both eyes gently CLOSED in a relaxed blink: the upper eyelids come all the way down; each closed eye is a soft smooth skin-coloured lid with a single clean dark curved lash line (curving downward, a gentle smile-shaped arc) at about two thirds of the eye's height, with the same small outer lash flick, a faint soft crease above the lid. No eyeball, iris or white visible. Brows untouched. ${STYLE}` },
  mid: { images: [{ file: SRC, name: "front.png" }], mask: `${K}/eyemask.png`, prompt: `The same image mid-blink: both upper eyelids lowered to HALF of the eye opening, a smooth rounded skin-coloured lid with a soft natural crease above it, the dark lash line along the lowered lid edge with the same outer flick; the lower half of the iris and the white still visible below the lid, the iris looking straight ahead. Relaxed, not sleepy. Brows untouched. ${STYLE}` },
};
const which = process.argv.slice(2);
for (const w of which) {
  const J = JOBS[w];
  const n = fs.readdirSync(K).filter((f) => f.startsWith(w + "-")).length;
  const buf = await edit({ tag: `r3-key-${w}`, prompt: J.prompt, images: J.images, mask: J.mask || null, quality: "high", size: "1024x1024", fidelity: "high" });
  fs.writeFileSync(`${K}/${w}-${n}.png`, buf);
  console.log("wrote", `${K}/${w}-${n}.png`, "spent", spent().toFixed(2));
}
