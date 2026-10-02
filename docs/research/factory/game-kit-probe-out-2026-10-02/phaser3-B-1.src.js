import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 48;
const PLAYER_SIZE = 32;
const WALK_SPEED = 180;

document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.player = null;
    this.flagZone = null;
    this.won = false;
  }

  create() {
    const groundY = GAME_HEIGHT - GROUND_HEIGHT / 2;
    const groundTop = GAME_HEIGHT - GROUND_HEIGHT;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xeaf6ff);

    // Ground
    const ground = this.add.rectangle(
      GAME_WIDTH / 2,
      groundY,
      GAME_WIDTH,
      GROUND_HEIGHT,
      0x5b8c3a
    );
    this.physics.add.existing(ground, true);

    // Player
    this.player = this.add.rectangle(40, 120, PLAYER_SIZE, PLAYER_SIZE, 0x2d6cdf);
    this.physics.add.existing(this.player);

    const pBody = this.player.body;
    pBody.setGravityY(1200);
    pBody.setCollideWorldBounds(true);

    this.physics.add.collider(this.player, ground);

    // Flag visuals
    const flagBaseY = groundTop;
    const poleHeight = 90;
    const poleX = GAME_WIDTH - 30;
    const poleY = flagBaseY - poleHeight / 2;

    this.add.rectangle(poleX, poleY, 6, poleHeight, 0x6b6b6b);
    this.add.triangle(poleX + 14, poleY - 22, 0, 0, 28, 10, 0, 20, 0xff4747);

    // Flag trigger zone
    this.flagZone = this.add.zone(poleX + 8, poleY, 24, poleHeight);
    this.physics.add.existing(this.flagZone, true);

    this.physics.add.overlap(this.player, this.flagZone, () => {
      if (this.won) return;
      this.won = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin();
      }
    });

    // Expose player position in CSS-pixel page coordinates
    window.__player = () => {
      const canvasRect = this.game.canvas.getBoundingClientRect();
      return {
        x: canvasRect.left + this.player.x,
        y: canvasRect.top + this.player.y
      };
    };
  }

  update() {
    if (!this.player) return;

    const pointer = this.input.activePointer;
    let dir = 0;

    if (pointer && pointer.isDown) {
      dir = pointer.x >= GAME_WIDTH / 2 ? 1 : -1;
    }

    this.player.body.setVelocityX(dir * WALK_SPEED);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  scene: MainScene,
  backgroundColor: '#eaf6ff',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    zoom: 1,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      c.style.display = 'block';
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${GAME_WIDTH}px`;
      c.style.height = `${GAME_HEIGHT}px`;
    }
  }
});
