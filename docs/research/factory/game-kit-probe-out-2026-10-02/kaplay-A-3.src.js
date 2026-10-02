import kaplay from "kaplay";

const GAME_W = 360;
const GAME_H = 640;

// Page + canvas layout: exact 360x640 CSS px at top-left, no scrolling.
document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.width = `${GAME_W}px`;
document.body.style.height = `${GAME_H}px`;
document.body.style.position = "relative";

const canvas = document.createElement("canvas");
canvas.width = GAME_W;
canvas.height = GAME_H;
canvas.style.width = `${GAME_W}px`;
canvas.style.height = `${GAME_H}px`;
canvas.style.position = "absolute";
canvas.style.left = "0";
canvas.style.top = "0";
canvas.style.display = "block";
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";
document.body.appendChild(canvas);

const k = kaplay({
  canvas,
  width: GAME_W,
  height: GAME_H,
  scale: 1,
  letterbox: false,
});

// Background
k.add([
  k.rect(GAME_W, GAME_H),
  k.pos(0, 0),
  k.color(238, 246, 255),
  k.z(0),
]);

// Question text
k.add([
  k.text("Is 3/4 bigger than 1/2?", {
    size: 34,
    width: 320,
    align: "center",
  }),
  k.pos(GAME_W / 2, 90),
  k.anchor("center"),
  k.color(28, 38, 75),
  k.z(5),
]);

// Decorative bouncing ball (behind buttons)
const ballRadius = 26;
const ball = k.add([
  k.circle(ballRadius),
  k.pos(180, 280),
  k.anchor("center"),
  k.color(255, 170, 80),
  k.opacity(0.9),
  k.z(1),
]);
ball.vel = k.vec2(105, 135);

k.onUpdate(() => {
  const dt = k.dt();
  ball.pos.x += ball.vel.x * dt;
  ball.pos.y += ball.vel.y * dt;

  if (ball.pos.x < ballRadius) {
    ball.pos.x = ballRadius;
    ball.vel.x *= -1;
  } else if (ball.pos.x > GAME_W - ballRadius) {
    ball.pos.x = GAME_W - ballRadius;
    ball.vel.x *= -1;
  }

  if (ball.pos.y < ballRadius) {
    ball.pos.y = ballRadius;
    ball.vel.y *= -1;
  } else if (ball.pos.y > GAME_H - ballRadius) {
    ball.pos.y = GAME_H - ballRadius;
    ball.vel.y *= -1;
  }
});

// Buttons
function makeButton({ label, cx, cy, w, h, base, flash }) {
  const rectObj = k.add([
    k.rect(w, h, { radius: 16 }),
    k.pos(cx, cy),
    k.anchor("center"),
    k.color(base[0], base[1], base[2]),
    k.outline(4, k.rgb(30, 38, 60)),
    k.z(3),
  ]);

  k.add([
    k.text(label, { size: 36 }),
    k.pos(cx, cy),
    k.anchor("center"),
    k.color(20, 20, 35),
    k.z(4),
  ]);

  return {
    label,
    cx,
    cy,
    w,
    h,
    rectObj,
    base,
    flash,
    flashToken: 0,
  };
}

const buttons = [
  makeButton({
    label: "yes",
    cx: 95,
    cy: 430,
    w: 130,
    h: 72,
    base: [124, 225, 144],
    flash: [255, 255, 170],
  }),
  makeButton({
    label: "no",
    cx: 265,
    cy: 430,
    w: 130,
    h: 72,
    base: [255, 155, 155],
    flash: [255, 255, 170],
  }),
];

function flashButton(btn) {
  btn.flashToken += 1;
  const token = btn.flashToken;
  btn.rectObj.color = k.rgb(btn.flash[0], btn.flash[1], btn.flash[2]);
  setTimeout(() => {
    if (btn.flashToken === token) {
      btn.rectObj.color = k.rgb(btn.base[0], btn.base[1], btn.base[2]);
    }
  }, 160);
}

function handleAnswer(btn) {
  flashButton(btn);
  if (typeof window.reportAnswer === "function") {
    window.reportAnswer(btn.label);
  }
}

// Pointer/touch handling via DOM (ensures reliable taps, ball never blocks)
canvas.addEventListener(
  "pointerdown",
  (ev) => {
    const r = canvas.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;

    for (const btn of buttons) {
      const left = btn.cx - btn.w / 2;
      const right = btn.cx + btn.w / 2;
      const top = btn.cy - btn.h / 2;
      const bottom = btn.cy + btn.h / 2;
      if (x >= left && x <= right && y >= top && y <= bottom) {
        handleAnswer(btn);
        break;
      }
    }
  },
  { passive: true }
);

// Expose button centers in CSS-pixel page coordinates
function publishButtonCenters() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = buttons.map((b) => ({
    label: b.label,
    x: window.scrollX + r.left + b.cx,
    y: window.scrollY + r.top + b.cy,
  }));
}

publishButtonCenters();
window.addEventListener("resize", publishButtonCenters);
window.addEventListener("scroll", publishButtonCenters, { passive: true });
