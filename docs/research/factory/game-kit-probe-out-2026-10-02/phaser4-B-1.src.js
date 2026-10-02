import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 40;
const PLAYER_SIZE = 32;
const WALK_SPEED = 160;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#87ceeb';

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.moveDir = 0;
    this.won = false;
  }

  create() {
    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87ceeb).setDepth(-10);

    // Ground
    const groundY = GAME_HEIGHT - GROUND_HEIGHT / 2;
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      groundY,
      GAME_WIDTH,
      GROUND_HEIGHT,
      0x4c8c2b
    );
    this.physics.add.existing(this.ground, true);

    // Player
    this.player = this.add.rectangle(40, 120, PLAYER_SIZE, PLAYER_SIZE, 0x1f4ed8);
    this.physics.add.existing(this.player, false);
    this.playerBody = this.player.body;
    this.playerBody.setCollideWorldBounds(true);
    this.playerBody.setSize(PLAYER_SIZE, PLAYER_SIZE);
    this.playerBody.setGravityY(1200);
    this.playerBody.setMaxVelocity(500, 1200);

    this.physics.add.collider(this.player, this.ground);

    // Flag (pole + banner)
    const poleX = GAME_WIDTH - 28;
    const poleBottom = GAME_HEIGHT - GROUND_HEIGHT;
    this.add.rectangle(poleX, poleBottom - 45, 6, 90, 0xdddddd);
    this.add.rectangle(poleX - 12, poleBottom - 70, 22, 14, 0xff4d4d);

    // Flag trigger area
    this.flagTrigger = this.add.rectangle(poleX - 8, poleBottom - 45, 24, 90, 0xffffff, 0);
    this.physics.add.existing(this.flagTrigger, true);

    this.physics.add.overlap(this.player, this.flagTrigger, () => {
      if (this.won) return;
      this.won = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin();
      }
    });

    // Input handling
    const setDirFromPointer = (pointer) => {
      this.moveDir = pointer.x >= GAME_WIDTH / 2 ? 1 : -1;
    };

    this.input.on('pointerdown', (pointer) => {
      setDirFromPointer(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) setDirFromPointer(pointer);
    });

    this.input.on('pointerup', () => {
      this.moveDir = 0;
    });

    // Safety: if pointer released outside game canvas
    window.addEventListener('pointerup', () => {
      this.moveDir = 0;
    });

    // Expose player center in CSS-pixel page coordinates
    window.__player = () => ({
      x: this.player.x,
      y: this.player.y
    });
  }

  update() {
    this.playerBody.setVelocityX(this.moveDir * WALK_SPEED);
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: document.body,
  backgroundColor: '#87ceeb',
  scene: [MainScene],
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
    autoCenter: Phaser.Scale.NO_CENTER
  },
  render: {
    antialias: true,
    pixelArt: false
  },
  callbacks: {
    postBoot: (game) => {
      const canvas = game.canvas;
      canvas.style.position = 'absolute';
      canvas.style.left = '0px';
      canvas.style.top = '0px';
      canvas.style.width = `${GAME_WIDTH}px`;
      canvas.style.height = `${GAME_HEIGHT}px`;
      canvas.style.display = 'block';
    }
  }
});
