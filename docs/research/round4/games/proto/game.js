// Antariksh Nishana · a three.js vertical slice (FEASIBILITY.md §5). The ship flies through a live 3D field; a number line
// rides ahead of it; mines are cloaked at the TRUE positions of fractions. The child steers (drag anywhere) and fires: the
// shot lands where the child aimed, the mine decloaks where the law says it is. Aiming is the skill; nothing is a menu.
// No points, coins, lives, timers or locks: the world waits for the child; a miss costs nothing but shows the gap.
import * as THREE from "three";
import { compose } from "./director.js";
import { grade, val, text, evidenceRows, gapLabel, labelsFor, malShot, MIS } from "./law.js";
import * as audio from "./audio.js";
import { say, ui } from "./bank.js";

const Q = new URLSearchParams(location.search);
const BOT = Q.get("bot");                       // "1" plays well, "mis" plays the focus misconception first
const DEBUG = Q.has("debug");
const FIXED_DPR = Q.get("dpr") ? Number(Q.get("dpr")) : null;
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches || Q.has("reduced");
const VOLT = 0xcbff4d;
const LANGTAG = { hinglish: "hi-Latn", en: "en", hi: "hi" };                         // the one "your move" hue (design-v3-volt-one-carrier): reticle only

const THEMES = {
  "neela-nebula": { bg: 0x070a1c, fog: 0x0b1030, line: 0x7fe3ff, glow: 0x2a9dff, mine: 0xff5a7a, rock: 0x5b5f86, planet: 0x6a4bd8, ring: 0xb9a6ff, neb: ["#1b2a8a", "#6b2bd0", "#0e7bb8"] },
  "laal-grah": { bg: 0x140707, fog: 0x2a0d0a, line: 0xffd27a, glow: 0xff7a2a, mine: 0x7affd9, rock: 0x7a4b3a, planet: 0xd8572b, ring: 0xffb07a, neb: ["#7a1d10", "#c2410c", "#4a1340"] },
  "hara-toofan": { bg: 0x04110d, fog: 0x072019, line: 0x9dffd0, glow: 0x19c28a, mine: 0xffc04d, rock: 0x3d6656, planet: 0x1f9d6b, ring: 0xa6ffd8, neb: ["#0d5c45", "#136b8a", "#1f3d14"] },
};

// ---------- lesson state in, spec out (the model may only have written `dress`) ----------
const SK = { s1: "c5-maths-ch02-t01-s1", s2: "c5-maths-ch02-t01-s2", s3: "c5-maths-ch02-t01-s3" };
const lessonState = {
  skillId: SK[Q.get("skill") ?? "s2"] ?? SK.s2,
  misconceptionSeen: Q.get("mis") ? MIS[Q.get("mis")] : MIS["count-marks"],
  fade: Number(Q.get("fade") ?? 2), seed: Number(Q.get("seed") ?? 3), lastTheme: null,
};
let modelDress = null;
for (const k of ["theme", "wrapper", "music", "pace", "teacherMove", "lang"]) if (Q.get(k)) (modelDress ??= {})[k] = Q.get(k);

// ---------- DOM ----------
const $ = (s) => document.querySelector(s);
const host = $("#world"), labels = $("#labels"), caption = $("#caption"), rail = $("#rail"), fireBtn = $("#fire");
const canvas = document.createElement("canvas"); canvas.id = "gl"; host.prepend(canvas);

// ---------- renderer and scene ----------
let dpr = FIXED_DPR ?? Math.min(window.devicePixelRatio || 1, 1.5);      // tier C cap 1.5 (low-end-offline §2)
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance", alpha: false });
renderer.setPixelRatio(dpr);
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 420);
const CAM = new THREE.Vector3(0, 3.0, 7.5), LOOK = new THREE.Vector3(0, 0.4, -12);   // horizon sits well above the line, so far objects never converge onto it
camera.position.copy(CAM); camera.lookAt(LOOK);
const LINE_Y = 0.7, LINE_Z = -6, SHIP_Z = 1.6, SHIP_Y = 0.55;
let T = THEMES["neela-nebula"];

const hemi = new THREE.HemisphereLight(0xcfe0ff, 0x302040, 2.0); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 1.6); sun.position.set(-4, 6, 5); scene.add(sun);

// sky: one sphere with a procedural nebula painted once into a 512x256 canvas
const skyCanvas = document.createElement("canvas"); skyCanvas.width = 512; skyCanvas.height = 256;
const skyTex = new THREE.CanvasTexture(skyCanvas); skyTex.colorSpace = THREE.SRGBColorSpace;
const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 12), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false }));
scene.add(sky);
function paintSky(seed) {
  const g = skyCanvas.getContext("2d"); const bg = "#" + T.bg.toString(16).padStart(6, "0");
  g.fillStyle = bg; g.fillRect(0, 0, 512, 256); let s = seed * 9301 + 49297;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.globalCompositeOperation = "lighter";
  for (let i = 0; i < 22; i++) { const x = r() * 512, y = 60 + r() * 140, rad = 30 + r() * 110, c = T.neb[i % 3];
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, c + "66"); gr.addColorStop(1, c + "00"); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); }
  g.globalCompositeOperation = "source-over"; g.fillStyle = "#ffffff";
  for (let i = 0; i < 260; i++) { g.globalAlpha = 0.3 + r() * 0.7; g.fillRect(r() * 512, r() * 256, 1, 1); }
  g.globalAlpha = 1; skyTex.needsUpdate = true;
}

