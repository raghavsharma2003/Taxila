# Spoken notation: how the voice teacher says written maths and science (G1-spoken-notation, 2026-10-02)

**The gap.** VOICE-TEACHER §2 makes kit content the one verbatim class: LESSON NOW poses the kit item as given.
But a kit item is *written*: `3/4`, `0.274`, `2³`, `√49`, `−3 °C`, `25 cm²`, `₹12.50`, `3,45,67,890`, `3:5`,
`H₂O`, `1098`. Lane A (native gpt-realtime-2.1) has no `custom_lexicon_url`, so nothing controls how this
notation becomes speech. Lane B (Voice Live + Azure TTS) has one; lane A never will. The model chooses a reading
on every turn, and its choice changes with the language mode. Until this file, nothing specified or measured
that choice. The same gap covers the digit-exact 1098/14416 rule in §10.4.

**The decision in one line.** Every kit item, key and safety string carries a `spoken` field: data, rendered once
per language mode × school medium × band by a deterministic renderer and verified at kit-load. Lane A is handed
the pre-rendered form (in the voice compile only), the narration twin reads it, and lane L/G normalisers and
`lessonKeywords()` are built from the same table. The probe below measured how much this matters (§4).

Evidence tags as in VOICE-TEACHER: [M] measured here (n given), [S] published source, [H] inherited,
[I] invented starting value, [U] unverified.

---

## 1. What the textbooks and teachers actually say [S]

Primary sources are the NCERT 2024-25 textbooks (new NCF-SE 2023 series), read from the PDFs on
`ncert.nic.in/textbook/pdf/`. English- and Hindi-medium editions of the same chapter were compared side by side.

| notation | NCERT English medium | NCERT Hindi medium | source (chapter PDF) |
|---|---|---|---|
| ½ | "one half"; "We also sometimes read this as 'one upon two'" | "हम कभी-कभी इसे 'एक बटा दो' भी पढ़ते हैं" | Ganita Prakash 6 ch.7 *Fractions* / *भिन्न* (`fegp107`, `fhgp107`) |
| ¾ | "We usually read the fraction 3/4 as 'three quarters' or 'three upon four'" (and "3 times 1/4" to show the unit) | "हम भिन्न 3/4 को आमतौर पर 'तीन-चौथाई' या तीन बटा चार पढ़ते हैं" ("3 गुना 1/4") | same, §"Reading Fractions" / "भिन्नों को पढ़ना" |
| numerator / denominator | numerator, denominator | अंश, हर | same |
| mixed number | "mixed number or mixed fraction"; 2⅔ as "two and two-thirds" | मिश्रित संख्या / मिश्रित भिन्न; "दो और दो-तिहाई" | same, §7.5 |
| everyday fraction words | one and a half, three quarters, one and a quarter, half, quarter, two and a half | एक और आधा, तीन चौथाई, एक चौथाई, आधा, चौथाई, दो और आधा | same, opening activity |
| decimals | "70.5 is read as seventy point five … 7.05 is read as seven point zero five … 0.274 is read as zero point two seven four. We don't read it as zero point two hundred and seventy four" | "70.5 को सत्तर दशमलव पाँच … 7.05 को सात दशमलव शून्य पाँच … 0.274 को शून्य दशमलव दो सात चार पढ़ा जाता है। हम इसे शून्य दशमलव दो सौ चौहत्तर नहीं पढ़ते" | Ganita Prakash 7 ch.3 *A Peek Beyond the Point* / *बिंदु से परे एक दृष्टि* (`gegp103`, `ghgp103`) |
| why decimal reading is a safety matter | "reading 0.05 mg as 0.5 mg" in medication is cited as a real harm | "0.05 मि.ग्रा. (mg) को 0.5 मि.ग्रा. पढ़ने से …" | same chapter |
| large numbers | "1,00,000 is read as 'One Lakh'"; table: 10,00,000 ten lakhs = one million; 1,00,00,000 one crore = ten million; 1,00,00,00,000 one arab = one billion | "1,00,000 को 'एक लाख' पढ़ा जाता है"; the international system is taught as "मिलियन, बिलियन (अमेरिकी पद्धति)" | Ganita Prakash 7 ch.1 *Large Numbers Around Us* / *हमारे आस-पास की बड़ी संख्याएँ* (`gegp101`, `ghgp101`) |
| exponents | "n squared or n raised to the power 2"; "n cubed"; "n raised to the power 4 or the 4th power of n"; "a cubed b squared" | "5⁴ को पढ़ा जाता है — '5 की घात 4'"; "a का वर्ग b की घात 4"; घात, आधार, घातांकीय रूप | Ganita Prakash 8 ch.2 *Power Play* / *घातों का खेल* (`hegp102`, `hhgp102`) |
| squares | n × n = n², "read as 'n squared'" | "जिसे 'n का वर्ग' पढ़ा जाता है"; वर्गमूल | Ganita Prakash 8 ch.1 *A Square and a Cube* / *वर्ग और घन* (`hegp101`, `hhgp101`) |
| negative numbers | "negative numbers"; floors −1, −2 | ऋणात्मक संख्या, धनात्मक संख्या, पूर्णांक | Ganita Prakash 6 ch.10 *The Other Side of Zero* / *शून्य के दूसरी ओर* (`fegp110`, `fhgp110`) |
| science term | photosynthesis | प्रकाश संश्लेषण (17 occurrences in one chapter) | Curiosity / जिज्ञासा 7 ch.10 (`ghcu110`) |
| °C | degree Celsius (tables "(°C)") | tables "(°C)" in the Hindi edition too: the symbol stays Latin and is voiced डिग्री सेल्सियस | Curiosity / जिज्ञासा 7 ch.7 (`gecu107`, `ghcu107`) |

