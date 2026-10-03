// TaxilaSkin / TaxilaEye / TaxilaHair / TaxilaCloth / TaxilaLens: one custom shader family (TEACHER-VISUAL §5.4).
// GLSL ES 3.0 through three's ShaderMaterial, so three still injects skinning, morph textures, tone mapping and the
// output colour space. Lighting is ours (key directional + L1 SH ambient + rim), never three's light loop, so the cost
// is fixed and the look does not depend on what else is in the scene.
import * as THREE from "three";

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
uniform float uDebugAlbedo;  // merged: evidence-only unlit albedo view (contact sheet item "albedo close-up"); 0 at runtime
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
    // emotion flush (delighted, H only): a small red bias on the cheeks
    float ck = exp(-pow(length(vWorldPos - uCheekL) / 0.022, 2.0)) + exp(-pow(length(vWorldPos - uCheekR) / 0.022, 2.0));
    albedo = mix(albedo, albedo * vec3(1.18, 0.86, 0.84), clamp(uFlush * ck, 0.0, 0.04) * 25.0 * 0.04);
#ifdef TIER_LITE
    float wrap = clamp((dot(Nn, L) + 0.3) / 1.3, 0.0, 1.0);
    col = albedo * (uKeyColor * wrap + shIrradiance(Nn) + uBounce * smoothstep(-0.15, 0.85, -Nn.y)) * ao;
    col += uRimColor * pow(1.0 - max(dot(Nn, V), 0.0), 4.0) * max(dot(Nn, normalize(uRimDir)), 0.0) * 0.5;
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
    // merged (AD review item 3): squared, so the lid margins (moisture 0.9) stay wet and the lips (0.35) read matte-satin,
    // not the glossy bubblegum lower lip
    rough = mix(rough, 0.28, dt.b * dt.b * uWet);
#endif
    float r1 = clamp(rough * 0.7, 0.12, 0.9), r2 = clamp(rough * 1.2, 0.3, 1.0);
    float a1 = r1 * r1, a2 = r2 * r2;
    float spec = mix(D_GGX(NoH, a1) * V_SmithJointApprox(NoV, nl, a1), D_GGX(NoH, a2) * V_SmithJointApprox(NoV, nl, a2), 0.15);
    col += uKeyColor * nl * spec * F_Schlick(0.028, VoH) * cav * uSpec * specBreak;
#ifdef HAS_DETAIL
    // moisture: a sharp wet glint on the lips and lid margins
    float aw = 0.05 * 0.05;
    col += uKeyColor * nl * D_GGX(NoH, aw) * V_SmithJointApprox(NoV, nl, aw) * F_Schlick(0.03, VoH) * dt.b * dt.b * uWet * 0.6;
    // subsurface tint: blood-red light bleeding past the terminator and into the shadow side (thin, vascular zones)
    float term = clamp(1.0 - abs(NoL - 0.05) * 2.4, 0.0, 1.0);
    col += albedo * uSSSTint * (uKeyColor * term * 0.22 + shIrradiance(Nn) * 0.10) * dt.g * uSSS;
    // peach fuzz (vellus hair): a soft, slightly desaturated forward-scatter sheen at grazing view
    float fz = pow(1.0 - NoV, 2.4);
    col += dt.r * uFuzz * fz * (uKeyColor * clamp(NoL * 0.6 + 0.4, 0.0, 1.0) * 0.10 + uRimColor * 0.30 + shIrradiance(Nn) * 0.25)
         * mix(vec3(1.0), albedo * 2.2, 0.5);
#endif
    // merged iteration 3 (AD review item 6): a warm bounce from below. Down-facing skin (under the chin and jaw, under
    // the nose) got only the cool SH ambient, so the jaw underside read as a hard grey plate cut at the terminator
    float dnw = smoothstep(-0.15, 0.85, -Nn.y);
    col += albedo * uBounce * dnw * mix(0.6, 1.0, ao);
    col += albedo * uKeyColor * 0.10 * clamp(NoL + 0.35, 0.0, 0.35) * dnw;   // a softer terminator there
    // ambient specular sheen + rim (subtle)
    col += shIrradiance(reflect(-V, Nn)) * F_Schlick(0.028, NoV) * 0.35 * ao * cav;
    col += uRimColor * pow(1.0 - NoV, 3.0) * max(dot(Nn, normalize(uRimDir)), 0.0) * 0.45 * ao;
  #ifdef TIER_H
    // back-scatter through thin regions (ears, nostrils, lids)
    float bs = pow(clamp(dot(V, -normalize(L + Nn * 0.3)), 0.0, 1.0), 3.0) * thick;
    col += uKeyColor * bs * vec3(0.9, 0.25, 0.12) * 0.35;
  #endif
