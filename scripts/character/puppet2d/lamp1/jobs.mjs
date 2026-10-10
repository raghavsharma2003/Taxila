// lamp1 image jobs: the round-4 Asha fronts (Stage A) and the rig set (Stage B). Every job is an EDIT of an earlier
// image, so identity is carried by pixels. Prompts describe shapes, never lines she could say.
//   NODE_USE_ENV_PROXY=1 node scripts/character/puppet2d/lamp1/run.mjs <id>[,<id>...] [--force] [--conc 2]
// Sources live in the scratch raw/ folder as PNG (w1-flat.png is the face agent's original 1024 PNG of world-rest).
const STYLE = "drawn in exactly the same art style as the input image: a premium flat-shaded illustration built like layered vector art, "
  + "clean flat colour shapes with soft gradient transitions between a lit tone, a mid tone and a shadow tone, shadows tinted plum-violet "
  + "(never black or grey), warm lamp-gold light on the lit planes, almost no outlines, no texture noise";
const KEEP = "Keep exactly: her identity and face, eyes, nose, brows, the small dark maroon bindi, skin tone, the framing (front view, head and "
  + "shoulders, head upright and centred, same size and position in the frame), the soft even frontal light and the plain flat warm cream background.";
const BG = "The background is one perfectly flat, even warm cream colour: no texture, no grain, no paper, no noise, no vignette, no frame. "
  + "No hands, no props held, no text, no letters, no logo, no watermark.";
const FACE_REST = "Eyes open looking straight at the viewer; mouth closed with the lips together, corners level and relaxed; a pleasant, open resting face.";

// the age-cue front: same saree, stronger early-to-mid-30s cues, natural lips, tidier grown-up hair with one clean lock per side
const AGE = `The same woman as in the input image, ${STYLE}. ${KEEP} Change only these, subtly, so she reads clearly as a settled woman of about 34 `
  + "(never older than 38, never tired, no grey hair): the face very slightly fuller and softer through the cheeks and the jaw, less sharp and less "
  + "model-like; the faintest soft smile-line planes beside the mouth corners; a hint of a soft plane under each eye; the neck a little shorter and "
  + "less elongated. Lips natural and unpainted: matte, a muted brown-rose only a little deeper than her skin, no lipstick, no coral, no gloss. "
  + "Hair: a more grown-up, tidy arrangement: the same centre parting, combed back smoothly into a neat low bun at the nape, with exactly one clean "
  + "graphic loose lock falling in front of each ear and no other loose strands or flyaways; the tops of the ears visible. Same teal handloom saree "
  + `with the rust-red border, same blouse, small gold studs. ${FACE_REST} ${BG}`;

const OUT_SAME = (desc) => `The same woman as in the input image, ${STYLE}. ${KEEP} Keep exactly her hair (centre parting, neat low bun, one loose lock `
  + `in front of each ear), her face and expression. Change only her clothing and earrings: ${desc} Small round oxidised-silver stud earrings replace `
  + "the gold studs. Modest, everyday, professional: a real teacher at work in a good city school, never glamorous; the neckline sits at or above the "
  + "collarbone; the cut is relaxed and straight, never figure-hugging; no dupatta, no saree, no jewellery beyond the studs. The fabric is drawn as "
  + `big flat colour planes with plum-violet fold shadows, like the rest of the image. ${FACE_REST} ${BG}`;

export const OUTFITS = {
  // 1: straight cotton kurta with a sparse indigo block print (dabu-like), band collar, short placket
  "o1-print": "a straight-cut cotton kurta in deep indigo-teal with a sparse, small ivory hand-block print (tiny scattered leaf-and-dot motifs, well spaced, "
    + "not dense, not a border), a soft standing band collar with a short front placket of three small fabric-covered buttons, the collar closed at the "
    + "collarbone; the sleeves are not visible in the crop.",
  // 2: kurta + a soft indigo denim jacket worn open
  "o2-denim": "a soft, slightly faded mid-indigo denim jacket with a small flat collar, worn open, over a plain deep-teal cotton kurta with a small round "
    + "neckline that sits at the collarbone; the jacket's seams and its chest pocket drawn as simple flat planes and thin lighter seam lines; a slim dark "
    + "pen clipped in the jacket's chest pocket on her left.",
  // 3: crisp cotton shirt-kurta with a shirt collar and a pen in the pocket
  "o3-shirt": "a crisp cotton shirt-kurta in a soft teal chambray, with a small proper shirt collar, a buttoned front placket with the top button open but "
    + "the neckline modest (closing at the collarbone), and a chest patch pocket on her left with a slim dark pen clipped in it.",
  // 4: soft open cardigan over a kurta
  "o4-cardigan": "a soft fine-knit open cardigan in a warm muted terracotta-rust, worn open over a plain deep-teal cotton kurta with a small round neckline "
    + "at the collarbone; the cardigan drawn as simple flat planes with a narrow ribbed front edge.",
  // round 2 (after the blind lineup: cardigan friendliest 5/5, denim coolest 5/5 but least professional 5/5, the print most
  // Indian): each layer over the band-collar block-print kurta
  "o5-denim-print": "a soft dark-indigo denim jacket with a small flat collar, worn open, neat and well-fitting (not oversized), over a straight-cut "
    + "cotton kurta in deep teal with a sparse, small ivory hand-block print (tiny scattered leaf motifs, well spaced, not dense) and a soft standing "
    + "band collar closed at the collarbone; a slim dark pen clipped in the jacket's chest pocket on her left.",
  "o6-cardigan-print": "a soft fine-knit open cardigan in a warm muted terracotta-rust, worn open, over a straight-cut cotton kurta in deep teal with a "
    + "sparse, small ivory hand-block print (tiny scattered leaf motifs, well spaced, not dense) and a soft standing band collar closed at the collarbone; "
    + "the cardigan drawn as simple flat planes with a narrow ribbed front edge.",
};

