# Owner review: lamp2 (grown-up Asha, painted keys, v3 K3) vs r8 (the shipped face)

- `lamp2-vs-r8.webm`: 15.2 s, VP9 + Opus, 1644 x 1114. **LEFT = lamp2, RIGHT = r8.** The top row is each face in the
  lesson desk window (375 x 405 CSS px at a 412 px wide phone) and the bottom row is the 80 px speech-row circle (its
  "AI" tag is the app's own label in that slot). Both are rendered at 2x, a phone's pixel density.
- `lamp2-vs-r8-stills.webp`: four moments of the same clip, in reading order: her line (2.5 s), a b/m/p word (5.7 s),
  listening (10.8 s), thinking (12.6 s).

The same scene and the same production driver play both faces. Her voice is Diya (Azure DragonHD) saying "Chalo, ek
mazedaar sawaal dekhte hain. Agar ek dabbe mein baarah pencil hain, toh teen dabbon mein kitni hongi? Socho, phir
batao." from 1.5 s, then a listening beat with nods (the child answers, silent here), a thinking glance, and a warm
smile. The frames are a deterministic screenshot sequence (a virtual 60 Hz clock, one screenshot every 1/30 s, headless
Chromium) muxed with the line's audio; nothing was screen-recorded. No text is drawn into the frames.

Status: lamp2 is HELD (blind panel: uncanny 1, 1, 0 /5, premium 2.6-2.8 vs r8 3.0-3.4; ../RESULTS.md). No default
changes from this.
    python3 -I scripts/character/puppet2d/lamp2/owner-review.py <lamp2 capdir> <r8 capdir> <frames> <still.webp>
