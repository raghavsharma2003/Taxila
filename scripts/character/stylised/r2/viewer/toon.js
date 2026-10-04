// TaxilaToon: the style C shader family (TECH-PLAN §6). One ShaderMaterial per surface kind, with three's morph and
// skinning chunks injected, and our own fixed light rig: soft key, SH-like sky/ground ambient, warm rim.
// No three light loop, so the cost is fixed (Mali-G52 budget) and the look does not depend on the scene.
//   skin  : wrap diffuse + smoothstep soft two-tone, warm terminator (fake SSS), gentle rim, broad low GGX,
//           baked AO (TEXCOORD_0.x) with a fill lift (no dark under-chin band), cheek blush, nose-tip warmth.
//   eye   : iris/sclera texture, soft lid shadow on the top of the ball (head frame, not gaze frame).
//   cornea: transparent; the catchlight is a VIEW-SPACE disc (never disappears, never a render-only light).
//   hair  : wrap diffuse on near-black warm base + Kajiya-Kay along the shell flow (TEXCOORD_0 u direction).
//   cloth : wrap + faint sheen. plain: wrap only (brows, lashes, teeth, tongue, bindi, gold).
import * as THREE from "three";

const COMMON = /* glsl */ `
uniform vec3 uKeyDir; uniform vec3 uKeyCol; uniform vec3 uRimDir; uniform vec3 uRimCol;
uniform vec3 uSky; uniform vec3 uGround;
vec3 ambient(vec3 n) { return mix(uGround, uSky, 0.5 + 0.5 * n.y); }
float wrapL(float ndl, float w) { return clamp((ndl + w) / (1.0 + w), 0.0, 1.0); }
float D_GGX(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (3.14159265 * d * d); }
`;

const VERT = /* glsl */ `
#include <common>
#include <color_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vObj; varying vec3 vColor2;
void main() {
  #ifdef USE_UV0
  vUv = uv;
  #else
  vUv = vec2(1.0, 0.0);
  #endif
  #include <color_vertex>
  #ifdef USE_COLOR
  vColor2 = vColor.rgb;
  #else
  vColor2 = vec3(1.0);
  #endif
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vW = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vObj = transformed;
  vN = normalize(mat3(modelMatrix) * objectNormal);
}`;

const FRAG_HEAD = /* glsl */ `
precision highp float;
${COMMON}
uniform vec3 uBase; uniform float uKind; uniform float uWrap; uniform float uSpec; uniform float uRough;
uniform float uRim; uniform float uSSS; uniform float uAOLift; uniform float uSheen;
uniform sampler2D tMap; uniform float uHasMap;
uniform vec3 uEyeC; uniform float uEyeR;
uniform vec3 uCatch; uniform float uCatchR; uniform float uCatchI;
varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vObj; varying vec3 vColor2;
`;

const FRAG_SURF = FRAG_HEAD + /* glsl */ `
void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uKeyDir);
  vec3 albedo = uBase * vColor2;
  if (uHasMap > 0.5) albedo = texture2D(tMap, vUv).rgb;
  float ndl = dot(N, L);
  float w = wrapL(ndl, uWrap);
  float soft = smoothstep(0.0, 1.0, w);           // soft two-tone feel, never a hard band
  vec3 diff = uKeyCol * soft;
  // warm terminator: a band where the wrap rolls off (fake subsurface)
  float band = smoothstep(0.0, 0.35, w) * (1.0 - smoothstep(0.35, 0.8, w));
  diff += uKeyCol * vec3(0.85, 0.32, 0.22) * band * uSSS;
  float ao = 1.0;
  if (uKind < 0.5) {      // skin: AO from TEXCOORD_0.x with a fill lift so creases never go grey
    ao = mix(1.0, vUv.x, 1.0 - uAOLift);
  }
  vec3 amb = ambient(N) * ao;
  // underside fill: lifts the chin/neck band so it never reads as a dark collar
  amb += uGround * 0.35 * smoothstep(0.0, -0.8, N.y) * (uKind < 0.5 ? 1.0 : 0.0);
  vec3 col = albedo * (diff * mix(0.85, 1.0, ao) + amb);
  // rim on the lit side of the silhouette
  float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  col += uRimCol * fr * smoothstep(-0.2, 0.5, dot(N, normalize(uRimDir))) * uRim;
  col += albedo * uRimCol * fr * 0.18 * uRim;
  // one broad low spec lobe
  vec3 H = normalize(L + V);
  float spec = D_GGX(max(dot(N, H), 0.0), uRough * uRough) * max(ndl, 0.0);
  col += uKeyCol * spec * uSpec * 0.04;
  if (uKind > 2.5 && uKind < 3.5) {               // cloth sheen
    col += albedo * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0) * uSheen;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const FRAG_HAIR = FRAG_HEAD + /* glsl */ `