export const JOBS = {
  "age-a": { stage: "A", src: "w1-flat", prompt: AGE, quality: "high" },
  "age-b": { stage: "A", src: "w1-flat", prompt: AGE, quality: "high" },
};
for (const [id, d] of Object.entries(OUTFITS)) JOBS[id] = { stage: "A", src: "AGE_PICK", prompt: OUT_SAME(d), quality: "high" };

// ---- Stage B: the rig front (o6 + one more age step) and its edits
const WEAR = "the terracotta-rust open cardigan, the teal band-collar block-print kurta, the small oxidised-silver studs";
const RIGFRONT = `The same woman as in the input image, ${STYLE}. Keep exactly her identity, face, eyes, nose, brows, the small dark maroon bindi, `
  + `skin tone, hair arrangement (centre parting, neat low bun, one loose lock in front of each ear), ${WEAR}, the framing (front view, head and `
  + "shoulders, head upright and centred, same size and position) and the soft even frontal light. Change only these, subtly, so she reads as a "
  + "settled woman of about 35 (never older than 38, never tired, no grey hair, no wrinkles): a touch more fullness under the cheekbones and along "
  + "the jaw; slightly heavier, calmer upper eyelids; the faintest soft planes at the outer eye corners and from the nose wings toward the mouth "
  + "corners; the neat low bun a little lower and fuller at the nape. Lips natural and unpainted, matte brown-rose. Mouth closed with the lips "
  + "together, corners level and relaxed: a calm, pleasant resting face. Eyes open looking straight at the viewer, brows relaxed. "
  + BG;
JOBS["rig-a"] = { stage: "B", src: "o6-cardigan-print", prompt: RIGFRONT, quality: "high" };
JOBS["rig-b"] = { stage: "B", src: "o6-cardigan-print", prompt: RIGFRONT, quality: "high" };

// the expression set as edits of the chosen rig front (RIG_PICK = <scratch>/rig-pick.txt). Prompts follow the face agent's
// kept option-4 edits (gen.json: speak2, listen, think2, warm, blink), with the outfit words changed.
const SAMEB = "The same person as in the input image, drawn in exactly the same art style: identical face, proportions, skin tone, eyes, hair and "
  + `bun, bindi, earrings, ${WEAR}, framing, plain flat cream background and light. Front view, head and shoulders as in the input image. Change only what is described: `;
export const EXPR = {
  "x-speak": SAMEB + "she is mid-word, speaking calmly to a class: the mouth open on an 'aa' sound, the jaw dropped about a quarter, the lips relaxed, "
    + "the edge of the upper teeth and a little of the tongue visible, a soft dark mouth interior, the mouth corners relaxed. The eyes and brows stay "
    + "EXACTLY as in the input image (relaxed, not raised, not widened): an ordinary speaking face, not surprise.",
  "x-listen": SAMEB + "attentive listening: her head tilted about 6 degrees toward her right shoulder (the viewer's left), eyes on the viewer, brows "
    + "very slightly raised in interest, lips closed with the faintest softening at the corners. Calm and attentive.",
  "x-think": SAMEB + "thinking: her eyes glance clearly UPWARD and a little to the side (toward the top corner of the image), the head still facing "
    + "front and very slightly raised; the brows level and relaxed (not drawn together, not frowning, not raised), the lips closed and soft, a calm "
    + "inward look, as if recalling something. Composed, never sceptical, never a side-eye, never disapproving.",
  "x-warm": SAMEB + "a small, real, warm smile: lips closed or just parted, the corners lifted, the cheeks slightly raised so the lower lids lift a "
    + "little and faint smile lines appear at the outer eye corners. A teacher pleased with a good idea, not a grin, not coy.",
  "x-blink": SAMEB + "both eyes fully closed in a natural blink: the upper lids lowered to meet the lower lids, the lash line visible along each "
    + "closed lid, brows relaxed, mouth closed and neutral exactly as in the input image.",
  "x-mid": SAMEB + "both eyes half closed, caught in the middle of a blink: the upper lids lowered to about half way, covering the top half of the "
    + "irises, the lash line following the lowered lid, brows relaxed and unchanged, mouth closed and neutral exactly as in the input image.",
  // painted ~30 degree turn keys for the yaw keyform field (rj-p2d-small-turn-keys: 'small turn' prompts give 12-15 deg)
  "x-yawL": SAMEB + "her head and neck turned about 30 degrees toward the LEFT edge of the image (a clear three-quarter view, her nose pointing "
    + "toward the image's left), shoulders still facing front, eyes looking where her face points, mouth closed and neutral, the same light.",
  "x-yawR": SAMEB + "her head and neck turned about 30 degrees toward the RIGHT edge of the image (a clear three-quarter view, her nose pointing "
    + "toward the image's right), shoulders still facing front, eyes looking where her face points, mouth closed and neutral, the same light.",
};
for (const [id, p] of Object.entries(EXPR)) JOBS[id] = { stage: "B", src: "RIG_PICK", prompt: p, quality: "high" };
export { STYLE, KEEP, BG, FACE_REST };
