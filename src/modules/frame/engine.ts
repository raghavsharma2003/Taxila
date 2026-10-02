// What an engine is, from inside the frame. An engine is one React component plus its EngineDef; it gets
// resolved params and the host's live commands as props, and reports what the child did through EngineApi.
// Engines never grade by opinion: `correct` must be computed from the engine's own state and params
// (a model never grades — the Director classifies against verified keys; the module reports facts).
import type { ComponentType } from "react";
import type { EngineDef } from "../../../shared/contracts.ts";

export interface EngineApi {
  /** A raw interaction (tap, drag, toggle): batched to the Director. */
  interaction(name: string, data?: Record<string, unknown>): void;
  /** The child committed an answer; `correct` is decided by the engine's state, not guessed. */
  answer(value: unknown, correct?: boolean): void;
  /** The module's goal was reached (sent to the Director at once). */
  goalMet(goal: string): void;
  /** The child appears stuck by an engine-specific, deterministic rule (sent at once). */
  stuck(reason: string): void;
  /** The engine cannot do what it was asked (bad params, unreachable goal). */
  error(message: string): void;
}

export interface EngineProps {
  /** Params resolved against the EngineDef: defaults applied, wrong types replaced. */
  params: Record<string, unknown>;
  goal?: string;
  lang: string;
  ageBand: string;
  /** The latest highlight command; `seq` changes on every command so the same target can pulse again. */
  highlight: { target: string; seq: number } | null;
  revealed: boolean;
  api: EngineApi;
}

export interface EngineModule {
  def: EngineDef;
  Component: ComponentType<EngineProps>;
}
