// Prompts for the round-4 face options. Shapes, light and materials only: nothing she could say appears anywhere.
// One identity for every family (so the owner compares style, not person); the style block is what varies.

export const WHO = "Subject: an Indian woman schoolteacher about 34 years old, clearly an adult, calm, composed and confident. "
  + "Warm medium-brown skin with natural variation (a little deeper around the eyes and along the jaw, warmer on the nose and cheeks), "
  + "no make-up. An oval face with a defined jaw and visible cheekbones, a straight medium nose with a softly rounded tip and natural nostrils, "
  + "natural full lips with the lower lip slightly fuller, dark brown almond-shaped eyes with natural lids and a faint fold under each eye, "
  + "thick natural dark eyebrows with a gentle arch, very faint lines at the outer eye corners and beside the nose that come with her age, "
  + "a slight natural asymmetry. Thick black hair with a soft wave, a centre parting, combed back smoothly into a neat low bun at the nape, "
  + "a few fine loose strands at the temples, the tops of the ears visible. A small dark maroon bindi, small plain gold stud earrings. "
  + "She wears a deep teal cotton handloom saree with a narrow rust-red woven border, the pleated pallu laid neatly over her left shoulder, "
  + "and a matching teal cotton blouse with a high round neckline and elbow-length sleeves. Modest, everyday, professional: a real teacher "
  + "at work, never glamorous, no beauty-filter skin, no lipstick, no jewellery beyond the studs.";

export const RIG = "Character-design front portrait for animation: perfectly front-facing, head and shoulders, head upright and centred, "
  + "the top of the hair close to the top edge with a small margin, the shoulders cut by the bottom edge. Eyes open looking straight at the viewer, "
  + "mouth closed and relaxed with the lips together in a neutral resting expression, brows relaxed. No hair crossing the eyes or brows. "
  + "Soft even frontal light with gentle form shading, no hard cast shadows across the face. Plain flat warm cream background with nothing on it. "
  + "No hands, no props, no text, no letters, no logo, no watermark, no frame, no border.";

export const STYLE = {
  S_paint: "Style: a premium hand-painted character portrait for a narrative video game. A confident drawing with real adult proportions "
    + "(head very slightly large, eyes very slightly larger than life, never cartoon eyes), painted in digital oil and gouache with visible "
    + "directional brush strokes, the planes of the face (forehead, cheekbone, jaw, nose bridge, the area around the mouth) described by clear, "
    + "simplified value shapes, rich natural colour, crisp silhouette edges. Painterly concept-art finish for a stylised animated film; "
    + "not a 3D render, not a photograph, not a cartoon, not anime.",
  S_ink: "Style: key art for a premium stylised animated series. A strong graphic drawing with real adult proportions (head very slightly large, "
    + "eyes only slightly larger than life, never cartoon eyes): clean dark-umber contour lines of varying weight, the planes of the face described "
    + "by flat painted value shapes with soft brushed transitions, a subtle hand-painted texture, a limited warm palette, crisp shapes that read "
    + "at small sizes. Not a 3D render, not a photograph, not a children's cartoon, not anime.",
  A_film: "Style: a Japanese animated feature film for a grown-up audience, character design of an adult woman. Clean thin line art, soft "
    + "shading with two tones and gentle gradients, adult facial proportions: a defined jaw and cheekbones, a drawn nose bridge and nostrils, "
    + "a mouth of natural width with both lips drawn. Eyes larger than real but with an adult almond shape, natural upper lids, lower lashes "
    + "and detailed dark brown irises with one soft highlight. Calm, assured expression. Not chibi, not moe, not an idol or a schoolgirl, "
    + "no blush stickers, no sparkles.",
  A_cel: "Style: precise mature anime character design in the manner of a grown-up police or drama series: crisp confident line art, hard-edged "
    + "cel shading with one shadow tone and one highlight, adult facial structure with a defined jaw, cheekbones and a drawn nose, a natural-width "
    + "mouth, eyes moderately larger than real with an adult almond shape, heavy-ish upper lids, lower lashes and dark brown irises. "
    + "Grounded, intelligent, composed. Not chibi, not moe, not idol, not schoolgirl, no blush stickers, no sparkles.",
};

