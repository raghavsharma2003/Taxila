import fs from "node:fs";
const NEW = await import("/home/user/Taxila/server/director/items.js");
const OLD = await import(process.env.OLD + "/server/director/items.js");
const S = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad/";
const items = new Map();
for (const f of fs.readdirSync("/home/user/Taxila/data/kits").filter((f) => f.endsWith(".json"))) {
  const j = JSON.parse(fs.readFileSync("/home/user/Taxila/data/kits/" + f, "utf8"));
  for (const t of j.topics ?? []) for (const it of t.items ?? []) items.set(it.id, it);
}
// 1) the blind drafts (D2, D15, D22, D29 and the rest are cube / pyramid / box items of c4-maths-ch01-t01)
const key = JSON.parse(fs.readFileSync(S + "rj-key.json", "utf8")), jd = JSON.parse(fs.readFileSync(S + "rj-judgements.json", "utf8"));
const topicItems = [...items.values()].filter((i) => i.id.startsWith("c4-maths-ch01-t01"));
for (const [id, x] of Object.entries(key)) {
  const hitsNew = topicItems.filter((it) => NEW.revealsAnswer(x.draft, it)).map((i) => i.id.slice(-6));
  const hitsOld = topicItems.filter((it) => OLD.revealsAnswer(x.draft, it)).map((i) => i.id.slice(-6));
  if (hitsNew.join() !== hitsOld.join() || jd[id] !== "FINE") console.log(id, jd[id].padEnd(9), "old", hitsOld.join(",") || "-", "| new", hitsNew.join(",") || "-");
}
// 2) false-positive scan: every kit hint (rungs 1-3) and every OTHER item's prompt against each item
let hintNew = 0, hintOld = 0, n = 0; const ex = [];
for (const it of items.values()) for (const h of (it.hints ?? []).slice(0, 3)) {
  n++; const a = OLD.revealsAnswer(h, it), b = NEW.revealsAnswer(h, it);
  if (a) hintOld++; if (b) hintNew++; if (b && !a && ex.length < 25) ex.push(`${it.id} | A: ${String(it.answer).slice(0, 50)} | H: ${h.slice(0, 120)}`);
}
console.log(`hints ${n}: leak old ${hintOld}, new ${hintNew}`); for (const e of ex) console.log("  NEW", e);
