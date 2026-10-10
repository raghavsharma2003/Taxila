// Family 3, "line of light", carried into Prakash's lamplight. Adapted from portraitSVG() and the Teacher class of
// docs/design/round4/studio/index.html: the same 240 x 300 drawing, the same mouthD() lip curves and the same
// parameters (mouth open o, mouth width w, smile s, brow lift, head tilt, gaze gx/gy, blink), so the six frames are
// parameter settings of ONE vector puppet, not six drawings.
// What changed for Prakash and for a grown-up teacher:
//  - the face is LIT, not a dark ground: skin painted in the lamp's light (lit plane from the sun side, warm mid,
//    violet shadow under the jaw: world SPEC §1.1 "shadows are coloured (violet), never black"); feature lines are warm
//    umber; the "line of light" survives as a lamp-gold rim along the sun side of the hair, cheek and shoulder;
//  - adult proportions: a longer face with a defined jaw angle and chin, a cheekbone plane, upper-lid creases, lower
//    lids, nostrils, a faint nasolabial line, a fuller lower lip, slightly smaller irises;
//  - the dress is the same teal cotton handloom saree as the painted families: blouse, pallu over her left shoulder,
//    a rust-red woven border; maroon bindi, gold studs, a low bun at the nape.
//   node lineoflight.mjs <outdir>   -> <name>.svg for the six frames + frames.json
import fs from "node:fs";

export const FRAMES = {
  rest: { o: 0, w: 0, s: 1.2, brow: 0, tilt: 0, gx: 0, gy: 0, blink: 0, cheek: 0 },
  speak: { o: 0.85, w: 0.12, s: 0.8, brow: 0.15, tilt: 0, gx: 0, gy: 0, blink: 0, cheek: 0 },
  listen: { o: 0, w: 0.1, s: 1.6, brow: 0.7, tilt: 4.5, gx: 0, gy: 0.2, blink: 0, cheek: 0 },
  think: { o: 0, w: 0.1, s: 0.9, brow: 0.5, tilt: -1, gx: -2.0, gy: -3.6, blink: 0, cheek: 0 },
  warm: { o: 0.12, w: 0.4, s: 2.8, brow: 0.3, tilt: 1.5, gx: 0, gy: 0, blink: 0.18, cheek: 1 },
  blink: { o: 0, w: 0, s: 1.2, brow: 0, tilt: 0, gx: 0, gy: 0, blink: 1, cheek: 0 },
};

// mouthD from the studio prototype, unchanged except the lower-lip drop (a fuller adult lower lip)
function mouthD(o, w, s) {
  const L = 105 - 2.6 * w, R = 135 + 2.6 * w, cy = 167 - 1.4 * s, up = 166 - o * 0.9, pk = 165 - o * 0.9;
  const drop = 8 + o * 10 + Math.max(0, s - 1.2) * 0.9, h = Math.max(0, s - 1.2) * 1.6;
  return {
    up: `M${L},${cy} C${L + 6},${cy - 3 + h} 116,${pk} 120,${up} C124,${pk} ${R - 6},${cy - 3 + h} ${R},${cy}`,
    lo: `M${L + 3},${cy + 2.4} C${L + 8},${cy + drop} ${R - 8},${cy + drop} ${R - 3},${cy + 2.4}`,
    inn: `M${L + 1.5},${cy + 0.6} C${L + 8},${cy - 0.5 - o} ${R - 8},${cy - 0.5 - o} ${R - 1.5},${cy + 0.6} C${R - 7},${cy + 1 + o * 9} ${L + 7},${cy + 1 + o * 9} ${L + 1.5},${cy + 0.6} Z`,
    fill: `M${L},${cy} C${L + 6},${cy - 3 + h} 116,${pk} 120,${up} C124,${pk} ${R - 6},${cy - 3 + h} ${R},${cy} C${R - 6},${cy + drop + 0.5} ${L + 6},${cy + drop + 0.5} ${L},${cy} Z`,
    teeth: `M${L + 5},${cy + 0.8} C${L + 9},${cy - 0.2 - o} ${R - 9},${cy - 0.2 - o} ${R - 5},${cy + 0.8} L${R - 6},${cy + 1.2 + o * 2.2} C${R - 10},${cy + 0.6 + o * 2.6} ${L + 10},${cy + 0.6 + o * 2.6} ${L + 6},${cy + 1.2 + o * 2.2} Z`,
  };
}

