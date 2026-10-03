// useDesk: the live lesson → DeskModel + DeskActions. Every state on the Desk is derived from the runtime's REAL
// events (src/lesson: link events, the Director's ui, the outbox, connection and HTTP failures), never from a
// timer pretending to know: the only clocks are the ones the spec names (the heard hold, the latency beats, T1's
// 8 s, the Young help timer, RC's 2 s, the help sheet's 10 s "Back").
//   floor   ← FloorController(runtime.events)          src/lesson/floor.ts
//   lamp, chime, haptic ← Signals(floor transition)     src/lesson/signals.ts
//   trouble ← classifyTrouble(facts from events)        src/lesson/trouble.ts
//   no lost answers ← runtime.outbox                    src/lesson/outbox.ts
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { Move } from "../../../shared/contracts.ts";
import { FloorController, FLOOR_TIMING, type Floor, type FloorState } from "../../lesson/floor.ts";
import { beatsAt } from "../../lesson/latency.ts";
import type { LessonMode } from "../../lesson/link.ts";
import type { LessonRuntime, StartMode } from "../../lesson/runtime.ts";
import { Signals } from "../../lesson/signals.ts";
import { classifyTrouble, factOfLinkError, isStrip, T1_MS, type StripId } from "../../lesson/trouble.ts";
import type { UiBridge } from "../../lesson/uiBridge.ts";
import { t } from "../../ui/copy.ts";
import { prepareEarcons, setEarcons } from "../../ui/sound/earcons.ts";
import { setHapticsEnabled } from "../../ui/haptics.ts";
import { BAND_TOKENS, type Band, type Family } from "../band.ts";
import { solveDesk, type DeskLayout } from "./deskLayout.ts";
import { stripHeight } from "./TroubleStrip.tsx";
import { deskPhaseOf } from "./geometry.ts";
import { useMountedModules, useTapToTalk, useYourTurn } from "./hooks.ts";
import type { AnswerChip, Ask, DeskActions, DeskModel, DeskPhase, DidCard, Sheet, TrayModel, Verdict } from "./model.ts";

/** The §4.10 ui fields (shared/contracts.ts UiDirectives), plus the hint line §4.3 describes (not in the
 *  contract yet: read defensively, shown when present). */
export interface UiV2 {
  hint?: { level?: 1 | 2 | 3; text?: string };
}

export interface DeskContext {
  cid: string;
  band: Band;
  family: Family;
  teacherId: string;
  teacherName: string;
  childName: string;
  /** The family's spoken lesson language (captions only: chrome is English). */
  lessonLang: "hinglish" | "hindi" | "english";
  captionsAlways: boolean;
  sounds: boolean | null;
  haptics: boolean;
  reducedMotion: boolean;
  timing: number;
  variant: "lesson" | "practice" | "doubt";
  topicId?: string;
  firstText?: string;
  /** Start as typed (practice / quiet mode / ?mode=text). */
  textOnly: boolean;
  openMic: boolean;
  faceForm: "live" | "plate";
  /** Young B1 (R0): CC turns "captions always" on for the child (a saved preference). */
  setCaptionsAlways?: (on: boolean) => void;
}

export interface DeskNav {
  home(): void;
  who(): void;
  signIn(): void;
  parent(): void;
  finished(): void;
}

/** Child requests the Hint sheet sends: the CHILD's words to the Director, in the lesson language (not chrome). */
const REQUESTS: Record<string, [string, string, string]> = {
  hint: ["Hint chahiye", "संकेत चाहिए", "Can I have a hint"],
  why: ["Yeh kyun hota hai, samjhao", "यह क्यों होता है, समझाइए", "Show me why"],
  know: ["Mujhe yeh aata hai", "मुझे यह आता है", "I know this"],
  another: ["Kisi aur tarah samjhao", "किसी और तरह समझाइए", "Explain it differently"],
  slower: ["Thoda dheere boliye", "थोड़ा धीरे बोलिए", "A bit slower please"],
  skip: ["Isse abhi chhod dete hain", "इसे अभी छोड़ देते हैं", "Skip this for now"],
  choices: ["Choices dikhao", "विकल्प दिखाइए", "Show me choices"],
  how: ["Kaise karte hain dikhao", "कैसे करते हैं, दिखाइए", "Show me how"],
};

