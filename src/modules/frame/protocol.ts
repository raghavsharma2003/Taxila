// Parsers for the host ⇄ module postMessage protocol (types in shared/contracts.ts). Both sides treat every
// message as untrusted input: the frame runs engine code, the host runs the lesson, and neither should act
// on a malformed message. Pure, so the host and the frame bundle share it and Node tests can import it.
import type { HostToModule, ModuleEvent, ModuleToHost } from "../../../shared/contracts.ts";

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === "object" && !Array.isArray(v);
const isStr = (v: unknown): v is string => typeof v === "string";

export function parseModuleToHost(data: unknown): ModuleToHost | null {
  if (!isObj(data) || !isStr(data.moduleId) || !data.moduleId) return null;
  const moduleId = data.moduleId;
  switch (data.type) {
    case "ready":
      return { type: "ready", moduleId };
    case "interaction":
      return isStr(data.name) ? { type: "interaction", moduleId, name: data.name, data: isObj(data.data) ? data.data : {} } : null;
    case "answer":
      return { type: "answer", moduleId, value: data.value, ...(typeof data.correct === "boolean" && { correct: data.correct }) };
    case "goal_met":
      return isStr(data.goal) ? { type: "goal_met", moduleId, goal: data.goal } : null;
    case "stuck":
      return isStr(data.reason) ? { type: "stuck", moduleId, reason: data.reason } : null;
    case "error":
      return isStr(data.message) ? { type: "error", moduleId, message: data.message } : null;
    default:
      return null;
  }
}

export function parseHostToModule(data: unknown): HostToModule | null {
  if (!isObj(data)) return null;
  switch (data.type) {
    case "init":
      if (!isStr(data.moduleId) || !isStr(data.engine) || !isObj(data.params)) return null;
      return {
        type: "init",
        moduleId: data.moduleId,
        engine: data.engine,
        params: data.params,
        ...(isStr(data.goal) && { goal: data.goal }),
        lang: isStr(data.lang) ? data.lang : "english",
        ageBand: isStr(data.ageBand) ? data.ageBand : "10-15",
      };
    case "set_param":
      return isStr(data.name) ? { type: "set_param", name: data.name, value: data.value } : null;
    case "highlight":
      return isStr(data.target) ? { type: "highlight", target: data.target } : null;
    case "reveal":
      return { type: "reveal" };
    case "reset":
      return { type: "reset" };
    default:
      return null;
  }
}

/** A module message as the Director sees it (ready is protocol-internal and not forwarded). */
export function toModuleEvent(msg: ModuleToHost, engine: string, at: number): ModuleEvent | null {
  const base = { moduleId: msg.moduleId, engine, type: msg.type, at };
  switch (msg.type) {
    case "ready":
      return null;
    case "interaction":
      return { ...base, name: msg.name, data: msg.data };
    case "answer":
      return { ...base, name: "answer", data: { value: msg.value, correct: msg.correct } };
    case "goal_met":
      return { ...base, name: msg.goal, data: { goal: msg.goal } };
    case "stuck":
      return { ...base, name: msg.reason, data: { reason: msg.reason } };
    case "error":
      return { ...base, name: "error", data: { message: msg.message } };
  }
}
