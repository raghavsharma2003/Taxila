import * as THREE from 'three';

// ----- Page + fixed 360x640 play area -----
Object.assign(document.documentElement.style, {
  margin: '0',
  padding: '0',
  overflow: 'hidden'
});
Object.assign(document.body.style, {
  margin: '0',
  padding: '0',
  overflow: 'hidden',
  background: '#eef6ff'
});

const WIDTH = 360;
const HEIGHT = 640;

const root = document.createElement('div');
Object.assign(root.style, {
  position: 'absolute',
  left: '0px',
  top: '0px',
  width: `${WIDTH}px`,
  height: `${HEIGHT}px`,
  overflow: 'hidden',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'manipulation'
});
document.body.appendChild(root);

// ----- Three.js 2D scene (OrthographicCamera) -----
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(WIDTH, HEIGHT, false);
Object.assign(renderer.domElement.style, {
  width: `${WIDTH}px`,
  height: `${HEIGHT}px`,
  display: 'block',
  position: 'absolute',
  left: '0px',
  top: '0px',
  pointerEvents: 'none' // decoration only, never blocks taps
});
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdff1ff);

const camera = new THREE.OrthographicCamera(0, WIDTH, HEIGHT, 0, -10, 10);
camera.position.z = 1;

// Decorative ball
const ballRadius = 24;
const ball = new THREE.Mesh(
  new THREE.CircleGeometry(ballRadius, 40),
  new THREE.MeshBasicMaterial({ color: 0xff8a65 })
);
scene.add(ball);

let bx = 80;
let by = 220;
let vx = 85; // px/s
let vy = 70; // px/s

// ----- HTML overlay for question + buttons -----
const ui = document.createElement('div');
Object.assign(ui.style, {
  position: 'absolute',
  inset: '0',
  pointerEvents: 'none'
});
root.appendChild(ui);

const question = document.createElement('div');
question.textContent = 'Is 3/4 bigger than 1/2?';
Object.assign(question.style, {
  position: 'absolute',
  left: '20px',
  top: '56px',
  width: '320px',
  textAlign: 'center',
  fontFamily: 'Arial, sans-serif',
  fontWeight: '700',
  fontSize: '32px',
  lineHeight: '1.15',
  color: '#1d3557',
  pointerEvents: 'none'
});
ui.appendChild(question);

const btnWrap = document.createElement('div');
Object.assign(btnWrap.style, {
  position: 'absolute',
  left: '0',
  top: '0',
  width: '100%',
  height: '100%',
  pointerEvents: 'none'
});
ui.appendChild(btnWrap);

function makeButton(label, x, y, bg) {
  const b = document.createElement('button');
  b.textContent = label;
  b.setAttribute('aria-label', label);
  Object.assign(b.style, {
    position: 'absolute',
    left: `${x}px`,
    top: `${y}px`,
    width: '140px',    // >=120
    height: '72px',    // >=64
    borderRadius: '16px',
    border: '3px solid #1d3557',
    background: bg,
    color: '#082032',
    fontFamily: 'Arial, sans-serif',
    fontSize: '34px',
    fontWeight: '700',
    textTransform: 'lowercase',
    boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    transition: 'transform 80ms ease, filter 120ms ease, box-shadow 80ms ease'
  });

  b.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    flashButton(b);
    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }
  });

  b.addEventListener('pointerup', () => b.blur());
  b.addEventListener('pointercancel', () => b.blur());

  btnWrap.appendChild(b);
  return b;
}

function flashButton(btn) {
  btn.style.filter = 'brightness(1.35) saturate(1.2)';
  btn.style.transform = 'scale(0.97)';
  btn.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2)';
  setTimeout(() => {
    btn.style.filter = '';
    btn.style.transform = '';
    btn.style.boxShadow = '0 6px 0 rgba(0,0,0,0.18)';
  }, 140);
}

const yesBtn = makeButton('yes', 30, 470, '#b8f2b6');
const noBtn = makeButton('no', 190, 470, '#ffd2d2');

// Provide button centers in CSS pixel page coordinates
function updateButtonCenters() {
  const yr = yesBtn.getBoundingClientRect();
  const nr = noBtn.getBoundingClientRect();
  window.__buttons = [
    { label: 'yes', x: yr.left + yr.width / 2 + window.scrollX, y: yr.top + yr.height / 2 + window.scrollY },
    { label: 'no',  x: nr.left + nr.width / 2 + window.scrollX, y: nr.top + nr.height / 2 + window.scrollY }
  ];
}
updateButtonCenters();
window.addEventListener('resize', updateButtonCenters);

// ----- Animation loop -----
let last = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  bx += vx * dt;
  by += vy * dt;

  if (bx < ballRadius) { bx = ballRadius; vx *= -1; }
  if (bx > WIDTH - ballRadius) { bx = WIDTH - ballRadius; vx *= -1; }
  if (by < ballRadius) { by = ballRadius; vy *= -1; }
  if (by > HEIGHT - ballRadius) { by = HEIGHT - ballRadius; vy *= -1; }

  ball.position.set(bx, by, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
