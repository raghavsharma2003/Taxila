// worker.js — OffscreenCanvas arm. Lip values arrive on a MessagePort straight from the AudioWorklet (no main-thread hop)
// or relayed via the main thread, depending on the test.
import { start } from "./render.js";
let lip = 0; const gaps = []; let lastArr = 0;
self.onmessage = async (e) => {
  const { canvas, opts, port } = e.data;
  if (port) port.onmessage = (m) => { const n = performance.now(); if (lastArr) gaps.push(n - lastArr); lastArr = n; lip = m.data; };
  const r = await start(canvas, { ...opts, getLip: port ? () => lip : null });
  self.postMessage({ ...r, lipGaps: gaps });
};
