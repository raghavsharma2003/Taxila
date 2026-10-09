/* ============================================================
   core: utilities, icons, sound, the live teacher face, speech, router
   ============================================================ */
const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const html = (s) => { const t = document.createElement("template"); t.innerHTML = s.trim(); return t.content.firstElementChild; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ops = (str) => String(str).replace(/[×=≠÷]/g, (m) => `<i class="op">${m}</i>`);
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* --- icons: 24-unit grid, 1.75 stroke, round joins --- */
const I = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const ICON = {
  grid: I('<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>'),
  play: I('<path d="M8 5.5v13l10.5-6.5z" fill="currentColor" stroke="none"/>'),
  speaker: I('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/>'),
  mic: I('<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3"/>'),
  keyboard: I('<rect x="3" y="6.5" width="18" height="11" rx="1.5"/><path d="M7 10h.01M10.3 10h.01M13.7 10h.01M17 10h.01M7 13.5h.01M17 13.5h.01M10 14h4"/>'),
  send: I('<path d="M4.5 12 19.5 5l-4 14-3.5-5.5z"/><path d="M12 13.5 19.5 5"/>'),
  pause: I('<rect x="6.5" y="5" width="3.5" height="14" rx=".8"/><rect x="14" y="5" width="3.5" height="14" rx=".8"/>'),
  back: I('<path d="M14.5 5.5 8 12l6.5 6.5"/>'),
  close: I('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: I('<path d="m6 9 6 6 6-6"/>'),
  undo: I('<path d="M8.5 7.5 4.5 11.5l4 4"/><path d="M4.5 11.5h10a5 5 0 0 1 0 10H11"/>'),
  tick: I('<path d="m4.5 12.5 4.5 4.5L19.5 6.5"/>'),
  look: I('<circle cx="10.5" cy="10.5" r="5.5"/><path d="m15 15 4.5 4.5"/>'),
  locate: I('<circle cx="12" cy="12" r="3"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3"/><circle cx="12" cy="12" r="7.5"/>'),
  map: I('<path d="M3.5 6.5 9 4l6 2.5 5.5-2.5v13L15 19.5 9 17l-5.5 2.5z"/><path d="M9 4v13M15 6.5v13"/>'),
  list: I('<path d="M9 6.5h11M9 12h11M9 17.5h11"/><circle cx="4.8" cy="6.5" r=".9" fill="currentColor"/><circle cx="4.8" cy="12" r=".9" fill="currentColor"/><circle cx="4.8" cy="17.5" r=".9" fill="currentColor"/>'),
  shield: I('<path d="M12 3.5 19 6v5.5c0 4.4-3 7.8-7 9-4-1.2-7-4.6-7-9V6z"/><path d="m8.8 12.2 2.3 2.3 4.4-4.6"/>'),
  door: I('<path d="M6 20.5V4.5h9.5v16M3.5 20.5h17"/><circle cx="12.6" cy="12.5" r=".9" fill="currentColor"/>'),
  lantern: I('<path d="M12 2.5v2.5M9 5h6l1.5 3.5v8L15 19.5H9l-1.5-3V8.5z"/><path d="M12 9.5c1.2 1.2 1.2 3.4 0 4.8-1.2-1.4-1.2-3.6 0-4.8z" fill="currentColor"/>'),
  repeat: I('<path d="M17 4.5 19.5 7 17 9.5"/><path d="M4.5 12.5v-1a4.5 4.5 0 0 1 4.5-4.5h10.5M7 19.5 4.5 17 7 14.5"/><path d="M19.5 11.5v1A4.5 4.5 0 0 1 15 17H4.5"/>'),
  sound: I('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M16 9.5l4 5M20 9.5l-4 5"/>'),
  soundOn: I('<path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z"/><path d="M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10"/>'),
};
/* floor glyphs: the shape carries the state, colour is last */
const FLOOR = {
  speaking: I('<path d="M6 9.5v5M9.5 7v10M13 9v6"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6.5a8 8 0 0 1 0 11"/>'),
  your_turn: I('<path d="M7.5 12.5V7.8a1.3 1.3 0 0 1 2.6 0v3.7M10.1 11V6a1.3 1.3 0 0 1 2.6 0v5M12.7 11V6.8a1.3 1.3 0 0 1 2.6 0V12M15.3 11.5V9a1.3 1.3 0 0 1 2.6 0v4.5a6.5 6.5 0 0 1-6.5 6.5c-2.4 0-3.8-1-5.2-3l-2-3a1.3 1.3 0 0 1 2.1-1.5l1.2 1.4"/>'),
  listening: I('<path d="M8 15.5c0 2 1.3 3.5 3.2 3.5 2.2 0 2.3-2.6 3.8-4 1.6-1.4 2.5-2.7 2.5-4.8A5.5 5.5 0 0 0 6.5 9.8"/><path d="M10 10.2a2 2 0 1 1 3.5 1.4c-.8.8-1.5 1.4-1.5 2.6"/>'),
  thinking: I('<circle cx="7" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="17" cy="12" r="1.2" fill="currentColor"/>'),
};
/* the brand: Taxila's gateway, abstracted to an ogee arch with a lamp point */
const ARCH_PATH = "M0,1 L0,0.40 C0,0.22 0.22,0.14 0.38,0.09 C0.45,0.07 0.49,0.035 0.5,0 C0.51,0.035 0.55,0.07 0.62,0.09 C0.78,0.14 1,0.22 1,0.40 L1,1 Z";
const BRAND = `<svg viewBox="0 0 26 26" aria-hidden="true"><path d="M4 24V11.5C4 7.5 8.5 5.7 11.3 4.6 12.2 4.2 12.8 3.4 13 2.5c.2.9.8 1.7 1.7 2.1C17.5 5.7 22 7.5 22 11.5V24" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M13 13.2c1.7 1.6 1.7 4.4 0 6.3-1.7-1.9-1.7-4.7 0-6.3z" fill="#E9A23B"/></svg>`;

/* ============================================================
   Sound: synthesised in WebAudio (no files). Only ever after the child's own act.
   ============================================================ */
const Sfx = {
  ctx: null, on: true,
  ensure() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { this.on = false; } } if (this.ctx && this.ctx.state === "suspended") this.ctx.resume(); return this.ctx; },
  env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); },
  noise(dur) { const c = this.ctx, b = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; },
  crack() { if (!this.on || !this.ensure()) return; const c = this.ctx, t = c.currentTime;
    const n = this.noise(0.25), bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2100; bp.Q.value = 0.9; const g = c.createGain(); this.env(g, t, 0.003, 0.5, 0.16); n.connect(bp).connect(g).connect(c.destination); n.start(t);
    const o = c.createOscillator(), og = c.createGain(); o.type = "sine"; o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(52, t + 0.18); this.env(og, t, 0.004, 0.55, 0.2); o.connect(og).connect(c.destination); o.start(t); o.stop(t + 0.3); },
  tock() { if (!this.on || !this.ensure()) return; const c = this.ctx, t = c.currentTime; const o = c.createOscillator(), g = c.createGain(); o.type = "triangle"; o.frequency.setValueAtTime(520, t); o.frequency.exponentialRampToValueAtTime(260, t + 0.08); this.env(g, t, 0.002, 0.28, 0.12); o.connect(g).connect(c.destination); o.start(t); o.stop(t + 0.2); },
  bell(f = 880, vol = 0.22, at = 0) { if (!this.on || !this.ensure()) return; const c = this.ctx, t = c.currentTime + at;
    for (const [m, a, d] of [[1, 1, 1.4], [2.76, 0.42, 0.7], [5.4, 0.2, 0.35], [0.5, 0.18, 1.2]]) { const o = c.createOscillator(), g = c.createGain(); o.type = "sine"; o.frequency.value = f * m; this.env(g, t, 0.004, vol * a, d); o.connect(g).connect(c.destination); o.start(t); o.stop(t + d + 0.1); } },
  turn() { this.bell(659, 0.07); this.bell(880, 0.07, 0.11); },
  finale() { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.bell(f, 0.16, i * 0.13)); },
};

