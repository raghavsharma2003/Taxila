// how many library boards would W16 refuse against their own kit (no line)?
import fs from "node:fs"; import path from "node:path";
import { cutCells } from "/home/user/Taxila/server/studio/qa/whiteboard.js";
let boards = 0, cut = 0; const ex = [];
const kits = new Map();
const kitOf = (t) => { const m = /^(c\d+)-([a-z]+)-/.exec(t); if (!m) return null; const f = `data/kits/${m[1]}-${m[2]}.json`; if (!kits.has(f)) kits.set(f, fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, "utf8")) : null); return kits.get(f)?.topics?.find((x) => x.topicId === t) ?? null; };
const walk = (x, f, topic) => { if (Array.isArray(x)) return x.forEach((v) => walk(v, f, topic)); if (!x || typeof x !== "object") return;
  if (Array.isArray(x.ops) && x.ops.some((o) => o?.op === "numwork")) { boards++; const c = cutCells(x.ops, { kit: kitOf(topic) }); if (c.length) { cut++; if (ex.length < 6) ex.push(topic + " " + c[0]); } return; }
  Object.values(x).forEach((v) => walk(v, f, topic)); };
for (const f of fs.readdirSync("data/studio-catalogue/topics")) walk(JSON.parse(fs.readFileSync(path.join("data/studio-catalogue/topics", f), "utf8")), f, f.replace(/\.json$/, ""));
console.log({ boardsWithNumwork: boards, refusedByW16: cut }); console.log(ex.join("\n"));
