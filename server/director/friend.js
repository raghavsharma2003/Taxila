// The {friend} slots of lesson content (v2.1 scripts; v2.2 kits): a card character is never the child, and never the teacher.
// Each slot is filled once per lesson with the first name of its list that is not the child's own (stable per child):
//   {friend}  — any (the v2.1 slot)        {friendF} — a girl's name (feminine grammar)        {friendM} — a boy's name
const FRIENDS = ["Zoya", "Kabir", "Meera", "Arjun", "Ishaan", "Tara"];
const FRIENDS_F = ["Zoya", "Meera", "Tara", "Diya"];
const FRIENDS_M = ["Kabir", "Arjun", "Ishaan", "Aman"];
/** The same names in Devanagari, for a Hindi string (CD-17: the Hindi kits named the friend रिया, a name that was never a slot). */
export const DEVANAGARI = Object.freeze({ Zoya: "ज़ोया", Kabir: "कबीर", Meera: "मीरा", Arjun: "अर्जुन", Ishaan: "ईशान", Tara: "तारा", Diya: "दीया", Aman: "अमन" });
/** A string is Hindi when it has more Devanagari letters than Latin ones. */
const isDevanagari = (t0) => { const t = t0.replace(/\{friend[FM]?\}/g, ""); return (t.match(/[\u0900-\u097F]/g)?.length ?? 0) > (t.match(/[A-Za-z]/g)?.length ?? 0); };
// the child's own name, in either script, is never picked
const pickNot = (list, me) => list.find((n) => n.toLowerCase() !== me && DEVANAGARI[n].normalize("NFC") !== me) ?? list[0];

/**
 * A string with every {friend} / {friendF} / {friendM} slot filled (unchanged when it has none). A Hindi (Devanagari) string
 * gets the name in Devanagari; the English and Hinglish prompts of the same item get the same friend in Latin letters.
 */
export function fillFriend(text, childName = "") {
  const t = String(text ?? "");
  if (!t.includes("{friend")) return text;
  const me = String(childName ?? "").trim().toLowerCase().normalize("NFC");
  const name = (list) => { const n = pickNot(list, me); return isDevanagari(t) ? DEVANAGARI[n] : n; };
  return t.replaceAll("{friendF}", name(FRIENDS_F)).replaceAll("{friendM}", name(FRIENDS_M)).replaceAll("{friend}", name(FRIENDS));
}

const FILLED = new WeakMap();
/** An item (or any content object) with every string field's slots filled, deep; the same object when it has none. */
export function fillFriendDeep(obj, childName = "") {
  if (!obj || typeof obj !== "object") return obj;
  const me = String(childName ?? "").trim().toLowerCase();
  const cached = FILLED.get(obj);
  if (cached && cached.me === me) return cached.out;
  let hit = false;
  const walk = (x) => {
    if (typeof x === "string") { if (x.includes("{friend")) { hit = true; return fillFriend(x, childName); } return x; }
    if (Array.isArray(x)) return x.map(walk);
    if (x && typeof x === "object") { const o = {}; for (const [k, v] of Object.entries(x)) o[k] = walk(v); return o; }
    return x;
  };
  const out = walk(obj);
  const res = hit ? out : obj;
  FILLED.set(obj, { me, out: res });
  return res;
}
