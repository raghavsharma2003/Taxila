/* ============================================================
   The world's places, drawn as layered SVG. Light from one sun per scene; shadows are coloured,
   never black; far layers fade into the sky (atmospheric perspective). No raster images.
   ============================================================ */
function ridge(r, x0, x1, yb, amp, bottom, step = 10, f = [0.006, 0.017, 0.041]) {
  const ph = f.map(() => r() * Math.PI * 2), am = [1, 0.45, 0.16];
  let d = `M${x0},${bottom} L`;
  const pts = [];
  for (let x = x0; x <= x1 + step; x += step) { let y = yb; f.forEach((k, i) => (y -= amp * am[i] * Math.sin(x * k + ph[i]))); pts.push(`${x.toFixed(0)},${y.toFixed(1)}`); }
  return d + pts.join(" L") + ` L${x1 + step},${bottom} Z`;
}
function ridgeY(r, yb, amp) { const ph = [r() * 6.28, r() * 6.28]; return (x) => yb - amp * Math.sin(x * 0.006 + ph[0]) - amp * 0.45 * Math.sin(x * 0.017 + ph[1]); }
/* a shikhara (curvilinear temple spire) silhouette */
function shikhara(x, y, s) {
  const w = 22 * s, h = 64 * s;
  return `M${x - w},${y} L${x - w},${y - 10 * s} C${x - w},${y - h * 0.55} ${x - w * 0.42},${y - h * 0.86} ${x - 3 * s},${y - h} L${x - 6 * s},${y - h - 3 * s} L${x + 6 * s},${y - h - 3 * s} L${x + 3 * s},${y - h} C${x + w * 0.42},${y - h * 0.86} ${x + w},${y - h * 0.55} ${x + w},${y - 10 * s} L${x + w},${y} Z M${x - 1.2 * s},${y - h - 3 * s} L${x},${y - h - 11 * s} L${x + 1.2 * s},${y - h - 3 * s} Z`;
}
/* a chhatri (domed pavilion) silhouette */
function chhatri(x, y, s) {
  const w = 18 * s;
  return `M${x - w},${y} L${x - w},${y - 4 * s} L${x - w + 3 * s},${y - 4 * s} L${x - w + 3 * s},${y - 20 * s} L${x - w - 3 * s},${y - 20 * s} L${x - w - 3 * s},${y - 23 * s} L${x + w + 3 * s},${y - 23 * s} L${x + w + 3 * s},${y - 20 * s} L${x + w - 3 * s},${y - 20 * s} L${x + w - 3 * s},${y - 4 * s} L${x + w},${y - 4 * s} L${x + w},${y} Z
    M${x - w + 1 * s},${y - 23 * s} C${x - w + 1 * s},${y - 38 * s} ${x - 4 * s},${y - 41 * s} ${x},${y - 44 * s} C${x + 4 * s},${y - 41 * s} ${x + w - 1 * s},${y - 38 * s} ${x + w - 1 * s},${y - 23 * s} Z M${x - 1 * s},${y - 44 * s} L${x},${y - 50 * s} L${x + 1 * s},${y - 44 * s} Z`;
}
function fort(x0, x1, y, h, every = 90) {
  let d = `M${x0},${y} L${x0},${y - h}`;
  for (let x = x0; x < x1; x += every) {
    const b = Math.min(x + every, x1);
    d += ` L${x + 6},${y - h} L${x + 6},${y - h - 14} L${x + 26},${y - h - 18} L${x + 46},${y - h - 14} L${x + 46},${y - h}`;
    for (let m = x + 52; m < b - 6; m += 10) d += ` L${m},${y - h} L${m},${y - h - 5} L${m + 5},${y - h - 5} L${m + 5},${y - h}`;
    d += ` L${b},${y - h}`;
  }
  return d + ` L${x1},${y} Z`;
}
function neem(x, y, s, fill) {
  const r = rng(Math.round(x * 7 + y));
  let d = `<path d="M${x - 4 * s},${y} C${x - 3 * s},${y - 40 * s} ${x - 8 * s},${y - 60 * s} ${x - 14 * s},${y - 78 * s} M${x + 3 * s},${y} C${x + 2 * s},${y - 50 * s} ${x + 10 * s},${y - 66 * s} ${x + 18 * s},${y - 84 * s}" stroke="${fill}" stroke-width="${7 * s}" fill="none" stroke-linecap="round"/>`;
  for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, rr = r() * 42 * s; d += `<circle cx="${(x + Math.cos(a) * rr * 1.3).toFixed(1)}" cy="${(y - 98 * s + Math.sin(a) * rr * 0.75).toFixed(1)}" r="${(16 + r() * 18) * s}" fill="${fill}"/>`; }
  return d;
}
function stars(r, n, x0, x1, y0, y1, max = 1.6) {
  let s = "";
  for (let i = 0; i < n; i++) { const y = y0 + r() * (y1 - y0); s += `<circle cx="${(x0 + r() * (x1 - x0)).toFixed(0)}" cy="${y.toFixed(0)}" r="${(0.5 + r() * max).toFixed(2)}" fill="#FFF4E0" opacity="${(0.25 + r() * 0.7 * (1 - (y - y0) / (y1 - y0))).toFixed(2)}"/>`; }
  return s;
}

