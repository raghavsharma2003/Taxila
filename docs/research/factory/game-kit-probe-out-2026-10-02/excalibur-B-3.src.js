import {
  Engine,
  DisplayMode,
  Actor,
  Color,
  CollisionType,
  Vector
} from 'excalibur';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

// Page/layout constraints
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

const game = new Engine({
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  displayMode: DisplayMode.Fixed,
  suppressPlayButton: true,
  antialiasing: false
});

// Ensure canvas is exactly 360x640 CSS px at top-left
game.canvas.style.position = 'absolute';
game.canvas.style.left = '0px';
game.canvas.style.top = '0px';
game.canvas.style.width = `${GAME_WIDTH}px`;
game.canvas.style.height = `${GAME_HEIGHT}px`;
game.canvas.style.touchAction = 'none';

game.physics.gravity = new Vector(0, 900);

// Ground
const groundHeight = 64;
const ground = new Actor({
  pos: new Vector(GAME_WIDTH / 2, GAME_HEIGHT - groundHeight / 2),
  width: GAME_WIDTH,
  height: groundHeight,
  color: Color.fromRGB(70, 50, 30),
  collisionType: CollisionType.Fixed
});

// Player
const playerSize = 32;
const player = new Actor({
  pos: new Vector(40, 80),
  width: playerSize,
  height: playerSize,
  color: Color.fromRGB(40, 140, 255),
  collisionType: CollisionType.Active
});

// Flag (collidable pole)
const flag = new Actor({
  pos: new Vector(GAME_WIDTH - 24, GAME_HEIGHT - groundHeight - 40),
  width: 16,
  height: 80,
  color: Color.fromRGB(230, 230, 230),
  collisionType: CollisionType.Fixed
});

// Decorative banner
const banner = new Actor({
  pos: new Vector(flag.pos.x + 14, flag.pos.y - 24),
  width: 22,
  height: 16,
  color: Color.fromRGB(40, 220, 90),
  collisionType: CollisionType.PreventCollision
});

game.add(ground);
game.add(flag);
game.add(banner);
game.add(player);

let moveDir = 0; // -1 left, 0 idle, +1 right
const moveSpeed = 140;

function pointerDirFromEvent(evt) {
  const rect = game.canvas.getBoundingClientRect();
  const px =
    (evt.pagePos && evt.pagePos.x) ??
    (evt.screenPos && evt.screenPos.x) ??
    rect.left + rect.width / 2;
  const localX = px - rect.left;
  return localX >= rect.width / 2 ? 1 : -1;
}

game.input.pointers.on('down', (evt) => {
  moveDir = pointerDirFromEvent(evt);
});

game.input.pointers.on('move', (evt) => {
  // Update direction while held/moving
  moveDir = pointerDirFromEvent(evt);
});

game.input.pointers.on('up', () => {
  moveDir = 0;
});

game.input.pointers.on('cancel', () => {
  moveDir = 0;
});

// Constant horizontal walking while held
player.on('preupdate', () => {
  player.vel.x = moveDir * moveSpeed;
});

// Win condition
let reportedWin = false;
player.on('collisionstart', (evt) => {
  if (!reportedWin && evt.other === flag) {
    reportedWin = true;
    if (typeof window.reportWin === 'function') {
      window.reportWin(); // exactly once
    }
  }
});

// Debug hook requested by prompt
window.__player = () => {
  const rect = game.canvas.getBoundingClientRect();
  return {
    x: rect.left + player.pos.x,
    y: rect.top + player.pos.y
  };
};

await game.start();
