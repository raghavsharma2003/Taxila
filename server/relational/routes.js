// Round 3, stream relational-human: the parent's view of what the teacher remembers (RELATIONAL-OS §10.4, ROS-11:
// "parents see everything she remembers"). The memory consent's own copy promises it ("You can see and delete each one",
// server/routes/parent.js CONSENT_SPEECH.memory) and, before this, no route listed or deleted a single memory.
//
//   GET    /api/parent/memory?childId=   inside the unlocked Parent corner (requireParentChild)
//     → { keeps, consents, remembered: [{ id, kind, text, at, topic }], fromLastLesson: [{ id, text }], interests,
//         used: [{ callback, at, topic }], forgotten: [{ at }] }
//   DELETE /api/parent/memory { childId, id } → { deleted }   (id "all": every memory row of the child)
//
// Plain parent copy, rendered here from closed values (never model prose a parent reads: reports-no-interest-line), in
// the corner's language (English today, like the rest of the corner's cards).
import { q, one } from "../db.js";
import { send, bad, need } from "../http.js";
import { requireParentChild } from "../routes/parent.js";
import { getKit, getTopic } from "../content/index.js";
import { callbackCandidates, keepsOf } from "./memory.js";

const KEEPS_COPY = {
  memory_keeps_learning_and_likes: "Between lessons she keeps your child's learning (what was hard, what came good) and the interests you chose. You can see and delete each memory here.",
  memory_keeps_learning: "Between lessons she keeps only your child's learning (what was hard, what came good). Nothing personal is kept.",
  memory_keeps_nothing: "She keeps nothing between lessons: each lesson starts fresh.",
};

/** A parent-readable line for a callback candidate (closed values only). */
export function parentLineOf(c) {
  const parts = String(c.fragment ?? "").split(" · ").map((x) => x.trim()).filter(Boolean);
  if (c.id.startsWith("L:retry:")) return `Last lesson, ${parts[1]} took a few tries, then your child got it right on their own.`;
  if (c.id.startsWith("L:explained:")) return `Last lesson, your child ${parts[1]}.`;
  if (c.id.startsWith("L:again:")) return `Last lesson, ${parts[1]} was still being learnt; she may give it one more go.`;
  if (c.id.startsWith("L:topic:")) return `Last lesson was about ${parts[1]}.`;
  if (c.id.startsWith("P:int:")) return `An interest you chose: ${parts[1]} (used as the setting of an example).`;
  if (c.id.startsWith("W:mem:")) return `From an earlier lesson: ${parts.slice(1).join(" · ")}.`;
  return parts.join(" · ");
}

async function getMemory(req, res) {
  const childId = new URL(req.url || "/", "http://x").searchParams.get("childId");
  const { guardian, child } = await requireParentChild(req, childId);
  const consent = await q(`select distinct on (purpose) purpose, granted from consent where guardian_id = $1 and (child_id = $2 or child_id is null)
      and purpose in ('learning_profile', 'memory') order by purpose, created_at desc`, [guardian.id, child.id]).catch(() => []);
  const granted = (p) => !!consent.find((r) => r.purpose === p)?.granted;
  const allow = { learning: granted("learning_profile") && child.legal_mode !== "M0", memory: granted("memory") };
  const [rows, last, used, forgotten] = await Promise.all([
    q(`select m.id, m.kind, m.text, m.created_at, l.topic_id from memory m left join turn t on t.id = m.source_turn left join lesson l on l.id = t.lesson_id
       where m.child_id = $1 and m.superseded_by is null order by m.created_at desc`, [child.id]).catch(() => []),
    one("select id, topic_id from lesson where child_id = $1 and ended_at is not null order by ended_at desc limit 1", [child.id]).catch(() => null),
    q(`select t.meta->>'callback' as callback, t.at, l.topic_id from turn t join lesson l on l.id = t.lesson_id
       where l.child_id = $1 and t.speaker = 'teacher' and t.meta ? 'callback' order by t.at desc limit 10`, [child.id]).catch(() => []),
    q("select at from relational_note where child_id = $1 and kind = 'memory_forgotten' order by at desc limit 10", [child.id]).catch(() => []),
  ]);
  // what she may bring back next lesson: the same builder the lesson uses (seam.js memoryRecord), from the same rows
  let fromLast = [];
  if (allow.learning && last?.id) {
    const ev = await q(`select skill_ids[1] as skill,
        count(*) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome <> 0 and not (cls = 'item.open' and outcome = 6))::int as wrong,
        count(*) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome = 0 and not pre_attempt_help and entry_rung = 0)::int as unaided,
        min(seq) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome <> 0 and not (cls = 'item.open' and outcome = 6)) as first_wrong,
        max(seq) filter (where (cls = 'item.open' or cls like 'item.mcq%') and outcome = 0 and not pre_attempt_help and entry_rung = 0) as last_unaided,
        bool_or(cls = 'probe.teachback' and outcome = 0) as explained
      from kt_evidence where child_id = $1 and session_id = $2 and not contaminated group by 1 order by 1`, [child.id, String(last.id)]).catch(() => []);
    const kit = await getKit(last.topic_id, { generate: false }).catch(() => null);
    const titleOf = (id) => kit?.skills?.find((k) => k.id === id)?.title ?? null;
    const lastLesson = { lessonId: String(last.id), topicId: String(last.topic_id), topicTitle: getTopic(last.topic_id)?.title ?? "",
      skills: ev.map((r) => ({ skillId: r.skill, title: titleOf(r.skill), wrong: r.wrong, unaided: r.unaided, explained: !!r.explained,
        unaidedAfterWrong: r.wrong > 0 && r.last_unaided != null && Number(r.last_unaided) > Number(r.first_wrong) })).filter((x) => x.title) };
    fromLast = callbackCandidates({ last: lastLesson, allow: { learning: true, memory: false } });
  }
  const interests = allow.memory && Array.isArray(child.interests) ? child.interests.map(String) : [];
  send(res, 200, {
    keeps: KEEPS_COPY[keepsOf(allow)],
    consents: { learning_profile: granted("learning_profile"), memory: granted("memory") },
    remembered: rows.map((r) => ({ id: String(r.id), kind: r.kind, text: r.text, at: r.created_at, topic: r.topic_id ? getTopic(r.topic_id)?.title ?? null : null })),
    fromLastLesson: fromLast.map((c) => ({ id: c.id, text: parentLineOf(c) })),
    interests,
    used: used.map((u) => ({ callback: u.callback, what: u.callback?.split(":")[0] === "P" ? "an interest you chose" : u.callback?.startsWith("W:") ? "a memory" : "last lesson's learning",
      at: u.at, topic: getTopic(u.topic_id)?.title ?? null })),
    forgotten: forgotten.map((f) => ({ at: f.at })),
  });
}

async function deleteMemory(req, res, body) {
  const { guardian, child } = await requireParentChild(req, need(body, "childId").childId);
  const id = String(body?.id ?? "");
  if (id !== "all" && !/^\d{1,18}$/.test(id)) throw bad("invalid memory id");
  const rows = id === "all"
    ? await q("delete from memory where child_id = $1 returning id", [child.id])
    : await q("delete from memory where child_id = $1 and id = $2 returning id", [child.id, id]);
  await q("insert into audit(guardian_id, action, detail) values ($1, 'memory_deleted', $2)", [guardian.id, { childId: child.id, count: rows.length, all: id === "all" }]).catch(() => {});
  send(res, 200, { deleted: rows.length });
}

export const routes = {
  "GET /api/parent/memory": getMemory,
  "DELETE /api/parent/memory": deleteMemory,
};
