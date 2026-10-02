const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

const canvas = document.createElement("canvas");
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
canvas.style.width = `${GAME_WIDTH}px`;
canvas.style.height = `${GAME_HEIGHT}px`;
canvas.style.display = "block";
canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.touchAction = "none";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// World
const groundHeight = 80;
const groundY = GAME_HEIGHT - groundHeight;

// Player
const playerSize = 32;
const player = {
  x: 24,
  y: 40,
  vx: 0,
  vy: 0,
  speed: 180,      // px/s
  gravity: 1800,   // px/s^2
};

// Flag (simple rectangle hitbox)
const flag = {
  x: GAME_WIDTH - 46,
  y: groundY - 70,
  w: 20,
  h: 70,
};

let won = false;

// Input
let activePointerId = null;
let moveDir = 0; // -1 left, 1 right, 0 stop

function pointerToDir(clientX) {
  const x = clientX; // canvas is pinned to top-left at (0,0)
  if (x < 0 || x > GAME_WIDTH) return 0;
  return x < GAME_WIDTH * 0.5 ? -1 : 1;
}

function onPointerDown(e) {
  activePointerId = e.pointerId;
  moveDir = pointerToDir(e.clientX);
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  moveDir = pointerToDir(e.clientX);
}

function onPointerUpOrCancel(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  moveDir = 0;
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerup", onPointerUpOrCancel, { passive: true });
window.addEventListener("pointercancel", onPointerUpOrCancel, { passive: true });

// Expose player center in CSS-pixel page coordinates
window.__player = () => ({
  x: player.x + playerSize * 0.5,
  y: player.y + playerSize * 0.5,
});

function aabbIntersects(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

let lastTime = performance.now();

function update(dt) {
  // Horizontal movement from input
  player.vx = moveDir * player.speed;
  player.x += player.vx * dt;

  // Keep player in screen bounds
  if (player.x < 0) player.x = 0;
  if (player.x > GAME_WIDTH - playerSize) player.x = GAME_WIDTH - playerSize;

  // Gravity
  player.vy += player.gravity * dt;
  player.y += player.vy * dt;

  // Ground collision
  const maxY = groundY - playerSize;
  if (player.y >= maxY) {
    player.y = maxY;
    player.vy = 0;
  }

  // Win check
  if (
    !won &&
    aabbIntersects(player.x, player.y, playerSize, playerSize, flag.x, flag.y, flag.w, flag.h)
  ) {
    won = true;
    if (typeof window.reportWin === "function") {
      window.reportWin();
    }
  }
}

function draw() {
  // Sky
  ctx.fillStyle = "#87c9ff";
  ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

  // Ground
  ctx.fillStyle = "#4f8a3b";
  ctx.fillRect(0, groundY, GAME_WIDTH, groundHeight);

  // Ground stripe
  ctx.fillStyle = "#3c6d2d";
  ctx.fillRect(0, groundY, GAME_WIDTH, 8);

  // Flag pole
  ctx.fillStyle = "#7d7d7d";
  const poleX = flag.x + 4;
  ctx.fillRect(poleX, flag.y - 6, 4, flag.h + 6);

  // Flag cloth
  ctx.fillStyle = won ? "#ffd447" : "#ff5a5f";
  ctx.fillRect(poleX + 4, flag.y, 18, 12);

  // Player
  ctx.fillStyle = "#1f2a44";
  ctx.fillRect(player.x, player.y, playerSize, playerSize);

  // Simple eye (facing movement direction if moving)
  const facing = moveDir >= 0 ? 1 : -1;
  const eyeX = player.x + (facing > 0 ? 22 : 8);
  const eyeY = player.y + 10;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(eyeX, eyeY, 4, 4);
}

function frame(now) {
  let dt = (now - lastTime) / 1000;
  lastTime = now;

  // Clamp dt for stability
  if (dt > 0.05) dt = 0.05;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
