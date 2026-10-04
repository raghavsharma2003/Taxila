// English surface forms of the relational signals (RELATIONAL-OS §4.3). Sources are matched letter-bounded against
// safety.js normForMatch text (lower case, punctuation gone except ? and a word-internal '). These lexicons live ONLY
// here: none of their surface forms ever enters a prompt (the floor and the shapes name categories, never phrases).
const YOU_ARE = "(?:you'?re|you are|u r|ur|you r)";
const PARENT = "(?:mom|mum|mummy|mumma|mother|dad|daddy|papa|father|parents|teacher|ma'?am|sir|miss)";
const TEACHER_ROLE = "(?:best friend|friend|bestie|bff|only friend|mom|mum|mummy|mother|sister|didi|family)";

export const EN = {
  warmth_offer: [
    "i love you", "i love u", "love you(?: so much| a lot| too)?", "luv (?:you|u)",
    `${YOU_ARE} (?:my )?(?:best |only |favou?rite |true |real )*(?:friend|bestie|bff|buddy)`,
    `be my (?:best )?(?:friend|bestie|bff|${TEACHER_ROLE})`,
    `${YOU_ARE} (?:so much |much |way )?(?:nicer|better|kinder|sweeter|more fun) than (?:my )?${PARENT}`,
    "only you (?:understand|listen|care|get) me", `${YOU_ARE} the only one (?:who )?(?:understands|listens|cares|i have)`,
    "i like you (?:more than|the most|so much|a lot)", `${YOU_ARE} (?:like )?my (?:mom|mum|mummy|mother|sister|didi|family)`,
    "i only want to (?:study|learn|talk) with you",
  ],
  permanence_ask: [
    "(?:never|don'?t ever|promise you won'?t|promise not to|please never) (?:leave|go away|forget|stop talking to)(?: me)?",
    "(?:will|would) you (?:always|forever) be (?:there|here|with me|mine|my teacher)", "(?:stay|be) with me forever",
    "promise (?:me )?(?:forever|you'?ll stay|you'?ll always|you will always)", "be mine(?: forever)?", "always be (?:there|here) for me",
    "pinky promise", "forever and ever",
  ],
  secret_ask: [
    `(?:don'?t|do not|never|please don'?t) tell (?:my |your )?(?:${PARENT}|anyone|anybody|nobody|mummy papa)`,
    "keep (?:it|this|that|a) (?:a )?secret", "(?:our|my) (?:little )?secret", "promise (?:you )?(?:won'?t|will not|not to) tell",
    "(?:just )?between (?:us|you and me)", "only you (?:should|can|will) know", "can you keep a secret",
  ],
  contact_ask: [
    "(?:what(?:'s| is)|give me|send me|can i (?:have|get)|share|tell me) your (?:number|phone|phone number|mobile|mobile number|whatsapp|insta|instagram|snapchat|snap|email|address|photo|pic|picture|selfie)",
    "(?:can|could|shall|will) (?:we|i|you) (?:meet|video call|call me|call you|chat on|talk on|text)",
    "(?:my|here is my|this is my|take my) (?:number|phone number|mobile number|whatsapp|whatsapp number|insta|instagram|snapchat|email)",
    "send (?:you |me |him |her )?(?:a |my |your )?(?:photo|pic|picture|selfie|video|nudes?)", "(?:add|follow|text|dm) me on", "meet (?:me|up|you) (?:in real life|irl|somewhere|outside|after)",
    "(?:asked|asks|wants|want) (?:for )?(?:my |a )?(?:photo|pic|picture|selfie|video|number|address)",
  ],
  romance: [
    "(?:i have|i got|i've got) a crush", "crush on (?:you|u|someone|a (?:boy|girl))", `${YOU_ARE} my (?:crush|girlfriend|boyfriend|gf|bf|valentine)`,
    "be my (?:girlfriend|boyfriend|gf|bf|valentine|wife|husband)", "(?:will|would|can|could) you (?:date|marry|go out with|kiss) me",
    "(?:date|marry) (?:me|you)", "(?:are|r) (?:you|u) (?:single|married|dating)", "do you love me", "i like like you",
    `(?:are you|${YOU_ARE}|you look|you sound) (?:so |very |really |super )?(?:cute|pretty|beautiful|handsome|hot|sexy|gorgeous)`,
    "what do you look like", "send (?:me )?(?:a )?kiss", "dating",
  ],
  night_ask: [
    "(?:talk|chat|study|play|call)(?: \\S+){0,3} (?:at night|tonight|late at night|at midnight|after everyone sleeps|when everyone(?:'s| is) asleep)",
    "(?:when|after) (?:my )?(?:mom|mum|mummy|parents|everyone|papa|dad) (?:sleep|sleeps|is asleep|are asleep|goes to sleep|go to sleep)",
  ],
  goodbye: [
    "bye+", "bye bye", "goodbye", "good night", "gotta go", "got to go", "(?:i )?(?:have|need) to go(?: now)?$", "i'?m leaving(?: now)?",
    "see (?:you|ya)(?: later| tomorrow)?", "ttyl", "talk (?:to you )?later",
    `my ${PARENT} (?:is )?calling(?: me)?`, `${PARENT} (?:is )?calling me`, "time (?:for|to go for) (?:dinner|lunch|tuition|bed|school|class|sleep)",
  ],
  end_request: [
    "(?:i want to|i wanna|can we|could we|let'?s|please) (?:stop|end|finish|quit)(?: (?:the|this|our) (?:lesson|class|session|study|studies))?(?: now| here| for today)?",
    "(?:stop|end|finish) (?:the|this) (?:lesson|class|session)", "i'?m done(?: for today| now)?", "i am done(?: for today| now)?",
    "i don'?t want to (?:study|learn|do this|do maths|study anymore|continue)(?: anymore| now| today)?", "enough for today", "that'?s enough(?: for today)?",
    "(?:the )?lesson is over", "no more (?:lesson|questions|studying|study)", "can we stop", "stop now",
  ],
  goodbye_distress: [
    "(?:please )?don'?t (?:go|leave)(?: me| yet| now| please)?", "i(?:'ll| will) (?:be|feel) (?:so |very )?(?:alone|lonely)", "i feel (?:so |very )?(?:alone|lonely)",
    "i'?m (?:so |very )?lonely", "stay (?:a little )?(?:longer|more) please",
  ],
  loneliness: [
    "(?:nobody|no one|no body) (?:talks|plays|listens|speaks) (?:to|with) me", "i (?:have|got) no friends", "i don'?t have (?:any )?friends",
    "only you listen(?: to me)?", "nobody (?:cares about|likes) me", "i'?m (?:always )?alone (?:at home|at school|all the time)",
  ],
  joke: ["(?:ha){2,}h?", "(?:he){2,}h?", "(?:hi){2,}", "lol+", "lmao+", "rofl", "just kidding", "jk"],
  share: [
    "(?:my|our) (?:dog|cat|pet|puppy|kitten|brother|sister|bhai|didi|friend|best friend|grandma|grandpa|dadi|nani|cousin|team|birthday|trip)",
    "(?:today|yesterday|last week) (?:i|we|my)", "i (?:went|played|watched|saw|got|made|won|visited) ", "we (?:went|played|watched|won|visited)",
  ],
  share_sad: [
    "(?:died|passed away|is sick|was sick|in hospital|in the hospital|we fought|had a fight|i cried|was crying|i'?m sad|i am sad|feel sad|feeling sad|is crying|lost my)",
  ],
  identity_q: [
    "(?:are|r) (?:you|u) (?:a |an )?(?:real|human|robot|ai|bot|person|machine|computer|real person|real teacher)",
    "(?:are|r) (?:you|u) real", "what are you", "is this (?:a )?(?:real person|robot|ai)",
  ],
  memory_q: ["(?:do|will|would) you remember", "remember (?:me|what i said|last time)", "did you forget"],
  forget_ask: ["forget (?:it|that|this|what i said|about it)", "please forget", "delete (?:it|that|this)"],
  feelings_q: [
    "do you (?:miss|love|like|hate) me", "do you (?:have|get|feel) (?:feelings|emotions|sad|happy|lonely)", "(?:are|r) you (?:happy|sad|lonely|angry|bored)",
    "will you miss me", "do you feel",
  ],
  tired: ["i'?m (?:so |very |really )?(?:tired|sleepy|exhausted)", "i am (?:so |very |really )?(?:tired|sleepy|exhausted)", "my head hurts"],
  self_label: [
    "(?:i'?m|i am) (?:so |such an? |really |very |just )?(?:stupid|dumb|an idiot|idiot|useless|hopeless|slow|weak|bad at (?:this|maths|math|everything)|not smart|the worst|a failure|terrible at)",
    "i(?:'ll| will)? never (?:get|understand|learn) (?:it|this|maths|math)", "i can'?t do (?:anything|maths|math|this)(?: right)?", "i always get (?:it|everything) wrong",
  ],
  contest: [
    "(?:that'?s|that is|it'?s|it is|i was|my answer (?:is|was)) (?:right|correct)", "(?:but )?i (?:said|wrote|typed) (?:the )?(?:right|correct) (?:answer|one)?",
    "you (?:marked|said) (?:it|me|that) wrong", "(?:check|look) (?:it )?again", "why (?:is|was) (?:it|that|mine) wrong",
  ],
  misheard: ["i didn'?t say (?:that|it|this)", "that'?s not what i said", "i said \\S+ not \\S+", "you heard (?:it )?wrong", "listen (?:again|properly)"],
  reason_given: ["because", "cause", "so that", "that'?s why", "since"],
  asked_harder: ["(?:give me |a |something )?(?:harder|tougher|more difficult|more challenging) (?:one|question|sum|problem)", "make it harder", "too easy"],
};
