# F Learning → E App, 001: "your class is here" on the Kaksha map (round 7 F item 2)

`GET /api/child/map` chapters now carry `school: boolean` beside `here`: true on the chapter the parent said school is on
(Progress → School, or set-up's maths question). `here` is still the chapter of the plan's next lesson.

Ask: on `src/ui-v3/kaksha/screens/KakshaWorld.tsx` (and the Garden/Sky map), mark `school` chapters with a quiet
"Your class is here" tag. When `school` and `here` are the same chapter, one tag is enough ("Your class is here").
Copy (yours, src/copy/en.ts): `map.schoolHere = "Your class is here"`.

The type addition for `ChildMapResponse` chapters (`school?: boolean`) goes to Brain's shared/contracts.ts with this note.
