const W = 360;
const H = 640;

// Page/canvas setup: exact 360x640 CSS px at top-left, no scrolling.
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#f4f7ff";

const canvas = document.createElement("canvas");
canvas.width = W;
canvas.height = H;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
canvas.style.position = "fixed";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.display = "block";
canvas.style.touchAction = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// UI layout
const buttons = [
  { label: "yes", x: 30, y: 430, w: 140, h: 80, flashUntil: 0, base: "#57c66a" },
  { label: "no",  x: 190, y: 430, w: 140, h: 80, flashUntil: 0, base: "#ff6f6f" }
];

function updateButtonGlobals() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = buttons.map(b => ({
    label: b.label,
    x: r.left + b.x + b.w / 2,
    y: r.top + b.y + b.h / 2
  }));
}
updateButtonGlobals();
window.addEventListener("resize", updateButtonGlobals);

// Decorative bouncing ball (behind buttons)
const ball = {
  x: 120,
  y: 260,
  r: 28,
  vx: 85, // px/s
  vy: 70, // px/s
  color: "#6aa8ff"
};

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function inButton(px, py, b) {
  return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
}

function tapAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;

  for (const b of buttons) {
    if (inButton(x, y, b)) {
      b.flashUntil = performance.now() + 180;
      if (typeof window.reportAnswer === "function") {
        window.reportAnswer(b.label);
      }
      break;
    }
  }
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  tapAt(e.clientX, e.clientY);
}, { passive: false });

// Animation/render
let last = performance.now();

function draw(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Move ball
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
  if (ball.y - ball.r < 90) { ball.y = 90 + ball.r; ball.vy *= -1; } // keep below question area
  if (ball.y + ball.r > H) { ball.y = H - ball.r; ball.vy *= -1; }

  // Background
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#f8fbff");
  g.addColorStop(1, "#eaf1ff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // Question
  ctx.fillStyle = "#1f2a44";
  ctx.font = "bold 30px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Is 3/4 bigger than 1/2?", W / 2, 44);

  // Decorative ball behind buttons
  const rg = ctx.createRadialGradient(ball.x - ball.r * 0.3, ball.y - ball.r * 0.35, ball.r * 0.2, ball.x, ball.y, ball.r);
  rg.addColorStop(0, "#ffffffcc");
  rg.addColorStop(1, ball.color);
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Buttons
  for (const b of buttons) {
    const flashing = now < b.flashUntil;
    roundRect(ctx, b.x, b.y, b.w, b.h, 18);
    ctx.fillStyle = flashing ? "#ffe66d" : b.base;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1f2a44";
    ctx.stroke();

    ctx.fillStyle = "#10203b";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }

  requestAnimationFrame(draw);
}

requestAnimationFrame(draw);
