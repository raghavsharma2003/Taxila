import { Engine, DisplayMode, Actor, CollisionType, Color, vec } from 'excalibur';

const SCREEN_W = 360;
const SCREEN_H = 640;
const GROUND_H = 80;
const PLAYER_SIZE = 32;
const MOVE_SPEED = 170;

// Page/canvas layout: exact 360x640 CSS px at top-left, no scroll/scale behavior from page
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';

const canvas = document.createElement('canvas');
canvas.id = 'game';
canvas.width = SCREEN_W;
canvas.height = SCREEN_H;
canvas.style.position = 'absolute';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.width = `${SCREEN_W}px`;
canvas.style.height = `${SCREEN_H}px`;
canvas.style.display = 'block';
canvas.style.touchAction = 'none';
document.body.appendChild(canvas);

const game = new Engine({
  width: SCREEN_W,
  height: SCREEN_H,
  displayMode: DisplayMode.Fixed,
  canvasElementId: 'game',
});

game.physics.gravity = vec(0, 1200);

// Ground
const ground = new Actor({
  pos: vec(SCREEN_W / 2, SCREEN_H - GROUND_H / 2),
  width: SCREEN_W,
  height: GROUND_H,
  color: Color.fromRGB(70, 120, 70),
});
ground.body.collisionType = CollisionType.Fixed;

// Player
const player = new Actor({
  pos: vec(40, 80),
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  color: Color.fromRGB(40, 170, 255),
});
player.body.collisionType = CollisionType.Active;

// Flag (win target)
const flag = new Actor({
  pos: vec(SCREEN_W - 26, SCREEN_H - GROUND_H - 28),
  width: 18,
  height: 56,
  color: Color.fromRGB(240, 220, 70),
});
flag.body.collisionType = CollisionType.Passive;
flag.body.useGravity = false;

game.add(ground);
game.add(flag);
game.add(player);

let moveDir = 0;
let activePointerId = null;
let won = false;

const dirFromClientX = (clientX) => {
  const r = canvas.getBoundingClientRect();
  return clientX < r.left + r.width / 2 ? -1 : 1;
};

canvas.addEventListener('pointerdown', (e) => {
  if (activePointerId === null) activePointerId = e.pointerId;
  if (e.pointerId === activePointerId) moveDir = dirFromClientX(e.clientX);
});

canvas.addEventListener('pointermove', (e) => {
  if (e.pointerId === activePointerId) moveDir = dirFromClientX(e.clientX);
});

const stopIfActive = (e) => {
  if (e.pointerId === activePointerId) {
    activePointerId = null;
    moveDir = 0;
  }
};
canvas.addEventListener('pointerup', stopIfActive);
canvas.addEventListener('pointercancel', stopIfActive);
canvas.addEventListener('lostpointercapture', stopIfActive);
window.addEventListener('blur', () => {
  activePointerId = null;
  moveDir = 0;
});

player.on('preupdate', () => {
  player.vel.x = moveDir * MOVE_SPEED;

  // Keep player inside horizontal bounds
  const half = PLAYER_SIZE / 2;
  if (player.pos.x < half) {
    player.pos.x = half;
    if (player.vel.x < 0) player.vel.x = 0;
  } else if (player.pos.x > SCREEN_W - half) {
    player.pos.x = SCREEN_W - half;
    if (player.vel.x > 0) player.vel.x = 0;
  }
});

const overlaps = (a, b) => {
  const al = a.pos.x - a.width / 2;
  const ar = a.pos.x + a.width / 2;
  const at = a.pos.y - a.height / 2;
  const ab = a.pos.y + a.height / 2;

  const bl = b.pos.x - b.width / 2;
  const br = b.pos.x + b.width / 2;
  const bt = b.pos.y - b.height / 2;
  const bb = b.pos.y + b.height / 2;

  return al < br && ar > bl && at < bb && ab > bt;
};

game.on('postupdate', () => {
  if (!won && overlaps(player, flag)) {
    won = true;
    if (typeof window.reportWin === 'function') {
      window.reportWin();
    }
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

game.start();
