import { createBehaviourController } from '../controller.mjs';
for (const style of [{}, { blinkPerMin: { speaking: 24 } }]) {
  const C = createBehaviourController({ seed: 3, style });
  C.onLink('input_audio_buffer.speech_started'); // listening
  for (let i = 0; i < 30 * 600; i++) C.update(1000 / 30, { childRms: 0.04 });
  const n = C.log.filter(e => e.type === 'blink').length;
  console.log(JSON.stringify(style), 'listening blinks/min over 10 min:', (n / 10).toFixed(1), ' log entries:', C.log.length);
}
// left/right lid asymmetry during a proud smile
const C = createBehaviourController({ seed: 5, band: 'B1' });
C.arm({ emotion: 'excited', intensity: 3, handover: 'closed' }); C.onLink('output_audio_buffer.started');
let mx = 0; for (let i = 0; i < 60; i++) { const f = C.update(1000 / 30, { herRms: 0 }); mx = Math.max(mx, (f.bs.eyeBlinkLeft ?? 0) - (f.bs.eyeBlinkRight ?? 0)); }
console.log('max eyeBlinkLeft - eyeBlinkRight with no blink, excited@B1:', mx.toFixed(3));