/* shared defs: arch clip (objectBoundingBox), brass */
const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
  <clipPath id="jhClip" clipPathUnits="objectBoundingBox"><path d="${ARCH_PATH}"/></clipPath>
  <linearGradient id="gBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE3A3"/><stop offset=".45" stop-color="#D9A54E"/><stop offset="1" stop-color="#8E5F22"/></linearGradient>
</defs></svg>`;

/* ---------- 1 · dawn at the gate (viewBox 1200×800) ---------- */
function archShape(x0, x1, yS, yA, yB) {
  const w = x1 - x0, m = (x0 + x1) / 2, d = yS - yA;
  return `M${x0},${yB} L${x0},${yS} C${x0},${yS - d * .45} ${x0 + w * .22},${yS - d * .65} ${x0 + w * .38},${yS - d * .78} C${x0 + w * .45},${yS - d * .83} ${m - 1},${yS - d * .92} ${m},${yA} C${m + 1},${yS - d * .92} ${x0 + w * .55},${yS - d * .83} ${x0 + w * .62},${yS - d * .78} C${x0 + w * .78},${yS - d * .65} ${x1},${yS - d * .45} ${x1},${yS} L${x1},${yB} Z`;
}
function sceneDawn() {
  const r = rng(11), GY = 488;
  const rays = [[-260, .07], [-120, .1], [0, .12], [120, .1], [260, .07]].map(([dx, o]) => `<path d="M${585 + dx * 0.05},${GY} L${615 + dx * 0.05},${GY} L${600 + dx + 70},800 L${600 + dx - 70},800 Z" fill="#FFE2B8" opacity="${o}"/>`).join("");
  let diyas = "";
  for (let k = 0; k < 9; k++) { const t = k / 8, e = Math.pow(t, 1.5), y = 506 + e * 290, xl = 556 - e * 170 - 10, xr = 644 + e * 170 + 10, rr = 1.5 + e * 3.4;
    for (const x of [xl, xr]) diyas += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr * 5).toFixed(1)}" fill="url(#dDiya)"/><circle cx="${x.toFixed(1)}" cy="${(y - rr * 0.6).toFixed(1)}" r="${rr.toFixed(2)}" fill="#FFE3A8"/>`; }
  return `<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="dSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#666DA4"/><stop offset=".28" stop-color="#A08FBA"/><stop offset=".46" stop-color="#DBADB4"/><stop offset=".56" stop-color="#F5C9A9"/><stop offset=".62" stop-color="#FCE3C4"/></linearGradient>
    <radialGradient id="dSun" cx="600" cy="360" r="420" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF6E2" stop-opacity="1"/><stop offset=".1" stop-color="#FFE9C4" stop-opacity=".9"/><stop offset=".38" stop-color="#FFD6A8" stop-opacity=".32"/><stop offset="1" stop-color="#FFC8A0" stop-opacity="0"/></radialGradient>
    <linearGradient id="dFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D2A8B4"/><stop offset="1" stop-color="#9C7896"/></linearGradient>
    <linearGradient id="dGround" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5A3A5C"/><stop offset=".35" stop-color="#3A2440"/><stop offset="1" stop-color="#1C1222"/></linearGradient>
    <linearGradient id="dGate" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#47294A"/><stop offset=".5" stop-color="#5A3856"/><stop offset="1" stop-color="#3F2541"/></linearGradient>
    <linearGradient id="dSoffit" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6BE92"/><stop offset=".5" stop-color="#E2A08E"/><stop offset="1" stop-color="#A9677A"/></linearGradient>
    <linearGradient id="dChan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3E66"/><stop offset="1" stop-color="#141026"/></linearGradient>
    <linearGradient id="dRefl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE7C6" stop-opacity=".5"/><stop offset="1" stop-color="#FFE7C6" stop-opacity="0"/></linearGradient>
    <radialGradient id="dDiya" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFC874" stop-opacity=".7"/><stop offset="1" stop-color="#FF9C40" stop-opacity="0"/></radialGradient>
    <linearGradient id="dMist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1E2" stop-opacity="0"/><stop offset=".5" stop-color="#FFF1E2" stop-opacity=".5"/><stop offset="1" stop-color="#FFF1E2" stop-opacity="0"/></linearGradient>
  </defs>
  <g class="layer" data-depth="0"><rect width="1200" height="800" fill="url(#dSky)"/><rect width="1200" height="800" fill="url(#dSun)"/><circle cx="600" cy="360" r="46" fill="#FFF8EC"/></g>
  <g class="layer" data-depth=".15"><path d="${ridge(r, -40, 1240, 410, 14, 800)}" fill="#D9B2BC"/>
    <path d="${shikhara(330, 408, .85)} ${shikhara(868, 404, .75)} ${chhatri(250, 410, .8)} ${chhatri(960, 406, .9)}" fill="#D0A6B4"/></g>
  <g class="layer" data-depth=".3"><path d="${ridge(r, -40, 1240, 440, 18, 800)}" fill="#BD91AA"/><path d="${fort(100, 380, 446, 18)} ${fort(820, 1120, 442, 16)}" fill="#B1849F"/></g>
  <rect x="-20" y="420" width="1240" height="80" fill="url(#dMist)"/>
  <g class="layer" data-depth=".45"><path d="${ridge(r, -40, 1240, 472, 12, 800)}" fill="#A3799A"/>
    <path d="M-20,484 L1220,484 L1220,800 L-20,800 Z" fill="url(#dFloor)"/>
    <path d="M-20,510 L1220,510 M-20,548 L1220,548 M-20,604 L1220,604 M-20,690 L1220,690" stroke="#EBCBCD" stroke-opacity=".3" stroke-width="1.4"/></g>
  <g class="gate" style="transform-origin:600px 340px">
    <path d="M-20,${GY - 10} L1220,${GY - 10} L1220,800 L-20,800 Z" fill="url(#dGround)"/>
    <path d="M556,${GY + 12} L644,${GY + 12} L820,800 L380,800 Z" fill="url(#dChan)"/>
    <path d="M556,${GY + 12} L380,800 M644,${GY + 12} L820,800" stroke="#E9A57F" stroke-opacity=".45" stroke-width="2"/>
    <path d="M592,${GY + 14} L608,${GY + 14} L632,800 L568,800 Z" fill="url(#dRefl)" opacity=".55"/>
    ${rays}${diyas}
    <g transform="translate(600 488) scale(.9) translate(-600 -488)"><path d="M404,${GY} L404,140 L796,140 L796,${GY} Z" fill="url(#dGate)"/>
    ${Array.from({ length: 20 }, (_, i) => `<rect x="${406 + i * 20}" y="128" width="11" height="12" fill="#47294A"/>`).join("")}
    <path d="${chhatri(446, 128, 1.1)} ${chhatri(754, 128, 1.1)} ${chhatri(600, 128, 1.55)}" fill="#47294A"/>
    <path d="M404,262 L492,262 M708,262 L796,262 M404,382 L492,382 M708,382 L796,382 M404,150 L796,150" stroke="#6E4868" stroke-width="2"/>
    <circle cx="448" cy="206" r="14" fill="none" stroke="#7A4E6E" stroke-width="2"/><circle cx="752" cy="206" r="14" fill="none" stroke="#7A4E6E" stroke-width="2"/>
    <path d="${archShape(490, 710, 330, 172, GY)}" fill="#331E35"/>
    <path d="${archShape(497, 703, 332, 184, GY)}" fill="url(#dSoffit)"/>
    <path d="${archShape(510, 690, 336, 200, GY)}" fill="url(#dSky)"/>
    <path d="${archShape(510, 690, 336, 200, GY)}" fill="url(#dSun)"/>
    <circle cx="600" cy="360" r="46" fill="#FFF8EC"/>
    <path d="${archShape(510, 690, 336, 200, GY)}" fill="none" stroke="#FFD9B0" stroke-width="2.5" opacity=".9"/>
    <circle cx="600" cy="164" r="5" fill="#E9A23B"/>
    <path d="M380,${GY} L820,${GY} L834,${GY + 12} L366,${GY + 12} Z" fill="#5E3D5A"/><path d="M380,${GY} L820,${GY}" stroke="#EDA986" stroke-width="2" opacity=".7"/></g>
    <g>${neem(70, GY + 20, 1.6, "#24162A")}${neem(1130, GY + 24, 1.5, "#24162A")}</g>
  </g>
</svg>`;
}

