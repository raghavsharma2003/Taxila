import { Application, Container, Graphics, Text } from 'pixi.js';

async function main() {
  // Lock page layout to a fixed 360x640 game area at top-left.
  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';

  const app = new Application();
  await app.init({
    width: 360,
    height: 640,
    resolution: 1,
    autoDensity: false,
    background: 0xf4f7ff,
    antialias: true,
  });

  const canvas = app.canvas;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = '360px';
  canvas.style.height = '640px';
  canvas.style.display = 'block';
  canvas.style.touchAction = 'none';
  document.body.appendChild(canvas);

  // Question
  const question = new Text({
    text: 'Is 3/4 bigger than 1/2?',
    style: {
      fontFamily: 'Arial, sans-serif',
      fontSize: 34,
      fill: 0x1f2a44,
      fontWeight: '700',
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 320,
    },
  });
  question.anchor.set(0.5, 0);
  question.x = 180;
  question.y = 56;
  app.stage.addChild(question);

  // Decorative bouncing ball (behind buttons, non-interactive).
  const ballRadius = 26;
  const ball = new Graphics().circle(0, 0, ballRadius).fill(0x6ad5ff);
  ball.alpha = 0.85;
  ball.eventMode = 'none';
  app.stage.addChild(ball);

  let bx = 180;
  let by = 280;
  let vx = 1.15;
  let vy = 0.95;

  // Buttons container (on top of ball).
  const ui = new Container();
  app.stage.addChild(ui);

  function makeButton(label, cx, cy, color) {
    const w = 140;
    const h = 80;

    const c = new Container();
    c.x = cx;
    c.y = cy;
    c.eventMode = 'static';
    c.cursor = 'pointer';

    const bg = new Graphics().roundRect(-w / 2, -h / 2, w, h, 18).fill(color).stroke({
      color: 0x1f2a44,
      width: 3,
    });
    c.addChild(bg);

    const txt = new Text({
      text: label,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 36,
        fill: 0xffffff,
        fontWeight: '700',
      },
    });
    txt.anchor.set(0.5);
    c.addChild(txt);

    let flashTimer = 0;
    function flash() {
      flashTimer = 8; // frames-ish
      c.scale.set(0.96);
      bg.tint = 0xffffcc;
    }

    c.on('pointerdown', () => {
      flash();
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });

    c._tickFlash = () => {
      if (flashTimer > 0) {
        flashTimer--;
        if (flashTimer === 0) {
          c.scale.set(1);
          bg.tint = 0xffffff;
        }
      }
    };

    ui.addChild(c);
    return c;
  }

  const yesBtn = makeButton('yes', 95, 455, 0x33b56a);
  const noBtn = makeButton('no', 265, 455, 0xe85d5d);

  function updateButtonCoords() {
    const r = canvas.getBoundingClientRect();
    window.__buttons = [
      { label: 'yes', x: r.left + yesBtn.x, y: r.top + yesBtn.y },
      { label: 'no', x: r.left + noBtn.x, y: r.top + noBtn.y },
    ];
  }
  updateButtonCoords();
  window.addEventListener('resize', updateButtonCoords);

  app.ticker.add((t) => {
    // Ball motion
    bx += vx * t.deltaTime;
    by += vy * t.deltaTime;

    if (bx < ballRadius) {
      bx = ballRadius;
      vx = Math.abs(vx);
    } else if (bx > 360 - ballRadius) {
      bx = 360 - ballRadius;
      vx = -Math.abs(vx);
    }

    if (by < 130 + ballRadius) {
      by = 130 + ballRadius;
      vy = Math.abs(vy);
    } else if (by > 620 - ballRadius) {
      by = 620 - ballRadius;
      vy = -Math.abs(vy);
    }

    ball.x = bx;
    ball.y = by;

    yesBtn._tickFlash();
    noBtn._tickFlash();
  });
}

main();
