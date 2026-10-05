// Builds server/safety/known-words.js: the REAL words that sit one garble away from a distress slot word (safety-robust,
// 2026-10-05). The fuzzy matcher (server/safety/fuzzy.js) reads a token as a mis-heard slot word at cost 1; a token that is
// itself a real word costs 2 and never fills a solo slot, so "karti" (does) is not read as "marti" and "bull" never as "bully".
//
// Source: the teaching kits (data/kits/*.json, every string) — lesson language in English, Hindi and Hinglish — plus a short
// hand list of everyday words the kits under-represent. NOT the evaluation corpora (ES-1, transcripts, hard negatives): the
// FP numbers stay out of sample for this list. Only words that are fuzzy-near a slot word are kept (the list is small; it
// ships to the device).
//
//   node evals/safety-robust/build-known.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { foldText, tokensOf, canonKey, devaSkeleton, englishSkeleton } from "../../server/safety/normalize.js";
import { __internals } from "../../server/safety/fuzzy.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const { GROUPS, slotCost } = __internals;

/** Everyday words a child says that the kits may not carry (English, Hinglish, Hindi), written before any eval run. */
const MANUAL = `karta karti karte kar kare karo karna karke kiya kiye ki ka ke ko mat man maan jaan jan hai ho hoon hun han haan
  bull bulky bulb her hire hare hear heir one won on an in me mee my mi hit hat hot hut cut cat cot kill kilo till fill will well
  wish fish dish was as is it at to too toe two top dye die died dead deed lie life wife knife live love lover move hate late gate
  date mate rate home hole come some run ran rum gone done bone one none tone even ever eve oven care core cure dare mare more
  miss mass moss notice novice nobody body anybody somebody away way sway saw better bitter butter letter born burn corn torn
  marte marti marta mare mara maro maaro maare mere meri mera mar maar mari moti mota pita peeta peet pet pit papa paap pappu
  dar der dur dard darr darwaza ghar gher garh se sa si sab sabzi saab koi kai kuch rahu rahi raha rahe rahna rehna jeena jina
  zinda jinda khud khuda chot chota choti kat kaat kaato kaan gayab gaya gayi gaye chala chali chale chal chalo liye liya lie
  नहीं नही ना न मैं में मै है हैं हो हूं की के का को कर करो करते करती करता मार मर मत मन मां माँ जान जाना जाने जाओ पाप पापा
  डर दर घर गर से सा सब कोई कई खुद चोट छोटा काट कट गायब गया गई चला चली लिए लिया रहूं रहा रही रहे जीना जीने ज़िंदा जिंदा
  yaar yar baad arre are sach bach naach each teach attach hehe haha haan har sar hum ham pet bag some come hope
  यार बाद सच बच नाच हर हम पेट`;
// (Verify B, 2026-10-05: the second MANUAL block above is everyday filler / lesson words the verifier's slot sweep found filling a
// meaning slot at cost 1 — "yaar jaana chahiye" read as MAR JANA CHAH, "uske baad touch karo" as BAD TOUCH. Found by sweeping
// ES-1 / transcript vocabulary, so those two corpora are no longer strictly out of sample for this list.)

function* strings(x) {
  if (typeof x === "string") yield x;
  else if (Array.isArray(x)) for (const v of x) yield* strings(v);
  else if (x && typeof x === "object") for (const v of Object.values(x)) yield* strings(v);
}

const count = new Map();
const kitDir = path.join(ROOT, "data/kits");
for (const f of fs.readdirSync(kitDir).filter((x) => x.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync(path.join(kitDir, f), "utf8"));
  for (const s of strings(j)) for (const t of tokensOf(foldText(s, { runs: false }))) {
    if (t.script !== "latin" && t.script !== "deva") continue;
    const w = t.raw.replace(/'/g, "");
    count.set(w, (count.get(w) ?? 0) + 1);
  }
}
for (const w of MANUAL.split(/\s+/).filter(Boolean)) count.set(foldText(w, { runs: false }), 99);

// (a slot word of one group can be a near-miss of ANOTHER: "man" fills MANN exactly and is one letter from "main", so it
// is kept; slotCost is 0, never 1, in the group that holds it, so the penalty never touches an exact read)
const known = [];
const empty = new Set();
for (const [w, n] of count) {
  // a bare Devanagari letter ("स", "क") is the alphabet lessons' token, not a word a child says: it stays an ordinary garble
  // ("से"→"स", "को"→"क" are the transcriber's commonest drops)
  if (n < 2 || /\d/.test(w) || /^[\u0915-\u0939]$/u.test(w)) continue;
  const tok = { raw: w, script: /[ऀ-ॿ]/u.test(w) ? "deva" : "latin", canon: canonKey(w) };
  tok.skel = tok.script === "deva" ? devaSkeleton(w) : "";
  tok.enSkel = tok.script === "deva" ? englishSkeleton(w) : "";
  // (a token canonically equal to one slot word costs 0 there — the penalty only ever applies to a fuzzy read — but it can
  // still be a near-miss of ANOTHER slot: "lie" is लिए in one slot and one letter from "live" in another, so it is kept)
  if (Object.values(GROUPS).some((g) => slotCost(tok, g, { known: empty }) === 1)) known.push(w);
}
known.sort();
const out = `// GENERATED by evals/safety-robust/build-known.mjs (${new Date().toISOString().slice(0, 10)}): real words one garble away from a
// distress slot word, from the teaching kits (data/kits, every string, count >= 2) plus a short hand list. fuzzy.js charges
// such a token double and never reads it as a solo slot word. ${known.length} words. Do not edit by hand: re-run the builder.
export const KNOWN_NEAR = new Set(${JSON.stringify(known)});
`;
const target = path.join(ROOT, "server/safety/known-words.js");
if (process.argv.includes("--check")) {
  // tests/safety-robust-verify-b.test.mjs: the shipped list must be what the CURRENT slot groups produce (it was not: "टच" joined
  // TOUCH_HI after the last build, so "sach" / "each" / "teach" filled the touch slot at cost 1 — Verify B, 2026-10-05)
  const body = (s) => s.slice(s.indexOf("export const"));
  const same = body(fs.readFileSync(target, "utf8")) === body(out);
  console.log(same ? "known-words.js: up to date" : "known-words.js: STALE (run node evals/safety-robust/build-known.mjs)");
  process.exit(same ? 0 : 1);
}
fs.writeFileSync(target, out);
console.log(`known-words.js: ${known.length} words (from ${count.size} distinct tokens)`);