/* ============================================================
   The teacher's face: the production style-C puppet (src/face-puppet, r8 rig + PuppetDriver),
   bundled unchanged. One live canvas per page, re-parented between screens.
   ============================================================ */
const PACK = window.TX_PACK;
const Face = {
  ok: false, rig: null, drv: null, canvas: null, host: null, status: null, raf: 0, lastDraw: 0,
  clip: null, an: null, buf: null, actx: null, fresh: false,
  async init() {
    try {
      if (typeof WebGL2RenderingContext === "undefined") throw new Error("no webgl2");
      const cv = document.createElement("canvas");
      cv.style.cssText = "position:absolute;left:0;top:0;width:100%;height:100%;display:block";
      const imgs = {};
      await Promise.all(Object.entries(PACK.imgs).map(async ([n, u]) => { const im = new Image(); im.src = u; await im.decode(); imgs[n] = im; }));
      const tmp = document.createElement("div"); tmp.style.cssText = "position:fixed;left:-9999px;top:0;width:120px;height:150px"; document.body.appendChild(tmp); tmp.appendChild(cv);
      this.rig = new TxPuppet.Puppet2DRig(cv, PACK.geom, null, imgs, { ext: "webp", dpr: Math.min(2, devicePixelRatio || 1), view: [170, 60, 690], clear: [251.4 / 255, 229.4 / 255, 188.6 / 255], reducedMotion: RM });
      this.rig.warm();
      this.drv = new TxPuppet.PuppetDriver({ band: "b3", seed: 7, reducedMotion: RM });
      this.canvas = cv; this.ok = true; tmp.remove();
      const loop = (now) => { this.raf = requestAnimationFrame(loop); this.tick(now); };
      this.raf = requestAnimationFrame(loop);
    } catch (e) { console.warn("face: falling back to the still", e); this.ok = false; }
  },
  /** put the one live face into a slot; elsewhere a still of the same face */
  attach(host, view) {
    const slot = host.querySelector(".jh-face") || host;
    if (!this.ok) { if (!slot.querySelector("img")) slot.appendChild(posterImg()); return; }
    slot.querySelectorAll("img").forEach((i) => i.remove());
    slot.appendChild(this.canvas); this.host = slot;
    if (view) this.rig.view = view;
    this.drv.busyUntil = performance.now() / 1000 + 1;
  },
  setStatus(s) { this.status = s; if (this.drv) this.drv.busyUntil = performance.now() / 1000 + 1; },
  cut() { if (this.drv) this.drv.cut(); },
  tick(now) {
    if (!this.host || !this.host.isConnected || document.hidden) return;
    const busy = now / 1000 < this.drv.busyUntil || this.status === "speaking" || this.clip;
    const want = busy ? 60 : 30;
    if (want < 60 && now - this.lastDraw < 1000 / want - 2) return;
    this.lastDraw = now;
    let tap = { buf: null, sampleRate: 48000, t: now / 1000, level: 0, fresh: false };
    if (this.clip && this.an) { this.an.getFloatTimeDomainData(this.buf); tap = { buf: this.buf, sampleRate: this.actx.sampleRate, t: this.actx.currentTime, level: 0, fresh: this.fresh }; this.fresh = false; }
    try { this.drv.frame({ nowMs: now, tap, status: this.status, childLevel: 0 }, this.rig); } catch (e) { console.warn(e); this.ok = false; }
  },
  /** silent speech: visemes generated from her caption text (the product drives these from the TTS voice) */
  say(text) {
    const tr = visemesFor(text);
    if (this.ok) this.drv.visemes.push(++this._part || (this._part = 1), performance.now() + 40, tr.vis, tr.words, performance.now(), tr.spoken);
    this.setStatus("speaking");
    return tr.dur;
  },
  /** her real recorded voice, lip-synced by the production audio lip driver */
  playClip(src, onEnd) {
    const a = new Audio(src); a.preload = "auto";
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      this.actx = this.actx || new C(); this.actx.resume();
      const s = this.actx.createMediaElementSource(a);
      this.an = this.actx.createAnalyser(); this.an.fftSize = 2048; this.an.smoothingTimeConstant = 0; this.buf = new Float32Array(2048);
      s.connect(this.an); this.an.connect(this.actx.destination);
    } catch { this.an = null; }
    this.clip = a; this.fresh = true; this.setStatus("speaking");
    a.addEventListener("ended", () => { this.clip = null; this.setStatus(null); onEnd && onEnd(); });
    a.addEventListener("error", () => { this.clip = null; this.setStatus(null); onEnd && onEnd(true); });
    a.play().catch(() => { this.clip = null; onEnd && onEnd(true); });
    return a;
  },
  stopClip() { if (this.clip) { this.clip.pause(); this.clip = null; this.setStatus(null); } },
};
function posterImg() { const im = new Image(); im.src = PACK.poster.close; im.alt = ""; im.style.cssText = "position:absolute;left:-12%;top:-4%;width:124%;height:auto"; return im; }

