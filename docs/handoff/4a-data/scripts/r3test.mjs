// READ-ONLY: TEST child turns, old vs new requestOf (counts by move; the clause that fired, child words not printed).
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; process.env.DATABASE_URL_DIRECT = "";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const { q } = await import("/home/user/Taxila/server/db.js");
const OLD = (await import(SP + "/pb/server/director/requests.js")).requestOf, NEW = (await import("/home/user/Taxila/server/director/requests.js")).requestOf;
const rows = await q(`select text from turn where speaker = 'child' and length(text) > 0`);
const by = {}; let moved = 0;
for (const { text } of rows) { const a = OLD(text), b = NEW(text); const ka = a ? a.type + (a.whole ? "" : "~") : "-", kb = b ? b.type + (b.whole ? "" : "~") + (b.clause ? "@" + b.clause : "") : "-"; if (ka === kb.replace(/@.*/, "")) continue; moved++; if (b?.type === "switch") console.log("  switch subject:", JSON.stringify(b.subject), "words:", text.split(/\s+/).length); by[`${ka} → ${kb}`] = (by[`${ka} → ${kb}`] ?? 0) + 1; }
console.log(rows.length, "TEST child turns;", moved, "moved", JSON.stringify(by));
process.exit(0);
