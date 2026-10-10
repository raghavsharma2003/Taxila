// Khand · the greedy voxel mesher (pure; runs in the mesher worker and, where no worker exists, on the main thread).
//
// A volume of sx × sy × sz cells holds a material id per cell (0 = air). For each of the six face directions, each slice
// gets a mask of the faces that touch air; equal neighbours (same material, same corner occlusion) are merged into the
// largest rectangles (greedy meshing: Lysenko's sweep). A merged quad carries its size in block units as `uvb`, so the
// shader repeats the block texture once per block whatever the quad's size. Ambient occlusion per corner (the classic
// side-side-corner rule) is part of the merge key, so merging never smears a shadow. The ground under y = 0 is solid:
// bottom faces on the ground are never drawn.
//
// Output buffers are fresh typed arrays the worker TRANSFERS (zero copy) to the main thread, which uploads them into
// pooled GPU buffers (scene.ts), so a re-mesh allocates no new geometry.

export interface Volume { sx: number; sy: number; sz: number; data: Uint8Array }
export interface MeshOut {
  positions: Float32Array; normals: Float32Array; uvb: Float32Array; tile: Float32Array; shade: Float32Array; index: Uint32Array;
  quads: number; ms: number;
}
/** The texture tile a material shows on a face: 0..15 in the atlas (textures.ts). `top` = a face pointing up. */
export type TileOf = (mat: number, dir: number) => number;
/** dir: 0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z */
export const defaultTile: TileOf = (mat) => mat;

const at = (v: Volume, x: number, y: number, z: number) => {
  if (y < 0) return 255;                                  // the ground
  if (x < 0 || z < 0 || x >= v.sx || y >= v.sy || z >= v.sz) return 0;
  return v.data[(y * v.sz + z) * v.sx + x];
};
const solid = (v: Volume, x: number, y: number, z: number) => at(v, x, y, z) !== 0;

/** Face light by direction: a fixed sun from above and the front-right (baked; the shader adds no lighting of its own). */
const FACE_LIGHT = [0.84, 0.66, 1.0, 0.5, 0.76, 0.92];

