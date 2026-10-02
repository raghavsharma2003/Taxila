import Phaser from 'phaser';

const GAME_WIDTH = 360;
const GAME_HEIGHT = 640;
const GROUND_HEIGHT = 56;
const PLAYER_SIZE = 32;
const WALK_SPEED = 150;

let playerRef = null;
let gameRef = null;
let won = false;

// Page/canvas must be fixed at top-left with no scrolling/scaling.
document.documentElement.style.margin = '0';
document.documentElement.style.padding = '0';
document.documentElement.style.overflow = 'hidden';
document.body.style.margin = '0';
document.body.style.padding = '0';
document.body.style.overflow = 'hidden';
document.body.style.background = '#87ceeb';

window.__player = () => {
  if (!playerRef || !gameRef?.canvas) return { x: 0, y: 0 };
  const rect = gameRef.canvas.getBoundingClientRect();
  return {
    x: rect.left + playerRef.x,
    y: rect.top + playerRef.y
  };
};

class MainScene extends Phaser.Scene {
  constructor() {
    super('main');
  }

  create() {
    // Background
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x87ceeb);

    // Ground
    const groundY = GAME_HEIGHT - GROUND_HEIGHT / 2;
    const ground = this.add.rectangle(GAME_WIDTH / 2, groundY, GAME_WIDTH, GROUND_HEIGHT, 0x4b7f3b);
    this.physics.add.existing(ground, true);

    // Player (starts left, falls onto ground)
    const player = this.add.rectangle(40, 80, PLAYER_SIZE, PLAYER_SIZE, 0x2d7ff9);
    this.physics.add.existing(player, false);
    player.body.setCollideWorldBounds(true);
    player.body.setMaxVelocity(250, 1200);
    this.physics.add.collider(player, ground);
    playerRef = player;

    // Flag near right edge
    const poleX = GAME_WIDTH - 28;
    const poleBottomY = GAME_HEIGHT - GROUND_HEIGHT;
    this.add.rectangle(poleX, poleBottomY - 36, 6, 72, 0xe6e6e6);
    this.add.rectangle(poleX + 12, poleBottomY - 58, 20, 14, 0xff4d4d);

    const flagHit = this.add.rectangle(poleX + 10, poleBottomY - 52, 22, 30, 0xff4d4d, 0.01);
    this.physics.add.existing(flagHit, true);

    this.physics.add.overlap(player, flagHit, () => {
      if (won) return;
      won = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin();
      }
    });

    // Prevent default touch gestures on the canvas
    this.game.canvas.style.touchAction = 'none';
  }

  update() {
    if (!playerRef) return;

    const pointer = this.input.activePointer;
    let vx = 0;

    if (pointer.isDown) {
      vx = pointer.x >= GAME_WIDTH / 2 ? WALK_SPEED : -WALK_SPEED;
    }

    playerRef.body.setVelocityX(vx);
  }
}

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  resolution: 1,
  scale: {
    mode: Phaser.Scale.NONE,
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
  scene: [MainScene],
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      c.style.position = 'absolute';
      c.style.left = '0px';
      c.style.top = '0px';
      c.style.width = `${GAME_WIDTH}px`;
      c.style.height = `${GAME_HEIGHT}px`;
      c.style.display = 'block';
    }
  }
};

gameRef = new Phaser.Game(config);
