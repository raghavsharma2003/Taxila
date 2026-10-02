import * as LJS from 'littlejsengine';
void LJS; // Framework is available; this module uses a custom canvas scene.

const W = 360;
const H = 640;

// Page/canvas layout: exact 360x640 CSS pixels at top-left, no scrolling.
document.documentElement.style.margin = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f3f7ff';

const canvas = document.createElement('canvas');
canvas.width = W;   // 1:1 logical pixels (no scaling)
canvas.height = H;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
canvas.style.display = 'block';
canvas.style.touchAction = 'manipulation';
canvas.style.userSelect = 'none';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Quiz UI layout
const buttons = [
  { label: 'yes', x: 100, y: 430, w: 140, h: 80, flashUntil: 0 },
  { label: 'no',  x: 260, y: 430, w: 140, h: 80, flashUntil: 0 },
];

function publishButtonCenters() {
  const rect = canvas.getBoundingClientRect();
  window.__buttons = buttons.map(b => ({
    label: b.label,
    x: rect.left + b.x,
    y: rect.top + b.y,
  }));
}
publishButtonCenters();
window.addEventListener('resize', publishButtonCenters);

// Decorative bouncing ball (drawn behind buttons)
const ball = {
  x: 80,
  y: 250,
  r: 26,
  vx: 95,
  vy: 70,
  hue: 210,
};

function roundedRectPath(c, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

function insideButton(px, py, b) {
  return (
    px >= b.x - b.w / 2 &&
    px <= b.x + b.w / 2 &&
    py >= b.y - b.h / 2 &&
    py <= b.y + b.h / 2
  );
}

function handleTap(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left;
  const y = clientY - rect.top;

  for (const b of buttons) {
    if (insideButton(x, y, b)) {
      b.flashUntil = performance.now() + 180;
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(b.label);
      }
      break;
    }
  }
}

canvas.addEventListener('pointerdown', (e) => {
  handleTap(e.clientX, e.clientY);
}, { passive: true });

// Animation
let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  // Update ball motion
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.hue = (ball.hue + 20 * dt) % 360;

  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x + ball.r > W) { ball.x = W - ball.r; ball.vx *= -1; }
  if (ball.y - ball.r < 120) { ball.y = 120 + ball.r; ball.vy *= -1; } // keep near middle/lower
  if (ball.y + ball.r > H - 40) { ball.y = H - 40 - ball.r; ball.vy *= -1; }

  // Draw background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#eaf5ff');
  bg.addColorStop(1, '#d7ebff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Question text
  ctx.fillStyle = '#1c2a4a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillText('Is 3/4 bigger than 1/2?', W / 2, 90);

  // Decorative ball (behind buttons)
  ctx.save();
  ctx.globalAlpha = 0.85;
  const rg = ctx.createRadialGradient(ball.x - 8, ball.y - 10, 4, ball.x, ball.y, ball.r);
  rg.addColorStop(0, `hsl(${ball.hue}, 90%, 78%)`);
  rg.addColorStop(1, `hsl(${(ball.hue + 35) % 360}, 85%, 48%)`);
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Buttons
  for (const b of buttons) {
    const isFlash = now < b.flashUntil;
    const x = b.x - b.w / 2;
    const y = b.y - b.h / 2;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    roundedRectPath(ctx, x, y + 4, b.w, b.h, 18);
    ctx.fill();

    // Face
    ctx.fillStyle = isFlash ? '#ffe37a' : '#ffffff';
    roundedRectPath(ctx, x, y, b.w, b.h, 18);
    ctx.fill();

    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = isFlash ? '#f2b705' : '#2f4f7f';
    roundedRectPath(ctx, x, y, b.w, b.h, 18);
    ctx.stroke();

    // Label
    ctx.fillStyle = '#1d2b4f';
    ctx.font = 'bold 40px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.label, b.x, b.y + 1);
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
