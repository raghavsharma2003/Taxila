// Round 5, stream 2 (the board), RCA-1: the board draws what the child asked for. The whiteboard ask carries the child's
// request (shared/studio.ts StudioRequest, from brain/propose.js requestOfSee): how they asked to see it (a number line, a
// picture, a drawing, a bare "X dikhao"), the thing they named, the numbers they named. These predicates decide, in code,
// whether a board answers that request, and whether a page is the one already on the board. Every ready-made board (the
// board-first pick, a speculative board, the kit's code board, the template rung) must pass them before it is drawn for a
// request; the line planner is told the request and draws it. PURE: no model, no I/O.

/** Words that are never the subject itself ("plant ki life cycle" → plant, life, cycle). */
const GLUE = new Set(["ka", "ki", "ke", "ko", "aur", "and", "of", "the", "a", "an", "se", "me", "mein", "par", "pe", "wala", "wali", "wale",
  "का", "की", "के", "को", "और", "से", "में", "पर"]);
const norm = (s) => String(s ?? "").toLowerCase().normalize("NFC");

/**
 * The words that name the subject, plus common spellings of the same word in the other script / transliteration, so a
 * board labelled "आलू" or "potato" answers "aloo". Small, explicit table: never a model.
 */
const SAME = [
  ["aloo", "alu", "potato", "potatoes", "आलू"], ["aam", "mango", "आम"], ["sikka", "sikke", "coin", "coins", "सिक्का", "सिक्के", "₹"],
  ["nadi", "river", "नदी"], ["chaand", "chand", "moon", "चाँद", "चांद"], ["suraj", "surya", "sun", "सूरज", "सूर्य"],
  ["tiranga", "flag", "तिरंगा", "jhanda", "झंडा"], ["pahad", "pahaad", "mountain", "mountains", "पहाड़"], ["phool", "flower", "फूल"],
  ["paudha", "plant", "पौधा"], ["ped", "tree", "पेड़"], ["patti", "leaf", "leaves", "पत्ती"], ["jad", "root", "roots", "जड़"],
  ["chonch", "beak", "चोंच"], ["chidiya", "bird", "चिड़िया"], ["ghadi", "clock", "घड़ी"], ["baraf", "barf", "ice", "बर्फ"],
  ["bhaap", "steam", "vapour", "vapor", "भाप"], ["paani", "pani", "water", "पानी"], ["parchhai", "parchhayi", "shadow", "परछाई"],
  ["beej", "seed", "seeds", "बीज"], ["phal", "fruit", "फल"], ["koshika", "cell", "कोशिका"], ["prithvi", "earth", "पृथ्वी"],
  ["tribhuj", "triangle", "त्रिभुज"], ["gola", "circle", "वृत्त"], ["varg", "square", "वर्ग"], ["aadha", "half", "आधा", "1/2"],
  ["machli", "fish", "मछली"], ["gaay", "gai", "cow", "गाय"], ["haathi", "hathi", "elephant", "हाथी"], ["sher", "lion", "tiger", "शेर"],
  ["seb", "apple", "सेब"], ["kela", "banana", "केला"], ["tamatar", "tomato", "टमाटर"], ["pyaaz", "pyaz", "onion", "प्याज"],
  ["ghar", "house", "home", "घर"], ["bijli", "electricity", "बिजली"], ["batti", "bulb", "बल्ब"], ["dil", "heart", "दिल"],
  ["bhinn", "bhinna", "fraction", "fractions", "भिन्न"], ["sankhya", "number", "numbers", "संख्या"], ["bhaag", "divide", "division", "भाग"],
  ["guna", "multiply", "multiplication", "गुणा"], ["jod", "add", "addition", "जोड़"], ["ghatav", "subtract", "subtraction", "घटाव"],
  ["rekha", "line", "lines", "रेखा"], ["kon", "angle", "angles", "कोण"], ["kshetrafal", "area", "क्षेत्रफल"], ["parimap", "perimeter", "परिमाप"],
  ["disha", "direction", "directions", "दिशा", "north", "south", "east", "west", "uttar", "dakshin", "purab", "purv", "pashchim", "उत्तर", "दक्षिण", "पूर्व", "पश्चिम"],
];
const SAME_OF = new Map(SAME.flatMap((g) => g.map((w) => [w, g])));