// planet + ring (2 draws), far away: a place, not decoration on the learning objects
const planet = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16), new THREE.MeshLambertMaterial({ color: 0x6a4bd8, fog: false }));
planet.position.set(-34, 14, -150); scene.add(planet);
const ring = new THREE.Mesh(new THREE.RingGeometry(21, 30, 48), new THREE.MeshBasicMaterial({ color: 0xb9a6ff, side: THREE.DoubleSide, transparent: true, opacity: 0.35, fog: false }));
ring.rotation.set(1.2, 0.3, 0); planet.add(ring);

const dotCanvas = document.createElement("canvas"); dotCanvas.width = dotCanvas.height = 32;
{ const g = dotCanvas.getContext("2d"), gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, "#fff"); gr.addColorStop(0.35, "#fffc"); gr.addColorStop(1, "#fff0"); g.fillStyle = gr; g.fillRect(0, 0, 32, 32); }
const dotTex = new THREE.CanvasTexture(dotCanvas);
// stars stream past (1 draw) + warp streaks (1 draw, only in warp)
const NSTAR = 1400, starPos = new Float32Array(NSTAR * 3), streakPos = new Float32Array(NSTAR * 6);
for (let i = 0; i < NSTAR; i++) { starPos[i * 3] = (Math.random() - 0.5) * 120; starPos[i * 3 + 1] = (Math.random() - 0.5) * 80; starPos[i * 3 + 2] = -200 + Math.random() * 210; }
const starGeo = new THREE.BufferGeometry(); starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3).setUsage(THREE.DynamicDrawUsage));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xdfe8ff, map: dotTex, size: 0.45, sizeAttenuation: true, transparent: true, opacity: 0.95, fog: false, depthWrite: false, blending: THREE.AdditiveBlending }));
scene.add(stars);
const streakGeo = new THREE.BufferGeometry(); streakGeo.setAttribute("position", new THREE.BufferAttribute(streakPos, 3).setUsage(THREE.DynamicDrawUsage));
const streaks = new THREE.LineSegments(streakGeo, new THREE.LineBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
scene.add(streaks);

// asteroid field: one InstancedMesh (1 draw, 20 tris each), kept out of the line corridor so it never hides a learning object
const NROCK = 56, rockGeo = new THREE.IcosahedronGeometry(1, 0), rockMat = new THREE.MeshLambertMaterial({ color: 0x5b5f86, emissive: 0x141830, flatShading: true });
const rocks = new THREE.InstancedMesh(rockGeo, rockMat, NROCK); rocks.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(rocks);
const rockS = []; const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpE = new THREE.Euler(), tmpV = new THREE.Vector3(), tmpS = new THREE.Vector3();
function placeRock(r, zFar) {
  const side = Math.random(); let x, y;
  if (side < 0.4) { x = (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 16); y = -6 + Math.random() * 16; }
  else if (side < 0.75) { x = (Math.random() - 0.5) * 30; y = 5.5 + Math.random() * 9; }
  else { x = (Math.random() - 0.5) * 30; y = -9 + Math.random() * 4.5; }
  Object.assign(r, { x, y, z: zFar ? -180 - Math.random() * 40 : -180 + Math.random() * 190, s: 0.4 + Math.random() * 1.6, rx: Math.random() * 6, ry: Math.random() * 6, vr: (Math.random() - 0.5) * 1.4 });
}
for (let i = 0; i < NROCK; i++) { const r = {}; placeRock(r, false); rockS.push(r); }

// the ship: 6 simple meshes, flat-shaded (schematic, no face), scaled to read as a craft, not a blob
const ship = new THREE.Group(); scene.add(ship);
const hullMat = new THREE.MeshLambertMaterial({ color: 0xdfe4f2, flatShading: true });
const accentMat = new THREE.MeshLambertMaterial({ color: 0x4453c9, emissive: 0x10163a, flatShading: true });
const hull = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1.5, 6), hullMat); hull.rotation.x = -Math.PI / 2; hull.position.z = -0.1; ship.add(hull);
const wingGeo = new THREE.BufferGeometry(); wingGeo.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, -0.35, -0.95, 0, 0.45, 0.95, 0, 0.45, 0, 0.04, -0.35, 0.95, 0.04, 0.45, -0.95, 0.04, 0.45], 3)); wingGeo.computeVertexNormals();
const wing = new THREE.Mesh(wingGeo, new THREE.MeshLambertMaterial({ color: 0x4453c9, emissive: 0x10163a, side: THREE.DoubleSide })); ship.add(wing);
const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.3, 0.34), accentMat); fin.position.set(0, 0.15, 0.36); ship.add(fin);
const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), new THREE.MeshBasicMaterial({ color: 0x9fe6ff })); canopy.scale.set(0.8, 0.6, 1.6); canopy.position.set(0, 0.09, -0.15); ship.add(canopy);
const tips = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.05, 0.08), new THREE.MeshBasicMaterial({ color: 0xff9a5a })); tips.position.set(0, 0.02, 0.42); ship.add(tips);
const flame = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.65, 10), new THREE.MeshBasicMaterial({ color: 0x8fd8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }));
flame.rotation.x = Math.PI / 2; flame.position.set(0, 0, 0.95); ship.add(flame);
ship.scale.setScalar(0.62);
ship.position.set(0, SHIP_Y, SHIP_Z);

