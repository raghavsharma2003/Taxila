/* ============================================================
   boot: the shell, the laptop desk bar (Laptop | Phone), the phone screen menu
   ============================================================ */
window.TX = { Screens: null, go: null };
(function boot() {
  document.body.insertAdjacentHTML("afterbegin", DEFS + `<div id="shell">
    <div id="deskbar"><div class="db-brand">${BRAND}<span>TAXILA</span><small>Prakash · game-native world</small></div>
      <div class="db-tabs">${ORDER.map((s, i) => `<button class="db-tab" data-s="${s}" aria-current="false"><b>${i + 1}</b>${NAMES[s][0]}</button>`).join("")}</div>
      <div class="db-view" role="group" aria-label="Preview size"><button aria-pressed="true" data-v="laptop">Laptop</button><button aria-pressed="false" data-v="phone">Phone</button></div></div>
    <div id="stagewrap"><div id="tx">
      <button id="screensBtn" aria-label="All six screens">${ICON.grid}</button>
      <div id="screensSheet" role="dialog" aria-label="Screens"><div class="sheet panel solid"><h2>Taxila · Prakash</h2><p>A game-native world. Six screens, all live.</p>
        ${ORDER.map((s, i) => `<button class="row" data-s="${s}"><b>${i + 1}</b><span>${NAMES[s][0]}<small>${NAMES[s][1]}</small></span></button>`).join("")}</div></div>
    </div></div></div>`);
  const shell = $("#shell"); window.TX = { Screens, go, Face, Progress };
  $$(".db-tab").forEach((b) => (b.onclick = () => go(b.dataset.s)));
  $$(".db-view button").forEach((b) => (b.onclick = () => {
    $$(".db-view button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    shell.classList.toggle("phone", b.dataset.v === "phone");
    const c = CUR; if (c && Screens[c].enter) { Screens[c].leave && Screens[c].leave(); GEN++; Screens[c].enter({}); }
    try { history.replaceState(null, "", "#" + CUR + (b.dataset.v === "phone" ? "&phone" : "")); } catch {}
  }));
  const sheet = $("#screensSheet");
  $("#screensBtn").onclick = () => sheet.classList.add("open");
  sheet.addEventListener("click", (e) => { const r = e.target.closest(".row"); if (r) { sheet.classList.remove("open"); go(r.dataset.s); } else if (e.target === sheet) sheet.classList.remove("open"); });
  addEventListener("keydown", (e) => {
    if (e.target.tagName === "INPUT") return;
    const i = ORDER.indexOf(CUR);
    if (e.key === "ArrowRight" && i < ORDER.length - 1) go(ORDER[i + 1]);
    if (e.key === "ArrowLeft" && i > 0) go(ORDER[i - 1], { back: true });
  });
  const h = location.hash.slice(1).split("&");
  if (h.includes("phone")) { shell.classList.add("phone"); $$(".db-view button").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.v === "phone"))); }
  if (h.includes("lit")) Progress.litToday = true;
  const first = ORDER.includes(h[0]) ? h[0] : "hello";
  Face.init().then(() => { go(first); if (h.includes("pick") && first === "hello") $("#hMeet").click(); });
})();
