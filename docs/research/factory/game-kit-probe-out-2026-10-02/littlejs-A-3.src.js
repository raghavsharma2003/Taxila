import * as LJS from 'littlejsengine';
void LJS;

const WIDTH = 360;
const HEIGHT = 640;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f4f8ff';

const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.display = 'block';
canvas.style.touchAction = 'none';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

function resizeCanvas() {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.round(WIDTH * dpr);
  canvas.height = Math.round(HEIGHT * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
resizeCanvas();

const buttons = [
  { label: 'yes', x: 100, y: 430, w: 140, h: 80, flash: 0 },
  { label: 'no',  x: 260, y: 430, w: 140, h: 80, flash: 0 },
];

function updateButtonGlobals() {
  const rect = canvas.getBoundingClientRect();
  window.__buttons = buttons.map(b => ({
    label: b.label,
    x: rect.left + b.x,
    y: rect.top + b.y,
  }));
}
updateButtonGlobals();

window.addEventListener('resize', () => {
  resizeCanvas();
  updateButtonGlobals();
});
window.addEventListener('scroll', updateButtonGlobals, { passive: true });

const ball = {
  x: 180,
  y: 260,
  r: 30,
  vx: 78,
  vy: 62,
  hue: 205,
};

function pointInButton(px, py, b) {
  return (
    px >= b.x - b.w / 2 &&
    px <= b.x + b.w / 2 &&
    py >= b.y - b.h / 2 &&
    py <= b.y + b.h / 2
  );
}

function report(label) {
  if (typeof window.reportAnswer === 'function') {
    window.reportAnswer(label);
  }
}

function pressAt(x, y) {
  for (const b of buttons) {
    if (pointInButton(x, y, b)) {
      b.flash = 0.2;
      report(b.label);
      return true;
    }
  }
  return false;
}

function getCanvasPointFromEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = e.clientX ?? 0;
  const cy = e.clientY ?? 0;
  return {
    x: ((cx - rect.left) / rect.width) * WIDTH,
    y: ((cy - rect.top) / rect.height) * HEIGHT,
  };
}

canvas.addEventListener('pointerdown', (e) => {
  const p = getCanvasPointFromEvent(e);
  if (pressAt(p.x, p.y)) e.preventDefault();
}, { passive: false });

let lastTime = performance.now();

function update(dt) {
  // Decorative bouncing ball (behind UI)
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.hue = (ball.hue + 18 * dt) % 360;

  if (ball.x - ball.r < 0) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x + ball.r > WIDTH) { ball.x = WIDTH - ball.r; ball.vx *= -1; }
  if (ball.y - ball.r < 120) { ball.y = 120 + ball.r; ball.vy *= -1; }
  if (ball.y + ball.r > HEIGHT) { ball.y = HEIGHT - ball.r; ball.vy *= -1; }

  for (const b of buttons) b.flash = Math.max(0, b.flash - dt);
}

function drawButton(b) {
  const flash = b.flash > 0 ? 1 : 0;
  const base = b.label === 'yes' ? [74, 180, 96] : [220, 86, 86];
  const hi = b.label === 'yes' ? [130, 230, 145] : [255, 150, 150];
  const c = [
    Math.round(base[0] * (1 - flash) + hi[0] * flash),
    Math.round(base[1] * (1 - flash) + hi[1] * flash),
    Math.round(base[2] * (1 - flash) + hi[2] * flash),
  ];

  const x = b.x - b.w / 2;
  const y = b.y - b.h / 2;

  ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
  ctx.strokeStyle = '#1c1c1c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(x, y, b.w, b.h, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.x, b.y + 1);
}

function render() {
  // Background
  ctx.fillStyle = '#eef6ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Question
  ctx.fillStyle = '#1f2a44';
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Is 3/4 bigger than 1/2?', WIDTH / 2, 52);

  // Decorative bouncing ball (drawn behind buttons)
  const grad = ctx.createRadialGradient(
    ball.x - ball.r * 0.3, ball.y - ball.r * 0.3, ball.r * 0.2,
    ball.x, ball.y, ball.r
  );
  grad.addColorStop(0, `hsl(${ball.hue}, 95%, 80%)`);
  grad.addColorStop(1, `hsl(${ball.hue}, 80%, 50%)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Buttons on top
  for (const b of buttons) drawButton(b);
}

function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