// the number line: bar + soft glow + instanced ticks + end pylons + the cloak curtain
const lineGroup = new THREE.Group(); lineGroup.position.set(0, LINE_Y, LINE_Z); scene.add(lineGroup);
const barMat = new THREE.MeshBasicMaterial({ color: 0x7fe3ff, depthTest: false });   // learning objects always draw over the scenery
const bar = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.1), barMat); lineGroup.add(bar);
function softTex(w, h, stops) { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); const gr = g.createLinearGradient(0, 0, 0, h); for (const [o, col] of stops) gr.addColorStop(o, col); g.fillStyle = gr; g.fillRect(0, 0, w, h); const t = new THREE.CanvasTexture(c); return t; }
const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.9), new THREE.MeshBasicMaterial({ map: softTex(4, 64, [[0, "#0000"], [0.5, "#fff"], [1, "#0000"]]), color: 0x2a9dff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
lineGroup.add(glow); glow.material.depthTest = false; glow.renderOrder = 3;
const MAXTICK = 40, ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 1, 0.045), barMat, MAXTICK); lineGroup.add(ticks);
for (const o of [bar, ticks]) o.renderOrder = 4;
const pylonGeo = new THREE.ConeGeometry(0.12, 0.45, 8), pylonL = new THREE.Mesh(pylonGeo, barMat), pylonR = new THREE.Mesh(pylonGeo, barMat); pylonL.renderOrder = pylonR.renderOrder = 4;
pylonL.rotation.z = Math.PI; pylonR.rotation.z = Math.PI; lineGroup.add(pylonL, pylonR);
// cloak curtain: scrolling interference over the WHOLE line, so nothing on screen leaks where a mine sits (shortcut-free)
const curtainCanvas = document.createElement("canvas"); curtainCanvas.width = 256; curtainCanvas.height = 32;
{ const g = curtainCanvas.getContext("2d"); for (let x = 0; x < 256; x++) { const a = 0.25 + 0.75 * Math.abs(Math.sin(x * 0.21) * Math.sin(x * 0.047)); g.fillStyle = `rgba(255,255,255,${(a * 0.5).toFixed(3)})`; g.fillRect(x, 0, 1, 32); } }
const curtainTex = new THREE.CanvasTexture(curtainCanvas); curtainTex.wrapS = THREE.RepeatWrapping; curtainTex.repeat.set(3, 1);
const curtain = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.25), new THREE.MeshBasicMaterial({ map: curtainTex, color: 0x7fe3ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
curtain.position.y = 0.72; curtain.material.depthTest = false; curtain.renderOrder = 3; lineGroup.add(curtain);

// reticle (volt, the child's move) and the aim guide
const reticle = new THREE.Group(); lineGroup.add(reticle);
const retMat = new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, depthTest: false });
reticle.add(new THREE.Mesh(new THREE.RingGeometry(0.17, 0.235, 28), retMat));
const retStem = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 1.5), new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0.45, depthTest: false })); retStem.position.y = 0.55; reticle.add(retStem);
reticle.renderOrder = 10;

// bolt + impact
const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6), new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, blending: THREE.AdditiveBlending })); bolt.visible = false; scene.add(bolt);
const shock = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); scene.add(shock);
const missMark = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.15, 20), new THREE.MeshBasicMaterial({ color: VOLT, transparent: true, opacity: 0.0, depthTest: false })); missMark.renderOrder = 8; lineGroup.add(missMark);
const gapBar = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.07), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthTest: false })); gapBar.renderOrder = 7; gapBar.position.y = -0.32; lineGroup.add(gapBar);

// mines (revealed only by the law's answer)
const mineGeo = new THREE.IcosahedronGeometry(0.27, 0), spikeGeo = new THREE.OctahedronGeometry(0.42, 0), mineRingGeo = new THREE.TorusGeometry(0.44, 0.025, 6, 28);
const mines = [];
function makeMine() {
  const g = new THREE.Group(), m = new THREE.MeshLambertMaterial({ color: 0xff5a7a, emissive: 0xff5a7a, emissiveIntensity: 0.6, flatShading: true, depthTest: false });
  const core = new THREE.Mesh(mineGeo, m), spikes = new THREE.Mesh(spikeGeo, new THREE.MeshBasicMaterial({ color: 0xff5a7a, wireframe: true, transparent: true, opacity: 0.6, depthTest: false }));
  const r = new THREE.Mesh(mineRingGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthTest: false }));
  g.add(core, spikes, r); g.renderOrder = 6; for (const o of [core, spikes, r]) o.renderOrder = 6; g.visible = false; g.position.y = 0.7; lineGroup.add(g); return { g, core, spikes, r, m };
}
for (let i = 0; i < 3; i++) mines.push(makeMine());

