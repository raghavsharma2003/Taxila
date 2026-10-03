// Builds docs/design/assets/MANIFEST.json and the asset list section of CODEX-PROMPT.md from one table,
// so the two can never disagree. Run: node docs/design/assets/build-manifest.mjs <repoRoot> <scratchDir>
// It also assembles CODEX-PROMPT.md from codex-prompt.template.md + taxila-assetkit.py + the list.
import fs from "node:fs";
import path from "node:path";

const ROOT = process.argv[2] || "/home/user/Taxila";
const OUT = path.join(ROOT, "docs/design/assets");
fs.mkdirSync(OUT, { recursive: true });

const assets = [];
const G = "public/assets/gen";
// native generation canvases the image tool is assumed to support (gpt-image family)
const NAT = { sq: "1024x1024", land: "1536x1024", port: "1024x1536" };

function add(a) {
  const [w, h] = a.size.split("x").map(Number);
  const g = (x, y) => (x % y === 0 ? y : g(y, x % y));
  const d = g(w, h);
  const r = w / h;
  const native = a.native || (Math.abs(r - 1) < 0.01 ? NAT.sq : r > 1 ? NAT.land : NAT.port);
  const [nw, nh] = native.split("x").map(Number);
  // scale needed after an aspect crop of the native canvas
  const cropW = Math.min(nw, Math.round(nh * r)), cropH = Math.min(nh, Math.round(nw / r));
  const up = +(Math.max(w / cropW, h / cropH)).toFixed(2);
  const method = a.method || (up > 2.05 ? "tile" : "crop-resize");
  assets.push({
    id: a.id,
    path: a.path,
    category: a.id.split("/")[0],
    generator: a.generator || "codex",
    batch: a.batch,
    width: w, height: h, aspect: `${w / d}:${h / d}`,
    format: a.format, alpha: !!a.alpha,
    ships: a.ships !== false,
    style: a.style,
    purpose: a.purpose,
    screens: a.screens,
    specRef: a.specRef,
    description: a.description,
    subject: a.subject || a.description,
    references: a.references || [],
    generate: a.generator === "rig-render" ? null : { native, crop: `${cropW}x${cropH}`, scale: up, method },
    lint: a.lint || (a.ships === false ? "reference-only" : "lamp-hue"),
    ...(a.priority ? { priority: a.priority } : {}),
    ...(a.notes ? { notes: a.notes } : {}),
  });
}

// ───────────────────────── A. BACKGROUNDS (spec §12 A1–A15; WebP masters) ─────────────────────────
const bgPair = (stem, batch, style, purpose, screens, specRef, description, references) => {
  for (const [crop, size, comp] of [
    ["wide", "2560x1440", "Landscape crop for 1280 laptops. Detail at the left and right edges; the centre third stays calm."],
    ["phone", "1440x2560", "Portrait crop for 360-wide phones, the SAME scene and camera as the wide version recomposed tall. Keep the subject band in the top 40%; the lower 60% is calm, low-contrast ground for cards."],
  ]) {
    add({ id: `bg/${stem}-${crop}`, path: `${G}/bg/${stem}-${crop}.webp`, size, format: "webp", batch, style, purpose, screens, specRef,
      subject: crop === "wide" ? description : `the same scene as bg/${stem}-wide, recomposed tall`, description: `${description} ${comp}`,
      references: [...new Set(references(crop).concat(crop === "phone" ? [`bg/${stem}-wide`] : []))] });
  }
};
const anchorRef = () => ["bg/home-young-wide"];

bgPair("home-young", "B00", "world-young", "Painted ground of the Young child home (the sunlit courtyard). Teacher window sits in the empty veranda doorway.",
  ["Child home, Young (B1-B2) §6.3.3", "1280 Young home full-bleed §6.3.3"], "§12 A1",
  "A sunlit Indian home courtyard in calm morning light. Limewash walls in warm off-white with soft cream light from the upper left. A neem tree at the right edge with its leaf shadows on the wall. An open wooden veranda doorway at the LEFT, EMPTY and calm inside (the teacher is placed there by the app). White rice-flour kolam dots on the floor near the edges only. Two terracotta pots with leafy plants and a magenta bougainvillea spray. A charpai with teal cotton-tape weave at the far edge. A band of pale day sky (#A9D8E8) at the top. Painted garden beds along the lower right wall edge (bare soil, the app makes them tappable on desktop).",
  () => []);
bgPair("home-young-rest", "B01", "world-young", "Young home outside lesson hours (state `resting`).",
  ["Child home, Young, plan state `resting` §6.3.3"], "§12 A2",
  "The SAME courtyard as bg/home-young (same walls, tree, doorway, pots, charpai, same camera) in late-afternoon cream light with longer soft shadows. An open book with blank pages resting on the charpai. The doorway is still empty. Calm, slightly quieter than the morning version.", anchorRef);
bgPair("home-older", "B01", "world-older", "Painted ground of the Older child home (the rooftop at dusk).",
  ["Child home, Older (B3-B4) §6.3.3", "1280 Older home"], "§12 A3",
  "A flat Indian rooftop at dusk, editorial and muted. A black plastic water tank on a low brick stand at one edge, a simple painted iron rail, a telescope on a tripod pointing at the sky, a string of UNLIT bulbs on a wire, city lights far below as tiny cool-white and soft-rose points (never orange street lights). Deep indigo sky (#26304A to #0F1A33) with a faint rose-violet glow at the horizon (never orange or gold). Lots of negative space.",
  () => ["bg/home-young-wide"]);
bgPair("home-older-rest", "B01", "world-older", "Older home outside lesson hours (state `resting`).",
  ["Child home, Older, plan state `resting` §6.3.3"], "§12 A4",
  "The SAME rooftop as bg/home-older (same tank, rail, telescope, camera) later at night: deeper navy sky (#0F1A33), the telescope pointing straight up, no lit signs below, a few soft city lights. No stars painted (the app owns stars).", (c) => ["bg/home-older-wide"]);
bgPair("who", "B01", "world-young", "Ground of the profile picker. Bright enough for Young, calm enough for Older households.",
  ["Who is learning? /who §6.3.1"], "§12 A5",
  "The same home's courtyard gate seen from outside: an open weathered wooden gate in greyed walnut, a short stone path, the sunlit courtyard visible beyond (same limewash walls and neem tree as bg/home-young), a calm arch over the gate. The lower two-thirds are calm and low-detail for avatar tiles.", (c) => ["bg/home-young-wide"]);
bgPair("practice", "B01", "world-young", "Quick practice ground (tier A-C).",
  ["Quick practice /c/:cid/practice §6.3.7", "Practice summary §3.6"], "§12 A10",
  "A quiet courtyard corner of the same home: a big BLANK black slate on a simple wooden easel at one edge, a woven floor mat, a closed steel tiffin, soft cream light. The centre is calm and empty.", (c) => ["bg/home-young-wide"]);
bgPair("ask", "B02", "world-older", "Ask a question ground (Older only).",
  ["Ask a question /c/:cid/ask §6.3.7"], "§12 A11",
  "A study desk on the same rooftop at dusk: an open textbook with BLANK pages, a pencil, a steel tumbler, the rail and indigo sky behind, muted and editorial. The centre third is calm for the text field.", (c) => ["bg/home-older-wide"]);
bgPair("notebook-shelf", "B02", "world-neutral", "Notebook ground (both bands).",
  ["Notebook /c/:cid/notebook §6.3.7"], "§12 A12",
  "A wooden wall shelf in desaturated greyed-walnut wood holding a few CLOSED blank cloth-bound notebooks (teal, rose, leaf, stone covers, no labels) and one small potted plant, soft cream light from the upper left, limewash wall. The centre is calm for the page stack.", (c) => ["bg/home-young-wide"]);

const one = (id, size, batch, style, purpose, screens, specRef, description, references = [], extra = {}) =>
  add({ id: `bg/${id}`, path: `${G}/bg/${id}.webp`, size, format: "webp", batch, style, purpose, screens, specRef, description, references, ...extra });
one("stage-young", "1600x1600", "B01", "stage", "The TeacherWindow ground for Young lessons, behind the 3D face, on tier A-C (blurred by the app).",
  ["Lesson Desk, Young: TeacherWindow and SpeechRow §6.3.4", "Hello §6.3.2", "Summary §6.3.5", "Help sheet §6.4.9"], "§12 A6",
  "A softly out-of-focus veranda at dusk seen behind a head-and-shoulders position: deep dusk blue (#26304A) overall, the edge of a large BLANK green chalkboard (#1F3B30) at one side, a warm soft pool of CREAM light centred at x 50%, y 38%. The centre is plain and smooth (her face goes there). No person.", ["bg/home-young-wide"]);
one("stage-older", "1600x1600", "B02", "stage", "The TeacherWindow ground for Older lessons, behind the 3D face, on tier A-C.",
  ["Lesson Desk, Older: TeacherWindow and SpeechRow §6.3.4", "Summary §6.3.5", "Help sheet §6.4.9"], "§12 A7",
  "A softly out-of-focus study wall in evening light: a bookshelf with BLANK spines, a window with neem leaves, the same dusk blue (#26304A) and the same cream light pool at x 50%, y 38% as bg/stage-young. The centre is plain and smooth. No person.", ["bg/stage-young"]);
one("garden-panorama", "4800x1200", "B01", "world-young", "The Garden map ground: a horizontal panorama, 3x the screen width, beds are chapters.",
  ["Garden /c/:cid/map (Young) §3.8, §6.3.7"], "§12 A8",
  "A long kitchen-garden strip along the courtyard wall of the same home in morning light: a row of low brick-edged beds of BARE dark soil (the app places plants on them), a garden tap with a steel bucket, a neem tree at one end, limewash wall behind. No plants in the beds. The LEFT and RIGHT edges must join seamlessly (it scrolls).", ["bg/home-young-wide"], { method: "tile",
    notes: "Generate as 3 landscape panels, each continuing the previous panel's right edge (image edit / outpaint with the previous panel as input); crop each to 4:3, scale to 1600x1200, stitch with a 96 px cross-fade; then make panel 3's right edge match panel 1's left edge." });
one("sky-panel", "2400x1600", "B02", "world-older", "The Sky map ground. Stars, edges and labels are drawn by the app in SVG.",
  ["Sky map /c/:cid/map (Older) §3.8, §6.3.7"], "§12 A9",
  "A calm deep-navy night sky (#0F1A33) with faint painted clouds near the bottom and a far city skyline silhouette with NO lit signs. NO stars, no moon, no planets: the sky is empty for the app's stars.", ["bg/home-older-wide"]);
