import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 48;
const PLAYER_SIZE = 32;
const MOVE_SPEED = 150;

class TinyPlatformerScene extends Phaser.Scene {
  constructor() {
    super('TinyPlatformer');
    this.player = null;
    this.ground = null;
    this.flagZone = null;
    this.moveDir = 0; // -1 left, 0 stop, 1 right
    this.didWin = false;
  }

  create() {
    // Page / canvas layout: exact 360x640 CSS px at top-left, no scrolling.
    document.documentElement.style.margin = '0';
    document.documentElement.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.body.style.background = '#0f172a';

    const canvas = this.game.canvas;
    canvas.style.position = 'absolute';
    canvas.style.left = '0px';
    canvas.style.top = '0px';
    canvas.style.width = `${GAME_WIDTH}px`;
    canvas.style.height = `${GAME_HEIGHT}px`;
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';

    // Simple background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x1e293b);

    // Ground
    this.ground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT - GROUND_HEIGHT / 2,
      GAME_WIDTH,
      GROUND_HEIGHT,
      0x3f3f46
    );
    this.physics.add.existing(this.ground, true);

    // Player square
    this.player = this.add.rectangle(40, 80, PLAYER_SIZE, PLAYER_SIZE, 0x22d3ee);
    this.physics.add.existing(this.player, false);
    const pBody = this.player.body;
    pBody.setCollideWorldBounds(true);
    pBody.setMaxVelocity(300, 1200);

    this.physics.add.collider(this.player, this.ground);

    // Flag visuals near right edge
    const poleX = GAME_WIDTH - 34;
    const poleBottomY = GAME_HEIGHT - GROUND_HEIGHT;
    this.add.rectangle(poleX, poleBottomY - 44, 6, 88, 0xe5e7eb); // pole
    this.add.triangle(
      poleX + 14,
      poleBottomY - 72,
      0, 0,
      24, 8,
      0, 16,
      0xf43f5e
    ); // flag cloth

    // Flag collision zone
    this.flagZone = this.add.zone(poleX + 8, poleBottomY - 44, 28, 88);
    this.physics.add.existing(this.flagZone, true);

    this.physics.add.overlap(this.player, this.flagZone, () => {
      if (this.didWin) return;
      this.didWin = true;
      window.reportWin();
    });

    // Pointer controls: hold on left/right half to move.
    const setDirFromPointer = (pointer) => {
      this.moveDir = pointer.x >= GAME_WIDTH / 2 ? 1 : -1;
    };

    this.input.on('pointerdown', (pointer) => setDirFromPointer(pointer));
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) setDirFromPointer(pointer);
    });
    this.input.on('pointerup', () => {
      this.moveDir = 0;
    });
    this.input.on('pointerupoutside', () => {
      this.moveDir = 0;
    });

    // Expose player center in CSS-pixel page coordinates.
    window.__player = () => {
      const rect = this.game.canvas.getBoundingClientRect();
      return {
        x: rect.left + this.player.x,
        y: rect.top + this.player.y
      };
    };
  }

  update() {
    if (!this.player || !this.player.body) return;
    this.player.body.setVelocityX(this.moveDir * MOVE_SPEED);
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1e293b',
  parent: document.body,
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  input: {
    activePointers: 1
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1800 },
      debug: false
    }
  },
  scene: [TinyPlatformerScene]
});
