const SP = "/tmp/claude-0/-home-user-Taxila/efd71bc1-a51b-55f0-8b66-400684e849f8/scratchpad";
for (const root of ["pb", "pa"]) {
  const R = SP + "/" + root;
  const { kitFromFile } = await import(R + "/server/content/kits.js"); const { getTopic } = await import(R + "/server/content/curriculum.js");
  const { targetFor } = await import(R + "/server/director/classify.js"); const C = await import(R + "/server/grading/corroborate.js");
  const id = process.argv[2]; const K = kitFromFile(getTopic(id.match(/^c\d+-[a-z]+-ch\d+-t\d+/)[0])); const item = K.items.find((i) => i.id === id);
  const target = targetFor({ phase: "practice" }, K, item);
  console.log(root, JSON.stringify(C.completeForms(target)).slice(0, 200), "→", JSON.stringify(C.corroborate({ target, text: "Move karna, heat dena, light dena. Teen cheezen, theek hai?", result: { outcome: "correct", confidence: 0.9, source: "model", flags: {} } }).corroboration));
}
