// The scripted lesson for /dev/desk?live=1 (dev and VITE_DEV_ROUTES builds only). A ScriptedLink speaks by the
// clock (her "audio" is a timed level envelope, so the floor gets real teacher_audio_start / _end events), and a
// scripted Director answers each turn with the §4.10 ui fields (ask, handover, answerForm, verdict, tray, phase,
// shortTitle). The REAL LessonRuntime, outbox, floor, signals and trouble classifier run on top: only the network
// and the voice are simulated. The API goes over real fetch() semantics where it matters: offline (Playwright
// setOffline) makes every call throw a TypeError exactly like fetch, and ?fail=<status>[:n] fails the next n turns.
import type { LessonStartResponse, TurnRequest, TurnResponse, UiDirectives } from "../../../../shared/contracts.ts";
import { ApiError, type LessonApi } from "../../../lesson/api.ts";
import { Emitter } from "../../../lesson/store.ts";
import type { LessonMode, LinkEvent, LinkLevels, TeacherLink, TeacherReply } from "../../../lesson/link.ts";
import type { LinkFactory } from "../../../lesson/runtime.ts";

type Ui = UiDirectives & Record<string, unknown>;
interface Step { reply: string; ui: Ui; end?: boolean; delayMs?: number }

export function lessonScript(young: boolean): { opening: Step; turns: Step[]; spoken: string[] } {
  if (young) {
    return {
      opening: { reply: "Namaste! Aaj hum aadha dekhenge. Batao, ek roti ke do barabar tukde kiye, toh ek tukda kya kehlata hai?",
        ui: { ask: { text: "One roti, two equal parts. What is one part called?" }, handover: "answer", phase: "warmup", tray: "none", shortTitle: "Halves", answerForm: "words" } },
      turns: [
        { reply: "Bahut badiya socha! Haan, aadha. Ab dekho, kaunsa aadha hai?", ui: { verdict: "correct", phase: "practice", tray: "tiles", chips: [{ id: "a", label: "1/2" }, { id: "b", label: "1/3" }], ask: { text: "Which one is half?" }, handover: "choice", answerForm: "choice" } },
        { reply: "Chalo ek baar phir dekhte hain. Do barabar tukde gino.", ui: { verdict: "not_yet", hint: { level: 1, text: "Count the two equal parts." }, ask: { text: "Which one is half?" }, chips: [{ id: "a", label: "1/2" }, { id: "b", label: "1/3" }], handover: "choice", answerForm: "choice", tray: "tiles" } },
        { reply: "Haan! Do barabar tukde, ek aadha. Aakhri sawaal: aadhe ko kaise likhte hain?", ui: { verdict: "correct", phase: "wrap", tray: "none", ask: { text: "How do we write one half?" }, handover: "answer", answerForm: "words" } },
        { reply: "Shabaash, tumne khud socha. Aaj ke liye itna hi.", ui: { verdict: "correct", handover: "finish" }, end: true },
      ],
      spoken: ["aadha", "ek baata do", "one by two"],
    };
  }
  return {
    opening: { reply: "Namaste! Aaj hum fractions compare karenge. Pehle batao, 1/2 aur 1/4 mein bada kaun hai?",
      ui: { ask: { text: "Which is bigger: 1/2 or 1/4?" }, handover: "answer", phase: "warmup", tray: "none", shortTitle: "Fractions: halves", answerForm: "words" } },
    turns: [
      { reply: "Bilkul sahi, aur tumne bade hisse ko pehchaana. Board dekho: 1/2 barabar 2/4. Toh ek half mein kitne quarters hote hain?", ui: { verdict: "correct", phase: "teach", tray: "board", whiteboard: { kind: "math", value: "1/2 = 2/4" }, ask: { text: "How many quarters make one half?" }, handover: "answer", answerForm: "number" } },
      { reply: "Chalo ek baar phir dekhte hain. Board par shaded parts gino.", ui: { verdict: "not_yet", hint: { level: 1, text: "Count the shaded quarters on the board." }, ask: { text: "How many quarters make one half?" }, handover: "answer", answerForm: "number", tray: "board" } },
      { reply: "Haan, do quarters. Ab inmein se poora kaun hai?", ui: { verdict: "correct", phase: "practice", tray: "tiles", chips: [{ id: "a", label: "1/3" }, { id: "b", label: "2/3" }, { id: "c", label: "3/3" }], ask: { text: "Which fraction is one whole?" }, handover: "choice", answerForm: "choice" } },
      { reply: "Sahi. 3/3 ek poora hai. Aakhri sawaal: 2/4 ko simple karke likho.", ui: { verdict: "correct", phase: "wrap", tray: "none", ask: { text: "Write 2/4 in its simplest form." }, handover: "answer", answerForm: "words" } },
      { reply: "Bahut achha. Aaj tumne halves aur quarters jode. Milte hain agli baar.", ui: { verdict: "correct", handover: "finish" }, end: true },
    ],
    spoken: ["one half", "two", "one by two"],
  };
}