const WEAK = new Set(["life", "cycle", "parts", "part", "process", "diagram", "structure", "types", "type", "kinds", "kind", "steps", "step", "stages",
  "stage", "model", "picture", "photo", "drawing", "sketch", "working", "system", "hissa", "hisse", "bhag", "prakar", "chakra"]);
/** The subject's words and their equivalents (lower case, ≥ 2 letters; Devanagari kept). PURE. */
export function subjectWords(subject) {
  const out = new Set();
  // words that say what KIND of picture, not what of ("plant ki life cycle" is about a plant) count only when nothing else is named
  const all = norm(subject).split(/[\s,/]+/).filter(Boolean).filter((w) => !GLUE.has(w));
  const strong = all.filter((w) => !WEAK.has(w));
  for (const w0 of strong.length ? strong : all) {
    if (w0.length < 3 && !/[ऀ-ॿ]/.test(w0)) continue;
    out.add(w0);
    for (const x of SAME_OF.get(w0) ?? []) out.add(norm(x));
    // a plural / oblique ending: "sikke" ~ "sikka", "plants" ~ "plant"
    if (/^[a-z]{4,}s$/.test(w0)) out.add(w0.slice(0, -1));
  }
  return [...out];
}

/** Every text a script draws (texts, labels, number-work cells). */
export function textsOf(script) {
  const out = [];
  for (const o of script?.ops ?? []) {
    if (typeof o?.text === "string") out.push(o.text);
    if (Array.isArray(o?.rows)) out.push(o.rows.flat().map(String).join(" "));
  }
  return out;
}

const numNorm = (x) => String(x ?? "").replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/^\+/, "");
/** Every number the child named is written on the board (a text, a label or a number-work cell). PURE. */
export function numbersOn(script, said) {
  const want = (said ?? []).map(numNorm).filter(Boolean);
  if (!want.length) return true;
  const have = new Set(textsOf(script).flatMap((t) => String(t).replace(/[−–]/g, "-").split(/[\s,|;]+/)).map(numNorm).filter(Boolean));
  return want.every((n) => have.has(n));
}
/** A number line: the renderer's own (numwork number_line), or a drawn one: a long horizontal line crossed by ≥ 2 ticks. */
const hasNumberLine = (script) => {
  const ops = script?.ops ?? [];
  if (ops.some((o) => o?.op === "numwork" && o.layout === "number_line")) return true;
  const isH = (o) => (o?.op === "line" || o?.op === "arrow") && Array.isArray(o.from) && Array.isArray(o.to) && Math.abs(o.to[1] - o.from[1]) < 6 && Math.abs(o.to[0] - o.from[0]) >= 150;
  return ops.filter(isH).some((h) => {
    const y = h.from[1], xa = Math.min(h.from[0], h.to[0]), xb = Math.max(h.from[0], h.to[0]);
    return ops.filter((o) => o?.op === "line" && Array.isArray(o.from) && Array.isArray(o.to) && Math.abs(o.from[0] - o.to[0]) < 3 && Math.min(o.from[1], o.to[1]) <= y && Math.max(o.from[1], o.to[1]) >= y && o.from[0] >= xa - 2 && o.from[0] <= xb + 2).length >= 2;
  });
};

/**
 * Does this board answer the child's request? No request → yes. A number line asked → a number line is drawn. A thing
 * named → one of its words (or an equivalent) is written on the board. A picture / drawing asked with no thing named
 * ("isko draw karo") → any board does (it draws what is on the table). PURE.
 * @param {any} script @param {import("../../shared/studio").StudioRequest | null | undefined} request
 */
