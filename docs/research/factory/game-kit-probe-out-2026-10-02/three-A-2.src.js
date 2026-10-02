import * as THREE from 'three';

const W = 360;
const H = 640;

// Page setup: exact 360x640 area at top-left, no scrolling.
Object.assign(document.documentElement.style, {
  margin: '0',
  padding: '0',
  overflow: 'hidden',
});
Object.assign(document.body.style, {
  margin: '0',
  padding: '0',
  overflow: 'hidden',
  background: '#f4f7ff',
});

const root = document.createElement('div');
Object.assign(root.style, {
  position: 'fixed',
  left: '0px',
  top: '0px',
  width: `${W}px`,
  height: `${H}px`,
  overflow: 'hidden',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  touchAction: 'manipulation',
});
document.body.appendChild(root);

// three.js scene (2D via OrthographicCamera)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(W, H, false);
Object.assign(renderer.domElement.style, {
  position: 'absolute',
  left: '0px',
  top: '0px',
  width: `${W}px`,
  height: `${H}px`,
  display: 'block',
});
root.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdfefff);

const camera = new THREE.OrthographicCamera(0, W, H, 0, -10, 10);
camera.position.z = 1;

// Decorative bouncing ball behind buttons
const ballGeo = new THREE.CircleGeometry(24, 40);
const ballMat = new THREE.MeshBasicMaterial({ color: 0xff7aa2 });
const ball = new THREE.Mesh(ballGeo, ballMat);
ball.position.set(90, 240, 0);
scene.add(ball);

let vx = 90; // px/sec
let vy = 70;

// UI layer above canvas
const ui = document.createElement('div');
Object.assign(ui.style, {
  position: 'absolute',
  left: '0px',
  top: '0px',
  width: `${W}px`,
  height: `${H}px`,
  pointerEvents: 'none', // allow only specific elements to receive events
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
  fontSize: '30px',
  fontWeight: '700',
  color: '#1f2a44',
  lineHeight: '1.2',
  pointerEvents: 'none',
});
ui.appendChild(question);

const buttonRow = document.createElement('div');
Object.assign(buttonRow.style, {
  position: 'absolute',
  left: '0px',
  top: '410px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  gap: '30px',
  pointerEvents: 'none',
});
ui.appendChild(buttonRow);

function makeButton(label, bg) {
  const b = document.createElement('button');
  b.textContent = label;
  Object.assign(b.style, {
    width: '130px',
    height: '72px',
    border: '0',
    borderRadius: '16px',
    fontFamily: 'Arial, sans-serif',
    fontSize: '34px',
    fontWeight: '700',
    color: '#ffffff',
    background: bg,
    boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
    cursor: 'pointer',
    pointerEvents: 'auto',
    touchAction: 'manipulation',
    transform: 'translateY(0px)',
    transition: 'transform 80ms ease, filter 80ms ease, box-shadow 80ms ease',
  });
  return b;
}

const yesBtn = makeButton('yes', '#34b86b');
const noBtn = makeButton('no', '#ff6a5a');
buttonRow.appendChild(yesBtn);
buttonRow.appendChild(noBtn);

function flashButton(btn) {
  btn.style.transform = 'translateY(2px) scale(0.98)';
  btn.style.filter = 'brightness(1.25)';
  btn.style.boxShadow = '0 2px 0 rgba(0,0,0,0.18)';
  setTimeout(() => {
    btn.style.transform = 'translateY(0px) scale(1)';
    btn.style.filter = 'brightness(1)';
    btn.style.boxShadow = '0 6px 0 rgba(0,0,0,0.18)';
  }, 140);
}

function sendAnswer(label, btn) {
  flashButton(btn);
  if (typeof window.reportAnswer === 'function') {
    window.reportAnswer(label);
  }
}

yesBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sendAnswer('yes', yesBtn);
});
noBtn.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  sendAnswer('no', noBtn);
});

// Expose button centers in CSS page coordinates
function updateButtonCenters() {
  const y = yesBtn.getBoundingClientRect();
  const n = noBtn.getBoundingClientRect();
  window.__buttons = [
    {
      label: 'yes',
      x: y.left + y.width / 2 + window.scrollX,
      y: y.top + y.height / 2 + window.scrollY,
    },
    {
      label: 'no',
      x: n.left + n.width / 2 + window.scrollX,
      y: n.top + n.height / 2 + window.scrollY,
    },
  ];
}
requestAnimationFrame(updateButtonCenters);
window.addEventListener('resize', updateButtonCenters);

// Animation loop
let last = performance.now();
function animate(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // Move and bounce
  ball.position.x += vx * dt;
  ball.position.y += vy * dt;

  const r = 24;
  if (ball.position.x < r) {
    ball.position.x = r;
    vx = Math.abs(vx);
  } else if (ball.position.x > W - r) {
    ball.position.x = W - r;
    vx = -Math.abs(vx);
  }
  if (ball.position.y < r) {
    ball.position.y = r;
    vy = Math.abs(vy);
  } else if (ball.position.y > H - r) {
    ball.position.y = H - r;
    vy = -Math.abs(vy);
  }

  // Gentle color drift
  const t = now * 0.001;
  const hue = (0.9 + 0.1 * Math.sin(t * 0.8)) % 1;
  ballMat.color.setHSL(hue, 0.75, 0.62);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
