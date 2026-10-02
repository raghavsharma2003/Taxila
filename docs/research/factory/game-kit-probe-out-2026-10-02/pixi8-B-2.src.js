import { Application, Graphics } from 'pixi.js';

const WIDTH = 360;
const HEIGHT = 640;

const app = new Application();
await app.init({
  width: WIDTH,
  height: HEIGHT,
  resolution: 1,
  autoDensity: false,
  background: 0x87ceeb,
  antialias: false,
});

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

const canvas = app.canvas;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.display = 'block';
canvas.style.touchAction = 'none';
document.body.appendChild(canvas);

// World setup
const groundHeight = 96;
const groundY = HEIGHT - groundHeight;

const ground = new Graphics().rect(0, groundY, WIDTH, groundHeight).fill(0x3b7a2a);
app.stage.addChild(ground);

// Player
const playerSize = 32;
const half = playerSize / 2;
const player = new Graphics().rect(-half, -half, playerSize, playerSize).fill(0xffcc33);
player.x = 36 + half;
player.y = 40;
app.stage.addChild(player);

let vx = 0;
let vy = 0;
let moveDir = 0; // -1, 0, 1

const GRAVITY = 1800; // px/s^2
const WALK_SPEED = 130; // px/s

// Flag
const flagBaseX = WIDTH - 44;
const flagPoleW = 4;
const flagH = 72;
const flagTopY = groundY - flagH;

const flag = new Graphics();
flag.rect(flagBaseX, flagTopY, flagPoleW, flagH).fill(0xeeeeee);
flag.rect(flagBaseX + flagPoleW, flagTopY + 4, 18, 12).fill(0xff3b3b);
flag.rect(flagBaseX - 6, groundY - 6, 16, 6).fill(0x5c4a3a);
app.stage.addChild(flag);

const flagHit = {
  x: flagBaseX - 6,
  y: flagTopY,
  w: 26,
  h: flagH + 6,
};

let won = false;

function playerAABB() {
  return {
    x: player.x - half,
    y: player.y - half,
    w: playerSize,
    h: playerSize,
  };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function setMoveFromClientX(clientX) {
  moveDir = clientX >= WIDTH / 2 ? 1 : -1;
}

let pointerActive = false;

canvas.addEventListener('pointerdown', (e) => {
  pointerActive = true;
  setMoveFromClientX(e.clientX);
});

window.addEventListener('pointermove', (e) => {
  if (!pointerActive) return;
  setMoveFromClientX(e.clientX);
});

function releasePointer() {
  pointerActive = false;
  moveDir = 0;
}
window.addEventListener('pointerup', releasePointer);
window.addEventListener('pointercancel', releasePointer);
window.addEventListener('pointerleave', releasePointer);

// Expose player center in CSS pixel page coordinates
window.__player = () => {
  const rect = canvas.getBoundingClientRect();
  return { x: rect.left + player.x, y: rect.top + player.y };
};

app.ticker.add((ticker) => {
  const dt = ticker.deltaMS / 1000;

  vx = moveDir * WALK_SPEED;
  vy += GRAVITY * dt;

  player.x += vx * dt;
  player.y += vy * dt;

  // Screen horizontal bounds
  if (player.x - half < 0) player.x = half;
  if (player.x + half > WIDTH) player.x = WIDTH - half;

  // Ground collision
  if (player.y + half >= groundY) {
    player.y = groundY - half;
    if (vy > 0) vy = 0;
  }

  // Win check
  if (!won && intersects(playerAABB(), flagHit)) {
    won = true;
    if (typeof window.reportWin === 'function') {
      window.reportWin();
    }
  }
});
