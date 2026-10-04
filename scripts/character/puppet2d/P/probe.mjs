// P0 probe: one masked medium edit on the mouth close-up; checks mask respect and cost (ledger).
import fs from "node:fs";
import { edit } from "./imgapi.mjs";
const q = process.argv[2] || "medium";
const buf = await edit({
  tag: `probe-mouth-aa-${q}`, quality: q,
  prompt: "Close-up of the same 3D emoji-avatar character's lower face, identical style, skin colour, matte soft shading and lighting. Only the mouth changes: she says the open 'aa' vowel, jaw dropped a little, lips relaxed and open in a soft rounded shape, a thin row of upper teeth and the tongue resting low visible, soft dark-red mouth interior. Same lip colour. No text.",
  images: [{ file: "art/character/puppet2d/P/work/mouth-base.png" }],
  mask: "art/character/puppet2d/P/work/mouth-mask.png",
});
fs.writeFileSync(`art/character/puppet2d/P/work/probe-aa-${q}.png`, buf);
