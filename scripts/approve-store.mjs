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
const promptSha = fileHash(PROMPT);
const written = [], refused = [];
for (const id of fs.readdirSync(PACKETS).filter((d) => fs.existsSync(path.join(PACKETS, d, "packet.json")))) {
  const p = JSON.parse(fs.readFileSync(path.join(PACKETS, id, "packet.json"), "utf8"));
  const v = verdicts.get(p.id);
  const why = !p.target ? "not a generated candidate (no target)"
    : !p.predicate?.ok ? `predicate: ${p.predicate?.why}`
    : !JUDGED_SIZES.some((s) => p.render?.byViewport?.[s]) ? `render: legible at no size ${JSON.stringify(p.render?.byViewport)}`
    : !v ? "no verdict" : v.verdict !== "pass" ? `judge: ${(v.faults ?? []).map((f) => f.kind).join(", ") || "fail"}`
    : specHash(p.archetype, p.spec) !== p.hash ? "hash does not match the spec" : null;
  // (the images judged are the images in the packet: their hashes now must be the hashes the render wrote)
  const imgOk = (p.images ?? []).every((im) => fs.existsSync(path.join(PACKETS, id, im.file)) && fileHash(path.join(PACKETS, id, im.file)) === im.sha256);
  if (why || !imgOk) { refused.push({ id: p.id, why: why ?? "an image changed after the render" }); continue; }
  const t = p.target;
  const rec = {
    v: 1, id: p.id, approved: true, hash: p.hash, archetype: p.archetype, spec: p.spec,
    for: { topic: t.topicId, skill: t.skillId ?? null, misconceptionId: t.misconceptionId, beat: t.beat ?? null, when: t.when ?? "remediation" },
    because: { mixup: p.topic?.mixup ?? { id: t.misconceptionId }, rule: "shown only to a child the learner model holds this mix-up for, at this beat; any other child gets the script's own board" },
    predicate: p.predicate, render: { byViewport: p.render.byViewport, images: p.images },
    judge: { verdict: "pass", by: JUDGE, promptSha256: promptSha, prompt: "data/studio-approved/JUDGE-PROMPT.md", faults: v.faults ?? [], readable: v.readable ?? null, notes: v.notes ?? null },
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
