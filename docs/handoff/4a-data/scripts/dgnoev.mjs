import fs from "node:fs";
import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
console.info = () => {};
const R = process.argv[2], arm = process.argv[3] ?? "agent_gpt6", want = process.argv[4] ?? "deep";
const norm = (s) => String(s ?? "").toLowerCase().replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter((w) => w.length > 2);
const cats = {}; const ex = [];
for (const f of fs.readdirSync(R + "/records").filter((f) => f.includes(`--${arm}--`))) {
  const r = JSON.parse(fs.readFileSync(`${R}/records/${f}`, "utf8"));
  const kits = {}; const kitOf = (id) => { const tp = String(id).replace(/-(?:i\d+|rl-.*|[a-z]+\d*)$/, "").match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; return tp ? (kits[tp] ??= kitFromFile(getTopic(tp))) : null; };
  for (const t of r.turns) {
    const d = t.decided; if (d?.outcome !== "right" || d.depth !== want) continue;
    const cls = t.reasons?.classification; if (cls && cls.outcome !== "no_evidence") continue;
    const prev = r.turns[t.n - 1]; const item = kitOf(d.itemId)?.items.find((i) => i.id === d.itemId);
    const posedPrev = prev?.reasons?.item?.id;
    const a = new Set(norm(item?.prompt)), b = norm(prev?.teacher);
    const overlap = a.size ? b.filter((w) => a.has(w)).length / a.size : 0;
    const c = posedPrev !== d.itemId ? "harness item != item posed on the teacher's turn" : overlap >= 0.5 ? "teacher asked the card (>=50% of its words)" : "teacher asked her own version (<50% card words)";
    cats[c] = (cats[c] ?? 0) + 1;
    ex.push({ f: f.split("--")[0], n: t.n, c, src: cls?.source, flags: cls?.flags, card: item?.prompt?.slice(0, 110), key: String(item?.answer ?? "").slice(0, 50), asked: prev?.teacher?.slice(-150), child: t.child?.sent?.slice(0, 120) });
  }
}
console.log(cats);
fs.writeFileSync(process.argv[5], JSON.stringify(ex, null, 1));
