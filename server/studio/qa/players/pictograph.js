// pictograph: each row has exactly value / symbolValue symbols, every symbol one size, rows start at one x, the key
// shows symbolValue, rows identical before the answer; the asked row grades by the host.
import { seamPresent, noHint, doneCalled, wrongThenRight } from "./util.js";

export default {
  seam: ["data-row", "data-symbol", "data-key"],
  targets: "[data-row]",
  async play(c) {
    const p = c.params;
    await c.sleep(800);
    await seamPresent(c, [...p.rows.map((r) => [`[data-row="${r.key}"]`]), ["[data-symbol]", 2], ["[data-key]"]]);
    const counts = await c.page.$$eval("[data-row]", (rows) => rows.map((r) => {
      const syms = [...r.querySelectorAll("[data-symbol]")].map((e) => e.getBoundingClientRect()).filter((b) => b.width > 0 && b.height > 0);
      return { key: r.getAttribute("data-row"), n: syms.length, sizes: syms.map((b) => [b.width, b.height]), x0: syms.length ? Math.min(...syms.map((b) => b.x)) : null };
    }));
    const byKey = Object.fromEntries(counts.map((r) => [r.key, r]));
    const wrongN = p.rows.filter((r) => byKey[r.key]?.n !== r.value / p.symbolValue).map((r) => `${r.key}: ${byKey[r.key]?.n} want ${r.value / p.symbolValue}`);
    c.add("G6.symbol_counts", wrongN.length === 0, wrongN);
    const sizes = counts.flatMap((r) => r.sizes);
    const sizeOk = sizes.length > 0 && sizes.every(([w, h]) => Math.abs(w - sizes[0][0]) <= 1 && Math.abs(h - sizes[0][1]) <= 1);
    const xs = counts.map((r) => r.x0).filter((x) => x != null);
    c.add("G6.symbols_one_size_aligned", sizeOk && xs.length && Math.max(...xs) - Math.min(...xs) <= 2, { sizeOk, x0: xs.map((x) => Math.round(x)) });
    const key = (await c.visible("[data-key]"))[0];
    c.add("G6.key_shows_value", !!key && new RegExp(`(^|\\D)${p.symbolValue}(\\D|$)`).test(key.text), key?.text);
    await noHint(c, "[data-row]", "G8.rows_identical");
    const vs = p.rows.map((r) => r.value), ext = p.question === "most" ? Math.max(...vs) : Math.min(...vs);
    const right = p.rows.find((r) => r.value === ext).key;
    await wrongThenRight(c, { sel: "[data-row]", attr: "data-row", wrong: p.rows.find((r) => r.key !== right).key, right });
    await doneCalled(c);
  },
};
