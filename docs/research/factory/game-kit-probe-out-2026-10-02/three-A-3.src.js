import * as THREE from 'three';

// --- Fixed 360x640 phone-sized stage at top-left ---
const W = 360;
const H = 640;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f3f7ff';

const root = document.createElement('div');
root.style.position = 'absolute';
root.style.left = '0px';
root.style.top = '0px';
root.style.width = `${W}px`;
root.style.height = `${H}px`;
root.style.overflow = 'hidden';
root.style.userSelect = 'none';
root.style.touchAction = 'none';
document.body.appendChild(root);

// --- Three.js 2D scene (OrthographicCamera) ---
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(W, H, false);
renderer.domElement.style.width = `${W}px`;
renderer.domElement.style.height = `${H}px`;
renderer.domElement.style.display = 'block';
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '0';
renderer.domElement.style.top = '0';
renderer.domElement.style.pointerEvents = 'none'; // decoration only, never blocks taps
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#eaf2ff');

const camera = new THREE.OrthographicCamera(0, W, H, 0, -100, 100);
camera.position.z = 10;

// Decorative bouncing ball
const ballRadius = 26;
const ball = new THREE.Mesh(
  new THREE.CircleGeometry(ballRadius, 48),
  new THREE.MeshBasicMaterial({ color: new THREE.Color('hsl(210, 80%, 55%)' })
);
ball.position.set(W * 0.35, H * 0.55, 0);
scene.add(ball);

let vx = 72; // px/s
let vy = 58; // px/s

// subtle shadow-ish ring
const ring = new THREE.Mesh(
  new THREE.RingGeometry(ballRadius + 2, ballRadius + 6, 48),
  new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.08 })
);
ring.position.z = -0.1;
scene.add(ring);

// --- UI overlay ---
const ui = document.createElement('div');
ui.style.position = 'absolute';
ui.style.left = '0';
ui.style.top = '0';
ui.style.width = `${W}px`;
ui.style.height = `${H}px`;
ui.style.zIndex = '5';
root.appendChild(ui);

const question = document.createElement('div');
question.textContent = 'Is 3/4 bigger than 1/2?';
question.style.position = 'absolute';
question.style.left = '18px';
question.style.top = '42px';
question.style.width = `${W - 36}px`;
question.style.textAlign = 'center';
question.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
question.style.fontSize = '30px';
question.style.fontWeight = '700';
question.style.lineHeight = '1.2';
question.style.color = '#1b2a4a';
question.style.textShadow = '0 1px 0 rgba(255,255,255,0.8)';
question.style.pointerEvents = 'none';
ui.appendChild(question);

function makeButton(label, left, top) {
  const b = document.createElement('button');
  b.textContent = label;
  b.style.position = 'absolute';
  b.style.left = `${left}px`;
  b.style.top = `${top}px`;
  b.style.width = '132px';   // >=120
  b.style.height = '80px';   // >=64
  b.style.border = '0';
  b.style.borderRadius = '16px';
  b.style.fontFamily = 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
  b.style.fontSize = '36px';
  b.style.fontWeight = '800';
  b.style.textTransform = 'lowercase';
  b.style.color = '#ffffff';
  b.style.cursor = 'pointer';
  b.style.touchAction = 'manipulation';
  b.style.boxShadow = '0 8px 20px rgba(0,0,0,0.22)';
  b.style.transition = 'transform 80ms ease, filter 80ms ease, box-shadow 80ms ease';

  if (label === 'yes') {
    b.style.background = 'linear-gradient(180deg,#47c66b,#2e9f50)';
  } else {
    b.style.background = 'linear-gradient(180deg,#ff7a7a,#de4e4e)';
  }

  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    flashButton(b);
    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }
  });

  ui.appendChild(b);
  return b;
}

function flashButton(btn) {
  btn.style.transform = 'scale(0.96)';
  btn.style.filter = 'brightness(1.35)';
  btn.style.boxShadow = '0 3px 10px rgba(0,0,0,0.18)';
  setTimeout(() => {
    btn.style.transform = 'scale(1)';
    btn.style.filter = 'brightness(1)';
    btn.style.boxShadow = '0 8px 20px rgba(0,0,0,0.22)';
  }, 140);
}

// Clearly separated buttons
const yesBtn = makeButton('yes', 34, 430);
const noBtn = makeButton('no', 194, 430);

// Report button centers in CSS page coordinates
function updateButtonCenters() {
  const yRect = yesBtn.getBoundingClientRect();
  const nRect = noBtn.getBoundingClientRect();
  window.__buttons = [
    { label: 'yes', x: yRect.left + yRect.width / 2, y: yRect.top + yRect.height / 2 },
    { label: 'no', x: nRect.left + nRect.width / 2, y: nRect.top + nRect.height / 2 }
  ];
}
updateButtonCenters();

// --- Animation loop ---
const clock = new THREE.Clock();

function animate() {
  const dt = Math.min(clock.getDelta(), 0.05);

  // gentle bounce
  ball.position.x += vx * dt;
  ball.position.y += vy * dt;

  if (ball.position.x < ballRadius) {
    ball.position.x = ballRadius;
    vx = Math.abs(vx);
  } else if (ball.position.x > W - ballRadius) {
    ball.position.x = W - ballRadius;
    vx = -Math.abs(vx);
  }

  if (ball.position.y < ballRadius) {
    ball.position.y = ballRadius;
    vy = Math.abs(vy);
  } else if (ball.position.y > H - ballRadius) {
    ball.position.y = H - ballRadius;
    vy = -Math.abs(vy);
  }

  const t = performance.now() * 0.00025;
  ball.material.color.setHSL((t % 1), 0.75, 0.56);

  ring.position.x = ball.position.x + 6;
  ring.position.y = ball.position.y + 8;

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
