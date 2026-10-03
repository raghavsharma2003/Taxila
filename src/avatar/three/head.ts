// The procedural tutor head (M0 asset path). Every vertex is generated here from a TutorLook, so the asset is ours,
// ships as code (no GLB, no third-party avatar, no licence to clear) and costs zero download beyond the JS.
//
// Why procedural for M0 (decision avatar-m0-procedural-head): the only licence-clean ready GLB (TalkingHead's
// CC0 mpfb.glb) is a realistic MakeHuman that AVATAR.md M0 itself bars from children, and the S2 characters come
// from the factory at M4. The rig therefore speaks the GLB contract: it is driven by ARKit-named weights
// (jawOpen, mouthSmileLeft, eyeBlinkLeft, browInnerUp, …), head [pitch, yaw, roll] and eye gaze, so swapping in a
// factory GLB later changes this file and nothing upstream.
//
// Style (S2-ish, AVATAR §5.2): real adult proportions, slightly large head, eyes × ~1.15 with painted iris and a
// catch-light, no pores or normal maps, Lambert shading, a solid hair shell, no cloth simulation, no glamour.
import {
  BufferAttribute, BufferGeometry, CapsuleGeometry, CircleGeometry, Color, CylinderGeometry, DoubleSide, Group, LatheGeometry,
  Mesh, MeshBasicMaterial, MeshLambertMaterial, Raycaster, SphereGeometry, SplineCurve, TorusGeometry, Vector2, Vector3, type Material,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { TutorLook } from "../../../shared/tutors.js";

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Paint a whole geometry one colour (vertex colours let several parts share one draw call). */
function paint(g: BufferGeometry, hex: string): BufferGeometry {
  const c = new Color(hex);
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new BufferAttribute(a, 3));
  return g;
}
function merged(parts: BufferGeometry[]): BufferGeometry {
  const ok = parts.map((g) => {
    for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color"].includes(k)) g.deleteAttribute(k);
    return g;
  });
  const m = mergeGeometries(ok, false);
  if (!m) throw new Error("mergeGeometries failed");
  return m;
}

/** The head shape: an ellipsoid with a tapered jaw, fuller cranium and a gently flattened face plane. */
function shapeHead(p: Vector3, male: boolean): void {
  let { x, y, z } = p;
  x *= 0.84;
  y *= 1.1;
  z *= 0.93;
  // jaw taper below the cheekbones; a little wider for the man
  const below = smooth(-0.2, -1.1, y);
  x *= 1 - (male ? 0.1 : 0.16) * below;
  // chin: slightly forward and rounded
  if (y < -0.6 && z > 0) z += 0.06 * smooth(-0.6, -1.0, y) * smooth(0.2, 0.8, z);
  // face plane
  if (z > 0.55) z = 0.55 + (z - 0.55) * 0.78;
  // cheek fullness
  const cheek = Math.exp(-(((Math.abs(x) - 0.42) / 0.2) ** 2) - ((y + 0.2) / 0.22) ** 2) * smooth(0.2, 0.6, z);
  z += 0.04 * cheek;
  x += Math.sign(x) * 0.02 * cheek;
  // cranium a touch fuller at the back-top
  if (z < 0 && y > 0) {
    const k = 1 + 0.05 * smooth(0, -0.8, z) * smooth(0, 0.6, y);
    x *= k;
    z *= k;
  }
  p.set(x, y, z);
}

export interface HeadRig {
  root: Group;
  /** Apply one composited frame. */
  apply(bs: Record<string, number>, head: [number, number, number], gaze: [number, number], lean: number, breath: number): void;
  dispose(): void;
  stats(): { triangles: number; meshes: number };
}

interface Surface {
  z(x: number, y: number): number;
}

