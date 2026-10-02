import { Engine, DisplayMode, Actor, Color, Circle, vec } from 'excalibur';

// --- Page/canvas layout: exact 360x640 CSS px at top-left, no scrolling ---
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#ffffff';

const canvas = document.createElement('canvas');
canvas.id = 'game';
canvas.width = 360;
canvas.height = 640;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = '360px';
canvas.style.height = '640px';
canvas.style.display = 'block';
canvas.style.zIndex = '0';
document.body.appendChild(canvas);

// --- Excalibur engine ---
const game = new Engine({
  canvasElementId: 'game',
  width: 360,
  height: 640,
  displayMode: DisplayMode.Fixed,
  suppressHiDPIScaling: true
});

game.backgroundColor = Color.fromRGB(245, 250, 255);

// Decorative bouncing ball (behind buttons, never blocks taps)
const ballRadius = 26;
const ball = new Actor({
  pos: vec(90, 230),
  z: 0
});
ball.graphics.use(
  new Circle({
    radius: ballRadius,
    color: Color.fromRGB(120, 190, 255)
  })
);
ball.vel = vec(95, 78);

ball.on('preupdate', (evt) => {
  const dt = evt.delta / 1000;
  // Gentle movement
  ball.pos = ball.pos.add(ball.vel.scale(dt));

  // Bounce inside canvas bounds
  if (ball.pos.x < ballRadius) {
    ball.pos.x = ballRadius;
    ball.vel.x = Math.abs(ball.vel.x);
  } else if (ball.pos.x > 360 - ballRadius) {
    ball.pos.x = 360 - ballRadius;
    ball.vel.x = -Math.abs(ball.vel.x);
  }

  if (ball.pos.y < ballRadius) {
    ball.pos.y = ballRadius;
    ball.vel.y = Math.abs(ball.vel.y);
  } else if (ball.pos.y > 640 - ballRadius) {
    ball.pos.y = 640 - ballRadius;
    ball.vel.y = -Math.abs(ball.vel.y);
  }
});

game.add(ball);

// --- DOM UI overlay (simple, reliable taps on phones) ---
const ui = document.createElement('div');
ui.style.position = 'absolute';
ui.style.left = '0px';
ui.style.top = '0px';
ui.style.width = '360px';
ui.style.height = '640px';
ui.style.zIndex = '10';
ui.style.pointerEvents = 'none'; // only buttons enable pointer events
document.body.appendChild(ui);

const question = document.createElement('div');
question.textContent = 'Is 3/4 bigger than 1/2?';
question.style.position = 'absolute';
question.style.left = '20px';
question.style.top = '56px';
question.style.width = '320px';
question.style.textAlign = 'center';
question.style.fontFamily = 'Arial, sans-serif';
question.style.fontSize = '30px';
question.style.fontWeight = '700';
question.style.color = '#1d2a44';
question.style.pointerEvents = 'none';
ui.appendChild(question);

function makeButton(label, left, top, baseColor) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.position = 'absolute';
  btn.style.left = `${left}px`;
  btn.style.top = `${top}px`;
  btn.style.width = '140px'; // >=120
  btn.style.height = '80px'; // >=64
  btn.style.border = '0';
  btn.style.borderRadius = '16px';
  btn.style.background = baseColor;
  btn.style.color = '#fff';
  btn.style.fontFamily = 'Arial, sans-serif';
  btn.style.fontSize = '34px';
  btn.style.fontWeight = '700';
  btn.style.boxShadow = '0 6px 0 rgba(0,0,0,0.2)';
  btn.style.pointerEvents = 'auto';
  btn.style.touchAction = 'manipulation';

  const flash = () => {
    btn.style.filter = 'brightness(1.35)';
    btn.style.transform = 'scale(0.98)';
    setTimeout(() => {
      btn.style.filter = '';
      btn.style.transform = '';
    }, 140);
  };

  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    flash();
    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }
  });

  ui.appendChild(btn);
  return btn;
}

const yesBtn = makeButton('yes', 30, 420, '#2f9e44');
const noBtn = makeButton('no', 190, 420, '#e03131');

function setButtonCenters() {
  const yesRect = yesBtn.getBoundingClientRect();
  const noRect = noBtn.getBoundingClientRect();
  window.__buttons = [
    {
      label: 'yes',
      x: yesRect.left + yesRect.width / 2 + window.scrollX,
      y: yesRect.top + yesRect.height / 2 + window.scrollY
    },
    {
      label: 'no',
      x: noRect.left + noRect.width / 2 + window.scrollX,
      y: noRect.top + noRect.height / 2 + window.scrollY
    }
  ];
}

setButtonCenters();
window.addEventListener('resize', setButtonCenters);

game.start();
