// Minimal WebGL2 renderer for the painted puppet (PLAN §2): textured triangle meshes with premultiplied alpha, one
// draw per layer, CPU-deformed vertices uploaded with bufferSubData. Two programs: `paint` (texture x alpha x shade)
// and `eye` (sclera + gaze-moved iris + view-space catchlight composited in one pass inside the lid opening strip,
// AA by an edge attribute, so no stencil and no extra pass). No dependency.

const VS_PAINT = `#version 300 es
in vec2 aPos; in vec2 aUv;
uniform vec2 uView; uniform vec4 uCam; // cam: x0, y0, scale, flipY
out vec2 vUv; out vec2 vRest;
void main(){
  vec2 p = (aPos - uCam.xy) * uCam.z;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  vUv = aUv;
}`;
const FS_PAINT = `#version 300 es
precision mediump float;
in vec2 vUv;
uniform sampler2D uTex; uniform float uAlpha; uniform vec4 uShade; // shade: dirX, x0, x1, amount
uniform vec4 uRect; // texture rect in rest space (x0,y0,w,h) for shading position
uniform vec4 uTint; // debug: rgb, amount
out vec4 o;
void main(){
  vec4 c = texture(uTex, vUv);
  float x = uRect.x + vUv.x * uRect.z;
  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);
  s = uShade.x > 0.0 ? s : 1.0 - s;
  c.rgb *= 1.0 - uShade.w * s * s;
  c.rgb = mix(c.rgb, uTint.rgb * c.a, uTint.a);
  o = c * uAlpha;
}`;
const VS_EYE = `#version 300 es
in vec2 aPos; in vec2 aRest; in float aEdge; in float aTop;
uniform vec2 uView; uniform vec4 uCam;
out vec2 vRest; out float vEdge; out float vTop; out vec2 vScr;
void main(){
  vec2 p = (aPos - uCam.xy) * uCam.z;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  vRest = aRest; vEdge = aEdge; vTop = aTop; vScr = aPos;
}`;
const FS_EYE = `#version 300 es
precision highp float;
in vec2 vRest; in float vEdge; in float vTop; in vec2 vScr;
uniform vec2 uIrisScr; uniform vec2 uCatchScr; uniform float uIrisK; uniform vec2 uCatchC;
uniform sampler2D uSclera; uniform vec4 uScleraRect;
uniform sampler2D uIris; uniform vec4 uIrisRect;
uniform sampler2D uCatch; uniform vec4 uCatchRect;
uniform vec2 uIrisOff; uniform vec2 uIrisC; uniform vec2 uIrisScale; uniform vec2 uCatchOff; uniform float uCatchA;
uniform float uLidShade; uniform float uTopY;
out vec4 o;
vec4 tex(sampler2D t, vec4 r, vec2 p){
  vec2 uv = (p - r.xy) / r.zw;
  if (uv.x < 0.0 || uv.y < 0.0 || uv.x > 1.0 || uv.y > 1.0) return vec4(0.0);
  return texture(t, uv);
}
void main(){
  vec4 s = tex(uSclera, uScleraRect, vRest);
  vec3 col = s.a > 0.0 ? s.rgb / s.a : vec3(0.95);
  // r3: the iris and the catchlight are placed in SCREEN space and scaled uniformly: they translate with the gaze and
  // the turn but never squash anisotropically (r2's far eye at yaw 20 became a vertical oval)
  vec2 ip = uIrisC + (vScr - uIrisScr) / (uIrisK * uIrisScale);
  vec4 ir = tex(uIris, uIrisRect, ip);
  col = col * (1.0 - ir.a) + ir.rgb;
  // lid shadow: the band right under the upper lid darkens a little (wraps the eye)
  // r2: per-column lid line (vTop), a soft wrap shadow ~10 px deep under the whole lid, as in c-front
  float dl = clamp((vRest.y - vTop - 2.0) / 9.0, 0.0, 1.0);
  col *= 1.0 - uLidShade * (1.0 - dl) * (1.0 - dl);
  vec4 cl = tex(uCatch, uCatchRect, uCatchC + (vScr - uCatchScr) / uIrisK);
  col = mix(col, vec3(1.0), cl.a * uCatchA);
  float a = clamp(vEdge, 0.0, 1.0);
  o = vec4(col * a, a);
}`;


