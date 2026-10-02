import { Application, Container, Graphics, Text } from 'pixi.js';

const WIDTH = 360;
const HEIGHT = 640;

// Lock page layout for a fixed 360x640 canvas at top-left.
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#eaf0ff';

const app = new Application();
await app.init({
  width: WIDTH,
  height: HEIGHT,
  resolution: 1,
  autoDensity: false,
  antialias: true,
  background: 0xf5f8ff,
});

const canvas = app.canvas;
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.width = `${WIDTH}px`;
canvas.style.height = `${HEIGHT}px`;
canvas.style.display = 'block';
document.body.appendChild(canvas);

// Decorative moving ball layer (behind buttons, non-interactive).
const decoLayer = new Container();
decoLayer.eventMode = 'none';
app.stage.addChild(decoLayer);

const ball = new Graphics();
const BALL_R = 24;
ball.circle(0, 0, BALL_R).fill(0x66d9ff);
ball.x = 120;
ball.y = 260;
ball.alpha = 0.85;
ball.eventMode = 'none';
decoLayer.addChild(ball);

let vx = 1.9;
let vy = 1.5;

// Question text near the top.
const question = new Text({
  text: 'Is 3/4 bigger than 1/2?',
  style: {
    fontFamily: 'Arial',
    fontSize: 34,
    fontWeight: '700',
    fill: 0x1d2a44,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: 320,
  },
});
question.anchor.set(0.5, 0);
question.x = WIDTH / 2;
question.y = 52;
app.stage.addChild(question);

// Buttons layer (in front of ball).
const uiLayer = new Container();
app.stage.addChild(uiLayer);

function makeButton(label, cx, cy, color) {
  const w = 180;
  const h = 84;

  const c = new Container();
  c.x = cx;
  c.y = cy;
  c.eventMode = 'static';
  c.cursor = 'pointer';

  const bg = new Graphics();
  bg.roundRect(-w / 2, -h / 2, w, h, 18).fill(color);
  bg.stroke({ color: 0x223355, width: 3, alpha: 0.2 });
  c.addChild(bg);

  const flash = new Graphics();
  flash.roundRect(-w / 2, -h / 2, w, h, 18).fill(0xffffff);
  flash.alpha = 0;
  flash.eventMode = 'none';
  c.addChild(flash);

  const t = new Text({
    text: label,
    style: {
      fontFamily: 'Arial',
      fontSize: 44,
      fontWeight: '800',
      fill: 0xffffff,
      align: 'center',
    },
  });
  t.anchor.set(0.5);
  c.addChild(t);

  let flashTimer = null;
  c.on('pointertap', () => {
    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }

    flash.alpha = 0.72;
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      flash.alpha = 0;
      flashTimer = null;
    }, 130);
  });

  uiLayer.addChild(c);
  return { label, container: c };
}

const yesBtn = makeButton('yes', WIDTH / 2, 350, 0x4caf50);
const noBtn = makeButton('no', WIDTH / 2, 475, 0xef5350);

function updateButtonCenters() {
  const rect = canvas.getBoundingClientRect();
  window.__buttons = [
    {
      label: 'yes',
      x: rect.left + yesBtn.container.x,
      y: rect.top + yesBtn.container.y,
    },
    {
      label: 'no',
      x: rect.left + noBtn.container.x,
      y: rect.top + noBtn.container.y,
    },
  ];
}
updateButtonCenters();
window.addEventListener('resize', updateButtonCenters, { passive: true });
window.addEventListener('scroll', updateButtonCenters, { passive: true });

// Animation loop for gentle bouncing.
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime; // ~1 at 60fps
  ball.x += vx * dt;
  ball.y += vy * dt;

  if (ball.x < BALL_R) {
    ball.x = BALL_R;
    vx *= -1;
  } else if (ball.x > WIDTH - BALL_R) {
    ball.x = WIDTH - BALL_R;
    vx *= -1;
  }

  if (ball.y < BALL_R) {
    ball.y = BALL_R;
    vy *= -1;
  } else if (ball.y > HEIGHT - BALL_R) {
    ball.y = HEIGHT - BALL_R;
    vy *= -1;
  }
});
