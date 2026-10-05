// Vector glyph set for the extension engines (scene-explainer nodes, sort-storm items, town-sim, story-rail ...).
// One closed list (shared/studio-spec-ext/scene.ts GLYPHS): line icons drawn in code on a 100-unit box centred at 0,
// two tones (stroke = ink, fill = accent at low alpha). No bitmaps, no network, crisp at any DPR.
import type { Glyph } from "../../../../shared/studio-spec-ext/scene.ts";
import type { Ctx } from "../../core/draw.ts";

type P = (g: Ctx) => void;
const TAU = Math.PI * 2;
const circ = (g: Ctx, x: number, y: number, r: number) => { g.beginPath(); g.arc(x, y, r, 0, TAU); };
const poly = (g: Ctx, pts: number[], close = true) => { g.beginPath(); g.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) g.lineTo(pts[i], pts[i + 1]); if (close) g.closePath(); };
const line = (g: Ctx, ...pts: number[]) => { poly(g, pts, false); g.stroke(); };
const rr = (g: Ctx, x: number, y: number, w: number, h: number, r: number) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
const fs = (g: Ctx) => { g.fill(); g.stroke(); };

const G: Record<Glyph, P> = {
  sun: (g) => { circ(g, 0, 0, 20); fs(g); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; line(g, Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 42, Math.sin(a) * 42); } },
  moon: (g) => { g.beginPath(); g.arc(0, 0, 34, 0.6, TAU - 0.6, false); g.arc(14, 0, 26, TAU - 1.0, 1.0, true); g.closePath(); fs(g); },
  star: (g) => { const p: number[] = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? 16 : 40; p.push(Math.cos(a) * r, Math.sin(a) * r); } poly(g, p); fs(g); },
  earth: (g) => { circ(g, 0, 0, 38); fs(g); g.beginPath(); g.moveTo(-20, -26); g.bezierCurveTo(-4, -18, -26, -2, -8, 4); g.bezierCurveTo(4, 10, -4, 22, 6, 30); g.stroke(); g.beginPath(); g.moveTo(14, -30); g.bezierCurveTo(26, -16, 12, -8, 30, 2); g.stroke(); },
  cloud: (g) => { g.beginPath(); g.moveTo(-34, 18); g.arc(-22, 4, 16, Math.PI / 2, -Math.PI / 2 + 0.3); g.arc(0, -8, 22, Math.PI + 0.4, -0.3); g.arc(24, 4, 16, -Math.PI / 2 - 0.3, Math.PI / 2); g.closePath(); fs(g); },
  rain: (g) => { g.beginPath(); g.moveTo(-34, 4); g.arc(-22, -8, 14, Math.PI / 2, -Math.PI / 2 + 0.3); g.arc(0, -18, 19, Math.PI + 0.4, -0.3); g.arc(22, -8, 14, -Math.PI / 2 - 0.3, Math.PI / 2); g.closePath(); fs(g); for (const x of [-20, 0, 20]) line(g, x, 16, x - 6, 36); },
  drop: (g) => { g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(10, -22, 28, -2, 28, 14); g.arc(0, 14, 28, 0, Math.PI); g.bezierCurveTo(-28, -2, -10, -22, 0, -40); g.closePath(); fs(g); },
  wave: (g) => { for (const y of [-16, 2, 20]) { g.beginPath(); for (let x = -40; x <= 40; x += 4) { const yy = y + Math.sin(x / 8) * 6; if (x === -40) g.moveTo(x, yy); else g.lineTo(x, yy); } g.stroke(); } },
  mountain: (g) => { poly(g, [-44, 32, -12, -26, 4, -4, 18, -30, 44, 32]); fs(g); line(g, -20, -12, -12, -26, -4, -12); },
  river: (g) => { g.beginPath(); g.moveTo(-30, -40); g.bezierCurveTo(20, -20, -30, 10, 10, 40); g.stroke(); g.beginPath(); g.moveTo(-14, -40); g.bezierCurveTo(36, -20, -14, 10, 26, 40); g.stroke(); },
  tree: (g) => { rr(g, -6, 6, 12, 34, 3); fs(g); circ(g, 0, -12, 26); fs(g); },
  leaf: (g) => { g.beginPath(); g.moveTo(-34, 30); g.bezierCurveTo(-34, -20, 10, -40, 36, -34); g.bezierCurveTo(30, 0, 10, 30, -34, 30); g.closePath(); fs(g); line(g, -34, 30, 20, -20); },
  seed: (g) => { g.beginPath(); g.ellipse(0, 6, 22, 30, 0.4, 0, TAU); fs(g); g.beginPath(); g.moveTo(-6, -20); g.bezierCurveTo(-2, -34, 12, -38, 18, -40); g.stroke(); },
  flower: (g) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; circ(g, Math.cos(a) * 18, Math.sin(a) * 18 - 8, 12); fs(g); } circ(g, 0, -8, 9); fs(g); line(g, 0, 14, 0, 42); },
  fish: (g) => { g.beginPath(); g.moveTo(-30, 0); g.bezierCurveTo(-10, -26, 20, -22, 30, 0); g.bezierCurveTo(20, 22, -10, 26, -30, 0); g.closePath(); fs(g); poly(g, [30, 0, 44, -14, 44, 14]); fs(g); circ(g, -14, -4, 3); g.stroke(); },
  bird: (g) => { g.beginPath(); g.moveTo(-40, -6); g.quadraticCurveTo(-20, -26, 0, -2); g.quadraticCurveTo(20, -26, 40, -6); g.stroke(); g.beginPath(); g.ellipse(0, 6, 12, 8, 0, 0, TAU); fs(g); },
  cow: (g) => { rr(g, -30, -8, 50, 30, 10); fs(g); rr(g, 16, -22, 24, 20, 8); fs(g); for (const x of [-24, -12, 4, 14]) line(g, x, 22, x, 38); line(g, 18, -22, 14, -32); line(g, 36, -22, 40, -32); },
  insect: (g) => { g.beginPath(); g.ellipse(0, 8, 14, 22, 0, 0, TAU); fs(g); circ(g, 0, -22, 9); fs(g); for (const s of [-1, 1]) { line(g, 0, 0, 30 * s, -10); line(g, 0, 8, 32 * s, 8); line(g, 0, 16, 30 * s, 28); line(g, -3 * s, -30, -14 * s, -42); } },
  person: (g) => { circ(g, 0, -24, 13); fs(g); g.beginPath(); g.moveTo(-24, 40); g.quadraticCurveTo(-24, -4, 0, -4); g.quadraticCurveTo(24, -4, 24, 40); g.closePath(); fs(g); },
  group: (g) => { for (const [x, s] of [[-22, 0.8], [22, 0.8], [0, 1]] as [number, number][]) { g.save(); g.translate(x, s < 1 ? 4 : 0); g.scale(s, s); circ(g, 0, -24, 12); fs(g); g.beginPath(); g.moveTo(-20, 38); g.quadraticCurveTo(-20, -4, 0, -4); g.quadraticCurveTo(20, -4, 20, 38); g.closePath(); fs(g); g.restore(); } },
  house: (g) => { poly(g, [-36, -2, 0, -34, 36, -2]); fs(g); rr(g, -28, -2, 56, 38, 2); fs(g); rr(g, -8, 14, 16, 22, 2); g.stroke(); },
  school: (g) => { rr(g, -40, -4, 80, 40, 2); fs(g); poly(g, [-44, -4, 0, -30, 44, -4]); fs(g); line(g, 0, -30, 0, -44, 14, -40, 0, -36); for (const x of [-26, -10, 10, 26]) { rr(g, x - 5, 6, 10, 12, 1); g.stroke(); } },
  shop: (g) => { rr(g, -36, -6, 72, 42, 2); fs(g); g.beginPath(); for (let i = 0; i < 4; i++) { g.moveTo(-40 + i * 20, -24); g.arc(-30 + i * 20, -24, 10, Math.PI, 0, true); } g.stroke(); line(g, -40, -24, 40, -24); rr(g, -12, 12, 24, 24, 2); g.stroke(); },
  factory: (g) => { poly(g, [-40, 36, -40, -6, -20, 6, -20, -6, 0, 6, 0, -6, 20, 6, 20, -30, 34, -30, 34, 36]); fs(g); for (const x of [-28, -8, 12]) { rr(g, x, 16, 10, 10, 1); g.stroke(); } },
  wheat: (g) => { line(g, 0, 40, 0, -36); for (let i = 0; i < 4; i++) { const y = -26 + i * 13; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(9 * s, y, 9, 5, s * 0.6, 0, TAU); g.fill(); g.stroke(); } } },
  coin: (g) => { circ(g, 0, 0, 34); fs(g); circ(g, 0, 0, 24); g.stroke(); line(g, -10, -10, 12, -10); line(g, -10, -2, 12, -2); g.beginPath(); g.moveTo(-6, -10); g.bezierCurveTo(12, -10, 12, 6, -8, 6); g.lineTo(10, 18); g.stroke(); },
  note: (g) => { rr(g, -42, -22, 84, 44, 5); fs(g); circ(g, 0, 0, 12); g.stroke(); line(g, -32, -12, -22, -12); line(g, 22, 12, 32, 12); },
  book: (g) => { g.beginPath(); g.moveTo(0, -24); g.quadraticCurveTo(-20, -34, -40, -26); g.lineTo(-40, 30); g.quadraticCurveTo(-20, 22, 0, 32); g.quadraticCurveTo(20, 22, 40, 30); g.lineTo(40, -26); g.quadraticCurveTo(20, -34, 0, -24); g.closePath(); fs(g); line(g, 0, -24, 0, 32); },
  scroll: (g) => { rr(g, -30, -30, 60, 60, 4); fs(g); for (const y of [-30, 30]) { g.beginPath(); g.ellipse(0, y, 36, 7, 0, 0, TAU); g.fill(); g.stroke(); } for (const y of [-12, 0, 12]) line(g, -18, y, 18, y); },
  pen: (g) => { g.save(); g.rotate(-0.7); rr(g, -8, -40, 16, 62, 3); fs(g); poly(g, [-8, 22, 8, 22, 0, 40]); fs(g); g.restore(); },
  crown: (g) => { poly(g, [-36, 24, -40, -20, -18, 0, 0, -30, 18, 0, 40, -20, 36, 24]); fs(g); line(g, -36, 34, 36, 34); },
  temple: (g) => { poly(g, [-38, 36, -38, 6, -22, 6, -22, -8, -10, -8, 0, -40, 10, -8, 22, -8, 22, 6, 38, 6, 38, 36]); fs(g); rr(g, -8, 14, 16, 22, 6); g.stroke(); },
  pillar: (g) => { rr(g, -30, -36, 60, 10, 2); fs(g); rr(g, -30, 26, 60, 10, 2); fs(g); for (const x of [-18, -6, 6, 18]) line(g, x, -26, x, 26); circ(g, 0, -46, 8); fs(g); },
  wheel: (g) => { circ(g, 0, 0, 36); fs(g); circ(g, 0, 0, 6); g.stroke(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(g, Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 36, Math.sin(a) * 36); } },
  train: (g) => { rr(g, -40, -24, 64, 40, 6); fs(g); rr(g, 24, -8, 16, 24, 3); fs(g); for (const x of [-26, -6, 14]) { circ(g, x, 22, 8); fs(g); } rr(g, -32, -16, 18, 14, 2); g.stroke(); rr(g, -8, -16, 18, 14, 2); g.stroke(); },
  ship: (g) => { poly(g, [-42, 6, 42, 6, 28, 30, -30, 30]); fs(g); line(g, 0, 6, 0, -38); poly(g, [2, -36, 30, -4, 2, -4]); fs(g); },
  car: (g) => { g.beginPath(); g.moveTo(-42, 18); g.lineTo(-42, 2); g.lineTo(-24, -2); g.lineTo(-12, -20); g.lineTo(16, -20); g.lineTo(30, -2); g.lineTo(42, 2); g.lineTo(42, 18); g.closePath(); fs(g); for (const x of [-24, 24]) { circ(g, x, 20, 9); fs(g); } },
  fire: (g) => { g.beginPath(); g.moveTo(0, 40); g.bezierCurveTo(-34, 36, -30, 0, -8, -20); g.bezierCurveTo(-8, -4, 2, 0, 4, -10); g.bezierCurveTo(6, -24, 2, -34, 6, -42); g.bezierCurveTo(30, -20, 34, 30, 0, 40); g.closePath(); fs(g); },
  magnet: (g) => { g.beginPath(); g.moveTo(-30, -36); g.lineTo(-30, 6); g.arc(0, 6, 30, Math.PI, 0, true); g.lineTo(30, -36); g.lineTo(14, -36); g.lineTo(14, 6); g.arc(0, 6, 14, 0, Math.PI, false); g.lineTo(-14, -36); g.closePath(); fs(g); line(g, -30, -22, -14, -22); line(g, 14, -22, 30, -22); },
  bulb: (g) => { g.beginPath(); g.arc(0, -10, 26, Math.PI * 0.8, Math.PI * 0.2); g.lineTo(10, 18); g.lineTo(-10, 18); g.closePath(); fs(g); rr(g, -10, 18, 20, 14, 3); g.stroke(); line(g, -6, 6, 0, -4, 6, 6); },
  battery: (g) => { rr(g, -34, -18, 64, 36, 5); fs(g); rr(g, 30, -8, 8, 16, 2); fs(g); line(g, -20, 0, -8, 0); line(g, 8, 0, 20, 0); line(g, 14, -6, 14, 6); },
  thermometer: (g) => { rr(g, -8, -40, 16, 58, 8); g.stroke(); circ(g, 0, 26, 14); fs(g); line(g, 0, 20, 0, -18); for (const y of [-30, -18, -6, 6]) line(g, 10, y, 18, y); },
  clock: (g) => { circ(g, 0, 0, 36); fs(g); line(g, 0, 0, 0, -22); line(g, 0, 0, 16, 8); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; line(g, Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 36, Math.sin(a) * 36); } },
  globe: (g) => { circ(g, 0, 0, 36); fs(g); g.beginPath(); g.ellipse(0, 0, 16, 36, 0, 0, TAU); g.stroke(); line(g, -36, 0, 36, 0); line(g, -30, -18, 30, -18); line(g, -30, 18, 30, 18); },
  compass: (g) => { circ(g, 0, 0, 36); fs(g); poly(g, [0, -30, 8, 0, 0, 30, -8, 0]); g.stroke(); poly(g, [0, -30, 8, 0, -8, 0]); g.fill(); },
  balance: (g) => { line(g, 0, -34, 0, 34); line(g, -24, 34, 24, 34); line(g, -36, -24, 36, -24); for (const s of [-1, 1]) { line(g, 36 * s, -24, 24 * s, 4); line(g, 36 * s, -24, 48 * s, 4); g.beginPath(); g.arc(36 * s, 4, 13, 0, Math.PI); g.closePath(); fs(g); } },
  jug: (g) => { g.beginPath(); g.moveTo(-22, -34); g.lineTo(22, -34); g.lineTo(26, 36); g.lineTo(-26, 36); g.closePath(); fs(g); g.beginPath(); g.moveTo(22, -24); g.quadraticCurveTo(44, -20, 24, 10); g.stroke(); for (const y of [-14, 2, 18]) line(g, -24, y, -12, y); },
  ruler: (g) => { g.save(); g.rotate(-0.4); rr(g, -44, -12, 88, 24, 3); fs(g); for (let x = -36; x <= 36; x += 9) line(g, x, -12, x, x % 18 === 0 ? 2 : -4); g.restore(); },
  beaker: (g) => { g.beginPath(); g.moveTo(-22, -38); g.lineTo(-22, 26); g.quadraticCurveTo(-22, 36, -12, 36); g.lineTo(12, 36); g.quadraticCurveTo(22, 36, 22, 26); g.lineTo(22, -38); g.stroke(); rr(g, -20, 0, 40, 34, 8); g.fill(); line(g, -30, -38, 30, -38); },
  gear: (g) => { g.beginPath(); for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU, r = i % 2 ? 26 : 36; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); fs(g); circ(g, 0, 0, 10); g.stroke(); },
  lungs: (g) => { line(g, 0, -40, 0, -6); for (const s of [-1, 1]) { g.beginPath(); g.moveTo(4 * s, -16); g.bezierCurveTo(34 * s, -40, 44 * s, 20, 30 * s, 34); g.quadraticCurveTo(10 * s, 40, 6 * s, 20); g.closePath(); fs(g); } },
  stomach: (g) => { g.beginPath(); g.moveTo(-14, -40); g.lineTo(-14, -18); g.bezierCurveTo(-44, -10, -34, 40, 8, 30); g.bezierCurveTo(36, 22, 34, -10, 14, -20); g.bezierCurveTo(4, -24, -2, -16, -2, -40); g.closePath(); fs(g); },
  eye: (g) => { g.beginPath(); g.moveTo(-42, 0); g.quadraticCurveTo(0, -34, 42, 0); g.quadraticCurveTo(0, 34, -42, 0); g.closePath(); fs(g); circ(g, 0, 0, 13); g.stroke(); },
  hand: (g) => { rr(g, -22, -6, 40, 44, 10); fs(g); for (let i = 0; i < 4; i++) { rr(g, -22 + i * 10, -36, 9, 34, 4); fs(g); } rr(g, 14, 2, 22, 10, 5); fs(g); },
  plate: (g) => { g.beginPath(); g.ellipse(0, 6, 44, 24, 0, 0, TAU); fs(g); g.beginPath(); g.ellipse(0, 4, 30, 15, 0, 0, TAU); g.stroke(); },
  apple: (g) => { g.beginPath(); g.moveTo(0, -18); g.bezierCurveTo(30, -36, 46, 0, 22, 34); g.quadraticCurveTo(0, 42, -22, 34); g.bezierCurveTo(-46, 0, -30, -36, 0, -18); g.closePath(); fs(g); line(g, 0, -18, 6, -38); },
  recycle: (g) => { for (let i = 0; i < 3; i++) { g.save(); g.rotate((i / 3) * TAU); g.beginPath(); g.arc(0, 0, 30, -1.9, -0.6); g.stroke(); const a = -0.6; poly(g, [Math.cos(a) * 30 - 4, Math.sin(a) * 30 - 10, Math.cos(a) * 30 + 10, Math.sin(a) * 30, Math.cos(a) * 30 - 8, Math.sin(a) * 30 + 8]); g.fill(); g.restore(); } },
  phone: (g) => { rr(g, -20, -40, 40, 80, 8); fs(g); rr(g, -14, -30, 28, 52, 2); g.stroke(); circ(g, 0, 32, 3); g.stroke(); },
  letter: (g) => { rr(g, -40, -26, 80, 52, 4); fs(g); line(g, -40, -26, 0, 4, 40, -26); },
  music: (g) => { line(g, -14, 26, -14, -30, 26, -38, 26, 18); g.beginPath(); g.ellipse(-22, 26, 10, 8, -0.3, 0, TAU); fs(g); g.beginPath(); g.ellipse(18, 18, 10, 8, -0.3, 0, TAU); fs(g); },
  lightning: (g) => { poly(g, [8, -42, -22, 6, 0, 6, -8, 42, 24, -8, 2, -8]); fs(g); },
  wind: (g) => { g.beginPath(); g.moveTo(-40, -12); g.lineTo(14, -12); g.arc(14, -22, 10, Math.PI / 2, -Math.PI, true); g.stroke(); g.beginPath(); g.moveTo(-40, 4); g.lineTo(26, 4); g.arc(26, 16, 12, -Math.PI / 2, Math.PI, false); g.stroke(); line(g, -30, 20, 0, 20); },
  shield: (g) => { g.beginPath(); g.moveTo(0, -40); g.lineTo(34, -26); g.quadraticCurveTo(34, 20, 0, 40); g.quadraticCurveTo(-34, 20, -34, -26); g.closePath(); fs(g); },
  ballot: (g) => { rr(g, -34, -6, 68, 42, 4); fs(g); line(g, -14, -6, 14, -6); rr(g, -14, -38, 28, 30, 2); g.stroke(); line(g, -6, -22, -1, -16, 8, -30); },
  bank: (g) => { poly(g, [-42, -14, 0, -38, 42, -14]); fs(g); for (const x of [-30, -12, 6, 24]) { rr(g, x, -10, 8, 36, 1); g.stroke(); } line(g, -42, 30, 42, 30); line(g, -38, 36, 38, 36); },
  road: (g) => { poly(g, [-14, -40, 14, -40, 40, 40, -40, 40]); fs(g); for (const y of [-30, -8, 16]) line(g, 0, y, 0, y + 12); },
  tap: (g) => { rr(g, -40, -24, 50, 16, 4); fs(g); rr(g, -4, -24, 16, 34, 4); fs(g); line(g, -26, -24, -26, -36); line(g, -34, -36, -18, -36); g.beginPath(); g.moveTo(4, 18); g.quadraticCurveTo(10, 28, 4, 34); g.quadraticCurveTo(-2, 28, 4, 18); fs(g); },
  pot: (g) => { g.beginPath(); g.moveTo(-28, 0); g.lineTo(28, 0); g.lineTo(20, 38); g.lineTo(-20, 38); g.closePath(); fs(g); line(g, 0, 0, 0, -22); g.beginPath(); g.ellipse(-12, -26, 12, 6, -0.5, 0, TAU); fs(g); g.beginPath(); g.ellipse(12, -30, 12, 6, 0.5, 0, TAU); fs(g); },
  question: (g) => { circ(g, 0, 0, 38); fs(g); g.beginPath(); g.arc(0, -10, 12, Math.PI, Math.PI * 0.35); g.quadraticCurveTo(0, 2, 0, 10); g.stroke(); circ(g, 0, 22, 2.5); g.stroke(); },
  spark: (g) => { for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + Math.PI / 4; line(g, Math.cos(a) * 10, Math.sin(a) * 10, Math.cos(a) * 26, Math.sin(a) * 26); } poly(g, [0, -40, 8, -8, 40, 0, 8, 8, 0, 40, -8, 8, -40, 0, -8, -8]); fs(g); },
  atom: (g) => { circ(g, 0, 0, 7); fs(g); for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, 0, 40, 14, (i / 3) * Math.PI, 0, TAU); g.stroke(); } },
  mirror: (g) => { rr(g, -26, -40, 52, 66, 26); fs(g); line(g, -10, -26, -18, -8); line(g, 0, -28, -16, 4); line(g, 0, 26, 0, 40); line(g, -16, 40, 16, 40); },
  torch: (g) => { rr(g, -40, -10, 40, 20, 4); fs(g); poly(g, [0, -16, 14, -22, 14, 22, 0, 16]); fs(g); for (const a of [-0.35, 0, 0.35]) line(g, 20, 0, 20 + Math.cos(a) * 24, Math.sin(a) * 24); },
  map: (g) => { poly(g, [-40, -28, -14, -36, 14, -28, 40, -36, 40, 30, 14, 38, -14, 30, -40, 38]); fs(g); line(g, -14, -36, -14, 30); line(g, 14, -28, 14, 38); },
  pick: (g) => { line(g, -30, 34, 18, -14); g.beginPath(); g.moveTo(-6, -36); g.quadraticCurveTo(26, -34, 40, -2); g.stroke(); },
  boat: (g) => { poly(g, [-40, 0, 40, 0, 26, 24, -26, 24]); fs(g); poly(g, [-4, -40, -4, -4, -30, -4]); fs(g); poly(g, [2, -30, 2, -4, 24, -4]); fs(g); },
};
/** Draw a glyph centred at (x, y) with box size `size` (world units). */
export function drawGlyph(ctx: Ctx, name: Glyph, x: number, y: number, size: number, stroke: string, fill: string, alpha = 1): void {
  const f = G[name]; if (!f) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); const k = size / 100; ctx.scale(k, k);
  ctx.lineWidth = k < 0.7 ? 6.5 : 5.2; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = stroke; ctx.fillStyle = fill;
  try { f(ctx); } finally { ctx.restore(); }
}
