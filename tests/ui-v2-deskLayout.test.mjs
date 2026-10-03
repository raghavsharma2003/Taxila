// B1-A2 (PRODUCT-DESIGN-V2 §6.3.4): every Desk column sums to 584 / 744 / 720 exactly; minimums held; under font
// scale the tray yields first, then the face, never the card or the dock.
import { test } from "node:test";
import assert from "node:assert/strict";
import { COLUMNS, FACE_MIN, KEYBOARD, TRAY_MIN, solveDesk } from "../src/child/lesson/deskLayout.ts";

const sumP = (z) => z.top + z.teacher + z.caption + z.card + z.tray + z.strip + z.dock + z.pad;
const pairSum = (c, i) => Object.values(c).reduce((n, p) => n + p[i], 0);

// Data sanity only (the table is copied from the spec; it cannot fail on the shipped behaviour): the tests after it
// exercise the SOLVER's output under content and font-scale pressure.
test("deskLayout: the spec's column table sums to 584 and 744 (data sanity)", () => {
  for (const fam of ["older", "young"]) for (const g of ["face", "work"]) {
    assert.equal(pairSum(COLUMNS[fam][g], 0), 584, `${fam} ${g} @584`);
    assert.equal(pairSum(COLUMNS[fam][g], 1), 744, `${fam} ${g} @744`);
  }
  assert.equal(Object.values(KEYBOARD).reduce((a, b) => a + b, 0), 324);
});

test("deskLayout: solved phone columns sum to the container at 584 · 640 · 680 · 744 · 820, with minimums held", () => {
  for (const h of [584, 640, 680, 744, 820]) for (const family of ["older", "young"]) for (const geometry of ["face", "work"]) for (const strip of [0, 56, 96]) {
    const L = solveDesk({ width: 360, height: h, family, geometry, strip });
    assert.equal(L.kind, "phone");
    assert.equal(sumP(L.phone), h, `${family} ${geometry} h=${h} strip=${strip}`);
    assert.ok(!L.overflow);
    if (geometry === "work") assert.ok(L.phone.tray >= TRAY_MIN[family] || strip > 0, `tray ${L.phone.tray}`);
    // Face: the window holds faceMin; Work: the SpeechRow face is 64-80 (§6.3.4), its row ≥ 56.
    assert.ok(L.phone.teacher >= (geometry === "face" ? FACE_MIN[family] : 56), `face ${L.phone.teacher}`);
    for (const k of Object.keys(L.phone)) assert.ok(L.phone[k] >= 0, k);
  }
  const at584 = solveDesk({ width: 360, height: 584, family: "older", geometry: "face" }).phone;
  assert.deepEqual([at584.top, at584.teacher, at584.caption, at584.card, at584.dock, at584.pad], [48, 232, 56, 120, 120, 8]);
  const y744 = solveDesk({ width: 360, height: 744, family: "young", geometry: "work" }).phone;
  assert.deepEqual([y744.top, y744.teacher, y744.card, y744.tray, y744.dock, y744.pad], [56, 96, 104, 336, 136, 16]);
});

test("deskLayout: 1280 × 720 content (776 viewport incl. top) — left and right columns sum to 664, widths to 1280", () => {
  for (const geometry of ["face", "work"]) {
    const L = solveDesk({ width: 1280, height: 720, family: "older", geometry });
    assert.equal(L.kind, "wide");
    const w = L.wide;
    assert.equal(w.gutter * 2 + w.leftW + w.gap + w.rightW, 1280);
    const l = w.left;
    assert.equal(l.padTop + l.window + l.gapA + l.caption + l.gapB + l.label + l.pad, 664);
    assert.equal(L.total, 720);
    if (geometry === "work") assert.deepEqual([w.right.card, w.right.tray, w.right.dock], [128, 360, 128]);
    else assert.deepEqual([w.right.card, w.right.dock], [240, 144]);
  }
});

test("deskLayout: font scale yields tray → face, never card or dock", () => {
  for (const family of ["older", "young"]) for (const geometry of ["face", "work"]) {
    const base = solveDesk({ width: 360, height: 640, family, geometry }).phone;
    for (const fs of [1.3, 2.0]) {
      const L = solveDesk({ width: 360, height: 640, family, geometry, fontScale: fs });
      const z = L.phone;
      assert.ok(z.card >= Math.round(base.card * fs) - 1, "card never yields");
      assert.ok(z.dock >= base.dock, "dock never yields");
      if (!L.overflow) assert.equal(sumP(z), 640);
      if (geometry === "work" && z.tray > 0 && z.teacher < base.teacher) assert.ok(z.tray <= TRAY_MIN[family], "the tray yields before the face");
    }
  }
});

test("deskLayout: the negative control — a percentage split would not sum (sanity of the check)", () => {
  const pct = { top: 48, teacher: Math.round(640 * 0.4), caption: 56, card: 120, tray: 0, strip: 0, dock: 120, pad: 8 };
  assert.notEqual(sumP(pct), 640);
});

test("deskLayout (solver): a card that holds more than its spec height grows to fit; the face yields first, never the dock", () => {
  for (const family of ["older", "young"]) for (const geometry of ["face", "work"]) for (const h of [584, 640, 744]) for (const need of [0, 150, 185, 230]) {
    const base = solveDesk({ width: 360, height: h, family, geometry }).phone;
    const L = solveDesk({ width: 360, height: h, family, geometry, cardNeed: need });
    const z = L.phone;
    assert.ok(z.card >= need, `${family} ${geometry} h=${h}: card ${z.card} holds ${need}`);
    assert.ok(z.card >= base.card, "never smaller than the spec row");
    assert.equal(z.dock, base.dock, "the dock never yields to the card");
    if (!L.overflow) assert.equal(sumP(z), h, "still sums to the container");
    if (geometry === "work" && !L.overflow) assert.ok(z.tray >= TRAY_MIN[family] || z.teacher <= FACE_MIN[family] + 8, "the tray floor holds before the face yields");
    if (geometry === "face" && need > base.card && z.teacher < base.teacher) assert.equal(z.caption, base.caption, "Face: the face yields before the caption");
  }
});

test("deskLayout (solver): a strip whose measured content is taller than the estimate gets its height; nothing clips", () => {
  for (const family of ["older", "young"]) for (const geometry of ["face", "work"]) {
    const L = solveDesk({ width: 360, height: 640, family, geometry, strip: 56, stripNeed: 112 });
    assert.equal(L.phone.strip, 112);
    if (!L.overflow) assert.equal(sumP(L.phone), 640);
    assert.equal(solveDesk({ width: 360, height: 640, family, geometry, strip: 0, stripNeed: 112 }).phone.strip, 0, "no strip, no zone");
  }
});

test("deskLayout (solver): font scale 2.0 + a big card on a 584 phone → overflow (the Desk scrolls), never a clipped card", () => {
  const L = solveDesk({ width: 360, height: 584, family: "young", geometry: "work", fontScale: 2, cardNeed: 260 });
  assert.ok(L.phone.card >= 260);
  assert.ok(L.overflow || sumP(L.phone) === 584);
  // wide: the card zone grows to its content too
  const W = solveDesk({ width: 1280, height: 800, family: "older", geometry: "work", cardNeed: 200 });
  assert.equal(W.wide.right.card, 200);
});
