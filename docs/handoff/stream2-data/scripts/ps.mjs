const { pictureSubjectOf } = await import("/home/user/Taxila/server/studio/request.js");
const { drawableSubject } = await import("/home/user/Taxila/server/director/state.js");
for (const line of ["Riya, triangle teen lines aur teen corners wala shape hai; triangle banta hua dikh raha hai. Aap copy mein teen corners banaiye—kitne bane?"])
  console.log(JSON.stringify(pictureSubjectOf(line)), drawableSubject(pictureSubjectOf(line)));
