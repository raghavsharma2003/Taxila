// The {friend} slots of lesson content (v2.1 scripts; v2.2 kits): a card character is never the child, and never the teacher.
// Each slot is filled once per lesson with the first name of its list that is not the child's own (stable per child):
//   {friend}  — any (the v2.1 slot)        {friendF} — a girl's name (feminine grammar)        {friendM} — a boy's name
const FRIENDS = ["Zoya", "Kabir", "Meera", "Arjun", "Ishaan", "Tara"];
const FRIENDS_F = ["Zoya", "Meera", "Tara", "Diya"];
const FRIENDS_M = ["Kabir", "Arjun", "Ishaan", "Aman"];
const pickNot = (list, me) => list.find((n) => n.toLowerCase() !== me) ?? list[0];

/** A string with every {friend} / {friendF} / {friendM} slot filled (unchanged when it has none). */
export function fillFriend(text, childName = "") {
  const t = String(text ?? "");
  if (!t.includes("{friend")) return text;
  const me = String(childName ?? "").trim().toLowerCase();
  return t.replaceAll("{friendF}", pickNot(FRIENDS_F, me)).replaceAll("{friendM}", pickNot(FRIENDS_M, me)).replaceAll("{friend}", pickNot(FRIENDS, me));
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
