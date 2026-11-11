import fs from 'node:fs';
const A = await import('/home/user/Taxila/server/director/safety.js');
const B = await import(process.env.TREE + '/server/director/safety.js');
const f = (d) => d.distress ? `FIRE ${d.kind} ${d.via}` : 'quiet';
for (const l of fs.readFileSync(process.argv[2], 'utf8').split('\n').filter(Boolean)) {
  const a = f(A.scanSafetyDetail(l)), b = f(B.scanSafetyDetail(l));
  console.log(`${a === b ? '  ' : '≠ '}${a.padEnd(34)} → ${b.padEnd(42)} | ${l}`);
}