export function answersRequest(script, request, { drawnFor = false } = {}) {
  if (!request) return true;
  // a board the line planner drew FOR this request ("phool ke parts", "plant ki life cycle") labels the parts (petal, sepal …)
  // and may never write the whole's name: three labels or more answer a "parts / cycle / diagram" ask (never a ready-made one)
  if (drawnFor && request.subject && norm(request.subject).split(/\s+/).some((w) => WEAK.has(w)) && new Set(textsOf(script).map(norm)).size >= 3) return true;
  if (!script?.ops?.length) return false;
  // a number line with the numbers the child named on it ("1/4", "-3", "0.5"): a line of other numbers answers another question
  if (request.kind === "number_line") return hasNumberLine(script) && numbersOn(script, request.said);
  // an EXAMPLE ("ek example do"): a worked page, the example's numbers in steps, never a bare fact ("1/2 = 2/4 | same
  // amount", battery c6-example) or the lesson's ready-made steps with no numbers ("Find each | change | Check")
  if (request.kind === "example" && !request.subject) return workedPage(script);
  // a clock asked for: a circle with its 12 and its 6 is one (the code clock writes no name: request.js clockBoard)
  if (faceDrawing(request) && script.ops.some((o) => o?.op === "circle" && Number(o.r) >= 30) && ["12", "6"].every((n) => textsOf(script).includes(n))) return true;
  const words = subjectWords(request.subject);
  // a PICTURE asked with no thing named ("तस्वीर दिखाओ"): the lesson's ready-made flow chart is not a picture of anything she
  // describes (QA, round 5: "Dekho: ek tarazu…" over "Change to grams / Compare weights"); only the board drawn from her
  // own line answers it
  // round 5 merge (main; owner-5 on 14.1, 'picture dikhao' 2/2 an empty stage and an ASCII line in her reply): a ready-made
  // board that IS a drawing (a number line, a circle, a sector, a stroke: release 14 answered this ask with it) still does;
  // a page of text boxes never does
  if (!words.length) return request.kind !== "picture" || drawnFor || isDrawing(script);
  const all = textsOf(script).map(norm).join(" | ");
  return words.some((w) => all.includes(w));
}

/**
 * Round 5 (sim lab boardfacts, 709b A/A: 29-39 of ~260 new pages): a NEW page whose writing shares no content word (4+
 * letters, by its first 5 letters) and no number with her line is about something else ("Write 'six thousand forty-two'" up
 * while she asks "345 mein hundreds place ka digit?"; p25 pencil costs under cricket runs). The same predicate the sim lab
 * counts with (evals/simlab/boardfacts.mjs). A page that writes nothing (shapes only), or a turn whose line is not known,
 * is not judged. PURE.
 */
const SYNC_STOP = new Set("this that with from have what your kya hai hain aur yeh woh isko usko mein par kaise kitne kitna abhi phir karo dekho dekhiye board screen".split(" "));
// a number said in words is its digits ("teen chauthai" is the board's 3/4)
const NUM_WORDS = { ek: ["1"], one: ["1"], do: ["2"], two: ["2"], teen: ["3"], three: ["3"], chaar: ["4"], char: ["4"], four: ["4"],
  paanch: ["5"], panch: ["5"], five: ["5"], chhe: ["6"], che: ["6"], six: ["6"], saat: ["7"], seven: ["7"], aath: ["8"], eight: ["8"],
  nau: ["9"], nine: ["9"], das: ["10"], ten: ["10"], aadha: ["1", "2"], aadhi: ["1", "2"], half: ["1", "2"], chauthai: ["4"],
  quarter: ["4"], quarters: ["4"], tihai: ["3"], third: ["3"], thirds: ["3"], "एक": ["1"], "दो": ["2"], "तीन": ["3"], "चार": ["4"], "आधा": ["1", "2"] };
const syncWords = (s) => new Set(String(s ?? "").toLowerCase().normalize("NFKC").split(/[^\p{L}\p{M}\p{N}]+/u)
  .flatMap((w) => NUM_WORDS[w] ?? [w])
  // a word and its other-language name are one word ("भिन्न" in her line, "fraction" on the board): the SAME table above
  .flatMap((w) => (SAME_OF.has(w) ? [w, SAME_OF.get(w)[0]] : [w]))
  .filter((w) => (w.length >= 4 || /^\p{N}+$/u.test(w)) && !SYNC_STOP.has(w)).map((w) => (/^\p{N}+$/u.test(w) ? w : w.slice(0, 5))));
export function syncedWithLine(script, line) {
  const text = String(line ?? "").trim();
  const page = textsOf(script).join(" ");
  if (!text || !page.trim()) return true;
  const pw = syncWords(page);
  if (!pw.size) return true;
  const lw = syncWords(text);
  return [...pw].some((w) => lw.has(w));
}

/** A board that draws something (a figure or a number line), not only text boxes. PURE. */
export function isDrawing(script) {
  return (script?.ops ?? []).some((o) => ["circle", "ellipse", "sector", "stroke", "line", "x", "polygon", "path"].includes(o?.op) || (o?.op === "numwork" && o?.layout === "number_line"));
}

