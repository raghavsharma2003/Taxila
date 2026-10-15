// r5 QA D17: a phone turned sideways (876 x 393, and a 360-wide phone's 800 x 360) gets the compact two-column Desk. Both
// columns sum to the screen, and the dock (Talk) sits wholly inside it: no inner scroll is needed to reach it.
import { test } from "node:test";
import assert from "node:assert/strict";
import { solveDesk, LANDSCAPE_TRAY_MIN, LANDSCAPE_TRAY_MIN_STRIP } from "../src/child/lesson/deskLayout.ts";

const L_ = (w) => w.left.padTop + w.left.window + w.left.label + w.left.gapA + w.left.caption + w.left.gapB + w.left.pad;
const R_ = (w) => w.right.padTop + w.right.card + w.right.gapA + w.right.tray + w.right.gapB + w.right.strip + w.right.dock + w.right.pad;

test("landscape phone: two compact columns that sum to the screen, the dock inside it, no overflow", () => {
  for (const [width, height] of [[876, 393], [800, 360], [740, 360]]) for (const family of ["older", "young"]) for (const geometry of ["face", "work"]) for (const strip of [0, 56]) {
    // a 360-tall screen with a (temporary) trouble strip over a Work tray cannot fit all three; the Desk then scrolls
    if (strip && height < 390 && geometry === "work") continue;
    const L = solveDesk({ width, height, family, geometry, strip });
    const tag = `${width}x${height} ${family} ${geometry} strip=${strip}`;
    assert.equal(L.kind, "wide", tag);
    assert.ok(!L.overflow, `${tag}: overflow`);
    const W = L.wide;
    assert.equal(W.top + L_(W), height, `${tag}: left column`);
    assert.equal(W.top + R_(W), height, `${tag}: right column`);
    const dockBottom = W.top + W.right.padTop + W.right.card + W.right.gapA + W.right.tray + W.right.gapB + W.right.strip + W.right.dock;
    assert.ok(dockBottom <= height, `${tag}: the dock ends at ${dockBottom} > ${height}`);
    assert.ok(W.right.dock >= 112, `${tag}: dock ${W.right.dock}`);
    if (geometry === "work") assert.ok(W.right.tray >= (strip ? LANDSCAPE_TRAY_MIN_STRIP : LANDSCAPE_TRAY_MIN), `${tag}: tray ${W.right.tray}`);
    assert.ok(W.left.window >= 96, `${tag}: window ${W.left.window}`);
    assert.equal(W.gutter * 2 + W.leftW + W.gap + W.rightW, width, `${tag}: widths`);
  }
});

test("landscape: portrait phones, laptops and a phone with its keyboard up keep their layouts", () => {
  assert.equal(solveDesk({ width: 393, height: 876, family: "young", geometry: "face" }).kind, "phone");
  assert.equal(solveDesk({ width: 1440, height: 900, family: "older", geometry: "work" }).kind, "wide");
  assert.equal(solveDesk({ width: 1440, height: 900, family: "older", geometry: "work" }).wide.top, 56);
  assert.equal(solveDesk({ width: 876, height: 393, family: "older", geometry: "face", keyboard: true }).kind, "phone");
  assert.equal(solveDesk({ width: 520, height: 400, family: "older", geometry: "face" }).kind, "phone"); // too narrow
});
