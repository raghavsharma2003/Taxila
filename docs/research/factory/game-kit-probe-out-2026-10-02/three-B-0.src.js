import * as THREE from 'three';

const WIDTH = 360;
const HEIGHT = 640;

// ---- Page/canvas setup (exact 360x640 CSS px at top-left, no scrolling) ----
document.body.style.margin = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#111';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
renderer.domElement.style.position = 'fixed';
renderer.domElement.style.left = '0px';
renderer.domElement.style.top = '0px';
renderer.domElement.style.width = `${WIDTH}px`;
renderer.domElement.style.height = `${HEIGHT}px`;
renderer.domElement.style.display = 'block';
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

// y grows downward by setting top < bottom in ortho camera
const camera = new THREE.OrthographicCamera(0, WIDTH, HEIGHT, 0, -100, 100);
camera.position.z = 10;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);

// ---- World ----
const groundH = 80;
const groundTop = HEIGHT - groundH;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WIDTH, groundH),
  new THREE.MeshBasicMaterial({ color: 0x3a8f3a })
);
ground.position.set(WIDTH / 2, groundTop + groundH / 2, 0);
scene.add(ground);

// Player
const playerSize = 32;
const player = {
  x: 36,
  y: 70,
  vx: 0,
  vy: 0,
  speed: 140,
  gravity: 1800
};

const playerMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(playerSize, playerSize),
  new THREE.MeshBasicMaterial({ color: 0x2f2f2f })
);
scene.add(playerMesh);

// Flag near right edge
const flagBaseX = WIDTH - 34;
const poleW = 6;
const poleH = 58;
const bannerW = 22;
const bannerH = 14;

const pole = new THREE.Mesh(
  new THREE.PlaneGeometry(poleW, poleH),
  new THREE.MeshBasicMaterial({ color: 0xe8e8e8 })
);
pole.position.set(flagBaseX, groundTop - poleH / 2, 0);
scene.add(pole);

const banner = new THREE.Mesh(
  new THREE.PlaneGeometry(bannerW, bannerH),
  new THREE.MeshBasicMaterial({ color: 0xff3b30 })
);
banner.position.set(flagBaseX + bannerW / 2, groundTop - poleH + bannerH / 2 + 2, 0);
scene.add(banner);

const flagRect = {
  left: flagBaseX - poleW / 2,
  right: flagBaseX + bannerW,
  top: groundTop - poleH,
  bottom: groundTop
};

// ---- Input ----
const activePointers = new Map(); // pointerId -> clientX
let moveDir = 0; // -1 left, +1 right, 0 stop

function recomputeMoveDir() {
  const rect = renderer.domElement.getBoundingClientRect();
  let hasLeft = false;
  let hasRight = false;

  for (const x of activePointers.values()) {
    const localX = x - rect.left;
    if (localX < 0 || localX > WIDTH) continue;
    if (localX < WIDTH * 0.5) hasLeft = true;
    else hasRight = true;
  }

  moveDir = hasLeft === hasRight ? 0 : hasRight ? 1 : -1;
}

function onPointerDown(e) {
  activePointers.set(e.pointerId, e.clientX);
  recomputeMoveDir();
}
function onPointerMove(e) {
  if (!activePointers.has(e.pointerId)) return;
  activePointers.set(e.pointerId, e.clientX);
  recomputeMoveDir();
}
function onPointerUp(e) {
  activePointers.delete(e.pointerId);
  recomputeMoveDir();
}

window.addEventListener('pointerdown', onPointerDown, { passive: true });
window.addEventListener('pointermove', onPointerMove, { passive: true });
window.addEventListener('pointerup', onPointerUp, { passive: true });
window.addEventListener('pointercancel', onPointerUp, { passive: true });

// ---- Win reporting ----
let won = false;
function aabbIntersect(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
function reportWinOnce() {
  if (won) return;
  won = true;
  if (typeof window.reportWin === 'function') window.reportWin();
}

// Expose player center in CSS-pixel page coordinates
window.__player = () => {
  const rect = renderer.domElement.getBoundingClientRect();
  return { x: rect.left + player.x, y: rect.top + player.y };
};

// ---- Loop ----
let last = performance.now();

function tick(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // Horizontal motion
  player.vx = moveDir * player.speed;
  player.x += player.vx * dt;

  // Gravity / vertical motion
  player.vy += player.gravity * dt;
  player.y += player.vy * dt;

  // Ground collision
  const groundYForCenter = groundTop - playerSize / 2;
  if (player.y > groundYForCenter) {
    player.y = groundYForCenter;
    player.vy = 0;
  }

  // Screen bounds
  const half = playerSize / 2;
  if (player.x < half) player.x = half;
  if (player.x > WIDTH - half) player.x = WIDTH - half;

  // Flag touch check
  const pRect = {
    left: player.x - half,
    right: player.x + half,
    top: player.y - half,
    bottom: player.y + half
  };
  if (aabbIntersect(pRect, flagRect)) reportWinOnce();

  // Render
  playerMesh.position.set(player.x, player.y, 1);
  renderer.render(scene, camera);

  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
