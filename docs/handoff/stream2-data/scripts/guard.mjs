process.env.TAXILA_DB = "test";
const { q } = await import("/home/user/Taxila/server/db.js");
const j = JSON.parse((await import("node:fs")).readFileSync("/home/user/Taxila/docs/design/round5/content/runs/iter3/board-asks.json", "utf8"));
for (const r of j.results.filter((x) => ["c5-numline-frac", "c9-numline-rational", "c6-numline-neg", "c3-clock"].includes(x.id))) {
  const rows = await q("select seq, speaker, text, meta from turn where lesson_id = $1 order by seq", [r.lessonId]).catch((e) => [{ text: String(e) }]);
  console.log(r.id, rows.length);
  for (const t of rows.slice(-2)) console.log("  ", t.speaker, JSON.stringify(t.meta?.guard ?? null), JSON.stringify(t.meta?.original ?? t.meta?.draft ?? "").slice(0, 200), "|", t.text.slice(0, 120));
}
process.exit(0);
