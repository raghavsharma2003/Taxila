// c3: TaxilaToon, the stylised shading path for the VRoid-derived candidate. Same light rig (shaders.js LIGHTING: key
// directional + L1 SH ambient + rim, Neutral tone mapping, exposure 1), same three-injected skinning / morph chunks,
// same uniform names the rig and G9 drive (uAlbedoGain, uMouthOpen, uMouthFront). What differs from TaxilaSkin: the
// key term is a soft two-band ramp toward a warm shade colour (MToon-like) instead of the pre-integrated skin LUT and
// GGX, because the source albedo is painted for cel shading; realistic skin terms on it read as plastic.
const LIGHT_PARS = /* glsl */ `
uniform vec3 uKeyDir; uniform vec3 uKeyColor; uniform vec3 uRimDir; uniform vec3 uRimColor; uniform vec3 uSH[4];
vec3 shIrradiance(vec3 n) { return max(uSH[0] + uSH[1] * n.y + uSH[2] * n.z + uSH[3] * n.x, 0.0); }
uniform float uShadeK; uniform vec3 uShadeTint; uniform float uRampShift; uniform float uRampSoft; uniform float uRimK;
vec3 toonLight(vec3 albedo, vec3 N, vec3 V) {
  float NoL = dot(N, normalize(uKeyDir));
  float lit = smoothstep(uRampShift - uRampSoft, uRampShift + uRampSoft, NoL);
  // shade side: the albedo pushed toward a warm shade colour, never black (cel convention)
  vec3 shade = albedo * uShadeTint * uShadeK;
  vec3 key = mix(shade, albedo, lit) * uKeyColor * (0.55 + 0.45 * max(NoL, 0.0));
  vec3 amb = albedo * shIrradiance(N) * 2.2;
  float NoV = max(dot(N, V), 0.0);
  vec3 rim = uRimColor * pow(1.0 - NoV, 3.0) * max(dot(N, normalize(uRimDir)), 0.0) * uRimK;
  return key + amb + rim * albedo * 2.0;
}
`;
const VERT_HEAD = /* glsl */ `
#include <common>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
attribute float _region;
varying float vRegion;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW;
`;
const VERT_BODY = /* glsl */ `
void main() {
  vUv = uv;
  vRegion = _region;
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
}
`;
const PLAIN_HEAD = VERT_HEAD.replace("attribute float _region;", "");
const PLAIN_BODY = VERT_BODY.replace("vRegion = _region;", "vRegion = 0.0;");

export const TOON_VERT = VERT_HEAD + VERT_BODY;
export const TOON_VERT_PLAIN = PLAIN_HEAD + PLAIN_BODY;

// face: skin (0), teeth (1), tongue (2), mouth bag (3), painted feature (4: eye whites, eyelines, brows)
export const TOON_SKIN_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo; uniform vec3 uAlbedoGain; uniform float uMouthOpen; uniform vec3 uMouthFront;
uniform float uSpec; uniform float uBrowBias; uniform float uChinY; uniform float uNeckShade;
uniform mat4 projectionMatrix;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW; varying float vRegion;
void main() {
  vec3 albedo = texture2D(tAlbedo, vUv).rgb;
  int reg = int(floor(vRegion + 0.5));
  // brows (5) are drawn through the hair fringe: their depth is taken uBrowBias metres toward the camera (anime
  // convention; the fringe otherwise hides every brow expression). Every other fragment keeps its own depth.
  if (reg == 5) {
    vec3 pw = vWorldPos + normalize(cameraPosition - vWorldPos) * uBrowBias;
    vec4 cp = projectionMatrix * viewMatrix * vec4(pw, 1.0);
    gl_FragDepth = clamp(cp.z / cp.w * 0.5 + 0.5, 0.0, 1.0);
    reg = 4;
  } else gl_FragDepth = gl_FragCoord.z;
  if (reg == 0) albedo *= uAlbedoGain;
  vec3 N = normalize(vNormalW);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 col;
  if (reg == 4) {
    // painted features: mostly flat (they are drawn, not sculpted), a little of the key so they sit in the light
    col = albedo * (0.62 + 0.38 * smoothstep(-0.3, 0.4, dot(N, normalize(uKeyDir)))) * 1.02;
  } else if (reg >= 1) {
    // mouth interior: occluded by depth behind the lip line and by how far the jaw is open
    float depth = clamp((uMouthFront.z - vWorldPos.z) / 0.03, 0.0, 1.0);
    float open = clamp(uMouthOpen / 0.45, 0.0, 1.0);
    float occ = mix(0.25, 0.85, open) * mix(1.0, 0.45, depth);
    if (reg == 1) occ *= 1.05;
    col = albedo * occ * (uKeyColor * 0.55 + shIrradiance(N) * 2.0);
  } else {
    col = toonLight(albedo, N, V);
    // a soft chin shadow on the neck (a cel cue for the jaw line; the key alone leaves the neck the face's tone)
    col *= 1.0 - uNeckShade * smoothstep(uChinY + 0.004, uChinY - 0.012, vWorldPos.y) * smoothstep(uChinY - 0.06, uChinY - 0.02, vWorldPos.y);
    // a soft broad sheen on the cheeks / nose bridge only where the key hits (stylised, never wet)
    vec3 H = normalize(normalize(uKeyDir) + V);
    col += uKeyColor * pow(max(dot(N, H), 0.0), 24.0) * uSpec * 0.06;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

// eyes: iris (0, lit softly, darker at the top under the lid) and highlight (1, emissive white)
export const TOON_EYE_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo; uniform float uLidShade;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW; varying float vRegion;
void main() {
  vec3 albedo = texture2D(tAlbedo, vUv).rgb;
  if (vRegion > 0.5) { gl_FragColor = vec4(albedo * 1.15, 1.0); }
  else {
    // the iris texture's top is the lid shadow band in UV v (VRoid paints it); the light adds a soft lift
    vec3 N = normalize(vNormalW); if (!gl_FrontFacing) N = -N;
    vec3 c = albedo * (0.75 + 0.35 * max(dot(N, normalize(uKeyDir)), 0.0)) * uLidShade;
    gl_FragColor = vec4(c, 1.0);
  }
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const TOON_HAIR_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo; uniform float uRing; uniform vec3 uHeadC;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW; varying float vRegion;
void main() {
  vec3 albedo = texture2D(tAlbedo, vUv).rgb;
  vec3 N = normalize(vNormalW); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  vec3 col = toonLight(albedo, N, V);
  // a soft "angel ring" sheen on the crown: view-aligned band on the upper head sphere (stylised hair convention)
  vec3 H = normalize(normalize(uKeyDir) + V);
  float band = pow(max(dot(N, H), 0.0), 18.0) * smoothstep(-0.05, 0.25, N.y);
  col += vec3(0.95, 0.85, 0.75) * band * uRing;
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;

export const TOON_CLOTH_FRAG = /* glsl */ `
precision highp float;
${LIGHT_PARS}
uniform sampler2D tAlbedo;
varying vec2 vUv; varying vec3 vWorldPos; varying vec3 vNormalW; varying float vRegion;
void main() {
  vec3 albedo = texture2D(tAlbedo, vUv).rgb;
  vec3 N = normalize(vNormalW); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorldPos);
  gl_FragColor = vec4(toonLight(albedo, N, V), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`;
