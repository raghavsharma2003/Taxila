// The typed total (round 8): a cell she writes a count into and the pad that writes it. One implementation, first
// stambh/tally's (read: the answer cell under the row; keep: the table's total column), then aankde/tally sort's under
// the laws ruling of 2026-11-15 ("she types each row's total, with the component stambh/tally read uses"). Pure drawing
// and control specs: the family keeps the state (which cell is picked, what the law said at the check).
//   the cell  a panel (dim while it cannot be written); the picked cell outlined in the focus colour; her number in mono.
//             At a check: a tick when its row is right (pale when the solve came after a retry, so the end screen tells a
//             first-try solve from a later one, no words); a dashed box in the mix-up colour when her number is not the
//             row's; neither when her number is right over a row that is not (the row's own play-out shows what is wrong)
//   the pad   ten digit keys and delete; a digit typed into a full box (two digits, or a lone 0) starts it again, so the
//             keys never look off while the line asks her to change a total (stambh round 2, ruling 5)
import type { ViewApi } from "./stage.ts";
import type { ControlSpec } from "./viewkit.ts";

export interface TotalCell {
  /** the touch target's id */
  id: string;
  /** her number, or null (empty) */
  value: number | null;
  /** the cell can be written now (else drawn dim) */
  open: boolean;
  /** the pad writes here */
  picked: boolean;
  /** her number's size */
  size: number;
  /** after a check (null before, or once something has changed): ok = the row is right (a tick), wrong = her number is
   *  not the row's (the dashed box), pale = the solve came after a retry, k = how far the tick is drawn (0..1) */
  check: { ok: boolean; wrong: boolean; pale: boolean; k: number } | null;
}

/** draw a total cell centred at (cx, cy), cw × ch, and register its touch target */
export function drawTotalCell(api: ViewApi, c: CanvasRenderingContext2D, cx: number, cy: number, cw: number, ch: number, o: TotalCell): void {
  const P = api.P;
  api.target(o.id, cx - cw / 2, cy - ch / 2, cw, ch);
  const box: [number, number][] = [[cx - cw / 2 - 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy - ch / 2 - 3], [cx + cw / 2 + 3, cy + ch / 2 + 3], [cx - cw / 2 - 3, cy + ch / 2 + 3]];
  P.body(c, cx - cw / 2, cy - ch / 2, cw, ch, { role: "panel", r: 10, state: o.open ? "idle" : "dim" });
  if (o.picked) P.stroke(c, box, { role: "focus", width: 3, closed: true });
  if (o.value !== null) P.text(c, String(o.value), cx, cy + 1, { size: o.size, role: "ink", font: "mono", weight: 700 });
  const k = o.check;
  if (!k) return;
  if (k.ok && k.pale) { c.save(); c.globalAlpha *= 0.42; P.tick(c, cx + cw / 2 - 2, cy - ch / 2 - 2, 18, k.k); c.restore(); }
  else if (k.ok) P.tick(c, cx + cw / 2 - 2, cy - ch / 2 - 2, 18, k.k);
  else if (k.wrong) P.stroke(c, box, { role: "look", width: 2.5, dash: [5, 4], closed: true });
}

/** the pad's keys for a cell holding `cur`: `write` gets the cell's new number (null: cleared) */
export function totalPad(cur: number | null, write: (n: number | null) => void): ControlSpec[] {
  const txt = cur === null ? "" : String(cur), full = txt.length >= 2 || txt === "0", out: ControlSpec[] = [];
  for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) out.push({ id: `k${d}`, label: d, kind: "pad", group: "pad", onPress: () => write(Number(full ? d : txt + d)) });
  out.push({ id: "kdel", label: "⌫", aria: "delete", kind: "pad", group: "pad", disabled: !txt, onPress: () => write(txt.length > 1 ? Number(txt.slice(0, -1)) : null) });
  return out;
}
