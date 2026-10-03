// Her pre-rendered clips outside the lesson (PRODUCT-DESIGN-V2 §3.3 step 1: "a pre-rendered greeting clip with no
// name in it"). A clip plays ONLY in its own teacher's voice: a clip recorded by one teacher is never played under
// another teacher's face (one teacher, §8: the voice is an identity anchor). Today only Asha's greeting exists, in the
// three family languages (public/audio/hello-*.mp3, the onboarding clips). Arjun and Uma have none yet, so their
// Hello card shows the words and her face without sound (open item: render their greetings in their live voices).
import { useEffect, useRef, useState } from "react";

const HELLO: Record<string, Partial<Record<"english" | "hindi" | "hinglish", string>>> = {
  asha: { english: "/audio/hello-en.mp3", hindi: "/audio/hello-hi.mp3", hinglish: "/audio/hello-hinglish.mp3" },
};

export function helloClip(teacherId: string, lang: string): string | null {
  const row = HELLO[teacherId];
  if (!row) return null;
  return row[lang as "english"] ?? row.hinglish ?? null;
}

/** One clip with an output meter for her lips (amplitude fallback of src/avatar/tap.ts). One clip at a time. */
export function useVoiceClip(src: string | null) {
  const el = useRef<HTMLAudioElement | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const an = useRef<AnalyserNode | null>(null);
  const buf = useRef<Float32Array<ArrayBuffer> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [failed, setFailed] = useState(false);
  const meter = useRef({
    get value() {
      const a = an.current, b = buf.current;
      if (!a || !b) return 0;
      a.getFloatTimeDomainData(b);
      let s = 0;
      for (let i = 0; i < b.length; i++) s += b[i] * b[i];
      return Math.min(1, Math.sqrt(s / b.length) * 4);
    },
  }).current;
  useEffect(() => () => {
    el.current?.pause();
    void ctx.current?.close().catch(() => {});
  }, []);
  const play = () => {
    if (!src) return;
    if (!el.current) {
      const a = new Audio(src);
      a.preload = "auto";
      a.addEventListener("play", () => setPlaying(true));
      a.addEventListener("ended", () => { setPlaying(false); setPlayed(true); });
      a.addEventListener("pause", () => setPlaying(false));
      a.addEventListener("error", () => { setFailed(true); setPlaying(false); setPlayed(true); });
      el.current = a;
      try {
        const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) {
          ctx.current = new AC();
          const node = ctx.current.createMediaElementSource(a);
          an.current = ctx.current.createAnalyser();
          an.current.fftSize = 1024;
          buf.current = new Float32Array(an.current.fftSize);
          node.connect(an.current);
          an.current.connect(ctx.current.destination);
        }
      } catch {
        /* no meter: her lips rest; the sound still plays */
      }
    }
    void ctx.current?.resume().catch(() => {});
    el.current.currentTime = 0;
    el.current.play().catch(() => { setFailed(true); setPlayed(true); });
  };
  return { play, playing, played, failed, meter };
}