// the expression set: edits of the chosen front (identity carried by pixels, not text)
const SAME = "The same person as in the input image, drawn in exactly the same art style: identical face, proportions, skin tone, eyes, hair and bun, "
  + "bindi, earrings, saree, blouse, framing, plain cream background and light. Front view, head and shoulders as in the input image. "
  + "Change only what is described: ";
export const EXPR = {
  speak: SAME + "her mouth holds one sustained open 'aa' vowel, as if mid-word: the jaw dropped about a third, the lips relaxed and open in a soft "
    + "rounded shape, the edge of the upper teeth and the tongue resting low just visible, a soft dark mouth interior. Eyes open on the viewer, "
    + "brows neutral. Only the mouth, jaw and cheeks change.",
  listen: SAME + "attentive listening: her head tilted about 6 degrees toward her right shoulder (the viewer's left), eyes on the viewer, brows very "
    + "slightly raised in interest, lips closed with the faintest softening at the corners. Calm and attentive.",
  think: SAME + "thinking: her eyes glance up and to the side, toward the upper left of the image, while the head stays facing front; brows "
    + "slightly drawn together in concentration, lips closed and gently pressed. Composed, not worried.",
  warm: SAME + "a small, real, warm smile: lips closed or just parted, the corners lifted, the cheeks slightly raised so the lower lids lift a little "
    + "and faint smile lines appear at the outer eye corners. A teacher pleased with a good idea, not a grin, not coy.",
  blink: SAME + "both eyes fully closed in a natural blink: the upper lids lowered to meet the lower lids, the lash line visible along each closed "
    + "lid, brows relaxed, mouth closed and neutral exactly as in the input image.",
};

const gen = (family, style, extra = "") => ({ kind: "gen", family, prompt: `${STYLE[style]} ${WHO} ${RIG}${extra ? " " + extra : ""}` });
const edit = (family, src, e) => ({ kind: "edit", family, src, prompt: EXPR[e] });

export const JOBS = {
  // round 1 fronts: two style variants per family
  "s1-paint": gen("stylised", "S_paint"),
  "s1-ink": gen("stylised", "S_ink"),
  "a1-film": gen("anime", "A_film"),
  "a1-cel": gen("anime", "A_cel"),
};

// round 2 (after looking at round 1): the realistic identity block pulled every style toward realism (both anime
// fronts came back as realistic illustration) and the "neutral" mouth read stern. Round 2 states the age as ~32,
// asks for a pleasant open resting face, and gives the anime family its own identity block in anime terms.
export const REST = "Her resting face is pleasant and open: the mouth closed with the corners level and relaxed (never downturned), "
  + "a quiet warmth in the eyes, the forehead smooth, the look of someone about to explain something she likes.";
export const WHO_ANIME = "Subject: an Indian woman schoolteacher about 32 years old, clearly an adult, calm, composed and confident. "
  + "Drawn in anime terms: a slender adult oval face with a defined jaw line and visible cheekbones, a long straight nose drawn with a fine bridge "
  + "line and a small shadow under the tip, a mouth of natural width with a thin upper-lip line and a soft lower-lip tone, almond-shaped eyes "
  + "about a third larger than real with a clear dark upper lash line, a short outer flick, a few lower lashes, dark brown irises with one soft "
  + "highlight, thick defined dark brows with a gentle arch. Warm medium-brown skin (clearly brown, never pale or grey) painted as one flat "
  + "base tone with one soft shadow tone and a faint warm tone on the nose and cheeks; no blush marks. Thick black hair with soft highlights, "
  + "a centre parting, combed back smoothly into a neat low bun at the nape, a few fine loose strands at the temples, the tops of the ears visible. "
  + "A small dark maroon bindi, small plain gold stud earrings. A deep teal cotton handloom saree with a narrow rust-red woven border, the pleated "
  + "pallu laid neatly over her left shoulder, a matching teal blouse with a high round neckline and elbow-length sleeves. Modest, everyday, "
  + "professional: a real teacher at work, never glamorous, no make-up, no jewellery beyond the studs.";
