// Antariksh · the world (no law here): sky, planet, stars, warp streaks, an asteroid field kept out of the line corridor,
// the ship, the number line (bar, glow, instanced ticks, end pylons, the cloak curtain), the reticle, the bolt, impact
// rings, the gap bar, the targets (mine / beacon / comet: never alive, O-G4), the warp gates and one pooled particle
// system. Draw budget ≈ 25-30 calls, a few thousand triangles (FEASIBILITY §5.2). Learning objects draw over scenery
// (depthTest false, high renderOrder) in the theme's reserved hues (O-G1). Every random number here is cosmetic and comes
// from core.cosmeticRandom (the economy lint forbids Math.random in engines).
import * as THREE from "three";

export const VOLT = 0xcbff4d;   // the one "your move" hue: the reticle and the probe marks only
export interface Theme { bg: number; fog: number; line: number; glow: number; target: number; rock: number; planet: number; ring: number; neb: [number, number, number]; garam: number; teekha: number;
  /** the label palette over this world (pills and roles): art-pack colours, applied through core.labelColors */
  labels: { ink: number; you: number; good: number; look: number; q1: number; q2: number; pill: number; pillAlpha: number } }
export const THEMES: Record<string, Theme> = {
  "neela-nebula": { bg: 0x070a1c, fog: 0x0b1030, line: 0x7fe3ff, glow: 0x2a9dff, target: 0xff5a7a, rock: 0x5b5f86, planet: 0x6a4bd8, ring: 0xb9a6ff, neb: [0x1b2a8a, 0x6b2bd0, 0x0e7bb8], garam: 0x7fe3ff, teekha: 0xff8a3d, labels: { ink: 0xeef1ff, you: 0xcbff4d, good: 0x7ff0b8, look: 0xffd27a, q1: 0x7fe3ff, q2: 0xffad7a, pill: 0x05060d, pillAlpha: 0.66 } },
  "laal-grah": { bg: 0x140707, fog: 0x2a0d0a, line: 0xffd27a, glow: 0xff7a2a, target: 0x7affd9, rock: 0x7a4b3a, planet: 0xd8572b, ring: 0xffb07a, neb: [0x7a1d10, 0xc2410c, 0x4a1340], garam: 0xffd27a, teekha: 0x7affd9, labels: { ink: 0xfff3ea, you: 0xcbff4d, good: 0x9dffd0, look: 0xffd27a, q1: 0xffd27a, q2: 0x7affd9, pill: 0x140707, pillAlpha: 0.7 } },
  "hara-toofan": { bg: 0x04110d, fog: 0x072019, line: 0x9dffd0, glow: 0x19c28a, target: 0xffc04d, rock: 0x3d6656, planet: 0x1f9d6b, ring: 0xa6ffd8, neb: [0x0d5c45, 0x136b8a, 0x1f3d14], garam: 0x9dffd0, teekha: 0xffc04d, labels: { ink: 0xeefff7, you: 0xcbff4d, good: 0x9dffd0, look: 0xffd27a, q1: 0x9dffd0, q2: 0xffc04d, pill: 0x04110d, pillAlpha: 0.7 } },
};
export const CAM = new THREE.Vector3(0, 3.0, 7.5), LOOK = new THREE.Vector3(0, 0.4, -12);
export const LINE_Y = 0.7, LINE_Z = -6, SHIP_Z = 1.6, SHIP_Y = 0.55;
export const MAXTICK = 64, NSTAR = 1200, NROCK = 48, NP = 640;

export type Wrapper = "mine-sweep" | "beacon-rescue" | "comet-catch";
export interface TargetObj { g: THREE.Group; mats: THREE.Material[]; spin: THREE.Object3D[] }

