const CSS_W = 360;
const CSS_H = 640;

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#f3f7ff";

const canvas = document.createElement("canvas");
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = `${CSS_W}px`;
canvas.style.height = `${CSS_H}px`;
canvas.style.display = "block";
canvas.style.touchAction = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

function setupCanvas() {
  const dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  canvas.width = Math.round(CSS_W * dpr);
  canvas.height = Math.round(CSS_H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
setupCanvas();

const buttons = [
  { label: "yes", x: 70, y: 360, w: 220, h: 86, flashUntil: 0 },
  { label: "no",  x: 70, y: 480, w: 220, h: 86, flashUntil: 0 },
];

function updateButtonCenters() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = buttons.map((b) => ({
    label: b.label,
    x: r.left + b.x + b.w / 2,
    y: r.top + b.y + b.h / 2,
  }));
}
updateButtonCenters();
window.addEventListener("resize", () => {
  setupCanvas();
  updateButtonCenters();
});

const ball = {
  x: 120,
  y: 260,
  r: 28,
  vx: 110, // px/sec
  vy: 95,  // px/sec
  colorA: "#ff8a80",
  colorB: "#ffd180",
};

function hitButton(px, py) {
  for (const b of buttons) {
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  const b = hitButton(x, y);
  if (!b) return;
  b.flashUntil = performance.now() + 180;
  window.reportAnswer?.(b.label);
});

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Move decorative bouncing ball (behind buttons)
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x + ball.r > CSS_W) { ball.x = CSS_W - ball.r; ball.vx *= -1; }
  if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }
  if (ball.y + ball.r > CSS_H) { ball.y = CSS_H - ball.r; ball.vy *= -1; }

  // Background
  ctx.clearRect(0, 0, CSS_W, CSS_H);
  const g = ctx.createLinearGradient(0, 0, 0, CSS_H);
  g.addColorStop(0, "#eef7ff");
  g.addColorStop(1, "#dfefff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CSS_W, CSS_H);

  // Question
  ctx.fillStyle = "#1a2a44";
  ctx.font = "bold 32px system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Is 3/4 bigger than 1/2?", CSS_W / 2, 80);

  // Decorative ball behind buttons
  const rg = ctx.createRadialGradient(ball.x - 10, ball.y - 12, 8, ball.x, ball.y, ball.r);
  rg.addColorStop(0, ball.colorB);
  rg.addColorStop(1, ball.colorA);
  ctx.fillStyle = rg;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Buttons
  for (const b of buttons) {
    const flashing = now < b.flashUntil;
    ctx.fillStyle = flashing ? "#ffd54f" : "#ffffff";
    ctx.strokeStyle = flashing ? "#ffb300" : "#4b6cb7";
    ctx.lineWidth = 4;
    roundRect(ctx, b.x, b.y, b.w, b.h, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#183153";
    ctx.font = "bold 42px system-ui, -apple-system, Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2);
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function roundRect(c, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}
