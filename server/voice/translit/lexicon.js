// Hand lexicon for Roman Hinglish → Devanagari (RS-7). Wins over lexicon-learned.js (generated from the dev split).
// Spellings are the SPOKEN ones a Hindi voice should say (ये, वो: the Director writes "yeh/ye", "woh/wo" for the spoken
// word), otherwise standard textbook spelling. Never a sentence, never a line: words only.
//
// Three tables:
//   CORE       unambiguous Hindi words (function words, pronouns, postpositions, auxiliaries, teacher vocabulary)
//   VERBS      verb stems; verbForms() expands every inflection the Director writes (kariye, karenge, karke, kiya...)
//   AMBIGUOUS  spellings that are ALSO an English word (or two Hindi words): resolved by sentence context in index.js
//   KEEP       words that look Hindi to the rule fallback but are English/loan words a teacher says in English

/** Unambiguous Hindi words. */
export const CORE = {
  // auxiliaries and copula
  hai: "है", hain: "हैं", hai_n: "हैं", hoon: "हूँ", hun: "हूँ", hu: "हूँ", tha: "था", thi: "थी", thin: "थीं", hoga: "होगा", hogi: "होगी",
  honge: "होंगे", hota: "होता", hoti: "होती", hote: "होते", hua: "हुआ", hui: "हुई", hue: "हुए", huye: "हुए", hona: "होना", hone: "होने",
  // pronouns
  mai: "मैं", mein: "में", mujhe: "मुझे", mujhko: "मुझको", mera: "मेरा", meri: "मेरी", mere: "मेरे", humein: "हमें", hume: "हमें",
  humko: "हमको", hamara: "हमारा", hamari: "हमारी", hamare: "हमारे", humara: "हमारा", humari: "हमारी", humare: "हमारे",
  tum: "तुम", tumhe: "तुम्हें", tumhein: "तुम्हें", tumko: "तुमको", tumhara: "तुम्हारा", tumhari: "तुम्हारी", tumhare: "तुम्हारे", tumne: "तुमने",
  aap: "आप", aapka: "आपका", aapki: "आपकी", aapke: "आपके", aapko: "आपको", aapne: "आपने", aapse: "आपसे", aapka_: "आपका",
  ap: "आप", apka: "आपका", apki: "आपकी", apke: "आपके", apko: "आपको", apne: "अपने", apna: "अपना", apni: "अपनी",
  yeh: "ये", ye: "ये", yah: "ये", woh: "वो", wo: "वो", vo: "वो", voh: "वो", vah: "वो", ve: "वो",
  isko: "इसको", isse: "इससे", iska: "इसका", iski: "इसकी", iske: "इसके", isme: "इसमें", ismein: "इसमें", ise: "इसे", isliye: "इसलिए",
  usko: "उसको", usse: "उससे", uska: "उसका", uski: "उसकी", uske: "उसके", usme: "उसमें", usmein: "उसमें", unka: "उनका", unki: "उनकी",
  unke: "उनके", unko: "उनको", unhe: "उन्हें", unhein: "उन्हें", inhe: "इन्हें", inhein: "इन्हें", inka: "इनका", inki: "इनकी", inke: "इनके",
  inme: "इनमें", inmein: "इनमें", unme: "उनमें", unmein: "उनमें", koi: "कोई", kuch: "कुछ", kuchh: "कुछ", sab: "सब", sabhi: "सभी",
  sabse: "सबसे", sabko: "सबको", khud: "ख़ुद", apne_: "अपने",
  // question words
  kya: "क्या", kyaa: "क्या", kaise: "कैसे", kaisa: "कैसा", kaisi: "कैसी", kyun: "क्यों", kyon: "क्यों", kyu: "क्यों", kab: "कब",
  kahan: "कहाँ", kaha: "कहाँ", kahaan: "कहाँ", kaun: "कौन", kaunsa: "कौनसा", kaunsi: "कौनसी", kaunse: "कौनसे", kitna: "कितना",
  kitni: "कितनी", kitne: "कितने", kisko: "किसको", kise: "किसे", kiska: "किसका", kiski: "किसकी", kiske: "किसके", kisme: "किसमें",
  kismein: "किसमें", kidhar: "किधर", kis: "किस", kin: "किन",
  // postpositions and particles
  ka: "का", ki: "की", ke: "के", ko: "को", se: "से", mein_: "में", mei: "में", pe: "पे", tak: "तक", liye: "लिए", lie: "लिए",
  wala: "वाला", wali: "वाली", wale: "वाले", vala: "वाला", vali: "वाली", vale: "वाले", bhi: "भी", hi_: "ही", toh: "तो", tou: "तो",
  aur: "और", ya: "या", lekin: "लेकिन", par_: "पर", magar: "मगर", kyunki: "क्योंकि", kyonki: "क्योंकि", agar: "अगर", jab_: "जब",
  tab: "तब", phir: "फिर", fir: "फिर", fhir: "फिर", ab: "अब", abhi: "अभी", kabhi: "कभी", sirf: "सिर्फ़", bas_: "बस", na: "ना",
  nahi: "नहीं", nahin: "नहीं", nahee: "नहीं", nai: "नहीं", mat: "मत", haan: "हाँ", han: "हाँ", ji: "जी", jee: "जी", accha: "अच्छा",
  achha: "अच्छा", acha: "अच्छा", acchha: "अच्छा", achchha: "अच्छा", achhi: "अच्छी", acchi: "अच्छी", achchi: "अच्छी",
  achhe: "अच्छे", acche: "अच्छे", achche: "अच्छे", theek: "ठीक", thik: "ठीक", bilkul: "बिल्कुल", sahi: "सही", galat: "ग़लत",
  zara: "ज़रा", jara: "ज़रा", thoda: "थोड़ा", thodi: "थोड़ी", thode: "थोड़े", bahut: "बहुत", bohot: "बहुत", bahot: "बहुत",
  zyada: "ज़्यादा", jyada: "ज़्यादा", zyaada: "ज़्यादा", kam: "कम", jaise: "जैसे", jaisa: "जैसा", jaisi: "जैसी", waise: "वैसे",
  aise: "ऐसे", aisa: "ऐसा", aisi: "ऐसी", vaise: "वैसे", yahan: "यहाँ", yahaan: "यहाँ", wahan: "वहाँ", wahaan: "वहाँ", vahan: "वहाँ",
  yahin: "यहीं", wahin: "वहीं", idhar: "इधर", udhar: "उधर", upar: "ऊपर", neeche: "नीचे", niche: "नीचे", andar: "अंदर",
  bahar: "बाहर", baahar: "बाहर", saamne: "सामने", samne: "सामने", peeche: "पीछे", piche: "पीछे", beech: "बीच", paas_: "पास",
  baad: "बाद", pehle_: "पहले", saath_: "साथ", bina: "बिना", taraf: "तरफ़", tarah: "तरह", waala: "वाला", waali: "वाली", waale: "वाले",
  matlab: "मतलब", yaani: "यानी", yani: "यानी", shayad: "शायद", zaroor: "ज़रूर", jaroor: "ज़रूर", zaroori: "ज़रूरी", jaruri: "ज़रूरी",
  bhai: "भाई", chalo: "चलो", chaliye: "चलिए", chaliya: "चलिए", shabash: "शाबाश", shaabaash: "शाबाश", wah: "वाह", waah: "वाह",
  arre: "अरे", are_: "अरे", arey: "अरे", oho: "ओहो", haina: "है ना", hmm_: "हम्म", namaste: "नमस्ते", namaskar: "नमस्कार",
  dhanyavaad: "धन्यवाद", shukriya: "शुक्रिया", alvida: "अलविदा", phirse: "फिरसे", dobara: "दोबारा", dubara: "दोबारा",
  ekdum: "एकदम", bilkul_: "बिल्कुल", sach: "सच", sachmuch: "सचमुच", asli: "असली", seedha: "सीधा", sidha: "सीधा",
  // time
  aaj: "आज", kal: "कल", parson: "परसों", subah: "सुबह", shaam: "शाम", raat: "रात", din: "दिन", hafta: "हफ़्ता", mahina: "महीना",
  saal_: "साल", waqt: "वक़्त", samay: "समय", der: "देर", jaldi: "जल्दी", dheere: "धीरे", dhire: "धीरे", turant: "तुरंत",
  // teacher vocabulary (nouns, adjectives)
  sawaal: "सवाल", sawal: "सवाल", jawab: "जवाब", jawaab: "जवाब", uttar: "उत्तर", prashn: "प्रश्न", baat: "बात", baatein: "बातें",
  cheez: "चीज़", cheezein: "चीज़ें", cheezon: "चीज़ों", chiz: "चीज़", tarika: "तरीका", tareeka: "तरीका", hissa: "हिस्सा",
  hisse: "हिस्से", hisson: "हिस्सों", tukda: "टुकड़ा", tukde: "टुकड़े", tukdon: "टुकड़ों", barabar: "बराबर", baraabar: "बराबर",
  jod: "जोड़", ghatana: "घटाना", guna: "गुणा", bhaag: "भाग", ganit: "गणित", vigyan: "विज्ञान", paani: "पानी", pani: "पानी",
  hawa: "हवा", dhoop: "धूप", ghar: "घर", school_: "स्कूल", dost: "दोस्त", dosto: "दोस्तों", mummy_: "मम्मी", papa_: "पापा",
  khana: "खाना", roti: "रोटी", doodh: "दूध", chai: "चाय", dukaan: "दुकान", dukan: "दुकान", paisa: "पैसा", paise: "पैसे",
  rupaye: "रुपये", rupay: "रुपये", rupaya: "रुपया", rupee_: "रुपये", kitab: "किताब", kitaab: "किताब", kahani: "कहानी",
  khel: "खेल", duniya: "दुनिया", zameen: "ज़मीन", aasmaan: "आसमान", suraj: "सूरज", chaand: "चाँद", chand: "चाँद", ped: "पेड़",
  patte: "पत्ते", phool: "फूल", janwar: "जानवर", naam: "नाम", sach_: "सच", galti: "ग़लती", galtiyan: "ग़लतियाँ", koshish: "कोशिश",
  mehnat: "मेहनत", madad: "मदद", pasand: "पसंद", mazaa: "मज़ा", maza: "मज़ा", mazedaar: "मज़ेदार", badhiya: "बढ़िया",
  badiya: "बढ़िया", zabardast: "ज़बरदस्त", kamaal: "कमाल", kamal_: "कमाल", sundar: "सुंदर", aasaan: "आसान", asaan: "आसान",
  mushkil: "मुश्किल", naya: "नया", nayi: "नई", naye: "नए", purana: "पुराना", bada: "बड़ा", badi: "बड़ी", bade: "बड़े",
  chhota: "छोटा", chhoti: "छोटी", chhote: "छोटे", chota: "छोटा", choti: "छोटी", chote: "छोटे", lamba: "लंबा", lambi: "लंबी",
  lambe: "लंबे", garam: "गरम", thanda: "ठंडा", thandi: "ठंडी", thande: "ठंडे", bhaari: "भारी", halka: "हल्का", halki: "हल्की",
  pura: "पूरा", poora: "पूरा", puri: "पूरी", poori: "पूरी", pure: "पूरे", poore: "पूरे", baaki: "बाकी", baki: "बाकी", agla: "अगला",
  agli: "अगली", agle: "अगले", pichhla: "पिछला", pichhli: "पिछली", pichhle: "पिछले", aakhri: "आख़िरी", akhri: "आख़िरी",
  dhyaan: "ध्यान", dhyan: "ध्यान", hisaab: "हिसाब", hisab: "हिसाब", farak: "फ़र्क", fark: "फ़र्क", farq: "फ़र्क", jagah: "जगह",
  ant: "अंत", shuru: "शुरू", khatam: "ख़त्म", khatm: "ख़त्म", tayyar: "तैयार", taiyaar: "तैयार", taiyar: "तैयार", raasta: "रास्ता",
  rasta: "रास्ता", koi_: "कोई", har: "हर", ekdum_: "एकदम", dono_: "दोनों", log_: "लोग", logon: "लोगों", bachche: "बच्चे",
  bacche: "बच्चे", bachcha: "बच्चा", baccha: "बच्चा", didi: "दीदी", bhaiya: "भैया", dadi: "दादी", nani: "नानी", maa: "माँ",
  // number-adjacent words a maths lesson says
  pata: "पता", kaha: "कहा", saal: "साल", jitna: "जितना", jitni: "जितनी", jitne: "जितने", utna: "उतना", utni: "उतनी", utne: "उतने",
  ginti: "गिनती", sankhya: "संख्या", jodna: "जोड़ना", ghatao: "घटाओ", bhaag_: "भाग", baraabar_: "बराबर", aadhaa: "आधा",
};

