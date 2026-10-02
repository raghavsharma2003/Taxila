import Phaser from 'phaser';

class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.ball = null;
    this.vx = 90;
    this.vy = 70;
    this.buttons = {};
  }

  create() {
    // Page/canvas layout: fixed 360x640 at top-left, no scrolling.
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#f2f6ff';

    const canvas = this.game.canvas;
    Object.assign(canvas.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: '360px',
      height: '640px',
      display: 'block'
    });

    this.add.rectangle(180, 320, 360, 640, 0xf7fbff).setDepth(-10);

    this.add
      .text(180, 80, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: '#1a2a44',
        align: 'center',
        wordWrap: { width: 320 }
      })
      .setOrigin(0.5, 0.5);

    // Decorative bouncing ball (behind buttons, never interactive).
    this.ball = this.add.circle(90, 250, 26, 0x6cc4ff, 0.95).setDepth(-2);

    // Buttons
    this.createButton('yes', 180, 390, 0x7ed957, 0x2f7a23);
    this.createButton('no', 180, 515, 0xff8c7a, 0x8a2b1f);

    this.updateButtonCoordinatesGlobal();
  }

  createButton(label, x, y, color, textColor) {
    const w = 180;
    const h = 82;

    const rect = this.add
      .rectangle(x, y, w, h, color, 1)
      .setStrokeStyle(4, 0x1f2b3a, 0.2)
      .setDepth(5)
      .setInteractive({ useHandCursor: true });

    const txt = this.add
      .text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        color: Phaser.Display.Color.IntegerToColor(textColor).rgba
      })
      .setOrigin(0.5)
      .setDepth(6);

    rect.on('pointerdown', () => {
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }

      this.tweens.killTweensOf([rect, txt]);
      this.tweens.add({
        targets: [rect, txt],
        scaleX: 0.94,
        scaleY: 0.94,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut'
      });

      this.tweens.add({
        targets: rect,
        alpha: 0.55,
        duration: 70,
        yoyo: true,
        ease: 'Linear'
      });
    });

    this.buttons[label] = { rect, txt };
  }

  updateButtonCoordinatesGlobal() {
    const canvasRect = this.game.canvas.getBoundingClientRect();
    const yes = this.buttons.yes.rect;
    const no = this.buttons.no.rect;

    window.__buttons = [
      { label: 'yes', x: canvasRect.left + yes.x, y: canvasRect.top + yes.y },
      { label: 'no', x: canvasRect.left + no.x, y: canvasRect.top + no.y }
    ];
  }

  update(_time, delta) {
    if (!this.ball) return;

    const dt = delta / 1000;
    this.ball.x += this.vx * dt;
    this.ball.y += this.vy * dt;

    const r = this.ball.radius;
    const minX = r;
    const maxX = 360 - r;
    const minY = 140 + r;
    const maxY = 620 - r;

    if (this.ball.x <= minX) {
      this.ball.x = minX;
      this.vx = Math.abs(this.vx);
    } else if (this.ball.x >= maxX) {
      this.ball.x = maxX;
      this.vx = -Math.abs(this.vx);
    }

    if (this.ball.y <= minY) {
      this.ball.y = minY;
      this.vy = Math.abs(this.vy);
    } else if (this.ball.y >= maxY) {
      this.ball.y = maxY;
      this.vy = -Math.abs(this.vy);
    }
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  width: 360,
  height: 640,
  backgroundColor: '#f7fbff',
  parent: document.body,
  scene: [QuizScene],
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  input: {
    activePointers: 2
  },
  render: {
    antialias: true,
    pixelArt: false
  }
});
