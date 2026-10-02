import * as LJS from 'littlejsengine'; // Framework import as requested

const SCREEN_W = 360;
const SCREEN_H = 640;

const GROUND_H = 96;
const PLAYER_SIZE = 32;
const WALK_SPEED = 170;      // px/sec
const GRAVITY = 2200;        // px/sec^2 (downward)

const FLAG_W = 20;
const FLAG_H = 56;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#87ceeb';

const canvas = document.createElement('canvas');
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${SCREEN_W}px`;
canvas.style.height = `${SCREEN_H}px`;
canvas.style.touchAction = 'none';
canvas.style.display = 'block';
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

const player = {
  x: 40,
  y: 40,
  w: PLAYER_SIZE,
  h: PLAYER_SIZE,
  vx: 0,
  vy: 0,
};

const groundTop = SCREEN_H - GROUND_H;
const flag = {
  x: SCREEN_W - 34,
  y: groundTop - FLAG_H / 2,
  w: FLAG_W,
  h: FLAG_H,
};

let heldPointerId = null;
let moveDir = 0; // -1 left, +1 right, 0 none
let won = false;

window.__player = () => ({ x: player.x, y: player.y });

function getDirFromClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  return localX >= rect.width * 0.5 ? 1 : -1;
}

function onPointerDown(e) {
  e.preventDefault();
  if (heldPointerId !== null) return;
  heldPointerId = e.pointerId;
  moveDir = getDirFromClientX(e.clientX);
  canvas.setPointerCapture?.(e.pointerId);
}
function onPointerMove(e) {
  if (e.pointerId !== heldPointerId) return;
  e.preventDefault();
  moveDir = getDirFromClientX(e.clientX);
}
function onPointerUpOrCancel(e) {
  if (e.pointerId !== heldPointerId) return;
  e.preventDefault();
  heldPointerId = null;
  moveDir = 0;
}

canvas.addEventListener('pointerdown', onPointerDown, { passive: false });
canvas.addEventListener('pointermove', onPointerMove, { passive: false });
canvas.addEventListener('pointerup', onPointerUpOrCancel, { passive: false });
canvas.addEventListener('pointercancel', onPointerUpOrCancel, { passive: false });
canvas.addEventListener('pointerleave', onPointerUpOrCancel, { passive: false });

function overlapsAABB(a, b) {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h
  );
}

let lastTime = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000);
  lastTime = now;

  // Update
  player.vx = moveDir * WALK_SPEED;
  player.vy += GRAVITY * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Horizontal bounds
  const halfW = player.w / 2;
  if (player.x < halfW) player.x = halfW;
  if (player.x > SCREEN_W - halfW) player.x = SCREEN_W - halfW;

  // Ground collision (player rests ON ground)
  const playerBottom = player.y + player.h / 2;
  if (playerBottom >= groundTop) {
    player.y = groundTop - player.h / 2;
    player.vy = 0;
  }

  // Win check
  if (!won && overlapsAABB(player, flag)) {
    won = true;
    if (typeof window.reportWin === 'function') window.reportWin();
  }

  // Render
  ctx.clearRect(0, 0, SCREEN_W, SCREEN_H);

  // Sky
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);

  // Ground
  ctx.fillStyle = '#6b4e2e';
  ctx.fillRect(0, groundTop, SCREEN_W, GROUND_H);
  ctx.fillStyle = '#5aa35a';
  ctx.fillRect(0, groundTop, SCREEN_W, 12);

  // Flag pole
  const poleX = flag.x - flag.w * 0.25;
  const poleTop = flag.y - flag.h / 2;
  const poleBottom = groundTop;
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(poleX, poleBottom);
  ctx.lineTo(poleX, poleTop);
  ctx.stroke();

  // Flag cloth
  ctx.fillStyle = won ? '#ffd447' : '#ff3b30';
  ctx.beginPath();
  ctx.moveTo(poleX, poleTop + 6);
  ctx.lineTo(poleX + 24, poleTop + 14);
  ctx.lineTo(poleX, poleTop + 22);
  ctx.closePath();
  ctx.fill();

  // Player
  ctx.fillStyle = '#1e2a78';
  ctx.fillRect(player.x - player.w / 2, player.y - player.h / 2, player.w, player.h);

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