// r3 lip shell: the paint program plus a per-vertex alpha (inner-edge AA row, smile-crease fade)
const VS_LIP = `#version 300 es
in vec2 aPos; in vec2 aUv; in float aA;
uniform vec2 uView; uniform vec4 uCam;
out vec2 vUv; out float vA;
void main(){
  vec2 p = (aPos - uCam.xy) * uCam.z;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  vUv = aUv; vA = aA;
}`;
const FS_LIP = `#version 300 es
precision mediump float;
in vec2 vUv; in float vA;
uniform sampler2D uTex; uniform vec4 uShade; uniform vec4 uRect;
out vec4 o;
void main(){
  vec4 c = texture(uTex, vUv);
  float x = uRect.x + vUv.x * uRect.z;
  float s = clamp((x - uShade.y) / (uShade.z - uShade.y), 0.0, 1.0);
  s = uShade.x > 0.0 ? s : 1.0 - s;
  c.rgb *= 1.0 - uShade.w * s * s;
  o = c * vA;
}`;
// r3 mouth interior: cavity, tongue, lower and upper teeth from the interior strips (interior.png, cut from the
// gpt-image-2 atlas), placed by distance from the deformed inner lip edges (teeth hang from the upper lip, the tongue
// rests on the lower one), so nothing squashes when the gap is small
const VS_IN = `#version 300 es
in vec2 aPos; in float aS; in float aDT; in float aGap;
uniform vec2 uView; uniform vec4 uCam;
out float vS; out float vDT; out float vGap;
void main(){
  vec2 p = (aPos - uCam.xy) * uCam.z;
  gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  vS = aS; vDT = aDT; vGap = aGap;
}`;
const FS_IN = `#version 300 es
precision highp float;
in float vS; in float vDT; in float vGap;
uniform sampler2D uTex;
uniform vec4 uTeeth;   // upper shown 0..1, lower shown 0..1, teeth height px, -
uniform vec4 uTongue;  // height share, tip, curl, -
uniform float uShadeK;
out vec4 o;
vec3 strip(float row, float u){ return texture(uTex, vec2(u, (row + 0.5) / 64.0)).rgb; }
vec4 strip4(float row, float u){ return texture(uTex, vec2(u, (row + 0.5) / 64.0)); }
void main(){
  float gap = max(vGap, 0.001);
  float dt = vDT, db = gap - vDT;
  float a = abs(vS);
  float u = clamp(vS * 0.5 + 0.5, 0.0, 1.0);
  // cavity: roof (dark) to floor, from the aa cell
  vec3 col = strip(32.0 + clamp(dt / gap, 0.0, 1.0) * 15.0, u);
  col *= 1.0 - 0.35 * pow(a, 3.0);
  // tongue: a soft mound on the lower lip, a tip that rises behind the upper teeth (dental / lateral), a curl that
  // shows the darker underside up at the palate (retroflex)
  float bell = exp(-pow(vS / 0.34, 2.0));
  float mound = gap * uTongue.x * pow(max(0.0, 1.0 - pow(vS / 0.8, 2.0)), 1.6);
  float tip = max(0.0, gap - 1.5 - uTeeth.z * uTeeth.x * 0.45) * uTongue.y * bell;
  float curl = gap * 0.78 * uTongue.z * exp(-pow(vS / 0.3, 2.0));
  float h = max(mound, max(tip, curl));
  if (db < h && h > 0.6) {
    vec3 t = strip(48.0 + clamp(1.0 - db / h, 0.0, 1.0) * 15.0, u);
    t *= 0.8 * mix(0.88, 1.0, smoothstep(0.0, 2.5, h - db)) * mix(0.82, 1.0, smoothstep(0.0, 0.5 * h, db));
    t *= 1.0 - 0.3 * pow(a / 0.8, 2.0);
    if (curl > max(mound, tip) - 0.01) {               // the underside: darker, cooler, with a light lip at the edge
      vec3 under = t * vec3(0.72, 0.62, 0.68);
      t = mix(under, t * 1.08, 1.0 - smoothstep(0.0, 1.4, h - db));
    }
    col = mix(col, t, clamp((h - db) / 2.2, 0.0, 1.0) * smoothstep(0.6, 2.0, h));
  }
  // lower teeth (bottom-anchored), then upper teeth (top-anchored, slide up under the lip as they hide)
  float th = uTeeth.z;
  // the strips are 16 rows for ~12 px of painted tooth: rows per px = 12 / th
  float rp = 12.0 / th;
  float lb = (db + (1.0 - 0.45 * uTeeth.y) * th) * rp;
  float lw = 0.5, uw = 0.74;   // the rows are narrower than the lip span: the corners recede into shadow
  if (lb < 15.0 && a < lw) {
    vec4 lt = strip4(31.0 - lb, clamp((vS / lw) * 0.5 + 0.5, 0.0, 1.0));
    lt *= 1.0 - smoothstep(lw - 0.12, lw, a);
    lt.rgb *= 0.9 - 0.3 * pow(a / lw, 2.0);
    col = mix(col, lt.rgb / max(lt.a, 0.001), lt.a);
  }
  float ub = (dt + (1.0 - uTeeth.x) * th) * rp;
  if (ub >= 0.0 && ub < 15.0 && a < uw) {
    vec4 ut = strip4(ub, clamp((vS / uw) * 0.5 + 0.5, 0.0, 1.0));
    ut *= 1.0 - smoothstep(uw - 0.14, uw, a);
    ut.rgb *= 1.0 - 0.3 * pow(a / uw, 2.0);
    col = mix(col, ut.rgb / max(ut.a, 0.001), ut.a);
  }
  // the upper lip's shadow on whatever sits right under it
  col *= mix(0.78, 1.0, smoothstep(0.0, 2.5, dt));
  o = vec4(col * uShadeK, 1.0);
}`;

