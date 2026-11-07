import * as seam from "/home/user/Taxila/server/studio/seam.js";
const { studioSeam } = seam;
const id = "L-d42b";
seam.subscribe(id, () => {});
const L = seam._lesson(id);
const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
  ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "n", op: "text", startMs: 800, endMs: 1400, at: [270, 320], text: "rectangle 160 m", size: "m" }] };
L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1 });
L.onScreen = "wb-1";
// an item whose key is 160 is now open (the Director's move asks it); the seam has no item context on keepBoardSlot
const kept = studioSeam.keepBoardSlot(id, "Ab is rectangle ka perimeter kitna hoga?");
console.log("kept:", !!kept, kept ? JSON.stringify(kept.artifact.script.ops.map((o) => o.text).filter(Boolean)) : "");
studioSeam.onSafety(id);
console.log("after onSafety:", studioSeam.keepBoardSlot(id, "Ab is rectangle ka perimeter kitna hoga?"));
