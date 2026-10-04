// L1 cant_recall vs not_known (the IDK split, steal 8). "pata nahi" (never learned) is affect.js DONT_KNOW → not_known;
// these say "I knew it and cannot bring it back" → cant_recall. Negated hits ("nahi bhoola") are excluded by the caller.
import { compile } from "../text.js";

export const CANT_RECALL = compile([
  "bhool gaya", "bhool gayi", "bhool gaye", "bhul gaya", "bhul gayi", "bhool gya", "bhul gya", "yaad nahi", "yaad nahin",
  "yaad nahi aa raha", "yaad nahi aa rahi", "yaad tha", "yaad thi", "dimag se nikal", "zubaan pe hai", "zuban pe hai",
  "भूल गया", "भूल गई", "भूल गयी", "याद नहीं", "याद था",
  "forgot", "i forgot", "forget", "cant remember", "cannot remember", "dont remember", "do not remember", "on the tip of my tongue",
  "cant recall",
]);