const QUESTION = /[^.!?।…]*[?？][\s"”']*$/;

/** Legacy ask: the last question sentence of her hand-over turn (the Director does not send ui.ask yet). */
export function inferAsk(text: string): string | null {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return null;
  const sentences = flat.split(/(?<=[.!?।…?])\s+/).filter(Boolean);
  for (let i = sentences.length - 1; i >= 0; i--) {
    if (QUESTION.test(sentences[i])) return sentences[i].trim().slice(0, 160);
  }
  return null;
}

const LEGACY_TITLE_MAX = 28;
function shortTitleOf(ui: { shortTitle?: string }, topic: { title: string; chapter: string } | null): string {
  if (ui.shortTitle) return ui.shortTitle.slice(0, 24);
  const title = topic?.title ?? "";
  if (title.length <= LEGACY_TITLE_MAX) return title;
  // Never a CSS-truncated chapter name: a whole-word short form instead.
  const words = title.split(" ");
  let out = "";
  for (const w of words) {
    if ((out + " " + w).trim().length > 24) break;
    out = (out + " " + w).trim();
  }
  return out;
}

interface Item { ask: Ask | null; answer: AnswerChip | null; pendingVerdict: Verdict | null; pendingWithHelp?: boolean; nextAsk?: Ask | null }

export function useDesk(runtime: LessonRuntime, bridge: UiBridge | null, ctx: DeskContext, nav: DeskNav, size: { w: number; h: number; fontScale: number }) {
  const state = useSyncExternalStore(runtime.store.subscribe, runtime.store.get, runtime.store.get);
  const bs = useSyncExternalStore(bridge?.store.subscribe ?? noopSub, bridge?.store.get ?? nullGet, bridge?.store.get ?? nullGet);
  const young = ctx.family === "young";
  const tokens = BAND_TOKENS[ctx.band];
  const ui = state.ui as typeof state.ui & UiV2;
  const withHelpNow = !!ui.withHelp;

  // ───────── the floor and its signals ─────────
  const [floorCtl] = useState(() => new FloorController(young ? FLOOR_TIMING.young : FLOOR_TIMING.older, undefined, undefined, () => runtime.state.pendingTurns > 0));
  useEffect(() => floorCtl.setTiming(young ? FLOOR_TIMING.young : FLOOR_TIMING.older), [floorCtl, young]);
  useEffect(() => {
    const off = floorCtl.attach(runtime);
    return () => {
      off();
    };
  }, [floorCtl, runtime]);
  useEffect(() => () => floorCtl.dispose(), [floorCtl]);
  const fs: FloorState = useSyncExternalStore(floorCtl.store.subscribe, floorCtl.store.get, floorCtl.store.get);
  const replaying = !!bs?.replaying;
  const floor: Floor = state.phase !== "live" ? (state.phase === "idle" || state.phase === "starting" ? "idle" : fs.floor) : replaying ? "speaking" : fs.floor;

  const dockEl = useRef<HTMLElement | null>(null);
  const suspendedRef = useRef(false);
  useEffect(() => {
    setEarcons({ enabled: ctx.sounds ?? true, band: young ? "young" : "older" });
    setHapticsEnabled(ctx.haptics);
  }, [ctx.sounds, ctx.haptics, young]);
  useEffect(() => {
    const s = new Signals(floorCtl, { suspended: () => suspendedRef.current, dock: () => dockEl.current });
    return () => s.dispose();
  }, [floorCtl]);

  // ───────── sheets ─────────
  const [sheet, setSheet] = useState<Sheet>(null);
  const resumeTurn = useRef(false);
  useEffect(() => {
    bridge?.holdSpeech(sheet === "pause" || sheet === "end" || sheet === "hint");
  }, [sheet, bridge]);
  const lastSafeguard = useRef<Move | null>(null);
  useEffect(() => {
    // Safety by predicate: the server's safeguard move raises the Help sheet itself; the lesson is frozen.
    if (state.move?.kind === "safeguard" && state.move !== lastSafeguard.current) {
      lastSafeguard.current = state.move;
      setSheet("help");
    }
  }, [state.move]);
  const [helpBackVisible, setHelpBackVisible] = useState(false);
  useEffect(() => {
    setHelpBackVisible(false);
    if (sheet !== "help") return;
    const id = setTimeout(() => setHelpBackVisible(true), 10_000);
    return () => clearTimeout(id);
  }, [sheet]);

  // ───────── link facts (from link error codes and events) ─────────
  const [facts, setFacts] = useState({ tts: false, sttDown: false, ptt: false, noMic: false, noMicCardSeen: false });
  const [linkDownSince, setLinkDownSince] = useState<number | null>(null);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false);
  const [recoveredAt, setRecoveredAt] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState<Set<StripId>>(() => new Set());
  const [commitAt, setCommitAt] = useState<number | null>(null);
  const [audioSinceCommit, setAudioSinceCommit] = useState(false);
  const troubleShown = useRef<StripId | null>(null);

  useEffect(() => {
    return runtime.events.on((e) => {
      if (e.type === "error") {
        const f = factOfLinkError(e.code);
        if (f === "tts") setFacts((x) => ({ ...x, tts: true }));
        else if (f === "stt_down") setFacts((x) => ({ ...x, sttDown: true }));
        else if (f === "ptt") setFacts((x) => ({ ...x, ptt: true }));
        else if (f === "no_mic") setFacts((x) => ({ ...x, noMic: true }));
      } else if (e.type === "teacher_audio_start") {
        setFacts((x) => (x.tts ? { ...x, tts: false } : x));
        setAudioSinceCommit(true);
        setDismissed((d) => (d.has("T1") || d.has("T5") ? new Set([...d].filter((k) => k !== "T1" && k !== "T5")) : d));
      } else if (e.type === "connection") {
        if (e.state === "reconnecting" || e.state === "failed") setLinkDownSince((v) => v ?? Date.now());
        else if (e.state === "connected") {
          setLinkDownSince((v) => {
            if (v !== null) setRecoveredAt(Date.now());
            return null;
          });
        }
      } else if (e.type === "child_speech_end" || (e.type === "child_final" && e.typed)) {
        setCommitAt(Date.now());
        setAudioSinceCommit(false);
      }
    });
  }, [runtime]);
  useEffect(() => {
    const on = () => {
      setOffline(false);
      setRecoveredAt(Date.now());
    };
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  // A resend acknowledged → RC: the chip flips to "Sent" for 1.5 s and "Back online." shows for 2 s.
  const [sentFlashAt, setSentFlashAt] = useState<number | null>(null);
  const prevResent = useRef<number | null>(null);
  useEffect(() => {
    if (state.lastResent !== null && state.lastResent !== prevResent.current) {
      prevResent.current = state.lastResent;
      setSentFlashAt(Date.now());
      setRecoveredAt(Date.now());
    }
  }, [state.lastResent]);

  // A 1 s clock only while something time-based can change (T1, RC, the sent flash, the latency beats).
  const [now, setNow] = useState(() => Date.now());
  const ticking = floor === "heard" || floor === "thinking" || recoveredAt !== null || sentFlashAt !== null || linkDownSince !== null || (commitAt !== null && state.pendingTurns > 0);
  useEffect(() => {
    if (!ticking) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [ticking]);
  useEffect(() => {
    if (recoveredAt !== null && now - recoveredAt > 2_500) setRecoveredAt(null);
    if (sentFlashAt !== null && now - sentFlashAt > 1_500) setSentFlashAt(null);
  }, [now, recoveredAt, sentFlashAt]);

  // ───────── the question card: the pinned ask + the answer chip ─────────
  const [item, setItem] = useState<Item>({ ask: null, answer: null, pendingVerdict: null });
  const serverAsk = ui.ask?.text ? ui.ask : null;
  const lastUi = useRef<unknown>(null);
  useEffect(() => {
    if (state.ui === lastUi.current) return;
    lastUi.current = state.ui;
    setItem((it) => {
      let next = it;
      if (serverAsk?.text && serverAsk.text !== it.ask?.text) {
        const ask: Ask = { text: serverAsk.text, source: "server", picture: serverAsk.picture, itemId: serverAsk.itemId, lines: [], lang: langAttr(ctx.lessonLang) };
        // A new item. If this turn also grades the child's answer, the old question and answer stay up while she
        // speaks, so the verdict lands on THEIR answer on her first voiced frame; the new ask takes the card at
        // the hand-over. Otherwise the new ask pins at once (from her first frame).
        next = ui.verdict && it.answer ? { ...it, nextAsk: ask } : { ask, answer: null, pendingVerdict: null };
      }
      if (ui.hint?.text && next.ask) {
        const line = { kind: "hint" as const, text: ui.hint.text, level: ui.hint.level ?? 1 };
        if (!next.ask.lines.some((l) => l.kind === "hint" && l.text === line.text)) next = { ...next, ask: { ...next.ask, lines: [...next.ask.lines.filter((l) => l.kind !== "hint"), line] } };
      }
      if (ui.verdict) next = { ...next, pendingVerdict: ui.verdict, pendingWithHelp: withHelpNow };
      return next;
    });
  }, [state.ui, serverAsk, ui.hint, ui.verdict, withHelpNow, ctx.lessonLang]);

  // The hand-over: a queued next question takes the card (the graded answer has been seen with its mark).
  useEffect(() => {
    if (floor === "your_turn" || floor === "yielding" || floor === "idle") {
      setItem((it) => (it.nextAsk ? { ask: it.nextAsk, answer: null, pendingVerdict: null, nextAsk: null } : it));
    }
  }, [floor]);

  // Legacy ask: inferred at the hand-over from her own words (only while the Director sends no ui.ask).
  const teacherCap = useMemo(() => [...state.captions].reverse().find((c) => c.who === "teacher") ?? null, [state.captions]);
  useEffect(() => {
    if (floor !== "your_turn" || serverAsk || !teacherCap) return;
    const q = inferAsk(teacherCap.text);
    if (!q) return;
    setItem((it) => (it.ask?.text === q ? it : { ask: { text: q, source: "inferred", lines: [], lang: langAttr(ctx.lessonLang) }, answer: it.ask ? null : it.answer, pendingVerdict: null }));
  }, [floor, serverAsk, teacherCap, ctx.lessonLang]);

  // The receipt: the answer chip lands on the card from the child's commit (spoken: at speech end; typed/tapped:
  // at once). The verdict lands on it on her first voiced frame of the reply.
  useEffect(() => {
    return runtime.events.on((e) => {
      if (e.type === "child_speech_end") setItem((it) => ({ ...it, answer: { text: null, form: "spoken", delivery: "sending" }, pendingVerdict: null }));
      else if (e.type === "child_final") {
        if (e.typed) setItem((it) => ({ ...it, answer: { text: e.text, form: e.chipId ? "tapped" : "typed", delivery: "sending" }, pendingVerdict: null }));
        else if (e.text) setItem((it) => ({ ...it, answer: { ...(it.answer ?? { form: "spoken", delivery: "sending" }), text: e.text } as AnswerChip }));
      } else if (e.type === "teacher_audio_start") {
        setItem((it) => (it.pendingVerdict && it.answer ? { ...it, answer: { ...it.answer, verdict: it.pendingVerdict, withHelp: it.pendingWithHelp }, pendingVerdict: null } : it));
      }
    });
  }, [runtime]);

  const sendFailed = state.failure?.kind === "send";
  const heldNow = state.held.length > 0 && (sendFailed || offline);
  const answer: AnswerChip | null = item.answer
    ? { ...item.answer, delivery: heldNow ? "not_sent" : sentFlashAt !== null ? "sent" : item.answer.delivery === "sending" && state.pendingTurns === 0 ? "done" : item.answer.delivery }
    : null;

  // ───────── phase, geometry, tray ─────────
  const [phase, setPhase] = useState<DeskPhase | null>(ctx.variant === "practice" ? "practice" : null);
  useEffect(() => {
    if (ctx.variant === "practice") return;
    setPhase((p) => deskPhaseOf(p, state.move, ui.phase));
  }, [state.move, ui.phase, ctx.variant]);
  const modulesMounted = useMountedModules(runtime.modules);
  const [moduleFailed, setModuleFailed] = useState(false);
  useEffect(() => setModuleFailed(false), [modulesMounted.join(",")]);
  const chips = ui.chips ?? [];
  const wb = ui.whiteboard?.value ? ui.whiteboard : null;
  const trayKind: TrayModel["kind"] | null = ui.tray && ui.tray !== "none" ? ui.tray
    : modulesMounted.length && !moduleFailed ? "module" : chips.length ? "tiles" : wb && (phase === "teach" || phase === "practice") ? "board" : null;
  // Geometry is decided at a phase boundary; within a phase it only ever grows Face → Work (legacy: content that
  // the Director did not announce with ui.tray), never back, so nothing reflows mid-item.
  const [geometry, setGeometry] = useState<"face" | "work">("face");
  const phaseRef = useRef(phase);
  useEffect(() => {
    const boundary = phaseRef.current !== phase;
    phaseRef.current = phase;
    if (ui.tray) return setGeometry(ui.tray === "none" ? "face" : "work");
    if (boundary) setGeometry(trayKind ? "work" : "face");
    else if (trayKind) setGeometry("work");
  }, [phase, trayKind, ui.tray]);
  // T7: a failed module never leaves an empty tray: if nothing else can fill it, the Face layout holds.
  const effectiveGeometry = geometry === "work" && !trayKind ? "face" : geometry;

  // ───────── talking ─────────
  const spoken = !ctx.textOnly && bs?.transport !== "typed" && !facts.noMic;
  const pttOn = bs?.cascade ? bs.pushToTalk : state.pushToTalk;
  const tapToTalk = spoken && (state.phase === "live" ? pttOn || !ctx.openMic : !ctx.openMic);
  const paused = sheet !== null;
  const ptt = useTapToTalk({
    enabled: state.phase === "live" && tapToTalk && !paused,
    tokens,
    mic: runtime.levels.mic,
    start: () => {
      bridge?.stopReplay();
      runtime.talkStart();
    },
    end: () => runtime.talkEnd(),
  });
  bridge?.setPushToTalk(!ctx.openMic || paused);
  useEffect(() => {
    if (state.phase === "live" && spoken) runtime.setPushToTalk(!ctx.openMic || paused);
  }, [state.phase, spoken, ctx.openMic, paused, runtime]);

  // YOUR TURN timers (escalate only; they never set a state): Young help after tapOptionsS, the second breath.
  const changeKey = `${floor}|${chips.map((c) => c.id).join(",")}|${bs?.replays ?? 0}`;
  const yt = useYourTurn(floor === "your_turn", changeKey, tokens, paused, ctx.timing);
  const [typing, setTyping] = useState(ctx.textOnly);
  const [captionsOverride, setCaptionsOverride] = useState<boolean | null>(null);
  // A choice turn puts the touch on the tiles: a typed field left open from the last item closes.
  useEffect(() => {
    if (ui.answerForm === "choice" && spoken && !ctx.textOnly) setTyping(false);
  }, [ui.answerForm, ui.chips, spoken, ctx.textOnly]);
  // The top-bar title is the server's shortTitle for the lesson: it stays when later turns omit it.
  const [shortTitle, setShortTitle] = useState<string>("");
  useEffect(() => {
    if (ui.shortTitle) setShortTitle(ui.shortTitle.slice(0, 24));
  }, [ui.shortTitle]);
  const [typingFocus, setTypingFocus] = useState(false);
  const [trayOverlay, setTrayOverlay] = useState<TrayModel["overlay"]>(null);
  useEffect(() => {
    if (facts.noMic && !facts.noMicCardSeen) setTrayOverlay("no_mic");
  }, [facts.noMic, facts.noMicCardSeen]);
  useEffect(() => {
    if (facts.sttDown && !young) setTyping(true); // T3: the dock switches to Type (Older); Young get tiles
  }, [facts.sttDown, young]);

  // T6 heuristic (§3.13 "Phone muted"): two YOUR TURN windows in a row reach the re-ask time with no tap and no
  // speech, in this lesson. Event-derived: counted from the floor, reset by any child action.
  const [quietTurns, setQuietTurns] = useState(0);
  const reaskS = young ? 8 : 12;
  useEffect(() => {
    if (floor !== "your_turn" || paused) return;
    const id = setTimeout(() => setQuietTurns((n) => n + 1), reaskS * 1000 * ctx.timing);
    return () => clearTimeout(id);
  }, [floor, paused, reaskS, ctx.timing, changeKey]);
  useEffect(() => {
    if (floor === "listening" || floor === "heard") setQuietTurns(0);
  }, [floor]);

  // ───────── trouble ─────────
  const waitingSince = commitAt !== null && !audioSinceCommit && (state.pendingTurns > 0 || floor === "thinking" || floor === "heard") ? commitAt : null;
  const strip: StripId | null = classifyTrouble({
    now,
    offline,
    linkDownSince,
    waitingSince,
    sendFailed,
    authExpired: state.failure?.kind === "auth",
    startFailed: state.failure?.kind === "start" && state.phase === "error",
    ttsFailed: facts.tts,
    sttDown: facts.sttDown && spoken,
    likelyMuted: quietTurns >= 2,
    dismissed,
    recoveredAt: recoveredAt !== null && (troubleShown.current !== null || sentFlashAt !== null) ? recoveredAt : null,
    pttFallback: facts.ptt && !ctx.textOnly,
  });
  useEffect(() => {
    if (strip && strip !== "RC" && strip !== "PTT") troubleShown.current = strip;
    if (strip === null && recoveredAt === null) troubleShown.current = null;
  }, [strip, recoveredAt]);
  suspendedRef.current = sheet !== null || isStrip(strip) || strip === "T8" || strip === "T9";

  // ───────── announcements: assertive once per change, polite for her finished phrase ─────────
  const [assertive, setAssertive] = useState("");
  const [polite, setPolite] = useState("");
  const askText = serverAsk?.text ?? item.ask?.text ?? "";
  useEffect(() => {
    if (floor === "your_turn" && !suspendedRef.current) setAssertive(askText ? t("sr.your_turn", { ask: askText }) : t("sr.your_turn_plain"));
  }, [floor, fs.seq]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (strip && strip !== "PTT") setAssertive(strip === "RC" ? t("trouble.back_online") : "");
  }, [strip]);
  const prevFloor = useRef<Floor>(floor);
  useEffect(() => {
    const was = prevFloor.current;
    prevFloor.current = floor;
    if ((was === "speaking" || was === "showing") && floor !== "speaking" && floor !== "showing" && teacherCap?.final) setPolite(teacherCap.text);
    else if (floor === "thinking") setPolite(t("sr.thinking", { T: ctx.teacherName }));
    else if (floor === "listening") setPolite(t("sr.listening"));
  }, [floor, teacherCap, ctx.teacherName]);

  // ───────── starting: no second start gate ─────────
  const [gate, setGate] = useState<null | "starting" | "locked">(null);
  const startedOnce = useRef(false);
  const start = useCallback(async (mode?: LessonMode) => {
    const m: StartMode = (mode ?? (ctx.textOnly ? "text" : "voice")) === "voice" ? "cascade" : "text";
    prepareEarcons(); // inside the tap when there is one: the earcon context is unlocked by the same gesture
    setGate("starting");
    try {
      await runtime.start(ctx.cid, m, ctx.topicId);
    } catch {
      /* the failure lands in state.failure → T8 / T9 */
    } finally {
      setGate(null);
    }
  }, [runtime, ctx.cid, ctx.textOnly, ctx.topicId]);
  useEffect(() => {
    if (startedOnce.current || state.phase !== "idle") return;
    startedOnce.current = true;
    // The AudioContext was unlocked by the child's tap on Who / Hello / Home and is carried here (§3.3 step 6):
    // a navigation inside the app has user activation, so she can speak at once. A cold load of the lesson URL
    // has none: then, and only then, one "Tap to hear {T}" (§6.4.8).
    const active = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? true;
    if (active || ctx.textOnly) void start();
    else setGate("locked");
  }, [state.phase, start, ctx.textOnly]);
  const sentFirst = useRef(false);
  useEffect(() => {
    if (state.phase === "live" && ctx.firstText && !sentFirst.current) {
      sentFirst.current = true;
      setItem({ ask: { text: ctx.firstText, source: "child", lines: [] }, answer: null, pendingVerdict: null });
      runtime.say(ctx.firstText);
    }
  }, [state.phase, ctx.firstText, runtime]);

  // ───────── the lesson log the Summary is built from (what the child did, nothing else) ─────────
  const log = useRef<DidCard[]>([]);
  useEffect(() => {
    if (!item.answer || item.answer.text === null) return;
    const card: DidCard = { ask: item.ask?.text ?? null, answer: item.answer.text, verified: item.answer.verdict === "correct", withHelp: !!item.answer.withHelp || (item.ask?.lines.some((l) => l.kind === "hint") ?? false) };
    const i = log.current.findIndex((c) => c.ask === card.ask && c.answer === card.answer);
    if (i >= 0) log.current[i] = card;
    else log.current = [...log.current, card].slice(-12);
  }, [item.answer, item.ask]);
  const ended = state.phase === "ended" || state.phase === "ending";
  // The server's own record of graded turns (lesson/end `did`) wins; the client's witnessed log is the fallback.
  const did = bs?.ended?.did ?? null;
  const summary = ended ? (() => {
    if (did) {
      const cards: DidCard[] = did.cards.map((c) => ({ ask: c.ask, answer: c.answer, verified: c.tick, withHelp: c.withHelp }));
      return { cards, tried: did.tried ?? cards.length, nextTopic: did.nextTitle, ending: state.phase === "ending" };
    }
    const verified = log.current.filter((c) => c.verified);
    const cards = (verified.length ? verified : log.current).slice(-3);
    return { cards, tried: log.current.length, nextTopic: null, ending: state.phase === "ending" };
  })() : null;

  // ───────── layout ─────────
  const stripH = strip && isStrip(strip) ? stripHeight(strip, { noPack: true, young, width: Math.min(size.w, 600) - 32 }) : 0;
  const layout: DeskLayout = solveDesk({
    width: size.w, height: size.h, family: ctx.family, geometry: effectiveGeometry,
    keyboard: typingFocus && !young && size.w < size.h && size.w < 600, fontScale: size.fontScale,
    captionsOn: ctx.captionsAlways || ctx.band !== "b1", strip: stripH,
  });

  // ───────── thinking beats ─────────
  const beats = commitAt !== null && (floor === "thinking" || floor === "heard") ? beatsAt(now - commitAt, { older: !young }) : null;

  // ───────── the tray model ─────────
  const tray: TrayModel | null = trayKind
    ? {
        kind: trayKind,
        tiles: chips,
        board: trayKind === "board" && wb ? {
          lines: [{ text: wb.value, kind: wb.kind }],
          chalked: beats?.chalk || floor === "speaking" ? item.answer?.text ?? null : null,
          mark: item.answer?.verdict === "correct" ? "tick" : item.answer?.verdict === "not_yet" ? "underline" : null,
        } : undefined,
        overlay: trayOverlay ?? (young && yt.tapOptions && floor === "your_turn" ? "help_menu" : null),
      }
    : trayOverlay
      ? { kind: "tiles", tiles: [], overlay: trayOverlay }
      : null;
  const geometryOut = tray && (trayOverlay || tray.overlay) ? "work" : effectiveGeometry;
  const finalLayout = geometryOut === effectiveGeometry ? layout : solveDesk({ width: size.w, height: size.h, family: ctx.family, geometry: geometryOut, fontScale: size.fontScale, captionsOn: ctx.captionsAlways || ctx.band !== "b1", strip: stripH });

  const answerForm: DeskModel["answerForm"] = ui.answerForm ?? (chips.length ? "choice" : trayKind === "module" ? "tap_in_tray" : "words");
  // Captions: on by reading level (R1+), "always" by preference, forced on for a turn whose sound failed (T5);
  // the CC button overrides for this lesson.
  const captionsOn = facts.tts || (captionsOverride ?? (ctx.captionsAlways || ctx.band !== "b1"));

  const m: DeskModel = {
    band: ctx.band,
    family: ctx.family,
    teacher: { id: state.teacher?.id ?? ctx.teacherId, name: state.teacher?.name ?? ctx.teacherName },
    childName: ctx.childName,
    floor,
    sheet,
    strip,
    noPack: true, // no offline lesson pack exists yet: T2 always offers "Finish for now"
    ask: item.ask,
    answer,
    caption: { text: teacherCap?.text ?? "", speaking: floor === "speaking" || floor === "showing", mode: captionsOn ? "phrase" : "icons", lang: langAttr(ctx.lessonLang) },
    tray: tray && geometryOut === "work" ? { ...tray } : null,
    answerForm,
    phase,
    shortTitle: shortTitle || shortTitleOf(ui, state.topic),
    lastOne: young && phase === "wrap",
    thinkingSeconds: beats?.seconds ?? null,
    thinkingLabel: !!beats?.thinkingLabel || (floor === "thinking" && commitAt === null),
    mic: { available: spoken, talking: ptt.talking, drain: ptt.drain, tapToTalk },
    showHelp: young && (yt.tapOptions || tokens.tapOptionsS === null),
    typing: typing || (!spoken && !young),
    captionsOn,
    offlineBadge: false,
    gate: state.phase === "starting" || gate === "starting" ? "starting" : gate === "locked" && state.phase === "idle" ? "locked" : null,
    summary,
    lights: ended && state.phase === "ended" ? "up" : "down",
    layout: finalLayout,
    helpBackVisible,
    reducedMotion: ctx.reducedMotion,
    faceForm: ctx.faceForm,
    lampBreath: floor === "your_turn" ? (young && yt.glowStrong ? 2 : 1) : 0,
  };

  // ───────── actions ─────────
  const lastHear = useRef(0);
  const a: DeskActions & { notMe: () => void } = {
    start: () => void start(),
    tapToHear: () => void start(),
    talk: () => {
      if (ptt.talking) return ptt.toggle();
      if (floor === "speaking" || floor === "showing") bridge?.quietStop(); // barge-in: she stops
      ptt.toggle();
    },
    send: (text) => {
      if (!text.trim() || state.phase !== "live") return;
      bridge?.stopReplay();
      runtime.say(text);
      if (spoken && !ctx.textOnly) setTyping(false); // back to the mic dock for the next item
    },
    pickTile: (c) => {
      bridge?.stopReplay();
      runtime.tapChip(c);
    },
    padSend: (v) => {
      bridge?.stopReplay();
      runtime.say(v);
    },
    hearQuestion: () => {
      const n = Date.now();
      const slower = n - lastHear.current < 10_000; // a second tap within 10 s: the slower version
      lastHear.current = n;
      ptt.stop();
      if (bridge && bs && bs.buffered > 0) {
        if (floor === "speaking") bridge.quietStop();
        bridge.replay(slower);
      } else runtime.replayTeacher();
    },
    hearAgain: () => a.hearQuestion(),
    openHint: () => setSheet("hint"),
    hintPick: (k) => {
      setSheet(null);
      const row = REQUESTS[k];
      if (row) runtime.tapChip({ id: k, label: row[ctx.lessonLang === "hindi" ? 1 : ctx.lessonLang === "english" ? 2 : 0] });
    },
    helpMenuPick: (k) => {
      if (k === "again") return a.hearQuestion();
      const row = REQUESTS[k === "choices" ? "choices" : "how"];
      runtime.tapChip({ id: `help_${k}`, label: row[ctx.lessonLang === "hindi" ? 1 : ctx.lessonLang === "english" ? 2 : 0] });
    },
    openHelpMenu: () => setTrayOverlay((o) => (o === "help_menu" ? null : "help_menu")),
    wait: () => {
      // Older "Wait": pauses the turn timers; the strip's Wait hides T1 until her reply or 8 s more.
      setDismissed((d) => new Set([...d, "T1"]));
      setCommitAt((c) => (c === null ? c : Date.now()));
    },
    setTyping: (on) => setTyping(on),
    setTypingFocus: (on) => setTypingFocus(on),
    toggleCaptions: () => {
      const next = !m.captionsOn;
      setCaptionsOverride(next);
      if (ctx.band === "b1") ctx.setCaptionsAlways?.(next);
    },
    pause: () => {
      ptt.stop();
      bridge?.stopReplay();
      bridge?.holdSpeech(true);
      resumeTurn.current = floor === "speaking";
      if (resumeTurn.current) bridge?.quietStop();
      setSheet("pause");
    },
    resume: () => {
      const replayTurn = sheet === "pause" && resumeTurn.current;
      resumeTurn.current = false;
      const newer = (bridge?.speechWaiting ?? 0) > 0;
      setSheet(null);
      if (replayTurn && !newer) bridge?.replay(false);
    },
    askEnd: () => setSheet("end"),
    cancelEnd: () => setSheet(null),
    endLesson: () => {
      setSheet(null);
      ptt.stop();
      bridge?.stopReplay();
      if (state.phase === "live" || state.phase === "starting") void runtime.end();
      else nav.finished();
    },
    openGrownUp: () => setSheet("grownup"),
    closeGrownUp: () => setSheet("help"),
    grownUpHere: () => nav.parent(),
    closeHelp: () => setSheet(null),
    troubleAction: (x) => {
      switch (x) {
        case "wait":
          return a.wait();
        case "try_again":
          if (strip === "T9") return void start();
          if (strip === "T2" && typeof navigator !== "undefined" && navigator.onLine === false) return; // still offline: nothing to send yet
          void runtime.resendHeld();
          setDismissed((d) => new Set([...d, "T1"]));
          return;
        case "send_again":
          return void runtime.resendHeld();
        case "finish_now":
          return void runtime.end();
        case "play_again":
          setFacts((f) => ({ ...f, tts: false }));
          return runtime.replayTeacher();
        case "hear_now":
          setQuietTurns(0);
          return setDismissed((d) => new Set([...d, "T6"]));
        case "type_instead":
          setTyping(true);
          return setDismissed((d) => new Set([...d, "T3"]));
        case "ok":
          return setDismissed((d) => new Set([...d, strip === "T3" ? "T3" : "PTT"]));
        case "sign_in":
          return nav.signIn();
        case "go_home":
          return nav.home();
        case "continue_live":
          return;
      }
    },
    dismissNoMic: () => {
      setTrayOverlay(null);
      setFacts((f) => ({ ...f, noMicCardSeen: true }));
    },
    finish: () => nav.finished(),
    moduleEvent: (ev) => {
      const e = ev as Parameters<LessonRuntime["moduleEvent"]>[0];
      if (e.type === "answer") floorCtl.commit(); // a module answer is a commit: the receipt
      if (e.type === "error") setModuleFailed(true);
      runtime.moduleEvent(e);
    },
    fixAnswer: () => {
      setTyping(true);
    },
    notMe: () => {
      void runtime.end();
      nav.who();
    },
  };

  return { m, a, dockRef: (el: HTMLElement | null) => (dockEl.current = el), live: { assertive, polite }, floorCtl, state, t1Ms: T1_MS };
}

const noopSub = () => () => {};
const nullGet = () => null;
export const langAttr = (l: string) => (l === "hindi" ? "hi" : l === "hinglish" ? "hi-Latn" : "en-IN");
