// READ-ONLY: her lines that end on an offer; the child's next turn; the move that followed. Offer text is the teacher's
// (printed, trimmed); the child's reply is shown only as its agreement class, never its words.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const { requestOf } = await import("/home/user/Taxila/server/director/requests.js");
const offers = await q(`select lesson_id, seq, text from turn where speaker <> 'child' and text ~* '(karein|karen|shuru|padhein|chalein|shall we|chahoge|chahogi)[^?]*\\?\\s*$'`);
const AGREE = /^\s*(haan|han|haa|ha|yes|yeah|ok|okay|theek|thik|chalo|sure|ji|हाँ|हां|हा|ठीक|चलो|ओके)\b[^?]{0,30}$/i;
const out = {}; const ex = [];
for (const o of offers) {
  const nx = await q(`select speaker, text, meta from turn where lesson_id = $1 and seq > $2 order by seq limit 2`, [o.lesson_id, o.seq]);
  const child = nx[0]?.speaker === "child" ? nx[0] : null, next = nx.find((t) => t.speaker !== "child");
  if (!child || !AGREE.test(child.text)) continue;
  const offerKind = /chapter|topic|adhyay|अध्याय/i.test(o.text) ? "chapter/topic" : /game|khel|picture|tasveer|kahani|story|video|draw/i.test(o.text) ? "way-in" : /break|ruk|stop|band/i.test(o.text) ? "break/stop" : "lesson-step";
  const mv = typeof next?.meta?.move === "string" ? next.meta.move : next?.meta?.move?.kind ?? "?";
  const k = `${offerKind} -> ${mv}${requestOf(child.text) ? " (req " + requestOf(child.text).type + ")" : ""}`;
  out[k] = (out[k] ?? 0) + 1;
  if ((offerKind === "break/stop" || offerKind === "chapter/topic") && ex.length < 20) ex.push(`${o.text.slice(-160)} => ${mv}`);
}
console.log(offers.length, "offer lines"); console.log(JSON.stringify(out, null, 1)); for (const e of ex) console.log("  ", e);
process.exit(0);