one("onboarding-edge", "1200x2400", "B02", "world-neutral", "Desktop onboarding: the ground around the centred 560 card.",
  ["Onboarding /start/1-9 at 1280 §5.2, §6.2"], "§12 A13",
  "A quiet vertical edge strip: a parent's hand resting near a face-down phone on a kitchen table, a steel cup of chai, very low contrast, everything on the RIGHT edge; the left two-thirds are near-empty warm paper (#F6F3EC) tone.", ["bg/home-young-wide"], { lint: "lamp-hue, skin-review" });
one("landing-hero", "2400x1400", "B02", "world-older", "Landing hero ground. The app composites the Asha and Arjun rig stills centre-right.",
  ["Landing / hero 360 and 1280 §6.1.1"], "§12 A14",
  "A warm study desk at dusk, editorial: a child's BLANK notebook and a pencil at the lower left, a steel tumbler, a window with dusk indigo sky, soft cream light from the upper left. An EMPTY calm space centre-right where two portraits are composited. No person.", ["bg/home-older-wide"]);
one("parent-header", "2400x600", "B02", "world-neutral", "A quiet header band for the parent corner (1280) and the lesson card.",
  ["Parent home 1280 §6.5.1", "Lesson card §6.5.3"], "§12 A15",
  "A quiet limewash wall with a single leafy plant in a terracotta pot at the right edge and soft cream light from the upper left; very low detail, most of the band is plain wall.", ["bg/home-young-wide"]);

// ───────────────────────── B. AVATARS (24) ─────────────────────────
const avatars = {
  "red-panda": "a red panda sitting, rust-red fur (deep rust, not orange), ringed tail curled round",
  "tiger-cub": "a tiger cub lying with paws forward, fur painted deep rust-terracotta (never bright orange or gold), dark stripes",
  "elephant-calf": "an elephant calf with its trunk curled up, soft grey",
  "river-dolphin": "a Ganges river dolphin arcing out of water, grey-pink, long slim beak",
  hornbill: "an Indian grey hornbill on a branch, soft greys, dark grey casque (no yellow casque)",
  peacock: "a peacock in profile with its tail folded, teal and blue body, tail shown as a closed sweep (no fan of eyes)",
  turtle: "a small turtle with a leaf-green shell walking",
  butterfly: "a blue Mormon butterfly, wings open, deep blue and black",
  squirrel: "an Indian palm squirrel holding a nut, grey-brown with three pale back stripes",
  camel: "a young camel sitting, pale greyish-fawn coat (low saturation, never golden sand)",
  rhino: "a one-horned rhino calf, slate grey, gentle",
  "snow-leopard": "a snow leopard cub with a thick tail, pale grey with soft rosettes",
  kite: "a diamond paper kite with a tail, teal and rose, string trailing (no yellow)",
  rocket: "a small rounded rocket with a teal body, cream nose and a soft white puff below",
  football: "a classic football on grass, white and ink-blue panels, no logo",
  "cricket-bat": "a cricket bat in pale low-saturation willow with a rose grip and a red ball, no logo, no stickers",
  mango: "a raw green mango (kairi) with two leaves and a soft rose blush (not ripe yellow)",
  sunflower: "a white-petalled sunflower variety with a dark centre (cream-white petals, never yellow)",
  mountain: "a snowy mountain peak with a pine at its foot",
  sailboat: "a small sailboat with a white sail on calm water",
  "auto-rickshaw": "an Indian auto-rickshaw seen three-quarter, leaf-green body and cream roof, no number plate, no text",
  bicycle: "a simple bicycle with a front basket, ink-blue frame",
  telescope: "a small telescope on a tripod, ink-blue tube, steel fittings (no brass)",
  paintbrush: "a paintbrush with a teal handle and a wet rose tip, a small dab of paint",
};
const tints = ["teal", "rose", "leaf", "sky", "terracotta", "stone"];
Object.entries(avatars).forEach(([name, subj], i) =>
  add({ id: `avatars/${name}`, path: `${G}/avatars/${name}.png`, size: "512x512", format: "png", alpha: true, batch: i === 0 ? "B00" : "B04", style: "sprite",
    purpose: "Child profile picture, chosen at Hello. Never a human face.",
    screens: ["Who is learning? tiles §6.3.1", "Hello card 3 Pick your picture §6.3.2", "Me: My picture §6.3.8", "Older top bar (Me) §5.2", "Parent: Children §6.5.5"],
    specRef: "§7.5, §12 B", references: i === 0 ? [] : ["avatars/red-panda"],
    subject: `${subj}; disc tint ${tints[i % 6]}`, description: `${subj}, centred on a painted circular paper disc tinted ${tints[i % 6]} (soft, matte, with paper grain); the disc fills 92% of the frame; outside the disc is fully transparent. Friendly, not cartoonish; no face-on-object cartoon features unless it is an animal.` }));

// ───────────────────────── C. INTERESTS (12) ─────────────────────────
const interests = {
  cricket: "a cricket bat in pale willow, a red ball and three stumps on a patch of grass, no logos",
  football: "a football resting on grass beside a small cone",
  space: "a ringed planet in teal and rose with a small cream rocket passing it",
  animals: "a friendly dog and a cat sitting together",
  drawing: "a few crayons (teal, rose, leaf, sky, no yellow) beside a BLANK sketchbook",
  music: "a small harmonium in dark wood and a small hand drum",
  dance: "a pair of SILVER ankle bells (ghungroo) and a twirling rose scarf in mid-air, no person",
  cooking: "a rolling pin and a small steel bowl of flour on a board",
  trains: "a blue passenger train crossing a small arched bridge",
  stories: "an open book with BLANK pages and a small desk lamp glowing cream-white",
  building: "a small tower of wooden blocks painted teal, rose, leaf and stone",
  nature: "a green leaf, a red ladybird and a smooth grey pebble",
};
for (const [name, d] of Object.entries(interests))
  add({ id: `interests/${name}`, path: `${G}/interests/${name}.png`, size: "512x512", format: "png", alpha: true, batch: "B05", style: "sprite",
    purpose: "Interest picture tile (parent picks up to 3; the child confirms at Hello).",
    screens: ["Onboarding step 6 About your child §3.2, §6.2", "Hello card 4 Confirm what you like §6.3.2", "Parent Controls (interests) §6.5.4"],
    specRef: "§12 C", references: ["avatars/red-panda"],
    subject: d, description: `${d}. One object or small scene, centred, transparent background, no close-up faces, a soft contact shadow painted as part of the object is NOT allowed (pure alpha around it).` });

// ───────────────────────── D. SUBJECT SPOTS (6) ─────────────────────────
const subjects = {
  maths: "an open steel geometry box with a compass, a clear protractor WITHOUT any markings, and a red-and-black striped pencil (no brand)",
  science: "a glass jar with a sprouting bean, a magnifying glass and a red horseshoe magnet",
  english: "two cloth-bound books (teal and rose covers, no titles) and a fountain pen; blank pages",
  hindi: "a small black slate with a BLANK surface, a white chalk stick and a small steel bell (no script anywhere)",
  evs: "a potted mint plant, a tin watering can and a small house sparrow on the pot rim",
  "social-science": "a globe with soft abstract continents in leaf green on sky-blue seas with NO borders and no recognisable country shapes, an old steel compass and a terracotta clay pot",
};
for (const [name, d] of Object.entries(subjects))
  add({ id: `subjects/${name}`, path: `${G}/subjects/${name}.png`, size: "768x768", format: "png", alpha: true, batch: "B06", style: "spot",
    purpose: "Subject spot illustration (still life).",
    screens: ["Child home Older PrimaryCard subject spot 72 dp §6.3.3", "Parent Progress chapter cards §6.5.3", "Parent Lessons rows §6.5.3", "Sky map subject switcher §6.3.7"],
    specRef: "§12 D", references: ["avatars/red-panda"],
    subject: d, description: `${d}. Still life only, centred, transparent background, editorial and muted enough for ages 10-15.` });

// ───────────────────────── E. STATES (16 + 2 onboarding) ─────────────────────────
const states = [
  ["notebook-empty", "a closed cloth notebook with a ribbon bookmark, waiting on a desk", ["Notebook empty state §6.3.7, §5.4 empty.notebook"]],
  ["garden-empty", "one bed of bare soil, a BLANK seed packet and a small trowel", ["Garden empty state §6.3.7"]],
  ["sky-empty", "a child's telescope on a windowsill pointing at a dark empty sky, no stars", ["Sky map empty state §6.3.7"]],
  ["no-internet", "a paper boat resting on a still pond with a few ripples", ["Trouble T2 / offline offer §4.7", "Child home `offline` state §6.3.3", "Offline lesson badge sheet §6.4.6"]],
  ["mic-off", "a microphone lying on a soft cushion, quiet", ["No mic one-time card §3.13, §6.4.7", "Parent Controls 'Microphone is off on this phone' §3.13"]],
  ["sound-off", "a small speaker with a paper flower in front of it", ["Trouble T5/T6 §4.7", "Phone muted strip §3.13"]],
  ["done-for-today", "a closed school bag by a door in evening light, small shoes placed neatly", ["Child home `done` state §6.3.3"]],
  ["rest-until-tomorrow", "a desk lamp switched off, a window with a crescent moon (no face on the moon)", ["Child home `capped` state §6.3.3"]],
  ["something-wrong", "a tangled ball of teal wool with a cat's paw reaching in, gentle and funny", ["Generic error 'Something went wrong' §4.7", "Trouble T9 fallback when no still §4.7", "WebView too old §6.1.2"]],
  ["lessons-empty-parent", "an adult's hand placing a fresh closed notebook on a child's desk", ["Parent home no lessons yet §6.5.1", "Parent Lessons empty §6.5.3"], "skin-review"],
  ["ai-teacher-card", "a friendly rounded laptop on a desk with a soft cream glow and a small potted plant; the screen is BLANK and warm; no face on the screen", ["Hello card 2 AI card §3.3, §6.3.2"]],
  ["talk-to-grown-up", "a child and a grown-up sitting side by side on a step, seen from behind, the grown-up's arm around the child, the child wearing a small behind-the-ear hearing aid; calm, safe, warm", ["Pause sheet help row (Young) §6.4.1", "Parent Help and safety §6.5.5", "Public /help §6.1.2"], "skin-review"],
  ["permission-mic", "an abstract settings toggle switch on a blank panel, switching on, beside a small microphone shape", ["Onboarding step 8 mic denied §3.2", "No mic card §3.13"]],
  ["volume-keys", "a hand holding a phone, thumb on the side volume button, the screen blank", ["Onboarding step 8 no sound §3.2", "Phone muted strip §3.13", "T6 §4.7"], "skin-review"],
  ["404", "an empty winding garden path between terracotta pots, inviting, nobody on it", ["404 page §6.1.2"]],
  ["help-calm", "a soft, plain warm room corner with a lamp switched on (cream-white light), almost abstract", ["Help sheet on face tier E §6.4.9", "Public /help header §6.1.2"]],
];
for (const [name, d, screens, lint] of states)
  add({ id: `states/${name}`, path: `${G}/states/${name}.png`, size: "1024x768", format: "png", alpha: true, batch: "B08", style: "spot",
    purpose: "Empty, system or trouble state illustration. Never alarming.", screens, specRef: "§12 E", references: ["avatars/red-panda", "bg/home-young-wide"],
    subject: d, description: `${d}. A calm small scene with generous empty space, vignetted softly into full transparency at the edges (no rectangle).`, ...(lint ? { lint: "lamp-hue, " + lint } : {}) });