mat3 cotangentFrame(vec3 N, vec3 p, vec2 uv) {
  vec3 dp1 = dFdx(p); vec3 dp2 = dFdy(p); vec2 duv1 = dFdx(uv); vec2 duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, N); vec3 dp1perp = cross(N, dp1);
  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x; vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
  float invmax = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-20));
  return mat3(T * invmax, B * invmax, N);
}
float kk(vec3 T, vec3 H, float e) { float th = dot(T, H); return pow(sqrt(max(1.0 - th * th, 0.0)), e); }
void main() {
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  vec3 L = normalize(uKeyDir);
  vec3 albedo = uBase * vColor2;
  float ndl = dot(N, L);
  float w = smoothstep(0.0, 1.0, wrapL(ndl, uWrap));
  vec3 col = albedo * (uKeyCol * w + ambient(N));
  mat3 tbn = cotangentFrame(N, vW, vUv);
  vec3 T = normalize(tbn[0]);
  vec3 H = normalize(L + V);
  float s1 = kk(normalize(T + N * 0.12), H, 70.0);
  float s2 = kk(normalize(T - N * 0.08), H, 18.0);
  col += uKeyCol * (s1 * 0.10 + s2 * vec3(0.30, 0.22, 0.17) * 0.18) * w * uSpec;
  float fr = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 3.0);
  col += uRimCol * fr * smoothstep(-0.2, 0.5, dot(N, normalize(uRimDir))) * uRim;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const FRAG_EYE = FRAG_HEAD + /* glsl */ `
void main() {
  vec3 N = normalize(vN);
  vec3 L = normalize(uKeyDir);
  vec3 albedo = texture2D(tMap, vUv).rgb;
  // head-frame elevation of this point on the ball (the lid shadow does not rotate with the gaze)
  vec3 rel = (vW - uEyeC) / uEyeR;
  float lid = smoothstep(0.05, 0.75, rel.y);               // top of the ball sits under the upper lid
  float side = smoothstep(0.45, 0.95, length(rel.xy));     // corners of the opening
  float shade = 1.0 - 0.35 * lid - 0.18 * side;
  vec3 col = albedo * (uKeyCol * (0.55 + 0.45 * wrapL(dot(N, L), 0.8)) + ambient(N)) * shade;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const FRAG_CORNEA = FRAG_HEAD + /* glsl */ `
void main() {
  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  vec3 nV = normalize((viewMatrix * vec4(N, 0.0)).xyz);
  float c = dot(nV, normalize(uCatch));
  float spot = smoothstep(cos(uCatchR * 1.25), cos(uCatchR * 0.8), c);
  float spot2 = smoothstep(cos(uCatchR * 0.55), cos(uCatchR * 0.3), dot(nV, normalize(vec3(0.20, -0.22, 1.0)))) * 0.35;
  float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0) * 0.25;
  float a = clamp(spot * uCatchI + spot2 + fres, 0.0, 1.0);
  gl_FragColor = vec4(vec3(1.0, 0.99, 0.97), a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export const RIG = {
  keyDir: new THREE.Vector3(-0.42, 0.55, 0.95),   // from viewer's upper-left, near frontal (c-front)
  keyCol: new THREE.Color(1.0, 0.94, 0.86).multiplyScalar(1.05),
  rimDir: new THREE.Vector3(0.75, 0.35, -0.6),
  rimCol: new THREE.Color(1.0, 0.86, 0.70),
  sky: new THREE.Color(0.58, 0.55, 0.53),
  ground: new THREE.Color(0.36, 0.28, 0.22),
};

const lin = (rgb) => new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255).convertSRGBToLinear();

