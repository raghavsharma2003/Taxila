import {
  Engine,
  DisplayMode,
  Color,
  Actor,
  CollisionType,
  vec,
  Rectangle,
  Circle,
  Label,
  Font,
  FontUnit,
  TextAlign,
  BaseAlign
} from 'excalibur';

// ---- Page/canvas layout: exact 360x640 CSS px at top-left ----
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.touchAction = 'none';
document.body.style.background = '#f5f7ff';

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
canvas.style.touchAction = 'none';
document.body.appendChild(canvas);

// ---- Engine ----
const game = new Engine({
  width: 360,
  height: 640,
  canvasElementId: 'game',
  displayMode: DisplayMode.Fixed
});
game.backgroundColor = Color.fromHex('#eaf6ff');

// ---- Decorative bouncing ball (behind buttons, never captures taps) ----
class DecorativeBall extends Actor {
  constructor() {
    super({
      pos: vec(120, 250),
      radius: 26,
      collisionType: CollisionType.Passive
    });
    this.graphics.use(
      new Circle({
        radius: 26,
        color: Color.fromHex('#7ad3ff')
      })
    );
    this.z = 1;
    this.vel = vec(70, 60);
    this.enableCapturePointer = false;
  }

  onPreUpdate() {
    const r = 26;
    const w = 360;
    const h = 640;

    if (this.pos.x - r <= 0 && this.vel.x < 0) this.vel.x *= -1;
    if (this.pos.x + r >= w && this.vel.x > 0) this.vel.x *= -1;
    if (this.pos.y - r <= 0 && this.vel.y < 0) this.vel.y *= -1;
    if (this.pos.y + r >= h && this.vel.y > 0) this.vel.y *= -1;
  }
}
game.add(new DecorativeBall());

// ---- Question text ----
const question = new Label({
  text: 'Is 3/4 bigger than 1/2?',
  pos: vec(180, 90),
  font: new Font({
    family: 'Arial',
    size: 30,
    unit: FontUnit.Px,
    textAlign: TextAlign.Center,
    baseAlign: BaseAlign.Middle
  }),
  color: Color.fromHex('#1f2a44')
});
question.z = 20;
game.add(question);

// ---- Buttons ----
function makeButton(label, cx, cy, baseHex) {
  const button = new Actor({
    pos: vec(cx, cy),
    width: 140,
    height: 80,
    collisionType: CollisionType.Passive
  });

  button.graphics.add(
    'normal',
    new Rectangle({
      width: 140,
      height: 80,
      color: Color.fromHex(baseHex)
    })
  );
  button.graphics.add(
    'flash',
    new Rectangle({
      width: 140,
      height: 80,
      color: Color.fromHex('#ffe36e')
    })
  );
  button.graphics.use('normal');

  button.z = 10;
  button.enableCapturePointer = true;

  const txt = new Label({
    text: label,
    pos: vec(cx, cy),
    font: new Font({
      family: 'Arial',
      size: 34,
      unit: FontUnit.Px,
      textAlign: TextAlign.Center,
      baseAlign: BaseAlign.Middle
    }),
    color: Color.White
  });
  txt.z = 11;
  txt.enableCapturePointer = false;

  let flashing = false;
  const flash = () => {
    if (flashing) return;
    flashing = true;
    button.graphics.use('flash');
    setTimeout(() => {
      button.graphics.use('normal');
      flashing = false;
    }, 140);
  };

  button.on('pointerup', () => {
    flash();
    if (typeof window.reportAnswer === 'function') {
      window.reportAnswer(label);
    }
  });

  game.add(button);
  game.add(txt);

  return { label, x: cx, y: cy };
}

const yesInfo = makeButton('yes', 90, 430, '#4caf50');
const noInfo = makeButton('no', 270, 430, '#ef5350');

// page CSS coordinates of button centers
const rect = canvas.getBoundingClientRect();
window.__buttons = [
  { label: 'yes', x: rect.left + yesInfo.x, y: rect.top + yesInfo.y },
  { label: 'no', x: rect.left + noInfo.x, y: rect.top + noInfo.y }
];

game.start();