/** Raycast the (unmorphed) head once to place features exactly on its surface. */
function surfaceOf(head: Mesh): Surface {
  head.updateMatrixWorld(true);
  const rc = new Raycaster();
  const cache = new Map<string, number>();
  return {
    z(x: number, y: number) {
      const key = `${x.toFixed(3)},${y.toFixed(3)}`;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      rc.set(new Vector3(x, y, 5), new Vector3(0, 0, -1));
      const z = rc.intersectObject(head, false)[0]?.point.z ?? 0.8;
      cache.set(key, z);
      return z;
    },
  };
}

/** Hair region on the unit sphere: front hairline high, sides to the ear tops, back to the nape. */
function hairY(dir: Vector3, style: TutorLook["hairStyle"]): number {
  const phi = Math.atan2(dir.x, dir.z); // 0 = front, ±π = back
  const a = Math.abs(phi);
  const part = style === "curls" ? 0 : 0.05 * Math.sin(phi * 2); // a soft side part
  // a side-swept fringe on her right (phi < 0) for the ponytail; a lower, sleeker hairline for the bun
  const fringe = style === "ponytail" ? -0.09 * Math.exp(-(((phi + 0.45) / 0.35) ** 2)) : 0;
  const sleek = style === "bun" ? -0.05 : 0;
  if (a < Math.PI / 2) return lerp(style === "curls" ? 0.5 : 0.42, style === "curls" ? 0.1 : -0.02, (a / (Math.PI / 2)) ** 1.3) + part + fringe + sleek;
  return lerp(style === "curls" ? 0.1 : -0.02, style === "ponytail" || style === "bun" ? -0.42 : -0.5, (a - Math.PI / 2) / (Math.PI / 2));
}

