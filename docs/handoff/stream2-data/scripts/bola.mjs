const { visualAskOf, requestOf, freeSubjectOf } = await import("/home/user/Taxila/server/director/requests.js");
for (const t of ["maine bola triangle ka drawing dikhao", "maine bola tha drawing dikhao", "aapne bola tha picture dikhaogi", "maine bola picture dikhao", "bola na drawing dikhao", "aapne bola triangle dikhaogi par nahi dikhaya", "maine kaha drawing dikhao", "bola tha na triangle banao", "triangle bola tha dikhao"])
  console.log(JSON.stringify(t), JSON.stringify(visualAskOf(t)), JSON.stringify(requestOf(t)?.subject ?? null), JSON.stringify(freeSubjectOf(t)));
