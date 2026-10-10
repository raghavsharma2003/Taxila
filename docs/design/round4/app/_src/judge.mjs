// Blind model judging of the three U1 directions (ADVISORY: model judges, not children, not the owner).
// Absolute pass: six separate 360x800@2x screens of one direction per call, with no name on them.
// Absolute pass: each sheet judged alone, n runs per judge family. Ranking pass: the three sheets in a
// shuffled order with neutral letters, n runs per judge. Open answers come before scales (so the scales
// cannot lead them) and binary atomic items sit beside the 1-5 scales (rj-holistic-model-judge-gate).
// NODE_USE_ENV_PROXY=1 node docs/design/round4/app/_src/judge.mjs [n=5]
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { execFileSync } from 'node:child_process';

const APP = path.dirname(path.dirname(url.fileURLToPath(import.meta.url)));
const ROOT = path.resolve(APP, '../../../..');
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8').split('\n').filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).replace(/^"|"$/g, '')]));
const E = env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, ''), K = env.AZURE_OPENAI_API_KEY;
const JUDGES = [env.DEPLOY_BRAIN || 'taxila-brain', env.REFRESH_DEPLOY_KIMI26 || 'taxila-kimi26'];
const N = +(process.argv[2] || 5);
const DIRS = ['kaksha', 'nagar', 'chhaap'];
const SCREENS = ['1-open', '2-intake', '3-lesson-board', '4-game-launch', '5-end', '6-world'];
const OUT = path.join(APP, 'judge'); fs.mkdirSync(OUT, { recursive: true });

// contact sheets (no labels on the image)
for (const d of DIRS) {
  const files = SCREENS.map((s) => path.join(APP, d, 'shots', `${s}__360x800.webp`));
  for (const [i, f] of files.entries()) execFileSync('python3', ['-c', `from PIL import Image;Image.open('${f}').convert('RGB').save('${path.join(OUT, `${d}-${i}.jpg`)}','JPEG',quality=85)`]);
  execFileSync('python3', ['-c', `
import sys
from PIL import Image
fs=sys.argv[2:]; ims=[Image.open(f).convert('RGB').resize((360,800)) for f in fs]
ims=[Image.open(f).convert('RGB').resize((540,1200)) for f in fs]
s=Image.new('RGB',(3*540+40,2*1200+20),(128,128,128))
for i,im in enumerate(ims): s.paste(im,(10+(i%3)*550,5+(i//3)*1210))
s.save(sys.argv[1],'JPEG',quality=86)`, path.join(OUT, `sheet-${d}.jpg`), ...files]);
}
const b64 = (d) => fs.readFileSync(path.join(OUT, `sheet-${d}.jpg`)).toString('base64');

const CONTEXT = `You are reviewing a design prototype for a phone app. The six images are six screens of one app on a phone (360 x 800 CSS px, shown at 2x), in order: home, the teacher asking the child about school, a lesson board, a game launch, the end of a session, and the child's own world/collection. The app is an AI tutor for Indian school students in classes 1-9; the main target here is a 12-year-old in urban India. The teacher shown is an AI character. Judge ONLY what you see.`;
const ABS = `${CONTEXT}
Answer in JSON with exactly these keys, in this order:
"who_for": one sentence: who this app looks like it is made for, and the age you would guess.
"first_impression": one sentence.
"cool_12": 1-5, would a typical 12-year-old in urban India find this cool and want to open it (1 = embarrassing to be seen using, 5 = would show friends).
"premium": 1-5, how premium and well-crafted it looks (1 = cheap template, 5 = top-tier app).
"childish": 1-5, how childish or babyish it looks (1 = not at all, 5 = made for toddlers).
"clarity": 1-5, how clear it is what to do next on each screen.
"india_feel": 1-5, how clearly it feels made for India (not just translated).
"mascot_present": true/false, is there a cartoon mascot.
"kiddie_palette": true/false, is it a primary-colour kids' palette.
"bubbly_font": true/false, are the fonts bubbly or rounded kids' fonts.
"worksheet_feel": true/false, does it look like a school worksheet.
"feels_like_real_game_or_premium_app": true/false.
"teacher_reads_adult_professional": true/false.
"text_hard_to_read": true/false, is any text crowded, tiny or low-contrast.
"reward_economy_visible": true/false, are points, coins, streaks or leaderboards visible.
"biggest_weakness": one sentence.`;
const RANK = (letters) => `${CONTEXT.replace('The images show six screens of one app', 'You will see three alternative designs of the same app, each as one image of six screens')}
The designs are labelled ${letters.join(', ')} in the order shown. Answer in JSON with keys:
"most_cool_12": the letter a typical 12-year-old in urban India would find coolest,
"least_childish": the letter that looks least childish,
"most_premium": the letter that looks most premium,
"ranking_overall": array of the three letters, best first, for this audience,
"why": one sentence.`;

