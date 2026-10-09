/* ============================================================
   6 · PARENT — day. The same world as an engraving: lit only where Riya understands.
   Every claim opens to the attempt behind it. English or Hindi, the parent's choice.
   ============================================================ */
const PSTATE = {
  4: `<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="8" fill="#C98A2E"/><path d="m5.3 9.2 2.4 2.4 5-5" stroke="#FFF8EA" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  3: `<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.2" fill="none" stroke="#C98A2E" stroke-width="1.8"/><circle cx="9" cy="9" r="3" fill="#C98A2E"/></svg>`,
  2: `<svg viewBox="0 0 18 18"><circle cx="9" cy="9" r="7.2" fill="none" stroke="#1D6870" stroke-width="1.8" stroke-dasharray="3 2.4"/></svg>`,
};
const PCOPY = {
  en: {
    eyebrow: "Riya · Class 6 · CBSE · Week of 5 to 11 October",
    h1: "Riya can now find the common factors of any two numbers, and she is learning to break a number into primes.",
    lede: "Four lessons with Asha this week, on the days you planned. Here is what she understood, and how we know.",
    cards: [
      { s: 4, lbl: "Secure", t: "Common factors and common multiples", p: "Right again three days later, with new numbers and no hint. That is when Taxila calls something secure.",
        ev: [["Mon 5 Oct", "On her own", "Common factors of 12 and 18: <q>one, two, three, six</q>"], ["Thu 8 Oct", "New numbers, no hint", "Common factors of 20 and 30: <q>1, 2, 5, 10</q>"]] },
      { s: 3, lbl: "Understood this week", t: "Prime and composite numbers", p: "Explained in her own words why 1 is not a prime. Asha will check it again on another day before calling it secure.",
        ev: [["Wed 7 Oct", "In her words", "<q>1 sirf ek hi number se divide hota hai, isliye prime nahi.</q>"]] },
      { s: 2, lbl: "Still practising", t: "Prime factorisation", p: "Today she stopped the factor tree at 6 once (36 = 6 × 6), then broke both sixes on her own. Asha will give her one new number on Saturday.",
        ev: [["Fri 9 Oct", "First try", "<q>6 × 6</q>, both sixes still composite"], ["Fri 9 Oct", "Second try, no hint", "<q>2 × 2 × 3 × 3</q>"], ["Fri 9 Oct", "Game", "Broke 72 into 2 × 2 × 2 × 3 × 3. Game evidence alone never makes a skill secure."]] },
    ],
    how: "How do we know?",
    tryLbl: "Try at home · 5 minutes",
    tryT: "Break 360 into primes, together",
    tryP: "360 is the number of degrees in a circle. Ask Riya to break it into primes. If she stops at a number like 9 or 10, ask: “Can that one break again?” Let her explain why 1 never appears.",
    weekLbl: "This week",
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    stats: [["4", "lessons"], ["86", "minutes"], ["1", "question parked for later"]],
    weekNote: "Filled circles are lessons done. Outlined ones are the days you planned. Nothing here counts days in a row.",
    nextLbl: "Next lesson", nextT: "Saturday 10 Oct · 6:30 pm", nextP: "Co-prime numbers, then one new number to break into primes.", change: "Change time",
    safeT: "Nothing worrying came up this week.", safeP: "If anything ever does, you hear from us the same day: what was said, and what to do next.",
    foot: "Asha is an AI teacher. Riya knows this, and Asha says so herself. You can read any lesson in full from Lessons.",
  },
  hi: {
    eyebrow: "रिया · कक्षा 6 · CBSE · 5 से 11 अक्टूबर का हफ़्ता",
    h1: "रिया अब किन्हीं भी दो संख्याओं के साझा गुणनखंड निकाल सकती है, और किसी संख्या को अभाज्य संख्याओं में तोड़ना सीख रही है।",
    lede: "इस हफ़्ते आशा के साथ चार पाठ, उन्हीं दिनों जो आपने तय किए थे। उसने क्या समझा, और हमें कैसे पता है, यहाँ देखें।",
    cards: [
      { s: 4, lbl: "पक्का", t: "साझा गुणनखंड और साझा गुणज", p: "तीन दिन बाद नई संख्याओं के साथ, बिना किसी मदद के फिर सही। तभी Taxila किसी चीज़ को पक्का कहता है।",
        ev: [["सोम 5 अक्टू.", "ख़ुद से", "12 और 18 के साझा गुणनखंड: <q>एक, दो, तीन, छह</q>"], ["गुरु 8 अक्टू.", "नई संख्याएँ, बिना मदद", "20 और 30 के साझा गुणनखंड: <q>1, 2, 5, 10</q>"]] },
      { s: 3, lbl: "इस हफ़्ते समझ आया", t: "अभाज्य और भाज्य संख्याएँ", p: "उसने अपने शब्दों में बताया कि 1 अभाज्य क्यों नहीं है। पक्का कहने से पहले आशा किसी और दिन फिर जाँचेगी।",
        ev: [["बुध 7 अक्टू.", "उसके शब्दों में", "<q>1 sirf ek hi number se divide hota hai, isliye prime nahi.</q>"]] },
      { s: 2, lbl: "अभी अभ्यास में", t: "अभाज्य गुणनखंडन", p: "आज वह एक बार गुणनखंड वृक्ष को 6 पर रोक बैठी (36 = 6 × 6), फिर दोनों छक्कों को ख़ुद तोड़ा। शनिवार को आशा उसे एक नई संख्या देगी।",
        ev: [["शुक्र 9 अक्टू.", "पहली कोशिश", "<q>6 × 6</q>, दोनों छक्के अभी भी भाज्य"], ["शुक्र 9 अक्टू.", "दूसरी कोशिश, बिना मदद", "<q>2 × 2 × 3 × 3</q>"], ["शुक्र 9 अक्टू.", "खेल", "72 को 2 × 2 × 2 × 3 × 3 में तोड़ा। सिर्फ़ खेल से कोई कौशल पक्का नहीं माना जाता।"]] },
    ],
    how: "हमें कैसे पता?",
    tryLbl: "घर पर · 5 मिनट",
    tryT: "साथ मिलकर 360 को अभाज्य संख्याओं में तोड़िए",
    tryP: "एक वृत्त में 360 अंश होते हैं। रिया से इसे अभाज्य संख्याओं में तोड़ने को कहिए। अगर वह 9 या 10 जैसी संख्या पर रुके, तो पूछिए: “क्या यह फिर से टूट सकती है?” उसे समझाने दीजिए कि 1 कभी क्यों नहीं आता।",
    weekLbl: "यह हफ़्ता",
    days: ["सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि", "रवि"],
    stats: [["4", "पाठ"], ["86", "मिनट"], ["1", "सवाल बाद के लिए रखा"]],
    weekNote: "भरे गोले पूरे हुए पाठ हैं। ख़ाली गोले वे दिन हैं जो आपने तय किए। यहाँ लगातार दिनों की कोई गिनती नहीं।",
    nextLbl: "अगला पाठ", nextT: "शनिवार 10 अक्टू. · शाम 6:30", nextP: "सह-अभाज्य संख्याएँ, फिर अभाज्य गुणनखंडन के लिए एक नई संख्या।", change: "समय बदलें",
    safeT: "इस हफ़्ते चिंता की कोई बात नहीं आई।", safeP: "अगर कभी आती है, तो उसी दिन आपको बताया जाएगा: क्या कहा गया, और आगे क्या करें।",
    foot: "आशा एक AI शिक्षक है। रिया यह जानती है, और आशा ख़ुद भी यही बताती है। हर पाठ को आप पूरा पढ़ सकते हैं।",
  },
};
Screens.parent = {
  build() {
    const el = html(`<section class="screen" id="s-parent" aria-label="Parent corner">
      <div class="pr" id="pScroll">
        <div class="pr-top"><button class="iconbtn" id="pBack" aria-label="Back to Riya's home" style="color:var(--p-ink);width:44px">${ICON.back}</button>
          <div class="brand">${BRAND.replace('stroke="currentColor"', 'stroke="#1D1A28"')}<span>TAXILA</span></div>
          <div class="lang" role="group" aria-label="Report language"><button aria-pressed="true" data-l="en">English</button><button aria-pressed="false" data-l="hi" lang="hi">हिन्दी</button></div></div>
        <div class="pr-wrap"><div class="pr-hero">${sceneEngraving()}</div><div id="pBody"></div></div>
      </div>
    </section>`);
    $("#tx").appendChild(el);
    this.el = el;
    $("#pBack", el).onclick = () => go("home", { back: true });
    $$(".lang button", el).forEach((b) => (b.onclick = () => { $$(".lang button", el).forEach((x) => x.setAttribute("aria-pressed", String(x === b))); this.draw(b.dataset.l); }));
    this.draw("en");
  },
  draw(l) {
    const c = PCOPY[l], hi = l === "hi" ? ' lang="hi"' : "";
    const days = c.days.map((d, i) => `<div class="day ${[0, 2, 3, 4].includes(i) ? "done" : i === 5 ? "plan" : ""}">${d}<i></i></div>`).join("");
    $("#pBody", this.el).innerHTML = `<div${hi}>
      <div class="pr-kid"><div class="eyebrow">${c.eyebrow}</div><h1>${c.h1}</h1><p>${c.lede}</p></div>
      <div class="pr-grid">
        <div>${c.cards.map((k, i) => `<article class="pcard"><div class="pstate" style="color:${k.s === 2 ? "var(--p-teal)" : "var(--p-brass)"}">${PSTATE[k.s]}<span class="lbl" style="color:inherit">${k.lbl}</span></div>
          <h2 style="margin-top:8px">${k.t}</h2><p>${k.p}</p>
          <details class="howknow"${i === 0 ? " open" : ""}><summary>${c.how}${ICON.chevron}</summary>${k.ev.map(([d, h, w]) => `<div class="ev-row"><div><b>${d}</b></div><div><b>${h}</b> · ${w}</div></div>`).join("")}</details></article>`).join("")}</div>
        <div>
          <article class="pcard" style="background:#FBF3E4"><div class="lbl">${c.tryLbl}</div><h2 style="margin-top:6px">${c.tryT}</h2><p>${c.tryP}</p></article>
          <article class="pcard"><div class="lbl">${c.weekLbl}</div><div class="week">${days}</div>
            <div class="stat">${c.stats.map(([n, w]) => `<div><b>${n}</b>${w}</div>`).join("")}</div><p style="font-size:15px">${c.weekNote}</p></article>
          <article class="pcard"><div class="lbl">${c.nextLbl}</div><h2 style="margin-top:6px">${c.nextT}</h2><p>${c.nextP}</p><button class="pbtn ghost">${c.change}</button></article>
          <article class="pcard safe">${ICON.shield}<div><h2 style="font-size:19px">${c.safeT}</h2><p>${c.safeP}</p></div></article>
        </div>
      </div>
      <p class="foot-note">${c.foot}</p></div>`;
  },
  enter() { $("#pScroll", this.el).scrollTop = 0; },
};