export function buildHead(look: TutorLook, restSmile = 0.25): HeadRig {
  const male = look.presentedGender === "M";
  const root = new Group();
  const headGroup = new Group();
  root.add(headGroup);
  const materials: Material[] = [];
  const geometries: BufferGeometry[] = [];
  const track = <T extends BufferGeometry>(g: T) => (geometries.push(g), g);
  const lambert = (o: ConstructorParameters<typeof MeshLambertMaterial>[0]) => {
    const m = new MeshLambertMaterial(o);
    materials.push(m);
    return m;
  };
  const basic = (o: ConstructorParameters<typeof MeshBasicMaterial>[0]) => {
    const m = new MeshBasicMaterial(o);
    materials.push(m);
    return m;
  };

  // ───────── head + ears + nose (one mesh, morph targets: jawOpen, cheekL, cheekR) ─────────
  const sphere = new SphereGeometry(1, 60, 44);
  const pos = sphere.attributes.position as BufferAttribute;
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    shapeHead(v, male);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  sphere.computeVertexNormals();
  const ears = [-1, 1].map((s) => {
    const e = new SphereGeometry(1, 16, 12);
    e.scale(0.07, 0.17, 0.12);
    e.translate(s * 0.83, -0.02, -0.06);
    return e;
  });
  const headGeo = track(merged([paint(sphere, look.skin), ...ears.map((e) => paint(e, look.skin))]));
  const headMat = lambert({ vertexColors: true });
  const headMesh = new Mesh(headGeo, headMat);
  headGroup.add(headMesh);
  const S = surfaceOf(headMesh);

  // nose: placed on the surface after the raycast (a separate small mesh in the face group below)
  const noseZ = S.z(0, -0.14);

  // Morph targets on the head: the chin drops and swings back with the jaw; cheeks rise with a smile.
  const base = headGeo.attributes.position as BufferAttribute;
  const jaw = new Float32Array(base.count * 3);
  const cheekL = new Float32Array(base.count * 3);
  const cheekR = new Float32Array(base.count * 3);
  const pivot = new Vector3(0, -0.12, -0.35);
  const ang = (17 * Math.PI) / 180;
  for (let i = 0; i < base.count; i++) {
    v.fromBufferAttribute(base, i);
    const w = smooth(-0.4, -0.66, v.y) * smooth(-0.55, 0.1, v.z) * (Math.abs(v.x) < 0.75 ? 1 : 0);
    if (w > 0) {
      const dy = v.y - pivot.y, dz = v.z - pivot.z;
      const ny = pivot.y + dy * Math.cos(ang) - dz * Math.sin(ang);
      const nz = pivot.z + dy * Math.sin(ang) + dz * Math.cos(ang);
      jaw.set([0, (ny - v.y) * w, (nz - v.z) * w], i * 3);
    }
    for (const [s, arr] of [[1, cheekL], [-1, cheekR]] as const) {
      const c = Math.exp(-(((v.x - s * 0.36) / 0.17) ** 2) - ((v.y + 0.3) / 0.15) ** 2) * smooth(0.3, 0.7, v.z);
      if (c > 0.01) arr.set([s * 0.012 * c, 0.035 * c, 0.02 * c], i * 3);
    }
  }
  headGeo.morphTargetsRelative = true; // the arrays are deltas (absolute mode would shrink the head as weights rise)
  headGeo.morphAttributes.position = [new BufferAttribute(jaw, 3), new BufferAttribute(cheekL, 3), new BufferAttribute(cheekR, 3)];
  headMesh.updateMorphTargets();
  const MORPH = { jaw: 0, cheekL: 1, cheekR: 2 };

  const face = new Group(); // features that ride on the head
  headGroup.add(face);
  const nose = track(new SphereGeometry(1, 20, 14));
  nose.scale(0.075, 0.085, 0.07);
  const noseMesh = new Mesh(nose, lambert({ color: new Color(look.skin).lerp(new Color(look.skinShade), 0.45) }));
  noseMesh.position.set(0, -0.16, noseZ - 0.025);
  face.add(noseMesh);
  const nostrilGeo = track(merged([-1, 1].map((s) => {
    const g = new SphereGeometry(1, 10, 8);
    g.scale(0.022, 0.014, 0.012);
    g.translate(s * 0.04, -0.215, noseZ + 0.02);
    return paint(g, "#5A3424");
  })));
  face.add(new Mesh(nostrilGeo, basic({ vertexColors: true, transparent: true, opacity: 0.55 })));

  // ───────── eyes ─────────
  const EYE_R = 0.148, EYE_X = 0.31, EYE_Y = 0.06;
  const eyes: { ball: Group; upper: Group; lower: Group; brow: Mesh; side: 1 | -1; browBase: Vector3 }[] = [];
  const catchParts: BufferGeometry[] = [];
  const browMat = lambert({ color: look.hair });
  for (const side of [1, -1] as const) {
    const sz = S.z(side * EYE_X, EYE_Y);
    const socket = new Group();
    socket.position.set(side * EYE_X, EYE_Y, sz - EYE_R * 0.62);
    face.add(socket);
    const ball = new Group();
    socket.add(ball);
    const sclera = new SphereGeometry(EYE_R, 28, 20);
    const iris = new CircleGeometry(EYE_R * 0.56, 28);
    iris.translate(0, 0, EYE_R * 0.985);
    const ring = new CircleGeometry(EYE_R * 0.58, 28);
    ring.translate(0, 0, EYE_R * 0.98);
    const pupil = new CircleGeometry(EYE_R * 0.26, 20);
    pupil.translate(0, 0, EYE_R * 0.99);
    const eyeGeo = track(merged([paint(sclera, "#F6F1E8"), paint(ring, "#1C130D"), paint(iris, look.iris), paint(pupil, "#0D0806")]));
    ball.add(new Mesh(eyeGeo, lambert({ vertexColors: true, emissive: new Color("#2A2622") })));
    // catch-light: lives in the socket (not the ball), so it stays put while the eye turns (§5.2 catch-light)
    const cl = new CircleGeometry(EYE_R * 0.11, 12);
    cl.translate(side * 0 + EYE_R * 0.22, EYE_R * 0.24, EYE_R * 1.02);
    cl.translate(socket.position.x, socket.position.y, socket.position.z);
    catchParts.push(paint(cl, "#FFFFFF"));
    // lids: skin shells that rotate about the eye's x axis; the upper carries the lash line
    const lidR = EYE_R * 1.06;
    const upperGeo = track(merged([
      paint(new SphereGeometry(lidR, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), look.skin),
      paint(new TorusGeometry(lidR, EYE_R * 0.085, 6, 28, Math.PI).rotateX(Math.PI / 2), "#1A120C"),
    ]));
    const upper = new Group();
    upper.add(new Mesh(upperGeo, lambert({ vertexColors: true, side: DoubleSide })));
    socket.add(upper);
    const lowerGeo = track(paint(new SphereGeometry(lidR * 0.995, 28, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), look.skin));
    const lower = new Group();
    lower.add(new Mesh(lowerGeo, lambert({ vertexColors: true, side: DoubleSide })));
    socket.add(lower);
    // brow: a soft capsule following the brow ridge
    const bz = S.z(side * 0.3, 0.33);
    const browGeo = track(new CapsuleGeometry(0.03, 0.2, 4, 10));
    browGeo.rotateZ(Math.PI / 2);
    const brow = new Mesh(browGeo, browMat);
    const browBase = new Vector3(side * 0.31, 0.33, bz + 0.005);
    brow.position.copy(browBase);
    brow.rotation.z = side * 0.06;
    brow.scale.set(1, male ? 1.1 : 0.8, 0.6);
    face.add(brow);
    eyes.push({ ball, upper, lower, brow, side, browBase });
  }
  face.add(new Mesh(track(merged(catchParts)), basic({ vertexColors: true })));

  // ───────── glasses ─────────
  if (look.glasses !== "none") {
    const parts: BufferGeometry[] = [];
    const gz = S.z(EYE_X, EYE_Y) + 0.07;
    for (const s of [1, -1]) {
      const rim = look.glasses === "round" ? new TorusGeometry(0.17, 0.014, 8, 36) : new TorusGeometry(0.17, 0.014, 4, 4);
      if (look.glasses === "rect") rim.rotateZ(Math.PI / 4).scale(1.15, 0.8, 1);
      rim.translate(s * EYE_X, EYE_Y, gz);
      parts.push(rim);
      const temple = new CylinderGeometry(0.012, 0.012, 0.75, 6);
      temple.rotateX(Math.PI / 2);
      temple.translate(s * 0.62, EYE_Y + 0.04, gz - 0.4);
      parts.push(temple);
    }
    const bridge = new CylinderGeometry(0.012, 0.012, 0.13, 6);
    bridge.rotateZ(Math.PI / 2);
    bridge.translate(0, EYE_Y + 0.05, gz + 0.01);
    parts.push(bridge);
    face.add(new Mesh(track(merged(parts.map((p) => paint(p, "#2A2420")))), lambert({ vertexColors: true })));
  }

  // ───────── mouth: one dynamic mesh (interior, teeth, tongue, lips), positions rebuilt per frame ─────────
  const MOUTH_Y = -0.43;
  const K = 24; // contour points
  const TEETH = 11;
  const TONGUE = 10;
  // layout: [center, inner K] [teeth top TEETH, teeth bottom TEETH] [tongue center, TONGUE] [lip outer K]
  const nV = 1 + K + TEETH * 2 + 1 + TONGUE + K;
  const mPos = new Float32Array(nV * 3);
  const mCol = new Float32Array(nV * 3);
  const idx: number[] = [];
  const C = 0, IN = 1, TT = IN + K, TB = TT + TEETH, TC = TB + TEETH, TG = TC + 1, OUT = TG + TONGUE;
  const setCol = (i: number, hex: string) => {
    const c = new Color(hex);
    mCol.set([c.r, c.g, c.b], i * 3);
  };
  setCol(C, "#2E0F0C");
  for (let k = 0; k < K; k++) {
    setCol(IN + k, k <= K / 2 ? "#3A1410" : "#3A1410");
    idx.push(C, IN + k, IN + ((k + 1) % K));
  }
  for (let k = 0; k < TEETH; k++) {
    setCol(TT + k, "#FBF7EE");
    setCol(TB + k, "#E9E2D4");
    if (k < TEETH - 1) idx.push(TT + k, TB + k, TT + k + 1, TT + k + 1, TB + k, TB + k + 1);
  }
  setCol(TC, "#B5545A");
  for (let k = 0; k < TONGUE; k++) {
    setCol(TG + k, "#A84A50");
    idx.push(TC, TG + k, TG + ((k + 1) % TONGUE));
  }
  const lipUp = new Color(look.lip).multiplyScalar(0.92).getStyle();
  for (let k = 0; k < K; k++) {
    setCol(OUT + k, k <= K / 2 ? lipUp : look.lip);
    const a = IN + k, b = IN + ((k + 1) % K), c = OUT + k, d = OUT + ((k + 1) % K);
    idx.push(a, c, b, b, c, d);
  }
  const mouthGeo = track(new BufferGeometry());
  mouthGeo.setAttribute("position", new BufferAttribute(mPos, 3));
  mouthGeo.setAttribute("color", new BufferAttribute(mCol, 3));
  mouthGeo.setIndex(idx);
  const mouthMesh = new Mesh(mouthGeo, basic({ vertexColors: true, side: DoubleSide }));
  mouthMesh.frustumCulled = false;
  face.add(mouthMesh);
  // surface height around the mouth, sampled once
  const zAt = (x: number, y: number) => S.z(Math.max(-0.35, Math.min(0.35, x)), Math.max(-0.7, Math.min(-0.25, y)));
  const zGrid: number[][] = [];
  const GX = [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3], GY = [-0.3, -0.38, -0.46, -0.54, -0.62];
  for (const y of GY) zGrid.push(GX.map((x) => zAt(x, y)));
  const surfZ = (x: number, y: number) => {
    const fx = Math.max(0, Math.min(GX.length - 1.001, (x - GX[0]) / 0.1));
    const fy = Math.max(0, Math.min(GY.length - 1.001, (GY[0] - y) / 0.08));
    const ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const a = lerp(zGrid[iy][ix], zGrid[iy][ix + 1], tx), b = lerp(zGrid[iy + 1][ix], zGrid[iy + 1][ix + 1], tx);
    return lerp(a, b, ty);
  };

  function buildMouth(m: { open: number; smile: number; wide: number; round: number; press: number }): void {
    const w = 0.185 * (1 + 0.2 * m.smile + 0.3 * m.wide - 0.38 * m.round);
    const upH = 0.012 + 0.07 * m.open * (1 - 0.3 * m.press);
    const loH = 0.012 + 0.2 * m.open * (1 - 0.3 * m.press) + 0.02 * m.round;
    const lift = 0.035 * m.smile - 0.008 * m.press;
    const upLip = 0.032 * (1 - 0.5 * m.press) + 0.01 * m.round;
    const loLip = 0.045 * (1 - 0.5 * m.press) + 0.012 * m.round;
    const closed = m.open < 0.02;
    const inner = (k: number): Vector2 => {
      const th = (k / K) * Math.PI * 2; // 0 = right corner, π/2 = top, π = left corner
      const cx = Math.cos(th), sy = Math.sin(th);
      const cornerLift = lift * Math.pow(Math.abs(cx), 3);
      const roundness = m.round * 0.4;
      const x = w * Math.sign(cx) * Math.pow(Math.abs(cx), 1 - roundness * 0.5);
      const y = sy >= 0 ? (closed ? 0 : upH) * Math.pow(sy, 0.8 + roundness) : -(closed ? 0 : loH) * Math.pow(-sy, 0.8 + roundness);
      // a closed mouth still carries the smile curve
      const smileCurve = -0.02 * m.smile * (1 - cx * cx);
      return new Vector2(x, y + cornerLift + smileCurve);
    };
    const put = (i: number, x: number, y: number, dz: number) => {
      const yy = MOUTH_Y + y;
      mPos.set([x, yy, surfZ(x, yy) + dz], i * 3);
    };
    let cy = 0;
    const pts: Vector2[] = [];
    for (let k = 0; k < K; k++) {
      const p = inner(k);
      pts.push(p);
      cy += p.y / K;
      put(IN + k, p.x, p.y, 0.006);
    }
    put(C, 0, cy, -0.01);
    // upper teeth: a strip under the upper contour, visible only when open
    const th = Math.min(0.045, 0.6 * upH + 0.25 * loH) * (m.open > 0.06 ? 1 : 0);
    for (let k = 0; k < TEETH; k++) {
      const u = k / (TEETH - 1);
      const x = lerp(-w * 0.72, w * 0.72, u);
      const top = upH * Math.pow(Math.max(0, 1 - (x / w) ** 2), 0.5) * 0.92 + lift * 0.2;
      put(TT + k, x, top, 0.003);
      put(TB + k, x, top - th, 0.003);
    }
    // tongue: a soft ellipse low in the opening
    const tr = Math.min(0.06, loH * 0.45) * (m.open > 0.12 ? 1 : 0);
    put(TC, 0, -loH * 0.62, 0.002);
    for (let k = 0; k < TONGUE; k++) {
      const a = (k / TONGUE) * Math.PI * 2;
      put(TG + k, Math.cos(a) * w * 0.5 * (tr > 0 ? 1 : 0), -loH * 0.62 + Math.sin(a) * tr * 0.6, 0.002);
    }
    // lips: the inner contour pushed outward
    for (let k = 0; k < K; k++) {
      const p = pts[k];
      const th2 = (k / K) * Math.PI * 2, sy = Math.sin(th2), cx = Math.cos(th2);
      const thick = (sy >= 0 ? upLip : loLip) * (0.25 + 0.75 * Math.pow(Math.abs(sy), 0.6));
      const out = 1 + 0.08 * Math.abs(cx);
      put(OUT + k, p.x * out + Math.sign(cx) * 0.012 * Math.abs(cx), p.y + Math.sign(sy || -1) * thick, 0.008);
    }
    (mouthGeo.attributes.position as BufferAttribute).needsUpdate = true;
  }
  buildMouth({ open: 0, smile: 0.2, wide: 0, round: 0, press: 0 });

  // ───────── hair ─────────
  const hairParts: BufferGeometry[] = [];
  const shell = new SphereGeometry(1, 44, 30);
  const hp = shell.attributes.position as BufferAttribute;
  for (let i = 0; i < hp.count; i++) {
    v.fromBufferAttribute(hp, i);
    const dir = v.clone().normalize();
    const hy = hairY(dir, look.hairStyle);
    const inHair = smooth(hy - 0.05, hy + 0.05, dir.y);
    shapeHead(v, male);
    const lift = (look.hairStyle === "curls" ? 0.09 : 0.055) + 0.04 * smooth(0.3, 1, dir.y);
    v.multiplyScalar(lerp(0.9, 1 + lift, inHair));
    hp.setXYZ(i, v.x, v.y, v.z);
  }
  shell.computeVertexNormals();
  hairParts.push(shell);
  const hairRng = (() => {
    let a = 7;
    return () => ((a = (a * 16807) % 2147483647) / 2147483647);
  })();
  if (look.hairStyle === "curls") {
    for (let n = 0; n < 70; n++) {
      const yaw = (hairRng() - 0.5) * Math.PI * 1.6, el = 0.25 + hairRng() * 1.2;
      const dir = new Vector3(Math.sin(yaw) * Math.cos(el), Math.sin(el), Math.cos(yaw) * Math.cos(el)).normalize();
      if (dir.y < hairY(dir, "curls") + 0.04) continue;
      const p = dir.clone();
      shapeHead(p, male);
      p.multiplyScalar(1.07);
      const c = new SphereGeometry(0.1 + hairRng() * 0.06, 7, 5);
      c.translate(p.x, p.y, p.z);
      hairParts.push(c);
    }
  } else if (look.hairStyle === "ponytail") {
    const tie = new SphereGeometry(0.2, 14, 10);
    tie.translate(0, 0.62, -0.92);
    const tail = new CapsuleGeometry(0.16, 0.95, 6, 12);
    tail.rotateX(0.35);
    tail.translate(0, 0.02, -1.18);
    hairParts.push(tie, tail);
  } else if (look.hairStyle === "bun") {
    const bun = new SphereGeometry(0.3, 18, 14);
    bun.scale(1.1, 0.85, 0.9);
    bun.translate(0.5, -0.4, -0.72); // a low side bun: visible past her left ear (the silhouette hook)
    hairParts.push(bun);
  }
  const hairGeo = track(merged(hairParts.map((p) => paint(p, look.hair))));
  const hairMesh = new Mesh(hairGeo, lambert({ vertexColors: true }));
  headGroup.add(hairMesh);

  // earrings (small studs) for the women: modest, no religious marker
  if (!male) {
    const studs = track(merged([-1, 1].map((s) => {
      const g = new SphereGeometry(0.028, 10, 8);
      g.translate(s * 0.84, -0.18, -0.02);
      return paint(g, "#D9B45A");
    })));
    headGroup.add(new Mesh(studs, lambert({ vertexColors: true })));
  }

  // ───────── neck + bust (static, one mesh, vertex colours) ─────────
  const body = new Group();
  root.add(body);
  const neck = new CylinderGeometry(male ? 0.42 : 0.37, male ? 0.48 : 0.42, 0.9, 24);
  neck.translate(0, -1.15, -0.12);
  // bottom → top, so the lathe faces point outward
  const profile = (r0: number, r1: number) => [
    new Vector2(r1 * 1.0, -3.6), new Vector2(r1 * 1.02, -2.7), new Vector2(r1, -2.05), new Vector2(r1 * 0.8, -1.78),
    new Vector2(r0 + 0.3, -1.6), new Vector2(r0, -1.5),
  ];
  const shoulder = male ? 2.0 : 1.8;
  const bust = (r0: number, r1: number, phiStart = 0, phiLength = Math.PI * 2) => {
    const g = new LatheGeometry(new SplineCurve(profile(r0, r1)).getPoints(18), 40, phiStart, phiLength);
    g.scale(1, 1, 0.52);
    g.translate(0, 0, -0.12);
    return g;
  };
  const bodyParts: BufferGeometry[] = [paint(neck, look.skin)];
  if (look.attire === "kurti-jacket") {
    bodyParts.push(paint(bust(0.38, shoulder), look.top));
    // open denim jacket over the kurti: a slightly larger shell with a front gap (lathe phi 0 = +z)
    bodyParts.push(paint(bust(0.44, shoulder * 1.035, 0.42, Math.PI * 2 - 0.84), "#4C6A8C"));
    const neckline = new TorusGeometry(0.4, 0.035, 6, 24, Math.PI);
    neckline.rotateX(Math.PI / 2 + 0.25).rotateY(Math.PI);
    neckline.translate(0, -1.62, 0.02);
    bodyParts.push(paint(neckline, look.accentBorder));
  } else if (look.attire === "shirt-tee") {
    bodyParts.push(paint(bust(0.38, shoulder), look.accent));
    bodyParts.push(paint(bust(0.43, shoulder * 1.03, 0.36, Math.PI * 2 - 0.72), look.top));
  } else {
    // saree: the pallu is PAINTED onto the bust (a diagonal band from her left shoulder, with a thin contrasting
    // border), so it follows the body instead of standing off it; no cloth simulation (§5.2).
    const b = bust(0.38, shoulder);
    paint(b, look.accent);
    const P = b.attributes.position as BufferAttribute, Ccol = b.attributes.color as BufferAttribute;
    const top = new Color(look.top), border = new Color(look.accentBorder);
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), y = P.getY(i);
      // signed distance from the line through (0.75, -1.75) and (-0.9, -3.6)
      const dx = -1.65, dy = -1.85, len = Math.hypot(dx, dy);
      const d = ((x - 0.75) * dy - (y + 1.75) * dx) / len;
      const onShoulder = x > 0.55 && y > -2.3;
      // soft edges: vertex colours interpolate, so blend instead of thresholding (no staircase)
      const inBand = onShoulder ? 1 : smooth(0.5, 0.36, Math.abs(d));
      const edge = onShoulder ? 0 : Math.exp(-(((Math.abs(d) - 0.4) / 0.05) ** 2));
      const c = new Color(Ccol.getX(i), Ccol.getY(i), Ccol.getZ(i)).lerp(top, inBand).lerp(border, edge * 0.85);
      Ccol.setXYZ(i, c.r, c.g, c.b);
    }
    bodyParts.push(b);
  }
  const bodyGeo = track(merged(bodyParts));
  const bodyMesh = new Mesh(bodyGeo, lambert({ vertexColors: true }));
  body.add(bodyMesh);

  // ───────── drive ─────────
  const DEG = Math.PI / 180;
  const LID_OPEN = -50 * DEG, LID_CLOSED = 92 * DEG, LOW_OPEN = 40 * DEG, LOW_SQUINT = 16 * DEG;
  function apply(bs: Record<string, number>, head: [number, number, number], gaze: [number, number], lean: number, breath: number): void {
    const g = (k: string) => bs[k] ?? 0;
    headGroup.rotation.set(head[0] * DEG, head[1] * DEG, -head[2] * DEG, "YXZ");
    headGroup.position.set(0, -0.015 * lean, 0.12 * lean);
    body.scale.set(1, 1 + 0.006 * breath, 1);
    body.rotation.y = head[1] * DEG * 0.15;
    const infl = headMesh.morphTargetInfluences!;
    infl[MORPH.jaw] = g("jawOpen");
    const smileL = g("mouthSmileLeft"), smileR = g("mouthSmileRight");
    infl[MORPH.cheekL] = Math.min(1, smileL * 0.8 + g("cheekSquintLeft"));
    infl[MORPH.cheekR] = Math.min(1, smileR * 0.8 + g("cheekSquintRight"));
    buildMouth({
      open: g("jawOpen") - g("mouthClose"),
      smile: Math.min(1, restSmile + (smileL + smileR) / 2),
      wide: (g("mouthStretchLeft") + g("mouthStretchRight")) / 2,
      round: Math.max(g("mouthFunnel"), g("mouthPucker")),
      press: g("mouthPress") + g("mouthPressLeft") + g("mouthPressRight"),
    });
    for (const e of eyes) {
      const L = e.side === 1 ? "Left" : "Right";
      e.ball.rotation.set(-gaze[1] * DEG, gaze[0] * DEG, 0, "YXZ");
      const blink = g(`eyeBlink${L}`), wide = g(`eyeWide${L}`), squint = g(`eyeSquint${L}`);
      const follow = -gaze[1] * DEG * 0.4; // lid-follow: the upper lid tracks vertical gaze
      e.upper.rotation.x = lerp(LID_OPEN - wide * 10 * DEG + follow, LID_CLOSED, blink);
      e.lower.rotation.x = lerp(LOW_OPEN, LOW_SQUINT, Math.min(1, squint + 0.35 * g(`cheekSquint${L}`))) - blink * 6 * DEG;
      const inner = g("browInnerUp"), outer = g(`browOuterUp${L}`), down = g(`browDown${L}`);
      e.brow.position.set(e.browBase.x, e.browBase.y + 0.07 * (inner * 0.5 + outer * 0.6) - 0.05 * down, e.browBase.z);
      e.brow.rotation.z = e.side * (0.06 - 0.3 * inner + 0.22 * outer + 0.2 * down);
    }
  }

  return {
    root,
    apply,
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
    stats() {
      let triangles = 0, meshes = 0;
      root.traverse((o) => {
        const m = o as Mesh;
        if (!m.isMesh) return;
        meshes++;
        const geo = m.geometry;
        triangles += (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
      });
      return { triangles: Math.round(triangles), meshes };
    },
  };
}
