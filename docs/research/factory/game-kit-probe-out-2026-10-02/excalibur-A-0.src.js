import {
  Engine,
  DisplayMode,
  Color,
  Actor,
  Label,
  Font,
  FontUnit,
  TextAlign,
  vec,
  Rectangle,
  Circle,
  CollisionType
} from 'excalibur';

// ---- Page + canvas: exact 360x640 CSS pixels at top-left ----
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.position = 'relative';
document.body.style.background = '#f4f8ff';

const canvas = document.createElement('canvas');
canvas.id = 'game';
canvas.width = 360;
canvas.height = 640;
canvas.style.width = '360px';
canvas.style.height = '640px';
canvas.style.position = 'absolute';
canvas.style.left = '0px';
canvas.style.top = '0px';
canvas.style.display = 'block';
canvas.style.touchAction = 'none';
document.body.appendChild(canvas);

const game = new Engine({
  canvasElementId: 'game',
  width: 360,
  height: 640,
  displayMode: DisplayMode.Fixed,
  suppressPlayButton: true,
  antialiasing: true
});

// ---- Decorative bouncing ball (behind UI, should not block taps) ----
class BouncyBall extends Actor {
  constructor() {
    super({
      pos: vec(130, 260),
      z: 0,
      collisionType: CollisionType.PreventCollision
    });
    this.radius = 26;
    this.vel = vec(78, 64);
    this.graphics.use(new Circle({ radius: this.radius, color: Color.fromRGB(120, 200, 255, 0.9) }));
    this.enableCapturePointer = false;
    if (this.pointer) this.pointer.useGraphicsBounds = false;
  }

  onPreUpdate(_engine, elapsedMs) {
    const dt = elapsedMs / 1000;
    this.pos = this.pos.add(this.vel.scale(dt));

    if (this.pos.x - this.radius < 0) {
      this.pos.x = this.radius;
      this.vel.x = Math.abs(this.vel.x);
    } else if (this.pos.x + this.radius > 360) {
      this.pos.x = 360 - this.radius;
      this.vel.x = -Math.abs(this.vel.x);
    }

    if (this.pos.y - this.radius < 0) {
      this.pos.y = this.radius;
      this.vel.y = Math.abs(this.vel.y);
    } else if (this.pos.y + this.radius > 640) {
      this.pos.y = 640 - this.radius;
      this.vel.y = -Math.abs(this.vel.y);
    }
  }
}

// ---- Question text ----
const question = new Label({
  text: 'Is 3/4 bigger than 1/2?',
  pos: vec(180, 96),
  z: 20,
  font: new Font({
    family: 'Arial',
    size: 34,
    unit: FontUnit.Px,
    textAlign: TextAlign.Center
  }),
  color: Color.fromRGB(35, 45, 75)
});

// ---- Button factory ----
function makeButton(label, x, y, baseColor, flashColor) {
  const w = 132;
  const h = 74;

  const btn = new Actor({
    pos: vec(x, y),
    z: 20,
    collisionType: CollisionType.Fixed
  });

  const bg = new Rectangle({ width: w, height: h, color: baseColor });
  btn.graphics.use(bg);
  btn.enableCapturePointer = true;

  const txt = new Label({
    text: label,
    pos: vec(x, y + 2),
    z: 21,
    font: new Font({
      family: 'Arial',
      size: 36,
      unit: FontUnit.Px,
      textAlign: TextAlign.Center
    }),
    color: Color.White
  });

  let flashing = false;
  btn.on('pointerdown', () => {
    if (!flashing) {
      flashing = true;
      bg.color = flashColor;
      setTimeout(() => {
        bg.color = baseColor;
        flashing = false;
      }, 160);
    }

    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }
  });

  return { btn, txt, label, x, y };
}

const yesButton = makeButton(
  'yes',
  100,
  430,
  Color.fromRGB(40, 170, 90),
  Color.fromRGB(95, 220, 135)
);

const noButton = makeButton(
  'no',
  260,
  430,
  Color.fromRGB(200, 70, 70),
  Color.fromRGB(240, 120, 120)
);

// ---- Expose button centers in CSS-pixel page coordinates ----
function updateButtonCenters() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = [
    { label: 'yes', x: r.left + yesButton.x, y: r.top + yesButton.y },
    { label: 'no', x: r.left + noButton.x, y: r.top + noButton.y }
  ];
}
window.addEventListener('resize', updateButtonCenters);
window.addEventListener('scroll', updateButtonCenters, { passive: true });

// ---- Add all actors ----
game.add(new BouncyBall());
game.add(question);
game.add(yesButton.btn);
game.add(noButton.btn);
game.add(yesButton.txt);
game.add(noButton.txt);

game.start().then(() => {
  updateButtonCenters();
});
