// /dev/desk: the Desk's dev page (dev builds and VITE_DEV_ROUTES=1 only; never in production).
//   ?fixture=<name>   pins a floor / trouble / sheet / feedback / summary state (PRODUCT-DESIGN-V2 §13.2), with
//                     the teacher as the deterministic D plate (?face=live to see the 3D head).
//   ?live=1           runs the REAL runtime (LessonRuntime + outbox + floor + signals + trouble) against a scripted
//                     Director and a clock-driven link (dev/script.ts): states come from real events.
// Common: ?band=b1..b4 (default b3), ?theme=light|dark, ?motion=reduce.
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useLesson } from "../../../lesson/useLesson.ts";
import type { Floor } from "../../../lesson/floor.ts";
import { isStrip, type StripId } from "../../../lesson/trouble.ts";
import { stripHeight } from "../TroubleStrip.tsx";
import { teacherRecord } from "../../../ui/teacher/useTeacher.ts";
import { ageBandOf, familyOf, type Band } from "../../band.ts";
import { Desk, sameSize, type DeskSize } from "../Desk.tsx";
import { solveDesk } from "../deskLayout.ts";
import type { DeskActions, DeskModel, Sheet, TrayModel } from "../model.ts";
import { useDesk } from "../useDesk.ts";
import { scriptedApi, scriptedLinkFactory, lessonScript } from "./script.ts";
import "../../../styles/tokens.css";

const silent = { value: 0, subscribe: () => () => {} };

export const FIXTURES = [
  "idle", "speaking", "showing", "yielding", "your_turn", "listening", "heard", "thinking",
  "work-speaking", "work-showing", "work-your_turn", "work-listening", "work-heard", "work-thinking", "work-tiles", "work-pad", "work-pad-help",
  "T1", "T2", "T3", "T4", "T5", "T6", "T8", "T9", "RC", "PTT",
  "pause", "end", "hint", "help-menu", "help", "grownup", "no-mic", "locked",
  "correct", "not_yet", "partial", "hint-line", "with-help", "board-correct", "board-not_yet",
  "summary", "summary-tried", "keyboard", "thinking-4s",
] as const;
export type FixtureName = (typeof FIXTURES)[number];

const noop = () => {};
const ACTIONS: DeskActions = {
  start: noop, tapToHear: noop, talk: noop, send: noop, pickTile: noop, padSend: noop, hearQuestion: noop, hearAgain: noop, openHint: noop,
  hintPick: noop, helpMenuPick: noop, openHelpMenu: noop, wait: noop, setTyping: noop, setTypingFocus: noop, toggleCaptions: noop, pause: noop,
  resume: noop, askEnd: noop, cancelEnd: noop, endLesson: noop, openGrownUp: noop, closeGrownUp: noop, grownUpHere: noop, closeHelp: noop,
  troubleAction: noop, dismissNoMic: noop, finish: noop, moduleEvent: noop, moduleFailed: noop, fixAnswer: noop, closeHelpMenu: noop,
};