add({ id: "onboarding/handover-now", path: `${G}/onboarding/handover-now.png`, size: "768x768", format: "png", alpha: true, batch: "B10", style: "spot",
  purpose: "Spot art on the 'Give the phone to {child} now' tile.", screens: ["Onboarding step 9 Hand over §3.2, §6.2"], specRef: "§6.2 row 9 (tile art added by this manifest)",
  references: ["states/talk-to-grown-up"], lint: "lamp-hue, skin-review",
  description: "An adult hand passing a phone (blank screen) into a child's two cupped hands, seen close, warm and calm. Transparent background." });
add({ id: "onboarding/handover-later", path: `${G}/onboarding/handover-later.png`, size: "768x768", format: "png", alpha: true, batch: "B10", style: "spot",
  purpose: "Spot art on the 'Later' tile.", screens: ["Onboarding step 9 Hand over §3.2, §6.2"], specRef: "§6.2 row 9 (tile art added by this manifest)",
  references: ["onboarding/handover-now"],
  description: "A phone (blank screen) resting face-up on a folded cloth beside a steel cup, quiet, nobody there. Transparent background." });

// ───────────────────────── F. GARDEN + G. SKY ─────────────────────────
const kinds = {
  "rose-bush": { seed: "a soil mound with a BLANK seed packet on a stick", sprout: "a soil mound with two small leaves", bloom: "a small rose bush with dusty-rose flowers", fruit: "a full rose bush with many open roses and a few rose hips" },
  tomato: { seed: "a soil mound with a BLANK seed packet on a stick", sprout: "a soil mound with two small leaves", bloom: "a young tomato plant in flower with pale cream blossoms (never yellow)", fruit: "a tomato plant with ripe red tomatoes" },
  "guava-tree": { seed: "a soil mound with a BLANK seed packet on a stick", sprout: "a soil mound with two small leaves", bloom: "a small guava sapling with white flowers", fruit: "a small guava tree with pale green guavas" },
};
for (const [kind, st] of Object.entries(kinds))
  for (const [stage, d] of Object.entries(st))
    add({ id: `garden/${kind}-${stage}`, path: `${G}/garden/${kind}-${stage}.png`, size: "512x768", format: "png", alpha: true, batch: "B09", style: "sprite",
      purpose: `Garden plant at ledger stage '${{ seed: "Not started", sprout: "Practising", bloom: "Got it", fruit: "Secure" }[stage]}'. The app adds the Secure ring.`,
      screens: ["Garden plants on beds §3.8, §6.3.7", "Child home Young done state peek §3.4", "Milestone: a fruit appears §3.10"], specRef: "§4.8, §12 F",
      references: kind === "rose-bush" && stage === "seed" ? ["avatars/red-panda"] : ["garden/rose-bush-seed"],
      subject: d, description: `${d}, growing from a small mound of dark soil, bottom-centred; the mound is the SAME size and position in all 12 plant images so stages swap in place. No rings, glows or sparkles. Transparent background.` });
add({ id: "garden/sunbird", path: `${G}/garden/sunbird.png`, size: "256x256", format: "png", alpha: true, batch: "B09", style: "sprite", purpose: "Marks a skill the server scheduled for re-check.",
  screens: ["Garden: a check is due §4.8"], specRef: "§12 F13", references: ["garden/rose-bush-seed"], description: "A small purple sunbird perched, looking curious, side view, feet at the bottom edge so it can sit on a plant. Transparent background." });
add({ id: "garden/chapter-seal", path: `${G}/garden/chapter-seal.png`, size: "768x768", format: "png", alpha: true, batch: "B09", style: "spot", purpose: "Chapter seal for a complete bed: a state of the map, never a collectible.",
  screens: ["Garden complete bed §4.8", "Milestone ceremony ≤ 1,500 ms §3.10"], specRef: "§12 F14", references: ["garden/rose-bush-seed"],
  description: "A small woven garden gate of weathered grey-green bamboo with a dark iron bell hanging from its top bar (no brass, no gold), a few leaves twined on it. Transparent background." });
add({ id: "garden/watering-can", path: `${G}/garden/watering-can.png`, size: "512x512", format: "png", alpha: true, batch: "B09", style: "sprite", purpose: "Garden prop (List toggle row, empty-state accent, bed decoration).",
  screens: ["Garden §6.3.7", "Garden List view rows §3.8"], specRef: "§12 F15", references: ["garden/rose-bush-seed"], description: "A dented grey tin watering can with a rose spout. Transparent background." });
add({ id: "sky/chapter-seal", path: `${G}/sky/chapter-seal.png`, size: "768x768", format: "png", alpha: true, batch: "B09", style: "spot", purpose: "Chapter seal for a complete constellation.",
  screens: ["Sky map complete constellation §4.8", "Milestone ceremony §3.10"], specRef: "§12 G1", references: ["bg/sky-panel"],
  description: "A softly glowing crest made of cool white and pale blue light and dust, like a gentle halo ring with a faint inner weave; no star points, no letters, never gold. Transparent background (the glow fades to full transparency)." });

// ───────────────────────── H. PICTOGRAMS ─────────────────────────
const picto = [
  ["home", "a small clay house with a sloped tiled roof", ["Young: Home button on every non-home screen §5.2"]],
  ["pause", "a resting open palm enclosed inside a soft circle", ["Lesson top bar Pause (Young) §6.3.4"]],
  ["mic", "a round microphone with a wooden handle", ["AnswerDock talk button (Young) §6.3.4"]],
  ["ear", "a listening ear", ["AnswerDock listening state companion (Young) §4.2"]],
  ["hear-again", "an ear with a curved arrow around it", ["AnswerDock 'Hear again' (Young) §6.3.4", "Help menu 'Hear it again' §6.4.4"]],
  ["slower", "a tortoise walking", ["'Hear again' second tap within 10 s: slower version (Young) §4.3"]],
  ["your-turn", "an open hand, palm up, offering", ["AnswerDock YOUR TURN header (Young) §4.2"]],
  ["tap", "a finger tapping, pointing UP", ["Dock mode line 'Tap a picture above' (Young) §4.2, §6.3.4"]],
  ["eraser", "a pencil eraser", ["NumberPad delete (Young) §6.3.4", "Draw tray undo"]],
  ["pencil", "a pencil", ["'Draw it above' dock (Young) §6.3.4", "Hello 'Change' §3.3"]],
  ["captions", "speech lines inside a speech bubble, NO letters", ["Lesson top bar CC (Young) §6.3.4", "Me 'Always show words' §6.3.8"]],
  ["watch", "an eye", ["Tray 'Watch' badge in SHOWING (Young) §4.2"]],
  ["hint", "a lightbulb of cool white glass, NOT yellow, not lit yellow", ["Young help ladder §6.4.4"]],
  ["choices", "three blank cards fanned", ["Help menu 'Show me choices' §6.4.4"]],
  ["show-me-how", "a hand holding a chalk stick", ["Help menu 'Show me how' §6.4.4"]],
  ["yes", "a tick made of a twig", ["Who confirm Yes §6.3.1", "Hello 'Got it' / 'That's right' §6.3.2", "End confirm (Young) §6.4.2"]],
  ["no", "two crossed twigs, natural wood colour, never red", ["Who confirm No §6.3.1", "End confirm (Young) §6.4.2", "Summary 'Not now' §6.3.5"]],
  ["garden", "a watering can", ["Young home tile Garden §6.3.3"]],
  ["practice", "a slate", ["Young home tile Practice §6.3.3"]],
  ["notebook", "a closed notebook", ["Young home tile Notebook §6.3.3"]],
  ["help", "a child and a grown-up side by side, simple shapes", ["Young dock Help §6.3.4", "Help sheet 'Talk to a grown-up at home' §6.4.9"]],
  ["call", "a phone handset and a grown-up silhouette", ["Help sheet Childline / Tele-MANAS buttons (Young) §6.4.9", "Pause sheet tel: buttons (Young) §6.4.1"]],
  ["sound-on", "a speaker with sound lines", ["Question card 'Hear the question' (Young) §4.3", "Me 'Sounds' §6.3.8", "Onboarding 8 Play a sound"]],
  ["sound-off", "a speaker with a soft line through it", ["Me 'Sounds' off state §6.3.8"]],
  ["ai-teacher", "a small rounded laptop with a warm cream glow, no face", ["TeacherWindow corner computer-teacher picto (Young) §6.3.4", "Me 'Your teacher' §6.3.8"]],
  ["who-sees", "an eye beside a grown-up silhouette", ["Me 'What your grown-ups can see' §6.3.8", "Summary 'Show a grown-up?' §6.3.5"]],
  ["list", "three stacked blank strips", ["Garden 'List' toggle §6.3.7"]],
  ["arrow-left", "a soft arrow pointing left", ["Garden scroll arrows §5.2", "Help sheet 'Back to the lesson'"]],
  ["arrow-right", "a soft arrow pointing right", ["Garden scroll arrows §5.2", "Pause 'Continue' (Young)"]],
  ["water-glass", "a steel glass of water", ["Movement / water break ready tile (Young, v1 §3 break kept) "]],
  ["stretch", "a pair of arms stretching up", ["Movement break ready tile (Young, v1 §3 break kept)"]],
  ["finish", "a closed notebook with a tick-shaped ribbon", ["Summary 'Finish' (Young) §6.3.5", "End lesson (Young) §6.4.1"]],
  // added by this manifest (screens in the spec need them; §12 H omitted them)
  ["calmer", "a single feather floating, still", ["Me 'Calmer screen' (Young) §6.3.8"]],
  ["switch-learner", "two round picture discs with a curved arrow between them", ["Me 'Switch learner' §6.3.8", "'That wasn't me' §3.13"]],
  ["more-pictures", "three round picture discs fanned", ["Hello 'More pictures' §6.3.2"]],
  ["send", "a paper plane", ["NumberPad 'Send' (Young) §6.3.4"]],
  ["subject-maths", "a compass from a geometry box", ["Lesson top bar subject picto (Young) §6.3.4", "Young home PrimaryCard fallback when no topic picture"]],
  ["subject-english", "a closed cloth-bound book", ["Lesson top bar subject picto (Young) §6.3.4"]],
  ["subject-hindi", "a small blank slate with a chalk stick, no script", ["Lesson top bar subject picto (Young) §6.3.4"]],
  ["subject-evs", "a potted sprout", ["Lesson top bar subject picto (Young) §6.3.4"]],
  ["subject-science", "a magnifying glass", ["Lesson top bar subject picto (B2 science kits) §6.3.4"]],
  ["subject-social-science", "a small globe with no borders", ["Lesson top bar subject picto §6.3.4"]],
];
const pinPics = { kite: "a diamond kite", boat: "a paper boat", umbrella: "an open umbrella", cup: "a steel cup", fish: "a small fish", leaf: "a leaf", ball: "a ball", bus: "a small bus", flower: "a five-petal flower" };
for (const [k, d] of Object.entries(pinPics)) picto.push([`pin-${k}`, d, ["Who: Young picture PIN (3 pictures in order) §6.3.1"]]);
picto.forEach(([name, d, screens], i) =>
  add({ id: `picto/${name}`, path: `${G}/picto/${name}.png`, size: "256x256", format: "png", alpha: true, batch: i === 0 ? "B00" : "B03", style: "picto",
    purpose: "Young painted pictogram, shown at 48 dp inside tiles of 64 dp or more; always paired with a live word and spoken on tap.",
    screens, specRef: name.startsWith("pin-") || ["calmer", "switch-learner", "more-pictures", "send"].includes(name) || name.startsWith("subject-") ? "§7.3 (added by this manifest)" : "§7.3, §12 H",
    references: i === 0 ? ["avatars/red-panda"] : ["picto/home"],
    subject: d, description: `${d}. One bold object, centred, filling about 80% of the frame, with a thick soft warm-dark outline (#3A2A1E, about 7 px at 256 px), flat-ish gouache fill with little texture, readable at 48 px. Transparent background.` }));

