import kaplay from "kaplay";

const GAME_W = 360;
const GAME_H = 640;
const PLAYER_SIZE = 32;
const GROUND_H = 72;
const SPEED = 220;

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.touchAction = "none";
document.body.style.background = "#111";

const canvas = document.createElement("canvas");
canvas.width = GAME_W;
canvas.height = GAME_H;
Object.assign(canvas.style, {
  position: "fixed",
  left: "0px",
  top: "0px",
  width: `${GAME_W}px`,
  height: `${GAME_H}px`,
  display: "block",
  touchAction: "none",
});
document.body.appendChild(canvas);

const k = kaplay({
  global: false,
  canvas,
  width: GAME_W,
  height: GAME_H,
  scale: 1,
  letterbox: false,
  stretch: false,
  pixelDensity: 1,
});

k.setGravity(1800);

// Sky background
k.add([
  k.rect(GAME_W, GAME_H),
  k.pos(0, 0),
  k.color(130, 200, 255),
  k.fixed(),
]);

// Ground
k.add([
  k.rect(GAME_W, GROUND_H),
  k.pos(0, GAME_H - GROUND_H),
  k.color(90, 65, 45),
  k.area(),
  k.body({ isStatic: true }),
]);

const player = k.add([
  k.rect(PLAYER_SIZE, PLAYER_SIZE),
  k.pos(18, 40),
  k.color(40, 90, 220),
  k.area(),
  k.body(),
  "player",
]);

// Flag near right edge
const flagX = GAME_W - 28;
const flagY = GAME_H - GROUND_H - 54;

k.add([
  k.rect(4, 54),
  k.pos(flagX, flagY),
  k.color(230, 230, 230),
]);

k.add([
  k.rect(18, 12),
  k.pos(flagX + 4, flagY + 4),
  k.color(220, 40, 40),
  k.area(),
  "flag",
]);

let won = false;
player.onCollide("flag", () => {
  if (won) return;
  won = true;
  if (typeof window.reportWin === "function") window.reportWin();
});

let holding = false;
let dir = 0;
let activePointerId = null;

function setDirFromClientX(clientX) {
  dir = clientX >= GAME_W / 2 ? 1 : -1;
}

function onPointerDown(e) {
  holding = true;
  activePointerId = e.pointerId;
  setDirFromClientX(e.clientX);
  if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  e.preventDefault();
}

function onPointerMove(e) {
  if (!holding) return;
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  setDirFromClientX(e.clientX);
  e.preventDefault();
}

function stopPointer(e) {
  if (activePointerId !== null && e.pointerId !== activePointerId) return;
  holding = false;
  dir = 0;
  activePointerId = null;
  e.preventDefault();
}

canvas.addEventListener("pointerdown", onPointerDown, { passive: false });
canvas.addEventListener("pointermove", onPointerMove, { passive: false });
canvas.addEventListener("pointerup", stopPointer, { passive: false });
canvas.addEventListener("pointercancel", stopPointer, { passive: false });
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

k.onUpdate(() => {
  if (holding) {
    player.move(dir * SPEED, 0);
  }

  if (player.pos.x < 0) player.pos.x = 0;
  if (player.pos.x > GAME_W - PLAYER_SIZE) player.pos.x = GAME_W - PLAYER_SIZE;
});

window.__player = () => ({
  x: player.pos.x + PLAYER_SIZE / 2,
  y: player.pos.y + PLAYER_SIZE / 2,
});
