"""Derive the lamp1 runtime from the shipped r8 runtime (src/face-puppet/runtime, = polish-r8/runtime byte for byte under
its 2-line sync header) by explicit, asserted replacements: every c-front pixel position becomes a read of F (face.js),
whose defaults are those same values. Nothing else changes, so an r8 pack (no geom.face) renders identically; that is
checked by restcmp (frames of the r8 pack through both runtimes).
    python3 -I make-runtime.py
Output: scripts/character/puppet2d/lamp1/runtime/{rig,lips,gl,life,expr,face}.js (+ the .d.ts files)."""
import os, re, shutil

SRC = "/home/user/Taxila/src/face-puppet/runtime"
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = f"{HERE}/runtime"
os.makedirs(OUT, exist_ok=True)

def body(f):
    s = open(f"{SRC}/{f}").read()
    lines = s.split("\n")
    assert lines[0].startswith("// SYNCED from"), f
    return "\n".join(lines[2:])

def rep(s, pairs, name):
    for old, new, *n in pairs:
        want = n[0] if n else 1
        got = s.count(old)
        assert got == want, f"{name}: expected {want} of {old[:70]!r}, found {got}"
        s = s.replace(old, new)
    return s

HDR = "// lamp1 (round 4, Asha option 4): derived from the r8 runtime by scripts/character/puppet2d/lamp1/make-runtime.py;\n// every c-front pixel constant now reads F (face.js), whose defaults are those values (an r8 pack renders unchanged).\n"