/* the jharokha: an arched, lamplit window (the face is always on c-front's cream: that cream becomes lamplight) */
function jharokha(extraCls = "") {
  return `<div class="jharokha ${extraCls}" style="clip-path:url(#jhClip)">
    <div class="jh-face"></div><div class="jh-grade"></div><div class="jh-rim"></div></div>` + jhFrame();
}
function jhFrame() {
  return `<svg class="jh-frame" viewBox="0 0 100 130" preserveAspectRatio="none" aria-hidden="true">
      <path d="${archD(100, 130, 0)}" fill="none" stroke="#5B3326" stroke-width="7" vector-effect="non-scaling-stroke" opacity=".85"/>
      <path d="${archD(100, 130, 0)}" fill="none" stroke="url(#gBrass)" stroke-width="3.2" vector-effect="non-scaling-stroke"/>
      <path d="${archD(100, 130, 4.2)}" fill="none" stroke="rgba(255,230,180,.55)" stroke-width="1" vector-effect="non-scaling-stroke"/>
    </svg>`;
}
function archD(w, h, inset) { // ARCH_PATH scaled to w×h with an inset
  const sx = (x) => (inset + x * (w - 2 * inset)).toFixed(2), sy = (y) => (inset + y * (h - inset)).toFixed(2);
  return `M${sx(0)},${h} L${sx(0)},${sy(0.40)} C${sx(0)},${sy(0.22)} ${sx(0.22)},${sy(0.14)} ${sx(0.38)},${sy(0.09)} C${sx(0.45)},${sy(0.07)} ${sx(0.49)},${sy(0.035)} ${sx(0.5)},${sy(0)} C${sx(0.51)},${sy(0.035)} ${sx(0.55)},${sy(0.07)} ${sx(0.62)},${sy(0.09)} C${sx(0.78)},${sy(0.14)} ${sx(1)},${sy(0.22)} ${sx(1)},${sy(0.40)} L${sx(1)},${h}`;
}

