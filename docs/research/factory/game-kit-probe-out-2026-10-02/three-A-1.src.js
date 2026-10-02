import * as THREE from 'three';

const W = 360;
const H = 640;

// Page/canvas layout: fixed 360x640 at top-left, no scrolling/scaling.
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.width = `${W}px`;
document.body.style.height = `${H}px`;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.left = '0px';
renderer.domElement.style.top = '0px';
renderer.domElement.style.width = `${W}px`;
renderer.domElement.style.height = `${H}px`;
renderer.domElement.style.display = 'block';
renderer.domElement.style.touchAction = 'none';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f9ff);

const camera = new THREE.OrthographicCamera(0, W, H, 0, 0.1, 1000);
camera.position.z = 10;

// Soft background panel
{
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(330, 580),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  panel.position.set(W / 2, H / 2, -20);
  scene.add(panel);
}

function makeTextTexture(text, opts = {}) {
  const width = opts.width || 340;
  const height = opts.height || 72;
  const font = opts.font || 'bold 32px sans-serif';
  const color = opts.color || '#1f2a44';

  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, width, height);
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { tex, width, height };
}

function roundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function makeButtonTexture(label) {
  const bw = 256;
  const bh = 128;
  const c = document.createElement('canvas');
  c.width = bw;
  c.height = bh;
  const ctx = c.getContext('2d');

  ctx.clearRect(0, 0, bw, bh);
  roundedRect(ctx, 6, 6, bw - 12, bh - 12, 26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#2d3a57';
  ctx.stroke();

  ctx.font = 'bold 56px sans-serif';
  ctx.fillStyle = '#111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, bw / 2, bh / 2 + 2);

  const tex = new THREE.CanvasTexture(c);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

// Question text
{
  const t = makeTextTexture('Is 3/4 bigger than 1/2?', { width: 350, height: 90, font: 'bold 34px sans-serif' });
  const q = new THREE.Mesh(
    new THREE.PlaneGeometry(330, 80),
    new THREE.MeshBasicMaterial({ map: t.tex, transparent: true })
  );
  q.position.set(W / 2, 110, 5);
  scene.add(q);
}

// Decorative bouncing ball (behind buttons)
const ball = new THREE.Mesh(
  new THREE.CircleGeometry(24, 32),
  new THREE.MeshBasicMaterial({ color: 0xff7fb3 })
);
ball.position.set(80, 300, 0);
scene.add(ball);

let vx = 120; // px/sec
let vy = 95;  // px/sec
const ballR = 24;
const bounds = { left: 20 + ballR, right: W - 20 - ballR, top: 180 + ballR, bottom: H - 40 - ballR };

// Buttons
const BUTTON_W = 120;
const BUTTON_H = 70;
const buttonDefs = [
  { label: 'yes', x: 90, y: 430, baseColor: new THREE.Color(0x74c0fc), flashColor: new THREE.Color(0xfff176) },
  { label: 'no',  x: 270, y: 430, baseColor: new THREE.Color(0xa5d6a7), flashColor: new THREE.Color(0xfff176) }
];

const buttons = buttonDefs.map(def => {
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(BUTTON_W, BUTTON_H),
    new THREE.MeshBasicMaterial({
      map: makeButtonTexture(def.label),
      transparent: true,
      color: def.baseColor.clone()
    })
  );
  mesh.position.set(def.x, def.y, 8);
  scene.add(mesh);
  return { ...def, mesh, flashUntil: 0 };
});

function updateButtonCentersGlobal() {
  const rect = renderer.domElement.getBoundingClientRect();
  window.__buttons = buttons.map(b => ({
    label: b.label,
    x: rect.left + b.x,
    y: rect.top + b.y
  }));
}
updateButtonCentersGlobal();
window.addEventListener('resize', updateButtonCentersGlobal);

function getCanvasPoint(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function hitButton(px, py) {
  for (const b of buttons) {
    if (
      px >= b.x - BUTTON_W / 2 &&
      px <= b.x + BUTTON_W / 2 &&
      py >= b.y - BUTTON_H / 2 &&
      py <= b.y + BUTTON_H / 2
    ) return b;
  }
  return null;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  const p = getCanvasPoint(e);
  const b = hitButton(p.x, p.y);
  if (!b) return;

  b.flashUntil = performance.now() + 180;

  if (typeof window.reportAnswer === 'function') {
    try {
      window.reportAnswer(b.label);
    } catch (_) {}
  }
});

let last = performance.now();
function animate(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // Move and bounce decorative ball
  ball.position.x += vx * dt;
  ball.position.y += vy * dt;

  if (ball.position.x < bounds.left) { ball.position.x = bounds.left; vx = Math.abs(vx); }
  if (ball.position.x > bounds.right) { ball.position.x = bounds.right; vx = -Math.abs(vx); }
  if (ball.position.y < bounds.top) { ball.position.y = bounds.top; vy = Math.abs(vy); }
  if (ball.position.y > bounds.bottom) { ball.position.y = bounds.bottom; vy = -Math.abs(vy); }

  // Button flash feedback
  for (const b of buttons) {
    const m = b.mesh.material;
    if (now < b.flashUntil) {
      m.color.copy(b.flashColor);
    } else {
      m.color.copy(b.baseColor);
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
