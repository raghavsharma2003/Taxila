import { Application, Container, Graphics } from 'pixi.js';

const WIDTH = 360;
const HEIGHT = 640;

const GROUND_H = 96;
const GROUND_Y = HEIGHT - GROUND_H;

const PLAYER_SIZE = 32;
const GRAVITY = 2200; // px/s^2
const WALK_SPEED = 140; // px/s

const FLAG_X = WIDTH - 44;
const FLAG_W = 24;
const FLAG_H = 92;
const FLAG_Y = GROUND_Y - FLAG_H;

async function boot() {
  // Lock page to a fixed 360x640 top-left play area
  Object.assign(document.body.style, {
    margin: '0',
    overflow: 'hidden',
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    position: 'relative',
    touchAction: 'none',
    background: '#87c9ff',
  });

  const app = new Application();
  await app.init({
    width: WIDTH,
    height: HEIGHT,
    resolution: 1,
    autoDensity: false,
    antialias: false,
    background: '#87c9ff',
  });

  const canvas = app.canvas;
  Object.assign(canvas.style, {
    position: 'absolute',
    left: '0px',
    top: '0px',
    width: `${WIDTH}px`,
    height: `${HEIGHT}px`,
    display: 'block',
    touchAction: 'none',
  });
  document.body.appendChild(canvas);

  const world = new Container();
  app.stage.addChild(world);

  // Ground
  const ground = new Graphics().rect(0, GROUND_Y, WIDTH, GROUND_H).fill(0x4b8b3b);
  world.addChild(ground);

  // Flag
  const flag = new Container();
  const pole = new Graphics().rect(0, 0, 4, FLAG_H).fill(0xf2f2f2);
  const cloth = new Graphics().rect(4, 8, 18, 14).fill(0xff3b30);
  const base = new Graphics().rect(-5, FLAG_H - 4, 14, 4).fill(0xcccccc);
  flag.addChild(pole, cloth, base);
  flag.position.set(FLAG_X, FLAG_Y);
  world.addChild(flag);

  // Player
  const playerGfx = new Graphics().rect(0, 0, PLAYER_SIZE, PLAYER_SIZE).fill(0x1f4fd1);
  world.addChild(playerGfx);

  let px = 24;
  let py = 24;
  let vy = 0;

  let moveDir = 0; // -1 left, 1 right, 0 idle
  const activePointers = new Map(); // pointerId -> x
  let won = false;

  function updateMoveDir() {
    if (activePointers.size === 0) {
      moveDir = 0;
      return;
    }
    // Use the most recently inserted active pointer
    let lastX = 0;
    for (const x of activePointers.values()) lastX = x;
    moveDir = lastX >= WIDTH * 0.5 ? 1 : -1;
  }

  function onPointerDown(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return;
    activePointers.set(e.pointerId, x);
    updateMoveDir();
  }

  function onPointerMove(e) {
    if (!activePointers.has(e.pointerId)) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    activePointers.set(e.pointerId, x);
    updateMoveDir();
  }

  function onPointerUpLike(e) {
    if (!activePointers.has(e.pointerId)) return;
    activePointers.delete(e.pointerId);
    updateMoveDir();
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUpLike, { passive: true });
  window.addEventListener('pointercancel', onPointerUpLike, { passive: true });

  function intersects(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  }

  window.__player = () => ({
    x: px + PLAYER_SIZE * 0.5,
    y: py + PLAYER_SIZE * 0.5,
  });

  app.ticker.add((ticker) => {
    const dt = Math.min(0.033, ticker.deltaMS / 1000);

    // Horizontal movement
    px += moveDir * WALK_SPEED * dt;
    if (px < 0) px = 0;
    if (px > WIDTH - PLAYER_SIZE) px = WIDTH - PLAYER_SIZE;

    // Gravity + floor collision
    vy += GRAVITY * dt;
    py += vy * dt;

    if (py + PLAYER_SIZE >= GROUND_Y) {
      py = GROUND_Y - PLAYER_SIZE;
      vy = 0;
    }

    // Win check (call exactly once)
    if (
      !won &&
      intersects(px, py, PLAYER_SIZE, PLAYER_SIZE, FLAG_X - 2, FLAG_Y, FLAG_W + 4, FLAG_H)
    ) {
      won = true;
      if (typeof window.reportWin === 'function') window.reportWin();
    }

    playerGfx.position.set(px, py);
  });
}

boot();
