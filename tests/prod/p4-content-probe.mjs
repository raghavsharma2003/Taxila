// ship5 p4-content diagnostic (not an acceptance file): one text lesson, then the brain_trace reasons per turn (codes only),
// read from the target's DB (TAXILA_DB_URL) before the account is deleted. Prints the move, beat, the Studio / whiteboard
// reasons and the slot kind of every turn. Never prints a child's words or a key.
import { withTestAccount, PERSONAS, freshChild, openLesson } from "./_owner.mjs";
const topicId = process.argv[2] || "c6-maths-ch07-t01";
const LINES = (process.argv[3] || "haan, main ready hoon|samjhao na|mujhe nahi pata, phir se samjhao|ek example se samjhao|achha, aur batao|samajh nahi aaya, board pe dikhao").split("|");
await withTestAccount(async ({ api }) => {
  const classLevel = Number(topicId.match(/^c(\d)/)[1]);
  const child = await freshChild(api, { ...PERSONAS.aarav, classLevel, topics: [topicId] });
  const L = await openLesson(api, child, { topicId, persona: PERSONAS.aarav });
  const slots = [];
  for (const t of LINES) { const row = await L.turn(t); const s = row.r?.ui?.studioSlot; slots.push(`${row.r?.move?.kind}/${row.r?.ui?.tray}/${s?.artifact?.kind ?? (s ? "slot:" + s.state : "-")}/${(row.r?.moduleCommands ?? []).filter((c) => c.op === "mount").map((c) => c.engine).join("+") || "-"}`); if (row.r?.end) break; }
  // the server's own DB module (TAXILA_DB=test → the Neon test branch, over the same driver the server uses)
  const { q } = await import("../../server/db.js");
  const rows = await q("select turn, move, beat, reasons, rejected from brain_trace where lesson_id = $1 order by turn", [L.lessonId]);
  rows.forEach((r, i) => console.log(`#${r.turn} ${r.move} beat=${r.beat} slot=${slots[i - 1] ?? "?"} reasons=${JSON.stringify((r.reasons ?? []).filter((x) => /studio|wb|board|stagecraft/.test(x)))} rejected=${JSON.stringify((r.rejected ?? []).map((x) => `${x.kind}:${x.why}`))}`));
  await L.end();
}, { tag: "p4c-probe" });