let UID = 0;
export function portrait(p = FRAMES.rest, { viewBox = "0 0 240 300", bg = true, id } = {}) {
  const u = id || "ll" + UID++;
  const LINE = "#3B2219", LIGHT = "#FFD58A", GOLD = "#D9A54E";
  const defs = `<defs>
    <radialGradient id="${u}bg" cx=".5" cy=".36" r=".78"><stop offset="0" stop-color="#FDEBC7"/><stop offset=".46" stop-color="#FBE5BC"/><stop offset="1" stop-color="#EFC98F"/></radialGradient>
    <radialGradient id="${u}sk" cx=".36" cy=".34" r=".86"><stop offset="0" stop-color="#C08D60"/><stop offset=".5" stop-color="#A27753"/><stop offset="1" stop-color="#7E5640"/></radialGradient>
    <linearGradient id="${u}nk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9A6E4C"/><stop offset="1" stop-color="#A97C57"/></linearGradient>
    <linearGradient id="${u}jaw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C3A62" stop-opacity=".55"/><stop offset="1" stop-color="#5C3A62" stop-opacity="0"/></linearGradient>
    <linearGradient id="${u}hr" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="#3A2A1F"/><stop offset=".4" stop-color="#1D1511"/><stop offset="1" stop-color="#0F0B09"/></linearGradient>
    <linearGradient id="${u}cl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2D7470"/><stop offset=".6" stop-color="#1D5654"/><stop offset="1" stop-color="#173F44"/></linearGradient>
    <linearGradient id="${u}pl" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2A6D6A"/><stop offset="1" stop-color="#1A4A4C"/></linearGradient>
    <radialGradient id="${u}ck" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#C46A4E" stop-opacity=".22"/><stop offset="1" stop-color="#C46A4E" stop-opacity="0"/></radialGradient>
  </defs>`;
  const face = "M71,122 C71,146 75,166 85,181 C94,194 108,202 120,202 C132,202 146,194 155,181 C165,166 169,146 169,122 C169,94 148,72 120,72 C92,72 71,94 71,122 Z";
  // body: blouse, neck, pallu over her left shoulder (viewer's right), rust border
  const body = `
    <path d="M98,229 C80,234 52,242 36,260 C27,271 22,300 20,330 L220,330 C218,300 213,271 204,260 C188,242 160,234 142,229 C132,243 108,243 98,229 Z" fill="url(#${u}cl)"/>
    <path d="M98,180 C100,202 99,218 96,230 C108,244 132,244 144,230 C141,218 140,202 142,180 Z" fill="url(#${u}nk)"/>
    <path d="M98,188 C108,208 132,208 142,188 L142,214 C128,220 112,220 98,214 Z" fill="url(#${u}jaw)"/>
    <path d="M142,229 C162,235 188,243 204,260 C213,271 218,300 220,330 L78,330 C100,300 124,262 142,229 Z" fill="url(#${u}pl)"/>
    <path d="M142.5,230 C124,262 101,298 80,330" fill="none" stroke="#A3452E" stroke-width="4.6"/>
    <path d="M139.6,231 C121,263 98,300 76,331" fill="none" stroke="#7C2E22" stroke-width="1.1" opacity=".8"/>
    <path d="M144.6,231 C127,262 104,298 84,331" fill="none" stroke="${GOLD}" stroke-width=".7" opacity=".55" stroke-dasharray="1.6 1.6"/>
    <path d="M196,252 C205,262 210,274 213,290 L217,330" fill="none" stroke="#A3452E" stroke-width="4.2" opacity=".95"/>
    <path d="M60,248 C56,262 54,282 55,300" fill="none" stroke="#123A3C" stroke-width="1" opacity=".45"/>
    <path d="M128,286 C150,270 170,262 196,258 M110,312 C140,292 168,280 204,276" fill="none" stroke="#123A3C" stroke-width="1.1" opacity=".5"/>`;
  const shoulderLines = `
    <path d="M99,190 C100,206 99,219 96,230" fill="none" stroke="${LIGHT}" stroke-width="1.2" opacity=".8"/><path d="M141,190 C140,206 141,219 144,230" fill="none" stroke="${LINE}" stroke-width="1" opacity=".5"/>
    <path d="M98,229 C80,234 52,242 36,260 C27,271 22,300 20,330" fill="none" stroke="${LIGHT}" stroke-width="1.6" opacity=".85"/>
    <path d="M96,230 C108,244 132,244 144,230" fill="none" stroke="${LINE}" stroke-width="1" opacity=".55"/>
    <path d="M108,233 C113,236 117,236 119,234 M121,234 C123,236 127,236 132,233" fill="none" stroke="${LINE}" stroke-width=".7" opacity=".3"/>`;
  const hairBack = "";
  const nape = `<path d="M140,172 C150,166 168,166 178,176 C186,186 182,200 168,204 C156,207 144,202 140,194 Z" fill="url(#${u}hr)"/>
    <path d="M148,173 C156,169 167,169 175,176 M146,185 C155,180 168,181 180,188 M150,197 C158,194 168,195 176,199" fill="none" stroke="${LIGHT}" stroke-width=".8" opacity=".38"/>
    `;
  const hairFront = `<path d="M120,73 C108,75 95,83 87,95 C82,103 79.5,112 78,121 C76,124 73,126 69,128 C62,102 67,76 86,61 C97,53 109,51 120,51 Z" fill="url(#${u}hr)"/>
    <path d="M120,73 C132,75 145,83 153,95 C158,103 160.5,112 162,121 C164,124 167,126 171,128 C178,102 173,76 154,61 C143,53 131,51 120,51 Z" fill="url(#${u}hr)"/>
    <path d="M118,58 C104,61 92,70 85,84 M116,66 C104,70 94,79 88,92 M122,58 C136,61 148,70 155,84 M124,66 C136,70 146,79 152,92" fill="none" stroke="${LIGHT}" stroke-width=".55" opacity=".28"/>
    `;
  const hair = `<path d="M66,140 C58,94 78,46 120,45 C162,46 182,94 174,140 C174,120 170,96 160,84 C150,75 136,71 120,71 C104,71 90,75 80,84 C70,96 66,120 66,140 Z" fill="url(#${u}hr)"/>`;
  const rim = `<path d="M66,140 C58,94 78,46 120,45 C140,45.5 156,53 166,66" fill="none" stroke="${LIGHT}" stroke-width="1.6" opacity=".9"/>
    <path d="M119,51 C100,55 86,67 78,98 M112,53 C97,60 86,74 81,92 M121,51 C142,55 156,67 164,98 M120,72 L120.3,46" fill="none" stroke="${LIGHT}" stroke-width=".9" opacity=".32"/>
    <path d="M72,116 C70,104 74,92 81,84 M168,116 C170,104 166,92 159,84" fill="none" stroke="${LIGHT}" stroke-width=".7" opacity=".28"/>`;
  const gx = p.gx, gy = p.gy, bl = Math.min(1, Math.max(0, p.blink));
  const eye = (cx, flip) => {
    const s = flip ? -1 : 1, x = (v) => (cx + s * v).toFixed(2);
    const open = 1 - 0.9 * bl;                 // lid opening scale
    const cyU = 121.5, top = cyU - 5.6 * open - Math.max(0, -gy) * 0.75, bot = cyU + 3.2 * open - 0.9 * p.cheek;
    const lid = `M${x(-12)},${cyU} C${x(-8)},${top} ${x(7)},${top - 0.6} ${x(13)},${cyU - 1}`;
    const low = `M${x(-12)},${cyU} C${x(-6)},${bot + 1.6} ${x(6)},${bot + 1.6} ${x(13)},${cyU - 1}`;
    const clip = `${u}e${flip ? "R" : "L"}`;
    const opening = `${lid} C${x(6)},${(bot + 1.6).toFixed(2)} ${x(-6)},${(bot + 1.6).toFixed(2)} ${x(-12)},${cyU} Z`;
    return `<clipPath id="${clip}"><path d="${opening}"/></clipPath>
      <path d="${opening}" fill="#EADCC4" opacity="${bl > 0.6 ? 0 : 0.9}"/>
      <g clip-path="url(#${clip})" opacity="${bl > 0.6 ? 0 : 1}"><g transform="translate(${gx.toFixed(2)} ${gy.toFixed(2)})">
        <circle cx="${cx}" cy="120.9" r="4.4" fill="#3A2416"/><circle cx="${cx}" cy="120.9" r="4.4" fill="none" stroke="#1E120B" stroke-width=".7"/>
        <circle cx="${cx}" cy="120.9" r="1.9" fill="#0B0706"/><circle cx="${cx + 1.5}" cy="119.3" r="1.05" fill="#FFF6E2" opacity=".95"/></g></g>
      <path d="M${x(-14.8)},${(cyU - 2.4).toFixed(2)} L${x(-12)},${cyU} ${lid.slice(1).replace(/^[^C]*/, "")}" fill="none" stroke="${LINE}" stroke-width="${(2.1 + bl * 0.2).toFixed(2)}" stroke-linecap="round"/>
      <path d="M${x(-10)},${(cyU - 7.4 + bl * 1.6 - 0.4 * p.brow).toFixed(2)} C${x(-5)},${(cyU - 10.6 - 0.4 * p.brow).toFixed(2)} ${x(6)},${(cyU - 10.8 - 0.4 * p.brow).toFixed(2)} ${x(12)},${(cyU - 6.6 - 0.2 * p.brow).toFixed(2)}" fill="none" stroke="${LINE}" stroke-width=".9" opacity="${(0.24 * (1 - bl * 0.7)).toFixed(2)}"/>
      <path d="${low}" fill="none" stroke="${LINE}" stroke-width=".85" opacity="${(0.3 + bl * 0.3).toFixed(2)}"/>
      ${p.cheek ? `<path d="M${x(-7)},${(cyU + 6.4).toFixed(2)} C${x(-2)},${(cyU + 8).toFixed(2)} ${x(5)},${(cyU + 7.6).toFixed(2)} ${x(9)},${(cyU + 5.4).toFixed(2)}" fill="none" stroke="${LINE}" stroke-width=".6" opacity=".16"/>
      <path d="M${x(14)},${cyU - 1} l${(s * 3.4).toFixed(2)},1.6 M${x(14.2)},${cyU + 1.2} l${(s * 3).toFixed(2)},2.4" fill="none" stroke="${LINE}" stroke-width=".6" opacity=".22"/>` : ""}`;
  };
  const by = -1.6 * p.brow;
  const brows = `<g transform="translate(0 ${by.toFixed(2)})">
    <path d="M83,107.8 C90,102.8 101,102.2 110.5,105.6" fill="none" stroke="${LINE}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M129.5,105.6 C139,102.2 150,102.8 157,107.8" fill="none" stroke="${LINE}" stroke-width="2.1" stroke-linecap="round"/>
    <path d="M84,107.5 C91,104 101,103.6 110,105.4 M130,105.4 C139,103.6 149,104 156,107.5" fill="none" stroke="#5A3826" stroke-width="4.2" opacity=".35" stroke-linecap="round"/></g>`;
  const m = mouthD(Math.min(1.1, p.o), p.w, p.s);
  const mouth = `
    <path d="${m.fill}" fill="#93503F" opacity=".55"/>
    <path d="${m.inn}" fill="#2A1110" opacity="${Math.min(0.92, p.o * 3).toFixed(2)}"/>
    ${p.o > 0.3 ? `<path d="${m.teeth}" fill="#EFE3CF" opacity=".9"/><ellipse cx="120" cy="${(167 - 1.4 * p.s + 1 + p.o * 7).toFixed(2)}" rx="${(6 + p.o * 2).toFixed(2)}" ry="${(1.4 + p.o * 1.6).toFixed(2)}" fill="#8B3B39" opacity=".8"/>` : ""}
    <path d="${m.up}" fill="none" stroke="${LINE}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${m.lo}" fill="none" stroke="${LINE}" stroke-width="1.1" opacity=".55" stroke-linecap="round"/>
    `;
  const faceArt = `
    <path d="${face}" fill="url(#${u}sk)"/>
    <path d="M156,100 C166,116 168,140 162,162 C156,180 144,194 128,201 C148,197 163,180 168,158 C172,138 168,114 156,100 Z" fill="#5C3A62" opacity=".2"/>
    
    <ellipse cx="92" cy="146" rx="13" ry="9" fill="url(#${u}ck)"/><ellipse cx="148" cy="146" rx="13" ry="9" fill="url(#${u}ck)"/>
    <path d="M71,122 C71,146 75,166 85,181 C91,190 100,197 110,200.5" fill="none" stroke="${LIGHT}" stroke-width="1.4" opacity=".85"/>
    <path d="M110,200.5 C113,201.5 117,202 120,202 C132,202 146,194 155,181 C165,166 169,146 169,122" fill="none" stroke="${LINE}" stroke-width="1.2" opacity=".75"/>
    
    <path d="M72,121 C62,117 60,143 72,150 Z" fill="#A27753"/><path d="M168,121 C178,117 180,143 168,150 Z" fill="#8A6044"/><path d="M72,121 C62,117 60,143 72,150" fill="none" stroke="${LINE}" stroke-width="1.1" opacity=".7"/><path d="M168,121 C178,117 180,143 168,150" fill="none" stroke="${LINE}" stroke-width="1.1" opacity=".7"/>
    <path d="M66,128 C64,134 65,140 68,144" fill="none" stroke="${LINE}" stroke-width=".7" opacity=".35"/><path d="M174,128 C176,134 175,140 172,144" fill="none" stroke="${LINE}" stroke-width=".7" opacity=".35"/>
    <!--HAIRFRONT--><circle cx="68.6" cy="146.5" r="2.3" fill="${GOLD}"/><circle cx="67.9" cy="145.8" r=".8" fill="#FFF0C8"/><circle cx="171.4" cy="146.5" r="2.3" fill="${GOLD}"/><circle cx="170.7" cy="145.8" r=".8" fill="#FFF0C8"/>
    ${brows}
    ${eye(97.5, false)}${eye(142.5, true)}
    <path d="M115.2,117 C116.6,127 116.6,136 112.4,144.4 C114.2,149.2 119.6,150.4 123.6,148.2" fill="none" stroke="${LINE}" stroke-width="1.6" stroke-linecap="round"/>
    <path d="M112.6,147 C113.6,148.6 115.2,149 116.4,148.2 M123.6,148.2 C125.8,148.6 127.6,147.6 128.4,145.8" fill="none" stroke="${LINE}" stroke-width="1" opacity=".55"/>
    <path d="M108,148 C104,153 102,158 103.5,163 M132,148 C136,153 138,158 136.5,163" fill="none" stroke="${LINE}" stroke-width=".7" opacity="${(0.12 * p.cheek).toFixed(2)}"/>
    ${mouth}
    <circle cx="120" cy="96.5" r="2.2" fill="#7A1F24"/>`;
  const head = `<g transform="rotate(${p.tilt.toFixed(2)} 120 205)">${nape}${hair}${faceArt.replace("<!--HAIRFRONT-->", hairFront)}${rim}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${defs}${bg ? `<rect x="-200" y="-200" width="640" height="700" fill="url(#${u}bg)"/>` : ""}<g transform="rotate(${(p.tilt * 0.35).toFixed(2)} 120 300)">${hairBack}${body}${shoulderLines}</g>${head}</svg>`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = process.argv[2];
  fs.mkdirSync(out, { recursive: true });
  for (const [k, p] of Object.entries(FRAMES)) {
    // the square render matches the painted fronts' framing (hair top near the top edge, shoulders cut by the bottom)
    fs.writeFileSync(`${out}/line-${k}.svg`, portrait(p, { viewBox: "-25 25 290 290", id: "ll" + k }));
  }
  fs.writeFileSync(`${out}/frames.json`, JSON.stringify(FRAMES, null, 1));
  console.log("wrote", Object.keys(FRAMES).length, "frames");
}
