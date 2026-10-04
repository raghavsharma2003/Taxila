// Shared harness for the OWNER TEST 2026-10-04 experience acceptance tests (tests/prod/owner-<item>-*.mjs; BUILD-PLAN
// "OWNER TEST 2026-10-04": items 1-5 MUST pass before Wave 2 exits). Not a plumbing battery
// (context/rejected.md rj-plumbing-batteries-as-acceptance): every check sits inside a real lesson driven by child-like
// turns (typed AND spoken), and every failure names the turn, what the child said and what the teacher did.
//
// Common flags (every owner-*.mjs):
//   --base URL        target (default TAXILA_BASE, else production https://taxila.dev)
//   --seed N          the random seed (printed; the same seed replays the same child choices)
//   --out DIR         where the run's transcripts go (default evals/owner-truth/results/acceptance-<stamp>/)
//   --judge model     also run the model judge (Azure taxila-brain; .env.local keys) on top of the code rubric; a reply
//                     fails when EITHER judge flags it (strict). Default: code rubric only (no model calls by the test).
//   --browser / --no-browser   the Chromium checks (owner-1, owner-5); default on when Chromium exists
// Every test creates ONE @taxila.test guardian (tests/prod/lib.mjs withTestAccount) and as many children on it as it
// needs (a fresh child per lesson, so "today's lesson is done" never blocks a probe), and deletes the account in a
// finally, pass or fail. Run under NODE_USE_ENV_PROXY=1 from the sandbox. Costs production model calls (the lessons).
//
// The judge is deliberately INDEPENDENT of the product: the reply rubric below is written here, not imported from
// server/director/say.js (a guard and its own test sharing a regex pass together and fail together). The one import
// from server code is the never-rules floor predicate (director/safety.js floorViolations): it IS the safety contract.
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const ROOT = join(HERE, "..", "..");
const argv = process.argv.slice(2);
export const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
export const flag = (k) => argv.includes(`--${k}`);
process.env.TAXILA_BASE = arg("base", process.env.TAXILA_BASE || "https://taxila.dev");
const lib = await import("./lib.mjs");
export const { apiClient, ok, warn, done, BASE, isLocal } = lib;
const { floorViolations } = await import("../../server/director/safety.js");
export { floorViolations };

// ───────────────────────────── seeded randomness ─────────────────────────────
let seed = Number(arg("seed", Date.now() % 1_000_000));
export const SEED = seed;
export const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
export const pick = (a) => a[Math.floor(rnd() * a.length)];
export const shuffle = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

// ───────────────────────────── output ─────────────────────────────
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
export const OUT = arg("out", join(ROOT, "evals", "owner-truth", "results", `acceptance-${stamp}`));
export function save(name, data) {
  mkdirSync(OUT, { recursive: true });
  const p = join(OUT, name);
  writeFileSync(p, JSON.stringify(data, null, 1));
  return p;
}

// ───────────────────────────── kits: the verified keys ─────────────────────────────
const kitFiles = new Map();
export function kitOf(topicId) {
  const file = topicId.split("-").slice(0, 2).join("-");
  if (!kitFiles.has(file)) kitFiles.set(file, JSON.parse(readFileSync(join(ROOT, "data", "kits", `${file}.json`), "utf8")));
  const kit = kitFiles.get(file).topics.find((t) => t.topicId === topicId);
  if (!kit) throw new Error(`no kit for ${topicId}`);
  return kit;
}
export function allKitTopics() {
  return readdirSync(join(ROOT, "data", "kits")).filter((f) => /^c\d-[a-z]+\.json$/.test(f))
    .flatMap((f) => JSON.parse(readFileSync(join(ROOT, "data", "kits", f), "utf8")).topics.map((t) => t.topicId));
}
let diagnosticItems = () => [];
try { ({ diagnosticItems } = await import("../../server/forge/derive.js")); } catch { /* optional */ }
export function itemOf(kit, id) {
  if (!id) return null;
  return kit.items.find((i) => i.id === id) ?? (() => { try { return diagnosticItems(kit).find((i) => i.id === id) ?? null; } catch { return null; } })();
}

