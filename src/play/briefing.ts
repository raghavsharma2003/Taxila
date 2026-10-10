// The play Briefing seam (round 4, patch K-P3 from stream K; BUILD-SPEC §3.4). A shell may put a card in front of a
// real-game engine: PlayStudioRenderer renders it in the play box once the level has arrived, and mounts the engine only
// when the card calls launch(). The card stays over the box (the warp) until it calls done(). With no provider, play is
// exactly as before. The card reads what the level and the dress already carry; it never changes them, never sees an
// act, and never touches grading.
// Cosmetics: the child's Hangar choice (a hull and a trail colour) handed to the engine on the dress. Colour only: laws,
// levels, acts and grades never read it, and no model or server ever writes it.
import { createContext, useContext, type ReactNode } from "react";
import type { PlayLevel } from "../../shared/play.ts";

/** 0xRRGGBB numbers; absent = the engine's own colours. */
export interface PlayCosmetics { hull?: number | null; trail?: number | null }

/** The fields of the engine's DressedSpec a Briefing may read (structural, so the seam needs no engine import). */
export interface BriefDress {
  dress: { theme: string; wrapper: string; pace: string; music: string };
  secure: boolean;
  verb: "fire" | "scan";
}

export interface BriefingInput {
  level: PlayLevel;
  /** the engine that will render this level (a real-game engine only: no Briefing fronts the 2D view) */
  engine: string;
  /** the dress the engine will wear: the model's dress once it has answered, else the base dress */
  dress: BriefDress | null;
  /** the dress will not change any more (the model answered, or will not): a Briefing names the look only then */
  dressFinal: boolean;
  young: boolean;
  reducedMotion: boolean;
  px: { w: number; h: number };
  /** the engine has been asked to mount (the card is now over a loading engine: the warp) */
  launched: boolean;
  /** mount the engine now */
  launch(): void;
  /** take the card away */
  done(): void;
}

export interface PlayBriefing {
  render(p: BriefingInput): ReactNode;
  cosmetics?: PlayCosmetics | null;
}

export const PlayBriefingContext = createContext<PlayBriefing | null>(null);
export const usePlayBriefing = (): PlayBriefing | null => useContext(PlayBriefingContext);
