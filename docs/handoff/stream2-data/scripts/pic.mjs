const t = await import("/home/user/Taxila/server/studio/tools.js");
const L = "00000000-0000-4000-8000-0000000000aa";
await t.boardShow(L, { kind: "write", lines: ["Aloo"] }, { say: "Aloo ek tuber hai." });
const done = new Promise((res) => {
  const r = t.pictureGet(L, "aloo", { onEvent: (e) => { console.log("EVENT", e.type, JSON.stringify(e.truth ?? e.why).slice(0, 200)); res(); } });
  console.log("NOW", JSON.stringify(r).slice(0, 250));
});
console.log("REFUSE", JSON.stringify(t.pictureGet(L, "meri photo")).slice(0, 200));
await done;
const again = t.pictureGet(L, "Aloo", { onEvent: (e) => console.log("CACHED EVENT", e.type) });
console.log("CACHED", again.job);
await new Promise((r) => setTimeout(r, 50));
process.exit(0);
