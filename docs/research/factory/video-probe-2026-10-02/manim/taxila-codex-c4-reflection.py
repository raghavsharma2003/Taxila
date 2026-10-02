from manim import *

NARRATION = [
    ("This is a plane mirror.", 4),
    ("A light ray hits it.", 5),
    ("Draw the normal here.", 4),
    ("Incidence angle is forty degrees.", 6),
    ("Reflection angle is also forty.", 6),
    ("Measure from normal, not mirror.", 5),
]


class Explainer(Scene):
    def construct(self):
        fs = 36

        # Core geometry
        hit_point = np.array([1.0, 0.0, 0.0])

        mirror = Line(
            np.array([1.0, -2.4, 0.0]),
            np.array([1.0, 2.4, 0.0]),
            color=LIGHT_GRAY,
            stroke_width=10,
        )
        mirror_text = Text("Plane mirror", font_size=fs).move_to([2.8, 2.9, 0])

        incident_start = np.array([-2.06, 2.57, 0.0])   # ~40° to normal
        reflected_end = np.array([-2.06, -2.57, 0.0])   # symmetric reflection

        incident_ray = Arrow(
            incident_start, hit_point, buff=0, color=YELLOW, stroke_width=8, max_tip_length_to_length_ratio=0.08
        )
        incident_label = Text("Incident ray", font_size=fs).move_to([-4.4, 2.2, 0])

        normal = DashedLine(
            np.array([-3.8, 0.0, 0.0]),
            np.array([5.2, 0.0, 0.0]),
            color=BLUE,
            stroke_width=6,
        )
        normal_label = Text("Normal", font_size=fs).move_to([4.8, 0.6, 0])

        inc_arc = Arc(
            radius=0.9,
            start_angle=PI,
            angle=-40 * DEGREES,
            arc_center=hit_point,
            color=GREEN,
            stroke_width=7,
        )
        inc_angle_text = Text("Incidence 40°", font_size=fs).move_to([-0.25, 1.25, 0])

        reflected_ray = Arrow(
            hit_point, reflected_end, buff=0, color=YELLOW, stroke_width=8, max_tip_length_to_length_ratio=0.08
        )
        reflected_label = Text("Reflected ray", font_size=fs).move_to([-4.6, -2.2, 0])

        ref_arc = Arc(
            radius=0.9,
            start_angle=PI,
            angle=40 * DEGREES,
            arc_center=hit_point,
            color=GREEN,
            stroke_width=7,
        )
        ref_angle_text = Text("Reflection 40°", font_size=fs).move_to([-0.25, -1.25, 0])
        equal_text = Text("Equal angles", font_size=fs).move_to([0.0, 3.2, 0])

        wrong_arc = Arc(
            radius=1.25,
            start_angle=PI / 2,
            angle=50 * DEGREES,
            arc_center=hit_point,
            color=RED,
            stroke_width=7,
        )
        wrong_label = Text("Wrong: from mirror", font_size=fs).move_to([3.6, 1.5, 0])
        cross_mark = Cross(wrong_label, stroke_color=RED, stroke_width=8)

        right_label = Text("Right: from normal", font_size=fs).move_to([3.6, -1.5, 0])

        # Segment 1: 4 seconds
        self.play(Create(mirror), FadeIn(mirror_text), run_time=3)
        self.wait(1)

        # Segment 2: 5 seconds
        self.play(Create(incident_ray), FadeIn(incident_label), run_time=3)
        self.wait(2)

        # Segment 3: 4 seconds
        self.play(Create(normal), FadeIn(normal_label), run_time=3)
        self.wait(1)

        # Segment 4: 6 seconds
        self.play(Create(inc_arc), FadeIn(inc_angle_text), run_time=3)
        self.play(Indicate(inc_arc, color=YELLOW), run_time=1.5)
        self.wait(1.5)

        # Segment 5: 6 seconds
        self.play(Create(reflected_ray), FadeIn(reflected_label), run_time=2.5)
        self.play(Create(ref_arc), FadeIn(ref_angle_text), FadeIn(equal_text), run_time=2.5)
        self.wait(1)

        # Segment 6: 5 seconds
        self.play(Create(wrong_arc), FadeIn(wrong_label), run_time=1.8)
        self.play(Create(cross_mark), run_time=1.0)
        self.play(
            FadeOut(wrong_arc),
            FadeOut(wrong_label),
            FadeOut(cross_mark),
            FadeIn(right_label),
            Indicate(inc_arc, color=GREEN),
            Indicate(ref_arc, color=GREEN),
            run_time=1.7,
        )
        self.wait(0.5)
