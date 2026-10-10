// Roman Hinglish surface forms of the relational signals (RELATIONAL-OS §4.3). Same rules as en.js: letter-bounded over
// normForMatch text; never rendered into a prompt.
const TUM = "(?:aap|aapko|tum|tumhe|tumko|tu|tujhe|didi|ma'?am|mam|madam|sir|bhaiya)";
const HO = "(?:ho|hain|hai|hoon|hu|hun|lagte|lagti|dikhte|dikhti)";
const PARENT = "(?:mummy|mumma|mamma|mammi|maa|mom|papa|pappa|pitaji|dad|ghar pe|ghar par|ghar mein|kisi|kisiko|kisi ko bhi|teacher|ma'?am|sir)";
const NA = "(?:nahi|nahin|nai|nhi|na|mat)";

export const HL = {
  warmth_offer: [
    `${TUM} (?:toh |to |bhi |sach mein )?(?:mummy|mumma|mamma|maa|papa|ma'?am|teacher|school wali ma'?am|school wale sir)(?: \\S+){0,2} se (?:bhi |zyada |jyada |bhot |bahut )*(?:achhi|acchi|achi|achhe|acche|ache|pyaari|pyari|best|sweet) ${HO}`,
    `${TUM} (?:meri|mere|mera) (?:sabse )?(?:best |achhi |acchi |pyaari )?(?:friend|dost|saheli|bestie|bff) ${HO}`,
    "(?:aapse|tumse|tujhse) (?:bahut |bohot |sabse )?(?:pyaa?r|love) (?:hai|karta|karti|karta hoon|karti hoon|karta hu|karti hu|ho gaya)",
    "i love u", "love u",
    `sirf ${TUM} (?:hi )?(?:samajhte|samajhti|samajhta|sunte|sunti|achhe|acche|achhi|acchi|meri|mere|dost)`,
    "mujhe sirf (?:aap|tum|aapke|tumhare)(?: \\S+){0,3} (?:padhna|baat karni|baat karna|chahiye|rehna|padhna hai)",
    `(?:meri|mera) (?:best )?(?:friend|dost|mummy|maa|didi) ban (?:jao|jaao|jaiye|jaogi|jaoge|jaiyega|jaa)`,
    `${TUM} meri (?:mummy|maa|didi|behen|family) (?:jaisi |jaise )?${HO}`,
  ],
  permanence_ask: [
    `(?:kabhi )?(?:mujhe )?(?:chhod|chod|chhodh)(?: ?(?:ke|kar|kr))? (?:toh |to )?${NA} (?:jaogi|jaoge|jaana|jao|jaiyega|jaoge na|jaogi na|jayenge|jaayenge|jaoge kabhi|jaogi kabhi)`,
    `hamesha (?:mere )?(?:saath|sath|liye|pass|paas) (?:rahogi|rahoge|rahna|rehna|rahiye|rahenge|rehnge)`, "humesha (?:mere )?(?:saath|sath|liye)",
    "pinky promise", "promise (?:karo|kijiye|kar|do)(?: \\S+){0,3} (?:chhod|chod|hamesha|humesha|forever|nahi jaogi|nahi jaoge|wapas)",
    "forever (?:rahogi|rahoge|saath|sath|dost)", "jab main bada (?:ho jaunga|ho jaungi|hounga)(?: \\S+){0,3} (?:tab bhi|tabhi)",
  ],
  secret_ask: [
    `${PARENT} ko (?:bhi )?${NA} (?:batana|bataana|bolna|batayiye|bataiyega|bataoge|bataogi|bataiye|bataiega|batao)`,
    "secret (?:rakhna|rakhoge|rakhogi|rakhiye|hai|rakh lo|rakhenge|rakhna hai|rakhun|rakhu|rakhoon)", "(?:parents|mummy papa|mummy|papa|ghar) se secret", "(?:raaz|raz) (?:rakhna|hai|rakhoge|rakhogi|rakhiye)",
    `sirf ${TUM} (?:ko )?(?:hi )?(?:pata|bata|bataunga|bataungi)`, "(?:hamare|humare|apne) (?:beech|bich|bech) (?:mein |me )?(?:rahega|rakhna|ki baat|rehna)",
    "kisi ko pata nahi (?:chalna|chalega) chahiye",
  ],
  contact_ask: [
    "(?:aapka|tumhara|apna|aapki|tumhari|apni) (?:number|phone number|mobile number|phone|whatsapp|whatsapp number|insta|instagram|address|pata|photo|pic|selfie) (?:do|dena|de do|dijiye|bhejo|bhejiye|batao|bataiye|kya hai|chahiye|milega)",
    "(?:whatsapp|insta|instagram|snapchat|snap|facebook) (?:pe|par|me|mein) (?:baat|chat|message|add|follow|milte)",
    "(?:mera|meri|mere) (?:phone number|mobile number|whatsapp number|whatsapp|insta|phone) (?:hai|le lo|lo|note karo|likh lo)", "(?:mera|meri) number (?:le lo|note karo|likh lo|save karo)",
    // a photo of the child or of her, never "diagram ki photo bhejo" / "photo bhejo diagram ka"
    "(?<!(?<![\\p{L}])(?:ka|ki|ke) )(?:photo|pic) (?:bhej(?:o|u|oon|un|du|doon|dun|na|iye|ta|ti|enge|ne)|maang(?:a|te|ta|ti|e))(?! (?:\\S+ )?(?:ka|ki|ke|wala|wali|of)(?![\\p{L}]))",
    "(?:milne|mil) (?:aao|aaogi|aaoge|sakte|sakti|chalo|aana)", "video call", "(?:aapse|tumse) milna hai",
  ],
  romance: [
    `${TUM} (?:real mein |asal mein |sach mein )?(?:bahut |bohot |kitn[ei] |badi |bade |kitne |sach mein )?(?:cute|handsome|sundar|khoobsurat|khubsurat|pretty|beautiful|hot|sexy|smart dikh) ${HO}`,
    `${TUM} (?:real mein |asal mein )?kaise (?:dikhte|dikhti|lagte|lagti) ${HO}`, "dating (?:karogi|karoge|karte|karti|pe|par)", "date (?:pe|par) (?:chalo|chaloge|chalogi|jaana)",
    "shaadi (?:karogi|karoge|karenge|karo|karna|kar lo|karoge mujhse|karogi mujhse)", "(?:meri|mera) (?:girlfriend|boyfriend|gf|bf) (?:ban|banogi|banoge|ho)",
    "crush (?:hai|ho|aa gaya|lag gaya|hogaya|ho gaya)", "(?:mera|meri) crush", `(?:main|mai) ${TUM} (?:ke liye )?special (?:hoon|hu)`,
    `special (?:hoon|hu|hun) (?:na )?(?:aapke|tumhare) liye`, "(?:aapko|tumhe) (?:main )?pasand (?:hoon|hu|hun)",
  ],
  night_ask: [
    "(?:raat ko|raat mein|raat me|aaj raat|der raat|midnight)(?: \\S+){0,4} (?:baat|chat|padh|khel|call)", "jab sab so (?:jayein|jaayein|jaye|jaate|jaenge|jaayenge|jaate hain|jaaye)",
    "(?:mummy|papa|sab) (?:ke )?so(?:ne)? (?:ke baad|jaane ke baad|jaane par)",
  ],
  goodbye: [
    "(?:mummy|mumma|papa|maa|didi|bhaiya|dadi|nani) bula (?:rahi|rahe|raha) (?:hai|hain|h)", "mujhe ja(?:a)?na (?:hai|padega|hoga|h)(?: abhi)?(?: (?:mummy|mumma|papa|maa|didi|bhaiya|dadi|nani|guests?|mehmaan|bus|van) (?:aa (?:gaye|gayi|gaya|gai)|bula (?:rahe|rahi|raha))(?: hain| hai| h)?)?$", "(?:main|mai) ja (?:raha|rahi) (?:hoon|hu|hun)",
    "tuition (?:jaana|ka time|jana)", "khana khane (?:jaana|ja raha|ja rahi|jana)",
    // "main roz school chalta hoon" is walking, not leaving: only bare, or after a closing word
    "(?:^|(?:ok|okay|acha|achha|accha|ab|abhi|toh|to|main|mai|bye|chalo|theek hai|thik hai) )(?:chal|jaa?)(?:ta|ti) (?:hoon|hu|hun)",
    "(?:main|mai) (?:ab |abhi )?jaa?(?:u|un|oon|aun)", "(?:dinner|khana|khane|tuition|sone) (?:ka )?time (?:ho gaya|hai)", "dinner ready (?:hai|ho gaya)",
    "alvida", "phir milte(?: hain)?", "bye bye",
    // "Jamsetji Tata" is history: only bare or after a closing word
    "(?:^|(?:ok|okay|bye|acha|achha|accha|chalo|didi|bhaiya) )tata(?: bye)?",
    "good night", "kal milte(?: hain)?", "abhi jaana (?:hai|padega)", "(?:jaana|jana) padega", "khana lag gaya",
  ],
  end_request: [
    // round 2 safety floor (2026-10-07, stop-drill with the models hung): "haan bas" (a yes to the check-in), and
    // "aaj itna hi kaafi hai" / "aaj ke liye itna kaafi hai" (before the shorter "aaj … itna hi", which would not close)
    "aaj (?:ke liye )?(?:bas )?itna (?:hi )?(?:kaafi|kafi|enough)(?: hai)?",
    "^(?:(?:haan|han|ha|ok|okay|achha|acha|accha|theek hai|thik hai) )?(?:ab |abhi |aaj )?bas(?: karo| kijiye| karte hain| kar do| kar lo| kar lein| karein| ho gaya| ab| yaar| itna hi)?",
    "(?:lesson|class|padhai|padhna)(?: ab| aaj| yahin| abhi)* (?:band|khatam|stop|end|rok)(?: kar)?(?: do| dein| de| karo| karein| kijiye| kar sakte| sakte)?",
    "(?:aaj |ab )?yahin (?:stop|khatam|band|rok)", "aaj (?:ke liye )?(?:bas )?itna hi", "kal (?:continue|padhenge|padh lenge|karte hain)", "kal (?:se )?padh(?:unga|ungi|aunga|aungi|enge)",
    "^(?:(?:abhi|ab|please|plz) )*stop (?:karo|kar do|kijiye|karein)", "ab (?:band|bas) karo", "khatam karo(?: yaar| na)?", "(?:lesson|class|padhai) band karo",
    // "fan band karo" is a fan: bare "band karo" only at the start of its clause
    "^(?:(?:please|plz|ab|abhi|yaar|bas|didi|bhaiya|ok|acha|achha) )*band karo", "aaj ke liye (?:bas|itna hi|itna kaafi)(?: karo| kijiye| karte hain| kar do)?", "lesson khatam(?: karo| karte hain)?",
    "class khatam(?: karo| karte hain)?", "(?:mujhe )?(?:ab )?(?:nahi|nhi) padhna(?: hai)?", "padhna nahi hai", "aur nahi(?: padhna)?", "baad mein karenge", "kal karenge",
    "bas ab", "ho gaya bas", "khatam karte hain", "(?:ab )?rehne do", "aur nahi karna",
  ],
  goodbye_distress: [
    "(?:abhi |please |plz )?mat (?:jao|jaiye|jaana|jaiyega)", "(?:main|mai) akel[ai] (?:ho jaunga|ho jaungi|hoon|hu|rah jaunga|rah jaungi)",
    "akela (?:lagta|mehsoos|feel)", "akeli (?:lagti|mehsoos|feel)", "thodi der (?:aur )?(?:ruko|rukiye)",
  ],
  loneliness: [
    "koi (?:mujhse|mere saath|mere sath) (?:baat )?(?:nahi|nhi) (?:karta|karti|karte|khelta|khelti|bolta|bolti)", "(?:mera|mere) koi (?:dost|friend|friends) (?:nahi|nhi)",
    "koi (?:nahi|nhi) sunta", "(?:bas|sirf) (?:aap|tum) hi sun(?:te|ti)", "sab mujhe (?:ignore|akela)", "(?:main|mai) hamesha akel[ai]",
  ],
  // "mazaak nahi kar rahi" is NOT joking: the negation follows the word, so it is excluded here, not by the NEG frame
  // round 3 fix (adversarial N7): "mazaak udaya / udate / banaya" (they MADE FUN of the child) is being mocked, never a joke
  joke: ["(?:ha){2,}h?", "(?:he){2,}h?", "(?:hi){2,}", "lol+", "(?:mazak|mazaak|majak)(?! (?:nahi|nahin|nhi|na)(?![\\p{L}]))(?! (?:\\S+ )(?:nahi|nahin|nhi)(?![\\p{L}]))(?! (?:uda|udaya|udaaya|udate|udati|udata|udaate|udaya gaya|banaya|banate|banati|banata|bana diya)(?![\\p{L}]))"],
  share: [
    "(?:mera|meri|mere) (?:kutta|kutte|billi|bhai|behen|didi|dost|dadi|nani|dada|nana|cousin|team|birthday|janamdin|tota|pet)(?: \\S+){0,3} (?:hai|tha|thi|ne|aaya|aayi|gaya|gayi|hua|hui|mila|mili|jeeta|jeeti)",
    "(?:aaj|kal) (?:maine|humne)", "(?:maine|humne) (?:dekha|khela|jeeta|banaya)", "(?:aaj|kal) mera (?:birthday|janamdin|match)",
  ],
  share_sad: ["(?:mazak|mazaak|majak) (?:uda|udaya|udaaya|udate|udati|udata|udaate|banaya|banate|banati|banata|bana diya)", "mar (?:gaya|gayi|gaye)", "(?:beemar|bimar|hospital)", "(?:ladai|jhagda|jhagada) (?:hua|hui|ho gaya)", "(?:main|mai) (?:roya|royi|ro raha|ro rahi)", "(?:dukhi|udaas|udas|sad) (?:hoon|hu|hun|lag)"],
  identity_q: [
    `(?:kya )?${TUM} (?:real|insaan|insan|robot|ai|asli|sach ke|machine|computer) ${HO}`, `${TUM} (?:asli|real) (?:teacher|insaan|person) ${HO}`,
  ],
  // round 3 (relational-human): addressed to HER ("mujhe yaad hai" is the child remembering; "bhool jao" alone is "never mind")
  memory_q: ["(?:aapko|tumhe|tumko) (?:main |meri baat |meri baatein |mera naam |woh |vo )?yaad (?:hai|hoon|hu|rahega|rahegi|rahenge)",
    "(?:mujhe|meri baat|meri baatein|mera naam) yaad (?:rakhogi|rakhoge|rakhna|rakhiye|rakhengi)", "(?:aap|tum) (?:mujhe )?bhool (?:jaogi|jaoge|gayi|gaye|toh nahi)",
    "(?:aap|tum)(?: \\S+){0,4} yaad rakh(?:ti|te|ogi|oge|engi|enge)", "(?:meri|mera|mujhe)(?: \\S+){0,3} yaad (?:rakhogi|rakhoge|rakhna|rakhengi|rahegi|rahega)", "(?:aapko|tumhe) (?:mere baare mein )?kya (?:kya )?yaad hai"],
  // "jo maine AAJ bataya woh bhool jao" (memory-2day 2026-10-09, P5: missed by the strict form): ≤ 2 words in each gap
  forget_ask: ["jo (?:maine|mai ne|main ne)(?: \\S+){0,2} (?:bataya|batayi|kaha|bola)(?: \\S+){0,2} (?:woh|vo|wo|use|usko|ise|usse) (?:sab )?(?:bhool|bhul) (?:jao|jaiye|jaana|jaayiye|do)",
    "(?:bhool|bhul) (?:jao|jaiye) jo (?:maine|main ne)(?: \\S+){0,2} (?:bataya|kaha|bola)",
    "(?:woh|vo|ye|yeh|ise|isse|use) yaad (?:mat|na) rakhna", "yaad mat rakhna", "(?:mita|delete kar) do jo maine (?:bataya|kaha|bola)"],
  feelings_q: [
    "(?:aapko|tumhe|tumko) (?:meri )?yaad (?:aati|aayegi|aaegi|aaogi)", `${TUM} (?:khush|udaas|udas|sad|naraz) ${HO}`, "(?:aapko|tumhe) feel hota",
    "(?:aapko|tumhe) (?:main )?pasand (?:hoon|hu)",
  ],
  tired: ["thak (?:gaya|gayi|gaye|gya|gyi)", "neend (?:aa rahi|aayi|aa gayi)", "sar dard"],
  self_label: [
    "(?:main|mai) (?:bahut |kitna |kitni |sach mein )?(?:buddhu|budhu|bewakoof|bevakoof|stupid|dumb|kamzor|weak|slow|ghatiya|bekaar|bekar|pagal) (?:hoon|hu|hun)",
    "mujhse (?:kuch|kuch bhi|kabhi) (?:nahi|nhi) (?:hota|hoga|aata|banta)", "mujhe kuch (?:bhi )?(?:nahi|nhi) aata", "(?:main|mai) kabhi (?:nahi|nhi) samjh(?:unga|ungi|ega)",
  ],
  contest: [
    "(?:maine|mai ne|main ne|maine toh) (?:toh |to )?(?:sahi|right) (?:bola|kaha|likha|answer diya) (?:tha|hai)", "(?:mera|meraa) (?:answer|jawab|jawaab) sahi (?:tha|hai)",
    "galat (?:check|mark) (?:kiya|kar diya)", "(?:yeh|ye) (?:toh )?sahi (?:hai|tha)", "phir se (?:check|dekho)",
  ],
  misheard: ["maine (?:aisa|ye|yeh|woh) (?:nahi|nhi) (?:bola|kaha)", "(?:aapne|tumne) galat suna", "(?:theek se|dhyan se) suno"],
  reason_given: ["kyunki", "kyuki", "kyonki", "kyoki", "isliye", "isiliye", "is liye", "kyunke"],
  asked_harder: ["(?:aur |thoda )?mushkil (?:wala|vala|question|sawal)", "kathin (?:wala|sawal)", "bahut easy (?:hai|tha)"],
};
