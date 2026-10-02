const WIDTH = 360;
const HEIGHT = 640;

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.width = `${WIDTH}px`;
document.body.style.height = `${HEIGHT}px`;

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.display = "block";
canvas.style.touchAction = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const GROUND_H = 96;
const groundY = HEIGHT - GROUND_H;

const player = {
  x: 24,
  y: 40,
  w: 32,
  h: 32,
  vx: 0,
  vy: 0,
};

const gravity = 1800; // px/s^2
const walkSpeed = 150; // px/s
let inputDir = 0; // -1, 0, 1
let activePointerId = null;

const flag = {
  x: WIDTH - 42,
  y: groundY - 74,
  w: 18,
  h: 74,
  clothW: 22,
  clothH: 14,
};

let won = false;

window.__player = () => ({
  x: player.x + player.w * 0.5,
  y: player.y + player.h * 0.5,
});

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function setDirFromClientX(clientX) {
  inputDir = clientX >= WIDTH * 0.5 ? 1 : -1;
}

function onPointerDown(e) {
  if (activePointerId !== null) return;
  activePointerId = e.pointerId;
  setDirFromClientX(e.clientX);
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  setDirFromClientX(e.clientX);
}

function onPointerUpOrCancel(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  inputDir = 0;
}

window.addEventListener("pointerdown", onPointerDown, { passive: true });
window.addEventListener("pointermove", onPointerMove, { passive: true });
window.addEventListener("pointerup", onPointerUpOrCancel, { passive: true });
window.addEventListener("pointercancel", onPointerUpOrCancel, { passive: true });

let last = performance.now();

function update(dt) {
  player.vx = inputDir * walkSpeed;
  player.x += player.vx * dt;
  if (player.x < 0) player.x = 0;
  if (player.x + player.w > WIDTH) player.x = WIDTH - player.w;

  player.vy += gravity * dt;
  player.y += player.vy * dt;

  if (player.y + player.h > groundY) {
    player.y = groundY - player.h;
    player.vy = 0;
  }

  const flagHitbox = {
    x: flag.x - 6,
    y: flag.y,
    w: flag.w + flag.clothW + 10,
    h: flag.h,
  };

  if (!won && rectsOverlap(player, flagHitbox)) {
    won = true;
    if (typeof window.reportWin === "function") window.reportWin();
  }
}

function draw() {
  // Sky
  ctx.fillStyle = "#9dd6ff";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground
  ctx.fillStyle = "#5f9b4f";
  ctx.fillRect(0, groundY, WIDTH, GROUND_H);

  // Ground top strip
  ctx.fillStyle = "#7bc364";
  ctx.fillRect(0, groundY, WIDTH, 8);

  // Flag pole
  ctx.fillStyle = "#6e6e6e";
  ctx.fillRect(flag.x, flag.y, flag.w, flag.h);

  // Flag cloth
  ctx.fillStyle = won ? "#ffd54a" : "#e64545";
  ctx.fillRect(flag.x + flag.w, flag.y + 8, flag.clothW, flag.clothH);

  // Player
  ctx.fillStyle = "#2d2d2d";
  ctx.fillRect(player.x, player.y, player.w, player.h);

  // Tiny eye
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 20, player.y + 10, 6, 6);
}

function frame(now) {
  let dt = (now - last) / 1000;
  if (dt > 0.05) dt = 0.05;
  last = now;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
