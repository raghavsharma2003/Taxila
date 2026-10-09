/* ============================================================
   5 · WORLD — the valley at night. Each chapter of Ganita Prakash (class 6) is a mesa; each topic a pavilion.
   A pavilion's stage is a pure view of the learner ledger: chalk plan (not yet) → scaffold (working on it)
   → lit scaffold (got it) → carved stone with a lamp (secure: right again on a later day, new form, no help).
   Light is the only reward. Nothing fades, nothing is timed, nothing is locked. Paths only on real prerequisites.
   ============================================================ */
const STATES = { 1: [4, 4, 3, 4], 2: [4, 4, 3, 2], 3: [4, 3, 1, 4], 4: [4, 4, 3], 5: [4, 3, 1, 2, 1], 6: [1, 1, 1], 7: [1, 1, 1, 1, 1], 8: [1, 1, 1], 9: [1, 1], 10: [1, 1, 1] };
const EVID = {
  "5-t01": "Mon 5 Oct, on your own: common factors of 12 and 18 → <q>1, 2, 3, 6</q>. Again on Thu 8 Oct with 20 and 30, no hint.",
  "5-t02": "Wed 7 Oct, in your words: <q>1 sirf ek hi number se divide hota hai, isliye prime nahi.</q> Asha checks again on another day.",
  "5-t04": "Working on it today. Turns to stone when you break a new number on another day, without help.",
  "5-t04-lit": "Today: <q>2 × 2 × 3 × 3</q> for 36 on your second try, and 72 broken down to primes in the stone yard. It turns to stone when you break a new number on another day, without help.",
};
const STATE_WORD = { 1: "Not yet", 2: "Working on it", 3: "Got it", 4: "Secure" };
const Progress = { litToday: false };

function stateOf(ch, i) { let s = STATES[ch][i]; if (ch === 5 && i === 3 && Progress.litToday) s = 3; return s; }

