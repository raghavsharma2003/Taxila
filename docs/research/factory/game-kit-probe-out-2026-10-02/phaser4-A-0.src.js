import Phaser from 'phaser';

const WIDTH = 360;
const HEIGHT = 640;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.ball = null;
    this.vx = 110;
    this.vy = 140;
    this.ballRadius = 26;
    this.buttonData = [];
  }

  create() {
    this.cameras.main.setBackgroundColor(0xf4f7ff);

    this.add
      .text(WIDTH / 2, 72, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        color: '#1b2a41',
        align: 'center',
        wordWrap: { width: WIDTH - 24, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setDepth(20);

    // Decorative bouncing ball (behind everything interactive)
    this.ball = this.add.circle(70, 220, this.ballRadius, 0x5bc0eb, 0.95).setDepth(1);
    this.add.circle(60, 210, 8, 0xffffff, 0.7).setDepth(2);

    const yesButton = this.makeButton('yes', WIDTH / 2, 320, 0x6ccf72);
    const noButton = this.makeButton('no', WIDTH / 2, 450, 0xff8a80);

    this.buttonData = [
      { label: 'yes', target: yesButton.container },
      { label: 'no', target: noButton.container }
    ];

    this.updateButtonCoords();
    window.addEventListener('resize', () => this.updateButtonCoords());
  }

  makeButton(label, x, y, color) {
    const w = 220;
    const h = 90;

    const container = this.add.container(x, y).setDepth(30);

    const shadow = this.add.rectangle(0, 6, w, h, 0x000000, 0.15).setOrigin(0.5);
    const bg = this.add
      .rectangle(0, 0, w, h, color, 1)
      .setOrigin(0.5)
      .setStrokeStyle(4, 0x1b2a41, 0.25);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '44px',
        color: '#102030',
        fontStyle: 'bold'
      })
      .setOrigin(0.5);

    container.add([shadow, bg, text]);

    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerdown', () => {
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }

      this.tweens.killTweensOf(container);
      this.tweens.add({
        targets: container,
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 80,
        yoyo: true,
        ease: 'Quad.easeOut'
      });

      this.tweens.add({
        targets: bg,
        alpha: 0.45,
        duration: 90,
        yoyo: true,
        ease: 'Linear'
      });
    });

    return { container, bg };
  }

  updateButtonCoords() {
    const rect = this.game.canvas.getBoundingClientRect();
    window.__buttons = this.buttonData.map((b) => ({
      label: b.label,
      x: Math.round(rect.left + b.target.x),
      y: Math.round(rect.top + b.target.y)
    }));
  }

  update(_, dt) {
    if (!this.ball) return;

    const t = dt / 1000;
    this.ball.x += this.vx * t;
    this.ball.y += this.vy * t;

    if (this.ball.x <= this.ballRadius) {
      this.ball.x = this.ballRadius;
      this.vx = Math.abs(this.vx);
      this.ball.fillColor = Phaser.Display.Color.RandomRGB().color;
    } else if (this.ball.x >= WIDTH - this.ballRadius) {
      this.ball.x = WIDTH - this.ballRadius;
      this.vx = -Math.abs(this.vx);
      this.ball.fillColor = Phaser.Display.Color.RandomRGB().color;
    }

    const topLimit = 120;
    const bottomLimit = HEIGHT - this.ballRadius;

    if (this.ball.y <= topLimit) {
      this.ball.y = topLimit;
      this.vy = Math.abs(this.vy);
      this.ball.fillColor = Phaser.Display.Color.RandomRGB().color;
    } else if (this.ball.y >= bottomLimit) {
      this.ball.y = bottomLimit;
      this.vy = -Math.abs(this.vy);
      this.ball.fillColor = Phaser.Display.Color.RandomRGB().color;
    }
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  width: WIDTH,
  height: HEIGHT,
  parent: document.body,
  scene: [QuizScene],
  backgroundColor: '#f4f7ff',
  scale: {
    mode: Phaser.Scale.NONE,
    width: WIDTH,
    height: HEIGHT
  },
  input: {
    activePointers: 3
  },
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${WIDTH}px`;
      c.style.height = `${HEIGHT}px`;
      c.style.display = 'block';
      c.style.touchAction = 'manipulation';
    }
  }
});
