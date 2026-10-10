// lamp2 painted keys: one image edit per key, all from the SAME input (the approved front in rig space, ungraded:
// rigspace.py), so every key is a repaint of one picture. The model repaints the whole frame (rj-p2d-masked-edit-not-
// honoured), so no mask is sent: keys.py registers each output to the front and composites ONLY its region back.
// Prompts are shapes, not lines: the change, then what must not change.
//   NODE_USE_ENV_PROXY=1 node jobs.mjs <key|all> [--try n]
import fs from "node:fs";
import { edit, spent } from "./imgapi.mjs";
const S = process.env.L2_SCRATCH || "/tmp/claude-0/-home-user-Taxila/4f5bd6cc-5f93-53a8-934d-4a29dc9ad564/scratchpad/l2";
const KEEP = (part) => `Edit this illustration of a woman. Keep the picture exactly as it is: the same person, the same face shape and
proportions, the same head position, size and angle in the frame, the same hair, earrings, bindi, clothes and plain
background, the same flat painterly style, colours, lighting, brush texture and line weight. Do not move, zoom, crop,
re-centre or re-light anything. Change only her ${part}, and nothing else in the image.`;
const MOUTH = (shape) => `${KEEP("mouth")}
New mouth: ${shape}. The rest of the face (eyes, eyebrows, nose, cheeks, chin) stays exactly the same.`;
const EYES = (look) => `${KEEP("eyes")}
New eyes: ${look}. Her eyebrows, eyelid shape, head position and mouth stay exactly the same.`;
const BROWS = (b) => `${KEEP("eyebrows")}
New eyebrows: ${b}. Her eyes, eyelids, mouth and head position stay exactly the same.`;
export const JOBS = {
  // mouth set (Diya's visemes collapsed: RESEARCH.md §4)
  mbp: MOUTH("lips closed and pressed gently together, as in the middle of saying 'm' or 'b': a little flatter and thinner than at rest, corners relaxed, no smile"),
  aa: MOUTH("open as when saying 'aa' while talking calmly: the jaw dropped a little, the edge of the upper teeth just showing, a soft dark mouth interior with the tongue low; natural and moderate, not wide"),
  eh: MOUTH("half open as when saying 'eh' while talking: lips parted, the edge of the upper teeth showing, the jaw dropped only slightly"),
  // t1 read as a toothy grin (both rows, wide): t2 asks for a narrow gap and the teeth barely showing
  ee: MOUTH("as when saying 'ee' in the middle of a calm sentence: lips only slightly parted and a touch wider than at rest, a narrow gap with just the edges of the upper teeth showing; relaxed, not a smile or a grin"),
  oh: MOUTH("rounded and open as when saying 'o' in 'go': a medium oval opening, lips slightly forward"),
  // t1 read as a pout: t2 asks for relaxed rounding, never pursed
  oo: MOUTH("as when saying 'oo' in 'food' in the middle of a calm sentence: lips relaxed and gently rounded around a small soft opening, the mouth a little narrower than at rest; not pursed, not a pout"),
  fv: MOUTH("as when saying 'f' or 'v': the lower lip tucked lightly under the upper front teeth, the upper teeth resting on the lower lip"),
  ltd: MOUTH("as when saying 'l' or 't': lips slightly parted, the upper teeth visible, the tip of the tongue touching just behind the upper teeth"),
  smile: MOUTH("a warm, small, closed-mouth smile: the corners lifted gently, lips closed, kind and grown-up"),
  calm: MOUTH("lips closed and relaxed in a calm, neutral expression: the mouth corners level, no smile at all, attentive and kind"),
  // eye set (the open key is the front; closed / half come from the Stage B edits x-blink / x-mid)
  lookL: EYES("both eyes looking to the viewer's left: the irises moved towards that corner of each eye, the head not turned"),
  lookR: EYES("both eyes looking to the viewer's right: the irises moved towards that corner of each eye, the head not turned"),
  lookUp: EYES("both eyes looking up and a little to the viewer's right, as when thinking: the irises up and to the side, the upper lids lifted very slightly, the head not moved"),
  // brow set (neutral = the front)
  raised: BROWS("both eyebrows raised slightly, attentive and interested, as when listening closely"),
  // t1 read stern (brows lowered and straight): t2 lifts the inner ends and keeps the arch
  concern: BROWS("a gentle, caring look: only the inner ends of both eyebrows lifted slightly upward, the brows keeping their soft arch and their full length; not lowered, not frowning, not stern, not sad"),
};
const [which = "all"] = process.argv.slice(2);
const tryN = process.argv.includes("--try") ? process.argv[process.argv.indexOf("--try") + 1] : "1";
const list = which === "all" ? Object.keys(JOBS) : which.split(",");
fs.mkdirSync(`${S}/raw`, { recursive: true });
const q = [...list];
const worker = async () => {
  while (q.length) {
    const k = q.shift();
    const out = `${S}/raw/${k}-t${tryN}.png`;
    if (fs.existsSync(out)) { console.log("skip", k); continue; }
    try {
      const buf = await edit({ tag: `lamp2-${k}-t${tryN}`, stage: "keys", prompt: JOBS[k], images: [{ file: `${S}/rs/front.png`, name: "front.png" }], quality: "high", size: "1024x1024", fidelity: "high" });
      fs.writeFileSync(out, buf);
    } catch (e) { console.log("FAIL", k, String(e.message).slice(0, 200)); }
  }
};
await Promise.all([worker(), worker(), worker()]);
console.log("spent", spent().toFixed(2));
