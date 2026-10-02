import * as LJS from 'littlejsengine';
void LJS; // Framework is available; UI is custom DOM/canvas for exact pixel layout

// Page lock: no scrolling, fixed phone-sized play area at top-left
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f4f8ff';

// Small local stylesheet
const style = document.createElement('style');
style.textContent = `
  .quiz-root { position: absolute; left: 0; top: 0; width: 360px; height: 640px; overflow: hidden; touch-action: manipulation; user-select: none; }
  .quiz-question { position: absolute; left: 16px; top: 24px; width: 328px; text-align: center; font: 700 30px/1.2 system-ui, sans-serif; color: #1f2a44; z-index: 2; }
  .quiz-btn {
    position: absolute; width: 140px; height: 80px; border: 0; border-radius: 16px;
    font: 700 34px/1 system-ui, sans-serif; color: #fff; cursor: pointer; z-index: 2;
    box-shadow: 0 8px 0 rgba(0,0,0,.18), 0 3px 12px rgba(0,0,0,.18);
    transform: translateY(0);
  }
  .quiz-btn:active { transform: translateY(2px); box-shadow: 0 6px 0 rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.18); }
  .quiz-btn.flash { filter: brightness(1.35) saturate(1.2); }
`;
document.head.appendChild(style);

// Root container
const root = document.createElement('div');
root.className = 'quiz-root';
document.body.appendChild(root);

// Canvas (exactly 360x640 CSS px at top-left, no scaling)
const canvas = document.createElement('canvas');
canvas.width = 360;
canvas.height = 640;
canvas.style.position = 'absolute';
canvas.style.left = '0';
canvas.style.top = '0';
canvas.style.width = '360px';
canvas.style.height = '640px';
canvas.style.zIndex = '0';
root.appendChild(canvas);
const ctx = canvas.getContext('2d');

// Question text
const question = document.createElement('div');
question.className = 'quiz-question';
question.textContent = 'Is 3/4 bigger than 1/2?';
root.appendChild(question);

// Buttons
function makeButton(label, left, top, color) {
  const b = document.createElement('button');
  b.className = 'quiz-btn';
  b.textContent = label;
  b.style.left = `${left}px`;
  b.style.top = `${top}px`;
  b.style.background = color;
  b.setAttribute('aria-label', label);
  root.appendChild(b);
  return b;
}
const yesBtn = makeButton('yes', 35, 430, '#2f9e44');
const noBtn  = makeButton('no', 185, 430, '#e03131');

// Expose button center coordinates in page CSS pixels
function updateButtonCenters() {
  const yesRect = yesBtn.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  window.__buttons = [
    { label: 'yes', x: yesRect.left + yesRect.width / 2 + window.scrollX, y: yesRect.top + yesRect.height / 2 + window.scrollY },
    { label: 'no',  x: noRect.left + noRect.width / 2 + window.scrollX,  y: noRect.top + noRect.height / 2 + window.scrollY }
  ];
}
updateButtonCenters();
window.addEventListener('resize', updateButtonCenters);

// Button tap logic + flash
function tap(label, button) {
  button.classList.remove('flash');
  void button.offsetWidth; // restart flash
  button.classList.add('flash');
  setTimeout(() => button.classList.remove('flash'), 180);

  if (typeof window.reportAnswer === 'function') {
    window.reportAnswer(label);
  }
}
yesBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); tap('yes', yesBtn); });
noBtn.addEventListener('pointerdown',  (e) => { e.preventDefault(); tap('no', noBtn); });

// Decorative bouncing ball behind UI
const ball = {
  x: 120,
  y: 220,
  r: 30,
  vx: 95,
  vy: 78,
  hue: 200
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  // Move + bounce
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  if (ball.x < ball.r) { ball.x = ball.r; ball.vx *= -1; }
  if (ball.x > canvas.width - ball.r) { ball.x = canvas.width - ball.r; ball.vx *= -1; }
  if (ball.y < ball.r) { ball.y = ball.r; ball.vy *= -1; }
  if (ball.y > canvas.height - ball.r) { ball.y = canvas.height - ball.r; ball.vy *= -1; }
  ball.hue = (ball.hue + 18 * dt) % 360;

  // Draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#eef4ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Decorative subtle shapes
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = '#b6d4ff';
  ctx.beginPath(); ctx.arc(300, 120, 60, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(50, 560, 70, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Ball with highlight
  const grad = ctx.createRadialGradient(ball.x - ball.r * 0.35, ball.y - ball.r * 0.35, ball.r * 0.1, ball.x, ball.y, ball.r);
  grad.addColorStop(0, `hsl(${(ball.hue + 30) % 360} 100% 78%)`);
  grad.addColorStop(1, `hsl(${ball.hue} 85% 52%)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