function make(frag, kind, o = {}) {
  const u = {
    uKeyDir: { value: RIG.keyDir.clone().normalize() }, uKeyCol: { value: RIG.keyCol },
    uRimDir: { value: RIG.rimDir.clone().normalize() }, uRimCol: { value: RIG.rimCol },
    uSky: { value: RIG.sky }, uGround: { value: RIG.ground },
    uBase: { value: o.base || new THREE.Color(1, 1, 1) }, uKind: { value: kind },
    uWrap: { value: o.wrap ?? 0.45 }, uSpec: { value: o.spec ?? 0.3 }, uRough: { value: o.rough ?? 0.55 },
    uRim: { value: o.rim ?? 0.25 }, uSSS: { value: o.sss ?? 0.0 }, uAOLift: { value: o.aoLift ?? 0.45 },
    uSheen: { value: o.sheen ?? 0.0 },
    tMap: { value: o.map || null }, uHasMap: { value: o.map ? 1 : 0 },
    uEyeC: { value: new THREE.Vector3() }, uEyeR: { value: 0.025 },
    uCatch: { value: new THREE.Vector3(-0.30, 0.36, 1.0) }, uCatchR: { value: 0.105 }, uCatchI: { value: 1.0 },
  };
  const m = new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: frag, vertexColors: !!o.vcol,
    transparent: !!o.transparent, depthWrite: !o.transparent, side: o.side ?? THREE.FrontSide });
  if (o.uv) m.defines = { USE_UV0: "" };
  return m;
}

// material name (from the GLB) -> TaxilaToon material
export function toonFor(name, src, tier = "H") {
  const C = {
    skin: [240, 152, 94], hair: [40, 34, 32], brow: [52, 42, 38], lash: [18, 12, 10], bindi: [110, 30, 34],
    gold: [236, 184, 96], kurta: [6, 92, 104], piping: [200, 102, 48], teeth: [246, 240, 230], tongue: [190, 80, 72],
  };
  switch (name) {
    case "skin": return make(FRAG_SURF, 0, { vcol: true, uv: true, sss: 0.38, rim: 0.22, spec: 0.35, rough: 0.6, wrap: 0.5 });
    case "skin_ear": return make(FRAG_SURF, 1, { base: lin(C.skin), sss: 0.38, rim: 0.22, spec: 0.3, wrap: 0.5 });
    case "eye": return make(FRAG_EYE, 4, { map: src.map, uv: true });
    case "cornea": return make(FRAG_CORNEA, 5, { transparent: true });
    case "hair": return make(tier === "H" ? FRAG_HAIR : FRAG_SURF, 2, { base: lin(C.hair), uv: tier === "H", spec: 1.0, rim: 0.35, wrap: 0.35 });
    case "kurta": return make(FRAG_SURF, 3, { base: lin(C.kurta), sheen: 0.10, spec: 0.1, rim: 0.2, wrap: 0.45 });
    case "piping": return make(FRAG_SURF, 3, { base: lin(C.piping), sheen: 0.1, spec: 0.1, rim: 0.15 });
    case "gold": return make(FRAG_SURF, 1, { base: lin(C.gold), spec: 2.5, rough: 0.3, rim: 0.3, wrap: 0.2 });
    case "brow": return make(FRAG_SURF, 1, { base: lin(C.brow), spec: 0.1, rim: 0.05, wrap: 0.6 });
    case "lash": return make(FRAG_SURF, 1, { base: lin(C.lash), spec: 0.2, rim: 0.0, wrap: 0.6 });
    case "teeth": return make(FRAG_SURF, 1, { base: lin(C.teeth), spec: 0.6, rough: 0.4, rim: 0.0, wrap: 0.8 });
    case "tongue": return make(FRAG_SURF, 1, { base: lin(C.tongue), spec: 0.4, rim: 0.0, wrap: 0.6 });
    case "bindi": return make(FRAG_SURF, 1, { base: lin(C.bindi), spec: 0.5, rim: 0.0 });
    default: return null;
  }
}
