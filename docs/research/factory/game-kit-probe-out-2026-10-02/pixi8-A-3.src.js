import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';

(async () => {
  const WIDTH = 360;
  const HEIGHT = 640;

  const app = new Application();
  await app.init({
    width: WIDTH,
    height: HEIGHT,
    background: 0xf3f8ff,
    antialias: true,
    resolution: 1,
    autoDensity: false,
  });

  document.documentElement.style.margin = '0';
  document.documentElement.style.padding = '0';
  document.documentElement.style.overflow = 'hidden';
  document.body.style.margin = '0';
  document.body.style.padding = '0';
  document.body.style.overflow = 'hidden';

  const canvas = app.canvas;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = `${WIDTH}px`;
  canvas.style.height = `${HEIGHT}px`;
  canvas.style.display = 'block';
  canvas.style.touchAction = 'manipulation';

  document.body.appendChild(canvas);

  const decorLayer = new Container();
  decorLayer.eventMode = 'none';
  app.stage.addChild(decorLayer);

  const uiLayer = new Container();
  app.stage.addChild(uiLayer);

  const question = new Text({
    text: 'Is 3/4 bigger than 1/2?',
    style: new TextStyle({
      fontFamily: 'Arial',
      fontSize: 34,
      fontWeight: '700',
      fill: 0x1f2a44,
      align: 'center',
      wordWrap: true,
      wordWrapWidth: 320,
    }),
  });
  question.anchor.set(0.5);
  question.x = WIDTH / 2;
  question.y = 110;
  uiLayer.addChild(question);

  const ballRadius = 26;
  const ball = new Graphics();
  ball.circle(0, 0, ballRadius).fill({ color: 0x55d6ff });
  ball.alpha = 0.9;
  ball.x = 80;
  ball.y = 250;
  decorLayer.addChild(ball);

  const ballShine = new Graphics();
  ballShine.circle(0, 0, 9).fill({ color: 0xffffff });
  ballShine.alpha = 0.45;
  ballShine.x = -8;
  ballShine.y = -10;
  ball.addChild(ballShine);

  let vx = 1.4;
  let vy = 1.1;

  function drawButton(g, w, h, color) {
    g.clear();
    g.roundRect(-w / 2, -h / 2, w, h, 16).fill({ color });
  }

  function makeButton(label, x, y, color, flashColor) {
    const w = 160;
    const h = 82;

    const c = new Container();
    c.x = x;
    c.y = y;

    const bg = new Graphics();
    drawButton(bg, w, h, color);
    bg.eventMode = 'static';
    bg.cursor = 'pointer';

    const txt = new Text({
      text: label,
      style: new TextStyle({
        fontFamily: 'Arial',
        fontSize: 38,
        fontWeight: '700',
        fill: 0xffffff,
      }),
    });
    txt.anchor.set(0.5);

    c.addChild(bg, txt);

    let flashTimer = null;
    const flash = () => {
      drawButton(bg, w, h, flashColor);
      c.scale.set(0.96);
      clearTimeout(flashTimer);
      flashTimer = setTimeout(() => {
        drawButton(bg, w, h, color);
        c.scale.set(1);
      }, 140);
    };

    bg.on('pointertap', () => {
      flash();
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });

    return { label, x, y, container: c };
  }

  const yesBtn = makeButton('yes', WIDTH / 2, 360, 0x3a86ff, 0x76a9ff);
  const noBtn = makeButton('no', WIDTH / 2, 485, 0xff6b6b, 0xff9b9b);

  uiLayer.addChild(yesBtn.container, noBtn.container);

  function publishButtonCenters() {
    const rect = canvas.getBoundingClientRect();
    window.__buttons = [
      { label: 'yes', x: rect.left + yesBtn.x, y: rect.top + yesBtn.y },
      { label: 'no', x: rect.left + noBtn.x, y: rect.top + noBtn.y },
    ];
  }

  publishButtonCenters();
  window.addEventListener('resize', publishButtonCenters);

  app.ticker.add((ticker) => {
    const d = ticker.deltaTime;
    ball.x += vx * d;
    ball.y += vy * d;

    if (ball.x < ballRadius) {
      ball.x = ballRadius;
      vx = Math.abs(vx);
    } else if (ball.x > WIDTH - ballRadius) {
      ball.x = WIDTH - ballRadius;
      vx = -Math.abs(vx);
    }

    if (ball.y < ballRadius) {
      ball.y = ballRadius;
      vy = Math.abs(vy);
    } else if (ball.y > HEIGHT - ballRadius) {
      ball.y = HEIGHT - ballRadius;
      vy = -Math.abs(vy);
    }
  });
})();
