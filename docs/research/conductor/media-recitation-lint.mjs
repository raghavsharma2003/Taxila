// Recitation-safety lint for chant / jingle kits (content-orchestration.md §8.4, gap-fill G2-content-orchestration-media).
// Pure functions, no I/O, no model calls. Run `node media-recitation-lint.mjs` for the golden cases (exit 1 on a miss).
//
// L1 fact-token lint   : every content token of every lyric line equals the kit's verbatim tokens, IN ORDER; the only
//                        other words allowed are fillers from a closed per-band lexicon (luna may arrange, never author).
// L2 copyright lint    : no n-gram (n = 6 tokens) of the lyric appears in the blocked corpus (ncert-pending poems,
//                        curated film/children's song first lines). Coverage of that corpus is [U]: this is a floor.
// L3 melody lint       : a tune is a code template from the reviewed library; its interval contour may not share an
//                        8-interval window with a blocked incipit (Parsons code + exact semitone steps).
// L4 prompt lint       : no lyric or line text may appear in a compile() lane payload (the teacher would recite it);
//                        the brief carries kitId + mode only. Checked by scanning the compiled lane for any 3-token run of the joined lyric.
// L5 register lint     : B3/B4 kits may not use the B1/B2 nursery filler set (no "babyish" register: kids-ux-ages).