// particles: one pooled Points system, additive, colour scaled by life (no per-particle alpha needed): 1 draw
const NP = 700, pPos = new Float32Array(NP * 3), pCol = new Float32Array(NP * 3), pVel = new Float32Array(NP * 3), pLife = new Float32Array(NP), pBase = new Float32Array(NP * 3);
const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage)); pGeo.setAttribute("color", new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
const parts = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.26, map: dotTex, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false, sizeAttenuation: true }));
parts.frustumCulled = false; parts.renderOrder = 9; scene.add(parts);
let pNext = 0;
function burst(p, n, color, speed, life) {
  if (REDUCED) return; const c = new THREE.Color(color);
  for (let k = 0; k < n; k++) { const i = pNext; pNext = (pNext + 1) % NP;
    const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1), s = speed * (0.35 + Math.random() * 0.9);
    pPos.set([p.x, p.y, p.z], i * 3); pVel.set([Math.sin(ph) * Math.cos(th) * s, Math.sin(ph) * Math.sin(th) * s, Math.cos(ph) * s], i * 3);
    pBase.set([c.r, c.g, c.b], i * 3); pLife[i] = life * (0.6 + Math.random() * 0.6); }
}
// exhaust trail (same pool, tiny bursts each frame)
// doors: two warp gates, chosen by steering + the same button (diegetic r3g-door-choice)
const gates = [];
for (let i = 0; i < 2; i++) { const g = new THREE.Group(); const tor = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.07, 8, 40), new THREE.MeshBasicMaterial({ color: i ? 0xff8a3d : 0x7fe3ff }));
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), new THREE.MeshBasicMaterial({ color: i ? 0xff8a3d : 0x7fe3ff, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })); tor.material.depthTest = false; tor.renderOrder = disc.renderOrder = 5;
  g.add(tor, disc); g.visible = false; g.position.set(i ? 2.1 : -2.1, 0.75, 0); lineGroup.add(g); gates.push({ g, tor, disc }); }

// ---------- layout: the line's on-screen length is solved for THIS box (never a fixed world scaled down) ----------
let W = 1, H = 1, LW = 4, linePx = 300;
function layout() {
  const r = host.getBoundingClientRect(); W = Math.max(1, r.width); H = Math.max(1, r.height);
  renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix();
  const d = CAM.distanceTo(new THREE.Vector3(0, LINE_Y, LINE_Z)), halfH = d * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = halfH * camera.aspect;
  linePx = Math.min(W * 0.84, 720); LW = halfW * (linePx / W);
  bar.scale.x = LW * 2; glow.scale.x = LW * 2.1; curtain.scale.x = LW * 2.05; pylonL.position.set(-LW, 0.28, 0); pylonR.position.set(LW, 0.28, 0);
  if (level) buildTicks();
}
const project = (v3) => { tmpV.copy(v3).project(camera); return { x: (tmpV.x + 1) / 2 * W, y: (1 - tmpV.y) / 2 * H, z: tmpV.z }; };
const uToX = (u) => -LW + u * 2 * LW;
const valToU = (x) => (x - level.lo) / (level.hi - level.lo);

// ---------- game state ----------
let spec = null, level = null, dress = null, lang = "hinglish", acts = [], seq = 0, cur = 0, phase = "boot", phaseT = 0;
let u = 0.5, uVis = 0.5, shipX = 0, shipVX = 0, speed = 1, warpK = 0, shake = 0, hitstop = 0, fovKick = 0;
const cleared = [false, false, false], firstShot = [null, null, null];
const levelsLog = []; window.__levels = levelsLog;
let labelEls = [], gateEls = [];

function buildTicks() {
  const L = level, den = L.tickDen, span = L.hi - L.lo; let k = 0;
  for (let w = L.lo; w <= L.hi; w++) { tmpM.compose(tmpV.set(uToX(valToU(w)), 0.05, 0), tmpQ.identity(), tmpS.set(1, 0.42, 1)); ticks.setMatrixAt(k++, tmpM); }
  if (den) for (let i = 1; i < den * span; i++) { if (i % den === 0) continue; tmpM.compose(tmpV.set(uToX(i / (den * span)), 0.02, 0), tmpQ.identity(), tmpS.set(0.85, 0.3, 0.85)); ticks.setMatrixAt(k++, tmpM); }
  ticks.count = k; ticks.instanceMatrix.needsUpdate = true;
  for (const e of labelEls) e.remove(); labelEls = [];
  for (const l of labelsFor(L)) { const e = document.createElement("div"); e.className = "tick"; e.textContent = l.text; e.dataset.u = valToU(l.at); labels.appendChild(e); labelEls.push(e); }
}
function fracHTML(v) { return `<span class="frac"><span>${v.p}</span><span>${v.q}</span></span>`; }
function renderRail() {
  if (phase === "doors" || phase === "warp") { rail.innerHTML = `<div class="rail-doors"><span class="door g">${ui("garam", lang)}</span><span class="door t">${ui("teekha", lang)}</span></div>`; return; }
  rail.innerHTML = level.values.map((v, i) => `<div class="chip ${i === cur && !cleared[i] ? "now" : ""} ${cleared[i] ? "done" : ""}">${fracHTML(v)}${cleared[i] ? '<span class="tickmark" aria-hidden="true">✓</span>' : ""}</div>`).join("");
}
let speakUntil = 0;
function speak(s) {
  if (!s) return; caption.textContent = s; caption.lang = LANGTAG[lang]; caption.classList.add("on");
  const dur = 900 + s.length * 55; speakUntil = performance.now() + dur; audio.duck(true);
  $("#face").classList.add("talk");
}

