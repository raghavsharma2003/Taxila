import fs from "node:fs"; import path from "node:path";
const A = await import("/home/user/Taxila/server/director/state.js"), B = await import("/home/user/Taxila/server/director/zz-state-a.js");
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const { CTX, cls } = await import("/home/user/Taxila/tests/fixtures/kit.mjs");
const { requestOf } = await import("/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let turns = 0, offDiff = 0, moveDiff = 0, unavail = [0, 0], drawn = [0, 0]; const ex = [], cards = new Set();
for (const f of walk(root)) {
  const j = JSON.parse(fs.readFileSync(f, "utf8")); const tp = j.start?.topic?.id && getTopic(j.start.topic.id); if (!tp) continue;
  let kit; try { kit = kitFromFile(tp); } catch { continue; }
  let ra, rb; try { ra = A.step(A.initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 }); rb = B.step(B.initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 }); } catch { continue; }
  let now = 0;
  for (const t of j.turns) { const text = t.child?.sent; if (typeof text !== "string" || !text.trim()) continue; now += 20000; turns++;
    const req = requestOf(text); const c = { ...cls("no_evidence"), ...(req ? { request: req } : {}) };
    try { ra = A.step(ra.state, { event: "turn", kit, cls: c, text, now }); rb = B.step(rb.state, { event: "turn", kit, cls: c, text, now }); } catch { break; }
    if ((ra.state.offTopic?.subject ?? null) !== (rb.state.offTopic?.subject ?? null)) offDiff++;
    if (ra.move.request === "visual_unavailable") unavail[0]++; if (rb.move.request === "visual_unavailable") unavail[1]++;
    if (ra.move.see?.off) drawn[0]++; if (rb.move.see?.off) drawn[1]++;
    const ka = `${ra.move.kind}|${ra.move.request}|${ra.move.see?.subject ?? ""}`, kb = `${rb.move.kind}|${rb.move.request}|${rb.move.see?.subject ?? ""}`;
    if (ka !== kb) { moveDiff++; cards.add(j.persona); if (ex.length < 12) ex.push(`${ka} -> ${kb}`); }
  }
}
console.log(JSON.stringify({ turns, offTopicDiffers: offDiff, movesDiffer: moveDiff, visualUnavailable: unavail, offKitSketch: drawn, cards: [...cards] }));
for (const e of ex) console.log(e);
