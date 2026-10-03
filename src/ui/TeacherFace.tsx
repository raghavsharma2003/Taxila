// Compatibility shim (PRODUCT-DESIGN-V2 §8). The flat clip-art face that lived here (audit #4, #15: a third,
// female teacher on landing and onboarding) is retired: this now renders the ONE teacher from the character
// record, as the D plate of the M0 rig (no WebGL on adult surfaces, deterministic and cheap), with the
// "{T} · AI teacher" label. Pass `teacherId` (and the child's `band`) so the parent meets the actual teacher.
import { Teacher } from "./teacher/Teacher.tsx";

export function TeacherFace({ size = 200, teacherId, band = "b3", label = true }:
  { size?: number; speaking?: boolean; title?: string; teacherId?: string | null; band?: string; label?: boolean }) {
  return (
    <div className="teacher-face-compat" style={{ width: size, height: size + (label ? 28 : 0) }}>
      <Teacher teacherId={teacherId} band={band} form="plate" floor="idle" label={label ? "below" : "none"} lights="down" />
    </div>
  );
}
