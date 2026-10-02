import { Application, Graphics } from 'pixi.js';

const WIDTH = 360;
const HEIGHT = 640;

const app = new Application();
await app.init({
  width: WIDTH,
  height: HEIGHT,
  resolution: 1,
  autoDensity: false,
  background: 0x8ec9ff,
  antialias: false,
});

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
const groundHeight = 80;
const groundTop = HEIGHT - groundHeight;

const ground = new Graphics()
  .rect(0, groundTop, WIDTH, groundHeight)
  .fill(0x3f8f3f);
app.stage.addChild(ground);

// Player
const playerSize = 32;
const halfPlayer = playerSize / 2;
const player = new Graphics()
  .rect(-halfPlayer, -halfPlayer, playerSize, playerSize)
  .fill(0x1f2937);
player.x = 28;
player.y = 80;
app.stage.addChild(player);

// Flag
const flagX = WIDTH - 34;
const poleHeight = 58;
const poleWidth = 4;
const flag = new Graphics();
flag.rect(-poleWidth / 2, -poleHeight, poleWidth, poleHeight).fill(0xeeeeee);
flag.poly([
  poleWidth / 2, -poleHeight + 4,
  poleWidth / 2 + 18, -poleHeight + 10,
  poleWidth / 2, -poleHeight + 16,
]).fill(0xff3b30);
flag.x = flagX;
flag.y = groundTop;
app.stage.addChild(flag);

// Input
let holding = false;
let moveDir = 0; // -1 left, +1 right, 0 stop

function updateDirFromClientX(clientX) {
  const rect = canvas.getBoundingClientRect();
  const localX = clientX - rect.left;
  moveDir = localX >= WIDTH / 2 ? 1 : -1;
}

canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  holding = true;
  updateDirFromClientX(e.clientX);
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch (_) {}
});

canvas.addEventListener('pointermove', (e) => {
  if (!holding) return;
  e.preventDefault();
  updateDirFromClientX(e.clientX);
});

function stopMove() {
  holding = false;
  moveDir = 0;
}

canvas.addEventListener('pointerup', stopMove);
canvas.addEventListener('pointercancel', stopMove);
canvas.addEventListener('pointerleave', (e) => {
  if (holding && e.buttons === 0) stopMove();
});

// Physics/game loop
const gravity = 1800; // px/s^2
const walkSpeed = 140; // px/s
let vy = 0;
let won = false;

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

app.ticker.add((ticker) => {
  const dt = Math.min(ticker.deltaMS / 1000, 1 / 30);

  // Horizontal movement while held
  if (holding) player.x += moveDir * walkSpeed * dt;

  // Gravity + vertical movement
  vy += gravity * dt;
  player.y += vy * dt;

  // Ground collision
  const playerBottom = player.y + halfPlayer;
  if (playerBottom > groundTop) {
    player.y = groundTop - halfPlayer;
    vy = 0;
  }

  // Screen bounds
  if (player.x < halfPlayer) player.x = halfPlayer;
  if (player.x > WIDTH - halfPlayer) player.x = WIDTH - halfPlayer;

  // Win check
  if (!won) {
    const p = {
      x: player.x - halfPlayer,
      y: player.y - halfPlayer,
      w: playerSize,
      h: playerSize,
    };
    const flagHit = {
      x: flagX - 4,
      y: groundTop - poleHeight,
      w: 22,
      h: poleHeight,
    };
    if (intersects(p, flagHit)) {
      won = true;
      window.reportWin();
    }
  }
});

// Expose player center in page coordinates (canvas is fixed at top-left, no scaling)
window.__player = () => ({ x: player.x, y: player.y });