/* ============================================================
   Hinglish caption → mouth shapes (Azure viseme ids), for the silent prototype lines
   ============================================================ */
const SPOKEN_NUM = { 1: "ek", 2: "do", 3: "teen", 4: "chaar", 5: "paanch", 6: "chhe", 7: "saat", 8: "aath", 9: "nau", 10: "das", 12: "baarah", 18: "atthaarah", 36: "chhattees", 72: "bahattar", 360: "teen sau saath" };
function speakable(text) {
  return text.replace(/\d+/g, (m) => " " + (SPOKEN_NUM[m] || m.split("").map((d) => SPOKEN_NUM[d] || "").join(" ")) + " ")
    .replace(/×/g, " guna ").replace(/=/g, " barabar ").replace(/÷/g, " bhaag ").replace(/\s+/g, " ").trim();
}
function visemesFor(text) {
  const spoken = speakable(text);
  const vis = [], words = []; let t = 0;
  const V = { aa: [2, 125], ai: [11, 125], au: [9, 125], ee: [6, 105], oo: [7, 110], a: [1, 85], e: [4, 100], i: [6, 85], o: [8, 110], u: [7, 95] };
  const C = { bh: [21, 70], ph: [21, 70], ch: [16, 80], chh: [16, 85], sh: [16, 85], th: [19, 65], dh: [19, 65], kh: [20, 70], gh: [20, 70], jh: [16, 80],
    p: [21, 70], b: [21, 70], m: [21, 75], f: [18, 70], v: [18, 65], w: [7, 70], t: [19, 60], d: [19, 60], n: [19, 60], k: [20, 65], g: [20, 65], q: [20, 65], c: [20, 65],
    j: [16, 75], z: [15, 75], s: [15, 80], l: [14, 60], r: [13, 55], h: [12, 45], y: [6, 55], x: [20, 60] };
  for (const tok of spoken.split(/(\s+|[,.!?—–:;]+)/)) {
    if (!tok) continue;
    if (/^\s+$/.test(tok)) { t += 35; continue; }
    if (/^[,.!?—–:;]+$/.test(tok)) { vis.push({ ms: t, id: 0 }); t += /[.!?]/.test(tok) ? 300 : 170; continue; }
    const w = tok.toLowerCase().replace(/[^a-z]/g, ""); if (!w) continue;
    const w0 = t; let i = 0;
    while (i < w.length) {
      const tri = w.slice(i, i + 3), bi = w.slice(i, i + 2), ch = w[i];
      let hit = C[tri] && tri === "chh" ? [C[tri], 3] : V[bi] ? [V[bi], 2] : C[bi] ? [C[bi], 2] : V[ch] ? [V[ch], 1] : C[ch] ? [C[ch], 1] : null;
      if (!hit) { i++; continue; }
      vis.push({ ms: t, id: hit[0][0] }); t += hit[0][1]; i += hit[1];
    }
    words.push({ ms: w0, durMs: t - w0, text: w });
  }
  vis.push({ ms: t, id: 0 });
  return { vis, words, dur: t + 200, spoken };
}

