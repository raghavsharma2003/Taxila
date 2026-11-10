#!/usr/bin/env node
// Approval lane, steps 2-3 (docs/design/round7/studio/APPROVAL-LANE.md): everything after the paid call, with NO key.
// For each piece: today's predicate checks (catalogue.js checkSpec: the engine's schema, kit ids, unsafe strings; the
// hash), then a render in the REAL Desk tray at p360, p412 and l1366 (the forge3 harness in a local Chromium, the gate's own
// measure: legible, apart, inside, no errors), with a screenshot per size. It writes a JUDGE PACKET per piece: the images
// and their sha256, the spec as data, the topic's cards and keys, and the mix-up it is aimed at — what the separate Claude
// judge is given, and nothing of the author's reasoning.
//
//   FORGE3_QA_LOCAL=1 node scripts/approve-check.mjs --candidates <dir> --out <packets dir>
//   FORGE3_QA_LOCAL=1 node scripts/approve-check.mjs --catalogue-sample 20 --seed <n> --out <packets dir>
//
// The judge's verdict then goes into scripts/approve-store.mjs, which writes the approved record.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { checkSpec, kitTopicAny } from "../server/stagecraft/catalogue.js";
import { specHash, fileHash, JUDGED_SIZES } from "../server/studio/approved.js";
import { boardTwinFor } from "../server/stagecraft/builders.js";

const arg = (k, d = null) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const OUT = path.resolve(arg("--out", "approve-packets"));
const CANDS = arg("--candidates"), SAMPLE = Number(arg("--catalogue-sample", "0")), SEED = Number(arg("--seed", "20261110"));
// --catalogue-all: every catalogue game AND explainer (main's ruling 2026-11-10: the whole catalogue is re-judged on rubric v1);
// --skip <dir>: leave out pieces that already have a packet there (a resumed run)
const ALL = process.argv.includes("--catalogue-all"), SKIP = arg("--skip");

/** A seeded shuffle (mulberry32): the same seed draws the same sample. */
export function seededSample(list, n, seed) {
  let a = seed >>> 0;
  const rnd = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const xs = [...list];
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; }
  return xs.slice(0, n);
}

/** The pieces to check: { id, topicId, archetype, spec, mixup?, source }. */
function pieces() {
  if (CANDS) return fs.readdirSync(CANDS).filter((f) => f.endsWith(".candidate.json")).map((f) => {
    const c = JSON.parse(fs.readFileSync(path.join(CANDS, f), "utf8"));
    return { id: `gen-${c.target.topicId}-${c.hash.slice(0, 8)}`, topicId: c.target.topicId, archetype: c.archetype, spec: c.spec, mixup: c.target.misconceptionId, target: c.target, generation: c.generation, source: "generated" };
  });
  if (ALL) {
    const dir = path.resolve("data/studio-catalogue/topics");
    const done = SKIP && fs.existsSync(SKIP) ? new Set(fs.readdirSync(SKIP)) : new Set();
    return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort().map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))).flatMap((r) =>
      [["game", ""], ["explainer", "-explainer"]].filter(([k]) => r[k]?.archetype && r[k]?.spec)
        .map(([k, suf]) => ({ id: `cat-${r.topicId}${suf}`, topicId: r.topicId, archetype: r[k].archetype, spec: r[k].spec, mixup: null, source: "catalogue", piece: k })))
      .filter((p) => !done.has(p.id));
  }
  if (SAMPLE > 0) {
    const dir = path.resolve("data/studio-catalogue/topics");
    const all = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
      .filter((r) => r.game?.archetype && r.check?.verdict === "pass").sort((a, b) => (a.topicId < b.topicId ? -1 : 1));
    return seededSample(all, SAMPLE, SEED).map((r) => ({ id: `cat-${r.topicId}`, topicId: r.topicId, archetype: r.game.archetype, spec: r.game.spec, mixup: null, source: "catalogue" }));
  }
  throw new Error("give --candidates <dir> or --catalogue-sample N");
}

