import Phaser from 'phaser';

document.body.style.margin = '0';
document.body.style.overflow = 'hidden';

let sceneRef = null;

class TinyPlatformer extends Phaser.Scene {
  constructor() {
    super('TinyPlatformer');
    this.player = null;
    this.flagZone = null;
    this.won = false;
    this.moveSpeed = 180;
  }

  create() {
    sceneRef = this;

    const W = 360;
    const H = 640;
    const groundH = 64;
    const groundTop = H - groundH;

    // Background
    this.add.rectangle(W / 2, H / 2, W, H, 0x87ceeb);

    // Ground (static physics body)
    const ground = this.add.rectangle(W / 2, groundTop + groundH / 2, W, groundH, 0x2f5d3a);
    this.physics.add.existing(ground, true);

    // Player (dynamic square ~32x32)
    this.player = this.add.rectangle(40, 120, 32, 32, 0x1e90ff);
    this.physics.add.existing(this.player);
    const body = this.player.body;
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(260, 1200);

    this.physics.add.collider(this.player, ground);

    // Flag visuals near right edge
    this.add.rectangle(330, groundTop - 40, 6, 80, 0xffffff);
    this.add.rectangle(342, groundTop - 58, 22, 14, 0xff3b30);

    // Flag overlap zone
    this.flagZone = this.add.zone(338, groundTop - 40, 26, 80);
    this.physics.add.existing(this.flagZone, true);

    this.physics.add.overlap(this.player, this.flagZone, () => {
      if (this.won) return;
      this.won = true;
      if (typeof window.reportWin === 'function') {
        window.reportWin(); // exactly once
      }
    });
  }

  update() {
    const p = this.input.activePointer;
    let dir = 0;
    if (p.isDown) dir = p.x >= 180 ? 1 : -1;
    this.player.body.setVelocityX(dir * this.moveSpeed);
  }
}

window.__player = () => {
  if (!sceneRef || !sceneRef.player || !sceneRef.game || !sceneRef.game.canvas) {
    return { x: 0, y: 0 };
  }
  const r = sceneRef.game.canvas.getBoundingClientRect();
  return {
    x: r.left + sceneRef.player.x,
    y: r.top + sceneRef.player.y,
  };
};

new Phaser.Game({
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  scene: TinyPlatformer,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1600 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.NONE,
    width: 360,
    height: 640,
    autoCenter: Phaser.Scale.NO_CENTER,
    zoom: 1,
  },
  callbacks: {
    postBoot: (game) => {
      const c = game.canvas;
      Object.assign(c.style, {
        position: 'absolute',
        left: '0px',
        top: '0px',
        width: '360px',
        height: '640px',
        display: 'block',
      });
    },
  },
});