// ───────────────────────── TOPIC MOTIFS (Young, classes 1-4) ─────────────────────────
const topics = {
  "hide-and-seek": "a curious kitten peeking out from behind a woven basket",
  "long-and-round": "a long bamboo stick lying beside a rolling ball and a round steel plate standing on its edge",
  "mango-basket": "a shallow woven basket heaped with raw green mangoes with a rosy blush, too many to count at a glance",
  "stick-bundles": "bundles of thin sticks tied with teal string beside a small loose pile of sticks; amounts are not countable at a glance",
  "two-bowls": "two small steel bowls of green peas with a few peas mid-way between them, as if being moved",
  "vegetable-basket": "a basket of fresh vegetables: a brinjal, a tomato, okra, a cauliflower and a radish",
  "hand-span": "a child's hand spread flat beside a ribbon laid along a floor tile, and a pair of small footprints",
  "bead-pattern": "a string of wooden beads in a repeating teal, rose and leaf sequence, loosely coiled",
  "daily-clock": "a round wall clock with NO numerals and no tick marks, two simple hands, a small cream sun and a small crescent moon on either side",
  "equal-plates": "a row of identical small steel plates, each holding the same small heap of peanuts",
  "vegetable-cart": "a wooden vegetable cart with baskets under a cloth awning; no price tags, no money, no signs",
  "toy-sorting": "toys sorted into three cloth baskets: balls in one, blocks in another, soft toys in the third",
  "beach-shells": "a beach with scattered shells, a small bucket and gentle waves",
  "solid-shapes": "a ball, a box, a steel tin and a clay cone arranged together",
  "shadow-shapes": "a wooden block and a steel tin casting long soft shadows that make clean flat shapes",
  "paper-shapes": "a scatter of cut coloured-paper shapes: a circle, a triangle, a square and a long strip",
  "stick-lines": "sticks standing, lying and leaning against a wall, a string stretched between two pegs",
  "paper-bunting": "a string of triangular paper bunting in teal, rose and leaf with a few paper flowers (not tied to any festival)",
  "balance-jug": "a simple two-pan balance with a steel jug and a cup beside it",
  "three-seasons": "an umbrella, a woollen cap and a hand fan together",
  "fair-wheel": "a small wooden giant wheel and a striped stall awning at a fair, no signs",
  "pebble-groups": "smooth pebbles placed in neat small groups on a cloth",
  "frog-stones": "a small green frog mid-jump between flat stepping stones in a line across a pond",
  "roti-share": "a whole pale roti on a steel plate with a small butter knife beside it (the roti is not cut)",
  "butterfly-symmetry": "a blue butterfly with wings fully open, perfectly mirrored left and right",
  "transport-toys": "a toy bus, a toy train engine and a toy boat",
  "animal-figures": "small carved wooden figurines of an elephant, a tiger and a leopard",
  "clean-lane": "a tidy lane corner with a grass broom, a lidded dustbin and a potted plant",
  "chappals-door": "many pairs of chappals of different sizes placed neatly by a doorstep",
  "plant-roots": "a young plant lifted from soil showing its roots, a small trowel beside it",
  "tree-home": "a tree trunk with a squirrel on it, a bird's nest on a branch and an ant trail at the roots",
  "matka-water": "a terracotta matka with a steel tumbler and a ladle, a few water drops",
  "thali-food": "a steel thali with small bowls of dal, rice and vegetables and a roti",
  "healthy-habits": "a toothbrush in a steel cup, a bar of soap and a skipping rope",
  materials: "a glass tumbler, a wooden spoon, a steel spoon and a folded cotton cloth side by side",
  "potter-wheel": "a clay pot on a potter's wheel with wet clay",
  "reuse-bag": "a cloth shopping bag, a glass jar reused as a pencil holder, and a small compost pot",
  "lane-shop": "a small neighbourhood lane with a corner shop shutter half open, a red post box with no writing and a parked bicycle",
  "float-sink": "a tub of water with a paper boat floating and a stone resting at the bottom",
  "land-forms": "a small diorama: a snowy mountain, pale stone-pink sand dunes, and a strip of coast with a coconut palm",
  "sun-moon": "a cream-white sun and a crescent moon side by side above a rooftop rail",
  "open-book": "an open book with BLANK pages and a bookmark ribbon",
  "singing-bird": "a small bird singing on a branch, beak open",
  "two-kites": "two kites flying side by side, their strings close together",
  "rain-clouds": "soft rain clouds over a small pond with rain rings",
  "envelope-letter": "a closed paper envelope with NO writing and no stamp, tied with string",
  "garden-snail": "a snail on a broad leaf in a garden",
  "jungle-friends": "a monkey on a branch, a crow on a fence post and a deer at the edge",
  "street-games": "a stack of flat lagori stones with a soft ball and a coiled tug rope",
  "rocket-moon": "a small rocket flying toward a large pale moon",
  "sweets-plate": "a steel plate of pale sweets: white coconut barfi and rose-pink peda (no yellow or orange sweets)",
  "grandparents-shawl": "a pair of reading glasses resting on a folded wool shawl beside a walking stick",
  "paint-palette": "a paint palette with teal, rose, leaf, sky and stone paint and a brush",
  bicycle: "a child's bicycle leaning on its stand",
  "big-tree": "a big neem tree with a wide shady canopy",
  "farm-field": "a green field with young crop rows, a small hand plough resting at the edge, no person",
  swing: "a wooden swing hanging from a tree branch on two ropes",
  "braille-hand": "fingertips reading raised dots on a blank cream page",
};
const topicMap = {
  "c1-maths-ch01": "hide-and-seek", "c1-maths-ch02": "long-and-round", "c1-maths-ch03": "mango-basket", "c1-maths-ch04": "stick-bundles",
  "c1-maths-ch05": "two-bowls", "c1-maths-ch06": "vegetable-basket", "c1-maths-ch07": "hand-span", "c1-maths-ch08": "stick-bundles",
  "c1-maths-ch09": "bead-pattern", "c1-maths-ch10": "daily-clock", "c1-maths-ch11": "equal-plates", "c1-maths-ch12": "vegetable-cart",
  "c1-maths-ch13": "toy-sorting",
  "c2-maths-ch01": "beach-shells", "c2-maths-ch02": "solid-shapes", "c2-maths-ch03": "stick-bundles", "c2-maths-ch04": "shadow-shapes",
  "c2-maths-ch05": "stick-lines", "c2-maths-ch06": "paper-bunting", "c2-maths-ch07": "balance-jug", "c2-maths-ch08": "equal-plates",
  "c2-maths-ch09": "three-seasons", "c2-maths-ch10": "fair-wheel", "c2-maths-ch11": "toy-sorting",
  "c3-maths-ch01": "pebble-groups", "c3-maths-ch02": "solid-shapes", "c3-maths-ch03": "frog-stones", "c3-maths-ch04": "two-bowls",
  "c3-maths-ch05": "paper-shapes", "c3-maths-ch06": "stick-bundles", "c3-maths-ch07": "equal-plates", "c3-maths-ch08": "roti-share",
  "c3-maths-ch09": "frog-stones", "c3-maths-ch10": "hand-span", "c3-maths-ch11": "balance-jug", "c3-maths-ch12": "two-bowls",
  "c3-maths-ch13": "daily-clock", "c3-maths-ch14": "bead-pattern",
  "c4-maths-ch01": "solid-shapes", "c4-maths-ch02": "hide-and-seek", "c4-maths-ch03": "bead-pattern", "c4-maths-ch04": "stick-bundles",
  "c4-maths-ch05": "roti-share", "c4-maths-ch06": "hand-span", "c4-maths-ch07": "clean-lane", "c4-maths-ch08": "balance-jug",
  "c4-maths-ch09": "equal-plates", "c4-maths-ch10": "animal-figures", "c4-maths-ch11": "butterfly-symmetry", "c4-maths-ch12": "daily-clock",
  "c4-maths-ch13": "transport-toys", "c4-maths-ch14": "toy-sorting",
  "c3-evs-ch01": "chappals-door", "c3-evs-ch02": "fair-wheel", "c3-evs-ch03": "paper-bunting", "c3-evs-ch04": "plant-roots",
  "c3-evs-ch05": "tree-home", "c3-evs-ch06": "tree-home", "c3-evs-ch07": "matka-water", "c3-evs-ch08": "thali-food",
  "c3-evs-ch09": "healthy-habits", "c3-evs-ch10": "materials", "c3-evs-ch11": "potter-wheel", "c3-evs-ch12": "reuse-bag",
  "c4-evs-ch01": "chappals-door", "c4-evs-ch02": "lane-shop", "c4-evs-ch03": "tree-home", "c4-evs-ch04": "plant-roots",
  "c4-evs-ch05": "thali-food", "c4-evs-ch06": "healthy-habits", "c4-evs-ch07": "float-sink", "c4-evs-ch08": "potter-wheel",
  "c4-evs-ch09": "land-forms", "c4-evs-ch10": "sun-moon",
  "c1-english-ch01": "hand-span", "c1-english-ch04": "jungle-friends", "c1-english-ch05": "farm-field", "c1-english-ch07": "thali-food",
  "c1-english-ch08": "three-seasons", "c1-english-ch09": "paint-palette",
  "c2-english-ch01": "bicycle", "c2-english-ch06": "lane-shop", "c2-english-ch07": "lane-shop", "c2-english-ch08": "rain-clouds",
  "c2-english-ch10": "jungle-friends", "c2-english-ch11": "jungle-friends", "c2-english-ch12": "matka-water",
  "c3-english-ch01": "paint-palette", "c3-english-ch03": "two-kites", "c3-english-ch04": "garden-snail", "c3-english-ch06": "float-sink",
  "c3-english-ch07": "sweets-plate", "c3-english-ch10": "sun-moon", "c3-english-ch11": "sun-moon", "c3-english-ch12": "rocket-moon",
  "c4-english-ch01": "two-kites", "c4-english-ch03": "healthy-habits", "c4-english-ch05": "jungle-friends", "c4-english-ch06": "braille-hand",
  "c4-english-ch07": "healthy-habits", "c4-english-ch08": "street-games", "c4-english-ch10": "swing", "c4-english-ch11": "land-forms",
  "c1-hindi-ch01": "chappals-door", "c1-hindi-ch02": "grandparents-shawl", "c1-hindi-ch03": "daily-clock", "c1-hindi-ch05": "sweets-plate",
  "c1-hindi-ch06": "two-kites", "c1-hindi-ch07": "jungle-friends", "c1-hindi-ch08": "jungle-friends", "c1-hindi-ch09": "vegetable-basket",
  "c1-hindi-ch10": "swing", "c1-hindi-ch11": "farm-field", "c1-hindi-ch12": "thali-food", "c1-hindi-ch13": "fair-wheel",
  "c1-hindi-ch14": "rain-clouds", "c1-hindi-ch16": "big-tree", "c1-hindi-ch17": "three-seasons", "c1-hindi-ch19": "sun-moon",
  "c2-hindi-ch01": "grandparents-shawl", "c2-hindi-ch02": "chappals-door", "c2-hindi-ch04": "chappals-door", "c2-hindi-ch06": "jungle-friends",
  "c2-hindi-ch08": "two-kites", "c2-hindi-ch09": "paint-palette", "c2-hindi-ch11": "paint-palette", "c2-hindi-ch13": "frog-stones",
  "c2-hindi-ch14": "plant-roots", "c2-hindi-ch15": "farm-field", "c2-hindi-ch16": "vegetable-basket", "c2-hindi-ch17": "frog-stones",
  "c2-hindi-ch18": "jungle-friends", "c2-hindi-ch19": "street-games", "c2-hindi-ch20": "hide-and-seek", "c2-hindi-ch21": "bicycle",
  "c2-hindi-ch23": "sun-moon", "c2-hindi-ch24": "sun-moon", "c2-hindi-ch25": "rain-clouds", "c2-hindi-ch26": "rain-clouds",
  "c3-hindi-ch02": "jungle-friends", "c3-hindi-ch04": "singing-bird", "c3-hindi-ch05": "big-tree", "c3-hindi-ch07": "envelope-letter",
  "c3-hindi-ch08": "jungle-friends", "c3-hindi-ch09": "big-tree", "c3-hindi-ch10": "street-games", "c3-hindi-ch13": "big-tree",
  "c3-hindi-ch14": "farm-field", "c3-hindi-ch16": "rocket-moon",
  "c4-hindi-ch01": "singing-bird", "c4-hindi-ch02": "garden-snail", "c4-hindi-ch03": "big-tree", "c4-hindi-ch04": "thali-food",
  "c4-hindi-ch05": "sun-moon", "c4-hindi-ch06": "envelope-letter", "c4-hindi-ch09": "sweets-plate", "c4-hindi-ch12": "street-games",
  "c4-hindi-ch13": "rocket-moon",
};
const used = new Set(Object.values(topicMap)); used.add("open-book");
for (const t of Object.keys(topics)) if (!used.has(t)) throw new Error("unused topic " + t);
for (const t of used) if (!topics[t]) throw new Error("missing topic " + t);
const topicIds = Object.keys(topics);
topicIds.forEach((name, i) => {
  const chapters = Object.entries(topicMap).filter(([, m]) => m === name).map(([c]) => c);
  add({ id: `topics/${name}`, path: `${G}/topics/${name}.png`, size: "512x512", format: "png", alpha: true, batch: i < 29 ? "B06" : "B07", style: "sprite",
    purpose: "Young topic picture for a chapter (evocative still life, never an instructional diagram or a countable quantity).",
    screens: ["Young home PrimaryCard topic picture 96 dp §6.3.3", "Lesson top bar goal picture (Young) §6.3.4", "Arrive goal card 'Today: ...' §4.8", "Garden bed marker §3.8", "Notebook pages (Young) §3.9", "Summary picture DidCards (Young) §6.3.5"],
    specRef: "§3.8, §4.8, §6.3.3 (topic art; mapping in topicMap)", references: ["avatars/red-panda"],
    subject: topics[name], description: `${topics[name]}. Centred, rounded and bright for ages 6-9, a few objects, transparent background.`,
    notes: name === "open-book" ? "Default for any chapter not in topicMap." : `Chapters: ${chapters.join(", ")}` });
});

