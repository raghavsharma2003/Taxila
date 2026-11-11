#!/usr/bin/env node
// Approval lane, step 4 (docs/design/round7/studio/APPROVAL-LANE.md): a judged packet → an approved record in the store
// (data/studio-approved/<topicId>/<id>.json; the commit is the approval). Writes a record ONLY when the predicate checks
// passed, the render passed at ≥ 1 judged size (it is shown only there), and the separate judge's verdict is "pass"; anything else is reported
// and nothing is written.
//
//   node scripts/approve-store.mjs --packets <dir> --verdicts <verdicts.json> --judge "<who judged, model>" [--candidates <dir>]
//
// The record keeps: what the piece is FOR ({ topic, skill, misconceptionId, beat } with `because`), the spec and its hash,
// the predicate and render results, the judge's verdict with the judge prompt's sha256 and the images' sha256, and the
// generation call (deployment, attempt; the cost is in the candidates' manifest, copied to the store's manifest).
import fs from "node:fs";
import path from "node:path";
import { STORE_DIR, JUDGED_SIZES, specHash, fileHash } from "../server/studio/approved.js";

const arg = (k, d = null) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const PACKETS = path.resolve(arg("--packets", ".")), VERDICTS = path.resolve(arg("--verdicts", path.join(PACKETS, "verdicts.json")));
const JUDGE = arg("--judge", "a separate Claude judge"), CANDS = arg("--candidates");
const STORE = path.resolve(arg("--store", STORE_DIR));
const PROMPT = path.join(STORE_DIR, "JUDGE-PROMPT.md");

const verdicts = new Map(JSON.parse(fs.readFileSync(VERDICTS, "utf8")).map((v) => [v.id, v]));
// main 2026-11-10 (c5-t02: a second judge failed what the first passed): a stored approval needs TWO separate judges to pass the
// CONTENT items (truth, topic, key, no answer given away, register, language — every fault kind but "unreadable"); a split
// verdict is a fail, recorded with both reasons. Readability stays with the first judge. --verdicts2 <the second judge's file>.
const V2 = arg("--verdicts2"), JUDGE2 = arg("--judge2", "a second separate Claude judge");
const verdicts2 = V2 ? new Map(JSON.parse(fs.readFileSync(path.resolve(V2), "utf8")).map((v) => [v.id, v])) : null;
export const contentFaults = (v) => (v?.faults ?? []).filter((f) => f.kind !== "unreadable");
const promptSha = fileHash(PROMPT);
const written = [], refused = [];
for (const id of fs.readdirSync(PACKETS).filter((d) => fs.existsSync(path.join(PACKETS, d, "packet.json")))) {
  const p = JSON.parse(fs.readFileSync(path.join(PACKETS, id, "packet.json"), "utf8"));
  const v = verdicts.get(p.id);
  // (a catalogue packet — main's ruling: every catalogue piece needs a judged pass — has no target; it is FOR its topic)
  const why = !p.target && p.source !== "catalogue" ? "neither a generated candidate nor a catalogue piece"
    : !p.predicate?.ok ? `predicate: ${p.predicate?.why}`
    : !JUDGED_SIZES.some((s) => p.render?.byViewport?.[s]) ? `render: legible at no size ${JSON.stringify(p.render?.byViewport)}`
    : !v ? "no verdict" : v.verdict !== "pass" ? `judge: ${(v.faults ?? []).map((f) => f.kind).join(", ") || "fail"}`
    : !verdicts2 ? "one judge only: a stored approval needs a second judge's content verdict (--verdicts2)"
    : !verdicts2.get(p.id) ? "no second verdict"
    : contentFaults(verdicts2.get(p.id)).length ? `split verdict: judge 1 pass, judge 2 ${contentFaults(verdicts2.get(p.id)).map((f) => f.kind).join(", ")}`
    : specHash(p.archetype, p.spec) !== p.hash ? "hash does not match the spec" : null;
  // (the images judged are the images in the packet: their hashes now must be the hashes the render wrote)
  const imgOk = (p.images ?? []).every((im) => fs.existsSync(path.join(PACKETS, id, im.file)) && fileHash(path.join(PACKETS, id, im.file)) === im.sha256);
  if (why || !imgOk) { refused.push({ id: p.id, why: why ?? "an image changed after the render", ...(verdicts2?.get(p.id) ? { judge1: (v?.faults ?? []).map((f) => `${f.kind}: ${String(f.detail ?? "").slice(0, 120)}`), judge2: (verdicts2.get(p.id).faults ?? []).map((f) => `${f.kind}: ${String(f.detail ?? "").slice(0, 120)}`) } : {}) }); continue; }
  const t = p.target ?? { topicId: p.topicId, skillId: null, misconceptionId: null, beat: null, when: "catalogue" };
  const rec = {
    v: 1, id: p.id, approved: true, hash: p.hash, archetype: p.archetype, spec: p.spec,
    for: { topic: t.topicId, skill: t.skillId ?? null, misconceptionId: t.misconceptionId, beat: t.beat ?? null, when: t.when ?? "remediation" },
    because: p.source === "catalogue" ? { rule: "the topic's catalogue piece, shown where the tray gate certifies it; judged on rubric v1 (main's ruling 2026-11-10)" }
      : { mixup: p.topic?.mixup ?? { id: t.misconceptionId }, rule: "shown only to a child the learner model holds this mix-up for, at this beat; any other child gets the script's own board" },
    source: p.source ?? "generated",
    predicate: p.predicate, render: { byViewport: p.render.byViewport, images: p.images },
    judge: { verdict: "pass", by: JUDGE, promptSha256: promptSha, prompt: "data/studio-approved/JUDGE-PROMPT.md", faults: v.faults ?? [], readable: v.readable ?? null, notes: v.notes ?? null },
    judge2: { verdict: verdicts2.get(p.id).verdict, by: JUDGE2, content: "pass", faults: verdicts2.get(p.id).faults ?? [], notes: verdicts2.get(p.id).notes ?? null },
    generation: p.generation ?? null, approvedAt: new Date().toISOString(),
  };
  fs.mkdirSync(path.join(STORE, t.topicId), { recursive: true });
  fs.writeFileSync(path.join(STORE, t.topicId, `${p.id}.json`), JSON.stringify(rec, null, 2) + "\n");
  // the judged images go with the record (the hashes above are theirs)
  for (const im of p.images) fs.copyFileSync(path.join(PACKETS, id, im.file), path.join(STORE, t.topicId, `${p.id}-${im.vp}.png`));
  written.push(p.id);
}
if (CANDS && fs.existsSync(path.join(CANDS, "manifest.json"))) {
  const m = JSON.parse(fs.readFileSync(path.join(CANDS, "manifest.json"), "utf8"));
  const mf = path.join(STORE, "manifest.json");
  const prev = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, "utf8")) : { v: 1, runs: [] };
  prev.runs.push({ at: m.at, capUsd: m.capUsd, totalUsd: m.totalUsd, calls: m.calls, approved: written, refused });
  prev.totalUsd = Math.round(prev.runs.reduce((n, r) => n + (r.totalUsd ?? 0), 0) * 1e6) / 1e6;
  fs.writeFileSync(mf, JSON.stringify(prev, null, 2) + "\n");
}
console.log(`approved ${written.length}: ${written.join(", ") || "-"}`);
for (const r of refused) console.log(`not approved ${r.id}: ${r.why}`);
if (refused.length) fs.writeFileSync(path.join(PACKETS, "refused.json"), JSON.stringify(refused, null, 2) + "\n");