export const STYLE2 = {
  S_game: "Style: a stylised painted character portrait of the craft level of a premium narrative video game or a painterly animated series. "
    + "Stylised, designed shapes over real adult proportions: the face built from a few clear simplified planes (forehead, cheekbone, jaw, "
    + "nose bridge), slightly elongated elegant forms, eyes only slightly larger than life with painted lids (never cartoon eyes), hair as a few "
    + "big painted masses with a handful of crisp strands. Hand-painted texture with visible brush strokes over clean colour shapes, a confident "
    + "dark-umber drawing line in places, rich warm colour, crisp edges that read at small sizes. Clearly an illustration, not a photograph, "
    + "not a 3D render, not a children's cartoon, not anime.",
  A_anime: "Anime illustration. Cel-shaded character art in the look of a contemporary Japanese animated feature film for a grown-up audience: "
    + "clean thin dark-brown line art, flat base colours with one crisp shadow tone and gentle gradient highlights, simplified anime facial "
    + "construction with adult proportions (a long neck, a defined jaw, a small elegant nose, eyes larger than real but adult and almond-shaped). "
    + "Calm, assured, intelligent. Not chibi, not moe, not an idol, not a schoolgirl, no sparkles, no blush stickers, not a realistic painting.",
  A_anime_soft: "Anime illustration. Soft-shaded anime character art in the look of a contemporary Japanese animated film with painted-light "
    + "backgrounds: fine coloured line art, soft two-tone shading with airbrushed gradients, luminous but natural colour, simplified anime facial "
    + "construction with adult proportions (a defined jaw, cheekbones, a small elegant nose, eyes larger than real but adult and almond-shaped with "
    + "detailed irises). Calm and quietly confident. Not chibi, not moe, not an idol, not a schoolgirl, no sparkles, no blush stickers, not a "
    + "realistic painting.",
};
const WHO32 = WHO.replace("about 34 years old", "about 32 years old");
Object.assign(JOBS, {
  "s2-game": { kind: "gen", family: "stylised", prompt: `${STYLE2.S_game} ${WHO32} ${REST} ${RIG}` },
  "s2-paint": { kind: "gen", family: "stylised", prompt: `${STYLE.S_paint} ${WHO32} ${REST} ${RIG}` },
  "a2-cel": { kind: "gen", family: "anime", prompt: `${STYLE2.A_anime} ${WHO_ANIME} ${REST} ${RIG} Anime cel-shaded illustration.` },
  "a2-soft": { kind: "gen", family: "anime", prompt: `${STYLE2.A_anime_soft} ${WHO_ANIME} ${REST} ${RIG} Anime illustration.` },
});

// expression jobs are added per chosen front with addExpr(front)
export function addExpr(family, front) {
  for (const e of Object.keys(EXPR)) JOBS[`${front}--${e}`] = edit(family, front, e);
}

