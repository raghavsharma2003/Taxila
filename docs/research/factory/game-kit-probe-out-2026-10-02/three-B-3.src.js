import * as THREE from 'three';

// --- Fixed phone-sized viewport ------------------------------------------------
const WIDTH = 360;
const HEIGHT = 640;

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '0px';
renderer.domElement.style.top = '0px';
renderer.domElement.style.width = `${WIDTH}px`;
renderer.domElement.style.height = `${HEIGHT}px`;
renderer.domElement.style.display = 'block';
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

// 2D camera where world units == CSS pixels, origin at top-left, +y downward
const camera = new THREE.OrthographicCamera(0, WIDTH, HEIGHT, 0, -100, 100);
camera.position.z = 10;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9ed0ff);

// --- World --------------------------------------------------------------------
const groundHeight = 80;
const groundTop = HEIGHT - groundHeight;

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(WIDTH, groundHeight),
  new THREE.MeshBasicMaterial({ color: 0x3e7d2d })
);
ground.position.set(WIDTH / 2, groundTop + groundHeight / 2, 0);
scene.add(ground);

// Player
const playerSize = 32;
const player = {
  x: 36,
  y: 80,
  vx: 0,
  vy: 0,
  onGround: false
};

const playerMesh = new THREE.Mesh(
  new THREE.PlaneGeometry(playerSize, playerSize),
  new THREE.MeshBasicMaterial({ color: 0x1f1f1f })
);
playerMesh.position.set(player.x, player.y, 1);
scene.add(playerMesh);

// Flag near right edge
const flagX = WIDTH - 30;
const poleHeight = 72;
const poleWidth = 6;

const pole = new THREE.Mesh(
  new THREE.PlaneGeometry(poleWidth, poleHeight),
  new THREE.MeshBasicMaterial({ color: 0xe8e8e8 })
);
pole.position.set(flagX, groundTop - poleHeight / 2, 1);
scene.add(pole);

const clothW = 20;
const clothH = 14;
const cloth = new THREE.Mesh(
  new THREE.PlaneGeometry(clothW, clothH),
  new THREE.MeshBasicMaterial({ color: 0xff3b30 })
);
cloth.position.set(flagX + clothW / 2, groundTop - poleHeight + clothH / 2 + 6, 1);
scene.add(cloth);

// --- Input --------------------------------------------------------------------
let moveDir = 0; // -1 left, +1 right, 0 none
let activePointerId = null;

function dirFromClientX(clientX) {
  const rect = renderer.domElement.getBoundingClientRect();
  const x = clientX - rect.left;
  return x >= rect.width / 2 ? 1 : -1;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  activePointerId = e.pointerId;
  moveDir = dirFromClientX(e.clientX);
  renderer.domElement.setPointerCapture(e.pointerId);
});

renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerId !== activePointerId) return;
  moveDir = dirFromClientX(e.clientX);
});

function releasePointer(e) {
  if (e.pointerId !== activePointerId) return;
  activePointerId = null;
  moveDir = 0;
}
renderer.domElement.addEventListener('pointerup', releasePointer);
renderer.domElement.addEventListener('pointercancel', releasePointer);
renderer.domElement.addEventListener('lostpointercapture', () => {
  activePointerId = null;
  moveDir = 0;
});

// --- Win condition -------------------------------------------------------------
let won = false;
function checkFlagTouch() {
  // Player AABB
  const pL = player.x - playerSize / 2;
  const pR = player.x + playerSize / 2;
  const pT = player.y - playerSize / 2;
  const pB = player.y + playerSize / 2;

  // Flag AABB (pole + cloth area)
  const fL = flagX - poleWidth / 2;
  const fR = flagX + clothW;
  const fT = groundTop - poleHeight;
  const fB = groundTop;

  const overlap = pL < fR && pR > fL && pT < fB && pB > fT;
  if (overlap && !won) {
    won = true;
    if (typeof window.reportWin === 'function') window.reportWin();
  }
}

// --- External debug hook -------------------------------------------------------
window.__player = () => ({ x: player.x, y: player.y });

// --- Game loop ----------------------------------------------------------------
const walkSpeed = 170;      // px/s
const gravity = 1800;       // px/s^2
let last = performance.now();

function tick(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;

  // Horizontal movement
  player.vx = moveDir * walkSpeed;
  player.x += player.vx * dt;

  // Gravity + vertical movement
  player.vy += gravity * dt;
  player.y += player.vy * dt;

  // Ground collision (player rests ON top)
  const playerBottom = player.y + playerSize / 2;
  if (playerBottom >= groundTop) {
    player.y = groundTop - playerSize / 2;
    player.vy = 0;
    player.onGround = true;
  } else {
    player.onGround = false;
  }

  // Screen bounds
  const half = playerSize / 2;
  if (player.x < half) player.x = half;
  if (player.x > WIDTH - half) player.x = WIDTH - half;

  playerMesh.position.set(player.x, player.y, 1);

  checkFlagTouch();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);