#endif
  } else {
    // mouth interior: teeth (1, gum weight in the fraction), tongue (2), bag (3). Occlusion from depth behind the lip
    // front AND from how open the jaw is: a near-closed mouth is dark inside, a wide one lets light onto the front
    // teeth and the tongue tip only (review item 6: flat white teeth, a light-pink interior)
    float depth = max(0.0, dot(uMouthFront - vWorldPos, vec3(0.0, 0.0, 1.0)));
    float open = clamp(uMouthOpen * 2.2, 0.0, 1.0);
    float occ = mix(0.16, 0.62, open) * exp(-depth / mix(0.008, 0.016, open));
    if (region == 1) occ = mix(0.34, 0.95, open) * exp(-depth / mix(0.011, 0.022, open));   // procedural-v3
    // merged (AD review item 10): the front incisors catch light even in a small opening (grey-green "decayed" teeth)
    if (region == 1) occ = max(occ, mix(0.62, 0.95, open) * exp(-depth / 0.008));
    // merged: an open smile reads as a mouth, not a void: the tongue and the back of the mouth keep a floor of soft,
    // warm light (a black interior behind gappy teeth read as a grimace, VERDICT), still darker with depth
    if (region == 2) occ = max(occ, mix(0.22, 0.55, open) * exp(-depth / 0.03));
    float gum = clamp((vRegion - 1.0) / 0.45, 0.0, 1.0);
    vec3 alb = region == 1 ? mix(uTeeth, uGum, gum) : (region == 2 ? uTongue : uBag);
    float nl = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);
    col = alb * (uKeyColor * nl + shIrradiance(N)) * occ;
    if (region == 1) {
      vec3 H = normalize(L + V);
      col += uKeyColor * pow(max(dot(N, H), 0.0), 60.0) * 0.12 * occ * (1.0 - gum);
    }
    // merged (AD review item 10): the mouth bag falls off toward the throat (it was a flat maroon)
    if (region == 3) col = uBag * (0.06 + 0.5 * occ) + uBag * 1.8 * open * exp(-depth / 0.016);
    if (region == 2) col *= mix(1.0, 0.45, smoothstep(0.012, 0.035, depth));
  }
  if (uDebugAlbedo > 0.5 && region == 0) { gl_FragColor = vec4(pow(clamp(texture2D(tAlbedo, vUv).rgb * uAlbedoGain * 0.75, 0.0, 1.0), vec3(1.0 / 2.2)), 1.0); return; }
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
varying float vSide;      // merged: 1 on the +x eye (her left), 0 on the other
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
uniform vec3 uSclera;      // merged: linear sclera albedo, tuned so the rendered sclera / cheek luminance matches the
                           // reference portraits' (identity/refsclera.py: 0.83, warm tint); was a fixed 0.78 grey
