import * as LJS from 'littlejsengine';

const W = 360;
const H = 640;

LJS.canvasFixedSize = LJS.vec2(W, H);

const player = {
  x: 40,
  y: 60,
  vx: 0,
  vy: 0,
  size: 32,
};

const groundHeight = 96;
const groundTop = H - groundHeight;

const flag = {
  x: W - 30,
  poleW: 6,
  poleH: 72,
  clothW: 18,
  clothH: 12,
};

const gravity = 0.7;
const walkSpeed = 2.2;

let activePointerId = null;
let moveDir = 0; // -1 left, +1 right
let won = false;
let ctx = null;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function aabbOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    ay - ah / 2 < by + bh / 2 &&
    ay + ah / 2 > by - bh / 2
  );
}

function setCanvasStyle(canvas) {
  if (!canvas) return;
  canvas.width = W;
  canvas.height = H;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = `${W}px`;
  canvas.style.height = `${H}px`;
  canvas.style.margin = '0';
  canvas.style.padding = '0';
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
}

function setDirFromClientX(clientX) {
  const rect = LJS.mainCanvas.getBoundingClientRect();
  const x = clientX - rect.left;
  moveDir = x >= rect.width * 0.5 ? 1 : -1;
}

function onPointerDown(e) {
  if (activePointerId !== null) return;
  activePointerId = e.pointerId;
  setDirFromClientX(e.clientX);
  e.preventDefault();
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  setDirFromClientX(e.clientX);
  e.preventDefault();
}

function onPointerUpOrCancel(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  moveDir = 0;
  e.preventDefault();
}

function gameInit() {
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.width = `${W}px`;
  document.body.style.height = `${H}px`;

  setCanvasStyle(LJS.mainCanvas);
  setCanvasStyle(LJS.overlayCanvas);

  ctx = LJS.overlayContext || LJS.mainContext || LJS.mainCanvas.getContext('2d');

  window.addEventListener('pointerdown', onPointerDown, { passive: false });
  window.addEventListener('pointermove', onPointerMove, { passive: false });
  window.addEventListener('pointerup', onPointerUpOrCancel, { passive: false });
  window.addEventListener('pointercancel', onPointerUpOrCancel, { passive: false });

  window.__player = () => ({ x: player.x, y: player.y });
}

function gameUpdate() {
  // Horizontal control
  player.vx = moveDir * walkSpeed;

  // Gravity + movement
  player.vy += gravity;
  player.x += player.vx;
  player.y += player.vy;

  // World bounds
  const half = player.size / 2;
  player.x = clamp(player.x, half, W - half);

  // Ground collision (resting on top)
  if (player.y + half >= groundTop) {
    player.y = groundTop - half;
    player.vy = 0;
  }

  // Flag collision
  const flagBoxX = flag.x + flag.clothW * 0.25;
  const flagBoxY = groundTop - flag.poleH * 0.5;
  const flagBoxW = flag.clothW + 10;
  const flagBoxH = flag.poleH;

  if (
    !won &&
    aabbOverlap(
      player.x,
      player.y,
      player.size,
      player.size,
      flagBoxX,
      flagBoxY,
      flagBoxW,
      flagBoxH
    )
  ) {
    won = true;
    if (typeof window.reportWin === 'function') window.reportWin();
  }
}

function gameRenderPost() {
  if (!ctx) return;

  // Keep canvases locked to exact CSS size/position
  setCanvasStyle(LJS.mainCanvas);
  setCanvasStyle(LJS.overlayCanvas);

  ctx.clearRect(0, 0, W, H);

  // Sky
  ctx.fillStyle = '#9ed0ff';
  ctx.fillRect(0, 0, W, H);

  // Ground
  ctx.fillStyle = '#4f7d3a';
  ctx.fillRect(0, groundTop, W, groundHeight);

  // Flag pole
  ctx.fillStyle = '#7a5a3a';
  ctx.fillRect(flag.x - flag.poleW / 2, groundTop - flag.poleH, flag.poleW, flag.poleH);

  // Flag cloth
  ctx.fillStyle = won ? '#ffd54a' : '#e64b4b';
  ctx.fillRect(
    flag.x + flag.poleW / 2,
    groundTop - flag.poleH + 6,
    flag.clothW,
    flag.clothH
  );

  // Player
  ctx.fillStyle = '#1f2d3d';
  ctx.fillRect(
    player.x - player.size / 2,
    player.y - player.size / 2,
    player.size,
    player.size
  );
}

LJS.engineInit(gameInit, gameUpdate, () => {}, () => {}, gameRenderPost, []);