// ───────────────────────── I. LANDING + PROMISES ─────────────────────────
const landing = [
  ["listening", "a 10-year-old Indian child using a wheelchair, at a desk with a phone propped up, listening and smiling (the wheelchair is simply part of the scene, not the subject), a notebook open with BLANK pages, cream-white evening lamp light; the phone screen is blank", "Landing 'See a real lesson' section art §6.1.1"],
  ["parent-reading", "an Indian parent at a kitchen table reading a phone with a calm, pleased expression, a steel cup of chai beside them; the screen is blank light", "Landing 'What you'll see as a parent' section art §6.1.1"],
  ["notebook", "a child's hands drawing in a notebook, soft abstract marks only (no letters, digits or shapes that read as writing)", "Landing 'Our promises' / FAQ section art §6.1.1"],
];
for (const [n, d, s] of landing)
  add({ id: `landing/${n}`, path: `${G}/landing/${n}.webp`, size: "1600x1200", format: "webp", batch: "B10", style: "world-older", purpose: "Landing section illustration (full-bleed).",
    screens: [s], specRef: "§12 I", references: ["bg/landing-hero"], lint: "lamp-hue, skin-review", subject: d, description: `${d}. Full-bleed, editorial, calm centre third.` });
add({ id: "landing/og-share", path: `${G}/landing/og-share.png`, size: "1200x630", format: "png", batch: "B10", style: "world-older", purpose: "Link preview image (WhatsApp, social) for the landing URL; text-free.",
  screens: ["Landing <meta og:image> §6.1.1"], specRef: "added by this manifest", references: ["bg/landing-hero"],
  description: "The landing-hero desk scene (same desk, notebook, tumbler, dusk window) cropped wide to 1200x630, the calm space kept centre-right. No text, no logo." });
const promises = [
  ["ai-honest", "a small rounded laptop with a gentle cream glow beside a child's open hand", "Promise 1: the teacher is an AI and says so"],
  ["you-see", "a grown-up's hand and a child's hand resting together on the same open notebook with blank pages, warm and open, seen from above (sharing, never watching from outside)", "Promise 2: you see what they see"],
  ["no-ads", "a quiet phone face down on a cushion beside a teacup", "Promise 3: no ads, sales calls, loans or EMI"],
  ["delete", "a sheet of paper folding into a small paper bird that flies away", "Promise 4: delete anything any time"],
];
for (const [n, d, s] of promises)
  add({ id: `promises/${n}`, path: `${G}/promises/${n}.png`, size: "768x768", format: "png", alpha: true, batch: "B10", style: "spot", purpose: `Spot art: ${s}.`,
    screens: ["Onboarding step 3 Our promises §3.2, §6.2", "Landing 'Our promises' rows §6.1.1", "/promises page §6.1.2"], specRef: "§12 I4-I7", references: ["states/ai-teacher-card"],
    subject: d, description: `${d}. Transparent background, calm, generous space.` });

// ───────────────────────── J. HOME-TASK OBJECTS ─────────────────────────
const homeObj = {
  roti: "a single pale wheat roti with a few light-brown spots (low saturation, never golden)",
  "steel-plate": "an empty round steel plate", "paper-strip": "a long strip of plain cream paper, slightly curled",
  "bowl-of-grapes": "a small steel bowl of green grapes", "matchbox-closed": "a closed plain ink-blue matchbox with NO printing",
  "measuring-cup": "a clear measuring cup with NO markings", "water-bottle": "a steel water bottle",
  rope: "a coiled grey-blue cotton rope (not golden jute)", "ladoos-on-plate": "a few pale coconut ladoos on a small steel plate (no yellow or orange sweets)",
  "chocolate-bar-plain-wrapper": "a chocolate bar in a plain dusty-rose wrapper with NO printing",
};
for (const [n, d] of Object.entries(homeObj))
  add({ id: `home/${n}`, path: `${G}/home/${n}.png`, size: "384x384", format: "png", alpha: true, batch: "B05", style: "sprite", purpose: "Picture chip for the parent's 5-minute 'Try at home' activity.",
    screens: ["Parent home 'Try at home' picture chips §6.5.1", "Lesson card home task §6.5.3"], specRef: "§12 J", references: ["avatars/red-panda"],
    subject: d, description: `${d}. Everyday object, no money, no printing, transparent background.` });

// ───────────────────────── K. PROTEGES ─────────────────────────
const proteges = { "sprout-sprite": "a small leaf creature with a sprout on its head", "cloud-pup": "a small soft cloud with four little paws", "pebble-friend": "a round smooth grey stone creature" };
for (const [n, d] of Object.entries(proteges))
  for (const [v, vd] of [["", "calm and attentive, simple dot eyes and a small smile"], ["-puzzled", "head tilted, one small question-shaped curl of air above it (no question mark glyph), curious, never sad"], ["-happy", "delighted, eyes crescent-shaped, arms or paws up"]])
    add({ id: `protege/${n}${v}`, path: `${G}/protege/${n}${v}.png`, size: "512x512", format: "png", alpha: true, batch: "B09", style: "sprite",
      purpose: `Young teach-back protégé (${v ? v.slice(1) : "neutral"}). It 'gets it' only after the verified resolution.`,
      screens: ["Explain it back (Young) 152 dp figure in the TeacherWindow §6.3.6", "Notebook teach-back pages (Young) §3.9"], specRef: v === "-puzzled" ? "§6.3.6 (puzzled variant added by this manifest)" : "§12 K",
      references: v ? [`protege/${n}`] : ["avatars/red-panda"],
      subject: `${d}, ${vd}`, description: `${d}, ${vd}. Obviously fictional and friendly, no human features, standing, full body, same scale and position across its three variants. Transparent background.` });

