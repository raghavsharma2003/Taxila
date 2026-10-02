// Ordered record of the realtime conversation's items, so the client can prune context.
// A 45-min lesson that keeps every turn in the realtime context costs ~7x more (docs/research/
// realtime-cost-model.py); the Director's compiled instructions carry the child brief and lesson summary,
// so the voice model only needs the last few messages.

export interface LedgerItem {
  id: string;
  type: string; // "message" | "function_call" | ...
  role?: string;
}

export class ConversationLedger {
  private items: LedgerItem[] = [];

  /**
   * Record an item. previousId follows the realtime API: undefined → append, null → first in the
   * conversation, id → insert after that item (append if it is unknown).
   */
  add(item: LedgerItem, previousId?: string | null): void {
    if (this.items.some((i) => i.id === item.id)) return;
    if (previousId === null) {
      this.items.unshift(item);
      return;
    }
    const at = previousId === undefined ? -1 : this.items.findIndex((i) => i.id === previousId);
    if (at < 0) this.items.push(item);
    else this.items.splice(at + 1, 0, item);
  }

  remove(id: string): void {
    this.items = this.items.filter((i) => i.id !== id);
  }

  /** Ids of message items older than the newest `keep` messages, oldest first. */
  excess(keep: number): string[] {
    const messages = this.items.filter((i) => i.type === "message");
    return messages.slice(0, Math.max(0, messages.length - keep)).map((i) => i.id);
  }

  ids(): string[] {
    return this.items.map((i) => i.id);
  }

  clear(): void {
    this.items = [];
  }
}
