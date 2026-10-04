// Rung 4 of the zero-visible-failure ladder (STUDIO-V2 §8): the BOARD version of the same idea with the same values.
// It is a real artifact (title, up to four lines, one computed figure), drawn on with a cinematic stroke, never an
// error card. It needs nothing but a 2D canvas, so it is the floor that always paints.
import { C, FONT, W, H } from "./tokens.ts";
import { clamp, ease } from "./math.ts";
import { roundRect, type Ctx } from "./draw.ts";

export type BoardFigure =
  | { kind: "numberline"; min: number; max: number; marks: { v: number; label: string }[] }
  | { kind: "bar"; parts: number; shaded: number[] }
  | { kind: "bars"; values: number[]; labels: string[]; line?: number }
  | { kind: "angle"; deg: number }
  | { kind: "grid"; w: number; h: number }
  | { kind: "chain"; items: string[] }
  | { kind: "beam"; left: string; right: string }
  | { kind: "none" };
export interface BoardSpec { title: string; lines: string[]; figure?: BoardFigure; accent?: string }

const clip = (s: unknown, n: number) => String(s ?? "").replace(/[<>{}]/g, "").slice(0, n);
export function sanitizeBoard(b: BoardSpec | null | undefined, fallbackTitle: string): BoardSpec {
  if (!b || typeof b !== "object") return { title: clip(fallbackTitle, 40), lines: [], figure: { kind: "none" } };
  return { title: clip(b.title || fallbackTitle, 40), lines: (Array.isArray(b.lines) ? b.lines : []).slice(0, 4).map((l) => clip(l, 64)), figure: b.figure ?? { kind: "none" }, accent: b.accent };
}