// ───────────────────────── BRAND ─────────────────────────
const markDesc = "the Taxila mark: a stylised open book seen from the front whose centre spine rises into a fountain-pen nib, warm paper cream (#F6F3EC) shapes on deep ink blue (#24346E), simple, geometric-but-hand-painted edges, no letters, no lamp, no yellow";
add({ id: "brand/mark", path: `${G}/brand/mark.png`, size: "1024x1024", format: "png", alpha: true, batch: "B10", style: "brand", purpose: "The brand mark (no wordmark: the name is live text). Source for the icons and splash.",
  screens: ["Landing top bar logo §6.1.1", "Onboarding top row §6.2", "Who top row §6.3.1", "Sign in §6.1.2"], specRef: "added by this manifest (app icon and splash)",
  description: `${markDesc}, as a rounded-square ink-blue tile with the cream book-and-nib inside, centred, the tile filling 88% of the frame. Transparent outside the tile.` });
add({ id: "brand/app-icon", path: `${G}/brand/app-icon.png`, size: "1024x1024", format: "png", batch: "B10", style: "brand", purpose: "Store and launcher icon (full-bleed square, no transparency). The app icon never carries a badge.",
  screens: ["Android launcher / Play Store §3.12", "PWA manifest icon", "iOS home screen"], specRef: "added by this manifest", references: ["brand/mark"],
  description: `${markDesc}, full-bleed ink-blue square (the OS applies the mask), the cream book-and-nib centred inside the central 66% safe zone. Opaque.` });
add({ id: "brand/adaptive-foreground", path: `${G}/brand/adaptive-foreground.png`, size: "1024x1024", format: "png", alpha: true, batch: "B10", style: "brand", purpose: "Android adaptive icon foreground layer.",
  screens: ["Android launcher (Capacitor res/mipmap-anydpi-v26)"], specRef: "added by this manifest", references: ["brand/app-icon"],
  description: "ONLY the cream book-and-nib shape from brand/app-icon, centred inside the central 66% (676 px) safe circle, everything else fully transparent." });
add({ id: "brand/adaptive-background", path: `${G}/brand/adaptive-background.png`, size: "1024x1024", format: "png", batch: "B10", style: "brand", purpose: "Android adaptive icon background layer.",
  screens: ["Android launcher"], specRef: "added by this manifest", references: ["brand/app-icon"], method: "composite",
  description: "A flat deep ink blue (#24346E) square with a very faint paper grain. Opaque. May be made by script (no image model needed)." });
add({ id: "brand/monochrome", path: `${G}/brand/monochrome.png`, size: "1024x1024", format: "png", alpha: true, batch: "B10", style: "brand", purpose: "Android 13+ themed (monochrome) icon.",
  screens: ["Android themed launcher icons"], specRef: "added by this manifest", references: ["brand/adaptive-foreground"], method: "composite",
  description: "The book-and-nib silhouette from brand/adaptive-foreground as a single flat white (#FFFFFF) shape on full transparency, same placement. Made by script from the foreground's alpha." });
for (const [n, bgc, mode] of [["splash-light", "#F6F3EC", "light"], ["splash-dark", "#121418", "dark"]])
  add({ id: `brand/${n}`, path: `${G}/brand/${n}.png`, size: "2732x2732", format: "png", batch: "B10", style: "brand", purpose: `Launch splash (${mode} system theme).`,
    screens: ["Android/Capacitor splash", "PWA splash"], specRef: "added by this manifest", references: ["brand/mark"], method: "composite",
    description: `Flat ${bgc} canvas with brand/mark composited dead centre at 640x640 px. Nothing else. Made by script (no image model needed).` });

// ───────────────────────── TEACHER REFERENCES (art/gen/teacher, never shipped) ─────────────────────────
const chars = {
  asha: { name: "Asha", order: "B11", priority: 1, stage: "bg/stage-young",
    accessory: ["ear-stud", "extreme close-up of her ear with the small stud earring and the flyaway strands of the ponytail near it"] },
  arjun: { name: "Arjun", order: "B12", priority: 2, stage: "bg/stage-older",
    accessory: ["glasses", "his round thin-rim glasses alone, front view and folded side view on a neutral surface, dark metal rim, clear lenses, no logo"] },
  uma: { name: "Uma", order: "B13", priority: 3, stage: "bg/stage-older",
    accessory: ["pallu-drape", "the saree pallu drape over the left shoulder and the thin contrasting border, close, showing the weave and how the edge falls"] },
};
const R = "art/gen/teacher";
for (const [id, c] of Object.entries(chars)) {
  const ref = (stem, size, desc, opts = {}) => add({ id: `teacher-ref/${id}/${stem}`, path: `${R}/${id}/${stem}.webp`, size, format: "webp", batch: c.order, style: `teacher-${id}`,
    ships: false, priority: c.priority, purpose: opts.purpose || "Concept reference for the S3h sculpt, expressions, lookdev and the rig-rendered stills (TV H1). Never shipped, never shown to a child.",
    screens: opts.screens || ["none (reference only): drives the 3D rig that renders every teacher surface, TV §12 H1-H15"], specRef: opts.specRef || "TV Appendix A",
    references: stem === "turnaround/front" ? [] : [`teacher-ref/${id}/turnaround/front`, ...(opts.refs || [])],
    description: desc, subject: desc, ...(opts.extra || {}) });
  ref("turnaround/front", "1024x1024", "Head and shoulders, front view, neutral relaxed face, mouth closed, looking straight at the camera. THIS IS THE IDENTITY ANCHOR: every later image of this character is generated with this image as the reference.");
  ref("turnaround/three-quarter-left", "1024x1024", "Same character, same lighting, head and shoulders turned 45 degrees to the character's right, neutral face.");
  ref("turnaround/profile-left", "1024x1024", "Same character, full profile facing left, neutral face.");
  ref("turnaround/back", "1024x1024", "Same character from directly behind: hair and garment detail.");
  const emo = {
    "warm-smile": "soft genuine smile, eyes crinkling (Duchenne: cheek raise and lower-lid raise)",
    encouraging: "small smile, brows gently raised, slight forward lean",
    curious: "brows raised, head tilted, interested",
    thinking: "looking slightly up and to the side, lips lightly pressed, calm (the THINKING floor state)",
    listening: "soft attentive face, head tilted a little (about 4 degrees), faint smile (the LISTENING floor state)",
    "gentle-concern": "inner brows slightly raised, kind, NOT sad (used for content difficulty only)",
    delighted: "big open smile, eyes crinkled, joyful",
    playful: "a teacher sharing a gentle joke with a class: a small lopsided smile, one eyebrow lifted a little, head tilted; warm and kind, never a smirk, a wink, a coy or a flirtatious look",
    surprised: "eyebrows high, eyes wide, mouth slightly open, happy surprise, not fear",
    speaking: "mid-sentence on an open vowel, brows animated, engaged, looking at the camera (the SPEAKING floor state)",
    "your-turn": "leaning in slightly toward the camera, head pitched down about 3 degrees, direct gaze, brows lightly held up, expectant and patient, never impatient (the YOUR TURN floor state)",
    "got-it-nod": "a small 'got it' nod caught mid-motion, chin slightly down, soft closed mouth, neutral-warm (the HEARD receipt; identical for every answer)",
    "calm-help": "calm, steady direct gaze, smile 0, relaxed brows, kind and serious (the safety Help sheet face)",
  };
  for (const [n, d] of Object.entries(emo))
    ref(`emotions/${n}`, "1024x1024", `Head and shoulders, front three-quarter, ${d}. Same identity, outfit and lighting as the front turnaround.`,
      { screens: ["none (reference only): TV §6 emotion range and §7 floor states for the expression sculpts (H5) and G15 emotion sheet"] });
  const vis = { sil: "closed, relaxed", PP: "lips pressed together", FF: "lower lip tucked under the upper teeth", TH: "tongue tip just behind the upper teeth", DD: "teeth slightly apart, tongue tip up",
    kk: "open, tongue back", CH: "lips slightly rounded forward, teeth close", SS: "teeth nearly together, lips spread", nn: "slightly open, tongue up", RR: "slightly rounded",
    aa: "wide open 'aa'", E: "mid open, spread", I: "spread, smile-like 'ee'", O: "rounded open 'oh'", U: "small rounded 'oo'",
    "tongue-tip-up": "Hindi dental: mouth slightly open, tongue tip pressed against the back of the upper teeth (as in 'ta' of 'taaraa')",
    "tongue-curl": "Hindi retroflex: mouth slightly open, tongue tip curled back toward the roof of the mouth",
    "tongue-wide": "Hindi open 'aa' with the jaw open and the tongue lying wide and flat" };
  for (const [n, d] of Object.entries(vis))
    ref(`visemes/${n}`, "1024x1024", `Close-up of the LOWER FACE only (nose tip to chin), front view, mid-speech mouth shape: ${d}. Same skin, lips and lighting.`,
      { screens: ["none (reference only): TV §5.2 visemes and Hindi tongue extras for H5"] });
  const det = {
    "eye-closeup": "extreme close-up of one eye: lashes, lid crease, iris texture with depth, the wet line, a catch-light from the upper left",
    "iris-flat": "a perfectly front-on, flat, evenly lit iris and pupil disc filling the frame, no lids, no reflections, for painting the iris texture",
    "skin-cheek": "close-up of cheek and nose skin under soft light: natural texture, faint pores, no blemishes painted on, no make-up",
    "lips-teeth": "close-up of a natural open smile showing the upper teeth and lips",
    hair: "close-up of the hairstyle: strand clumps, flyaways, how the hair catches the key light",
    fabric: "flat seamless swatch of the outfit's main fabric, evenly lit, tileable, no print text or logos",
    "wrinkle-smile": "close-up of the eye corner and cheek in a big smile: crow's feet and the cheek fold, for the compress wrinkle map",
    "wrinkle-concern": "close-up of the brow and glabella in gentle concern: the fine inner-brow knot, for the compress wrinkle map",
    [c.accessory[0]]: c.accessory[1],
  };
  for (const [n, d] of Object.entries(det))
    ref(`detail/${n}`, "1024x1024", `${d[0].toUpperCase()}${d.slice(1)}. Same character.`, { screens: ["none (reference only): texture and shader lookdev (TV §5.4, H7-H9)"],
      ...(n === "fabric" ? { extra: { notes: "Must tile: check the four edges wrap." } } : {}) });
  const poses = {
    wave: ["waist-up, a single friendly wave with the right hand at shoulder height, warm smile", "rig still `wave`: Onboarding step 9 §6.2, Parent 'Later' card §3.2"],
    reading: ["waist-up, sitting, reading a closed-cover book held low (no text visible), relaxed", "rig still `reading`: Child home `resting` §6.3.3"],
    "watering-can": ["waist-up, holding a tin watering can, looking down at it kindly", "rig pose still: Garden plant sheet §3.8"],
    telescope: ["waist-up, beside a small telescope on a tripod, one hand on it, looking up", "rig pose still: Sky map star sheet §3.8"],
    "one-moment": ["waist-up, a small 'one moment' hand gesture (index finger raised softly beside the face), thinking face", "the 4 s latency beat gesture §4.5"],
    "point-to-tray": ["head and shoulders, gaze down and to the viewer's right toward an off-frame tray, one hand pointing lightly that way", "SHOWING floor state: gaze leads the chalk mark §4.2"],
  };
  for (const [n, [d, s]] of Object.entries(poses))
    ref(`poses/${n}`, "1024x1024", `${d}. Same identity, outfit and lighting.`, { screens: [`none (reference only): ${s}`] });
  ref("stage/classroom-wide", "1536x1024", "The character head-and-shoulders, centred, in a soft-focus warm Indian classroom (blank green board, window light, plants), no writing on the board.",
    { extra: { notes: "TV Appendix A item 34 asks 2048x1152 (16:9); 1536x1024 is the tool's native 3:2. Upscaling a reference adds no detail." } });
  ref("stage/on-stage", "1024x1024", `The character head-and-shoulders, centred, in front of the dusk stage ground (${c.stage}: dusk blue #26304A, cream light pool behind the head). This is the colour script for the SH light probe of that stage.`,
    { refs: [c.stage], screens: ["none (reference only): TV H13 lookdev colour script for the lesson TeacherWindow"] });
}
add({ id: "teacher-ref/cast/lineup", path: `${R}/cast/lineup.webp`, size: "1536x1024", format: "webp", batch: "B13", style: "teacher-cast", ships: false, priority: 3,
  purpose: "Relative scale, skin-tone spread and silhouette check across the cast.", screens: ["none (reference only): TV H2 clearance and V2-M10 'one teacher' design review"], specRef: "added by this manifest",
  references: ["teacher-ref/asha/turnaround/front", "teacher-ref/arjun/turnaround/front", "teacher-ref/uma/turnaround/front"], lint: "reference-only",
  description: "Asha, Arjun and Uma standing waist-up side by side, front view, neutral warm expressions, same studio background and lighting, each matching their own front turnaround exactly." });

