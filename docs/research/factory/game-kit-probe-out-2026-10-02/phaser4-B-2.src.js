import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 64;
const PLAYER_SIZE = 32;
const WALK_SPEED = 170;

document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#111';

const root = document.createElement('div');
root.style.position = 'fixed';
root.style.left = '0';
root.style.top = '0';
root.style.width = `${GAME_WIDTH}px`;
root.style.height = `${GAME_HEIGHT}px`;
root.style.overflow = 'hidden';
document.body.appendChild(root);

let playerRef = null;
let didReportWin = false;

window.__player = () => {
  if (!playerRef) return { x: 0, y: 0 };
  return { x: playerRef.x, y: playerRef.y };
};

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
  }

  createTextures() {
    if (!this.textures.exists('player')) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });

      g.clear();
      g.fillStyle(0x4f8cff, 1);
      g.fillRect(0, 0, PLAYER_SIZE, PLAYER_SIZE);
      g.generateTexture('player', PLAYER_SIZE, PLAYER_SIZE);

      g.clear();
      g.fillStyle(0x4a7a35, 1);
      g.fillRect(0, 0, GAME_WIDTH, GROUND_HEIGHT);
      g.generateTexture('ground', GAME_WIDTH, GROUND_HEIGHT);

      g.clear();
      g.fillStyle(0x8b5a2b, 1); // pole
      g.fillRect(2, 0, 4, 96);
      g.fillStyle(0xe53935, 1); // flag cloth
      g.fillRect(6, 8, 16, 12);
      g.generateTexture('flag', 24, 96);

      g.destroy();
    }
  }

  create() {
    this.createTextures();
    this.cameras.main.setBackgroundColor(0x87ceeb);

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.physics.world.gravity.y = 1400;

    const groundY = GAME_HEIGHT - GROUND_HEIGHT / 2;
    this.ground = this.physics.add.staticImage(GAME_WIDTH / 2, groundY, 'ground');
    this.ground.refreshBody();

    this.player = this.physics.add.sprite(40, 120, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setSize(PLAYER_SIZE, PLAYER_SIZE, true);

    this.flag = this.physics.add.staticImage(GAME_WIDTH - 24, GAME_HEIGHT - GROUND_HEIGHT - 48, 'flag');
    this.flag.refreshBody();

    this.physics.add.collider(this.player, this.ground);
    this.physics.add.overlap(this.player, this.flag, () => {
      if (didReportWin) return;
      didReportWin = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin();
      }
    });

    playerRef = this.player;
  }

  update() {
    const p = this.input.activePointer;
    let vx = 0;

    if (p && p.isDown) {
      vx = p.x >= GAME_WIDTH / 2 ? WALK_SPEED : -WALK_SPEED;
    }

    this.player.setVelocityX(vx);
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: root,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#87ceeb',
  scale: {
    mode: Phaser.Scale.NONE,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1400 },
      debug: false
    }
  },
  scene: [MainScene]
});
