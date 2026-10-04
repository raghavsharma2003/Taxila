// TaxilaSkin / TaxilaEye / TaxilaHair / TaxilaCloth / TaxilaLens: one custom shader family (TEACHER-VISUAL §5.4),
// ported from scripts/character/bakeoff/merged/viewer/shaders.js (the superset of the iteration-2 viewer). GLSL ES
// 3.0 through three's ShaderMaterial, so three still injects skinning, morph textures, tone mapping and the output
// colour space. Lighting is ours (key directional + L1 SH ambient + rim), never three's light loop, so the cost is
// fixed and the look does not depend on what else is in the scene.
//
// One file, every look. A look's art fixes were each made against ONE face, so they are not universal truths; they
// are switched by data in the look's runtime.json, never by code (a new face = a new GLB + runtime.json, zero code):
//   PROFILE_MERGED  the merged bake-off's eye pass, mouth-interior light floors, warm bounce, sharpened hair coverage
//                   and the 0.12 specular floor (runtime.json shading.profile "merged", or an eyePass /
//                   mouthInterior block). Without it the iteration-2 shading runs exactly as G9 solved it.
//   EYE_TEX         the eye mesh carries its own photo texture (licensed heads; detected from the GLB itself).
//   NO_CARD_RIM     shading.cardRim false: no rim on hair cards (cards seen edge-on lit as pale lines).
//   HAIR_LUMA_GATE  shading.hairLumaGate: scalp hair painted into the skin atlas takes no rim or sheen.
//   HAS_DETAIL / HAS_MICRO / HAS_NORMAL / HAS_WRINKLE / HAS_STRETCH / HAS_PACKED: present maps only.
import { ClampToEdgeWrapping, DataTexture, LinearFilter, RGBAFormat, SRGBColorSpace, Vector3 } from "three";

const LIGHT_PARS = /* glsl */ `
uniform vec3 uKeyDir;      // world, towards the light
uniform vec3 uKeyColor;    // linear radiance
uniform vec3 uRimDir;
uniform vec3 uRimColor;
uniform vec3 uSH[4];       // L0, L1(y), L1(z), L1(x) irradiance coefficients (already convolved)
uniform vec3 uBounce;      // merged iteration 3: warm bounce from below (the chest / garment), down-facing skin only
vec3 shIrradiance(vec3 n) { return max(uSH[0] + uSH[1] * n.y + uSH[2] * n.z + uSH[3] * n.x, 0.0); }
float D_GGX(float NoH, float a) { float a2 = a * a; float d = NoH * NoH * (a2 - 1.0) + 1.0; return a2 / (3.14159265 * d * d); }
float V_SmithJointApprox(float NoV, float NoL, float a) {
  float gv = NoL * (NoV * (1.0 - a) + a); float gl = NoV * (NoL * (1.0 - a) + a); return 0.5 / max(gv + gl, 1e-5); }
float F_Schlick(float f0, float VoH) { return f0 + (1.0 - f0) * pow(1.0 - VoH, 5.0); }
mat3 cotangentFrame(vec3 N, vec3 p, vec2 uv) {
  vec3 dp1 = dFdx(p); vec3 dp2 = dFdy(p); vec2 duv1 = dFdx(uv); vec2 duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, N); vec3 dp1perp = cross(N, dp1);
  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x; vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
  float invmax = inversesqrt(max(max(dot(T, T), dot(B, B)), 1e-20));
  return mat3(T * invmax, B * invmax, N);
}
`;

const SKINNED_VERT_HEAD = /* glsl */ `
#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
varying vec2 vUv;
varying vec3 vWorldPos;
varying vec3 vNormalW;
`;
const SKINNED_VERT_BODY = /* glsl */ `
  vUv = uv;
  #include <beginnormal_vertex>
  #include <morphnormal_vertex>
  #include <skinbase_vertex>
  #include <skinnormal_vertex>
  #include <begin_vertex>
  #include <morphtarget_vertex>
  #include <skinning_vertex>
  #include <project_vertex>
  vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
  vNormalW = normalize(mat3(modelMatrix) * objectNormal);
`;

