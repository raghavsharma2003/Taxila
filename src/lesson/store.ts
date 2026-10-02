// Tiny observables for the lesson runtime. No framework dependency: React reads Store through
// useSyncExternalStore (src/lesson/useLesson.ts), tests read it directly.

/** Holds one immutable state object; every set() replaces it and notifies subscribers. */
export class Store<S extends object> {
  private state: S;
  private listeners = new Set<() => void>();

  constructor(initial: S) {
    this.state = initial;
  }

  get = (): S => this.state;

  set = (patch: Partial<S> | ((s: S) => Partial<S>)): void => {
    const p = typeof patch === "function" ? patch(this.state) : patch;
    this.state = { ...this.state, ...p };
    for (const fn of [...this.listeners]) fn();
  };

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
}

/** A typed event stream with no replay. */
export class Emitter<T> {
  private listeners = new Set<(value: T) => void>();

  on = (fn: (value: T) => void): (() => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  emit(value: T): void {
    for (const fn of [...this.listeners]) fn(value);
  }

  clear(): void {
    this.listeners.clear();
  }
}