/**
 * Verb stems: Roman stem → Devanagari stem, and whether the stem ends in a vowel (bata) or a consonant (kar).
 * Irregular forms are listed in IRREGULAR.
 */
export const VERBS = {
  kar: "कर", dekh: "देख", soch: "सोच", samajh: "समझ", bol: "बोल", sun: "सुन", likh: "लिख", padh: "पढ़", parh: "पढ़", gin: "गिन",
  jod: "जोड़", rakh: "रख", chal: "चल", mil: "मिल", dhoondh: "ढूँढ", dhundh: "ढूँढ", khel: "खेल", seekh: "सीख", sikh: "सीख",
  nikaal: "निकाल", nikal: "निकल", maan: "मान", ruk: "रुक", chun: "चुन", naap: "नाप", nap: "नाप", tod: "तोड़", bhar: "भर",
  kaat: "काट", dikh: "दिख", pakad: "पकड़", rah: "रह", reh: "रह", bhej: "भेज", poochh: "पूछ", puchh: "पूछ", pooch: "पूछ", chhod: "छोड़",
  keh: "कह", kah: "कह", jaan: "जान", pahunch: "पहुँच", pahuch: "पहुँच", badal: "बदल", badh: "बढ़", ghoom: "घूम", ghum: "घूम",
  gir: "गिर", uth: "उठ", baith: "बैठ", khol: "खोल", lag: "लग", sambhal: "सँभाल", jaanch: "जाँच", janch: "जाँच", nach: "नाच",
  baant: "बाँट", ban: "बन", sun_: "सुन", pighal: "पिघल", sookh: "सूख", sukh: "सूख", ubal: "उबल", jal: "जल", bach: "बच",
  dhak: "ढक", ghol: "घोल", mod: "मोड़", phenk: "फेंक", pak: "पक", sek: "सेक", tol: "तोल", bhool: "भूल", bhul: "भूल", chamak: "चमक",
  tair: "तैर", ud: "उड़", daud: "दौड़", jeet: "जीत", haar: "हार", dhul: "धुल", ugal: "उगल", ug: "उग",
};
export const VERBS_V = {
  bata: "बता", sikha: "सिखा", samjha: "समझा", bana: "बना", dikha: "दिखा", laga: "लगा", mila: "मिला", ghata: "घटा", sula: "सुला",
  ja: "जा", aa: "आ", kha: "खा", gaa: "गा", ga: "गा", la: "ला", pa: "पा", sona_: "सो", ho_: "हो", de_: "दे", le_: "ले", pee: "पी",
  pi: "पी", jee: "जी", chhu: "छू", chhoo: "छू", dho: "धो", ro: "रो", suna: "सुना", jodo_: "जोड़ो", bacha: "बचा", hata: "हटा",
  chala: "चला", utha: "उठा", baitha: "बैठा", pakda: "पकड़ा", ghuma: "घुमा", jala: "जला", bula: "बुला", sukha: "सुखा", pighla: "पिघला",
  saja: "सजा", gina: "गिना", bachcha_: "बच्चा", soja: "सोजा", chhupa: "छुपा", dhundha: "ढूँढा", likha: "लिखा", padha: "पढ़ा",
};
/** Endings after a consonant stem: Roman suffix → Devanagari suffix. */
const C_END = {
  "": "", o: "ो", iye: "िए", iyega: "िएगा", iyegi: "िएगी", ie: "िए", iyo: "ियो", en: "ें", ein: "ें", enge: "ेंगे", engi: "ेंगी",
  ega: "ेगा", egi: "ेगी", oge: "ोगे", ogi: "ोगी", unga: "ूँगा", ungi: "ूँगी", oonga: "ूँगा", oongi: "ूँगी", ta: "ता", ti: "ती", te: "ते",
  tin: "तीं", na: "ना", ne: "ने", ni: "नी", kar: "कर", ke: "के", a: "ा", i: "ी", e: "े", iyein: "िएँ", iyen: "िएँ", aa: "ा", ee: "ी",
  nge: "ेंगे", te_: "ते", tein: "तीं", vaya: "वाया", wa: "वा", wao: "वाओ", waiye: "वाइए", waaiye: "वाइए", waya: "वाया",
};
/** Endings after a vowel stem (bata, ja). */
const V_END = {
  "": "", o: "ओ", iye: "इए", yiye: "इए", aiye: "इए", iyega: "इएगा", yiyega: "इएगा", iyegi: "इएगी", ie: "इए", en: "एँ", yen: "एँ", ein: "एँ",
  yein: "एँ", enge: "एँगे", yenge: "एँगे", engi: "एँगी", yengi: "एँगी", ega: "एगा", yega: "एगा", egi: "एगी", yegi: "एगी", oge: "ओगे",
  ogi: "ओगी", unga: "ऊँगा", ungi: "ऊँगी", oonga: "ऊँगा", ta: "ता", ti: "ती", te: "ते", na: "ना", ne: "ने", ni: "नी", kar: "कर",
  ke: "के", ya: "या", yi: "ई", i: "ई", ye: "ए", e: "ए", yo: "यो", iyein: "इएँ", ate: "ते", ati: "ती", ata: "ता", yaa: "या",
};

