#!/usr/bin/env node
// Validate the Taxila curriculum seed.
//
//   node data/curriculum/validate.mjs           — errors fail (exit 1); warnings are printed only
//   node data/curriculum/validate.mjs --quiet   — print the summary and errors, no warnings
//
// Errors: JSON that does not parse, required schema fields missing or of the wrong type,
// malformed or duplicate ids, index.json disagreeing with the files on disk.
// Warnings (do not fail): prerequisites that do not resolve, prerequisites that point to a
// later class, prerequisite cycles, and depth gaps (maths/science/evs chapters outside 2-5
// topics, topics with no misconception or hook).
import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const DIR = dirname(fileURLToPath(import.meta.url));
const QUIET = process.argv.includes('--quiet');
const SUBJECTS = new Set(['maths', 'science', 'evs', 'english', 'sst', 'hindi']);
const DEEP = new Set(['maths', 'science', 'evs']);
const BOARD_IDS = new Set(['cbse', 'ncert', 'rbse', 'icse', 'other-state']);

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const isStr = (v) => typeof v === 'string' && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.every(isStr);

function load(file) {
  try {
    return JSON.parse(readFileSync(join(DIR, file), 'utf8'));
  } catch (e) {
    err(`${file}: does not parse as JSON (${e.message})`);
    return null;
  }
}

const jsonFiles = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
const curFiles = jsonFiles.filter((f) => /^c\d+-[a-z]+\.json$/.test(f));

// ---- boards.json
const boards = load('boards.json');
if (boards) {
  if (!Array.isArray(boards.boards) || !boards.boards.length) err('boards.json: "boards" must be a non-empty array');
  const seen = new Set();
  for (const b of boards.boards || []) {
    const where = `boards.json[${b.id}]`;
    if (!BOARD_IDS.has(b.id)) err(`${where}: id must be one of ${[...BOARD_IDS].join(', ')}`);
    if (seen.has(b.id)) err(`${where}: duplicate board id`);
    seen.add(b.id);
    if (!isStr(b.name)) err(`${where}: missing name`);
    const u = b.usesNcertBooks;
    if (!u || typeof u !== 'object') { err(`${where}: missing usesNcertBooks`); continue; }
    if (!Array.isArray(u.classes) || !u.classes.every((c) => Number.isInteger(c) && c >= 1 && c <= 12)) err(`${where}: usesNcertBooks.classes must be an array of class numbers 1-12`);
    if (!isStr(u.note)) err(`${where}: usesNcertBooks.note missing`);
  }
}

// ---- curriculum files
const topicIds = new Map(); // id -> { cls, file }
const allIds = new Set();
const prereqEdges = []; // [fromTopicId, toId, fromClass, file]
const stats = [];

