// Tap a frame: the front, the three slots and the lesson state word switch to it. No network, no storage.
document.querySelectorAll(".fam").forEach((sec) => {
  const data = JSON.parse(sec.querySelector(".fdata").textContent);
  const names = { rest: "Resting · the riggable front", speak: "Speaking (an open 'aa')", listen: "Listening (a small head tilt)", think: "Thinking (eyes up and aside)", warm: "Warm (a small real smile)", blink: "Blink (eyes closed)" };
  sec.querySelectorAll(".fr").forEach((b) => b.addEventListener("click", () => {
    const d = data[b.dataset.fr];
    sec.querySelectorAll(".fr").forEach((x) => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    sec.querySelector("[data-big]").src = d.big;
    sec.querySelector("[data-cap]").textContent = names[b.dataset.fr];
    sec.querySelectorAll(".win150 .jh-face, .win90 .jh-face").forEach((im) => (im.src = d.head));
    sec.querySelectorAll(".win38 .jh-face").forEach((im) => (im.src = d.chip));
    const f = sec.querySelector("[data-floor]"); if (f) f.textContent = d.floor;
  }));
});