/** Draws the board at progress p ∈ [0, 1] (0 = blank board, 1 = fully drawn). Pure function of p. */
export function drawBoard(ctx: Ctx, b: BoardSpec, p: number): void {
  const acc = b.accent ?? C.ion;
  ctx.fillStyle = "#0E1118"; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(255,255,255,.035)"; ctx.lineWidth = 1;
  for (let x = 40; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 40; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  const seg = (i: number, n: number) => clamp((p * (n + 1) - i), 0, 1);
  const n = 2 + b.lines.length;
  // title (writes on left to right)
  const tp = ease.outCubic(seg(0, n));
  ctx.save();
  ctx.beginPath(); ctx.rect(200, 70, 620 * tp + 1, 90); ctx.clip();
  ctx.font = `800 54px ${FONT.display}`; ctx.fillStyle = C.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(b.title, W / 2, 115, 600);
  ctx.restore();
  ctx.strokeStyle = acc; ctx.lineWidth = 5; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(W / 2 - 120 * tp, 160); ctx.lineTo(W / 2 + 120 * tp, 160); ctx.stroke();
  // figure
  const fp = ease.inOutCubic(seg(1, n));
  if (b.figure && fp > 0) drawFigure(ctx, b.figure, fp, acc);
  // lines
  b.lines.forEach((ln, i) => {
    const lp = ease.outCubic(seg(2 + i, n));
    if (lp <= 0) return;
    ctx.save(); ctx.globalAlpha = lp;
    ctx.font = `600 40px ${FONT.ui}`; ctx.fillStyle = i === 0 ? C.ink : C.ink2; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(ln, W / 2, 440 + i * 50 + (1 - lp) * 10, 820);
    ctx.restore();
  });
}
function drawFigure(ctx: Ctx, f: BoardFigure, p: number, acc: string): void {
  ctx.save();
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  const label = (s: string, x: number, y: number, col: string = C.ink2, size = 40) => { ctx.font = `600 ${size}px ${FONT.mono}`; ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(s, x, y); };
  if (f.kind === "numberline") {
    const x0 = 160, x1 = 840, y = 300, span = (f.max - f.min) || 1, X = (v: number) => x0 + ((v - f.min) / span) * (x1 - x0);
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + (x1 - x0) * p, y); ctx.stroke();
    label(String(f.min), x0, y + 54); if (p > 0.95) label(String(f.max), x1, y + 54);
    f.marks.slice(0, 6).forEach((m, i) => { const k = clamp(p * 2 - 1 - i * 0.12, 0, 1); if (k <= 0) return; ctx.globalAlpha = k; ctx.strokeStyle = acc; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(X(m.v), y - 30); ctx.lineTo(X(m.v), y + 12); ctx.stroke(); label(m.label, X(m.v), y - 62, acc); ctx.globalAlpha = 1; });
  } else if (f.kind === "bar") {
    const x0 = 200, w = 600, y = 250, h = 90, parts = Math.max(1, Math.min(24, f.parts));
    ctx.strokeStyle = C.ink; ctx.lineWidth = 5; roundRect(ctx, x0, y, w * p, h, 10); ctx.stroke();
    for (let i = 0; i < parts; i++) { const k = clamp(p * parts - i, 0, 1); if (f.shaded.includes(i)) { ctx.fillStyle = acc; ctx.globalAlpha = 0.55 * k; ctx.fillRect(x0 + (w / parts) * i + 3, y + 3, (w / parts) - 6, h - 6); ctx.globalAlpha = 1; } if (i > 0 && k > 0) { ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 + (w / parts) * i, y); ctx.lineTo(x0 + (w / parts) * i, y + h * k); ctx.stroke(); } }
  } else if (f.kind === "bars") {
    const vals = f.values.slice(0, 8), max = Math.max(1, ...vals), x0 = 240, bw = 520 / Math.max(1, vals.length), base = 370;
    ctx.strokeStyle = C.ink2; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x0 - 10, base); ctx.lineTo(x0 + 530, base); ctx.stroke();
    vals.forEach((v, i) => { const h = (v / max) * 170 * clamp(p * 1.4 - i * 0.08, 0, 1); ctx.fillStyle = acc; ctx.globalAlpha = 0.8; roundRect(ctx, x0 + i * bw + bw * 0.18, base - h, bw * 0.64, h, 6); ctx.fill(); ctx.globalAlpha = 1; if (f.labels[i]) label(f.labels[i].slice(0, 6), x0 + i * bw + bw / 2, base + 30, C.ink3, 38); });
    if (f.line != null && p > 0.8) { const y = base - (f.line / max) * 170; ctx.setLineDash([12, 10]); ctx.strokeStyle = C.mint; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 - 10, y); ctx.lineTo(x0 + 530, y); ctx.stroke(); ctx.setLineDash([]); }
  } else if (f.kind === "angle") {
    const cx = 420, cy = 360, r = 190, a = (f.deg * Math.PI) / 180 * p;
    ctx.strokeStyle = C.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + r * Math.cos(-a), cy + r * Math.sin(-a)); ctx.stroke();
    ctx.strokeStyle = acc; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, 70, 0, -a, true); ctx.stroke();
    if (p > 0.9) label(`${Math.round(f.deg)}°`, cx + 120 * Math.cos(-a / 2), cy + 120 * Math.sin(-a / 2), acc, 44);
  } else if (f.kind === "grid") {
    const s = 34, gw = Math.min(16, f.w), gh = Math.min(8, f.h), x0 = W / 2 - (gw * s) / 2, y0 = 200;
    for (let i = 0; i < gw * gh; i++) { const k = clamp(p * gw * gh - i, 0, 1); if (k <= 0) break; ctx.fillStyle = acc; ctx.globalAlpha = 0.25 + 0.35 * k; ctx.fillRect(x0 + (i % gw) * s + 2, y0 + Math.floor(i / gw) * s + 2, s - 4, s - 4); }
    ctx.globalAlpha = 1; ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(x0, y0, gw * s, gh * s);
  } else if (f.kind === "chain") {
    const items = f.items.slice(0, 5), gap = 760 / Math.max(1, items.length), y = 300;
    items.forEach((it, i) => { const k = clamp(p * items.length - i, 0, 1); if (k <= 0) return; const x = 120 + gap * i + gap / 2; ctx.globalAlpha = k; label(it.slice(0, 9), x, y, C.ink, 40); if (i < items.length - 1) { ctx.strokeStyle = acc; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 70, y); ctx.lineTo(x + gap - 70, y); ctx.lineTo(x + gap - 86, y - 12); ctx.moveTo(x + gap - 70, y); ctx.lineTo(x + gap - 86, y + 12); ctx.stroke(); } ctx.globalAlpha = 1; });
  } else if (f.kind === "beam") {
    ctx.strokeStyle = C.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(500 - 300 * p, 300); ctx.lineTo(500 + 300 * p, 300); ctx.stroke();
    ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(500, 304); ctx.lineTo(470, 370); ctx.lineTo(530, 370); ctx.closePath(); ctx.fill();
    if (p > 0.6) { label(f.left.slice(0, 16), 310, 250, C.ink, 40); label(f.right.slice(0, 16), 690, 250, C.ink, 40); }
  }
  ctx.restore();
}
