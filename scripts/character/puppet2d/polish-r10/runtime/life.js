// r5 secondary life for the painted puppet (judge r4: "idle and listening life is fine but not delightful"). Rig-side
// embellishment only: it reads the same HeadRig inputs (ARKit bs, gaze, head, breath) and adds motion the contract does
// not carry, so the Director, behaviour.ts and lip.ts stay unchanged.
//   sacc     fixational micro-saccades: while the gaze holds still, the eyes hop between the points a person scans on a
//            face (viewer's left eye, right eye, mouth), ~3 deg, 30-40 ms hops every 0.45-1.15 s; off while the gaze moves
//   flick    a brow flick on stressed syllables: a jaw peak well above its running mean (the audio jaw from lip.ts), at
//            most every 0.9 s and not on every one (60%), 70 ms up / 80 hold / 280 down
//   breathS  the shoulders' share of the breath, lagging the chest by ~0.35 s
//   glint    the gold studs' specular lag: the highlight slides against head motion and settles (a stud cannot swing)
// Deterministic for capture: one seeded generator, stepped only by update().

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const ss = (x) => { const t = clamp01(x); return t * t * (3 - 2 * t); };

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// scan points in gaze degrees [yaw (+ = screen right), pitch (+ = up)]: the viewer's two eyes and mouth
const SCAN = [[-3.0, 0.5], [3.0, 0.5], [0, -2.2]];

export class Life {
  constructor({ reduced = false, seed = 11 } = {}) {
    this.reduced = reduced;
    this.rng = mulberry32(seed);
    this.sacc = [0, 0];
    this.target = [0, 0];
    this.pt = -1;
    this.next = 0.6;
    this.prevGaze = null;
    this.gv = 0;
    this.flick = 0;
    this.f0 = -9;
    this.famp = 0;
    this.lastFlick = -9;
    this.jm = 0;
    this.prevJaw = 0;
    this.breathS = 0.5;
    this.glint = [0, 0];
    this.gv2 = [0, 0];
    this.prevHead = null;
    this.t = -1;
  }

  update(t, dt, bs, gaze, head, solver, breath = 0) {
    if (this.t >= 0 && t < this.t - 1) { this.next = t + 0.5; this.lastFlick = -9; this.f0 = -9; }   // clock jumped back (timeline loop)
    this.t = t;
    const k = (n) => bs[n] ?? 0;
    // ---- micro-saccades
    if (this.prevGaze && dt > 0) {
      const v = Math.hypot(gaze[0] - this.prevGaze[0], gaze[1] - this.prevGaze[1]) / dt;
      this.gv += (1 - Math.exp(-dt / 0.08)) * (v - this.gv);
    }
    this.prevGaze = [gaze[0], gaze[1]];
    const onChild = Math.hypot(gaze[0], gaze[1]) < 9;
    const fix = !this.reduced && !this.still && this.gv < 18;   // still: fixed poses (sheet stills) hold the gaze
    if (!fix) { this.target = [0, 0]; this.pt = -1; this.next = Math.max(this.next, t + 0.3); }
    else if (t >= this.next) {
      let i = Math.floor(this.rng() * 3);
      if (i === this.pt) i = (i + 1 + Math.floor(this.rng() * 2)) % 3;
      // the mouth point is visited less often (people look at eyes more)
      if (i === 2 && this.rng() < 0.45) i = this.rng() < 0.5 ? 0 : 1;
      this.pt = i;
      const a = onChild ? 1 : 0.45;
      this.target = [SCAN[i][0] * a, SCAN[i][1] * a];
      this.next = t + 0.45 + this.rng() * 0.7;
    }
    const ts = 1 - Math.exp(-dt / 0.011);   // a saccade lands in ~35 ms
    this.sacc[0] += ts * (this.target[0] - this.sacc[0]);
    this.sacc[1] += ts * (this.target[1] - this.sacc[1]);
    // ---- stressed-syllable brow flick
    const jaw = k("jawOpen");
    this.jm += (1 - Math.exp(-dt / 1.0)) * (jaw - this.jm);
    const thr = Math.max(0.3, this.jm * 1.5 + 0.06);
    let speaking = false;
    for (const key in bs) if (key.startsWith("viseme_") && bs[key] > 0.3) { speaking = true; break; }
    if (!this.reduced && speaking && jaw > thr && this.prevJaw <= thr && t - this.lastFlick > 0.9) {
      this.lastFlick = t;
      if (this.rng() < 0.6) { this.f0 = t; this.famp = 0.6 + 0.4 * clamp01((jaw - this.jm) / 0.35); }
    }
    this.prevJaw = jaw;
    const u = t - this.f0;
    this.flick = u < 0 ? 0 : u < 0.07 ? this.famp * ss(u / 0.07) : u < 0.15 ? this.famp : u < 0.43 ? this.famp * (1 - ss((u - 0.15) / 0.28)) : 0;
    // ---- shoulders' breath (lags the chest)
    const inb = (breath + 1) / 2;
    this.breathS += (1 - Math.exp(-dt / 0.35)) * (inb - this.breathS);
    // ---- stud glint: driven by the head's angular velocity, sprung back to rest
    if (this.prevHead && dt > 0) {
      const vy = (head[1] - this.prevHead[1]) / dt, vr = (head[2] - this.prevHead[2]) / dt;
      const fx = -vy * 0.05 + vr * 0.03, fy = -(head[0] - this.prevHead[0]) / dt * 0.04;
      let left = Math.min(dt, 0.1);
      while (left > 1e-6) {
        const h = Math.min(0.004, left);
        for (let d = 0; d < 2; d++) { this.gv2[d] += ((d ? fy : fx) * 30 - 60 * this.glint[d] - 2 * 0.35 * Math.sqrt(60) * this.gv2[d]) * h; this.glint[d] += this.gv2[d] * h; }
        left -= h;
      }
    }
    this.prevHead = [head[0], head[1], head[2]];
  }
}
