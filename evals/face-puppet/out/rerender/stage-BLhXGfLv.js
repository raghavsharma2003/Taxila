import { a as e, n as t, r as n, t as r } from "./tap-H4GmWvxV.js";
import { a as i, c as a, n as o, o as s, r as c, s as l, t as u } from "./assets-BzZ10phP.js";
import { n as d, r as f, t as p } from "./compositor-cKvOgkxg.js";
//#region src/face-puppet/runtime/gl.js
var m = "#version 300 es\nin vec2 aPos; in vec2 aUv;\nuniform vec2 uView; uniform vec4 uCam; // cam: x0, y0, scale, flipY\nout vec2 vUv; out vec2 vRest;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vUv = aUv;\n}", h = "#version 300 es\nprecision mediump float;\nin vec2 vUv;\nuniform sampler2D uTex; uniform float uAlpha; uniform vec4 uShade; // shade: dirX, x0, x1, amount\nuniform vec4 uRect; // texture rect in rest space (x0,y0,w,h) for shading position\nuniform vec4 uTint; // debug: rgb, amount\nuniform vec2 uNose; // r6: turn side (+1 / -1), amount 0..1 (face layer only)\nout vec4 o;\nvoid main(){\n  vec4 c = texture(uTex, vUv);\n  float x = uRect.x + vUv.x * uRect.z;\n  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);\n  s = uShade.x > 0.0 ? s : 1.0 - s;\n  c.rgb *= 1.0 - uShade.w * s * s;\n  if (uNose.y > 0.0) {\n    // r6 (judge r5 fix 4, turn): the nose's side planes. On a turn the far flank of the bridge falls into shadow and the\n    // near flank catches light (the painted three-quarter keys); rest-space texel position, so it rides with the nose\n    float y = uRect.y + vUv.y * uRect.w;\n    float far = exp(-pow((x - 532.0 - uNose.x * 15.0) / 7.0, 2.0) - pow((y - 528.0) / 17.0, 2.0));\n    float nr = exp(-pow((x - 532.0 + uNose.x * 9.0) / 5.5, 2.0) - pow((y - 508.0) / 22.0, 2.0));\n    c.rgb *= 1.0 - 0.11 * uNose.y * far + 0.06 * uNose.y * nr;\n  }\n  c.rgb = mix(c.rgb, uTint.rgb * c.a, uTint.a);\n  o = c * uAlpha;\n}", g = "#version 300 es\nin vec2 aPos; in vec2 aRest; in float aEdge; in float aTop;\nuniform vec2 uView; uniform vec4 uCam;\nout vec2 vRest; out float vEdge; out float vTop; out vec2 vScr;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vRest = aRest; vEdge = aEdge; vTop = aTop; vScr = aPos;\n}", _ = "#version 300 es\nprecision highp float;\nin vec2 vRest; in float vEdge; in float vTop; in vec2 vScr;\nuniform vec2 uIrisScr; uniform vec2 uCatchScr; uniform float uIrisK; uniform vec2 uCatchC;\nuniform sampler2D uSclera; uniform vec4 uScleraRect;\nuniform sampler2D uIris; uniform vec4 uIrisRect;\nuniform sampler2D uCatch; uniform vec4 uCatchRect;\nuniform vec2 uIrisOff; uniform vec2 uIrisC; uniform vec2 uIrisScale; uniform vec2 uCatchOff; uniform float uCatchA;\nuniform float uLidShade; uniform float uTopY;\nout vec4 o;\nvec4 tex(sampler2D t, vec4 r, vec2 p){\n  vec2 uv = (p - r.xy) / r.zw;\n  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);\n  return texture(t, uv);\n}\nvoid main(){\n  vec4 s = tex(uSclera, uScleraRect, vRest);\n  vec3 col = s.a > 0.0 ? s.rgb / s.a : vec3(0.95);\n  // r3: the iris and the catchlight are placed in SCREEN space and scaled uniformly: they translate with the gaze and\n  // the turn but never squash anisotropically (r2's far eye at yaw 20 became a vertical oval)\n  vec2 ip = uIrisC + (vScr - uIrisScr) / (uIrisK * uIrisScale);\n  vec4 ir = tex(uIris, uIrisRect, ip);\n  col = col * (1.0 - ir.a) + ir.rgb;\n  // lid shadow: the band right under the upper lid darkens a little (wraps the eye)\n  // r2: per-column lid line (vTop), a soft wrap shadow ~10 px deep under the whole lid, as in c-front\n  float dl = clamp((vRest.y - vTop - 2.0) / 9.0, 0.0, 1.0);\n  col *= 1.0 - uLidShade * (1.0 - dl) * (1.0 - dl);\n  vec4 cl = tex(uCatch, uCatchRect, uCatchC + (vScr - uCatchScr) / uIrisK);\n  col = mix(col, vec3(1.0), cl.a * uCatchA);\n  float a = clamp(vEdge, 0.0, 1.0);\n  o = vec4(col * a, a);\n}", v = "#version 300 es\nin vec2 aPos; in vec2 aUv; in float aA; in float aL; in float aT; in float aE;\nuniform vec2 uView; uniform vec4 uCam;\nout vec2 vUv; out float vA; out float vL; out float vT; out float vE;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vUv = aUv; vA = aA; vL = aL; vT = aT; vE = aE;\n}", y = "#version 300 es\nprecision mediump float;\nin vec2 vUv; in float vA; in float vL; in float vT; in float vE;\nuniform sampler2D uTex; uniform vec4 uShade; uniform vec4 uRect; uniform float uEdgeAA;\nout vec4 o;\nvoid main(){\n  vec4 c = texture(uTex, vUv);\n  float x = uRect.x + vUv.x * uRect.z;\n  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);\n  s = uShade.x > 0.0 ? s : 1.0 - s;\n  c.rgb *= (1.0 - uShade.w * s * s) * vL;\n  // r6: an open lower lip is a saturated, lit volume (c-happy / c-talking), not the closed lip's pale band\n  c.rgb *= mix(vec3(1.0), vec3(1.03, 0.88, 0.86), vT);\n  // r6: the lip sheets' inner edge (row 0) is their polygon boundary; where the lips barely part it stays opaque and,\n  // on a steep stretch (an open corner, a turn's far side), aliased into a stair. One screen pixel of coverage ramp.\n  float ea = mix(1.0, clamp(vE / max(fwidth(vE), 1e-3), 0.0, 1.0), uEdgeAA);   // uEdgeAA: 0 closed (c-front's own lip line) .. 1 open\n  o = c * vA * ea;\n}", b = "#version 300 es\nin vec2 aPos; in float aS; in float aDT; in float aGap;\nuniform vec2 uView; uniform vec4 uCam;\nout float vS; out float vDT; out float vGap;\nvoid main(){\n  vec2 p = (aPos - uCam.xy) * uCam.z;\n  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);\n  vS = aS; vDT = aDT; vGap = aGap;\n}", x = "#version 300 es\nprecision highp float;\nin float vS; in float vDT; in float vGap;\nuniform sampler2D uTex;\nuniform vec4 uTeeth;   // upper shown 0..1, lower shown 0..1, teeth height px, -\nuniform vec4 uTongue;  // body height share, tip, curl, -\nuniform float uShadeK;\nuniform float uOver;   // r5: 1 = the f/v overlay pass: only the upper teeth tips, drawn OVER the tucked lower lip\nuniform float uExt;    // r6: how far the strip reaches below the lower inner edge (px)\nout vec4 o;\nvec3 rowc(float row, float u){ vec4 c = texture(uTex, vec2(u, (row + 0.5) / 64.0)); return c.rgb / max(c.a, 0.001); }\n// r4 (judge r3 fix 2): the teeth's free edge is the PAINTED contour's smooth fit (rows 12.9 - 2.7u^2 - 0.3u^4 of the\n// 16-row strip, interior-r4.py), drawn with an analytic coverage ramp one screen pixel wide: no ragged alpha, no shimmer\nfloat contourRows(float u){ return 12.9 - 2.7 * u * u - 0.3 * u * u * u * u; }\nvoid main(){\n  float gap = max(vGap, 0.001);\n  float dt = vDT, db = gap - vDT;\n  if (uOver > 0.5) {\n    // r5 (judge r4: f/v): the upper incisors rest ON the rolled-in lower lip; below the lower inner edge only the teeth\n    // r6: only the incisors (half-width uTeeth.w), and a soft shadow line the teeth cast on the lip right under their tips\n    float aO = abs(vS), uwO = uTeeth.w > 0.0 ? uTeeth.w : 0.76;\n    if (dt < gap - 0.5 || aO > uwO) discard;\n    float crO = contourRows(vS / uwO);\n    float hO = uTeeth.z * crO / 12.0 - (1.0 - uTeeth.x) * uTeeth.z;\n    float pxO = max(fwidth(vDT), 0.35);\n    float side = 1.0 - smoothstep(uwO - 0.16, uwO, aO);\n    float covO = clamp((hO - dt) / pxO + 0.5, 0.0, 1.0) * side * smoothstep(gap - 0.5, gap + 0.8, dt);\n    vec3 tO = rowc(clamp((dt + (1.0 - uTeeth.x) * uTeeth.z) * 12.0 / uTeeth.z, 0.0, crO - 2.5), clamp((vS / uwO) * 0.5 + 0.5, 0.0, 1.0)) * 1.08 * (1.0 - 0.3 * pow(aO / uwO, 2.0));\n    tO *= 1.0 - 0.12 * clamp(1.0 - (hO - dt) / 1.8, 0.0, 1.0);\n    float shd = 0.42 * side * (1.0 - smoothstep(hO, hO + 3.2, dt)) * step(hO - 0.5, dt) * smoothstep(gap - 0.5, gap + 1.5, dt);\n    float aOut = covO + shd * (1.0 - covO);\n    o = vec4(tO * uShadeK * covO, aOut);\n    return;\n  }\n  float a = abs(vS);\n  float u = clamp(vS * 0.5 + 0.5, 0.0, 1.0);\n  float px = max(fwidth(vDT), 0.35);          // one screen pixel in rest px\n  // cavity: roof (dark) to floor\n  vec3 col = rowc(32.0 + clamp(dt / gap, 0.0, 1.0) * 15.0, u);\n  col = col * 1.22 + vec3(0.035, 0.012, 0.01);   // r4: the refs' cavity is a warm brown, not a black-maroon hole\n  col *= 1.0 - 0.28 * uTongue.y;                  // r5: a deeper cavity behind a raised tip (contrast for the lobe)\n  col *= 1.0 - 0.35 * pow(a, 3.0);\n  // r6 (judge r5 fix 2): inner occlusion. The cavity is deepest right under the upper lip and at the corners and lifts\n  // toward the tongue (the refs' warm-brown gradient), instead of one flat red fill inside a hard cut-out\n  float occT = 1.0 - smoothstep(0.0, max(6.0, 0.42 * gap), dt);\n  col *= 1.0 - 0.34 * occT * occT - 0.18 * smoothstep(0.55, 0.98, a);\n  col *= 0.94 + 0.10 * smoothstep(0.25, 0.9, dt / gap);\n  // ---- tongue: body mound on the floor; tip = a rounded LOBE that rises to the upper teeth (t d n l); curl = the\n  // retroflex underside up at the palate\n  float th = uTeeth.z, rp = 12.0 / th;\n  float upVis = th * uTeeth.x * contourRows(0.0) / 12.0;          // upper teeth hanging at the centre (px)\n  // r5 (judge r4: 'the L tongue tip is barely visible'): while the tip is up the floor mound drops away, so the lobe\n  // stands alone against a dark cavity on both sides and reads as a tongue tip, not as a second lower lip\n  // r6: the resting tongue is a rounded MOUND in the middle of the floor (c-talking), dark cavity on both sides; r5's\n  // full-width band at the lip's own width read as a second, translucent lower lip (judge r5, zoom-surprise)\n  float mound = min(gap * uTongue.x * 0.9, 4.5 + 0.075 * gap) * pow(max(0.0, 1.0 - pow(vS / 0.58, 2.0)), 0.55) * (1.0 - 0.85 * clamp(uTongue.y * 1.4, 0.0, 1.0));\n  float lw = 0.38;                                                // lobe half-width (s units)\n  float lob = max(0.0, 1.0 - pow(vS / lw, 2.0));\n  // r4b: a soft DOME (wider at the base), not a flat-sided tombstone\n  float tipH = max(0.0, gap - upVis * 0.35) * uTongue.y * pow(lob, 0.85);\n  float curl = gap * 0.78 * uTongue.z * exp(-pow(vS / 0.3, 2.0));\n  float h = max(mound, max(tipH, curl));\n  if (h > 0.4) {\n    // r6: the mound's edge is a soft ~3 px rolloff (it was a 1 px vector edge with a dark contact line); the lobe keeps\n    // a crisper edge so the tongue tip still reads at 1x\n    float soft = uTongue.y > 0.3 ? 1.0 : 3.0;\n    float cov = smoothstep(-0.5 * soft, 0.5 * soft + px, h - db);\n    bool isTip = tipH >= max(mound, curl) - 0.01 && uTongue.y > 0.05;\n    // r4b: the lobe samples the strip near its centre (the strip's column texture showed as vertical stripes on it)\n    vec3 t = rowc(48.0 + clamp(1.0 - db / max(h, 0.5), 0.0, 1.0) * 15.0, isTip ? 0.5 + vS * 0.15 : u);\n    // r4b: a pink-red tongue, distinct from the orange lip (it read as a second lower lip)\n    t *= 0.86 * vec3(1.0, 0.80, 0.86) * (1.0 - 0.3 * pow(a / 0.8, 2.0));\n    // r6: a soft pink mound lit from above (c-talking), no dark rim along its crest\n    t = mix(t, vec3(0.84, 0.47, 0.47), 0.5);\n    t *= mix(0.97, 1.07, smoothstep(0.0, 0.8 * max(h, 0.5), h - db));\n    t *= mix(1.0, 0.8, smoothstep(30.0, 70.0, gap));   // a tall opening (surprise): the tongue lies low, in shadow\n    // r8: ... and stays WARM in that shadow (the pink x 0.8 read lilac-grey at the bottom of the surprise O at full size)\n    t = mix(t, t * vec3(1.1, 0.92, 0.8), smoothstep(30.0, 70.0, gap));\n    if (isTip) {\n      // r5: a saturated pink lobe, lighter than the cavity and redder than the orange lip\n      t = mix(t, vec3(0.80, 0.40, 0.44), 0.55);\n      // the lobe: lit on top, a soft groove down its middle, shadowed where it meets the cavity at the sides\n      // r4b: rounded like the Memoji shading: cylindrical falloff to the sides, a soft lit crown, a faint groove\n      float top = clamp((h - db) / 4.0, 0.0, 1.0);\n      t *= mix(1.08, 1.0, top) * mix(0.84, 1.03, sqrt(lob)) * (1.0 - 0.04 * exp(-pow(vS / 0.06, 2.0)) * top);\n    }\n    if (curl > max(mound, tipH) - 0.01 && uTongue.z > 0.05) {\n      vec3 under = t * vec3(0.72, 0.62, 0.68);\n      t = mix(under, t * 1.08, 1.0 - smoothstep(0.0, 1.4, h - db));\n    }\n    // a contact shadow just outside the tongue's edge keeps it legible against the cavity at 1x\n    col *= 1.0 - (0.08 + 0.45 * uTongue.y) * clamp(1.0 - abs(h - db) / 3.5, 0.0, 1.0) * (1.0 - cov);\n    col = mix(col, t, cov);\n  }\n  // ---- lower teeth (bottom-anchored on the lower lip), then upper teeth (hang from the upper lip, slide up as they hide)\n  float lwT = 0.52, uwT = 0.76;\n  // r8 (judge r7 fix 3, grok 'too white and square'): on a laughing D-mouth (uTeeth.w = joy in this pass) the teeth row is\n  // ~8% dimmer and its ends ROUND off (the free edge rises toward the corners and the side fade widens)\n  float joyT = uTeeth.w, dimT = 1.0 - 0.08 * joyT;\n  float gapT = smoothstep(1.5, 4.0, gap);   // no teeth through a 1-2 px slit (it showed as a dotted sliver)     // the rows are narrower than the lip span: the corners recede into shadow\n  if (a < lwT && uTeeth.y > 0.01) {\n    float ul = clamp((vS / lwT) * 0.5 + 0.5, 0.0, 1.0);\n    float hL = th * 0.8 * smoothstep(0.2, 0.5, uTeeth.y) * (contourRows(vS / lwT) - joyT * 4.0 * pow(a / lwT, 3.0)) / 12.0;       // visible height above the lower lip\n    float cov = clamp((hL - db) / px + 0.5, 0.0, 1.0) * (1.0 - smoothstep(lwT - 0.12 - 0.1 * joyT, lwT, a)) * gapT;\n    float row = 31.0 - clamp(db * rp, 0.0, contourRows(vS / lwT) - 2.5);\n    vec3 lt = rowc(row, ul) * dimT * (1.0 - 0.3 * pow(a / lwT, 2.0)) * vec3(1.12, 1.09, 1.04) * mix(vec3(1.0), vec3(0.8, 0.7, 0.64), uTongue.w);   // r5: the lower row read grey beside the upper one\n    col = mix(col, lt, cov);\n  }\n  if (a < uwT && uTeeth.x > 0.01) {\n    float uu = clamp((vS / uwT) * 0.5 + 0.5, 0.0, 1.0);\n    float cr = contourRows(vS / uwT) - joyT * 4.5 * pow(a / uwT, 3.0);\n    float hU = th * cr / 12.0 - (1.0 - uTeeth.x) * th;                 // visible height below the upper lip\n    float cov = clamp((hU - dt) / px + 0.5, 0.0, 1.0) * (1.0 - smoothstep(uwT - 0.14 - 0.12 * joyT, uwT, a)) * gapT;\n    float row = clamp((dt + (1.0 - uTeeth.x) * th) * rp, 0.0, cr - 2.5);\n    vec3 ut = rowc(row, uu) * 1.08 * dimT * (1.0 - 0.3 * pow(a / uwT, 2.0) - 0.06 * joyT * pow(a / uwT, 2.0)) * mix(vec3(1.0), vec3(0.88, 0.78, 0.72), uTongue.w);   // r6: dim (ch funnel shadow, warm)\n    // the free edge catches a whisper of shadow (painted teeth have it), inside the coverage ramp only\n    ut *= 1.0 - 0.08 * clamp(1.0 - (hU - dt) / 1.6, 0.0, 1.0);\n    col = mix(col, ut, cov);\n  }\n  // the upper lip's shadow on whatever sits right under it; r6: a soft 2 px rim on BOTH inner edges (the lips roll in),\n  // so the cavity never reads as a crisp cut-out against the lip\n  col *= mix(0.72, 1.0, smoothstep(0.0, 3.0, dt));\n  col *= mix(0.80, 1.0, smoothstep(0.0, 2.2, db));\n  // r4b: a near-closed seam is the lip LINE (dark warm brown), fully opaque from gap 0.8 px, so the face layer never\n  // leaks through between the lip sheet's fading inner row and the interior (it showed as orange dots per mesh column)\n  col = mix(vec3(0.36, 0.17, 0.13), col, smoothstep(1.2, 3.5, gap));\n  // r6: screen-space AA of the cavity's END: near the corners the gap grows ~8 px per strip column, and on a turn's far\n  // side a column is ~1.5 screen px, so a fixed 0.55 px ramp became a sub-pixel stair; the ramp now spans >= 1.2 screen px\n  float al = clamp((gap - 0.25) / max(0.55, 1.2 * fwidth(vGap)), 0.0, 1.0);        // zero-gap columns (past the corners) still draw nothing\n  // r6: the strip's own top / bottom boundaries (2 px above the upper inner edge, uExt px below the lower one) are\n  // polygon edges, normally under the lips; where the lips taper to nothing at a corner (a turn's far side) they showed\n  // as a hard stair. One screen pixel of coverage ramp on both.\n  float fw = max(fwidth(vDT), 0.05);\n  al *= clamp((vDT + 2.0) / fw, 0.0, 1.0) * clamp((gap + uExt - vDT) / fw, 0.0, 1.0);\n  o = vec4(col * uShadeK * al, al);\n}";
function S(e, t, n) {
	let r = e.createProgram();
	for (let [i, a] of [[e.VERTEX_SHADER, t], [e.FRAGMENT_SHADER, n]]) {
		let t = e.createShader(i);
		if (e.shaderSource(t, a), e.compileShader(t), !e.getShaderParameter(t, e.COMPILE_STATUS)) throw Error(e.getShaderInfoLog(t));
		e.attachShader(r, t);
	}
	if (e.linkProgram(r), !e.getProgramParameter(r, e.LINK_STATUS)) throw Error(e.getProgramInfoLog(r));
	let i = {}, a = e.getProgramParameter(r, e.ACTIVE_UNIFORMS);
	for (let t = 0; t < a; t++) {
		let n = e.getActiveUniform(r, t);
		i[n.name] = e.getUniformLocation(r, n.name);
	}
	return {
		p: r,
		u: i
	};
}
var C = class {
	constructor(e, { clear: t = [
		.98,
		.9,
		.74
	], preserve: n = !1 } = {}) {
		let r = e.getContext("webgl2", {
			alpha: !1,
			antialias: !1,
			premultipliedAlpha: !0,
			preserveDrawingBuffer: n,
			powerPreference: "high-performance"
		});
		if (!r) throw Error("WebGL2 unavailable");
		this.gl = r, this.canvas = e, this.clear = t, this.paint = S(r, m, h), this.eye = S(r, g, _), this.lip = S(r, v, y), this.inner = S(r, b, x), r.enable(r.BLEND), r.blendFunc(r.ONE, r.ONE_MINUS_SRC_ALPHA), r.disable(r.DEPTH_TEST), this.cam = [
			0,
			0,
			1,
			0
		], this.draws = 0, this.tris = 0;
	}
	texture(e, t = !0) {
		let n = this.gl, r = n.createTexture();
		return n.bindTexture(n.TEXTURE_2D, r), n.pixelStorei(n.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !0), n.texImage2D(n.TEXTURE_2D, 0, n.RGBA, n.RGBA, n.UNSIGNED_BYTE, e), t && n.generateMipmap(n.TEXTURE_2D), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MIN_FILTER, t ? n.LINEAR_MIPMAP_LINEAR : n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_MAG_FILTER, n.LINEAR), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_S, n.CLAMP_TO_EDGE), n.texParameteri(n.TEXTURE_2D, n.TEXTURE_WRAP_T, n.CLAMP_TO_EDGE), r;
	}
	mesh(e, t, n) {
		let r = this.gl, i = r.createVertexArray();
		r.bindVertexArray(i);
		let a = {};
		for (let [n, { data: i, size: o, dynamic: s }] of Object.entries(t)) {
			let t = r.getAttribLocation(e.p, n), c = r.createBuffer();
			r.bindBuffer(r.ARRAY_BUFFER, c), r.bufferData(r.ARRAY_BUFFER, i, s ? r.DYNAMIC_DRAW : r.STATIC_DRAW), t >= 0 && (r.enableVertexAttribArray(t), r.vertexAttribPointer(t, o, r.FLOAT, !1, 0, 0)), a[n] = c;
		}
		let o = r.createBuffer();
		return r.bindBuffer(r.ELEMENT_ARRAY_BUFFER, o), r.bufferData(r.ELEMENT_ARRAY_BUFFER, n, r.STATIC_DRAW), r.bindVertexArray(null), {
			vao: i,
			bufs: a,
			count: n.length
		};
	}
	update(e, t, n) {
		let r = this.gl;
		r.bindBuffer(r.ARRAY_BUFFER, e.bufs[t]), r.bufferSubData(r.ARRAY_BUFFER, 0, n);
	}
	begin() {
		let e = this.gl, t = this.dpr || 1, n = Math.round(this.canvas.clientWidth * t), r = Math.round(this.canvas.clientHeight * t);
		(this.canvas.width !== n || this.canvas.height !== r) && (this.canvas.width = n, this.canvas.height = r), e.viewport(0, 0, this.canvas.width, this.canvas.height), e.clearColor(this.clear[0], this.clear[1], this.clear[2], 1), e.clear(e.COLOR_BUFFER_BIT), this.draws = 0, this.tris = 0;
	}
	setCam(e, t, n) {
		this.cam = [
			e,
			t,
			this.canvas.width / n,
			0
		];
	}
	drawPaint(e, t, n, r = 1, i = [
		1,
		0,
		1,
		0
	], a = null, o = null) {
		if (r <= .001) return;
		let s = this.gl, c = this.paint;
		s.useProgram(c.p), s.uniform2fv(c.u.uNose, o || [0, 0]), s.uniform4fv(c.u.uTint, a || [
			0,
			0,
			0,
			0
		]), s.uniform2f(c.u.uView, this.canvas.width, this.canvas.height), s.uniform4fv(c.u.uCam, this.cam), s.uniform1f(c.u.uAlpha, r), s.uniform4fv(c.u.uShade, i), s.uniform4f(c.u.uRect, n[0], n[1], n[2] - n[0], n[3] - n[1]), s.activeTexture(s.TEXTURE0), s.bindTexture(s.TEXTURE_2D, t), s.uniform1i(c.u.uTex, 0), s.bindVertexArray(e.vao), s.drawElements(s.TRIANGLES, e.count, s.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
	drawLip(e, t, n, r = [
		1,
		0,
		1,
		0
	], i = 0) {
		let a = this.gl, o = this.lip;
		a.useProgram(o.p), a.uniform1f(o.u.uEdgeAA, i), a.uniform2f(o.u.uView, this.canvas.width, this.canvas.height), a.uniform4fv(o.u.uCam, this.cam), a.uniform4fv(o.u.uShade, r), a.uniform4f(o.u.uRect, n[0], n[1], n[2] - n[0], n[3] - n[1]), a.activeTexture(a.TEXTURE0), a.bindTexture(a.TEXTURE_2D, t), a.uniform1i(o.u.uTex, 0), a.bindVertexArray(e.vao), a.drawElements(a.TRIANGLES, e.count, a.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
	drawInner(e, t, n, r, i = 1, a = 0, o = 2) {
		let s = this.gl, c = this.inner;
		s.useProgram(c.p), s.uniform1f(c.u.uExt, o), s.uniform1f(c.u.uOver, a), s.uniform2f(c.u.uView, this.canvas.width, this.canvas.height), s.uniform4fv(c.u.uCam, this.cam), s.uniform4fv(c.u.uTeeth, n), s.uniform4fv(c.u.uTongue, r), s.uniform1f(c.u.uShadeK, i), s.activeTexture(s.TEXTURE0), s.bindTexture(s.TEXTURE_2D, t), s.uniform1i(c.u.uTex, 0), s.bindVertexArray(e.vao), s.drawElements(s.TRIANGLES, e.count, s.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
	drawEye(e, t) {
		let n = this.gl, r = this.eye;
		n.useProgram(r.p), n.uniform2f(r.u.uView, this.canvas.width, this.canvas.height), n.uniform4fv(r.u.uCam, this.cam);
		let i = (e, t, i, a, o) => {
			n.activeTexture(n.TEXTURE0 + e), n.bindTexture(n.TEXTURE_2D, i), n.uniform1i(r.u[t], e), n.uniform4f(r.u[o], a[0], a[1], a[2] - a[0], a[3] - a[1]);
		};
		i(0, "uSclera", t.sclera.tex, t.sclera.rect, "uScleraRect"), i(1, "uIris", t.iris.tex, t.iris.rect, "uIrisRect"), i(2, "uCatch", t.catch.tex, t.catch.rect, "uCatchRect"), n.uniform2fv(r.u.uIrisC, t.irisC), n.uniform2fv(r.u.uIrisScale, t.irisScale), n.uniform2fv(r.u.uIrisScr, t.irisScr), n.uniform2fv(r.u.uCatchScr, t.catchScr), n.uniform2fv(r.u.uCatchC, t.catchC), n.uniform1f(r.u.uIrisK, t.irisK), n.uniform1f(r.u.uCatchA, t.catchA), n.uniform1f(r.u.uLidShade, t.lidShade), n.uniform1f(r.u.uTopY, t.topY), n.bindVertexArray(e.vao), n.drawElements(n.TRIANGLES, e.count, n.UNSIGNED_SHORT, 0), this.draws++, this.tris += e.count / 3;
	}
}, w = (e, t, n) => e < t ? t : e > n ? n : e, T = (e) => w(e, 0, 1), E = (e, t, n) => {
	let r = T((n - e) / (t - e));
	return r * r * (3 - 2 * r);
}, D = 448, O = [
	585,
	584,
	584,
	587,
	589,
	592,
	594,
	596,
	597,
	599,
	600,
	601,
	602,
	603,
	604,
	604,
	605,
	605,
	606,
	606,
	606,
	606,
	606,
	605,
	605,
	604,
	603,
	602,
	601,
	600,
	598,
	597,
	596,
	594,
	592,
	589,
	587,
	584,
	580,
	576,
	576,
	575
], k = {
	cx: 530,
	hwL: 69,
	hwR: 71,
	tU: 13.5,
	tL: 21,
	cy: 606
};
function A(e) {
	let t = (e - D) / 4;
	if (t <= 0) return O[0];
	if (t >= O.length - 1) return O[O.length - 1];
	let n = Math.floor(t), r = t - n;
	return O[n] * (1 - r) + O[n + 1] * r;
}
var j = A(k.cx + 4), M = (e) => (e - k.cx) / (e < k.cx ? k.hwL : k.hwR), ee = (e) => e >= 1 ? 0 : k.tU * (1 - e * e) ** .55, te = (e) => e >= 1 ? 0 : k.tL * Math.max(0, 1 - e ** 2.2) ** .75, N = {
	g: 0,
	up: .3,
	W: 1,
	flat: 0,
	round: 0,
	press: 0,
	T: .7,
	TL: .15,
	th: .25,
	tip: 0,
	curl: 0,
	tuck: 0,
	sm: .55,
	pout: 0,
	sq: 0,
	ring: 0,
	dim: 0
}, ne = {
	viseme_sil: {
		...N,
		sm: 1
	},
	viseme_PP: {
		...N,
		W: .9,
		flat: .5,
		press: 1,
		T: 0,
		sm: .6
	},
	viseme_FF: {
		...N,
		g: 17,
		up: 1,
		W: .72,
		flat: .9,
		T: 1,
		TL: 0,
		tuck: 1,
		th: 0,
		sm: 0
	},
	viseme_TH: {
		...N,
		g: 14,
		up: .35,
		W: 1,
		T: .8,
		TL: .5,
		tip: 1,
		th: .1,
		sm: .45
	},
	viseme_DD: {
		...N,
		g: 26,
		up: .3,
		W: .88,
		flat: .55,
		T: .35,
		TL: 0,
		tip: 1,
		th: .05,
		sm: .2
	},
	viseme_kk: {
		...N,
		g: 19,
		up: .3,
		W: .96,
		T: .65,
		TL: .15,
		th: .72,
		sm: .5
	},
	viseme_CH: {
		...N,
		g: 23,
		up: .5,
		W: .62,
		flat: 1,
		round: .35,
		sq: 1,
		pout: 1.25,
		T: 1,
		TL: 1,
		sm: 0
	},
	viseme_SS: {
		...N,
		g: 6,
		up: .45,
		W: 1.06,
		T: 1,
		TL: 1,
		sm: .5
	},
	viseme_nn: {
		...N,
		g: 26,
		up: .3,
		W: .88,
		flat: .55,
		T: .35,
		TL: 0,
		tip: 1,
		th: .05,
		sm: .2
	},
	viseme_RR: {
		...N,
		g: 12,
		up: .35,
		W: .82,
		flat: .5,
		round: .55,
		T: .5,
		TL: .15,
		tip: .5,
		sm: .4
	},
	viseme_aa: {
		...N,
		g: 48,
		up: .2,
		W: 1,
		flat: .6,
		round: .25,
		T: .85,
		TL: .15,
		th: .35,
		sm: .35
	},
	viseme_E: {
		...N,
		g: 17,
		up: .35,
		W: 1.1,
		T: 1,
		TL: .55,
		sm: .75
	},
	viseme_I: {
		...N,
		g: 9,
		up: .4,
		W: 1.08,
		T: 1,
		TL: .75,
		sm: .7
	},
	viseme_O: {
		...N,
		g: 30,
		up: .4,
		W: .64,
		flat: .92,
		round: 1,
		T: .12,
		TL: 0,
		sm: .28,
		pout: .1,
		ring: .18
	},
	viseme_U: {
		...N,
		g: 15,
		up: .45,
		W: .46,
		flat: 1,
		round: 1,
		T: 0,
		TL: 0,
		th: .3,
		sm: .1,
		pout: .5,
		ring: .85
	}
}, P = Object.keys(N), re = {
	g: .022,
	up: .03,
	W: .04,
	flat: .04,
	round: .04,
	press: .02,
	T: .03,
	TL: .03,
	th: .03,
	tip: .018,
	curl: .03,
	tuck: .02,
	sm: .06,
	pout: .04,
	sq: .04,
	ring: .04,
	dim: .04
}, ie = class {
	constructor() {
		this.p = { ...N }, this.side = {
			L: {
				wid: 0,
				dy: 0,
				crease: 1
			},
			R: {
				wid: 0,
				dy: 0,
				crease: 1
			}
		}, this.shift = 0, this.first = !0, this.t = 0, this.holdPP = -1, this.holdTip = -1;
	}
	solve(e, t) {
		this.t += t;
		let n = (t) => e[t] ?? 0, r = T(n("jawOpen") / .85), i = Math.max(n("mouthFunnel"), n("mouthPucker")), a = (n("mouthStretchLeft") + n("mouthStretchRight")) / 2, o = {
			...N,
			g: 40 * r,
			up: .24,
			W: 1 - .36 * i + .08 * a,
			flat: .85 * i,
			round: T(i * 1.2 + .2 * r),
			T: .4 + .55 * r,
			TL: .1 + .3 * a,
			th: .25,
			sm: 1 - .45 * T(r / .25)
		}, s = 0, c = {};
		for (let e of P) c[e] = 0;
		for (let e in ne) {
			let t = n(e);
			if (!(t <= .01)) {
				s += t;
				for (let n of P) c[n] += t * ne[e][n];
			}
		}
		let l = {};
		if (s > 0) for (let e of P) c[e] /= s;
		let u = Math.min(1, s);
		for (let e of P) l[e] = s > 0 ? o[e] * (1 - u) + c[e] * u : o[e];
		s > 0 && (l.g *= .8 + .4 * T(r / .45));
		let d = n("viseme_PP"), f = n("viseme_FF"), p = E(.6, .92, d);
		p > 0 && (l.g *= 1 - p, l.press = Math.max(l.press, p), l.tuck *= 1 - p, l.W = l.W * (1 - p) + .9 * p, l.flat = l.flat * (1 - p) + .5 * p, l.round *= 1 - p);
		let m = E(.25, .7, f) * (1 - p);
		m > 0 && (l.g = l.g * (1 - m) + 18 * m, l.up = l.up * (1 - m) + m, l.tuck = Math.max(l.tuck, m), l.T = Math.max(l.T, m), l.TL *= 1 - m, l.round *= 1 - m, l.flat = l.flat * (1 - m) + .85 * m, l.sm *= 1 - m, l.th *= 1 - m, l.tip *= 1 - m, l.W = l.W * (1 - m) + .72 * m), p > .85 && !this.inPP && (this.inPP = !0, this.holdPP = this.t + .067), p < .5 && (this.inPP = !1), this.t < this.holdPP && (l.g = 0, l.press = Math.max(l.press, .9));
		let h = (n("eyeWideLeft") + n("eyeWideRight")) / 2;
		if (this.surprised = s < .2 && h > .45 ? T((h - .45) / .3) : 0, this.surprised > 0) {
			let e = this.surprised;
			l.round = Math.max(l.round, 1 * e), l.flat = Math.max(l.flat, 1 * e), l.W = l.W * (1 - e) + .77 * e, l.T = l.T * (1 - e) + .45 * e, l.TL = 0, l.up = .3, l.th = Math.max(l.th, .3), l.g = Math.max(l.g, 76 * e * T(r / .3)), l.ring = .12 * e, l.sm = 0;
		}
		let g = T(((n("mouthSmileLeft") + n("mouthSmileRight")) / 2 - .35) / .4) * T(r / .18) * (1 - this.surprised);
		g > 0 && (l.g += 30 * g * (1 - Math.min(1, s)), l.up *= 1 - .7 * g, l.T = Math.max(l.T, 1 * g), l.th = Math.max(l.th, .42 * g), l.W = Math.max(l.W, 1.04 * g + l.W * (1 - g))), l.tip = T(Math.max(l.tip, n("tongueTipUp"))), l.curl = T(Math.max(l.curl, n("tongueCurl"))), l.tip > .5 && !this.inTip && (this.inTip = !0, this.holdTip = this.t + .075), l.tip < .3 && (this.inTip = !1), this.t < this.holdTip && p < .5 && (l.tip = Math.max(l.tip, .9)), l.tip > .3 && (l.TL = 0, l.T = Math.min(l.T, .5), l.g = Math.max(l.g, 22 * l.tip * (1 - p)), l.th = Math.min(l.th, .1)), l.curl > .3 && (l.T = Math.min(l.T, .5), l.TL = 0, l.g = Math.max(l.g, 15), l.up = .38), n("tongueWide") > .2 && (l.th = Math.max(l.th, .35));
		let _ = n("mouthPressRight"), v = n("mouthPressLeft"), y = Math.min(_, v);
		l.press = T(Math.max(l.press, (y + .35 * (Math.max(_, v) - y)) * 1.4)), this.pressSide = {
			L: _ - y,
			R: v - y
		};
		let b = (n("mouthLowerDownLeft") + n("mouthLowerDownRight")) / 2, x = T(1 - s / .2);
		if (b > .01 && x > 0) {
			let e = T(b * 5) * x;
			l.up *= 1 - .75 * e, l.T *= 1 - e, l.TL *= 1 - .6 * e, l.th = Math.min(l.th, .25 - .22 * e);
		}
		this.rollU = T(n("mouthRollUpper")) * x, this.pursed = T(Math.max(this.pressSide.L, this.pressSide.R) * 1.3 + this.rollU * 2.5) * x, this.rollU > 0 && (l.W *= 1 - .14 * this.rollU), this.joy = g;
		let S = this.p;
		for (let e of P) {
			if (this.first) {
				S[e] = l[e];
				continue;
			}
			let n = re[e];
			e === "g" && (l.g < S.g || l.tip > .5) && (n = .014), S[e] += (1 - Math.exp(-t / n)) * (l[e] - S[e]);
		}
		this.t < this.holdPP && (S.g = Math.min(S.g, .4));
		let C = {
			L: n("mouthSmileRight"),
			R: n("mouthSmileLeft")
		}, D = {
			L: n("mouthFrownRight"),
			R: n("mouthFrownLeft")
		}, O = T((n("mouthFrownLeft") + n("mouthFrownRight")) / 2 * 2 + Math.max(0, n("browInnerUp") - .5) * 1.2);
		this.worry = O, this.unsmile = T(1 - S.sm);
		let A = (e) => .22 * (1 - O) + .23 * T(e / .045) + .6 * T((e - .045) / .8), j = n("mouthLeft") - n("mouthRight"), M = Math.max(S.round, S.flat);
		for (let e of ["L", "R"]) {
			let n = A(C[e]) * (1 - .5 * M), r = .3 + (n - .3) * (n > .3 ? S.sm : 1), i = (e === "L" ? k.hwL : k.hwR) * (S.W - 1) + (r - .45) * 13 * (1 - .6 * M) - (this.pressSide ? this.pressSide[e] : 0) * 5, a = this.pressSide ? this.pressSide[e] : 0, o = -(r - .45) * 19 * (1 - .6 * M) * (1 - .7 * this.surprised) + D[e] * 12.5 + S.press * 1.5 + S.tuck * 2.5 + S.pout * 1.5 - a * 1.2, s = T((r - .16) / .29) * (1 - .7 * M), c = this.side[e], l = this.first ? 1 : 1 - Math.exp(-t / .045);
			c.wid += l * (i - c.wid), c.dy += l * (o - c.dy), c.crease += l * (s - c.crease);
		}
		let ee = w(j * 1.6, -1, 1) * 13;
		return this.shift += (this.first ? 1 : 1 - Math.exp(-t / .08)) * (ee - this.shift), this.first = !1, this.sideTilt = w(j * 1.6, -1, 1), this;
	}
	lowerDrop() {
		return this.p.g * (1 - this.p.up);
	}
	jaw() {
		return .86 * this.lowerDrop() - (this.ment || 0);
	}
};
function F(e, t) {
	return E(606, 660, t) * Math.exp(-(((e - 530) / 128) ** 2));
}
var ae = class {
	constructor(e) {
		this.rect = e;
		let [t, n, r, i] = e, a = [];
		for (let e = t; e <= r + .01; e += 3) a.push(Math.min(e, r));
		this.cols = a;
		let o = [
			0,
			1.5,
			3.2,
			6,
			9,
			12,
			15,
			19,
			24,
			30,
			37,
			45,
			55
		], s = [
			0,
			1.5,
			3.2,
			6,
			10,
			14,
			18,
			22,
			27,
			33,
			40,
			48,
			57,
			67,
			78,
			90
		];
		this.sheets = {};
		for (let [e, c, l, u] of [[
			"U",
			o,
			-1,
			n
		], [
			"L",
			s,
			1,
			i
		]]) {
			let o = a.length, s = c.length, d = new Float32Array(o * s * 2), f = new Float32Array(o * s * 2), p = new Float32Array(o * s);
			for (let e = 0; e < o; e++) {
				let o = a[e], m = A(o);
				for (let a = 0; a < s; a++) {
					let h = m + l * c[a];
					a === s - 1 && (h = u), h = l < 0 ? Math.max(u, h) : Math.min(u, h);
					let g = e * s + a;
					d[g * 2] = o, d[g * 2 + 1] = h, f[g * 2] = (o - t) / (r - t), f[g * 2 + 1] = (h - n) / (i - n), p[g] = Math.abs(h - m);
				}
			}
			let m = new Uint16Array((o - 1) * (s - 1) * 6), h = 0;
			for (let e = 0; e < o - 1; e++) for (let t = 0; t < s - 1; t++) {
				let n = e * s + t, r = n + 1, i = n + s, a = i + 1;
				m.set([
					n,
					i,
					r,
					r,
					i,
					a
				], h), h += 6;
			}
			this.sheets[e] = {
				C: o,
				R: s,
				rest: d,
				uv: f,
				uv0: new Float32Array(f),
				d: p,
				idx: m,
				pos: new Float32Array(o * s * 2),
				alpha: new Float32Array(o * s).fill(1),
				light: new Float32Array(o * s).fill(1),
				tint: new Float32Array(o * s),
				sign: l
			};
		}
		let c = a.length;
		this.IC = c, this.inner = {
			pos: new Float32Array(c * 2 * 2),
			s: new Float32Array(c * 2),
			dt: new Float32Array(c * 2),
			gap: new Float32Array(c * 2)
		};
		let l = new Uint16Array((c - 1) * 6);
		for (let e = 0; e < c - 1; e++) {
			let t = e * 2;
			l.set([
				t,
				t + 2,
				t + 1,
				t + 1,
				t + 2,
				t + 3
			], e * 6);
		}
		this.inner.idx = l;
		for (let e = 0; e < c; e++) {
			let t = w(M(a[e]), -.995, .995);
			this.inner.s[e * 2] = this.inner.s[e * 2 + 1] = t;
		}
	}
	edge(e, t, n) {
		let r = e.p, i = M(t), a = Math.abs(i), o = i < 0 ? e.side.L : e.side.R, s = Math.min(1, a), c = (a <= 1 ? i : Math.sign(i)) * o.wid + e.shift, l = o.dy * s ** 1.8, u = Math.max(r.flat, .95 * (e.worry || 0), .55 * (e.unsmile || 0), .9 * (e.pursed || 0));
		l += u * .9 * (j - A(t)) * (1 - E(1.05, 1.45, a)), l -= (e.sideTilt || 0) * i * 3 * s;
		let d = e.sideTilt || 0;
		d !== 0 && (c -= d * (i * Math.sign(d) > 0 ? 6 * Math.min(1, Math.abs(i)) : -2 * Math.min(1, Math.abs(i))));
		let f = (e.farSign || 0) * i > 0 && e.farAmt || 0, p = a / (Math.min(.965, 1 - .16 * Math.max(r.round, r.flat * .8)) - .4 * r.tuck - .36 * r.ring - .24 * f), m = 2 + (2.6 * (1 - r.round) + 5 * r.sq) * (1 - .75 * f), h = .9 - .3 * r.round - .45 * r.sq, g = p < 1 ? Math.max(0, 1 - p ** +m) ** +h : 0, _ = r.g * g;
		return n < 0 ? l -= _ * r.up : l += _ * (1 - r.up) - r.tuck * 6 * g, [
			c,
			l,
			_
		];
	}
	_pre() {
		for (let e of ["U", "L"]) {
			let t = this.sheets[e], n = t.C * t.R, r = t.sign, i = {
				A: new Float32Array(n),
				T: new Float32Array(n),
				JP: new Float32Array(n),
				FALL: new Float32Array(n),
				BUL: new Float32Array(n),
				FADE: new Float32Array(n),
				IN: new Uint8Array(n),
				FR: new Float32Array(n),
				CRW: new Float32Array(n),
				LS: new Uint8Array(n),
				LPR: new Float32Array(n),
				LBU: new Float32Array(n),
				LTK: new Float32Array(n),
				LRD: new Float32Array(n),
				J0: new Float32Array(n),
				VOL: new Float32Array(n),
				ROLL: new Float32Array(n),
				CRN: new Float32Array(n),
				LIP: new Float32Array(n)
			};
			for (let e = 0; e < n; e++) {
				let n = t.rest[e * 2], a = t.rest[e * 2 + 1], o = t.d[e], s = M(n), c = Math.abs(s), l = r < 0 ? ee(c) : te(c), u = c < 1 ? 1 - c * c : 0;
				i.A[e] = c, i.T[e] = l, i.JP[e] = r > 0 ? F(n, a) : 0, i.IN[e] = +(o <= l + .001), i.FR[e] = l > 0 ? o / l : 0;
				let d = r < 0 ? 38 : 40;
				i.FALL[e] = 1 - E(l, l + d, o);
				let f = Math.exp(-(((o - l - 4) / 5) ** 2));
				i.BUL[e] = 2.2 * f * u, i.FADE[e] = c > 1.1 ? 1 - E(1.1, 1.45, c) : 1, i.J0[e] = +(c > 1.1 && o > l), i.CRW[e] = c > .9 && o < 20 ? E(.9, 1.08, c) * (1 - E(8, 20, o)) : 0, i.LS[e] = s < 0 ? 0 : 1, i.LPR[e] = Math.exp(-((o / 2.2) ** 2)) * u, i.LBU[e] = f * u, i.LTK[e] = r > 0 ? Math.exp(-((o / 7) ** 2)) * u : 0, i.LRD[e] = (o < l ? Math.sin(Math.PI * o / Math.max(1, l)) : 0) * u;
				let p = l > 0 ? o / l : 1;
				i.VOL[e] = r > 0 && o < l ? Math.exp(-(((p - .45) / .24) ** 2)) * u ** .4 : 0, i.ROLL[e] = o < l + 1 ? Math.exp(-((o / 3.2) ** 2)) * Math.min(1, u * 3) : 0;
				let m = 1.04 + .0035 * o * (r > 0 ? 1 : .6);
				i.CRN[e] = Math.exp(-(((c - m) / .045) ** 2)) * Math.exp(-((o / (r > 0 ? 11 : 6)) ** 2)), i.LIP[e] = r > 0 && o < l ? u ** .3 * (1 - .6 * Math.max(0, p - .7) / .3) : 0;
			}
			t.K = i;
		}
	}
	update(e) {
		this.solCache = e, this.sheets.U.K || this._pre();
		let t = e.p, n = this.cols.length;
		this.colU || (this.colU = new Float32Array(n * 3), this.colL = new Float32Array(n * 3));
		for (let t = 0; t < n; t++) {
			let n = this.edge(e, this.cols[t], -1), r = this.edge(e, this.cols[t], 1);
			this.colU.set(n, t * 3), this.colL.set(r, t * 3);
		}
		let r = e.jaw(), i = e.surprised || 0, a = [e.side.L.crease, e.side.R.crease], o = t.press * .16, s = t.press * .05, c = t.tuck * .38, l = .04 * t.round + .07 * t.pout;
		for (let n of ["U", "L"]) {
			let u = this.sheets[n], d = u.K, f = u.R, p = u.sign, m = p < 0 ? this.colU : this.colL, h = 1 + .55 * t.round * (1 - .65 * i) + (p < 0 ? .62 : .3) * t.pout - .72 * t.press - .3 * Math.max(0, t.W - 1) - (p > 0 ? .32 * t.tuck + .18 * i : .15 * i) - (p < 0 ? .42 * (e.rollU || 0) : .08 * (e.rollU || 0)), g = e.pressSide || {
				L: 0,
				R: 0
			}, _ = h - .55 * g.L, v = h - .55 * g.R, y = _ !== v, b = T((t.g - 3) / 14) * (1 - t.press), x = b * T((t.g - 8) / 30) * (1 - .5 * t.tuck), S = u.C * f;
			for (let e = 0; e < S; e++) {
				let n = e / f | 0, i = e - n * f, g = m[n * 3], S = m[n * 3 + 1], C = d.T[e], w = r * d.JP[e], D = h;
				if (y) {
					let t = T(.5 + .8 * (d.LS[e] ? d.A[e] : -d.A[e]));
					D = _ * (1 - t) + v * t;
				}
				let O, k;
				if (d.IN[e]) O = g, k = S + p * d.FR[e] * (D - 1) * C;
				else {
					let n = d.FALL[e];
					O = g * n, k = (S + p * (D - 1) * C) * n + w * (1 - n) + p * t.press * d.BUL[e];
				}
				let A = d.FADE[e];
				A < 1 && (O *= A, k = k * A + w * (1 - A) * d.J0[e]), u.pos[e * 2] = u.rest[e * 2] + O, u.pos[e * 2 + 1] = u.rest[e * 2 + 1] + k;
				let j = this.colL[n * 3 + 2], M = i === 0 ? 1 - T((j - 1) / 1.2) : 1;
				if (d.CRW[e] > 0 && (M *= 1 - d.CRW[e] * (1 - a[d.LS[e]])), u.alpha[e] = M, u.light[e] = (1 - o * d.LPR[e] + s * d.LBU[e] - c * d.LTK[e] + l * d.LRD[e]) * (1 + b * (.09 * d.VOL[e] - .17 * d.ROLL[e]) - .2 * x * d.CRN[e]), u.tint[e] = b * .85 * d.LIP[e] * (1 - .3 * t.pout) * (1 - .7 * t.tuck), i <= 2) {
					let t = T(j / 3) * (p > 0 ? 4 : 1.6) * (i === 2 ? .4 : 1);
					u.uv[e * 2 + 1] = u.uv0[e * 2 + 1] + p * t / (this.rect[3] - this.rect[1]);
				}
				i === 0 && p < 0 && (u.pos[e * 2 + 1] += .8 * (1 - T(j / 1.5)) * (1 - E(.95, 1.15, d.A[e])));
			}
		}
		let u = this.inner;
		for (let t = 0; t < this.IC; t++) {
			let n = this.cols[t], r = A(n), i = this.colU[t * 3], a = this.colU[t * 3 + 1], o = this.colL[t * 3], s = this.colL[t * 3 + 1], c = r + a, l = r + s, d = Math.max(0, l - c);
			u.pos[t * 4] = n + i, u.pos[t * 4 + 1] = c - 2;
			let f = 2 + 9 * e.p.tuck;
			u.pos[t * 4 + 2] = n + o, u.pos[t * 4 + 3] = l + f, u.dt[t * 2] = -2, u.dt[t * 2 + 1] = d + f, u.gap[t * 2] = u.gap[t * 2 + 1] = d;
		}
	}
}, oe = (e) => e < 0 ? 0 : e > 1 ? 1 : e, se = (e) => {
	let t = oe(e);
	return t * t * (3 - 2 * t);
};
function ce(e) {
	return () => {
		e |= 0, e = e + 1831565813 | 0;
		let t = Math.imul(e ^ e >>> 15, 1 | e);
		return t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t, ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
var le = [
	[-3, .5],
	[3, .5],
	[0, -2.2]
], ue = class {
	constructor({ reduced: e = !1, seed: t = 11 } = {}) {
		this.reduced = e, this.rng = ce(t), this.sacc = [0, 0], this.target = [0, 0], this.pt = -1, this.next = .6, this.prevGaze = null, this.gv = 0, this.flick = 0, this.f0 = -9, this.famp = 0, this.lastFlick = -9, this.jm = 0, this.prevJaw = 0, this.breathS = .5, this.glint = [0, 0], this.gv2 = [0, 0], this.prevHead = null, this.t = -1;
	}
	update(e, t, n, r, i, a, o = 0) {
		this.t >= 0 && e < this.t - 1 && (this.next = e + .5, this.lastFlick = -9, this.f0 = -9), this.t = e;
		let s = (e) => n[e] ?? 0;
		if (this.prevGaze && t > 0) {
			let e = Math.hypot(r[0] - this.prevGaze[0], r[1] - this.prevGaze[1]) / t;
			this.gv += (1 - Math.exp(-t / .08)) * (e - this.gv);
		}
		this.prevGaze = [r[0], r[1]];
		let c = Math.hypot(r[0], r[1]) < 9;
		if (!(!this.reduced && !this.still && this.gv < 18)) this.target = [0, 0], this.pt = -1, this.next = Math.max(this.next, e + .3);
		else if (e >= this.next) {
			let t = Math.floor(this.rng() * 3);
			t === this.pt && (t = (t + 1 + Math.floor(this.rng() * 2)) % 3), t === 2 && this.rng() < .45 && (t = this.rng() < .5 ? 0 : 1), this.pt = t;
			let n = c ? 1 : .45;
			this.target = [le[t][0] * n, le[t][1] * n], this.next = e + .45 + this.rng() * .7;
		}
		let l = 1 - Math.exp(-t / .011);
		this.sacc[0] += l * (this.target[0] - this.sacc[0]), this.sacc[1] += l * (this.target[1] - this.sacc[1]);
		let u = s("jawOpen");
		this.jm += (1 - Math.exp(-t / 1)) * (u - this.jm);
		let d = Math.max(.3, this.jm * 1.5 + .06), f = !1;
		for (let e in n) if (e.startsWith("viseme_") && n[e] > .3) {
			f = !0;
			break;
		}
		!this.reduced && f && u > d && this.prevJaw <= d && e - this.lastFlick > .9 && (this.lastFlick = e, this.rng() < .6 && (this.f0 = e, this.famp = .6 + .4 * oe((u - this.jm) / .35))), this.prevJaw = u;
		let p = e - this.f0;
		this.flick = p < 0 ? 0 : p < .07 ? this.famp * se(p / .07) : p < .15 ? this.famp : p < .43 ? this.famp * (1 - se((p - .15) / .28)) : 0;
		let m = (o + 1) / 2;
		if (this.breathS += (1 - Math.exp(-t / .35)) * (m - this.breathS), this.prevHead && t > 0) {
			let e = (i[1] - this.prevHead[1]) / t, n = (i[2] - this.prevHead[2]) / t, r = -e * .05 + n * .03, a = -(i[0] - this.prevHead[0]) / t * .04, o = Math.min(t, .1);
			for (; o > 1e-6;) {
				let e = Math.min(.004, o);
				for (let t = 0; t < 2; t++) this.gv2[t] += ((t ? a : r) * 30 - 60 * this.glint[t] - .7 * Math.sqrt(60) * this.gv2[t]) * e, this.glint[t] += this.gv2[t] * e;
				o -= e;
			}
		}
		this.prevHead = [
			i[0],
			i[1],
			i[2]
		];
	}
}, I = (e, t, n) => e < t ? t : e > n ? n : e, L = (e) => I(e, 0, 1), R = (e, t, n) => {
	let r = L((n - e) / (t - e));
	return r * r * (3 - 2 * r);
}, z = Math.PI / 180, de = {
	hairback: [
		0,
		0,
		1,
		.6
	],
	bun: [
		1,
		0,
		0,
		.6
	],
	body: [
		0,
		.7,
		0,
		.5
	],
	ears: [
		1,
		.6,
		0,
		.6
	],
	face: [
		1,
		1,
		0,
		.35
	],
	browL: [
		0,
		1,
		1,
		.6
	],
	browR: [
		0,
		1,
		1,
		.6
	],
	lockbed: [
		1,
		0,
		1,
		.6
	],
	hair: [
		.3,
		.3,
		1,
		.5
	],
	lockL: [
		0,
		1,
		.3,
		.7
	],
	lockR: [
		1,
		.3,
		.6,
		.7
	]
}, B = {
	cx: 512,
	cy: 420,
	rx: 322,
	ry: 392,
	A: 205,
	fcx: 530,
	fcy: 500,
	fsx: 128,
	fsy: 160,
	B: 95,
	gain: 1,
	pivot: [530, 728]
};
function V(e, t) {
	let n = (e - B.cx) / B.rx, r = (t - B.cy) / B.ry, i = Math.max(0, 1 - n * n - r * r), a = B.A * i * i;
	a += B.B * Math.exp(-((e - B.fcx) ** 2) / (2 * B.fsx * B.fsx) - (t - B.fcy) ** 2 / (2 * B.fsy * B.fsy)), a += 26 * Math.exp(-((e - 530) ** 2 + (t - 532) ** 2) / 1152);
	for (let n of [452, 608]) a += 8 * Math.exp(-((e - n) ** 2 + (t - 585) ** 2) / 4050);
	return a;
}
var H = {
	far: -8,
	near: 14,
	chin: 16,
	w: .4,
	sideKeep: 1
}, U = [[364, 384], [684, 368]], fe = /* @__PURE__ */ new Set([
	"hair",
	"lockbed",
	"lockL",
	"lockR",
	"ears",
	"hairback"
]);
function pe(e, t, n) {
	let r = (e - 530) / 208, i = Math.abs(r), a = R(320, 430, t) * (1 - R(690, 790, t)), o = r * n > 0, s = Math.exp(-(((i - 1) / (i < 1 ? .3 : H.w)) ** 2)), c = -n * (o ? H.far : H.near) * s * a;
	return o && i > 1 && (c *= 1 + R(1, 1.12, i) * .3 - R(1.3, 1.55, i) * .8), c += n * H.chin * R(560, 690, t) * (1 - R(720, 800, t)) * Math.exp(-((r / .75) ** 2)), c;
}
var W = {
	nose: 16,
	wing: 4,
	bindi: 9,
	mouth: 8
};
function me(e, t, n) {
	if (t < 320 || t > 700 || e < 400 || e > 660) return 0;
	let r = 0, i = e - 533;
	return t > 470 && t < 600 && (r += W.nose * Math.exp(-((i / 27) ** 2) - ((t - 540) / 24) ** 2), r -= W.wing * Math.exp(-(((i - n * 23) / 11) ** 2) - ((t - 552) / 13) ** 2)), t < 400 && (r += W.bindi * Math.exp(-(((e - 526) / 20) ** 2) - ((t - 354) / 18) ** 2)), t > 560 && (r += W.mouth * Math.exp(-(((e - 530) / 40) ** 2)) * R(560, 585, t) * (1 - R(650, 700, t))), n * r;
}
var G = {
	s: 4,
	x0: 400,
	y0: 320,
	nx: 66,
	ny: 96,
	key: "",
	T: null
};
function he() {
	let e = JSON.stringify(W);
	return G.key === e ? G.T : (G.key = e, G.T = [1, -1].map((e) => {
		let t = new Float32Array(G.nx * G.ny);
		for (let n = 0; n < G.ny; n++) for (let r = 0; r < G.nx; r++) t[n * G.nx + r] = me(G.x0 + r * G.s, G.y0 + n * G.s, e);
		return t;
	}), G.T);
}
function ge(e, t, n) {
	let r = (e - G.x0) / G.s, i = (t - G.y0) / G.s;
	if (r <= 0 || i <= 0 || r >= G.nx - 1.001 || i >= G.ny - 1.001) return 0;
	let a = r | 0, o = i | 0, s = r - a, c = i - o, l = o * G.nx + a;
	return (n[l] * (1 - s) + n[l + 1] * s) * (1 - c) + (n[l + G.nx] * (1 - s) + n[l + G.nx + 1] * s) * c;
}
function _e(e, t) {
	if (e._sil) return;
	e._sil = t;
	let n = e.grid.step, r = e.grid.n;
	for (let [i, a] of [["R", 1], ["L", -1]]) {
		let o = e[i];
		for (let e = 0; e < r; e++) for (let i = 0; i < r; i++) o[e][i][0] += t * pe(i * n, e * n, a);
	}
}
function ve(e, t) {
	let n = .7 * t, r = Math.abs(e);
	return r <= n ? e : Math.sign(e) * (n + (t - n) * Math.tanh((r - n) / (t - n)));
}
function ye(e, t, n, r) {
	let [i, a, o, s] = e, c = Math.ceil((o - i) / t), l = Math.ceil((s - a) / t), u = new Uint8Array(c * l), d = (e) => Math.min(o, i + e * t), f = (e) => Math.min(s, a + e * t);
	for (let e = 0; e < l; e++) for (let t = 0; t < c; t++) u[e * c + t] = +!!r(d(t), f(e), d(t + 1), f(e + 1));
	let p = [], m = /* @__PURE__ */ new Map(), h = (e, t) => {
		let n = Math.round(e * 4) + "," + Math.round(t * 4), r = m.get(n);
		return r === void 0 && (r = p.length / 2, p.push(e, t), m.set(n, r)), r;
	}, g = (e, t) => m.has(Math.round(e * 4) + "," + Math.round(t * 4)), _ = [];
	for (let e = 0; e < l; e++) for (let t = 0; t < c; t++) {
		if (!u[e * c + t]) continue;
		let n = d(t), r = f(e), i = d(t + 1), a = f(e + 1), o = (n + i) / 2, s = (r + a) / 2, l = [
			n,
			o,
			i
		], p = [
			r,
			s,
			a
		];
		for (let e = 0; e < 2; e++) for (let t = 0; t < 2; t++) {
			let n = h(l[t], p[e]), r = h(l[t + 1], p[e]), i = h(l[t], p[e + 1]), a = h(l[t + 1], p[e + 1]);
			_.push(n, r, i, r, a, i);
		}
	}
	for (let e = 0; e < l; e++) for (let t = 0; t < c; t++) {
		if (u[e * c + t]) continue;
		let n = d(t), r = f(e), i = d(t + 1), a = f(e + 1), o = (n + i) / 2, s = (r + a) / 2, l = [
			g(o, r),
			g(i, s),
			g(o, a),
			g(n, s)
		];
		if (!l.some(Boolean)) {
			let e = h(n, r), t = h(i, r), o = h(n, a), s = h(i, a);
			_.push(e, t, o, t, s, o);
			continue;
		}
		let p = [[n, r]];
		l[0] && p.push([o, r]), p.push([i, r]), l[1] && p.push([i, s]), p.push([i, a]), l[2] && p.push([o, a]), p.push([n, a]), l[3] && p.push([n, s]);
		let m = h(o, s), v = p.map(([e, t]) => h(e, t));
		for (let e = 0; e < v.length; e++) _.push(m, v[e], v[(e + 1) % v.length]);
	}
	let v = p.length / 2, y = new Float32Array(p), b = new Float32Array(v * 2);
	for (let e = 0; e < v; e++) b[e * 2] = (y[e * 2] - i) / (o - i), b[e * 2 + 1] = (y[e * 2 + 1] - a) / (s - a);
	return {
		rest: y,
		uv: b,
		idx: new Uint16Array(_),
		n: v
	};
}
var be = 8, K = 129, xe = /* @__PURE__ */ new Float32Array(16641);
for (let e = 0; e < K; e++) for (let t = 0; t < K; t++) xe[e * K + t] = V(t * be, e * be);
function Se(e, t) {
	let n = I(e / be, 0, 127.999), r = I(t / be, 0, 127.999), i = n | 0, a = r | 0, o = n - i, s = r - a, c = a * K + i;
	return (xe[c] * (1 - o) + xe[c + 1] * o) * (1 - s) + (xe[c + K] * (1 - o) + xe[c + K + 1] * o) * s;
}
function Ce(e, t) {
	let n = Math.abs(e - 530);
	return Math.sign(e - 530) * R(40, 170, n) * Math.exp(-(((t - 650) / 70) ** 2));
}
function we(e, t) {
	return [
		Math.exp(-((e - 455) ** 2 + (t - 585) ** 2) / 3528),
		Math.exp(-((e - 605) ** 2 + (t - 585) ** 2) / 3528),
		Math.exp(-((e - 430) ** 2 + (t - 545) ** 2) / 4608),
		Math.exp(-((e - 632) ** 2 + (t - 545) ** 2) / 4608),
		F(e, t),
		Math.sign(e - 530),
		Math.max(0, R(606, 668, t) * Math.exp(-(((e - 530) / 180) ** 2)) - F(e, t)),
		Ce(e, t)
	];
}
var Te = 8;
function Ee(e, t) {
	let n = new Float32Array(t * Te);
	for (let r = 0; r < t; r++) n.set(we(e[r * 2], e[r * 2 + 1]), r * Te);
	return n;
}
function De(e, t) {
	let [n, r, i, a] = e, o = Math.max(1, Math.ceil((i - n) / t)), s = Math.max(1, Math.ceil((a - r) / t)), c = (o + 1) * (s + 1), l = new Float32Array(c * 2), u = new Float32Array(c * 2), d = 0;
	for (let e = 0; e <= s; e++) for (let t = 0; t <= o; t++) {
		let c = t / o, f = e / s;
		l[d * 2] = n + c * (i - n), l[d * 2 + 1] = r + f * (a - r), u[d * 2] = c, u[d * 2 + 1] = f, d++;
	}
	let f = new Uint16Array(o * s * 6);
	d = 0;
	for (let e = 0; e < s; e++) for (let t = 0; t < o; t++) {
		let n = e * (o + 1) + t, r = n + 1, i = n + o + 1, a = i + 1;
		f.set([
			n,
			r,
			i,
			r,
			a,
			i
		], d), d += 6;
	}
	return {
		rest: l,
		uv: u,
		idx: f,
		n: c
	};
}
function Oe(e, t) {
	let n = new Uint16Array((e - 1) * (t - 1) * 6), r = 0;
	for (let i = 0; i < e - 1; i++) for (let e = 0; e < t - 1; e++) {
		let a = i * t + e, o = a + 1, s = a + t, c = s + 1;
		n.set([
			a,
			s,
			o,
			o,
			s,
			c
		], r), r += 6;
	}
	return n;
}
function ke(e, t, n) {
	let r = n - e;
	if (r <= 0) return t[0];
	if (r >= t.length - 1) return t[t.length - 1];
	let i = Math.floor(r), a = r - i;
	return t[i] * (1 - a) + t[i + 1] * a;
}
var Ae = class {
	constructor(e, t) {
		this.k = e, this.c = 2 * t * Math.sqrt(e), this.x = 0, this.v = 0;
	}
	step(e, t) {
		let n = Math.min(t, .1);
		for (; n > 1e-6;) {
			let t = Math.min(.004, n);
			this.v += (e - this.k * this.x - this.c * this.v) * t, this.x += this.v * t, n -= t;
		}
		return this.x;
	}
}, je = .6, Me = class e {
	static async load(t, n, r = {}) {
		let i = await ((e) => fetch(n + e).then((e) => e.json()))("geom.json"), a = Object.keys(i.rects).filter((e) => e !== "bg").concat(["interior"], r.plates ? ["L", "R"].filter((e) => i.plates && i.plates[e]).map((e) => "plate" + e) : []), o = {};
		return await Promise.all(a.map(async (e) => {
			let t = new Image();
			t.src = `${n}${e}.${r.ext || "png"}`, await t.decode(), o[e] = t;
		})), new e(t, i, null, o, r);
	}
	constructor(e, t, n, r, i) {
		this.g = t, t.yawKeys && i.sil !== 0 && _e(t.yawKeys, i.sil ?? 1), this.M = n, this.R = new C(e, {
			clear: i.clear || [
				251.4 / 255,
				229.4 / 255,
				188.6 / 255
			],
			preserve: !!i.preserve
		}), this.R.dpr = i.dpr || Math.min(2, window.devicePixelRatio || 1), this.reduced = !!i.reducedMotion, this.usePlates = !!i.plates, this.yawMax = i.yawMax ?? 20, this.featOn = i.feat !== 0, this.life = new ue({ reduced: this.reduced }), this.view = i.view || [
			140,
			20,
			744
		], this.tex = {};
		for (let [e, t] of Object.entries(r)) this.tex[e] = this.R.texture(t, e !== "interior");
		this.solver = new ie(), this.clock = null, this.lastT = -1, this.layers = {};
		let a = this.R.paint, o = (e, n, r) => {
			let i = t.rects[e], o = De(i, n), s = new Float32Array(o.rest), c = new Float32Array(o.n);
			for (let e = 0; e < o.n; e++) c[e] = V(o.rest[e * 2], o.rest[e * 2 + 1]);
			let l = this.R.mesh(a, {
				aPos: {
					data: s,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: o.uv,
					size: 2
				}
			}, o.idx);
			if (this.layers[e] = {
				name: e,
				rect: i,
				rest: o.rest,
				z: c,
				pos: s,
				mesh: l,
				kind: r,
				n: o.n,
				FW: r === "face" ? Ee(o.rest, o.n) : null
			}, H.sideKeep < 1 && fe.has(e) && t.yawKeys && t.yawKeys._sil) {
				let n = t.yawKeys._sil, r = (e) => Float32Array.from({ length: o.n }, (t, r) => {
					let i = o.rest[r * 2], a = o.rest[r * 2 + 1];
					return (i - 530) * e > 0 ? -(1 - H.sideKeep) * n * pe(i, a, e) : 0;
				});
				this.layers[e].silK = [r(1), r(-1)];
			}
			if (r === "brow") {
				let t = this.layers[e], n = [...new Set(Array.from({ length: o.n }, (e, t) => o.rest[t * 2]))];
				t.colX = Float32Array.from(n), t.colOf = new Uint16Array(o.n);
				let r = new Map(n.map((e, t) => [e, t]));
				for (let e = 0; e < o.n; e++) t.colOf[e] = r.get(o.rest[e * 2]);
				t.cdx = new Float32Array(n.length), t.cdy = new Float32Array(n.length), t.cs = new Float32Array(n.length), t.cc = new Float32Array(n.length), t.cyc = new Float32Array(n.length);
			}
		};
		o("hairback", 24, "head"), t.rects.nape && o("nape", 24, "body"), o("bun", 16, "bun"), o("body", 24, "body"), o("ears", 12, "head"), o("face", 14, "face");
		for (let e of ["L", "R"]) o("brow" + e, 6, "brow");
		o("lockbed", 12, "head"), o("hair", 16, "head"), o("lockL", 6, "lock"), o("lockR", 6, "lock");
		{
			let e = this.layers.bun;
			for (let t = 0; t < e.n; t++) e.z[t] = e.z[t] - 45;
		}
		{
			let e = this.layers.lockR;
			for (let t = 0; t < e.n; t++) e.z[t] -= 45 * R(585, 650, e.rest[t * 2 + 1]);
		}
		for (let e of ["L", "R"]) {
			let t = this.layers["lock" + e];
			t.y0 = t.rect[1] + 6, t.len = t.rect[3] - t.y0, t.spring = new Ae(55, .22), t.springY = new Ae(70, .3);
		}
		this.bunSpring = [new Ae(90, .5), new Ae(90, .5)], this.eyes = {};
		for (let e of ["L", "R"]) {
			let n = t.eyes[e], r = n.x[0], i = n.x[1], o = Math.floor((i - r) / 2) + 1, s = o * 4, c = new Float32Array(s * 2), l = new Float32Array(s * 2), u = new Float32Array(s), d = new Float32Array(s);
			for (let e = 0; e < o; e++) for (let t = 0; t < 4; t++) u[e * 4 + t] = t === 0 || t === 3 ? 0 : Math.min(1, e / 2, (o - 1 - e) / 2);
			let f = this.R.mesh(this.R.eye, {
				aPos: {
					data: c,
					size: 2,
					dynamic: !0
				},
				aRest: {
					data: l,
					size: 2,
					dynamic: !0
				},
				aEdge: {
					data: u,
					size: 1
				},
				aTop: {
					data: d,
					size: 1,
					dynamic: !0
				}
			}, Oe(o, 4)), p = n.lashX[0], m = n.lashX[1], h = Math.floor((m - p) / 3) + 1, g = new Float32Array(h * 8 * 2), _ = new Float32Array(h * 8 * 2), v = new Float32Array(h * 8), y = t.rects["lid" + e];
			for (let e = 0; e < h; e++) {
				let t = Math.min(m, p + e * 3), r = ke(p, n.lashTop, t) - n.fall, i = ke(p, n.lashBot, t) + 8.5;
				for (let n = 0; n < 8; n++) {
					let a = n / 7, o = r + a * (i - r), s = e * 8 + n;
					g[s * 2] = t, g[s * 2 + 1] = o, _[s * 2] = (t - y[0]) / (y[2] - y[0]), _[s * 2 + 1] = (o - y[1]) / (y[3] - y[1]), v[s] = R(.1, .55, a);
				}
			}
			let b = new Float32Array(g), x = new Float32Array(h * 8).fill(1), S = new Float32Array(h * 8).fill(1), C = new Float32Array(h * 8), w = new Float32Array(h * 8), T = new Float32Array(h * 8);
			{
				let e = (n.x[0] + n.x[1]) / 2, t = (n.x[1] - n.x[0]) / 2;
				for (let n = 0; n < h; n++) for (let r = 0; r < 8; r++) {
					let i = n * 8 + r, a = g[i * 2], o = r / 7, s = (a - e) / t;
					w[i] = Math.exp(-((s / .55) ** 2)) * Math.exp(-(((o - .22) / .16) ** 2)), T[i] = Math.exp(-((s / .8) ** 2)) * Math.exp(-(((o - .46) / .1) ** 2));
				}
			}
			let E = this.R.mesh(this.R.lip, {
				aPos: {
					data: b,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: _,
					size: 2
				},
				aA: {
					data: x,
					size: 1,
					dynamic: !0
				},
				aL: {
					data: S,
					size: 1,
					dynamic: !0
				},
				aT: {
					data: C,
					size: 1
				}
			}, Oe(h, 8)), D = Math.floor((i - r) / 3) + 1, O = new Float32Array(D * 5 * 2), k = new Float32Array(D * 5 * 2), A = new Float32Array(D * 5), j = t.rects["lower" + e];
			for (let e = 0; e < D; e++) {
				let t = Math.min(i, r + e * 3), a = ke(r, n.bot, t);
				for (let n = 0; n < 5; n++) {
					let r = n / 4, i = Math.max(j[1], a - 3) + r * (Math.min(j[3], a + 19) - Math.max(j[1], a - 3)), o = e * 5 + n;
					O[o * 2] = t, O[o * 2 + 1] = i, k[o * 2] = (t - j[0]) / (j[2] - j[0]), k[o * 2 + 1] = (i - j[1]) / (j[3] - j[1]), A[o] = r;
				}
			}
			let M = new Float32Array(O), ee = this.R.mesh(a, {
				aPos: {
					data: M,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: k,
					size: 2
				}
			}, Oe(D, 5));
			this.eyes[e] = {
				e: n,
				xa: r,
				xb: i,
				C: o,
				R: 4,
				pos: c,
				restA: l,
				topA: d,
				mesh: f,
				LC: h,
				LR: 8,
				lrest: g,
				lpos: b,
				lv: v,
				lmesh: E,
				lA: x,
				lL: S,
				LH: w,
				LS: T,
				BC: D,
				BR: 5,
				brest: O,
				bpos: M,
				bv: A,
				bmesh: ee,
				top: new Float32Array(i - r + 1),
				bot: new Float32Array(i - r + 1)
			};
		}
		if (this.lidKeyMesh = {}, t.lidKeys) for (let e of ["L", "R"]) for (let n of ["mid", "shut"]) {
			let r = `lid${n}${e}`, i = t.rects[r], a = De(i, 8), o = new Float32Array(a.rest), s = new Float32Array(a.n), c = new Float32Array(a.n);
			for (let e = 0; e < a.n; e++) s[e] = V(a.rest[e * 2], a.rest[e * 2 + 1]);
			if (n === "mid") {
				let n = this.eyes[e], r = this.midLift(e, t), o = t.lidKeys[e].midLash;
				for (let e = 0; e < a.n; e++) {
					let t = a.rest[e * 2], s = a.rest[e * 2 + 1], l = I(Math.round(t - n.xa), 0, n.xb - n.xa), u = o.y[Math.min(o.y.length - 1, l)] + r[l] + 6, d = L((s - i[1]) / Math.max(1, u - i[1]));
					c[e] = r[l] * d * d * (3 - 2 * d);
				}
			}
			let l = new Float32Array(a.n).fill(1), u = new Float32Array(a.n), d = new Float32Array(a.n);
			{
				let r = this.eyes[e], o = (r.e.lashX[0] + r.e.lashX[1]) / 2, s = (r.e.lashX[1] - r.e.lashX[0]) / 2, c = (n) => {
					let i = t.lidKeys[e].midLash, a = I(Math.round(n - r.xa), 0, i.y.length - 1);
					return i.y[a];
				};
				for (let e = 0; e < a.n; e++) {
					let t = a.rest[e * 2], r = a.rest[e * 2 + 1], l = (t - o) / s, d = n === "mid" ? c(t) : i[3] - 22, f = i[1] + 6, p = L((r - f) / Math.max(8, d - f)), m = Math.exp(-((l / .5) ** 2)) * Math.exp(-(((p - .38) / .24) ** 2)), h = Math.exp(-(((p - .86) / .12) ** 2)) * Math.exp(-((l / .9) ** 2)), g = R(.55, 1, Math.abs(l)) * (1 - R(.9, 1.05, p));
					u[e] = (1 + .065 * m - .1 * h - .06 * g) * (n === "mid" ? 1 : .4) + (n === "mid" ? 0 : .6);
				}
			}
			this.lidKeyMesh[r] = {
				rect: i,
				rest: a.rest,
				z: s,
				pos: o,
				off: c,
				n: a.n,
				alpha: l,
				mesh: this.R.mesh(this.R.lip, {
					aPos: {
						data: o,
						size: 2,
						dynamic: !0
					},
					aUv: {
						data: a.uv,
						size: 2
					},
					aA: {
						data: l,
						size: 1,
						dynamic: !0
					},
					aL: {
						data: u,
						size: 1
					},
					aT: {
						data: d,
						size: 1
					}
				}, a.idx)
			};
		}
		this.shell = new ae(t.rects.mouth_rest), this.shellMesh = {};
		for (let e of ["U", "L"]) {
			let t = this.shell.sheets[e];
			this.shellMesh[e] = this.R.mesh(this.R.lip, {
				aPos: {
					data: t.pos,
					size: 2,
					dynamic: !0
				},
				aUv: {
					data: t.uv,
					size: 2,
					dynamic: !0
				},
				aA: {
					data: t.alpha,
					size: 1,
					dynamic: !0
				},
				aL: {
					data: t.light,
					size: 1,
					dynamic: !0
				},
				aT: {
					data: t.tint,
					size: 1,
					dynamic: !0
				},
				aE: {
					data: t.d,
					size: 1
				}
			}, t.idx), t.z = new Float32Array(t.C * t.R);
			for (let e = 0; e < t.C * t.R; e++) t.z[e] = V(t.rest[e * 2], t.rest[e * 2 + 1]);
		}
		let s = this.shell.inner;
		if (s.proj = new Float32Array(s.pos.length), this.innerMesh = this.R.mesh(this.R.inner, {
			aPos: {
				data: s.proj,
				size: 2,
				dynamic: !0
			},
			aS: {
				data: s.s,
				size: 1
			},
			aDT: {
				data: s.dt,
				size: 1,
				dynamic: !0
			},
			aGap: {
				data: s.gap,
				size: 1,
				dynamic: !0
			}
		}, s.idx), this.plates = {}, this.usePlates && t.plates && t.yawKeys && t.yawKeys.norm) {
			let e = [
				290,
				170,
				780,
				700
			], n = t.yawKeys, r = n.grid.step, i = n.grid.n, a = t.plates.holes || [], o = (e, t) => {
				let n = 1;
				for (let r of a) {
					let i = Math.abs(e - r.c[0]) - (r.h[0] - r.r), a = Math.abs(t - r.c[1]) - (r.h[1] - r.r), o = Math.hypot(Math.max(i, 0), Math.max(a, 0)) + Math.min(Math.max(i, a), 0) - r.r;
					n *= R(-r.f, 0, o);
				}
				return n * (1 - R(675, 715, t));
			}, s = ye(e, 16, 8, (e, t, n, r) => {
				if (n > 410 && e < 660 && r > 530 && t < 725) return !0;
				let i = 1, a = 0;
				for (let [s, c] of [
					[e, t],
					[n, t],
					[e, r],
					[n, r],
					[(e + n) / 2, (t + r) / 2]
				]) {
					let e = o(s, c);
					i = Math.min(i, e), a = Math.max(a, e);
				}
				return a - i > .04;
			});
			for (let e of ["L", "R"]) {
				let a = n[e], c = n.norm[e], l = t.plates[e].rect, u = new Float32Array(s.n * 2), d = new Float32Array(s.n), f = new Float32Array(s.n);
				for (let e = 0; e < s.n; e++) {
					let t = s.rest[e * 2], n = s.rest[e * 2 + 1], p = I(t / r, 0, i - 1.001), m = I(n / r, 0, i - 1.001), h = Math.floor(p), g = Math.floor(m), _ = p - h, v = m - g, y = a[g][h], b = a[g][h + 1], x = a[g + 1][h], S = a[g + 1][h + 1], C = t + (y[0] * (1 - _) + b[0] * _) * (1 - v) + (x[0] * (1 - _) + S[0] * _) * v, w = n + (y[1] * (1 - _) + b[1] * _) * (1 - v) + (x[1] * (1 - _) + S[1] * _) * v, T = (C - c.fcx) / c.s + c.kcx, E = (w - c.fe) / c.s + c.ke;
					u[e * 2] = (T - l[0]) / (l[2] - l[0]), u[e * 2 + 1] = (E - l[1]) / (l[3] - l[1]), d[e] = o(t, n), f[e] = V(t, n);
				}
				let p = new Float32Array(s.rest), m = new Float32Array(s.n), h = new Float32Array(s.n).fill(1), g = this.R.mesh(this.R.lip, {
					aPos: {
						data: p,
						size: 2,
						dynamic: !0
					},
					aUv: {
						data: u,
						size: 2
					},
					aA: {
						data: m,
						size: 1,
						dynamic: !0
					},
					aL: {
						data: h,
						size: 1
					}
				}, s.idx);
				this.plates[e] = {
					rect: l,
					rest: s.rest,
					n: s.n,
					pos: p,
					alpha: m,
					hole: d,
					z: f,
					mesh: g
				};
			}
		}
		{
			let e = document.createElement("canvas");
			e.width = e.height = 32;
			let t = e.getContext("2d"), n = t.createRadialGradient(16, 16, 0, 16, 16, 16);
			n.addColorStop(0, "rgba(255,252,236,1)"), n.addColorStop(.35, "rgba(255,246,214,0.55)"), n.addColorStop(1, "rgba(255,240,200,0)"), t.fillStyle = n, t.fillRect(0, 0, 32, 32), t.globalCompositeOperation = "lighter", t.fillStyle = "rgba(255,250,230,0.35)", t.fillRect(15, 2, 2, 28), t.fillRect(2, 15, 28, 2), this.glintTex = this.R.texture(e, !1), this.glints = [[315, 565], [748, 541]].map(([e, t]) => {
				let n = /* @__PURE__ */ new Float32Array(8), r = new Float32Array([
					0,
					0,
					1,
					0,
					0,
					1,
					1,
					1
				]);
				return {
					gx: e,
					gy: t,
					pos: n,
					mesh: this.R.mesh(a, {
						aPos: {
							data: n,
							size: 2,
							dynamic: !0
						},
						aUv: {
							data: r,
							size: 2
						}
					}, new Uint16Array([
						0,
						1,
						2,
						1,
						3,
						2
					]))
				};
			});
		}
		this.prevAnchor = null, this.prevVel = {
			L: [0, 0],
			R: [0, 0],
			bun: [0, 0]
		}, this.st = null;
	}
	drawGlints() {
		if (!this.glints) return;
		let e = this.life.glint, t = Math.min(1, Math.hypot(e[0], e[1]) * 1.6), n = .5 + .5 * Math.sin(this.now() * 2.1);
		for (let r of this.glints) {
			let i = I(e[0] * 5, -3.5, 3.5), a = I(e[1] * 5, -3.5, 3.5), o = this.project(r.gx + i, r.gy + a, Se(r.gx, r.gy)), s = 4.2 + 2.4 * t;
			r.pos.set([
				o[0] - s,
				o[1] - s,
				o[0] + s,
				o[1] - s,
				o[0] - s,
				o[1] + s,
				o[0] + s,
				o[1] + s
			]), this.R.update(r.mesh, "aPos", r.pos), this.R.drawPaint(r.mesh, this.glintTex, [
				0,
				0,
				1,
				1
			], .22 + .1 * n + .6 * t);
		}
	}
	now() {
		return this.clock ?? performance.now() / 1e3;
	}
	apply(e, t, n, r, i) {
		let a = this.prof ? performance.now() : 0;
		this._applyBody(e, t, n, r, i), this.prof && (this.prof.apply = (this.prof.apply || 0) + performance.now() - a);
	}
	_applyBody(e, t, n, r, i) {
		let a = this.now(), o = this.lastT < 0 ? 1 / 60 : I(a - this.lastT, 0, .1);
		this.lastT = a, this.bs = e, this.gaze = n;
		let s = (t) => e[t] ?? 0, c = ve(I(t[1], -20, 20), this.yawMax), l = I(t[0], -10, 12), u = I(t[2], -12, 12), d = {
			sy: Math.sin(c * z) * B.gain,
			cy: Math.cos(c * z),
			sp: Math.sin(l * z) * B.gain,
			cp: Math.cos(l * z),
			sr: Math.sin(-u * z),
			cr: Math.cos(-u * z),
			yaw: c,
			pitch: l,
			roll: u,
			bob: -i * 1.4,
			leanS: 1 + .01 * Math.tanh(r / .7),
			leanY: 7 * r,
			lean: r
		};
		if (this.g.yawKeys) {
			let e = this.g.yawKeys, t = I(c / e.keyDeg, -1, 1);
			d.yk = t >= 0 ? e.R : e.L, d.ykf = Math.abs(t), this.featOn && d.ykf > 0 && (d.featT = he()[t >= 0 ? 0 : 1]), this.yawStep = e.grid.step, this.yawN = e.grid.n;
		}
		this.st = d;
		let f = (s("mouthSmileLeft") + s("mouthSmileRight")) / 2, p = (s("cheekSquintLeft") + s("cheekSquintRight")) / 2, m = L(s("jawOpen") / .85);
		this.expr = {
			smile: f,
			cheek: p,
			open: m
		};
		{
			let e = (e) => {
				let t = s(e + "Right"), n = s(e + "Left");
				return Math.abs(t - n) < .12 ? [(t + n) / 2, (t + n) / 2] : [t, n];
			}, [t, n] = e("mouthSmile"), [r, i] = e("cheekSquint"), a = s("mouthLeft") - s("mouthRight");
			i += .45 * Math.max(0, a), r += .45 * Math.max(0, -a), this.exprSide = {
				L: {
					smile: t,
					cheek: r
				},
				R: {
					smile: n,
					cheek: i
				}
			};
		}
		this.browCh = {
			L: this.browChannels("L"),
			R: this.browChannels("R")
		}, this.solver.solve(e, o);
		let h = this.solver.p;
		{
			let e = L((s("mouthPressLeft") + s("mouthPressRight")) / 2 * 2.2);
			this.solver.ment = 3.2 * e * (1 - L(h.g / 6));
		}
		this.mouth = {
			name: "shell",
			row: h.g > 3 ? "open" : "closed",
			jawGain: 1,
			p: h
		};
		let g = {
			L: "Right",
			R: "Left"
		}, _ = L(-n[1] / 25), v = L(n[1] / 20), y = s("eyeBlinkLeft"), b = s("eyeBlinkRight"), x = Math.max(y, b) > .08 && Math.abs(y - b) > .5 * Math.max(y, b);
		this.winkI = {
			L: x && b > y,
			R: x && y > b
		};
		let S = this.blinkShape(a, o, b, +!!x);
		this.lid = {
			L: S,
			R: this.blinkShape2(s("eyeBlinkLeft"))
		}, this.wink = {
			L: R(.4, .9, this.lid.L - this.lid.R) * R(.35, .85, this.lid.L),
			R: R(.4, .9, this.lid.R - this.lid.L) * R(.35, .85, this.lid.R)
		}, this.life.update(a, o, e, n, t, this.solver, i), this.happy = L((f - .25) / .6) * L((p + .15) / .6);
		for (let e of ["L", "R"]) {
			let t = this.eyes[e], n = t.e, r = g[e], i = (e) => {
				let t = s(e + "Left"), n = s(e + "Right");
				return Math.abs(t - n) < .12 ? (t + n) / 2 : s(e + r);
			}, a = s("eyeWide" + r), o = a <= .035 ? a : .035 + (a - .035) * R(.3, .6, a), c = this.lid[e], l = i("eyeSquint"), u = i("cheekSquint"), d = i("mouthSmile");
			for (let r = 0; r <= t.xb - t.xa; r++) {
				let i = n.top[r], a = n.bot[r], s = a - i, f = r / (t.xb - t.xa), p = Math.max(0, Math.sin(Math.PI * f)) ** .7, m = .18 * R(.55, .85, c) * (this.bsh && this.bsh.active ? 1 : .6), h = (l * .36 + u * .32 + d * .07 + m) * s * p ** 1.4, g = a - h + o * .09 * s * p, y = (_ * .14 - v * .02) * s * p, b = i + .72 * (a - i) - Math.min(h, .25 * s), x = i + y - o * .32 * s * p - (this.happy || 0) * .07 * s * p * p, S = this.g.lidKeys ? this.g.lidKeys[e].midLash : null, C = S ? S.y[Math.min(S.y.length - 1, r)] + this.liftCache[e][r] : b, w = this.winkI && this.winkI[e], T = w ? L(c / .62) * (.72 + .28 * (1 - p)) : L(c / .34);
				w && (g -= .3 * s * R(.08, .45, c) * p ** 1.2), x += (Math.max(x, C - 3) - x) * T, x > g && (x = g), t.top[r] = x, t.bot[r] = g;
			}
			t.blink = c;
		}
		let C = this.project(530, 300, 120);
		if (this.prevAnchor) {
			let e = (C[0] - this.prevAnchor[0]) / Math.max(o, .001), t = (C[1] - this.prevAnchor[1]) / Math.max(o, .001), n = (e - this.prevVel.L[0]) / Math.max(o, .001), r = (t - this.prevVel.L[1]) / Math.max(o, .001);
			this.prevVel.L = [e, t];
			let i = this.reduced ? .3 : 1;
			for (let e of ["L", "R"]) {
				let t = this.layers["lock" + e];
				t.sx = t.spring.step(-I(n, -4e3, 4e3) * .02 * i + d.sr * 0, o), t.sy = t.springY.step(-I(r, -4e3, 4e3) * .01 * i, o);
			}
			this.bunOff = [this.bunSpring[0].step(-I(n, -4e3, 4e3) * .012 * i, o), this.bunSpring[1].step(-I(r, -4e3, 4e3) * .012 * i, o)];
		} else this.bunOff = [0, 0];
		this.prevAnchor = C;
	}
	midLift(e, t) {
		if (this.liftCache = this.liftCache || {}, this.liftCache[e]) return this.liftCache[e];
		let n = this.eyes[e], r = n.e, i = t.lidKeys[e].midLash, a = n.xb - n.xa + 1, o = 0;
		for (let e = 0; e < a; e++) r.bot[e] - r.top[e] > r.bot[o] - r.top[o] && (o = e);
		let s = r.bot[o] - r.top[o], c = Math.min(0, r.top[o] + je * s - i.y[Math.min(i.y.length - 1, o)]), l = new Float32Array(a);
		for (let e = 0; e < a; e++) {
			let t = L((r.bot[e] - r.top[e]) / s);
			l[e] = c * t * t * (3 - 2 * t);
		}
		return this.liftCache[e] = l;
	}
	blinkShape(e, t, n, r = 0) {
		let i = this.bsh ||= {
			active: !1,
			t0: 0,
			base: 0,
			prev: n,
			settle: !1
		};
		if (r > .5 && !i.active) return i.prev = n, i.settle = !1, this.blinkDip = 0, this.lidShared = n, this.lidRaw = n, n;
		let a = [
			.5,
			1,
			1,
			.5,
			.14,
			.04
		], o = t > 0 ? (n - i.prev) / t : 0;
		!i.active && o > 5 && n - i.prev > .06 && n > .15 && (i.active = !0, i.t0 = e, i.base = Math.min(i.prev, .5)), i.prev = n;
		let s = n;
		if (i.active) {
			let t = Math.floor((e - i.t0) * 30 + 1e-6);
			t < a.length ? (s = Math.max(i.base, a[t]), this.blinkDip = a[t]) : (i.active = !1, i.settle = !0);
		}
		return i.active || (this.blinkDip = 0, i.settle && (n <= i.base + .05 ? i.settle = !1 : s = Math.min(n, i.base))), this.lidShared = s, this.lidRaw = n, s;
	}
	blinkShape2(e) {
		return L(this.lidShared + (e - this.lidRaw));
	}
	project(e, t, n) {
		return this.projectTo(e, t, n, [0, 0]);
	}
	projectTo(e, t, n, r, i, a) {
		let o = this.st, s = e, c = t;
		if (o.yk && o.ykf > 0 && this.featOn && (s += o.ykf * ge(i ?? e, a ?? t, o.featT)), o.yk) {
			let n = o.yk, r = this.yawStep, l = I((i ?? e) / r, 0, this.yawN - 1.001), u = I((a ?? t) / r, 0, this.yawN - 1.001), d = Math.floor(l), f = Math.floor(u), p = l - d, m = u - f, h = n[f][d], g = n[f][d + 1], _ = n[f + 1][d], v = n[f + 1][d + 1], y = o.ykf;
			s += y * ((h[0] * (1 - p) + g[0] * p) * (1 - m) + (_[0] * (1 - p) + v[0] * p) * m), c += y * ((h[1] * (1 - p) + g[1] * p) * (1 - m) + (_[1] * (1 - p) + v[1] * p) * m);
		}
		let l = c - B.cy;
		c = B.cy + l * o.cp + n * o.sp;
		let u = s - B.pivot[0], d = c - B.pivot[1];
		return s = B.pivot[0] + u * o.cr - d * o.sr, c = B.pivot[1] + u * o.sr + d * o.cr, s = B.pivot[0] + (s - B.pivot[0]) * o.leanS, c = B.pivot[1] + (c - B.pivot[1]) * o.leanS + o.bob * .6 + o.leanY, r[0] = s, r[1] = c, r;
	}
	openLift() {
		let e = this.solver;
		return e ? L(e.lowerDrop() / 34) * (2.2 + 3.6 * L((this.expr.smile - .2) / .6)) * (1 - .85 * (e.surprised || 0)) : 0;
	}
	faceOffset(e, t, n = !1) {
		let { smile: r, cheek: i } = this.expr, a = 0, o = 0, s = this.openLift(), c = this.exprSide;
		for (let [n, l] of [[455, "L"], [605, "R"]]) {
			let u = Math.exp(-((e - n) ** 2 + (t - 585) ** 2) / 3528), d = c ? c[l].smile : r, f = c ? c[l].cheek : i;
			o -= (d * 4.5 + f * 5.5 + s) * u, a += Math.sign(e - 530) * d * 1.5 * u;
			let p = this.wink ? this.wink[l] : 0;
			p > 0 && (o -= p * 9 * Math.exp(-((e - (l === "L" ? 430 : 632)) ** 2 + (t - 545) ** 2) / 4608));
		}
		!n && this.solver && (o += this.solver.jaw() * F(e, t));
		let l = this._fc;
		if (l) {
			let n = we(e, t);
			o += l[7] * n[6], a -= l[8] * n[7];
		}
		return [a, o];
	}
	jawShape() {
		let e = this.solver;
		if (!e) return [0, 0];
		let t = L((e.lowerDrop() - 8) / 38), n = e.surprised || 0, r = L((this.expr.smile - .2) / .5), i = 4.5 * t * (.4 + .6 * n) * (1 - .75 * r);
		return [.45 * e.jaw() * n, i];
	}
	faceCoef() {
		let e = this.exprSide, { smile: t, cheek: n } = this.expr, r = this.wink || {
			L: 0,
			R: 0
		}, i = e ? e.L.smile : t, a = e ? e.R.smile : t, o = e ? e.L.cheek : n, s = e ? e.R.cheek : n, c = this.openLift(), l = this.jawShape();
		return this._fc = [
			i * 4.5 + o * 5.5 + c,
			a * 4.5 + s * 5.5 + c,
			i * 1.5,
			a * 1.5,
			r.L * 9,
			r.R * 9,
			this.solver ? this.solver.jaw() : 0,
			l[0],
			l[1]
		];
	}
	faceOffW(e, t, n, r) {
		let i = this._fc, a = t * Te;
		return r[0] = e[a + 5] * (i[2] * e[a] + i[3] * e[a + 1]) - i[8] * e[a + 7], r[1] = -(i[0] * e[a] + i[1] * e[a + 1]) - i[4] * e[a + 2] - i[5] * e[a + 3] + (n ? 0 : i[6] * e[a + 4]) + i[7] * e[a + 6], r;
	}
	deformLayer(e) {
		let t = this.st, n = e.pos, r = e.rest, i = e.z, a = e.n;
		if (e.kind === "static") return !1;
		if (e.kind === "body") {
			for (let e = 0; e < a; e++) {
				let i = r[e * 2], a = r[e * 2 + 1], o = 1024 + (a - 1024) * (1 + .004 * t.bob / -1.4), s = i, c = R(95, 200, Math.abs(i - 527)) * (1 - R(860, 1010, a)) * R(700, 790, a);
				c > 0 && (o -= 2.4 * this.life.breathS * c, s += Math.sign(i - 527) * .5 * this.life.breathS * c);
				{
					let e = 1 - R(800, 1010, a);
					e > 0 && (t.lean !== 0 || t.roll !== 0) && (o += (t.leanY * .5 + (i - 527) * Math.sin(-t.roll * z) * .2 * R(700, 780, a)) * e, s += (i - 527) * .012 * t.lean * e);
				}
				let l = R(772, 700, a) * (1 - R(110, 160, Math.abs(i - 527)));
				if (l > 0) {
					let [e, t] = this.project(i, a, Se(i, a));
					s += (e - i) * l, o += (t - a) * l;
				}
				n[e * 2] = s, n[e * 2 + 1] = o;
			}
			return !0;
		}
		let o = e.kind === "face", s = e.kind === "lock", c = e.kind === "bun";
		e.kind === "brow" && this.browColumns(e);
		let l = null;
		if (e.name === "hair" && this.browCh) {
			if (!e.pinW) {
				e.pinW = new Float32Array(a * 2);
				for (let t = 0; t < a; t++) {
					let n = r[t * 2], i = r[t * 2 + 1];
					for (let r = 0; r < 2; r++) {
						let [a, o] = U[r];
						e.pinW[t * 2 + r] = Math.exp(-((n - a) ** 2 + (i - o) ** 2) / 10368);
					}
				}
			}
			let t = this.browOffset("L", U[0][0], U[0][1]), n = this.browOffset("R", U[1][0], U[1][1]);
			l = [
				.9 * t[0],
				.9 * Math.min(0, t[1]),
				.9 * n[0],
				.9 * Math.min(0, n[1])
			];
		}
		let u = this._fo ||= [0, 0];
		for (let t = 0; t < a; t++) {
			let a = r[t * 2], d = r[t * 2 + 1];
			if (o) this.faceOffW(e.FW, t, !1, u), a += u[0], d += u[1];
			else if (e.kind === "brow") {
				let n = e.colOf[t], r = d - e.cyc[n];
				a += e.cdx[n] - r * e.cs[n], d += e.cdy[n] + r * (e.cc[n] - 1);
			} else if (s) {
				let t = L((d - e.y0) / e.len) ** 1.4;
				a += (e.sx || 0) * t, d += (e.sy || 0) * t * .3;
			} else if (l) {
				let n = e.pinW[t * 2], r = e.pinW[t * 2 + 1];
				a += n * l[0] + r * l[2], d += n * l[1] + r * l[3];
			} else c && (a += this.bunOff ? this.bunOff[0] : 0, d += this.bunOff ? this.bunOff[1] : 0);
			let f = o ? this.projectTo(a, d, i[t], this._tmp ||= [0, 0], a, r[t * 2 + 1]) : this.projectTo(a, d, i[t], this._tmp ||= [0, 0]);
			e.silK && this.st.ykf > 0 && (f[0] += this.st.ykf * (this.st.yaw >= 0 ? e.silK[0][t] : e.silK[1][t])), n[t * 2] = f[0], n[t * 2 + 1] = f[1];
		}
		return !0;
	}
	browChannels(e) {
		let t = this.bs, n = e === "L" ? "Right" : "Left", r = t.browInnerUp ?? 0, i = t["browOuterUp" + n] ?? 0, a = t["browDown" + n] ?? 0, o = t["eyeWide" + n] ?? 0, s = this.life ? this.life.flick : 0;
		return {
			lift: 14 * o + 12 * i + 5 * r + 4.2 * s,
			inner: 53 * r + 3 * s,
			arch: 38 * i,
			knit: 21 * a
		};
	}
	browOffset(e, t, n) {
		let r = this.g.brows[e], i = r.x[0], a = r.x[1], o = this.browCh[e], s = (t) => {
			let n = L(e === "L" ? (a - t) / (a - i) : (t - i) / (a - i)), r = Math.exp(-(((n - .62) / .3) ** 2));
			return 5 * Math.max(this.blinkDip || 0, R(.3, .6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : .8)) - o.lift - o.inner * (1 - n) ** 1.3 - o.arch * (.35 + .65 * r) * n ** .5 + o.knit * (1 - .6 * n);
		}, c = s(t), l = Math.atan((s(t + 3) - s(t - 3)) / 6), u = r.cl, d = n - (u ? u.y[I(Math.round(t - u.x0), 0, u.y.length - 1)] : n);
		return [(e === "L" ? 1 : -1) * (o.knit * .3 + o.inner * .05) - d * Math.sin(l), c + d * (Math.cos(l) - 1)];
	}
	browColumns(e) {
		let t = e.name.slice(4), n = this.g.brows[t], r = n.x[0], i = n.x[1], a = this.browCh[t], o = n.cl, s = 5 * Math.max(this.blinkDip || 0, R(.3, .6, this.lidShared || 0) * (this.bsh && this.bsh.active ? 1 : .8)), c = (e) => {
			let n = L(t === "L" ? (i - e) / (i - r) : (e - r) / (i - r)), o = Math.exp(-(((n - .62) / .3) ** 2));
			return s - a.lift - a.inner * (1 - n) ** 1.3 - a.arch * (.35 + .65 * o) * n ** .5 + a.knit * (1 - .6 * n);
		}, l = (t === "L" ? 1 : -1) * (a.knit * .3 + a.inner * .05);
		for (let t = 0; t < e.colX.length; t++) {
			let n = e.colX[t], r = Math.atan((c(n + 3) - c(n - 3)) / 6);
			e.cdy[t] = c(n), e.cs[t] = Math.sin(r), e.cc[t] = Math.cos(r), e.cdx[t] = l, e.cyc[t] = o ? o.y[I(Math.round(n - o.x0), 0, o.y.length - 1)] : 0;
		}
	}
	render() {
		let e = this.R, t = this.st;
		if (!t) return;
		this.faceCoef(), e.begin(), e.setCam(this.view[0], this.view[1], this.view[2]);
		let n = [
			t.yaw >= 0 ? 1 : -1,
			t.yaw >= 0 ? 530 : 330,
			t.yaw >= 0 ? 730 : 530,
			.16 * Math.abs(t.yaw) / 20
		], r = [
			n[0],
			t.yaw >= 0 ? 400 : 200,
			t.yaw >= 0 ? 820 : 660,
			.1 * Math.abs(t.yaw) / 20
		], i = this.debug, a = this.prof, o = () => performance.now(), s = (n, r) => {
			let s = this.layers[n], c = a ? o() : 0;
			this.deformLayer(s) && e.update(s.mesh, "aPos", s.pos), a && (a[n] = (a[n] || 0) + o() - c), !(i && i.only && !i.only.includes(n)) && e.drawPaint(s.mesh, this.tex[n], s.rect, 1, r, i && i.tint ? de[n] : null, n === "face" ? [Math.sign(t.yaw), R(2, 20, Math.abs(t.yaw))] : null);
		};
		s("hairback", r), this.layers.nape && s("nape"), s("bun", r), s("body"), s("ears", n), this.drawGlints(), s("face", n);
		let c = a ? o() : 0;
		for (let e of ["L", "R"]) this.drawEye(e, n);
		a && (a.eyes = (a.eyes || 0) + o() - c), s("browL"), s("browR"), c = a ? o() : 0, this.drawMouth(n), a && (a.mouth = (a.mouth || 0) + o() - c, c = o()), this.drawPlate(), a && (a.plate = (a.plate || 0) + o() - c, a.frames = (a.frames || 0) + 1), s("lockbed", n), s("hair", r), s("lockL"), s("lockR");
	}
	drawEye(e, t) {
		let n = this.eyes[e], r = n.e, i = this.R, a = this.st, o = Se, s = this._t2 ||= [0, 0], c = (r.top[Math.floor(r.top.length / 2)] + r.bot[Math.floor(r.bot.length / 2)]) / 2, l = this.project(n.xa, c, o(n.xa, c)), u = this.project(n.xb, c, o(n.xb, c)), d = (u[0] - l[0]) / (n.xb - n.xa), f = (l[0] + u[0]) / 2, p = 1 - .15 * I(Math.abs(a.yaw) / 20, 0, 1), m = d < p ? p / d : 1, h = (e) => (m !== 1 && (e[0] = f + (e[0] - f) * m), e);
		this.eyeFix = {
			ecx: f,
			em: m
		};
		let g = 0;
		for (let e = 0; e < n.C; e++) {
			let t = Math.min(n.xb, n.xa + e * 2), r = t - n.xa, i = n.top[r], a = n.bot[r], c = Math.min(t - n.xa, n.xb - t);
			if (c < 6) {
				let e = Math.sqrt(Math.max(0, 1 - (1 - c / 6) ** 2)), t = (i + a) / 2;
				i = t + (i - t) * e, a = t + (a - t) * e;
			}
			let l = [
				i - 2.1,
				i - .1,
				Math.max(i - .1, a - .6),
				Math.max(i - .1, a + 1.4)
			];
			for (let e = 0; e < 4; e++) {
				let r = a <= i + .05 ? i : l[e];
				n.restA[g * 2] = t, n.restA[g * 2 + 1] = r, n.topA[g] = i;
				let c = h(this.projectTo(t, r, o(t, r), s));
				n.pos[g * 2] = c[0], n.pos[g * 2 + 1] = c[1], g++;
			}
		}
		i.update(n.mesh, "aPos", n.pos), i.update(n.mesh, "aRest", n.restA), i.update(n.mesh, "aTop", n.topA);
		let _ = this.winkI && this.winkI[e] ? 1 - R(.5, .54, n.blink) : 1 - R(.05, .35, this.wink ? this.wink[e] : 0), v = this.bsh && this.bsh.active && this.blinkDip || 0, y = this.gaze || [0, 0], b = this.life.sacc, x = [y[0] + b[0], y[1] + b[1] - (v > 0 ? 6 * v : 0)], S = x[0] / 25 * 18, C = -(x[1] / 20) * 12 + (x[1] < 0 ? -x[1] / 25 * 2 : 0);
		Math.cos((x[0] + .2 * a.yaw) * z * 1.2);
		let [w, T] = r.iris, [E, D, O] = r.catch, k = ke(n.xa, n.top, E), A = Math.max(0, k + O + 1.5 - (D + C * .45)), j = C * .45 + Math.min(A, 14), M = L((.92 - n.blink) / .2) * (1 - (this.g.lidKeys ? L((n.blink - .6) / .1) : 0)), ee = h(this.project(w + S, T + C, o(w + S, T + C))), te = this.project(w - 12, T, o(w - 12, T)), N = this.project(w + 12, T, o(w + 12, T)), ne = Math.hypot(N[0] - te[0], N[1] - te[1]) / 24, P = Math.abs(a.yaw) > .5 && e === "R" == a.yaw > 0, re = P ? 1 : I(.55 + .45 * ne, .9, 1.06), ie = P ? 1 - .15 * I(Math.abs(a.yaw) / 20, 0, 1) : 1, F = h(this.project(E + S * .45, D + j, o(E, D)));
		_ > .02 && i.drawEye(n.mesh, {
			sclera: {
				tex: this.tex["sclera" + e],
				rect: this.g.rects["sclera" + e]
			},
			iris: {
				tex: this.tex["iris" + e],
				rect: this.g.rects["iris" + e]
			},
			catch: {
				tex: this.tex["catch" + e],
				rect: this.g.rects["catch" + e]
			},
			irisC: [w, T],
			irisScr: ee,
			irisK: re,
			irisScale: [ie, n.blink > .85 ? .95 : 1],
			catchScr: F,
			catchC: [E, D],
			catchA: M,
			lidShade: .4,
			topY: ke(n.xa, n.top, w)
		});
		for (let e = 0; e < n.BC; e++) for (let t = 0; t < n.BR; t++) {
			let i = e * n.BR + t, a = n.brest[i * 2], c = n.brest[i * 2 + 1], l = Math.round(a - n.xa), u = c - (r.bot[I(l, 0, r.bot.length - 1)] - n.bot[I(l, 0, n.bot.length - 1)]) * (1 - .75 * n.bv[i]), d = h(this.projectTo(a, u, o(a, u), s));
			n.bpos[i * 2] = d[0], n.bpos[i * 2 + 1] = d[1];
		}
		i.update(n.bmesh, "aPos", n.bpos), i.drawPaint(n.bmesh, this.tex["lower" + e], this.g.rects["lower" + e], _, t);
		let ae = n.LC * n.LR;
		for (let e = 0; e < ae; e++) {
			let t = n.lrest[e * 2], i = n.lrest[e * 2 + 1], a = Math.round(t - n.xa), c = 1;
			a < 0 && (c = Math.max(.45, 1 + a / 30), a = 0), a > n.xb - n.xa && (c = Math.max(.45, 1 - (a - (n.xb - n.xa)) / 30), a = n.xb - n.xa), c += (1 - c) * L(n.blink / .34);
			let l = i + (n.top[a] - r.top[a]) * c * n.lv[e], u = h(this.projectTo(t, l, o(t, l), s));
			n.lpos[e * 2] = u[0], n.lpos[e * 2 + 1] = u[1];
		}
		i.update(n.lmesh, "aPos", n.lpos);
		let oe = Math.max(this.happy || 0, .8 * R(.08, .34, n.blink));
		for (let e = 0; e < ae; e++) n.lA[e] = _, n.lL[e] = 1 + oe * (.075 * n.LH[e] - .07 * n.LS[e]);
		if (i.update(n.lmesh, "aA", n.lA), i.update(n.lmesh, "aL", n.lL), i.drawLip(n.lmesh, this.tex["lid" + e], this.g.rects["lid" + e], t), this.g.lidKeys) {
			let r = n.blink, a = this.winkI && this.winkI[e], o = a ? 0 : R(.3, .36, r), s = a ? R(.5, .54, r) : R(.72, .82, r);
			for (let [r, a] of [["mid", o * (1 - (s >= 1))], ["shut", s]]) {
				if (a <= .003 || this.debug && this.debug.noKey === r) continue;
				let o = this.lidKeyMesh[`lid${r}${e}`], s = r === "shut" ? this.wink[e] : 0;
				for (let e = 0; e < o.n; e++) {
					let t = o.rest[e * 2], i = o.rest[e * 2 + 1] + o.off[e];
					if (r === "mid") {
						let r = n.e.lashX[0], a = n.e.lashX[1], s = (r + a) / 2, c = (a - r) / 2, l = Math.min(1, ((t - s) / c) ** 2), u = R(o.rect[1], o.rect[1] + 60, o.rest[e * 2 + 1]);
						i += 3.5 * (1 - l) * u;
					}
					if (s > 0) {
						let r = n.e.lashX[0], a = n.e.lashX[1], c = (r + a) / 2, l = (a - r) / 2, u = Math.min(1.25, ((t - c) / l) ** 2), d = .2 + .8 * R(o.rect[1], o.rect[1] + 70, o.rest[e * 2 + 1]);
						i += s * (-15 + 36 * u) * d;
					}
					let a = h(this.projectTo(t, i, o.z[e], this._tmp ||= [0, 0]));
					o.pos[e * 2] = a[0], o.pos[e * 2 + 1] = a[1];
				}
				i.update(o.mesh, "aPos", o.pos), o.alpha.fill(a), i.update(o.mesh, "aA", o.alpha), i.drawLip(o.mesh, this.tex[`lid${r}${e}`], o.rect, t);
			}
		}
	}
	drawMouth(e) {
		let t = this.R, n = this.solver, r = this.shell;
		n.farSign = Math.sign(this.st.yaw), n.farAmt = R(4, 18, Math.abs(this.st.yaw)), r.update(n);
		let i = this._fo ||= [0, 0];
		for (let e of ["U", "L"]) {
			let t = r.sheets[e];
			t.FW ||= Ee(t.rest, t.C * t.R);
			for (let e = 0; e < t.C * t.R; e++) {
				let n = t.pos[e * 2], r = t.pos[e * 2 + 1], [a, o] = this.faceOffW(t.FW, e, !0, i), s = this.projectTo(n + a, r + o, t.z[e], this._tmp ||= [0, 0], n + a, t.rest[e * 2 + 1]);
				t.pos[e * 2] = s[0], t.pos[e * 2 + 1] = s[1];
			}
		}
		if (!(this.debug && this.debug.noPush)) for (let e of ["U", "L"]) {
			let t = r.sheets[e], n = t.R, i = t.pos, a = t.C;
			for (let e = 0; e < a; e++) {
				let t = Math.max(0, e - 1) * n, r = Math.min(a - 1, e + 1) * n, o = e * n, s = o + 1, c = i[r * 2] - i[t * 2], l = i[r * 2 + 1] - i[t * 2 + 1], u = Math.hypot(c, l);
				if (u < .001) continue;
				c /= u, l /= u;
				let d = -l, f = c, p = i[s * 2] - i[o * 2], m = i[s * 2 + 1] - i[o * 2 + 1], h = p * d + m * f;
				h < 0 && (d = -d, f = -f, h = -h), h < 1.6 && Math.hypot(p, m) > .05 && (i[s * 2] += d * (1.6 - h), i[s * 2 + 1] += f * (1.6 - h));
			}
		}
		let a = r.inner;
		for (let e = 0; e < a.pos.length / 2; e++) {
			let t = a.pos[e * 2], n = a.pos[e * 2 + 1], [i, o] = this.faceOffset(t, n, !0), s = r.cols[e >> 1], c = this.projectTo(t + i, n + o, Se(s, A(s)), this._tmp ||= [0, 0], t + i, A(s));
			a.proj[e * 2] = c[0], a.proj[e * 2 + 1] = c[1];
		}
		t.update(this.innerMesh, "aPos", a.proj), t.update(this.innerMesh, "aDT", a.dt), t.update(this.innerMesh, "aGap", a.gap);
		let o = n.p, s = 10 + 5 * o.tuck + 4.5 * o.sq, c = 2 + 9 * o.tuck;
		o.g > .05 && !(this.debug && this.debug.noInner) && t.drawInner(this.innerMesh, this.tex.interior, [
			o.T,
			o.TL,
			s,
			n.joy || 0
		], [
			o.th,
			o.tip,
			o.curl,
			o.dim
		], 1 - .5 * e[3], 0, c);
		for (let n of ["L", "U"]) {
			let i = r.sheets[n];
			n === "U" && o.tuck > .05 && o.g > .05 && t.drawInner(this.innerMesh, this.tex.interior, [
				o.T,
				o.TL,
				s,
				.5
			], [
				o.th,
				o.tip,
				o.curl,
				0
			], 1 - .5 * e[3], 1, c), t.update(this.shellMesh[n], "aPos", i.pos), t.update(this.shellMesh[n], "aA", i.alpha), t.update(this.shellMesh[n], "aL", i.light), t.update(this.shellMesh[n], "aT", i.tint), t.update(this.shellMesh[n], "aUv", i.uv), this.debug && this.debug.noShell || t.drawLip(this.shellMesh[n], this.tex.mouth_rest, this.g.rects.mouth_rest, e, R(2, 8, o.g));
		}
	}
	drawPlate() {
		let e = this.st;
		if (!e || !e.yk || this.debug && this.debug.noPlate) return;
		let t = e.yaw >= 0 ? "R" : "L", n = this.plates[t], r = R(.04, 1, e.ykf);
		if (!n || r <= .004) return;
		let i = this.solver, a = i.p, o = this._tmp ||= [0, 0], s = i.lowerDrop(), c = i.shift || 0, l = Math.max(69 * a.W + Math.max(0, i.side.L.wid), 78) + 14, u = Math.max(71 * a.W + Math.max(0, i.side.R.wid), 80) + 14;
		n.FW ||= Ee(n.rest, n.n);
		let d = this._fo ||= [0, 0];
		for (let e = 0; e < n.n; e++) {
			let t = n.rest[e * 2], i = n.rest[e * 2 + 1], [f, p] = this.faceOffW(n.FW, e, !1, d);
			this.projectTo(t + f, i + p, n.z[e], o), n.pos[e * 2] = o[0], n.pos[e * 2 + 1] = o[1];
			let m = r * n.hole[e];
			if (m > 0 && t > 420 && t < 650 && i > 540 && i < 720) {
				let e = t - 530 - c, n = e < 0 ? -e / l : e / u, r = A(t), o = r - 20 - .3 * a.g, d = r + 30 + s, f = Math.max((n - 1) * 60, o - i, i - d);
				m *= R(-9, 0, f);
			}
			n.alpha[e] = m;
		}
		this.R.update(n.mesh, "aPos", n.pos), this.R.update(n.mesh, "aA", n.alpha), this.R.drawLip(n.mesh, this.tex["plate" + t], n.rect, [
			1,
			0,
			1,
			0
		]);
	}
	warm(e = 24) {
		let t = this.clock, n = this.lastT, r = [
			{
				viseme_aa: 1,
				jawOpen: .6
			},
			{
				viseme_nn: 1,
				tongueTipUp: .9,
				jawOpen: .3
			},
			{
				viseme_CH: 1,
				jawOpen: .25
			},
			{ viseme_FF: 1 },
			{ viseme_PP: 1 },
			{
				viseme_O: 1,
				jawOpen: .4
			},
			{
				tongueCurl: .9,
				viseme_DD: 1
			},
			{
				eyeBlinkLeft: .5,
				eyeBlinkRight: .5
			},
			{
				eyeBlinkLeft: 1,
				eyeBlinkRight: 1
			},
			{
				eyeBlinkRight: 1,
				cheekSquintRight: .8,
				mouthSmileRight: .8
			},
			{
				eyeWideLeft: .9,
				eyeWideRight: .9,
				jawOpen: .42
			},
			{
				mouthSmileLeft: 1,
				mouthSmileRight: 1,
				jawOpen: .34,
				cheekSquintLeft: .7,
				cheekSquintRight: .7
			}
		];
		for (let t = 0; t < e; t++) this.clock = 5e3 + t / 60, this.frame(r[t % r.length], [
			3 * Math.sin(t),
			8 * Math.sin(t * .7),
			4 * Math.cos(t)
		], [5 * Math.sin(t), 3 * Math.cos(t)], 0, Math.sin(t));
		this.R.gl.finish(), this.clock = t, this.lastT = n, this.resetPhysics(), this.solver = new ie(), this.life = new ue({ reduced: this.reduced }), this.prevAnchor = null;
	}
	resetPhysics() {
		for (let e of ["L", "R"]) {
			let t = this.layers["lock" + e];
			t.spring.x = t.spring.v = t.springY.x = t.springY.v = 0;
		}
		for (let e of this.bunSpring) e.x = e.v = 0;
		this.bsh = null, this.blinkDip = 0, this.prevAnchor = null, this.prevVel.L = [0, 0];
	}
	frame(e, t, n, r, i) {
		this.apply(e, t, n, r, i), this.render();
	}
	stats() {
		return {
			triangles: Math.round(this.R.tris),
			meshes: this.R.draws
		};
	}
	dispose() {
		this.R.gl.getExtension("WEBGL_lose_context")?.loseContext();
	}
}, q = {
	thinking: {
		bs: {
			browOuterUpLeft: .72,
			browInnerUp: .08,
			browDownRight: .38,
			eyeSquintRight: .2,
			eyeWideLeft: .04,
			mouthLeft: .5,
			mouthPressLeft: .35,
			mouthPressRight: .35,
			mouthPucker: .5,
			mouthFrownRight: .25,
			mouthFrownLeft: .4,
			mouthSmileLeft: -1,
			mouthSmileRight: -1
		},
		head: [
			-4,
			-7,
			8
		],
		gaze: [21, 20],
		env: [
			.35,
			0,
			.45
		]
	},
	listening: {
		bs: {
			mouthSmileLeft: -1,
			mouthSmileRight: -1,
			browInnerUp: .45,
			browOuterUpLeft: .32,
			browOuterUpRight: .32,
			eyeWideLeft: .2,
			eyeWideRight: .2,
			jawOpen: .13
		},
		head: [
			5,
			4,
			-11
		],
		gaze: [-3, 1],
		env: [
			.5,
			0,
			.5
		],
		act: "listening"
	},
	warm: {
		bs: {
			mouthSmileLeft: .4,
			mouthSmileRight: .4,
			cheekSquintLeft: .2,
			cheekSquintRight: .2,
			eyeSquintLeft: .12,
			eyeSquintRight: .12,
			browOuterUpLeft: .12,
			browOuterUpRight: .12
		},
		head: [
			0,
			0,
			3
		],
		gaze: [0, 0],
		env: [
			.4,
			0,
			.5
		],
		act: "warm"
	},
	delight: {
		bs: {
			mouthSmileLeft: 1,
			mouthSmileRight: 1,
			cheekSquintLeft: .64,
			cheekSquintRight: .64,
			eyeSquintLeft: .26,
			eyeSquintRight: .26,
			browOuterUpLeft: .7,
			browOuterUpRight: .7,
			browInnerUp: .35,
			jawOpen: .34
		},
		head: [
			-2,
			0,
			4
		],
		gaze: [0, 2],
		env: [
			.25,
			0,
			.45
		],
		bounce: 4,
		wob: {
			jawOpen: [[.05, 2.3], [.025, 3.7]],
			mouthSmileLeft: [[.04, 1.3]],
			mouthSmileRight: [[.04, 1.3]],
			cheekSquintLeft: [[.03, 1.3]],
			cheekSquintRight: [[.03, 1.3]]
		},
		act: "delight"
	},
	concern: {
		bs: {
			browInnerUp: 1,
			browDownLeft: .45,
			browDownRight: .45,
			eyeWideLeft: .15,
			eyeWideRight: .15,
			mouthPressLeft: .12,
			mouthPressRight: .12,
			mouthFrownLeft: .3,
			mouthFrownRight: .3,
			mouthPucker: .2,
			mouthSmileLeft: -1,
			mouthSmileRight: -1
		},
		head: [
			4,
			2,
			7
		],
		gaze: [0, 3],
		env: [
			.45,
			0,
			.6
		]
	},
	surprise: {
		bs: {
			eyeWideLeft: .9,
			eyeWideRight: .9,
			browInnerUp: .6,
			browOuterUpLeft: .85,
			browOuterUpRight: .85,
			jawOpen: .42,
			mouthSmileLeft: -1,
			mouthSmileRight: -1,
			mouthFrownLeft: .15,
			mouthFrownRight: .15,
			mouthFunnel: .3
		},
		head: [
			-5,
			0,
			0
		],
		gaze: [0, 2],
		env: [
			.12,
			0,
			.5
		],
		act: "surprise"
	},
	playful: {
		bs: {
			mouthSmileRight: .8,
			mouthSmileLeft: .12,
			cheekSquintRight: .85,
			browOuterUpLeft: .9,
			browDownRight: .35,
			eyeBlinkRight: 1,
			eyeWideLeft: .1,
			eyeSquintLeft: .04
		},
		head: [
			-2,
			-6,
			8
		],
		gaze: [-5, 3],
		env: [
			.22,
			0,
			.4
		],
		act: "playful",
		pulse: {
			keys: ["eyeBlinkRight", "cheekSquintRight"],
			delay: .1,
			a: .1,
			hold: .5,
			r: .12
		}
	}
}, Ne = (e) => {
	let t = (e) => e.endsWith("Left") ? e.slice(0, -4) + "Right" : e.endsWith("Right") ? e.slice(0, -5) + "Left" : e, n = {};
	for (let [r, i] of Object.entries(e.bs)) n[r === "mouthLeft" ? "mouthRight" : r === "mouthRight" ? "mouthLeft" : t(r)] = i;
	let r = {
		...e,
		bs: n,
		head: [
			e.head[0],
			-e.head[1],
			-e.head[2]
		],
		gaze: [-e.gaze[0], e.gaze[1]],
		mir: !e.mir
	};
	return e.pulse && (r.pulse = {
		...e.pulse,
		keys: e.pulse.keys.map(t)
	}), r;
}, Pe = {
	bs: {
		browOuterUpLeft: .82,
		browInnerUp: .2,
		eyeWideLeft: .05,
		eyeWideRight: .03,
		mouthLeft: .45,
		mouthPressLeft: .6,
		mouthRollUpper: .2,
		mouthFrownRight: .22,
		mouthSmileLeft: -1,
		mouthSmileRight: -1
	},
	head: [
		-3,
		-3,
		7
	],
	gaze: [14, 23],
	env: [
		.35,
		0,
		.45
	],
	act: "thinkUp",
	search: [2.4, 1.8]
}, Fe = {
	bs: {
		browOuterUpLeft: .3,
		browInnerUp: .34,
		eyeSquintLeft: .06,
		eyeSquintRight: .1,
		mouthRight: .3,
		mouthPressLeft: .45,
		mouthPressRight: .45,
		mouthFrownLeft: .32,
		mouthFrownRight: .3,
		mouthSmileLeft: -1,
		mouthSmileRight: -1
	},
	head: [
		7,
		3,
		6
	],
	gaze: [2, -22],
	env: [
		.35,
		0,
		.45
	],
	act: "thinkDown"
}, Ie = {
	bs: {
		browInnerUp: 1,
		browDownLeft: .5,
		browDownRight: .42,
		eyeSquintLeft: .3,
		eyeSquintRight: .26,
		mouthPressLeft: .4,
		mouthPressRight: .4,
		mouthFrownLeft: .52,
		mouthFrownRight: .1,
		mouthRight: .12,
		mouthSmileLeft: -1,
		mouthSmileRight: -1
	},
	head: [
		4,
		2,
		7
	],
	gaze: [0, 3],
	env: [
		.45,
		0,
		.6
	],
	act: "concern"
}, Le = {
	bs: {
		browInnerUp: 1,
		browDownLeft: .22,
		browDownRight: .22,
		jawOpen: .27,
		mouthLowerDownLeft: .2,
		mouthLowerDownRight: .2,
		mouthShrugLower: 0,
		mouthFrownLeft: .36,
		mouthFrownRight: .36,
		mouthSmileLeft: -1,
		mouthSmileRight: -1
	},
	head: [
		8,
		0,
		-8
	],
	gaze: [-1, 5],
	env: [
		.45,
		0,
		.6
	],
	act: "concernLean"
}, J = {
	thinking: [
		Pe,
		{
			...Ne(Pe),
			head: [
				-3,
				3,
				-6
			],
			gaze: [-13, 22]
		},
		Fe
	],
	concern: [
		Ie,
		Le,
		{
			bs: {
				browInnerUp: .88,
				browDownLeft: .3,
				browDownRight: .34,
				eyeSquintLeft: .2,
				eyeSquintRight: .2,
				eyeWideLeft: .06,
				eyeWideRight: .06,
				mouthPressLeft: .22,
				mouthPressRight: .22,
				mouthFrownLeft: .3,
				mouthFrownRight: .24,
				mouthPucker: .18,
				mouthSmileLeft: -1,
				mouthSmileRight: -1
			},
			head: [
				7,
				0,
				3
			],
			gaze: [0, 7],
			env: [
				.45,
				0,
				.6
			],
			act: "concern"
		}
	]
}, Re = { thinking: [
	.58,
	.3,
	.12
] }, Y = (e) => e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e), X = 2 * Math.PI, ze = {
	concern: (e) => ({
		head: [
			2.5 * Y(e / .9),
			0,
			1.2 * Math.sin(X * .32 * e) * Y(e / .6)
		],
		lean: .7 * Y(e / .9)
	}),
	concernLean: (e) => ({
		head: [
			3.5 * Y(e / .8),
			.5 * Math.sin(X * .25 * e),
			0
		],
		lean: 1.25 * Y(e / .8) + .08 * Math.sin(X * .4 * e)
	}),
	thinkDown: (e) => ({
		head: [
			3.5 * Y(e / .6) + .8 * Math.sin(X * .23 * e),
			2.4 * Math.sin(X * .28 * e + .6) * Y(e / .8),
			1 * Math.sin(X * .19 * e + 1.2)
		],
		lean: -.25 * Y(e / .6)
	}),
	thinkUp: (e) => ({
		head: [
			-1.5 * Y(e / .5),
			2 * Math.sin(X * .26 * e + .4) * Y(e / .8),
			1.2 * Math.sin(X * .2 * e)
		],
		lean: -.35 * Y(e / .5)
	}),
	delight: (e) => {
		let t = Math.sin(X * 3.1 * e) * Math.exp(-e / .7) * Y(e / .08);
		return {
			head: [
				-2.2 * t,
				0,
				1.4 * Math.sin(X * .45 * e) * Y(e / 1)
			],
			lean: -.5 * t + .15 * Y(e / .5)
		};
	},
	surprise: (e) => {
		let t = e < .18 ? Y(e / .18) : 1 + .25 * Math.sin(X * 1.6 * (e - .18)) * Math.exp(-(e - .18) / .35);
		return {
			head: [
				-2.5 * t,
				0,
				0
			],
			lean: -.7 * t
		};
	},
	playful: (e) => ({
		head: [
			0,
			0,
			3 * Math.sin(X * 1.5 * e) * Math.exp(-e / .9) * Y(e / .1)
		],
		lean: .15 * Y(e / .4)
	}),
	warm: (e) => ({
		head: [
			2.2 * Math.sin(Math.PI * Math.min(1, e / .7)),
			0,
			0
		],
		lean: .2 * Y(e / .6)
	}),
	listening: (e) => ({
		head: [
			0,
			0,
			.8 * Math.sin(X * .22 * e)
		],
		lean: .45 * Y(e / 1)
	})
}, Be = /* @__PURE__ */ new Set([
	"jawOpen",
	"mouthFunnel",
	"mouthPucker",
	"mouthRollUpper",
	"mouthRollLower",
	"mouthLowerDownLeft",
	"mouthLowerDownRight",
	"mouthUpperUpLeft",
	"mouthUpperUpRight"
]);
function Ve(e, t, n) {
	if (!n || e < .5) return [0, 0];
	let r = [
		[0, 0],
		[.9, .35],
		[.2, 1],
		[-.7, .45],
		[-.3, -.5],
		[.8, -.3],
		[-.9, -.1]
	], i = (e) => .5 + .4 * (.5 + .5 * Math.sin(e * 2.17 + t)), a = e - .5, o = 0;
	for (; a > i(o) && o < 400;) a -= i(o), o++;
	let s = r[(o + Math.floor(t * 3)) % r.length], c = r[(o + 1 + Math.floor(t * 3)) % r.length], l = Z((a - (i(o) - .07)) / .07);
	return [n[0] * (s[0] + (c[0] - s[0]) * l) * Z((e - .5) / .3), n[1] * (s[1] + (c[1] - s[1]) * l) * Z((e - .5) / .3)];
}
var Z = (e) => e <= 0 ? 0 : e >= 1 ? 1 : e * e * (3 - 2 * e), He = class {
	constructor(e = 21) {
		this.cur = null, this.lean = 0, this.bounce = {
			x: 0,
			v: 0
		};
		let t = e >>> 0;
		this.rng = () => {
			t = t + 1831565813 | 0;
			let e = Math.imul(t ^ t >>> 15, 1 | t);
			return e = e + Math.imul(e ^ e >>> 7, 61 | e) ^ e, ((e ^ e >>> 14) >>> 0) / 4294967296;
		}, this.lastVar = {};
	}
	pick(e, t) {
		let n = J[e];
		if (!n) return {
			P: q[e],
			i: 0
		};
		let r = Re[e], i = () => {
			if (!r) return Math.floor(this.rng() * n.length);
			let e = this.rng(), t = 0;
			for (; t < n.length - 1 && e >= r[t];) e -= r[t], t++;
			return t;
		}, a = t ?? (this.lastVar[e] === void 0 ? 0 : i());
		if (t == null && n.length > 1 && a === this.lastVar[e]) {
			let t = 0;
			for (; a === this.lastVar[e] && t++ < 8;) a = i();
			a === this.lastVar[e] && (a = (a + 1) % n.length);
		}
		return this.lastVar[e] = a, {
			P: n[a],
			i: a
		};
	}
	emote(e, t, { hold: n = 1.6, intensity: r = 1, variant: i } = {}) {
		if (!q[e]) return;
		let { P: a, i: o } = this.pick(e, i);
		this.cur = {
			name: e,
			t0: t,
			hold: n,
			I: r,
			rel: -1,
			P: a,
			variant: o,
			ph: this.rng() * 6.283
		}, a.bounce && (this.bounce.v -= a.bounce * 14);
	}
	release(e) {
		this.cur && this.cur.rel < 0 && (this.cur.rel = e);
	}
	level(e) {
		let t = this.cur;
		if (!t) return 0;
		let [n, , r] = (t.P || q[t.name]).env, i = Z((e - t.t0) / n), a = t.rel >= 0 ? t.rel : t.t0 + n + t.hold, o = e < a ? 1 : 1 - Z((e - a) / r);
		return o <= 0 && e > a ? (this.cur = null, 0) : i * o * t.I;
	}
	apply(e, t, n, r, i, a) {
		let o = t;
		for (; o > 1e-6;) {
			let e = Math.min(.004, o);
			this.bounce.v += (-160 * this.bounce.x - 1 * Math.sqrt(160) * this.bounce.v) * e, this.bounce.x += this.bounce.v * e, o -= e;
		}
		r[0] += this.bounce.x;
		let s = this.level(e);
		if (!this.cur || s <= 0) return this.lean = 0, 0;
		let c = this.cur.P || q[this.cur.name], l = c.pulse, u = e - this.cur.t0 - (l ? l.delay : 0), d = l ? u < 0 ? 0 : u < l.a ? Z(u / l.a) : u < l.a + l.hold ? 1 : 1 - Z((u - l.a - l.hold) / l.r) : 1, f = e - this.cur.t0;
		for (let [e, t] of Object.entries(c.bs)) {
			let r = l && l.keys.includes(e) ? t * d : t;
			if (c.wob && c.wob[e]) for (let [t, n] of c.wob[e]) r += t * Math.sin(2 * Math.PI * n * f + (this.cur.ph || 0) + n);
			if (Be.has(e)) {
				a && (a[e] = Math.max(a[e] ?? 0, r * s));
				continue;
			}
			n[e] = r < 0 ? (n[e] ?? 0) * (1 - s) : Math.max(n[e] ?? 0, r * s);
		}
		for (let e = 0; e < 3; e++) r[e] += c.head[e] * s;
		if (this.lean = 0, c.act && ze[c.act]) {
			let e = ze[c.act](f), t = c.mir ? -1 : 1;
			r[0] += e.head[0] * s, r[1] += t * e.head[1] * s, r[2] += t * e.head[2] * s, this.lean = e.lean * s;
		}
		let p = Ve(f, this.cur.ph || 0, c.search);
		return i[0] = i[0] * (1 - s) + (c.gaze[0] + p[0]) * s, i[1] = i[1] * (1 - s) + (c.gaze[1] + p[1]) * s, s;
	}
}, Ue = class {
	constructor(e = 3) {
		this.s = {
			x: 0,
			v: 0
		}, this.voicedFor = 0, this.quietFor = 0, this.lastNod = -9, this.n = 0, this.smile = 0, this.seed = e, this.nods = [];
	}
	update(e, t, n, r) {
		let i = n && r > .12;
		i ? (this.voicedFor += t, this.quietFor = 0) : this.quietFor += t;
		let a = (t, n) => {
			this.s.v += t / .0468, this.lastNod = e, this.n++, this.voicedFor = 0, this.nods.push([+e.toFixed(2), n]);
		};
		n && !i && this.voicedFor >= .3 && this.quietFor > .12 && this.quietFor < .45 && e - this.lastNod > 1 ? a(this.n % 3 == 1 ? 5.5 : 3.5, "pause") : n && i && this.voicedFor > 1.8 && e - this.lastNod > 1.8 && a(2, "continuer"), n || (this.voicedFor = 0);
		let o = t;
		for (; o > 1e-6;) {
			let e = Math.min(.004, o);
			this.s.v += (-110 * this.s.x - 1.24 * Math.sqrt(110) * this.s.v) * e, this.s.x += this.s.v * e, o -= e;
		}
		let s = n ? i ? .12 : .06 : 0;
		return this.smile += (1 - Math.exp(-t / .5)) * (s - this.smile), {
			pitch: this.s.x,
			smile: this.smile
		};
	}
}, Q = (e, t, n, r = {}) => ({
	...e,
	head: t,
	gaze: n,
	bs: Object.fromEntries(Object.entries(e.bs).map(([e, t]) => [e, t < 0 ? t : Math.min(1, t * (r[e] ?? 1))]))
});
J.delight = [
	q.delight,
	Q(q.delight, [
		-3,
		3,
		-5
	], [1, 2], {
		jawOpen: .88,
		browOuterUpLeft: 1.1,
		browOuterUpRight: 1.1
	}),
	Q(q.delight, [
		-1,
		-2,
		6
	], [-1, 3], {
		jawOpen: .78,
		browInnerUp: 1.3
	})
], J.warm = [
	q.warm,
	Q(q.warm, [
		1,
		2,
		-4
	], [1, 0], { mouthSmileRight: .85 }),
	Q(q.warm, [
		-1,
		-2,
		5
	], [-1, 1], {
		cheekSquintLeft: 1.3,
		cheekSquintRight: 1.3
	})
], J.surprise = [
	q.surprise,
	Q(q.surprise, [
		-6,
		2,
		-3
	], [1, 3], {
		browOuterUpRight: .85,
		jawOpen: .9
	}),
	Q(q.surprise, [
		-4,
		-2,
		2
	], [-1, 2], {
		eyeWideLeft: 1.05,
		eyeWideRight: 1.05
	})
], J.playful = [q.playful, Ne(q.playful)], J.listening = [
	q.listening,
	{
		...Ne(q.listening),
		head: [
			5,
			-4,
			9
		]
	},
	Q(q.listening, [
		3,
		2,
		-6
	], [-2, 2], { browInnerUp: .8 })
], q.thinking = J.thinking[0], q.concern = J.concern[0];
//#endregion
//#region src/face-puppet/policy.ts
var We = {
	b1: 1,
	b2: .9,
	b3: .7,
	b4: .55
}, Ge = 1.4, Ke = {
	excited: {
		name: "delight",
		big: !0,
		k: 1
	},
	proud: {
		name: "delight",
		big: !0,
		k: .7
	},
	warm: {
		name: "warm",
		big: !1,
		k: 1
	},
	curious: {
		name: "warm",
		big: !1,
		k: .8
	},
	concerned: {
		name: "concern",
		big: !1,
		k: .85
	}
}, qe = class {
	band;
	state = "idle";
	armed = null;
	lastBig = -Infinity;
	duplex = !1;
	calm = !1;
	current = null;
	log = [];
	constructor(e) {
		this.band = We[e] ? e : "b2";
	}
	note(e) {
		this.log.push(e), this.log.length > 200 && this.log.splice(0, 50);
	}
	affect(e, t, n) {
		return this.calm && e !== "concerned" ? (this.note(`${n.toFixed(2)} affect ${e} dropped: safety calm`), []) : (this.armed = {
			emotion: e,
			intensity: t,
			at: n
		}, this.note(`${n.toFixed(2)} affect ${e}/${t} armed`), this.state === "speaking" ? this.fireArmed(n) : []);
	}
	fireArmed(e) {
		let t = this.armed;
		if (this.armed = null, !t || e - t.at > 15) return [];
		let n = Ke[t.emotion];
		if (n.big) {
			if (e - this.lastBig < 30) return this.note(`${e.toFixed(2)} ${t.emotion} over the 30 s budget: warm instead`), [this.emote("warm", .8, Ge, "budget")];
			this.lastBig = e;
		}
		let r = t.intensity === 2 ? 1 : .6;
		return [this.emote(n.name, r * n.k, Ge, `affect:${t.emotion}`)];
	}
	emote(e, t, n, r, i) {
		let a = r.startsWith("floor:") || r.startsWith("duplex:"), o = Math.max(0, Math.min(1, t * (a ? 1 : We[this.band])));
		return this.note(`emote ${e} ${o.toFixed(2)} (${r})`), this.current = e, {
			op: "emote",
			name: e,
			intensity: o,
			hold: n,
			variant: i,
			why: r
		};
	}
	floor(e, t) {
		if (e === this.state) return [];
		let n = this.state;
		this.state = e;
		let r = [], i = this.current === "thinking" || this.current === "listening", a = (e) => (this.current = null, {
			op: "release",
			why: e
		});
		return e === "speaking" ? this.armed ? r.push(...this.fireArmed(t)) : (n === "listening" || n === "thinking") && r.push(a("onset")) : e === "thinking" ? this.duplex ? this.current && !i && r.push(a("thinking: verdict-neutral")) : r.push(a("thinking: verdict-neutral"), this.emote("thinking", 1, 30, "floor:thinking")) : e === "listening" ? this.duplex ? this.current && !i && r.push(a("listening")) : r.push(a("listening"), this.emote("listening", 1, 30, "floor:listening")) : (n === "listening" || n === "thinking") && r.push(a(e)), r;
	}
	pose(e, t) {
		this.duplex = !0, this.note(`${t.toFixed(2)} pose ${e}`);
		let n = [];
		return this.calm && e !== "calm_steady" && (this.calm = !1, n.push({
			op: "calm",
			on: !1,
			why: `left safety: ${e}`
		})), [...n, ...this.poseActs(e)];
	}
	poseActs(e) {
		let t = this.poseActs0(e);
		return t.some((e) => e.op === "release") && !t.some((e) => e.op === "emote") && (this.current = null), t;
	}
	poseActs0(e) {
		switch (e) {
			case "listening": return [{
				op: "release",
				why: e
			}, this.emote("listening", 1, 30, "duplex:listening")];
			case "listen_lean": return [this.emote("listening", .9, 30, "duplex:listen_lean"), {
				op: "lean",
				value: .35,
				why: e
			}];
			case "still_with_you": return [{
				op: "lean",
				value: .2,
				why: e
			}];
			case "thinking": return [{
				op: "release",
				why: "thinking: verdict-neutral"
			}, this.emote("thinking", 1, 30, "duplex:thinking_glance")];
			case "hold_pose": return [];
			case "checkin_look": return [{
				op: "release",
				why: e
			}, this.emote("listening", .6, 1.2, "duplex:checkin")];
			case "your_turn": return [{
				op: "release",
				why: e
			}, {
				op: "lean",
				value: .3,
				why: e
			}];
			case "calm_steady": return this.calm = !0, this.armed = null, [
				{
					op: "calm",
					on: !0,
					why: e
				},
				{
					op: "release",
					why: e
				},
				this.emote("concern", .35, 30, "duplex:calm_steady", 2)
			];
			case "speaking": return [{
				op: "release",
				why: "speaking"
			}];
		}
	}
	get faceState() {
		return this.state;
	}
	get duplexAttached() {
		return this.duplex;
	}
}, Je = [
	{
		v: "viseme_sil",
		w: 1
	},
	{
		v: "viseme_aa",
		w: .6
	},
	{
		v: "viseme_aa",
		w: 1
	},
	{
		v: "viseme_O",
		w: .85
	},
	{
		v: "viseme_E",
		w: .8
	},
	{
		v: "viseme_RR",
		w: .7
	},
	{
		v: "viseme_I",
		w: 1
	},
	{
		v: "viseme_U",
		w: 1
	},
	{
		v: "viseme_O",
		w: 1
	},
	{
		v: "viseme_aa",
		w: .9
	},
	{
		v: "viseme_O",
		w: .9
	},
	{
		v: "viseme_aa",
		w: .9
	},
	{
		v: "viseme_kk",
		w: .5
	},
	{
		v: "viseme_RR",
		w: .8,
		tongue: { tongueTipUp: .45 }
	},
	{
		v: "viseme_nn",
		w: 1,
		tongue: {
			tongueTipUp: .8,
			tongueWide: .6
		}
	},
	{
		v: "viseme_SS",
		w: 1
	},
	{
		v: "viseme_CH",
		w: 1
	},
	{
		v: "viseme_TH",
		w: 1
	},
	{
		v: "viseme_FF",
		w: 1
	},
	{
		v: "viseme_DD",
		w: 1,
		tongue: { tongueTipUp: .8 }
	},
	{
		v: "viseme_kk",
		w: 1
	},
	{
		v: "viseme_PP",
		w: 1
	}
], Ye = [
	0,
	.6,
	1,
	.8,
	.6,
	.45,
	.35,
	.3,
	.7,
	.9,
	.75,
	.9,
	.4,
	.35,
	.3,
	.15,
	.2,
	.2,
	.1,
	.2,
	.35,
	0
], Xe = /[टठडढण]/u, Ze = /[तथदधन]/u, Qe = /व/u, $e = {
	baanta: "DR",
	baant: "DR",
	baantte: "DR",
	baantna: "DRD",
	thoda: "DR",
	thodi: "DR",
	thode: "DR",
	dabba: "R",
	dibba: "R",
	ghanta: "RR",
	ghante: "RR",
	tukda: "RR",
	tukde: "RR",
	tukdon: "RRD",
	ladka: "R",
	ladki: "R",
	bada: "R",
	badi: "R",
	bade: "R",
	ped: "R",
	pedh: "R",
	dar: "R",
	dhoondh: "RDR",
	dhundh: "RDR",
	pattern: "RD",
	chhota: "R",
	chhoti: "R",
	chhote: "R",
	mota: "R",
	moti: "R",
	gaadi: "R",
	ganda: "DD",
	anda: "RR",
	danda: "RRR",
	jhanda: "RR",
	pahad: "R",
	sadak: "R",
	ude: "R",
	ud: "R",
	tota: "DD"
};
function et(e) {
	let t = $e[e], n = [];
	for (let r = 0; r < e.length; r++) {
		let i = e[r], a = e[r + 1] ?? "";
		(i === "t" || i === "d" || i === "n") && (i !== "n" || a !== "k" && a !== "g") && ((a === i || a === "h") && r++, n.push(t ? t[n.length] === "R" : !1));
	}
	return n;
}
function tt(e) {
	let t = [...e], n = [];
	for (let e = 0; e < t.length; e++) {
		let r = t[e];
		Xe.test(r) ? n.push(!0) : Ze.test(r) || r === "ं" && Ze.test(t[e + 1] ?? "") ? n.push(!1) : r === "ं" && Xe.test(t[e + 1] ?? "") && n.push(!0);
	}
	return n;
}
function nt(e) {
	let t = e.normalize("NFC"), n = /[ऀ-ॿ]/u.test(t), r = n ? t : t.toLowerCase().replace(/[^a-z]/g, ""), i = n ? tt(t) : et(r);
	return {
		stops: i,
		retroflex: i.filter(Boolean).length,
		va: n ? Qe.test(t) : /^v|[aeiou]v/.test(r) && !/ve?$/.test(r)
	};
}
function rt(e) {
	let t = [];
	for (let n of e.normalize("NFC").split(/[\s,.;:!?।"'()\-]+/u)) n && t.push(...nt(n).stops);
	return t;
}
function it(e, t = [], n) {
	let r = [], i = t.map((e) => ({
		...e,
		f: nt(e.text),
		k: 0,
		n19: 0
	})), a = (e) => i.find((t) => e >= t.ms - 10 && e < t.ms + t.durMs + 10);
	for (let t of e) if (t.id === 19) {
		let e = a(t.ms);
		e && e.n19++;
	}
	let o = !t.length && n ? rt(n) : null;
	o && o.length !== e.filter((e) => e.id === 19).length && (o = null);
	let s = 0;
	for (let t of e) {
		if (o && t.id === 19) {
			let e = o[s++] === !0;
			r.push({
				ms: t.ms,
				id: t.id,
				target: e ? {
					v: "viseme_DD",
					w: 1,
					tongue: {
						tongueCurl: .9,
						tongueTipUp: 0
					}
				} : Je[19]
			});
			continue;
		}
		let e = Je[t.id] ?? Je[0], n = a(t.ms);
		n && (t.id === 19 ? n.f.stops[n.k++] === !0 && n.n19 === n.f.stops.length && (e = {
			v: "viseme_DD",
			w: 1,
			tongue: {
				tongueCurl: .9,
				tongueTipUp: 0
			}
		}) : t.id === 18 && n.f.va && (e = {
			v: "viseme_FF",
			w: .6
		})), r.push({
			ms: t.ms,
			id: t.id,
			target: e
		});
	}
	return r;
}
function at(e, t, n, r = 0) {
	for (let e in n) delete n[e];
	let i = r, a = e.length;
	for (; i < a;) {
		let n = i + a >> 1;
		e[n].ms < t - 400 ? i = n + 1 : a = n;
	}
	let o = 0;
	for (let r = Math.max(0, i - 1); r < e.length; r++) {
		let i = e[r];
		if (i.ms > t + 50) break;
		let a = r + 1 < e.length ? e[r + 1].ms : i.ms + 120, s = Math.max(0, Math.min(1, (t - (i.ms - 50)) / 50, (a + 50 - t) / 50));
		if (s <= 0) continue;
		let c = s * i.target.w, l = i.target.v;
		if ((n[l] ?? 0) < c && (n[l] = c), i.target.tongue) for (let [e, t] of Object.entries(i.target.tongue)) {
			let r = (t ?? 0) * s;
			(n[e] ?? 0) < r && (n[e] = r);
		}
		o = Math.max(o, (Ye[i.id] ?? 0) * s);
	}
	return n.jawOpen = o * .62, i;
}
var ot = class {
	parts = [];
	lead = 50;
	received = 0;
	stale = 0;
	push(e, t, n, r = [], i = performance.now(), a) {
		if (!n.length) return;
		let o = this.parts.find((n) => n.part === e && Math.abs(n.playAt - t) < 5), s = o ? [...o.rawV, ...n] : [...n], c = o ? [...o.rawW, ...r] : [...r];
		s.sort((e, t) => e.ms - t.ms);
		let l = s.filter((e, t) => t === 0 || e.ms !== s[t - 1].ms || e.id !== s[t - 1].id), u = it(l, c, a ?? o?.text), d = t + u[u.length - 1].ms + 200;
		if (d < i) {
			this.stale++;
			return;
		}
		this.received++, o ? Object.assign(o, {
			end: d,
			track: u,
			rawV: l,
			rawW: c,
			text: a ?? o.text
		}) : this.parts.push({
			part: e,
			playAt: t,
			end: d,
			track: u,
			cursor: 0,
			rawV: l,
			rawW: c,
			text: a
		}), this.parts.sort((e, t) => e.playAt - t.playAt);
	}
	cut() {
		this.parts = [];
	}
	at(e, t) {
		for (; this.parts.length && this.parts[0].end < e;) this.parts.shift();
		let n = this.parts.find((t) => e >= t.playAt - 80 && e <= t.end);
		if (!n) {
			for (let e in t) delete t[e];
			return !1;
		}
		let r = e - n.playAt + this.lead;
		return n.cursor = at(n.track, r, t, 0), !0;
	}
	get active() {
		return this.parts.length;
	}
}, st = ["eyeBlinkLeft", "eyeBlinkRight"], ct = .4;
function lt(e) {
	for (let t of st) delete e.bs[t];
	delete e.pulse;
	let t = e.bs.cheekSquintLeft ?? 0, n = e.bs.cheekSquintRight ?? 0;
	Math.abs(t - n) > ct && (t > n ? e.bs.cheekSquintLeft = n + ct : e.bs.cheekSquintRight = t + ct), (e.bs.mouthShrugLower ?? 0) > .3 && (e.bs.mouthShrugLower = 0);
}
var ut = !1;
function dt() {
	if (ut) return;
	ut = !0;
	let e = /* @__PURE__ */ new Set();
	for (let t of Object.values(q)) e.has(t) || (e.add(t), lt(t));
	for (let t of Object.values(J)) for (let n of t) e.has(n) || (e.add(n), lt(n));
	ft();
}
function ft() {
	let e = pt();
	if (e.length) throw Error(`puppet safety floor: ${e.slice(0, 5).join("; ")}`);
}
function pt() {
	let e = [], t = (t, n) => {
		for (let r of st) (n.bs[r] ?? 0) > 0 && e.push(`${t}: ${r}`);
		n.pulse && e.push(`${t}: pulse`), Math.abs((n.bs.cheekSquintLeft ?? 0) - (n.bs.cheekSquintRight ?? 0)) > .40000000100000005 && e.push(`${t}: one-sided cheek`), (n.bs.mouthShrugLower ?? 0) > .3 && e.push(`${t}: pout`);
	};
	for (let [e, n] of Object.entries(q)) t(e, n);
	for (let [e, n] of Object.entries(J)) n.forEach((n, r) => t(`${e}[${r}]`, n));
	return e;
}
//#endregion
//#region src/face-puppet/driver.ts
var mt = class {
	x = 0;
	v = 0;
	last = -Infinity;
	nods = 0;
	kick(e, t) {
		return t - this.last < 3 ? !1 : (this.last = t, this.nods++, this.v += Math.max(0, Math.min(6, e)) / .0468, !0);
	}
	step(e) {
		let t = Math.min(e, .1);
		for (; t > 1e-6;) {
			let e = Math.min(.004, t);
			this.v += (-110 * this.x - 1.24 * Math.sqrt(110) * this.v) * e, this.x += this.v * e, t -= e;
		}
		return this.x;
	}
}, ht = (e, t, n, r) => e + (1 - Math.exp(-n / r)) * (t - e), gt = class {
	policy;
	visemes = new ot();
	behaviour;
	comp = new p(.85);
	exprs = new He(21);
	listener = new Ue(3);
	nod = new mt();
	lip = null;
	lipRate = 0;
	win = /* @__PURE__ */ new Float32Array(1024);
	lastT = -1;
	status = null;
	statusSince = 0;
	spoke = !1;
	state = "idle";
	exprHead = [
		0,
		0,
		0
	];
	exprLean = 0;
	poseLean = 0;
	poseLeanTarget = 0;
	vis = {};
	reduced;
	calm = !1;
	busyUntil = 0;
	evalHead = null;
	evalEmote(e, t, n, r = 30, i = 1) {
		this.exprs.emote(e, t / 1e3, {
			hold: r,
			intensity: i,
			variant: n
		});
	}
	evalRelease(e) {
		this.run([{
			op: "release",
			why: "eval"
		}], e / 1e3);
	}
	constructor(e) {
		dt();
		let t = [
			"b1",
			"b2",
			"b3",
			"b4"
		].includes(String(e.band)) ? e.band : "b2";
		this.reduced = !!e.reducedMotion, this.behaviour = new d({
			band: t,
			seed: e.seed ?? 7,
			faceStyle: { smile: e.smile ?? .7 },
			reducedMotion: this.reduced,
			gentle: e.gentle
		}), this.policy = new qe(t);
	}
	setMotion(e) {
		e.reduced !== void 0 && (this.reduced = e.reduced), this.behaviour.setMotion(e);
	}
	affect(e, t, n) {
		this.run(this.policy.affect(e, t, n / 1e3), n / 1e3);
	}
	lookAt(e, t, n, r) {
		this.behaviour.lookAt(e, t, n, r), this.busyUntil = Math.max(this.busyUntil, this.lastT + .6);
	}
	voiceEvent(e) {
		this.calm || this.behaviour.voiceEvent(e);
	}
	pose(e, t) {
		this.run(this.policy.pose(e, t / 1e3), t / 1e3);
	}
	nodCue(e, t) {
		if (this.state === "speaking" || this.calm) return !1;
		let n = this.nod.kick(e, t / 1e3);
		return n && (this.busyUntil = Math.max(this.busyUntil, t / 1e3 + 1)), n;
	}
	cut() {
		this.visemes.cut(), this.lip?.reset();
	}
	run(e, t) {
		e.length && (this.busyUntil = Math.max(this.busyUntil, t + 1.2));
		for (let n of e) if (n.op === "emote") this.exprs.emote(n.name, t, {
			hold: n.hold,
			intensity: n.intensity,
			variant: n.variant
		});
		else if (n.op === "release") {
			let e = this.exprs.cur;
			e && (e.P = {
				...e.P,
				env: [
					e.P.env[0],
					e.P.env[1],
					Math.min(e.P.env[2], .3)
				]
			}, this.exprs.release(t));
		} else n.op === "lean" ? this.poseLeanTarget = n.value : n.op === "calm" && (this.calm = n.on);
	}
	frame(r, i) {
		let a = performance.now(), o = r.nowMs / 1e3, s = this.lastT < 0 ? 1 / 60 : Math.max(0, Math.min(.25, o - this.lastT));
		this.lastT = o, r.status !== this.status && (this.status = r.status, this.statusSince = o, this.spoke = !1);
		let c = r.tap;
		(!this.lip || c.buf && c.sampleRate !== this.lipRate) && (this.lipRate = c.buf ? c.sampleRate : 48e3, this.lip = new n(this.lipRate)), c.fresh && this.lip.reset();
		let l = c.buf ? c.buf.subarray(c.buf.length - 1024) : t(c.level, this.win), u = this.lip.step(l, o), d = this.visemes.at(r.nowMs, this.vis), p = u.speaking || d;
		p && (this.spoke = this.spoke || o - this.statusSince > .3);
		let m = f({
			status: r.status,
			tapSpeaking: p,
			silenceMs: d ? 0 : u.silenceMs,
			spokeSinceStatus: this.spoke
		});
		m !== this.state && (this.state = m, this.busyUntil = Math.max(this.busyUntil, o + .8), this.run(this.policy.floor(m, o), o)), p && (this.busyUntil = Math.max(this.busyUntil, o + .4)), this.behaviour.setState(m);
		let h = this.behaviour.update(o, {
			herRms: u.rms,
			herVoiced: u.voiced || d,
			childLevel: r.childLevel
		}), g = { ...h.bs }, _ = [
			h.head[0],
			h.head[1],
			h.head[2]
		], v = [h.gaze[0], h.gaze[1]];
		if (this.policy.duplexAttached) _[0] += this.nod.step(s) * (this.reduced ? .3 : 1);
		else {
			let e = this.listener.update(o, s, m === "listening", r.childLevel);
			_[0] += e.pitch * (this.reduced ? .3 : 1), g.mouthSmileLeft = (g.mouthSmileLeft ?? 0) + e.smile, g.mouthSmileRight = (g.mouthSmileRight ?? 0) + e.smile;
		}
		let y = e(u), b = [
			_[0],
			_[1],
			_[2]
		];
		this.exprs.apply(o, s, g, _, v, y);
		for (let e = 0; e < 3; e++) this.exprHead[e] = ht(this.exprHead[e], _[e] - b[e], s, .12), _[e] = b[e] + this.exprHead[e] * (this.reduced ? .3 : 1);
		this.exprLean = ht(this.exprLean, this.exprs.lean, s, .15), this.poseLean = ht(this.poseLean, m === "listening" || m === "your_turn" ? this.poseLeanTarget : 0, s, .4);
		let x = this.comp.compose(g, y, s), S = c.buf ? "tap" : c.level > 0 ? "level" : "none";
		if (d) {
			let e = this.vis.jawOpen;
			for (let e in this.vis) e !== "jawOpen" && (x[e] = this.vis[e]);
			c.buf || (x.jawOpen = Math.max(x.jawOpen ?? 0, e ?? 0)), S = "visemes";
		}
		if (this.evalHead) for (let e = 0; e < 3; e++) _[e] += this.evalHead[e];
		let C = Math.sin(o * 2 * Math.PI * .25), w = performance.now() - a;
		return i && (i.clock = o, i.frame(x, _, v, h.lean + this.exprLean + this.poseLean, C)), {
			state: m,
			lipSource: S,
			mouth: x,
			head: _,
			gaze: v,
			workMs: w
		};
	}
}, _t = /* @__PURE__ */ new Set(), vt = {
	emit(e) {
		for (let t of [..._t]) try {
			t(e);
		} catch (e) {
			console.warn("face-puppet: a bus listener failed", e);
		}
	},
	on(e) {
		return _t.add(e), () => _t.delete(e);
	},
	get listeners() {
		return _t.size;
	}
}, $ = (e, t) => {
	if (!e.length) return 0;
	let n = [...e].sort((e, t) => e - t);
	return n[Math.min(n.length - 1, Math.floor(t * n.length))];
}, yt = class {
	canvas;
	driver;
	host;
	o;
	rig = null;
	tap;
	raf = 0;
	running = !1;
	disposed = !1;
	status = null;
	childLevel = 0;
	dpr;
	fpsCap = 60;
	curFps = 60;
	strikes = 0;
	lastDraw = 0;
	lastNow = 0;
	work = [];
	rigMs = [];
	intervals = [];
	frames = 0;
	revealed = !1;
	losses = 0;
	lastStep = 0;
	lipSource = "none";
	offs = [];
	timers = /* @__PURE__ */ new Set();
	t0 = performance.now();
	constructor(e, t) {
		this.host = e, this.o = t, this.dpr = Math.min(2, typeof devicePixelRatio == "number" ? devicePixelRatio : 1), this.driver = new gt({
			band: t.band,
			seed: t.seed,
			reducedMotion: t.reducedMotion,
			gentle: t.gentle
		}), this.tap = new r(t.sources);
		let n = document.createElement("canvas");
		n.className = "fp-canvas", n.setAttribute("aria-hidden", "true"), n.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0;transition:opacity 220ms ease-out;display:block", this.canvas = n, n.addEventListener("webglcontextlost", this.onLost, !1), n.addEventListener("webglcontextrestored", this.onRestored, !1), this.subscribe();
	}
	emit(e) {
		try {
			this.o.onEvent?.(e);
		} catch {}
	}
	async init() {
		let e = performance.now();
		if (typeof WebGL2RenderingContext > "u") throw Error("no WebGL2");
		this.host.appendChild(this.canvas);
		let t = [...c[this.o.framing ?? "medium"]], n = Me.load(this.canvas, this.o.base ?? u, {
			ext: "webp",
			dpr: this.dpr,
			view: t,
			clear: o,
			reducedMotion: this.o.reducedMotion
		}), r = new Promise((e, t) => {
			let n = window.setTimeout(() => t(/* @__PURE__ */ Error("puppet load timeout")), this.o.loadTimeoutMs ?? 8e3);
			this.timers.add(n);
		}), i = await Promise.race([n, r]);
		if (this.disposed) {
			i.dispose();
			return;
		}
		i.warm(), this.rig = i, this.emit({
			type: "loaded",
			ms: Math.round(performance.now() - e)
		});
	}
	subscribe() {
		this.offs.push(vt.on((e) => {
			let t = (this.o.now ?? (() => performance.now()))();
			if (e.kind === "visemes") this.driver.visemes.push(e.part, e.playAt, e.visemes, e.words ?? [], t, e.text);
			else if (e.kind === "cut") this.driver.cut();
			else if (e.kind === "duplex") {
				let n = e.cue;
				n.kind === "pose" ? this.driver.pose(n.pose, t) : n.kind === "nod" && this.driver.nodCue(n.peakDeg, t);
			}
		})), this.offs.push(s.on((e) => this.onCue(e)));
	}
	onCue(e) {
		let t = (this.o.now ?? (() => performance.now()))();
		if (e.kind === "affect") {
			let n = i(e.display, this.o.band);
			n && this.driver.affect(n.emotion, n.intensity, t);
		} else if (e.kind === "gaze") {
			if (e.target === "child") return;
			let t = a(e.target, document);
			if (!t) return;
			let n = this.host.getBoundingClientRect(), r = t.getBoundingClientRect();
			if (!n.width || !r.width) return;
			let [i, o] = l({
				x: n.left,
				y: n.top,
				w: n.width,
				h: n.height
			}, {
				x: r.left,
				y: r.top,
				w: r.width,
				h: r.height
			});
			this.driver.lookAt(i, o, e.holdMs / 1e3, e.reason);
		} else if (e.kind === "voice") {
			let t = e.event.kind, n = window.setTimeout(() => {
				this.timers.delete(n), this.driver.voiceEvent(t);
			}, Math.max(0, Math.min(1e4, e.event.atMs)));
			this.timers.add(n);
		}
	}
	attach(e, t, n) {
		this.host = e, this.o = {
			...this.o,
			framing: t,
			onEvent: n ?? this.o.onEvent
		}, e.appendChild(this.canvas), this.rig && (this.rig.view = [...c[t]]);
	}
	get isRevealed() {
		return this.revealed && !this.disposed;
	}
	set(e) {
		e.status !== void 0 && (this.status = e.status), e.childLevel !== void 0 && (this.childLevel = e.childLevel), (e.reducedMotion !== void 0 || e.gentle !== void 0) && (this.driver.setMotion({
			reduced: e.reducedMotion,
			gentle: e.gentle
		}), this.rig && e.reducedMotion !== void 0 && (this.rig.reduced = e.reducedMotion, this.rig.life.reduced = e.reducedMotion));
	}
	start() {
		if (this.running || this.disposed) return;
		this.running = !0;
		let e = (t) => {
			this.running && (this.raf = requestAnimationFrame(e), this.tick(t));
		};
		this.raf = requestAnimationFrame(e);
	}
	stop() {
		this.running = !1, cancelAnimationFrame(this.raf);
	}
	tick(e, t = !1) {
		let n = this.rig;
		if (!n || this.disposed) return;
		let r = this.fpsCap < 60 ? this.fpsCap : e / 1e3 < this.driver.busyUntil ? 60 : 30;
		if (this.curFps = r, !t && r < 60 && e - this.lastDraw < 1e3 / r - 2) return;
		this.lastNow && this.intervals.push(e - this.lastNow), this.lastNow = e, this.lastDraw = e;
		let i = performance.now(), a = this.tap.read();
		n.R.dpr = this.dpr;
		let o = performance.now(), s = this.driver.frame({
			nowMs: e,
			tap: a,
			status: this.status,
			childLevel: this.childLevel
		}, n), c = performance.now() - o - s.workMs, l = performance.now() - i;
		this.lipSource = s.lipSource, this.work.push(l), this.rigMs.push(c), this.work.length > 120 && (this.work.shift(), this.rigMs.shift()), this.intervals.length > 120 && this.intervals.shift(), this.frames++;
		let u = (s.mouth.jawOpen ?? 0) < .12 && (s.mouth.viseme_aa ?? 0) < .5 && (s.mouth.viseme_O ?? 0) < .5;
		if (!this.revealed && this.frames > 2 && (s.state !== "speaking" || u || e - this.t0 > 800) && (this.revealed = !0, this.canvas.style.opacity = "1", this.emit({
			type: "reveal",
			ms: Math.round(e - this.t0)
		})), this.frames % 60 == 0) {
			this.govern(e);
			let t = n.stats();
			this.emit({
				type: "stats",
				fpsP50: 1e3 / Math.max(1, $(this.intervals, .5)),
				intervalP95: $(this.intervals, .95),
				workP95: $(this.work, .95),
				rigP95: $(this.rigMs, .95),
				dpr: this.dpr,
				fpsCap: this.fpsCap,
				draws: t.meshes,
				tris: t.triangles,
				lipSource: this.lipSource
			});
		}
	}
	govern(e) {
		if (this.work.length < 90 || e - this.lastStep < 2e3) return;
		let t = this.o.budgetMs ?? 8, n = $(this.work, .95);
		if (n <= (this.fpsCap >= 60 ? t : this.fpsCap >= 30 ? t * 2.5 : t * 3.75)) {
			this.strikes = 0;
			return;
		}
		if (++this.strikes < 2) {
			this.work.length = 0, this.rigMs.length = 0;
			return;
		}
		this.strikes = 0, this.lastStep = e, this.work.length = 0, this.rigMs.length = 0;
		let r;
		if (this.dpr > 1.5) this.dpr = 1.5, r = "dpr 1.5";
		else if (this.dpr > 1) this.dpr = 1, r = "dpr 1";
		else if (this.fpsCap > 30) this.fpsCap = 30, r = "30 fps";
		else if (this.fpsCap > 20) this.fpsCap = 20, r = "20 fps";
		else if (n > t * 5.6) {
			r = "floor", this.emit({
				type: "governor",
				step: r,
				workP95: n
			}), this.emit({
				type: "fallback",
				reason: `slow: work p95 ${n.toFixed(1)} ms at 20 fps, dpr 1`
			}), this.stop();
			return;
		} else return;
		this.emit({
			type: "governor",
			step: r,
			workP95: n
		});
	}
	onLost = (e) => {
		if (e.preventDefault(), this.losses++, this.stop(), this.canvas.style.opacity = "0", this.revealed = !1, this.emit({ type: "contextlost" }), this.losses > 1) this.emit({
			type: "fallback",
			reason: "webgl context lost twice"
		});
		else {
			let e = window.setTimeout(() => {
				this.timers.delete(e), !this.running && !this.disposed && this.emit({
					type: "fallback",
					reason: "webgl context not restored"
				});
			}, 3e3);
			this.timers.add(e);
		}
	};
	onRestored = () => {
		if (this.disposed || this.losses > 1) return;
		this.rig = null;
		let e = [...c[this.o.framing ?? "medium"]];
		Me.load(this.canvas, this.o.base ?? u, {
			ext: "webp",
			dpr: this.dpr,
			view: e,
			clear: o,
			reducedMotion: this.o.reducedMotion
		}).then((e) => {
			if (this.disposed) return e.dispose();
			e.warm(), this.rig = e, this.t0 = performance.now(), this.frames = 0, this.start();
		}).catch((e) => this.emit({
			type: "fallback",
			reason: `rebuild after context loss failed: ${String(e).slice(0, 120)}`
		}));
	};
	mouthProbe() {
		let e = this.rig;
		return e ? {
			gap: e.solver?.p?.g ?? 0,
			name: e.mouth?.name ?? ""
		} : null;
	}
	snapshot() {
		let e = this.rig?.stats() ?? {
			triangles: 0,
			meshes: 0
		};
		return {
			frames: this.frames,
			fpsP50: 1e3 / Math.max(1, $(this.intervals, .5)),
			intervalP95: $(this.intervals, .95),
			workP50: $(this.work, .5),
			workP95: $(this.work, .95),
			rigP95: $(this.rigMs, .95),
			dpr: this.dpr,
			fpsCap: this.fpsCap,
			draws: e.meshes,
			tris: e.triangles,
			lipSource: this.lipSource,
			curFps: this.curFps,
			revealed: this.revealed,
			state: this.driver.policy.faceState
		};
	}
	dispose() {
		this.disposed = !0, this.stop();
		for (let e of this.offs) e();
		this.offs = [];
		for (let e of this.timers) window.clearTimeout(e);
		this.timers.clear(), this.tap.dispose(), this.canvas.removeEventListener("webglcontextlost", this.onLost), this.canvas.removeEventListener("webglcontextrestored", this.onRestored), this.rig?.dispose(), this.rig = null, this.canvas.remove();
	}
};
//#endregion
export { yt as PuppetStage };
