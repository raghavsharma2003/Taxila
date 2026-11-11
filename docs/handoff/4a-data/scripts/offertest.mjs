// READ-ONLY: TEST (her line, the child's next turn) pairs; counts of bare agreements to her single offer, by request type,
// and the move that followed. Her lines may print (trimmed); no child words.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const { offerAgreed, requestOf } = await import(process.argv[2] + "/server/director/requests.js");
const rows = await q(`select lesson_id, seq, speaker, text, meta from turn order by lesson_id, seq`);
let pairs = 0, read = 0; const by = {}; const ex = [];
for (let i = 1; i < rows.length - 1; i++) {
  const her = rows[i - 1], kid = rows[i], next = rows[i + 1];
  if (her.lesson_id !== kid.lesson_id || her.speaker === "child" || kid.speaker !== "child") continue;
  pairs++;
  if (requestOf(kid.text)) continue;
  const r = offerAgreed(her.text, kid.text); if (!r) continue;
  read++; const mv = next?.lesson_id === kid.lesson_id ? (typeof next.meta?.move === "string" ? next.meta.move : next.meta?.move?.kind) : "-";
  const k = `${r.type}${r.chapter ? " ch" + r.chapter : ""} (then ${mv})`; by[k] = (by[k] ?? 0) + 1;
  if (ex.length < 15) ex.push(`${k} | ${String(her.text).slice(-120)}`);
}
console.log(pairs, "TEST pairs;", read, "bare agreements to her single offer now read", JSON.stringify(by, null, 1));
for (const e of ex) console.log("  ", e);
process.exit(0);
