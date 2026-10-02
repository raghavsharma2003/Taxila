// atom-builder@1 — reference pure core (gap-fill GAP-1-atom-builder-c9-ch08, 2026-10-02).
// No DOM, no deps. The host, the server and the harness import the same functions (CONTENT-ENGINE §2.1).
// Rules are NCERT Class 9 Exploration ch08 "Journey Inside the Atom" §8.6-8.9 (read 2026-10-02):
//   Bohr-Bury: shell cap 2n^2; outermost shell holds at most 8; fill K, L, M, N stepwise.
//   valency = electrons gained/lost/shared to complete the octet (duplet for He); A = p + n;
//   isotopes = same Z, different N (same electrons, same chemistry).
// Run:  node docs/research/content/atom-builder-grade.mjs   (checks the golden specs, exits 1 on any failure)

export const ZMAX = 20;
export const ELEMENTS = [ // Z, symbol, en, hi, N of the commonest isotope (NCERT Table 8.4 for Z<=18; K-39, Ca-40)
  [1, 'H', 'Hydrogen', 'हाइड्रोजन', 0], [2, 'He', 'Helium', 'हीलियम', 2], [3, 'Li', 'Lithium', 'लीथियम', 4],
  [4, 'Be', 'Beryllium', 'बेरिलियम', 5], [5, 'B', 'Boron', 'बोरॉन', 6], [6, 'C', 'Carbon', 'कार्बन', 6],
  [7, 'N', 'Nitrogen', 'नाइट्रोजन', 7], [8, 'O', 'Oxygen', 'ऑक्सीजन', 8], [9, 'F', 'Fluorine', 'फ्लुओरीन', 10],
  [10, 'Ne', 'Neon', 'निऑन', 10], [11, 'Na', 'Sodium', 'सोडियम', 12], [12, 'Mg', 'Magnesium', 'मैग्नीशियम', 12],
  [13, 'Al', 'Aluminium', 'ऐलुमिनियम', 14], [14, 'Si', 'Silicon', 'सिलिकॉन', 14], [15, 'P', 'Phosphorus', 'फ़ॉस्फ़ोरस', 16],
  [16, 'S', 'Sulphur', 'सल्फ़र', 16], [17, 'Cl', 'Chlorine', 'क्लोरीन', 18], [18, 'Ar', 'Argon', 'आर्गन', 22],
  [19, 'K', 'Potassium', 'पोटैशियम', 20], [20, 'Ca', 'Calcium', 'कैल्शियम', 20],
];
// Isotopes the build/isotope modes accept (naturally occurring or textbook-cited). Anything else -> "partial".
export const ISOTOPES = {
  1: [0, 1, 2], 2: [1, 2], 3: [3, 4], 4: [5], 5: [5, 6], 6: [6, 7, 8], 7: [7, 8], 8: [8, 9, 10], 9: [10], 10: [10, 11, 12],
  11: [12], 12: [12, 13, 14], 13: [14], 14: [14, 15, 16], 15: [16], 16: [16, 17, 18, 20], 17: [18, 20], 18: [18, 20, 22],
  19: [20, 21, 22], 20: [20, 22, 23, 24, 26, 28],
};
// Common valency accept-keys. P also takes 5 (old NCERT Table 4.1 lists 3, 5) [S]; everything else is the octet rule.
const VALENCY_EXTRA = { 15: [5] };

export function config(e) {                       // Bohr-Bury for e <= 20: [K, L, M, N]
  if (!Number.isInteger(e) || e < 0 || e > ZMAX) throw new RangeError('e must be an integer 0..20');
  const k = Math.min(e, 2), l = Math.min(Math.max(e - 2, 0), 8), m = Math.min(Math.max(e - 10, 0), 8), n = Math.max(e - 18, 0);
  return [k, l, m, n];
}
export const outerOf = (sh) => { for (let i = sh.length - 1; i >= 0; i--) if (sh[i] > 0) return sh[i]; return 0; };
export function valency(Z) {                      // octet rule; duplet for He
  const sh = config(Z), o = outerOf(sh), shells = sh.filter((x) => x > 0).length;
  if ((shells === 1 && o === 2) || o === 8) return 0;
  return o <= 4 ? o : 8 - o;
}
export const valencyKeys = (Z) => [valency(Z), ...(VALENCY_EXTRA[Z] || [])];
export const isIsotope = (Z, N) => (ISOTOPES[Z] || []).includes(N);
const CAP = [2, 8, 8, 8];                         // per-shell cap for Z<=20 once "outermost <= 8" is applied

