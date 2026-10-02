const W = 360;
const H = 640;

// Page/canvas setup
document.documentElement.style.margin = "0";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#f4f8ff";

const canvas = document.createElement("canvas");
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
canvas.style.display = "block";
canvas.style.touchAction = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

let dpr = 1;
function sizeCanvas() {
  dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  updateButtonCenters();
}
window.addEventListener("resize", sizeCanvas);

// UI layout
const question = "Is 3/4 bigger than 1/2?";
const buttons = [
  { label: "yes", x: 50, y: 330, w: 260, h: 90, flashUntil: 0 },
  { label: "no",  x: 50, y: 455, w: 260, h: 90, flashUntil: 0 }
];

function updateButtonCenters() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = buttons.map(b => ({
    label: b.label,
    x: r.left + b.x + b.w / 2,
    y: r.top + b.y + b.h / 2
  }));
}

// Decorative bouncing ball (behind buttons)
const ball = {
  x: 120,
  y: 260,
  r: 30,
  vx: 115, // px/s
  vy: 90,
  color: "#ff8a65"
};

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

function draw(nowMs) {
  const now = nowMs / 1000;

  // Background
  ctx.fillStyle = "#eef6ff";
  ctx.fillRect(0, 0, W, H);

  // Question
  ctx.fillStyle = "#1d2a44";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "bold 32px system-ui, sans-serif";
  ctx.fillText(question, W / 2, 58);

  // Ball behind buttons
  ctx.save();
  ctx.globalAlpha = 0.85;
  const grad = ctx.createRadialGradient(
    ball.x - ball.r * 0.35, ball.y - ball.r * 0.35, ball.r * 0.2,
    ball.x, ball.y, ball.r
  );
  grad.addColorStop(0, "#ffd180");
  grad.addColorStop(1, ball.color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Buttons (on top)
  for (const b of buttons) {
    const flashing = performance.now() < b.flashUntil;
    const base = b.label === "yes" ? "#48c774" : "#ff6b6b";
    const flash = b.label === "yes" ? "#8df0af" : "#ff9a9a";
    ctx.fillStyle = flashing ? flash : base;
    roundRect(ctx, b.x, b.y, b.w, b.h, 18);
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    roundRect(ctx, b.x, b.y, b.w, b.h, 18);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 44px system-ui, sans-serif";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 2);
  }
}

let last = performance.now();
function tick(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;

  // Move/ bounce ball
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
  if (ball.y - ball.r < 0) { ball.y = ball.r; ball.vy *= -1; }
  if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy *= -1; }

  draw(t);
  requestAnimationFrame(tick);
}

function hitButton(px, py) {
  for (const b of buttons) {
    if (px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h) return b;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const b = hitButton(x, y);
  if (!b) return;
  b.flashUntil = performance.now() + 180;
  window.reportAnswer(b.label);
}, { passive: false });

window.addEventListener("scroll", updateButtonCenters, { passive: true });

sizeCanvas();
requestAnimationFrame(tick);
