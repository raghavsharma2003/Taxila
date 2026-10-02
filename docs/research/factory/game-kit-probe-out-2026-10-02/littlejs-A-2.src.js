import * as LJS from 'littlejsengine';

const WIDTH = 360;
const HEIGHT = 640;

const buttonSize = { w: 140, h: 80 };
const yesButton = { label: 'yes', cx: 100, cy: 430, flash: 0 };
const noButton = { label: 'no', cx: 260, cy: 430, flash: 0 };
const buttons = [yesButton, noButton];

const ball = {
  x: 80,
  y: 260,
  vx: 110,
  vy: 90,
  r: 24,
  color: '#4fc3f7',
};

let ctx = null;

function stylePageAndCanvas() {
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';
  document.body.style.background = '#f4f7ff';

  const canvases = [LJS.mainCanvas, LJS.overlayCanvas].filter(Boolean);
  canvases.forEach((c) => {
    c.width = WIDTH;
    c.height = HEIGHT;
    c.style.position = 'absolute';
    c.style.left = '0px';
    c.style.top = '0px';
    c.style.width = `${WIDTH}px`;
    c.style.height = `${HEIGHT}px`;
    c.style.maxWidth = `${WIDTH}px`;
    c.style.maxHeight = `${HEIGHT}px`;
    c.style.transform = 'none';
    c.style.margin = '0';
    c.style.touchAction = 'manipulation';
  });

  // Ensure decorative canvas never blocks pointer handling
  if (LJS.overlayCanvas) LJS.overlayCanvas.style.pointerEvents = 'none';
}

function updateButtonCentersGlobal() {
  const rect = (LJS.mainCanvas || document.querySelector('canvas'))?.getBoundingClientRect() || {
    left: 0,
    top: 0,
  };
  window.__buttons = buttons.map((b) => ({
    label: b.label,
    x: rect.left + b.cx,
    y: rect.top + b.cy,
  }));
}

function pointInButton(x, y, b) {
  return (
    x >= b.cx - buttonSize.w / 2 &&
    x <= b.cx + buttonSize.w / 2 &&
    y >= b.cy - buttonSize.h / 2 &&
    y <= b.cy + buttonSize.h / 2
  );
}

function chooseAnswer(label) {
  const b = label === 'yes' ? yesButton : noButton;
  b.flash = 0.2;
  if (typeof window.reportAnswer === 'function') window.reportAnswer(label);
}

function onPointerDown(e) {
  const canvas = LJS.mainCanvas || document.querySelector('canvas');
  if (!canvas) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  if (x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return;

  for (const b of buttons) {
    if (pointInButton(x, y, b)) {
      chooseAnswer(b.label);
      break;
    }
  }
}

function gameInit() {
  if (LJS.setCanvasFixedSize) LJS.setCanvasFixedSize(LJS.vec2(WIDTH, HEIGHT));
  stylePageAndCanvas();
  updateButtonCentersGlobal();
  window.addEventListener('resize', updateButtonCentersGlobal);
  window.addEventListener('pointerdown', onPointerDown, { passive: true });

  ctx = LJS.overlayContext || LJS.mainContext;
}

function gameUpdate() {
  const dt = LJS.timeDelta || 1 / 60;

  // Ball movement
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  if (ball.x < ball.r) {
    ball.x = ball.r;
    ball.vx *= -1;
  } else if (ball.x > WIDTH - ball.r) {
    ball.x = WIDTH - ball.r;
    ball.vx *= -1;
  }
  if (ball.y < ball.r) {
    ball.y = ball.r;
    ball.vy *= -1;
  } else if (ball.y > HEIGHT - ball.r) {
    ball.y = HEIGHT - ball.r;
    ball.vy *= -1;
  }

  for (const b of buttons) b.flash = Math.max(0, b.flash - dt);
}

function gameUpdatePost() {}

function drawButton(b) {
  const x = b.cx - buttonSize.w / 2;
  const y = b.cy - buttonSize.h / 2;
  const flashing = b.flash > 0;

  ctx.fillStyle = flashing ? '#ffe066' : '#ffffff';
  ctx.strokeStyle = flashing ? '#f59f00' : '#334155';
  ctx.lineWidth = 4;
  const r = 14;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + buttonSize.w - r, y);
  ctx.quadraticCurveTo(x + buttonSize.w, y, x + buttonSize.w, y + r);
  ctx.lineTo(x + buttonSize.w, y + buttonSize.h - r);
  ctx.quadraticCurveTo(x + buttonSize.w, y + buttonSize.h, x + buttonSize.w - r, y + buttonSize.h);
  ctx.lineTo(x + r, y + buttonSize.h);
  ctx.quadraticCurveTo(x, y + buttonSize.h, x, y + buttonSize.h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(b.label, b.cx, b.cy + 1);
}

function gameRender() {}

function gameRenderPost() {
  if (!ctx) ctx = LJS.overlayContext || LJS.mainContext;
  if (!ctx) return;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Background
  ctx.fillStyle = '#eaf2ff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Decorative ball (behind buttons)
  ctx.fillStyle = ball.color;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Question text
  ctx.fillStyle = '#102a43';
  ctx.font = 'bold 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('Is 3/4 bigger than 1/2?', WIDTH / 2, 72);

  // Buttons
  drawButton(yesButton);
  drawButton(noButton);
}

LJS.engineInit(gameInit, gameUpdate, gameUpdatePost, gameRender, gameRenderPost);