// Diagnosis of a shell distribution against the target electron count. Returns a MiscId or null.
export function shellMisc(sh, e) {
  if (sh[0] > 2 || sh[1] > 8) return 'MC.ATOM.SHELL_OVERFILL';
  if (sh[2] > 8) return e >= 19 ? 'MC.ATOM.OUTER_BEYOND_8' : 'MC.ATOM.SHELL_OVERFILL';
  for (let i = 1; i < 4; i++) if (sh[i] > 0 && sh[i - 1] < CAP[i - 1]) return 'MC.ATOM.SHELL_ANY_ORDER';
  return null;
}

// grade(spec, value) -> { outcome, misc? }. The key comes from spec.params (+ spec.goal), never from the LLM fill.
export function grade(spec, value) {
  const P = spec.params, g = spec.goal || {};
  const v = value.t === 'vars' ? value.vars : {};
  const Z = P.Z, N = P.neutrons ?? ELEMENTS[Z - 1][4], E = P.electrons ?? Z;
  const ok = (b, misc) => (b ? { outcome: 'correct' } : misc ? { outcome: 'misc', misc } : { outcome: 'incorrect' });
  switch (P.mode) {
    case 'build': {                                // construct: place p, n, e to make the target atom/ion
      if ((v.e_nuc ?? 0) > 0) return { outcome: 'misc', misc: 'MC.ATOM.ELECTRONS_IN_NUCLEUS' };
      if (v.p === Z && v.n === N && v.e === E) return { outcome: 'correct' };
      if (v.p === Z && v.e === E && v.n !== N) return { outcome: 'partial' };          // right element, other isotope
      return { outcome: 'incorrect' };
    }
    case 'read': {                                 // diagnose: read Z and A off a drawn atom
      const zc = v.z_claim, ac = v.a_claim;
      if (zc === Z && ac === Z + N) return { outcome: 'correct' };
      if (ac === Z + E && E !== N) return { outcome: 'misc', misc: 'MC.ATOM.MASS_EQ_ELECTRONS' };
      if (ac === Z + N + E && E > 0) return { outcome: 'misc', misc: 'MC.ATOM.MASS_COUNTS_ALL' };
      if (zc === N && N !== Z) return { outcome: 'misc', misc: 'MC.ATOM.Z_FROM_NEUTRONS' };
      return { outcome: zc === Z || ac === Z + N ? 'partial' : 'incorrect' };
    }
    case 'shells': {                               // construct: distribute E electrons; optional valency claim
      const sh = [v.sh_k ?? 0, v.sh_l ?? 0, v.sh_m ?? 0, v.sh_n ?? 0], key = config(E);
      if ((v.e_nuc ?? 0) > 0) return { outcome: 'misc', misc: 'MC.ATOM.ELECTRONS_IN_NUCLEUS' };
      const total = sh.reduce((a, b) => a + b, 0);
      const shellOk = sh.every((x, i) => x === key[i]);
      if (!shellOk) { const m = total === E ? shellMisc(sh, E) : null; return ok(false, m); }
      if (g.askValency) {
        const vc = v.val_claim, o = outerOf(key);
        if (valencyKeys(Z).includes(vc)) return { outcome: 'correct' };
        if (vc === o && o > 4) return { outcome: 'misc', misc: 'MC.ATOM.VALENCY_EQ_OUTER' };
        return { outcome: 'partial' };             // shells right, valency wrong
      }
      return { outcome: 'correct' };
    }
    case 'isotope': {                              // construct: make an isotope of (Z, N); or classify a pair
      if (value.t === 'choice') {                  // "same element?" / "same chemistry?" on a pair g.pair = [[Z1,N1],[Z2,N2]]
        const [[z1], [z2]] = g.pair, same = z1 === z2;
        const want = same ? 'same' : 'different';
        if (value.id === want) return { outcome: 'correct' };
        if (same && g.ask === 'element') return { outcome: 'misc', misc: 'MC.ATOM.ISOTOPE_DIFF_ELEMENT' };
        if (same && g.ask === 'chemistry') return { outcome: 'misc', misc: 'MC.ATOM.ISOTOPE_DIFF_CHEM' };
        return { outcome: 'incorrect' };
      }
      if (v.p !== Z) return { outcome: 'misc', misc: 'MC.ATOM.ISOTOPE_DIFF_ELEMENT' };   // changed protons to "make an isotope"
      if (v.n === N) return { outcome: 'incorrect' };                                      // same atom, not an isotope
      if (v.e !== Z) return { outcome: 'partial' };                                        // made an ion as well
      return { outcome: isIsotope(Z, v.n) ? 'correct' : 'partial' };                        // unknown nucleus -> partial, teacher says so
    }
    case 'models-timeline': {
      if (g.sub === 'order') {                     // sequence: kanada < dalton < thomson < rutherford < bohr
        const key = g.order; return ok(value.t === 'order' && value.ids.join() === key.join());
      }
      if (g.sub === 'claim') {                     // classify a claim card true/false
        const truth = g.truth, said = value.id === 'true';
        if (said === truth) return { outcome: 'correct' };
        return ok(false, g.misc);                  // the claim card names the misc it diagnoses (kit-authored)
      }
      if (g.sub === 'scatter') {                   // POE: predict the volley before firing
        const key = P.model === 'thomson' ? 'all_through' : 'most_through_few_back';
        if (value.id === key) return { outcome: 'correct' };
        if (P.model === 'rutherford' && value.id === 'most_deflect') return { outcome: 'misc', misc: 'MC.ATOM.NUCLEUS_LARGE' };
        return { outcome: 'incorrect' };
      }
      return { outcome: 'incorrect' };
    }
  }
  return { outcome: 'incorrect' };
}