What follows from the sources:

1. **The textbooks themselves give two readings for every fraction**: a unit-word reading (three quarters /
   तीन-चौथाई) and an operator reading (three upon four / तीन बटा चार). Both are correct. What a child must
   not hear is the two mixed inside one item, or a reading from the other medium. "Three by four" is the common
   Indian-classroom operator in English [U: widespread practice, but no textbook source was found in this pass;
   NCERT uses "upon"]. All three (upon, by, quarters) count as correct English readings.
2. **Decimals are read digit by digit after the point, in both media** ("दो सात चार", not "दो सौ चौहत्तर").
   The textbook frames a misread decimal as a medication harm. This is the strongest primary-source argument
   that number rendering is product, not polish.
3. **The Indian system is the default in both media.** "Million/billion" is taught as the *other* system (in
   Hindi labelled "अमेरिकी पद्धति"). So a lakh/crore number voiced in millions is a convention error even in
   English mode.
4. **Hindi medium has a full term layer** (अंश, हर, मिश्रित भिन्न, दशमलव, दशांश, घात, आधार, वर्ग, घन,
   वर्गमूल, ऋणात्मक, पूर्णांक, अनुपात, प्रतिशत, प्रकाश संश्लेषण). A Hindi-medium child in Hinglish mode
   still needs these terms; an English-medium child in Hindi mode needs the English ones. This is the existing
   "school-medium term rule" in VOICE-TEACHER §2 row 7, now made into data.
5. **Symbols survive into Hindi books in Latin script** (°C, cm, mg, x). The spoken form is a Hindi or loanword
   reading, so the written string tells the voice nothing about how to say it.

Inherited evidence [H]: Gurukul's IndicF5 Hindi TTS got chemical symbols wrong 6/8 and numerals 4/11, and an
audited chemistry/numeral normaliser brought this to 4/8 and 1/11 (`docs/harvest/gurukul.md` Block B,
`services/indicf5-runtime/pronunciation_normalizer.py`, with negative controls IP, AI, IIT, He, In, As). So
text normalisation before speech helps, and it needs negative controls: a normaliser that turns every "In"
into indium is its own bug.

---

## 2. The `spoken` field (data, never prompt prose)

### 2.1 Contract (add to `shared/contracts.ts`)

```
type SpokenMode   = "en" | "hl" | "hi"               // ChildBrief.languagePref
type SchoolMedium = "english" | "hindi"              // profile.schoolMedium; "other" resolves to english [I]
type Band         = "6-9" | "10-15"
type SpokenCell   = `${SpokenMode}.${SchoolMedium}.${Band}` | `${SpokenMode}.${SchoolMedium}` | SpokenMode

interface SpokenSet {
  /** cell → the full spoken string, in the script the voice reads best: Devanagari for hi, Latin for en/hl [I] */
  forms: Partial<Record<SpokenCell, string>>;
  /** provenance: "rendered" (speakNotation rule table, version-pinned) | "authored" (a human override) */
  source: "rendered" | "authored"; rendererVersion?: string;
  verified?: { by: "listener" | "blind-asr"; date: string };
}

interface KitItem {  // existing fields unchanged
  spoken?: SpokenSet;                  // the item as it is said
  answerSpoken?: {                     // the key as it may be HEARD from the child (normaliser input, never output)
    value: string;                     // canonical value, e.g. "3/4", "0.274", "-3", "2.5 kg"
    variants: Partial<Record<SpokenMode, string[]>>;  // every accepted spoken reading, both media, both scripts
  };
  terms?: { id: string; en: string; hiMedium: string; deva: string }[];  // the term layer (§1 point 4)
}
```

