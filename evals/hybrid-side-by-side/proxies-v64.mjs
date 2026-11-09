// Offline v6.4 code proxies over finished runs (no model calls): Brain, director13. Text patterns over her lines plus the
// per-turn gate fields, counted the same way for every run given, so two runs sit side by side.
//   node evals/hybrid-side-by-side/proxies-v64.mjs evals/hybrid-side-by-side/results/<runA> [<runB> …]
// These are PROXIES: main's judges count by hand. Each counter says what it matches.
import { drawnContradictionsOf } from "./drawn-pages.mjs";
import { readFileSync, readdirSync } from "node:fs";
import { verdictMisplaced } from "./checks.mjs";

const sentences = (t) => (String(t ?? "").match(/[^.!?।]+[.!?।]*/g) ?? []).map((x) => x.trim()).filter(Boolean);
const words = (t) => String(t ?? "").split(/\s+/).filter(Boolean).length;
const firstSentence = (t) => (String(t ?? "").match(/^[^.!?]+[.!?]/) ?? [String(t ?? "")])[0];
const STOP = new Set(["maine", "mujhe", "mera", "meri", "mere", "hai", "hain", "tha", "thi", "kal", "aaj", "bahut", "pasand", "kiya", "khela",
  "aur", "lekin", "kya", "aapko", "tumhe", "with", "that", "this", "have", "kaun", "kaise", "kyun", "wala", "wali", "wale", "bhi", "achha", "accha"]);