// ───────────────────────── RIG RENDERS (NOT Codex: scripts/teacher-stills.mjs) ─────────────────────────
for (const id of Object.keys(chars))
  for (const [n, size, screens] of [
    ["portrait", "1200x1500", ["Landing hero cast (Asha + Arjun) §6.1.1", "Parent header 32 dp, Lesson card 96 dp §8", "Your teacher card §6.3.9", "T8/T9 full-screen still §4.7"]],
    ["wave", "1200x1500", ["Onboarding 9 tier D §6.2", "Parent 'Later' card"]],
    ["resting", "1200x1500", ["Pause sheet tier D", "Help sheet tier D §6.4.9"]],
    ["reading", "1200x1500", ["Child home `resting` §6.3.3"]],
    ["watering", "640x640", ["Garden plant sheet §3.8"]],
    ["telescope", "640x640", ["Sky map star sheet §3.8"]],
  ])
    add({ id: `teacher/${id}/${n}`, path: `${G}/teacher/${id}/${n}.webp`, size, format: "webp", alpha: true, generator: "rig-render", batch: "RIG", style: `teacher-${id}`,
      purpose: "Still rendered FROM THE RIG (M0 now, S3h later) so every surface shows the same person. Codex must NOT generate these.", screens, specRef: "§8 interim stills, TV H15",
      references: [], description: "Produced by `node scripts/teacher-stills.mjs` (headless Chromium, /dev/avatar?still=1). WebP with alpha.", lint: "rig" });

// ───────────────────────── checks + output ─────────────────────────
const ids = new Set();
for (const a of assets) { if (ids.has(a.id)) throw new Error("dup " + a.id); ids.add(a.id); }
for (const a of assets) for (const r of a.references) if (!ids.has(r)) throw new Error(`bad ref ${r} in ${a.id}`);
const paths = new Set(); for (const a of assets) { if (paths.has(a.path)) throw new Error("dup path " + a.path); paths.add(a.path); }
// a reference must be generated earlier: batch order
const order = ["B00", "B01", "B02", "B03", "B04", "B05", "B06", "B07", "B08", "B09", "B10", "B11", "B12", "B13", "RIG"];
const pos = new Map(); assets.forEach((a, i) => pos.set(a.id, i));
for (const a of assets) for (const r of a.references) {
  const ra = assets[pos.get(r)];
  const ok = order.indexOf(ra.batch) < order.indexOf(a.batch) || (ra.batch === a.batch && pos.get(r) < pos.get(a.id));
  if (!ok) throw new Error(`ref order ${r} (${ra.batch}) -> ${a.id} (${a.batch})`);
}
// sort assets into batch order, stable
const sorted = order.flatMap((b) => assets.filter((a) => a.batch === b));
for (const a of sorted) for (const r of a.references) if (sorted.findIndex((x) => x.id === r) > sorted.findIndex((x) => x.id === a.id)) throw new Error("sorted ref order " + a.id);

const batchMeta = {
  B00: "Style keys: the three anchors every later image is matched against, plus the phone crop of the world anchor",
  B01: "Young world backgrounds + stage-young + garden panorama",
  B02: "Older and neutral backgrounds, stage-older, sky, onboarding edge, landing hero, parent header",
  B03: "Young pictograms (incl. picture-PIN set)",
  B04: "Child avatars",
  B05: "Interest tiles and home-task objects",
  B06: "Subject spots and topic motifs, part 1",
  B07: "Topic motifs, part 2",
  B08: "Empty, system and trouble states",
  B09: "Garden, sky seal, protégés",
  B10: "Landing, promises, onboarding tiles, brand mark, icons, splash",
  B11: "Teacher references: Asha (priority 1)",
  B12: "Teacher references: Arjun (priority 2)",
  B13: "Teacher references: Uma (priority 3, draft character) + cast lineup",
  RIG: "Rig-rendered teacher stills: produced by scripts/teacher-stills.mjs, NOT by Codex",
};
const batches = order.map((b) => ({ id: b, title: batchMeta[b], codex: b !== "RIG", count: sorted.filter((a) => a.batch === b).length, ids: sorted.filter((a) => a.batch === b).map((a) => a.id) }));
const count = (f) => sorted.filter(f).length;
const byCat = {}; for (const a of sorted) byCat[a.category] = (byCat[a.category] || 0) + 1;