export interface ScriptOptions {
  young: boolean;
  /** ?fail=<status>[:n] → the next n turn calls fail with that HTTP status (0 = network). */
  fail?: { status: number; n: number } | null;
  /** ?slow=<ms>: the Director takes this long per turn (T1 at 8 s). */
  slowMs?: number;
  /** ?start=<status>: the start call fails (401 → T8, else T9). */
  startFail?: number | null;
  /** ?tts=fail: her speech fails on the opening (T5). */
  ttsFail?: boolean;
  /** ?safety=1: the first child turn raises the safeguarding move (the Help sheet). */
  safety?: boolean;
}

/** The scripted Director. Offline → TypeError (as fetch throws); ?fail → ApiError with the status. */
export function scriptedApi(o: ScriptOptions): LessonApi & { calls: TurnRequest[] } {
  const s = lessonScript(o.young);
  let i = 0;
  let fails = o.fail?.n ?? 0;
  const calls: TurnRequest[] = [];
  const offline = () => typeof navigator !== "undefined" && navigator.onLine === false;
  const net = async () => {
    await new Promise((r) => setTimeout(r, 120));
    if (offline()) throw new TypeError("Failed to fetch");
  };
  return {
    calls,
    async start(): Promise<LessonStartResponse> {
      await net();
      if (o.startFail) throw new ApiError(o.startFail, o.startFail === 401 ? "not signed in" : "server error", null);
      return {
        lessonId: "dev-lesson", topic: { id: "dev-fractions", title: o.young ? "Halves" : "Fractions: halves and quarters", chapter: "Fractions" },
        teacher: { id: o.young ? "asha" : "arjun", name: o.young ? "Asha" : "Arjun", voice: "dev", addressedAs: o.young ? "Asha didi" : "Arjun bhaiya", role: "AI teacher",
          pronouns: o.young ? { subject: "she", object: "her", possessive: "her" } : { subject: "he", object: "him", possessive: "his" }, lookRev: 1, signatureColor: null },
        moduleCommands: [], ui: s.opening.ui,
        teacherOpening: s.opening.reply, teacherOpeningSeq: 1,
      };
    },
    async turn(req: TurnRequest): Promise<TurnResponse> {
      calls.push(req);
      await net();
      if (o.slowMs) await new Promise((r) => setTimeout(r, o.slowMs));
      if (fails > 0) {
        fails--;
        const st = o.fail!.status;
        if (st === 0) throw new TypeError("Failed to fetch");
        throw new ApiError(st, `turn failed (${st})`, null);
      }
      if (o.safety && calls.length === 1) {
        return { move: { kind: "safeguard", shape: "dev" } as TurnResponse["move"], moduleCommands: [], ui: { whiteboard: { kind: "text", value: "Childline 1098 · Tele-MANAS 14416" } }, teacherReply: "Tum mushkil mein nahi ho. Kisi bade se baat karo.", teacherReplySeq: 99 };
      }
      const step = s.turns[Math.min(i, s.turns.length - 1)];
      i++;
      return { move: { kind: step.end ? "wrap" : "probe", shape: "dev" } as TurnResponse["move"], moduleCommands: [], ui: step.ui, teacherReply: step.reply, teacherReplySeq: 2 + i, end: step.end };
    },
    async end() {
      await new Promise((r) => setTimeout(r, 300));
      return { summary: null, parentNote: null };
    },
    async realtimeToken() {
      throw new Error("no realtime in the dev script");
    },
  };
}

