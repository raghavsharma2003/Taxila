// READ-ONLY: for each TEST fallback reply, the child turn before it read by requestOf, and whether her line before that
// ended on an offer. Counts only; no child words printed.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const { q } = await import("/home/user/Taxila/server/db.js");
const { requestOf } = await import("/home/user/Taxila/server/director/requests.js");
const rows = await q(`select t.lesson_id, t.seq, t.meta from turn t where t.speaker <> 'child' and t.meta::text ~ '(unavailable|fallback_reply)'`);
const OFFER = /(karein|karen|shuru|padhein|dekhein|chalein|shall we|should we|want to|chahoge|chahogi|chahenge)[^?]*\?\s*$/i;
const c = { n: rows.length, childReq: 0, reqTypes: {}, afterOffer: 0, agreeAfterOffer: 0 };
const AGREE = /^\s*(haan|han|haa|ha|yes|ok|okay|theek|thik|chalo|sure|ji|हाँ|हां|हा|ठीक|चलो|ओके)\b/i;
for (const r of rows) {
  const prior = await q(`select speaker, text from turn where lesson_id = $1 and seq < $2 order by seq desc limit 2`, [r.lesson_id, r.seq]);
  const child = prior.find((p) => p.speaker === "child"), her = prior.find((p) => p.speaker !== "child");
  const req = child ? requestOf(child.text) : null;
  if (req) { c.childReq++; c.reqTypes[req.type] = (c.reqTypes[req.type] ?? 0) + 1; }
  if (her && OFFER.test(her.text)) { c.afterOffer++; if (child && AGREE.test(child.text)) c.agreeAfterOffer++; }
}
console.log(JSON.stringify(c));
const offers = await q(`select count(*)::int n from turn where speaker <> 'child' and text ~* '(karein|karen|shuru|padhein|chalein|shall we|chahoge|chahogi)[^?]*\\?\\s*$'`);
console.log("teacher lines ending on an offer, all TEST:", offers[0].n);
process.exit(0);
