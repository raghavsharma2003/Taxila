// The reply rubric's patterns, apart from _owner.mjs so a unit test can import them without a server base URL.
// ───────────────────────────── the reply rubric (code judge) ─────────────────────────────
// Every pattern here is written against the defects of the owner's 0/100 session (evals/owner-truth/ROOT-CAUSES.md,
// F1-F21) and the 394 transcribed turns of evals/owner-truth/results/2026-10-04T18-30-08.
export const RX = {
  fallback: /lost my words for a second|meri baat atak gayi|meri baat atak|can you say that again\?$|tell me that once more\? i.m listening|ek baar phir se batao, kya kaha tumne/i,
  // the fixed disclosure line (F10): only correct after a disclosure
  disclosure: /what you said matters|tumne jo bataya,? woh zaroori hai|aapne jo bataya,? woh zaroori hai/i,
  stage: /(?:^|[\s(—-])(?:whiteboard(?:\s+anchor)?|board|shape|move|note|key|ladder|rung|lesson now|turn shape|your move)\s*:|\bTURN SHAPE\b|\bLESSON NOW\b|\[[^\]]+\]/i,
  strayScript: /[ঀ-෿઀-૿؀-ۿ฀-๿]/,
  danglingOpen: /^[\s]*[”"'’)\]]/,
  asciiArt: /(?:[●○◯◉■□▪▫▲△▼▽◆◇★☆•◦⬤⚫⚪🔴🔵🟢🟡][\s,]*){3,}|[\u2500-\u257F]{2,}|[\u2500-\u257F|]\s*[—–-]{2,}|(?:[—–-]{2,}\s*[|\u2500-\u257F]){2,}|(?:[|_\-=+*#]{3,}.*\n){2,}|(?:\|\s*[—–-]*\s*){3,}|-{4,}>|={4,}|\+-{3,}\+|●[─—-]{3,}|[─—-]{3,}→/,
  defer: /\b(baad mein (?:baat|bataunga|batati|batata|karenge|dekhenge)|later|pehle .{0,40}(?:khatam|finish|poora)|after this (?:question|lesson)|abhi .{0,30}(?:par|pe) (?:lautte|wapas|focus)|let'?s get back|wapas (?:aate|chalte) hain)\b/i,
  cantDraw: /\b(i can'?t|i cannot|i am not able to|i'm not able to|main nahi|mai nahi|mein nahi)\s+(?:\w+\s+){0,3}(draw|show|bana|dikha)|\b(drawing|picture|diagram)\s+(?:nahi|not)\s+(?:bana|dikha|show|draw)|\b(?:dikha|bana|chala|draw\s+kar|show\s+kar)\s+nahi\s+(?:sakta|sakti|sakte|paunga|paungi|payenge|paati|paata)\b|text[- ]only|no (?:pictures|images|drawing)/i,
  childDraws: /\b(aap|tum)\s+(?:\w+\s+){0,4}(?:banao|banaiye|bana lo|bana lijiye|draw karo|draw kijiye|draw|sketch)\b|\b(?:draw|sketch)\s+(?:it|this|a)\s+(?:yourself|on (?:your|a) (?:copy|notebook|paper))|copy (?:mein|par|pe) bana|\b(?:board|whiteboard|copy|paper|notebook|kaagaz)\s+(?:par|pe|mein)\b[^.?!]{0,60}?\b(?:banaiye|banao|bana\s+(?:lijiye|lo|dijiye)|draw\s+(?:kijiye|karo|kariye)|likhiye|likho)\b|\b(?:aise|ab|pehle)\s+draw\s+(?:kijiye|karo|kariye)\b|\bdraw\s+(?:kijiye|karo|kariye)\b/i,
  imagine: /\b(imagine|socho ki|sochiye ki|man mein|mann mein|picture (?:sochiye|socho)|kalpana)\b/i,
  // refers to something on the stage
  refers: /\b(dekho|dekhiye|dekhte|dekhna|screen|board|diagram|picture|tasveer|chitra|drawing|banaya|bana (?:rahi|raha|diya)|game|khel|activity|niche|neeche|yahan|here|look|see|shown|on the right|left mein|tray|line par|bars?|model)\b/i,
  // the child is told to speak slowly (F14), or to "think in Hindi" (F12)
  // round 2: imperatives only — "main dheere bolungi" (SHE will go slowly, the asked-for move) matched "dheere bol" (owner-4, prod 2026-10-06)
  childSlow: /\b(dheere|dhire|slowly)\s+(?:se\s+)?(?:bol|boliye|bolo|bolna|bataiye|batao|say|speak|repeat)\b(?!\s*(?:ungi|unga|engi|enge))|say it (?:once more|again),? slowly/i,
  thinkInHindi: /hindi mein soch/i,
  praiseOpen: /^\s*(?:[\p{L}]+\s*[,—-]\s*)?(?:✅|✔|👍|👏|🎉|🌟|⭐|💯|bilkul|sahi|correct|exactly|perfect|great|well done|very good|good job|shabaa?sh|wah|badhiya|ekdam sahi|you got it|that'?s right)/iu,
  praiseAny: /\b(?:aapne|tumne|you)\b[^.!?]{0,60}\b(?:sahi|correct(?:ly)?|right)\s+(?:kaha|bataya|likha|likhi|likhe|pehchana|pehchaana|jodi|joda|chuni|chuna|socha|pakda|nikala|got|said|found|identified)\b|\bsahi (?:jawab|answer)\b(?!\s*(?:kya|kaun|hoga))|\bthat'?s (?:right|correct)\b/iu,
  denyAny: /\b(?:galat|galti\b[^.!?]{0,40}\b(?:hui|ho gayi|ho gai|kar di|kiya)|step (?:toot|tut|chhoot|chhut) gaya|not quite|not right|that'?s wrong|incorrect|you made a mistake|sahi nahi)\b/i,
  wrapWords: /\b(aaj ke liye (?:bas )?(?:itna|yahin)|lesson (?:yahin )?(?:khatam|khatm)|phir milenge|phir milte hain|goodbye|bye[\s-]*bye|see you|that'?s all for today|let'?s stop (?:here|for today)|yahin rok(?:te| dete) hain)\b/i,
};