// round 3 (after round 2): both stylised fronts came back as near-realistic painted portraits (credible, but not the
// designed stylisation the brief asks for, and a realistic face on a warp puppet risks the animated-photo uncanny);
// a2-cel is real anime but flat and TV-basic; a2-soft reads mid-20s and idealised. Round 3 names the shape language.
export const STYLE3 = {
  S_planes: "Style: a stylised hand-painted character portrait at the craft level of a premium painterly animated series. The forms are "
    + "designed, simplified and slightly exaggerated over real adult proportions: a clear brow-ridge plane, sculpted cheekbone planes, a crisp "
    + "defined jawline, a long elegant nose with a distinct bridge plane, eyes a little larger than life with painted heavy-ish upper lids (never "
    + "cartoon eyes), lips simplified into two clean painted shapes. Skin painted in a few big colour planes with warm sienna shadows and a cool "
    + "reflected light under the jaw, visible confident brush strokes, a few hand-drawn dark line accents on the lids, nostrils and lip line, hair "
    + "painted as large sculpted masses with crisp highlight strokes. Clearly a designed illustration: not a photograph, not a realistic oil "
    + "portrait, not a 3D render, not a children's cartoon, not anime.",
  S_graphic: "Style: a premium indie-game character portrait. Bold, graphic and painterly: a confident ink drawing with tapered dark-umber lines "
    + "of varied weight around the face, the eyes, the nose and the hair masses; colour laid in flat shapes with two or three painted values each "
    + "and soft brushed edges; strong simplified anatomy over real adult proportions (a defined jaw, cheekbones, a long nose with a clear bridge, "
    + "eyes a little larger than life with heavy upper lids); a subtle paper and brush texture. Designed to read at thumbnail size. Not a "
    + "photograph, not a realistic oil portrait, not a 3D render, not a children's cartoon, not anime.",
  A_film2: "Anime illustration. A theatrical-quality anime key frame of an adult woman, in the look of a contemporary Japanese animated feature "
    + "film for a grown-up audience: precise fine line art with varied weight, painted soft shading with a second shadow tone and warm sienna "
    + "colour in the shadows of the brown skin, hair rendered with clean highlight bands, delicate eyes (a thick upper lash line, a visible "
    + "upper-lid crease, an iris with a soft gradient and two small highlights), a subtle film grain. Mature anime design for a woman in her "
    + "thirties: eyes larger than real but narrower and calmer than a teenager's, a slightly heavier upper lid, a defined nose bridge and tip, "
    + "a natural-width mouth, a defined jaw and cheekbones, a level, intelligent gaze. Not chibi, not moe, not an idol, not a schoolgirl, "
    + "no sparkles, no blush stickers, not a realistic painting.",
  A_cel2: "Anime illustration. A precise mature-anime character design sheet front view, in the look of a high-end grown-up anime drama "
    + "series: crisp confident line art, hard-edged cel shading with one shadow tone and one highlight tone plus a soft rim of warm light, adult "
    + "facial structure with a defined jaw, cheekbones and a drawn nose bridge, a natural-width mouth with both lips indicated, eyes moderately "
    + "larger than real with an adult almond shape, a visible upper-lid crease and a few lower lashes, dark brown irises with a single highlight. "
    + "Composed, warm, assured; a woman in her thirties, not a girl. Not chibi, not moe, not an idol, not a schoolgirl, no sparkles, no blush "
    + "stickers, not a realistic painting.",
};
Object.assign(JOBS, {
  "s3-planes": { kind: "gen", family: "stylised", prompt: `${STYLE3.S_planes} ${WHO.replace("about 34 years old", "about 33 years old")} ${REST} ${RIG}` },
  "s3-graphic": { kind: "gen", family: "stylised", prompt: `${STYLE3.S_graphic} ${WHO.replace("about 34 years old", "about 33 years old")} ${REST} ${RIG}` },
  "a3-film": { kind: "gen", family: "anime", prompt: `${STYLE3.A_film2} ${WHO_ANIME.replace("about 32 years old", "about 34 years old")} ${REST} ${RIG} Anime illustration.` },
  "a3-cel": { kind: "gen", family: "anime", prompt: `${STYLE3.A_cel2} ${WHO_ANIME.replace("about 32 years old", "about 34 years old")} ${REST} ${RIG} Anime cel-shaded illustration.` },
});