/** A worked page: three things written or more, two of them carrying numbers (the steps of an example). PURE. */
export function workedPage(script) {
  const t = [...new Set(textsOf(script).map((x) => String(x).trim()).filter(Boolean))];
  return t.length >= 3 && t.filter((x) => /\p{N}/u.test(x)).length >= 2;
}

/** A page's identity for "the same page again": the set of what it writes, or its shapes when it writes nothing. PURE. */
export function pageSig(script) {
  const t = [...new Set(textsOf(script).map((x) => norm(x).replace(/\s+/g, " ").trim()).filter(Boolean))].sort();
  if (t.length) return `t:${t.join("|")}`;
  const shapes = (script?.ops ?? []).map((o) => o?.op).filter(Boolean).sort();
  return shapes.length ? `s:${shapes.join(",")}` : "";
}

/** Is `script` the page already on the board (`prev`)? Never true for an empty page or no previous page. PURE. */
export function samePage(script, prev) {
  if (!script || !prev) return false;
  const a = pageSig(script), b = pageSig(prev);
  return !!a && a === b;
}

/**
 * The line planner's view of the request (server/studio/plan.js user message): how, the thing, the numbers. Never the
 * child's words, never a name. PURE.
 */
export function plannerRequest(request) {
  if (!request) return null;
  const subject = request.subject ? String(request.subject).slice(0, 40) : null;
  if (request.kind === "example") return { draw: "the example she gives, worked: every number she says, each step under the last, ? for what she asks" };
  if (request.kind === "number_line") return { draw: "a number line", ...(request.said?.length ? { numbers: request.said } : {}), ...(subject ? { about: subject } : {}) };
  if (!subject) return { draw: request.kind === "picture" ? "a simple picture of what she is talking about" : "a drawing of what she is talking about" };
  return { draw: `a simple labelled sketch of ${subject}`, label: subject, ...(request.offKit ? { note: "not in today's lesson: a plain sketch with its name, nothing else" } : {}) };
}

/** Does her line send the child's eyes to the screen or the board ("screen par … dekho", "board pe dekhiye", "look at the
 * board", स्क्रीन/बोर्ड पर)? PURE. */
const POINTS = /\b(?:screen|board|whiteboard)\s*(?:par|pe|per|mein|me|ke|ki|on)\b|\b(?:on|at)\s+the\s+(?:screen|board|whiteboard)\b|(?:स्क्रीन|बोर्ड)\s*(?:पर|पे|में|के|की)|\byahan\s+dekh\w*/iu;
export const pointsAtStage = (text) => POINTS.test(String(text ?? ""));

/**
 * Her line with the POINTING taken out and every word of content kept: "Screen par number line dekhiye: 0 aur 1 ke beech 4
 * barabar hisse. 1/4 kahan hoga?" → "Number line: 0 aur 1 ke beech 4 barabar hisse. 1/4 kahan hoga?". Unlike director/say.js
 * stripScreenRefs (which drops a sentence that is only pointing) nothing she explains is lost: the board drawn for the ask is
 * planned from these words (a dropped "1/4" left the board unable to mark it: W9). PURE.
 */