// ───────────────────────────── text helpers ─────────────────────────────
export const norm = (s) => String(s ?? "").toLowerCase().normalize("NFKC").replace(/[.,!?;:'"()।“”‘’]/g, " ").replace(/\s+/g, " ").trim();
export const FRAC = /(-?\d+)\s*\/\s*(\d+)/;
export function numOf(s) {
  const t = String(s ?? "").replace(/(\d),(?=\d)/g, "$1");
  const mixed = t.match(/(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const f = t.match(FRAC);
  if (f) return Number(f[2]) ? Number(f[1]) / Number(f[2]) : null;
  const n = t.match(/-?\d+(\.\d+)?/);
  return n ? Number(n[0]) : null;
}
export const keysOf = (item) => [item.answer, ...(item.acceptable ?? [])].filter((x) => x != null && String(x).trim());
export function matchesKey(item, text) {
  const t = norm(text);
  if (keysOf(item).some((k) => norm(k) && (t === norm(k) || t.includes(norm(k))))) return true;
  const kn = numOf(item.answer), tn = numOf(text);
  return kn != null && tn != null && Math.abs(kn - tn) < 1e-9 && FRAC.test(String(item.answer)) === FRAC.test(String(text));
}
const shortest = (arr) => [...arr].sort((a, b) => String(a).length - String(b).length)[0];
const tokens = (s) => new Set(norm(s).split(" ").filter((w) => w.length > 2));
export function jaccard(a, b) {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let i = 0; for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i);
}
export const sentencesOf = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? []).map((x) => x.trim()).filter(Boolean);
export const DEVANAGARI = /[ऀ-ॿ]/g;
const HI_WORDS = /\b(hai|hain|tha|thi|hoga|hogi|honge|kya|ko|ka|ke|ki|se|mein|par|pe|aur|nahi|nahin|hota|hoti|hote|karo|karte|kijiye|kariye|chalo|dekho|dekhiye|samjho|samjhiye|jaise|jaisa|matlab|yaani|toh|bhi|ek|teen|char|paanch|tum|aap|aapka|tumhara|yeh|ye|woh|wo|kaise|kaisa|kyun|kyon|batao|bataiye|batayiye|sochiye|socho|ab|phir|agar|lekin|sirf|bahut|thoda|sab|kuch|koi|apna|apne|hum|main|mujhe|liye|saath|baad|pehle|wala|wali|wale|raha|rahi|rahe|rehta|rehti|jata|jaata|jaati|milta|milega|banta|banega|hua|hui|kitna|kitne|kitni|kaun|kahan|kab|haan|achha|theek)\b/gi;
const EN_WORDS = /\b(the|a|an|is|are|was|were|be|of|and|or|to|in|on|at|for|with|from|by|as|it|its|this|that|these|those|what|which|who|how|why|when|where|number|line|fraction|part|parts|equal|first|mark|now|your|you|we|our|they|their|he|she|has|have|had|do|does|did|can|could|will|would|should|let|think|answer|question|example|step|next|say|tell|find|make|more|one|two|three|each|every|other|starts|start|passes|through|similar|about|if|then|so|not|no|yes|here|there|look|shows|show)\b/gi;
export function hindiShare(s) {
  const t = String(s ?? "");
  if ((t.match(DEVANAGARI) ?? []).length > 10) return 1;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  return Math.min(1, (t.match(HI_WORDS) ?? []).length / words * 2.5);
}
export const enShare = (t) => (String(t).match(EN_WORDS) ?? []).length / (String(t).split(/\s+/).filter(Boolean).length || 1);
/** What a child's turn looks like on the spoken (cascade) lane: an ASR transcript, lower case, no punctuation. */
export const spokenForm = (t) => String(t).toLowerCase().replace(/[?!.,;:"“”]/g, "").replace(/\s+/g, " ").trim();

// ───────────────────────────── the reply rubric (code judge) ─────────────────────────────
// Every pattern here is written against the defects of the owner's 0/100 session (evals/owner-truth/ROOT-CAUSES.md,
// F1-F21) and the 394 transcribed turns of evals/owner-truth/results/2026-10-04T18-30-08.
export const RX = {
  fallback: /lost my words for a second|meri baat atak gayi|meri baat atak|can you say that again\?$/i,
  // the fixed disclosure line (F10): only correct after a disclosure
  disclosure: /what you said matters|tumne jo bataya,? woh zaroori hai|aapne jo bataya,? woh zaroori hai/i,
  stage: /(?:^|[\s(—-])(?:whiteboard(?:\s+anchor)?|board|shape|move|note|key|ladder|rung|lesson now|turn shape|your move)\s*:|\bTURN SHAPE\b|\bLESSON NOW\b|\[[^\]]+\]/i,
  strayScript: /[ঀ-෿઀-૿؀-ۿ฀-๿]/,
  danglingOpen: /^[\s]*[”"'’)\]]/,
  asciiArt: /[\u2500-\u257F]{2,}|[\u2500-\u257F|]\s*[—–-]{2,}|(?:[—–-]{2,}\s*[|\u2500-\u257F]){2,}|(?:[|_\-=+*#]{3,}.*\n){2,}|(?:\|\s*[—–-]*\s*){3,}|-{4,}>|={4,}|\+-{3,}\+|●[─—-]{3,}|[─—-]{3,}→/,
  defer: /\b(baad mein (?:baat|bataunga|batati|batata|karenge|dekhenge)|later|pehle .{0,40}(?:khatam|finish|poora)|after this (?:question|lesson)|abhi .{0,30}(?:par|pe) (?:lautte|wapas|focus)|let'?s get back|wapas (?:aate|chalte) hain)\b/i,
  cantDraw: /\b(i can'?t|i cannot|i am not able to|i'm not able to|main nahi|mai nahi|mein nahi)\s+(?:\w+\s+){0,3}(draw|show|bana|dikha)|\b(drawing|picture|diagram)\s+(?:nahi|not)\s+(?:bana|dikha|show|draw)|\b(?:dikha|bana|chala|draw\s+kar|show\s+kar)\s+nahi\s+(?:sakta|sakti|sakte|paunga|paungi|payenge|paati|paata)\b|text[- ]only|no (?:pictures|images|drawing)/i,
  childDraws: /\b(aap|tum)\s+(?:\w+\s+){0,4}(?:banao|banaiye|bana lo|bana lijiye|draw karo|draw kijiye|draw|sketch)\b|\b(?:draw|sketch)\s+(?:it|this|a)\s+(?:yourself|on (?:your|a) (?:copy|notebook|paper))|copy (?:mein|par|pe) bana|\b(?:board|whiteboard|copy|paper|notebook|kaagaz)\s+(?:par|pe|mein)\b[^.?!]{0,60}?\b(?:banaiye|banao|bana\s+(?:lijiye|lo|dijiye)|draw\s+(?:kijiye|karo|kariye)|likhiye|likho)\b|\b(?:aise|ab|pehle)\s+draw\s+(?:kijiye|karo|kariye)\b|\bdraw\s+(?:kijiye|karo|kariye)\b/i,
  imagine: /\b(imagine|socho ki|sochiye ki|man mein|mann mein|picture (?:sochiye|socho)|kalpana)\b/i,
  // refers to something on the stage
  refers: /\b(dekho|dekhiye|dekhte|dekhna|screen|board|diagram|picture|tasveer|chitra|drawing|banaya|bana (?:rahi|raha|diya)|game|khel|activity|niche|neeche|yahan|here|look|see|shown|on the right|left mein|tray|line par|bars?|model)\b/i,
  // the child is told to speak slowly (F14), or to "think in Hindi" (F12)
  childSlow: /\b(dheere|dhire|slowly)\s+(?:se\s+)?(?:bol|boliye|bolo|bataiye|batao|say|speak|repeat)|say it (?:once more|again),? slowly/i,
  thinkInHindi: /hindi mein soch/i,
  praiseOpen: /^\s*(?:[\p{L}]+\s*[,—-]\s*)?(?:✅|✔|👍|👏|🎉|🌟|⭐|💯|bilkul|sahi|correct|exactly|perfect|great|well done|very good|good job|shabaa?sh|wah|badhiya|ekdam sahi|you got it|that'?s right)/iu,
  praiseAny: /\b(?:aapne|tumne|you)\b[^.!?]{0,60}\b(?:sahi|correct(?:ly)?|right)\s+(?:kaha|bataya|likha|likhi|likhe|pehchana|pehchaana|jodi|joda|chuni|chuna|socha|pakda|nikala|got|said|found|identified)\b|\bsahi (?:jawab|answer)\b(?!\s*(?:kya|kaun|hoga))|\bthat'?s (?:right|correct)\b/iu,
  denyAny: /\b(?:galat|galti\b[^.!?]{0,40}\b(?:hui|ho gayi|ho gai|kar di|kiya)|step (?:toot|tut|chhoot|chhut) gaya|not quite|not right|that'?s wrong|incorrect|you made a mistake|sahi nahi)\b/i,
  wrapWords: /\b(aaj ke liye (?:bas )?(?:itna|yahin)|lesson (?:yahin )?(?:khatam|khatm)|phir milenge|phir milte hain|goodbye|bye[\s-]*bye|see you|that'?s all for today|let'?s stop (?:here|for today)|yahin rok(?:te| dete) hain)\b/i,
};

/** The teacher's line on the stage after this response (whiteboard, mount, studio slot, studio op). */
export function stageOf(r) {
  const out = [];
  for (const c of r?.moduleCommands ?? []) if (c.op === "mount") out.push(`mount ${c.engine}`);
  if (r?.ui?.whiteboard && r.ui.whiteboard.kind !== "text") out.push(`whiteboard ${r.ui.whiteboard.kind}`);
  if (r?.ui?.studioSlot) out.push(`studioSlot ${r.ui.studioSlot.state ?? ""}`.trim());
  if (r?.studio && Object.keys(r.studio).length) out.push(`studio ${Object.keys(r.studio).join(",")}`);
  return out;
}
/** Something NEW on the stage in `r` versus `prev`: a mount, a changed non-text board for the same question, a new studio slot or op. */
export function newStageOf(r, prev, { visualOnly = false } = {}) {
  const out = [];
  for (const c of r?.moduleCommands ?? []) if (c.op === "mount") out.push(`mount ${c.engine}`);
  // visualOnly: a board counts only as an IMAGE (UiDirectives.whiteboard.kind "image"): "text" and "math" boards carry the
  // written problem (a worked example's line), which changes on its own as teaching moves on and is not a picture
  if (r?.ui?.whiteboard && (visualOnly ? r.ui.whiteboard.kind === "image" : r.ui.whiteboard.kind !== "text") && JSON.stringify(r.ui.whiteboard) !== JSON.stringify(prev?.ui?.whiteboard ?? null)
    && (r.ui?.ask?.itemId ?? null) === (prev?.ui?.ask?.itemId ?? null)) out.push(`whiteboard ${r.ui.whiteboard.kind} (new)`);
  if (r?.ui?.studioSlot && JSON.stringify(r.ui.studioSlot) !== JSON.stringify(prev?.ui?.studioSlot ?? null)) out.push(`studioSlot ${r.ui.studioSlot.slotId ?? ""}`);
  if (r?.studio?.reveal) out.push(`studio reveal ${r.studio.reveal}`);
  return out;
}

/**
 * THE STRICT RUBRIC for one teacher reply (owner item 2: "any turn that errors, falls back, loops, repeats, or answers
 * something the child didn't say is a defect"). Pure. Returns a list of { code, why } defects; [] is a clean turn.
 *   ctx: { child, kind (child turn kind: answer|filler|confused|offtopic|steer|visual|stop|module|greet), prevReply,
 *          earlier (all earlier teacher replies of the lesson), askHistory (ui.ask.text of the last turns), lane,
 *          lang, item (the kit item the response pins, for the floor's verified content), expectEnd }
 */
export function rubric(r, ctx) {
  const d = [];
  const add = (code, why) => d.push({ code, why });
  if (!r || r.error) { add("R1.error", `the turn failed: ${r?.error?.status ?? ""} ${String(r?.error?.message ?? "").slice(0, 160)}`); return d; }
  const rep = String(r.teacherReply ?? "");
  const kind = r.move?.kind ?? "";
  if (!rep.trim() && !r.end && ctx.lane !== "voice") add("R1.empty", "no teacher words on a text/cascade turn");
  if (RX.fallback.test(rep)) add("R2.fallback", "the fixed model-failure line was shipped");
  if (RX.disclosure.test(rep) && !ctx.distress) add("R2.disclosure_line", "the fixed disclosure line (\"what you said matters\") on a turn with no disclosure (F10)");
  const ask = r.ui?.ask?.text ?? null;
  // only a KIT question pinned on the card (ui.ask.itemId): a turn with no item takes its card text from her own words
  if (rep && ask && r.ui?.ask?.itemId && ctx.kind !== "module" && (norm(rep) === norm(ask) || (norm(ask).includes(norm(rep)) && norm(rep).length > 0)))
    add("R3.bare_question", "the reply is only the pinned question: what the child said got no answer (F17/F19)");
  // what she said BESIDES the pinned question (a re-posed question is not new content)
  const own = (t, a) => (a ? String(t ?? "").split(a).join(" ") : String(t ?? "")).trim();
  // only a KIT question is subtracted (an item-less turn's card text is her own last question)
  const kitAsk = r.ui?.ask?.itemId ? ask : null;
  const prevAsk = ctx.prevAsk ?? null;
  const fresh = own(rep, kitAsk), before = own(ctx.prevReply, prevAsk);
  const sameAsBefore = !fresh || fresh.split(/\s+/).length < 4 || (before && jaccard(fresh, before) >= 0.6);
  const dup = (ctx.earlier ?? []).find((p) => p && rep && (norm(p) === norm(rep) || jaccard(p, rep) >= 0.8));
  if (dup) add("R4.repeat", `repeats an earlier teacher line (similarity ${jaccard(dup, rep).toFixed(2)})`);
  const ss = sentencesOf(rep).filter((x) => x.length > 20);
  const twice = ss.findIndex((a, i) => ss.slice(i + 1).some((b) => norm(a) === norm(b) || jaccard(a, b) >= 0.85));
  if (twice >= 0) add("R4.dup_in_turn", `the same sentence twice in one turn ("${ss[twice].slice(0, 60)}…") (F20)`);
  const hist = [...(ctx.askHistory ?? []), ask].filter(Boolean).slice(-4);
  if (hist.length === 4 && hist.every((a) => norm(a) === norm(hist[0]))) add("R5.loop", `the same question on the card for 4 turns: "${hist[0].slice(0, 70)}" (F19)`);
  if (RX.strayScript.test(rep)) add("R6.script", "a stray non-Latin, non-Devanagari script in the reply (F18)");
  if (RX.danglingOpen.test(rep)) add("R6.dangling", "the reply opens on a dangling quote: a gutted turn (F18)");
  if (RX.stage.test(rep)) add("R6.stage", "a field name, prompt label or markup was read out (\"Whiteboard anchor:\") (F18)");
  if (RX.asciiArt.test(rep)) add("R6.ascii", "a text 'diagram' in the reply (F16)");
  if (["hook", "explain", "worked_example", "reteach"].includes(kind) && !["steer", "visual", "offtopic"].includes(ctx.kind) && rep.trim() && rep.trim().split(/\s+/).length < 9) add("R6.gutted", `a ${kind} turn with almost no content: "${rep}" (F18)`);
  if (ctx.kind === "offtopic" || ctx.kind === "steer" || ctx.kind === "visual") {
    if (RX.defer.test(rep)) add("R7.defer", "deferred what the child said ('baad mein', 'later') instead of answering it (F11)");
    if (ctx.prevReply && sameAsBefore) add("R7.ignored", "nothing new besides the question: the reply re-states the previous turn, the child's words were ignored");
  }
  if (ctx.kind === "confused" && ctx.prevReply && sameAsBefore) add("R7.same_again", "'samajh nahi aaya' got the same words again (or only the question), not a new explanation");
  const v = r.ui?.verdict;
  if (v === "not_yet" && (RX.praiseOpen.test(rep) || RX.praiseAny.test(rep))) add("R7.praise_wrong", "graded not_yet but the words praise or tick the answer (F3)");
  if (v === "correct" && RX.denyAny.test(rep)) add("R7.deny_right", "graded correct but the words say the child made a mistake (F2)");
  if (!v && ctx.truth === "wrong" && RX.praiseAny.test(rep)) add("R7.praise_ungraded", "a wrong answer was told it is right (no verdict on the turn) (F5)");
  if (r.end && !ctx.expectEnd) add("R8.unasked_end", "the lesson ended on a turn that was not a goodbye or a confirmed stop (F6)");
  if (!["wrap", "break"].includes(kind) && !r.end && RX.wrapWords.test(rep)) add("R8.goodbye_words", "goodbye / 'lesson khatam' words on a turn that goes on (F9)");
  const floor = floorViolations(rep, { content: ctx.floorContent ?? [], requireHelpline: kind === "safeguard", goodbye: kind === "wrap" });
  if (floor.length) add("R9.floor", `the never-rules floor: ${floor.join(", ")}`);
  if (ctx.lang === "english" && rep && hindiShare(rep) > 0.5 && (rep.match(DEVANAGARI) ?? []).length === 0 && enShare(rep) < 0.15 && !ctx.langSwitched) add("R10.language", "an English-speaking child got a Hinglish reply");
  return d;
}

/** Floor content for a reply: the pinned item's verified kit text (the floor removes only whole verified segments). */
export function floorContentOf(item) {
  if (!item) return [];
  const s = (x) => (typeof x === "string" && x.trim() ? [x] : []);
  return [...s(item.prompt_en), ...s(item.prompt_hi), ...s(item.answer), ...(item.acceptable ?? []).flatMap(s), ...(item.hints ?? []).flatMap(s), ...(item.options ?? []).flatMap((o) => s(o?.text))];
}

// ───────────────────────────── the model judge (optional, --judge model) ─────────────────────────────
// Strict: a reply fails if the model judge OR the code rubric flags it. The judge grades the TEACHER's turn against a
// fixed rubric (never a child's answer: a model never grades a child, inherited law). Azure only (taxila-brain).
export const JUDGE_RUBRIC = [
  "You audit ONE turn of an AI teacher in a live lesson with an Indian school child (Hindi/English/Hinglish). Be strict.",
  "Flag a criterion true ONLY with clear evidence in the text given.",
  "confused: the teacher's turn does not make sense as a reply to what the child just said, contradicts itself, is garbled or cut off, or is only a repeat of the previous question with nothing for what the child said.",
  "ignores_child: the child asked or requested something (a question, a different explanation, slower, an example, a language, a story, a picture, a topic) and the turn does not do it or answer it now (deferring to later counts as ignoring).",
  "contradicts_verdict: a VERDICT is given and the turn's words disagree with it (praise or a tick for an answer marked not_yet; 'you made a mistake' for one marked correct).",
  "talks_to_wrong_person: the turn tells the CHILD to do what the child asked the teacher to do (e.g. the child asked her to go slowly and she asks the child to speak slowly; the child asked for a drawing and she asks the child to draw).",
  "Return JSON only.",
].join("\n");
const JUDGE_SCHEMA = { type: "object", additionalProperties: false, required: ["confused", "ignores_child", "contradicts_verdict", "talks_to_wrong_person", "reason"],
  properties: { confused: { type: "boolean" }, ignores_child: { type: "boolean" }, contradicts_verdict: { type: "boolean" }, talks_to_wrong_person: { type: "boolean" }, reason: { type: "string" } } };
let judgeChat = null;
export const modelJudgeOn = () => arg("judge", "") === "model";
async function judgeDeps() {
  if (judgeChat) return judgeChat;
  // the Azure keys only (never the database urls): .env.local, values never printed
  const envFile = join(ROOT, ".env.local");
  if (existsSync(envFile)) for (const line of readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*((?:AZURE_OPENAI_[A-Z_]+)|(?:DEPLOY_[A-Z_]+))\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const { chat, DEPLOY } = await import("../../server/azure.js");
  judgeChat = { chat, deployment: DEPLOY.brain };
  return judgeChat;
}
/** → defects from the model judge for one turn ([] when off or unavailable; an outage is a WARN, never a pass). */
export async function modelJudge({ previous, child, reply, verdict }) {
  if (!modelJudgeOn() || !reply) return [];
  try {
    const { chat, deployment } = await judgeDeps();
    const user = [`PREVIOUS TEACHER TURN: ${String(previous ?? "(none)").slice(0, 600)}`, `CHILD SAID: ${String(child ?? "").slice(0, 300) || "(no words; acted in an activity)"}`,
      `VERDICT ON THE CHILD'S ANSWER: ${verdict ?? "none"}`, `TEACHER TURN TO AUDIT: ${String(reply).slice(0, 900)}`].join("\n");
    const { json } = await chat(deployment, [{ role: "system", content: JUDGE_RUBRIC }, { role: "user", content: user }],
      { schema: JUDGE_SCHEMA, schemaName: "turn_audit", effort: "low", maxTokens: 700, timeoutMs: 30_000 });
    const out = [];
    for (const k of ["confused", "ignores_child", "contradicts_verdict", "talks_to_wrong_person"]) if (json?.[k]) out.push({ code: `J.${k}`, why: `model judge: ${String(json.reason ?? "").slice(0, 200)}` });
    return out;
  } catch (e) {
    warn(`model judge unavailable on one turn: ${String(e.message).slice(0, 120)}`);
    return [];
  }
}

// ───────────────────────────── personas and lessons ─────────────────────────────
export const PERSONAS = {
  aarav: { name: "Aarav", classLevel: 5, lang: "hinglish", interests: ["cricket"], style: "hinglish", topics: ["c5-maths-ch02-t01", "c5-maths-ch01-t01"] },
  meher: { name: "Meher", classLevel: 6, lang: "english", interests: ["painting"], style: "english", topics: ["c6-maths-ch07-t01", "c6-science-ch02-t01"] },
  golu: { name: "Golu", classLevel: 4, lang: "hinglish", interests: ["cartoons"], style: "shy", topics: ["c4-maths-ch05-t01", "c4-evs-ch01-t01"] },
  kabir: { name: "Kabir", classLevel: 7, lang: "hinglish", interests: ["cricket", "video games"], style: "joker", topics: ["c7-maths-ch08-t01", "c7-science-ch01-t01"] },
  zoya: { name: "Zoya", classLevel: 5, lang: "hinglish", interests: ["dance"], style: "distracted", topics: ["c5-evs-ch01-t01", "c5-maths-ch02-t02"] },
  ishaan: { name: "Ishaan", classLevel: 6, lang: "hindi", interests: ["football"], style: "hindi", topics: ["c6-science-ch01-t01", "c6-maths-ch02-t01"] },
};
export const FILLER = {
  hinglish: ["haan", "ok samajh gaya", "achha", "theek hai, aage", "hmm", "haan bolo"], english: ["okay", "yes", "got it", "hmm okay", "sure, go on", "alright"],
  shy: ["ok", "haan", "hmm", "pata nahi"], joker: ["haha ok bhai", "lol theek hai", "achha achha, aage", "haan haan, samajh gaya boss"],
  distracted: ["haan", "ek min... haan bolo", "ok", "mummy bula rahi thi, haan"], hindi: ["हाँ", "ठीक है", "अच्छा", "हाँ, आगे बताइए", "समझ गया"],
};
export const GREET = { english: "hi! yes I'm ready", shy: "haan", hindi: "नमस्ते, हाँ तैयार हूँ", joker: "haan bhai ready, chalo shuru karo haha", hinglish: "haan ready hoon", distracted: "haan ready hoon" };
export const CONFUSED = { hinglish: ["samajh nahi aaya", "matlab?"], english: ["I don't get it", "what do you mean?"], shy: ["nahi samjha"], joker: ["bhai kuch samajh nahi aaya haha"], distracted: ["sorry kya bola? samajh nahi aaya"], hindi: ["समझ नहीं आया"] };
export const OFFTOPIC = { hinglish: ["aapko kaunsa cricketer pasand hai?", "aaj mausam kaisa hai?"], english: ["what's your favourite colour?", "do you like dogs?"], shy: ["aap kaun ho?"], joker: ["bhai tum robot ho kya? haha", "PUBG khelte ho?"], distracted: ["kya time hua hai?", "aapko dance aata hai?"], hindi: ["आपको कौन सा खेल पसंद है?"] };

/** Child answers for an item with their ground truth: correct | noisy (key + filler) | wrong | partial (first clause of a multi-part key). */
export function answersFor(item, kit, persona) {
  const keys = keysOf(item);
  const correct = String(shortest(keys.filter((k) => String(k).length <= 40)) ?? item.answer);
  let wrong = null;
  const f = correct.match(FRAC);
  if (f) {
    const n = Number(f[1]), dd = Number(f[2]);
    wrong = [`${dd}/${n}`, `${n + 1}/${dd}`, `${n}/${dd + 1}`, `${Math.max(1, n - 1)}/${dd}`].find((c) => numOf(c) !== numOf(correct));
  } else if (/^-?\d[\d,]*(\.\d+)?$/.test(correct.trim())) {
    wrong = String(Number(correct.replace(/,/g, "")) + pick([1, 2, 10, -1]));
  } else {
    const flips = [[/\b0\b/, "1"], [/\b1\b/, "0"], [/closer to 0/i, "closer to 1"], [/\bbefore\b/i, "after"], [/\bafter\b/i, "before"], [/\byes\b/i, "no"], [/\bno\b/i, "yes"],
      [/\bhaan\b/i, "nahi"], [/\bbigger\b/i, "smaller"], [/\bsmaller\b/i, "bigger"], [/\bmore\b/i, "less"], [/\bless\b/i, "more"]];
    for (const [re, to] of flips) if (re.test(correct)) { wrong = correct.replace(re, to); break; }
    if (!wrong) {
      const other = kit.items.filter((i) => i.id !== item.id && !matchesKey(item, i.answer)).map((i) => shortest(keysOf(i).filter((k) => String(k).length <= 30)) ?? i.answer);
      wrong = other.length ? String(pick(other)) : "pata nahi, shayad 100";
    }
  }
  if (!wrong || matchesKey(item, wrong)) wrong = "999";
  const parts = String(item.answer).split(/\s*(?:,|;| because | and | kyunki | aur )\s*/i).filter(Boolean);
  const partial = parts.length >= 2 && !matchesKey(item, parts[0]) && parts[0].split(/\s+/).length >= 2 ? parts[0] : null;
  const fill = persona.lang === "english" ? pick(["I think it's", "maybe", "it is"]) : pick(["mujhe lagta hai", "shayad", "mera answer"]);
  return { correct, noisy: `${fill} ${correct}`, wrong, partial };
}

/**
 * lib.mjs withTestAccount, plus what an owner test needs at cleanup: the account deletion is REFUSED (409 erase_review)
 * while a safeguarding incident on one of its children is unhandled — the product's own guard (routes/account.js
 * safetyFirst), which a test must never get around. An owner phrase can trip it ("I'm done" read as distress, F10). Then
 * every child that CAN be erased is erased (DELETE /api/children), the account is reported as left over — email, why,
 * what is left — in <OUT>/LEFTOVER-ACCOUNTS.json and as a FAIL, and nothing marks the incident handled: that is a human's
 * safeguarding step (the main loop resolves it, then deletes the account).
 */
export async function withTestAccount(fn, opts = {}) {
  const api = apiClient();
  api.children = [];
  const st = Date.now(), rnd6 = Math.random().toString(36).slice(2, 8);
  const email = `prod-${opts.tag ?? "owner"}+${st}${rnd6}@taxila.test`, password = `prod-pw-${st}-${rnd6}`;
  let signedUp = false;
  try {
    await api("POST", "/api/auth/signup", { email, password, name: "Prod Test", isGuardianAdult: true });
    signedUp = true;
    const { child } = await api("POST", "/api/children", { firstName: "Riya", classLevel: 5, languagePref: "hinglish", interests: ["cricket"], ...(opts.child ?? {}) });
    api.children.push(child.id);
    await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
    await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120 });
    await fn({ api, child, email, password });
  } catch (e) {
    ok(false, `test threw: ${e?.message ?? e}`);
  } finally {
    if (signedUp) {
      const del = await api("DELETE", "/api/account", { password, confirm: true }).then(() => null, (e) => e);
      if (!del) console.log("cleanup: account deleted");
      else if (del.body?.code === "erase_review") {
        const left = [];
        for (const id of api.children) {
          const r = await api("DELETE", "/api/children", { childId: id, password }).then(() => null, (e) => e);
          if (r) left.push(id);
        }
        const again = left.length ? await api("DELETE", "/api/account", { password, confirm: true }).then(() => null, (e) => e) : await api("DELETE", "/api/account", { password, confirm: true }).then(() => null, (e) => e);
        if (!again) console.log("cleanup: account deleted (after erasing its children one by one)");
        else {
          const row = { at: new Date().toISOString(), base: BASE, email, reason: "409 erase_review: a safeguarding incident on a test child is unhandled (routes/account.js safetyFirst)",
            childrenLeft: left.length, childrenErased: api.children.length - left.length, resolve: "a human marks the test child's incident handled after review, then DELETE /api/account" };
          mkdirSync(OUT, { recursive: true });
          const f = join(OUT, "LEFTOVER-ACCOUNTS.json");
          const prior = existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : [];
          writeFileSync(f, JSON.stringify([...prior, row], null, 1));
          ok(false, `cleanup: the test account ${email} could not be deleted: the product's safeguarding guard holds it (${left.length} child left, ${row.childrenErased} erased) — recorded in ${f}; never bypassed by the test`);
        }
      } else ok(false, `cleanup: could not delete the test account ${email}: ${del.message}`);
    }
  }
}

/** A fresh child on the test account (consented, the day's hours open): one per lesson, deleted with the account. */
export async function freshChild(api, persona, controls = {}) {
  const { child } = await api("POST", "/api/children", { firstName: persona.name, classLevel: persona.classLevel, languagePref: persona.lang, interests: persona.interests });
  api.children?.push(child.id);
  await api("POST", "/api/consent", { childId: child.id, grants: { core_tutoring: true, learning_profile: true, memory: true } });
  await api("POST", "/api/parent/controls", { childId: child.id, hoursStart: "00:00", hoursEnd: "23:59", dailyMinutes: 120, ...controls });
  return child;
}

/**
 * A lesson driver: start, child turns (typed on the text lane; spoken = cascade, typed:false, ASR-shaped words), and a
 * transcript of every exchange. Never throws on a turn: an HTTP failure is recorded as { error } (rubric R1).
 */
export async function openLesson(api, child, { topicId, spoken = false, persona, purpose } = {}) {
  const mode = spoken ? "cascade" : "text";
  const t0 = Date.now();
  const start = await api("POST", "/api/lesson/start", { childId: child.id, mode, ...(topicId ? { topicId } : {}), ...(purpose ? { purpose } : {}) });
  const { instructions: _i, ...opening } = start;
  const L = { lessonId: start.lessonId, mode, spoken, persona, topicId: start.topic?.id ?? topicId, kit: null, opening, rows: [], last: opening, seq: 0, ended: false,
    startMs: Date.now() - t0 };
  try { L.kit = kitOf(L.topicId); } catch { L.kit = null; }
  L.replies = () => [L.opening.teacherReply ?? L.opening.teacherOpening, ...L.rows.map((x) => x.r?.teacherReply)].filter(Boolean);
  L.item = (r) => (L.kit ? itemOf(L.kit, r?.ui?.ask?.itemId) : null);
  /** One child turn. `text` is written as typed; on the spoken lane it goes as an ASR transcript. */
  L.turn = async (text, extra = {}) => {
    const words = spoken && !extra.raw ? spokenForm(text) : text;
    const body = { lessonId: L.lessonId, childText: words, typed: !spoken, turnSeq: ++L.seq, ...(spoken ? { asrConfidence: extra.asr ?? 0.92 } : {}), ...(extra.body ?? {}) };
    const prev = L.last;
    const t = Date.now();
    let r = null;
    try {
      const { instructions: _x, ...resp } = await api("POST", "/api/lesson/turn", body, [200]);
      r = resp;
    } catch (e) { r = { error: { status: e.status ?? null, message: String(e.message).slice(0, 300), body: e.body } }; }
    const row = { n: L.rows.length + 1, child: words, kind: extra.kind ?? "answer", ms: Date.now() - t, r, prev };
    L.rows.push(row);
    if (!r.error) L.last = r;
    if (r.end) L.ended = true;
    return row;
  };
  L.end = async () => { if (!L.closed) { L.closed = true; await api("POST", "/api/lesson/end", { lessonId: L.lessonId }).catch(() => {}); } };
  L.opening.teacherReply ??= L.opening.teacherOpening;
  return L;
}
export const openingOf = (L) => L.opening.teacherOpening ?? L.opening.teacherReply ?? "";

/** A plain, ordinary child turn for whatever is on the table: the kit item's answer (right/wrong at random) or a filler. */
export function ordinaryTurn(L, persona, { wrongRate = 0.35 } = {}) {
  const item = L.item(L.last);
  if (item && L.kit) {
    const A = answersFor(item, L.kit, persona);
    const wrong = rnd() < wrongRate;
    return { text: wrong ? A.wrong : A.correct, kind: "answer", truth: wrong ? "wrong" : "correct", itemId: item.id };
  }
  return { text: pick(FILLER[persona.style] ?? FILLER.hinglish), kind: "filler" };
}

/** Compact transcript rows for the saved JSON (no instructions; the prev link dropped). */
export const compact = (L) => ({
  lessonId: L.lessonId, mode: L.mode, topicId: L.topicId, opening: { kind: L.opening.move?.kind, reply: openingOf(L), ui: L.opening.ui, moduleCommands: L.opening.moduleCommands },
  rows: L.rows.map(({ prev: _p, ...x }) => ({ ...x, r: x.r && { move: x.r.move ? { kind: x.r.move.kind, itemId: x.r.move.itemId } : null, teacherReply: x.r.teacherReply, end: x.r.end,
    ui: x.r.ui, moduleCommands: x.r.moduleCommands, studio: x.r.studio, error: x.r.error } })),
});

// ───────────────────────────── browser (routed: the sandbox proxy breaks Chromium) ─────────────────────────────
export function chromiumAvailable() {
  const dir = process.env.PLAYWRIGHT_BROWSERS_PATH || "/opt/pw-browsers";
  return existsSync(dir) && readdirSync(dir).some((d) => d.startsWith("chromium"));
}
export const browserOn = () => (flag("no-browser") ? false : flag("browser") || chromiumAvailable());

/**
 * Chromium with every request served through Node fetch (docs/ops/W1-PROD-RESULTS-2026-10-04.md "routed": the sandbox
 * proxy answers Chromium with ERR_TOO_MANY_RETRIES). `pages`: same-origin paths this harness serves itself.
 * Correctness only: never a timing gate through route interception (b4-rejected-perf-with-route-interception).
 */
export async function launchRouted({ viewport = { width: 400, height: 800 }, cookieFrom = null, pages = {} } = {}) {
  process.env.PLAYWRIGHT_BROWSERS_PATH ||= "/opt/pw-browsers";
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true, viewport });
  const origin = new URL(BASE).origin;
  const c = cookieFrom?.cookie?.();
  if (c) { const i = c.indexOf("="); await context.addCookies([{ name: c.slice(0, i), value: c.slice(i + 1), url: BASE }]); }
  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    const path = url.startsWith(origin) ? url.slice(origin.length).split("?")[0] : null;
    if (path && pages[path]) return route.fulfill({ status: 200, contentType: "text/html", body: pages[path] });
    if (!/^https?:/.test(url) || isLocal) return route.continue();
    try {
      const h = { ...req.headers() }; delete h.host; delete h["content-length"];
      const res = await fetch(url, { method: req.method(), headers: h, body: ["GET", "HEAD"].includes(req.method()) ? undefined : req.postDataBuffer() });
      const headers = {};
      res.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) headers[k] = v; });
      return route.fulfill({ status: res.status, headers, body: Buffer.from(await res.arrayBuffer()) });
    } catch { return route.abort("failed"); }
  });
  const page = await context.newPage();
  return { browser, context, page };
}

/** Tally helper: print a per-code table of defects. */
export function tally(defects) {
  const by = {};
  for (const x of defects) by[x.code] = (by[x.code] ?? 0) + 1;
  return Object.entries(by).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ×${n}`).join(", ") || "none";
}
