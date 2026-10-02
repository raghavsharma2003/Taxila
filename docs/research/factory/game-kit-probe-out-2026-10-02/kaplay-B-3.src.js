import kaplay from "kaplay";

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#111";

const canvas = document.createElement("canvas");
canvas.width = 360;
canvas.height = 640;
Object.assign(canvas.style, {
  position: "fixed",
  left: "0px",
  top: "0px",
  width: "360px",
  height: "640px",
  display: "block",
  touchAction: "none",
});
document.body.appendChild(canvas);

const k = kaplay({
  canvas,
  width: 360,
  height: 640,
  global: false,
  letterbox: false,
  crisp: true,
  background: [135, 206, 235],
});

const {
  add,
  rect,
  pos,
  color,
  area,
  body,
  anchor,
  setGravity,
  onUpdate,
} = k;

setGravity(1800);

const WORLD_W = 360;
const WORLD_H = 640;
const GROUND_H = 56;
const PLAYER_SIZE = 32;
const PLAYER_SPEED = 180;

const groundY = WORLD_H - GROUND_H;

add([
  rect(WORLD_W, GROUND_H),
  pos(0, groundY),
  anchor("topleft"),
  area(),
  body({ isStatic: true }),
  color(70, 140, 70),
]);

const player = add([
  rect(PLAYER_SIZE, PLAYER_SIZE),
  pos(20, 40),
  anchor("topleft"),
  area(),
  body(),
  color(40, 90, 220),
]);

// Flag near right edge
add([
  rect(4, 52),
  pos(WORLD_W - 34, groundY - 52),
  anchor("topleft"),
  color(230, 230, 230),
]);

add([
  rect(18, 12),
  pos(WORLD_W - 30, groundY - 48),
  anchor("topleft"),
  color(230, 60, 60),
]);

const flagHitbox = add([
  rect(20, 52),
  pos(WORLD_W - 36, groundY - 52),
  anchor("topleft"),
  area(),
  "flag",
]);

let won = false;
player.onCollide("flag", () => {
  if (won) return;
  won = true;
  if (typeof window.reportWin === "function") {
    window.reportWin();
  }
});

// Touch / pointer movement
let pointerDown = false;
let moveDir = 0;

function updateDirFromClientX(clientX) {
  const r = canvas.getBoundingClientRect();
  const x = clientX - r.left;
  moveDir = x >= WORLD_W / 2 ? 1 : -1;
}

canvas.addEventListener("pointerdown", (e) => {
  pointerDown = true;
  updateDirFromClientX(e.clientX);
  try {
    canvas.setPointerCapture(e.pointerId);
  } catch {}
  e.preventDefault();
});

canvas.addEventListener("pointermove", (e) => {
  if (!pointerDown) return;
  updateDirFromClientX(e.clientX);
  e.preventDefault();
});

function stopPointer(e) {
  pointerDown = false;
  moveDir = 0;
  e.preventDefault();
}

canvas.addEventListener("pointerup", stopPointer);
canvas.addEventListener("pointercancel", stopPointer);

onUpdate(() => {
  if (pointerDown && moveDir !== 0) {
    player.move(moveDir * PLAYER_SPEED, 0);
  }

  // Keep player inside screen bounds.
  if (player.pos.x < 0) player.pos.x = 0;
  const maxX = WORLD_W - PLAYER_SIZE;
  if (player.pos.x > maxX) player.pos.x = maxX;
});

// Expose player center in CSS-pixel page coordinates.
window.__player = () => ({
  x: player.pos.x + PLAYER_SIZE / 2,
  y: player.pos.y + PLAYER_SIZE / 2,
});

// Keep reference so bundlers don't tree-shake it if aggressive.
void flagHitbox;
