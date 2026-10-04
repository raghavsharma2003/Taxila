/* WHY THE MOON HAS PHASES — archetype `orbital-explainer@1` (STUDIO-V2 §4, animation archetype A7).
 *
 * ENGINE (this file): a deterministic scene timeline (every property is a pure function of time, so it can be
 * scrubbed, replayed and checked frame by frame), narration-locked cues (clause-level, 400 ms pre-roll, anchored to
 * MEASURED audio durations from narration.js), the astronomy primitives (sun, rays, Earth, Moon, orbit, Earth's
 * shadow, the view from Earth with an exact phase terminator), captions, the interactive ending and the test seam.
 * GENERATED (index.html#spec): which narration line plays when, and which cue verbs fire on which clause, from a
 * closed verb list. The model never draws a terminator and never decides which half of the Moon is lit.
 */
(function () {
  "use strict";
  const S = window.TaxStudio;
  const { C, W, H, ease, clamp, lerp } = S;
  const NARR = window.__narration || { lines: {} };
  const PRE = 0.4;                                    // teacher-stage-cue-scheduler pre-roll
  const DEG = Math.PI / 180;

  /* ------------------------------------------------------------------ props (initial values) and verbs */
  const INIT = {
    "sky.a": 1, "space.a": 0, "cam.zoom": 2.6, "cam.x": 500, "cam.y": 300, "title.a": 0, "skyMoon.E": 40,
    "sun.a": 0, "rays.a": 0, "earth.a": 1, "orbit.a": 0, "moon.a": 0, "moon.theta": 315, "ghosts.n": 0, "ghosts.a": 1,
    "arcSun.a": 0, "arcNear.a": 0, "overlap.a": 0, "sight.a": 0, "inset.a": 0, "strip.a": 0, "strip.n": 0, "phase.a": 0,
    "shadow.a": 0, "eclipse.k": 0, "lbl.sun": 0, "lbl.earth": 0, "lbl.moon": 0, "lbl.light": 0, "lbl.scale": 0, "lbl.eclipse": 0,
  };
  const SHOWABLE = ["sky", "space", "title", "sun", "rays", "earth", "orbit", "moon", "ghosts", "arcSun", "arcNear", "overlap", "sight", "inset", "strip", "phase", "shadow"];
  const LABELS = ["sun", "earth", "moon", "light", "scale", "eclipse"];

  /* ------------------------------------------------------------------ captions: phrase chunks snapped to measured pauses */
  function chunksOf(id) {
    const ln = NARR.lines[id];
    const text = ln ? ln.text : (SPEC_TEXT[id] || "");
    const dur = ln ? ln.dur : Math.max(1.6, text.length / 14);
    const parts = text.split(/(?<=[.?!:])\s+/).filter(Boolean);
    const speechStart = ln ? ln.lead : 0, speechEnd = dur - (ln ? ln.tail : 0);
    const total = parts.reduce((a, p) => a + p.length, 0);
    const out = [];
    let acc = 0;
    for (let i = 0; i < parts.length; i++) {
      let t0 = speechStart + (acc / total) * (speechEnd - speechStart);
      if (i > 0 && ln && ln.pauses.length) {           // snap the boundary to the nearest real pause end (within 0.7 s)
        let best = null;
        for (const p of ln.pauses) { const d = Math.abs(p[1] - t0); if (d < 0.7 && (!best || d < best.d)) best = { d, t: p[1] }; }
        if (best) t0 = best.t;
      }
      out.push({ text: parts[i], t0 });
      acc += parts[i].length;
    }
    for (let i = 0; i < out.length; i++) out[i].t1 = i + 1 < out.length ? out[i + 1].t0 : speechEnd;
    return { dur, chunks: out };
  }
  let SPEC_TEXT = {};

  /* ------------------------------------------------------------------ spec -> compiled timeline */
  function compile(raw) {
    const repairs = [];
    const tracks = {};
    for (const k in INIT) tracks[k] = [];
    const lines = [];                 // {id, start, dur, chunks}
    let t = 0.8, interactiveAt = null;
    SPEC_TEXT = (raw && raw.text) || {};
    const beats = raw && Array.isArray(raw.beats) ? raw.beats : [];
    for (const b of beats) {
      const id = String(b.line || "");
      if (!NARR.lines[id] && !SPEC_TEXT[id]) { repairs.push("line:" + id); continue; }
      const c = chunksOf(id);
      const start = t;
      lines.push({ id, start, dur: c.dur, chunks: c.chunks });
      for (const cue of Array.isArray(b.cues) ? b.cues : []) {
        let off = 0;
        if (typeof cue.at === "number") off = clamp(cue.at, 0, c.dur);
        else if (typeof cue.at === "string" && /^s\d+$/.test(cue.at)) { const k = +cue.at.slice(1) - 1; off = c.chunks[k] ? c.chunks[k].t0 : 0; }
        else if (cue.at === "end") off = c.dur;
        const at = Math.max(0, start + off - PRE);
        if (!addCue(tracks, cue, at, (x) => repairs.push(x))) continue;
        if (cue.do === "interactive") interactiveAt = Math.max(interactiveAt || 0, at + PRE);
      }
      t = start + c.dur + clamp(b.gap == null ? 0.35 : +b.gap, 0, 3);
    }
    for (const k in tracks) tracks[k].sort((a, b) => a.t0 - b.t0);
    return { tracks, lines, total: t, interactiveAt: interactiveAt == null ? t : interactiveAt, repairs };
  }
  function addCue(tracks, cue, at, repair) {
    const dur = clamp(cue.dur == null ? 0.8 : +cue.dur, 0, 12);
    const seg = (prop, to, e) => { if (!(prop in tracks) || !isFinite(to)) { repair("prop:" + prop); return false; } tracks[prop].push({ t0: at, t1: at + dur, to: +to, ease: ease[e || cue.ease || "inOutCubic"] || ease.inOutCubic }); return true; };
    switch (cue.do) {
      case "show": case "hide": {
        const v = cue.do === "show" ? 1 : 0;
        const ts = [].concat(cue.target || []);
        let ok = true;
        for (const tg of ts) {
          if (SHOWABLE.includes(tg)) ok = seg(tg + ".a", v, cue.ease || "outCubic") && ok;
          else if (tg.startsWith("lbl.") && LABELS.includes(tg.slice(4))) ok = seg(tg, v, cue.ease || "outCubic") && ok;
          else { repair("target:" + tg); ok = false; }
        }
        return ok;
      }
      case "set": return seg(String(cue.prop), +cue.to);
      case "camera": return ["zoom", "x", "y"].every((k) => cue[k] == null || seg("cam." + k, +cue[k], cue.ease || "inOutCubic"));
      case "orbit": return seg("moon.theta", +cue.to, cue.ease || "inOutSine");
      case "skyPhase": return seg("skyMoon.E", +cue.to, cue.ease || "inOutSine");
      case "ghosts": return seg("ghosts.n", clamp(+cue.n, 0, 8), "linear");
      case "strip": return seg("strip.n", clamp(+cue.n, 0, 8), "linear");
      case "eclipse": return seg("eclipse.k", clamp(+cue.k, 0, 1), "inOutSine");
      case "interactive": return true;
      default: repair("verb:" + cue.do); return false;
    }
  }
  function valueAt(tracks, prop, t) {
    let v = INIT[prop];
    for (const s of tracks[prop]) {
      if (t < s.t0) break;
      const from = v;
      if (t >= s.t1 || s.t1 <= s.t0) v = s.to;
      else { v = lerp(from, s.to, s.ease((t - s.t0) / (s.t1 - s.t0))); break; }
    }
    return v;
  }

  /* ------------------------------------------------------------------ boot */
  S.hostChrome();
  const st = S.stage({ el: "#stage" });
  const fx = S.fx(st);
  const raw = S.studio.params();
  const TL = compile(raw);
  const T = Object.assign({ fromEarth: "FROM EARTH", sun: "SUN", earth: "EARTH", moon: "MOON", light: "SUNLIGHT", scale: "NOT TO SCALE", eclipse: "LUNAR ECLIPSE", shadow: "EARTH'S SHADOW", title: "Why the Moon has phases",
    phases: ["NEW · AMAVASYA", "WAXING CRESCENT", "FIRST QUARTER", "WAXING GIBBOUS", "FULL · PURNIMA", "WANING GIBBOUS", "THIRD QUARTER", "WANING CRESCENT"] }, (raw && raw.strings) || {});
  if (TL.repairs.length) S.studio.event("spec_repaired", { repairs: TL.repairs });

  const capEl = document.createElement("div"); capEl.className = "captions off"; st.el.appendChild(capEl);
  const progEl = document.createElement("div"); progEl.className = "progress"; progEl.innerHTML = "<i></i>"; st.el.appendChild(progEl);
  for (const ln of TL.lines) { const b = document.createElement("b"); b.style.left = (100 * ln.start / TL.interactiveAt) + "%"; progEl.appendChild(b); }
  if (S.qs.get("captions") === "0") capEl.style.display = "none";

  const audio = {};
  for (const id of Object.keys(NARR.lines)) { const a = new Audio(); a.preload = "auto"; a.src = NARR.lines[id].file; audio[id] = a; }

  const clock = { t: +(S.qs.get("t") || 0), playing: false, mode: "timeline", startedAt: null };
  const live = { said: null, sayT: 0, chunks: null, theta: null, dragging: false, task: 0, verdict: null, verdictT: 0, done: false, attempts: [] };
  let nextLine = TL.lines.findIndex((l) => l.start >= clock.t);
  if (nextLine < 0) nextLine = TL.lines.length;

  function play() {
    if (clock.playing) return;
    clock.playing = true;
    if (clock.startedAt == null) { clock.startedAt = Date.now(); S.studio.event("timeline_start", { epochMs: clock.startedAt }); }
  }
  function say(id) {
    const a = audio[id];
    if (a && !S.sfx.muted) { try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* audio is best-effort */ } }
    S.studio.event("say", { id, epochMs: Date.now() });
  }

  /* ------------------------------------------------------------------ geometry */
  const EARTH = { x: 500, y: 300 }, R_ORB = 180, RE = 44, RM = 22;
  const INSET = { x: 812, y: 336, r: 114 };
  const SUN = { x: -190, y: 300, r: 300 };
  const norm = (a) => ((a % 360) + 360) % 360;
  const elong = (theta) => norm(theta - 180);                 // Sun-Earth-Moon angle as seen from Earth
  const moonWorld = (theta) => ({ x: EARTH.x + R_ORB * Math.cos(theta * DEG), y: EARTH.y - R_ORB * Math.sin(theta * DEG) });
  const phaseIndex = (E) => Math.floor(norm(E + 22.5) / 45) % 8;

  /* ------------------------------------------------------------------ static art (cached per resolution) */
  let rnd = (() => { let s = 99; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
  const stars = Array.from({ length: 150 }, () => ({ x: rnd() * W, y: rnd() * H, z: rnd(), tw: rnd() * 6.28 }));
  const craters = Array.from({ length: 9 }, () => ({ a: rnd() * 6.28, d: rnd() * 0.75, r: 0.12 + rnd() * 0.22 }));
  const lands = Array.from({ length: 7 }, () => ({ a: rnd() * 6.28, d: 0.35 + rnd() * 0.5, r: 0.18 + rnd() * 0.25 }));
  let skyline = null, skyKey = "";
  function skylineArt() {
    const key = st.canvas.width + "x" + st.canvas.height;
    if (skyKey === key) return skyline;
    skyKey = key;
    skyline = document.createElement("canvas");
    skyline.width = st.canvas.width; skyline.height = st.canvas.height;
    const g = skyline.getContext("2d");
    g.setTransform(st.scale, 0, 0, st.scale, 0, 0);
    const r2 = (() => { let s = 7; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
    const base = 588;
    g.fillStyle = "#06070D";
    let x = -10;
    const wins = [];
    while (x < W + 10) {
      const w = 34 + r2() * 70, h = 36 + r2() * 96;
      g.fillRect(x, base - h, w, h + 80);
      if (r2() < 0.45) { g.fillRect(x + w * 0.2, base - h - 14, w * 0.28, 14); g.beginPath(); g.ellipse(x + w * 0.34, base - h - 14, w * 0.14, 5, 0, 0, Math.PI * 2); g.fill(); }  // rooftop water tank
      for (let yy = base - h + 14; yy < base - 10; yy += 18) for (let xx = x + 8; xx < x + w - 10; xx += 14) if (r2() < 0.18) wins.push([xx, yy]);
      x += w + 2 + r2() * 6;
    }
    // temple shikhara and a banyan canopy on the skyline
    g.beginPath(); g.moveTo(630, base - 70); g.quadraticCurveTo(650, base - 160, 668, base - 182); g.quadraticCurveTo(686, base - 160, 706, base - 70); g.closePath(); g.fill();
    g.fillRect(665, base - 202, 6, 24);
    g.beginPath(); for (let i = 0; i < 11; i++) { const cx = 800 + i * 18, cy = base - 112 - Math.sin(i / 10 * Math.PI) * 30 + (i % 3) * 6; g.moveTo(cx + 34, cy); g.arc(cx, cy, 34 + (i % 2) * 8, 0, Math.PI * 2); } g.fill();
    g.fillRect(884, base - 96, 16, 100); g.fillRect(846, base - 70, 6, 74); g.fillRect(926, base - 74, 6, 78);
    g.fillStyle = "rgba(255,206,130,.55)";
    for (const [wx, wy] of wins) g.fillRect(wx, wy, 6, 8);
    g.fillStyle = "#06070D"; g.fillRect(0, base, W, H - base);
    return skyline;
  }

  let _spaceBg = null, _ray = null;
  function spaceBg() {
    if (_spaceBg) return _spaceBg;
    _spaceBg = document.createElement("canvas"); _spaceBg.width = 500; _spaceBg.height = 313;
    const g = _spaceBg.getContext("2d"); g.scale(0.5, 0.5);
    const bg = g.createRadialGradient(500, 300, 50, 500, 300, 700);
    bg.addColorStop(0, "#0D1120"); bg.addColorStop(1, "#05060B");
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    return _spaceBg;
  }
  function raySprite() {
    if (_ray) return _ray;
    _ray = document.createElement("canvas"); _ray.width = 220; _ray.height = 8;
    const g = _ray.getContext("2d");
    const gr = g.createLinearGradient(0, 0, 220, 0); gr.addColorStop(0, "rgba(255,210,122,0)"); gr.addColorStop(1, "rgba(255,210,122,.95)");
    g.fillStyle = gr; g.fillRect(0, 1, 220, 6);
    return _ray;
  }

  /* ------------------------------------------------------------------ drawing primitives */
  function moonPhaseDisc(ctx, x, y, r, E, o) {
    // exact terminator: lit = limb half + half-ellipse with x-radius r*|cos E|; waxing (0 < E < 180) lit on the right
    o = o || {};
    E = norm(E);
    const waxing = E < 180;
    const e = waxing ? E : 360 - E;
    const k = Math.cos(e * DEG);
    ctx.save();
    ctx.translate(x, y);
    if (!waxing) ctx.scale(-1, 1);
    // dark side with earthshine
    ctx.fillStyle = o.eclipse ? mixRgb("#1C222F", "#3A1A12", o.eclipse) : "#1A2030";
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);           // right limb
    if (k >= 0) ctx.ellipse(0, 0, Math.max(0.001, r * k), r, 0, Math.PI / 2, -Math.PI / 2, true);
    else ctx.ellipse(0, 0, Math.max(0.001, -r * k), r, 0, Math.PI / 2, Math.PI * 1.5, false);
    ctx.closePath();
    ctx.clip();
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.05);
    g.addColorStop(0, o.eclipse ? mixRgb("#F2F0EA", "#D0673C", o.eclipse) : "#F4F2EC");
    g.addColorStop(1, o.eclipse ? mixRgb("#B9BCC6", "#7A2E18", o.eclipse) : "#B5B9C4");
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    // maria (both halves, subtle)
    ctx.globalAlpha = 0.16;
    ctx.fillStyle = "#3A4050";
    for (const c of craters) { ctx.beginPath(); ctx.arc(Math.cos(c.a) * c.d * r, Math.sin(c.a) * c.d * r, c.r * r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function mixRgb(a, b, t) { return S.mix(a, b, clamp(t, 0, 1)); }
  function topMoon(ctx, x, y, r, alpha, eclipseK) {
    // seen from above the pole: the half facing the Sun (left) is lit, always
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    ctx.fillStyle = "#151A26"; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5, false); ctx.closePath(); ctx.clip();
    const g = ctx.createRadialGradient(-r * 0.5, 0, 1, 0, 0, r);
    g.addColorStop(0, eclipseK ? mixRgb("#F4F2EC", "#D0673C", eclipseK) : "#F4F2EC"); g.addColorStop(1, eclipseK ? mixRgb("#A9AEBA", "#6A2A16", eclipseK) : "#A9AEBA");
    ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    if (eclipseK) { ctx.fillStyle = `rgba(150,60,30,${0.5 * eclipseK})`; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha *= 0.18; ctx.fillStyle = "#2E3443";
    for (const c of craters) { ctx.beginPath(); ctx.arc(Math.cos(c.a) * c.d * r, Math.sin(c.a) * c.d * r, c.r * r, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  function earthTop(ctx, x, y, r, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.translate(x, y);
    const g = ctx.createRadialGradient(-r * 0.4, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, "#3F8BF0"); g.addColorStop(1, "#13408F");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "rgba(92,170,110,.85)";
    for (const l of lands) { ctx.beginPath(); ctx.ellipse(Math.cos(l.a) * l.d * r, Math.sin(l.a) * l.d * r, l.r * r * 1.3, l.r * r, l.a, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = "rgba(240,246,255,.92)"; ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2); ctx.fill();   // polar ice: we look down on the North Pole
    // night side (away from the Sun) with a soft terminator
    const ng = ctx.createLinearGradient(-r * 0.12, 0, r * 0.18, 0);
    ng.addColorStop(0, "rgba(4,7,18,0)"); ng.addColorStop(1, "rgba(4,7,18,.78)");
    ctx.fillStyle = ng; ctx.fillRect(-r * 0.12, -r, r * 2, r * 2);
    ctx.restore();
    ctx.strokeStyle = "rgba(130,190,255,.55)"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, r + 2, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  /* ------------------------------------------------------------------ render */
  function render(ctx, now) {
    const t = clock.t, V = (p) => valueAt(TL.tracks, p, t);
    const theta = live.theta != null ? live.theta : V("moon.theta");
    ctx.fillStyle = "#07080E"; ctx.fillRect(0, 0, W, H);
    const skyA = V("sky.a"), spaceA = V("space.a");

    if (spaceA > 0.002) drawSpace(ctx, V, theta, spaceA, now);
    if (skyA > 0.002) drawSky(ctx, V, skyA, now);

    // inset: the view from Earth (exact phase from the same theta)
    const insA = V("inset.a");
    if (insA > 0.01) drawInset(ctx, V, theta, insA * spaceA, now);
    const stripA = V("strip.a");
    if (stripA > 0.01) drawStrip(ctx, V, theta, stripA * spaceA);

    const tA = V("title.a");
    if (tA > 0.01) {
      ctx.save(); ctx.globalAlpha = tA;
      const y = 300 - (1 - ease.outCubic(tA)) * 12;
      S.text(ctx, T.title, 500, y, { font: "display", size: 78, weight: 800, color: C.ink, align: "center", baseline: "middle", track: -2 });
      ctx.strokeStyle = C.ion; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(500 - 130 * tA, y + 62); ctx.lineTo(500 + 130 * tA, y + 62); ctx.stroke();
      ctx.restore();
    }
    if (clock.mode === "interactive") drawInteractiveCue(ctx, theta, now);
    fx.drawWorld(ctx);
    fx.drawScreen(ctx);
  }

  function drawSky(ctx, V, a, now) {
    ctx.save();
    ctx.globalAlpha = a;
    const g = ctx.createLinearGradient(0, 0, 0, 560);
    g.addColorStop(0, "#070A1C"); g.addColorStop(0.55, "#1A1D46"); g.addColorStop(0.82, "#4A2E58"); g.addColorStop(1, "#C0705A");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (const s of stars) { if (s.y > 470) continue; ctx.globalAlpha = a * (0.25 + 0.6 * s.z * (0.6 + 0.4 * Math.sin(now * 1.3 + s.tw))) * (1 - s.y / 520); ctx.fillStyle = "#E8ECFF"; const r = 0.7 + s.z * 1.5; ctx.fillRect(s.x, s.y, r, r); }
    ctx.globalAlpha = a;
    // the Moon in the evening sky (phase from the spec's skyPhase cues)
    const E = V("skyMoon.E"), mx = 300, my = 190, mr = 50;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.35 * (0.3 + 0.7 * (1 - Math.cos(E * DEG)) / 2);
    ctx.drawImage(S.glow("#DDE6FF", 120, 0.1), mx - 180, my - 180, 360, 360); ctx.restore();
    moonPhaseDisc(ctx, mx, my, mr, E);
    ctx.drawImage(skylineArt(), 0, 0, W, H);
    ctx.restore();
  }

  function drawSpace(ctx, V, theta, a, now) {
    const zoom = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y");
    const toS = (x, y) => ({ x: (x - cx) * zoom + 500, y: (y - cy) * zoom + 300 });
    ctx.save();
    ctx.globalAlpha = a;
    // deep space (cached gradient)
    ctx.drawImage(spaceBg(), 0, 0, W, H);
    for (const s of stars) { ctx.globalAlpha = a * (0.15 + 0.45 * s.z) * (0.75 + 0.25 * Math.sin(now + s.tw)); ctx.fillStyle = "#C9D2F2"; const r = 0.6 + s.z * 1.3; ctx.fillRect(s.x, s.y, r, r); }
    ctx.globalAlpha = a;
    // the Sun (far left, screen-fixed) and its light
    const sunA = V("sun.a");
    if (sunA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * sunA;
      ctx.globalCompositeOperation = "lighter";
      ctx.drawImage(S.glow("#FFB24A", 300, 0.15), SUN.x - 560, SUN.y - 560, 1120, 1120);
      ctx.globalCompositeOperation = "source-over";
      const sg = ctx.createRadialGradient(SUN.x + 60, SUN.y - 40, 40, SUN.x, SUN.y, SUN.r);
      sg.addColorStop(0, "#FFF4D6"); sg.addColorStop(0.7, "#FFD27A"); sg.addColorStop(1, "#FFA94A");
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(SUN.x, SUN.y, SUN.r, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    const raysA = V("rays.a");
    if (raysA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * raysA * 0.5; ctx.strokeStyle = "#FFD27A"; ctx.lineWidth = 4; ctx.lineCap = "round";
      const off = S.reducedMotion ? 0 : (now * 160) % 260;
      for (let row = 0; row < 11; row++) {
        const y = 40 + row * 54 + (row % 2) * 10;
        for (let x = 60 - 260 + off + (row % 3) * 70; x < W; x += 260) {
          const x0 = Math.max(60, x);
          if (x + 110 > x0) ctx.drawImage(raySprite(), (x0 - x) / 110 * 220, 0, (x + 110 - x0) / 110 * 220, 8, x0, y - 2, x + 110 - x0, 4);
        }
      }
      ctx.restore();
    }
    // world (camera)
    ctx.save();
    ctx.translate(500, 300); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
    const lw = (w) => w / zoom;
    // Earth's shadow: points away from the Sun
    const shA = V("shadow.a");
    if (shA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * shA;
      const g = ctx.createLinearGradient(EARTH.x, 0, EARTH.x + 620, 0);
      g.addColorStop(0, "rgba(5,6,11,.97)"); g.addColorStop(0.75, "rgba(5,6,11,.9)"); g.addColorStop(1, "rgba(5,6,11,.35)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(EARTH.x, EARTH.y - RE); ctx.lineTo(EARTH.x + 620, EARTH.y - RE * 0.42); ctx.lineTo(EARTH.x + 620, EARTH.y + RE * 0.42); ctx.lineTo(EARTH.x, EARTH.y + RE); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = "rgba(170,180,210,.6)"; ctx.lineWidth = lw(4); ctx.setLineDash([lw(10), lw(10)]);
      ctx.beginPath(); ctx.moveTo(EARTH.x, EARTH.y - RE); ctx.lineTo(EARTH.x + 620, EARTH.y - RE * 0.42); ctx.moveTo(EARTH.x, EARTH.y + RE); ctx.lineTo(EARTH.x + 620, EARTH.y + RE * 0.42); ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
    // orbit
    const oA = V("orbit.a");
    if (oA > 0.01) {
      ctx.save(); ctx.globalAlpha = a * oA * 0.55; ctx.strokeStyle = C.ink3; ctx.lineWidth = lw(4); ctx.setLineDash([lw(6), lw(12)]);
      ctx.beginPath(); ctx.arc(EARTH.x, EARTH.y, R_ORB, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      // direction of travel (anticlockwise seen from above the North Pole)
      const ah = 40 * DEG;
      const p = { x: EARTH.x + R_ORB * Math.cos(ah), y: EARTH.y - R_ORB * Math.sin(ah) };
      ctx.translate(p.x, p.y); ctx.rotate(-ah - Math.PI / 2 + Math.PI);
      ctx.fillStyle = C.ink3; ctx.beginPath(); ctx.moveTo(0, -lw(10)); ctx.lineTo(lw(9), lw(8)); ctx.lineTo(-lw(9), lw(8)); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // ghost moons: eight positions, each lit on the Sun's side
    const gn = V("ghosts.n"), gA = V("ghosts.a");
    if (gn > 0.01 && gA > 0.01) {
      for (let i = 0; i < 8; i++) {
        const k = clamp(gn - i, 0, 1);
        if (k <= 0) continue;
        const p = moonWorld(i * 45);
        topMoon(ctx, p.x, p.y, RM * (0.6 + 0.4 * ease.outBack(k)), a * gA * k * 0.75, 0);
      }
    }
    // Earth
    earthTop(ctx, EARTH.x, EARTH.y, RE, a * V("earth.a"));
    // the Moon
    const mA = V("moon.a");
    const mp = moonWorld(theta);
    const inShadow = shA > 0.2 && Math.abs(mp.y - EARTH.y) < RE * 0.55 && mp.x > EARTH.x;
    const ecl = inShadow ? V("eclipse.k") : 0;
    if (mA > 0.01) {
      // sight line from Earth
      const sA = V("sight.a");
      if (sA > 0.01) {
        const dx = mp.x - EARTH.x, dy = mp.y - EARTH.y, d = Math.hypot(dx, dy);
        ctx.save(); ctx.globalAlpha = a * sA * 0.8; ctx.strokeStyle = C.ion; ctx.lineWidth = lw(4); ctx.setLineDash([lw(8), lw(9)]);
        ctx.beginPath(); ctx.moveTo(EARTH.x + dx / d * (RE + 8), EARTH.y + dy / d * (RE + 8)); ctx.lineTo(mp.x - dx / d * (RM + 22), mp.y - dy / d * (RM + 22)); ctx.stroke();
        ctx.restore();
      }
      topMoon(ctx, mp.x, mp.y, RM, a * mA, ecl);
      // the two halves: lit (faces the Sun) and near (faces Earth); what we see is where they overlap
      const sunArc = V("arcSun.a"), nearArc = V("arcNear.a"), ov = V("overlap.a");
      const toEarth = Math.atan2(EARTH.y - mp.y, EARTH.x - mp.x);
      if (sunArc > 0.01) { ctx.save(); ctx.globalAlpha = a * sunArc; ctx.strokeStyle = "#FFC86B"; ctx.lineWidth = lw(5); ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(mp.x, mp.y, RM + 9, Math.PI / 2, Math.PI * 1.5); ctx.stroke(); ctx.restore(); }
      if (nearArc > 0.01) { ctx.save(); ctx.globalAlpha = a * nearArc; ctx.strokeStyle = C.ion; ctx.lineWidth = lw(5); ctx.lineCap = "round"; ctx.beginPath(); ctx.arc(mp.x, mp.y, RM + 18, toEarth - Math.PI / 2, toEarth + Math.PI / 2); ctx.stroke(); ctx.restore(); }
      if (ov > 0.01) {
        // overlap of [pi/2, 3pi/2] (sun side) and [toEarth - pi/2, toEarth + pi/2] (near side)
        const segs = overlapArcs(Math.PI / 2, Math.PI * 1.5, toEarth - Math.PI / 2, toEarth + Math.PI / 2);
        ctx.save(); ctx.globalAlpha = a * ov * (0.7 + 0.3 * Math.sin(now * 5)); ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = lw(7); ctx.lineCap = "round";
        for (const [s0, s1] of segs) { ctx.beginPath(); ctx.arc(mp.x, mp.y, RM + 27, s0, s1); ctx.stroke(); }
        ctx.restore();
      }
    }
    ctx.restore();   // camera

    // screen-space labels (never scaled below the minimum size)
    const ep = toS(EARTH.x, EARTH.y), ms = toS(mp.x, mp.y);
    const L = (k) => V("lbl." + k);
    if (L("sun") > 0.01) S.text(ctx, T.sun, 22, 470, { font: "mono", size: 40, weight: 700, color: "#3A2208", alpha: a * L("sun") });
    if (L("light") > 0.01) {
      ctx.save(); ctx.globalAlpha = a * L("light");
      S.text(ctx, T.light, 150, 196, { font: "mono", size: 38, weight: 600, color: "#FFD27A" });
      ctx.strokeStyle = "#FFD27A"; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(346, 183); ctx.lineTo(392, 183); ctx.lineTo(380, 172); ctx.moveTo(392, 183); ctx.lineTo(380, 194); ctx.stroke();
      ctx.restore();
    }
    if (L("earth") > 0.01) S.text(ctx, T.earth, ep.x, ep.y + RE * zoom + 46, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", alpha: a * L("earth") });
    if (L("moon") > 0.01 && mA > 0.01) {
      const dx = ms.x - ep.x, dy = ms.y - ep.y, d = Math.hypot(dx, dy) || 1;
      S.text(ctx, T.moon, ms.x + dx / d * 70, ms.y + dy / d * 62 + 12, { font: "mono", size: 38, weight: 600, color: C.ink2, align: "center", alpha: a * L("moon") });
    }
    if (L("scale") > 0.01) S.text(ctx, T.scale, 200, 60, { font: "mono", size: 38, weight: 500, color: C.ink3, alpha: a * 0.75 * L("scale") });
    if (shA > 0.01) { const sp = toS(EARTH.x + 160, EARTH.y - RE - 34); S.text(ctx, T.shadow, sp.x, sp.y, { font: "mono", size: 38, weight: 600, color: "#9AA6C8", align: "center", alpha: a * shA }); }
    if (L("eclipse") > 0.01 && inShadow) S.text(ctx, T.eclipse, ms.x, ms.y - 52, { font: "mono", size: 38, weight: 600, color: "#E8956A", align: "center", alpha: a * L("eclipse") });
    ctx.restore();
  }
  function overlapArcs(a0, a1, b0, b1) {
    const TWO = Math.PI * 2, out = [];
    for (const k of [-1, 0, 1]) {
      const s = Math.max(a0, b0 + k * TWO), e = Math.min(a1, b1 + k * TWO);
      if (e > s + 1e-3) out.push([s, e]);
    }
    return out;
  }

  function drawInset(ctx, V, theta, a, now) {
    const E = elong(theta);
    const { x, y, r } = INSET;
    ctx.save(); ctx.globalAlpha = a;
    S.text(ctx, T.fromEarth, x, y - r - 26, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center" });
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    const g = ctx.createLinearGradient(0, y - r, 0, y + r);
    g.addColorStop(0, "#0A1030"); g.addColorStop(0.75, "#1B2353"); g.addColorStop(1, "#3B2A55");
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    for (let i = 0; i < 26; i++) { const s = stars[i]; ctx.globalAlpha = a * (0.3 + 0.5 * s.z); ctx.fillStyle = "#E6EAFF"; ctx.fillRect(x - r + s.x / W * r * 2, y - r + s.y / H * r * 1.4, 1.6, 1.6); }
    ctx.globalAlpha = a;
    const mr = 64, my = y - 14;
    const inShadow = V("shadow.a") > 0.2 && Math.abs(E - 180) < 8;
    const ecl = inShadow ? V("eclipse.k") : 0;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = a * 0.4 * ((1 - Math.cos(E * DEG)) / 2) * (1 - ecl * 0.7);
    ctx.drawImage(S.glow("#DDE6FF", 100, 0.1), x - 150, my - 150, 300, 300); ctx.restore();
    moonPhaseDisc(ctx, x, my, mr, E, { eclipse: ecl });
    // a sliver of the city at the bottom of the window ties it to the opening shot
    ctx.fillStyle = "#06070D";
    for (let i = 0; i < 12; i++) { const bw = 18 + (i * 37) % 22, bh = 18 + (i * 53) % 34; ctx.fillRect(x - r + i * 22, y + r - bh, bw, bh); }
    ctx.restore();
    ctx.strokeStyle = live.verdict === "good" && live.verdictT < 1.2 ? C.mint : C.ion; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    const pa = V("phase.a");
    if (pa > 0.01) S.text(ctx, T.phases[phaseIndex(E)], x, y + r + 48, { font: "mono", size: 38, weight: 600, color: C.ink, align: "center", alpha: pa });
    ctx.restore();
  }

  function drawStrip(ctx, V, theta, a) {
    const n = V("strip.n"), cur = phaseIndex(elong(theta));
    const x0 = 72, y = 512, gap = 58, r = 20;
    ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < 8; i++) {
      const k = clamp(n - i, 0, 1);
      ctx.globalAlpha = a * (0.18 + 0.82 * k);
      moonPhaseDisc(ctx, x0 + i * gap, y, r * (0.85 + 0.15 * k), i * 45);
      if (i === cur && k > 0.5) { ctx.globalAlpha = a; ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x0 + i * gap, y, r + 8, 0, Math.PI * 2); ctx.stroke(); }
    }
    ctx.restore();
  }

  function drawInteractiveCue(ctx, theta, now) {
    const V = (p) => valueAt(TL.tracks, p, clock.t);
    const zoom = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y");
    const mp = moonWorld(theta), s = { x: (mp.x - cx) * zoom + 500, y: (mp.y - cy) * zoom + 300 };
    const e = { x: (EARTH.x - cx) * zoom + 500, y: (EARTH.y - cy) * zoom + 300 };
    if (!live.done) {
      // your move: the one volt element on screen, a ring on the thing to drag + the path it travels
      const p = 0.5 + 0.5 * Math.sin(now * 4);
      ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.globalAlpha = live.dragging ? 1 : 0.55 + 0.45 * p;
      ctx.beginPath(); ctx.arc(s.x, s.y, RM * zoom + 14 + (live.dragging ? 0 : 6 * p), 0, Math.PI * 2); ctx.stroke();
      if (!live.dragging) {
        ctx.globalAlpha = 0.35; ctx.setLineDash([6, 12]); ctx.lineDashOffset = -now * 30;
        ctx.beginPath(); ctx.arc(e.x, e.y, R_ORB * zoom, -(theta + 6) * DEG, -(theta + 70) * DEG, true); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.restore();
    }
    if (live.verdict && live.verdictT < 2.4) {
      const k = live.verdictT < 0.2 ? live.verdictT / 0.2 : live.verdictT > 2 ? 1 - (live.verdictT - 2) / 0.4 : 1;
      ctx.save(); ctx.globalAlpha = k; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = 6;
      const bx = s.x + (s.x > e.x ? 54 : -54), by = s.y - 40;
      if (live.verdict === "good") { ctx.strokeStyle = C.mint; ctx.beginPath(); ctx.moveTo(bx - 12, by); ctx.lineTo(bx - 3, by + 10); ctx.lineTo(bx + 14, by - 10); ctx.stroke(); }
      else { ctx.strokeStyle = C.amber; ctx.beginPath(); ctx.arc(bx - 3, by - 3, 11, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + 5, by + 5); ctx.lineTo(bx + 15, by + 15); ctx.stroke(); }
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------------ update: clock, narration, captions, interaction */
  let capText = "";
  function setCaption(text) {
    if (text === capText) return;
    capText = text;
    if (!text) { capEl.classList.add("off"); return; }
    capEl.textContent = text; capEl.classList.remove("off");
  }
  function update(dt) {
    if (clock.playing && clock.mode === "timeline") {
      clock.t += dt;
      while (nextLine < TL.lines.length && clock.t >= TL.lines[nextLine].start) { say(TL.lines[nextLine].id); nextLine++; }
      if (clock.t >= TL.interactiveAt) enterInteractive();
    }
    // captions
    let cap = "";
    if (clock.mode === "timeline") {
      for (const ln of TL.lines) {
        if (clock.t < ln.start || clock.t > ln.start + ln.dur + 0.25) continue;
        const lt = clock.t - ln.start;
        for (const c of ln.chunks) if (lt >= c.t0 - 0.05 && lt < c.t1 + 0.25) cap = c.text;
      }
    } else if (live.chunks) {
      live.sayT += dt;
      for (const c of live.chunks) if (live.sayT >= c.t0 - 0.05 && live.sayT < c.t1 + 0.3) cap = c.text;
    }
    setCaption(cap);
    progEl.firstChild.style.width = (100 * Math.min(1, clock.t / TL.interactiveAt)) + "%";
    if (live.verdict) live.verdictT += dt;
    fx.update(dt);
  }
  function enterInteractive() {
    if (clock.mode === "interactive") return;
    clock.mode = "interactive";
    clock.t = TL.interactiveAt;
    live.theta = valueAt(TL.tracks, "moon.theta", clock.t);
    live.task = 0;
    S.studio.event("interactive", { task: "first_quarter" });
  }
  function sayLive(id) {
    const c = chunksOf(id);
    live.chunks = c.chunks; live.sayT = 0;
    say(id);
  }
  // drag the Moon round its orbit
  const screenOf = (theta) => {
    const V = (p) => valueAt(TL.tracks, p, clock.t);
    const zoom = V("cam.zoom"), cx = V("cam.x"), cy = V("cam.y"), mp = moonWorld(theta);
    return { x: (mp.x - cx) * zoom + 500, y: (mp.y - cy) * zoom + 300, ex: (EARTH.x - cx) * zoom + 500, ey: (EARTH.y - cy) * zoom + 300, zoom };
  };
  st.onPointer({
    down(p) {
      S.sfx.unlock();
      if (clock.mode !== "interactive") { if (!clock.playing) play(); return; }
      if (live.done) return;
      const s = screenOf(live.theta);
      if (Math.hypot(p.x - s.x, p.y - s.y) < 80) { live.dragging = true; live.verdict = null; }
    },
    move(p) {
      if (!live.dragging) return;
      const s = screenOf(live.theta);
      const ang = Math.atan2(-(p.y - s.ey), p.x - s.ex) / DEG;       // math angle (y up)
      let d = norm(ang - live.theta);
      if (d > 180) d -= 360;
      live.theta += d;                                                // continuous unwrap keeps the motion smooth
    },
    up() {
      if (!live.dragging) return;
      live.dragging = false;
      const E = elong(live.theta);
      const target = live.task === 0 ? 90 : 180;
      const near = (x, c) => Math.abs(((x - c + 540) % 360) - 180) <= 15;
      S.studio.answer(live.task === 0 ? "evening_half_moon" : "full_moon", +E.toFixed(1), { correct: near(E, target) });
      live.attempts.push({ task: live.task, E: +E.toFixed(1) });
      if (near(E, target)) {
        live.verdict = "good"; live.verdictT = 0;
        const s = screenOf(live.theta);
        fx.ring(s.x, s.y, { color: C.mint, r0: 20, r1: 90, life: 0.6, width: 6 });
        S.sfx.blip({ f: 660, f2: 990, dur: 0.18, type: "triangle", gain: 0.12 });
        if (live.task === 0) { sayLive("L18"); live.task = 1; setTimeout(() => sayLive("L19"), 2400); }
        else { sayLive("L20"); live.done = true; S.studio.done({ attempts: live.attempts }); setTimeout(() => { clock.mode = "final"; }, 3600); }
      } else if (live.task === 0 && near(E, 270)) {
        live.verdict = "look"; live.verdictT = 0;
        sayLive("L21");
      }
    },
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === " ") { if (clock.playing) clock.playing = false; else play(); e.preventDefault(); }
    if (e.key === "ArrowRight") seek(clock.t + 5);
    if (e.key === "ArrowLeft") seek(clock.t - 5);
  });
  function seek(t) {
    if (clock.mode !== "timeline") return;
    clock.t = clamp(t, 0, TL.interactiveAt);
    nextLine = TL.lines.findIndex((l) => l.start >= clock.t);
    if (nextLine < 0) nextLine = TL.lines.length;
    for (const id in audio) audio[id].pause();
  }

  /* ------------------------------------------------------------------ test seam */
  S.studio.seam = () => {
    const V = (p) => valueAt(TL.tracks, p, clock.t);
    const theta = live.theta != null ? live.theta : V("moon.theta");
    const s = screenOf(theta);
    const path = (from, to) => { const pts = []; const n = Math.max(6, Math.round(Math.abs(to - from) / 8)); for (let i = 1; i <= n; i++) { const q = screenOf(from + (to - from) * i / n); pts.push([q.x, q.y]); } return pts; };
    return {
      state: clock.mode === "final" ? "final" : clock.mode, t: +clock.t.toFixed(2), total: +TL.interactiveAt.toFixed(2), E: +elong(theta).toFixed(1),
      phase: T.phases[phaseIndex(elong(theta))], moon: { x: s.x, y: s.y }, task: live.task, repairs: TL.repairs,
      // a child's attempt sequence for the QA bot: first the morning half moon (a near miss), then evening, then full
      dragTargets: clock.mode === "interactive" ? (() => {
        const t1 = theta - norm(theta - 90);           // back (clockwise) to the morning half moon: a near miss
        const t2 = t1 + 180, t3 = t2 + 90;             // on (anticlockwise) to the evening half, then full
        return [{ path: path(theta, t1), hold: 4800 }, { path: path(t1, t2), hold: 5400 }, { path: path(t2, t3), hold: 4200 }];
      })() : null,
    };
  };

  // G6 hook for the animation archetype (test builds only): measure the rendered terminator against (1 - cos E) / 2
  window.__moonTest = {
    _probe(E) {
      const c = document.createElement("canvas"); c.width = c.height = 220;
      const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 220, 220);
      moonPhaseDisc(g, 110, 110, 100, E);
      const d = g.getImageData(0, 0, 220, 220).data;
      let disc = 0, lit = 0, litL = 0, litR = 0;
      for (let y = 0; y < 220; y++) for (let x = 0; x < 220; x++) {
        if ((x - 110) ** 2 + (y - 110) ** 2 > 97 * 97) continue;            // inside the disc, away from the anti-aliased rim
        disc++;
        const k = (y * 220 + x) * 4, l = 0.2126 * d[k] + 0.7152 * d[k + 1] + 0.0722 * d[k + 2];
        if (l > 128) { lit++; if (x < 110) litL++; else litR++; }
      }
      return { f: lit / disc, side: litR > litL * 1.05 ? "right" : litL > litR * 1.05 ? "left" : "even" };
    },
    litFraction(E) { return +this._probe(E).f.toFixed(4); },
    litSide(E) { return this._probe(E).side; },
  };

  S.fontsReady().then(() => {
    S.loop(st, update, render);
    S.studio.ready();
    if (S.qs.get("autoplay") === "1") play();
    else {
      const gate = document.createElement("div");
      gate.className = "playgate";
      gate.innerHTML = "<button>Play explainer</button>";
      st.el.appendChild(gate);
      gate.querySelector("button").addEventListener("click", () => { S.sfx.unlock(); gate.remove(); play(); });
    }
  });
})();
