// /dev/avatar (dev builds or VITE_DEV_ROUTES=1 only): the 3D tutor without a lesson (the picker is gone: one teacher).
//   ?tutor=asha|arjun|uma  ?face=B|Blite|D|E  ?status=speaking|listening|thinking|your_turn|idle  ?framing=medium|close
//   ?reduced=1  ?voice=1 (start the synthetic voice at once; needs a gesture unless autoplay is allowed)
//   ?class=1-9  ?protege=neutral|happy|puzzled (the lesson <Teacher> with the young teach-back protégé)  ?via=lesson (render through <LessonFace>, the lesson's own face: the puppet and its fallbacks)
// The synthetic voice is a looped, syllable-modulated harmonic signal (≈ 4.5 syllables/s, phrase pauses, bright/dark
// vowels) on a LevelMeter exactly as a link attaches one, so the face runs its real tap → lip → behaviour path.
// The face renders bare (round 7: the retired TeacherStage shim is gone); ?protege= renders the lesson Teacher.
import { useEffect, useMemo, useState } from "react";
import { createLevelAnalyser, LevelMeter } from "../lesson/level.ts";
import { TutorFace } from "../avatar/TutorFace.tsx";
import { LessonFace } from "../face-puppet/LessonFace.tsx";
import { Teacher } from "../ui/teacher/Teacher.tsx";
import { protegeFor, type ProtegeMood } from "../ui/teacher/Protege.tsx";
import type { FloorStatus } from "../avatar/behaviour.ts";
import type { StageEvent } from "../avatar/three/stage3d.ts";
import type { FaceTier } from "../avatar/tier.ts";
import { bandOfClass } from "../../shared/tutors.js";

declare global {
  interface Window {
    __avatar?: { events: unknown[]; last: Record<string, unknown> };
  }
}

function speechLike(ctx: AudioContext, seconds = 8): AudioBuffer {
  const sr = ctx.sampleRate, n = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, n, sr);
  const x = buf.getChannelData(0);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  let syl = 0, sylLen = 0.22, bright = 0.5, phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const inPhrase = t % 2.2 < 1.75; // phrase, then a pause
    if (t >= syl + sylLen) {
      syl = t;
      sylLen = 0.16 + rnd() * 0.12;
      bright = rnd();
    }
    const u = (t - syl) / sylLen;
    const env = inPhrase ? Math.pow(Math.max(0, Math.sin(Math.PI * u)), 1.3) * (0.6 + 0.4 * bright) : 0;
    const f0 = 205 + 25 * Math.sin(2 * Math.PI * 0.7 * t);
    phase += (2 * Math.PI * f0) / sr;
    let s = 0;
    for (let h = 1; h <= 12; h++) s += (Math.sin(phase * h) / h) * (h < 4 ? 1 : bright * 1.4);
    x[i] = 0.12 * env * s;
  }
  return buf;
}

export default function AvatarDev() {
  const q = useMemo(() => new URLSearchParams(location.search), []);
  const [tutorId, setTutor] = useState(q.get("tutor") ?? "asha");
  const [status, setStatus] = useState<FloorStatus | null>((q.get("status") as FloorStatus) || "your_turn");
  const [reduced, setReduced] = useState(q.get("reduced") === "1");
  const [playing, setPlaying] = useState(false);
  const cls = Number(q.get("class") ?? 6);
  const framing = (q.get("framing") as "medium" | "close") ?? "medium";
  const tier = (q.get("face") as FaceTier) || undefined;
  const Face = q.get("via") === "lesson" ? LessonFace : TutorFace;
  const meter = useMemo(() => new LevelMeter(), []);
  const sources = useMemo(() => [meter], [meter]);
  const [voice, setVoice] = useState<{ ctx: AudioContext; src: AudioBufferSourceNode } | null>(null);

  useEffect(() => {
    window.__avatar = { events: [], last: {} };
  }, []);

  const startVoice = () => {
    if (voice) return;
    const ctx = new AudioContext();
    const src = ctx.createBufferSource();
    src.buffer = speechLike(ctx);
    src.loop = true;
    const gain = ctx.createGain();
    gain.gain.value = 0.6;
    src.connect(gain).connect(ctx.destination); // dev page only: lets a human hear the test voice
    meter.attach(createLevelAnalyser(ctx, src));
    src.start();
    void ctx.resume();
    setVoice({ ctx, src });
    setPlaying(true);
    setStatus("speaking");
  };
  const stopVoice = () => {
    voice?.src.stop();
    void voice?.ctx.close();
    meter.detach();
    setVoice(null);
    setPlaying(false);
    setStatus("your_turn");
  };
  useEffect(() => {
    if (q.get("voice") === "1") startVoice();
    // once, on mount
  }, []); // eslint-disable-line

  const onEvent = (e: StageEvent | { type: "fallback"; to: FaceTier; reason: string }) => {
    const a = window.__avatar;
    if (!a) return;
    a.events.push(e);
    a.last[e.type] = e;
  };
  const band = bandOfClass(cls);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 12, display: "grid", gap: 16, background: "#f3ece2", minHeight: "100vh", boxSizing: "border-box" }}>
      {(
        <section style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {["asha", "arjun", "uma"].map((id) => (
              <button key={id} type="button" onClick={() => setTutor(id)} aria-pressed={tutorId === id}>{id}</button>
            ))}
            {(["your_turn", "speaking", "listening", "thinking"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s)} aria-pressed={status === s}>{s}</button>
            ))}
            <button type="button" onClick={playing ? stopVoice : startVoice} data-testid="voice">{playing ? "stop voice" : "play test voice"}</button>
            <label><input type="checkbox" checked={reduced} onChange={(e) => setReduced(e.target.checked)} /> reduced motion</label>
          </div>
          <div style={{ height: framing === "close" ? 300 : 380, maxWidth: 560, width: "100%", position: "relative" }} data-testid="stage">
            {q.get("protege") ? (
              <Teacher teacherId={tutorId} band={band} floor={status === "your_turn" ? "your_turn" : status ?? "idle"} meters={sources} reducedMotion={reduced}
                protege={{ kind: protegeFor(q.get("child") ?? "dev"), mood: (q.get("protege") as ProtegeMood) || "neutral" }} style={{ height: "100%" }} />
            ) : (
            <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: 16, overflow: "hidden" }}>
              <Face key={`${tutorId}-${tier}`} tutorId={tutorId} band={band} status={status} teacher={sources} reducedMotion={reduced} framing={framing} tier={tier} onEvent={onEvent} />
            </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