const norm = (s) => s.normalize('NFC').toLowerCase().replace(/[।॥.,!?;:"'()\-–—]/g, ' ').split(/\s+/).filter(Boolean);

export const FILLERS = {
  B1: ['चलो', 'आओ', 'ताली', 'हाँ', 'जी', 'clap', 'yay', 'हे', 'ओ'],
  B2: ['चलो', 'ताली', 'हाँ', 'जी', 'clap', 'हे'],
  B3: ['yo', 'हाँ', 'चलो'],
  B4: ['yo', 'हाँ'],
};
const NURSERY = new Set(['आओ', 'ताली', 'yay', 'ओ', 'जी']);

// kitLines: Array<Array<string[]>>  — per line, per token, the accepted spellings (regional variants: songs §7.3)
export function lintFactTokens(kitLines, lyricLines, band) {
  const errs = [];
  const fill = new Set(FILLERS[band] ?? []);
  if (lyricLines.length !== kitLines.length) errs.push({ code: 'L1.line_count', want: kitLines.length, got: lyricLines.length });
  lyricLines.forEach((line, li) => {
    const want = kitLines[li] ?? [];
    let wi = 0;
    for (const tok of norm(line)) {
      if (wi < want.length && want[wi].map((v) => v.normalize('NFC').toLowerCase()).includes(tok)) { wi++; continue; }
      if (fill.has(tok)) continue;
      errs.push({ code: 'L1.foreign_token', line: li, token: tok, expected: want[wi]?.[0] ?? '(end)' });
    }
    if (wi < want.length) errs.push({ code: 'L1.missing_tokens', line: li, from: want[wi][0] });
  });
  return errs;
}

export function lintCopyright(lyricLines, blockedCorpus, n = 6) {
  const grams = (toks) => { const g = new Set(); for (let i = 0; i + n <= toks.length; i++) g.add(toks.slice(i, i + n).join(' ')); return g; };
  const lyric = grams(norm(lyricLines.join(' ')));
  const errs = [];
  blockedCorpus.forEach((text, bi) => { for (const g of grams(norm(text))) if (lyric.has(g)) { errs.push({ code: 'L2.ngram', blocked: bi, gram: g }); break; } });
  return errs;
}

// notes: MIDI numbers. A blocked incipit is matched on exact semitone intervals over any window of `w` intervals.
export function lintMelody(notes, blockedIncipits, w = 8) {
  const iv = (ns) => ns.slice(1).map((x, i) => x - ns[i]);
  const mine = iv(notes).join(',');
  const errs = [];
  blockedIncipits.forEach((inc, bi) => {
    const b = iv(inc);
    for (let i = 0; i + w <= b.length; i++) if ((',' + mine + ',').includes(',' + b.slice(i, i + w).join(',') + ',')) { errs.push({ code: 'L3.contour', blocked: bi, at: i }); break; }
  });
  return errs;
}

// Run over the JOINED lyric stream, n = 3: a per-line 4-gram check misses chant lines, which are often 3 tokens
// ("दो दूनी चार"): the first version of this lint passed a lane that recited two table lines (golden case 9).
export function lintPrompt(compiledLaneText, lyricLines, run = 3) {
  const lane = ' ' + norm(compiledLaneText).join(' ') + ' ';
  const t = norm(lyricLines.join(' '));
  for (let i = 0; i + run <= t.length; i++) {
    const g = t.slice(i, i + run).join(' ');
    if (lane.includes(' ' + g + ' ')) return [{ code: 'L4.lyric_in_prompt', run: g }];
  }
  return [];
}

export function lintRegister(lyricLines, band) {
  if (band !== 'B3' && band !== 'B4') return [];
  return norm(lyricLines.join(' ')).filter((t) => NURSERY.has(t)).map((t) => ({ code: 'L5.nursery_register', token: t }));
}

export function lintKit({ kitLines, lyricLines, band, blockedCorpus = [], notes = null, blockedIncipits = [], compiledLaneText = '' }) {
  return [...lintFactTokens(kitLines, lyricLines, band), ...lintCopyright(lyricLines, blockedCorpus),
          ...(notes ? lintMelody(notes, blockedIncipits) : []), ...lintPrompt(compiledLaneText, lyricLines), ...lintRegister(lyricLines, band)];
}

// ───────────────────────────── golden cases ─────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const T = (s) => s.split(' ').map((w) => [w]);
  const pahada = [T('दो एकम दो'), T('दो दूनी चार'), [['दो'], ['तिया', 'तीए'], ['छह', 'छः']], T('दो सत्ते चौदह')];
  const blocked = ['यह एक ब्लॉक की गई कविता की पहली पंक्ति है जो कॉपीराइट में है'];          // test-only stand-in
  const twinkle = [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60];               // PD tune (allowed template)
  const blockedInc = [[64, 62, 60, 62, 64, 64, 64, 62, 62, 62, 64, 67, 67]];             // test-only stand-in incipit
  const cases = [
    ['verbatim pahada passes', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह'], band: 'B2' }, []],
    ['closed-lexicon fillers pass', { kitLines: pahada, lyricLines: ['चलो दो एकम दो', 'दो दूनी चार हाँ', 'दो तीए छः', 'दो सत्ते चौदह ताली'], band: 'B2' }, []],
    ['a wrong fact token fails (चौदा for चौदह)', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदा'], band: 'B2' }, ['L1.foreign_token', 'L1.missing_tokens']],
    ['an authored content word fails', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह मज़ेदार'], band: 'B2' }, ['L1.foreign_token']],
    ['a dropped line fails', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह'], band: 'B2' }, ['L1.line_count']],
    ['blocked 6-gram fails', { kitLines: [T('यह एक ब्लॉक की गई कविता')], lyricLines: ['यह एक ब्लॉक की गई कविता'], band: 'B3', blockedCorpus: blocked }, ['L2.ngram']],
    ['PD template tune passes', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह'], band: 'B2', notes: twinkle, blockedIncipits: blockedInc }, []],
    ['a tune quoting a blocked incipit fails', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह'], band: 'B2', notes: [55, ...blockedInc[0], 50], blockedIncipits: blockedInc }, ['L3.contour']],
    ['lyric text inside a compile() lane fails', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह'], band: 'B2', compiledLaneText: 'MOVE chant_handoff kit=pahada-hi-2 … say: दो दूनी चार दो तिया …' }, ['L4.lyric_in_prompt']],
    ['a lane carrying only kitId + mode passes', { kitLines: pahada, lyricLines: ['दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह'], band: 'B2', compiledLaneText: 'MOVE chant_handoff kit=pahada-hi-2 mode=echo; frame as a classroom recording; react to the slot summary after' }, []],
    ['nursery fillers in a B4 kit fail', { kitLines: pahada, lyricLines: ['आओ दो एकम दो', 'दो दूनी चार', 'दो तिया छह', 'दो सत्ते चौदह'], band: 'B4' }, ['L1.foreign_token', 'L5.nursery_register']],
  ];
  let bad = 0;
  for (const [name, input, want] of cases) {
    const got = [...new Set(lintKit(input).map((e) => e.code))].sort();
    const ok = JSON.stringify(got) === JSON.stringify([...want].sort());
    if (!ok) bad++;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name} :: ${got.join(',') || 'clean'}`);
  }
  console.log(`${cases.length - bad}/${cases.length} golden cases as expected`);
  process.exit(bad ? 1 : 0);
}
