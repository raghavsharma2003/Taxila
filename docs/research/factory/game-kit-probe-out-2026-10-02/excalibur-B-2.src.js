import { Engine, Actor, Color, CollisionType, DisplayMode, Physics, vec } from 'excalibur';

const WIDTH = 360;
const HEIGHT = 640;
const GROUND_H = 72;
const PLAYER_SIZE = 32;
const WALK_SPEED = 180;

// Page/canvas layout: exact 360x640 CSS px at top-left, no scrolling
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';

Physics.gravity = vec(0, 1200);

const game = new Engine({
  width: WIDTH,
  height: HEIGHT,
  displayMode: DisplayMode.Fixed,
  antialiasing: false,
  pixelArt: true,
  suppressHiDPIScaling: true,
  suppressConsoleBootMessage: true,
  suppressPlayButton: true
});

const canvas = game.canvas;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.display = 'block';
canvas.style.touchAction = 'none';

// Ground
const ground = new Actor({
  x: WIDTH / 2,
  y: HEIGHT - GROUND_H / 2,
  width: WIDTH,
  height: GROUND_H,
  color: Color.fromRGB(60, 170, 80),
  collisionType: CollisionType.Fixed
});

// Player
const player = new Actor({
  x: 40,
  y: 100,
  width: PLAYER_SIZE,
  height: PLAYER_SIZE,
  color: Color.fromRGB(50, 100, 240),
  collisionType: CollisionType.Active
});

// Flag pole (touch target)
const flag = new Actor({
  x: WIDTH - 24,
  y: HEIGHT - GROUND_H - 40,
  width: 14,
  height: 80,
  color: Color.fromRGB(230, 230, 230),
  collisionType: CollisionType.Fixed
});

// Flag cloth (visual only)
const cloth = new Actor({
  x: WIDTH - 8,
  y: HEIGHT - GROUND_H - 66,
  width: 26,
  height: 18,
  color: Color.fromRGB(240, 70, 70),
  collisionType: CollisionType.PreventCollision
});

game.currentScene.add(ground);
game.currentScene.add(flag);
game.currentScene.add(cloth);
game.currentScene.add(player);

// Pointer/touch movement
let pointerDown = false;
let moveDir = 0; // -1 left, +1 right, 0 stop

function xFromPointerEvent(evt) {
  if (evt?.screenPos?.x != null) return evt.screenPos.x;
  if (evt?.pagePos?.x != null) return evt.pagePos.x;
  if (evt?.worldPos?.x != null) return evt.worldPos.x;
  return WIDTH / 2;
}

function updateDirFromX(x) {
  moveDir = x >= WIDTH / 2 ? 1 : -1;
}

const primary = game.input.pointers.primary;

primary.on('down', (evt) => {
  pointerDown = true;
  updateDirFromX(xFromPointerEvent(evt));
});

primary.on('move', (evt) => {
  if (!pointerDown) return;
  updateDirFromX(xFromPointerEvent(evt));
});

primary.on('up', () => {
  pointerDown = false;
  moveDir = 0;
});

primary.on('cancel', () => {
  pointerDown = false;
  moveDir = 0;
});

game.on('preupdate', () => {
  player.vel.x = pointerDown ? moveDir * WALK_SPEED : 0;
});

// Win condition: report exactly once
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
window.__player = () => ({
  x: player.pos.x,
  y: player.pos.y
});

game.start();
