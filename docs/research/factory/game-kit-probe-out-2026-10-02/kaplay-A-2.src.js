import kaplay from "kaplay";

const GAME_W = 360;
const GAME_H = 640;

// Lock page layout to a 360x640 canvas at top-left, no scroll.
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#f4f7ff";

const canvas = document.createElement("canvas");
canvas.width = GAME_W;
canvas.height = GAME_H;
canvas.style.width = `${GAME_W}px`;
canvas.style.height = `${GAME_H}px`;
canvas.style.display = "block";
canvas.style.position = "fixed";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.touchAction = "manipulation";
document.body.appendChild(canvas);

const k = kaplay({
  canvas,
  width: GAME_W,
  height: GAME_H,
  background: [244, 247, 255],
});

const yesPos = { x: 180, y: 360 };
const noPos = { x: 180, y: 490 };

window.__buttons = [
  { label: "yes", x: yesPos.x, y: yesPos.y },
  { label: "no", x: noPos.x, y: noPos.y },
];

// Decorative bouncing ball (behind UI, no area => won't block taps)
const ballRadius = 28;
const ball = k.add([
  k.circle(ballRadius),
  k.pos(90, 220),
  k.color(120, 185, 255),
  k.opacity(0.8),
  k.z(0),
]);
ball.vel = k.vec2(95, 120);

ball.onUpdate(() => {
  ball.pos = ball.pos.add(ball.vel.scale(k.dt()));

  if (ball.pos.x <= ballRadius) {
    ball.pos.x = ballRadius;
    ball.vel.x = Math.abs(ball.vel.x);
  } else if (ball.pos.x >= GAME_W - ballRadius) {
    ball.pos.x = GAME_W - ballRadius;
    ball.vel.x = -Math.abs(ball.vel.x);
  }

  if (ball.pos.y <= ballRadius) {
    ball.pos.y = ballRadius;
    ball.vel.y = Math.abs(ball.vel.y);
  } else if (ball.pos.y >= GAME_H - ballRadius) {
    ball.pos.y = GAME_H - ballRadius;
    ball.vel.y = -Math.abs(ball.vel.y);
  }
});

// Question
k.add([
  k.text("Is 3/4 bigger than 1/2?", {
    size: 36,
    width: 330,
    align: "center",
  }),
  k.pos(180, 95),
  k.anchor("center"),
  k.color(28, 42, 74),
  k.z(10),
]);

function addButton(label, x, y, rgbBase, rgbFlash) {
  const baseColor = k.rgb(...rgbBase);
  const flashColor = k.rgb(...rgbFlash);

  const btn = k.add([
    k.rect(220, 88, { radius: 16 }),
    k.pos(x, y),
    k.anchor("center"),
    k.area(),
    k.color(...rgbBase),
    k.outline(4, k.rgb(255, 255, 255)),
    k.z(10),
  ]);

  k.add([
    k.text(label, { size: 44, align: "center" }),
    k.pos(x, y + 2),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(11),
  ]);

  btn.onClick(() => {
    btn.color = flashColor;
    k.wait(0.14, () => {
      btn.color = baseColor;
    });
    window.reportAnswer(label);
  });
}

addButton("yes", yesPos.x, yesPos.y, [74, 168, 98], [130, 220, 150]);
addButton("no", noPos.x, noPos.y, [231, 94, 94], [255, 155, 155]);