/** A link that "speaks" by the clock and hears the scripted spoken answers. Emits only real LinkEvents. */
export class ScriptedLink implements TeacherLink {
  readonly mode: LessonMode = "text";
  readonly levels: LinkLevels;
  private ev = new Emitter<LinkEvent>();
  private timers: ReturnType<typeof setTimeout>[] = [];
  private env: ReturnType<typeof setInterval> | null = null;
  private cur: string | null = null;
  private seq = 0;
  private spokenIdx = 0;
  private talkAt = 0;
  private ttsFailOnce: boolean;
  private readonly spoken: string[];
  constructor(levels: LinkLevels, spoken: string[], ttsFail = false) {
    this.levels = levels;
    this.spoken = spoken;
    this.ttsFailOnce = ttsFail;
  }
  on(fn: (e: LinkEvent) => void) {
    return this.ev.on(fn);
  }
  async connect() {
    this.ev.emit({ type: "connection", state: "connecting" });
    await new Promise((r) => setTimeout(r, 60));
    this.ev.emit({ type: "connection", state: "connected" });
  }
  applyInstructions() {}
  sendChild(text: string, opts: { chipId?: string } = {}) {
    this.interrupt();
    this.ev.emit({ type: "child_final", text, startedAt: Date.now(), typed: true, chipId: opts.chipId });
  }
  promptTeacher(reply?: TeacherReply) {
    const text = reply?.text?.trim();
    if (!text) return;
    this.stop("cancelled", false);
    const id = `dev-${++this.seq}`;
    this.cur = id;
    this.ev.emit({ type: "response_start", responseId: id, at: Date.now() });
    this.ev.emit({ type: "teacher_delta", responseId: id, delta: text });
    this.ev.emit({ type: "teacher_done", responseId: id, text });
    if (this.ttsFailOnce) {
      this.ttsFailOnce = false;
      this.ev.emit({ type: "error", message: "the teacher's voice is unavailable; showing text only", fatal: false, code: "tts_failed" });
      this.ev.emit({ type: "response_done", responseId: id, status: "failed" });
      this.cur = null;
      return;
    }
    const dur = Math.min(6500, Math.max(1400, text.length * 38));
    this.timers.push(setTimeout(() => {
      if (this.cur !== id) return;
      this.ev.emit({ type: "teacher_audio_start" });
      const t0 = performance.now();
      this.env = setInterval(() => {
        const t = (performance.now() - t0) / 1000;
        this.levels.teacher.value = 0.35 + 0.3 * Math.abs(Math.sin(t * 9)) * (0.6 + 0.4 * Math.sin(t * 2.3));
      }, 50);
      this.timers.push(setTimeout(() => this.stop("completed", false), dur));
    }, 220));
  }
  interrupt() {
    this.stop("cancelled", true);
  }
  private stop(status: "completed" | "cancelled", byChild: boolean) {
    const id = this.cur;
    if (!id) return;
    this.cur = null;
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    const wasPlaying = this.env !== null;
    if (this.env) clearInterval(this.env);
    this.env = null;
    this.levels.teacher.value = 0;
    if (byChild) this.ev.emit({ type: "teacher_interrupted", responseId: id });
    if (wasPlaying) this.ev.emit({ type: "teacher_audio_end" });
    this.ev.emit({ type: "response_done", responseId: id, status });
  }
  setPushToTalk() {}
  talkStart() {
    if (this.cur) this.interrupt();
    this.talkAt = Date.now();
    this.ev.emit({ type: "child_speech_start", at: this.talkAt });
    this.env = setInterval(() => (this.levels.mic.value = 0.3 + Math.random() * 0.4), 60);
  }
  talkEnd() {
    if (this.env) clearInterval(this.env);
    this.env = null;
    this.levels.mic.value = 0;
    this.ev.emit({ type: "child_speech_end", at: Date.now() });
    const text = this.spoken[this.spokenIdx++ % this.spoken.length];
    setTimeout(() => this.ev.emit({ type: "child_final", text, startedAt: this.talkAt, typed: false, itemId: `u${this.spokenIdx}`, asrConfidence: 0.92 }), 350);
  }
  close() {
    this.stop("cancelled", false);
    this.ev.emit({ type: "connection", state: "closed" });
  }
}

export const scriptedLinkFactory = (spoken: string[], ttsFail: boolean): LinkFactory => (_mode, ctx) => new ScriptedLink(ctx.levels, spoken, ttsFail);