/* ---------- 2 · the terrace at dusk (viewBox 1200×720) ---------- */
function sceneDusk() {
  const r = rng(5);
  const jaali = Array.from({ length: 44 }, (_, i) => `<path d="M${46 + i * 26},604 l6,-8 l6,8 l-6,8 z" fill="#E78F66" opacity=".5"/>`).join("");
  const courses = Array.from({ length: 6 }, (_, i) => `<path d="M0,${626 + i * 18} L1200,${626 + i * 18}" stroke="#2F1E3E" stroke-width="1.5" opacity=".7"/>`).join("");
  const diyas = Array.from({ length: 21 }, (_, i) => { const x = 30 + i * 57; return `<circle cx="${x}" cy="582" r="20" fill="url(#kDiya)"/><path d="M${x - 5},586 q5,4 10,0 z" fill="#B0603A"/><path d="M${x},576 c3,3 3,7 0,9 c-3,-2 -3,-6 0,-9z" fill="#FFD27A"/>`; }).join("");
  return `<svg viewBox="0 0 1200 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="kSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16133A"/><stop offset=".26" stop-color="#2C2454"/><stop offset=".48" stop-color="#5A3A68"/><stop offset=".64" stop-color="#A3566C"/><stop offset=".76" stop-color="#E2845F"/><stop offset=".84" stop-color="#F6B466"/></linearGradient>
    <radialGradient id="kSun" cx="420" cy="520" r="430" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".95"/><stop offset=".2" stop-color="#FFB37A" stop-opacity=".5"/><stop offset="1" stop-color="#FF9C70" stop-opacity="0"/></radialGradient>
    <linearGradient id="kWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3058"/><stop offset="1" stop-color="#26182F"/></linearGradient>
    <linearGradient id="kWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#E9906A"/><stop offset=".5" stop-color="#7A4B6E"/><stop offset="1" stop-color="#2D2348"/></linearGradient>
    <linearGradient id="kStone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F0A673"/><stop offset=".22" stop-color="#9C5E6A"/><stop offset="1" stop-color="#5C3A62"/></linearGradient>
    <linearGradient id="kDome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6B582"/><stop offset=".38" stop-color="#B96F70"/><stop offset="1" stop-color="#55345E"/></linearGradient>
    <radialGradient id="kLamp" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#FFD48A" stop-opacity=".9"/><stop offset=".35" stop-color="#FFB25A" stop-opacity=".35"/><stop offset="1" stop-color="#FF9C40" stop-opacity="0"/></radialGradient>
    <radialGradient id="kDiya" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFC874" stop-opacity=".65"/><stop offset="1" stop-color="#FF9C40" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="720" fill="url(#kSky)"/>
  <g>${stars(r, 70, 0, 1200, 10, 300)}</g>
  <path d="M820,84 a26,26 0 1,0 22,40 a20,20 0 1,1 -22,-40z" fill="#FBEFD9" opacity=".92"/>
  <rect width="1200" height="720" fill="url(#kSun)"/>
  <g class="layer" data-depth=".12"><path d="${ridge(r, -40, 1240, 462, 14, 720)}" fill="#8B5674"/><path d="${shikhara(470, 458, .9)} ${shikhara(760, 452, 1.1)} ${chhatri(1010, 456, .9)} ${shikhara(190, 460, .8)}" fill="#7E4D6C"/></g>
  <g class="layer" data-depth=".25"><path d="${ridge(r, -40, 1240, 500, 22, 720)}" fill="#653E66"/><path d="${fort(780, 1160, 506, 26, 100)} ${fort(40, 300, 512, 20)}" fill="#5A3760"/></g>
  <g class="layer" data-depth=".4"><path d="${ridge(r, -40, 1240, 548, 16, 720)}" fill="#432B54"/></g>
  <g class="layer" data-depth=".6">
    <rect x="-20" y="586" width="1240" height="140" fill="url(#kWall)"/>${courses}
    <path d="M-20,586 L1220,586 L1220,592 L-20,592 Z" fill="#E99A6C" opacity=".7"/>
    <rect x="-20" y="592" width="1240" height="24" fill="#3B2649"/>${jaali}
    <!-- the stepwell, cut away -->
    <path d="M790,616 L790,720 L1010,720 L1010,616 Z" fill="#1E1430"/>
    ${[0, 1, 2, 3, 4].map((i) => `<path d="M${790 + i * 22},${616 + i * 18} L${1010 - i * 22},${616 + i * 18} L${1010 - i * 22},${634 + i * 18} L${790 + i * 22},${634 + i * 18} Z" fill="${i % 2 ? "#4B3058" : "#583966"}"/><path d="M${790 + i * 22},${616 + i * 18} L${1010 - i * 22},${616 + i * 18}" stroke="#F09A6A" stroke-opacity=".55" stroke-width="2"/>`).join("")}
    <rect x="900" y="706" width="0" height="0" fill="none"/>
    <rect x="${790 + 5 * 22}" y="${616 + 5 * 18}" width="${220 - 10 * 22}" height="30" fill="url(#kWater)"/>
    <!-- the half-built idea: stone base, two pillars set, bamboo scaffold, a lantern (got it today) -->
    <g>
      <rect x="296" y="560" width="150" height="26" fill="url(#kStone)"/>
      <rect x="308" y="470" width="16" height="90" fill="url(#kStone)"/><rect x="418" y="470" width="16" height="90" fill="#5C3A62"/>
      <rect x="300" y="458" width="142" height="12" fill="url(#kStone)"/>
      <g stroke="#D6A86C" stroke-width="3" stroke-linecap="round" opacity=".9"><path d="M346,586 L346,404 M396,586 L396,404 M338,520 L404,520 M338,456 L404,456 M338,410 L404,410 M346,520 L396,456 M396,520 L346,456"/></g>
      <path d="M371,404 L371,428" stroke="#D6A86C" stroke-width="1.5"/>
      <circle cx="371" cy="440" r="48" fill="url(#kLamp)"/><path d="M364,430 h14 l3,8 v10 l-3,4 h-14 l-3,-4 v-10 z" fill="#FFC86E"/>
    </g>
    <!-- the pavilion where Asha waits -->
    <g transform="translate(600 586) scale(1.2) translate(-600 -586)">
      <path d="M450,586 L450,568 L750,568 L750,586 Z" fill="url(#kStone)"/>
      <path d="M462,568 L462,556 L738,556 L738,568 Z" fill="#7A4B66"/>
      <rect x="474" y="318" width="22" height="238" fill="url(#kStone)"/><rect x="704" y="318" width="22" height="238" fill="#56365E"/>
      <rect x="480" y="330" width="240" height="226" fill="#2A1A2E"/>
      <circle cx="600" cy="440" r="176" fill="url(#kLamp)"/>
      <rect id="ashaSlot" x="526" y="352" width="148" height="192" fill="none"/>
      <path d="M454,318 L746,318 L762,300 L438,300 Z" fill="#E59A6C"/><path d="M438,300 L762,300 L762,292 L438,292 Z" fill="#B66A6A"/>
      <path d="M480,292 C480,214 550,196 600,150 C650,196 720,214 720,292 Z" fill="url(#kDome)"/>
      <path d="M480,292 C480,214 550,196 600,150" stroke="#FFC28E" stroke-width="3" fill="none" opacity=".8"/>
      <path d="M596,150 L600,118 L604,150 Z" fill="#E9A23B"/><circle cx="600" cy="114" r="5" fill="#FFC24D"/>
      <path d="M490,292 L710,292 L710,286 L490,286 Z" fill="#8E5468"/>
    </g>
    ${diyas}
    <g>${neem(1120, 586, 1.4, "#22152B")}${neem(110, 590, 1.15, "#22152B")}</g>
  </g>
</svg>`;
}

/* ---------- 3 · inside the pavilion (viewBox 1200×800) ---------- */
function scenePavilion() {
  const r = rng(23);
  return `<svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="pIn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A1B2C"/><stop offset="1" stop-color="#140D1A"/></linearGradient>
    <linearGradient id="pSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1C1840"/><stop offset=".55" stop-color="#5A3A68"/><stop offset=".85" stop-color="#C46A68"/><stop offset="1" stop-color="#F0A060"/></linearGradient>
    <radialGradient id="pLamp" cx="140" cy="720" r="620" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFB766" stop-opacity=".42"/><stop offset=".5" stop-color="#E07F4A" stop-opacity=".12"/><stop offset="1" stop-color="#E07F4A" stop-opacity="0"/></radialGradient>
    <linearGradient id="pCol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7B4B52"/><stop offset=".3" stop-color="#4A2E3E"/><stop offset="1" stop-color="#2A1A2A"/></linearGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#pIn)"/>
  <path d="M300,800 L300,330 C300,210 420,170 500,140 C560,118 590,80 600,40 C610,80 640,118 700,140 C780,170 900,210 900,330 L900,800 Z" fill="url(#pSky)"/>
  <g>${stars(r, 40, 300, 900, 50, 300)}</g>
  <path d="${ridge(r, 300, 900, 540, 16, 800)}" fill="#6B3F66"/><path d="${ridge(r, 300, 900, 590, 14, 800)}" fill="#4A2D52"/>
  <path d="${shikhara(470, 540, 1)} ${chhatri(760, 536, 1.2)}" fill="#5E3860"/>
  <path d="M300,800 L300,330 C300,210 420,170 500,140 C560,118 590,80 600,40 C610,80 640,118 700,140 C780,170 900,210 900,330 L900,800" fill="none" stroke="#C88A6A" stroke-width="5" opacity=".55"/>
  <rect x="140" y="0" width="90" height="800" fill="url(#pCol)"/><rect x="970" y="0" width="90" height="800" fill="url(#pCol)"/>
  ${[120, 300, 560].map((y) => `<rect x="130" y="${y}" width="110" height="16" fill="#8A5658"/><rect x="960" y="${y}" width="110" height="16" fill="#5A3848"/>`).join("")}
  <rect x="0" y="690" width="1200" height="110" fill="#120B16" opacity=".8"/>
  <rect width="1200" height="800" fill="url(#pLamp)"/>
</svg>`;
}

/* ---------- 4 · the stone yard (viewBox 600×800) ---------- */
function sceneYard() {
  const r = rng(31);
  let jaali = "";
  for (let row = 0; row < 3; row++) for (let c = 0; c < 9; c++) {
    const x = 92 + c * 52, y = 240 + row * 52;
    jaali += `<path d="M${x},${y - 16} L${x + 7},${y - 7} L${x + 16},${y} L${x + 7},${y + 7} L${x},${y + 16} L${x - 7},${y + 7} L${x - 16},${y} L${x - 7},${y - 7} Z" fill="#F2A77A" opacity="${(0.55 - row * 0.12).toFixed(2)}"/>`;
  }
  let tiles = "";
  for (let i = -8; i <= 8; i++) tiles += `<path d="M300,470 L${300 + i * 120},800" stroke="#2B1D3A" stroke-width="1.5" opacity=".7"/>`;
  [520, 580, 660, 760].forEach((y) => (tiles += `<path d="M0,${y} L600,${y}" stroke="#2B1D3A" stroke-width="1.5" opacity=".7"/>`));
  return `<svg viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="ySky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#211B48"/><stop offset=".6" stop-color="#7A4468"/><stop offset="1" stop-color="#E58D63"/></linearGradient>
    <linearGradient id="yWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5E3B62"/><stop offset="1" stop-color="#3A2647"/></linearGradient>
    <linearGradient id="yFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A2748"/><stop offset="1" stop-color="#1E1428"/></linearGradient>
    <radialGradient id="yPool" cx="300" cy="560" r="330" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFB870" stop-opacity=".30"/><stop offset=".55" stop-color="#E9835A" stop-opacity=".1"/><stop offset="1" stop-color="#E9835A" stop-opacity="0"/></radialGradient>
    <radialGradient id="yLamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD48A" stop-opacity=".8"/><stop offset="1" stop-color="#FF9C40" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="600" height="800" fill="url(#ySky)"/>
  <g>${stars(r, 30, 0, 600, 10, 140)}</g>
  <path d="${ridge(r, -20, 620, 176, 10, 800)}" fill="#6F4066"/>
  <rect x="0" y="170" width="600" height="300" fill="url(#yWall)"/>
  <rect x="0" y="170" width="600" height="8" fill="#EB9C6E" opacity=".7"/>
  <rect x="60" y="214" width="480" height="164" fill="#2A1B35" opacity=".55"/>${jaali}
  <rect x="0" y="440" width="600" height="30" fill="#4A3056"/>
  <rect x="0" y="470" width="600" height="330" fill="url(#yFloor)"/>${tiles}
  <rect width="600" height="800" fill="url(#yPool)"/>
  <g transform="translate(548 440)"><rect x="-3" y="-120" width="6" height="120" fill="#7A5232"/><path d="M-16,-120 h32 l-6,-10 h-20 z" fill="#C88A3A"/><path d="M0,-146 c6,6 6,14 0,20 c-6,-6 -6,-14 0,-20z" fill="#FFC86E"/><circle cx="0" cy="-134" r="60" fill="url(#yLamp)"/></g>
</svg>`;
}

/* ---------- home card: the valley at night, in miniature ---------- */
function scenePeek() {
  const r = rng(77);
  const mesas = [[40, 120, 46], [120, 96, 54], [210, 112, 44], [300, 86, 58], [390, 104, 48], [470, 90, 52]];
  const lit = [[1, 1], [1, 1], [1, 0], [1, 0], [0, 0], [0, 0]];
  return `<svg viewBox="0 0 520 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs><linearGradient id="wSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0F1030"/><stop offset="1" stop-color="#2B2756"/></linearGradient>
  <radialGradient id="wGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD48A" stop-opacity=".9"/><stop offset="1" stop-color="#FFB050" stop-opacity="0"/></radialGradient></defs>
  <rect width="520" height="150" fill="url(#wSky)"/>${stars(r, 40, 0, 520, 4, 70, 1.1)}
  ${mesas.map(([x, y, w], i) => `<path d="M${x - w / 2},150 L${x - w / 2},${y} L${x},${y - 10} L${x + w / 2},${y} L${x + w / 2},150 Z" fill="${i < 4 ? "#2E2D63" : "#252450"}"/><path d="M${x - w / 2},${y} L${x},${y - 10} L${x},150 L${x - w / 2},150 Z" fill="#3B3B7A" opacity=".8"/>
    ${lit[i][0] ? `<circle cx="${x - 6}" cy="${y - 10}" r="20" fill="url(#wGlow)"/><circle cx="${x - 6}" cy="${y - 10}" r="2.6" fill="#FFE2A1"/>` : ""}
    ${lit[i][1] ? `<circle cx="${x + 9}" cy="${y - 6}" r="16" fill="url(#wGlow)"/><circle cx="${x + 9}" cy="${y - 6}" r="2.2" fill="#FFE2A1"/>` : ""}`).join("")}
  <rect x="0" y="120" width="520" height="30" fill="#191A40" opacity=".7"/>
</svg>`;
}

/* ---------- parent corner: the same terrace as an engraving, lit only where Riya understands ---------- */
function sceneEngraving() {
  const r = rng(9);
  return `<svg viewBox="0 0 1200 210" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <pattern id="h1" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M0 2.5H5" stroke="#7A6146" stroke-width=".7"/></pattern>
    <pattern id="h2" width="3.4" height="3.4" patternUnits="userSpaceOnUse"><path d="M0 1.7H3.4" stroke="#6A5139" stroke-width=".8"/></pattern>
    <pattern id="h3" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 1.5H3" stroke="#5B442F" stroke-width=".9"/></pattern>
    <radialGradient id="eLit" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E7B455" stop-opacity=".75"/><stop offset="1" stop-color="#E7B455" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1200" height="210" fill="#EFE6D7"/>
  <circle cx="300" cy="150" r="70" fill="none" stroke="#B08D5E" stroke-width=".8" opacity=".5"/><circle cx="300" cy="150" r="50" fill="none" stroke="#B08D5E" stroke-width=".8" opacity=".35"/>
  <path d="${ridge(r, -20, 1220, 140, 10, 210, 12)}" fill="url(#h1)" opacity=".55"/>
  <path d="${shikhara(520, 138, .8)} ${shikhara(690, 134, 1)} ${chhatri(990, 136, .8)}" fill="url(#h1)" stroke="#6A5139" stroke-width=".7"/>
  <path d="${ridge(r, -20, 1220, 166, 12, 210, 12)}" fill="url(#h2)" opacity=".7"/>
  <rect x="-10" y="182" width="1220" height="40" fill="url(#h3)"/><path d="M-10,182 H1210" stroke="#5B442F" stroke-width="1"/>
  <g stroke="#4F3B28" stroke-width="1.1" fill="#EFE6D7">
    <path d="M700,182 V176 H900 V182"/><rect x="712" y="104" width="10" height="72"/><rect x="878" y="104" width="10" height="72"/>
    <path d="M700,104 H900 L910,96 H690 Z"/><path d="M712,96 C712,64 770,56 800,30 C830,56 888,64 888,96"/><path d="M800,30 V18"/>
    <path d="M520,182 V170 H620 V182"/><rect x="530" y="128" width="8" height="42"/><rect x="600" y="128" width="8" height="42" fill="url(#h2)"/><path d="M526,128 H612 V122 H526 Z"/>
  </g>
  <g stroke="#9C7A4A" stroke-width="1" fill="none" stroke-dasharray="3 3"><path d="M560,170 V96 M580,170 V96 M552,150 H588 M552,112 H588"/></g>
  <circle cx="800" cy="140" r="46" fill="url(#eLit)"/><rect x="788" y="120" width="24" height="34" fill="#E2A646" opacity=".85"/>
  <circle cx="570" cy="104" r="22" fill="url(#eLit)"/><circle cx="570" cy="104" r="3.5" fill="#D99A2E"/>
</svg>`;
}
