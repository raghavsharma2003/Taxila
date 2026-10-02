// Reads the fenced ```core block (the only prompt-eligible text) from a character sheet .md.
import fs from "fs";

export function readCore(file) {
  const md = fs.readFileSync(file, "utf8");
  const m = md.match(/```core\n([\s\S]*?)```/);
  if (!m) throw new Error(`no core block in ${file}`);
  const lines = m[1].split("\n").map((l) => l.trimEnd()).filter(Boolean);
  return { header: lines[0], notes: lines.slice(1).map((l) => l.replace(/^- /, "")), text: lines.join("\n") };
}

/** The late cue (H3): a single ≤12-word note from a ```cue block, or "" if the sheet has none. */
export function readCue(file, mode = "") {
  const fence = mode ? `cue-${mode}` : "cue";
  const m = fs.readFileSync(file, "utf8").match(new RegExp("```" + fence + "\\n([\\s\\S]*?)```"));
  return m ? m[1].trim() : "";
}