/* ============================================================
   Router: each screen is a place; moving between them is a camera move
   ============================================================ */
const ORDER = ["hello", "home", "lesson", "game", "map", "parent"];
const NAMES = { hello: ["First run", "Hello, and choosing your teacher"], home: ["Home", "The terrace at dusk"], lesson: ["Live lesson", "Prime factorisation with Asha"], game: ["Game", "Todo-Jodo: break 72"], map: ["World", "Your valley of understanding"], parent: ["Parent corner", "Riya's week"] };
const Screens = {};
let CUR = null, GEN = 0;
function go(id, o = {}) {
  if (!Screens[id] || id === CUR) return;
  const prev = CUR ? Screens[CUR] : null, next = Screens[id];
  if (!next.built) { next.build(); next.built = true; }
  const fwd = o.back ? false : !prev || ORDER.indexOf(id) >= ORDER.indexOf(CUR);
  GEN++;
  const box = $("#tx").getBoundingClientRect();
  const org = o.from ? `${Math.round(o.from.x - box.left)}px ${Math.round(o.from.y - box.top)}px` : "50% 50%";
  if (prev) {
    prev.leave && prev.leave();
    const pe = prev.el; pe.style.transformOrigin = org; pe.classList.remove("on", "cam-in", "cam-back-in"); pe.classList.add(fwd ? "cam-out" : "cam-back-out");
    setTimeout(() => pe.classList.remove("cam-out", "cam-back-out"), 800);
  }
  const ne = next.el; ne.style.transformOrigin = org; ne.classList.remove("cam-out", "cam-back-out"); ne.classList.add("on", fwd ? "cam-in" : "cam-back-in");
  setTimeout(() => ne.classList.remove("cam-in", "cam-back-in"), 800);
  CUR = id;
  next.enter && next.enter(o);
  $$(".db-tab").forEach((b) => b.setAttribute("aria-current", String(b.dataset.s === id)));
  try { history.replaceState(null, "", "#" + id + (document.getElementById("shell").classList.contains("phone") ? "&phone" : "")); } catch {}
}
const centerOf = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
function placeName(el, kicker, title, top) {
  const p = el.querySelector(".placename"); if (!p) return;
  p.style.top = top || "";
  p.innerHTML = `<div class="pn-k">${kicker}</div><div class="pn-t">${title}</div>`;
  p.classList.remove("show"); void p.offsetWidth; p.classList.add("show");
}
/** a sequence that dies when the screen changes */
function seq() { const g = GEN; return { alive: () => g === GEN, wait: async (ms) => { await sleep(ms); return g === GEN; } }; }
