/* CIRCUIT LAB — archetype `circuit-bench@1` (STUDIO-V2 §3, simulation archetype S1).
 *
 * ENGINE (this file): a real DC solver (modified nodal analysis, cells with internal resistance, exact KCL), current
 * drawn as moving charge whose speed is proportional to the solved current, filament warm-up, short-circuit heating,
 * drag-and-snap building on a node grid, the material tester, closed-vocabulary goal predicates, the test seam.
 * GENERATED (index.html#spec): the sequence of challenges, which tools appear when (implicit scaffolding: PhET's
 * affordances-and-constraints), presets, which predicate ends each step, and the child-visible strings.
 * The model never writes physics and never writes a check: it picks predicates from a list the engine implements.
 */
(function () {
  "use strict";
  const S = window.TaxStudio;
  const { C, W, H, ease, clamp, lerp, tween } = S;

  /* ------------------------------------------------------------------ physics constants (engine-owned) */
  const PHYS = { cellV: 1.5, cellR: 0.4, bulbR: 5, wireR: 0.02, switchR: 0.02, leak: 1e-6 };
  const PREF = Math.pow(PHYS.cellV / (PHYS.bulbR + PHYS.cellR), 2) * PHYS.bulbR;   // one bulb on one cell
  const MATERIALS = {
    coin:   { name: "Coin",   R: 0.03,     kind: "metal" },
    nail:   { name: "Nail",   R: 0.08,     kind: "metal" },
    pencil: { name: "Pencil", R: 7,        kind: "graphite" },   // pencil lead conducts, weakly: the bulb glows dim
    ruler:  { name: "Ruler",  R: Infinity, kind: "plastic" },
    eraser: { name: "Eraser", R: Infinity, kind: "rubber" },
    glass:  { name: "Glass",  R: Infinity, kind: "glass" },
  };
  const TOOLS = { wire: "Wire", bulb: "Bulb", switch: "Switch", cell: "Cell", meter: "Meter" };

  /* ------------------------------------------------------------------ grid */
  const COLS = [320, 475, 630, 785, 940], ROWS = [282, 472];
  const NC = COLS.length, NR = ROWS.length, N = NC * NR;
  const nid = (c, r) => c + r * NC;
  const npos = (i) => ({ x: COLS[i % NC], y: ROWS[Math.floor(i / NC)] });
  const edges = [];
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC - 1; c++) edges.push(mkEdge(nid(c, r), nid(c + 1, r)));
  for (let c = 0; c < NC; c++) for (let r = 0; r < NR - 1; r++) edges.push(mkEdge(nid(c, r), nid(c, r + 1)));
  function mkEdge(a, b) {
    const pa = npos(a), pb = npos(b);
    return { a, b, ax: pa.x, ay: pa.y, bx: pb.x, by: pb.y, mx: (pa.x + pb.x) / 2, my: (pa.y + pb.y) / 2, len: Math.hypot(pb.x - pa.x, pb.y - pa.y),
      horiz: pa.y === pb.y, comp: null, I: 0, phase: 0, speedVis: 0, meter: false, key: `${a}-${b}` };
  }
  const parseNode = (s) => { const [c, r] = String(s).split(",").map(Number); return Number.isInteger(c) && Number.isInteger(r) && c >= 0 && c < NC && r >= 0 && r < NR ? nid(c, r) : -1; };
  function edgeAt(spec) {
    const [p, q] = String(spec).split("-");
    const a = parseNode(p), b = parseNode(q);
    if (a < 0 || b < 0) return null;
    return edges.find((e) => (e.a === Math.min(a, b) && e.b === Math.max(a, b))) || null;
  }

  /* ------------------------------------------------------------------ spec validation (closed vocabularies) */
  const PREDICATES = ["bulbLit", "meters", "switchCycle", "tested", "brightness"];
  const DEFAULT_STRINGS = { stepOf: "of", short: "Short circuit: the cell is heating up", fight: "Cells fighting? Tap the new cell to flip it", conducts: "conducts", blocks: "blocks", flow: "FLOW", labDone: "Lab complete", free: "Free build: drag from the tray, tap to flip or switch" };
  function validate(raw) {
    const repairs = [];
    const strings = Object.assign({}, DEFAULT_STRINGS, (raw && raw.strings) || {});
    for (const k in strings) if (typeof strings[k] !== "string" || strings[k].length > 70 || /[<>{}]/.test(strings[k])) { strings[k] = DEFAULT_STRINGS[k] || ""; repairs.push("string:" + k); }
    const steps = [];
    for (const st of (raw && Array.isArray(raw.steps) ? raw.steps : [])) {
      if (!st || typeof st !== "object" || Array.isArray(st)) { repairs.push("step:not-an-object"); continue; }
      const pred = st.check && typeof st.check === "object" && Object.keys(st.check)[0];
      if (!PREDICATES.includes(pred)) { repairs.push("predicate:" + pred); continue; }
      const tray = (Array.isArray(st.tray) ? st.tray : []).filter((t) => TOOLS[t] || MATERIALS[t]);
      const preset = [];
      for (const p of Array.isArray(st.preset) ? st.preset : []) {
        if (!p || typeof p !== "object") { repairs.push("preset:not-an-object"); continue; }
        const e = edgeAt(p.at);
        if (!e || !["wire", "bulb", "switch", "cell", "tester", "empty"].includes(p.put)) { repairs.push("preset:" + p.at); continue; }
        const plus = p.plus != null ? parseNode(p.plus) : -1;
        if (p.put === "cell" && plus !== e.a && plus !== e.b) { repairs.push("cell-plus:" + p.at); continue; }
        preset.push({ e, put: p.put, plus, locked: !!p.locked });
      }
      const s = (x, n) => (typeof x === "string" && x.length <= (n || 70) && !/[<>{}]/.test(x) ? x : "");
      steps.push({ id: String(st.id || pred), goal: s(st.goal), done: s(st.done, 80), then: (Array.isArray(st.then) ? st.then : []).map((x) => s(x)), tray, preset,
        cue: st.cue ? edgeAt(st.cue) : null, check: st.check, hint: s(st.hint) });
    }
    if (!steps.length) {
      repairs.push("fallback-default");
      steps.push({ id: "close", goal: "Make the bulb glow", done: "Closed loop: current flows all the way round", then: [], tray: ["wire", "bulb", "cell"], preset: [], cue: null, check: { bulbLit: true }, hint: "" });
    }
    return { steps, strings, repairs };
  }

  /* ------------------------------------------------------------------ solver: modified nodal analysis */
  function resistanceOf(comp) {
    if (!comp) return Infinity;
    switch (comp.type) {
      case "wire": return PHYS.wireR;
      case "bulb": return PHYS.bulbR;
      case "switch": return comp.closed ? PHYS.switchR : Infinity;
      case "tester": return comp.material ? MATERIALS[comp.material].R : Infinity;
      default: return Infinity;
    }
  }
  function solve() {
    const G = Array.from({ length: N }, () => new Float64Array(N));
    const I = new Float64Array(N);
    const add = (a, b, g) => { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
    for (const e of edges) {
      const c = e.comp;
      if (!c) continue;
      if (c.type === "cell") {
        const g = 1 / PHYS.cellR, plus = c.plus, minus = plus === e.a ? e.b : e.a;
        add(e.a, e.b, g); I[plus] += PHYS.cellV * g; I[minus] -= PHYS.cellV * g;
      } else {
        const R = resistanceOf(c);
        if (isFinite(R)) add(e.a, e.b, 1 / R);
      }
    }
    for (let i = 0; i < N; i++) G[i][i] += PHYS.leak;
    const v = gaussSolve(G, I);
    for (const e of edges) {
      const c = e.comp;
      if (!c) { e.I = 0; continue; }
      if (c.type === "cell") {
        const g = 1 / PHYS.cellR, s = c.plus === e.b ? 1 : -1;
        e.I = g * (v[e.a] - v[e.b]) + s * PHYS.cellV * g;          // conventional current a -> b through the cell
      } else {
        const R = resistanceOf(c);
        e.I = isFinite(R) ? (v[e.a] - v[e.b]) / R : 0;
      }
      if (Math.abs(e.I) < 1e-4) e.I = 0;
      if (c.type === "bulb") c.P = e.I * e.I * PHYS.bulbR;
    }
    return v;
  }
  function gaussSolve(A, b) {
    const n = b.length, M = A.map((row, i) => { const r = Array.from(row); r.push(b[i]); return r; });
    for (let col = 0; col < n; col++) {
      let piv = col;
      for (let r = col + 1; r < n; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      [M[col], M[piv]] = [M[piv], M[col]];
      const d = M[col][col];
      if (Math.abs(d) < 1e-15) continue;
      for (let r = col + 1; r < n; r++) {
        const f = M[r][col] / d;
        if (f) for (let k = col; k <= n; k++) M[r][k] -= f * M[col][k];
      }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let s = M[r][n];
      for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
      x[r] = Math.abs(M[r][r]) < 1e-15 ? 0 : s / M[r][r];
    }
    return x;
  }

  /* ------------------------------------------------------------------ boot */
  S.hostChrome();
  const st = S.stage({ el: "#stage" });
  const fx = S.fx(st);
  const { steps, strings: T, repairs } = validate(S.studio.params());
  if (repairs.length) S.studio.event("spec_repaired", { repairs });

  // task pill (engine-owned DOM)
  const task = document.createElement("div");
  task.className = "task";
  task.innerHTML = '<span class="ico"><svg viewBox="0 0 16 16" fill="none" stroke="#3DDC97" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5l3.2 3L13 4.5"/></svg></span><span class="step"></span><span class="goal"></span>';
  st.el.appendChild(task);
  function setTask(stepText, goal, mode) {
    task.classList.add("swap");
    setTimeout(() => {
      task.querySelector(".step").textContent = stepText;
      task.querySelector(".goal").textContent = goal;
      task.classList.toggle("done", mode === "done");
      task.classList.toggle("warn", mode === "warn");
      task.classList.remove("swap");
    }, 180);
  }

  const lab = { stepIdx: -1, step: null, stepT: 0, sub: 0, done: false, tested: {}, switchSeen: { off: false, on: false }, finalCard: null,
    tray: [], drag: null, hoverEdge: null, cuePulse: 0, warn: null, lastSolveKey: "", short: 0, history: [] };
  const lights = [];   // light pools from bulbs

  /* ------------------------------------------------------------------ tray */
  const TRAY_X = 14, TRAY_W = 190;
  function layoutTray(ids) {
    const many = ids.length > 4;
    const h = many ? 80 : 104, gap = many ? 6 : 10;
    lab.tray = ids.map((id, i) => ({ id, x: TRAY_X, y: 96 + i * (h + gap), w: TRAY_W, h, a: 0, off: -30 }));
    lab.tray.forEach((t, i) => tween(t, { a: 1, off: 0 }, { dur: 0.35, delay: 0.05 * i, ease: "outCubic" }));
  }
  const trayHit = (p) => lab.tray.find((t) => p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h);

  /* ------------------------------------------------------------------ building */
  function place(e, type, o) {
    o = o || {};
    if (type === "meter") { e.meter = true; S.sfx.blip({ f: 1200, dur: 0.05, type: "square", gain: 0.05 }); return; }
    const prev = e.comp;
    if (prev && prev.locked && !o.force) return false;
    if (type === "empty") { e.comp = null; e.meter = false; return true; }
    const comp = { type, a: 0, sc: 0.5, locked: !!o.locked };
    if (type === "cell") comp.plus = o.plus != null && o.plus >= 0 ? o.plus : e.b;     // default: + at the edge's second node
    if (type === "switch") { comp.closed = true; comp.ang = 0; }
    if (type === "bulb") { comp.P = 0; comp.glow = 0; }
    if (type === "tester") comp.material = null;
    e.comp = comp;
    if (type !== "tester") e.meter = e.meter && false;
    tween(comp, { a: 1, sc: 1 }, { dur: o.instant ? 0.01 : 0.38, ease: "outBack" });
    if (!o.quiet) {
      fx.burst(e.ax, e.ay, { n: 6, color: C.sci, speed: 140, life: 0.35, size: 7 });
      fx.burst(e.bx, e.by, { n: 6, color: C.sci, speed: 140, life: 0.35, size: 7 });
      S.sfx.blip({ f: 420, f2: 260, dur: 0.06, type: "square", gain: 0.06 });
    }
    return true;
  }
  function edgeNear(p, maxD) {
    let best = null, bd = maxD || 62;
    for (const e of edges) {
      const dx = e.bx - e.ax, dy = e.by - e.ay;
      const t = ((p.x - e.ax) * dx + (p.y - e.ay) * dy) / (e.len * e.len);
      if (t < 0.12 || t > 0.88) continue;
      const d = Math.hypot(p.x - (e.ax + dx * t), p.y - (e.ay + dy * t));
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }
  const nodeNear = (p, maxD) => { for (let i = 0; i < N; i++) { const q = npos(i); if (Math.hypot(p.x - q.x, p.y - q.y) < (maxD || 34)) return i; } return -1; };

  st.onPointer({
    down(p) {
      S.sfx.unlock();
      const t = trayHit(p);
      if (t) { lab.drag = { kind: "new", id: t.id, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; return; }
      const e = edgeNear(p, 48);
      if (e && (e.comp || e.meter)) {
        lab.drag = { kind: "board", e, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false };
        return;
      }
      const n = nodeNear(p, 34);
      if (n >= 0) { lab.drag = { kind: "wire", last: n, x: p.x, y: p.y, sx: p.x, sy: p.y, moved: false }; return; }
    },
    move(p) {
      const d = lab.drag;
      if (!d) return;
      d.x = p.x; d.y = p.y;
      if (Math.hypot(p.x - d.sx, p.y - d.sy) > 10) d.moved = true;
      if (d.kind === "new" || (d.kind === "board" && d.moved)) {
        if (d.kind === "board" && !d.lifted) {
          const e = d.e;
          if (e.comp && e.comp.locked) { lab.drag = null; return; }
          d.lifted = true;
          if (e.meter && !e.comp) { d.id = "meter"; e.meter = false; }
          else if (e.comp && e.comp.type === "tester") { d.id = e.comp.material; d.fromTester = e; if (!d.id) { lab.drag = null; return; } e.comp.material = null; }
          else { d.id = e.comp.type; d.carry = e.comp; e.comp = null; e.meter = false; }
        }
        lab.hoverEdge = edgeNear(p, 70);
      }
      if (d.kind === "wire") {
        const n = nodeNear(p, 30);
        if (n >= 0 && n !== d.last) {
          const e = edges.find((x) => (x.a === Math.min(n, d.last) && x.b === Math.max(n, d.last)));
          if (e && !e.comp) place(e, "wire");
          d.last = n;
        }
      }
    },
    up(p) {
      const d = lab.drag;
      lab.drag = null;
      const target = lab.hoverEdge;
      lab.hoverEdge = null;
      if (!d) return;
      if (d.kind === "board" && !d.moved) { tapComponent(d.e); return; }
      if (d.kind === "wire") return;
      if (!d.id) return;
      const isMat = !!MATERIALS[d.id];
      if (target) {
        if (isMat) {
          if (target.comp && target.comp.type === "tester") { target.comp.material = d.id; target.comp.matA = 0; tween(target.comp, { matA: 1 }, { dur: 0.3, ease: "outBack" }); S.sfx.blip({ f: 600, f2: 900, dur: 0.06, type: "triangle", gain: 0.08 }); onTest(target, d.id); }
          return;
        }
        if (d.id === "meter") { if (target.comp) place(target, "meter"); return; }
        if (target.comp && target.comp.locked) return;
        if (target.comp && target.comp.type === "tester") return;
        if (d.carry && d.id === "cell") place(target, "cell", { plus: d.carry.plus === d.e.a ? target.a : target.b });
        else if (d.carry && d.id === "switch") { place(target, "switch"); target.comp.closed = d.carry.closed; target.comp.ang = d.carry.ang; }
        else place(target, d.id);
      } else if (d.kind === "board") {
        fx.burst(p.x, p.y, { n: 10, color: C.ink3, speed: 160, life: 0.4, size: 8 });
        S.sfx.noise({ dur: 0.12, f: 500, gain: 0.08 });
      }
    },
  });
  function tapComponent(e) {
    const c = e.comp;
    if (!c) return;
    if (c.type === "switch") {
      c.closed = !c.closed;
      tween(c, { ang: c.closed ? 0 : 1 }, { dur: 0.32, ease: c.closed ? "outBack" : "outCubic" });
      S.sfx.noise({ dur: 0.07, f: 2400, filter: "highpass", gain: 0.2 });
      S.sfx.blip({ f: c.closed ? 300 : 200, dur: 0.05, type: "square", gain: 0.06 });
      S.studio.event("switch", { closed: c.closed, edge: e.key });
    } else if (c.type === "cell" && !c.locked) {
      c.plus = c.plus === e.a ? e.b : e.a;
      c.flip = 0; tween(c, { flip: 1 }, { dur: 0.35, ease: "outCubic" });
      S.sfx.blip({ f: 520, f2: 780, dur: 0.08, type: "triangle", gain: 0.08 });
      S.studio.event("cell_flip", { edge: e.key });
    }
  }
  function onTest(e, id) {
    // brightness is read after the solve in update(); record the observation on the next frame
    lab.pendingTest = { id, t: 0.45 };
  }

  /* ------------------------------------------------------------------ steps */
  function startStep(i) {
    lab.stepIdx = i; lab.step = steps[i]; lab.stepT = 0; lab.sub = 0; lab.done = false; lab.switchSeen = { off: false, on: false };
    for (const p of lab.step.preset) {
      if (p.put === "tester" || p.put === "empty") { p.e.meter = false; }
      place(p.e, p.put, { plus: p.plus, locked: p.locked, force: true, quiet: i === 0, instant: false });
    }
    layoutTray(lab.step.tray);
    setTask(`${i + 1} ${T.stepOf} ${steps.length}`, lab.step.goal, null);
    S.studio.event("step_start", { step: i + 1, id: lab.step.id });
  }
  function bulbs() { return edges.filter((e) => e.comp && e.comp.type === "bulb"); }
  function brightness() { return bulbs().reduce((m, e) => Math.max(m, (e.comp.P || 0) / PREF), 0); }
  function checkStep() {
    const s = lab.step, key = Object.keys(s.check)[0], arg = s.check[key];
    if (key === "bulbLit") return brightness() > 0.2;
    if (key === "meters") return edges.filter((e) => e.meter && Math.abs(e.I) > 0.01).length >= (+arg || 2);
    if (key === "switchCycle") {
      const sw = edges.find((e) => e.comp && e.comp.type === "switch");
      if (!sw) return false;
      const lit = brightness() > 0.2;
      if (lab.sub === 0) { lab.sub = 1; setTask(`${lab.stepIdx + 1} ${T.stepOf} ${steps.length}`, s.then[0] || s.goal); }
      if (lab.sub === 1 && !sw.comp.closed && !lit) { lab.sub = 2; setTask(`${lab.stepIdx + 1} ${T.stepOf} ${steps.length}`, s.then[1] || s.goal); }
      return lab.sub === 2 && sw.comp.closed && lit;
    }
    if (key === "tested") {
      const n = Object.keys(lab.tested).length;
      const must = (arg && arg.must) || [];
      return n >= ((arg && arg.n) || 4) && must.every((m) => lab.tested[m]);
    }
    if (key === "brightness") return brightness() >= (+arg || 2);
    return false;
  }
  function completeStep() {
    lab.done = true;
    setTask(`${lab.stepIdx + 1} ${T.stepOf} ${steps.length}`, lab.step.done, "done");
    S.sfx.blip({ f: 659, dur: 0.12, type: "triangle", gain: 0.14 });
    setTimeout(() => S.sfx.blip({ f: 988, dur: 0.18, type: "triangle", gain: 0.12 }), 110);
    fx.flash(C.mint, 0.08);
    for (const e of edges) if (Math.abs(e.I) > 0.01) fx.burst(e.mx, e.my, { n: 5, color: C.mint, speed: 120, life: 0.6, size: 9 });
    S.studio.answer(`step:${lab.step.id}`, true, { brightness: +brightness().toFixed(2) });
    S.studio.event("step_done", { step: lab.stepIdx + 1, id: lab.step.id, t: +lab.stepT.toFixed(1) });
  }
  function finish() {
    lab.stepIdx = steps.length; lab.step = null;
    const conducts = Object.keys(lab.tested).filter((k) => lab.tested[k] === "conducts").map((k) => MATERIALS[k].name);
    const blocks = Object.keys(lab.tested).filter((k) => lab.tested[k] === "blocks").map((k) => MATERIALS[k].name);
    lab.finalCard = { a: 0, conducts, blocks };
    tween(lab.finalCard, { a: 1 }, { dur: 0.5 });
    tween(lab.finalCard, { a: 0 }, { dur: 0.5, delay: 5.5 });
    setTask("", T.free, null);
    layoutTray(["wire", "bulb", "switch", "cell"]);
    S.studio.done({ steps: steps.length, tested: lab.tested });
  }

  /* ------------------------------------------------------------------ update */
  function update(dt) {
    solve();
    const b = brightness();
    lab.stepT += dt;
    lab.cuePulse += dt;
    if (lab.step && !lab.done && lab.stepT > 0.6 && checkStep()) completeStep();
    if (lab.step && lab.done && lab.stepT > 0) {
      lab.doneT = (lab.doneT || 0) + dt;
      if (lab.doneT > 2.6) { lab.doneT = 0; if (lab.stepIdx + 1 < steps.length) startStep(lab.stepIdx + 1); else finish(); }
    }
    if (lab.pendingTest) {
      lab.pendingTest.t -= dt;
      if (lab.pendingTest.t <= 0) {
        const id = lab.pendingTest.id; lab.pendingTest = null;
        const verdict = b > 0.03 ? "conducts" : "blocks";
        lab.tested[id] = verdict;
        S.studio.event("observe", { material: id, verdict, brightness: +b.toFixed(3) });
      }
    }
    // cells fighting (two cells opposed) and short circuits: say it plainly, as physics, never as a verdict
    const cells = edges.filter((e) => e.comp && e.comp.type === "cell");
    const shorted = cells.some((e) => Math.abs(e.I) > 1.6);
    lab.short = clamp(lab.short + (shorted ? dt * 1.5 : -dt * 2), 0, 1);
    const fighting = lab.step && lab.step.id === "bright" && cells.length >= 2 && b < 0.05 && cells.every((e) => Math.abs(e.I) < 0.01);
    const warn = shorted ? T.short : fighting ? (lab.step.hint || T.fight) : null;
    if (warn !== lab.warn) {
      lab.warn = warn;
      if (warn) setTask(lab.step ? `${lab.stepIdx + 1} ${T.stepOf} ${steps.length}` : "", warn, "warn");
      else if (lab.step && !lab.done) setTask(`${lab.stepIdx + 1} ${T.stepOf} ${steps.length}`, lab.sub === 2 ? lab.step.then[1] : lab.sub === 1 ? lab.step.then[0] : lab.step.goal);
    }
    // visual state
    for (const e of edges) {
      const target = Math.min(380, Math.abs(e.I) * 430);            // charge speed is proportional to the solved current
      e.speedVis = lerp(e.speedVis, target, 1 - Math.exp(-dt * 6));
      e.phase += Math.sign(e.I) * e.speedVis * dt;
      if (e.comp && e.comp.type === "bulb") e.comp.glow = lerp(e.comp.glow || 0, Math.min(2.2, (e.comp.P || 0) / PREF), 1 - Math.exp(-dt * 7));   // filament warm-up
    }
    fx.update(dt);
  }

  /* ------------------------------------------------------------------ render */
  const PANEL = { x: 222, y: 168, w: 762, h: 430 };
  let bgCache = null, bgKey = "";
  function background(ctx) {
    const key = st.canvas.width + "x" + st.canvas.height;
    if (key !== bgKey) {
      bgKey = key;
      bgCache = document.createElement("canvas");
      bgCache.width = st.canvas.width; bgCache.height = st.canvas.height;
      const g = bgCache.getContext("2d");
      g.setTransform(st.scale, 0, 0, st.scale, 0, 0);
      const bgG = g.createRadialGradient(600, 380, 50, 600, 380, 700);
      bgG.addColorStop(0, "#121725"); bgG.addColorStop(1, "#0A0C12");
      g.fillStyle = bgG; g.fillRect(0, 0, W, H);
      g.fillStyle = "#121621"; S.roundRect(g, PANEL.x, PANEL.y, PANEL.w, PANEL.h, 26); g.fill();
      g.strokeStyle = C.line2; g.lineWidth = 2; g.stroke();
      g.fillStyle = "rgba(255,255,255,.05)";
      for (let x = PANEL.x + 26; x < PANEL.x + PANEL.w - 10; x += 31) for (let y = PANEL.y + 26; y < PANEL.y + PANEL.h - 10; y += 31) g.fillRect(x - 1.5, y - 1.5, 3, 3);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(bgCache, 0, 0); ctx.restore();
  }
  function render(ctx, now) {
    background(ctx);
    ctx.save(); ctx.translate(fx.ox, fx.oy);
    // light pools (additive): the room lights up around a glowing bulb
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (const e of bulbs()) {
      const g = e.comp.glow; if (g < 0.02) continue;
      const r = 120 + 190 * Math.sqrt(Math.min(g, 2));
      ctx.globalAlpha = Math.min(0.55, 0.3 * g);
      ctx.drawImage(S.glow("#FFD58A", 128, 0.05), e.mx - r, e.my - r, r * 2, r * 2);
    }
    ctx.restore();
    // cue: dashed volt outline on the edge the step points at (implicit scaffold), only while it is empty
    if (lab.step && lab.step.cue && !lab.done && (!lab.step.cue.comp || lab.step.cue.comp.type === "tester" && !lab.step.cue.comp.material) && !lab.drag) {
      const e = lab.step.cue, a = 0.5 + 0.5 * Math.sin(lab.cuePulse * 4);
      ctx.save(); ctx.globalAlpha = 0.35 + 0.5 * a; ctx.strokeStyle = C.volt; ctx.lineWidth = 4; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -now * 30;
      if (e.horiz) S.roundRect(ctx, e.ax + 22, e.my - 34, e.len - 44, 68, 20); else S.roundRect(ctx, e.mx - 34, e.ay + 22, 68, e.len - 44, 20);
      ctx.stroke(); ctx.restore();
    }
    // hover target while dragging (the one volt element during a drag)
    if (lab.drag && lab.hoverEdge) {
      const e = lab.hoverEdge;
      ctx.save(); ctx.strokeStyle = C.volt; ctx.lineWidth = 5; ctx.globalAlpha = 0.9;
      if (e.horiz) S.roundRect(ctx, e.ax + 18, e.my - 38, e.len - 36, 76, 22); else S.roundRect(ctx, e.mx - 38, e.ay + 18, 76, e.len - 36, 22);
      ctx.stroke(); ctx.restore();
    }
    // empty edge guides
    ctx.strokeStyle = "rgba(255,255,255,.06)"; ctx.lineWidth = 3; ctx.setLineDash([4, 10]);
    for (const e of edges) if (!e.comp) { ctx.beginPath(); ctx.moveTo(e.ax, e.ay); ctx.lineTo(e.bx, e.by); ctx.stroke(); }
    ctx.setLineDash([]);
    // components
    for (const e of edges) if (e.comp) drawComp(ctx, e, e.comp, now);
    // moving charge (conventional current, + to - outside the cell), speed proportional to current
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const spr = S.glow(C.sci, 16);
    for (const e of edges) {
      if (!e.comp || e.speedVis < 2) continue;
      const sp = 30, n = Math.floor(e.len / sp), off = ((e.phase % sp) + sp) % sp;
      const a = Math.min(1, e.speedVis / 60);
      ctx.globalAlpha = 0.95 * a;
      for (let k = 0; k <= n; k++) {
        const d = k * sp + off; if (d > e.len) continue;
        const t = d / e.len;
        if (e.comp.type === "bulb" && t > 0.3 && t < 0.7) continue;     // hidden inside the glass
        if (e.comp.type === "cell" && t > 0.2 && t < 0.8) continue;     // hidden inside the cell body
        const x = lerp(e.ax, e.bx, t), y = lerp(e.ay, e.by, t);
        ctx.drawImage(spr, x - 9, y - 9, 18, 18);
      }
    }
    ctx.restore();
    // nodes
    for (let i = 0; i < N; i++) {
      const q = npos(i);
      ctx.fillStyle = "#2A3142"; ctx.beginPath(); ctx.arc(q.x, q.y, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#566079"; ctx.beginPath(); ctx.arc(q.x - 2, q.y - 2, 5, 0, Math.PI * 2); ctx.fill();
    }
    // meters
    for (const e of edges) if (e.meter) drawMeter(ctx, e);
    fx.drawWorld(ctx);
    ctx.restore();
    drawTray(ctx, now);
    if (lab.drag && lab.drag.id && (lab.drag.kind === "new" || lab.drag.lifted)) drawGhost(ctx, lab.drag);
    if (lab.finalCard && lab.finalCard.a > 0.01) drawFinal(ctx, lab.finalCard);
    fx.drawScreen(ctx);
  }

  function frame(ctx, e) {           // local frame: x along the edge, origin at the midpoint
    ctx.translate(e.mx, e.my);
    if (!e.horiz) ctx.rotate(Math.PI / 2);
  }
  function wireLine(ctx, x0, x1, I) {
    const k = Math.min(1, Math.abs(I) / 0.3);
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1B2030"; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
    ctx.strokeStyle = S.mix("#7A5B3E", "#FFC27A", k); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x1, 0); ctx.stroke();
  }
  function drawComp(ctx, e, c, now, icon) {
    const L = e.len / 2;
    ctx.save();
    frame(ctx, e);
    ctx.globalAlpha = c.a == null ? 1 : clamp(c.a, 0, 1);
    const sc = c.sc == null ? 1 : c.sc;
    if (c.type === "wire") {
      ctx.scale(1, sc);
      wireLine(ctx, -L, L, e.I);
    } else if (c.type === "bulb") {
      wireLine(ctx, -L, -40, e.I); wireLine(ctx, 40, L, e.I);
      ctx.scale(sc, sc);
      const g = c.glow || 0;
      if (g > 0.01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = Math.min(1, 0.25 + 0.5 * g); const r = 60 + 50 * Math.sqrt(Math.min(g, 2)); ctx.drawImage(S.glow("#FFE2A0", 96, 0.12), -r, -r, r * 2, r * 2); ctx.restore(); }
      // base (screw) at both sides, glass bulb
      ctx.fillStyle = "#59617A"; S.roundRect(ctx, -46, -13, 16, 26, 4); ctx.fill(); S.roundRect(ctx, 30, -13, 16, 26, 4); ctx.fill();
      const gl = ctx.createRadialGradient(-10, -12, 4, 0, 0, 40);
      gl.addColorStop(0, g > 0.05 ? `rgba(255,248,225,${0.35 + 0.5 * Math.min(1, g)})` : "rgba(220,230,255,.28)");
      gl.addColorStop(1, g > 0.05 ? `rgba(255,200,110,${0.18 + 0.3 * Math.min(1, g)})` : "rgba(140,160,210,.10)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 36, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(220,230,255,.55)"; ctx.lineWidth = 3; ctx.stroke();
      // filament
      ctx.strokeStyle = g > 0.05 ? S.mix("#C9763A", "#FFF6DA", Math.min(1, g)) : "#7C6A55"; ctx.lineWidth = g > 0.05 ? 4 : 3; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(-16, 0);
      for (let i = 0; i < 6; i++) ctx.lineTo(-14 + i * 5.6, i % 2 ? 9 : -9);
      ctx.lineTo(16, 0); ctx.lineTo(30, 0); ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.ellipse(-13, -17, 9, 5, -0.6, 0, Math.PI * 2); ctx.fill();
    } else if (c.type === "switch") {
      wireLine(ctx, -L, -34, e.I); wireLine(ctx, 34, L, e.I);
      ctx.scale(sc, sc);
      ctx.fillStyle = "#2A3142"; S.roundRect(ctx, -46, -20, 92, 40, 12); ctx.fill();
      ctx.fillStyle = "#8C95AE"; ctx.beginPath(); ctx.arc(-30, 0, 8, 0, Math.PI * 2); ctx.arc(30, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.translate(-30, 0); ctx.rotate(-(c.ang || 0) * 0.62);
      ctx.strokeStyle = c.closed ? "#D9DEEA" : "#A9B0C0"; ctx.lineWidth = 8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(62, 0); ctx.stroke();
      ctx.fillStyle = C.ink2; ctx.beginPath(); ctx.arc(66, 0, 7, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    } else if (c.type === "cell") {
      const dir = c.plus === e.b ? 1 : -1;               // +x end is node b
      const hot = Math.abs(e.I) > 1.6 ? lab.short : 0;
      wireLine(ctx, -L, -56, e.I); wireLine(ctx, 56, L, e.I);
      ctx.scale(sc, sc);
      if (c.flip != null && c.flip < 1) ctx.scale(Math.cos(c.flip * Math.PI), 1);
      if (hot > 0.01) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = hot * (0.6 + 0.4 * Math.sin(now * 18)); ctx.drawImage(S.glow(C.amber, 80, 0.1), -90, -60, 180, 120); ctx.restore(); }
      ctx.save(); ctx.scale(dir, 1);
      const body = ctx.createLinearGradient(0, -22, 0, 22);
      body.addColorStop(0, "#2B3550"); body.addColorStop(0.5, "#3B4870"); body.addColorStop(1, "#1C2337");
      ctx.fillStyle = body; S.roundRect(ctx, -50, -22, 96, 44, 8); ctx.fill();
      ctx.fillStyle = C.sci; ctx.fillRect(10, -22, 22, 44);               // band near the + end
      ctx.fillStyle = "#B9C1D6"; S.roundRect(ctx, 46, -9, 10, 18, 3); ctx.fill();   // + cap (metal nub)
      ctx.fillStyle = "#8C95AE"; ctx.fillRect(-56, -16, 6, 32);           // - flat base
      ctx.restore();
    } else if (c.type === "tester") {
      wireLine(ctx, -L, -38, e.I); wireLine(ctx, 38, L, e.I);
      ctx.fillStyle = "#6E7891";
      for (const s of [-1, 1]) { ctx.save(); ctx.translate(s * 40, 0); ctx.scale(s, 1); ctx.beginPath(); ctx.moveTo(-6, -12); ctx.lineTo(10, -8); ctx.lineTo(10, 8); ctx.lineTo(-6, 12); ctx.closePath(); ctx.fill(); ctx.restore(); }
      if (c.material) drawMaterial(ctx, c.material, c.matA == null ? 1 : c.matA);
      else { ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.setLineDash([5, 7]); ctx.lineWidth = 3; S.roundRect(ctx, -32, -26, 64, 52, 10); ctx.stroke(); ctx.setLineDash([]); }
    }
    ctx.restore();
    if (c.type === "cell" && !icon) drawCellSigns(ctx, e, c);
  }
  function drawCellSigns(ctx, e, c) {
    const plusAtB = c.plus === e.b;
    const pPlus = plusAtB ? { x: lerp(e.mx, e.bx, 0.62), y: lerp(e.my, e.by, 0.62) } : { x: lerp(e.mx, e.ax, 0.62), y: lerp(e.my, e.ay, 0.62) };
    const pMinus = plusAtB ? { x: lerp(e.mx, e.ax, 0.62), y: lerp(e.my, e.ay, 0.62) } : { x: lerp(e.mx, e.bx, 0.62), y: lerp(e.my, e.by, 0.62) };
    const ox = e.horiz ? 0 : -52, oy = e.horiz ? -48 : 0;
    S.text(ctx, "+", pPlus.x + ox, pPlus.y + oy, { font: "mono", size: 44, weight: 700, color: C.sci, align: "center", baseline: "middle" });
    S.text(ctx, "−", pMinus.x + ox, pMinus.y + oy, { font: "mono", size: 44, weight: 700, color: C.ink2, align: "center", baseline: "middle" });
  }
  function drawMaterial(ctx, id, a) {
    ctx.save(); ctx.scale(a, a);
    if (id === "coin") {
      const g = ctx.createRadialGradient(-8, -8, 4, 0, 0, 30); g.addColorStop(0, "#F3B37A"); g.addColorStop(1, "#A8602F");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = "rgba(255,230,200,.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke();
    } else if (id === "nail") {
      ctx.fillStyle = "#AEB6C6"; S.roundRect(ctx, -46, -6, 86, 12, 4); ctx.fill();
      ctx.fillStyle = "#D2D8E4"; S.roundRect(ctx, -52, -14, 10, 28, 3); ctx.fill();
      ctx.beginPath(); ctx.moveTo(40, -6); ctx.lineTo(52, 0); ctx.lineTo(40, 6); ctx.closePath(); ctx.fill();
    } else if (id === "pencil") {
      ctx.fillStyle = "#3E434F"; S.roundRect(ctx, -52, -4, 104, 8, 3); ctx.fill();           // graphite core touches both clips
      ctx.fillStyle = "#C98A3E"; ctx.beginPath(); ctx.moveTo(-36, -12); ctx.lineTo(36, -12); ctx.lineTo(44, 0); ctx.lineTo(36, 12); ctx.lineTo(-36, 12); ctx.lineTo(-44, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#E3B072"; ctx.fillRect(-36, -12, 72, 6);
      ctx.fillStyle = "#3E434F"; ctx.fillRect(-46, -3, 6, 6); ctx.fillRect(40, -3, 6, 6);
    } else if (id === "ruler") {
      ctx.fillStyle = "rgba(120,170,255,.45)"; S.roundRect(ctx, -54, -16, 108, 32, 5); ctx.fill();
      ctx.strokeStyle = "rgba(200,220,255,.7)"; ctx.lineWidth = 2; ctx.stroke();
      for (let i = -48; i <= 48; i += 8) { ctx.beginPath(); ctx.moveTo(i, -16); ctx.lineTo(i, i % 16 === 0 ? -6 : -10); ctx.stroke(); }
    } else if (id === "eraser") {
      ctx.fillStyle = "#E9ECF4"; S.roundRect(ctx, -40, -18, 80, 36, 8); ctx.fill();
      ctx.fillStyle = "#4A7BD8"; S.roundRect(ctx, -40, -18, 30, 36, 8); ctx.fill(); ctx.fillRect(-20, -18, 10, 36);
    } else if (id === "glass") {
      const g = ctx.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, "rgba(200,245,255,.75)"); g.addColorStop(1, "rgba(120,200,220,.35)");
      ctx.fillStyle = g; S.roundRect(ctx, -54, -11, 108, 22, 11); ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.fillRect(-46, -7, 70, 3);
    }
    ctx.restore();
  }
  function drawMeter(ctx, e) {
    const reading = Math.round(Math.abs(e.I) * 100);
    const w = 196, h = 64;
    const x = e.horiz ? e.mx - w / 2 : e.mx + 34, y = e.horiz ? e.my - h - 30 : e.my - h / 2;
    ctx.save();
    ctx.fillStyle = "rgba(16,19,27,.92)"; S.roundRect(ctx, x, y, w, h, 16); ctx.fill();
    ctx.strokeStyle = "rgba(47,211,199,.6)"; ctx.lineWidth = 2; ctx.stroke();
    // needle gauge
    const cx = x + 36, cy = y + 44, r = 22, k = Math.min(1, reading / 60);
    ctx.strokeStyle = C.line2; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.strokeStyle = C.sci; ctx.beginPath(); ctx.arc(cx, cy, r, Math.PI, Math.PI + Math.PI * k); ctx.stroke();
    const an = Math.PI + Math.PI * k; ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(an) * (r - 4), cy + Math.sin(an) * (r - 4)); ctx.stroke();
    S.text(ctx, `${reading}`, x + 128, y + h / 2 + 2, { font: "mono", size: 40, weight: 600, color: C.ink, align: "center", baseline: "middle" });
    // pin line to the wire
    ctx.strokeStyle = "rgba(47,211,199,.5)"; ctx.lineWidth = 2; ctx.setLineDash([3, 5]);
    ctx.beginPath(); if (e.horiz) { ctx.moveTo(e.mx, y + h); ctx.lineTo(e.mx, e.my - 10); } else { ctx.moveTo(x, e.my); ctx.lineTo(e.mx + 10, e.my); } ctx.stroke();
    ctx.restore();
  }
  function drawTray(ctx, now) {
    for (const t of lab.tray) {
      ctx.save();
      ctx.globalAlpha = t.a;
      ctx.translate(t.off, 0);
      const mat = MATERIALS[t.id];
      const tested = mat ? lab.tested[t.id] : null;
      ctx.fillStyle = "rgba(22,26,36,.92)"; S.roundRect(ctx, t.x, t.y, t.w, t.h, 18); ctx.fill();
      ctx.strokeStyle = tested === "conducts" ? "rgba(61,220,151,.6)" : C.line2; ctx.lineWidth = 2; ctx.stroke();
      const cy = t.y + t.h / 2;
      if (mat) {
        ctx.save(); ctx.translate(t.x + 36, cy); ctx.scale(0.4, 0.4); drawMaterial(ctx, t.id, 1); ctx.restore();
        S.text(ctx, mat.name, t.x + 66, cy + 2, { font: "display", size: 38, weight: 600, color: tested ? C.ink2 : C.ink, baseline: "middle" });
        if (tested) {                      // verdict badge on the icon: tick = let current through, ring = blocked it
          const bx = t.x + 50, by = cy + 18;
          ctx.fillStyle = "#161A24"; ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fill();
          if (tested === "conducts") { ctx.strokeStyle = C.mint; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(bx - 6, by); ctx.lineTo(bx - 1.5, by + 5); ctx.lineTo(bx + 7, by - 5); ctx.stroke(); }
          else { ctx.strokeStyle = C.ink3; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(bx, by, 7, 0, Math.PI * 2); ctx.stroke(); }
        }
      } else {
        ctx.save(); ctx.translate(t.x + t.w / 2, t.y + 36); ctx.scale(0.6, 0.6); drawToolIcon(ctx, t.id); ctx.restore();
        S.text(ctx, TOOLS[t.id], t.x + t.w / 2, t.y + t.h - 22, { font: "display", size: 38, weight: 600, color: C.ink, align: "center", baseline: "middle" });
      }
      ctx.restore();
    }
  }
  const ICON_EDGE = { a: 0, b: 1, ax: -75, bx: 75, ay: 0, by: 0, mx: 0, my: 0, len: 150, horiz: true, I: 0 };
  function drawToolIcon(ctx, id) {
    if (id === "meter") {
      ctx.strokeStyle = C.sci; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 14, 34, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(20, -12); ctx.stroke();
      return;
    }
    if (id === "wire") { wireLine(ctx, -65, 65, 0); return; }
    drawComp(ctx, ICON_EDGE, { type: id, a: 1, sc: 1, closed: true, ang: 0, glow: 0, plus: 1 }, 0, true);
  }
  function drawGhost(ctx, d) {
    const he = lab.hoverEdge;
    const id = d.id;
    ctx.save();
    ctx.globalAlpha = 0.9;
    if (MATERIALS[id]) { ctx.translate(he ? he.mx : d.x, he ? he.my : d.y); if (he && !he.horiz) ctx.rotate(Math.PI / 2); drawMaterial(ctx, id, 1); ctx.restore(); return; }
    if (id === "meter") { ctx.translate(d.x, d.y); drawToolIcon(ctx, "meter"); ctx.restore(); return; }
    if (he) {
      const c = { type: id, a: 0.8, sc: 1, closed: true, ang: 0, glow: 0, plus: id === "cell" ? (d.carry ? (d.carry.plus === d.e.a ? he.a : he.b) : he.b) : 0 };
      drawComp(ctx, Object.assign({}, he, { I: 0 }), c, 0);
    } else {
      ctx.translate(d.x, d.y);
      drawToolIcon(ctx, id);
    }
    ctx.restore();
  }
  function drawFinal(ctx, f) {
    ctx.save(); ctx.globalAlpha = f.a;
    ctx.fillStyle = "rgba(10,12,18,.6)"; ctx.fillRect(0, 0, W, H);
    const x = 190, y = 150, w = 640, h = 340;
    ctx.fillStyle = "rgba(22,26,36,.95)"; S.roundRect(ctx, x, y + (1 - f.a) * 16, w, h, 28); ctx.fill();
    ctx.strokeStyle = C.line2; ctx.lineWidth = 2; ctx.stroke();
    S.text(ctx, T.labDone.toUpperCase(), 500, y + 66, { font: "mono", size: 38, weight: 600, color: C.mint, align: "center", track: 4 });
    S.text(ctx, `${T.conducts}:`, x + 50, y + 150, { font: "mono", size: 38, weight: 500, color: C.ink3 });
    S.text(ctx, f.conducts.join(", ") || "—", x + 50, y + 200, { font: "ui", size: 40, weight: 600, color: C.ink });
    S.text(ctx, `${T.blocks}:`, x + 50, y + 260, { font: "mono", size: 38, weight: 500, color: C.ink3 });
    S.text(ctx, f.blocks.join(", ") || "—", x + 50, y + 310, { font: "ui", size: 40, weight: 600, color: C.ink });
    ctx.restore();
  }

  /* ------------------------------------------------------------------ test seam: live state + the next demo action */
  const trayPos = (id) => { const t = lab.tray.find((x) => x.id === id); return t ? [t.x + t.w / 2, t.y + t.h / 2] : null; };
  const mid = (spec) => { const e = edgeAt(spec); return e ? [e.mx, e.my] : null; };
  function nextAction() {
    if (!lab.step || lab.done || lab.drag) return null;
    const id = lab.step.id;
    if (id === "close") return { type: "drag", from: trayPos("wire"), to: lab.step.cue ? [lab.step.cue.mx, lab.step.cue.my] : mid("1,1-2,1"), after: 900 };
    if (id === "same") { const n = edges.filter((e) => e.meter).length; return { type: "drag", from: trayPos("meter"), to: n === 0 ? mid("0,0-1,0") : mid("2,0-3,0"), after: 1300 }; }
    if (id === "switch") {
      const sw = edges.find((e) => e.comp && e.comp.type === "switch");
      if (!sw) return { type: "drag", from: trayPos("switch"), to: mid("3,0-3,1"), after: 1400 };
      return { type: "tap", at: [sw.mx, sw.my], after: 1800 };
    }
    if (id === "test") {
      const order = ["coin", "ruler", "pencil", "eraser", "nail", "glass"].filter((m) => !lab.tested[m] && lab.tray.some((t) => t.id === m));
      if (!order.length || lab.pendingTest) return { type: "wait", ms: 400 };
      const tester = edges.find((e) => e.comp && e.comp.type === "tester");
      return { type: "drag", from: trayPos(order[0]), to: [tester.mx, tester.my], after: 1500 };
    }
    if (id === "bright") {
      const cells = edges.filter((e) => e.comp && e.comp.type === "cell");
      if (cells.length < 2) return { type: "drag", from: trayPos("cell"), to: mid("0,1-1,1"), after: 1700 };
      const fresh = cells.find((e) => !e.comp.locked);
      return { type: "tap", at: [fresh.mx, fresh.my], after: 1800 };
    }
    return null;
  }
  S.studio.seam = () => ({
    ready: lab.stepIdx >= 0, state: lab.stepIdx >= steps.length ? "final" : "step", step: lab.step ? lab.step.id : null, done: lab.done,
    brightness: +brightness().toFixed(3), tested: lab.tested,
    edges: edges.filter((e) => e.comp).map((e) => ({ key: e.key, type: e.comp.type, I: +e.I.toFixed(4), plus: e.comp.plus, meter: e.meter })),
    next: nextAction(), repairs,
  });

  S.fontsReady().then(() => {
    startStep(0);
    S.loop(st, update, render);
    S.studio.ready();
  });
})();