- **Resolution order:** `mode.medium.band` → `mode.medium` → `mode` → `speakNotation(written, mode, medium, band)`
  at kit-load. A miss is never filled by the model at runtime.
- **`speakNotation()`** (`server/content/spoken.js`, new) is a pure, deterministic rule table (fractions, mixed
  numbers, decimals, exponents, roots, signs, units, currency, Indian grouping, ratio, percent, times-table chant,
  chemical formulae, angle, π, digit-strings), one per mode × medium. It runs **only on notation spans** found by a
  tokeniser. Words are passed through. It ships with Gurukul-style negative controls, so `In`, `He`, `As`, `AI`
  and `IIT` stay words. It is version-pinned (`rendererVersion`), so a rule change re-renders and re-verifies
  every kit.
- **Verification at kit-load** (`normalizeKit` → `checkSpoken`): every rendered form must round-trip through
  `parseSpoken()` (the inverse table) back to the item's notation values, or the item is dropped for voice lanes
  (it stays available to the screen). This is the same "drop what cannot be taught safely" rule `normalizeKit`
  already applies.
- **It is data.** The `spoken` string is the item, not an instruction. It enters the voice compile only inside
  LESSON NOW (the verbatim class) and only for the current item. It never enters CHARACTER, MOVE, LANGUAGE or
  TURN SHAPE. No example readings, convention lists or "say X as Y" prose go into any prompt: that would be the
  recitation law (sentence-shaped text gets recited) and the vocabulary-in-prompt law (§9.1) in a new place.

### 2.2 Which lane gets what

| consumer | gets | why |
|---|---|---|
| lane A LESSON NOW (gpt-realtime-2.1) | the resolved `spoken` form **instead of** the written item; the written item goes to the screen | measured: written notation is where lane A errs and mixes conventions (§4) |
| narration twin (gpt-4o-mini-tts) and lane E cascade | the resolved `spoken` form | same, and TTS reads Hinglish-romanised notation in Hindi number words (§4) |
| lane B (Azure TTS) | the `spoken` form, plus the shared lexicon for term phonemes | the lexicon fixes phonemes, not notation choice |
| screen / module | the written item and the NCERT term in the child's school medium | DL2: the screen follows the school medium |
| `lessonKeywords(kit)` (lane L `keywords`, conditional on O1) | the current item's `terms` in the child's medium, plus the key's **value words**, from `answerSpoken.variants` | keywords must be the words the child will say, not the notation. Never a free-text prompt list (§9.1) |
| lane L/G grading normaliser | `parseSpoken(asrText, mode)` against `answerSpoken` (value-level match), with number items on exact/phoneme-aware matching (§9.1) | the child may say "teen bata chaar", "three by four", "three-fourth" or "पौन"; all of these mean 3/4 |
| detectors (PB, label-echo, recitation n-gram) | the `spoken` form is whitelisted as kit content | posing a verbatim item must not trip recitation lint |

### 2.3 The cells: what changes by mode × medium × band

The rule table carries these **conventions as data**. This table is a spec for `speakNotation()`. It is never
prompt text.

