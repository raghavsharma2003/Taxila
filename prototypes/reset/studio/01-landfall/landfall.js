/* LANDFALL — archetype `catch-on-line@1` (STUDIO-V2 §3, game archetype G1).
 *
 * ENGINE (this file, hand-built once, reviewed): rendering, game feel, physics of the dock, exact-rational truth,
 * scoring, adaptive difficulty, the test seam and the Studio bridge.
 * GENERATED (the JSON in index.html#spec): which fractions, in what order and pairing, on which line, at what pace,
 * with which titles and strings. The engine validates it and repairs or replaces it; a bad spec never reaches the child.
 *
 * Learning act == game act: the child places the dock where the fraction lives on the number line before the pod
 * lands. Accuracy is measured as PAE (percent absolute error, Siegler & Booth 2004), the standard magnitude measure.
 */
(function () {
  "use strict";
  const S = window.TaxStudio;
  const { C, W, H, ease, clamp, lerp, tween } = S;

  /* ------------------------------------------------------------------ exact rationals (truth is code, never the model) */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
  function parseFrac(str) {
    const s = String(str).trim();
    let m = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);               // mixed "1 3/4"
    if (m) { const w = +m[1], n = +m[2], d = +m[3]; if (!d || n >= d) return null; return { w, n, d, num: w * d + n, den: d, mixed: true, label: s }; }
    m = s.match(/^(\d+)\/(\d+)$/);                           // "5/4"
    if (m) { const n = +m[1], d = +m[2]; if (!d) return null; return { w: 0, n, d, num: n, den: d, mixed: false, label: s }; }
    m = s.match(/^(\d+)$/);
    if (m) return { w: +m[1], n: 0, d: 1, num: +m[1], den: 1, mixed: false, whole: true, label: s };
    return null;
  }
  const valueOf = (f) => f.num / f.den;
  const sameValue = (a, b) => a.num * b.den === b.num * a.den;
  function nearestSimple(x) {                                // for "off by ~1/8" feedback
    let best = null;
    for (const d of [2, 3, 4, 5, 6, 8, 10, 12]) {
      const n = Math.round(x * d);
      if (n <= 0) continue;
      const err = Math.abs(x - n / d);
      if (!best || err < best.err - 1e-9) { const g = gcd(n, d); best = { n: n / g, d: d / g, err }; }
    }
    return best && best.err <= 0.015 ? (best.d === 1 ? `${best.n}` : `${best.n}/${best.d}`) : null;
  }

  /* ------------------------------------------------------------------ spec: validate, repair, or fall back (zero visible failure) */
  const DEFAULT_SPEC = {
    archetype: "catch-on-line@1",
    strings: { coach: "Drag to move the dock", wave: "Wave", of: "of", clear: "clear", landed: "landed", precision: "precision", chain: "chain", bestChain: "best chain", exact: "EXACT", close: "CLOSE", inside: "IN", offBy: "off by", same: "SAME SPOT", runDone: "Run complete", toughest: "Toughest" },
    waves: [{ title: "Quarters", sub: "0 to 1 · quarter marks on", line: [0, 1], ticks: 4, speed: 92, gap: 2.4, items: ["1/2", "1/4", "3/4", "2/4"] }],
    adapt: { slowAfterMisses: 2, slowFactor: 0.86, fastAfterChain: 4, fastFactor: 1.07, minScale: 0.7, maxScale: 1.3, scaffoldPods: 3 },
  };
  function validate(raw) {
    const repairs = [];
    const spec = Object.assign({}, DEFAULT_SPEC, raw || {});
    spec.strings = Object.assign({}, DEFAULT_SPEC.strings, (raw && raw.strings) || {});
    for (const k in spec.strings) {                          // child-visible words: short, plain, no markup
      const v = String(spec.strings[k]);
      if (v.length > 48 || /[<>{}]/.test(v)) { spec.strings[k] = DEFAULT_SPEC.strings[k] || ""; repairs.push("string:" + k); }
    }
    spec.adapt = Object.assign({}, DEFAULT_SPEC.adapt);       // DDA bounds: numbers only, within 0.5x..2x of the reviewed default
    const ra = raw && raw.adapt && typeof raw.adapt === "object" ? raw.adapt : {};
    for (const k of Object.keys(DEFAULT_SPEC.adapt)) {
      if (!(k in ra)) continue;
      const d = DEFAULT_SPEC.adapt[k], v = ra[k];
      if (typeof v === "number" && isFinite(v)) spec.adapt[k] = clamp(Number.isInteger(d) ? Math.round(v) : v, d * 0.5, d * 2);
      else repairs.push("adapt:" + k);
    }
    const waves = [];
    for (const w of (raw && Array.isArray(raw.waves) ? raw.waves : [])) {
      if (!w || typeof w !== "object" || Array.isArray(w)) { repairs.push("wave:not-an-object"); continue; }
      const line = Array.isArray(w.line) && w.line.length === 2 && Number.isInteger(w.line[0]) && Number.isInteger(w.line[1]) && w.line[1] > w.line[0] && w.line[1] - w.line[0] <= 3 ? w.line : null;
      if (!line) { repairs.push("wave-line"); continue; }
      const items = [];
      for (const it of Array.isArray(w.items) ? w.items : []) {
        const group = (Array.isArray(it) ? it : [it]).map(parseFrac);
        if (group.some((f) => !f || f.den > 12)) { repairs.push("item:" + JSON.stringify(it)); continue; }
        if (group.some((f) => valueOf(f) <= line[0] || valueOf(f) >= line[1])) { repairs.push("range:" + JSON.stringify(it)); continue; }
        if (group.length > 1 && !group.every((f) => sameValue(f, group[0]))) { repairs.push("pair-not-equal:" + JSON.stringify(it)); continue; }
        if (group.length > 3) { repairs.push("group-size"); continue; }
        items.push(group);
      }
      if (!items.length) { repairs.push("wave-empty"); continue; }
      waves.push({
        title: String(w.title || "").slice(0, 22), sub: String(w.sub || "").slice(0, 40), line,
        ticks: Number.isInteger(w.ticks) && w.ticks >= 0 && w.ticks <= 12 ? w.ticks : 0,
        scaffoldTicks: Number.isInteger(w.scaffoldTicks) ? clamp(w.scaffoldTicks, 2, 12) : 4,
        speed: clamp(+w.speed || 95, 60, 170), gap: clamp(+w.gap || 2.4, 1.1, 4), items,
      });
    }
    if (!waves.length) { repairs.push("fallback-default"); spec.waves = DEFAULT_SPEC.waves.map((w) => Object.assign({}, w, { items: w.items.map((i) => [parseFrac(i)]), scaffoldTicks: 4 })); }
    else spec.waves = waves;
    return { spec, repairs };
  }

  /* ------------------------------------------------------------------ world constants */
  const LINE_Y = 505, X0 = 120, X1 = 880, LOCK_Y = 352, SPAWN_Y = 150;
  const TOL = { exact: 12, close: 28 };
  const BASE_HALF = 50;                                        // dock half-width: 6.6% of a 0-1 line

  /* ------------------------------------------------------------------ boot */
  S.hostChrome();
  const st = S.stage({ el: "#stage" });
  const fx = S.fx(st);
  const { spec, repairs } = validate(S.studio.params());
  const T = spec.strings;
  if (repairs.length) S.studio.event("spec_repaired", { repairs });

  // seeded RNG so a run (and its recording) is reproducible
  let seed = +(S.qs.get("seed") || 7);
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

  const game = {
    state: "boot", waveIdx: -1, wave: null, clock: 0, stateT: 0, spawnIdx: 0,
    pods: [], markers: [], speedScale: 1, halfW: BASE_HALF, missRun: 0, chain: 0, bestChain: 0,
    scaffoldLeft: 0, results: [], waveResults: [], lineGlow: 0, introA: 0, coachA: 1, coachGone: false,
  };
  const dock = { x: 230, v: 0, target: 230, squash: 1, keys: 0 };
  const stars = Array.from({ length: 110 }, () => ({ x: rnd() * W, y: rnd() * (LINE_Y - 30), z: 0.2 + rnd() * 0.8, tw: rnd() * 6.28 }));

  const lineMin = () => game.wave.line[0], lineMax = () => game.wave.line[1];
  const xOf = (v) => X0 + ((v - lineMin()) / (lineMax() - lineMin())) * (X1 - X0);
  const vOf = (x) => lineMin() + ((x - X0) / (X1 - X0)) * (lineMax() - lineMin());

  /* ------------------------------------------------------------------ input */
  st.onPointer({
    down(p) { dock.target = clamp(p.x, X0 - 40, X1 + 40); dismissCoach(); },
    move(p) { if (p.down || p.type === "mouse") { dock.target = clamp(p.x, X0 - 40, X1 + 40); if (p.down) dismissCoach(); } },
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { dock.keys = -1; dismissCoach(); }
    if (e.key === "ArrowRight") { dock.keys = 1; dismissCoach(); }
  });
  window.addEventListener("keyup", (e) => { if ((e.key === "ArrowLeft" && dock.keys < 0) || (e.key === "ArrowRight" && dock.keys > 0)) dock.keys = 0; });
  function dismissCoach() { if (!game.coachGone) { game.coachGone = true; tween(game, { coachA: 0 }, { dur: 0.35 }); } }

  /* ------------------------------------------------------------------ flow */
  function startWave(i) {
    game.waveIdx = i;
    game.wave = spec.waves[i];
    game.state = "intro"; game.stateT = 0; game.clock = 0; game.spawnIdx = 0;
    game.waveResults = [];
    game.introA = 0;
    tween(game, { introA: 1 }, { dur: 0.45, ease: "outCubic" });
    game.lineGlow = 0;
    tween(game, { lineGlow: 1 }, { dur: 1.1, ease: "inOutCubic", delay: 0.3 });
    S.sfx.blip({ f: 220, f2: 440, dur: 0.35, type: "triangle", gain: 0.12 });
    S.studio.event("wave_start", { wave: i + 1, title: game.wave.title });
  }
  function spawnGroup(group) {
    const n = group.length;
    const xs = [];
    for (let k = 0; k < n; k++) {
      let x, tries = 0;
      do { x = 230 + rnd() * 520; tries++; } while (tries < 40 && xs.some((o) => Math.abs(o - x) < 230));
      xs.push(x);
    }
    const id = Math.random().toString(36).slice(2, 8);
    group.forEach((f, k) => {
      const pod = { id: id + k, group: id, gsize: n, f, value: valueOf(f), x: xs[k], y: SPAWN_Y - 40, vy: game.wave.speed * game.speedScale,
        a: 0, sc: 0.6, phase: "fall", dive: 0, sway: rnd() * 6.28, born: game.clock, w: 0, h: 118, flame: 0 };
      pod.trueX = xOf(pod.value);
      tween(pod, { a: 1, sc: 1 }, { dur: 0.4, ease: "outBack" });
      tween(pod, { y: SPAWN_Y }, { dur: 0.4, ease: "outCubic" });
      game.pods.push(pod);
    });
    S.sfx.noise({ dur: 0.25, f: 700, gain: 0.08 });
  }
  function resolvePod(pod) {
    const err = Math.abs(dock.x - pod.trueX);
    const caught = err <= game.halfW;
    const range = lineMax() - lineMin();
    const estimate = vOf(dock.x);
    const pae = (Math.abs(estimate - pod.value) / range) * 100;
    const r = { item: pod.f.label, value: pod.value, estimate: +estimate.toFixed(4), pae: +pae.toFixed(2), caught, errUnits: +err.toFixed(1), wave: game.waveIdx + 1, halfW: game.halfW, speed: +(game.wave.speed * game.speedScale).toFixed(1), group: pod.group };
    game.results.push(r); game.waveResults.push(r);
    S.studio.answer(`${game.waveIdx + 1}:${pod.f.label}`, +estimate.toFixed(4), { caught, pae: r.pae });
    S.studio.event("land", r);

    const hitX = pod.trueX, hitY = LINE_Y;
    if (caught) {
      game.chain++; game.bestChain = Math.max(game.bestChain, game.chain); game.missRun = 0;
      const grade = err <= TOL.exact ? "exact" : err <= TOL.close ? "close" : "inside";
      const col = C.mint;
      fx.burst(hitX, hitY - 20, { n: grade === "exact" ? 34 : 22, color: col, speed: grade === "exact" ? 520 : 380, life: 0.7, size: 11, gravity: 600, angle: -Math.PI / 2, spread: Math.PI * 1.3 });
      fx.burst(hitX, hitY - 20, { n: 8, color: C.ink, speed: 260, life: 0.45, size: 7 });
      fx.ring(hitX, hitY, { color: col, r0: 10, r1: grade === "exact" ? 130 : 90, life: 0.55, width: 8 });
      if (pod.gsize === 1) fx.pop(grade === "exact" ? T.exact : grade === "close" ? T.close : T.inside, hitX, hitY - 150, { color: col, size: grade === "exact" ? 56 : 46, rise: 60 });
      if (grade === "exact") { fx.shake(5, 0.22); loopApi.hitstop(70); fx.flash(C.mint, 0.14); }
      dock.squash = 0.62; tween(dock, { squash: 1 }, { dur: 0.5, ease: "outElastic" });
      const semis = Math.min(game.chain, 14);
      S.sfx.blip({ f: 523 * Math.pow(2, semis / 12), f2: 523 * Math.pow(2, (semis + 7) / 12), dur: 0.16, type: "triangle", gain: 0.22 });
      if (grade === "exact") S.sfx.blip({ f: 1568, dur: 0.22, type: "sine", gain: 0.1 });
      if (pod.gsize === 1) game.markers.push({ x: hitX, v: pod.value, label: pod.f.label, t: 0, life: 1.0, ok: true, dockX: dock.x });
      if (game.chain > 0 && game.chain % spec.adapt.fastAfterChain === 0) adapt(+1);
    } else {
      game.chain = 0; game.missRun++;
      fx.burst(hitX, hitY - 30, { n: 14, color: C.amber, speed: 340, life: 1.1, size: 13, gravity: 1300, shard: true, floor: LINE_Y - 4, angle: -Math.PI / 2, spread: Math.PI });
      fx.ring(hitX, hitY, { color: C.amber, r0: 6, r1: 70, life: 0.5, width: 5 });
      fx.shake(3, 0.18);
      S.sfx.blip({ f: 180, f2: 90, dur: 0.22, type: "sine", gain: 0.25 });
      const off = nearestSimple(Math.abs(estimate - pod.value));
      if (pod.gsize === 1) game.markers.push({ x: hitX, v: pod.value, label: pod.f.label, t: 0, life: 1.9, ok: false, dockX: dock.x, off });
      if (game.missRun >= spec.adapt.slowAfterMisses) { adapt(-1); game.missRun = 0; }
    }
    // the "same spot" moment: an equal-value group resolves as ONE marker with the equation, caught or not
    const groupPods = game.results.filter((x) => x.group === pod.group);
    if (pod.gsize > 1 && groupPods.length === pod.gsize) {
      const labels = groupPods.map((x) => x.item);
      const all = groupPods.every((x) => x.caught);
      const off = all ? null : nearestSimple(Math.abs(estimate - pod.value));
      game.markers.push({ x: hitX, v: pod.value, label: labels.join(" = "), t: 0, life: all ? 2.0 : 2.2, ok: all, same: all, dockX: dock.x, off });
      if (all) {
        fx.pop(T.same, hitX, hitY - 205, { color: C.ion, size: 56, life: 1.4, rise: 36 });
        fx.ring(hitX, hitY, { color: C.ion, r0: 20, r1: 190, life: 0.8, width: 10 });
        S.sfx.blip({ f: 784, f2: 1175, dur: 0.3, type: "triangle", gain: 0.16 });
      }
      S.studio.event("same_spot", { items: labels, caught: all });
    }
  }
  function adapt(dir) {
    const a = spec.adapt;
    if (dir < 0) {
      game.speedScale = Math.max(a.minScale, game.speedScale * a.slowFactor);
      game.halfW = Math.min(BASE_HALF * 1.3, game.halfW * 1.12);
      game.scaffoldLeft = a.scaffoldPods;
      S.studio.event("adapt", { dir: "easier", speedScale: +game.speedScale.toFixed(2), halfW: +game.halfW.toFixed(1), scaffold: true });
    } else {
      game.speedScale = Math.min(a.maxScale, game.speedScale * a.fastFactor);
      game.halfW = Math.max(BASE_HALF * 0.8, game.halfW * 0.95);
      S.studio.event("adapt", { dir: "harder", speedScale: +game.speedScale.toFixed(2), halfW: +game.halfW.toFixed(1) });
    }
  }

  /* ------------------------------------------------------------------ update */
  function update(dt) {
    game.stateT += dt;
    // dock: critically damped spring toward the finger, speed-capped; keys move the target
    if (dock.keys) dock.target = clamp(dock.target + dock.keys * 720 * dt, X0 - 40, X1 + 40);
    const k = 260, c = 2 * Math.sqrt(k);
    const acc = k * (dock.target - dock.x) - c * dock.v;
    dock.v = clamp(dock.v + acc * dt, -1500, 1500);
    dock.x += dock.v * dt;

    if (game.state === "boot") return;
    if (game.state === "intro" && game.stateT > 1.9) {
      game.state = "play"; game.stateT = 0;
      tween(game, { introA: 0 }, { dur: 0.35, ease: "inCubic" });
    }
    if (game.state === "play") {
      game.clock += dt;
      const gap = game.wave.gap / game.speedScale;
      if (game.spawnIdx < game.wave.items.length && game.clock >= game.spawnIdx * gap + 0.2) {
        spawnGroup(game.wave.items[game.spawnIdx]);
        game.spawnIdx++;
      }
      if (game.spawnIdx >= game.wave.items.length && game.pods.length === 0 && game.markers.length === 0) endWave();
    }
    if (game.state === "end" && game.stateT > 3.1) {
      if (game.waveIdx + 1 < spec.waves.length) startWave(game.waveIdx + 1);
      else finish();
    }
    // pods
    for (let i = game.pods.length - 1; i >= 0; i--) {
      const p = game.pods[i];
      p.sway += dt * 2.2;
      p.flame += dt * 30;
      if (p.phase === "fall") {
        p.y += p.vy * dt;
        p.x += Math.sin(p.sway) * 10 * dt;
        if (p.y >= LOCK_Y) {
          p.phase = "dive"; p.dive = 0; p.fromX = p.x; p.fromY = p.y;
          S.sfx.blip({ f: 880, f2: 1320, dur: 0.07, type: "square", gain: 0.05 });
        }
      } else if (p.phase === "dive") {
        p.dive += dt / 0.26;
        const e = ease.inQuad(Math.min(1, p.dive));
        p.x = lerp(p.fromX, p.trueX, ease.outCubic(Math.min(1, p.dive)));
        p.y = lerp(p.fromY, LINE_Y - p.h / 2 + 6, e);
        if (p.dive >= 1) { game.pods.splice(i, 1); resolvePod(p); if (game.scaffoldLeft > 0) game.scaffoldLeft--; }
      }
    }
    for (let i = game.markers.length - 1; i >= 0; i--) { const m = game.markers[i]; m.t += dt; if (m.t >= m.life) game.markers.splice(i, 1); }
    for (const s of stars) s.tw += dt * (1 + s.z);
    fx.update(dt);
  }
  function endWave() {
    game.state = "end"; game.stateT = 0;
    const r = game.waveResults;
    game.endCard = { a: 0, landed: r.filter((x) => x.caught).length, n: r.length, precision: precisionOf(r), best: game.bestChain };
    tween(game.endCard, { a: 1 }, { dur: 0.45, ease: "outCubic" });
    tween(game.endCard, { a: 0 }, { dur: 0.35, ease: "inCubic", delay: 2.6 });
    S.sfx.blip({ f: 392, f2: 784, dur: 0.4, type: "triangle", gain: 0.12 });
    S.studio.event("wave_end", game.endCard);
  }
  function finish() {
    game.state = "final"; game.stateT = 0;
    const r = game.results;
    const misses = r.filter((x) => !x.caught).sort((a, b) => b.pae - a.pae);
    const tough = misses[0] || r.slice().sort((a, b) => b.pae - a.pae)[0];
    game.finalCard = { a: 0, landed: r.filter((x) => x.caught).length, n: r.length, precision: precisionOf(r), best: game.bestChain,
      tough: tough ? { item: tough.item, near: nearestSimple(tough.estimate) || tough.estimate.toFixed(2) } : null };
    tween(game.finalCard, { a: 1 }, { dur: 0.6, ease: "outCubic" });
    S.studio.done({ landed: game.finalCard.landed, n: r.length, precision: game.finalCard.precision, bestChain: game.bestChain, meanPAE: +(100 - game.finalCard.precision).toFixed(2) });
  }
  const precisionOf = (r) => (r.length ? Math.max(0, Math.round(100 - r.reduce((a, b) => a + b.pae, 0) / r.length)) : 100);

  /* ------------------------------------------------------------------ render */
  function render(ctx, now) {
    // background: deep ink, horizon glow, parallax stars, perspective floor
    ctx.drawImage(skyArt(), 0, 0, W, H);
    ctx.save();
    ctx.translate(fx.ox, fx.oy);
    const par = (dock.x - 500) / 500;
    for (const s of stars) {
      const x = ((s.x - par * 18 * s.z) % W + W) % W;
      ctx.globalAlpha = (0.25 + 0.5 * s.z) * (0.7 + 0.3 * Math.sin(s.tw));
      ctx.fillStyle = s.z > 0.8 ? C.ion : C.ink2;
      const r = 0.8 + s.z * 1.6;
      ctx.fillRect(x - r / 2, s.y - r / 2, r, r);
    }
    ctx.globalAlpha = 1;
    // floor
    ctx.fillStyle = "#0B0D15"; ctx.fillRect(-20, LINE_Y, W + 40, H - LINE_Y + 20);
    ctx.strokeStyle = "rgba(139,152,255,.10)"; ctx.lineWidth = 1.5;
    const vpX = 500, vpY = LINE_Y - 150;
    for (let i = -10; i <= 10; i++) {
      const xb = 500 + i * 70;
      ctx.beginPath(); ctx.moveTo(lerp(vpX, xb, (LINE_Y - vpY) / (H + 40 - vpY)), LINE_Y); ctx.lineTo(xb, H + 40); ctx.stroke();
    }
    const scroll = S.reducedMotion ? 0 : (now * 0.35) % 1;
    for (let j = 0; j < 7; j++) {
      const z = (j + scroll) / 7, y = LINE_Y + Math.pow(z, 2.1) * (H - LINE_Y + 30);
      ctx.globalAlpha = 0.25 + 0.75 * z;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    if (game.wave) drawLine(ctx, now);
    drawMarkers(ctx);
    drawDock(ctx);
    for (const p of game.pods) drawPod(ctx, p, now);
    fx.drawWorld(ctx);
    ctx.restore();

    syncHud();
    if (game.state === "intro" || game.introA > 0.01) drawIntro(ctx);
    if (game.endCard && game.endCard.a > 0.01) drawEndCard(ctx, game.endCard);
    if (game.finalCard) drawFinal(ctx, game.finalCard);
    if (game.coachA > 0.01 && game.state !== "boot") {
      S.text(ctx, T.coach, 500, 600, { font: "mono", size: 38, weight: 500, color: C.ink2, align: "center", alpha: game.coachA * (0.65 + 0.35 * Math.sin(now * 4)) });
    }
    fx.drawScreen(ctx);
  }

  let _sky = null;
  function skyArt() {                     // static sky + horizon glow, painted once at half resolution (it is all gradient)
    if (_sky) return _sky;
    _sky = document.createElement("canvas"); _sky.width = 500; _sky.height = 313;
    const g = _sky.getContext("2d"); g.scale(0.5, 0.5);
    g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
    const sky = g.createLinearGradient(0, 0, 0, LINE_Y);
    sky.addColorStop(0, "#090B11"); sky.addColorStop(0.7, "#0E1220"); sky.addColorStop(1, "#151A33");
    g.fillStyle = sky; g.fillRect(0, 0, W, LINE_Y);
    const hg = g.createRadialGradient(500, LINE_Y, 10, 500, LINE_Y, 520);
    hg.addColorStop(0, "rgba(139,152,255,.22)"); hg.addColorStop(1, "rgba(139,152,255,0)");
    g.fillStyle = hg; g.fillRect(-20, -20, W + 40, LINE_Y + 20);
    return _sky;
  }
  function drawLine(ctx, now) {
    const w = game.wave, gl = game.lineGlow;
    const xEnd = lerp(X0, X1, gl);
    // glow under the line
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = S.glow(C.ion, 40);
    ctx.globalAlpha = 0.35 + 0.15 * Math.min(1, game.chain / 6);
    ctx.drawImage(g, X0 - 30, LINE_Y - 30, xEnd - X0 + 60, 60);
    ctx.restore();
    // the line
    ctx.lineCap = "round";
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(X0, LINE_Y); ctx.lineTo(xEnd, LINE_Y); ctx.stroke();
    // integer ends + labels
    for (let v = w.line[0]; v <= w.line[1]; v++) {
      const x = xOf(v);
      if (x > xEnd + 1) continue;
      ctx.lineWidth = 6; ctx.strokeStyle = C.ink;
      ctx.beginPath(); ctx.moveTo(x, LINE_Y - 22); ctx.lineTo(x, LINE_Y + 22); ctx.stroke();
      S.text(ctx, String(v), x, LINE_Y + 68, { font: "mono", size: 44, weight: 600, color: C.ink2, align: "center" });
    }
    // tick marks (the spec's, or the adaptive scaffold's)
    const ticks = game.scaffoldLeft > 0 ? Math.max(w.ticks, w.scaffoldTicks) : w.ticks;
    if (ticks > 1) {
      ctx.strokeStyle = game.scaffoldLeft > 0 && w.ticks < ticks ? "rgba(139,152,255,.8)" : C.ink3;
      ctx.lineWidth = 4;
      for (let v = w.line[0]; v < w.line[1]; v++) {
        for (let k = 1; k < ticks; k++) {
          const x = xOf(v + k / ticks);
          if (x > xEnd) continue;
          ctx.beginPath(); ctx.moveTo(x, LINE_Y - 12); ctx.lineTo(x, LINE_Y + 12); ctx.stroke();
        }
      }
    }
  }

  function drawDock(ctx) {
    const x = dock.x, hw = game.halfW, sq = dock.squash, lean = clamp(dock.v * 0.00022, -0.12, 0.12);
    ctx.save();
    ctx.translate(x, LINE_Y);
    // catch beam
    const bh = 190 * sq;
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.22;
    ctx.drawImage(S.glow(C.volt, 64, 0.1), -hw * 0.9, -bh, hw * 1.8, bh * 2); ctx.restore();
    ctx.rotate(lean);
    ctx.scale(1 + (1 - sq) * 0.5, sq);
    ctx.strokeStyle = C.volt; ctx.fillStyle = C.volt; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = 7;
    // prongs
    ctx.beginPath();
    ctx.moveTo(-hw - 8, -40); ctx.lineTo(-hw, -30); ctx.lineTo(-hw, 16);
    ctx.moveTo(hw + 8, -40); ctx.lineTo(hw, -30); ctx.lineTo(hw, 16);
    ctx.stroke();
    // base
    S.roundRect(ctx, -hw - 14, 16, hw * 2 + 28, 14, 7); ctx.fill();
    // centre pin (the exact point the dock reads)
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-11, 44); ctx.lineTo(0, 32); ctx.lineTo(11, 44); ctx.closePath(); ctx.fill();
    ctx.restore();
    // volt glow
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.35;
    const g = S.glow(C.volt, 60); ctx.drawImage(g, x - hw - 30, LINE_Y - 30, hw * 2 + 60, 80); ctx.restore();
  }

  function drawPod(ctx, p, now) {
    const f = p.f;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.a;
    ctx.scale(p.sc, p.sc);
    // measure content
    const big = 48, wholeSize = 60;
    const nW = S.measure(ctx, String(f.mixed ? f.n : f.num), { font: "display", size: big, weight: 700 });
    const dW = S.measure(ctx, String(f.d), { font: "display", size: big, weight: 700 });
    const fracW = Math.max(nW, dW) + 10;
    const wholeW = f.mixed ? S.measure(ctx, String(f.w), { font: "display", size: wholeSize, weight: 800 }) + 14 : 0;
    const w = f.whole ? 96 : Math.max(104, fracW + wholeW + 52);
    p.w = w;
    const h = p.h;
    // lock beam (from the pod down to where the value really lives)
    if (p.phase === "dive") {
      ctx.save();
      ctx.scale(1 / p.sc, 1 / p.sc);
      ctx.globalAlpha = 0.6 * (1 - p.dive);
      ctx.strokeStyle = C.ion; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(p.trueX - p.x, LINE_Y - p.y); ctx.stroke();
      ctx.restore();
    }
    // thruster flame (slow descent reads as intentional)
    if (p.phase === "fall" && !S.reducedMotion) {
      ctx.save(); ctx.globalCompositeOperation = "lighter";
      const fl = 26 + Math.sin(p.flame) * 6 + Math.sin(p.flame * 2.7) * 4;
      const g = S.glow(C.ion, 30);
      ctx.globalAlpha = 0.75;
      ctx.drawImage(g, -22, h / 2 - 12, 44, fl + 24);
      ctx.restore();
    }
    // body glow
    ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.4 * p.a;
    const gg = S.glow(C.ion, 80); ctx.drawImage(gg, -w / 2 - 34, -h / 2 - 34, w + 68, h + 68); ctx.restore();
    // body
    const grd = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grd.addColorStop(0, "#232A45"); grd.addColorStop(1, "#141829");
    ctx.fillStyle = grd;
    S.roundRect(ctx, -w / 2, -h / 2, w, h, 30); ctx.fill();
    ctx.strokeStyle = C.ion; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.10)"; ctx.lineWidth = 2;
    S.roundRect(ctx, -w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 24); ctx.stroke();
    // value
    if (f.whole) {
      S.text(ctx, String(f.w), 0, 2, { font: "display", size: wholeSize, weight: 800, color: C.ink, align: "center", baseline: "middle" });
    } else {
      const fx0 = f.mixed ? (wholeW / 2) : 0;
      if (f.mixed) S.text(ctx, String(f.w), -fracW / 2 - 4, 4, { font: "display", size: wholeSize, weight: 800, color: C.ink, align: "center", baseline: "middle" });
      const cx = f.mixed ? wholeW / 2 - 2 : 0;
      S.text(ctx, String(f.mixed ? f.n : f.num), cx, -22, { font: "display", size: big, weight: 700, color: C.ink, align: "center", baseline: "middle" });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(cx - fracW / 2 + 4, 4); ctx.lineTo(cx + fracW / 2 - 4, 4); ctx.stroke();
      S.text(ctx, String(f.d), cx, 32, { font: "display", size: big, weight: 700, color: C.ink, align: "center", baseline: "middle" });
      void fx0;
    }
    ctx.restore();
  }

  function drawMarkers(ctx) {
    for (const m of game.markers) {
      const k = m.t / m.life, a = k < 0.1 ? k / 0.1 : k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1;
      const col = m.same ? C.ion : m.ok ? C.mint : C.amber;
      ctx.save();
      ctx.globalAlpha = a;
      // truth mark on the line
      ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(m.x, LINE_Y - 34); ctx.lineTo(m.x, LINE_Y + 10); ctx.stroke();
      // label above the mark (where the value lives)
      const y = LINE_Y - 96;
      const lw = S.measure(ctx, m.label, { font: "mono", size: 40, weight: 600 }) + 36;
      const bx = clamp(m.x - lw / 2, 190, 830 - lw);
      ctx.fillStyle = "rgba(16,19,27,.86)"; S.roundRect(ctx, bx, y - 30, lw, 60, 14); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke();
      S.text(ctx, m.label, bx + lw / 2, y + 2, { font: "mono", size: 40, weight: 600, color: col, align: "center", baseline: "middle" });
      if (!m.ok) {
        // the gap: from where the dock read to where the value lives (shape: magnifier = "look again", never red)
        const yb = LINE_Y + 36;
        ctx.setLineDash([8, 9]); ctx.lineWidth = 4; ctx.strokeStyle = C.amber;
        ctx.beginPath(); ctx.moveTo(m.dockX, yb); ctx.lineTo(m.x, yb); ctx.stroke();
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(m.dockX, yb - 10); ctx.lineTo(m.dockX, yb + 10); ctx.moveTo(m.x, yb - 10); ctx.lineTo(m.x, yb + 10); ctx.stroke();
        magnifier(ctx, m.x + (m.x >= m.dockX ? 36 : -36), LINE_Y - 60, C.amber);
        if (m.off) S.text(ctx, `${T.offBy} ~${m.off}`, clamp((m.x + m.dockX) / 2, 280, 720), LINE_Y + 84, { font: "mono", size: 38, weight: 500, color: C.amber, align: "center", baseline: "middle" });
      } else if (m.ok && !m.same) {
        tick(ctx, m.x + 34, LINE_Y - 64, C.mint);
      }
      ctx.restore();
    }
  }
  function tick(ctx, x, y, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x - 3, y + 10); ctx.lineTo(x + 14, y - 10); ctx.stroke(); ctx.restore();
  }
  function magnifier(ctx, x, y, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.beginPath(); ctx.arc(x - 3, y - 3, 11, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 5, y + 5); ctx.lineTo(x + 15, y + 15); ctx.stroke(); ctx.restore();
  }

  const hud = S.hud(st, [
    { key: "wave", label: "Wave" }, { key: "chain", label: "Chain" }, { key: "prec", label: "Precision", meter: true },
  ]);
  hud.show(false);
  function syncHud() {
    if (!game.wave) return;
    hud.label("wave", T.wave); hud.label("chain", T.chain); hud.label("prec", T.precision);
    hud.set("wave", `${game.waveIdx + 1}/${spec.waves.length}`);
    hud.set("chain", `×${game.chain}`, { tone: game.chain >= 5 ? "ion" : null, bump: true });
    const p = game.results.length ? precisionOf(game.results) : null;
    hud.set("prec", p == null ? "—" : `${p}%`, { meter: p == null ? 0 : p / 100, tone: p != null && p >= 90 ? "mint" : null });
  }

  function drawIntro(ctx) {
    const a = game.introA, w = game.wave;
    if (a <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = "rgba(10,12,18,.45)"; ctx.fillRect(0, 0, W, H);
    const sc = 1 + (1 - ease.outCubic(Math.min(1, game.stateT / 0.5))) * 0.25;
    S.text(ctx, `${T.wave.toUpperCase()} ${game.waveIdx + 1} ${T.of.toUpperCase()} ${spec.waves.length}`, 500, 220, { font: "mono", size: 38, weight: 600, color: C.ink3, align: "center", track: 6 });
    ctx.save(); ctx.translate(500, 300); ctx.scale(sc, sc);
    S.text(ctx, w.title, 0, 0, { font: "display", size: 104, weight: 800, color: C.ink, align: "center", baseline: "middle", track: -3 });
    ctx.restore();
    const lw = 260 * ease.outCubic(Math.min(1, game.stateT / 0.8));
    ctx.strokeStyle = C.ion; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(500 - lw / 2, 366); ctx.lineTo(500 + lw / 2, 366); ctx.stroke();
    if (w.sub) S.text(ctx, w.sub, 500, 420, { font: "ui", size: 40, weight: 500, color: C.ink2, align: "center" });
    ctx.restore();
  }

  function card(ctx, a, wdt, hgt) {
    const x = 500 - wdt / 2, y = 300 - hgt / 2 + (1 - a) * 18;
    ctx.fillStyle = "rgba(10,12,18,.55)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(22,26,36,.94)"; S.roundRect(ctx, x, y, wdt, hgt, 28); ctx.fill();
    ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
    return { x, y };
  }
  function drawEndCard(ctx, e) {
    ctx.save(); ctx.globalAlpha = e.a;
    const { x, y } = card(ctx, e.a, 800, 300);
    S.text(ctx, `${T.wave.toUpperCase()} ${game.waveIdx + 1} ${T.clear.toUpperCase()}`, 500, y + 66, { font: "mono", size: 38, weight: 600, color: C.mint, align: "center", track: 4 });
    tick(ctx, 500 - S.measure(ctx, `${T.wave.toUpperCase()} ${game.waveIdx + 1} ${T.clear.toUpperCase()}`, { font: "mono", size: 38, track: 4 }) / 2 - 34, y + 56, C.mint);
    void x;
    stat(ctx, 255, y + 160, `${e.landed}/${e.n}`, T.landed);
    stat(ctx, 500, y + 160, `${e.precision}%`, T.precision);
    stat(ctx, 745, y + 160, `×${e.best}`, T.bestChain);
    ctx.restore();
  }
  function stat(ctx, x, y, v, label) {
    S.text(ctx, v, x, y, { font: "display", size: 60, weight: 800, color: C.ink, align: "center", baseline: "middle" });
    S.text(ctx, label, x, y + 62, { font: "mono", size: 38, weight: 500, color: C.ink3, align: "center", baseline: "middle" });
  }
  function drawFinal(ctx, e) {
    ctx.save(); ctx.globalAlpha = e.a;
    const { y } = card(ctx, e.a, 800, 400);
    S.text(ctx, T.runDone.toUpperCase(), 500, y + 66, { font: "mono", size: 38, weight: 600, color: C.ion, align: "center", track: 4 });
    stat(ctx, 255, y + 160, `${e.landed}/${e.n}`, T.landed);
    stat(ctx, 500, y + 160, `${e.precision}%`, T.precision);
    stat(ctx, 745, y + 160, `×${e.best}`, T.bestChain);
    if (e.tough) {
      ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(160, y + 268); ctx.lineTo(840, y + 268); ctx.stroke();
      S.text(ctx, `${T.toughest}: ${e.tough.item}  ·  you read ~${e.tough.near}`, 500, y + 330, { font: "mono", size: 38, weight: 500, color: C.amber, align: "center", baseline: "middle" });
    }
    ctx.restore();
  }

  /* ------------------------------------------------------------------ test seam (test builds only; LIVE-STUDIO D2) */
  S.studio.seam = () => ({
    state: game.state, wave: game.waveIdx + 1, waves: spec.waves.length, dockX: dock.x, halfW: game.halfW,
    line: game.wave ? { x0: X0, x1: X1, min: lineMin(), max: lineMax() } : null,
    pods: game.pods.map((p) => ({ id: p.id, label: p.f.label, value: p.value, x: p.x, y: p.y, trueX: p.trueX, phase: p.phase, eta: p.phase === "fall" ? (LOCK_Y - p.y) / p.vy : 0 })),
    results: game.results.length, repairs,
  });

  let loopApi;
  S.fontsReady().then(() => {
    loopApi = S.loop(st, update, render);
    S.studio.ready();
    setTimeout(() => { hud.show(true); startWave(0); }, 450);
  });
})();
