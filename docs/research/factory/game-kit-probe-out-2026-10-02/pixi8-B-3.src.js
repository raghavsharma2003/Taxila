import { Application, Graphics } from 'pixi.js';

const WIDTH = 360;
const HEIGHT = 640;

const GROUND_H = 88;
const GROUND_Y = HEIGHT - GROUND_H;

const PLAYER_SIZE = 32;
const MOVE_SPEED = 170; // px/s
const GRAVITY = 1700; // px/s^2

const FLAG_X = WIDTH - 44;
const FLAG_TOP = GROUND_Y - 92;
const FLAG_POLE_W = 4;
const FLAG_BANNER_W = 22;
const FLAG_BANNER_H = 14;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.documentElement.style.touchAction = 'none';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';

const app = new Application();
await app.init({
  width: WIDTH,
  height: HEIGHT,
  background: 0x8ec9ff,
  antialias: false,
  resolution: 1,
  autoDensity: false,
});

const canvas = app.canvas;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.display = 'block';
canvas.style.touchAction = 'none';

document.body.appendChild(canvas);

// Ground
const ground = new Graphics().rect(0, GROUND_Y, WIDTH, GROUND_H).fill(0x2f7d32);
app.stage.addChild(ground);

// Flag
const flagPole = new Graphics().rect(FLAG_X, FLAG_TOP, FLAG_POLE_W, GROUND_Y - FLAG_TOP).fill(0xf2f2f2);
const flagBanner = new Graphics().rect(FLAG_X + FLAG_POLE_W, FLAG_TOP, FLAG_BANNER_W, FLAG_BANNER_H).fill(0xff4d4d);
app.stage.addChild(flagPole, flagBanner);

// Player
const player = {
  x: 24,
  y: 24,
  vx: 0,
  vy: 0,
};

const playerGfx = new Graphics().rect(0, 0, PLAYER_SIZE, PLAYER_SIZE).fill(0x304ffe);
playerGfx.x = player.x;
playerGfx.y = player.y;
app.stage.addChild(playerGfx);

// Input
let activePointerId = null;
let moveDir = 0; // -1, 0, 1

function directionFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const localX = e.clientX - r.left;
  return localX >= WIDTH * 0.5 ? 1 : -1;
}

canvas.addEventListener('pointerdown', (e) => {
  activePointerId = e.pointerId;
  moveDir = directionFromEvent(e);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId !== activePointerId) return;
  moveDir = directionFromEvent(e);
});

function endPointer(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  moveDir = 0;
}
canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);
canvas.addEventListener('pointerleave', () => {
  // Keep movement if captured; otherwise stop.
  if (activePointerId == null) moveDir = 0;
});

// Win check
let didWin = false;
function intersects(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkWin() {
  const hitPole = intersects(
    player.x, player.y, PLAYER_SIZE, PLAYER_SIZE,
    FLAG_X, FLAG_TOP, FLAG_POLE_W, GROUND_Y - FLAG_TOP
  );
  const hitBanner = intersects(
    player.x, player.y, PLAYER_SIZE, PLAYER_SIZE,
    FLAG_X + FLAG_POLE_W, FLAG_TOP, FLAG_BANNER_W, FLAG_BANNER_H
  );
  if (!didWin && (hitPole || hitBanner)) {
    didWin = true;
    if (typeof window.reportWin === 'function') window.reportWin();
  }
}

// Expose player center in CSS-pixel page coordinates
window.__player = () => {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + player.x + PLAYER_SIZE * 0.5,
    y: r.top + player.y + PLAYER_SIZE * 0.5,
  };
};

// Main loop
app.ticker.add((ticker) => {
  const dt = ticker.deltaMS / 1000;

  player.vx = moveDir * MOVE_SPEED;
  player.vy += GRAVITY * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // World bounds (horizontal)
  if (player.x < 0) player.x = 0;
  if (player.x > WIDTH - PLAYER_SIZE) player.x = WIDTH - PLAYER_SIZE;

  // Ground collision
  if (player.y + PLAYER_SIZE >= GROUND_Y) {
    player.y = GROUND_Y - PLAYER_SIZE;
    if (player.vy > 0) player.vy = 0;
  }

  playerGfx.x = player.x;
  playerGfx.y = player.y;

  checkWin();
});
