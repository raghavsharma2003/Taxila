// Carries the Director's ModuleCommands to whichever ModuleHost is on screen. It replays the commands
// for still-mounted modules to a late subscriber, so a host that mounts after the command arrived (or
// remounts) shows the same modules in the same state.
import type { ModuleCommand } from "../../shared/contracts.ts";

const OPS = new Set(["mount", "set_param", "highlight", "reveal", "unmount"]);

function isCommand(c: unknown): c is ModuleCommand {
  const o = c as Record<string, unknown> | null;
  if (!o || typeof o !== "object" || !OPS.has(o.op as string) || typeof o.moduleId !== "string" || !o.moduleId) return false;
  if (o.op === "mount") return typeof o.engine === "string" && !!o.params && typeof o.params === "object";
  if (o.op === "set_param") return typeof o.name === "string";
  if (o.op === "highlight") return typeof o.target === "string";
  return true;
}

export class ModuleChannel {
  private log: ModuleCommand[] = [];
  private listeners = new Set<(cmd: ModuleCommand) => void>();

  /** Malformed commands are dropped (returned count lets callers log them). */
  push(commands: readonly unknown[] | undefined): number {
    let dropped = 0;
    for (const c of commands ?? []) {
      if (!isCommand(c)) {
        dropped++;
        continue;
      }
      if (c.op === "mount" || c.op === "unmount") this.log = this.log.filter((x) => x.moduleId !== c.moduleId);
      if (c.op === "mount") this.log.push(c);
      else if (c.op !== "unmount") {
        if (!this.log.some((x) => x.op === "mount" && x.moduleId === c.moduleId)) {
          dropped++;
          continue; // a command for a module that is not mounted
        }
        this.log.push(c);
      }
      for (const fn of [...this.listeners]) fn(c);
    }
    return dropped;
  }

  /** Replays the live log, then streams new commands. */
  subscribe = (fn: (cmd: ModuleCommand) => void): (() => void) => {
    for (const c of this.log) fn(c);
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  /** Ids of mounted modules, in mount order. */
  mounted(): string[] {
    return this.log.filter((c) => c.op === "mount").map((c) => c.moduleId);
  }

  /** Unmount everything (lesson ended). */
  clear(): void {
    const ids = this.mounted();
    this.push(ids.map((moduleId) => ({ op: "unmount", moduleId })));
  }
}
