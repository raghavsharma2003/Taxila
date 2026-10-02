import * as LJS from 'littlejsengine';
void LJS; // Framework imported as requested

const WIDTH = 360;
const HEIGHT = 640;

// ----- Page/canvas setup (exact 360x640 CSS px at top-left) -----
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#87ceeb';

const canvas = document.createElement('canvas');
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.position = 'absolute';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// ----- World -----
const groundHeight = 80;
const groundTop = HEIGHT - groundHeight;

const player = {
  x: 40,
  y: 60,
  half: 16,
  vx: 0,
  vy: 0,
};

const gravity = 1800; // px/s^2
const walkSpeed = 140; // px/s

const flag = {
  x: WIDTH - 34,
  y: groundTop - 72,
  w: 24,
  h: 72,
};

let won = false;

// Expose player center in CSS pixel page coordinates
window.__player = () => ({ x: player.x, y: player.y });

// ----- Input (hold pointer/touch on left/right half) -----
const activePointers = new Map();
let controlX = null;

function refreshControlX() {
  if (!activePointers.size) {
    controlX = null;
    return;
  }
  // Use the most recently updated pointer position
  let latest = null;
  for (const v of activePointers.values()) latest = v;
  controlX = latest;
}

function onPointerDown(e) {
  activePointers.set(e.pointerId, e.clientX);
  refreshControlX();
  e.preventDefault();
}
function onPointerMove(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, e.clientX);
  refreshControlX();
  e.preventDefault();
}
function onPointerUpOrCancel(e) {
  activePointers.delete(e.pointerId);
  refreshControlX();
  e.preventDefault();
}

window.addEventListener('pointerdown', onPointerDown, { passive: false });
window.addEventListener('pointermove', onPointerMove, { passive: false });
window.addEventListener('pointerup', onPointerUpOrCancel, { passive: false });
window.addEventListener('pointercancel', onPointerUpOrCancel, { passive: false });

// ----- Helpers -----
function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

// ----- Game loop -----
let lastTime = performance.now();

function update(dt) {
  // Horizontal control
  let dir = 0;
  if (controlX !== null) dir = controlX >= WIDTH * 0.5 ? 1 : -1;
  player.vx = dir * walkSpeed;

  // Physics
  player.vy += gravity * dt;
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Ground collision
  const feet = player.y + player.half;
  if (feet > groundTop) {
    player.y = groundTop - player.half;
    player.vy = 0;
  }

  // Screen bounds
  if (player.x < player.half) player.x = player.half;
  if (player.x > WIDTH - player.half) player.x = WIDTH - player.half;

  // Flag collision and win callback exactly once
  const px = player.x - player.half;
  const py = player.y - player.half;
  const ps = player.half * 2;
  if (!won && aabbOverlap(px, py, ps, ps, flag.x, flag.y, flag.w, flag.h)) {
    won = true;
    if (typeof window.reportWin === 'function') window.reportWin();
  }
}

function render() {
  // Sky
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground
  ctx.fillStyle = '#5a3d2b';
  ctx.fillRect(0, groundTop, WIDTH, groundHeight);

  // Ground top strip
  ctx.fillStyle = '#6f9c3d';
  ctx.fillRect(0, groundTop, WIDTH, 10);

  // Flag pole
  ctx.fillStyle = '#ddd';
  ctx.fillRect(flag.x + 4, flag.y, 6, flag.h);

  // Flag cloth
  ctx.fillStyle = won ? '#ffd54a' : '#ff3b3b';
  ctx.fillRect(flag.x + 10, flag.y + 6, 14, 10);

  // Player square
  ctx.fillStyle = '#2a3cff';
  ctx.fillRect(player.x - player.half, player.y - player.half, player.half * 2, player.half * 2);
}

function loop(now) {
  const dt = Math.min(1 / 30, (now - lastTime) / 1000);
  lastTime = now;

  update(dt);
  render();

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