/** What the judge needs of the topic: the mix-up's belief and signs, and the topic's cards (prompt and key), no more. */
function topicFacts(topicId, mixup) {
  const k = kitTopicAny(topicId);
  const m = (k?.misconceptions ?? []).find((x) => x.id === mixup) ?? null;
  const cards = (k?.items ?? []).filter((i) => !m?.skillId || i.skillId === m.skillId).slice(0, 6)
    .map((i) => ({ prompt: i.prompt_en, key: i.answer, acceptable: i.acceptable ?? [] }));
  return { mixup: m ? { id: m.id, belief: m.belief, signs: m.signs ?? [] } : null, misconceptions: mixup ? undefined : (k?.misconceptions ?? []).map((x) => ({ id: x.id, belief: x.belief })), cards };
}

const list = pieces();
fs.mkdirSync(OUT, { recursive: true });
process.env.FORGE3_QA_LOCAL ||= "1";
const { buildHarness, serveHarness, openJudge, launchLocal } = await import("../server/forge3/qa/render.js");
const { GATE_VIEWPORTS } = await import("../server/forge3/qa/viewports.js");
const harnessDir = await buildHarness(fs.mkdtempSync(path.join(os.tmpdir(), "approve-harness-")));
const { server, base } = await serveHarness(harnessDir);
const browser = await launchLocal();
const judge = await openJudge({ browser, base });
const index = [];
try {
  for (const p of list) {
    const kit = kitTopicAny(p.topicId);
    const pred = checkSpec(p.archetype, p.spec, kit);
    const dir = path.join(OUT, p.id);
    fs.mkdirSync(dir, { recursive: true });
    // (rendered as the child gets it: with its board twin, which the stage shows where the 1000-unit world is too small to play —
    // every 360 px phone; main 2026-11-10: the twin-less renders judged a view no child sees)
    const twin = (() => { try { return boardTwinFor({ archetype: p.archetype, family: p.archetype, need: "explain" }, p.topicId); } catch { return null; } })();
    const art = { kind: "stagecraft", stage: { w: 1000, h: 625 }, stagecraft: { rung: p.source === "catalogue" ? "library" : "generated_spec", archetype: p.archetype, spec: pred.spec ?? p.spec, boardTwin: twin } };
    const r = pred.ok ? await judge.judge(art, { viewports: GATE_VIEWPORTS, shotDir: dir, shotTag: "piece", young: (Number(/^c(\d+)-/.exec(p.topicId)?.[1]) || 9) <= 5, settleMs: 2500 }) : { views: [] };
    const byViewport = Object.fromEntries(JUDGED_SIZES.map((s) => [s, !!r.views.find((v) => v.vp === s)?.verdict?.pass]));
    const images = r.views.filter((v) => v.file).map((v) => ({ vp: v.vp, file: path.basename(v.file), sha256: fileHash(v.file) }));
    const packet = { v: 1, id: p.id, source: p.source, ...(p.piece ? { piece: p.piece } : {}), topicId: p.topicId, archetype: p.archetype, hash: specHash(p.archetype, p.spec),
      predicate: { ok: pred.ok, why: pred.why }, render: { byViewport, fails: Object.fromEntries(r.views.map((v) => [v.vp, v.verdict?.fails ?? []])) },
      images, ...(p.target ? { target: p.target } : {}), ...(p.generation ? { generation: p.generation } : {}), topic: topicFacts(p.topicId, p.mixup), spec: p.spec };
    fs.writeFileSync(path.join(dir, "packet.json"), JSON.stringify(packet, null, 2) + "\n");
    index.push({ id: p.id, topicId: p.topicId, archetype: p.archetype, predicate: pred.ok ? "pass" : pred.why, render: byViewport });
    console.log(`${p.id}: predicate ${pred.ok ? "pass" : pred.why}; render ${JSON.stringify(byViewport)}`);
  }
} finally { await judge.close(); await browser.close(); server.close(); }
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ v: 1, at: new Date().toISOString(), ...(SAMPLE ? { sample: SAMPLE, seed: SEED } : {}), pieces: index }, null, 2) + "\n");