function compile(gl, vs, fs) {
  const p = gl.createProgram();
  for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]]) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  }
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(p, i);
    u[info.name] = gl.getUniformLocation(p, info.name);
  }
  return { p, u };
}

export class Renderer {
  constructor(canvas, { clear = [0.98, 0.9, 0.74], preserve = false } = {}) {
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: true, preserveDrawingBuffer: preserve, powerPreference: "high-performance" });
    if (!gl) throw new Error("WebGL2 unavailable");
    this.gl = gl;
    this.canvas = canvas;
    this.clear = clear;
    this.paint = compile(gl, VS_PAINT, FS_PAINT);
    this.eye = compile(gl, VS_EYE, FS_EYE);
    this.lip = compile(gl, VS_LIP, FS_LIP);
    this.inner = compile(gl, VS_IN, FS_IN);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.disable(gl.DEPTH_TEST);
    this.cam = [0, 0, 1, 0];
    this.draws = 0;
    this.tris = 0;
  }

  texture(img, mip = true) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /** A dynamic mesh: positions (Float32Array, x,y per vertex) re-uploaded per frame; static attributes once. */
  mesh(prog, attrs, index) {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const bufs = {};
    for (const [name, { data, size, dynamic }] of Object.entries(attrs)) {
      const loc = gl.getAttribLocation(prog.p, name);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, data, dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW);
      if (loc >= 0) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
      }
      bufs[name] = b;
    }
    const ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, index, gl.STATIC_DRAW);
    gl.bindVertexArray(null);
    return { vao, bufs, count: index.length };
  }

  update(mesh, name, data) {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.bufs[name]);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
  }

  begin() {
    const gl = this.gl;
    const dpr = this.dpr || 1;
    const w = Math.round(this.canvas.clientWidth * dpr), h = Math.round(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(this.clear[0], this.clear[1], this.clear[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.draws = 0;
    this.tris = 0;
  }

  setCam(x0, y0, w) {
    // show rest-space [x0, x0+w] across the canvas width (square-ish framing from the caller)
    this.cam = [x0, y0, this.canvas.width / w, 0];
  }

  drawPaint(mesh, tex, rect, alpha = 1, shade = [1, 0, 1, 0], tint = null) {
    if (alpha <= 0.001) return;
    const gl = this.gl, P = this.paint;
    gl.useProgram(P.p);
    gl.uniform4fv(P.u.uTint, tint || [0, 0, 0, 0]);
    gl.uniform2f(P.u.uView, this.canvas.width, this.canvas.height);
    gl.uniform4fv(P.u.uCam, this.cam);
    gl.uniform1f(P.u.uAlpha, alpha);
    gl.uniform4fv(P.u.uShade, shade);
    gl.uniform4f(P.u.uRect, rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(P.u.uTex, 0);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    this.draws++;
    this.tris += mesh.count / 3;
  }

  drawLip(mesh, tex, rect, shade = [1, 0, 1, 0]) {
    const gl = this.gl, P = this.lip;
    gl.useProgram(P.p);
    gl.uniform2f(P.u.uView, this.canvas.width, this.canvas.height);
    gl.uniform4fv(P.u.uCam, this.cam);
    gl.uniform4fv(P.u.uShade, shade);
    gl.uniform4f(P.u.uRect, rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(P.u.uTex, 0);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    this.draws++;
    this.tris += mesh.count / 3;
  }

  drawInner(mesh, tex, teeth, tongue, shadeK = 1) {
    const gl = this.gl, P = this.inner;
    gl.useProgram(P.p);
    gl.uniform2f(P.u.uView, this.canvas.width, this.canvas.height);
    gl.uniform4fv(P.u.uCam, this.cam);
    gl.uniform4fv(P.u.uTeeth, teeth);
    gl.uniform4fv(P.u.uTongue, tongue);
    gl.uniform1f(P.u.uShadeK, shadeK);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.uniform1i(P.u.uTex, 0);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    this.draws++;
    this.tris += mesh.count / 3;
  }

  drawEye(mesh, e) {
    const gl = this.gl, P = this.eye;
    gl.useProgram(P.p);
    gl.uniform2f(P.u.uView, this.canvas.width, this.canvas.height);
    gl.uniform4fv(P.u.uCam, this.cam);
    const bind = (unit, name, tex, rect, rn) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(P.u[name], unit);
      gl.uniform4f(P.u[rn], rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
    };
    bind(0, "uSclera", e.sclera.tex, e.sclera.rect, "uScleraRect");
    bind(1, "uIris", e.iris.tex, e.iris.rect, "uIrisRect");
    bind(2, "uCatch", e.catch.tex, e.catch.rect, "uCatchRect");
    gl.uniform2fv(P.u.uIrisC, e.irisC);
    gl.uniform2fv(P.u.uIrisScale, e.irisScale);
    gl.uniform2fv(P.u.uIrisScr, e.irisScr);
    gl.uniform2fv(P.u.uCatchScr, e.catchScr);
    gl.uniform2fv(P.u.uCatchC, e.catchC);
    gl.uniform1f(P.u.uIrisK, e.irisK);
    gl.uniform1f(P.u.uCatchA, e.catchA);
    gl.uniform1f(P.u.uLidShade, e.lidShade);
    gl.uniform1f(P.u.uTopY, e.topY);
    gl.bindVertexArray(mesh.vao);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    this.draws++;
    this.tris += mesh.count / 3;
  }
}