# ---------------------------------------------------------------------------------------------------------------- rig.js
rig = body("rig.js")
rig = rep(rig, [
    ('import { Life } from "./life.js";\n', 'import { Life } from "./life.js";\nimport { F, setFace, onFace } from "./face.js";\n'),
    ("const PX = { cx: 512, cy: 420, rx: 322, ry: 392, A: 205, fcx: 530, fcy: 500, fsx: 128, fsy: 160, B: 95, gain: 1.0, pivot: [530, 728] };\n",
     "// lamp1: the proxy is F.px (geom.face.px), c-front's values by default\n"),
    ("  z += 26 * Math.exp(-((x - 530) ** 2 + (y - 532) ** 2) / (2 * 24 * 24));                       // nose\n",
     "  { const N = F.noseZ; z += N.a * Math.exp(-((x - N.x) ** 2 + (y - N.y) ** 2) / (2 * N.s * N.s)); }   // nose\n"),
    ("  for (const cx of [452, 608]) z += 8 * Math.exp(-((x - cx) ** 2 + (y - 585) ** 2) / (2 * 45 * 45)); // cheeks\n",
     "  { const C = F.cheekZ; for (const cx of C.xs) z += C.a * Math.exp(-((x - cx) ** 2 + (y - C.y) ** 2) / (2 * C.s * C.s)); } // cheeks\n"),
    ("const PIN_AT = [[364, 384], [684, 368]];\n", "// lamp1: the pins are F.pins\n"),
    ("  const u = (x - 530) / 208, au = Math.abs(u);\n  const yb = smooth(320, 430, y) * (1 - smooth(690, 790, y));",
     "  const u = (x - F.mid) / F.hw, au = Math.abs(u), S = F.sil;\n  const yb = smooth(S.y[0], S.y[1], y) * (1 - smooth(S.y[2], S.y[3], y));"),
    ("  let dx = -sg * (far ? SIL.far : SIL.near) * band * yb;", "  let dx = -sg * (far ? SIL.far : SIL.near) * F.k * band * yb;"),
    ("  dx += sg * SIL.chin * smooth(560, 690, y) * (1 - smooth(720, 800, y)) * Math.exp(-((u / 0.75) ** 2));",
     "  dx += sg * SIL.chin * F.k * smooth(S.chin[0], S.chin[1], y) * (1 - smooth(S.chin[2], S.chin[3], y)) * Math.exp(-((u / S.chinW) ** 2));"),
    ("""  if (y < 320 || y > 700 || x < 400 || x > 660) return 0;
  let dx = 0;
  const nx = x - 533;
  if (y > 470 && y < 600) {
    dx += FEAT.nose * Math.exp(-((nx / 27) ** 2) - (((y - 540) / 24) ** 2));
    dx -= FEAT.wing * Math.exp(-(((nx - sg * 23) / 11) ** 2) - (((y - 552) / 13) ** 2));
  }
  if (y < 400) dx += FEAT.bindi * Math.exp(-(((x - 526) / 20) ** 2) - (((y - 354) / 18) ** 2));
  if (y > 560) dx += FEAT.mouth * Math.exp(-(((x - 530) / 40) ** 2)) * smooth(560, 585, y) * (1 - smooth(650, 700, y));
  return sg * dx;""",
     """  const G = F.feat, bx = G.box;
  if (y < bx[1] || y > bx[3] || x < bx[0] || x > bx[2]) return 0;
  let dx = 0;
  const nx = x - G.nose[0];
  if (y > G.noseY[0] && y < G.noseY[1]) {
    dx += FEAT.nose * Math.exp(-((nx / G.nose[2]) ** 2) - (((y - G.nose[1]) / G.nose[3]) ** 2));
    dx -= FEAT.wing * Math.exp(-(((nx - sg * G.wing[0]) / G.wing[2]) ** 2) - (((y - G.wing[1]) / G.wing[3]) ** 2));
  }
  if (y < G.bindiY) dx += FEAT.bindi * Math.exp(-(((x - G.bindi[0]) / G.bindi[2]) ** 2) - (((y - G.bindi[1]) / G.bindi[3]) ** 2));
  if (y > G.mouthY[0]) dx += FEAT.mouth * Math.exp(-(((x - G.mouth[0]) / G.mouth[1]) ** 2)) * smooth(G.mouthY[0], G.mouthY[1], y) * (1 - smooth(G.mouthY[2], G.mouthY[3], y));
  return sg * dx * F.k;"""),
    ("""  const key = JSON.stringify(FEAT);
  if (FD.key === key) return FD.T;
  FD.key = key; FD.T""", """  const key = JSON.stringify(FEAT) + JSON.stringify(F.feat) + F.k;
  if (FD.key === key) return FD.T;
  { const bx = F.feat.box; FD.x0 = bx[0]; FD.y0 = bx[1]; FD.nx = Math.round((bx[2] - bx[0]) / FD.s) + 1; FD.ny = Math.round((bx[3] - bx[1]) / FD.s) + 1; }
  FD.key = key; FD.T"""),
    ("const ZS = 8, ZN = 1024 / ZS + 1, ZLUT = new Float32Array(ZN * ZN);\nfor (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) ZLUT[j * ZN + i] = zHead(i * ZS, j * ZS);",
     "const ZS = 8, ZN = 1024 / ZS + 1, ZLUT = new Float32Array(ZN * ZN);\nconst buildZ = () => { for (let j = 0; j < ZN; j++) for (let i = 0; i < ZN; i++) ZLUT[j * ZN + i] = zHead(i * ZS, j * ZS); };\nbuildZ();\nonFace(buildZ);   // lamp1: the depth table follows the face's proxy"),
    ("  const ax = Math.abs(x - 530);\n  return Math.sign(x - 530) * smooth(40, 170, ax) * Math.exp(-(((y - 650) / 70) ** 2));",
     "  const ax = Math.abs(x - F.mid), N = F.narrow;\n  return Math.sign(x - F.mid) * smooth(N.ax[0], N.ax[1], ax) * Math.exp(-(((y - N.y) / N.s) ** 2));"),
    ("""  return [Math.exp(-((x - 455) ** 2 + (y - 585) ** 2) / (2 * 42 * 42)), Math.exp(-((x - 605) ** 2 + (y - 585) ** 2) / (2 * 42 * 42)),
    Math.exp(-((x - 430) ** 2 + (y - 545) ** 2) / (2 * 48 * 48)), Math.exp(-((x - 632) ** 2 + (y - 545) ** 2) / (2 * 48 * 48)),
    jawProfile(x, y), Math.sign(x - 530),
    Math.max(0, smooth(606, 668, y) * Math.exp(-(((x - 530) / 180) ** 2)) - jawProfile(x, y)), narrowW(x, y)];""",
     """  const C = F.cheeks, Wk = F.wink, J = F.jawBroad;
  return [Math.exp(-((x - C.L[0]) ** 2 + (y - C.L[1]) ** 2) / (2 * C.s * C.s)), Math.exp(-((x - C.R[0]) ** 2 + (y - C.R[1]) ** 2) / (2 * C.s * C.s)),
    Math.exp(-((x - Wk.L[0]) ** 2 + (y - Wk.L[1]) ** 2) / (2 * Wk.s * Wk.s)), Math.exp(-((x - Wk.R[0]) ** 2 + (y - Wk.R[1]) ** 2) / (2 * Wk.s * Wk.s)),
    jawProfile(x, y), Math.sign(x - F.mid),
    Math.max(0, smooth(J.y[0], J.y[1], y) * Math.exp(-(((x - F.mid) / J.s) ** 2)) - jawProfile(x, y)), narrowW(x, y)];"""),
    ("  constructor(canvas, geom, mouths, imgs, opts) {\n    this.g = geom;\n",
     "  constructor(canvas, geom, mouths, imgs, opts) {\n    setFace(geom.face);   // lamp1: this pack's face constants (none = c-front, r8)\n    this.g = geom;\n"),
    ("return (x - 530) * sg > 0 ?", "return (x - F.mid) * sg > 0 ?"),
    ("    { const L = this.layers.bun; for (let i = 0; i < L.n; i++) L.z[i] = L.z[i] - 45; }",
     "    { const L = this.layers.bun; for (let i = 0; i < L.n; i++) L.z[i] = L.z[i] + F.bunZ; }"),
    ("    { const L = this.layers.lockR; for (let i = 0; i < L.n; i++) L.z[i] -= 45 * smooth(585, 650, L.rest[i * 2 + 1]); }",
     "    for (const [sd, b] of Object.entries(F.lockBun || {})) { if (!b) continue; const L = this.layers[\"lock\" + sd]; for (let i = 0; i < L.n; i++) L.z[i] += F.bunZ * smooth(b[0], b[1], L.rest[i * 2 + 1]); }"),
    ("          const ly = kk === \"mid\" ? lashY(x) : rect[3] - 22,", "          const ly = kk === \"mid\" ? lashY(x) : rect[3] - 22 * F.ke,"),
    ("      this.glints = [[315, 565], [748, 541]].map(([gx, gy]) => {", "      this.glints = F.glints.map(([gx, gy]) => {"),
    ("      const r = 4.2 + 2.4 * m;", "      const r = (4.2 + 2.4 * m) * F.ke;"),
    ("      this.R.drawPaint(G.mesh, this.glintTex, [0, 0, 1, 1], 0.22 + 0.1 * tw + 0.6 * m);", "      this.R.drawPaint(G.mesh, this.glintTex, [0, 0, 1, 1], (0.22 + 0.1 * tw + 0.6 * m) * F.glintA);"),
    ("PX.gain", "F.px.gain", 2),
    ("  const u = (x - PX.cx) / PX.rx, v = (y - PX.cy) / PX.ry;\n  const q = Math.max(0, 1 - u * u - v * v);\n  let z = PX.A * q * q;\n  z += PX.B * Math.exp(-((x - PX.fcx) ** 2) / (2 * PX.fsx * PX.fsx) - ((y - PX.fcy) ** 2) / (2 * PX.fsy * PX.fsy));",
     "  const PX = F.px, u = (x - PX.cx) / PX.rx, v = (y - PX.cy) / PX.ry;\n  const q = Math.max(0, 1 - u * u - v * v);\n  let z = PX.A * q * q;\n  z += PX.B * Math.exp(-((x - PX.fcx) ** 2) / (2 * PX.fsx * PX.fsx) - ((y - PX.fcy) ** 2) / (2 * PX.fsy * PX.fsy));"),
    ("      bob: -breath * 1.4, leanS: 1 + 0.01 * Math.tanh(lean / 0.7), leanY: 7 * lean, lean,",
     "      bob: -breath * 1.4 * F.k, leanS: 1 + 0.01 * Math.tanh(lean / 0.7), leanY: 7 * lean * F.k, lean,"),
    ("this.solver.ment = 3.2 * ep *", "this.solver.ment = 3.2 * F.k * ep *"),
    ("    const anchor = this.project(530, 300, 120);", "    const anchor = this.project(F.anchor[0], F.anchor[1], F.anchor[2]);"),
    ("    const dy = Y - PX.cy;\n    Y = PX.cy + dy * s.cp + z * s.sp;", "    const P = F.px, dy = Y - P.cy;\n    Y = P.cy + dy * s.cp + z * s.sp;"),
    ("    const px = X - PX.pivot[0], py = Y - PX.pivot[1];\n    X = PX.pivot[0] + px * s.cr - py * s.sr;\n    Y = PX.pivot[1] + px * s.sr + py * s.cr;",
     "    const pv = P.pivot, px = X - pv[0], py = Y - pv[1];\n    X = pv[0] + px * s.cr - py * s.sr;\n    Y = pv[1] + px * s.sr + py * s.cr;"),
    ("    X = PX.pivot[0] + (X - PX.pivot[0]) * s.leanS;\n    Y = PX.pivot[1] + (Y - PX.pivot[1]) * s.leanS + s.bob * 0.6 + s.leanY;",
     "    X = pv[0] + (X - pv[0]) * s.leanS;\n    Y = pv[1] + (Y - pv[1]) * s.leanS + s.bob * 0.6 + s.leanY;"),
    ("    return j * (2.2 + 3.6 * sm) * (1 - 0.85 * (sol.surprised || 0));", "    return j * (2.2 + 3.6 * sm) * F.k * (1 - 0.85 * (sol.surprised || 0));"),
    ("""    for (const [cx, sd] of [[455, "L"], [605, "R"]]) {
      const f = Math.exp(-((x - cx) ** 2 + (y - 585) ** 2) / (2 * 42 * 42));""",
     """    const CK = F.cheeks, WK = F.wink;
    for (const [cx, cyk, sd] of [[CK.L[0], CK.L[1], "L"], [CK.R[0], CK.R[1], "R"]]) {
      const f = Math.exp(-((x - cx) ** 2 + (y - cyk) ** 2) / (2 * CK.s * CK.s));"""),
    ("      dy -= (sm * 4.5 + ch * 5.5 + ol) * f;", "      dy -= ((sm * 4.5 + ch * 5.5) * F.k + ol) * f;"),
    ("      dx += Math.sign(x - 530) * sm * 1.5 * f;", "      dx += Math.sign(x - F.mid) * sm * 1.5 * F.k * f;"),
    ("""      if (wk > 0) dy -= wk * 9 * Math.exp(-((x - (sd === "L" ? 430 : 632)) ** 2 + (y - 545) ** 2) / (2 * 48 * 48));""",
     """      if (wk > 0) { const wc = WK[sd]; dy -= wk * 9 * F.k * Math.exp(-((x - wc[0]) ** 2 + (y - wc[1]) ** 2) / (2 * WK.s * WK.s)); }"""),
    ("    const narrow = 4.5 * o * (0.4 + 0.6 * sur) * (1 - 0.75 * sm);", "    const narrow = 4.5 * F.k * o * (0.4 + 0.6 * sur) * (1 - 0.75 * sm);"),
    ("    return (this._fc = [sL * 4.5 + cL * 5.5 + ol, sR * 4.5 + cR * 5.5 + ol, sL * 1.5, sR * 1.5, wk.L * 9, wk.R * 9,",
     "    const K = F.k;\n    return (this._fc = [(sL * 4.5 + cL * 5.5) * K + ol, (sR * 4.5 + cR * 5.5) * K + ol, sL * 1.5 * K, sR * 1.5 * K, wk.L * 9 * K, wk.R * 9 * K,"),
    ("        let Y = 1024 + (y - 1024) * (1 + 0.004 * s.bob / -1.4);", "        const BD = F.body;\n        let Y = BD.hem + (y - BD.hem) * (1 + 0.004 * s.bob / (-1.4 * F.k));"),
    ("        const sh = smooth(95, 200, Math.abs(x - 527)) * (1 - smooth(860, 1010, y)) * smooth(700, 790, y);\n        if (sh > 0) { Y -= 2.4 * this.life.breathS * sh; X += Math.sign(x - 527) * 0.5 * this.life.breathS * sh; }",
     "        const sh = smooth(BD.sh[0], BD.sh[1], Math.abs(x - BD.cx)) * (1 - smooth(BD.shY[2], BD.shY[3], y)) * smooth(BD.shY[0], BD.shY[1], y);\n        if (sh > 0) { Y -= 2.4 * F.k * this.life.breathS * sh; X += Math.sign(x - BD.cx) * 0.5 * F.k * this.life.breathS * sh; }"),
    ("        { const bw = 1 - smooth(800, 1010, y);", "        { const bw = 1 - smooth(BD.bw[0], BD.bw[1], y);"),
    ("            Y += (s.leanY * 0.5 + (x - 527) * Math.sin(-s.roll * D2R) * 0.2 * smooth(700, 780, y)) * bw;\n            X += (x - 527) * 0.012 * s.lean * bw;",
     "            Y += (s.leanY * 0.5 + (x - BD.cx) * Math.sin(-s.roll * D2R) * 0.2 * smooth(BD.rollY[0], BD.rollY[1], y)) * bw;\n            X += (x - BD.cx) * 0.012 * s.lean * bw;"),
    ("        const neck = smooth(772, 700, y) * (1 - smooth(110, 160, Math.abs(x - 527)));",
     "        const neck = smooth(BD.neckY[0], BD.neckY[1], y) * (1 - smooth(BD.neckW[0], BD.neckW[1], Math.abs(x - BD.cx)));"),
    ("const [ax, ay] = PIN_AT[k]; L.pinW[i * 2 + k] = Math.exp(-((x - ax) ** 2 + (y - ay) ** 2) / (2 * 72 * 72));",
     "const [ax, ay] = F.pins[k]; L.pinW[i * 2 + k] = Math.exp(-((x - ax) ** 2 + (y - ay) ** 2) / (2 * F.pinS * F.pinS));"),
    ('      const a = this.browOffset("L", PIN_AT[0][0], PIN_AT[0][1]), b = this.browOffset("R", PIN_AT[1][0], PIN_AT[1][1]);',
     '      const a = this.browOffset("L", F.pins[0][0], F.pins[0][1]), b = this.browOffset("R", F.pins[1][0], F.pins[1][1]);'),
    ("    return { lift: 14 * wide + 12 * outer + 5 * inner + 4.2 * fl, inner: 53 * inner + 3 * fl, arch: 38 * outer, knit: 21 * down };",
     "    const kb = F.kb;\n    return { lift: (14 * wide + 12 * outer + 5 * inner + 4.2 * fl) * kb, inner: (53 * inner + 3 * fl) * kb, arch: 38 * outer * kb, knit: 21 * down * kb };"),
    ("      return 5.0 * Math.max(this.blinkDip || 0,", "      return 5.0 * F.kb * Math.max(this.blinkDip || 0,"),
    ("    const dipA = 5.0 * Math.max(this.blinkDip || 0,", "    const dipA = 5.0 * F.kb * Math.max(this.blinkDip || 0,"),
    ("    const shadeFace = [s.yaw >= 0 ? 1 : -1, s.yaw >= 0 ? 530 : 330, s.yaw >= 0 ? 730 : 530, 0.16 * Math.abs(s.yaw) / 20];\n    const shadeHair = [shadeFace[0], s.yaw >= 0 ? 400 : 200, s.yaw >= 0 ? 820 : 660, 0.1 * Math.abs(s.yaw) / 20];",
     "    const SF = F.shade.face, SH = F.shade.hair, sd0 = s.yaw >= 0 ? \"R\" : \"L\";\n    const shadeFace = [s.yaw >= 0 ? 1 : -1, SF[sd0][0], SF[sd0][1], SF.amt * Math.abs(s.yaw) / 20];\n    const shadeHair = [shadeFace[0], SH[sd0][0], SH[sd0][1], SH.amt * Math.abs(s.yaw) / 20];"),
    ("    const ox = (gz[0] / 25) * 18, oy = -(gz[1] / 20) * 12 + (gz[1] < 0 ? -gz[1] / 25 * 2 : 0);",
     "    const ox = (gz[0] / 25) * 18 * F.ke, oy = (-(gz[1] / 20) * 12 + (gz[1] < 0 ? -gz[1] / 25 * 2 : 0)) * F.ke;"),
    ("Math.min(push, 14)", "Math.min(push, 14 * F.ke)"),
    ("wy = smooth(M.rect[1], M.rect[1] + 60, M.rest[q * 2 + 1]);\n            y += 3.5 * (1 - r2) * wy;",
     "wy = smooth(M.rect[1], M.rect[1] + 60 * F.ke, M.rest[q * 2 + 1]);\n            y += 3.5 * F.ke * (1 - r2) * wy;"),
    ("            const wy = 0.2 + 0.8 * smooth(M.rect[1], M.rect[1] + 70, M.rest[q * 2 + 1]);\n            y += wk * (-15 + 36 * r2) * wy;",
     "            const wy = 0.2 + 0.8 * smooth(M.rect[1], M.rect[1] + 70 * F.ke, M.rest[q * 2 + 1]);\n            y += wk * (-15 + 36 * r2) * F.ke * wy;"),
    ("    const teethH = 10 + 5 * p.tuck + 4.5 * p.sq;", "    const teethH = (10 + 5 * p.tuck + 4.5 * p.sq) * F.mouth.k;"),
    ("    const ext = 2 + 9 * p.tuck;   // = LipShell.update's strip extension below the lower inner edge",
     "    const ext = (2 + 9 * p.tuck) * F.mouth.k;   // = LipShell.update's strip extension below the lower inner edge"),
    ("this.R = new Renderer(canvas, { clear: opts.clear || [251.4 / 255, 229.4 / 255, 188.6 / 255]", "this.R = new Renderer(canvas, { clear: opts.clear || geom.clear || [251.4 / 255, 229.4 / 255, 188.6 / 255]"),
    ("    this.view = opts.view || [140, 20, 744];", "    this.view = opts.view || (geom.views && geom.views.medium) || [140, 20, 744];   // lamp1: the pack's own framings"),
    # lamp1: a 4-element view [x0, y0, w, h] is a REGION fitted inside the canvas (contain, centred), so a wide window
    # (the child Home, 325 x 190) never crops her chin and a tall one never shows the empty rest space under the hem
    ("    R.setCam(this.view[0], this.view[1], this.view[2]);",
     "    if (this.view.length >= 4) { const cw = R.canvas.width, ch = R.canvas.height, v = this.view, sc = Math.min(cw / v[2], ch / v[3]), w = cw / sc, h = ch / sc; R.setCam(v[0] + (v[2] - w) / 2, v[1] + (v[3] - h) / 2, w); }\n    else R.setCam(this.view[0], this.view[1], this.view[2]);"),
    ("    this.R.dpr = opts.dpr || Math.min(2, window.devicePixelRatio || 1);",
     "    this.R.dpr = opts.dpr || Math.min(2, window.devicePixelRatio || 1);\n    this.R.face = { nose: F.noseShade, mk: F.mouth.k, tint: F.shade.tint, tongue: F.mouth.tongueMul || [1, 1, 1], teeth: F.mouth.teethMul || [1, 1, 1] };   // lamp1: per-face shader constants"),
    # lamp1: the procedural lid shadow is F.eye.shade = [at rest, once the lid has moved >= 4 px]. A front whose sclera
    # carries its own painted lid shadow (lamp1) takes [0, 0.3]: the rest frame is the painting, and the shadow rides a
    # lowered lid; c-front ([0.4, 0.4]) is unchanged. F.eye.round = the opening's rounded-end length (c-front 6 px).
    ("catchScr, catchC: [ccx, ccy], catchA, lidShade: 0.4, topY: interp(E.xa, E.top, icx),",
     "catchScr, catchC: [ccx, ccy], catchA, lidShade: F.eye.shade[0] + (F.eye.shade[1] - F.eye.shade[0]) * clamp01(Math.abs(interp(E.xa, E.top, icx) - interp(E.xa, e.top, icx)) / 4), topY: interp(E.xa, E.top, icx),"),
    ("      if (dEnd < 6) { const f = Math.sqrt(Math.max(0, 1 - (1 - dEnd / 6) ** 2)),",
     "      if (dEnd < F.eye.round) { const f = Math.sqrt(Math.max(0, 1 - (1 - dEnd / F.eye.round) ** 2)),"),
], "rig.js")
_zh = rig[rig.index("function zHead("):rig.index("return z;\n}")]
assert len(re.findall(r"(?<![\w.])PX\.", rig)) == len(re.findall(r"(?<![\w.])PX\.", _zh)), "PX. outside zHead (its local alias of F.px)"
assert "PIN_AT" not in rig
open(f"{OUT}/rig.js", "w").write(HDR + rig)

