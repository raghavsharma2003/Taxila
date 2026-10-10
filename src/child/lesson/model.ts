// The Desk's view model: everything the lesson screen shows, as plain data. The live controller (useDesk.ts)
// derives it from the runtime, the floor and the outbox; the dev fixtures (dev/DeskFixtures.tsx) write it by hand,
// so every floor, trouble and feedback state can be pinned and photographed deterministically.
import type { Emotion } from "../../avatar/behaviour.ts";
import type { Floor } from "../../lesson/floor.ts";
import type { CopyKey } from "../../ui/copy.ts";
import type { StripId } from "../../lesson/trouble.ts";
import type { Band, Family } from "../band.ts";
import type { DeskLayout } from "./deskLayout.ts";
import type { StudioSlot } from "../../../shared/studio.ts";

export type AnswerForm = "words" | "number" | "choice" | "draw" | "read_aloud" | "tap_in_tray";
export type TrayKind = "module" | "board" | "tiles" | "pad" | "studio";
export type Verdict = "correct" | "not_yet" | "partial";
export type DeskPhase = "warmup" | "teach" | "practice" | "teachback" | "wrap";
export type Sheet = null | "pause" | "end" | "hint" | "help" | "grownup";

/** "asked": the child's help request as a chip state under the ask ("Hint asked"; W1-A item 6), never the answer row. */
export interface AskLine { kind: "hint" | "reask" | "didnt_catch" | "know" | "step" | "asked"; text: string; level?: 1 | 2 | 3 }

export interface Ask {
  text: string;
  /** "server": ui.ask from the Director. "inferred": the last question sentence of her hand-over turn, while the
   *  Director does not send ui.ask yet (legacy). "child": the child's own question (Ask a question). */
  source: "server" | "inferred" | "child";
  picture?: string;
  lang?: string;
  lines: AskLine[];
  itemId?: string;
  /** The stored teacher turn that posed this ask (its TTS seq and words): "Hear the question" replays THAT turn,
   *  never a later hint or praise turn. */
  replay?: { seq: number | null; text: string | null };
}

export interface AnswerChip {
  /** What the child entered. null = a spoken answer whose words are not echoed (Young: a sound-wave chip). */
  text: string | null;
  form: "spoken" | "typed" | "tapped" | "module";
  /** Delivery: in the outbox and not acknowledged → "not_sent"; acknowledged after a retry → "sent" (1.5 s, RC). */
  delivery: "sending" | "not_sent" | "sent" | "done";
  verdict?: Verdict;
  withHelp?: boolean;
  /** The child fixed a misheard transcript: the in-flight turn was re-sent with these words (same turnSeq). */
  edited?: boolean;
}

export interface Board { lines: { text: string; kind: "text" | "math" | "image" }[]; chalked?: string | null; mark?: "tick" | "underline" | null }

export interface TrayModel {
  kind: TrayKind;
  /** tiles */
  tiles?: { id: string; label: string }[];
  board?: Board;
  /** studio (W2 seam): the piece the StudioStage renders, aspect-fitted inside the tray. */
  studio?: StudioSlot;
  /** The Young help menu (after tapOptionsS) or the one-time no-mic card replace the tray body. */
  overlay?: "help_menu" | "no_mic" | null;
}

export interface DidCard { ask: string | null; answer: string; verified: boolean; withHelp: boolean }

/** r4 K-P12: the session-first intake as the server sends it (BUILD-SPEC §3.2; 4A's UiDirectives.intake, K-P11). Typed
 *  here structurally until K-P11 lands in shared/contracts.ts; the same shape, so the swap is a type alias. */
export interface DeskIntake {
  phase: "ask" | "listen" | "heard" | "mapped" | "plan";
  mapped?: { topicId: string; title: string; trail: string[] };
  plan?: { segments: Array<{ purpose: string }> };
  chips?: string[];
}

