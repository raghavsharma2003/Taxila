const WIDTH = 360;
const HEIGHT = 640;

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.touchAction = "none";
canvas.style.display = "block";

document.documentElement.style.margin = "0";
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.width = `${WIDTH}px`;
document.body.style.height = `${HEIGHT}px`;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const groundH = 80;
const groundY = HEIGHT - groundH;

const player = {
  size: 32,
  x: 24,
  y: 40,
  vx: 0,
  vy: 0,
};

const moveSpeed = 170;   // px/s
const gravity = 1900;    // px/s^2

const flag = {
  x: WIDTH - 42,
  y: groundY - 64,
  w: 16,
  h: 64,
};

let won = false;

// Input: hold pointer on left/right half to move.
const activePointers = new Map();

function currentMoveDir() {
  const first = activePointers.values().next();
  if (first.done) return 0;
  return first.value < WIDTH * 0.5 ? -1 : 1;
}

function pointerPosInCanvas(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

canvas.addEventListener("pointerdown", (e) => {
  const p = pointerPosInCanvas(e);
  activePointers.set(e.pointerId, p.x);
  canvas.setPointerCapture(e.pointerId);
  e.preventDefault();
});

canvas.addEventListener("pointermove", (e) => {
  if (!activePointers.has(e.pointerId)) return;
  const p = pointerPosInCanvas(e);
  activePointers.set(e.pointerId, p.x);
  e.preventDefault();
});

function clearPointer(e) {
  activePointers.delete(e.pointerId);
  e.preventDefault();
}
canvas.addEventListener("pointerup", clearPointer);
canvas.addEventListener("pointercancel", clearPointer);
canvas.addEventListener("pointerout", (e) => {
  if (e.pointerType !== "mouse") return;
  activePointers.delete(e.pointerId);
});

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

window.__player = () => {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + window.scrollX + player.x + player.size * 0.5,
    y: r.top + window.scrollY + player.y + player.size * 0.5,
  };
};

let last = performance.now();

function update(dt) {
  const dir = currentMoveDir();
  player.vx = dir * moveSpeed;
  player.vy += gravity * dt;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // Screen bounds
  if (player.x < 0) player.x = 0;
  if (player.x + player.size > WIDTH) player.x = WIDTH - player.size;

  // Ground collision
  if (player.y + player.size > groundY) {
    player.y = groundY - player.size;
    player.vy = 0;
  }

  // Win check (pole + flag cloth area)
  const clothW = 22;
  const clothH = 14;
  const clothX = flag.x + flag.w;
  const clothY = flag.y + 8;

  const hitPole = rectsOverlap(
    player.x, player.y, player.size, player.size,
    flag.x, flag.y, flag.w, flag.h
  );
  const hitCloth = rectsOverlap(
    player.x, player.y, player.size, player.size,
    clothX, clothY, clothW, clothH
  );

  if (!won && (hitPole || hitCloth)) {
    won = true;
    if (typeof window.reportWin === "function") {
      window.reportWin(); // exactly once
    }
  }
}

function draw() {
  // Sky
  const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  grad.addColorStop(0, "#8fd3ff");
  grad.addColorStop(1, "#dff5ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Ground
  ctx.fillStyle = "#4e9f3d";
  ctx.fillRect(0, groundY, WIDTH, groundH);
  ctx.fillStyle = "#3f7f31";
  ctx.fillRect(0, groundY, WIDTH, 10);

  // Flag pole
  ctx.fillStyle = "#6d4c41";
  ctx.fillRect(flag.x, flag.y, flag.w, flag.h);

  // Flag cloth
  ctx.fillStyle = won ? "#ffc107" : "#e53935";
  ctx.beginPath();
  ctx.moveTo(flag.x + flag.w, flag.y + 8);
  ctx.lineTo(flag.x + flag.w + 22, flag.y + 15);
  ctx.lineTo(flag.x + flag.w, flag.y + 22);
  ctx.closePath();
  ctx.fill();

  // Player
  ctx.fillStyle = "#1e88e5";
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(player.x + 8, player.y + 8, 5, 5);

  if (won) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("You Win!", WIDTH * 0.5, 80);
  }
}

function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame((t) => {
  last = t;
  requestAnimationFrame(loop);
});
