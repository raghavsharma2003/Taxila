import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#eaf2ff';

class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.buttons = [];
    this.ball = null;
    this.ballVX = 120;
    this.ballVY = 95;
    this.ballR = 24;
  }

  create() {
    this.cameras.main.setBackgroundColor(0xeaf2ff);

    // Decorative bouncing ball (behind buttons)
    this.ball = this.add.circle(110, 220, this.ballR, 0xff7aa2, 0.9).setDepth(1);
    this.add.circle(102, 212, this.ballR * 0.35, 0xffffff, 0.35).setDepth(2);

    this.add
      .text(GAME_WIDTH / 2, 90, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '32px',
        color: '#1f2a44',
        align: 'center',
        wordWrap: { width: 320, useAdvancedWrap: true }
      })
      .setOrigin(0.5)
      .setDepth(10);

    this.createButton('yes', GAME_WIDTH / 2, 330, 220, 84, 0x5ec576);
    this.createButton('no', GAME_WIDTH / 2, 455, 220, 84, 0xf07b7b);

    // Force canvas exact CSS position/size
    const canvas = this.game.canvas;
    Object.assign(canvas.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      width: `${GAME_WIDTH}px`,
      height: `${GAME_HEIGHT}px`,
      display: 'block'
    });

    this.publishButtonCenters();
    window.addEventListener('resize', () => this.publishButtonCenters());
    window.addEventListener('scroll', () => this.publishButtonCenters(), { passive: true });
  }

  createButton(label, x, y, w, h, color) {
    const bg = this.add
      .rectangle(x, y, w, h, color, 1)
      .setStrokeStyle(4, 0x1f2a44, 0.35)
      .setDepth(20);

    const flash = this.add.rectangle(x, y, w, h, 0xffffff, 0).setDepth(21);

    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '42px',
        color: '#ffffff',
        fontStyle: 'bold'
      })
      .setOrigin(0.5)
      .setDepth(22);

    bg.setInteractive({ useHandCursor: true });

    const button = { label, x, y, bg, flash, text };
    this.buttons.push(button);

    bg.on('pointerdown', () => {
      this.tweens.add({
        targets: flash,
        alpha: { from: 0.65, to: 0 },
        duration: 180,
        ease: 'Quad.Out'
      });

      this.tweens.add({
        targets: [bg, text],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        yoyo: true,
        ease: 'Quad.Out'
      });

      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });
  }

  publishButtonCenters() {
    const rect = this.game.canvas.getBoundingClientRect();
    window.__buttons = this.buttons.map((b) => ({
      label: b.label,
      x: rect.left + b.x,
      y: rect.top + b.y
    }));
  }

  update(_time, delta) {
    if (!this.ball) return;

    const dt = delta / 1000;
    this.ball.x += this.ballVX * dt;
    this.ball.y += this.ballVY * dt;

    if (this.ball.x < this.ballR) {
      this.ball.x = this.ballR;
      this.ballVX *= -1;
    } else if (this.ball.x > GAME_WIDTH - this.ballR) {
      this.ball.x = GAME_WIDTH - this.ballR;
      this.ballVX *= -1;
    }

    if (this.ball.y < this.ballR) {
      this.ball.y = this.ballR;
      this.ballVY *= -1;
    } else if (this.ball.y > GAME_HEIGHT - this.ballR) {
      this.ball.y = GAME_HEIGHT - this.ballR;
      this.ballVY *= -1;
    }
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#eaf2ff',
  scene: [QuizScene]
});