async function call(model, content) {
  const body = { model, messages: [{ role: 'user', content }] };
  if (model === 'taxila-brain') Object.assign(body, { max_completion_tokens: 8000, reasoning_effort: 'medium', response_format: { type: 'json_object' } });
  else Object.assign(body, { max_tokens: 12000, temperature: 0.7 });
  for (let a = 0; a < 6; a++) {
    try {
      const r = await fetch(`${E}/chat/completions`, { method: 'POST', headers: { 'api-key': K, 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(300000) });
      if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 4000 * 2 ** a)); continue; }
      const j = await r.json(); if (!r.ok) throw new Error(JSON.stringify(j).slice(0, 300));
      const txt = j.choices[0].message.content || ''; const m = txt.match(/\{[\s\S]*\}/); if (!m) throw new Error('no json: ' + (j.choices[0].finish_reason) + ' ' + txt.slice(0, 200)); return { answer: JSON.parse(m[0]), usage: j.usage };
    } catch (e) { if (a === 5) return { error: String(e).slice(0, 300) }; await new Promise((s) => setTimeout(s, 3000 * 2 ** a)); }
  }
}
const img = (d) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64(d)}`, detail: 'high' } });
const shots = (d) => SCREENS.map((_, i) => ({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${fs.readFileSync(path.join(OUT, `${d}-${i}.jpg`)).toString('base64')}`, detail: 'high' } }));
const jobs = [];
for (const model of JUDGES) for (const d of DIRS) for (let rep = 0; rep < N; rep++) jobs.push({ kind: 'abs', model, d, rep });
for (const model of JUDGES) for (let rep = 0; rep < N; rep++) jobs.push({ kind: 'rank', model, rep });
const results = [];
async function run(job) {
  if (job.kind === 'abs') { const r = await call(job.model, [{ type: 'text', text: ABS }, ...shots(job.d)]); results.push({ ...job, ...r }); }
  else { const order = [...DIRS].sort(() => Math.random() - 0.5); const letters = ['P', 'Q', 'R'];
    const content = [{ type: 'text', text: RANK(letters) }]; order.forEach((d, i) => { content.push({ type: 'text', text: `Design ${letters[i]}:` }, img(d)); });
    const r = await call(job.model, content); const map = Object.fromEntries(order.map((d, i) => [letters[i], d]));
    if (r.answer) for (const k of ['most_cool_12', 'least_childish', 'most_premium']) r.answer[k + '_dir'] = map[r.answer[k]]; if (r.answer?.ranking_overall) r.answer.ranking_dir = r.answer.ranking_overall.map((l) => map[l]);
    results.push({ ...job, order, ...r }); }
  process.stdout.write('.');
}
const q = [...jobs]; await Promise.all(Array.from({ length: 4 }, async () => { while (q.length) await run(q.shift()); }));
fs.writeFileSync(path.join(OUT, 'raw.json'), JSON.stringify({ date: new Date().toISOString(), judges: JUDGES, n: N, method: 'blind and unlabelled: absolute pass = six separate 360x800@2x screens of one direction per call; ranking pass = three contact sheets (540x1200 per screen) in shuffled order with neutral letters', results }, null, 1));

// summary
const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const rows = [];
for (const model of JUDGES) for (const d of DIRS) {
  const rs = results.filter((r) => r.kind === 'abs' && r.model === model && r.d === d && r.answer).map((r) => r.answer);
  const row = { model, dir: d, n: rs.length };
  for (const k of ['cool_12', 'premium', 'childish', 'clarity', 'india_feel']) { const v = rs.map((a) => +a[k]).filter((x) => !isNaN(x)); row[k] = `${mean(v).toFixed(2)} ± ${sd(v).toFixed(2)}`; row[k + '_m'] = mean(v); }
  for (const k of ['mascot_present', 'kiddie_palette', 'bubbly_font', 'worksheet_feel', 'feels_like_real_game_or_premium_app', 'teacher_reads_adult_professional', 'text_hard_to_read', 'reward_economy_visible']) row[k] = `${rs.filter((a) => a[k] === true || a[k] === 'true').length}/${rs.length}`;
  row.who_for = rs.map((a) => a.who_for); row.weakness = rs.map((a) => a.biggest_weakness);
  rows.push(row);
}
const rank = {}; for (const model of JUDGES) { const rs = results.filter((r) => r.kind === 'rank' && r.model === model && r.answer).map((r) => r.answer);
  rank[model] = { n: rs.length }; for (const k of ['most_cool_12', 'least_childish', 'most_premium']) rank[model][k] = Object.fromEntries(DIRS.map((d) => [d, rs.filter((a) => a[k + '_dir'] === d).length]));
  rank[model].first_overall = Object.fromEntries(DIRS.map((d) => [d, rs.filter((a) => a.ranking_dir?.[0] === d).length])); rank[model].why = rs.map((a) => a.why); }
fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), judges: JUDGES, n_per_cell: N, errors: results.filter((r) => r.error).length, rows, rank }, null, 1));
console.log('\n' + JSON.stringify(rows.map(({ who_for, weakness, ...r }) => r), null, 0));
console.log(JSON.stringify(rank));