# --------------------------------------------------------------------------------------------------------------- lips.js
lips = body("lips.js")
lips = rep(lips, [
    ("const clamp = (x, a, b) =>", 'import { F, faceVersion } from "./face.js";\nconst clamp = (x, a, b) =>'),
    ("const LINE_X0 = 448;\n", ""),
    ("const LINE = [585, 584, 584, 587, 589, 592, 594, 596, 597, 599, 600, 601, 602, 603, 604, 604, 605, 605, 606, 606, 606, 606, 606, 605, 605, 604, 603, 602, 601, 600, 598, 597, 596, 594, 592, 589, 587, 584, 580, 576, 576, 575];\n",
     "// lamp1: the traced lip line is F.mouth.line (lineX0, lineStep); c-front's by default\n"),
    ("export const MOUTH = { cx: 530, hwL: 69, hwR: 71, tU: 13.5, tL: 21, cy: 606 };",
     "export const MOUTH = new Proxy({}, { get: (_, k) => F.mouth[k] });   // lamp1: F.mouth (c-front: cx 530, hwL 69, hwR 71, tU 13.5, tL 21, cy 606)"),
    ("  const f = (x - LINE_X0) / 4;\n  if (f <= 0) return LINE[0];\n  if (f >= LINE.length - 1) return LINE[LINE.length - 1];",
     "  const M = F.mouth, LINE = M.line, f = (x - M.lineX0) / M.lineStep;\n  if (f <= 0) return LINE[0];\n  if (f >= LINE.length - 1) return LINE[LINE.length - 1];"),
    ("const LC = lineY(MOUTH.cx + 4);   // the line's lowest (centre) point",
     "let _lcv = -1, _lc = 0;\nconst LCf = () => { if (_lcv !== faceVersion()) { _lcv = faceVersion(); _lc = lineY(F.mouth.cx + 4); } return _lc; };   // the line's lowest (centre) point"),
    ("const sOf = (x) => (x - MOUTH.cx) / (x < MOUTH.cx ? MOUTH.hwL : MOUTH.hwR);\nconst tUof = (a) => (a >= 1 ? 0 : MOUTH.tU * Math.pow(1 - a * a, 0.55));\nconst tLof = (a) => (a >= 1 ? 0 : MOUTH.tL * Math.pow(Math.max(0, 1 - Math.pow(a, 2.2)), 0.75));",
     "const sOf = (x) => { const M = F.mouth; return (x - M.cx) / (x < M.cx ? M.hwL : M.hwR); };\nconst tUof = (a) => (a >= 1 ? 0 : F.mouth.tU * Math.pow(1 - a * a, 0.55));\nconst tLof = (a) => (a >= 1 ? 0 : F.mouth.tL * Math.pow(Math.max(0, 1 - Math.pow(a, 2.2)), 0.75));"),
    # the solver stays in c-front units; the corner travel uses this face's half-width expressed in c-front units
    ("      const hw = s === \"L\" ? MOUTH.hwL : MOUTH.hwR;", "      const hw = (s === \"L\" ? F.mouth.hwL : F.mouth.hwR) / F.mouth.k;   // lamp1: c-front units"),
    ("    return 0.86 * this.lowerDrop() - (this.ment || 0);", "    return F.mouth.k * 0.86 * this.lowerDrop() - (this.ment || 0);   // lamp1: face px"),
    ("  return sstep(606, 660, y) * Math.exp(-(((x - 530) / 128) ** 2));", "  const J = F.mouth.jaw;\n  return sstep(J[0], J[1], y) * Math.exp(-(((x - F.mouth.cx) / J[2]) ** 2));"),
    ("    const dU = [0, 1.5, 3.2, 6, 9, 12, 15, 19, 24, 30, 37, 45, 55];   // r6: AA row 0.9 -> 1.5 px (a soft rim)\n    const dL = [0, 1.5, 3.2, 6, 10, 14, 18, 22, 27, 33, 40, 48, 57, 67, 78, 90];",
     "    const mk = F.mouth.k;   // lamp1: rows scale with the mouth (the AA rows stay 1.5 / 3.2 px)\n    const dU = [0, 1.5, 3.2, 6, 9, 12, 15, 19, 24, 30, 37, 45, 55].map((d, i) => (i < 3 ? d : d * mk));   // r6: AA row 0.9 -> 1.5 px (a soft rim)\n    const dL = [0, 1.5, 3.2, 6, 10, 14, 18, 22, 27, 33, 40, 48, 57, 67, 78, 90].map((d, i) => (i < 3 ? d : d * mk));"),
    ("    let dx = (a <= 1 ? s : Math.sign(s)) * S.wid + sol.shift;", "    const mk = F.mouth.k;\n    let dx = ((a <= 1 ? s : Math.sign(s)) * S.wid + sol.shift) * mk;"),
    ("    let dy = S.dy * Math.pow(am, 1.8);", "    let dy = S.dy * Math.pow(am, 1.8) * mk;"),
    ("    dy += flatE * 0.9 * (LC - lineY(x)) * (1 - sstep(1.05, 1.45, a));", "    dy += flatE * 0.9 * (LCf() - lineY(x)) * (1 - sstep(1.05, 1.45, a));"),
    ("    dy -= (sol.sideTilt || 0) * s * 3 * am;", "    dy -= (sol.sideTilt || 0) * s * 3 * am * mk;"),
    ("    if (tl !== 0) dx -= tl * (s * Math.sign(tl) > 0 ? 6 * Math.min(1, Math.abs(s)) : -2 * Math.min(1, Math.abs(s)));",
     "    if (tl !== 0) dx -= tl * (s * Math.sign(tl) > 0 ? 6 * Math.min(1, Math.abs(s)) : -2 * Math.min(1, Math.abs(s))) * mk;"),
    ("    const g = p.g * prof;", "    const g = p.g * prof * mk;   // lamp1: face px"),
    ("    else dy += g * (1 - p.up) - p.tuck * 6 * prof;", "    else dy += g * (1 - p.up) - p.tuck * 6 * prof * mk;"),
    ("      for (let q = 0; q < n; q++) {\n        const x = sh.rest[q * 2], y = sh.rest[q * 2 + 1], d = sh.d[q];",
     "      const mk = F.mouth.k;   // lamp1: the c-front-tuned falloffs read d in c-front units (dn)\n      for (let q = 0; q < n; q++) {\n        const x = sh.rest[q * 2], y = sh.rest[q * 2 + 1], d = sh.d[q], dn = d / mk;"),
    ("        const reach = sign < 0 ? 38 : 40;", "        const reach = (sign < 0 ? 38 : 40) * mk;"),
    ("        const g1 = Math.exp(-(((d - t - 4) / 5) ** 2));\n        K.BUL[q] = 2.2 * g1 * ins;", "        const g1 = Math.exp(-((((d - t) / mk - 4) / 5) ** 2));\n        K.BUL[q] = 2.2 * mk * g1 * ins;"),
    ("        K.CRW[q] = a > 0.9 && d < 20 ? sstep(0.9, 1.08, a) * (1 - sstep(8, 20, d)) : 0;", "        K.CRW[q] = a > 0.9 && dn < 20 ? sstep(0.9, 1.08, a) * (1 - sstep(8, 20, dn)) : 0;"),
    ("        K.LPR[q] = Math.exp(-((d / 2.2) ** 2)) * ins;", "        K.LPR[q] = Math.exp(-((dn / 2.2) ** 2)) * ins;"),
    ("        K.LTK[q] = sign > 0 ? Math.exp(-((d / 7) ** 2)) * ins : 0;", "        K.LTK[q] = sign > 0 ? Math.exp(-((dn / 7) ** 2)) * ins : 0;"),
    ("        K.ROLL[q] = d < t + 1 ? Math.exp(-((d / 3.2) ** 2)) * Math.min(1, ins * 3) : 0;", "        K.ROLL[q] = d < t + 1 ? Math.exp(-((dn / 3.2) ** 2)) * Math.min(1, ins * 3) : 0;"),
    ("        const sc = 1.04 + 0.0035 * d * (sign > 0 ? 1 : 0.6);\n        K.CRN[q] = Math.exp(-(((a - sc) / 0.045) ** 2)) * Math.exp(-((d / (sign > 0 ? 11 : 6)) ** 2));",
     "        const sc = 1.04 + 0.0035 * dn * (sign > 0 ? 1 : 0.6);\n        K.CRN[q] = Math.exp(-(((a - sc) / 0.045) ** 2)) * Math.exp(-((dn / (sign > 0 ? 11 : 6)) ** 2));"),
    ("          const sh2 = clamp01(gp / 3) * (sign > 0 ? 4.0 : 1.6) * (j === 2 ? 0.4 : 1);", "          const sh2 = clamp01(gp / 3) * (sign > 0 ? 4.0 : 1.6) * F.mouth.k * (j === 2 ? 0.4 : 1);"),
    ("      const ext = 2 + 9 * sol.p.tuck;", "      const ext = (2 + 9 * sol.p.tuck) * F.mouth.k;"),
], "lips.js")
assert "LINE_X0" not in lips and "MOUTH." not in lips
open(f"{OUT}/lips.js", "w").write(HDR + lips)