/** Irregular forms (kiya, gaya, liya, diya, lijiye...). */
export const IRREGULAR = {
  kiya: "किया", kiye: "किए", kiyaa: "किया", ki_: "की", kijiye: "कीजिए", kijiyega: "कीजिएगा", kariye: "करिए", kariyega: "करिएगा",
  karein: "करें", karen: "करें", kare: "करे", karo: "करो", gaya: "गया", gayi: "गई", gai: "गई", gaye: "गए", gaye_: "गए",
  liya: "लिया", liye_: "लिए", li: "ली", lijiye: "लीजिए", lena: "लेना", lene: "लेने", leni: "लेनी", lenge: "लेंगे", lega: "लेगा",
  legi: "लेगी", lo: "लो", lete: "लेते", leta: "लेता", leti: "लेती", lein: "लें", len: "लें", diya: "दिया", diye: "दिए", di: "दी",
  dijiye: "दीजिए", dena: "देना", dene: "देने", deni: "देनी", denge: "देंगे", dega: "देगा", degi: "देगी", dete: "देते", deta: "देता",
  deti: "देती", dein: "दें", den: "दें", dekar: "देकर", lekar: "लेकर", hokar: "होकर", jaakar: "जाकर", jakar: "जाकर", aakar: "आकर",
  aiye: "आइए", aaiye: "आइए", aao: "आओ", aaye: "आए", aaya: "आया", aayi: "आई", aayega: "आएगा", aayegi: "आएगी", aayenge: "आएँगे",
  aata: "आता", aati: "आती", aate: "आते", aana: "आना", aane: "आने", jao: "जाओ", jaiye: "जाइए", jaaiye: "जाइए", jaye: "जाए",
  jaaye: "जाए", jayega: "जाएगा", jaayega: "जाएगा", jayegi: "जाएगी", jaayegi: "जाएगी", jayenge: "जाएँगे", jaayenge: "जाएँगे",
  jaata: "जाता", jata: "जाता", jaati: "जाती", jati: "जाती", jaate: "जाते", jate: "जाते", jaana: "जाना", jana: "जाना", jaane: "जाने",
  hoiye: "होइए", hoye: "होए", hoke: "होके", ho_: "हो", raha: "रहा", rahi: "रही", rahe: "रहे", rahenge: "रहेंगे", rahega: "रहेगा",
  rahegi: "रहेगी", rehna: "रहना", rahna: "रहना", rehta: "रहता", rahta: "रहता", rehti: "रहती", rahti: "रहती", rehte: "रहते", rahte: "रहते",
  chahiye: "चाहिए", chaahiye: "चाहिए", chahte: "चाहते", chahti: "चाहती", chahta: "चाहता", sakte: "सकते", sakti: "सकती", sakta: "सकता",
  sakenge: "सकेंगे", sake: "सके", saka: "सका", saki: "सकी", payenge: "पाएँगे", paaye: "पाए", paye: "पाए", paoge: "पाओगे",
  lagta: "लगता", lagti: "लगती", lagte: "लगते", laga_: "लगा", lagi: "लगी", lage: "लगे", lagega: "लगेगा", lagegi: "लगेगी",
  milte: "मिलते", milta: "मिलता", milti: "मिलती", milenge: "मिलेंगे", milega: "मिलेगा", milegi: "मिलेगी", mili: "मिली", mile: "मिले",
  socho: "सोचो", sochiye: "सोचिए", sochiyega: "सोचिएगा", sochte: "सोचते", dekho: "देखो", dekhiye: "देखिए", dekhte: "देखते",
  batao: "बताओ", bataiye: "बताइए", batayiye: "बताइए", bataaiye: "बताइए", bataiyega: "बताइएगा", batayega: "बताएगा", bataya: "बताया",
  batayi: "बताई", batayein: "बताएँ", bataen: "बताएँ", bataein: "बताएँ", batayen: "बताएँ", bataenge: "बताएँगे", batayenge: "बताएँगे",
  samjhe: "समझे", samjha_: "समझा", samjhi: "समझी", samjho: "समझो", samjhiye: "समझिए", samjhenge: "समझेंगे", samajhte: "समझते",
  samjhte: "समझते", samajhna: "समझना", samjhna: "समझना", samjhaiye: "समझाइए", samjhayenge: "समझाएँगे", samjhaenge: "समझाएँगे",
  sikhayenge: "सिखाएँगे", sikhaenge: "सिखाएँगे", sikhaiye: "सिखाइए", sikhaiyega: "सिखाइएगा", sikhaayenge: "सिखाएँगे",
  boliye: "बोलिए", bolo: "बोलो", suniye: "सुनिए", suno: "सुनो", likhiye: "लिखिए", likho: "लिखो", giniye: "गिनिए", gino: "गिनो",
  jodiye: "जोड़िए", jodo: "जोड़ो", rakhiye: "रखिए", rakho: "रखो", chuniye: "चुनिए", chuno: "चुनो", dhoondhiye: "ढूँढिए",
  karke: "करके", karte: "करते", karta: "करता", karti: "करती", karna: "करना", karne: "करने", karni: "करनी", karenge: "करेंगे",
  karega: "करेगा", karegi: "करेगी", karoge: "करोगे", karogi: "करोगी", karunga: "करूँगा", karungi: "करूँगी", kar_: "कर",
};

