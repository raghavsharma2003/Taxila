import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 40;
const PLAYER_SIZE = 32;
const WALK_SPEED = 140;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#111';

const mount = document.createElement('div');
mount.style.position = 'fixed';
mount.style.left = '0px';
mount.style.top = '0px';
mount.style.width = `${GAME_WIDTH}px`;
mount.style.height = `${GAME_HEIGHT}px`;
mount.style.touchAction = 'none';
document.body.appendChild(mount);

let sceneRef = null;

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
    this.moveDir = 0;
    this.holding = false;
    this.hasWon = false;
  }

  create() {
    sceneRef = this;

    const groundTop = GAME_HEIGHT - GROUND_HEIGHT;

    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87ceeb);

    // Ground
    const ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - GROUND_HEIGHT / 2,
      GAME_WIDTH,
      GROUND_HEIGHT,
      0x2f7d32
    );
    this.physics.add.existing(ground, true);

    // Player
    this.player = this.add.rectangle(40, 120, PLAYER_SIZE, PLAYER_SIZE, 0x2d6cdf);
    this.physics.add.existing(this.player);
    const pBody = this.player.body;
    pBody.setCollideWorldBounds(true);
    pBody.setSize(PLAYER_SIZE, PLAYER_SIZE);

    this.physics.add.collider(this.player, ground);

    // Flag visuals
    const flagX = GAME_WIDTH - 30;
    this.add.rectangle(flagX - 6, groundTop - 30, 4, 60, 0xe8e8e8); // pole
    this.add.rectangle(flagX + 6, groundTop - 50, 18, 12, 0xff5050).setOrigin(0.5, 0.5); // flag cloth

    // Flag hit area
    const flagZone = this.add.rectangle(flagX, groundTop - 30, 24, 60, 0xffffff, 0);
    this.physics.add.existing(flagZone, true);

    this.physics.add.overlap(this.player, flagZone, () => {
      if (this.hasWon) return;
      this.hasWon = true;
      window.reportWin();
    });

    // Pointer controls
    const updateDirFromPointer = (pointer) => {
      this.moveDir = pointer.x >= GAME_WIDTH / 2 ? 1 : -1;
    };

    this.input.on('pointerdown', (pointer) => {
      this.holding = true;
      updateDirFromPointer(pointer);
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.holding || !pointer.isDown) return;
      updateDirFromPointer(pointer);
    });

    const stopMove = () => {
      this.holding = false;
      this.moveDir = 0;
    };

    this.input.on('pointerup', stopMove);
    this.input.on('pointerupoutside', stopMove);
    this.game.events.on('hidden', stopMove);

    // Expose player center in CSS-pixel page coordinates
    window.__player = () => {
      if (!sceneRef || !sceneRef.player || !sceneRef.game || !sceneRef.game.canvas) return null;
      const rect = sceneRef.game.canvas.getBoundingClientRect();
      const sx = rect.width / sceneRef.scale.width;
      const sy = rect.height / sceneRef.scale.height;
      return {
        x: rect.left + sceneRef.player.x * sx,
        y: rect.top + sceneRef.player.y * sy
      };
    };
  }

  update() {
    if (!this.player) return;
    this.player.body.setVelocityX(this.moveDir * WALK_SPEED);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: mount,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87ceeb',
  scale: {
    mode: Phaser.Scale.NONE,
    autoCenter: Phaser.Scale.NO_CENTER,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1400 },
      debug: false
    }
  },
  scene: MainScene,
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${GAME_WIDTH}px`;
      c.style.height = `${GAME_HEIGHT}px`;
      c.style.display = 'block';
      c.style.touchAction = 'none';
    }
  }
});
