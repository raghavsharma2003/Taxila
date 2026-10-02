// Which teacher speech each child turn was answering. The Director logs "the teacher's last turn (as
// heard)" alongside each child turn, so a teacher turn must be attributed to the child turn that came
// AFTER it, never the one it was answering — and in voice mode the child's transcript can land after the
// teacher has already started replying to it. Rule: a child turn carries the teacher turns that started
// before the child started speaking; each teacher turn is sent to the Director once, and only once it has
// finished. Taking a turn mid-stream sent its first words and lost the rest — including, measured, the
// half that said the key aloud, so the server's answer-leak check never saw it.

interface TeacherTurn {
  id: string;
  startedAt: number;
  text: string;
  interrupted: boolean;
  finished: boolean;
}

export class TeacherTurns {
  private turns: TeacherTurn[] = [];

  begin(id: string, startedAt: number): void {
    if (!this.turns.some((t) => t.id === id)) this.turns.push({ id, startedAt, text: "", interrupted: false, finished: false });
  }

  delta(id: string, delta: string): void {
    const t = this.turns.find((x) => x.id === id);
    if (t && !t.finished) t.text += delta;
  }

  /** Authoritative text (replaces streamed deltas); the turn is finished. */
  done(id: string, text: string): void {
    const t = this.turns.find((x) => x.id === id);
    if (!t) return;
    t.text = text;
    t.finished = true;
  }

  /** The response ended (with or without text). */
  finish(id: string): void {
    const t = this.turns.find((x) => x.id === id);
    if (t) t.finished = true;
  }

  interrupted(id?: string): void {
    const t = id ? this.turns.find((x) => x.id === id) : this.turns[this.turns.length - 1];
    if (t) t.interrupted = true;
  }

  /** Is a turn that started before `before` (any turn, when omitted) still streaming? */
  streaming(before?: number): boolean {
    return this.turns.some((t) => !t.finished && (before === undefined || t.startedAt < before));
  }

  /**
   * Consume the FINISHED turns that started before `before` (all finished turns when omitted) and return
   * them as one. A turn still streaming stays for a later call.
   */
  take(before?: number): { text: string; interrupted: boolean } | null {
    const taken = this.turns.filter((t) => t.finished && (before === undefined || t.startedAt < before));
    if (!taken.length) return null;
    this.turns = this.turns.filter((t) => !taken.includes(t));
    const text = taken.map((t) => t.text.trim()).filter(Boolean).join(" ");
    if (!text) return null;
    return { text, interrupted: taken.some((t) => t.interrupted) };
  }

  clear(): void {
    this.turns = [];
  }
}