function startLevel(lesson) {
  spec = compose({ ...lessonState, ...lesson, linePx }, modelDress);
  window.__spec = spec;
  if (!spec.level) { boardTwin("no level"); return; }
  level = spec.level; dress = spec.dress; lang = dress.lang; T = THEMES[dress.theme];
  lessonState.lastTheme = dress.theme;
  scene.background = new THREE.Color(T.bg); scene.fog = new THREE.Fog(T.fog, 40, 190);
  paintSky(level.seed); planet.material.color.setHex(T.planet); ring.material.color.setHex(T.ring); rockMat.color.setHex(T.rock);
  barMat.color.setHex(T.line); glow.material.color.setHex(T.glow); curtain.material.color.setHex(T.line);
  for (const m of mines) { m.m.color.setHex(T.mine); m.m.emissive.setHex(T.mine); m.spikes.material.color.setHex(T.mine); m.g.visible = false; m.g.scale.setScalar(1); }
  acts = []; seq = 0; cur = 0; cleared.fill(false); firstShot.fill(null); u = 0.5; uVis = 0.5;
  missMark.material.opacity = 0; gapBar.material.opacity = 0;
  for (const g of gates) g.g.visible = false; for (const e of gateEls) e.remove(); gateEls = [];
  buildTicks(); renderRail(); setPhase("aim");
  fireBtn.textContent = ui("fire", lang); fireBtn.lang = LANGTAG[lang];
  $("#hint").textContent = ui("drag", lang); $("#hint").lang = fireBtn.lang;
  speak(say(`intro.${dress.wrapper}`, lang, { t: text(level.values[0]) }));
  if (audio.audioReady()) { audio.stopMusic(); if (dress.music !== "off") audio.startMusic(dress.music); }
  levelsLog.push({ level, acts, shown: level.values.map(() => null), dress, composeMs: spec.composeMs });
  if (DEBUG) $("#debug").textContent = JSON.stringify({ skill: level.skillId, fade: level.fade, tickDen: level.tickDen, tol: +level.tol.toFixed(3), targets: level.targets, used: spec.used, composeMs: spec.composeMs, dress }, null, 1);
}
function setPhase(p) { phase = p; phaseT = 0; }

// ---------- the act ----------
function fire() {
  if (phase === "doors") { chooseDoor(); return; }
  if (phase !== "aim") return;
  const x = level.lo + u * (level.hi - level.lo);
  const a = { seq: seq++, via: BOT ? "bot" : "touch", k: "fire", i: cur, x: +x.toFixed(4) };
  acts.push(a);
  audio.play("fire"); try { navigator.vibrate?.(15); } catch {}
  bolt.visible = true; bolt.position.copy(ship.position).add(tmpV.set(0, 0.05, -0.7));
  boltFrom.copy(bolt.position); boltTo.set(uToX(u), LINE_Y + 0.05, LINE_Z);
  setPhase("flight");
}
const boltFrom = new THREE.Vector3(), boltTo = new THREE.Vector3();
let lastResult = null;
function resolveShot() {
  const g = grade(level, acts), gi = g.per[cur], a = acts[acts.length - 1];
  const v = level.values[cur], truth = val(v), tu = valToU(truth), first = firstShot[cur] === null;
  if (first) { firstShot[cur] = gi; levelsLog[levelsLog.length - 1].shown[cur] = [gi.outcome, gi.misconceptionId ?? null]; }
  const near = Math.abs(a.x - truth) <= level.tol;     // this shot (also for re-shots after a reveal)
  const m = mines[cur]; m.g.visible = true; m.g.position.x = uToX(tu); m.g.scale.setScalar(0.01);
  audio.play("reveal");
  if (near) {
    hitstop = 0.06; shake = REDUCED ? 0 : 0.16; cleared[cur] = true;
    const wp = m.g.getWorldPosition(new THREE.Vector3());
    burst(wp, 160, T.mine, 5.5, 1.1); burst(wp, 90, 0xffffff, 3, 0.7); burst(wp, 60, VOLT, 2.2, 0.9);
    shock.position.copy(wp); shock.scale.setScalar(0.2); shock.material.opacity = 0.9; shock.lookAt(camera.position);
    audio.play("hit", { c: 1 - Math.abs(a.x - truth) / level.tol * 0.5 }); try { navigator.vibrate?.([10, 30, 40]); } catch {}
    speak(say("hit", lang, { t: text(v) }));
    lastResult = "hit";
  } else {
    missMark.position.set(uToX(valToU(a.x)), 0.05, 0.02); missMark.material.opacity = 1;
    const x0 = Math.min(uToX(valToU(a.x)), uToX(tu)), x1 = Math.max(uToX(valToU(a.x)), uToX(tu));
    gapBar.position.x = (x0 + x1) / 2; gapBar.scale.x = Math.max(0.02, x1 - x0); gapBar.material.opacity = 0.9;
    burst(new THREE.Vector3(uToX(valToU(a.x)), LINE_Y + 0.05, LINE_Z), 24, 0xbfc8e8, 1.2, 0.5);
    audio.play("miss"); shake = REDUCED ? 0 : 0.05;
    const mal = first && gi.misconceptionId ? Object.entries(MIS).find(([, id]) => id === gi.misconceptionId)[0] : null;
    const gap = Math.abs(a.x - truth), facts = { t: text(v), g: gapLabel(gap), d: (level.tickDen || 1) * (level.hi - level.lo), p: v.p, q: v.q };
    speak(mal ? say(`mal.${mal}`, lang, facts) : gap <= 2.5 * level.tol ? say("near", lang, facts) : first ? say("far", lang, facts) : say("retry", lang, facts));
    lastResult = "miss";
    gapLabelEl.innerHTML = `${lang === "hi" ? "लगभग" : "lagbhag"} ${gapLabel(gap)}`; gapLabelEl.dataset.u = (valToU(a.x) + tu) / 2; gapLabelEl.classList.add("on");
  }
  truthLabelEl.innerHTML = fracHTML(v); truthLabelEl.dataset.u = tu; truthLabelEl.classList.add("on");
  renderRail(); setPhase("reveal");
}
const gapLabelEl = document.createElement("div"); gapLabelEl.className = "gaplabel"; labels.appendChild(gapLabelEl);
const truthLabelEl = document.createElement("div"); truthLabelEl.className = "truth"; labels.appendChild(truthLabelEl);