Screens.map = {
  build() {
    const el = html(`<section class="screen" id="s-map" aria-label="World map">
      <div class="mp">
        <div class="scene" id="mSky"></div>
        <div class="mp-view" id="mView"></div>
        <div class="mp-list" id="mList"></div>
        <div class="mp-hud">
          <button class="iconbtn" id="mBack" aria-label="Home" style="background:rgba(14,12,30,.6);box-shadow:inset 0 0 0 1px var(--hair-2)">${ICON.back}</button>
          <div class="ttl"><b>Your valley</b><span>Class 6 · Mathematics</span></div>
          <div class="seg" role="group" aria-label="View"><button aria-pressed="true" id="mMapB" aria-label="Map">${ICON.map}<span class="lbl">Map</span></button><button aria-pressed="false" id="mListB" aria-label="List">${ICON.list}<span class="lbl">List</span></button></div>
        </div>
        <button class="chipbtn mp-here" id="mHere">${ICON.locate}<span>Your class</span></button>
        <div class="mp-legend panel solid" aria-label="What the pavilions mean">${[1, 2, 3, 4].map((s) => `<div class="lg">${stateGlyph(s)}<span>${STATE_WORD[s]}</span></div>`).join("")}</div>
        <div class="mp-sheet panel solid" id="mSheet" role="dialog" aria-label="Chapter"><div class="grab"></div><div id="mSheetIn"></div></div>
      </div>
      <div class="placename"></div>
    </section>`);
    $("#tx").appendChild(el);
    this.el = el; this.view = $("#mView", el);
    $("#mBack", el).onclick = () => go("home", { back: true });
    $("#mHere", el).onclick = () => { Sfx.tock(); this.center(5, true); };
    $("#mMapB", el).onclick = () => this.mode("map");
    $("#mListB", el).onclick = () => this.mode("list");
    this.pan = { x: 0, y: 0, vx: 0, vy: 0 };
    this.bindPan();
    this.ro = new ResizeObserver(() => { if (CUR === "map") this.render(); }); this.ro.observe(el);
  },
  enter(o = {}) {
    if (o.focus === 5 || Screens.game.finished || Screens.lesson.done) Progress.litToday = true;
    this.render();
    this.center(5, false);
    placeName(this.el, "Class 6 · Mathematics", "The Valley");
    $("#mSheet", this.el).classList.remove("open");
    if (Progress.litToday && !this.celebrated) { this.celebrated = true; setTimeout(() => { if (CUR === "map") { this.pulse(5, 3); this.open(5); } }, RM ? 200 : 1300); }
  },
  mode(m) {
    $("#mMapB", this.el).setAttribute("aria-pressed", String(m === "map")); $("#mListB", this.el).setAttribute("aria-pressed", String(m === "list"));
    $("#mList", this.el).classList.toggle("on", m === "list");
    $("#mSheet", this.el).classList.remove("open");
    if (m === "list") this.renderList();
  },
  layout() {
    const wide = this.el.clientWidth >= 900;
    this.s = wide ? 30 : 26;
    this.pos = wide
      ? { 1: [-360, 560], 2: [-40, 520], 3: [300, 480], 4: [-260, 340], 5: [60, 300], 6: [380, 250], 7: [-170, 110], 8: [150, 70], 9: [450, 20], 10: [-60, -120] }
      : { 1: [-80, 1160], 2: [95, 1040], 3: [-95, 900], 4: [90, 780], 5: [-90, 640], 6: [95, 520], 7: [-90, 380], 8: [90, 260], 9: [-90, 120], 10: [90, 0] };
    this.wide = wide;
  },
  P(x, y, z) { const s = this.s; return [(x - y) * s * 0.866, (x + y) * s * 0.5 - z * s]; },
  poly(pts, fill, extra = "") { return `<path d="M${pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L")} Z" fill="${fill}" ${extra}/>`; },
  box(x, y, z, w, d, h, top, left, right, extra = "") {
    const P = (a, b, c) => this.P(a, b, c);
    return this.poly([P(x, y + d, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x, y + d, z)], left, extra)
      + this.poly([P(x + w, y, z + h), P(x + w, y + d, z + h), P(x + w, y + d, z), P(x + w, y, z)], right, extra)
      + this.poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top, extra);
  },
  pavilion(px, py, z, st, key) {
    const s = this.s * 1.18, P = (a, b, c) => { const q = this.P(px + (a - px) * 1.18, py + (b - py) * 1.18, z + (c - z) * 1.18); return q; };
    const box = (x, y, zz, w, d, h, t, l, r) => { const P0 = (a, b, c) => P(a, b, c); return this.poly([P0(x, y + d, zz + h), P0(x + w, y + d, zz + h), P0(x + w, y + d, zz), P0(x, y + d, zz)], l) + this.poly([P0(x + w, y, zz + h), P0(x + w, y + d, zz + h), P0(x + w, y + d, zz), P0(x + w, y, zz)], r) + this.poly([P0(x, y, zz + h), P0(x + w, y, zz + h), P0(x + w, y + d, zz + h), P0(x, y + d, zz + h)], t); };
    let g = "";
    const [cx, cy] = P(px, py, z);
    if (st === 1) { // chalk plan on the ground
      const q = [P(px - 0.45, py - 0.45, z), P(px + 0.45, py - 0.45, z), P(px + 0.45, py + 0.45, z), P(px - 0.45, py + 0.45, z)];
      g += this.poly(q, "rgba(159,182,232,.06)", 'stroke="#9FB6E8" stroke-width="1.3" stroke-dasharray="3 3" opacity=".8"');
      const [dx, dy] = P(px, py, z + 0.86), rx = 0.42 * s * 1.2247, h = 0.55 * s;
      g += `<path d="M${dx - rx},${dy} C${dx - rx},${dy - h * .7} ${dx - rx * .3},${dy - h} ${dx},${dy - h} C${dx + rx * .3},${dy - h} ${dx + rx},${dy - h * .7} ${dx + rx},${dy} M${dx - rx},${dy} L${dx - rx},${dy + 0.86 * s} M${dx + rx},${dy} L${dx + rx},${dy + 0.86 * s}" fill="none" stroke="#9FB6E8" stroke-width="1.1" stroke-dasharray="2 4" opacity=".5"/>`;
      return `<g data-k="${key}">${g}</g>`;
    }
    const lit = st >= 3;
    const stoneT = lit ? "#B9A7D6" : "#8F8CC6", stoneL = lit ? "#8C7FB8" : "#6A6AA6", stoneR = "#3E3F78";
    if (lit) { const [gx, gy] = P(px, py, z + 0.42); g += `<circle cx="${gx}" cy="${gy}" r="${(st === 4 ? 1.25 : 0.95) * s}" fill="url(#mLamp)"/>`; }
    g += box(px - 0.45, py - 0.45, z, 0.9, 0.9, 0.16, stoneT, stoneL, stoneR);
    const pil = [[-0.34, -0.34], [0.22, -0.34], [-0.34, 0.22], [0.22, 0.22]];
    if (lit) { const [lx, ly] = P(px, py, z + 0.42); g += `<circle cx="${lx}" cy="${ly}" r="${0.2 * s}" fill="#FFE2A1"/><circle cx="${lx}" cy="${ly}" r="${0.42 * s}" fill="#FFC24D" opacity=".35"/>`; }
    pil.forEach(([u, v]) => (g += box(px + u, py + v, z + 0.16, 0.12, 0.12, 0.62, stoneT, stoneL, stoneR)));
    if (st >= 3) {
      g += box(px - 0.52, py - 0.52, z + 0.78, 1.04, 1.04, 0.1, stoneT, stoneL, stoneR);
      const [dx, dy] = P(px, py, z + 0.88), rx = 0.42 * s * 1.2247, ry = 0.42 * s * 0.707, h = 0.6 * s;
      g += `<path d="M${dx - rx},${dy} A${rx},${ry} 0 0 0 ${dx + rx},${dy} C${dx + rx},${dy - h * .65} ${dx + rx * .35},${dy - h} ${dx},${dy - h} C${dx - rx * .35},${dy - h} ${dx - rx},${dy - h * .65} ${dx - rx},${dy} Z" fill="url(#mDome)"/>`;
      g += `<path d="M${dx},${dy - h} L${dx},${dy - h - 0.28 * s}" stroke="${st === 4 ? "#FFC24D" : "#C9B98F"}" stroke-width="1.6"/><circle cx="${dx}" cy="${dy - h - 0.3 * s}" r="${st === 4 ? 2.6 : 1.8}" fill="${st === 4 ? "#FFD27A" : "#C9B98F"}"/>`;
    }
    if (st === 2 || st === 3) { // bamboo scaffold
      const c = [[-0.58, -0.58], [0.58, -0.58], [0.58, 0.58], [-0.58, 0.58]].map(([u, v]) => [px + u, py + v]);
      let d = "";
      c.forEach(([a, b]) => { const p0 = P(a, b, z), p1 = P(a, b, z + 1.3); d += `M${p0[0]},${p0[1]} L${p1[0]},${p1[1]} `; });
      [0.5, 1.05].forEach((hz) => { const q = c.map(([a, b]) => P(a, b, z + hz)); d += `M${q[0][0]},${q[0][1]} L${q[1][0]},${q[1][1]} L${q[2][0]},${q[2][1]} M${q[0][0]},${q[0][1]} L${q[3][0]},${q[3][1]} L${q[2][0]},${q[2][1]} `; });
      g += `<path d="${d}" stroke="#D2A86A" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".9"/>`;
    }
    return `<g data-k="${key}">${g}</g>`;
  },
  signature(n, cx, cy, zt, h) {
    const P = (a, b, c) => this.P(a, b, c), s = this.s, T = "#7E82C4", L = "#5A5E9E", R = "#2E3168";
    const ex = cx + h - 0.55, ey = cy + h - 0.55;   // the front corner of the mesa top
    if (n === 2) { // Samrat Yantra: the great sundial's gnomon, a right-triangle wall
      const a = P(ex - 0.15, ey - 0.9, zt), b = P(ex - 0.15, ey + 0.35, zt), c = P(ex - 0.15, ey - 0.9, zt + 1.5), a2 = P(ex + 0.1, ey - 0.9, zt), b2 = P(ex + 0.1, ey + 0.35, zt), c2 = P(ex + 0.1, ey - 0.9, zt + 1.5);
      return `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]} L${c[0]},${c[1]} Z" fill="${L}"/><path d="M${b[0]},${b[1]} L${b2[0]},${b2[1]} L${c2[0]},${c2[1]} L${c[0]},${c[1]} Z" fill="${T}"/><path d="M${c[0]},${c[1]} L${b[0]},${b[1]}" stroke="#B9BDF2" stroke-width="1" opacity=".7"/>`;
    }
    if (n === 4) { let g = ""; [0.5, 0.95, 0.7, 1.25].forEach((hh, i) => (g += this.box(ex - 0.95 + i * 0.32, ey - 0.15, zt, 0.22, 0.22, hh, T, L, R))); return g; } // data: columns like bars
    if (n === 7) { // the chariot wheel (Konark): a standing disc with spokes
      const c0 = P(ex - 0.3, ey, zt + 0.62), r = 0.6 * s; let d = `<ellipse cx="${c0[0]}" cy="${c0[1]}" rx="${r * 0.62}" ry="${r}" fill="none" stroke="${T}" stroke-width="3"/>`;
      for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2; d += `<path d="M${c0[0]},${c0[1]} L${c0[0] + Math.cos(t) * r * 0.62},${c0[1] + Math.sin(t) * r}" stroke="${L}" stroke-width="1.4"/>`; }
      return d + `<circle cx="${c0[0]}" cy="${c0[1]}" r="3" fill="${T}"/>`;
    }
    if (n === 10) { // a stepwell cut below the terrace: the other side of zero
      let g = ""; for (let k = 0; k < 4; k++) { const w = 1.3 - k * 0.28, x0 = ex - 0.6 - w / 2, y0 = ey - 0.6 - w / 2; g += this.poly([P(x0, y0, zt - k * 0.12), P(x0 + w, y0, zt - k * 0.12), P(x0 + w, y0 + w, zt - k * 0.12), P(x0, y0 + w, zt - k * 0.12)], k % 2 ? "#2A2C5E" : "#363A74"); } return g;
    }
    if (n === 9) { let g = ""; for (const dx of [-0.75, 0.15]) g += this.box(ex + dx - 0.2, ey - 0.2, zt, 0.4, 0.4, 0.7, T, L, R); return g; } // symmetry: twin towers
    if (n === 8) { const c0 = P(ex - 0.5, ey - 0.5, zt); return `<ellipse cx="${c0[0]}" cy="${c0[1]}" rx="${0.8 * s * 1.22}" ry="${0.8 * s * 0.7}" fill="none" stroke="${T}" stroke-width="1.6"/><path d="M${c0[0]},${c0[1]} L${c0[0] + 0.8 * s * 1.0},${c0[1] - 0.35 * s}" stroke="${T}" stroke-width="1.6"/>`; } // constructions: a circle drawn with a compass
    return "";
  },
  render() {
    this.layout();
    const s = this.s, P = (a, b, c) => this.P(a, b, c), h = 1.7;
    // the sky stays still (a far layer); the valley pans
    $("#mSky", this.el).innerHTML = `<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
      <linearGradient id="mS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#090B24"/><stop offset=".55" stop-color="#151840"/><stop offset="1" stop-color="#2A2458"/></linearGradient>
      <radialGradient id="mMoon" cx="960" cy="130" r="260" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#C9CCFF" stop-opacity=".35"/><stop offset="1" stop-color="#C9CCFF" stop-opacity="0"/></radialGradient></defs>
      <rect width="1200" height="800" fill="url(#mS)"/><rect width="1200" height="800" fill="url(#mMoon)"/>${stars(rng(41), 140, 0, 1200, 0, 640, 1.3)}
      <circle cx="960" cy="130" r="30" fill="#F2F0FF"/><circle cx="972" cy="122" r="27" fill="#141739" opacity=".18"/>
      <path d="${ridge(rng(3), -40, 1240, 700, 26, 800)}" fill="#1B1C49"/></svg>`;
    // world
    const C = CURR.map((ch) => { const [X, Y] = this.pos[ch.n], zt = this.wide ? 0 : (10 - ch.n) * 0.0; const sum = (Y + zt * s) / (0.5 * s), dif = X / (0.866 * s); return { ...ch, cx: (sum + dif) / 2, cy: (sum - dif) / 2, zt, X, Y }; });
    this.C = C;
    const order = C.slice().sort((a, b) => a.Y - b.Y);
    const decor = (this.wide ? [[-620, 380], [700, 420], [-560, -60], [720, 40], [-700, 700], [760, 650]] : [[-250, 1060], [250, 860], [-250, 560], [255, 300], [-250, 30], [250, 1240]]).map(([X, Y]) => ({ X, Y }));
    let w = `<defs>
      <radialGradient id="mLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFC874" stop-opacity=".75"/><stop offset=".45" stop-color="#FFA94A" stop-opacity=".22"/><stop offset="1" stop-color="#FF9C40" stop-opacity="0"/></radialGradient>
      <linearGradient id="mDome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#D9CCF2"/><stop offset=".45" stop-color="#8F84C2"/><stop offset="1" stop-color="#40407A"/></linearGradient>
      <linearGradient id="mMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8F96E0" stop-opacity="0"/><stop offset=".55" stop-color="#8F96E0" stop-opacity=".22"/><stop offset="1" stop-color="#8F96E0" stop-opacity="0"/></linearGradient>
      <radialGradient id="mPool" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFB45E" stop-opacity=".55"/><stop offset=".6" stop-color="#E8894A" stop-opacity=".16"/><stop offset="1" stop-color="#E8894A" stop-opacity="0"/></radialGradient>
      <linearGradient id="mFaceL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3B3F7C"/><stop offset="1" stop-color="#1A1C46"/></linearGradient>
      <linearGradient id="mFaceR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#23265A"/><stop offset="1" stop-color="#121432"/></linearGradient></defs>`;
    decor.forEach(({ X, Y }) => { const hh = 1.1; const sum = Y / (0.5 * s), dif = X / (0.866 * s), cx = (sum + dif) / 2, cy = (sum - dif) / 2;
      w += `<g opacity=".55">${this.box(cx - hh, cy - hh, -9, hh * 2, hh * 2, 9, "#2E3170", "#22245A", "#16183E")}</g>`; });
    for (const ch of order) {
      const { cx, cy, zt } = ch;
      const zb = zt - 9;
      let g = "";
      g += this.poly([P(cx - h, cy + h, zt), P(cx + h, cy + h, zt), P(cx + h, cy + h, zb), P(cx - h, cy + h, zb)], "url(#mFaceL)");
      g += this.poly([P(cx + h, cy - h, zt), P(cx + h, cy + h, zt), P(cx + h, cy + h, zb), P(cx + h, cy - h, zb)], "url(#mFaceR)");
      for (let k = 1; k < 7; k++) { const z = zt - k * 0.9 - (k % 2) * 0.2; const a = P(cx - h, cy + h, z), b = P(cx + h, cy + h, z), c = P(cx + h, cy - h, z); g += `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]} L${c[0]},${c[1]}" stroke="#8E93D6" stroke-opacity="${(0.12 - k * 0.012).toFixed(3)}" stroke-width="1" fill="none"/>`; }
      g += this.poly([P(cx - h, cy - h, zt), P(cx + h, cy - h, zt), P(cx + h, cy + h, zt), P(cx - h, cy + h, zt)], "#4A4E8C");
      g += this.poly([P(cx - h + 0.2, cy - h + 0.2, zt), P(cx + h - 0.2, cy - h + 0.2, zt), P(cx + h - 0.2, cy + h - 0.2, zt), P(cx - h + 0.2, cy + h - 0.2, zt)], "#55599A");
      const e1 = P(cx - h, cy + h, zt), e2 = P(cx - h, cy - h, zt), e3 = P(cx + h, cy - h, zt);
      g += `<path d="M${e1[0]},${e1[1]} L${e2[0]},${e2[1]} L${e3[0]},${e3[1]}" stroke="#A9AEEA" stroke-width="1.2" fill="none" opacity=".6"/>`;
      // topic pavilions, with walkways only along real prerequisite edges
      const n = ch.topics.length;
      const spots = n >= 5 ? [[-0.95, -0.95], [0, -0.1], [0.95, -0.95], [-0.95, 0.95], [0.95, 0.95]] : n === 4 ? [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]] : n === 3 ? [[-0.85, -0.85], [0.85, -0.6], [-0.4, 0.9]] : [[-0.7, -0.4], [0.7, 0.5]];
      const at = {}; ch.topics.forEach((t, i) => (at[t.id] = [cx + spots[i][0], cy + spots[i][1]]));
      ch.topics.forEach((t) => t.pre.forEach((p) => { const pid = p.split("-").slice(-1)[0]; if (p.startsWith(`c6-maths-ch${String(ch.n).padStart(2, "0")}`) && at[pid]) { const a = P(...at[pid], zt), b = P(...at[t.id], zt); g += `<path d="M${a[0]},${a[1]} L${b[0]},${b[1]}" stroke="#6C70B4" stroke-width="5" stroke-linecap="round"/><path d="M${a[0]},${a[1]} L${b[0]},${b[1]}" stroke="#9EA3E6" stroke-width="1" stroke-linecap="round" opacity=".7"/>`; } }));
      const tops = ch.topics.map((t, i) => ({ t, i, p: at[t.id] })).sort((a, b) => a.p[0] + a.p[1] - (b.p[0] + b.p[1]));
      tops.forEach(({ i, p }) => { const st = stateOf(ch.n, i); if (st < 3) return; const c = P(p[0], p[1], zt); g += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="${(st === 4 ? 1.5 : 1.15) * s * 1.22}" ry="${(st === 4 ? 1.5 : 1.15) * s * 0.7}" fill="url(#mPool)"/>`; });
      tops.forEach(({ t, i, p }) => (g += this.pavilion(p[0], p[1], zt, stateOf(ch.n, i), `${ch.n}-${t.id}`)));
      g += this.signature(ch.n, cx, cy, zt, h);
      // label and the hit area
      const top = P(cx - h, cy - h, zt), L = P(cx - h, cy + h, zt), R = P(cx + h, cy - h, zt), B = P(cx + h, cy + h, zt);
      const lit = ch.topics.filter((_, i) => stateOf(ch.n, i) >= 3).length;
      const anc = this.wide ? "middle" : ch.X > 0 ? "end" : "start", lx = this.wide ? top[0] : top[0] + (ch.X > 0 ? 64 : -64);
      g += `<text x="${lx}" y="${top[1] - 24}" text-anchor="${anc}" font-family="Eczar, Georgia, serif" font-weight="700" font-size="16" fill="#F7F0E6" stroke="#0B0D27" stroke-width="4" paint-order="stroke" letter-spacing=".02em">${ch.n} · ${ch.t}</text>`;
      if (ch.n === 5) { const pole = P(cx + h - 0.15, cy - h + 0.15, zt); g += `<path d="M${pole[0]},${pole[1]} L${pole[0]},${pole[1] - 2.4 * s}" stroke="#E9C27A" stroke-width="2"/><path d="M${pole[0]},${pole[1] - 2.4 * s} l${0.9 * s},${0.3 * s} l${-0.9 * s},${0.3 * s} z" fill="#FFC24D"/>
        <g transform="translate(${this.wide ? top[0] - 64 : lx + (ch.X > 0 ? -128 : 0)} ${top[1] - 60})"><rect x="0" y="-13" width="128" height="24" fill="#FFC24D"/><text x="8" y="4" font-family="Mukta, sans-serif" font-weight="700" font-size="14" fill="#2A1607">Your class is here</text></g>`; }
      const hit = [P(cx - h, cy - h, zt + 2), R, P(cx + h, cy + h, zb + 4), P(cx - h, cy + h, zb + 4), L];
      w += `<g class="mesa" data-ch="${ch.n}">${g}<path class="hit" d="M${[top, R, B, P(cx + h, cy + h, zt - 3), P(cx - h, cy + h, zt - 3), L].map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" L")} Z" transform="translate(0 -14)" fill="transparent" role="button" tabindex="0" aria-label="Chapter ${ch.n}, ${ch.t}: ${lit} of ${ch.topics.length} ideas lit"/></g>`;
      const mb = P(cx, cy, zt - 6.2);
      w += `<rect x="${mb[0] - 1400}" y="${mb[1] - 60}" width="2800" height="140" fill="url(#mMist)" pointer-events="none"/>`;
    }
    w += `<g id="mThreads"></g>`;
    // world bounds
    const xs = C.map((c) => c.X), ys = C.map((c) => c.Y);
    this.bounds = { x0: Math.min(...xs) - 200, x1: Math.max(...xs) + 200, y0: Math.min(...ys) - 150, y1: Math.max(...ys) + 260 };
    const W = this.bounds.x1 - this.bounds.x0, H = this.bounds.y1 - this.bounds.y0;
    this.view.innerHTML = `<svg id="mWorld" width="${W}" height="${H}" viewBox="${this.bounds.x0} ${this.bounds.y0} ${W} ${H}" style="will-change:transform">${w}</svg>`;
    this.svg = $("#mWorld", this.el);
    $$(".mesa", this.svg).forEach((m) => { const hit = $(".hit", m); const f = () => { Sfx.ensure(); Sfx.tock(); this.open(+m.dataset.ch); }; hit.addEventListener("click", (e) => { if (this.dragged) return; f(); }); hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); f(); } }); });
    this.apply();
  },
  center(n, anim) {
    const c = this.C.find((x) => x.n === n); if (!c) return;
    const vw = this.view.clientWidth, vh = this.view.clientHeight;
    const sheetW = this.wide ? 440 : 0;
    const open = $("#mSheet", this.el).classList.contains("open");
    const tx = -((this.wide ? c.X : 0) - this.bounds.x0) + (vw - (open ? sheetW : 0)) / 2, ty = -(c.Y - this.bounds.y0) + vh * (this.wide ? 0.5 : open ? 0.24 : 0.42);
    if (anim && !RM) { const fx = this.pan.x, fy = this.pan.y, t0 = performance.now(); const f = (now) => { const k = Math.min(1, (now - t0) / 700), e = 1 - Math.pow(1 - k, 3); this.pan.x = lerp(fx, tx, e); this.pan.y = lerp(fy, ty, e); this.apply(); if (k < 1) requestAnimationFrame(f); }; requestAnimationFrame(f); }
    else { this.pan.x = tx; this.pan.y = ty; this.apply(); }
  },
  apply() {
    if (!this.svg) return;
    const vw = this.view.clientWidth, vh = this.view.clientHeight, W = +this.svg.getAttribute("width"), H = +this.svg.getAttribute("height");
    this.pan.x = clamp(this.pan.x, Math.min(0, vw - W) - 40, 40); this.pan.y = clamp(this.pan.y, Math.min(0, vh - H) - 60, 60);
    this.svg.style.transform = `translate3d(${this.pan.x.toFixed(1)}px, ${this.pan.y.toFixed(1)}px, 0)`;
    const sky = $("#mSky svg", this.el); if (sky && !RM) sky.style.transform = `translateY(${(this.pan.y * 0.04).toFixed(1)}px) scale(1.06)`;
  },
  bindPan() {
    const v = this.view; let down = null, last = null, raf = 0;
    v.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY, px: this.pan.x, py: this.pan.y, t: performance.now() }; last = { x: e.clientX, y: e.clientY, t: performance.now() }; this.dragged = false; this.pan.vx = this.pan.vy = 0; cancelAnimationFrame(raf); });
    v.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.abs(dx) + Math.abs(dy) > 6) { this.dragged = true; v.setPointerCapture?.(e.pointerId); }
      if (this.dragged) { const now = performance.now(), dt = Math.max(1, now - last.t); this.pan.vx = (e.clientX - last.x) / dt; this.pan.vy = (e.clientY - last.y) / dt; last = { x: e.clientX, y: e.clientY, t: now }; this.pan.x = down.px + dx; this.pan.y = down.py + dy; this.apply(); } });
    const up = () => { if (!down) return; down = null; if (this.dragged && !RM) { const f = () => { this.pan.vx *= 0.93; this.pan.vy *= 0.93; this.pan.x += this.pan.vx * 16; this.pan.y += this.pan.vy * 16; this.apply(); if (Math.abs(this.pan.vx) + Math.abs(this.pan.vy) > 0.02) raf = requestAnimationFrame(f); }; raf = requestAnimationFrame(f); } setTimeout(() => (this.dragged = false), 50); };
    v.addEventListener("pointerup", up); v.addEventListener("pointercancel", up);
    v.addEventListener("wheel", (e) => { e.preventDefault(); this.pan.x -= e.deltaX; this.pan.y -= e.deltaY; this.apply(); }, { passive: false });
  },
  pulse(ch, i) {
    const g = $(`[data-k="${ch}-t0${i + 1}"]`, this.svg); if (!g || RM) return;
    g.animate([{ opacity: 0.2 }, { opacity: 1 }], { duration: 900, easing: "ease-out" });
    Sfx.bell(784, 0.12);
  },
  threads(ch) {
    const T = $("#mThreads", this.svg); if (!T) return; T.innerHTML = "";
    const me = this.C.find((c) => c.n === ch), pre = new Set();
    me.topics.forEach((t) => t.pre.forEach((p) => { const m = p.match(/^c6-maths-ch(\d+)/); if (m && +m[1] !== ch) pre.add(+m[1]); }));
    pre.forEach((n) => { const a = this.C.find((c) => c.n === n), A = this.P(a.cx, a.cy, a.zt + 1.4), B = this.P(me.cx, me.cy, me.zt + 1.4);
      const mx = (A[0] + B[0]) / 2 + (this.wide ? 0 : 150) * (A[0] < 0 ? -1 : 1), my = Math.min(A[1], B[1]) - 60;
      const p = document.createElementNS("http://www.w3.org/2000/svg", "path"); p.setAttribute("d", `M${A[0]},${A[1]} Q${mx},${my} ${B[0]},${B[1]}`);
      p.setAttribute("stroke", "#FFE2A1"); p.setAttribute("stroke-width", "2"); p.setAttribute("fill", "none"); p.setAttribute("stroke-dasharray", "2 7"); p.setAttribute("stroke-linecap", "round"); p.setAttribute("opacity", ".75");
      T.appendChild(p); if (!RM) p.animate([{ strokeDashoffset: 120, opacity: 0 }, { strokeDashoffset: 0, opacity: 0.75 }], { duration: 900, easing: "ease-out" }); });
  },
  open(n) {
    const ch = this.C.find((c) => c.n === n), sh = $("#mSheet", this.el), inn = $("#mSheetIn", this.el);
    const ext = []; ch.topics.forEach((t) => t.pre.forEach((p) => { if (!p.startsWith(`c6-maths-ch${String(n).padStart(2, "0")}`) && PRE_TITLES[p]) ext.push(`${PRE_TITLES[p].t} <span style="color:var(--ink-3)">(class ${PRE_TITLES[p].c})</span>`); }));
    inn.innerHTML = `<div class="ch"><div><div class="eyebrow">Chapter ${n}</div><h3>${ch.t}</h3></div>${n === 5 ? '<span class="here-tag">Your class is here</span>' : ""}<button class="iconbtn" id="mClose" aria-label="Close">${ICON.close}</button></div>
      ${ch.topics.map((t, i) => { const s = stateOf(n, i), k = `${n}-${t.id}`; const ev = EVID[k + (s === 3 && n === 5 && i === 3 ? "-lit" : "")] || (s === 4 ? "Right again on a later day, with new numbers and no help." : s === 3 ? "Got it this week. Asha checks again on another day." : s === 2 ? "Working on it." : "Not started. Nothing is locked: you can start here any time.");
        return `<div class="topic">${stateGlyph(s)}<div><b>${t.t}</b><div class="st s${s}">${STATE_WORD[s]}${n === 5 && i === 3 && Progress.litToday ? " · today" : ""}</div><div class="ev">${ev}</div></div></div>`; }).join("")}
      ${ext.length ? `<div class="topic" style="grid-template-columns:1fr"><div class="ev"><b style="display:inline;font-size:15px">Builds on</b> · ${[...new Set(ext)].slice(0, 4).join(" · ")}</div></div>` : ""}
      ${n === 5 ? `<button class="btn lamp block" id="mGo" style="margin-top:10px">${ICON.play}<span>Continue: prime factorisation</span></button>` : `<button class="btn ghost block" id="mGo" style="margin-top:10px">Visit with Asha</button>`}`;
    sh.classList.add("open"); sh.scrollTop = 0; if (this.wide) this.center(n, true);
    $("#mClose", inn).onclick = () => { sh.classList.remove("open"); $("#mThreads", this.svg).innerHTML = ""; };
    $("#mGo", inn).onclick = () => go(n === 5 ? "lesson" : "home", { back: n !== 5 });
    this.threads(n);
    if (!this.wide) this.center(n, true);
  },
  renderList() {
    $("#mList", this.el).innerHTML = CURR.map((ch) => `<section class="panel solid"><div class="eyebrow">Chapter ${ch.n}${ch.n === 5 ? " · your class is here" : ""}</div><h4>${ch.t}</h4>
      ${ch.topics.map((t, i) => { const s = stateOf(ch.n, i); return `<div class="topic">${stateGlyph(s)}<div><b>${t.t}</b><div class="st s${s}">${STATE_WORD[s]}</div></div></div>`; }).join("")}</section>`).join("");
  },
};
