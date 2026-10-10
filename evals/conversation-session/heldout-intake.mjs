// Held-out intake classification set (written blind to server/ implementation).
// Each row: the child's reply to the opening "aaj school mein kya hua / kya padhaya?".
// kind ∈ taught | homework | test | not_understood | want | nothing | unknown | share
// gold: acceptable syllabus id prefixes from data/curriculum, or [null] when no topic should be claimed.

export const HELDOUT = [
  // ---------------- taught (22) ----------------
  { id: 'h-taught-01', cls: 3, text: 'aaj maths mein tables padhaye 7 ka table', kind: 'taught', gold: ['c3-maths-ch07'], lang: 'hinglish', note: '"tables" = times tables chapter' },
  { id: 'h-taught-02', cls: 3, text: 'आज मैम ने पौधे के भाग बताए जड़ तना पत्ती', kind: 'taught', gold: ['c3-evs-ch04'], lang: 'hindi', note: 'parts of a plant, EVS' },
  { id: 'h-taught-03', cls: 3, text: 'we did half and quarter today roti cutting', kind: 'taught', gold: ['c3-maths-ch08'], lang: 'english', note: 'equal shares via roti example' },
  { id: 'h-taught-04', cls: 4, text: 'आज ईवीएस में पढ़ाया कौन सी चीज़ पानी में तैरती है कौन डूबती है', kind: 'taught', gold: ['c4-evs-ch07'], lang: 'hindi', note: 'floating/sinking described, not named' },
  { id: 'h-taught-05', cls: 4, text: 'maam taught odd and even numbers', kind: 'taught', gold: ['c4-maths-ch03'], lang: 'english', note: 'plain topic name' },
  { id: 'h-taught-06', cls: 4, text: 'symetry wala chapter shuru hua butterfly fold kiya', kind: 'taught', gold: ['c4-maths-ch11'], lang: 'hinglish', note: 'misspelt symmetry + activity' },
  { id: 'h-taught-07', cls: 5, text: '1/2 aur 2/4 same hote hai ye sikhaya', kind: 'taught', gold: ['c5-maths-ch02'], lang: 'hinglish', note: 'equivalent fractions named only by example' },
  { id: 'h-taught-08', cls: 5, text: 'angles. acute obtuse right', kind: 'taught', gold: ['c5-maths-ch03'], lang: 'english', note: 'terse list of angle types' },
  { id: 'h-taught-09', cls: 5, text: 'आज हिंदी में तीन मछलियाँ वाली कहानी पढ़ी', kind: 'taught', gold: ['c5-hindi-ch10'], lang: 'hindi', note: 'Hindi lesson by story name' },
  { id: 'h-taught-10', cls: 6, text: 'science mein magnet padhaya north pole south pole', kind: 'taught', gold: ['c6-science-ch04'], lang: 'hinglish', note: '"magnet" school word' },
  { id: 'h-taught-11', cls: 6, text: 'we learnt prime numbers and composite', kind: 'taught', gold: ['c6-maths-ch05'], lang: 'english', note: 'Prime Time chapter' },
  { id: 'h-taught-12', cls: 6, text: 'sst me latitude longitude padhaya globe pe', kind: 'taught', gold: ['c6-sst-ch01'], lang: 'hinglish', note: 'locating places on earth' },
  { id: 'h-taught-13', cls: 6, text: 'आज रहीम के दोहे पढ़ाए', kind: 'taught', gold: ['c6-hindi-ch05'], lang: 'hindi', note: 'Hindi chapter by title' },
  { id: 'h-taught-14', cls: 6, text: 'aaj english mein noun padhaya', kind: 'taught', gold: [null], lang: 'hinglish', note: 'grammar topic not in syllabus graph; must not force a reader chapter' },
  { id: 'h-taught-15', cls: 7, text: 'photosynthesis padhaya, leaves khana banati hai', kind: 'taught', gold: ['c7-science-ch10'], lang: 'hinglish', note: 'life processes in plants' },
  { id: 'h-taught-16', cls: 7, text: 'lcm and hcf', kind: 'taught', gold: ['c7-maths-ch11'], lang: 'english', note: 'bare acronyms, lowercase' },
  { id: 'h-taught-17', cls: 7, text: 'aaj gupta period padhaya history mein', kind: 'taught', gold: ['c7-sst-ch07'], lang: 'hinglish', note: 'Gupta era' },
  { id: 'h-taught-18', cls: 7, text: 'english wali maam absent thi to hindi maam ne meera ke pad padhaye', kind: 'taught', gold: ['c7-hindi-ch10'], lang: 'hinglish', note: 'topic from another subject book than the period' },
  { id: 'h-taught-19', cls: 8, text: 'aaj mughal empire start hua sst me', kind: 'taught', gold: ['c8-sst-ch02', 'c8-sst-ch15'], lang: 'hinglish', note: 'Mughals live in political-map / cultural chapters' },
  { id: 'h-taught-20', cls: 8, text: 'pythagoras theorem today', kind: 'taught', gold: ['c8-maths-ch09'], lang: 'english', note: 'Baudhayana-Pythagoras' },
  { id: 'h-taught-21', cls: 8, text: 'आज विज्ञान में कोशिका पढ़ाई, माइक्रोस्कोप से देखा', kind: 'taught', gold: ['c8-science-ch02'], lang: 'hindi', note: 'cells, Devanagari' },
  { id: 'h-taught-22', cls: 8, text: 'aaj maths me kuch naya padhaya', kind: 'taught', gold: [null], lang: 'hinglish', note: 'subject without a topic' },

  // ---------------- test (9) ----------------
  { id: 'h-test-01', cls: 3, text: 'kal maths ka test hai', kind: 'test', gold: [null], lang: 'hinglish', note: 'test, no topic named' },
  { id: 'h-test-02', cls: 3, text: 'test tomorrow on clock and calender', kind: 'test', gold: ['c3-maths-ch13'], lang: 'english', note: 'test with coverage, misspelling' },
  { id: 'h-test-03', cls: 4, text: 'कल हिंदी का टेस्ट है नीम वाला पाठ', kind: 'test', gold: ['c4-hindi-ch03'], lang: 'hindi', note: 'test + Hindi lesson' },
  { id: 'h-test-04', cls: 5, text: 'is week unit test hai evs ka river wala chapter', kind: 'test', gold: ['c5-evs-ch02'], lang: 'hinglish', note: 'this-week test with coverage' },
  { id: 'h-test-05', cls: 6, text: 'science test tmrw states of water evaporation', kind: 'test', gold: ['c6-science-ch08'], lang: 'english', note: 'abbreviated tomorrow' },
  { id: 'h-test-06', cls: 6, text: 'friday ko periodic test hai', kind: 'test', gold: [null], lang: 'hinglish', note: 'PT here means periodic test, no topic' },
  { id: 'h-test-07', cls: 7, text: 'kal sst test h weather wala chapter', kind: 'test', gold: ['c7-sst-ch02'], lang: 'hinglish', note: 'understanding the weather' },
  { id: 'h-test-08', cls: 8, text: 'exam on monday, laws of exponents', kind: 'test', gold: ['c8-maths-ch02'], lang: 'english', note: 'exam word, topic named' },
  { id: 'h-test-09', cls: 8, text: 'कल विज्ञान का टेस्ट है बल वाला अध्याय', kind: 'test', gold: ['c8-science-ch05'], lang: 'hindi', note: 'बल = force' },

  // ---------------- homework (8) ----------------
  { id: 'h-hw-01', cls: 3, text: 'homework mila hai 3 digit wale jod', kind: 'homework', gold: ['c3-maths-ch12'], lang: 'hinglish', note: '3-digit addition' },
  { id: 'h-hw-02', cls: 4, text: 'i have homework, draw a bar graph', kind: 'homework', gold: ['c4-maths-ch14'], lang: 'english', note: 'data handling' },
  { id: 'h-hw-03', cls: 5, text: 'hw me ek sum nahi ho raha 4536 divide by 12', kind: 'homework', gold: ['c5-maths-ch09'], lang: 'hinglish', note: 'topic only via the problem' },
  { id: 'h-hw-04', cls: 5, text: 'होमवर्क में पत्र लिखना है', kind: 'homework', gold: [null], lang: 'hindi', note: 'letter writing not a class-5 chapter' },
  { id: 'h-hw-05', cls: 6, text: 'homework hai area of triangle ka question', kind: 'homework', gold: ['c6-maths-ch06'], lang: 'hinglish', note: 'perimeter and area' },
  { id: 'h-hw-06', cls: 7, text: 'circuit diagram banana hai homework me', kind: 'homework', gold: ['c7-science-ch03'], lang: 'hinglish', note: 'electricity circuits' },
  { id: 'h-hw-07', cls: 8, text: 'hw on pie charts, q3 im stuck', kind: 'homework', gold: ['c8-maths-ch10'], lang: 'english', note: 'pie charts in proportional reasoning-2' },
  { id: 'h-hw-08', cls: 7, text: 'bahut sara homework mila hai', kind: 'homework', gold: [null], lang: 'hinglish', note: 'homework, no topic' },

  // ---------------- not_understood (9) ----------------
  { id: 'h-nu-01', cls: 3, text: 'maam ne ghadi padhayi samajh nahi aaya', kind: 'not_understood', gold: ['c3-maths-ch13'], lang: 'hinglish', note: 'clock reading' },
  { id: 'h-nu-02', cls: 4, text: 'भिन्न समझ नहीं आई', kind: 'not_understood', gold: ['c4-maths-ch05'], lang: 'hindi', note: 'भिन्न = fractions' },
  { id: 'h-nu-03', cls: 4, text: 'i didnt get divison', kind: 'not_understood', gold: ['c4-maths-ch09', 'c4-maths-ch13'], lang: 'english', note: 'misspelt division' },
  { id: 'h-nu-04', cls: 5, text: 'perimeter aur area mein confuse ho gaya', kind: 'not_understood', gold: ['c5-maths-ch11'], lang: 'hinglish', note: 'confusion phrasing' },
  { id: 'h-nu-05', cls: 6, text: 'minus minus plus kaise hota hai samjh nhi aaya', kind: 'not_understood', gold: ['c6-maths-ch10'], lang: 'hinglish', note: 'integers via rule fragment' },
  { id: 'h-nu-06', cls: 6, text: "didn't understand the bar graph thing in class", kind: 'not_understood', gold: ['c6-maths-ch04'], lang: 'english', note: 'data handling' },
  { id: 'h-nu-07', cls: 7, text: 'बीजगणित में x वाला कुछ समझ नहीं आया', kind: 'not_understood', gold: ['c7-maths-ch04', 'c7-maths-ch15'], lang: 'hindi', note: 'letter-numbers / equations' },
  { id: 'h-nu-08', cls: 8, text: 'square root wala kuch samajh nahi aaya', kind: 'not_understood', gold: ['c8-maths-ch01'], lang: 'hinglish', note: 'square roots' },
  { id: 'h-nu-09', cls: 8, text: 'the cyclone chapter was confusing esp air pressure', kind: 'not_understood', gold: ['c8-science-ch06'], lang: 'english', note: 'pressure, winds, cyclones' },

  // ---------------- want (8) ----------------
  { id: 'h-want-01', cls: 3, text: 'mujhe dinosaur ke baare me janna hai', kind: 'want', gold: [null], lang: 'hinglish', note: 'outside syllabus' },
  { id: 'h-want-02', cls: 4, text: 'can you teach me about black hole', kind: 'want', gold: [null], lang: 'english', note: 'outside class-4 syllabus' },
  { id: 'h-want-03', cls: 4, text: 'mujhe chand ka shape kyu badalta hai wo sikhna hai', kind: 'want', gold: ['c4-evs-ch10'], lang: 'hinglish', note: "moon's changing shape is in syllabus" },
  { id: 'h-want-04', cls: 5, text: 'मुझे ज्वालामुखी के बारे में जानना है', kind: 'want', gold: [null], lang: 'hindi', note: 'volcano, outside syllabus' },
  { id: 'h-want-05', cls: 6, text: 'i want to learn about planets', kind: 'want', gold: ['c6-science-ch12'], lang: 'english', note: 'solar system, Beyond Earth' },
  { id: 'h-want-06', cls: 7, text: 'mujhe coding sikhni hai', kind: 'want', gold: [null], lang: 'hinglish', note: 'outside syllabus' },
  { id: 'h-want-07', cls: 7, text: 'teach me eclipse pls', kind: 'want', gold: ['c7-science-ch12'], lang: 'english', note: 'eclipses in Earth, Moon and Sun' },
  { id: 'h-want-08', cls: 8, text: 'mujhe percentage acche se seekhna hai', kind: 'want', gold: ['c8-maths-ch08'], lang: 'hinglish', note: 'fractions in disguise' },

  // ---------------- nothing (7) ----------------
  { id: 'h-nothing-01', cls: 3, text: 'आज कुछ नहीं पढ़ाया, बस ड्राइंग की', kind: 'nothing', gold: [null], lang: 'hindi', note: 'drawing period only' },
  { id: 'h-nothing-02', cls: 4, text: "ma'am ne copy check ki bas", kind: 'nothing', gold: [null], lang: 'hinglish', note: 'activity-word trap: copy check' },
  { id: 'h-nothing-03', cls: 5, text: 'it was holiday today', kind: 'nothing', gold: [null], lang: 'english', note: 'holiday' },
  { id: 'h-nothing-04', cls: 6, text: 'aaj test hua tha bas maths ka', kind: 'nothing', gold: [null], lang: 'hinglish', note: 'test happened today, not upcoming' },
  { id: 'h-nothing-05', cls: 7, text: 'आज पीटी और गेम्स पीरियड था बस', kind: 'nothing', gold: [null], lang: 'hindi', note: 'PT/games' },
  { id: 'h-nothing-06', cls: 8, text: 'got our test copies back thats it', kind: 'nothing', gold: [null], lang: 'english', note: 'activity-word trap: test copy returned' },
  { id: 'h-nothing-07', cls: 8, text: 'pura din annual function ki practice hui', kind: 'nothing', gold: [null], lang: 'hinglish', note: 'event rehearsal, no class' },

  // ---------------- unknown (5) ----------------
  { id: 'h-unknown-01', cls: 3, text: 'पता नहीं', kind: 'unknown', gold: [null], lang: 'hindi', note: 'bare pata nahi' },
  { id: 'h-unknown-02', cls: 4, text: 'yaad nahi', kind: 'unknown', gold: [null], lang: 'hinglish', note: "doesn't remember" },
  { id: 'h-unknown-03', cls: 5, text: 'idk', kind: 'unknown', gold: [null], lang: 'english', note: 'texting filler' },
  { id: 'h-unknown-04', cls: 6, text: 'hmm... kuch nahi pata', kind: 'unknown', gold: [null], lang: 'hinglish', note: 'filler + not know' },
  { id: 'h-unknown-05', cls: 7, text: 'umm pata nai maam', kind: 'unknown', gold: [null], lang: 'hinglish', note: 'misspelt + address word' },

  // ---------------- share (6) ----------------
  { id: 'h-share-01', cls: 3, text: 'aaj school mein mera dost gir gaya uske ghutne pe chot lagi', kind: 'share', gold: [null], lang: 'hinglish', note: 'life event mentioning school' },
  { id: 'h-share-02', cls: 4, text: 'my birthday is tomorrow!!', kind: 'share', gold: [null], lang: 'english', note: 'birthday' },
  { id: 'h-share-03', cls: 5, text: 'aaj humne cricket match jeeta', kind: 'share', gold: [null], lang: 'hinglish', note: 'sports win' },
  { id: 'h-share-04', cls: 6, text: 'आज मेरे नाना जी आए हैं गाँव से', kind: 'share', gold: [null], lang: 'hindi', note: 'family visit' },
  { id: 'h-share-05', cls: 7, text: 'our class won the rangoli competition in school today', kind: 'share', gold: [null], lang: 'english', note: 'school-word share, not learning' },
  { id: 'h-share-06', cls: 8, text: 'aaj papa ne naya phone dilaya', kind: 'share', gold: [null], lang: 'hinglish', note: 'personal news' },
];