export function fixtureModel(name: string, band: Band, size: DeskSize, faceForm: "live" | "plate", reducedMotion: boolean): DeskModel {
  const family = familyOf(band);
  const young = family === "young";
  const rec = teacherRecord(null, band);
  const work = name.startsWith("work-") || ["work-tiles", "board-correct", "board-not_yet", "help-menu", "no-mic", "T7"].includes(name);
  const floorOf = (n: string): Floor => {
    const f = n.replace(/^work-/, "");
    if (["idle", "speaking", "showing", "yielding", "your_turn", "listening", "heard", "thinking"].includes(f)) return f as Floor;
    if (f === "tiles" || f === "help-menu" || f === "no-mic" || f === "pad" || f === "pad-help") return "your_turn";
    if (["correct", "not_yet", "partial", "with-help", "board-correct", "board-not_yet"].includes(n)) return "speaking";
    if (n === "hint-line") return "your_turn";
    if (n === "thinking-4s") return "thinking";
    if (n === "T1") return "thinking";
    if (["T2", "T4"].includes(n)) return "thinking";
    if (n === "keyboard") return "your_turn";
    if (n === "locked") return "idle";
    return "your_turn";
  };
  const floor = floorOf(name);
  const askModel: DeskModel["ask"] = name === "idle" || name === "locked" ? null
    : { text: young ? "Which one is half?" : "How many quarters make one half?", source: "server", lines: [] };
  if (askModel && (name === "hint-line" || name === "not_yet")) askModel.lines = [{ kind: "hint", level: 1, text: young ? "Count the two equal parts." : "Count the shaded quarters on the board." }];
  if (askModel && name === "with-help") askModel.lines = [{ kind: "hint", level: 2, text: "Two quarters fill one half." }];
  const answered = ["heard", "thinking", "work-heard", "work-thinking", "correct", "not_yet", "partial", "with-help", "board-correct", "board-not_yet", "T1", "T2", "T4", "RC", "thinking-4s"].includes(name);
  const verdict = name === "correct" || name === "board-correct" || name === "with-help" ? "correct" : name === "not_yet" || name === "board-not_yet" ? "not_yet" : name === "partial" ? "partial" : undefined;
  const answer: DeskModel["answer"] = answered
    ? { text: young && (name === "heard" || name === "thinking") ? null : young ? "1/2" : "two", form: young && (name === "heard" || name === "thinking") ? "spoken" : "spoken",
        delivery: name === "T2" || name === "T4" ? "not_sent" : name === "RC" ? "sent" : "done", verdict, withHelp: name === "with-help" }
    : null;
  const tiles = young ? [{ id: "a", label: "1/2" }, { id: "b", label: "1/3" }] : [{ id: "a", label: "1/3" }, { id: "b", label: "2/3" }, { id: "c", label: "3/3" }];
  let tray: TrayModel | null = null;
  if (name === "work-pad" || name === "work-pad-help") tray = { kind: "pad", overlay: name === "work-pad-help" ? "help_menu" : null };
  else if (name === "work-tiles" || name === "help-menu" || name === "no-mic") tray = { kind: "tiles", tiles, overlay: name === "help-menu" ? "help_menu" : name === "no-mic" ? "no_mic" : null };
  else if (work || name.startsWith("board-")) tray = { kind: "board", board: { lines: [{ text: "1/2 = 2/4", kind: "math" }], chalked: answered ? (young ? "1/2" : "two") : null, mark: verdict === "correct" ? "tick" : verdict === "not_yet" ? "underline" : null } };
  const geometry = tray ? "work" : "face";
  const keyboard = name === "keyboard";
  const strip = (["T1", "T2", "T3", "T4", "T5", "T6", "T8", "T9", "RC", "PTT"] as const).includes(name as StripId & string) ? (name as StripId) : null;
  const stripH = strip && isStrip(strip) ? stripHeight(strip, { noPack: true, young, width: Math.min(size.w, 600) - 32 }) : 0;
  const layout = solveDesk({ width: size.w, height: size.h, family, geometry, keyboard: keyboard && !young, fontScale: size.fontScale, captionsOn: band !== "b1", strip: stripH, cardNeed: size.cardNeed, stripNeed: size.stripNeed, trayNeed: size.trayNeed });
  const sheet: Sheet = name === "pause" ? "pause" : name === "end" ? "end" : name === "hint" ? "hint" : name === "help" ? "help" : name === "grownup" ? "grownup" : null;
  const caption = young ? "Do barabar tukde gino. Kaunsa aadha hai?" : "Board dekho: 1/2 barabar 2/4. Toh ek half mein kitne quarters hote hain?";
  return {
    band, family, teacher: { id: rec.id, name: rec.name }, childName: young ? "Riya" : "Kabir",
    floor, sheet, strip, noPack: true, ask: askModel, answer,
    caption: { text: caption, speaking: floor === "speaking" || floor === "showing", mode: "phrase", lang: "hi-Latn" },
    tray, padSlash: !young && name.startsWith("work-pad"), answerForm: name === "work-tiles" ? "choice" : young && !name.startsWith("work-pad") ? "words" : "number", phase: name === "summary" ? "wrap" : work ? "teach" : "warmup",
    shortTitle: young ? "Halves" : "Fractions: halves", lastOne: false,
    thinkingSeconds: name === "thinking-4s" && !young ? 4 : null, thinkingLabel: floor === "thinking",
    mic: { available: true, talking: floor === "listening", drain: floor === "listening" ? 0.3 : 0, tapToTalk: true },
    showHelp: young && name === "help-menu", typing: !young && (keyboard || name === "T3"), captionsOn: band !== "b1",
    offlineBadge: false, gate: name === "locked" ? "locked" : null,
    summary: name === "summary" ? { cards: [
      { ask: young ? "Which one is half?" : "Which is bigger: 1/2 or 1/4?", answer: young ? "1/2" : "one half", verified: true, withHelp: false },
      { ask: young ? "How do we write one half?" : "How many quarters make one half?", answer: young ? "1/2" : "two", verified: true, withHelp: true },
      ...(young ? [] : [{ ask: "Which fraction is one whole?", answer: "3/3", verified: true, withHelp: false }]),
    ], tried: 4, nextTopic: young ? null : "equal parts of a group", ending: false }
      : name === "summary-tried" ? { cards: [{ ask: "Which is bigger: 1/2 or 1/4?", answer: "one half", verified: false, withHelp: false }, { ask: "How many quarters make one half?", answer: "three", verified: false, withHelp: false }], tried: 4, nextTopic: null, ending: false }
      : null,
    lights: name.startsWith("summary") ? "up" : "down", layout, helpBackVisible: name === "help" || name === "grownup", reducedMotion, faceForm, lampBreath: floor === "your_turn" ? 1 : 0,
  };
}

