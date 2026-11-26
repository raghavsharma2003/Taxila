// One reply-model stub for the driven walks (round d38 builder L: the leak check of seed 20261126). A walk built inside describe() is
// not awaited by its file's import, so where files share a process (node's test isolation off: the leak check, `npm test`) every file's
// walks run side by side. Each walk used to save replyDeps.chat, stub it and put the saved one back at its end: a walk that ended put
// the real model back under another file's walk still running (r8-d38-055c1 under 055c3; r8-d37-054c under 054d's stub set once at
// import), and that walk's next turn ended on the fixed fallback line. Here the holds are counted: the first saves what is there, the
// last release puts it back. Every walk file says the same stub line, so one stub serves them all.
import { replyDeps } from "../server/brain/say.js";

export const STUB = "Achha, chalo isko saath mein dekhte hain. Ek baar phir se batao?";
const stub = async () => ({ text: STUB });
let held = 0;
let saved = null;

/** Stub the reply model until the returned release is called (once; a second call is a no-op). */
export function holdReplyStub() {
  if (held++ === 0) saved = { chat: replyDeps.chat, chatStream: replyDeps.chatStream };
  replyDeps.chat = stub; replyDeps.chatStream = stub;
  let freed = false;
  return () => {
    if (freed) return;
    freed = true;
    if (--held === 0) { replyDeps.chat = saved.chat; replyDeps.chatStream = saved.chatStream; saved = null; }
  };
}
