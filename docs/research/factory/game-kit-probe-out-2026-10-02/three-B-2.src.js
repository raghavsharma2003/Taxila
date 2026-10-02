import * as THREE from 'three';

const WIDTH = 360;
const HEIGHT = 640;

// --- Page/canvas setup (fixed 360x640 at top-left, no scrolling) ---
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#111';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
renderer.setClearColor(0x8fd3ff, 1);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '0px';
renderer.domElement.style.top = '0px';
renderer.domElement.style.width = `${WIDTH}px`;
renderer.domElement.style.height = `${HEIGHT}px`;
renderer.domElement.style.display = 'block';
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

// y grows downward (CSS-like coordinates)
const camera = new THREE.OrthographicCamera(0, WIDTH, HEIGHT, 0, -100, 100);
camera.position.z = 10;

const scene = new THREE.Scene();

// --- Level ---
const groundHeight = 96;
const groundTop = HEIGHT - groundHeight;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WIDTH, groundHeight),
  new THREE.MeshBasicMaterial({ color: 0x3c8d2f })
);
ground.position.set(WIDTH * 0.5, groundTop + groundHeight * 0.5, 0);
scene.add(ground);

// Simple decorative stripe on ground
const stripe = new THREE.Mesh(
  new THREE.PlaneGeometry(WIDTH, 8),
  new THREE.MeshBasicMaterial({ color: 0x2d6f23 })
);
stripe.position.set(WIDTH * 0.5, groundTop + 4, 0.01);
scene.add(stripe);

// --- Player ---
const playerSize = 32;
const playerHalf = playerSize * 0.5;
const player = {
  x: 44,
  y: 120,
  vx: 0,
  vy: 0,
  speed: 140,
  gravity: 1400
};

const playerMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(playerSize, playerSize),
  new THREE.MeshBasicMaterial({ color: 0xffd84d })
);
scene.add(playerMesh);

// --- Flag near right edge ---
const flagPoleH = 70;
const flagPoleW = 6;
const flagX = WIDTH - 28;
const flagTopY = groundTop - flagPoleH;

const pole = new THREE.Mesh(
  new THREE.PlaneGeometry(flagPoleW, flagPoleH),
  new THREE.MeshBasicMaterial({ color: 0xe6e6e6 })
);
pole.position.set(flagX, flagTopY + flagPoleH * 0.5, 0.02);
scene.add(pole);

const clothW = 20;
const clothH = 14;
const cloth = new THREE.Mesh(
  new THREE.PlaneGeometry(clothW, clothH),
  new THREE.MeshBasicMaterial({ color: 0xff4d4d })
);
cloth.position.set(flagX + flagPoleW * 0.5 + clothW * 0.5, flagTopY + clothH * 0.75, 0.03);
scene.add(cloth);

// Flag collision box
const flagHit = {
  x: flagX + 10,
  y: groundTop - 48,
  w: 24,
  h: 48
};

let hasWon = false;

// --- Input ---
let activePointerId = null;
let pointerX = 0;
let moveDir = 0; // -1 left, 1 right, 0 none

function updateMoveDir() {
  if (activePointerId === null) {
    moveDir = 0;
  } else {
    moveDir = pointerX >= WIDTH * 0.5 ? 1 : -1;
  }
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (activePointerId === null) activePointerId = e.pointerId;
  if (e.pointerId === activePointerId) {
    pointerX = e.offsetX;
    updateMoveDir();
  }
  e.preventDefault();
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerId === activePointerId) {
    pointerX = e.offsetX;
    updateMoveDir();
  }
  e.preventDefault();
});

function endPointer(e) {
  if (e.pointerId === activePointerId) {
    activePointerId = null;
    updateMoveDir();
  }
  e.preventDefault();
}

renderer.domElement.addEventListener('pointerup', endPointer);
renderer.domElement.addEventListener('pointercancel', endPointer);
renderer.domElement.addEventListener('pointerleave', (e) => {
  if (e.pointerId === activePointerId && e.buttons === 0) endPointer(e);
});

// --- Utility ---
function intersectsAABB(ax, ay, aw, ah, bx, by, bw, bh) {
  return (
    ax < bx + bw &&
    ax + aw > bx &&
    ay < by + bh &&
    ay + ah > by
  );
}

// Expose player center in CSS pixel page coordinates
window.__player = () => ({ x: player.x, y: player.y });

// --- Game loop ---
let last = performance.now();

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // Horizontal movement
  player.vx = moveDir * player.speed;
  player.x += player.vx * dt;

  // Gravity
  player.vy += player.gravity * dt;
  player.y += player.vy * dt;

  // Ground collision
  const playerBottom = player.y + playerHalf;
  if (playerBottom >= groundTop) {
    player.y = groundTop - playerHalf;
    player.vy = 0;
  }

  // Keep on screen horizontally
  if (player.x < playerHalf) player.x = playerHalf;
  if (player.x > WIDTH - playerHalf) player.x = WIDTH - playerHalf;

  // Win check
  if (!hasWon) {
    const px = player.x - playerHalf;
    const py = player.y - playerHalf;
    if (intersectsAABB(px, py, playerSize, playerSize, flagHit.x, flagHit.y, flagHit.w, flagHit.h)) {
      hasWon = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin();
      }
    }
  }

  playerMesh.position.set(player.x, player.y, 0.05);

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
