import fs from "node:fs";
const j = JSON.parse(fs.readFileSync("/home/user/Taxila/docs/design/round4/build/r12/rca/owner-lessons-2026-10-11.json", "utf8"));
const TEXT_H = { s: 14, m: 20, l: 28 };
export function opBox(o) {
  const pts = [];
  if (o.op === "text" && o.at) { const h = TEXT_H[o.size] ?? 20, w = String(o.text ?? "").length * h * 0.55; pts.push([o.at[0] - w / 2, o.at[1] - h], [o.at[0] + w / 2, o.at[1] + h * 0.3]); }
  for (const k of ["from", "to", "at", "c"]) if (Array.isArray(o[k]) && o.op !== "text") pts.push(o[k]);
  if (Array.isArray(o.points)) pts.push(...o.points);
  if (o.op === "rect" && o.at) pts.push([o.at[0] + (o.w ?? 0), o.at[1] + (o.h ?? 0)]);
  if (o.op === "circle" && o.c) pts.push([o.c[0] - o.r, o.c[1] - o.r], [o.c[0] + o.r, o.c[1] + o.r]);
  if (!pts.length) return null;
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
const hit = (a, b) => a && b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
const P = j["a95d2ff1-0d79-4d4c-8f32-dd255c2236e1"].board_page;
for (let i = 1; i < P.length; i++) {
  const s = P[i].script; if (s.mode !== "continue") continue;
  const prev = P[i - 1].script.ops.map(opBox), cur = s.ops.map(opBox);
  const n = cur.filter((b) => prev.some((p) => hit(b, p))).length;
  console.log(`page ${P[i].seq} (continue over ${P[i - 1].seq}): ${n}/${cur.length} new ops overlap the page under it`);
}
// what the client actually draws under a continue page: every op since the last fresh page (StudioWhiteboard remember())
let acc = [];
for (const p of P) {
  const s = p.script;
  if (s.mode !== "continue") { acc = s.ops.map((o) => ({ ...o, page: p.seq })); continue; }
  const cur = s.ops.map(opBox);
  const over = s.ops.filter((o, k) => acc.some((a) => hit(cur[k], opBox(a))));
  const texts = [...new Set(over.flatMap((o, k) => acc.filter((a) => hit(opBox(o), opBox(a))).map((a) => `${a.page}:${a.text ?? a.op}`)))];
  console.log(`page ${p.seq}: ${over.length}/${s.ops.length} ops land on earlier ops [${over.map((o) => o.text ?? o.op).join(", ")}] over [${texts.join(", ")}]`);
  acc = [...acc, ...s.ops.map((o) => ({ ...o, page: p.seq }))];
}