export interface DeskModel {
  band: Band;
  family: Family;
  teacher: { id: string; name: string };
  childName: string;
  floor: Floor;
  /** The lesson is not running normally. Pausing, help, the end confirm and the hint sheet are sheets. */
  sheet: Sheet;
  strip: StripId | null;
  /** T2 copy variant: no offline lesson pack on the device. */
  noPack: boolean;
  ask: Ask | null;
  answer: AnswerChip | null;
  caption: { text: string; speaking: boolean; mode: "phrase" | "icons"; lang?: string };
  tray: TrayModel | null;
  answerForm: AnswerForm;
  phase: DeskPhase | null;
  shortTitle: string;
  lastOne: boolean;
  /** Older: seconds thinking, shown from 4 s ("Thinking… 4 s"); Young never sees a number. */
  thinkingSeconds: number | null;
  thinkingLabel: boolean;
  mic: { available: boolean; talking: boolean; drain: number; tapToTalk: boolean };
  /** Young: the Help button appears after tapOptionsS; Older: Hint is always there. */
  showHelp: boolean;
  /** The typed field is open (Older Type, or a T3 / no-mic fallback). */
  typing: boolean;
  captionsOn: boolean;
  offlineBadge: boolean;
  /** Before the lesson is live: "starting" (getting ready), "locked" (audio needs a tap), "ready". */
  gate: null | "starting" | "locked";
  /** Lesson over: the Summary. */
  summary: null | { cards: DidCard[]; tried: number; nextTopic: string | null; ending: boolean };
  /** Lights down while the lesson runs; up at Finish. */
  lights: "down" | "up";
  layout: DeskLayout;
  /** Help sheet: "Back to the lesson" appears after 10 s. */
  helpBackVisible: boolean;
  reducedMotion: boolean;
  /** dev / tests: a deterministic plate instead of the live 3D head. */
  faceForm: "live" | "plate";
  /** Young: one more lamp breath at glowS. */
  lampBreath: number;
  /** A strip sentence other than the id's own (T2 "Try again" while still offline: "Still no internet…"). */
  stripText?: CopyKey | null;
  /** "That wasn't me" is offered in the ⋯ menu for the first 2 minutes of the lesson (§3.13). */
  notMeWindow?: boolean;
  /** Her affect for the face (never a verdict preview): the encouraging warm variant under trouble (§4.2). */
  affect?: Emotion | null;
  /** Older, thinking: when the wait began, so the dock's own clock can show "Thinking… 4 s" without the whole
   *  Desk re-rendering every second. */
  thinkingSince?: number | null;
  /** "Fix": the type row opens prefilled with the heard transcript; sending re-sends the turn in flight. */
  fixDraft?: string | null;
  /** Text lane: the dock (type row, side controls) stays open while she speaks; typing interrupts her (smooth G4). */
  openWhileSpeaking?: boolean;
  /** The Older pad shows a "/" key (a fraction question; live-content 10). */
  padSlash?: boolean;
  /** "," on the pad: the item's key is written with commas (server ui.padComma). */
  padComma?: boolean;
  /** Quick practice: item n of `of` (≤ 5); `done` = "That's the set" (W2-A; ui.practice from W2-C, else counted here). */
  practice?: { n: number; of: number; done: boolean } | null;
  /** r4 K-P12: the session-first intake as the server built it (ui.intake, K-P11): phase, the mapped topic, the plan. */
  intake?: DeskIntake | null;
  /** The lesson variant (practice: the Summary reads "That's the set"). */
  variant?: "lesson" | "practice" | "doubt";
}

export interface DeskActions {
  start(): void;
  tapToHear(): void;
  talk(): void;
  send(text: string): void;
  pickTile(t: { id: string; label: string }): void;
  padSend(value: string): void;
  hearQuestion(): void;
  hearAgain(): void;
  openHint(): void;
  hintPick(k: "hint" | "why" | "know" | "another" | "slower" | "skip"): void;
  helpMenuPick(k: "again" | "choices" | "how"): void;
  openHelpMenu(): void;
  wait(): void;
  setTyping(on: boolean): void;
  setTypingFocus(on: boolean): void;
  toggleCaptions(): void;
  pause(): void;
  resume(): void;
  askEnd(): void;
  cancelEnd(): void;
  endLesson(): void;
  openGrownUp(): void;
  closeGrownUp(): void;
  grownUpHere(): void;
  closeHelp(): void;
  troubleAction(a: "wait" | "try_again" | "finish_now" | "send_again" | "play_again" | "hear_now" | "sign_in" | "go_home" | "type_instead" | "ok" | "continue_live"): void;
  dismissNoMic(): void;
  finish(): void;
  moduleEvent(ev: unknown): void;
  /** W1 seam (BUILD-PLAN §2): the WorkTray's module reported an error or never loaded (WorkTray onModuleFailed). A no-op
   *  until W1-A fills it; moduleEvent still receives the error event as before. */
  moduleFailed(): void;
  fixAnswer(): void;
  /** Older "123": the NumberPad opens in the tray (§6.3.4 answerForm number). */
  openPad?(): void;
  /** The Help menu closes back over the pad or tiles it covered (W1-A item 3). */
  closeHelpMenu?(): void;
}
