import fs from "node:fs"; import path from "node:path";
const { initLessonState, step } = await import(process.argv[2]);
const { kitFromFile } = await import("/home/user/Taxila/server/content/kits.js");
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const { CTX, cls } = await import("/home/user/Taxila/tests/fixtures/kit.mjs");
const { requestOf } = await import("/home/user/Taxila/server/director/requests.js");
const root = "/tmp/claude-0/-home-user-Taxila/ad86bd02-4520-580a-a0d1-168a0db0620c/scratchpad/simrec";
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".json") && d.endsWith("records") ? [path.join(d, e.name)] : []));
let lessons = 0, asks = 0, overrides = 0, named = 0; const ex = [];
for (const f of walk(root)) {
  const j = JSON.parse(fs.readFileSync(f, "utf8")); const tid = j.start?.topic?.id; const tp = tid && getTopic(tid); if (!tp) continue;
  let kit; try { kit = kitFromFile(tp); } catch { continue; } lessons++;
  let r; try { r = step(initLessonState({ topicId: kit.topicId, kit, ctx: { ...CTX }, seed: 7, now: 0 }), { event: "start", kit, now: 0 }); } catch { continue; }
  let now = 0;
  for (const t of j.turns) { const text = t.child?.sent; if (typeof text !== "string" || !text.trim()) continue; now += 20000;
    const req = requestOf(text);
    try { r = step(r.state, { event: "turn", kit, cls: { ...cls("no_evidence"), ...(req ? { request: req } : {}) }, text, now }); } catch { break; }
    if (r.move?.request === "visual") { asks++; const sub = r.move.see?.subject; const own = req?.subject ?? req?.see?.subject;
      if (sub && r.move.see?.off && !own) { overrides++; if (ex.length < 8) ex.push(sub); } else if (sub) named++; }
  }
}
console.log(JSON.stringify({ lessons, visualAsks: asks, askedForOwnSubject: named, askedForKeptSubject: overrides, examples: ex }));
