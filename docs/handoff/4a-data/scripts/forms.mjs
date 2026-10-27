import { kitFromFile } from "/home/user/Taxila/server/content/kits.js";
import { getTopic } from "/home/user/Taxila/server/content/curriculum.js";
import { targetFor } from "/home/user/Taxila/server/director/classify.js";
import * as C from "/home/user/Taxila/server/grading/corroborate.js";
const K = kitFromFile(getTopic("c3-evs-ch07-t02"));
for (const id of ["i13", "i02", "i01"]) {
  const item = K.items.find((x) => x.id.endsWith("-" + id));
  const target = targetFor({}, K, item);
  console.log(id, "also:", JSON.stringify(target.also), "labels:", JSON.stringify(target.alsoLabel), "parts:", JSON.stringify(target.parts));
  console.log("   forms:", JSON.stringify(C.completeForms ? C.completeForms(target) : "n/a"));
}