function afterReveal() {
  if (lastResult === "hit") { gapLabelEl.classList.remove("on"); mines[cur].g.visible = false; truthLabelEl.classList.remove("on"); missMark.material.opacity = 0; gapBar.material.opacity = 0;
    const nxt = level.values.findIndex((_, i) => !cleared[i]);
    if (nxt < 0) { openDoors(); return; }
    cur = nxt; speak(say("next", lang, { t: text(level.values[cur]) })); renderRail();
  } // a miss leaves the mine visible: the child clears it (no grade), the world never takes anything away
  setPhase("aim");
}
function openDoors() {
  const g = grade(level, acts); const rows = evidenceRows(level, g);
  window.__evidence = (window.__evidence ?? []).concat([{ levelSeed: level.seed, rows }]);
  if (DEBUG) $("#debug").textContent += "\nevidence " + JSON.stringify(rows);
  setPhase("doors"); u = 0.5; renderRail(); speak(say("doors", lang, {}));
  fireBtn.textContent = ui("go", lang);
  for (let i = 0; i < 2; i++) { gates[i].g.visible = true; gates[i].g.scale.setScalar(0.01); const e = document.createElement("div"); e.className = "gatelabel " + (i ? "t" : "g"); e.textContent = ui(i ? "teekha" : "garam", lang); e.lang = LANGTAG[lang]; e.dataset.gate = i; labels.appendChild(e); gateEls.push(e); }
}
let chosen = 0;
function chooseDoor() {
  chosen = uToX(u) > 0 ? 1 : 0; audio.play("gate"); audio.play("warp"); setPhase("warp");
  for (const e of gateEls) e.remove(); gateEls = []; truthLabelEl.classList.remove("on");
}
function boardTwin(why) {
  $("#twin").hidden = false; $("#twin").innerHTML = `<p>${ui("twin", lang)}</p><p class="twinq">${level ? level.values.map(fracHTML).join(" · ") : ""} → 0 … ${level ? level.hi : 1}</p>`;
  console.warn("board twin:", why);
}
canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); boardTwin("context lost"); });

// ---------- input: drag anywhere in the world steers; the dock button commits ----------
let dragging = false, lastPX = 0, lastAimSound = 0;
host.addEventListener("pointerdown", (e) => { dragging = true; lastPX = e.clientX; host.setPointerCapture(e.pointerId); audio.initAudio(); audio.resume(); if (!musicStarted) startMusicOnce(); });
host.addEventListener("pointermove", (e) => { if (!dragging) return; steer((e.clientX - lastPX) / linePx * 0.85); lastPX = e.clientX; });
const endDrag = () => { dragging = false; }; host.addEventListener("pointerup", endDrag); host.addEventListener("pointercancel", endDrag);
fireBtn.addEventListener("click", () => { audio.initAudio(); audio.resume(); if (!musicStarted) startMusicOnce(); fire(); });
addEventListener("keydown", (e) => { if (e.key === "ArrowLeft" || e.key === "a") steer(-0.012); if (e.key === "ArrowRight" || e.key === "d") steer(0.012); if (e.key === " " || e.key === "Enter") { e.preventDefault(); fire(); } });
function steer(du) {
  if (phase !== "aim" && phase !== "doors") return; u = Math.min(1, Math.max(0, u + du));
  const now = performance.now(); if (now - lastAimSound > 70) { audio.play("aim", { x: u }); lastAimSound = now; }
}
let musicStarted = false;
function startMusicOnce() { musicStarted = true; if (dress && dress.music !== "off") audio.startMusic(dress.music); }

// ---------- bot (measurement + demo): drives the same steer()/fire() the child's input drives ----------
let botT = 0, botAim = null, botMisDone = false, botDoor = 0;
function botStep(dt) {
  if (!BOT) return; botT += dt;
  if (phase === "aim") {
    if (botAim === null) {
      const v = level.values[cur]; let x = val(v) + (Math.random() - 0.5) * level.tol * 0.8;
      if (BOT === "mis" && !botMisDone && firstShot[cur] === null) { const focus = spec.used?.focus; const ms = focus ? malShot(level, cur, focus) : null; if (ms !== null) { x = ms; botMisDone = true; } }
      botAim = valToU(x); botT = 0;
    }
    const d = botAim - u; if (Math.abs(d) > 0.004) steer(Math.sign(d) * Math.min(Math.abs(d), dt * 0.9));
    else if (botT > 1.1) { fire(); botAim = null; }
  } else if (phase === "doors") {
    if (botAim === null) { botAim = botDoor++ % 2 ? 0.85 : 0.15; botT = 0; }
    const d = botAim - u; if (Math.abs(d) > 0.01) steer(Math.sign(d) * Math.min(Math.abs(d), dt * 0.9)); else if (botT > 1.0) { fire(); botAim = null; }
  } else botAim = null;
}

