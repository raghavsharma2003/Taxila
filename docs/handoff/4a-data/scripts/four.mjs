import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { fadeItem, fadeStepIndex } from "/home/user/Taxila/server/director/fading.js";
for (const t of ["c1-maths-ch05-t01", "c1-maths-ch05-t02", "c1-maths-ch06-t02", "c5-maths-ch09-t01"]) {
  const K = kitFromFile(getTopic(t)); const f = fadeItem(K, {});
  console.log(t, f ? `${f.id} key ${JSON.stringify(f.answer)}` : `no faded step (index ${fadeStepIndex(K.workedExample)})`);
}
