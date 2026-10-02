import {
  Engine,
  Actor,
  Color,
  CollisionType,
  DisplayMode,
  Physics,
  vec
} from 'excalibur';

const W = 360;
const H = 640;
const GROUND_H = 64;
const PLAYER_SIZE = 32;
const WALK_SPEED = 140;

// Page/canvas layout: exact 360x640 at top-left, no scrolling
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';

const game = new Engine({
  width: W,
  height: H,
  displayMode: DisplayMode.Fixed,
  pixelRatio: 1,
  antialiasing: false
});

const canvas = game.canvas;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;
canvas.style.touchAction = 'none';
canvas.style.display = 'block';

Physics.gravity = vec(0, 900);

// Ground
const ground = new Actor({
  pos: vec(W / 2, H - GROUND_H / 2),
  width: W,
  height: GROUND_H,
  color: Color.fromRGB(70, 120, 70)
});
ground.body.collisionType = CollisionType.Fixed;

// Player
const player = new Actor({
  pos: vec(28, 80),
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  color: Color.fromRGB(50, 120, 230)
});
player.body.collisionType = CollisionType.Active;

// Flag near right edge
const flag = new Actor({
  pos: vec(W - 22, H - GROUND_H - 30),
  width: 18,
  height: 60,
  color: Color.Yellow
});
flag.body.collisionType = CollisionType.Fixed;

// Optional small base so it looks like a stand
const flagBase = new Actor({
  pos: vec(W - 22, H - GROUND_H - 3),
  width: 26,
  height: 6,
  color: Color.fromRGB(120, 90, 40)
});
flagBase.body.collisionType = CollisionType.Fixed;

game.add(ground);
game.add(flagBase);
game.add(flag);
game.add(player);

// Input: hold pointer on left/right half to walk
const activePointers = new Map();
let walkDir = 0;

function updateWalkDir() {
  if (activePointers.size === 0) {
    walkDir = 0;
    return;
  }
  // Most recently inserted pointer decides direction
  let lastX = 0;
  for (const x of activePointers.values()) lastX = x;
  walkDir = lastX >= W / 2 ? 1 : -1;
}

function localPointerX(e) {
  const r = canvas.getBoundingClientRect();
  return e.clientX - r.left;
}
function insideGame(e) {
  const r = canvas.getBoundingClientRect();
  return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
}

window.addEventListener(
  'pointerdown',
  (e) => {
    if (!insideGame(e)) return;
    activePointers.set(e.pointerId, localPointerX(e));
    updateWalkDir();
    e.preventDefault();
  },
  { passive: false }
);

window.addEventListener(
  'pointermove',
  (e) => {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.set(e.pointerId, localPointerX(e));
    updateWalkDir();
    e.preventDefault();
  },
  { passive: false }
);

function clearPointer(e) {
  if (activePointers.delete(e.pointerId)) {
    updateWalkDir();
  }
}
window.addEventListener('pointerup', clearPointer);
window.addEventListener('pointercancel', clearPointer);
window.addEventListener('pointerleave', clearPointer);

// Apply horizontal movement each frame
player.on('preupdate', () => {
  player.vel.x = walkDir * WALK_SPEED;

  // Keep inside screen horizontally
  const half = PLAYER_SIZE / 2;
  if (player.pos.x < half) {
    player.pos.x = half;
    if (player.vel.x < 0) player.vel.x = 0;
  } else if (player.pos.x > W - half) {
    player.pos.x = W - half;
    if (player.vel.x > 0) player.vel.x = 0;
  }
});

// Win condition
let won = false;
player.on('collisionstart', (evt) => {
  if (won) return;
  if (evt.other === flag) {
    won = true;
    if (typeof window.reportWin === 'function') {
      window.reportWin();
    }
  }
});

// Expose player center in CSS-pixel page coordinates
window.__player = () => {
  const r = canvas.getBoundingClientRect();
  const sx = r.width / W;
  const sy = r.height / H;
  return {
    x: r.left + player.pos.x * sx,
    y: r.top + player.pos.y * sy
  };
};

game.start();