// ---------- frame loop with a frame-time governor (tiers only step down) ----------
const frames = new Float32Array(4096); let fN = 0, last = performance.now(), govT = 0, workMs = [];
const dprSteps = [dpr];
const clock = { t: 0 };
function frame(now) {
  const rawDt = Math.min(0.1, (now - last) / 1000); frames[fN++ % frames.length] = now - last; last = now;
  const w0 = performance.now();
  let dt = rawDt; if (hitstop > 0) { hitstop -= rawDt; dt = rawDt * 0.05; }
  clock.t += dt; phaseT += dt;
  botStep(rawDt);
  if (performance.now() > speakUntil && caption.classList.contains("on")) { caption.classList.remove("on"); audio.duck(false); $("#face").classList.remove("talk"); }

  // phases
  if (phase === "flight") { const k = Math.min(1, phaseT / 0.22); bolt.position.lerpVectors(boltFrom, boltTo, k); burst(bolt.position, 2, VOLT, 0.4, 0.25); if (k >= 1) { bolt.visible = false; resolveShot(); } }
  if (phase === "reveal") { const m = mines[cur]; const k = Math.min(1, phaseT / 0.25); if (lastResult === "hit") m.g.scale.setScalar(Math.max(0.01, (1 - Math.min(1, phaseT / 0.35)) * 1.4)); else m.g.scale.setScalar(THREE.MathUtils.lerp(0.01, 1, k));
    if (phaseT > (lastResult === "hit" ? 1.1 : 1.6)) afterReveal(); }
  if (phase === "doors") for (const g of gates) g.g.scale.setScalar(Math.min(1, g.g.scale.x + dt * 3));
  if (phase === "warp") {
    warpK = Math.min(1, warpK + dt * 1.6); const sel = gates[chosen].g; sel.scale.setScalar(1 + phaseT * 3); gates[1 - chosen].g.visible = false;
    if (phaseT > 1.3) { warpK = 0; for (const g of gates) g.g.visible = false;
      startLevel({ door: chosen ? "teekha" : "garam", fade: level.fade, skillId: level.skillId, seed: level.seed + 1, misconceptionSeen: (grade(level, acts).per.find((p) => p?.misconceptionId)?.misconceptionId) ?? null });
      if (chosen) { lessonState.skillId = level.skillId; lessonState.fade = level.fade; } }
  } else warpK = Math.max(0, warpK - dt * 2);

  // flight: world streams toward the ship; pace changes travel speed only
  const pace = dress?.pace === "brisk" ? 1.5 : 1; speed = THREE.MathUtils.lerp(speed, pace * (1 + warpK * 14), Math.min(1, dt * 3));
  const dz = speed * 9 * dt;
  for (let i = 0; i < NSTAR; i++) { let z = starPos[i * 3 + 2] + dz; if (z > 12) z -= 212; starPos[i * 3 + 2] = z;
    const o = i * 6; streakPos[o] = starPos[i * 3]; streakPos[o + 1] = starPos[i * 3 + 1]; streakPos[o + 2] = z; streakPos[o + 3] = starPos[i * 3]; streakPos[o + 4] = starPos[i * 3 + 1]; streakPos[o + 5] = z - warpK * 9; }
  starGeo.attributes.position.needsUpdate = true; streaks.visible = warpK > 0.02; if (streaks.visible) { streakGeo.attributes.position.needsUpdate = true; streaks.material.opacity = warpK * 0.8; }
  for (let i = 0; i < NROCK; i++) { const r = rockS[i]; r.z += dz * 0.8; r.rx += r.vr * dt; r.ry += r.vr * 0.7 * dt; if (r.z > 14) placeRock(r, true);
    tmpM.compose(tmpV.set(r.x, r.y, r.z), tmpQ.setFromEuler(tmpE.set(r.rx, r.ry, 0)), tmpS.setScalar(r.s)); rocks.setMatrixAt(i, tmpM); }
  rocks.instanceMatrix.needsUpdate = true;
  planet.rotation.y += dt * 0.02; curtainTex.offset.x -= dt * 0.35;

  // ship follows the aim with a spring; banks into the turn
  uVis += (u - uVis) * Math.min(1, dt * 14);
  const targetX = uToX(uVis) * ((SHIP_Z - CAM.z) / (LINE_Z - CAM.z)) * 1.0;
  const ax = (targetX - shipX) * 60 - shipVX * 11; shipVX += ax * dt; shipX += shipVX * dt;
  ship.position.set(shipX, SHIP_Y + Math.sin(clock.t * 2.1) * 0.05, SHIP_Z); ship.rotation.set(0.06, 0, THREE.MathUtils.clamp(-shipVX * 0.18, -0.7, 0.7));
  flame.scale.set(1, 1, 0.8 + Math.random() * 0.4 + warpK * 2.5); flame.material.opacity = 0.6 + Math.random() * 0.3;
  if (!REDUCED && fN % 2 === 0) burst(tmpV.set(shipX, ship.position.y, SHIP_Z + 1.0), 1, T.glow, 0.25, 0.35);
  reticle.position.x = uToX(uVis); reticle.visible = phase === "aim" || phase === "flight" || phase === "doors"; reticle.rotation.z += dt * 1.5;
  if (fN % 6 === 0) audio.setHum(Math.min(1, (speed - 1) / 3 + Math.abs(shipVX) * 0.1));

  // mines idle motion, gates spin, shock fades
  for (const m of mines) if (m.g.visible) { m.core.rotation.x += dt; m.core.rotation.y += dt * 1.3; m.spikes.rotation.y -= dt * 0.6; m.r.rotation.z += dt * 2; }
  for (const g of gates) if (g.g.visible) { g.tor.rotation.z += dt * 1.2; }
  if (shock.material.opacity > 0) { shock.scale.multiplyScalar(1 + dt * 6); shock.material.opacity = Math.max(0, shock.material.opacity - dt * 1.8); }

  // particles
  for (let i = 0; i < NP; i++) { if (pLife[i] <= 0) { if (pCol[i * 3] !== 0) { pCol[i * 3] = pCol[i * 3 + 1] = pCol[i * 3 + 2] = 0; } continue; }
    pLife[i] -= dt; const o = i * 3; pVel[o + 1] -= dt * 1.2; pVel[o] *= 0.985; pVel[o + 1] *= 0.985; pVel[o + 2] *= 0.985;
    pPos[o] += pVel[o] * dt; pPos[o + 1] += pVel[o + 1] * dt; pPos[o + 2] += pVel[o + 2] * dt + dz * 0.2;
    const l = Math.max(0, Math.min(1, pLife[i] * 1.6)); pCol[o] = pBase[o] * l; pCol[o + 1] = pBase[o + 1] * l; pCol[o + 2] = pBase[o + 2] * l; }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;

  // camera: shake (<= 6 px equivalent, J1 limits), warp FOV kick
  shake = Math.max(0, shake - dt); const sA = shake * 0.5;
  camera.position.set(CAM.x + (Math.random() - 0.5) * sA, CAM.y + (Math.random() - 0.5) * sA, CAM.z);
  const fov = 58 + warpK * 26; if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.lookAt(LOOK);

  renderer.render(scene, camera);
  placeLabels();
  workMs.push(performance.now() - w0); if (workMs.length > 4096) workMs.shift();

  // governor: if p95 frame > 24 ms over the last 2 s, step DPR down (never up mid-session)
  govT += rawDt; if (!FIXED_DPR && govT > 2) { govT = 0; const recent = Array.from(frames.slice(Math.max(0, (fN % frames.length) - 120), fN % frames.length)).sort((a, b) => a - b);
    if (recent.length > 60 && recent[Math.floor(recent.length * 0.95)] > 24 && dpr > 1) { dpr = Math.max(1, +(dpr - 0.25).toFixed(2)); renderer.setPixelRatio(dpr); renderer.setSize(W, H, false); dprSteps.push(dpr); } }
  requestAnimationFrame(frame);
}
function placeLabels() {
  for (const e of labelEls) { const p = project(tmpV.set(uToX(+e.dataset.u), LINE_Y - 0.5, LINE_Z)); e.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, 0)`; }
  for (const e of [gapLabelEl, truthLabelEl]) if (e.classList.contains("on")) { const p = project(tmpV.set(uToX(+e.dataset.u), LINE_Y + (e === truthLabelEl ? 1.55 : -1.15), LINE_Z)); e.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, -50%)`; }
  for (const e of gateEls) { const g = gates[+e.dataset.gate].g; const p = project(g.getWorldPosition(tmpV).add(new THREE.Vector3(0, -1.35, 0))); e.style.transform = `translate(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px) translate(-50%, 0)`; }
}

