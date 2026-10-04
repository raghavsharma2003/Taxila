// W0: the harness itself works end to end against the target (signup → child → consent → hours → a 2-turn text
// lesson → end → account deleted). Not a product acceptance test; it proves tests/prod/lib.mjs for every stream.
import { withTestAccount, runLesson, ok, done } from "./lib.mjs";

await withTestAccount(async ({ api, child }) => {
  const { start, turns, end } = await runLesson(api, child.id, { mode: "text", lines: ["haan, main ready hoon", "mujhe nahi pata, thoda samjhao"] });
  ok(start.status === 201 && !!start.lessonId, `lesson start 201 (${start.ms} ms, topic ${start.topic?.id})`);
  ok(typeof start.teacherOpening === "string" && start.teacherOpening.length > 0, "text lane: a teacher opening came back");
  ok(turns.length > 0 && turns.every((t) => !!t.move?.kind), `${turns.length} turn(s) answered with a move (${turns.map((t) => t.move?.kind).join(", ")})`);
  ok(end?.status === 200, `lesson end 200 (${end?.ms} ms)`);
}, { tag: "w0" });
done();
