const root = process.env.TREE || '/home/user/Taxila';
const { scanSafetyDetail } = await import(root + '/server/director/safety.js');
const lines = (process.argv[2] ? (await import('node:fs')).readFileSync(process.argv[2],'utf8') : '').split('\n').filter(Boolean);
for (const l of lines) { const d = scanSafetyDetail(l); console.log((d.distress? 'FIRE '+d.kind+' '+d.via : 'quiet').padEnd(36), '|', l); }
