import Phaser from 'phaser';

const GAME_W = 360;
const GAME_H = 640;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f7fbff';

class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.buttonDefs = [];
  }

  create() {
    // Ensure any existing canvas from previous runs is removed (helpful in hot reload dev).
    const oldCanvases = document.querySelectorAll('canvas');
    oldCanvases.forEach((c, i) => {
      if (i < oldCanvases.length - 1) c.remove();
    });

    this.cameras.main.setBackgroundColor('#f4f8ff');

    // Question text
    this.add
      .text(GAME_W / 2, 90, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        color: '#1a2a44',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    // Decorative bouncing ball (behind buttons)
    const ball = this.add.circle(GAME_W * 0.35, GAME_H * 0.35, 26, 0xff8c66);
    ball.setDepth(0);

    this.physics.add.existing(ball);
    ball.body.setCircle(26);
    ball.body.setCollideWorldBounds(true);
    ball.body.setBounce(1, 1);
    ball.body.setVelocity(110, 85);

    // Keep bouncing in a lower area too, so it's visible behind buttons
    this.physics.world.setBounds(0, 150, GAME_W, GAME_H - 150);

    // Buttons
    const yesBtn = this.makeAnswerButton(GAME_W / 2, 360, 180, 82, 'yes', 0x58c472);
    const noBtn = this.makeAnswerButton(GAME_W / 2, 490, 180, 82, 'no', 0xf06a6a);

    yesBtn.setDepth(10);
    noBtn.setDepth(10);

    this.buttonDefs = [
      { label: 'yes', x: yesBtn.x, y: yesBtn.y },
      { label: 'no', x: noBtn.x, y: noBtn.y },
    ];

    this.updateButtonPageCoords();
    window.addEventListener('resize', () => this.updateButtonPageCoords());
  }

  makeAnswerButton(x, y, w, h, label, color) {
    const container = this.add.container(x, y);

    const bg = this.add
      .rectangle(0, 0, w, h, color)
      .setStrokeStyle(4, 0x1f2a44)
      .setOrigin(0.5);

    const txt = this.add
      .text(0, 0, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '40px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    container.add([bg, txt]);

    const hit = this.add
      .zone(x, y, w, h)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const flash = () => {
      this.tweens.add({
        targets: bg,
        alpha: 0.35,
        yoyo: true,
        duration: 90,
        repeat: 1,
      });
    };

    hit.on('pointerdown', () => {
      flash();
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });

    // Keep references together
    container.hitZone = hit;
    return container;
  }

  updateButtonPageCoords() {
    const canvas = this.game.canvas;
    const rect = canvas.getBoundingClientRect();

    window.__buttons = this.buttonDefs.map((b) => ({
      label: b.label,
      x: rect.left + b.x,
      y: rect.top + b.y,
    }));
  }
}

new Phaser.Game({
  type: Phaser.CANVAS,
  width: GAME_W,
  height: GAME_H,
  parent: document.body,
  scene: [QuizScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { x: 0, y: 0 },
    },
  },
  backgroundColor: '#f4f8ff',
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_W,
    height: GAME_H,
    autoCenter: Phaser.Scale.NO_CENTER,
    zoom: 1,
  },
  input: {
    activePointers: 2,
  },
});

const styleCanvas = () => {
  const canvas = document.querySelector('canvas');
  if (!canvas) return;
  canvas.style.position = 'absolute';
  canvas.style.left = '0px';
  canvas.style.top = '0px';
  canvas.style.width = `${GAME_W}px`;
  canvas.style.height = `${GAME_H}px`;
  canvas.style.display = 'block';
};

requestAnimationFrame(styleCanvas);
setTimeout(styleCanvas, 0);
