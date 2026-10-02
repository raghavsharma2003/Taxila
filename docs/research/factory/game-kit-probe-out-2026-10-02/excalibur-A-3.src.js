import {
  Engine,
  DisplayMode,
  Actor,
  Label,
  Font,
  FontUnit,
  Color,
  vec
} from 'excalibur';

// Lock page to a 360x640 viewport at top-left, no scroll
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.width = '360px';
document.body.style.height = '640px';

const game = new Engine({
  width: 360,
  height: 640,
  displayMode: DisplayMode.Fixed
});

const W = 360;
const H = 640;

// Decorative bouncing ball (behind UI)
const ball = new Actor({
  pos: vec(180, 280),
  width: 52,
  height: 52,
  z: 1
});
ball.color = Color.fromRGB(90, 180, 255);
ball.enableCapturePointer = false;

let vx = 72;
let vy = 58;
ball.on('preupdate', (_evt) => {
  const dt = _evt.delta / 1000;
  ball.pos.x += vx * dt;
  ball.pos.y += vy * dt;

  const r = 26;
  if (ball.pos.x < r) {
    ball.pos.x = r;
    vx = Math.abs(vx);
  } else if (ball.pos.x > W - r) {
    ball.pos.x = W - r;
    vx = -Math.abs(vx);
  }

  if (ball.pos.y < r + 20) {
    ball.pos.y = r + 20;
    vy = Math.abs(vy);
  } else if (ball.pos.y > H - r - 20) {
    ball.pos.y = H - r - 20;
    vy = -Math.abs(vy);
  }
});

game.add(ball);

// Question text
const question = new Label({
  text: 'Is 3/4 bigger than 1/2?',
  pos: vec(20, 70),
  font: new Font({
    family: 'Arial',
    size: 30,
    unit: FontUnit.Px,
    color: Color.Black
  }),
  z: 20
});
game.add(question);

// Buttons
const buttonW = 140;
const buttonH = 80;

function makeButton(label, x, y, color) {
  const box = new Actor({
    pos: vec(x, y),
    width: buttonW,
    height: buttonH,
    z: 10
  });
  box.color = color;

  const text = new Label({
    text: label,
    pos: vec(x, y - 2),
    font: new Font({
      family: 'Arial',
      size: 40,
      unit: FontUnit.Px,
      color: Color.White
    }),
    z: 11
  });
  text.anchor = vec(0.5, 0.5);

  game.add(box);
  game.add(text);

  return { label, x, y, actor: box, baseColor: color };
}

const yesBtn = makeButton('yes', 100, 430, Color.fromRGB(46, 160, 67));
const noBtn = makeButton('no', 260, 430, Color.fromRGB(200, 70, 70));
const buttons = [yesBtn, noBtn];

function isInsideButton(btn, px, py) {
  return (
    px >= btn.x - buttonW / 2 &&
    px <= btn.x + buttonW / 2 &&
    py >= btn.y - buttonH / 2 &&
    py <= btn.y + buttonH / 2
  );
}

function flashButton(btn) {
  btn.actor.color = Color.White;
  setTimeout(() => {
    btn.actor.color = btn.baseColor;
  }, 130);
}

function report(label) {
  if (typeof window.reportAnswer === 'function') {
    window.reportAnswer(label);
  }
}

function updateButtonPageCoords() {
  const rect = game.canvas.getBoundingClientRect();
  window.__buttons = buttons.map((b) => ({
    label: b.label,
    x: rect.left + b.x,
    y: rect.top + b.y
  }));
}

game.input.pointers.primary.on('down', (evt) => {
  const p = evt.worldPos || evt.screenPos || evt.pos;
  if (!p) return;

  for (const b of buttons) {
    if (isInsideButton(b, p.x, p.y)) {
      flashButton(b);
      report(b.label);
      break;
    }
  }
});

game.start().then(() => {
  const c = game.canvas;
  c.style.position = 'absolute';
  c.style.left = '0px';
  c.style.top = '0px';
  c.style.width = '360px';
  c.style.height = '640px';
  c.style.display = 'block';
  updateButtonPageCoords();
});

window.addEventListener('resize', updateButtonPageCoords);
window.addEventListener('scroll', updateButtonPageCoords);