export function meshVolume(v: Volume, tileOf: TileOf = defaultTile): MeshOut {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], til: number[] = [], sh: number[] = [], idx: number[] = [];
  const dims = [v.sx, v.sy, v.sz];
  let quads = 0;
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3, w = (d + 2) % 3;
    const du = dims[u], dw = dims[w];
    const mask = new Int32Array(du * dw);
    for (const sign of [1, -1]) {
      const dir = d * 2 + (sign === 1 ? 0 : 1);
      for (let s = 0; s < dims[d]; s++) {
        // the mask of faces on the far (+) or near (−) side of cells in slice s
        let n = 0;
        for (let j = 0; j < dw; j++) for (let i = 0; i < du; i++) {
          const c = [0, 0, 0]; c[d] = s; c[u] = i; c[w] = j;
          const m = at(v, c[0], c[1], c[2]);
          const nb = [c[0], c[1], c[2]]; nb[d] += sign;
          if (m === 0 || m === 255 || solid(v, nb[0], nb[1], nb[2])) { mask[n++] = 0; continue; }
          // corner occlusion in the layer the face looks into
          const ao = (du1: number, dw1: number) => {
            const a = [...nb], b = [...nb], cc = [...nb];
            a[u] += du1; b[w] += dw1; cc[u] += du1; cc[w] += dw1;
            const s1 = solid(v, a[0], a[1], a[2]) ? 1 : 0, s2 = solid(v, b[0], b[1], b[2]) ? 1 : 0, s3 = solid(v, cc[0], cc[1], cc[2]) ? 1 : 0;
            return s1 && s2 ? 0 : 3 - (s1 + s2 + s3);
          };
          const a00 = ao(-1, -1), a10 = ao(1, -1), a11 = ao(1, 1), a01 = ao(-1, 1);
          mask[n++] = (m & 255) | (a00 << 8) | (a10 << 10) | (a11 << 12) | (a01 << 14) | (1 << 16);
        }
        // greedy: grow each unvisited face right (u) then down (w) while the key stays equal
        n = 0;
        for (let j = 0; j < dw; j++) for (let i = 0; i < du;) {
          const key = mask[n];
          if (!key) { i++; n++; continue; }
          let wi = 1;
          while (i + wi < du && mask[n + wi] === key) wi++;
          let hj = 1, ok = true;
          while (j + hj < dw && ok) {
            for (let k = 0; k < wi; k++) if (mask[n + k + hj * du] !== key) { ok = false; break; }
            if (ok) hj++;
          }
          emit(d, u, w, sign, dir, s, i, j, wi, hj, key);
          for (let l = 0; l < hj; l++) for (let k = 0; k < wi; k++) mask[n + k + l * du] = 0;
          i += wi; n += wi;
        }
      }
    }
  }
  function emit(d: number, u: number, w: number, sign: number, dir: number, s: number, i: number, j: number, wi: number, hj: number, key: number): void {
    const mat = key & 255, aoC = [(key >> 8) & 3, (key >> 10) & 3, (key >> 12) & 3, (key >> 14) & 3];
    const plane = sign === 1 ? s + 1 : s;
    const corner = (cu: number, cw: number) => { const p = [0, 0, 0]; p[d] = plane; p[u] = cu; p[w] = cw; return p; };
    const vs = [corner(i, j), corner(i + wi, j), corner(i + wi, j + hj), corner(i, j + hj)];
    const uvs = [[0, 0], [wi, 0], [wi, hj], [0, hj]];
    const base = pos.length / 3, normal = [0, 0, 0]; normal[d] = sign;
    const light = FACE_LIGHT[dir], tile = tileOf(mat, dir);
    for (let k = 0; k < 4; k++) {
      pos.push(vs[k][0], vs[k][1], vs[k][2]); nor.push(normal[0], normal[1], normal[2]);
      // uvb: u along the face's first in-plane axis, v along the second; a vertical face keeps "up" as +v
      const uvk = d === 1 ? uvs[k] : u === 1 ? [uvs[k][1], uvs[k][0]] : uvs[k];
      uv.push(uvk[0], uvk[1]); til.push(tile); sh.push(light * (0.55 + 0.15 * aoC[k]));
    }
    // winding: counter-clockwise seen from outside; flip the diagonal where occlusion would make a visible seam
    const ccw = sign === 1;
    const flip = aoC[0] + aoC[2] < aoC[1] + aoC[3];
    const tri = flip ? [1, 2, 3, 1, 3, 0] : [0, 1, 2, 0, 2, 3];
    const order = ccw ? tri : [tri[0], tri[2], tri[1], tri[3], tri[5], tri[4]];
    for (const k of order) idx.push(base + k);
    quads++;
  }
  const ms = (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0;
  return { positions: new Float32Array(pos), normals: new Float32Array(nor), uvb: new Float32Array(uv), tile: new Float32Array(til), shade: new Float32Array(sh), index: new Uint32Array(idx), quads, ms };
}

/** The naive mesher (one quad per exposed face), kept only to measure what greedy meshing saves. */
export function naiveQuads(v: Volume): number {
  let q = 0;
  for (let y = 0; y < v.sy; y++) for (let z = 0; z < v.sz; z++) for (let x = 0; x < v.sx; x++) {
    if (!solid(v, x, y, z)) continue;
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) if (!solid(v, x + dx, y + dy, z + dz)) q++;
  }
  return q;
}

/** A height-map build as a volume: column i rises to h[i]; `matAt(i, y)` picks the material of each cell. */
export function volumeOf(w: number, d: number, sy: number, h: readonly number[], matAt: (i: number, y: number) => number): Volume {
  const data = new Uint8Array(w * sy * d);
  for (let z = 0; z < d; z++) for (let x = 0; x < w; x++) {
    const i = z * w + x;
    for (let y = 0; y < Math.min(sy, h[i]); y++) data[(y * d + z) * w + x] = matAt(i, y);
  }
  return { sx: w, sy, sz: d, data };
}
