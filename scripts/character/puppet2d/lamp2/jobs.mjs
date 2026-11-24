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
// P1 (after J1: "teeth and mouth interior differ between consecutive frames"): the mid mouths are repainted FROM a sibling
// key (--from), so a family shares one set of teeth and lips: eh and oh from aa, ltd from ee.
const FAMILY = (from, change) => `Edit this illustration of a woman. Keep the picture exactly as it is, including her mouth's
style: the same lips, the same teeth (their shape, size, colour and number), the same mouth interior colour, and everything
else in the image unchanged. Do not move, zoom, crop, re-centre or re-light anything.
Change only how far her mouth is open: ${change}.`;
export const P1 = {
  eh: FAMILY("aa", "close it to about half of its current opening, as when saying 'eh' while talking: the same upper teeth still showing along the top"),
  oh: FAMILY("aa", "round the lips into a medium oval as when saying 'o' in 'go', the same upper teeth just visible at the top of the opening"),
  ltd: FAMILY("ee", "part the lips a little more, as when saying 'l' or 't', with the tip of the tongue just visible touching behind the same upper teeth"),
  lookUp: EYES_P1(),
  // P3 (J3 Kimi 2/2: "the open mouth is a flat dark void, no teeth or tongue"): the aa interior, painted from the aa key
  aa: `Edit this illustration of a woman. Keep the picture exactly as it is: the same person, face, lips, the same size and
shape of her open mouth, head position, hair, clothes, background, style, colours and lighting. Do not move, zoom, crop,
re-centre or re-light anything. Change only the inside of her open mouth: paint the upper front teeth clearly as a soft
ivory row under the upper lip, and the tongue resting low in the mouth in a soft, muted rose-brown, with a little shadow
at the back; natural and calm, in the same flat painterly style.`,
};
function EYES_P1() { return `Edit this illustration of a woman. Keep the picture exactly as it is: the same person, the same face, head position,
size and angle, the same hair, earrings, bindi, clothes, background, style, colours and lighting. Do not move, zoom, crop,
re-centre or re-light anything. Change only her eyes: both eyes glance slightly up and to the viewer's right, as when
thinking, and both irises move by exactly the same small amount in the same direction, so the two eyes stay parallel and
look at the same point. Her eyelids, eyebrows and mouth stay exactly the same.`; }
// v3 (main session after Jfinal, 2026-10-10): (a) ONE mouth model sheet: every speech mouth painted FROM the aa master
// key so all share its teeth, tongue and shadow; (c) a thinking glance with both eyes converging on one point;
// (b) two barely-there head-turn keys, to test a turn as a key swap instead of a mesh roll.
export const V3 = {
  ee: FAMILY("aa", "close it to a narrow gap as when saying 'ee', the lips a touch wider than at rest, only the edge of the same upper teeth showing"),
  ltd: FAMILY("aa", "close it to a small opening as when saying 'l' or 't', the same upper teeth showing and the tip of the tongue just touching behind them"),
  fv: FAMILY("aa", "as when saying 'f' or 'v': the lower lip tucked lightly up under the same upper front teeth, which rest on it"),
  oo: FAMILY("aa", "round the lips gently around a small soft opening as when saying 'oo' in 'food', the edge of the same upper teeth just visible; relaxed, not pursed"),
  lookUp: `Edit this illustration of a woman. Keep the picture exactly as it is: the same person, face, head position, size and
angle, hair, earrings, bindi, clothes, background, style, colours and lighting. Do not move, zoom, crop, re-centre or
re-light anything. Change only her eyes: she glances up and to the viewer's right as when thinking. Both eyes look at
the SAME point: both irises move the same distance up and the same distance to the viewer's right, each iris stays fully
round and the same size as now, partly under the upper lid. Her eyelids, eyebrows and mouth stay exactly the same.`,
  turnL: `Edit this illustration of a woman. Keep the picture exactly as it is: the same person, face, hair, earrings, bindi,
clothes, background, style, colours, lighting and framing; the shoulders and clothes do not move at all. Change only the
pose of her head: turn it very slightly, about 3 degrees, towards the viewer's left, a barely visible turn, the face,
hair and ears turning with it naturally and the eyes still looking at the viewer.`,
  turnR: `Edit this illustration of a woman. Keep the picture exactly as it is: the same person, face, hair, earrings, bindi,
clothes, background, style, colours, lighting and framing; the shoulders and clothes do not move at all. Change only the
pose of her head: turn it very slightly, about 3 degrees, towards the viewer's right, a barely visible turn, the face,
hair and ears turning with it naturally and the eyes still looking at the viewer.`,
};
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
// --from <key>: start from that key's composite (rs/k-<key>.png) with the P1 family prompt; --p1: the P1 prompt from the front
const from = process.argv.includes("--from") ? process.argv[process.argv.indexOf("--from") + 1] : null;
const p1 = process.argv.includes("--p1") || !!from;
const v3 = process.argv.includes("--v3");
fs.mkdirSync(`${S}/raw`, { recursive: true });
const q = [...list];
const worker = async () => {
  while (q.length) {
    const k = q.shift();
    const out = `${S}/raw/${k}-t${tryN}.png`;
    if (fs.existsSync(out)) { console.log("skip", k); continue; }
    try {
      const src = from ? `${S}/rs/k-${from}.png` : `${S}/rs/front.png`;
      const buf = await edit({ tag: `lamp2-${k}-t${tryN}`, stage: v3 ? "keys-v3" : p1 ? "keys-P1" : "keys", prompt: v3 ? V3[k] : p1 ? P1[k] : JOBS[k], images: [{ file: src, name: "front.png" }], quality: "high", size: "1024x1024", fidelity: "high" });
      fs.writeFileSync(out, buf);
    } catch (e) { console.log("FAIL", k, String(e.message).slice(0, 200)); }
  }
};
await Promise.all([worker(), worker(), worker()]);
console.log("spent", spent().toFixed(2));
