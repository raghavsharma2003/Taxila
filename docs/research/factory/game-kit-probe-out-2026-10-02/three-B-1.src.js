import * as THREE from 'three';

const GAME_W = 360;
const GAME_H = 640;
const GROUND_H = 80;
const PLAYER_SIZE = 32;
const HALF_PLAYER = PLAYER_SIZE * 0.5;
const GROUND_TOP = GAME_H - GROUND_H;

const GRAVITY = 1800; // px/s^2 downward
const WALK_SPEED = 140; // px/s

// Page/canvas layout: exact 360x640 CSS px at top-left, no scrolling.
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#111';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setSize(GAME_W, GAME_H, false);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '0px';
renderer.domElement.style.top = '0px';
renderer.domElement.style.width = `${GAME_W}px`;
renderer.domElement.style.height = `${GAME_H}px`;
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

// Orthographic camera in CSS-pixel world coords, y grows downward.
const camera = new THREE.OrthographicCamera(0, GAME_W, GAME_H, 0, -10, 10);
camera.position.z = 1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(GAME_W, GROUND_H),
  new THREE.MeshBasicMaterial({ color: 0x5f9e50 })
);
ground.position.set(GAME_W * 0.5, GAME_H - GROUND_H * 0.5, 0);
scene.add(ground);

// Player
const player = new THREE.Mesh(
  new THREE.PlaneGeometry(PLAYER_SIZE, PLAYER_SIZE),
  new THREE.MeshBasicMaterial({ color: 0x2e3a8c })
);
player.position.set(28 + HALF_PLAYER, 100, 0.1);
scene.add(player);

let vxDir = 0;
let vy = 0;

// Flag near right edge
const flagGroup = new THREE.Group();
scene.add(flagGroup);

const poleX = GAME_W - 28;
const poleH = 90;
const poleW = 6;
const poleTop = GROUND_TOP - poleH;

const pole = new THREE.Mesh(
  new THREE.PlaneGeometry(poleW, poleH),
  new THREE.MeshBasicMaterial({ color: 0xd8d8d8 })
);
pole.position.set(poleX, poleTop + poleH * 0.5, 0.2);
flagGroup.add(pole);

const clothW = 26;
const clothH = 18;
const cloth = new THREE.Mesh(
  new THREE.PlaneGeometry(clothW, clothH),
  new THREE.MeshBasicMaterial({ color: 0xff4040 })
);
cloth.position.set(poleX + clothW * 0.5, poleTop + 14, 0.21);
flagGroup.add(cloth);

// Simple flag collision box
const flagBox = {
  left: poleX - poleW * 0.5,
  right: poleX + clothW,
  top: poleTop,
  bottom: GROUND_TOP
};

let won = false;

// Expose player center in CSS-pixel page coordinates.
window.__player = () => ({
  x: player.position.x,
  y: player.position.y
});

// Input: hold pointer on left/right half to walk.
let activePointerId = null;

function inGameArea(clientX, clientY) {
  return clientX >= 0 && clientX <= GAME_W && clientY >= 0 && clientY <= GAME_H;
}

function dirFromX(clientX) {
  return clientX >= GAME_W * 0.5 ? 1 : -1;
}

function onPointerDown(e) {
  if (!inGameArea(e.clientX, e.clientY)) return;
  activePointerId = e.pointerId;
  vxDir = dirFromX(e.clientX);
}

function onPointerMove(e) {
  if (e.pointerId !== activePointerId) return;
  vxDir = dirFromX(e.clientX);
}

function clearPointer(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  vxDir = 0;
}

window.addEventListener('pointerdown', onPointerDown, { passive: true });
window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerup', clearPointer, { passive: true });
window.addEventListener('pointercancel', clearPointer, { passive: true });

const clock = new THREE.Clock();

function aabbOverlap(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function update(dt) {
  // Horizontal movement
  player.position.x += vxDir * WALK_SPEED * dt;
  player.position.x = THREE.MathUtils.clamp(player.position.x, HALF_PLAYER, GAME_W - HALF_PLAYER);

  // Gravity + ground collision
  vy += GRAVITY * dt;
  player.position.y += vy * dt;

  const playerBottom = player.position.y + HALF_PLAYER;
  if (playerBottom > GROUND_TOP) {
    player.position.y = GROUND_TOP - HALF_PLAYER;
    vy = 0;
  }

  // Win check
  if (!won) {
    const p = {
      left: player.position.x - HALF_PLAYER,
      right: player.position.x + HALF_PLAYER,
      top: player.position.y - HALF_PLAYER,
      bottom: player.position.y + HALF_PLAYER
    };
    if (aabbOverlap(p, flagBox)) {
      won = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin();
      }
    }
  }
}

function loop() {
  const dt = Math.min(clock.getDelta(), 0.033);
  update(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

loop();
