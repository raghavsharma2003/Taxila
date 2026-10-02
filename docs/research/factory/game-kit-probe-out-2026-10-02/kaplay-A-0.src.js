import kaplay from "kaplay";

const GAME_W = 360;
const GAME_H = 640;

// Lock page so the canvas is exactly 360x640 at top-left with no scrolling.
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.touchAction = "manipulation";
document.body.style.background = "#f3f7ff";

// Create fixed-size canvas.
const canvas = document.createElement("canvas");
canvas.width = GAME_W;
canvas.height = GAME_H;
canvas.style.width = `${GAME_W}px`;
canvas.style.height = `${GAME_H}px`;
canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.display = "block";
canvas.style.touchAction = "manipulation";
document.body.appendChild(canvas);

// Start KAPLAY.
const k = kaplay({
  global: false,
  canvas,
  width: GAME_W,
  height: GAME_H,
  scale: 1,
  letterbox: false,
  background: [243, 247, 255],
});

// Decorative bouncing ball (behind UI, no area => won't block taps).
const ball = k.add([
  k.pos(90, 260),
  k.circle(28),
  k.color(110, 180, 255),
  k.opacity(0.9),
  k.z(0),
]);

const ballVel = k.vec2(115, 145);

k.onUpdate(() => {
  ball.pos.x += ballVel.x * k.dt();
  ball.pos.y += ballVel.y * k.dt();

  const r = 28;
  if (ball.pos.x < r) {
    ball.pos.x = r;
    ballVel.x *= -1;
  } else if (ball.pos.x > GAME_W - r) {
    ball.pos.x = GAME_W - r;
    ballVel.x *= -1;
  }

  if (ball.pos.y < r) {
    ball.pos.y = r;
    ballVel.y *= -1;
  } else if (ball.pos.y > GAME_H - r) {
    ball.pos.y = GAME_H - r;
    ballVel.y *= -1;
  }
});

// Question text.
k.add([
  k.text("Is 3/4 bigger than 1/2?", {
    size: 34,
    width: 320,
    align: "center",
  }),
  k.pos(GAME_W / 2, 110),
  k.anchor("center"),
  k.color(32, 45, 85),
  k.z(3),
]);

function makeButton(label, x, y, baseColor) {
  const btn = k.add([
    k.rect(140, 72, { radius: 14 }),
    k.pos(x, y),
    k.anchor("center"),
    k.area(),
    k.color(...baseColor),
    k.outline(4, k.rgb(30, 45, 90)),
    k.z(3),
    { label, baseColor },
  ]);

  const txt = k.add([
    k.text(label, { size: 34 }),
    k.pos(x, y),
    k.anchor("center"),
    k.color(20, 30, 60),
    k.z(4),
  ]);

  const flash = () => {
    btn.color = k.rgb(255, 238, 140);
    txt.color = k.rgb(30, 30, 30);
    k.wait(0.14, () => {
      btn.color = k.rgb(...btn.baseColor);
      txt.color = k.rgb(20, 30, 60);
    });
  };

  btn.onClick(() => {
    flash();
    if (typeof window.reportAnswer === "function") {
      window.reportAnswer(label);
    }
  });

  return { x, y, label };
}

const yesCenter = { x: 110, y: 430 };
const noCenter = { x: 250, y: 430 };

makeButton("yes", yesCenter.x, yesCenter.y, [146, 228, 167]);
makeButton("no", noCenter.x, noCenter.y, [255, 178, 178]);

// Expose button centers in CSS pixel page coordinates.
window.__buttons = [
  { label: "yes", x: yesCenter.x, y: yesCenter.y },
  { label: "no", x: noCenter.x, y: noCenter.y },
];