/**
 * Spellings that are also English words, or two Hindi words. index.js converts them only when the sentence around them
 * is Hindi (>= 1 unambiguous Hindi neighbour within 2 words on either side, and more Hindi than English neighbours).
 */
export const AMBIGUOUS = {
  main: "मैं", do: "दो", par: "पर", is: "इस", us: "उस", me: "में", the: "थे", to: "तो", hi: "ही", bas: "बस", hum: "हम", ho: "हो",
  use: "उसे", sat: "सात", bees: "बीस", saath: "साथ", tera: "तेरा", jab: "जब", log: "लोग", pass: "पास", paas: "पास", so: "सो",
  are: "अरे", pal: "पल", man: "मन", mat_: "मत", sun: "सुन", lag: "लग", ban: "बन", bat: "बात", tan: "तन", jan: "जन", in: "इन",
  un: "उन", de: "दे", le: "ले", aa: "आ", ja: "जा", kar: "कर", sau: "सौ", pe_: "पे", bhar: "भर", gin: "गिन", rakh: "रख",
  laga: "लगा", mila: "मिला", bana: "बना", jo: "जो", na_: "ना", hindi: "हिंदी",
};

/**
 * Ambiguous spellings that are Hindi far more often than English in this lane (measured on the dev split: par, do, main,
 * hum, ho, hi, to, me, jab, is, us, kar...). They convert inside a Hindi sentence unless the words around them are an
 * English phrase (no Hindi word within 2 on either side and at least 3 English ones). The rest need a Hindi majority.
 */