// ------------------------------------------------------------------ skin
const SKIN_VERT = SKINNED_VERT_HEAD + /* glsl */ `
attribute float _region;
varying float vRegion;
void main() {
  vRegion = _region;
` + SKINNED_VERT_BODY + `}`;

const SKIN_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo;
uniform sampler2D tLUT;
#ifdef HAS_NORMAL
uniform sampler2D tNormal;
uniform float uNormalScale;
#endif
#ifdef HAS_PACKED
uniform sampler2D tPacked;
#endif
#ifdef HAS_WRINKLE
uniform sampler2D tWrinkle; uniform sampler2D tMaskA; uniform sampler2D tMaskB;
uniform vec4 uWrA; uniform vec4 uWrB;
#endif
#ifdef HAS_STRETCH
uniform sampler2D tWrinkleS; uniform float uStretch;
#endif
#ifdef HAS_DETAIL
uniform sampler2D tDetail;   // procedural-v3: R peach fuzz, G subsurface tint, B moisture, A micro strength
uniform float uFuzz; uniform vec3 uSSSTint; uniform float uSSS; uniform float uWet;
#endif
#ifdef HAS_MICRO
uniform sampler2D tMicro;    // procedural-v3: tiled micro tile: RG micro normal, B specular breakup, A micro cavity
uniform float uMicroTile; uniform float uMicroK;
#endif
uniform vec3 uTeeth; uniform vec3 uGum; uniform vec3 uTongue; uniform vec3 uBag; uniform vec3 uAlbedoGain;
uniform float uMouthOpen; uniform vec3 uMouthFront;
uniform float uFlush; uniform vec3 uCheekL; uniform vec3 uCheekR;
uniform float uSpec;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW; varying float vRegion;

