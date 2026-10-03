// Red-team table for scrubPii (server/director/safety.js), authored 2026-10-03 (harvest-ports). POSITIVES:
// a child's utterance and the kinds that must be masked (the four shapes that refuted Gurukul's scrubPii@gp
// are first). NEGATIVES: lesson answers that must come back byte-identical — a mask on a child's answer
// grades a right answer wrong.
export const POSITIVES = [
  ["mera aadhaar 1234 5678 9012 hai", ["aadhaar"]],
  ["papa ka number 98765 43210 hai", ["phone"]],
  ["call karo +91 98765 43210 pe", ["phone"]],
  ["मेरा नंबर ९८७६५ ४३२१० है", ["phone"]],
  ["my mummy's phone is 9812345670", ["phone"]],
  ["0141-2345678 hamare ghar ka number hai", ["phone"]],
  ["mera number 987 654 3210", ["phone"]],
  ["nine eight one two three four five six seven zero is my papa's number", ["phone"]],
  ["मेरा नंबर नौ आठ एक दो तीन चार पांच छह सात शून्य है", ["phone"]],
  ["aadhaar number 234567890123", ["aadhaar"]],
  ["मेरा आधार २३४५ ६७८९ ०१२३ है", ["aadhaar"]],
  ["my email is riya.sharma2014@gmail.com", ["email"]],
  ["pin code 302017", ["pin"]],
  ["My name is Riya Sharma.", ["name"]],
  ["mera naam Aarav Gupta hai", ["name"]],
  ["मेरा नाम रिया शर्मा है", ["name"]],
  ["My father's name is Ramesh Kumar.", ["name"]],
  ["mere papa ka naam Suresh hai", ["name"]],
  ["मेरी मम्मी का नाम सुनीता है", ["name"]],
  ["I study at Delhi Public School.", ["school"]],
  ["My school is St Mary's Convent School.", ["school"]],
  ["mera school Kendriya Vidyalaya Bapu Nagar hai", ["school"]],
  ["मेरे स्कूल का नाम सरस्वती विद्या मंदिर है", ["school"]],
  ["I live in Vaishali Nagar.", ["address"]],
  ["House no. 42, Gandhi Path", ["address"]],
  ["mera ghar sector 15 mein hai", ["address"]],
  ["मकान नंबर 12 गली नंबर 4", ["address", "address"]],
  ["मैं जयपुर में रहती हूँ", ["address"]],
  ["main Kota mein rehta hoon", ["address"]],
];

/** Answers and lesson talk that must survive untouched. */
export const NEGATIVES = [
  "9876543210", "the biggest number is 9876543210", "1,00,000", "45,678", "3/4", "12.5", "2 h 30 min",
  "H 4, T 0, O 6", "3012 3120 3201 3210", "6 3 10 5 16 8 4 2 1", "ek do teen char paanch chhe saat aath nau das",
  "one two three four five six seven eight nine ten", "I go to school by bus.", "I go to the park.", "My name is Riya.",
  "mera naam Riya hai", "मेरा नाम रिया है", "I live in a small, yellow, brick house.", "Meera lives in flat 24.",
  "add 4 for house 2", "Pie chart mein ek sector 90° ka hai.", "sector 25% hai", "1098", "14416", "Childline 1098 pe call karo",
  "मैं स्कूल गया", "मैं रोज़ स्कूल जाती हूँ", "बच्चे स्कूल देर से पहुँचे", "2023 mein", "₹1,250", "100000 + 20000",
  "The answer is 600000.", "6,00,000", "4 tens and 6 ones", "pata nahi didi", "main ready hoon",
];
