import * as LJS from 'littlejsengine'; // Framework requested

// ----- Page/canvas setup: exact 360x640 CSS px at top-left -----
const GAME_W = 360;
const GAME_H = 640;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#87ceeb';

const canvas = document.createElement('canvas');
canvas.width = GAME_W;
canvas.height = GAME_H;
canvas.style.width = `${GAME_W}px`;
canvas.style.height = `${GAME_H}px`;
canvas.style.position = 'absolute';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.display = 'block';
canvas.style.touchAction = 'none';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// ----- Game state -----
const groundHeight = 96;
const groundTop = GAME_H - groundHeight;

const player = {
  size: 32,
  x: 40,
  y: 80,
  vx: 0,
  vy: 0,
};

const gravity = 1800;
const walkSpeed = 170;

const flag = {
  x: GAME_W - 34,
  y: groundTop - 92,
  w: 24,
  h: 92,
};

let moveDir = 0; // -1 left, 1 right, 0 idle
let pointerActive = false;
let wonReported = false;

// Expose player center in CSS-pixel page coordinates
window.__player = () => {
  const r = canvas.getBoundingClientRect();
  return { x: r.left + player.x, y: r.top + player.y };
};

function updateMoveDirFromClientX(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = clientX - r.left;
  const y = clientY - r.top;
  if (x < 0 || x > GAME_W || y < 0 || y > GAME_H) return;
  moveDir = x >= GAME_W / 2 ? 1 : -1;
}

function onPointerDown(e) {
  pointerActive = true;
  updateMoveDirFromClientX(e.clientX, e.clientY);
  e.preventDefault();
}
function onPointerMove(e) {
  if (!pointerActive) return;
  updateMoveDirFromClientX(e.clientX, e.clientY);
  e.preventDefault();
}
function onPointerUp(e) {
  pointerActive = false;
  moveDir = 0;
  e.preventDefault();
}

canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
window.addEventListener('pointermove', onPointerMove, { passive: false });
window.addEventListener('pointerup', onPointerUp, { passive: false });
window.addEventListener('pointercancel', onPointerUp, { passive: false });

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - lastTime) / 1000);
  lastTime = now;

  // ----- Update -----
  player.vx = moveDir * walkSpeed;
  player.vy += gravity * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  const half = player.size / 2;

  // ground collision (rest ON ground)
  if (player.y + half > groundTop) {
    player.y = groundTop - half;
    player.vy = 0;
  }

  // horizontal clamp to screen
  if (player.x - half < 0) player.x = half;
  if (player.x + half > GAME_W) player.x = GAME_W - half;

  // win check
  const px = player.x - half;
  const py = player.y - half;
  if (!wonReported && aabbOverlap(px, py, player.size, player.size, flag.x, flag.y, flag.w, flag.h)) {
    wonReported = true;
    if (typeof window.reportWin === 'function') window.reportWin();
  }

  // ----- Render -----
  ctx.clearRect(0, 0, GAME_W, GAME_H);

  // sky
  ctx.fillStyle = '#8fd3ff';
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // ground platform
  ctx.fillStyle = '#3f7f3f';
  ctx.fillRect(0, groundTop, GAME_W, groundHeight);

  // flag pole
  ctx.fillStyle = '#dddddd';
  const poleX = flag.x + 4;
  const poleW = 4;
  ctx.fillRect(poleX, flag.y, poleW, flag.h);

  // flag cloth
  ctx.fillStyle = wonReported ? '#ffd700' : '#ff3b3b';
  ctx.beginPath();
  ctx.moveTo(poleX + poleW, flag.y + 6);
  ctx.lineTo(poleX + poleW + 18, flag.y + 14);
  ctx.lineTo(poleX + poleW, flag.y + 22);
  ctx.closePath();
  ctx.fill();

  // player
  ctx.fillStyle = '#1e2a78';
  ctx.fillRect(player.x - half, player.y - half, player.size, player.size);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