void main() {
  vec3 N = normalize(vNormalW);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uKeyDir);
  int region = int(vRegion + 0.5);
  vec3 col;
  if (region == 0) {
    vec3 albedo = texture2D(tAlbedo, vUv).rgb * uAlbedoGain;
    float cav = 1.0, rough = 0.5, thick = 0.0, ao = 1.0;
#ifdef HAS_PACKED
    vec4 pk = texture2D(tPacked, vUv); cav = pk.r; rough = pk.g; thick = pk.b; ao = pk.a;
#endif
    vec3 Nn = N;
    vec4 dt = vec4(0.0, 0.0, 0.0, 0.0);
#ifdef HAS_DETAIL
    dt = texture2D(tDetail, vUv);
#endif
    float specBreak = 1.0;
#ifdef HAS_NORMAL
    vec3 nts = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
  #ifdef HAS_MICRO
    vec4 mt = texture2D(tMicro, vUv * uMicroTile);
    nts.xy += (mt.xy * 2.0 - 1.0) * uMicroK * dt.a;
    cav *= mix(1.0, mt.a, 0.5 * dt.a);
    specBreak = mix(1.0, 0.45 + 0.9 * mt.b, dt.a);
  #endif
  #ifdef HAS_WRINKLE
    float w = clamp(dot(texture2D(tMaskA, vUv), uWrA) + dot(texture2D(tMaskB, vUv), uWrB), 0.0, 1.0);
    vec3 nw = texture2D(tWrinkle, vUv).xyz * 2.0 - 1.0;
    nts = vec3(nts.xy + nw.xy * w * 1.6, nts.z);
  #endif
  #ifdef HAS_STRETCH
    vec3 ns = texture2D(tWrinkleS, vUv).xyz * 2.0 - 1.0;
    nts = mix(nts, ns, uStretch);
  #endif
    nts.xy *= uNormalScale;
    Nn = normalize(cotangentFrame(N, vWorldPos, vUv) * normalize(nts));
#endif
    float hairK = 1.0;
#ifdef HAIR_LUMA_GATE
    // scalp hair painted into the skin atlas: rim and sheen on those dark texels read as a blue-grey halo
    hairK = smoothstep(0.015, 0.06, dot(albedo, vec3(0.2126, 0.7152, 0.0722)));
#endif
    // emotion flush (delighted, H only): a small red bias on the cheeks
    float ck = exp(-pow(length(vWorldPos - uCheekL) / 0.022, 2.0)) + exp(-pow(length(vWorldPos - uCheekR) / 0.022, 2.0));
    albedo = mix(albedo, albedo * vec3(1.18, 0.86, 0.84), clamp(uFlush * ck, 0.0, 0.04) * 25.0 * 0.04);
#ifdef TIER_LITE
    float wrap = clamp((dot(Nn, L) + 0.3) / 1.3, 0.0, 1.0);
  #ifdef PROFILE_MERGED
    col = albedo * (uKeyColor * wrap + shIrradiance(Nn) + uBounce * smoothstep(-0.15, 0.85, -Nn.y)) * ao;
  #else
    col = albedo * (uKeyColor * wrap + shIrradiance(Nn)) * ao;
  #endif
    col += uRimColor * pow(1.0 - max(dot(Nn, V), 0.0), 4.0) * max(dot(Nn, normalize(uRimDir)), 0.0) * 0.5 * hairK;
#else
    // pre-integrated skin diffuse (Penner 2011): LUT(N.L, curvature), curvature from screen derivatives of the
    // geometric normal (the bumped normal would alias)
    float curv = clamp(length(fwidth(N)) / max(length(fwidth(vWorldPos)), 1e-6) * 0.012, 0.0, 1.0);
    float NoL = dot(Nn, L);
    vec3 diff = texture2D(tLUT, vec2(NoL * 0.5 + 0.5, curv)).rgb;
    col = albedo * (uKeyColor * diff + shIrradiance(Nn) * ao);
    // dual-lobe GGX, cavity-masked (roughness map scaled into the 0.35 / 0.6 lobes)
    vec3 H = normalize(L + V);
    float NoV = max(dot(Nn, V), 1e-4), NoH = max(dot(Nn, H), 0.0), VoH = max(dot(V, H), 0.0);
    float nl = max(NoL, 0.0);
  #ifdef HAS_DETAIL
    rough = mix(rough, 0.28, dt.b * dt.b * uWet);
  #endif
  #ifdef PROFILE_MERGED
    float r1 = clamp(rough * 0.7, 0.12, 0.9), r2 = clamp(rough * 1.2, 0.3, 1.0);
  #else
    float r1 = clamp(rough * 0.7, 0.2, 0.9), r2 = clamp(rough * 1.2, 0.3, 1.0);
  #endif
    float a1 = r1 * r1, a2 = r2 * r2;
    float spec = mix(D_GGX(NoH, a1) * V_SmithJointApprox(NoV, nl, a1), D_GGX(NoH, a2) * V_SmithJointApprox(NoV, nl, a2), 0.15);
    col += uKeyColor * nl * spec * F_Schlick(0.028, VoH) * cav * uSpec * specBreak;
  #ifdef HAS_DETAIL
    float aw = 0.05 * 0.05;
    col += uKeyColor * nl * D_GGX(NoH, aw) * V_SmithJointApprox(NoV, nl, aw) * F_Schlick(0.03, VoH) * dt.b * dt.b * uWet * 0.6;
    float term = clamp(1.0 - abs(NoL - 0.05) * 2.4, 0.0, 1.0);
    col += albedo * uSSSTint * (uKeyColor * term * 0.22 + shIrradiance(Nn) * 0.10) * dt.g * uSSS;
    float fz = pow(1.0 - NoV, 2.4);
    col += dt.r * uFuzz * fz * (uKeyColor * clamp(NoL * 0.6 + 0.4, 0.0, 1.0) * 0.10 + uRimColor * 0.30 + shIrradiance(Nn) * 0.25)
         * mix(vec3(1.0), albedo * 2.2, 0.5);
  #endif
  #ifdef PROFILE_MERGED
    // a warm bounce from below: down-facing skin otherwise reads as a hard grey plate cut at the terminator
    float dnw = smoothstep(-0.15, 0.85, -Nn.y);
    col += albedo * uBounce * dnw * mix(0.6, 1.0, ao);
    col += albedo * uKeyColor * 0.10 * clamp(NoL + 0.35, 0.0, 0.35) * dnw;
  #endif
    // ambient specular sheen + rim (subtle)
    col += shIrradiance(reflect(-V, Nn)) * F_Schlick(0.028, NoV) * 0.35 * ao * cav * mix(0.4, 1.0, hairK);
    col += uRimColor * pow(1.0 - NoV, 3.0) * max(dot(Nn, normalize(uRimDir)), 0.0) * 0.45 * ao * hairK;
  #ifdef TIER_H
    // back-scatter through thin regions (ears, nostrils, lids)
    float bs = pow(clamp(dot(V, -normalize(L + Nn * 0.3)), 0.0, 1.0), 3.0) * thick;
    col += uKeyColor * bs * vec3(0.9, 0.25, 0.12) * 0.35;
  #endif
#endif
  } else {
    // mouth interior: teeth (1, gum weight in the fraction), tongue (2), bag (3). Occlusion from depth behind the lip
    // front AND from how open the jaw is
    float depth = max(0.0, dot(uMouthFront - vWorldPos, vec3(0.0, 0.0, 1.0)));
    float open = clamp(uMouthOpen * 2.2, 0.0, 1.0);
    float occ = mix(0.16, 0.62, open) * exp(-depth / mix(0.008, 0.016, open));
#ifdef PROFILE_MERGED
    if (region == 1) occ = mix(0.34, 0.95, open) * exp(-depth / mix(0.011, 0.022, open));
    if (region == 1) occ = max(occ, mix(0.62, 0.95, open) * exp(-depth / 0.008));
    if (region == 2) occ = max(occ, mix(0.22, 0.55, open) * exp(-depth / 0.03));
#endif
    float gum = clamp((vRegion - 1.0) / 0.45, 0.0, 1.0);
    vec3 alb = region == 1 ? mix(uTeeth, uGum, gum) : (region == 2 ? uTongue : uBag);
    float nl = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    col = alb * (uKeyColor * nl + shIrradiance(N)) * occ;
    if (region == 1) {
      vec3 H = normalize(L + V);
      col += uKeyColor * pow(max(dot(N, H), 0.0), 60.0) * 0.12 * occ * (1.0 - gum);
    }
#ifdef PROFILE_MERGED
    if (region == 3) col = uBag * (0.06 + 0.5 * occ) + uBag * 1.8 * open * exp(-depth / 0.016);
    if (region == 2) col *= mix(1.0, 0.45, smoothstep(0.012, 0.035, depth));
#else
    if (region == 3) col = uBag * (0.15 + 0.5 * occ);
#endif
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ------------------------------------------------------------------ eye (sclera + iris under a cornea, one draw)
const EYE_VERT = SKINNED_VERT_HEAD + /* glsl */ `
uniform vec3 uEyeL; uniform vec3 uEyeR; uniform float uEyeRad;
varying vec3 vLocal;     // bind-space position relative to this eye's centre, in eye radii
varying vec3 vViewL;     // view direction in bind space
varying mat3 vToWorld;
varying float vSide;     // 1 on the +x eye (her left), 0 on the other
void main() {
  vec3 c = position.x > 0.0 ? uEyeL : uEyeR;
  vSide = position.x > 0.0 ? 1.0 : 0.0;
  vLocal = (position - c) / uEyeRad;
` + SKINNED_VERT_BODY + /* glsl */ `
  mat3 R = mat3(modelMatrix);
  #ifdef USE_SKINNING
  R = R * mat3(skinMatrix);
  #endif
  vToWorld = R;
  vViewL = transpose(R) * (cameraPosition - vWorldPos);
}
`;
const EYE_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform vec3 uIris; uniform float uPupil; uniform float uLidShadow; uniform float uIrisDetail;
uniform vec3 uSclera;      // linear sclera albedo (merged eye pass; the iteration-2 default is 0.78 grey)
uniform vec2 uLidClose;    // per eye (L, R): how far the upper lid is down (0 open .. 1 closed), from the rig
#ifdef EYE_TEX
uniform sampler2D tEye;    // a licensed head's photo eye (sclera + iris), sampled instead of the procedural iris
#endif
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW;
varying vec3 vLocal; varying vec3 vViewL; varying mat3 vToWorld; varying float vSide;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 p = vLocal;
  vec3 V = normalize(vViewL);
  vec3 L = normalize(uKeyDir);
  const float RC = 0.693;                      // cornea radius (eye radii), apex at z = 1.07 (build_look.py make_eyes)
  vec3 cc = vec3(0.0, 0.0, 1.07 - RC);
  const float ZI = 0.86;                       // iris plane depth (just behind the limbus at z = 0.878)
  const float IR = 0.47;                       // iris radius (limbus radius 0.48)
  vec3 Nw = normalize(vNormalW);
  vec3 albedo;
  bool cornea = p.z > 0.872;
  vec3 q = p;
  if (cornea) {
    vec3 nc = normalize(p - cc);
    vec3 r = refract(-V, nc, 1.0 / 1.376);
    float t = (ZI - p.z) / min(r.z, -1e-3);
    q = p + r * t;
  }
  float rr = length(q.xy) / IR;
  if (p.z > 0.6 && rr < 1.0) {
    float ang = atan(q.y, q.x);
    float fib = vnoise(vec2(ang * 18.0, rr * 6.0)) * 0.6 + vnoise(vec2(ang * 45.0, rr * 14.0)) * 0.4;
#ifdef PROFILE_MERGED
    float fib2 = vnoise(vec2(ang * 70.0, rr * 3.0));
    vec3 ir = uIris * (1.3 + 1.25 * fib * uIrisDetail + 0.4 * fib2 * uIrisDetail)
            + vec3(0.045, 0.03, 0.016) * smoothstep(0.75, 0.38, rr) * smoothstep(0.2, 0.42, rr) * uIrisDetail;
    ir = mix(ir, vec3(dot(ir, vec3(0.3, 0.5, 0.2))), 0.25);
    ir *= mix(1.0, 0.82, smoothstep(0.55, 0.9, rr));
    ir = mix(ir, uIris * 0.55, smoothstep(0.92, 1.0, rr));
#else
    vec3 ir = uIris * (1.1 + 1.4 * fib * uIrisDetail) + vec3(0.05, 0.03, 0.012) * smoothstep(0.7, 0.35, rr) * uIrisDetail;
    ir = mix(ir, uIris * 0.3, smoothstep(0.86, 1.0, rr));
#endif
    float pup = uPupil * IR;
    albedo = mix(vec3(0.01), ir, smoothstep(pup - 0.02, pup + 0.015, rr * IR));
  } else {
    float ang = atan(p.y, p.x);
    float veins = vnoise(vec2(ang * 30.0, p.z * 20.0)) * smoothstep(0.6, 0.0, p.z) * 0.1;
    float corner = smoothstep(0.35, 0.9, abs(p.x));
#ifdef PROFILE_MERGED
    albedo = mix(uSclera, uSclera * vec3(0.92, 0.72, 0.70), corner) * (1.0 - veins * vec3(0.0, 1.0, 1.0));
#else
    albedo = mix(vec3(0.78, 0.74, 0.70), vec3(0.70, 0.56, 0.54), corner) * (1.0 - veins * vec3(0.0, 1.0, 1.0));
#endif
  }
#ifdef EYE_TEX
  albedo = texture2D(tEye, vUv).rgb;
  cornea = p.z > 0.82;
#endif
  vec3 ncw = normalize(vToWorld * normalize(p - cc));
  vec3 Vw = normalize(cameraPosition - vWorldPos);
  vec3 H = normalize(L + Vw);
  float NoH = max(dot(ncw, H), 0.0);
  float spec = D_GGX(NoH, 0.012) * 0.25;
  float fres = F_Schlick(0.025, max(dot(ncw, Vw), 0.0));
  float nl = clamp(dot(Nw, L) * 0.5 + 0.5, 0.0, 1.0);
#ifdef PROFILE_MERGED
  // the upper lid's shadow follows the lid (a narrow contact band under the margin), the corners keep occlusion
  float lc = vSide > 0.5 ? uLidClose.x : uLidClose.y;
  float lidY = mix(0.62, -0.2, lc);
  float under2 = smoothstep(lidY - 0.22, lidY + 0.02, p.y);
  float ao = mix(1.0, 0.45, under2 * uLidShadow) * mix(1.0, 0.6, smoothstep(0.4, 0.9, abs(p.x)))
           * mix(1.0, 0.75, smoothstep(-0.45, -0.7, p.y) * uLidShadow) * 0.95;
  vec3 col = albedo * (uKeyColor * nl * 0.8 + shIrradiance(Nw)) * ao;
  // the catch-light is a reflection in front of the shadowed iris: only a closing lid hides it
  float lidHide = 1.0 - smoothstep(lidY - 0.05, lidY + 0.02, p.y);
  col += uKeyColor * spec * fres * float(cornea) * 1.6 * lidHide;
  vec3 envDir = normalize(Vw + normalize(uKeyDir) * 0.55 + vec3(0.0, 0.25, 0.0));
  float NoHe = max(dot(ncw, normalize(envDir + Vw)), 0.0);
  col += vec3(1.0, 0.98, 0.95) * D_GGX(NoHe, 0.03) * 0.05 * float(cornea) * lidHide;
  col += shIrradiance(reflect(-Vw, ncw)) * fres * 0.8 * float(p.z > 0.55) * mix(1.0, ao, 0.5);
  float men = smoothstep(-0.62, -0.55, p.y) * (1.0 - smoothstep(-0.55, -0.48, p.y)) * (1.0 - smoothstep(0.55, 0.85, abs(p.x)));
  col += uKeyColor * men * 0.10 * pow(max(dot(normalize(vToWorld * normalize(p)), normalize(L + Vw)), 0.0), 8.0);
  vec3 Nb = normalize(vToWorld * normalize(p));
  float NoHb = max(dot(Nb, H), 0.0);
  col += uKeyColor * D_GGX(NoHb, 0.05 * 0.05) * 0.035 * F_Schlick(0.03, max(dot(Nb, Vw), 0.0)) * ao * float(!cornea);
#else
  float ao = mix(1.0, 0.3, smoothstep(0.25, 0.62, p.y) * uLidShadow) * mix(1.0, 0.55, smoothstep(0.4, 0.85, abs(p.x)))
           * mix(1.0, 0.7, smoothstep(-0.45, -0.7, p.y) * uLidShadow);
  vec3 col = albedo * (uKeyColor * nl * 0.8 + shIrradiance(Nw)) * ao;
  col += uKeyColor * spec * fres * float(cornea) * ao;
  col += shIrradiance(reflect(-Vw, ncw)) * fres * 0.8 * float(p.z > 0.55);
#endif
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ------------------------------------------------------------------ hair + cards (alpha-to-coverage, Kajiya-Kay)
const HAIR_VERT = SKINNED_VERT_HEAD + /* glsl */ `
#ifdef HAS_STRAND
attribute vec3 _strand;
varying vec3 vStrand;
#endif
void main() {` + SKINNED_VERT_BODY + /* glsl */ `
#ifdef HAS_STRAND
  vec3 st = _strand;
  #ifdef USE_SKINNING
  st = mat3(skinMatrix) * st;
  #endif
  vStrand = normalize(mat3(modelMatrix) * st);
#endif
}`;
const PLAIN_VERT = SKINNED_VERT_HEAD + `void main() {` + SKINNED_VERT_BODY + `}`;
const HAIR_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo; uniform float uShift; uniform vec3 uSpecTint; uniform float uKK;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW;
#ifdef HAS_STRAND
varying vec3 vStrand;
#endif
float kk(vec3 T, vec3 H, float e) { float th = dot(T, H); return pow(sqrt(max(1.0 - th * th, 0.0)), e); }
void main() {
  vec4 a = texture2D(tAlbedo, vUv);
  if (a.a < 0.08) discard;
#ifdef PROFILE_MERGED
  a.a = smoothstep(0.12, 0.55, a.a);   // sharpened coverage: no grey dithered veil at the fringe
#endif
  vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uKeyDir);
#ifdef HAS_STRAND
  vec3 T = normalize(vStrand - N * dot(vStrand, N));
#else
  mat3 tbn = cotangentFrame(N, vWorldPos, vUv);
  vec3 T = normalize(tbn[1]);                   // strands run along v
#endif
  vec3 H = normalize(L + V);
  float wrap = clamp((dot(N, L) + 0.5) / 1.5, 0.0, 1.0);
  vec3 col = a.rgb * (uKeyColor * wrap * 0.9 + shIrradiance(N));
  float s1 = kk(normalize(T + N * uShift), H, 90.0);
  float s2 = kk(normalize(T + N * (uShift - 0.25)), H, 22.0);
  col += uKeyColor * wrap * (s1 * 0.22 + s2 * 0.12 * uSpecTint * a.rgb * 4.0) * uKK * smoothstep(0.35, 0.6, a.a);
#ifndef NO_CARD_RIM
  #ifdef PROFILE_MERGED
  col += uRimColor * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.15 * a.rgb * 3.0 * smoothstep(0.4, 0.9, a.a);
  #else
  col += uRimColor * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.15;
  #endif
#endif
  gl_FragColor = vec4(col, a.a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ------------------------------------------------------------------ cloth (wrap diffuse; roughness in albedo alpha)
const CLOTH_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW;
void main() {
  vec4 a = texture2D(tAlbedo, vUv);
  vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uKeyDir);
  float wrap = clamp((dot(N, L) + 0.35) / 1.35, 0.0, 1.0);
  vec3 col = a.rgb * (uKeyColor * wrap + shIrradiance(N));
  vec3 H = normalize(L + V);
  float r = clamp(a.a, 0.2, 1.0); float al = r * r;
  col += uKeyColor * max(dot(N, L), 0.0) * D_GGX(max(dot(N, H), 0.0), al) * V_SmithJointApprox(max(dot(N, V), 1e-4), max(dot(N, L), 0.0), al) * F_Schlick(0.04, max(dot(V, H), 0.0));
  col += uRimColor * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.25;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
const LENS_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW;
void main() {
  vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vWorldPos);
  float f = F_Schlick(0.04, max(dot(N, V), 0.0));
  vec3 H = normalize(normalize(uKeyDir) + V);
  vec3 col = shIrradiance(reflect(-V, N)) * f * 1.5 + uKeyColor * D_GGX(max(dot(N, H), 0.0), 0.02) * f * 0.2;
  gl_FragColor = vec4(col, clamp(f * 2.0 + 0.03, 0.0, 0.6));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// ------------------------------------------------------------------ the pre-integrated skin LUT (Penner 2011)
// 128 x 64: x = N.L * 0.5 + 0.5, y = curvature (0 flat .. 1 = 1/r of ~ 1.2 cm). Diffusion profile: the six-Gaussian
// skin fit of d'Eon & Luebke (GPU Gems 3, ch. 14), integrated around a ring of radius r.
export function makeSkinLUT(W = 128, H = 64): DataTexture {
  const G: [number, [number, number, number]][] = [[0.0064, [0.233, 0.455, 0.649]], [0.0484, [0.1, 0.336, 0.344]], [0.187, [0.118, 0.198, 0]],
    [0.567, [0.113, 0.007, 0.007]], [1.99, [0.358, 0.004, 0]], [7.41, [0.078, 0, 0]]];
  const data = new Uint8Array(W * H * 4);
  const lin2s = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  for (let j = 0; j < H; j++) {
    const curv = Math.max(j / (H - 1), 0.002);
    const r = 12 / (curv * 10 + 0.12); // mm
    for (let i = 0; i < W; i++) {
      const theta = Math.acos(Math.max(-1, Math.min(1, (i / (W - 1)) * 2 - 1)));
      const tot = [0, 0, 0], norm = [0, 0, 0];
      for (let x = -Math.PI / 2; x <= Math.PI / 2; x += Math.PI / 60) {
        const d = Math.abs(2 * r * Math.sin(x / 2));
        const diff = Math.max(0, Math.cos(theta + x));
        for (let c = 0; c < 3; c++) {
          let w = 0;
          for (const [v, rgb] of G) w += (rgb[c] * Math.exp(-(d * d) / (2 * v))) / (2 * Math.PI * v);
          tot[c] += diff * w;
          norm[c] += w;
        }
      }
      for (let c = 0; c < 3; c++) data[(j * W + i) * 4 + c] = Math.round(255 * Math.min(1, lin2s(tot[c] / norm[c])));
      data[(j * W + i) * 4 + 3] = 255;
    }
  }
  const t = new DataTexture(data, W, H, RGBAFormat);
  t.colorSpace = SRGBColorSpace;
  t.magFilter = t.minFilter = LinearFilter;
  t.wrapS = t.wrapT = ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

export interface Lighting {
  toneMapping?: string;
  exposure?: number;
  keyDir: number[];
  keyColor: number[];
  rimDir: number[];
  rimColor: number[];
  sh: number[][];
  bounceColor?: number[];
}

/** The stage light rig when a look carries none (the iteration-2 rig, no bounce). A look's runtime.json "lighting" is
 *  authoritative: its skin albedo is solved against it under Neutral tone mapping at exposure 1 (G9). */
export const LIGHTING: Lighting = {
  toneMapping: "Neutral", exposure: 1.0,
  keyDir: [-0.62, 0.55, 0.62], keyColor: [1.27, 1.24, 1.19],
  rimDir: [0.7, 0.4, -0.6], rimColor: [0.34, 0.37, 0.43],
  sh: [[0.167, 0.167, 0.177], [0.056, 0.056, 0.062], [0.025, 0.025, 0.022], [0, 0, 0]],
};

const v3 = (a: number[]) => new Vector3(a[0] ?? 0, a[1] ?? 0, a[2] ?? 0);
export function lightUniforms(L: Lighting = LIGHTING) {
  return {
    uKeyDir: { value: v3(L.keyDir).normalize() },
    uKeyColor: { value: v3(L.keyColor) },
    uRimDir: { value: v3(L.rimDir).normalize() },
    uRimColor: { value: v3(L.rimColor) },
    uSH: { value: L.sh.map(v3) },
    uBounce: { value: v3(L.bounceColor ?? [0, 0, 0]) },
  };
}

export const SHADERS = { SKIN_VERT, SKIN_FRAG, EYE_VERT, EYE_FRAG, HAIR_VERT, HAIR_FRAG, PLAIN_VERT, CLOTH_FRAG, LENS_FRAG };
