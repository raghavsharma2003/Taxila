import Phaser from 'phaser';

const GAME_W = 360;
const GAME_H = 640;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#f6f7fb';

class QuizScene extends Phaser.Scene {
  create() {
    // Soft background
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0xf6f7fb).setDepth(-10);

    // Decorative bouncing ball (behind buttons, non-interactive)
    this.ballRadius = 28;
    this.ball = this.add.circle(95, 260, this.ballRadius, 0x5aa9ff, 0.85).setDepth(0);
    this.ballGlow = this.add.circle(95, 260, this.ballRadius + 8, 0x9cc9ff, 0.25).setDepth(-1);
    this.vx = 78;
    this.vy = 92;

    // Question text
    this.add
      .text(GAME_W / 2, 90, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: '#1b2440',
        align: 'center',
        wordWrap: { width: 320 },
      })
      .setOrigin(0.5);

    const yesBtn = this.makeButton(180, 380, 150, 78, 'yes', 0x3fb950);
    const noBtn = this.makeButton(180, 500, 150, 78, 'no', 0xf85149);

    const setButtonCoords = () => {
      const rect = this.game.canvas.getBoundingClientRect();
      window.__buttons = [
        { label: 'yes', x: rect.left + yesBtn.x, y: rect.top + yesBtn.y },
        { label: 'no', x: rect.left + noBtn.x, y: rect.top + noBtn.y },
      ];
    };

    setButtonCoords();
    window.addEventListener('resize', setButtonCoords);
    this.events.once('shutdown', () => window.removeEventListener('resize', setButtonCoords));
  }

  makeButton(x, y, w, h, label, color) {
    const bg = this.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(4, 0xffffff, 0.9);
    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '38px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const c = this.add.container(x, y, [bg, txt]).setDepth(5);
    bg.setInteractive({ useHandCursor: true });

    bg.on('pointerdown', () => {
      // Brief flash
      bg.setFillStyle(0xffffff, 1);
      txt.setColor('#1b2440');
      this.time.delayedCall(120, () => {
        bg.setFillStyle(color, 1);
        txt.setColor('#ffffff');
      });

      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });

    return c;
  }

  update(_, delta) {
    const dt = delta / 1000;
    const r = this.ballRadius;

    this.ball.x += this.vx * dt;
    this.ball.y += this.vy * dt;

    if (this.ball.x < r || this.ball.x > GAME_W - r) {
      this.vx *= -1;
      this.ball.x = Phaser.Math.Clamp(this.ball.x, r, GAME_W - r);
    }
    if (this.ball.y < 150 + r || this.ball.y > GAME_H - r) {
      this.vy *= -1;
      this.ball.y = Phaser.Math.Clamp(this.ball.y, 150 + r, GAME_H - r);
    }

    this.ballGlow.x = this.ball.x;
    this.ballGlow.y = this.ball.y;
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_W,
  height: GAME_H,
  parent: document.body,
  backgroundColor: '#f6f7fb',
  scene: QuizScene,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GAME_W,
    height: GAME_H,
  },
  banner: false,
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      c.style.display = 'block';
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${GAME_W}px`;
      c.style.height = `${GAME_H}px`;
      c.style.margin = '0';
      c.style.padding = '0';
    },
  },
});
