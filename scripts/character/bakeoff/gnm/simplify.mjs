// meshoptimizer (MIT) simplification for the numpy stages: edge collapses onto EXISTING vertices, so every attribute
// and morph target of the kept vertices carries over exactly (compaction happens in python).
//   node simplify.mjs <dir>   reads dir/in.json {targetTris, error, attrWeights, flags} + pos.f32 idx.u32 lock.u8
//                             [attr.f32], writes dir/out.u32 (indices into the original vertex array)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
const TOOLS = process.env.CHAR_TOOLS || "/tmp/claude-0/char/tools";
const req = createRequire(path.join(TOOLS, "package.json"));
const { MeshoptSimplifier } = req("meshoptimizer");
await MeshoptSimplifier.ready;
const d = process.argv[2];
const cfg = JSON.parse(fs.readFileSync(path.join(d, "in.json")));
const rd = (f, T) => { const b = fs.readFileSync(path.join(d, f)); return new T(b.buffer, b.byteOffset, b.byteLength / T.BYTES_PER_ELEMENT); };
const pos = rd("pos.f32", Float32Array), idx = rd("idx.u32", Uint32Array), lock = rd("lock.u8", Uint8Array);
const attr = fs.existsSync(path.join(d, "attr.f32")) ? rd("attr.f32", Float32Array) : null;
const na = cfg.attrWeights?.length || 0;
const [out, err] = attr
  ? MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, attr, na, cfg.attrWeights, lock, cfg.targetTris * 3, cfg.error, cfg.flags || [])
  : MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, new Float32Array(pos.length / 3), 1, [0], lock, cfg.targetTris * 3, cfg.error, cfg.flags || []);
fs.writeFileSync(path.join(d, "out.u32"), Buffer.from(out.buffer, out.byteOffset, out.byteLength));
console.log(JSON.stringify({ tris: out.length / 3, error: err }));
