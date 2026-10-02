const W = 360;
const H = 640;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#f7fbff";

const canvas = document.createElement("canvas");
canvas.width = W;
canvas.height = H;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
canvas.style.display = "block";
canvas.style.touchAction = "manipulation";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const buttons = [
  { label: "yes", x: 100, y: 430, w: 140, h: 80, flash: 0 },
  { label: "no", x: 260, y: 430, w: 140, h: 80, flash: 0 },
];

function updateButtonCentersForPage() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = buttons.map((b) => ({
    label: b.label,
    x: r.left + b.x,
    y: r.top + b.y,
  }));
}
updateButtonCentersForPage();
window.addEventListener("resize", updateButtonCentersForPage);
window.addEventListener("scroll", updateButtonCentersForPage, { passive: true });

const ball = {
  x: 70,
  y: 260,
  vx: 70,
  vy: 55,
  r: 28,
  hue: 210,
};

function hitButton(px, py) {
  for (const b of buttons) {
    const left = b.x - b.w / 2;
    const top = b.y - b.h / 2;
    if (px >= left && px <= left + b.w && py >= top && py <= top + b.h) return b;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const b = hitButton(x, y);
  if (!b) return;

  b.flash = 0.2;
  if (typeof window.reportAnswer === "function") {
    window.reportAnswer(b.label);
  }
});

let last = performance.now();

function drawRoundedRect(x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function frame(t) {
  const dt = Math.min(0.05, (t - last) / 1000);
  last = t;

  // Animate decorative ball
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.hue = (ball.hue + 20 * dt) % 360;

  if (ball.x - ball.r < 0) {
    ball.x = ball.r;
    ball.vx *= -1;
  } else if (ball.x + ball.r > W) {
    ball.x = W - ball.r;
    ball.vx *= -1;
  }
  if (ball.y - ball.r < 70) {
    ball.y = 70 + ball.r;
    ball.vy *= -1;
  } else if (ball.y + ball.r > H - 20) {
    ball.y = H - 20 - ball.r;
    ball.vy *= -1;
  }

  // Flash timers
  for (const b of buttons) {
    if (b.flash > 0) b.flash = Math.max(0, b.flash - dt);
  }

  // Background
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#e8f4ff");
  g.addColorStop(1, "#fef6ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Question card
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  drawRoundedRect(20, 32, 320, 130, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(60,90,130,0.2)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#17324a";
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Is 3/4 bigger than 1/2?", W / 2, 74);

  // Decorative ball behind buttons
  const bg = ctx.createRadialGradient(
    ball.x - ball.r * 0.25,
    ball.y - ball.r * 0.25,
    ball.r * 0.2,
    ball.x,
    ball.y,
    ball.r
  );
  bg.addColorStop(0, `hsla(${ball.hue}, 95%, 72%, 0.95)`);
  bg.addColorStop(1, `hsla(${(ball.hue + 55) % 360}, 85%, 52%, 0.9)`);
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Buttons
  for (const b of buttons) {
    const x = b.x - b.w / 2;
    const y = b.y - b.h / 2;
    const flashing = b.flash > 0;
    const base = b.label === "yes" ? "#38c172" : "#ff6b6b";
    const lit = b.label === "yes" ? "#6ee7a1" : "#ff9c9c";

    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    drawRoundedRect(x, y, b.w, b.h, 16);
    ctx.fillStyle = flashing ? lit : base;
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(0,0,0,0.15)";
    ctx.lineWidth = 2;
    drawRoundedRect(x, y, b.w, b.h, 16);
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.label, b.x, b.y + 1);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
