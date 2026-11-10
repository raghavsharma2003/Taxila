// Round 8 design prototypes: the ONE source of words, icons and boards for both directions.
// Both a-paper/ and b-night/ load this file, so every screen says the same thing in both directions.
// The board diagrams are drawn here with role classes only (bd-ink, bd-focus, bd-ans, bd-mix ...): each direction's
// tokens.css decides the colours. The game stage is the exception: it keeps the games' own blueprint palette.
// The child (Riya, class 5) and her parent are simulated; no real child's words are used.
(function () {
  "use strict";

  // ---------- maths helpers ----------
  /** An inline stacked fraction in HTML (numerator over a rule over denominator), set in the maths face. */
  const F = (n, d) => `<span class="frac" role="math" aria-label="${n} over ${d}"><span class="frac-n">${n}</span><span class="frac-d">${d}</span></span>`;
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  /** A stacked fraction in SVG, centred on x with its rule at y. */
  function sfrac(x, y, n, d, size, cls, extra = "") {
    const w = Math.max(String(n).length, String(d).length) * size * 0.56 + size * 0.36;
    return `<g class="bd-frac ${cls}" ${extra}>
      <text class="bd-num" x="${x}" y="${(y - size * 0.2).toFixed(1)}" font-size="${size}" text-anchor="middle">${n}</text>
      <line x1="${(x - w / 2).toFixed(1)}" x2="${(x + w / 2).toFixed(1)}" y1="${y}" y2="${y}" stroke-width="${(size * 0.065).toFixed(1)}" stroke-linecap="round"/>
      <text class="bd-num" x="${x}" y="${(y + size * 0.84).toFixed(1)}" font-size="${size}" text-anchor="middle">${d}</text>
    </g>`;
  }
  const op = (x, y, s, size) => `<text class="bd-num bd-op" x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${s}</text>`;
  /** A curly brace opening downwards from x1 to x2 at y (tip up at y - h). */
  function brace(x1, x2, y, h, cls, i) {
    const m = (x1 + x2) / 2, q = h / 2;
    const d = `M${x1} ${y} q0 ${-q} ${q} ${-q} L${m - q} ${y - q} q${q} 0 ${q} ${-q} q0 ${q} ${q} ${q} L${x2 - q} ${y - q} q${q} 0 ${q} ${q}`;
    return `<path class="dr ${cls}" style="--i:${i}" pathLength="1" d="${d}" fill="none" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }

  // ---------- board 1: a half split into quarters ----------
  function boardHalves(shape) {
    const tall = shape === "tall";
    const W = tall ? 600 : 820, H = tall ? 580 : 476;
    const sx = tall ? 150 : 70, sy = tall ? 104 : 100, S = 300; // the square
    const mx = sx + S / 2, my = sy + S / 2;
    const p = [];
    p.push(`<rect class="fade bd-focus-fill" style="--i:3" x="${sx}" y="${sy}" width="${S / 2}" height="${S}"/>`);
    // the whole square and the half line, in ink
    p.push(`<rect class="dr bd-ink" style="--i:0" pathLength="1" x="${sx}" y="${sy}" width="${S}" height="${S}" rx="3" fill="none" stroke-width="4"/>`);
    p.push(`<path class="dr bd-ink" style="--i:1" pathLength="1" d="M${mx} ${sy}V${sy + S}" stroke-width="4"/>`);
    // the quarter line: in the half we are talking about it is the focus colour; across the other half it is soft
    p.push(`<path class="dr bd-soft" style="--i:2" pathLength="1" d="M${mx} ${my}H${sx + S}" stroke-width="2.5"/>`);
    p.push(`<path class="dr bd-focus" style="--i:2" pathLength="1" d="M${sx} ${my}H${mx}" stroke-width="4"/>`);
    p.push(`<rect class="dr bd-focus" style="--i:3" pathLength="1" x="${sx + 3}" y="${sy + 3}" width="${S / 2 - 6}" height="${S - 6}" rx="2" fill="none" stroke-width="5"/>`);
    // quarter labels: ink inside the focus half, soft in the other half
    p.push(`<g class="fade" style="--i:4">${sfrac(sx + S / 4, sy + S / 4 + 4, 1, 4, 32, "bd-ink-t")}${sfrac(sx + S / 4, my + S / 4 + 4, 1, 4, 32, "bd-ink-t")}${sfrac(sx + 3 * S / 4, sy + S / 4 + 4, 1, 4, 28, "bd-soft-t")}${sfrac(sx + 3 * S / 4, my + S / 4 + 4, 1, 4, 28, "bd-soft-t")}</g>`);
    // the half, named above it
    p.push(brace(sx + 4, mx - 4, sy - 14, 16, "bd-focus", 4));
    p.push(`<g class="fade" style="--i:5">${sfrac(sx + S / 4, sy - 66, 1, 2, 34, "bd-focus-t")}</g>`);
    // the mix-up, named under the whole: four quarters make the WHOLE, not the half
    const by = sy + S + 22;
    p.push(`<path class="fade bd-mix" style="--i:5" d="M${sx} ${by - 10}V${by}H${sx + S}V${by - 10}" fill="none" stroke-width="3" stroke-dasharray="7 7"/>`);
    p.push(`<text class="fade bd-lbl bd-mix-t" style="--i:6" x="${mx}" y="${by + 36}" font-size="27" text-anchor="middle">4 quarters make the whole</text>`);
    // the equation with the answer slot
    const ex = tall ? 300 : 615, ey = tall ? 520 : my + 6, es = tall ? 42 : 48, g = es * 1.32;
    const box = es * 1.25;
    p.push(`<g class="fade bd-eq" style="--i:6">
      ${sfrac(ex - 2.1 * g, ey, 1, 2, es, "bd-focus-t")}
      ${op(ex - 1.1 * g, ey + es * 0.34, "=", es)}
      <rect class="bd-ans-fill bd-ans" x="${ex - box / 2}" y="${ey - box / 2}" width="${box}" height="${box}" rx="8" stroke-width="3" stroke-dasharray="8 6"/>
      <text class="bd-num bd-ans-t" x="${ex}" y="${ey + es * 0.36}" font-size="${es}" text-anchor="middle">?</text>
      ${op(ex + 1.1 * g, ey + es * 0.34, "×", es)}
      ${sfrac(ex + 2.1 * g, ey, 1, 4, es, "bd-ink-t")}
    </g>`);
    return `<svg class="bd" viewBox="0 0 ${W} ${H}" role="img" aria-label="A square split in half and then into quarters. The left half is marked one half. Below: one half equals how many times one quarter?">${p.join("")}</svg>`;
  }

  // ---------- board 2: thirds on a number line from 0 to 2 ----------
  function boardThirds(shape) {
    const tall = shape === "tall";
    const W = tall ? 470 : 820, H = tall ? 370 : 380;
    const x0 = tall ? 40 : 90, unit = tall ? 190 : 320, ly = tall ? 206 : 206;
    const X = (v) => x0 + v * unit;
    const p = [];
    p.push(`<rect class="fade bd-focus-fill" style="--i:1" x="${X(0)}" y="${ly - 14}" width="${unit}" height="28" rx="4"/>`);
    p.push(`<path class="dr bd-ink" style="--i:0" pathLength="1" d="M${X(0) - 26} ${ly}H${X(2) + 30}" stroke-width="4" stroke-linecap="round"/>`);
    p.push(`<path class="dr bd-ink" style="--i:0" pathLength="1" d="M${X(2) + 18} ${ly - 11}l14 11l-14 11" fill="none" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`);
    for (const v of [0, 1, 2]) p.push(`<path class="dr bd-ink" style="--i:1" pathLength="1" d="M${X(v)} ${ly - 26}V${ly + 26}" stroke-width="4" stroke-linecap="round"/>`);
    for (const v of [1 / 3, 2 / 3]) p.push(`<path class="dr bd-focus" style="--i:2" pathLength="1" d="M${X(v)} ${ly - 18}V${ly + 18}" stroke-width="4" stroke-linecap="round"/>`);
    for (const v of [4 / 3, 5 / 3]) p.push(`<path class="dr bd-soft" style="--i:2" pathLength="1" d="M${X(v)} ${ly - 15}V${ly + 15}" stroke-width="3" stroke-linecap="round"/>`);
    p.push(`<g class="fade" style="--i:2">${[0, 1, 2].map((v) => `<text class="bd-num bd-ink-t" x="${X(v)}" y="${ly + 74}" font-size="42" text-anchor="middle">${v}</text>`).join("")}</g>`);
    // what we are talking about: one whole is three thirds
    p.push(brace(X(0) + 4, X(1) - 4, ly - 40, 18, "bd-focus", 3));
    p.push(`<text class="fade bd-lbl bd-focus-t" style="--i:4" x="${X(0) - 8}" y="${ly - 82}" font-size="27" text-anchor="start">1 whole = 3 equal parts</text>`);
    // her answer: 1/3 placed on the first mark
    const ax = X(1 / 3);
    p.push(`<g class="ans-pin" style="--i:5">
      <path class="bd-ans" d="M${ax} ${ly - 4}V${ly - 30}" stroke-width="3"/>
      <circle class="bd-ans-dot" cx="${ax}" cy="${ly}" r="13" stroke-width="4"/>
      ${sfrac(ax, ly + 66, 1, 3, 40, "bd-ans-t")}
      <path class="ans-tick bd-ans" pathLength="1" d="M${ax + 30} ${ly + 58}l9 9l17 -19" fill="none" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    </g>`);
    return `<svg class="bd" viewBox="0 0 ${W} ${H}" role="img" aria-label="A number line from 0 to 2. The part from 0 to 1 is split into three equal parts. One third is placed on the first mark, with a tick.">${p.join("")}</svg>`;
  }

  // ---------- the game stage: the taraazu (balance) at level end, in the games' own blueprint look ----------
  function gameBalance() {
    const grid = [];
    for (let x = -480; x <= 1120; x += 40) grid.push(`<path d="M${x} -400V840"/>`);
    for (let y = -400; y <= 840; y += 40) grid.push(`<path d="M-480 ${y}H1120"/>`);
    const blocks = [];
    for (let i = 0; i < 7; i++) {
      const row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4;
      blocks.push(`<rect x="${468 + col * 31}" y="${244 - (row + 1) * 30}" width="27" height="27" rx="5"/>`);
    }
    return `<svg class="game-svg" viewBox="0 0 640 440" overflow="visible" role="img" aria-label="A balance, level. The left pan holds a bag marked x. The right pan holds 7 blocks. x equals 7.">
      <rect x="-480" y="-400" width="1600" height="1240" fill="#0D2546"/>
      <g stroke="#1B3B66" stroke-width="1">${grid.join("")}</g>
      <g stroke="#8CC8FF" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M110 140L48 248M110 140L172 248M530 140L468 248M530 140L592 248" opacity=".55"/>
      </g>
      <rect x="240" y="378" width="160" height="20" rx="10" fill="#14335E" stroke="#9CC9FF" stroke-width="2.5"/>
      <path d="M320 150V378" stroke="#A9CFF5" stroke-width="10" stroke-linecap="round"/>
      <path d="M100 140H540" stroke="#EAF4FF" stroke-width="10" stroke-linecap="round"/>
      <circle cx="320" cy="140" r="15" fill="#EAF4FF"/>
      <path d="M320 112V70" stroke="#5BE3A6" stroke-width="5" stroke-linecap="round"/>
      <path d="M352 66l12 12l24 -26" stroke="#5BE3A6" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="28" y="246" width="164" height="14" rx="7" fill="#14335E" stroke="#9CC9FF" stroke-width="2.5"/>
      <rect x="448" y="246" width="164" height="14" rx="7" fill="#14335E" stroke="#9CC9FF" stroke-width="2.5"/>
      <g fill="#3A2730" stroke="#F08A6B" stroke-width="3"><rect x="78" y="184" width="64" height="60" rx="10"/><path d="M96 184v-10a14 14 0 0 1 28 0v10" fill="none"/></g>
      <text x="110" y="228" fill="#FFD9CC" font-size="34" text-anchor="middle" font-style="italic" style="font-family:var(--font-math)">x</text>
      <g fill="#3B3418" stroke="#F6C453" stroke-width="2.5">${blocks.join("")}</g>
      <g><rect x="40" y="96" width="140" height="48" rx="24" fill="#0B2B2A" stroke="#5BE3A6" stroke-width="2.5"/>
      <text x="110" y="129" fill="#C9F7E2" font-size="28" text-anchor="middle" style="font-family:var(--font-math)"><tspan font-style="italic">x</tspan> = 7</text></g>
    </svg>`;
  }

  // ---------- icons (24 grid, 1.75 stroke, round caps; no fills) ----------
  const ICONS = {
    pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>',
    cc: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 10.2a2.3 2.3 0 1 0 0 3.6M17 10.2a2.3 2.3 0 1 0 0 3.6"/>',
    speaker: '<path d="M4 10v4h4l5 4V6L8 10z"/><path d="M16.5 9a4 4 0 0 1 0 6M19 6.5a7.5 7.5 0 0 1 0 11"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z"/>',
    map: '<path d="M9 4L3 6.5V20l6-2.5 6 2.5 6-2.5V4l-6 2.5zM9 4v13.5M15 6.5V20"/>',
    practice: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.6"/>',
    ask: '<path d="M4 5h16v11H9l-5 4z"/><path d="M10 9.2a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6.9v.3M12 14.1v.1"/>',
    notebook: '<path d="M6 3h12v18H6zM9.5 3v18M12.5 8h3M12.5 12h3"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5v-3a4 4 0 0 1 8 0v3"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    wifioff: '<path d="M3 3l18 18M8.5 16.2a5 5 0 0 1 6-.9M5.2 12.8a10 10 0 0 1 4.6-2.5M14.6 10.3a10 10 0 0 1 4.2 2.5M2 9.3a15 15 0 0 1 4.2-2.6M10.4 5.6A15 15 0 0 1 22 9.3"/><circle cx="12" cy="19.6" r="0.7"/>',
    keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10.5 10h.01M14 10h.01M17 10h.01M7.5 14h9"/>',
    hint: '<path d="M9.5 18h5M10.5 21h3M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1V16h5v-.1c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3z"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    swap: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    retry: '<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/>',
    progress: '<path d="M4 20V12M10 20V5M16 20v-9M3 20h18"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    controls: '<path d="M4 7h9M18 7h2M4 17h3M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="9" cy="17" r="2.3"/>',
    arch: '<path d="M4.5 21V11a7.5 7.5 0 0 1 15 0v10M9 21v-8.5a3 3 0 0 1 6 0V21M3 21h18"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/>',
  };
  const sprite = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${Object.entries(ICONS).map(([k, v]) => `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`).join("")}</defs></svg>`;
  const I = (name) => `<svg class="i" aria-hidden="true"><use href="#i-${name}"/></svg>`;

  // ---------- the words ----------
  const C = {
    // shared
    "teacher.name": "Asha",
    "teacher.role": "Your teacher · AI",
    "tutor.talking": "Talking",
    "tutor.listening": "Listening",
    "child.name": "Riya",
    "topic": "Halves and quarters",
    "topic.subject": "Maths · Class 5",

    // 1. home
    "home.hi": "Hi, Riya.",
    "home.eyebrow": "Today’s lesson · Maths · about 25 minutes",
    "home.title": "Halves and quarters",
    "home.lead": "How many quarters fit inside a half, and how to see it without counting.",
    "home.meta": "Maths · about 25 minutes",
    "home.go": "Start the lesson",
    "home.parked": "The two questions you asked on Tuesday are saved. Asha brings them back today.",
    "home.notyou": "Not Riya?",
    "home.forparents": "For parents",

    // 2-4. lesson
    "lesson.phase.1": "Warm-up", "lesson.phase.2": "Learn", "lesson.phase.3": "Try", "lesson.phase.4": "Wrap",
    "lesson.pause": "Pause",
    "lesson.caption": `Ek half mein kitne <mark class="live">quarters hote hain?</mark>`,
    "lesson.q": "How many quarters make one half?",
    "lesson.hear": "Hear it again",
    "lesson.talking": "Asha is talking",
    "lesson.talking.sub": "Speak any time. She stops for you.",
    "lesson.steer.1": "Show again", "lesson.steer.2": "Another way", "lesson.steer.3": "Slower", "lesson.steer.4": "Kuch aur",
    "legend.focus": "this half",
    "legend.ans": "your answer",
    "legend.mix": "easy to mix up",
    "turn.label": "Your turn",
    "turn.caption": "Bolo, kitne quarters?",
    "turn.listen": "Listening",
    "turn.listen.sub": "Just say it. No button.",
    "turn.hint": "Hint",
    "turn.type": "Type instead",
    "worked.step": "Step 2 of 3",
    "worked.steptitle": "Split each whole into 3 equal parts",
    "worked.steps.1": "Mark 0, 1 and 2",
    "worked.steps.2": "Split each whole into 3 equal parts",
    "worked.steps.3": "Name every mark",
    "worked.topic": "Thirds on a number line",
    "worked.q": `Where does ${F(1, 3)} go?`,
    "worked.caption": "हाँ, एक-तिहाई यहीं आता है: तीन बराबर हिस्सों में से <mark class=\"live\">पहला हिस्सा।</mark>",
    "worked.heard": "Heard: “pehle wale nishaan pe”",
    "worked.next": "Next step",

    // 5. game
    "game.name": "Taraazu",
    "game.kicker": "Balance the scale",
    "game.line": "Dekho, taraazu ab seedha hai.",
    "game.done": "Balanced. The bag weighs 7.",
    "game.why": "You took 6 off both sides, so the scale stayed level.",
    "game.harder": "Thoda mushkil",
    "game.harder.sub": "a harder one",
    "game.same": "Ek aur",
    "game.same.sub": "one more like this",
    "game.map": "Map",

    // 6. parent
    "parent.child": "Riya",
    "parent.childmeta": "Class 5 · CBSE",
    "parent.lock": "Lock",
    "parent.listen": "Listen to this page",
    "parent.week": "This week",
    "parent.weekdates": "Mon 2 – Sun 8 November",
    "parent.claim": "Riya can now explain why two quarters make a half, using a picture she draws herself.",
    "parent.how": "How do we know?",
    "parent.ev.1.date": "Tue 3 Nov", "parent.ev.1.how": "On her own", "parent.ev.1.words": "“Do quarter milke ek half, dekho ye do dabbe.”",
    "parent.ev.2.date": "Thu 5 Nov", "parent.ev.2.how": "On her own, two days later", "parent.ev.2.words": "Shaded two of four parts and said it was the same as a half.",
    "parent.ev.3.date": "Sat 7 Nov", "parent.ev.3.how": "With one hint", "parent.ev.3.words": "Placed one third on a number line from 0 to 2.",
    "parent.facts.1": "4", "parent.facts.1l": "lessons",
    "parent.facts.2": "82", "parent.facts.2l": "minutes, inside her limit",
    "parent.facts.3": "9", "parent.facts.3l": "questions she asked",
    "parent.task.eyebrow": "Try at home · 5 minutes",
    "parent.task": "Ask Riya to split 12 rotis between 4 people and say how many each gets, in her own words.",
    "parent.task.done": "Done",
    "parent.task.skip": "Not this week",
    "parent.next.eyebrow": "Next lesson",
    "parent.next": "Today, 4:30 pm",
    "parent.next.topic": "Thirds on a number line · about 30 minutes",
    "parent.next.move": "Move it",
    "parent.tab.1": "This week", "parent.tab.2": "Progress", "parent.tab.3": "Lessons", "parent.tab.4": "Controls",

    // 7. onboarding
    "onb.step": "Step 1 of 5",
    "onb.title": "Which class is your child in?",
    "onb.lead": "Lessons follow your child’s class and board. You can change this later.",
    "onb.class": "Class",
    "onb.board": "Board",
    "onb.board.other": "Other",
    "onb.lang": "Asha will speak in",
    "onb.lang.1": "English", "onb.lang.2": "हिंदी", "onb.lang.2l": "Hindi", "onb.lang.3": "Hindi and English mix",
    "onb.listen": "Hear a sample",
    "onb.student": "I am a student",
    "onb.continue": "Continue",

    // 8. offline
    "off.title": "You’re offline.",
    "off.lead": "Today’s lesson needs the internet. Nothing is lost: it starts where you left off.",
    "off.retry": "Try again",
    "off.saved": "Saved on this phone",
    "off.note.1": "Halves and quarters", "off.note.1m": "Your notebook · Tuesday",
    "off.note.2": "Questions you parked", "off.note.2m": "2 questions · Tuesday",

    // nav
    "nav.home": "Home", "nav.map": "Map", "nav.practice": "Practice", "nav.ask": "Ask", "nav.notebook": "Notebook",
  };

  window.TX = { C, F, I, ICONS, boardHalves, boardThirds, gameBalance, esc };

  function fill() {
    document.body.insertAdjacentHTML("afterbegin", sprite);
    for (const el of document.querySelectorAll("[data-c]")) {
      const v = C[el.dataset.c];
      if (v === undefined) { el.textContent = "[missing " + el.dataset.c + "]"; el.style.color = "red"; continue; }
      el.innerHTML = v;
    }
    for (const el of document.querySelectorAll("[data-i]")) el.insertAdjacentHTML("afterbegin", I(el.dataset.i));
    for (const el of document.querySelectorAll("[data-board]")) {
      const kind = el.dataset.board;
      const make = kind === "halves" ? boardHalves : kind === "thirds" ? boardThirds : null;
      if (kind === "game") { el.innerHTML = gameBalance(); continue; }
      if (!make) continue;
      el.innerHTML = `<div class="bd-wide">${make("wide")}</div><div class="bd-tall">${make("tall")}</div>`;
    }
    document.documentElement.classList.add("ready");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
  else fill();
})();