// round 4 (stylised only): three tries came back as semi-real painted portraits. As with the anime family, the realistic
// identity block (fine lines, asymmetry, under-eye folds) is what pulls toward realism, so this block states the same
// identity in character-design terms.
export const WHO_DESIGN = "Subject: an Indian woman schoolteacher about 33 years old, clearly an adult, calm, composed and confident. "
  + "Described as a character design: a long oval face with a crisp, defined jaw and high sculpted cheekbones, a long straight nose with a clear "
  + "bridge plane and a rounded tip, a natural-width mouth with a fuller lower lip, dark brown almond eyes a little larger than life under heavy, "
  + "clearly drawn upper lids, thick dark brows with a gentle arch, a long neck. Warm medium-brown skin (clearly brown) painted in big planes: a "
  + "lit plane, a warm sienna shadow plane and a cool reflected light under the jaw; no make-up. Thick black hair as large sculpted masses with "
  + "crisp highlight strokes, a centre parting, combed back smoothly into a neat low bun at the nape, two or three graphic loose strands at the "
  + "temples, the tops of the ears visible. A small dark maroon bindi, small plain gold stud earrings. A deep teal cotton handloom saree with a "
  + "narrow rust-red woven border, the pleated pallu laid neatly over her left shoulder, a matching teal blouse with a high round neckline and "
  + "elbow-length sleeves. Modest, everyday, professional: a real teacher at work, never glamorous.";
export const STYLE4 = {
  S_feature: "Style: stylised character art for a hand-painted animated feature for a grown-up audience, the kind of painterly stylisation where "
    + "sculpted, simplified forms are covered in visible painted brush texture. Elegant, slightly elongated proportions; every form is a designed "
    + "shape with a clean silhouette; painterly brush strokes inside the shapes; a few confident dark line accents. Clearly stylised and designed: "
    + "not a photograph, not a realistic portrait painting, not a glossy 3D render, not a children's cartoon, not anime.",
  S_poster: "Style: a stylised character portrait in the manner of a premium painted game: graphic, bold, simplified. Big clean colour shapes "
    + "with hard and soft edges, each form painted in two or three values with brush texture, tapered dark ink lines on the eyes, brows, nose, "
    + "lips, jaw and hair masses, strong graphic shapes that read at thumbnail size, stylised but credible adult anatomy. Clearly a designed "
    + "illustration: not a photograph, not a realistic portrait painting, not a 3D render, not a children's cartoon, not anime.",
};
Object.assign(JOBS, {
  "s4-feature": { kind: "gen", family: "stylised", prompt: `${STYLE4.S_feature} ${WHO_DESIGN} ${REST} ${RIG}` },
  "s4-poster": { kind: "gen", family: "stylised", prompt: `${STYLE4.S_poster} ${WHO_DESIGN} ${REST} ${RIG}` },
});

// round 5: anime warmth + premium rendering (a3 reads mature but cool, and the hard nose/neck shadow dominates at chip
// size); and a possible fourth family, drawn in the Prakash world's own light model (world SPEC §1.1, §5: flat layered
// shapes, shadows coloured violet never black, one warm lamp light) so the face is not a different art style from the
// place she lives in (AUDIT §5 cause 1).
export const STYLE5 = {
  A_warm: "Anime illustration. A theatrical-quality anime key frame of an adult woman, in the look of a contemporary Japanese animated feature "
    + "film for a grown-up audience, rendered with premium care: precise fine line art with varied weight, soft painted shading with gentle "
    + "gradients and warm sienna colour in the shadows of the brown skin, no hard shadow down the side of the nose or across the neck, hair "
    + "rendered with layered highlight bands and a few fine strands, eyes with a thick upper lash line, a visible upper-lid crease, a detailed iris "
    + "gradient and two small highlights, a subtle film grain. Mature anime design for a woman in her thirties: eyes larger than real but calmer "
    + "and narrower than a teenager's, a defined nose bridge and tip, a natural-width mouth, a defined jaw and cheekbones. Kind, steady eyes and "
    + "the faintest lift at the mouth corners: warm, assured, intelligent. Not chibi, not moe, not an idol, not a schoolgirl, no sparkles, no "
    + "blush stickers, not a realistic painting.",
  W_flat: "Style: a premium flat-shaded illustration built like layered vector art, in the light of a lamplit dusk: every form is a clean flat "
    + "colour shape with soft gradient transitions between a lit tone, a mid tone and a shadow tone; the shadows on the skin and the cloth are "
    + "tinted plum-violet, never black or grey; warm lamp-gold light on the lit planes; almost no outlines, the features drawn by shape and tone "
    + "(a few fine dark accents only on the lash line, nostrils and the line between the lips). Stylised but credible adult anatomy, elegant and "
    + "simplified, designed to read at thumbnail size. Not a photograph, not a realistic painting, not a 3D render, not a children's cartoon, "
    + "not anime, no texture noise.",
};
Object.assign(JOBS, {
  "a4-warm": { kind: "gen", family: "anime", prompt: `${STYLE5.A_warm} ${WHO_ANIME.replace("about 32 years old", "about 34 years old")} ${REST} ${RIG} Anime illustration.` },
  "w1-flat": { kind: "gen", family: "world", prompt: `${STYLE5.W_flat} ${WHO_DESIGN} ${REST} ${RIG}` },
});

