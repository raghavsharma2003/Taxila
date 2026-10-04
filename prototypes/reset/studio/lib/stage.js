/* Taxila Studio engine-lite (prototype of the ENGINE layer in docs/design/reset/STUDIO-V2.md §5).
 *
 * Everything in this file is what the model NEVER writes: the 16:10 fit, DPR and adaptive resolution, the frame loop,
 * pointer mapping, tweens/easing, pooled particles, screen shake, hit-stop, glow sprites, synthesized sound, the
 * Studio host bridge (params / answer / event / ready / done) and the test seam. Artifacts (games, sims, scenes) are
 * thin: an engine module for the archetype + a generated JSON spec.
 *
 * Classic script (no modules) so the prototypes also open from file://.
 */
(function () {
  "use strict";

  const W = 1000, H = 625;                          // DESIGN-V3 §6.2 canvas 1000 x 625 (16:10)
  const SAFE = {                                      // DESIGN-V3 §6.3, in world units
    label: { x: 0, y: 0, w: 180, h: 75 },             // top-left 18% x 12%
    pip: { x: W - 162.5, y: 0, w: 162.5, h: 162.5 },  // top-right square, 26% of the short side
  };
  const MIN = { label: 38, value: 48, stroke: 4, target: 130 };   // DESIGN-V3 §6.4

  const C = {
    bg: "#0A0C12", bg1: "#10131B", bg2: "#161A24", bg3: "#1F2431", stage: "#0D1017",
    ink: "#F2F4F8", ink2: "#A9B0C0", ink3: "#848CA0",
    ion: "#8B98FF", ionDeep: "#4F5BD5", volt: "#CBFF4D", mint: "#3DDC97", amber: "#FFB547",
    sci: "#2FD3C7", line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.15)",
  };
  const FONT = {
    display: '"Bricolage Grotesque", system-ui, sans-serif',
    ui: '"Atkinson Hyperlegible Next", system-ui, sans-serif',
    mono: '"Geist Mono", ui-monospace, monospace',
  };

  const qs = new URLSearchParams(location.search);
  const reducedMotion = qs.get("motion") === "reduce" ||
    (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ------------------------------------------------------------------ easing + tweens */
  const ease = {
    linear: (t) => t,
    inQuad: (t) => t * t,
    outQuad: (t) => 1 - (1 - t) * (1 - t),
    inOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
    outCubic: (t) => 1 - Math.pow(1 - t, 3),
    inCubic: (t) => t * t * t,
    inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: (t) => 1 - Math.pow(1 - t, 4),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
    outSine: (t) => Math.sin((t * Math.PI) / 2),
    outBack: (t) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

  const tweens = [];
  function tween(target, props, o) {
    o = o || {};
    const tw = { target, from: {}, to: props, dur: o.dur != null ? o.dur : 0.3, delay: o.delay || 0,
      ease: typeof o.ease === "function" ? o.ease : ease[o.ease || "outCubic"], t: 0, onDone: o.onDone, onUpdate: o.onUpdate, started: false, dead: false };
    tweens.push(tw);
    return tw;
  }
  function killTweens(target) { for (const tw of tweens) if (tw.target === target) tw.dead = true; }
  function stepTweens(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      if (tw.dead) { tweens.splice(i, 1); continue; }
      if (tw.delay > 0) { tw.delay -= dt; continue; }
      if (!tw.started) { for (const k in tw.to) tw.from[k] = tw.target[k]; tw.started = true; }
      tw.t += dt;
      const p = tw.dur <= 0 ? 1 : clamp(tw.t / tw.dur, 0, 1);
      const e = tw.ease(p);
      for (const k in tw.to) tw.target[k] = lerp(tw.from[k], tw.to[k], e);
      if (tw.onUpdate) tw.onUpdate(e);
      if (p >= 1) { tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
    }
  }

  /* ------------------------------------------------------------------ glow sprites (no shadowBlur in the hot loop) */
  const glowCache = new Map();
  function glow(color, radius, soft) {
    const key = color + "|" + radius + "|" + (soft || 0);
    let c = glowCache.get(key);
    if (c) return c;
    const s = Math.ceil(radius * 2);
    c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    const k = soft == null ? 0.35 : soft;
    grd.addColorStop(0, hexA(color, 1));
    grd.addColorStop(k, hexA(color, 0.45));
    grd.addColorStop(1, hexA(color, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
    glowCache.set(key, c);
    return c;
  }
  function hexA(hex, a) {
    if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  function mix(hexA_, hexB, t) {
    const pa = parseInt(hexA_.slice(1), 16), pb = parseInt(hexB.slice(1), 16);
    const r = Math.round(lerp((pa >> 16) & 255, (pb >> 16) & 255, t));
    const g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t));
    const b = Math.round(lerp(pa & 255, pb & 255, t));
    return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
  }

  /* ------------------------------------------------------------------ stage: 16:10 fit, DPR, adaptive resolution, pointer */
  function stage(opts) {
    const el = typeof opts.el === "string" ? document.querySelector(opts.el) : opts.el;
    const canvas = el.querySelector("canvas") || el.appendChild(document.createElement("canvas"));
    const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
    const st = { el, canvas, ctx, W, H, scale: 1, dpr: 1, cssW: 0, cssH: 0, maxDpr: Math.min(window.devicePixelRatio || 1, 2), handlers: [] };
    if (qs.get("dpr")) st.maxDpr = Math.max(0.5, Math.min(3, parseFloat(qs.get("dpr"))));
    st.dpr = st.maxDpr;
    function resize() {
      const r = el.getBoundingClientRect();
      st.cssW = r.width; st.cssH = r.height;
      canvas.width = Math.max(1, Math.round(r.width * st.dpr));
      canvas.height = Math.max(1, Math.round(r.height * st.dpr));
      st.scale = canvas.width / W;          // the box is exactly 16:10, so one scale fits both axes
      perf.dpr = st.dpr;
    }
    st.resize = resize;
    st.setDpr = (d) => { st.dpr = d; resize(); };
    resize();
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(el); else window.addEventListener("resize", resize);

    st.begin = function () {               // world transform for this frame
      ctx.setTransform(st.scale, 0, 0, st.scale, 0, 0);
    };
    st.toWorld = function (ev) {
      const r = canvas.getBoundingClientRect();
      return { x: ((ev.clientX - r.left) / r.width) * W, y: ((ev.clientY - r.top) / r.height) * H };
    };
    // Pointer: one active pointer (the child's finger); mouse hover is reported as move with down=false.
    let active = null;
    const emit = (type, ev) => {
      const p = st.toWorld(ev);
      p.down = active === ev.pointerId; p.type = ev.pointerType; p.id = ev.pointerId;
      for (const h of st.handlers) if (h[type]) h[type](p, ev);
    };
    canvas.addEventListener("pointerdown", (ev) => { if (active !== null) return; active = ev.pointerId; canvas.setPointerCapture(ev.pointerId); sfx.unlock(); emit("down", ev); ev.preventDefault(); });
    canvas.addEventListener("pointermove", (ev) => { if (active !== null && ev.pointerId !== active) return; emit("move", ev); });
    const up = (ev) => { if (ev.pointerId !== active) return; emit("up", ev); active = null; };
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    st.onPointer = (h) => st.handlers.push(h);
    return st;
  }

  /* ------------------------------------------------------------------ loop + perf (G9) */
  const perf = { frames: [], dpr: 1, dprChanges: [], started: 0, hidden: 0 };
  window.__studioPerf = perf;
  function loop(st, update, render) {
    let last = performance.now(), running = true, stopAt = 0;
    let hitstop = 0, slow = [];
    perf.started = last;
    const api = {
      paused: false,
      hitstop(ms) { if (!reducedMotion) hitstop = Math.max(hitstop, ms / 1000); },
      stop() { running = false; },
    };
    document.addEventListener("visibilitychange", () => { if (document.hidden) perf.hidden++; last = performance.now(); });
    function frame(now) {
      if (!running) return;
      requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      const raw = now - last;
      last = now;
      perf.frames.push(raw);
      if (perf.frames.length > 20000) perf.frames.splice(0, 10000);
      // Adaptive resolution: if the median frame over ~1.5 s is slower than 52 fps, step DPR down (never back up).
      slow.push(raw);
      if (slow.length >= 90) {
        const s = slow.slice().sort((a, b) => a - b);
        const med = s[s.length >> 1];
        if (med > 19.2 && st.dpr > 1.01 && !qs.get("dpr")) {
          const next = st.dpr > 1.6 ? 1.5 : st.dpr > 1.3 ? 1.25 : 1;
          perf.dprChanges.push({ at: Math.round(now - perf.started), from: st.dpr, to: next, medMs: +med.toFixed(1) });
          st.setDpr(next);
        }
        slow = [];
      }
      let dt = Math.min(raw / 1000, 1 / 30);
      if (api.paused) dt = 0;
      if (hitstop > 0) { hitstop -= dt; dt = 0; }
      // Frame guard (STUDIO-V2 §8): a throwing frame never reaches the child. The last good image (snapshotted
      // every ~0.5 s, one blit) is put back; 3 errors inside 1 s stop the loop and raise engine_failed so the host
      // cross-fades to the board version of the same idea.
      try {
        stepTweens(dt);
        update(dt, now / 1000);
        st.begin();
        render(st.ctx, now / 1000);
        if (now - goodAt > 500) { snapshot(); goodAt = now; }
      } catch (e) {
        errTimes.push(now); errTimes = errTimes.filter((t) => now - t < 1000);
        if (!errLogged) { errLogged = true; studio.event("frame_error", { message: String(e && e.message || e).slice(0, 160) }); }
        try { const c = st.ctx; if (c.reset) c.reset(); else c.setTransform(1, 0, 0, 1, 0, 0); if (good) { c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = "source-over"; c.drawImage(good, 0, 0, st.canvas.width, st.canvas.height); } } catch (e2) { /* nothing more to do */ }
        if (errTimes.length >= 3) { running = false; studio.event("engine_failed", { errors: errTimes.length }); }
      }
    }
    let good = null, goodAt = -1e9, errTimes = [], errLogged = false;
    function snapshot() {
      if (!good) good = document.createElement("canvas");
      if (good.width !== st.canvas.width || good.height !== st.canvas.height) { good.width = st.canvas.width; good.height = st.canvas.height; }
      const g = good.getContext("2d"); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, good.width, good.height); g.drawImage(st.canvas, 0, 0);
    }
    requestAnimationFrame(frame);
    return api;
  }
  perf.summary = function (fromMs) {
    const f = perf.frames.slice(fromMs ? Math.floor(fromMs) : 30);
    if (!f.length) return null;
    const s = f.slice().sort((a, b) => a - b);
    const pct = (p) => +s[Math.min(s.length - 1, Math.floor(p * s.length))].toFixed(2);
    const over = (ms) => +(100 * f.filter((x) => x > ms).length / f.length).toFixed(2);
    const total = f.reduce((a, b) => a + b, 0);
    return { n: f.length, fps: +(1000 * f.length / total).toFixed(1), p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), over20ms: over(20), over33ms: over(33.4), dpr: perf.dpr, dprChanges: perf.dprChanges };
  };

  /* ------------------------------------------------------------------ fx: particles, rings, popups, shake, flash */
  function fx(st, lp) {
    const P = [], R = [], T = [];
    const self = { shakeAmp: 0, shakeT: 0, shakeDur: 0, ox: 0, oy: 0, flashA: 0, flashColor: C.mint };
    self.burst = function (x, y, o) {
      if (reducedMotion) return;
      const n = o.n || 16;
      for (let i = 0; i < n; i++) {
        const a = o.angle != null ? o.angle + (Math.random() - 0.5) * (o.spread || Math.PI * 2) : Math.random() * Math.PI * 2;
        const sp = (o.speed || 300) * (0.35 + Math.random() * 0.75);
        P.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: (o.life || 0.7) * (0.6 + Math.random() * 0.6), t: 0,
          size: (o.size || 10) * (0.6 + Math.random() * 0.8), color: o.color || C.ion, g: o.gravity || 0, drag: o.drag == null ? 2.2 : o.drag,
          shard: !!o.shard, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, floor: o.floor });
      }
      if (P.length > 420) P.splice(0, P.length - 420);
    };
    self.ring = function (x, y, o) {
      R.push({ x, y, r0: o.r0 || 6, r1: o.r1 || 90, life: o.life || 0.5, t: 0, w: o.width || 6, color: o.color || C.ion });
    };
    self.pop = function (text, x, y, o) {
      o = o || {};
      T.push({ text, x, y, t: 0, life: o.life || 0.9, color: o.color || C.ink, size: o.size || 44, font: o.font || "display", weight: o.weight || 700, rise: o.rise == null ? 70 : o.rise });
    };
    self.shake = function (amp, dur) { if (reducedMotion) return; self.shakeAmp = Math.max(self.shakeAmp, amp); self.shakeDur = dur || 0.25; self.shakeT = self.shakeDur; };
    self.flash = function (color, a) { self.flashColor = color; self.flashA = Math.max(self.flashA, a == null ? 0.18 : a); };
    self.update = function (dt) {
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.t += dt;
        if (p.t >= p.life) { P.splice(i, 1); continue; }
        const d = Math.exp(-p.drag * dt);
        p.vx *= d; p.vy = p.vy * d + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.floor != null && p.y > p.floor) { p.y = p.floor; p.vy *= -0.38; p.vx *= 0.7; p.vr *= 0.6; }
      }
      for (let i = R.length - 1; i >= 0; i--) { R[i].t += dt; if (R[i].t >= R[i].life) R.splice(i, 1); }
      for (let i = T.length - 1; i >= 0; i--) { T[i].t += dt; if (T[i].t >= T[i].life) T.splice(i, 1); }
      if (self.shakeT > 0) {
        self.shakeT -= dt;
        const k = Math.max(0, self.shakeT / self.shakeDur);
        self.ox = (Math.random() * 2 - 1) * self.shakeAmp * k;
        self.oy = (Math.random() * 2 - 1) * self.shakeAmp * k;
      } else { self.ox = self.oy = 0; self.shakeAmp = 0; }
      self.flashA = Math.max(0, self.flashA - dt * 0.9);
    };
    self.drawWorld = function (ctx) {           // particles + rings, inside the shaken world transform
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const p of P) {
        const k = 1 - p.t / p.life;
        if (p.shard) {
          ctx.save();
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = Math.min(1, k * 1.4);
          ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath(); ctx.moveTo(-p.size * 0.6, -p.size * 0.3); ctx.lineTo(p.size * 0.7, -p.size * 0.1); ctx.lineTo(-p.size * 0.1, p.size * 0.55); ctx.closePath(); ctx.fill();
          ctx.restore();
        } else {
          const s = p.size * (0.5 + k * 0.8);
          ctx.globalAlpha = k;
          const g = glow(p.color, 24);
          ctx.drawImage(g, p.x - s, p.y - s, s * 2, s * 2);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      for (const r of R) {
        const k = r.t / r.life, e = ease.outCubic(k);
        ctx.globalAlpha = (1 - k) * 0.9;
        ctx.strokeStyle = r.color;
        ctx.lineWidth = Math.max(MIN.stroke * 0.5, r.w * (1 - k));
        ctx.beginPath(); ctx.arc(r.x, r.y, lerp(r.r0, r.r1, e), 0, Math.PI * 2); ctx.stroke();
      }
      for (const t of T) {
        const k = t.t / t.life;
        const y = t.y - t.rise * ease.outCubic(k);
        const sc = k < 0.15 ? ease.outBack(k / 0.15) : 1;
        ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1;
        text(ctx, t.text, t.x, y, { size: t.size * sc, font: t.font, weight: t.weight, color: t.color, align: "center", baseline: "middle", glow: t.color, decor: sc < 0.999 });
      }
      ctx.restore();
    };
    self.drawScreen = function (ctx) {          // full-stage flash (screen space)
      if (self.flashA > 0.002) {
        ctx.save();
        const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
        g.addColorStop(0, hexA(self.flashColor, 0));
        g.addColorStop(1, hexA(self.flashColor, self.flashA));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    };
    self.count = () => P.length;
    return self;
  }

  /* ------------------------------------------------------------------ text helper (min sizes enforced in dev) */
  const tooSmall = [];
  function text(ctx, str, x, y, o) {
    o = o || {};
    const size = o.size || MIN.label;
    if (size < MIN.label - 0.01 && !o.decor) tooSmall.push({ str: String(str).slice(0, 20), size });
    ctx.font = `${o.weight || 600} ${size}px ${FONT[o.font || "ui"]}`;
    ctx.textAlign = o.align || "left";
    ctx.textBaseline = o.baseline || "alphabetic";
    if ("letterSpacing" in ctx) ctx.letterSpacing = (o.track || 0) + "px";
    if (o.glow) {
      ctx.save();
      ctx.globalAlpha *= 0.55;
      ctx.shadowColor = o.glow; ctx.shadowBlur = size * 0.5;
      ctx.fillStyle = o.color || C.ink;
      ctx.fillText(str, x, y);
      ctx.restore();
    }
    ctx.fillStyle = o.color || C.ink;
    if (o.alpha != null) { ctx.save(); ctx.globalAlpha *= o.alpha; ctx.fillText(str, x, y); ctx.restore(); }
    else ctx.fillText(str, x, y);
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
  }
  function measure(ctx, str, o) {
    ctx.font = `${o.weight || 600} ${o.size || MIN.label}px ${FONT[o.font || "ui"]}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = (o.track || 0) + "px";
    const w = ctx.measureText(str).width;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    return w;
  }
  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  /* ------------------------------------------------------------------ sound: synthesized, no assets, no network */
  const sfx = (function () {
    let ac = null, master = null, muted = qs.get("sound") === "off";
    function ensure() {
      if (ac) return ac;
      const A = window.AudioContext || window.webkitAudioContext;
      if (!A) return null;
      ac = new A();
      master = ac.createGain(); master.gain.value = muted ? 0 : 0.32; master.connect(ac.destination);
      return ac;
    }
    return {
      unlock() { const a = ensure(); if (a && a.state === "suspended") a.resume(); },
      setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.32; },
      get muted() { return muted; },
      blip(o) {
        const a = ensure(); if (!a || muted) return;
        const t = a.currentTime, d = o.dur || 0.12;
        const osc = a.createOscillator(), g = a.createGain();
        osc.type = o.type || "sine";
        osc.frequency.setValueAtTime(o.f || 660, t);
        if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + d);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(o.gain || 0.3, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + d + 0.02);
      },
      noise(o) {
        const a = ensure(); if (!a || muted) return;
        const t = a.currentTime, d = o.dur || 0.2;
        const buf = a.createBuffer(1, Math.ceil(a.sampleRate * d), a.sampleRate);
        const ch = buf.getChannelData(0);
        for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 2);
        const src = a.createBufferSource(); src.buffer = buf;
        const f = a.createBiquadFilter(); f.type = o.filter || "lowpass"; f.frequency.value = o.f || 900;
        const g = a.createGain(); g.gain.value = o.gain || 0.25;
        src.connect(f); f.connect(g); g.connect(master); src.start(t);
      },
    };
  })();

  /* ------------------------------------------------------------------ Studio host bridge + test seam (LIVE-STUDIO §3.10, D2) */
  const log = [];
  window.__studioLog = log;
  const studio = {
    params() {
      // A generated spec can arrive malformed (truncated, not an object). Never throw: hand the engine an empty
      // object so its validator falls back to the archetype default, and record why for the router's quality score.
      const el = document.getElementById("spec");
      if (!el) return {};
      try {
        const v = JSON.parse(el.textContent);
        if (v && typeof v === "object" && !Array.isArray(v)) return v;
        log.push({ k: "event", name: "spec_unparseable", data: { reason: "not-an-object" }, at: Math.round(performance.now()) });
      } catch (e) {
        log.push({ k: "event", name: "spec_unparseable", data: { reason: "json" }, at: Math.round(performance.now()) });
      }
      return {};
    },
    t(strings, key) { return strings && Object.prototype.hasOwnProperty.call(strings, key) ? strings[key] : ""; },
    answer(itemId, value, extra) { const m = { k: "answer", itemId, value, extra, at: Math.round(performance.now()) }; log.push(m); post(m); },
    event(name, data) { const m = { k: "event", name, data, at: Math.round(performance.now()) }; log.push(m); post(m); },
    ready() { const m = { k: "ready", at: Math.round(performance.now()) }; log.push(m); post(m); document.documentElement.dataset.ready = "1"; },
    done(summary) { const m = { k: "done", summary, at: Math.round(performance.now()) }; log.push(m); post(m); },
    seam: null,              // artifacts register a function returning live state for the QA bot (test builds only)
  };
  function post(m) { try { if (window.parent && window.parent !== window) window.parent.postMessage({ studio: m }, "*"); } catch (e) { /* frame bridge is best-effort in prototypes */ } }
  window.__studio = studio;

  /* ------------------------------------------------------------------ HUD (engine-owned DOM, so it stays crisp and readable at any size) */
  function hud(st, defs) {
    const root = document.createElement("div");
    root.className = "hud";
    root.setAttribute("aria-live", "polite");
    const boxes = {};
    for (const d of defs) {
      const b = document.createElement("div");
      b.className = "box";
      b.innerHTML = `<span></span><b></b>${d.meter ? '<span class="meter"><i></i></span>' : ""}`;
      b.children[0].textContent = d.label;
      root.appendChild(b);
      boxes[d.key] = b;
    }
    st.el.appendChild(root);
    return {
      set(key, value, o) {
        const b = boxes[key]; if (!b) return;
        const v = String(value);
        if (b.children[1].textContent !== v) {
          b.children[1].textContent = v;
          if (o && o.bump) { b.classList.add("bump"); setTimeout(() => b.classList.remove("bump"), 160); }
        }
        b.classList.toggle("ion", !!(o && o.tone === "ion"));
        b.classList.toggle("mint", !!(o && o.tone === "mint"));
        if (o && o.meter != null) {
          const m = Math.round(o.meter * 100) + "%", mi = b.querySelector(".meter i");
          if (mi && mi.style.width !== m) mi.style.width = m;
        }
      },
      label(key, text) { if (boxes[key]) boxes[key].children[0].textContent = text; },
      show(on) { root.style.opacity = on ? "1" : "0"; },
      el: root,
    };
  }

  /* ------------------------------------------------------------------ host chrome toggles (review aids) */
  function hostChrome() {
    if (qs.get("pip") === "0") document.body.classList.add("no-pip");
    if (qs.get("safe") === "1") document.body.classList.add("show-safe");
    window.addEventListener("keydown", (e) => {
      if (e.key === "s" || e.key === "S") document.body.classList.toggle("show-safe");
      if (e.key === "m" || e.key === "M") sfx.setMuted(!sfx.muted);
      if (e.key === "?") document.body.classList.toggle("show-keys");
    });
  }
  async function fontsReady() {
    try {
      await Promise.all([
        document.fonts.load(`700 48px ${FONT.display}`),
        document.fonts.load(`600 40px ${FONT.mono}`),
        document.fonts.load(`600 40px ${FONT.ui}`),
      ]);
    } catch (e) { /* fall back to system fonts; never block the artifact */ }
  }

  window.TaxStudio = { W, H, SAFE, MIN, C, FONT, ease, lerp, clamp, smooth, tween, killTweens, glow, hexA, mix, stage, loop, fx,
    text, measure, roundRect, sfx, studio, perf, reducedMotion, qs, hostChrome, fontsReady, tooSmall, hud };
})();
