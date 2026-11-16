const seam = await import("/home/user/Taxila/server/studio/seam.js");
const { studioSeam } = seam;
const id = "L-d42b"; seam.subscribe(id, () => {}); const L = seam._lesson(id);
const script = { v: 1, scriptId: "s", line: { lessonId: id }, anchor: "line_audio_start", board: { w: 677, h: 423, ground: "chalk" }, mode: "fresh", durationMs: 2000,
  ops: [{ id: "r", op: "rect", startMs: 0, endMs: 800, at: [120, 100], w: 300, h: 180 }, { id: "a", op: "text", startMs: 800, endMs: 1400, at: [270, 90], text: "side", size: "m" }, { id: "t", op: "text", startMs: 1400, endMs: 2000, at: [270, 320], text: "rectangle", size: "m" }] };
L.pieces.set("wb-1", { intentId: "wb-1", slotId: "slot-1", kind: "whiteboard", state: "revealed", artifact: { kind: "whiteboard", script }, revealedTurn: 1, lines: ["Kabir, rectangle dekhiye: length 50 m aur breadth 30 m. Iske chaar sides mein kaun-se sides same hain—boliye."] });
L.onScreen = "wb-1";
const line = "Kabir, 160 m tab milega jab chaaron sides jodenge: 50 + 30 + 50 + 30. Rectangle ka perimeter 160 m kyun hua?";
console.log("kept:", !!studioSeam.keepBoardSlot(id, line, [], {}));
console.log("kept (no number in last sentence):", !!studioSeam.keepBoardSlot(id, "Kabir, 160 m tab milega jab chaaron sides jodenge. Rectangle ka perimeter aisa kyun hua?", [], {}));
console.log("D43 new problem (must drop):", !!studioSeam.keepBoardSlot(id, "Bilkul, aapne 160 metre nikala. Ab square ki har side 8 metre ho, perimeter batayiye?", [], {}));
console.log("new problem across sentences (must drop):", !!studioSeam.keepBoardSlot(id, "Ab square ki har side 8 metre hai. Iska perimeter 8 + 8 + 8 + 8 kitna hoga?", [], {}));
console.log("withheld 160 (must drop):", !!studioSeam.keepBoardSlot(id, line, ["160"], {}));
