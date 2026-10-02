import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;

function lockPageStyles() {
  const html = document.documentElement;
  const body = document.body;
  html.style.margin = '0';
  html.style.padding = '0';
  html.style.overflow = 'hidden';
  body.style.margin = '0';
  body.style.padding = '0';
  body.style.overflow = 'hidden';
  body.style.background = '#f6fbff';
}

class QuizScene extends Phaser.Scene {
  constructor() {
    super('QuizScene');
    this.ball = null;
    this.ballVX = 85;
    this.ballVY = 70;
    this.buttons = [];
    this._coordUpdater = null;
  }

  create() {
    this.cameras.main.setBackgroundColor(0xeaf6ff);

    const question = this.add.text(
      GAME_WIDTH / 2,
      84,
      'Is 3/4 bigger than 1/2?',
      {
        fontFamily: 'Arial, sans-serif',
        fontSize: '34px',
        color: '#13314a',
        fontStyle: 'bold',
        align: 'center',
        wordWrap: { width: GAME_WIDTH - 28 }
      }
    );
    question.setOrigin(0.5);
    question.setDepth(4);

    // Decorative bouncing ball behind buttons
    this.ball = this.add.circle(100, 260, 28, 0xff8a65, 0.95).setDepth(0);
    this.add.circle(88, 248, 9, 0xffffff, 0.35).setDepth(0);

    const yesBtn = this.makeButton('yes', GAME_WIDTH / 2, 300, 0x34a853);
    const noBtn = this.makeButton('no', GAME_WIDTH / 2, 430, 0xe53935);

    this.buttons = [yesBtn, noBtn];

    this.refreshButtonCoordinates();

    this._coordUpdater = () => this.refreshButtonCoordinates();
    window.addEventListener('resize', this._coordUpdater);
    window.addEventListener('scroll', this._coordUpdater, { passive: true });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this._coordUpdater) {
        window.removeEventListener('resize', this._coordUpdater);
        window.removeEventListener('scroll', this._coordUpdater);
      }
    });
  }

  makeButton(label, x, y, color) {
    const w = 170;
    const h = 84;

    const container = this.add.container(x, y).setDepth(3);

    const bg = this.add.rectangle(0, 0, w, h, color, 1).setStrokeStyle(4, 0xffffff, 0.95);
    const text = this.add.text(0, 0, label, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '46px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    const flash = this.add.rectangle(0, 0, w, h, 0xffffff, 0);

    container.add([bg, text, flash]);
    container.setSize(w, h);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h),
      Phaser.Geom.Rectangle.Contains
    );

    container.on('pointerdown', () => {
      flash.setAlpha(0.65);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 170,
        ease: 'Quad.easeOut'
      });

      this.tweens.add({
        targets: container,
        scaleX: 0.97,
        scaleY: 0.97,
        duration: 70,
        yoyo: true,
        ease: 'Quad.easeOut'
      });

      if (typeof window.reportAnswer === 'function') {
        window.reportAnswer(label);
      }
    });

    return { label, x, y, container };
  }

  refreshButtonCoordinates() {
    const canvas = this.game.canvas;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const pageX = rect.left + window.scrollX;
    const pageY = rect.top + window.scrollY;

    window.__buttons = this.buttons.map((b) => ({
      label: b.label,
      x: pageX + b.x,
      y: pageY + b.y
    }));
  }

  update(_time, delta) {
    const dt = delta / 1000;
    const r = this.ball.radius;
    const minX = r;
    const maxX = GAME_WIDTH - r;
    const minY = 130;
    const maxY = GAME_HEIGHT - r;

    let nx = this.ball.x + this.ballVX * dt;
    let ny = this.ball.y + this.ballVY * dt;

    if (nx < minX) {
      nx = minX;
      this.ballVX *= -1;
    } else if (nx > maxX) {
      nx = maxX;
      this.ballVX *= -1;
    }

    if (ny < minY) {
      ny = minY;
      this.ballVY *= -1;
    } else if (ny > maxY) {
      ny = maxY;
      this.ballVY *= -1;
    }

    this.ball.setPosition(nx, ny);
  }
}

lockPageStyles();

const game = new Phaser.Game({
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scene: [QuizScene],
  backgroundColor: '#eaf6ff',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    zoom: 1
  },
  callbacks: {
    postBoot: (g) => {
      const c = g.canvas;
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${GAME_WIDTH}px`;
      c.style.height = `${GAME_HEIGHT}px`;
      c.style.display = 'block';
      c.style.touchAction = 'manipulation';
    }
  }
});

export default game;
