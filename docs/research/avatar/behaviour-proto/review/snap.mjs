// Graphics review: (1) does a second emotion cue snap the first one off? (2) do blinks reach full closure at low fps?
// (3) what gaze angles does moduleDir() produce on real phone layouts?
import { createBehaviourController } from '../controller.mjs';
{ const C = createBehaviourController({ seed: 2, band: 'B1' });
  C.arm({ emotion: 'warm', intensity: 2, handover: 'closed' }); C.onLink('output_audio_buffer.started');
  let prev = 0, maxStep = 0, at = 0;
  for (let i = 0; i < 120; i++) { if (i === 45) C.cue('curious', 1, 'lexicon'); const f = C.update(1000 / 30, { herRms: 0 });
    const s = f.bs.mouthSmileLeft ?? 0; if (i > 0 && Math.abs(s - prev) > maxStep) { maxStep = Math.abs(s - prev); at = i; } prev = s; }
  console.log(`warm@apex -> curious cue: largest 1-frame mouthSmileLeft change ${maxStep.toFixed(3)} at frame ${at} (cue at 45)`); }
for (const fps of [30, 24, 20, 15]) {
  const C = createBehaviourController({ seed: 9 }); C.onLink('output_audio_buffer.started');
  let inBlink = false, peak = 0; const peaks = [];
  for (let i = 0; i < fps * 600; i++) { const f = C.update(1000 / fps, { herRms: 0.03 }); const b = f.bs.eyeBlinkRight;
    if (b > 0.05) { inBlink = true; peak = Math.max(peak, b); } else if (inBlink) { peaks.push(peak); inBlink = false; peak = 0; } }
  const partial = peaks.filter(p => p < 0.9).length;
  console.log(`${fps} fps: ${peaks.length} blinks, ${partial} (${(100 * partial / peaks.length).toFixed(0)}%) never shown >=0.9 closed, min peak ${Math.min(...peaks).toFixed(2)}`);
}
function moduleDir(face, mod) { const ex = face.x + face.w / 2, ey = face.y + face.h * 0.42, mx = mod.x + mod.w / 2, my = mod.y + mod.h / 2, D = 1.2 * face.h, deg = 180 / Math.PI;
  return [Math.atan2(mx - ex, D) * deg, Math.atan2(my - ey, D) * deg].map(v => +v.toFixed(1)); }
// 360x780 CSS px portrait phone. L2: face tile 160 px top-right, module fills below. L3: face tile bottom-left over module.
console.log('L1 face 400 px top, module below      ', moduleDir({ x: 0, y: 40, w: 360, h: 400 }, { x: 0, y: 460, w: 360, h: 300 }));
console.log('L2 face tile 160 top-right, module below', moduleDir({ x: 196, y: 16, w: 148, h: 160 }, { x: 0, y: 200, w: 360, h: 560 }));
console.log('L3 face tile 160 bottom-left, module above', moduleDir({ x: 16, y: 600, w: 148, h: 160 }, { x: 0, y: 0, w: 360, h: 580 }));
