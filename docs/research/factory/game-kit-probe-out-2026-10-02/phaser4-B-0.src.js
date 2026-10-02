import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 40;
const PLAYER_SIZE = 32;
const WALK_SPEED = 150;

class TinyPlatformerScene extends Phaser.Scene {
  constructor() {
    super('TinyPlatformer');
    this.player = null;
    this.flagHitbox = null;
    this.won = false;
  }

  create() {
    this.cameras.main.setBackgroundColor(0x87ceeb);

    const groundTop = GAME_HEIGHT - GROUND_HEIGHT;

    // Ground
    const ground = this.add.rectangle(
      GAME_WIDTH * 0.5,
      GAME_HEIGHT - GROUND_HEIGHT * 0.5,
      GAME_WIDTH,
      GROUND_HEIGHT,
      0x3b2f2f
    );
    this.physics.add.existing(ground, true);

    // Player (square)
    this.player = this.add.rectangle(40, 120, PLAYER_SIZE, PLAYER_SIZE, 0x2e6cff);
    this.physics.add.existing(this.player, false);

    const pBody = this.player.body;
    pBody.setCollideWorldBounds(true);
    pBody.setBounce(0, 0);
    pBody.setFriction(1, 0);
    pBody.setDragX(2000);
    pBody.setMaxVelocity(250, 1200);

    this.physics.add.collider(this.player, ground);

    // Flag visuals
    const flagX = GAME_WIDTH - 34;
    const poleHeight = 78;
    const poleY = groundTop - poleHeight * 0.5;

    this.add.rectangle(flagX, poleY, 6, poleHeight, 0xdddddd);
    this.add.rectangle(flagX + 12, poleY - 20, 24, 16, 0xff3b3b);

    // Flag hitbox
    this.flagHitbox = this.add.rectangle(flagX + 8, poleY - 8, 28, poleHeight, 0xffffff, 0);
    this.physics.add.existing(this.flagHitbox, true);

    this.physics.add.overlap(this.player, this.flagHitbox, () => {
      if (this.won) return;
      this.won = true;
      window.reportWin();
    });

    // Expose player center in CSS-pixel page coordinates
    window.__player = () => {
      const rect = this.game.canvas.getBoundingClientRect();
      return {
        x: rect.left + this.player.x,
        y: rect.top + this.player.y
      };
    };
  }

  update() {
    if (!this.player) return;

    const pointer = this.input.activePointer;
    let dir = 0;

    if (pointer && pointer.isDown) {
      dir = pointer.x >= GAME_WIDTH * 0.5 ? 1 : -1;
    }

    this.player.body.setVelocityX(dir * WALK_SPEED);
  }
}

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

new Phaser.Game({
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scene: TinyPlatformerScene,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 1400 },
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  callbacks: {
    postBoot: (game) => {
      const canvas = game.canvas;
      canvas.style.display = 'block';
      canvas.style.position = 'absolute';
      canvas.style.left = '0px';
      canvas.style.top = '0px';
      canvas.style.width = `${GAME_WIDTH}px`;
      canvas.style.height = `${GAME_HEIGHT}px`;
    }
  }
});
