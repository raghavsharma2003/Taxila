// "Say it" on Ask (r7 app-ask-voice): the child says the question; Voice's transcribe path hears it (POST
// /api/voice/transcribe with the child's id: there is no lesson yet, Voice to-voice/003) and the words go into the field
// for the child to check and fix before Ask. No second recognizer: the clip is recorded here exactly as the lesson's
// push-to-talk fallback records one (cascadeLink.ts), and the server's ASR decides what was said. Nothing is kept on the
// device; the clip goes once, to that route.

/** A clip longer than this stops by itself (a question, not a speech). */
export const ASK_MAX_MS = 15_000;
const MIMES = ["audio/webm;codecs=opus", "audio/ogg;codecs=opus", "audio/mp4"];

export interface AskRecording {
  /** Stop and hand back the clip (null: nothing usable was recorded). */
  stop: () => Promise<Blob | null>;
  /** Stop and drop it. */
  cancel: () => void;
}

export function canRecord(): boolean {
  return typeof MediaRecorder !== "undefined" && typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
}

/** The mic permission is already granted (hands-free may start listening without a tap); false when unknown. */
export async function micGranted(): Promise<boolean> {
  try {
    const p = await navigator.permissions?.query({ name: "microphone" as PermissionName });
    return p?.state === "granted";
  } catch {
    return false;
  }
}

export async function startAskRecording(onAutoStop?: () => void): Promise<AskRecording | null> {
  if (!canRecord()) return null;
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  } catch {
    return null;
  }
  const mime = MIMES.find((m) => MediaRecorder.isTypeSupported(m));
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  const parts: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
  const startedAt = Date.now();
  const release = () => stream.getTracks().forEach((t) => t.stop());
  const cap = setTimeout(() => onAutoStop?.(), ASK_MAX_MS);
  rec.start();
  const stop = () => new Promise<Blob | null>((resolve) => {
    clearTimeout(cap);
    if (rec.state !== "recording") { release(); resolve(null); return; }
    rec.onstop = () => {
      release();
      const blob = new Blob(parts, { type: rec.mimeType || "audio/webm" });
      // an accidental tap is dropped (the lesson's own rule: under 300 ms or almost no bytes)
      resolve(Date.now() - startedAt < 300 || blob.size < 500 ? null : blob);
    };
    rec.stop();
  });
  return { stop, cancel: () => { clearTimeout(cap); if (rec.state === "recording") rec.stop(); release(); } };
}

async function base64Of(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return btoa(s);
}

/** What Voice's ASR heard; "" when it heard nothing; null when the route refused or failed (type instead). */
export async function transcribeAsk(cid: string, clip: Blob): Promise<string | null> {
  try {
    const res = await fetch("/api/voice/transcribe", {
      method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" },
      body: JSON.stringify({ childId: cid, audio: await base64Of(clip), mime: clip.type || "audio/webm" }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { text?: unknown };
    return typeof j.text === "string" ? j.text.trim() : null;
  } catch {
    return null;
  }
}
