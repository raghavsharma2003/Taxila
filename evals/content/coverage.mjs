// Round 2 · content: HONEST coverage of the 385 class 4-7 topics (VALUES-100 V3.1). Nothing here calls a model.
//
// A topic is covered only when ALL FOUR hold, each checked the way the live lesson checks it:
//   game     the shipped catalogue holds a checked real-time game or simulation (server/stagecraft/catalogue.js status ok)
//   explainer the shipped catalogue holds a checked scene explainer
//   board    the explain AND the worked-example beat each get a board that passes the LIVE drawing gate before her line
//            exists (board-first preselect: W0-W4, W7, W9 against the predicted line; W5/W6/W8 re-run on her real line).
//            The ship-five report counted authored boards by shape + lint; 95.8% of them fail W1 at the live gate.
//            Without board-first (HEAD), the same beat is counted with the HEAD code rung (codeBoard) instead.
//   key      every kit item carries a blind-solver verdict that agrees with the key (data/kits verified.agrees)
// Plus, for maths, how many kit items an engine can BIND (its right answer = the key, so its answer is evidence).
//
//   node evals/content/coverage.mjs [--root DIR] [--write FILE] [--quiet]
// --root runs the same count against another tree (the scratch copy with the stream's patches applied).
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : d; };
const ROOT = path.resolve(opt("root", path.resolve(new URL("../..", import.meta.url).pathname)));
const SUBJECTS = ["maths", "science", "evs", "sst", "english", "hindi"];
const imp = (p) => import(path.join(ROOT, p));

export async function coverage(root = ROOT) {
  const R = (p) => import(path.join(root, p));
  const { loadCatalogue } = await R("server/stagecraft/catalogue.js");
  const { kitFromFile } = await R("server/content/kits.js");
  const { getTopic } = await R("server/content/curriculum.js");
  const { planEngine } = await R("shared/engine-catalog.js");
  const sync = await R("server/stagecraft/board-sync.js");
  let bf = null;
  try { bf = fs.existsSync(path.join(root, "server/stagecraft/board-first.js")) ? await R("server/stagecraft/board-first.js") : null; } catch { bf = null; }
  const topicMap = JSON.parse(fs.readFileSync(path.join(root, "shared/engine-topic-map.json"), "utf8"));
  const cat = loadCatalogue({ fresh: true });
  const rows = [];
  let n = 0;
  for (const s of SUBJECTS) for (const c of [4, 5, 6, 7]) {
    const p = path.join(root, `data/kits/c${c}-${s}.json`);
    if (!fs.existsSync(p)) continue;
    for (const t of JSON.parse(fs.readFileSync(p, "utf8")).topics ?? []) {
      const e = cat.get(t.topicId);
      let kit = null; try { kit = kitFromFile(getTopic(t.topicId)); } catch { kit = null; }
      const beats = {};
      for (const [beat, content] of [["explain", (kit?.expectations ?? []).slice(0, 1)], ["worked_example", [`worked example: ${kit?.workedExample?.problem ?? ""}`]]]) {
        n++;
        const ask = { intent: { intentId: `cov:wb:${n}`, lessonId: "cov", kind: "whiteboard", beat, style: { band: "B3" } }, line: { lessonId: "cov", text: "" }, mode: "fresh", kit: { topicId: t.topicId, content } };
        let ok = false, by = null;
        if (kit && bf) { const pk = bf.preselect(ask, { kit }); ok = !!pk; by = pk?.by ?? null; }
        else if (kit) {
          const text = sync.predictedLineOf(ask, kit);
          const a2 = { ...ask, line: { ...ask.line, text } };
          const cb = text.length >= 12 ? sync.codeBoard(a2, { kit, lessonId: "cov", band: "B3" }, sync.gateCtxFor(a2, { kit })) : null;
          ok = !!cb; by = cb?.by ?? null;
        }
        beats[beat] = { ok, by };
      }
      const items = kit?.items ?? [];
      const keyOk = items.length > 0 && items.every((i) => i.verified?.agrees === true);
      const keyCount = items.filter((i) => i.verified?.agrees === true).length;
      let bound = 0;
      if (s === "maths" && kit) for (const it of items) { try { if (planEngine({ kit, item: it, lang: "en", mode: "show", topicMap })?.bindItem) bound++; } catch { /* counted as unbound */ } }
      rows.push({ topicId: t.topicId, subject: s, cls: c, game: !!e?.game, explainer: !!e?.explainer, board: beats.explain.ok && beats.worked_example.ok,
        boardBy: [beats.explain.by, beats.worked_example.by], key: keyOk, keyItems: `${keyCount}/${items.length}`, items: items.length, bound,
        status: e?.status ?? { game: "missing", explainer: "missing" } });
    }
  }
  const by = (f) => rows.filter(f).length;
  const all4 = (r) => r.game && r.explainer && r.board && r.key;
  const perSubject = Object.fromEntries(SUBJECTS.map((s) => { const xs = rows.filter((r) => r.subject === s); return [s, { topics: xs.length, game: xs.filter((r) => r.game).length, explainer: xs.filter((r) => r.explainer).length, board: xs.filter((r) => r.board).length, key: xs.filter((r) => r.key).length, all4: xs.filter(all4).length }]; }));
  const maths = rows.filter((r) => r.subject === "maths");
  return {
    root, boardFirst: !!bf, total: rows.length,
    counts: { game: by((r) => r.game), explainer: by((r) => r.explainer), board: by((r) => r.board), key: by((r) => r.key), all4: by(all4) },
    keyItems: { verifiedAgree: rows.reduce((a, r) => a + Number(r.keyItems.split("/")[0]), 0), items: rows.reduce((a, r) => a + r.items, 0) },
    mathsBinding: { topics: maths.length, topicsWithABoundItem: maths.filter((r) => r.bound > 0).length, boundItems: maths.reduce((a, r) => a + r.bound, 0), items: maths.reduce((a, r) => a + r.items, 0) },
    perSubject,
    short: rows.filter((r) => !all4(r)).map((r) => ({ topicId: r.topicId, missing: ["game", "explainer", "board", "key"].filter((k) => !r[k]), keyItems: r.keyItems, why: r.game && r.explainer ? undefined : `${r.status.game}/${r.status.explainer}` })),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const c = await coverage(ROOT);
  const { short, ...head } = c;
  if (!argv.includes("--quiet")) console.log(JSON.stringify(head, null, 1));
  console.log(`coverage (${c.boardFirst ? "board-first" : "HEAD code rung"}): ${c.total} topics · game ${c.counts.game} · explainer ${c.counts.explainer} · live board ${c.counts.board} · validated key ${c.counts.key} · ALL FOUR ${c.counts.all4} · maths bound items ${c.mathsBinding.boundItems}/${c.mathsBinding.items} (${c.mathsBinding.topicsWithABoundItem}/${c.mathsBinding.topics} topics)`);
  const w = opt("write", null);
  if (w) { fs.mkdirSync(path.dirname(w), { recursive: true }); fs.writeFileSync(w, JSON.stringify(c, null, 1)); console.log(`→ ${w}`); }
}
void imp;