| class | en · english | hl · english | hl · hindi | hi · hindi | hi · english (rare) | band note |
|---|---|---|---|---|---|---|
| fraction | upon (NCERT), quarters/halves for 1/2, 1/4, 3/4 | English operator in a Hindi frame | बटा / चौथाई, Hindi number words | बटा, Hindi number words; अंश/हर | English operator, English number words, Hindi frame | 6-9: unit words (half, quarter, आधा, चौथाई) for halves and quarters; 10-15: operator reading |
| mixed number | "and" (two and one upon three) | same | पूर्णांक/और | और (NCERT "दो और दो-तिहाई") | — | always split whole and part; never one number |
| decimal | point + digits singly | point + digits singly | दशमलव + digits singly | दशमलव + digits singly | point | — |
| exponent | squared / cubed / raised to the power | same | का वर्ग / का घन / की घात | same | — | 10-15 only in kits |
| root | square root of / cube root of | same | वर्गमूल / घनमूल | same | — | — |
| sign | minus for the operation and the sign [I] | minus | ऋण (the NCERT term is ऋणात्मक; "माइनस" is widespread in speech [U]) | ऋण | minus | — |
| unit | full unit name; ² → square, ³ → cubic; m/s² → metres per second squared | English unit names | Hindi unit words (वर्ग सेंटीमीटर, घन मीटर, प्रति घंटा) | same | — | never read the symbol letters |
| currency | rupees + paise | rupees/rupaye + paise | रुपये पैसे | रुपये पैसे | — | ₹12.50 is twelve rupees fifty paise, not "twelve point five zero" |
| large number | Indian system (lakh, crore); international only when the item is about it | same | लाख करोड़ | लाख करोड़ | — | — |
| ratio | is to | is to | अनुपात | अनुपात (NCERT) / "तीन अनुपात पाँच" [I] | — | — |
| times table | "seven eights are fifty-six" chant | English chant | पहाड़ा chant (सात अठे छप्पन) | पहाड़ा chant | — | 6-9: chant; 10-15: "seven times eight is fifty-six" |
| chemical formula | letters + numbers (H two O) | same | same, Devanagari letters | एच टू ओ (Latin letters voiced) | — | — |
| digit string (helpline, phone) | **digit by digit, always** | same | same, Hindi digits | same | — | §10.4 |
| time | three forty-five (band 6-9 also "quarter to four") | same | पौने चार | पौने चार | — | — |

**Never mix inside one item.** The renderer chooses one convention per class per item. `checkSpoken` rejects a form
that contains readings from two families of the same class (e.g. upon + quarters, Hindi + English number words,
lakh + million). This is the "mixed-convention" metric in §4, enforced at load.

### 2.4 Authoring and cost

53 probe items were authored by hand for this pass (`notation-probe-2026-10-02/items.mjs`). Shipping means
`speakNotation()` plus `parseSpoken()` with a test suite: every class × mode × medium, the round-trip, and
negative controls. Authored overrides are needed only where the rule table cannot know the kit's intent, e.g.
a "read this number aloud" item, whose key *is* the reading. ~1-2 days of build [I].

---

## 3. The probe (part b)

**Method (2026-10-02).** 53 items (`notation-probe-2026-10-02/items.mjs`: 5 fraction, 5 decimal, 4 exponent,
2 root, 3 negative, 7 unit, 2 currency, 5 large-number, 3 ratio/percent, 2 times-table, 2 equation, 2 chemical,
1 time, 2 angle/π, 2 helpline, 6 term-pronunciation) × 3 modes (en = English mode/English medium; hl = Hinglish
mode/English medium, romanised; hi = Hindi mode/Hindi medium, Devanagari) × 2 arms (**W** = posed as written;
**P** = posed pre-rendered from the `spoken` field) × 2 engines:

- **RT**: `taxila-realtime` (gpt-realtime-2.1), voice marin, a fresh session per item. The minimal lane-A compile
  was CHARACTER line → LESSON NOW ("pose as the kit gives it") → LANGUAGE (mode + school medium) → LAST. Then one
  child text turn and audio out. Both the model's own output transcript and the audio were kept.
- **TTS**: gpt-4o-mini-tts, voice marin, a one-line voice note per mode, input = the item text.

Every clip was back-transcribed by `taxila-transcribe` (gpt-4o-transcribe; `language` en or hi). The prompt named
only the script convention ("write numbers and symbols as spoken words"): no vocabulary, per the ASR recitation
law. A rubric classifier (`taxila-brain`, JSON, one call per clip) labelled each clip: **rendering error**
(symbol read literally, sign/unit/power/point dropped, mixed number fused, garbled, not posed), **number misread**
(any spoken value differs), **mixed convention** (two conventions in one item, or a convention foreign to the mode
× medium), **digit-exact** for helplines, and **asr-suspect** (the flag looks like a transcription artefact). This
is a research measurement, not child grading. A hand audit of a random sample is in §3.2.
Scripts: `probe.mjs`, `score.mjs`; data: `raw.json`, `scored.json`, `tables.md`, `clips/`.

RESULTS_PLACEHOLDER
