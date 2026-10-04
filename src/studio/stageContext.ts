// What a Studio renderer may know about its moment, besides its artifact (src/studio/StudioStage.tsx provides it):
// whether it is the activity right now (interactive) or a sketch being made (pencil, inert), and the host's grader.
// A renderer never grades: `answer` sends the child's value to the host and resolves with the HOST's verdict.
import { createContext, useContext } from "react";
import type { StudioAnswerResponse } from "../../shared/studio.ts";

export interface StageMoment {
  /** The piece is the activity now (revealed, in use, or a skeleton that became the activity). */
  interactive: boolean;
  /** Bumped by "Show me again": renderers restart their animation or reset their game when it changes. */
  epoch: number;
  /** The host's grade (null = no verdict came back: the renderer just waits, never shows an error). */
  answer: (value: unknown) => Promise<StudioAnswerResponse | null>;
}

export const StageMomentContext = createContext<StageMoment>({ interactive: false, epoch: 0, answer: async () => null });
export const useStageMoment = () => useContext(StageMomentContext);