const manifest = {
  manifestVersion: 1,
  date: "2026-10-03",
  title: "Taxila image manifest (PRODUCT-DESIGN-V2)",
  sourceOfTruth: ["docs/design/PRODUCT-DESIGN-V2.md §7.3-§7.5, §8, §12 (§12.2 maps every id to its screen)", "docs/design/teacher/TEACHER-VISUAL.md §4.3, §11, Appendix A (which defers to this manifest)", "shared/tutors.js (look data)"],
  generatedBy: "docs/design/assets/build-manifest.mjs (regenerate; do not hand-edit entries)",
  repo: { owner: "raghavsharma2003", name: "Taxila", branch: "claude/blissful-mayer-icwe2j" },
  conventions: {
    id: "<category>/<stem>, the name the spec uses (e.g. states/ai-teacher-card). Unique.",
    specRef: "Where the item came from. '§12 A1'-style refs name the item letters of the retired §12.1 draft prompt (kept for provenance); the live screen map is PRODUCT-DESIGN-V2 §12.2 and each entry's `screens`.",
    path: "Shipped art: public/assets/gen/<category>/<stem>.<ext>. Teacher references: art/gen/teacher/<character>/<sheet>/<stem>.webp (TV §14.3: never under public/, which ships). Rig stills: public/assets/gen/teacher/<character>/<pose>.webp.",
    size: "Exact master pixel size. scripts/gen-assets.mjs (B2) derives the 1x/2x WebP and 360-dp crops and enforces byte budgets; masters are not what the client downloads.",
    format: "PNG with real alpha for anything that overlays UI or another image; WebP (quality 92, no alpha) for opaque backgrounds and full-bleed scenes; WebP (quality 95) for teacher references; PNG for store/launcher icons and splash.",
    generate: "native = the image tool canvas to request; crop = the aspect crop of that canvas; scale = the resize factor to the exact size; method crop-resize | tile (panorama built from panels) | composite (made by script, no image model).",
    noText: "No text, letters, digits, symbols, logos, signage or watermarks in ANY image, in any script (P9, §7.4).",
    lint: "lamp-hue = §12 step 4 (≤ 1.5% pixels with HSL S ≥ 35%, L 20-85%, hue within 12° of 39.5°). skin-review = an image with visible skin, where skin can trip the hue lint: report the share, do not regenerate for skin alone; a human reviews. reference-only = not linted (never ships). rig = produced from the 3D rig.",
  },
  palette: {
    paper: "#F6F3EC", inkBlue: "#24346E", teal: "#0B7285", terracotta: "#B5532E", leaf: "#2E7D32", neem: "#2F6B4F", dustyRose: "#B4466A", daySky: "#A9D8E8",
    stone: "#C9C6BE", duskBlue: "#26304A", night: "#0F1A33", chalkboard: "#1F3B30", chalk: "#F5F2E8", pictoOutline: "#3A2A1E",
    skinRamp: ["#F3D2B3", "#E2B48C", "#C99366", "#A9744A", "#8A5634", "#5F3A22"],
    forbidden: "marigold, saffron, amber, gold, brass, mustard, bright yellow, yellow-orange (hue 28-52° at more than low saturation); neon; decorative gradients. Wood is greyed walnut or weathered teak, desaturated; metal is steel or iron.",
  },
  characters: {
    asha: { id: "asha", status: "live", classes: "1-4 (Young)", apparentAge: 24, presentedGender: "F", mst: 6, skin: "#C99366", skinShade: "#B07E55", hair: "#2A1C14", hairStyle: "high ponytail with a few flyaway strands", iris: "#4A2E1C", lip: "#9A4E44",
      outfit: "teal (#3E7C74, shade #32665F) cotton kurti with a thin rust (#C2410C) neckline piping, under a light faded denim jacket", accessory: "small gold stud earrings (the TV §4.3 identity anchor; tiny, below the hue lint)", face: "oval face, lively expressive brows, a faint dimple on her LEFT cheek when she smiles, dark brown eyes, no glasses, no bindi or religious markers" },
    arjun: { id: "arjun", status: "live", classes: "5-9 (Older)", apparentAge: 26, presentedGender: "M", mst: 7, skin: "#A9744A", skinShade: "#93633D", hair: "#1F1712", hairStyle: "short dense curls in clumps", iris: "#3A2416", lip: "#7E4636",
      outfit: "slate-blue (#44607F, shade #384F69) check shirt worn open over a plain off-white (#E9E4D8) tee", accessory: "round thin-rim glasses with a dark metal rim", face: "friendly open face, light stubble texture (not a beard), dark brown eyes, no religious markers" },
    uma: { id: "uma", status: "draft (name uma vs nandini unsettled, TV §14.4)", classes: "7-9 (Older)", apparentAge: 34, presentedGender: "F", mst: 8, skin: "#8A5634", skinShade: "#764829", hair: "#241812", hairStyle: "low bun at the nape", iris: "#2E1C10", lip: "#6E3A30",
      outfit: "plum (#7A4A6E, shade #653C5B) handloom cotton saree with a thin contrasting rust (#C2410C) border and a cream (#EADFC8) blouse, pallu over the left shoulder", accessory: "the pallu drape and border", face: "calm brows, fine lower-lid detail, composed warm expression, no bindi or religious markers" },
  },
  batches,
  counts: {
    total: sorted.length, codex: count((a) => a.generator === "codex"), codexImageModel: count((a) => a.generator === "codex" && a.generate.method !== "composite"),
    composite: count((a) => a.generate && a.generate.method === "composite"), rigRender: count((a) => a.generator === "rig-render"),
    shipped: count((a) => a.ships), referenceOnly: count((a) => !a.ships), byCategory: byCat,
  },
  notGenerated: [
    { what: "State glyphs (speaking, eye, open hand, ear, tick-in-bubble, stroke dots, pause, cloud-slash, mic-slash, clock, speaker-slash, tick, half-tick, magnifier, lightbulb)", why: "Hand-built SVG that morphs inside the mic, every band (§7.3: src/ui/icons/state.tsx)" },
    { what: "Older and parent icons, including both tab bars (Today · Map · Notebook · Ask; Home · Progress · Lessons · More) and Older subject icons", why: "Material Symbols Rounded as one inline SVG sprite (§7.3). Generated raster icons would contradict the spec." },
    { what: "Stars, constellation edges, StateShape (garden/sky/parent), Secure ring, 'Your class is here' marker, chapter bed outlines", why: "Drawn by the app in SVG so state is exact (§3.8, §4.8)" },
    { what: "Chalkboard, chalk marks, concept payoffs, module art", why: "Board.tsx SVG and the engines; generated pixels never carry facts (`generated-media-carries-facts`)" },
    { what: "ask.picture (R0 question pictures)", why: "Verified-library assets only, never a generated image (§4.10)" },
    { what: "Teacher D plates, mouth strips, picker preview clips, cinematic clips, protégé nod sprite", why: "Rendered from the rig (TV §10, §13, H15; B4). Generated 2D teacher art would break 'one teacher' (§8, G-ID-1)" },
    { what: "Landing 'See a real lesson' and the 3-up strip", why: "Real V-SHOT screenshots, never mock-ups (§6.1.1)" },
    { what: "₹ glyph", why: "Inline SVG in chrome (§5.4)" },
    { what: "favicon.svg", why: "Redraw by hand as SVG from brand/mark. The current file uses the retired jamun #5B2E91 and a marigold dot, which breaks G-LAMP-1 on the landing." },
    { what: "Earcons", why: "Synthesised at runtime, 0 bytes (§9.2)" },
  ],
  changesFromSpec12: [
    "Teacher concept art IS listed here (task brief) but saved under art/gen/teacher/** per TV Appendix A and §14.3, never under public/ (it would ship). Shipped teacher stills are rig renders listed as generator 'rig-render'.",
    "Backgrounds and full-bleed scenes are WebP masters (task brief) instead of the retired §12.1 draft's PNG; gen-assets.mjs must accept .webp input.",
    "Added beyond the retired §12.1 draft: 4 Young pictos named by screens (calmer, switch-learner, more-pictures, send), 6 Young subject pictos, a 9-picture PIN set (Who, Young), 3 protégé 'puzzled' variants, 2 onboarding step 9 tile spots, 58 Young topic motifs with a chapter map (classes 1-4), brand mark, app icon, adaptive icon layers, monochrome icon, 2 splashes, og-share.",
    "Lamp-safety rewrites of the retired §12.1 draft subjects: D4 brass bell -> steel bell; F14 bamboo -> weathered grey-green bamboo with an iron bell; tiger cub painted deep rust; hornbill -> grey hornbill; mango -> raw green mango; sunflower -> white-petalled variety; camel -> pale greyish-fawn; auto-rickshaw -> green and cream; tomato blossoms cream; ladoos -> pale coconut ladoos; rope -> grey-blue cotton; telescope steel not brass; ghungroo silver; dusk horizon rose-violet, city lights cool white.",
    "Teacher reference sizes are 1024x1024 (stage 1536x1024) rather than the 2048 of TV's first draft: the tool's native canvas; upscaling a reference adds no detail. Re-run at 2048 if the tool supports it natively.",
    "Teacher references add 4 floor-state faces (speaking, your-turn, got-it-nod, calm-help), 3 Hindi tongue visemes (TV §5.2), iris-flat, two wrinkle references, one accessory sheet, 6 pose sheets that direct the rig stills, and an on-stage colour script, per character.",
  ],
  topicMap: { default: "topics/open-book", scope: "classes 1-4 (Young bands B1-B2); Older bands use subject spots", map: Object.fromEntries(Object.entries(topicMap).map(([k, v]) => [k, `topics/${v}`])) },
  assets: sorted,
};
fs.writeFileSync(path.join(OUT, "MANIFEST.json"), JSON.stringify(manifest, null, 2) + "\n");

// compact, machine-parseable list for the Codex prompt (taxila-assetkit.py init parses it)
const flags = (a) => [a.alpha ? "alpha" : "", /skin-review/.test(a.lint) ? "skin" : "", a.generate.method === "composite" ? "script" : "",
  a.generate.method === "tile" ? "tile" : "", (a.id === "bg/garden-panorama" || /detail\/fabric$/.test(a.id)) ? "wrap" : ""].filter(Boolean).join(" ");
const line = (a, id = a.id, refs = a.references) => `- ${id} | ${a.width}x${a.height} ${a.format}${flags(a) ? " " + flags(a) : ""} | ref: ${refs.length ? refs.join(", ") : "-"} | ${a.subject}`;
const lines = [];
for (const b of batches) {
  if (!b.codex || b.id === "B12" || b.id === "B13") continue;
  if (b.id === "B11") {
    lines.push(`\n### B11-B13: Teacher references, one pass per character: asha = B11, arjun = B12, uma = B13 (${(b.ids.length - 1) * 3} lines after expansion: ${b.ids.length - 1} per character × 3; the accessory sheets below make it ${b.ids.length * 3}). Expand {c} to the character id.\n`);
    const accessories = Object.entries(chars).map(([cid, c]) => `teacher-ref/${cid}/detail/${c.accessory[0]}`);
    for (const id of b.ids) {
      const a = sorted.find((x) => x.id === id);
      if (accessories.includes(id)) continue;
      const generic = { ...a, subject: a.subject.replace("bg/stage-young", "bg/stage-{stage}") };
      lines.push(line(generic, id.replace("/asha/", "/{c}/"), a.references.map((r) => r.replace("/asha/", "/{c}/").replace("bg/stage-young", "bg/stage-{stage}"))));
    }
    lines.push(`\n### B11-B13: the one accessory sheet per character (3; each goes in its character's batch)\n`);
    for (const id of accessories) lines.push(line(sorted.find((x) => x.id === id)));
    const lu = sorted.find((x) => x.id === "teacher-ref/cast/lineup");
    lines.push(`\n### B13 (after uma): cast lineup (1)\n`, line(lu));
    continue;
  }
  lines.push(`\n### ${b.id}: ${b.title} (${b.count})\n`);
  for (const id of b.ids) lines.push(line(sorted.find((x) => x.id === id)));
}
fs.writeFileSync(path.join(process.argv[3] || "/tmp", "asset-list.md"), lines.join("\n").trim() + "\n");
// assemble CODEX-PROMPT.md from the template, the helper and the list
const HERE = path.dirname(new URL(import.meta.url).pathname);
const tpl = fs.readFileSync(path.join(HERE, "codex-prompt.template.md"), "utf8");
const helper = fs.readFileSync(path.join(HERE, "taxila-assetkit.py"), "utf8").trimEnd();
const ch = manifest.characters;
const block = (c, batch, sig) => `- **${c.id}** (${batch}; ${c.status}; teaches classes ${c.classes}). An Indian ${c.presentedGender === "F" ? "woman" : "man"}, apparent age ${c.apparentAge}, Monk Skin Tone ${c.mst}: skin ${c.skin} (shadow ${c.skinShade}). Hair ${c.hair}, ${c.hairStyle}. Iris ${c.iris}. Lips ${c.lip}. Outfit: ${c.outfit}. Signature accessory: ${c.accessory}. Face: ${c.face}. Signature colour ${sig}.`;
const blocks = [block(ch.asha, "B11", "#3E7C74"), block(ch.arjun, "B12", "#44607F"), block(ch.uma, "B13", "#7A4A6E")].join("\n");
const listText = fs.readFileSync(path.join(process.argv[3] || "/tmp", "asset-list.md"), "utf8").trimEnd();
const c = manifest.counts;
const prompt = tpl
  .replaceAll("{{CODEX_COUNT}}", String(c.codex))
  .replaceAll("{{SHIPPED_CODEX}}", String(c.codex - c.referenceOnly))
  .replaceAll("{{COMPOSITE_COUNT}}", String(c.composite))
  .replaceAll("{{REF_COUNT}}", String(c.referenceOnly))
  .replaceAll("{{RIG_COUNT}}", String(c.rigRender))
  .replaceAll("{{IMAGE_MODEL_COUNT}}", String(c.codexImageModel))
  .replace("{{CHARACTER_BLOCKS}}", () => blocks)
  .replace("{{HELPER}}", () => helper)
  .replace("{{ASSET_LIST}}", () => listText);
if (/\{\{[A-Z_]+\}\}/.test(prompt)) throw new Error("unfilled placeholder");
fs.writeFileSync(path.join(OUT, "CODEX-PROMPT.md"), prompt);
console.log(JSON.stringify(manifest.counts, null, 1));