# ----------------------------------------------------------------------------------------------------------------- gl.js
gl = body("gl.js")
gl = rep(gl, [
    ("uniform vec2 uNose; // r6: turn side (+1 / -1), amount 0..1 (face layer only)",
     "uniform vec2 uNose; // r6: turn side (+1 / -1), amount 0..1 (face layer only)\nuniform vec4 uNoseG; // lamp1: nose centre x, far-plane y, near-plane y, scale (c-front 532, 528, 508, 1)\nuniform vec3 uShadeTint; // lamp1: the turn shadow's colour cast (0 = plain darkening, r8)"),
    ("  c.rgb *= 1.0 - uShade.w * s * s;\n  if (uNose.y > 0.0) {", "  c.rgb *= vec3(1.0) - uShade.w * s * s * (vec3(1.0) - uShadeTint);\n  if (uNose.y > 0.0) {"),
    ("    float far = exp(-pow((x - 532.0 - uNose.x * 15.0) / 7.0, 2.0) - pow((y - 528.0) / 17.0, 2.0));\n    float nr = exp(-pow((x - 532.0 + uNose.x * 9.0) / 5.5, 2.0) - pow((y - 508.0) / 22.0, 2.0));",
     "    float nk = uNoseG.w;\n    float far = exp(-pow((x - uNoseG.x - uNose.x * 15.0 * nk) / (7.0 * nk), 2.0) - pow((y - uNoseG.y) / (17.0 * nk), 2.0));\n    float nr = exp(-pow((x - uNoseG.x + uNose.x * 9.0 * nk) / (5.5 * nk), 2.0) - pow((y - uNoseG.z) / (22.0 * nk), 2.0));"),
    ("uniform sampler2D uTex; uniform vec4 uShade; uniform vec4 uRect; uniform float uEdgeAA;",
     "uniform sampler2D uTex; uniform vec4 uShade; uniform vec4 uRect; uniform float uEdgeAA; uniform vec3 uShadeTint;"),
    ("  c.rgb *= (1.0 - uShade.w * s * s) * vL;", "  c.rgb *= (vec3(1.0) - uShade.w * s * s * (vec3(1.0) - uShadeTint)) * vL;"),
    ("uniform float uExt;    // r6: how far the strip reaches below the lower inner edge (px)",
     "uniform float uExt;    // r6: how far the strip reaches below the lower inner edge (px)\nuniform float uMK;     // lamp1: mouth scale (the cavity's px constants were tuned on c-front's mouth)"),
    ("min(gap * uTongue.x * 0.9, 4.5 + 0.075 * gap)", "min(gap * uTongue.x * 0.9, 4.5 * uMK + 0.075 * gap)"),
    ("smoothstep(0.0, max(6.0, 0.42 * gap), dt)", "smoothstep(0.0, max(6.0 * uMK, 0.42 * gap), dt)"),
    ("    float soft = uTongue.y > 0.3 ? 1.0 : 3.0;", "    float soft = uTongue.y > 0.3 ? 1.0 : 3.0 * uMK;"),
    ("smoothstep(30.0, 70.0, gap)", "smoothstep(30.0 * uMK, 70.0 * uMK, gap)", 2),
    ("    this.cam = [0, 0, 1, 0];\n", "    this.cam = [0, 0, 1, 0];\n    this.face = { nose: [532, 528, 508, 1], mk: 1, tint: [0, 0, 0], tongue: [1, 1, 1], teeth: [1, 1, 1] };   // lamp1: set by the rig from geom.face\n"),
    ("    gl.uniform2fv(P.u.uNose, nose || [0, 0]);", "    gl.uniform2fv(P.u.uNose, nose || [0, 0]);\n    gl.uniform4fv(P.u.uNoseG, this.face.nose);\n    gl.uniform3fv(P.u.uShadeTint, this.face.tint);"),
    ("    gl.uniform1f(P.u.uEdgeAA, edgeAA);", "    gl.uniform1f(P.u.uEdgeAA, edgeAA);\n    gl.uniform3fv(P.u.uShadeTint, this.face.tint);"),
    ("    gl.uniform1f(P.u.uExt, ext);", "    gl.uniform1f(P.u.uExt, ext);\n    gl.uniform1f(P.u.uMK, this.face.mk);\n    gl.uniform3fv(P.u.uTongueMul, this.face.tongue);\n    gl.uniform3fv(P.u.uTeethMul, this.face.teeth);"),
    # lamp1: per-face tongue / teeth colour multipliers (c-front 1, 1, 1): the flat palette wants a muted rose-brown tongue
    # (c-front's saturated pink read cartoonish on it) and ivory teeth (blind C1: "a flat white block")
    ("uniform float uMK;     // lamp1: mouth scale (the cavity's px constants were tuned on c-front's mouth)",
     "uniform float uMK;     // lamp1: mouth scale (the cavity's px constants were tuned on c-front's mouth)\nuniform vec3 uTongueMul; uniform vec3 uTeethMul;   // lamp1: per-face interior colour"),
    ("    col = mix(col, t, cov);\n  }\n  // ---- lower teeth", "    col = mix(col, t * uTongueMul, cov);\n  }\n  // ---- lower teeth"),
    ("    col = mix(col, lt, cov);\n  }", "    col = mix(col, lt * uTeethMul, cov);\n  }"),
    ("    col = mix(col, ut, cov);\n  }", "    col = mix(col, ut * uTeethMul, cov);\n  }"),
], "gl.js")
open(f"{OUT}/gl.js", "w").write(HDR + gl)