const contentWords = (t) => (String(t ?? "").toLowerCase().match(/\p{L}{4,}/gu) ?? []).filter((w) => !STOP.has(w));
const ASIDE = /\b(?:cricket|virat|kohli|sixer|six|match|ipl|dhoni|football|bat|ball)\b/i;
const PARK = /yaad rahega|baad mein (?:baat|aate)|sawaal khatam karke|uspar aate|iski baat|pakka|ke baad karenge|(?:ant|baad) mein .*lautenge/i;
const TEMPLATE = /(?:^|\.\s*)(?:aur|and about)\s+\p{L}+\s+(?:ki baat\s*)?:|sunke bahut achha laga|tumne bataya tha|tumne mujhse .* poocha tha/iu;
const CANNED = /ek over mein chhe ball|Virat Kohli India ke liye|gyarah khiladi|cover drives?\b.*mashhoor|kaafi mashhoor ha/i;
// v6.5 (main, director13 judgement): frames, persona, beatless turns, remediations re-said, canned facts on any turn
const FRAME_FORMS = [
  ["Nahi, yeh jawab nahi hai", "Yeh jawab sahi nahi hai", "Abhi yeh sahi nahi hai", "Nahi, yeh theek nahi hai"],
  ["Haan, sahi hai", "Bilkul sahi", "Haan, bilkul theek", "Sahi jawab"],
  ["Phir se dekho:", "Ek baar aur dekho:", "Sawaal yeh hai:", "Dhyan se dekho:"],
].map((fam) => fam.map((f) => f.toLowerCase().replace(/[.:]+$/, "")));
const TASTE = /(?<![\p{L}])(?:mujhe\s+(?:bhi\s+)?(?:\p{L}+\s+){0,3}(?:pasand|achha\s+lagta|achhi\s+lagti|bahut\s+achha)|mera\s+(?:favourite|pasandida)|meri\s+(?:favourite|pasand)|main\s+(?:bhi\s+)?(?:khelti|dekhti|khela|dekha)|i\s+(?:also\s+)?(?:like|love|enjoy)|my\s+favou?rite)(?![\p{L}])/iu;
const DENIES_AI = /(?<![\p{L}])(?:main\s+(?:ek\s+)?(?:insaan|human|asli)|main\s+ai\s+nahi|i\s+am\s+(?:a\s+)?(?:human|real\s+person)|i'?m\s+not\s+an?\s+ai)(?![\p{L}])/iu;
const CHECKIN = /^(?:Yahan tak theek hai|Ab tak samajh aaya|Yeh kadam saaf hai|Does that make sense so far|Clear so far|Is that step clear)\?$/i;
const ASIDE_FACT = /(?<![\p{L}])(?:cricket|virat|kohli|sixer|dhoni)(?![\p{L}])/iu;
const SPEAKS_TO = /(?<![\p{L}])(?:tum|tumne|tumhe|tumhari|tumhara|tumko|you|your|ai|yaad\s+rahega|ke\s+baad|baad\s+mein|karenge|lautenge|uspar)(?![\p{L}])/iu;
const q50 = (a) => { const s = [...a].filter((x) => typeof x === "number").sort((x, y) => x - y); return s.length ? s[Math.floor(0.5 * (s.length - 1))] : null; };
const normS = (x) => String(x ?? "").toLowerCase().replace(/[^\p{L}\p{N}/ ]+/gu, " ").replace(/\s+/g, " ").trim();
const ENGLISH_W = /(?<![\p{L}])(?:fractions?|parts?|pieces?|sides?|perimeter|total|marks?|lines?|equal|answer|steps?)(?![\p{L}])/giu;

export function scriptsOf(dir) {
  try { return Object.fromEntries(readdirSync(`${dir}/scripts`).map((f) => { const j = JSON.parse(readFileSync(`${dir}/scripts/${f}`, "utf8")); return [j.topicId, j]; })); } catch { return {}; }
}
/** A scripted card id → its authored key words (for the Hindi check: a key word stays as written). */
function keyOf(scripts, topicId, itemId) {
  const m = /^script:([^:]+):(.+)$/.exec(String(itemId ?? ""));
  const sk = m && scripts[topicId]?.skills?.find((s) => s.skillId === m[1]);
  if (!sk) return "";
  const rest = m[2];
  const card = rest.startsWith("ask:") ? (rest.slice(4) === "worked" ? sk.workedExample?.yourStep : sk.explain?.find((x) => x.id === rest.slice(4))?.ask)
    : rest.startsWith("then:") ? sk.remediation?.find((r) => r.targets === rest.slice(5))?.then : sk.checks?.find((c) => c.id === rest);
  const said = (x) => (x && typeof x === "object" ? `${x.hi ?? ""} ${x.en ?? ""}` : x ?? "");
  return [said(card?.key), ...(card?.accept ?? []).map(said)].join(" ").toLowerCase();
}
export const answerBoardOf = (scripts, topicId, itemId) => {
  const m = /^script:([^:]+):(.+)$/.exec(String(itemId ?? ""));
  const sk = m && scripts[topicId]?.skills?.find((s) => s.skillId === m[1]);
  if (!sk) return null;
  const rest = m[2];
  if (rest.startsWith("ask:")) { const b = rest.slice(4); return (b === "worked" ? sk.workedExample?.yourStep : sk.explain?.find((x) => x.id === b)?.ask)?.answerBoard ?? null; }
  if (rest.startsWith("then:")) return sk.remediation?.find((r) => r.targets === rest.slice(5))?.then?.answerBoard ?? null;
  return sk.checks?.find((c) => c.id === rest)?.answerBoard ?? null;
};

export function proxies(dir) {
  const scripts = scriptsOf(dir);
  const t = { lessons: 0, turns: 0, verdicts: 0, graded: 0, rightCalledWrong: 0, wrongCalledRight: 0, falseKeys: 0, contradictions: 0,
    perTopic: {}, v6: { verdictSeg: 0, verdictSegRaw: 0, unpaged: 0, nothingNew: 0, picture: 0, borrowedWhy: 0 },
    droppedPages: null, droppedTurns: null, over60: 0, longest: 0,
    orphan: 0, unanswered: 0, yaadKaroLive: 0, twoClose: 0, carriedAfterProbe: 0, carriedAll: 0,
    returns: 0, returnsOnTime: 0, returnsTheirWord: 0, returnsTemplate: 0, canned: 0,
    hindiRequests: 0, hindiSaid: 0, hindiEnglishAfter: 0, reposeBare: 0, sameAsPrev: 0, samajhAaya: 0, aglaKadam: 0, skillLeft: 0,
    frameRepeat: 0, tasteClaim: 0, deniesAi: 0, cardlessQ: 0, remediationResaid: 0, cannedAnyTurn: 0, pichhleLive: 0, latency: {},
    // v6.6 H3: contradictions read from the pages drawn (drawn-pages.mjs), per kind, with the rows
    drawn: { total: 0, closeOffBoard: 0, cardAsAlt: 0, modelWords: 0, perTopic: {}, rows: [] },
    rows: { orphan: [], unanswered: [], yaadKaroLive: [], twoClose: [], carriedAfterProbe: [], returnsLate: [], returnsTemplate: [], hindiMiss: [], reposeBare: [], droppedPages: [] } };
  for (const f of readdirSync(dir).filter((x) => /^(steady|offtopic|stuck|steering)-.*\.json$/.test(x)).sort()) {
    const j = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
    const tag = f.replace(".json", "").replace(/-ch0\d-t0\d$/, (m) => m).replace(/^([a-z]+)-(c\d)-ch0(\d)-t0(\d)$/, "$1 $2-t0$4").replace(" c4-t01", " c4").replace(" c6-t01", " c6");
    const topic = f.replace(/^[a-z]+-/, "").replace(".json", "");
    const pt = (t.perTopic[topic] ??= { contradictions: 0 });
    const rows = j.director ?? [];
    t.lessons++;
    let prevT = null, prevCard = null, liveCard = null, parked = null, hindiAt = -1, seenAside = false;
    const posed = new Map(), closed = new Set();
    const herTurns = [], remSaid = new Map(), ready = [], read = [];
    // a remediation's authored say (this run's own scripts), as she would say it
    const remSays = (scripts[j.topicId]?.skills ?? []).flatMap((sk) => (sk.remediation ?? []).map((r) => normS(typeof r.say === "object" ? r.say?.hi ?? r.say?.en : r.say))).filter((x) => x.split(" ").length >= 6);
    const skills = new Set();
    rows.forEach((r, i) => {
      if (r.who === "child") {
        if (typeof r.classifyMs === "number") read.push(r.classifyMs);
        if (ASIDE.test(r.text ?? "")) seenAside = true;
        if (ASIDE.test(r.text ?? "") && !parked) parked = { at: i, said: r.text, card: prevCard, topicW: (String(r.text).match(ASIDE) ?? [""])[0].toLowerCase(), parkSaid: false };
        if (/hindi|हिंदी|हिन्दी/i.test(r.text ?? "") && !/english/i.test(r.text ?? "")) { hindiAt = i; }
        return;
      }
      const g = r.gate ?? {};
      const text = String(r.text ?? "");
      const card = r.check?.itemId ?? null;
      t.turns++;
      if (g.answered) t.graded++;
      if (g.verdictGiven) t.verdicts++;
      if (g.rightCalledWrong) t.rightCalledWrong++;
      if (g.wrongCalledRight) t.wrongCalledRight++;
      t.falseKeys += g.falseKeys ?? 0;
      // contradictions with the corrected verdictSeg (recheck-verdictseg.mjs: the bare-verdict rule and the answerBoard)
      let c = g.contradictions ?? 0;
      const v6 = g.v6 ?? {};
      if (v6.verdictSeg) {
        t.v6.verdictSegRaw++;
        const firstBoard = r.segments?.[0]?.board ?? r.boardRef ?? null;
        const still = verdictMisplaced({ graded: true, verdict: firstSentence(text), firstBoard: firstBoard ?? { template: "\u0000none", params: {} },
          answeredBoard: { template: "\u0000answered", params: {} }, answerBoard: answerBoardOf(scripts, j.topicId, prevCard) });
        if (still) t.v6.verdictSeg++; else c -= 1;
      }
      t.contradictions += c; pt.contradictions += c;
      for (const k of ["unpaged", "nothingNew", "picture", "borrowedWhy"]) t.v6[k] += v6[k] ?? 0;
      if ("droppedPages" in v6) { t.droppedPages = (t.droppedPages ?? 0) + (v6.droppedPages ?? 0); t.droppedTurns = (t.droppedTurns ?? 0) + (v6.droppedPages ? 1 : 0); if (v6.droppedPages) t.rows.droppedPages.push(`${tag} ${i}`); }
      const w = words(text);
      if (w > 60) t.over60++;
      t.longest = Math.max(t.longest, w);
      const ss = sentences(text);
      // P2 proxy: a sentence that is a fragment (a bare name, a postposition head) or the "tulna karo kar" join
      if (ss.some((x) => /^(?:ke|ki|ka|se|mein|ko|ne)\s/i.test(x) || /^(?:riya|aarav|gopi)[.!,]?$/i.test(x) || /tulna karo kar/i.test(x))) { t.orphan++; t.rows.orphan.push(`${tag} ${i}`); }
      // Q1 proxy: "Yaad karo" said while a card is live
      if (/yaad karo/i.test(text) && r.card) { t.yaadKaroLive++; t.rows.yaadKaroLive.push(`${tag} ${i}`); }
      // T1″ proxy: a verdict carrying a why, then "Toh poora jawab"
      const done = ss.findIndex((x) => /^(?:Toh poora jawab|So the full answer)/i.test(x));
      if (done > 0 && ss.slice(0, done).some((x) => /(?<![\p{L}])(?:kyunki|because)(?![\p{L}])/iu.test(x))) { t.twoClose++; t.rows.twoClose.push(`${tag} ${i}`); }
      if (/aur pehle wale sawaal ka/i.test(text)) { t.twoClose++; t.rows.twoClose.push(`${tag} ${i} (carried)`); }
      // T1″ proxy: a carried "Pichhle sawaal" close after a turn whose verdict already closed that card (her last turn said "sahi")
      if (/Pichhle sawaal ka (?:sahi )?jawab/i.test(text)) {
        t.carriedAll++;
        if (prevT && /^(?:Haan, sahi|Bilkul sahi|Sahi|Bahut badhiya)/i.test(String(prevT.text ?? "")) && !g.answered) { t.carriedAfterProbe++; t.rows.carriedAfterProbe.push(`${tag} ${i}`); }
      }
      // K1 proxy: a scripted card posed that is never closed by a verdict, a give-up or a reveal before the walk leaves it
      if (card && /^script:/.test(card)) { if (!posed.has(card)) posed.set(card, i); }
      // (the live card is the last one posed: a try-first or a request turn carries no card id of its own)
      // a card ends answered by a RIGHT verdict, or by a give-up / reveal that states its answer; a wrong verdict leaves it open
      // (polarity from the verdict's head only: "Haan, sahi hai, kyunki … barabar nahi hain" is a right verdict)
      const v0 = firstSentence(text).split(/(?<![\p{L}])(?:kyunki|because)(?![\p{L}])|:/u)[0];
      // (a positive opener decides it unless "nahi" follows at once — "Bilkul, Riya—tumne sahi pehchaana ki … barabar nahi hain";
      // otherwise the first clause says "sahi" with no negation in it)
      const opener = /^\s*(?:haan|bilkul|shabash|bahut\s+badhiya|badhiya|yes|right|correct|sahi)(?![\p{L}])(?![,\s]*(?:yeh\s+)?(?:jawab\s+)?(?:nahi|nahin|not|galat))/iu.test(v0);
      const clause0 = v0.split(/[,—–;]/)[0];
      const right = g.verdictGiven && (opener || (/(?<![\p{L}])(?:sahi|right|correct)(?![\p{L}])/iu.test(clause0) && !/(?<![\p{L}])(?:nahi|nahin|not|galat)(?![\p{L}])/iu.test(clause0)));
      const reveal = r.check?.gave || /(?:sawaal ka (?:sahi )?jawab|poora jawab|question's (?:right )?answer|the full answer)/i.test(text);
      if (liveCard && /^script:/.test(liveCard) && g.answered && (right || reveal)) closed.add(liveCard);
      else if (liveCard && /^script:/.test(liveCard) && reveal) closed.add(liveCard);
      if (card) liveCard = card;
      if (card && /^script:/.test(card)) skills.add(card.split(":")[1]);
      // H2″ proxies: the return of an aside that was parked
      if (parked) {
        if (!parked.parkSaid && i > parked.at && PARK.test(text)) { parked.parkSaid = i; }
        else if (parked.parkSaid && i > parked.parkSaid && new RegExp(`\\b${parked.topicW}`, "i").test(text) && !PARK.test(text)) {
          t.returns++; t.rows.returnLines = [...(t.rows.returnLines ?? []), `${tag} ${i} [${parked.said}] ${ss.filter((x) => new RegExp(`\\b${parked.topicW}`, "i").test(x)).join(" ")}`];
          const onTime = !(card && card === parked.card) && !/:then:/.test(String(card ?? "")) || card !== prevCard;
          if (onTime) t.returnsOnTime++; else t.rows.returnsLate.push(`${tag} ${i}`);
          const retS = ss.filter((x) => new RegExp(`\\b${parked.topicW}`, "i").test(x)).join(" ").toLowerCase();
          // (H2″'s rule, as returnLineOk: one content word of what they said, the aside's own topic word included)
          if (contentWords(parked.said).some((x) => retS.includes(x))) t.returnsTheirWord++;
          if (TEMPLATE.test(text)) { t.returnsTemplate++; t.rows.returnsTemplate.push(`${tag} ${i}`); }
          parked = null;
        }
      }
      if (CANNED.test(text)) t.canned++;
      // v6.5 proxies
      if (typeof r.replyReadyMs === "number") ready.push(r.replyReadyMs);
      { // F1: a code frame form she opened with in one of her last 4 turns, opened with again
        const lo = text.toLowerCase();
        for (const fam of FRAME_FORMS) { const f = fam.find((x) => lo.startsWith(x)); if (f && herTurns.slice(-4).some((h) => h.startsWith(f))) { t.frameRepeat++; (t.rows.frameRepeat ??= []).push(`${tag} ${i} ${f}`); } }
        herTurns.push(lo);
      }
      if (TASTE.test(text)) { t.tasteClaim++; (t.rows.tasteClaim ??= []).push(`${tag} ${i} ${ss.find((x) => TASTE.test(x))?.slice(0, 70)}`); }
      if (DENIES_AI.test(text)) { t.deniesAi++; (t.rows.deniesAi ??= []).push(`${tag} ${i}`); }
      { // B1: a question of hers on a scripted turn with no card (code's check-ins and a worked example's own question aside)
        const scripted = /^script:/.test(String(r.check?.itemId ?? "")) || !!r.beat;
        // (a quoted board mark, "'?' wala nishaan", names the mark and asks nothing)
        const qs = sentences(text.replace(/(['"‘“])\s*[?？]\s*(['"’”])/g, "$1mark$2")).filter((x) => /[?？]/.test(x) && !CHECKIN.test(x));
        // (a why-probe and the skill's hook ask their own question with no card, by design: not beatless)
        if (!r.card && scripted && !/worked|hook/.test(String(r.beat ?? "")) && !["wrap", "worked_example", "break", "probe"].includes(String(r.move ?? "")) && qs.length) {
          t.cardlessQ++; (t.rows.cardlessQ ??= []).push(`${tag} ${i} ${qs[0].slice(0, 70)}`); }
      }
      { // K2: a remediation's authored say spoken a second time in the lesson
        const nt = normS(text);
        for (const rs of remSays) if (nt.includes(rs.slice(0, 60))) { const k = remSaid.get(rs) ?? 0; if (k) { t.remediationResaid++; (t.rows.remediationResaid ??= []).push(`${tag} ${i}`); } remSaid.set(rs, k + 1); }
      }
      // A1: a sentence about an aside's topic that speaks to no one, with no lesson words or numbers (a canned fact), on any turn
      if (ss.some((x) => ASIDE_FACT.test(x) && !SPEAKS_TO.test(x) && !TASTE.test(x) && !/\d/.test(x) && !/(?<![\p{L}])(?:fraction|bhinn|tukd|hiss|line|rekha|bhuja|parimap|perimeter|boundary|pitch)\w*/iu.test(x))) {
        t.cannedAnyTurn++; (t.rows.cannedAnyTurn ??= []).push(`${tag} ${i} ${ss.find((x) => ASIDE_FACT.test(x) && !SPEAKS_TO.test(x))?.slice(0, 70)}`); }
      // F1: "Pichhle sawaal" for the card this turn graded or gave up (it is "is sawaal")
      if (/Pichhle sawaal ka (?:sahi )?jawab/i.test(text) && (g.answered || r.check?.gave)) { t.pichhleLive++; (t.rows.pichhleLive ??= []).push(`${tag} ${i}`); }
      // R3 / register proxy: "compare" made "tulna karo" before a verb ("tulna karo kar", "tulna karo kiya")
      if (/tulna karo (?:kar|kiya|ki|ke)\b/i.test(text)) { t.registerJoin = (t.registerJoin ?? 0) + 1; t.rows.registerJoin = [...(t.rows.registerJoin ?? []), `${tag} ${i}`]; }
      // H2″ proxy: her sentence about an aside topic (cricket, Virat …) on a turn that neither parks it nor returns to it
      // (not the opening hook, before any aside; not her reaction on the very turn they said it)
      const asideJustSaid = i > 0 && rows[i - 1]?.who === "child" && ASIDE.test(rows[i - 1]?.text ?? "");
      if (seenAside && !asideJustSaid && !PARK.test(text) && !(t.rows.returnLines ?? []).some((l) => l.startsWith(`${tag} ${i} `))) {
        const talk = ss.filter((x) => ASIDE.test(x) && !/\d/.test(x));
        if (talk.length) { t.asideTalk = (t.asideTalk ?? 0) + 1; t.rows.asideTalk = [...(t.rows.asideTalk ?? []), `${tag} ${i} ${talk.join(" ").slice(0, 80)}`]; }
      }
      // L1 proxies: the turn after a Hindi request says the switch; her next two turns carry no English teaching words
      if (hindiAt >= 0 && i === hindiAt + 1) {
        t.hindiRequests++;
        const first = ss[0] ?? "";
        if (/hindi/i.test(first) && !/^zaroor[.!]?$/i.test(first)) t.hindiSaid++; else t.rows.hindiMiss.push(`${tag} ${i}`);
      }
      if (hindiAt >= 0 && i > hindiAt && i <= hindiAt + 5) {
        const keyW = keyOf(scripts, j.topicId, card);
        const eng = (text.match(ENGLISH_W) ?? []).filter((x) => !keyW.includes(x.toLowerCase()));
        if (eng.length) t.hindiEnglishAfter++;
      }
      // R3 proxies: a card said again word for word with nothing new; a turn the same as her previous one; the dropped lines
      const cardText = String(r.card ?? "").trim();
      if (cardText.length > 40 && prevT && String(prevT.text ?? "").includes(cardText) && text.trim() === cardText) { t.reposeBare++; t.rows.reposeBare.push(`${tag} ${i}`); }
      if (prevT && text.length > 40 && text.trim() === String(prevT.text ?? "").trim()) t.sameAsPrev++;
      if (/samajh\s+aaya\s+tumne\s+kaise\s+socha/i.test(text)) t.samajhAaya++;
      if (/Ab agla kadam dekhte hain/i.test(text)) t.aglaKadam++;
      prevT = r; prevCard = card;
    });
    // a card still live when the lesson ends is not counted as unanswered
    for (const [id, at] of posed) if (!closed.has(id) && id !== liveCard) { t.unanswered++; t.rows.unanswered.push(`${tag} ${id.split(":").slice(2).join(":")}@${at}`); }
    if (skills.size > 1) t.skillLeft++;
    for (const d of drawnContradictionsOf(rows, { answerBoardOf: (id) => answerBoardOf(scripts, j.topicId, id) })) {
      const n = d.closeOffBoard + d.cardAsAlt + d.modelWords;
      t.drawn.total += n; t.drawn.closeOffBoard += d.closeOffBoard; t.drawn.cardAsAlt += d.cardAsAlt; t.drawn.modelWords += d.modelWords;
      t.drawn.perTopic[topic] = (t.drawn.perTopic[topic] ?? 0) + n;
      t.drawn.rows.push(`${tag} ${d.i} ${d.closeOffBoard ? "close" : d.cardAsAlt ? "alt" : "words"}`);
    }
    t.latency[tag] = { replyReadyP50: q50(ready), readP50: q50(read), n: ready.length };
  }
  return t;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = Object.fromEntries(process.argv.slice(2).map((d) => [d.split("/").filter(Boolean).pop(), proxies(d)]));
  console.log(JSON.stringify(out, null, 1));
}