export function unpointGently(text) {
  let s = String(text ?? "");
  const before = s;
  s = s.replace(/\b(?:(?:ab|toh|to|zara|jara)\s+)?(?:screen|board|whiteboard)\s*(?:par|pe|per|mein|me|on)\s+((?:[\p{L}\p{N}/.,“”"'‘’-]+\s*){0,8}?)\s*(?:dekho|dekhiye|dekhie|dekh\s+lo|dekhte\s+hain|dekhein|look)\b\s*/giu, (_m, what) => (what ? `${what.trim()} ` : ""))
    .replace(/(?:स्क्रीन|बोर्ड)\s*(?:पर|पे|में)\s+((?:\S+\s+){0,5}?)(?:देखो|देखिए|देखें)\s*/gu, (_m, what) => (what ? `${what.trim()} ` : ""))
    .replace(/\b(?:look\s+at\s+the\s+(?:screen|board|whiteboard)|on\s+the\s+(?:screen|board|whiteboard))\b\s*[:,—-]?\s*/giu, "")
    .replace(/\b(?:screen|board|whiteboard)\s*(?:par|pe|per|mein|me)\b\s*/giu, "")
    .replace(/(?:स्क्रीन|बोर्ड)\s*(?:पर|पे|में)\s*/gu, "")
    .replace(/(^|[.!?।]\s+)(?:dekho|dekhiye|dekhie|look)\s*[,:—-]\s*/giu, "$1")
    .replace(/\s+([,.;!?।:—-])/g, "$1").replace(/^\s*[:,—-]\s*/, "").replace(/([.!?।]\s+)[:,—-]\s*/g, "$1").replace(/\s{2,}/g, " ").trim();
  // what is left of "screen par X ka picture dekhiye:" is "X ka picture:", which still says a picture is there: "X:"
  if (s !== before) s = s.replace(/([\p{L}]{2,20})\s+(?:ka|ki|ke)\s+(?:picture|photo|image|tasveer|chitra)\s*:/giu, "$1:");
  if (s === before) return before;
  // capitalise the first letter of each sentence that lost its start
  return s.replace(/(^|[.!?।]\s+)([a-z])/g, (_m, a, b) => a + b.toUpperCase());
}

/**
 * The gate's withheld values (W9: what the board must not show) minus the numbers the CHILD asked to see: showing 1/4 on a
 * number line is the answer to their own ask, not a reveal. The open question's own key stays withheld whoever names it (a
 * child asking "number line pe 3/4 dikhao" while 3/4 is the answer still works it out). PURE.
 */
export function freeAsked(withhold, request, openItem) {
  // QA pass 12 D36 (prod 14.2 c90ad692, "ghadi draw karo": the clock showed "?" for 2, 4 and 7 while she said 1 to 12): every
  // number the ASK itself carries is a given, not an answer (the numbers they said, a clock's face numerals, a number line's
  // 0 and 1); only the open item's own key stays withheld
  const said = askedNumbers(request).map(numNorm).filter(Boolean);
  if (!withhold?.values?.length || !said.length) return withhold;
  const keys = new Set([openItem?.answer, ...(openItem?.acceptable ?? [])].filter((x) => x != null).map(numNorm));
  return { ...withhold, values: withhold.values.filter((v) => !said.includes(numNorm(v)) || keys.has(numNorm(v))) };
}

const rat = (s) => {
  const t = numNorm(s);
  const f = /^(-?\d+)\/(\d+)$/.exec(t);
  if (f) return Number(f[2]) ? { v: Number(f[1]) / Number(f[2]), q: Number(f[2]) } : null;
  if (/^-?\d+(?:\.\d+)?$/.test(t)) { const dec = (t.split(".")[1] ?? "").length; return { v: Number(t), q: dec ? 10 ** Math.min(dec, 2) : 1 }; }
  return null;
};
/**
 * The number line the child asked for, drawn by code from the numbers they named (no model): a line with equal steps, 0
 * and the asked numbers labelled and marked. Integers use the renderer's own number line (it labels whole numbers);
 * fractions and decimals are drawn as a line, ticks and labels (the renderer labels only whole numbers). → a script in the
 * planner's shape, or null when nothing was named or it cannot be drawn legibly (the line plan draws it then). PURE.
 * @param {import("../../shared/studio").StudioRequest | null} request @param {{ scriptId?: string, lessonId?: string }} [o]
 */
export function numberLineBoard(request, { scriptId = "nl", lessonId = "", spanMs = 3000 } = {}) {
  if (request?.kind !== "number_line" || !request.said?.length) return null;
  const vals = request.said.map((s) => ({ s: numNorm(s), r: rat(s) })).filter((x) => x.r);
  if (!vals.length || vals.length !== request.said.length) return null;
  const board = { w: 400, h: 300 };
  // paced across her line (W6: drawn while she speaks, the marks in its later part), ~6 beats
  const beat = Math.max(250, Math.min(1500, (Number(spanMs) || 3000) * 0.75 / 6));
  const T = (i, n = 1) => ({ startMs: 300 + Math.round(i * beat), endMs: 300 + Math.round(i * beat + Math.max(200, beat * 0.85) * n) });
  const ops = [];
  // one drawn line for every kind (the renderer's own number line writes its range ends, numbers nobody said: W4): equal
  // ticks, only 0, the whole-number ends of a fraction line and the asked numbers labelled, the asked ones marked
  const q = Math.max(...vals.map((x) => x.r.q));
  const allInt = q === 1;
  // from 0 to the asked numbers, no padding: her line counts the steps ("0 se 3 steps left"), and the gate holds the drawn
  // steps to her count (W8)
  const lo = Math.min(0, Math.floor(Math.min(...vals.map((x) => x.r.v))));
  const hi = Math.max(allInt ? 0 : 1, Math.ceil(Math.max(...vals.map((x) => x.r.v))));
  if (hi - lo > 100 || (!allInt && q > 12 && q !== 100)) return null;
  const unit = allInt ? (hi - lo <= 24 ? 1 : hi - lo <= 60 ? 5 : 10) : 1 / (q === 100 ? 10 : q);
  const steps = Math.round((hi - lo) / unit);
  if (steps < 1 || steps > 24) return null;
  const x0 = 40, x1 = 360, y = 160, xOf = (v) => x0 + ((v - lo) / (hi - lo)) * (x1 - x0);
  ops.push({ id: "line", op: "line", from: [x0, y], to: [x1, y], ...T(0, 2) });
  for (let i = 0; i <= steps; i++) { const x = x0 + (i / steps) * (x1 - x0); ops.push({ id: `k${i}`, op: "line", from: [x, y - 8], to: [x, y + 8], ...T(1 + i * (2 / steps)) }); }
  const asked = new Set(vals.map((x) => x.r.v));
  const frame = [...new Set([0, ...(allInt ? [] : [lo, hi])])].filter((v) => !asked.has(v));
  frame.forEach((v, i) => ops.push({ id: `e${i}`, op: "text", at: [xOf(v), y + 36], text: String(v), size: "m", align: "middle", ...T(3 + i * 0.3) }));
  vals.forEach((x, i) => {
    ops.push({ id: `p${i}`, op: "circle", c: [xOf(x.r.v), y], r: 7, fill: "accent", ink: "accent", ...T(4 + i) });
    ops.push({ id: `l${i}`, op: "text", at: [xOf(x.r.v), i % 2 ? y + 36 : y - 22], text: x.s, size: "m", align: "middle", ink: "accent", ...T(4.4 + i) });
  });
  const durationMs = Math.max(...ops.map((o) => o.endMs)) + 200;
  return { v: 1, scriptId, line: { lessonId }, anchor: "line_audio_start", board: { ...board, ground: "chalk" }, mode: "fresh", durationMs, ops };
}
/**
 * Round 5 (owner decision 14.2, battery c3-clock "ghadi draw karo"): a clock face drawn by code, gated like any board: its
 * circle, 1-12 inside the rim, a centre dot and two hands at ten past ten (no time is written; the hands are radii, W8 face).
 * The line planner's clocks failed W2 (twelve numbers over each other). null unless a clock was asked for. PURE.
 */
export function clockBoard(request, { scriptId = "clock", lessonId = "", spanMs = 3000 } = {}) {
  const words = String(request?.subject ?? "").toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u);
  if (!words.some((w) => FACE_NUMBERS[0][0].includes(w))) return null;
  const c = [200, 150], R = 112, rN = 88;
  const beat = Math.max(150, Math.min(900, (Number(spanMs) || 3000) * 0.75 / 16));
  const T = (i, n = 1) => ({ startMs: 300 + Math.round(i * beat), endMs: 300 + Math.round(i * beat + Math.max(150, beat * 0.85) * n) });
  const at = (deg, r) => [Math.round(c[0] + r * Math.sin((deg * Math.PI) / 180)), Math.round(c[1] - r * Math.cos((deg * Math.PI) / 180))];
  const ops = [{ id: "face", op: "circle", c, r: R, weight: 2, ...T(0, 2) }];
  for (let h = 1; h <= 12; h++) { const [x, y] = at(h * 30, rN); ops.push({ id: `n${h}`, op: "text", at: [x, y + 6], text: String(h), size: "s", align: "middle", ...T(2 + h * 0.8) }); }
  ops.push({ id: "hour", op: "line", from: c, to: at(305, 48), weight: 3, ink: "accent", ...T(13) });
  ops.push({ id: "minute", op: "line", from: c, to: at(60, 70), weight: 2, ...T(14) });
  ops.push({ id: "pin", op: "circle", c, r: 4, fill: "ink", ...T(15) });
  const durationMs = Math.max(...ops.map((o) => o.endMs)) + 200;
  return { v: 1, scriptId, line: { lessonId }, anchor: "line_audio_start", board: { w: 400, h: 300, ground: "chalk" }, mode: "fresh", durationMs, ops };
}
/**
 * Round 5 (sim lab 709b6acb, the 13 lessons still flagged): a line that ASSUMES a visual with no screen word in it, said over
 * an empty stage: "Table mein Baisakhi kis month mein dikh rahi hai?" (no table; the child: "screen pe toh kuch nahi dikh
 * raha"), "Aap 3335 ko mark kijiye" (no number line), "Timeline picture: charter → Plassey" (nothing drawn). The visual noun
 * goes, the content stays: "Baisakhi kis month mein dikh rahi hai?", "Aap 3335 kahan aayega, bataiye", "Timeline: …". PURE.
 */
const VISUAL_NOUN = "(?:table|chart|diagram|drawing|graph|timeline|number\\s+line|grid|picture|photo|tasveer|chitra|chitr|तालिका|चार्ट|चित्र|तस्वीर)";
export function unassumeVisual(text) {
  const before = String(text ?? "");
  const s = before
    // "Yeh timeline aapke liye seedhi line mein dikh rahi hai" over nothing (sim lab 4ae682b3 p51, five turns running): a
    // visual noun said to be SEEN is said to BE
    .replace(new RegExp(`(\\b${VISUAL_NOUN}\\b[^.?!।]{0,60}?)\\s+(?:dikh|dikhai\\s+de|dikhayi\\s+de)\\s+(?:rahi|raha|rahe)\\s+hai\\b`, "giu"), "$1 hai")
    // "aapke saamne number line hai: …" (sim lab 24175dbe p51) over nothing: she asks them to picture it
    .replace(new RegExp(`\\b(?:aapke|tumhare|tere|apne)\\s+saamne\\s+(?:ek\\s+)?(${VISUAL_NOUN})\\s+hai\\b`, "giu"), "socho, ek $1 hai")
    .replace(new RegExp(`\\b(?:is|iss|us|uss|this|the|ye|yeh)?\\s*${VISUAL_NOUN}\\s+(?:mein|me|par|pe|per|में|पर)\\s+`, "giu"), "")
    .replace(new RegExp(`\\b(?:on|in)\\s+the\\s+${VISUAL_NOUN}\\b\\s*,?\\s*`, "giu"), "")
    .replace(new RegExp(`([\\p{L}]{2,20})\\s+${VISUAL_NOUN}\\s*:`, "giu"), "$1:")
    .replace(/\bko\s+mark\s+(?:kijiye|kijie|kariye|karo|karein|karen|kar\s+do)\b/giu, "kahan aayega, bataiye")
    .replace(/\bmark\s+(?:kijiye|kijie|kariye|karo|karein|karen|kar\s+do)\b/giu, "bataiye")
    // "upar uthti vapour ko dekhiye" over nothing (battery rel141 c6-evaporation): to look at a thing that is not there is to
    // picture it
    .replace(/\bko\s+(?:dekhiye|dekhie|dekhein|dekhen)\b/giu, "ko imagine kijiye").replace(/\bko\s+dekho\b/giu, "ko imagine karo")
    .replace(/\s+([,.;!?।:])/g, "$1").replace(/\s{2,}/g, " ").trim();
  if (s === before.trim()) return before;
  return s.replace(/(^|[.!?।]\s+)([a-z])/g, (_m, a, b) => a + b.toUpperCase());
}
/**
 * Round 5 (14.3, owner-5 on 14.2 a978ae27: "picture dikhao" answered with "0 se 1 tak paanch barabar gaps hain…" and no word
 * sending the child to the board that was being drawn for it, V2.no_reference). Does her line send their eyes anywhere on
 * the stage? PURE.
 */
export const refersToBoard = (text) => /\b(?:screen|board|whiteboard|picture|drawing|diagram|dekh\w*|look\w*|see)\b|स्क्रीन|बोर्ड|देख|तस्वीर|चित्र/iu.test(String(text ?? ""));
/** The fixed pointer put before her line when an asked-for board is being drawn and she never points at it. PURE. */
// (QA pass 13: an English-preference child's Hinglish line got "Look at the board: Kabir, number line imagine karo…": the
// pointer is in the language of HER line, not the child's setting: Devanagari, else English only for a line with no Hindi word)
const HINDI_WORD = /\b(?:hai|hain|karo|kijiye|kariye|ke|ka|ki|ko|se|par|pe|mein|aur|kya|kitna|kitne|nahi|nahin|yeh|ye|dekho|dekhiye|socho|bataiye|batao|hoga|hogi)\b/iu;
export const boardPointer = (lang, line = "") => {
  const t = String(line ?? "");
  if (/[\u0900-\u097F]/u.test(t)) return "बोर्ड पर देखो: ";
  if (t) return HINDI_WORD.test(t) ? "Board par dekho: " : "Look at the board: ";
  return lang === "english" ? "Look at the board: " : lang === "hindi" ? "बोर्ड पर देखो: " : "Board par dekho: ";
};
/** The board she should send them to IS coming, and her line says to picture it ("number line imagine karo"): see it instead. PURE. */
export const seeNotImagine = (text) => String(text ?? "")
  .replace(/\bimagine\s+(kijiye|kariye|karein|karen)\b/giu, "dekhiye").replace(/\bimagine\s+karo\b/giu, "dekho").replace(/\bimagine\b(?=\s+(?:the|a|an|this)\b)/giu, "look at");
/** Does her line say there is no game (honest), or announce one ("Chalo mirror line game")? PURE. */
const GAME_WORD = /\b(?:game|games)\b|गेम/iu;
const NO_GAME = /\b(?:game|games)\b.{0,40}?\b(?:nahi|nahin|not|isn't|no)\b|\b(?:no|koi|abhi)\b.{0,20}?\bgame\b.{0,20}?\b(?:nahi|nahin|ready nahi)\b|गेम.{0,30}?नहीं|\bno\s+game\b/iu;
export const announcesGame = (text) => GAME_WORD.test(String(text ?? "")) && !NO_GAME.test(String(text ?? ""));
/**
 * Round 5 (owner decision 14.2, battery c4-game): a game asked for with no game to mount, and her line announced one anyway
 * ("Chalo “mirror line” game: imaginary fold socho"): the word goes, the activity in words stays ("activity"). PURE.
 */
export function ungame(text) {
  const s = String(text ?? "");
  if (!announcesGame(s)) return s;
  return s.replace(/\b(?:game|games)\b/giu, "activity").replace(/गेम/gu, "activity");
}
/** Things whose drawing IS numbers (round 5 battery c3-clock: "ghadi draw karo" was refused by W4, the face's 1-12 were
 *  not in her line): the subject's group → the numbers its face carries. Small, explicit table: never a model. */
const FACE_NUMBERS = [
  [["ghadi", "clock", "घड़ी", "watch"], Array.from({ length: 12 }, (_, i) => String(i + 1))],
  [["scale", "ruler", "paimana", "पैमाना"], Array.from({ length: 16 }, (_, i) => String(i))],
];
const faceNumbers = (subject) => {
  const words = String(subject ?? "").toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  return FACE_NUMBERS.filter(([names]) => words.some((w) => names.includes(w))).flatMap(([, nums]) => nums);
};
/** Is the asked thing one whose drawing is a face of numbers (a clock: its hands are radii, not cuts of a whole)? PURE. */
export const faceDrawing = (request) => faceNumbers(request?.subject).length > 0;
/** The numbers a request lets the board write (the asked ones; 0 and 1, the frame of a number line; a clock's 1-12). PURE. */
export const askedNumbers = (request) => [...new Set([...(request?.said ?? []).map(numNorm), ...(request?.kind === "number_line" ? ["0", "1"] : []), ...faceNumbers(request?.subject)])];

/** The thing her own line says a picture shows ("potato ka picture", "picture of a potato", "आलू की तस्वीर"), or null. PURE. */
export function pictureSubjectOf(text) {
  const m = String(text ?? "").match(/([\p{L}]{2,20})\s+(?:ka|ki|ke|की|का|के)\s+(?:picture|photo|image|tasveer|chitra|sketch|drawing|तस्वीर|फोटो|चित्र)|\b(?:picture|photo|image|sketch|drawing)\s+of\s+(?:an?\s+|the\s+)?([\p{L}]{2,20})/iu);
  const w = (m?.[1] ?? m?.[2] ?? "").trim();
  return w && !/^(?:is|us|iss|uss|yeh|ye|woh|wo|this|that|it|ek|a|an|the|aap|tum)$/i.test(w) ? w : null;
}

/** Was this page shown before in the lesson (`seen`: the lesson's page signatures), or is it the page up now (`avoid`)?
 * Round 5 sim lab: 19 of 40 whole lessons showed a page again later (p02 re-showed turn 5's page at turns 8-9). PURE. */
export function shownBefore(script, { avoid = null, seen = null } = {}) {
  if (samePage(script, avoid)) return true;
  const sig = pageSig(script);
  return !!sig && !!seen?.has?.(sig);
}