uniform vec2 uLidClose;    // merged: per eye (L, R) how far the upper lid is down (0 open .. 1 closed), from the rig
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW;
varying vec3 vLocal; varying vec3 vViewL; varying mat3 vToWorld; varying float vSide;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
vec3 Nb0(vec3 p, mat3 R) { return normalize(R * normalize(p)); }
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
    // dark irises still show lighter radial fibres and a warmer collarette when lit
    // merged (AD review item 4): a readable mid-brown with radial fibres and a lighter amber collarette; the old iris was
    // uIris x 1.1-2.5 with a 0.3 limbal ring from 0.86: a uniformly dark bead with a heavy black outline
    float fib2 = vnoise(vec2(ang * 70.0, rr * 3.0));
    vec3 ir = uIris * (1.3 + 1.25 * fib * uIrisDetail + 0.4 * fib2 * uIrisDetail)
            + vec3(0.045, 0.03, 0.016) * smoothstep(0.75, 0.38, rr) * smoothstep(0.2, 0.42, rr) * uIrisDetail;
    ir = mix(ir, vec3(dot(ir, vec3(0.3, 0.5, 0.2))), 0.25);        // less saturated: amber read as a yellow cat-eye
    ir *= mix(1.0, 0.82, smoothstep(0.55, 0.9, rr));              // darker toward the outer iris, as in a real brown eye
    ir = mix(ir, uIris * 0.55, smoothstep(0.92, 1.0, rr));         // limbal ring: narrower and lighter
    float pup = uPupil * IR;
    albedo = mix(vec3(0.01), ir, smoothstep(pup - 0.02, pup + 0.015, rr * IR));
  } else {
    float ang = atan(p.y, p.x);
    float veins = vnoise(vec2(ang * 30.0, p.z * 20.0)) * smoothstep(0.6, 0.0, p.z) * 0.1;
    // sclera: ~0.78 albedo, warmer and pinker-grey toward the corners (caruncle side), never paper white (item 13)
    float corner = smoothstep(0.35, 0.9, abs(p.x));
    // merged: the sclera takes the reference's tone relative to the skin; the corners keep a pinker, darker caruncle side
    albedo = mix(uSclera, uSclera * vec3(0.92, 0.72, 0.70), corner) * (1.0 - veins * vec3(0.0, 1.0, 1.0));
    albedo = mix(albedo, uIris * 0.3 + 0.55, smoothstep(1.02, 1.12, rr) * smoothstep(1.2, 1.0, rr) * 0.0);
  }
  // lid shadow + corner occlusion (the AO shell, analytically): darker towards the top and the corners
  // the upper lid's shadow covers the top quarter of the visible ball; the lower lid's wet line a thin band
  // merged eye pass: the upper lid's shadow follows the lid (uLidClose: the resting lid sits over the top of the iris),
  // a soft contact band under the lid margin plus the socket's overall occlusion, the lower lid's wet-line band, and
  // darker corners; was a fixed band that left the visible ball brighter than the skin (VERDICT: CG-bright eyes)
  float lc = vSide > 0.5 ? uLidClose.x : uLidClose.y;
  float lidY = mix(0.62, -0.2, lc);                     // ball-local height of the upper lid margin
  float under = smoothstep(lidY - 0.42, lidY + 0.02, p.y);
  // merged (AD review item 4): the contact shadow is a NARROW band under the lid margin (it covered 0.42 r and went to
  // 0.22: the eyes read as dark slits); the corners keep their occlusion
  float under2 = smoothstep(lidY - 0.22, lidY + 0.02, p.y);
  float ao = mix(1.0, 0.45, under2 * uLidShadow) * mix(1.0, 0.6, smoothstep(0.4, 0.9, abs(p.x)))
           * mix(1.0, 0.75, smoothstep(-0.45, -0.7, p.y) * uLidShadow) * 0.95;
  float nl = clamp(dot(Nw, L) * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = albedo * (uKeyColor * nl * 0.8 + shIrradiance(Nw)) * ao;
  // cornea specular: the key light's real reflection (the catch-light) + a soft environment reflection
  vec3 ncw = normalize(vToWorld * normalize(p - cc));
  vec3 Vw = normalize(cameraPosition - vWorldPos);
  vec3 H = normalize(L + Vw);
  float NoH = max(dot(ncw, H), 0.0);
  float spec = D_GGX(NoH, 0.012) * 0.25;
  float fres = F_Schlick(0.025, max(dot(ncw, Vw), 0.0));
  // merged (AD review item 4): the catch-light is NOT occluded by the lid-shadow term (it is a reflection of the light,
  // in front of the shadowed iris); only a closing lid (lc) hides it. Plus a fixed environment catch-light: a soft
  // window up and to the key side, defined relative to the view, so every framing has a live glint
  float lidHide = 1.0 - smoothstep(lidY - 0.05, lidY + 0.02, p.y);
  col += uKeyColor * spec * fres * float(cornea) * 1.6 * lidHide;
  vec3 envDir = normalize(Vw + normalize(uKeyDir) * 0.55 + vec3(0.0, 0.25, 0.0));
  float NoHe = max(dot(ncw, normalize(envDir + Vw)), 0.0);
  col += vec3(1.0, 0.98, 0.95) * D_GGX(NoHe, 0.03) * 0.05 * float(cornea) * lidHide;
  col += shIrradiance(reflect(-Vw, ncw)) * fres * 0.8 * float(p.z > 0.55) * mix(1.0, ao, 0.5);
  // tear meniscus: a thin wet highlight along the lower lid margin
  float men = smoothstep(-0.62, -0.55, p.y) * (1.0 - smoothstep(-0.55, -0.48, p.y)) * (1.0 - smoothstep(0.55, 0.85, abs(p.x)));
  col += uKeyColor * men * 0.10 * pow(max(dot(Nb0(p, vToWorld), normalize(L + Vw)), 0.0), 8.0);
  // wetness: the tear film is a sharp, low-roughness lobe over the whole visible ball (not only the cornea), dimmed under
  // the lid; it is what makes an eye read wet rather than painted
  vec3 Nb = normalize(vToWorld * normalize(p));
  float NoHb = max(dot(Nb, H), 0.0);
  col += uKeyColor * D_GGX(NoHb, 0.05 * 0.05) * 0.035 * F_Schlick(0.03, max(dot(Nb, Vw), 0.0)) * ao * float(!cornea);
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
  // merged iteration 3 (AD review item 7): sharpened coverage. Mip-averaged fibre alpha at the tail's fringe gave a wide
  // band of ~30% coverage, which alpha-to-coverage dithers into a grey, stair-stepped veil against the light backdrop
  a.a = smoothstep(0.12, 0.55, a.a);
  vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 L = normalize(uKeyDir);
#ifdef HAS_STRAND
  // baked root->tip strand direction (export_tier.py): one consistent sign per card, so the shifted highlight does not
  // jump across mirrored UVs (review item 4)
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
  // no highlight on the card fringe: at alpha < 0.5 the edge texels lit as bright lines in profile
  col += uKeyColor * wrap * (s1 * 0.22 + s2 * 0.12 * uSpecTint * a.rgb * 4.0) * uKK * smoothstep(0.35, 0.6, a.a);
  // merged iteration 3 (AD review item 7): the rim is tinted by the fibre colour and faded with coverage. Cards seen
  // edge-on at the silhouette have N.V ~ 0, so a flat blue-grey rim lit every edge card: the grey halo round the tail
  col += uRimColor * pow(1.0 - max(dot(N, V), 0.0), 3.0) * 0.15 * a.rgb * 3.0 * smoothstep(0.4, 0.9, a.a);
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
export function makeSkinLUT(W = 128, H = 64) {
  const G = [[0.0064, [0.233, 0.455, 0.649]], [0.0484, [0.1, 0.336, 0.344]], [0.187, [0.118, 0.198, 0]],
    [0.567, [0.113, 0.007, 0.007]], [1.99, [0.358, 0.004, 0]], [7.41, [0.078, 0, 0]]];
  const data = new Uint8Array(W * H * 4);
  const lin2s = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  for (let j = 0; j < H; j++) {
    const curv = Math.max(j / (H - 1), 0.002);
    const r = 12 / (curv * 10 + 0.12);           // mm
    for (let i = 0; i < W; i++) {
      const theta = Math.acos(Math.max(-1, Math.min(1, (i / (W - 1)) * 2 - 1)));
      const tot = [0, 0, 0], norm = [0, 0, 0];
      for (let x = -Math.PI / 2; x <= Math.PI / 2; x += Math.PI / 60) {
        const d = Math.abs(2 * r * Math.sin(x / 2));
        const diff = Math.max(0, Math.cos(theta + x));
        for (let c = 0; c < 3; c++) {
          let w = 0;
          for (const [v, rgb] of G) w += rgb[c] * Math.exp(-(d * d) / (2 * v)) / (2 * Math.PI * v);
          tot[c] += diff * w;
          norm[c] += w;
        }
      }
      for (let c = 0; c < 3; c++) data[(j * W + i) * 4 + c] = Math.round(255 * Math.min(1, lin2s(tot[c] / norm[c])));
      data[(j * W + i) * 4 + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return t;
}

/** The stage light rig. ONE definition shared by the evidence renders, G9 and src/avatar (runtime.json "lighting"):
 *  the skin albedo is solved against THIS rig under Neutral tone mapping at exposure 1, so a different rig at runtime
 *  re-opens G9. The first build's rig (key 2.05, SH L0 0.27) rendered every look ~23 L* too light (review item 1);
 *  this one is that rig x 0.62, so a white Lambert card facing the camera renders ~0.95 linear. */
export const LIGHTING = {
  toneMapping: "Neutral", exposure: 1.0,
  keyDir: [-0.62, 0.55, 0.62], keyColor: [1.27, 1.24, 1.19],
  rimDir: [0.7, 0.4, -0.6], rimColor: [0.34, 0.37, 0.43],
  sh: [[0.167, 0.167, 0.177], [0.056, 0.056, 0.062], [0.025, 0.025, 0.022], [0, 0, 0]],
  bounceColor: [0.11, 0.075, 0.055],
};
export function lightUniforms(L = LIGHTING) {
  const v = (a) => new THREE.Vector3(...a);
  return {
    uKeyDir: { value: v(L.keyDir).normalize() },
    uKeyColor: { value: v(L.keyColor) },
    uRimDir: { value: v(L.rimDir).normalize() },
    uRimColor: { value: v(L.rimColor) },
    uSH: { value: L.sh.map(v) },
    uBounce: { value: v(L.bounceColor || [0, 0, 0]) },
  };
}

export const SHADERS = { SKIN_VERT, SKIN_FRAG, EYE_VERT, EYE_FRAG, HAIR_VERT, HAIR_FRAG, PLAIN_VERT, CLOTH_FRAG, LENS_FRAG };
