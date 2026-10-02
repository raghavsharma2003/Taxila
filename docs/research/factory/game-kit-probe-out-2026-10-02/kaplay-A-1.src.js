import kaplay from "kaplay";

document.documentElement.style.margin = "0";
document.documentElement.style.padding = "0";
document.documentElement.style.overflow = "hidden";
document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";

const canvas = document.createElement("canvas");
canvas.width = 360;
canvas.height = 640;
canvas.style.position = "absolute";
canvas.style.left = "0px";
canvas.style.top = "0px";
canvas.style.width = "360px";
canvas.style.height = "640px";
canvas.style.display = "block";
document.body.appendChild(canvas);

const k = kaplay({
  global: false,
  canvas,
  width: 360,
  height: 640,
  letterbox: false,
  stretch: false,
  background: [242, 248, 255],
});

k.add([
  k.text("Is 3/4 bigger than 1/2?", { size: 34, width: 320, align: "center" }),
  k.pos(180, 88),
  k.anchor("center"),
  k.color(25, 35, 60),
  k.z(30),
]);

const ballRadius = 28;
const ball = k.add([
  k.circle(ballRadius),
  k.pos(90, 210),
  k.color(120, 190, 255),
  k.opacity(0.85),
  k.z(1),
]);

let vx = 78;
let vy = 64;
ball.onUpdate(() => {
  ball.pos.x += vx * k.dt();
  ball.pos.y += vy * k.dt();

  if (ball.pos.x < ballRadius) {
    ball.pos.x = ballRadius;
    vx = Math.abs(vx);
  } else if (ball.pos.x > 360 - ballRadius) {
    ball.pos.x = 360 - ballRadius;
    vx = -Math.abs(vx);
  }

  if (ball.pos.y < ballRadius + 10) {
    ball.pos.y = ballRadius + 10;
    vy = Math.abs(vy);
  } else if (ball.pos.y > 640 - ballRadius - 10) {
    ball.pos.y = 640 - ballRadius - 10;
    vy = -Math.abs(vy);
  }
});

function makeButton(label, x, y, rgb) {
  const w = 150;
  const h = 78;

  const box = k.add([
    k.rect(w, h),
    k.pos(x, y),
    k.anchor("center"),
    k.color(rgb[0], rgb[1], rgb[2]),
    k.area(),
    k.z(20),
  ]);

  k.add([
    k.text(label, { size: 40 }),
    k.pos(x, y + 1),
    k.anchor("center"),
    k.color(255, 255, 255),
    k.z(21),
  ]);

  return {
    label,
    x,
    y,
    w,
    h,
    box,
    baseColor: k.rgb(rgb[0], rgb[1], rgb[2]),
    flashTimer: 0,
  };
}

const buttons = [
  makeButton("yes", 180, 290, [73, 170, 92]),
  makeButton("no", 180, 420, [230, 96, 96]),
];

function publishButtons() {
  const r = canvas.getBoundingClientRect();
  window.__buttons = buttons.map((b) => ({
    label: b.label,
    x: r.left + b.x,
    y: r.top + b.y,
  }));
}
publishButtons();
window.addEventListener("resize", publishButtons);
window.addEventListener("scroll", publishButtons, { passive: true });

let suppressUntil = -1;
function activateButton(b) {
  const now = k.time();
  if (now < suppressUntil) return;
  suppressUntil = now + 0.18;

  b.flashTimer = 0.12;
  b.box.color = k.rgb(255, 255, 255);

  if (typeof window.reportAnswer === "function") {
    window.reportAnswer(b.label);
  }
}

for (const b of buttons) {
  b.box.onClick(() => activateButton(b));
  b.box.onUpdate(() => {
    if (b.flashTimer > 0) {
      b.flashTimer -= k.dt();
      if (b.flashTimer <= 0) {
        b.box.color = b.baseColor;
      }
    }
  });
}

function pointInButton(p, b) {
  return (
    p.x >= b.x - b.w / 2 &&
    p.x <= b.x + b.w / 2 &&
    p.y >= b.y - b.h / 2 &&
    p.y <= b.y + b.h / 2
  );
}

k.onTouchStart((...args) => {
  const p = args.find((a) => a && typeof a.x === "number" && typeof a.y === "number");
  if (!p) return;
  for (const b of buttons) {
    if (pointInButton(p, b)) {
      activateButton(b);
      break;
    }
  }
});