for (const file of curFiles) {
  const d = load(file);
  if (!d) continue;
  const where = file;
  const [, clsStr, subj] = file.match(/^c(\d+)-([a-z]+)\.json$/);
  if (d.class !== +clsStr) err(`${where}: "class" (${d.class}) does not match file name`);
  if (d.subject !== subj) err(`${where}: "subject" (${d.subject}) does not match file name`);
  if (!SUBJECTS.has(d.subject)) err(`${where}: unknown subject "${d.subject}"`);
  if (!Number.isInteger(d.class) || d.class < 1 || d.class > 12) err(`${where}: class must be an integer 1-12`);
  for (const k of ['book', 'edition', 'sourceUrl']) if (!isStr(d[k])) err(`${where}: missing "${k}"`);
  if (isStr(d.sourceUrl) && !/^https:\/\//.test(d.sourceUrl)) err(`${where}: sourceUrl must be https`);
  if (typeof d.verified !== 'boolean') err(`${where}: "verified" must be boolean`);
  if (d.verified === false && !isStr(d.note)) warn(`${where}: verified=false but no note explaining why`);
  if (!Array.isArray(d.chapters) || !d.chapters.length) { err(`${where}: "chapters" must be a non-empty array`); continue; }

  let topics = 0;
  d.chapters.forEach((ch, i) => {
    const cw = `${where} ch#${i + 1}`;
    const expectId = `c${d.class}-${d.subject}-ch${String(i + 1).padStart(2, '0')}`;
    if (ch.id !== expectId) err(`${cw}: id "${ch.id}" should be "${expectId}"`);
    if (ch.number !== i + 1) err(`${cw}: number ${ch.number} should be ${i + 1} (sequential)`);
    if (!isStr(ch.title)) err(`${cw}: missing title`);
    if (allIds.has(ch.id)) err(`${cw}: duplicate id ${ch.id}`);
    allIds.add(ch.id);
    if (!Array.isArray(ch.topics) || !ch.topics.length) { err(`${cw}: "topics" must be a non-empty array`); return; }
    if (DEEP.has(d.subject) && (ch.topics.length < 2 || ch.topics.length > 5)) warn(`${cw} (${ch.title}): ${ch.topics.length} topics; expected 2-5 for ${d.subject}`);
    ch.topics.forEach((t, j) => {
      const tw = `${cw} topic#${j + 1}`;
      const expectT = `${ch.id}-t${String(j + 1).padStart(2, '0')}`;
      if (t.id !== expectT) err(`${tw}: id "${t.id}" should be "${expectT}"`);
      if (allIds.has(t.id)) err(`${tw}: duplicate id ${t.id}`);
      allIds.add(t.id);
      topicIds.set(t.id, { cls: d.class, file });
      if (!isStr(t.title)) err(`${tw}: missing title`);
      if (!isStrArr(t.outcomes) || !t.outcomes.length) err(`${tw}: outcomes must be a non-empty array of strings`);
      else for (const o of t.outcomes) if (!/^Learner can /.test(o)) warn(`${tw}: outcome not in "Learner can ..." form: ${o.slice(0, 60)}`);
      for (const k of ['prerequisites', 'misconceptions', 'hooks']) if (!isStrArr(t[k])) err(`${tw}: "${k}" must be an array of strings`);
      if (DEEP.has(d.subject)) {
        if (!t.misconceptions?.length) warn(`${tw}: no misconceptions`);
        if (!t.hooks?.length) warn(`${tw}: no hooks`);
      }
      for (const p of t.prerequisites || []) prereqEdges.push([t.id, p, d.class, file]);
      topics += 1;
    });
  });
  stats.push({ file, cls: d.class, subject: d.subject, chapters: d.chapters.length, topics, verified: d.verified });
}

// ---- prerequisites (warn only)
const adj = new Map();
for (const [from, to, cls] of prereqEdges) {
  if (from === to) { warn(`${from}: lists itself as a prerequisite`); continue; }
  const target = topicIds.get(to);
  if (!target) { warn(`${from}: prerequisite "${to}" does not resolve to a topic id`); continue; }
  if (target.cls > cls) warn(`${from}: prerequisite ${to} is from a later class (${target.cls} > ${cls})`);
  if (!adj.has(from)) adj.set(from, []);
  adj.get(from).push(to);
}
// cycle detection (iterative DFS, colours: 0 new, 1 on stack, 2 done)
const colour = new Map();
for (const start of adj.keys()) {
  if (colour.get(start)) continue;
  const stack = [[start, 0]];
  colour.set(start, 1);
  while (stack.length) {
    const top = stack[stack.length - 1];
    const next = (adj.get(top[0]) || [])[top[1]++];
    if (next === undefined) { colour.set(top[0], 2); stack.pop(); continue; }
    const c = colour.get(next) || 0;
    if (c === 1) warn(`prerequisite cycle through ${top[0]} -> ${next}`);
    else if (c === 0) { colour.set(next, 1); stack.push([next, 0]); }
  }
}

// ---- index.json agrees with disk
const index = load('index.json');
if (index) {
  const listed = new Map((index.files || []).map((f) => [f.file, f]));
  for (const s of stats) {
    const e = listed.get(s.file);
    if (!e) { err(`index.json: ${s.file} is not listed`); continue; }
    if (e.class !== s.cls || e.subject !== s.subject) err(`index.json: ${s.file} class/subject mismatch`);
    if (e.chapters !== s.chapters) err(`index.json: ${s.file} chapters ${e.chapters} != ${s.chapters} on disk`);
    if (e.topics !== undefined && e.topics !== s.topics) err(`index.json: ${s.file} topics ${e.topics} != ${s.topics} on disk`);
    if (e.verified !== s.verified) err(`index.json: ${s.file} verified flag disagrees with the file`);
    listed.delete(s.file);
  }
  for (const f of listed.keys()) err(`index.json: lists ${f}, which is missing or did not parse`);
}

// ---- report
const totalCh = stats.reduce((a, s) => a + s.chapters, 0);
const totalT = stats.reduce((a, s) => a + s.topics, 0);
console.log(`curriculum seed: ${stats.length} files, ${totalCh} chapters, ${totalT} topics, ${prereqEdges.length} prerequisite links`);
if (!QUIET && warnings.length) {
  console.log(`\n${warnings.length} warning(s):`);
  for (const w of warnings) console.log('  warn  ' + w);
} else if (warnings.length) console.log(`${warnings.length} warning(s) (run without --quiet to list)`);
if (errors.length) {
  console.log(`\n${errors.length} error(s):`);
  for (const e of errors) console.log('  ERROR ' + e);
  process.exit(1);
}
console.log(errors.length ? '' : 'OK: all JSON parses, schema fields present, ids unique.');
