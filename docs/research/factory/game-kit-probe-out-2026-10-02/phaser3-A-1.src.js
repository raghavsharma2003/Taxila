import Phaser from 'phaser';

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

class QuizScene extends Phaser.Scene {
  create() {
    this.cameras.main.setBackgroundColor('#f3f7ff');

    this.add
      .text(180, 70, 'Is 3/4 bigger than 1/2?', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '30px',
        color: '#1e2a44',
        align: 'center',
        wordWrap: { width: 320 }
      })
      .setOrigin(0.5, 0.5)
      .setDepth(3);

    // Decorative bouncing ball (behind buttons, non-interactive)
    const ball = this.add.circle(120, 220, 26, 0xff8a5b).setDepth(1);
    this.physics.add.existing(ball);
    this.physics.world.setBounds(20, 140, 320, 480);

    const body = ball.body;
    body.setCollideWorldBounds(true);
    body.setBounce(1, 1);
    body.setVelocity(110, 85);
    body.setAllowGravity(false);

    // Buttons
    this.buttons = [
      this.makeButton(180, 380, 160, 80, 'yes', 0x4caf50),
      this.makeButton(180, 500, 160, 80, 'no', 0xef5350)
    ];

    this.updateButtonCoordinates();
    this.time.delayedCall(0, () => this.updateButtonCoordinates());

    this._onResize = () => this.updateButtonCoordinates();
    window.addEventListener('resize', this._onResize);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      window.removeEventListener('resize', this._onResize);
    });
  }

  makeButton(x, y, w, h, label, color) {
    const container = this.add.container(x, y).setDepth(2);

    const bg = this.add
      .rectangle(0, 0, w, h, color, 1)
      .setStrokeStyle(4, 0xffffff, 1);

    const txt = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '40px',
      color: '#ffffff'
    });
    txt.setOrigin(0.5);

    container.add([bg, txt]);
    container.setSize(w, h);

    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', () => {
      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }

      this.tweens.add({
        targets: bg,
        alpha: 0.35,
        duration: 90,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
    });

    return { label, container };
  }

  updateButtonCoordinates() {
    const canvas = this.game.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const sx = rect.width / this.scale.width;
    const sy = rect.height / this.scale.height;

    window.__buttons = this.buttons.map((b) => ({
      label: b.label,
      x: rect.left + b.container.x * sx,
      y: rect.top + b.container.y * sy
    }));
  }
}

const game = new Phaser.Game({
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: undefined,
  backgroundColor: '#f3f7ff',
  scene: [QuizScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  },
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: 360,
    height: 640
  },
  callbacks: {
    postBoot: (g) => {
      const c = g.canvas;
      c.style.display = 'block';
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = '360px';
      c.style.height = '640px';
    }
  }
});

export default game;