// Rutherford scattering, schematic and deterministic (golden-tested): tan(theta/2) = d / (2b).
// d = head-on closest-approach distance in nucleus radii; b = impact parameter in nucleus radii.
export function scatterAngle(model, b, d = 1) {
  if (model === 'thomson') return 0.5 * Math.exp(-Math.abs(b) / 1e4);   // degrees: spread-out charge, never > 0.5°
  if (model === 'bohr' || model === 'rutherford') return (2 * Math.atan(d / (2 * Math.max(Math.abs(b), 1e-6))) * 180) / Math.PI;
  throw new RangeError('model');
}

// lint(spec): the slot sanity rules. Discriminability is the point: a probe whose wrong-path answer
// equals the right one cannot diagnose (e.g. MASS_EQ_ELECTRONS is invisible on C-12 because n = e = 6).
export function lint(spec) {
  const P = spec.params, g = spec.goal || {}, out = [];
  if (!Number.isInteger(P.Z) || P.Z < 1 || P.Z > ZMAX) out.push('Z out of 1..20');
  const N = P.neutrons ?? ELEMENTS[(P.Z || 1) - 1][4], E = P.electrons ?? P.Z;
  if (P.mode === 'read' && N === E) out.push('read: n == e, MASS_EQ_ELECTRONS undetectable; pick N != Z');
  if (P.mode === 'read' && N === P.Z) out.push('read: n == p, Z_FROM_NEUTRONS undetectable');
  if (P.mode === 'shells' && g.askValency && outerOf(config(E)) <= 4 && g.target === 'MC.ATOM.VALENCY_EQ_OUTER')
    out.push('shells: valency probe aimed at VALENCY_EQ_OUTER needs outer shell 5..7');
  if (P.mode === 'shells' && E !== P.Z && !g.ionsAllowed) out.push('shells: ions are off in v1 (E must equal Z)');
  if (P.mode === 'isotope' && !g.pair && !isIsotope(P.Z, N)) out.push('isotope: start atom is not a known isotope');
  if (P.model && P.mode !== 'models-timeline' && P.model !== 'bohr') out.push('model must be bohr outside models-timeline');
  if (Math.abs(P.Z - E) > 3) out.push('charge |Z-E| > 3 not in syllabus');
  return out;
}

// ---- golden check -------------------------------------------------------------------------------
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const here = fileURLToPath(new URL('.', import.meta.url));
  const G = JSON.parse(readFileSync(here + 'atom-builder-goldens.json', 'utf8'));
  let fail = 0;
  // invariant 1: config sums and caps; invariant 2: valency table; invariant 3: scattering monotone, Thomson tiny
  for (let z = 1; z <= ZMAX; z++) { const c = config(z); if (c.reduce((a, b) => a + b) !== z || shellMisc(c, z)) { fail++; console.log('config', z, c); } }
  const VAL = [1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2, 3, 4, 3, 2, 1, 0, 1, 2];
  for (let z = 1; z <= ZMAX; z++) if (valency(z) !== VAL[z - 1]) { fail++; console.log('valency', z, valency(z)); }
  for (let b = 0.1; b < 50; b *= 1.5) if (scatterAngle('rutherford', b) < scatterAngle('rutherford', b * 1.5)) { fail++; console.log('monotone', b); }
  for (let b = 0; b < 1e5; b += 997) if (scatterAngle('thomson', b) > 5) { fail++; console.log('thomson', b); }
  for (const s of G.specs) {
    const issues = lint(s.spec), want = s.expect;
    if ((want.lint || []).length !== issues.length) { fail++; console.log('LINT', s.id, issues); continue; }
    for (const c of s.cases || []) {
      const r = grade(s.spec, c.value);
      if (r.outcome !== c.outcome || (r.misc || null) !== (c.misc || null)) { fail++; console.log('GRADE', s.id, c, r); }
    }
  }
  const nCases = G.specs.reduce((a, s) => a + (s.cases || []).length, 0);
  console.log(JSON.stringify({ specs: G.specs.length, cases: nCases, fail, date: new Date().toISOString().slice(0, 10) }));
  process.exit(fail ? 1 : 0);
}
