const { visualAskOf } = await import("/home/user/Taxila/server/director/requests.js");
const { classifyFast } = await import("/home/user/Taxila/server/director/classify.js").catch(() => ({}));
for (const t of ["Picture dikhao", "screen pe kuch bhi nahi dikh raha", "triangle ka drawing nahi dikhaya", "triangle ka drawing dikhao"]) {
  console.log(JSON.stringify(t), "->", JSON.stringify(visualAskOf(t)));
}
const { getTopic } = await import("/home/user/Taxila/server/content/curriculum.js");
const tp = getTopic("c5-maths-ch02-t01"); console.log("topic", tp?.title, tp?.subject);
