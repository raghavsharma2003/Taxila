// r12 T-voice test preload: installs a voice-trace bus on globalThis.__taxilaTrace before a test file runs.
//   R12_TRACE=throw  every method throws (a broken recorder must leave the lesson identical)
//   R12_TRACE=tier1  records every event; at exit the run FAILS if any blob was handed over or any event carries audio
//   R12_TRACE=tier2  as tier1 but full() is true (clips allowed), and the exit check only requires they are blobs
const mode = process.env.R12_TRACE || "tier1";
const events = [];
const blobs = [];
const binary = (v) => v instanceof ArrayBuffer || ArrayBuffer.isView(v) || (typeof Blob !== "undefined" && v instanceof Blob);
const hasBinary = (v, depth = 0) => {
  if (binary(v)) return true;
  if (!v || typeof v !== "object" || depth > 4) return false;
  return Object.values(v).some((x) => hasBinary(x, depth + 1));
};
globalThis.__taxilaTrace = mode === "throw"
  ? { emit() { throw new Error("broken recorder"); }, full() { throw new Error("broken recorder"); }, blob() { throw new Error("broken recorder"); } }
  : {
      emit(kind, data, opts) { events.push({ kind, data, tier: opts?.tier ?? 1 }); },
      full() { return mode === "tier2"; },
      blob(kind, blob, data) { blobs.push({ kind, blob, data }); },
    };
process.on("exit", () => {
  if (mode === "throw") return;
  const audioEvents = events.filter((e) => hasBinary(e.data));
  const bad = mode === "tier1" ? blobs.length + audioEvents.length : audioEvents.length;
  const kinds = [...new Set(events.map((e) => e.kind))].sort();
  process.stderr.write(`r12-trace-sink ${mode}: ${events.length} events, ${blobs.length} blobs, kinds ${kinds.join(",")}\n`);
  if (bad) {
    process.stderr.write(`r12-trace-sink VIOLATION: ${blobs.length} blobs, ${audioEvents.length} events with audio in ${mode}\n`);
    process.exitCode = 1;
  }
});
