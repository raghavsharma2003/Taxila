// The illustrated teacher (§4.7): flat fills plus one shade tone, rounded primitives, the fewest details
// needed, skin-3 by default, no text baked in. A stand-in until the visual-identity art lands; the 2D rig
// and the flipbook replace it in the lesson (ui-b / avatar workstreams). Blinks (120-160 ms every few
// seconds) and a speaking mouth are the only motion, transform and opacity only, off under reduced motion.
export function TeacherFace({ size = 200, speaking = false, title = "Illustration of the teacher, smiling" }:
  { size?: number; speaking?: boolean; title?: string }) {
  return (
    <svg className="teacher-face" data-speaking={speaking} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label={title}>
      <circle cx="100" cy="100" r="98" fill="var(--jamun-soft)" />
      {/* shoulders: kurta + dupatta */}
      <path d="M30 200c4-34 30-52 70-52s66 18 70 52z" fill="var(--jamun)" />
      <path d="M58 160c18 16 66 16 84 0l10 40H48z" fill="var(--board)" opacity="0.92" />
      <path d="M86 138h28v18c-6 6-22 6-28 0z" fill="var(--skin-4)" />
      {/* hair back + bun */}
      <circle cx="138" cy="62" r="17" fill="var(--ink)" />
      <path d="M50 92c0-36 22-58 50-58s50 22 50 58v20H50z" fill="var(--ink)" />
      {/* ears + earrings */}
      <ellipse cx="55" cy="98" rx="8" ry="11" fill="var(--skin-4)" />
      <ellipse cx="145" cy="98" rx="8" ry="11" fill="var(--skin-4)" />
      <circle cx="55" cy="113" r="3.5" fill="var(--turn)" />
      <circle cx="145" cy="113" r="3.5" fill="var(--turn)" />
      {/* face */}
      <ellipse cx="100" cy="96" rx="44" ry="50" fill="var(--skin-3)" />
      <path d="M58 82c8-26 26-36 42-36 20 0 36 10 44 32-18-4-34-12-44-24-10 14-26 24-42 28z" fill="var(--ink)" />
      {/* brows, eyes */}
      <path d="M70 80q10-6 20 0 M110 80q10-6 20 0" stroke="var(--ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <g className="tf-eyes">
        <ellipse cx="80" cy="94" rx="5" ry="6.5" fill="var(--ink)" />
        <ellipse cx="120" cy="94" rx="5" ry="6.5" fill="var(--ink)" />
        <circle cx="82" cy="92" r="1.6" fill="var(--surface)" />
        <circle cx="122" cy="92" r="1.6" fill="var(--surface)" />
      </g>
      {/* nose, cheeks */}
      <path d="M100 100q-5 12 1 14" stroke="var(--skin-5)" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="72" cy="112" rx="8" ry="5" fill="var(--skin-2)" opacity="0.8" />
      <ellipse cx="128" cy="112" rx="8" ry="5" fill="var(--skin-2)" opacity="0.8" />
      {/* mouth: smile, and an open shape while speaking */}
      <path className="tf-smile" d="M84 124q16 13 32 0" stroke="var(--ink)" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse className="tf-talk" cx="100" cy="127" rx="10" ry="7" fill="var(--ink)" />
    </svg>
  );
}
