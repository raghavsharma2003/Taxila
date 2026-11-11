// The game-generator speed bars (p95 ≤ 50 ms) time the generator's own CPU, not the wall clock. CI runs four test files at
// once on a shared runner, and a wall-clock p95 there measured the scheduler: kram/grow/next read 69.6 ms on CI (PR #78)
// against 5.7 ms on an idle box. process.cpuUsage counts only the time the process actually ran.
export const cpuNow = () => { const u = process.cpuUsage(); return (u.user + u.system) / 1000; };
