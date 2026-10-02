const W = 360;
const H = 640;

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.touchAction = "none";
document.body.style.background = "#87c9ff";

const canvas = document.createElement("canvas");
canvas.width = W;
canvas.height = H;
canvas.style.position = "fixed";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = W + "px";
canvas.style.height = H + "px";
canvas.style.display = "block";
canvas.style.touchAction = "none";
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const groundH = 88;
const groundY = H - groundH;

const player = {
  size: 32,
  x: 24,
  y: 24,
  vy: 0
};

const gravity = 1800;
const walkSpeed = 160;
let moveDir = 0; // -1 left, 1 right, 0 idle
let activePointerId = null;

const flag = {
  poleW: 6,
  poleH: 120,
  x: W - 36,
  y: groundY - 120,
  bannerW: 26,
  bannerH: 16
};

let won = false;

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function intersects(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function localXFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  return e.clientX - r.left;
}

function updateMoveFromEvent(e) {
  const lx = localXFromEvent(e);
  moveDir = lx >= W * 0.5 ? 1 : -1;
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  activePointerId = e.pointerId;
  updateMoveFromEvent(e);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId !== activePointerId) return;
  e.preventDefault();
  updateMoveFromEvent(e);
});

function clearPointer(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  moveDir = 0;
}
canvas.addEventListener("pointerup", clearPointer);
canvas.addEventListener("pointercancel", clearPointer);
canvas.addEventListener("lostpointercapture", clearPointer);

canvas.addEventListener("contextmenu", (e) => e.preventDefault());

window.__player = () => {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + player.x + player.size * 0.5,
    y: r.top + player.y + player.size * 0.5
  };
};

let last = performance.now();

function update(dt) {
  player.x += moveDir * walkSpeed * dt;
  player.x = clamp(player.x, 0, W - player.size);

  player.vy += gravity * dt;
  player.y += player.vy * dt;

  if (player.y + player.size > groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
  }

  const flagHitX = flag.x - flag.bannerW;
  const flagHitY = flag.y;
  const flagHitW = flag.bannerW + flag.poleW;
  const flagHitH = flag.poleH;

  if (
    !won &&
    intersects(
      player.x,
      player.y,
      player.size,
      player.size,
      flagHitX,
      flagHitY,
      flagHitW,
      flagHitH
    )
  ) {
    won = true;
    if (typeof window.reportWin === "function") {
      window.reportWin();
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // Sky
  ctx.fillStyle = "#87c9ff";
  ctx.fillRect(0, 0, W, H);

  // Ground
  ctx.fillStyle = "#5c8f3a";
  ctx.fillRect(0, groundY, W, groundH);
  ctx.fillStyle = "#4a7630";
  ctx.fillRect(0, groundY, W, 10);

  // Flag
  ctx.fillStyle = "#e8e8e8";
  ctx.fillRect(flag.x, flag.y, flag.poleW, flag.poleH);
  ctx.fillStyle = "#ff3b30";
  ctx.fillRect(flag.x - flag.bannerW, flag.y + 10, flag.bannerW, flag.bannerH);

  // Player
  ctx.fillStyle = "#2f5bff";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 8, player.y + 8, 6, 6);
  ctx.fillRect(player.x + 18, player.y + 8, 6, 6);

  // Midline hint (subtle)
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.moveTo(W * 0.5, 0);
  ctx.lineTo(W * 0.5, H);
  ctx.stroke();
}

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
