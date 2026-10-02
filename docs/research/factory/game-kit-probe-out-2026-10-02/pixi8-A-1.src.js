import { Application, Container, Graphics, Text, Rectangle } from 'pixi.js';

const app = new Application();
await app.init({
  width: 360,
  height: 640,
  background: 0xf6fbff,
  antialias: true,
  autoDensity: true,
  resolution: window.devicePixelRatio || 1,
});

Object.assign(document.documentElement.style, {
  margin: '0',
  padding: '0',
  overflow: 'hidden',
});

Object.assign(document.body.style, {
  margin: '0',
  padding: '0',
  overflow: 'hidden',
});

const canvas = app.canvas;
Object.assign(canvas.style, {
  position: 'absolute',
  left: '0px',
  top: '0px',
  width: '360px',
  height: '640px',
  display: 'block',
  touchAction: 'manipulation',
});

document.body.appendChild(canvas);

const stage = app.stage;

// Soft background accents
const bg = new Graphics()
  .rect(0, 0, 360, 640)
  .fill(0xf6fbff)
  .circle(70, 90, 90)
  .fill({ color: 0xdff3ff, alpha: 0.8 })
  .circle(320, 580, 110)
  .fill({ color: 0xffe8f4, alpha: 0.7 });
stage.addChild(bg);

// Decorative moving ball layer (behind buttons, non-interactive)
const decorLayer = new Container();
decorLayer.eventMode = 'none';
stage.addChild(decorLayer);

const ballRadius = 26;
const ball = new Graphics()
  .circle(0, 0, ballRadius)
  .fill(0x6ecb63)
  .circle(-8, -8, 8)
  .fill({ color: 0xffffff, alpha: 0.35 });

ball.x = 120;
ball.y = 220;
decorLayer.addChild(ball);

let vx = 2.1;
let vy = 1.6;

// Question text
const question = new Text({
  text: 'Is 3/4 bigger than 1/2?',
  style: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 34,
    fontWeight: '700',
    fill: 0x1f2a44,
    align: 'center',
  },
});
question.anchor.set(0.5, 0);
question.x = 180;
question.y = 54;
stage.addChild(question);

function makeButton(label, cx, cy, baseColor) {
  const container = new Container();
  container.x = cx;
  container.y = cy;
  container.eventMode = 'static';
  container.cursor = 'pointer';

  const w = 150;
  const h = 80;

  const bg = new Graphics();
  const draw = (flash = false) => {
    bg.clear()
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .fill(flash ? 0xffffff : baseColor)
      .roundRect(-w / 2, -h / 2, w, h, 18)
      .stroke({ color: 0x2d3a55, width: 3 });
  };
  draw(false);

  const txt = new Text({
    text: label,
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 38,
      fontWeight: '700',
      fill: 0x1b2338,
      align: 'center',
    },
  });
  txt.anchor.set(0.5);

  container.hitArea = new Rectangle(-w / 2, -h / 2, w, h);
  container.addChild(bg, txt);

  let flashing = false;
  container.on('pointertap', () => {
    if (!flashing) {
      flashing = true;
      draw(true);
      setTimeout(() => {
        draw(false);
        flashing = false;
      }, 140);
    }

    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }
  });

  return container;
}

const yesButton = makeButton('yes', 180, 330, 0x8de9a8);
const noButton = makeButton('no', 180, 450, 0xffb3b3);

stage.addChild(yesButton, noButton);

function publishButtonCenters() {
  const rect = canvas.getBoundingClientRect();
  const sx = rect.width / app.screen.width;
  const sy = rect.height / app.screen.height;

  window.__buttons = [
    {
      label: 'yes',
      x: rect.left + yesButton.x * sx,
      y: rect.top + yesButton.y * sy,
    },
    {
      label: 'no',
      x: rect.left + noButton.x * sx,
      y: rect.top + noButton.y * sy,
    },
  ];
}

publishButtonCenters();
window.addEventListener('resize', publishButtonCenters);

// Animate decorative ball continuously
app.ticker.add((ticker) => {
  const dt = ticker.deltaTime;
  ball.x += vx * dt;
  ball.y += vy * dt;

  const minX = ballRadius;
  const maxX = 360 - ballRadius;
  const minY = 120;
  const maxY = 640 - ballRadius;

  if (ball.x < minX) {
    ball.x = minX;
    vx *= -1;
  } else if (ball.x > maxX) {
    ball.x = maxX;
    vx *= -1;
  }

  if (ball.y < minY) {
    ball.y = minY;
    vy *= -1;
  } else if (ball.y > maxY) {
    ball.y = maxY;
    vy *= -1;
  }
});
