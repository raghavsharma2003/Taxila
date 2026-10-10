// r4-khand · the greedy mesher (src/play/engines/khand/mesher.ts). The merged quads must cover EXACTLY the faces a naive
// mesher would draw (no hole, no overlap, no face on the ground, nothing hidden drawn), never merge two materials or two
// occlusion patterns, wind outward, and cost far fewer quads. Pure; runs in node (the worker runs the same function).
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { meshVolume, naiveQuads, volumeOf } from "../src/play/engines/khand/mesher.ts";
import { mulberry32 } from "../src/play/core/rng.ts";

const solid = (v, x, y, z) => y < 0 || (x >= 0 && z >= 0 && y < v.sy && x < v.sx && z < v.sz && v.data[(y * v.sz + z) * v.sx + x] !== 0);
/** Unit faces covered by the greedy quads, each as "x,y,z,dir", from the quads' corners. */
function coveredFaces(m) {
  const out = new Map();
  for (let q = 0; q < m.positions.length / 12; q++) {
    const P = (k) => [m.positions[q * 12 + k * 3], m.positions[q * 12 + k * 3 + 1], m.positions[q * 12 + k * 3 + 2]];
    const ps = [P(0), P(1), P(2), P(3)], n = [m.normals[q * 12], m.normals[q * 12 + 1], m.normals[q * 12 + 2]];
    const d = n.findIndex((v) => v !== 0), sign = n[d], dir = d * 2 + (sign > 0 ? 0 : 1);
    const lo = [0, 1, 2].map((a) => Math.min(...ps.map((p) => p[a]))), hi = [0, 1, 2].map((a) => Math.max(...ps.map((p) => p[a])));
    const cell = [...lo]; cell[d] = sign > 0 ? lo[d] - 1 : lo[d];
    const ax = [0, 1, 2].filter((a) => a !== d);
    for (let i = lo[ax[0]]; i < hi[ax[0]]; i++) for (let j = lo[ax[1]]; j < hi[ax[1]]; j++) {
      const c = [...cell]; c[ax[0]] = i; c[ax[1]] = j;
      const k = `${c[0]},${c[1]},${c[2]},${dir}`;
      out.set(k, (out.get(k) ?? 0) + 1);
    }
  }
  return out;
}
function naiveFaces(v) {
  const out = new Set();
  const D = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  for (let y = 0; y < v.sy; y++) for (let z = 0; z < v.sz; z++) for (let x = 0; x < v.sx; x++) {
    if (!v.data[(y * v.sz + z) * v.sx + x]) continue;
    D.forEach(([a, b, c], dir) => { if (!solid(v, x + a, y + b, z + c)) out.add(`${x},${y},${z},${dir}`); });
  }
  return out;
}
const randomVolume = (seed, sx, sy, sz, mats = 3, fill = 0.5) => {
  const r = mulberry32(seed), h = Array.from({ length: sx * sz }, () => (r() < fill ? Math.floor(r() * (sy + 1)) : 0));
  return volumeOf(sx, sz, sy, h, (i, y) => 1 + ((i + y * 3) % mats));
};

describe("r4-khand greedy mesher", () => {
  it("covers exactly the naive mesher's faces, each once, on 300 random builds (height maps, 1-4 materials)", () => {
    for (let s = 1; s <= 300; s++) {
      const v = randomVolume(s, 2 + (s % 9), 1 + (s % 6), 2 + ((s * 7) % 9), 1 + (s % 4), 0.3 + (s % 5) * 0.15);
      const m = meshVolume(v), cov = coveredFaces(m), nf = naiveFaces(v);
      assert.equal(cov.size, nf.size, `seed ${s}: ${cov.size} faces vs ${nf.size}`);
      for (const [k, n] of cov) { assert.ok(nf.has(k), `seed ${s}: extra face ${k}`); assert.equal(n, 1, `seed ${s}: overlap at ${k}`); }
      assert.equal(m.index.length, m.quads * 6);
    }
  });
  it("never merges across materials: every quad's cells share one material", () => {
    for (let s = 1; s <= 80; s++) {
      const v = randomVolume(s * 13, 8, 4, 8, 4, 0.7), m = meshVolume(v, (mat) => mat);
      for (let q = 0; q < m.quads; q++) {
        const tile = m.tile[q * 4];
        for (let k = 1; k < 4; k++) assert.equal(m.tile[q * 4 + k], tile);
      }
      // the tiles a mesh uses are exactly the materials whose faces show
      const shown = new Set([...naiveFaces(v)].map((f) => { const [x, y, z] = f.split(",").map(Number); return v.data[(y * v.sz + z) * v.sx + x]; }));
      assert.deepEqual(new Set([...m.tile]), shown);
    }
  });
  it("winds every triangle outward (its normal agrees with the face normal)", () => {
    const m = meshVolume(randomVolume(7, 6, 4, 6, 2, 0.8));
    for (let t = 0; t < m.index.length; t += 3) {
      const P = (k) => [m.positions[m.index[t + k] * 3], m.positions[m.index[t + k] * 3 + 1], m.positions[m.index[t + k] * 3 + 2]];
      const [a, b, c] = [P(0), P(1), P(2)], u = b.map((v, i) => v - a[i]), w = c.map((v, i) => v - a[i]);
      const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
      const fn = [m.normals[m.index[t] * 3], m.normals[m.index[t] * 3 + 1], m.normals[m.index[t] * 3 + 2]];
      assert.ok(n[0] * fn[0] + n[1] * fn[1] + n[2] * fn[2] > 0, `triangle ${t / 3} faces inward`);
    }
  });
  it("costs far fewer quads than naive meshing on lesson-sized builds (reported)", () => {
    const rows = [];
    for (const [name, v] of [
      ["4x4x4 cube", volumeOf(4, 4, 4, Array(16).fill(4), () => 4)],
      ["10x8 floor of 24", volumeOf(10, 8, 1, Array.from({ length: 80 }, (_, i) => (i % 10 < 6 && i < 40 ? 1 : 0)), () => 5)],
      ["9x9 pit + paving", volumeOf(11, 11, 1, Array(121).fill(1), (i) => ((i % 11) && (i % 11) < 10 && i > 11 && i < 110 ? 4 : 2))],
      ["random 6x6 h<=4, 2 mats", randomVolume(3, 6, 4, 6, 2, 0.8)],
    ]) {
      const g = meshVolume(v).quads, n = naiveQuads(v);
      rows.push({ name, naive: n, greedy: g, ratio: +(n / g).toFixed(1) });
      assert.ok(g <= n);
    }
    console.log(JSON.stringify(rows));
    assert.ok(rows[0].ratio >= 8 && rows[1].ratio >= 4, JSON.stringify(rows));
  });
});