export function buildWorld(scene: THREE.Scene, rnd: () => number) {
  const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x302040, 2.0); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-4, 6, 5); scene.add(sun);

  const skyCanvas = document.createElement("canvas"); skyCanvas.width = 512; skyCanvas.height = 256;
  const skyTex = new THREE.CanvasTexture(skyCanvas); skyTex.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 12), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
  scene.add(sky);
  function paintSky(T: Theme, seed: number): void {
    const g = skyCanvas.getContext("2d"); if (!g) return;
    g.globalCompositeOperation = "source-over"; g.globalAlpha = 1;
    g.fillStyle = `rgb(${(T.bg >> 16) & 255}, ${(T.bg >> 8) & 255}, ${T.bg & 255})`; g.fillRect(0, 0, 512, 256);
    let s = (seed * 9301 + 49297) % 233280; const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    g.globalCompositeOperation = "lighter";
    const rgba = (n: number, a: number) => `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
    for (let i = 0; i < 22; i++) { const x = r() * 512, y = 60 + r() * 140, rad = 30 + r() * 110, c = T.neb[i % 3];
      const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, rgba(c, 0.4)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
    g.globalCompositeOperation = "source-over"; g.fillStyle = "rgb(255, 255, 255)";
    for (let i = 0; i < 260; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillRect(r() * 512, r() * 256, 1, 1); }
    g.globalAlpha = 1; skyTex.needsUpdate = true;
  }

  const planet = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16), new THREE.MeshLambertMaterial({ color: 0x6a4bd8, fog: false }));
  planet.position.set(-34, 14, -150); scene.add(planet);
  const ring = new THREE.Mesh(new THREE.RingGeometry(21, 30, 48), new THREE.MeshBasicMaterial({ color: 0xb9a6ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35, fog: false }));
  ring.rotation.set(1.2, 0.3, 0); planet.add(ring);

  const dotCanvas = document.createElement("canvas"); dotCanvas.width = dotCanvas.height = 32;
  { const g = dotCanvas.getContext("2d"); if (g) { const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "rgba(255, 255, 255, 1)"); gr.addColorStop(0.35, "rgba(255, 255, 255, 0.8)"); gr.addColorStop(1, "rgba(255, 255, 255, 0)"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); } }
  const dotTex = new THREE.CanvasTexture(dotCanvas);

  const starPos = new Float32Array(NSTAR * 3), streakPos = new Float32Array(NSTAR * 6);
  for (let i = 0; i < NSTAR; i++) { starPos[i * 3] = (rnd() - 0.5) * 120; starPos[i * 3 + 1] = (rnd() - 0.5) * 80; starPos[i * 3 + 2] = -200 + rnd() * 210; }
  const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3).setUsage(THREE.DynamicDrawUsage));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, map: dotTex, size: 0.45, sizeAttenuation: true, transparent: true, opacity: 0.95, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(stars);
  const streakGeo = new THREE.BufferGeometry(); streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPos, 3).setUsage(THREE.DynamicDrawUsage));
  const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  streaks.visible = false; scene.add(streaks);

  const rockMat = new THREE.MeshLambertMaterial({ color: 0x5b5f86, emissive: 0x141830, flatShading: true });
  const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), rockMat, NROCK); rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(rocks);
  const rockS: { x: number; y: number; z: number; s: number; rx: number; ry: number; vr: number }[] = [];
  function placeRock(r: (typeof rockS)[number], far: boolean): void {
    const side = rnd(); let x: number, y: number;
    if (side < 0.4) { x = (rnd() < 0.5 ? -1 : 1) * (7 + rnd() * 16); y = -6 + rnd() * 16; }
    else if (side < 0.75) { x = (rnd() - 0.5) * 30; y = 5.5 + rnd() * 9; }
    else { x = (rnd() - 0.5) * 30; y = -9 + rnd() * 4.5; }
    Object.assign(r, { x, y, z: far ? -180 - rnd() * 40 : -180 + rnd() * 190, s: 0.4 + rnd() * 1.6, rx: rnd() * 6, ry: rnd() * 6, vr: (rnd() - 0.5) * 1.4 });
  }
  for (let i = 0; i < NROCK; i++) { const r = { x: 0, y: 0, z: 0, s: 1, rx: 0, ry: 0, vr: 0 }; placeRock(r, false); rockS.push(r); }

  // the ship: schematic, no face (G12)
  const ship = new THREE.Group(); scene.add(ship);
  const hullMat = new THREE.MeshLambertMaterial({ color: 0xdfe4f2, flatShading: true });
  const accentMat = new THREE.MeshLambertMaterial({ color: 0x4453c9, emissive: 0x10163a, flatShading: true });
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.5, 6), hullMat); hull.rotation.x = -Math.PI / 2; hull.position.z = -0.1; ship.add(hull);
  const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.35, -0.95, 0, 0.45, 0.95, 0, 0.45, 0, 0.04, -0.35, 0.95, 0.04, 0.45, -0.95, 0.04, 0.45], 3)); wingGeo.computeVertexNormals();
  ship.add(new THREE.Mesh(wingGeo, new THREE.MeshLambertMaterial({ color: 0x4453c9, emissive: 0x10163a, side: THREE.DoubleSide })));
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.34), accentMat); fin.position.set(0, 0.15, 0.36); ship.add(fin);
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), new THREE.MeshBasicMaterial({ color: 0x9fe6ff })); canopy.scale.set(0.8, 0.6, 1.6); canopy.position.set(0, 0.09, -0.15); ship.add(canopy);
  const tips = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.05, 0.08), new THREE.MeshBasicMaterial({ color: 0xff9a5a })); tips.position.set(0, 0.02, 0.42); ship.add(tips);
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.65, 10), new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
  flame.rotation.x = Math.PI / 2; flame.position.set(0, 0, 0.95); ship.add(flame);
  ship.scale.setScalar(0.62); ship.position.set(0, SHIP_Y, SHIP_Z);

  // the number line (learning object: over everything)
  const lineGroup = new THREE.Group(); lineGroup.position.set(0, LINE_Y, LINE_Z); scene.add(lineGroup);
  const barMat = new THREE.MeshBasicMaterial({ color: 0x7fe3ff, depthTest: false });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), barMat); bar.renderOrder = 4; lineGroup.add(bar);
  const softTex = (stops: [number, string][]) => { const c = document.createElement("canvas"); c.width = 4; c.height = 64; const g = c.getContext("2d"); if (g) { const gr = g.createLinearGradient(0, 0, 0, 64); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, 4, 64); } return new THREE.CanvasTexture(c); };
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.9), new THREE.MeshBasicMaterial({ map: softTex([[0, "rgba(0, 0, 0, 0)"], [0.5, "rgba(255, 255, 255, 1)"], [1, "rgba(0, 0, 0, 0)"]]), color: 0x2a9dff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  glow.renderOrder = 3; lineGroup.add(glow);
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 1, 0.045), barMat, MAXTICK); ticks.renderOrder = 4; lineGroup.add(ticks);
  const pylonGeo = new THREE.ConeGeometry(0.12, 0.45, 8), pylonL = new THREE.Mesh(pylonGeo, barMat), pylonR = new THREE.Mesh(pylonGeo, barMat);
  pylonL.renderOrder = pylonR.renderOrder = 4; pylonL.rotation.z = pylonR.rotation.z = Math.PI; lineGroup.add(pylonL, pylonR);
  const half = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.9), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.9, depthTest: false })); half.renderOrder = 4; half.position.y = 0.25; half.visible = false; lineGroup.add(half);
  // the cloak curtain: interference over the WHOLE line, so nothing on screen leaks where a target sits (shortcut-free)
  const curtainCanvas = document.createElement("canvas"); curtainCanvas.width = 256; curtainCanvas.height = 32;
  { const g = curtainCanvas.getContext("2d"); if (g) for (let x = 0; x < 256; x++) { const a = 0.25 + 0.75 * Math.abs(Math.sin(x * 0.21) * Math.sin(x * 0.047)); g.fillStyle = `rgba(255,255,255,${(a * 0.5).toFixed(3)})`; g.fillRect(x, 0, 1, 32); } }
  const curtainTex = new THREE.CanvasTexture(curtainCanvas); curtainTex.wrapS = THREE.RepeatWrapping; curtainTex.repeat.set(3, 1);
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.25), new THREE.MeshBasicMaterial({ map: curtainTex, color: 0x7fe3ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
  curtain.position.y = 0.72; curtain.renderOrder = 3; lineGroup.add(curtain);

  const reticle = new THREE.Group(); reticle.renderOrder = 10; lineGroup.add(reticle);
  const retMat = new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, depthTest: false });
  const retRing = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.235, 28), retMat); retRing.renderOrder = 10; reticle.add(retRing);
  const retStem = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.5), new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0.45, depthTest: false })); retStem.position.y = 0.55; retStem.renderOrder = 10; reticle.add(retStem);

  const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6), new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, blending: THREE.AdditiveBlending, depthTest: false })); bolt.visible = false; bolt.renderOrder = 9; scene.add(bolt);
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(shock);
  // the child's marks on the line (probe pylons, volt): one per value
  const markGeo = new THREE.ConeGeometry(0.09, 0.32, 6);
  const marks = [0, 1].map(() => { const m = new THREE.Mesh(markGeo, new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, depthTest: false })); m.rotation.z = Math.PI; m.position.y = 0.28; m.renderOrder = 8; m.visible = false; lineGroup.add(m); return m; });
  const gapBars = [0, 1].map(() => { const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.07), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, depthTest: false })); b.renderOrder = 7; lineGroup.add(b); return b; });

  function makeTarget(wrapper: Wrapper): TargetObj {
    const g = new THREE.Group(), mats: THREE.Material[] = [], spin: THREE.Object3D[] = [];
    const lam = new THREE.MeshLambertMaterial({ color: 0xff5a7a, emissive: 0xff5a7a, emissiveIntensity: 0.6, flatShading: true, depthTest: false }); mats.push(lam);
    const wire = new THREE.MeshBasicMaterial({ color: 0xff5a7a, wireframe: true, transparent: true, opacity: 0.6, depthTest: false }); mats.push(wire);
    const white = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthTest: false });
    if (wrapper === "beacon-rescue") {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.26, 0), lam); core.scale.y = 1.5;
      const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.02, 6, 28), white), r2 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 6, 28), wire);
      r2.rotation.x = Math.PI / 2; g.add(core, r1, r2); spin.push(core, r1, r2);
    } else if (wrapper === "comet-catch") {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), lam);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.9, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, side: THREE.DoubleSide }));
      tail.rotation.z = -Math.PI / 2.4; tail.position.set(0.42, 0.22, 0); g.add(core, tail); spin.push(core);
    } else {
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.27, 0), lam), spikes = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), wire);
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.025, 6, 28), white); g.add(core, spikes, r); spin.push(core, spikes, r);
    }
    g.traverse((o) => { o.renderOrder = 6; });
    g.visible = false; g.position.y = 0.7; lineGroup.add(g);
    return { g, mats, spin };
  }

  // warp gates: up to three (doors · compare order · rounding landmarks)
  const gates = [0, 1, 2].map(() => {
    const g = new THREE.Group();
    const torMat = new THREE.MeshBasicMaterial({ color: 0x7fe3ff, depthTest: false });
    const tor = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 40), torMat);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.58, 32), new THREE.MeshBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false }));
    tor.renderOrder = disc.renderOrder = 5; g.add(tor, disc); g.visible = false; g.position.set(0, 1.25, 0); lineGroup.add(g);
    return { g, tor, disc };
  });

  // particles: one pooled Points system (1 draw)
  const pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pVel = new Float32Array(NP * 3), pLife = new Float32Array(NP), pBase = new Float32Array(NP * 3);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
  const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.26, map: dotTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: true }));
  parts.frustumCulled = false; parts.renderOrder = 9; scene.add(parts);
  let pNext = 0;
  const tmpC = new THREE.Color();
  function burst(p: THREE.Vector3, n: number, color: number, speed: number, life: number): void {
    tmpC.setHex(color);
    for (let k = 0; k < n; k++) {
      const i = pNext; pNext = (pNext + 1) % NP;
      const th = rnd() * Math.PI * 2, ph = Math.acos(2 * rnd() - 1), s = speed * (0.35 + rnd() * 0.9);
      pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.y; pPos[i * 3 + 2] = p.z;
      pVel[i * 3] = Math.sin(ph) * Math.cos(th) * s; pVel[i * 3 + 1] = Math.sin(ph) * Math.sin(th) * s; pVel[i * 3 + 2] = Math.cos(ph) * s;
      pBase[i * 3] = tmpC.r; pBase[i * 3 + 1] = tmpC.g; pBase[i * 3 + 2] = tmpC.b; pLife[i] = life * (0.6 + rnd() * 0.6);
    }
  }
  let liveParts = 0;
  function stepParticles(dt: number, dz: number): void {
    liveParts = 0;
    for (let i = 0; i < NP; i++) {
      if (pLife[i] <= 0) { if (pCol[i * 3] !== 0) { pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0; } continue; }
      liveParts++;
      pLife[i] -= dt; const o = i * 3; pVel[o + 1] -= dt * 1.2; pVel[o] *= 0.985; pVel[o + 1] *= 0.985; pVel[o + 2] *= 0.985;
      pPos[o] += pVel[o] * dt; pPos[o + 1] += pVel[o + 1] * dt; pPos[o + 2] += pVel[o + 2] * dt + dz * 0.2;
      const l = Math.max(0, Math.min(1, pLife[i] * 1.6)); pCol[o] = pBase[o] * l; pCol[o + 1] = pBase[o + 1] * l; pCol[o + 2] = pBase[o + 2] * l;
    }
    pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
  }

  const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3();
  /** stream the world toward the ship (cosmetic): dz world units this frame; warpK 0..1 */
  function stream(dt: number, dz: number, warpK: number): void {
    for (let i = 0; i < NSTAR; i++) {
      let z = starPos[i * 3 + 2] + dz; if (z > 12) z -= 212; starPos[i * 3 + 2] = z;
      if (warpK > 0.02) { const o = i * 6; streakPos[o] = starPos[i * 3]; streakPos[o + 1] = starPos[i * 3 + 1]; streakPos[o + 2] = z; streakPos[o + 3] = starPos[i * 3]; streakPos[o + 4] = starPos[i * 3 + 1]; streakPos[o + 5] = z - warpK * 9; }
    }
    starGeo.attributes.position.needsUpdate = true;
    streaks.visible = warpK > 0.02; if (streaks.visible) { streakGeo.attributes.position.needsUpdate = true; (streaks.material as THREE.LineBasicMaterial).opacity = warpK * 0.8; }
    for (let i = 0; i < NROCK; i++) {
      const r = rockS[i]; r.z += dz * 0.8; r.rx += r.vr * dt; r.ry += r.vr * 0.7 * dt; if (r.z > 14) placeRock(r, true);
      tmpM.compose(tmpV.set(r.x, r.y, r.z), tmpQ.setFromEuler(tmpE.set(r.rx, r.ry, 0)), tmpS.setScalar(r.s)); rocks.setMatrixAt(i, tmpM);
    }
    rocks.instanceMatrix.needsUpdate = true;
    planet.rotation.y += dt * 0.02; curtainTex.offset.x -= dt * 0.35;
  }
  function theme(T: Theme, seed: number): void {
    scene.background = new THREE.Color(T.bg); scene.fog = new THREE.Fog(T.fog, 40, 190);
    paintSky(T, seed);
    (planet.material as THREE.MeshLambertMaterial).color.setHex(T.planet); (ring.material as THREE.MeshBasicMaterial).color.setHex(T.ring); rockMat.color.setHex(T.rock);
    barMat.color.setHex(T.line); (glow.material as THREE.MeshBasicMaterial).color.setHex(T.glow); (curtain.material as THREE.MeshBasicMaterial).color.setHex(T.line);
  }
  return { ship, flame, lineGroup, bar, glow, ticks, pylonL, pylonR, half, curtain, reticle, bolt, shock, marks, gapBars, gates, makeTarget, burst, stepParticles, stream, theme, liveParticles: () => liveParts, tmpM, tmpQ, tmpV, tmpS };
}
export type World = ReturnType<typeof buildWorld>;