open(f"{OUT}/life.js", "w").write(HDR.replace("every c-front pixel constant now reads F (face.js), whose defaults are those values (an r8 pack renders unchanged).", "this file is unchanged from r8.") + body("life.js"))

# ---------------------------------------------------------------------------------------------------------------- expr.js
# lamp1: a face may override a preset's keys (geom.face.presets[name], merged over every take; c-front has none). Asha's
# thinking keeps the eyes up-and-aside and the pursed mouth but holds the brows LEVEL (owner direction for her Stage B
# think frame): c-front's one-brow arch reads skeptical on the grown-up front
expr = body("expr.js")
expr = rep(expr, [
    ("export const EXPRESSIONS = {", 'import { F } from "./face.js";\nexport const EXPRESSIONS = {'),
    ("  pick(name, variant) {\n", "  pick(name, variant) {\n    const r = this.pick0(name, variant), O = F.presets && F.presets[name];\n    return O ? { P: { ...r.P, ...O, bs: { ...r.P.bs, ...(O.bs || {}) } }, i: r.i } : r;\n  }\n  pick0(name, variant) {\n"),
], "expr.js")
open(f"{OUT}/expr.js", "w").write(HDR.replace("every c-front pixel constant now reads F (face.js), whose defaults are those values (an r8 pack renders unchanged).", "every expression preset may be overridden per face (F.presets, none for c-front: an r8 pack renders unchanged).") + expr)
shutil.copy(f"{HERE}/runtime-src/face.js", f"{OUT}/face.js")
for f in ("rig.d.ts", "expr.d.ts"):
    shutil.copy(f"{SRC}/{f}", f"{OUT}/{f}")
print("lamp1 runtime written:", sorted(os.listdir(OUT)))
