// Narration audio for the gallery only: the moon explainer's measured clips (prototypes/reset/studio/03-moon-phases,
// gpt-4o-mini-tts "marin" re-paced to 141 wpm, 2026-10-04). In the lesson, narration is the teacher's own turn and the
// host passes measured timing in the spec; engines never fetch audio.
const moonClips = import.meta.glob("../../../prototypes/reset/studio/03-moon-phases/audio/*.mp3", { query: "?url", import: "default", eager: true }) as Record<string, string>;
export function audioFor(archetype: string): Record<string, string> | undefined {
  if (archetype !== "orbital-explainer@1") return undefined;
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(moonClips)) { const m = path.match(/(L\d+)\.mp3$/); if (m) out[m[1]] = url; }
  return Object.keys(out).length ? out : undefined;
}
