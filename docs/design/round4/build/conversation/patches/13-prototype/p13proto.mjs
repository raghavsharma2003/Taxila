// PROTOTYPE for the patch 13 design note (measurement only: never imported by product code, not wired anywhere).
// Run from the repo root: MAX_NOVEL=2 node docs/design/round4/build/conversation/patches/13-prototype/p13proto.mjs <cases.tsv>
import fs from "node:fs";
const ROOT = process.env.TREE || process.cwd();
const { scanSafetyDetail } = await import(`${ROOT}/server/director/safety.js`);
const { canonKey } = await import(`${ROOT}/server/safety/normalize.js`);
const src = fs.readFileSync(`${ROOT}/server/director/safety.js`, "utf8");
const GUARD_VETO = eval(src.match(/const GUARD_VETO = (\/.*\/iu);/)[1]);
const MAX_NOVEL = Number(process.env.MAX_NOVEL ?? 99);
const L = (s) => new RegExp(`(?<![\\p{L}\\p{M}])(?:${s})(?![\\p{L}\\p{M}])`, "iu");
// condition 3a: the child in the turn (first person, singular or plural), Roman and Devanagari
const FIRST = L("i|i'm|im|me|my|mine|myself|we|us|our|ours|main|mai|maine|mujhe|mujhko|mujhse|mereko|mera|meri|mere|hum|humein|hume|hamein|hamara|hamari|hamare|humara|humari|humare|आई|आइ|मी|माई|माय|माइसेल्फ|मायसेल्फ|वी|अस|अवर|हम|हमें|हमारा|हमारी|हमारे|मैं|मैंने|मुझे|मुझको|मुझसे|मेरा|मेरी|मेरे");
// condition 3b: an adult actor anywhere in the turn (absolute: an item word does not excuse it)
const ACTOR = "papa|pappa|pita|pitaji|dad|daddy|father|mummy|mumma|mom|mum|mother|maa|mama|mami|mamu|chacha|chachu|chachi|uncle|aunty|auntie|aunti|tau|tai|fufa|bua|mausi|mausa|bhaiya|bhaiyya|bhai|didi|brother|sister|cousin|sir|madam|teacher|coach|tutor|driver|guard|padosi|neighbour|neighbor|stranger|nana|nani|dada|dadi|baba|stepdad|stepmom|अंकल|आंटी|चाचा|चाची|मामा|मामी|पापा|मम्मी|भैया|भाई|दीदी|सर|मैडम|टीचर|पड़ोसी|बाबा";
// condition 3c: a harm / fear / weapon word anywhere in the turn (absolute)
const HARM = "knife|knives|chaku|chaaku|chhuri|blade|gun|weapon\\w*|rod|chain|hang|hangs|hanged|hanging|fansi|faansi|latak\\w*|hit|hits|hitting|beat|beats|beating|beaten|hurt|hurts|hurting|kill|kills|killed|die|dies|died|dead|slap\\w*|kick\\w*|punch\\w*|push\\w*|touch\\w*|threat\\w*|abuse\\w*|scare\\w*|afraid|fear|cry|cries|crying|blood|bleed\\w*|maar\\w*|mar(?:ta|te|ti|na|ne|a|i|o)|peet\\w*|pit(?:ta|te|ti|ai|na)|pitai|chhu\\w*|chu(?:a|e|i|ta|te|ti)|dhamk\\w*|dar|darr|darta|darti|darte|darr?\\s*lag\\w*|ro(?:ta|ti|te|na|ya|yi)|khoon|chot|thappad|gaali|dhakka|maarpeet|marpeet|मार\\S*|पीट\\S*|छू\\S*|धमक\\S*|डर\\S*|रो(?:ता|ती|ते|ना)|खून|चोट|थप्पड़|गाली|धक्का|मारपीट";
const { canonicalReadings } = await import(`${ROOT}/server/safety/lexicon.js`);
// function words that carry no content (never counted as novel): English, Hinglish, Devanagari
const STOP = new Set("a an the and or but if so to of in on at for with by from as is are was were be been being am do does did has have had doesn don didn isn wasn just will would could should might may can it its this that these those there here then than not no yes very also just only too who what which when where why how all any some each other others one two people log logon ko ki ka ke se mein me main par pe aur ya bhi hi to toh hai hain tha the thi ho hota hoti hote kar karte karenge karega kya kaun koi kuch nahi na jo jab tab ab bas wo woh ye yeh is us un ek do".split(" ").map((w) => canonKey(w) || w));
const FIRST_CANON = /^(?:mujhe|mujhko|muje|mjhe|mereko|mera|meri|mere|main|mai|maine|mene|hum|hume|humein|hamein|hamara|hamari|hamare|humara|i|me|mi|my|mine|myself|miself|we|us|our)$/;
const novelOf = (tk, words) => tk.filter((w) => { const k = key(w); return k.length >= 3 && !words.has(k) && !STOP.has(k) && !/^\d+$/.test(k); });
const toks = (t) => String(t).normalize("NFC").split(/[\s,.;:!?।"'“”‘’()—–-]+/u).filter(Boolean);
const key = (w) => canonKey(w.toLowerCase()) || w.toLowerCase();
export function itemWords(item) {
  const out = new Set();
  const visit = (o, k) => { if (["id", "skillId", "kind", "targetsMisconception", "verified", "difficulty"].includes(k)) return;
    if (typeof o === "string") for (const w of toks(o)) out.add(key(w)); else if (Array.isArray(o)) o.forEach((x) => visit(x)); else if (o && typeof o === "object") for (const [kk, v] of Object.entries(o)) visit(v, kk); };
  visit(item);
  return out;
}
/** @returns {{aside: boolean, why: string}} */
export function setAside({ text, item, words: given }) {
  const hit = scanSafetyDetail(text);
  if (!hit.distress) return { aside: false, why: "no_hit" };
  if (hit.kind === "self_harm") return { aside: false, why: "self_harm_never" };
  if (!item) return { aside: false, why: "no_item" };
  if (item.verified?.agrees !== true) return { aside: false, why: "unverified" };
  const words = given ?? itemWords(item);
  const tk = toks(text);
  if (tk.some((w) => FIRST.test(w)) || canonicalReadings(text).some((r) => r.split(" ").some((w) => FIRST_CANON.test(w)))) return { aside: false, why: "veto:first_person" };
  if (GUARD_VETO.test(text)) return { aside: false, why: "veto:guard" };
  for (const w of tk) {
    if (L(ACTOR).test(w)) return { aside: false, why: `veto:actor:${w}` };
    if (L(HARM).test(w)) return { aside: false, why: `veto:harm:${w}` };
  }
  const novel = novelOf(tk, words);
  if (novel.length > MAX_NOVEL) return { aside: false, why: `novel:${novel.join(",")}` };
  // condition 2: the hit rests on the item's words: mask every child token that is in the item's content; the rest must be quiet
  const masked = tk.map((w) => (words.has(key(w)) ? "_" : w)).join(" ");
  if (scanSafetyDetail(masked).distress) return { aside: false, why: "rest_fires" };
  return { aside: true, why: `item_words:${hit.via}` };
}
// CLI: node p13proto.mjs cases.tsv  (lines: itemId<TAB>text<TAB>expect aside|fire)
if (import.meta.url === `file://${process.argv[1]}` && process.argv[2]) {
  const items = new Map();
  for (const f of fs.readdirSync(`${ROOT}/data/kits`).filter((f) => f.endsWith(".json"))) {
    const j = JSON.parse(fs.readFileSync(`${ROOT}/data/kits/${f}`, "utf8"));
    for (const t of j.topics ?? []) for (const it of t.items ?? []) items.set(it.id, it);
  }
  let ok = 0, n = 0;
  for (const line of fs.readFileSync(process.argv[2], "utf8").split("\n")) {
    if (!line.trim() || line.startsWith("#")) { if (line.startsWith("#")) console.log(line); continue; }
    const [id, text, expect] = line.split("\t");
    const item = id === "-" ? null : items.get(id);
    if (id !== "-" && !item) throw new Error(`no item ${id}`);
    const r = setAside({ text, item });
    const base = scanSafetyDetail(text).distress;
    const got = !base ? "quiet" : r.aside ? "aside" : "fire";
    n++; if (got === expect) ok++;
    console.log(`${got === expect ? "ok " : "BAD"} ${got.padEnd(5)} (want ${expect.padEnd(5)}) ${r.why.padEnd(28)} | ${id} | ${text}`);
  }
  console.log(`${ok}/${n} as expected`);
}
