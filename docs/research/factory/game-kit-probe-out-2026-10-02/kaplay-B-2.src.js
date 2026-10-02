import kaplay from "kaplay";

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_H = 80;
const PLAYER_SIZE = 32;
const WALK_SPEED = 180;

// Page / canvas layout: exact 360x640 CSS px at top-left, no scroll.
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#111";

const canvas = document.createElement("canvas");
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
canvas.style.position = "fixed";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = `${GAME_WIDTH}px`;
canvas.style.height = `${GAME_HEIGHT}px`;
canvas.style.touchAction = "none";
canvas.style.display = "block";
document.body.appendChild(canvas);

const k = kaplay({
  canvas,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  letterbox: false,
  stretch: false,
  global: false,
  background: [135, 206, 235],
});

k.setGravity(1800);

// Ground
k.add([
  k.rect(GAME_WIDTH, GROUND_H),
  k.pos(GAME_WIDTH / 2, GAME_HEIGHT - GROUND_H / 2),
  k.anchor("center"),
  k.area(),
  k.body({ isStatic: true }),
  k.color(70, 140, 70),
  "ground",
]);

// Player
const player = k.add([
  k.rect(PLAYER_SIZE, PLAYER_SIZE),
  k.pos(40, 120),
  k.anchor("center"),
  k.area(),
  k.body(),
  k.color(40, 90, 220),
  "player",
]);

// Flag near right edge
const flag = k.add([
  k.rect(18, 56),
  k.pos(GAME_WIDTH - 26, GAME_HEIGHT - GROUND_H - 28),
  k.anchor("center"),
  k.area(),
  k.color(220, 40, 40),
  "flag",
]);

// Small pole visual
k.add([
  k.rect(4, 72),
  k.pos(flag.pos.x - 10, GAME_HEIGHT - GROUND_H - 36),
  k.anchor("center"),
  k.color(240, 240, 240),
]);

let moveDir = 0;
let activePointerId = null;

function dirFromClientX(clientX) {
  const r = canvas.getBoundingClientRect();
  const localX = clientX - r.left;
  return localX >= r.width / 2 ? 1 : -1;
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (activePointerId === null) activePointerId = e.pointerId;
  if (e.pointerId === activePointerId) moveDir = dirFromClientX(e.clientX);
});

canvas.addEventListener("pointermove", (e) => {
  if (e.pointerId === activePointerId) {
    e.preventDefault();
    moveDir = dirFromClientX(e.clientX);
  }
});

function stopIfActive(e) {
  if (e.pointerId === activePointerId) {
    activePointerId = null;
    moveDir = 0;
  }
}
window.addEventListener("pointerup", stopIfActive, { passive: true });
window.addEventListener("pointercancel", stopIfActive, { passive: true });

player.onUpdate(() => {
  if (moveDir !== 0) player.move(moveDir * WALK_SPEED, 0);

  const half = PLAYER_SIZE / 2;
  if (player.pos.x < half) player.pos.x = half;
  if (player.pos.x > GAME_WIDTH - half) player.pos.x = GAME_WIDTH - half;
});

let won = false;
player.onCollide("flag", () => {
  if (won) return;
  won = true;
  if (typeof window.reportWin === "function") {
    window.reportWin();
  }
});

// Expose player center in CSS-pixel page coordinates
window.__player = () => {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + player.pos.x,
    y: r.top + player.pos.y,
  };
};
