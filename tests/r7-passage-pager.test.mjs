// The passage pager (server/studio/passage.js; docs/design/round7/learning/PASSAGE.md): every kit passage — 169 today —
// paged for a 360 px phone at 16 px: each page ≤ 280 characters and ≤ 8 lines at the phone's width, a poem cut only between
// its lines, prose only at sentence ends (or a clause / word inside a sentence longer than a page), and the pages, joined with
// what separated them, exactly the kit's text.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { pagePassage, pageAt, PAGE_MAX, renderedLines } from "../server/studio/passage.js";

const KITS = new URL("../data/kits/", import.meta.url);
const passages = readdirSync(KITS).filter((f) => f.endsWith(".json")).flatMap((f) => (JSON.parse(readFileSync(new URL(f, KITS), "utf8")).topics ?? []).flatMap((t) => t.passages ?? []));

test("every kit passage pages within the 360 px budget, exactly the kit's text, poems between lines and prose between sentences", () => {
  assert.ok(passages.length >= 150, `${passages.length} passages`);
  let multi = 0;
  for (const p of passages) {
    const r = pagePassage(p);
    assert.ok(r.pages.length >= 1, p.id);
    if (r.pages.length > 1) multi++;
    for (const pg of r.pages) {
      assert.ok(pg.chars <= PAGE_MAX.chars && pg.lines <= PAGE_MAX.lines, `${p.id} p${pg.n}: ${pg.chars} chars, ${pg.lines} lines`);
      assert.equal(pg.text, p.text.slice(pg.start, pg.end), `${p.id} p${pg.n} is the kit's own slice`);
    }
    // the pages and the whitespace between them are the whole text, in order, nothing else
    let at = 0;
    for (const pg of r.pages) { assert.match(p.text.slice(at, pg.start), /^\s*$/, `${p.id}: only whitespace before p${pg.n}`); at = pg.end; }
    assert.match(p.text.slice(at), /^\s*$/, `${p.id}: nothing after the last page`);
    for (let i = 1; i < r.pages.length; i++) {
      const before = p.text.slice(0, r.pages[i].start), after = p.text.slice(r.pages[i].start);
      if (r.poem) assert.ok(/\n\s*$/.test(before) || renderedLines(p.text.split("\n").find((l) => l.includes(after.split("\n")[0])) ?? "") > PAGE_MAX.lines, `${p.id}: a poem page starts on a new line`);
      else if (!/[.!?।]["'”’)\]]*\s*$/.test(before)) {
        // (mid-sentence only when that sentence alone is longer than a page)
        const s0 = Math.max(0, ...[...before.matchAll(/[.!?।]["'”’)\]]*\s+/g)].map((m) => m.index + m[0].length));
        const e = after.search(/[.!?।]/), sentence = p.text.slice(s0, r.pages[i].start + (e < 0 ? after.length : e + 1));
        assert.ok([...sentence.trim()].length > PAGE_MAX.chars || renderedLines(sentence.trim()) > PAGE_MAX.lines, `${p.id}: p${i + 1} starts inside a sentence that fits a page: "${sentence.slice(0, 80)}"`);
      }
    }
  }
  assert.ok(multi > 20, `${multi} passages need more than one page`);
});

test("pageAt: the page holding a part of the text (the question's), 1 when not found", () => {
  const p = passages.find((x) => pagePassage(x).pages.length >= 3);
  const r = pagePassage(p);
  assert.equal(pageAt(r, r.pages[2].start), 3);
  assert.equal(pageAt(r, -1), 1);
});
