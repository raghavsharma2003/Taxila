import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

const mount = document.createElement('div');
mount.id = 'game-root';
mount.style.position = 'absolute';
mount.style.left = '0px';
mount.style.top = '0px';
mount.style.width = `${GAME_WIDTH}px`;
mount.style.height = `${GAME_HEIGHT}px`;
document.body.appendChild(mount);

class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.ball = null;
    this.vx = 70; // px/sec
    this.vy = 55; // px/sec
    this.radius = 24;
    this.buttons = [];
  }

  create() {
    this.cameras.main.setBackgroundColor('#f6fbff');

    // Question text
    this.add
      .text(GAME_WIDTH / 2, 90, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        color: '#1f2d3d',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    // Decorative bouncing ball (behind buttons)
    this.ball = this.add.circle(180, 300, this.radius, 0x63c5ff, 0.8).setDepth(1);

    // Buttons
    const yesBtn = this.makeButton({
      label: 'yes',
      x: 95,
      y: 460,
      w: 130,
      h: 80,
      color: 0x6bd26b,
      textColor: '#103510',
    });

    const noBtn = this.makeButton({
      label: 'no',
      x: 265,
      y: 460,
      w: 130,
      h: 80,
      color: 0xff8a7a,
      textColor: '#4a1710',
    });

    this.buttons = [yesBtn, noBtn];

    this.updateButtonCoords();
    window.addEventListener('resize', () => this.updateButtonCoords());
  }

  makeButton({ label, x, y, w, h, color, textColor }) {
    const rect = this.add.rectangle(x, y, w, h, color).setDepth(10);
    const text = this.add
      .text(x, y, label, {
        fontFamily: 'Arial, sans-serif',
        fontSize: '36px',
        color: textColor,
      })
      .setOrigin(0.5)
      .setDepth(11);

    rect.setInteractive({ useHandCursor: true });

    rect.on('pointerdown', () => {
      // Flash effect
      rect.setFillStyle(0xffffff);
      this.time.delayedCall(120, () => rect.setFillStyle(color));

      // Report answer
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });

    return { label, rect, text };
  }

  updateButtonCoords() {
    const canvas = this.game.canvas;
    const r = canvas.getBoundingClientRect();

    window.__buttons = this.buttons.map((b) => ({
      label: b.label,
      x: r.left + b.rect.x,
      y: r.top + b.rect.y,
    }));
  }

  update(_, delta) {
    const dt = delta / 1000;
    const minX = this.radius;
    const maxX = GAME_WIDTH - this.radius;
    const minY = 170 + this.radius; // stay mostly in middle/lower area
    const maxY = GAME_HEIGHT - this.radius - 20;

    this.ball.x += this.vx * dt;
    this.ball.y += this.vy * dt;

    if (this.ball.x < minX) {
      this.ball.x = minX;
      this.vx *= -1;
    } else if (this.ball.x > maxX) {
      this.ball.x = maxX;
      this.vx *= -1;
    }

    if (this.ball.y < minY) {
      this.ball.y = minY;
      this.vy *= -1;
    } else if (this.ball.y > maxY) {
      this.ball.y = maxY;
      this.vy *= -1;
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: mount,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#f6fbff',
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    autoCenter: Phaser.Scale.NO_CENTER,
  },
  scene: [QuizScene],
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      c.style.display = 'block';
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${GAME_WIDTH}px`;
      c.style.height = `${GAME_HEIGHT}px`;
    },
  },
});
