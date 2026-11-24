const m = await import("/home/user/Taxila/server/studio/request.js?" + process.argv[2]);
const board = { ops: [{ op: "rect" }, { op: "text", text: "rectangle" }, { op: "text", text: "50 metre" }, { op: "text", text: "30 metre" }, { op: "text", text: "perimeter = ?" }, { op: "text", text: "4 sides" }] };
const lines = { "D43 d4aa3f0b": "Shabaash, 160 metre. Ab square ki har side 8 metre ho, perimeter batayiye.", "D43 e737d1a4": "Bilkul sahi, 160 metre! Ab ek square lo, har side 8 metre—uska perimeter kitna hoga?", "D42 ff19f258": "Bilkul, Ishaan— aapne chaaron sides jodkar 160 metre nikala. Ab isi rectangle ka perimeter formula se nikaalo?" };
for (const [k, l] of Object.entries(lines)) console.log(process.argv[2], k, "synced:", m.syncedWithLine(board, l));