export const AMBIG_STRONG = new Set(["main", "do", "par", "is", "us", "me", "the", "to", "hi", "bas", "hum", "ho", "jab", "kar", "bana",
  "gin", "log", "laga", "mila", "jo", "in", "un", "de", "le", "aa", "ja", "sau", "rakh", "bhar", "sat", "bees", "saath", "tera"]);

/** Names that are also Hindi words: capitalised mid-sentence they are the name, kept Latin. */
export const NAMES = new Set(["diya", "asha", "uma", "kiran", "pooja", "puja", "jyoti", "roshni", "khushi", "priya", "chanda", "sona",
  "moti", "raja", "rani", "veer", "aarti", "sapna", "neha", "deepak", "suraj", "chandni", "meera", "arjun", "kabir", "zoya", "aarav",
  "ishaan", "anaya", "meher", "golu", "bittu", "riya", "vihaan", "ravi", "dhruv", "kavya", "isha", "aditi", "taara", "tara"]);

/** English/loan words a Hinglish teacher says in English that the rule fallback would otherwise convert. */
export const KEEP = new Set([
  "okay", "ok", "hello", "hi", "bye", "sorry", "please", "thanks", "thank", "yes", "no", "super", "great", "nice", "good", "very",
  "cool", "wow", "oops", "hmm", "haha", "awesome", "perfect", "exactly", "right", "wrong", "correct", "done", "ready", "start",
  "stop", "next", "step", "steps", "answer", "question", "total", "number", "numbers", "line", "part", "parts", "half", "equal",
  "fraction", "fractions", "teacher", "student", "class", "lesson", "chapter", "page", "game", "level", "score", "point",
  "points", "example", "picture", "board", "whiteboard", "screen", "phone", "app", "video", "chat", "voice", "mic", "time",
  "minute", "minutes", "second", "seconds", "water", "plant", "plants", "animal", "animals", "food", "energy", "light",
  "sound", "magnet", "force", "area", "angle", "triangle", "circle", "square", "shape", "shapes", "plus", "minus", "into",
  "times", "divide", "multiply", "add", "subtract", "is", "am", "are", "the", "a", "an", "of", "to", "and", "or", "but", "in",
  "on", "at", "for", "with", "you", "your", "we", "our", "they", "it", "this", "that", "these", "those", "what", "how", "why",
  "when", "where", "which", "who", "can", "will", "would", "should", "could", "let", "lets", "let's", "try", "think", "tell",
  "say", "look", "see", "show", "find", "make", "take", "give", "go", "come", "do", "does", "did", "have", "has", "had",
  "be", "been", "was", "were", "so", "now", "then", "here", "there", "all", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "hundred", "thousand", "lakh_", "first", "last", "same", "different", "big", "small",
  "ai", "ncert", "cbse", "rbse", "school",
]);
// "lakh_" above is a placeholder that never matches (lakh is a Hindi number word handled in numbers.js).

/** Every inflected form of every VERBS / VERBS_V stem, lowercase Roman → Devanagari. */
export function verbForms() {
  const m = {};
  for (const [r, d] of Object.entries(VERBS)) {
    const R = r.replace(/_$/, "");
    for (const [s, ds] of Object.entries(C_END)) {
      const key = R + s.replace(/_$/, "");
      if (key.length < 3 && s === "") continue;
      m[key] ??= d + ds;
    }
  }
  for (const [r, d] of Object.entries(VERBS_V)) {
    const R = r.replace(/_$/, "");
    for (const [s, ds] of Object.entries(V_END)) {
      const key = R + s;
      if (key.length < 3) continue;
      m[key] ??= d + ds;
    }
  }
  return m;
}