// ---------- perf read-out for the harness (no numbers ever shown to the child) ----------
window.__perf = (reset) => {
  const n = Math.min(fN, frames.length), arr = Array.from(frames.slice(0, n)).filter((x) => x > 0).sort((a, b) => a - b), w = workMs.slice().sort((a, b) => a - b);
  const q = (a, p) => a[Math.min(a.length - 1, Math.floor(p * a.length))] ?? 0, info = renderer.info;
  const out = { n: arr.length, fpsMedian: +(1000 / q(arr, 0.5)).toFixed(1), frameP50: +q(arr, 0.5).toFixed(2), frameP95: +q(arr, 0.95).toFixed(2), over20: arr.filter((x) => x > 20).length, over33: arr.filter((x) => x > 33.4).length,
    workP50: +q(w, 0.5).toFixed(2), workP95: +q(w, 0.95).toFixed(2), dpr, dprSteps: dprSteps.slice(), calls: info.render.calls, triangles: info.render.triangles, points: info.render.points, lines: info.render.lines,
    geometries: info.memory.geometries, textures: info.memory.textures, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null,
    canvas: [canvas.width, canvas.height], box: [Math.round(W), Math.round(H)], linePx: Math.round(linePx), phase, levels: levelsLog.length };
  if (reset) { fN = 0; workMs = []; }
  return out;
};

// ---------- boot ----------
const t0 = performance.now();
addEventListener("resize", layout);
layout();
startLevel({});
renderer.compile(scene, camera);
requestAnimationFrame((t) => { last = t; window.__firstFrameMs = +performance.now().toFixed(1); window.__bootMs = +(performance.now() - t0).toFixed(1); frame(t); });
if (BOT) { audio.initAudio(); }
