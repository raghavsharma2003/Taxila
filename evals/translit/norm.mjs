// Spelling equivalence for scoring Devanagari: two spellings that a Hindi voice pronounces the same count as one.
// What is folded (and only this): nukta (ज़/ज, फ़/फ; ड़ and ढ़ are kept: they are different sounds), chandrabindu ~ anusvara,
// ये/यह and वो/वह/वे (the spoken and the textbook spelling of one spoken word), the य-glide (आये ~ आए, गये ~ गए,
// सिखायेंगे ~ सिखाएँगे, -इये ~ -इए), and a trailing halant. Everything else must match exactly.
const NUKTA = "़";
export function norm(d) {
  let s = String(d).trim();
  if (s === "=") return s;
  s = s.normalize("NFD").replace(new RegExp(`([^डढ])${NUKTA}`, "g"), "$1").normalize("NFC")
    .replace(/ँ/g, "ं")          // chandrabindu → anusvara
    .replace(/्$/, "");               // trailing halant
  const V = { "यह": "ये", "वह": "वो", "वे": "वो" };
  if (V[s]) return V[s];
  s = s.replace(/([ा-ौ])ये/g, "$1ए").replace(/([ा-ौ])यी/g, "$1ई")
    .replace(/([क-ह])ये$/, "$1ए");
  return s;
}
export const same = (a, b) => norm(a) === norm(b);