// picks, made by eye before any blind-judge result was seen: stylised s3-graphic, anime a3-film, world w1-flat
addExpr("stylised", "s3-graphic");
addExpr("anime", "a3-film");
addExpr("world", "w1-flat");

// a3-film--think read as sceptical/disapproving (knitted brows): a face that can read as a verdict breaks the
// verdict-neutral rule (TEACHER-VISUAL §6). Retry with level brows; only the gaze moves.
JOBS["a3-film--think2"] = { kind: "edit", family: "anime", src: "a3-film", prompt: EXPR.think.split("Change only what is described: ")[0]
  + "Change only what is described: thinking: her eyes glance up and to the side while the head stays facing front; the brows stay level and "
  + "relaxed (not drawn together, not frowning), the lips closed and soft, a calm inward look, as if recalling something pleasant. Composed, "
  + "never sceptical, never disapproving." };

// round 6 (after the blind identity check, n=3 brain + 2 kimi per family): every horizontal side-glance thinking
// frame read as a sceptical / disapproving side-eye (brain 3/3 for stylised, world and line), which breaks the
// verdict-neutral rule; the anime think2 (level brows) read as calm. And the "aa" frames read as "surprised" (brows up,
// eyes wide). Retry both with the gaze UP and to the side, brows level, and a mid-word mouth with relaxed brows.
const BASE = EXPR.think.split("Change only what is described: ")[0] + "Change only what is described: ";
const THINK2 = BASE + "thinking: her eyes glance clearly UPWARD and a little to the side (toward the top corner of the image), the head "
  + "still facing front and very slightly raised; the brows level and relaxed (not drawn together, not frowning, not raised), the lips closed "
  + "and soft, a calm inward look, as if recalling something. Composed, never sceptical, never a side-eye, never disapproving.";
const SPEAK2 = BASE + "she is mid-word, speaking calmly to a class: the mouth open on an 'aa' sound, the jaw dropped about a quarter, the "
  + "lips relaxed, the edge of the upper teeth and a little of the tongue visible, a soft dark mouth interior, the mouth corners relaxed. The "
  + "eyes and brows stay EXACTLY as in the input image (relaxed, not raised, not widened): an ordinary speaking face, not surprise.";
Object.assign(JOBS, {
  "s3-graphic--think2": { kind: "edit", family: "stylised", src: "s3-graphic", prompt: THINK2 },
  "w1-flat--think2": { kind: "edit", family: "world", src: "w1-flat", prompt: THINK2 },
  "s3-graphic--speak2": { kind: "edit", family: "stylised", src: "s3-graphic", prompt: SPEAK2 },
  "a3-film--speak2": { kind: "edit", family: "anime", src: "a3-film", prompt: SPEAK2 },
  "w1-flat--speak2": { kind: "edit", family: "world", src: "w1-flat", prompt: SPEAK2 },
});
