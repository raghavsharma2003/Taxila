// (d) before/after: per record, the poses of each card and the no_evidence replies the real classifier reads as an
// unsupported credit (model "correct", corroboration could not verify). Before: as recorded. After: a card stops being
// posed after its 2nd unsupported_credit reply.
import fs from "node:fs";
const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const { classify, targetFor } = await import("/home/user/Taxila/server/director/classify.js");
console.info = () => {}; const log = console.log; console.log = (...a) => { if (!String(a[0]).startsWith("[")) log(...a); };
let before3 = 0, after3 = 0, kids = 0;
for (const f of fs.readdirSync(SP + "/sl144")) {
  const r = JSON.parse(fs.readFileSync(SP + "/sl144/" + f, "utf8")); const T = r.turns ?? []; kids++;
  const poses = {}, unsup = {}; let third = false, thirdAfter = false, repostAfter2 = 0; const stopped = new Set();
  for (let i = 1; i < T.length; i++) {
    const id = T[i - 1].ui?.ask?.itemId; if (!id || id.startsWith("fade:") || id.startsWith("diag:")) continue;
    poses[id] = (poses[id] ?? 0) + 1;
    // a card posed again after its 2nd unverified right-looking reply: today it is; with (d) it never is
    if (stopped.has(id)) { repostAfter2 = (repostAfter2 ?? 0) + 1; third = true; }
    const t = T[i]; if (t.reasons?.classification?.outcome !== "no_evidence" || !t.child?.sent) continue;
    const tp = id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)?.[0]; const K = kitFromFile(getTopic(tp)); const item = K?.items.find((x) => x.id === id); if (!item) continue;
    const c = await classify({ target: targetFor({ phase: "practice" }, K, item), childText: t.child.sent, typed: true, heard: T[i - 1].teacher, classLevel: Number(tp.slice(1, 2)) });
    if (String(c.corroboration ?? "").startsWith("unsupported_credit")) { unsup[id] = (unsup[id] ?? 0) + 1; if (unsup[id] >= 2) stopped.add(id); }
  }
  if (third) before3++; if (thirdAfter) after3++;
  log(f.replace(/^.*?records_|\.json$/g, "").slice(0, 48).padEnd(50), "re-posed after 2 unverified (today):", repostAfter2, "| with (d): 0 | unsupported:", JSON.stringify(unsup));
}
log(kids, "children;", before3, "had a card posed again after its 2nd unverified reply today; 0 with (d)");
process.exit(0);
