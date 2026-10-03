// Tier D mouth strip: jaw (0..1) → one of 5 mouth cells, with hysteresis so a jaw on a boundary never flickers.
/** Jaw → mouth cell with hysteresis (no flicker between neighbouring cells). */
export function mouthCell(jaw: number, prev: number): number {
  const edges = [0.06, 0.2, 0.38, 0.58];
  let cell = 0;
  while (cell < edges.length && jaw > edges[cell]) cell++;
  if (cell === prev) return prev;
  const h = 0.03;
  if (cell > prev && jaw < edges[cell - 1] + h) return prev;
  if (cell < prev && jaw > edges[cell] - h) return prev;
  return cell;
}

