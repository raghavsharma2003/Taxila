// compact view of a driver answer on stdin
let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
  let j; try { j = JSON.parse(s); } catch { console.log(s.slice(0, 2000)); return; }
  if (j.error) { console.log("ERROR", j.error.slice(0, 400)); }
  const d = j.dom ?? {};
  const out = [];
  if (j.op) out.push(`[${j.op}] "${j.text}" tapped=${j.tapped} done=${j.doneTapped} got=${j.got}`);
  if (j.tl) out.push("tl " + JSON.stringify(j.tl));
  if (j.last) out.push("SHE: " + (j.last.reply ?? "") + "\n  ask=" + JSON.stringify(j.last.ask) + " kind=" + j.last.askKind + " item=" + j.last.itemId + " tray=" + j.last.trayKind + " slot=" + j.last.slotKind + " move=" + j.last.move + " verdict=" + JSON.stringify(j.last.verdict) + " end=" + j.last.end);
  if (d.url) out.push("url " + d.url + " vw " + d.vw);
  for (const k of ["caption", "question", "status", "phase", "stateWord", "playGoal", "playCaption", "playControls"]) if (d[k]) out.push(`${k}: ${d[k]}`);
  if (d.mic) out.push("mic " + JSON.stringify(d.mic));
  if (d.tray) out.push("tray " + (d.tray.kind ?? d.tray) + " " + (d.trayText ?? d.tray.text ?? "").slice(0, 200) + " " + JSON.stringify(d.tray.box ?? ""));
  if (d.stage) out.push("stage " + JSON.stringify(d.stage));
  if (d.play) out.push("PLAY on");
  if (d.sheet?.length) out.push("sheet " + d.sheet.join(" | "));
  if (d.frames?.length) out.push("frames " + JSON.stringify(d.frames));
  if (d.canvases?.length) out.push("canvases " + JSON.stringify(d.canvases));
  if (d.buttons) out.push("buttons " + d.buttons.map((b) => `${b.t}${b.id ? "#" + b.id : ""}@${b.box.join(",")}${b.fs < 14 ? " fs" + b.fs : ""}${b.dis ? " (dis)" : ""}`).join(" ; "));
  if (d.minFs !== undefined) out.push(`minFs ${d.minFs} "${d.minWhat}" overflowX ${d.overflowX} offscreen ${JSON.stringify(d.offscreen)} tapToHear ${d.tapToHear}`);
  if (!d.caption && d.bodyText && !j.op) out.push("body: " + d.bodyText.slice(0, 400));
  if (j.errors?.length) out.push("pageerrors " + JSON.stringify(j.errors));
  if (Array.isArray(j)) out.push(JSON.stringify(j, null, 1).slice(0, 3000));
  console.log(out.join("\n"));
});
