import kaplay from "kaplay";

const WIDTH = 360;
const HEIGHT = 640;
const PLAYER_SIZE = 32;
const GROUND_H = 80;
const WALK_SPEED = 180;

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#1b1f2a";

const canvas = document.createElement("canvas");
canvas.width = WIDTH;
canvas.height = HEIGHT;
canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.display = "block";
canvas.style.touchAction = "none";
document.body.appendChild(canvas);

const k = kaplay({
  global: false,
  canvas,
  width: WIDTH,
  height: HEIGHT,
  scale: 1,
  stretch: false,
  letterbox: false,
  background: [126, 200, 255],
});

k.setGravity(1800);

const groundY = HEIGHT - GROUND_H;

k.add([
  k.rect(WIDTH, GROUND_H),
  k.pos(0, groundY),
  k.anchor("topleft"),
  k.color(90, 160, 80),
  k.area(),
  k.body({ isStatic: true }),
]);

const player = k.add([
  k.rect(PLAYER_SIZE, PLAYER_SIZE),
  k.pos(16, 40),
  k.anchor("topleft"),
  k.color(240, 90, 90),
  k.area(),
  k.body(),
]);

const flagX = WIDTH - 44;
k.add([
  k.rect(6, 74),
  k.pos(flagX, groundY - 74),
  k.anchor("topleft"),
  k.color(230, 230, 240),
]);

k.add([
  k.rect(24, 18),
  k.pos(flagX + 6, groundY - 70),
  k.anchor("topleft"),
  k.color(255, 220, 40),
  k.area(),
  "goal",
]);

let won = false;
player.onCollide("goal", () => {
  if (won) return;
  won = true;
  if (typeof window.reportWin === "function") window.reportWin();
});

const pointers = new Map();
let moveDir = 0;

function dirFromClientX(clientX) {
  const r = canvas.getBoundingClientRect();
  const x = clientX - r.left;
  return x >= WIDTH / 2 ? 1 : -1;
}

function refreshMoveDir() {
  let sum = 0;
  for (const d of pointers.values()) sum += d;
  moveDir = sum === 0 ? 0 : sum > 0 ? 1 : -1;
}

canvas.addEventListener(
  "pointerdown",
  (e) => {
    e.preventDefault();
    pointers.set(e.pointerId, dirFromClientX(e.clientX));
    refreshMoveDir();
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
  },
  { passive: false }
);

canvas.addEventListener(
  "pointermove",
  (e) => {
    if (!pointers.has(e.pointerId)) return;
    e.preventDefault();
    pointers.set(e.pointerId, dirFromClientX(e.clientX));
    refreshMoveDir();
  },
  { passive: false }
);

function releasePointer(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  refreshMoveDir();
}
canvas.addEventListener("pointerup", releasePointer);
canvas.addEventListener("pointercancel", releasePointer);
canvas.addEventListener("pointerleave", releasePointer);

k.onUpdate(() => {
  player.move(moveDir * WALK_SPEED, 0);

  if (player.pos.x < 0) player.pos.x = 0;
  if (player.pos.x > WIDTH - PLAYER_SIZE) player.pos.x = WIDTH - PLAYER_SIZE;
});

window.__player = () => {
  const r = canvas.getBoundingClientRect();
  return {
    x: r.left + player.pos.x + PLAYER_SIZE / 2,
    y: r.top + player.pos.y + PLAYER_SIZE / 2,
  };
};