export default function DeskDev() {
  const [sp] = useSearchParams();
  const band = (["b1", "b2", "b3", "b4"].includes(sp.get("band") ?? "") ? sp.get("band") : "b3") as Band;
  const theme = sp.get("theme") === "dark" ? "dark" : sp.get("theme") === "light" ? "light" : null;
  const reduced = sp.get("motion") === "reduce";
  const [size, setSize] = useState<DeskSize>({ w: typeof innerWidth === "number" ? innerWidth : 360, h: typeof innerHeight === "number" ? innerHeight : 640, fontScale: 1 });
  const onSize = useCallback((s: DeskSize) => setSize((p) => (sameSize(p, s) ? p : s)), []);
  if (sp.get("live")) return <LiveDesk band={band} theme={theme} reduced={reduced} size={size} onSize={onSize} sp={sp} />;
  const name = sp.get("fixture") ?? "your_turn";
  const faceForm = sp.get("face") === "live" ? "live" : "plate";
  const m = fixtureModel(name, band, size, faceForm, reduced);
  const assertive = m.floor === "your_turn" && !m.strip && !m.sheet ? `Your turn. ${m.ask?.text ?? ""}` : "";
  return (
    <Desk m={m} a={ACTIONS} media={{ meters: [silent], mic: silent, lang: "hinglish", ageBand: ageBandOf(band) }} live={{ assertive, polite: "" }}
      onSize={onSize} theme={theme} phaseLine />
  );
}

function LiveDesk({ band, theme, reduced, size, onSize, sp }: { band: Band; theme: "light" | "dark" | null; reduced: boolean; size: DeskSize; onSize: (s: DeskSize) => void; sp: URLSearchParams }) {
  const young = familyOf(band) === "young";
  const fail = sp.get("fail");
  const [status, n] = (fail ?? "").split(":");
  const opts = useMemo(() => ({
    young,
    fail: fail ? { status: Number(status), n: Number(n || 1) } : null,
    slowMs: Number(sp.get("slow") || 0) || undefined,
    startFail: Number(sp.get("start") || 0) || null,
    ttsFail: sp.get("tts") === "fail",
    safety: sp.get("safety") === "1",
  }), [young, fail, status, n, sp]);
  const [deps] = useState(() => ({
    api: scriptedApi(opts),
    createLink: scriptedLinkFactory(lessonScript(young).spoken, opts.ttsFail, sp.get("stt") === "down"),
    retrySchedule: sp.get("retry") === "fast" ? [200, 400, 800] : undefined,
  }));
  const { runtime } = useLesson(deps);
  const rec = teacherRecord("asha", band); // ONE teacher for every band (dc-r4-single-teacher-asha)
  const { m, a, dockRef, live } = useDesk(runtime, null, {
    cid: "dev-child", band, family: familyOf(band), teacherId: rec.id, teacherName: rec.name, childName: young ? "Riya" : "Kabir",
    lessonLang: "hinglish", captionsAlways: false, sounds: true, haptics: true, reducedMotion: reduced, timing: 1, variant: "lesson",
    textOnly: sp.get("mode") === "text", openMic: false, faceForm: sp.get("face") === "live" ? "live" : "plate", firstLesson: sp.get("first") === "1",
  }, { home: () => location.assign("/dev/desk"), who: () => location.assign("/dev/desk"), signIn: () => location.assign("/start"), parent: () => location.assign("/parent"), finished: () => (document.body.dataset.finished = "1") }, size);
  (window as unknown as { __desk?: unknown }).__desk = { runtime, calls: (deps.api as { calls: unknown[] }).calls };
  return (
    <Desk m={m} a={a} media={{ meters: [runtime.levels.teacher], mic: runtime.levels.mic, modules: runtime.modules, lang: "hinglish", ageBand: ageBandOf(band) }}
      dockRef={dockRef} live={live} onSize={onSize} theme={theme} notMeWindow={false} />
  );
}
