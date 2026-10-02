from manim import *

NARRATION = [
    ("This is a plane mirror and a light ray.", 5),
    ("The normal is a straight line at the meeting point.", 5),
    ("The incoming and reflected rays make equal angles.", 5),
    ("Each angle is measured from the normal, not mirror.", 5),
    ("So both angles here are forty degrees.", 5),
    ("This is the law of reflection.", 5),
]


class Explainer(Scene):
    def construct(self):
        title = Text("Law of Reflection", font_size=42, color=WHITE)
        title.to_edge(UP, buff=0.35)

        mirror = Line(
            LEFT * 5.2 + DOWN * 1.4,
            RIGHT * 5.2 + DOWN * 1.4,
            color=GRAY_B,
            stroke_width=10,
        )
        mirror_label = Text("Plane mirror", font_size=34, color=GRAY_B)
        mirror_label.move_to(DOWN * 2.0 + LEFT * 3.7)

        point = DOWN * 1.4
        left_start = LEFT * 3.2 + UP * 2.4
        right_end = RIGHT * 3.2 + UP * 2.4

        incoming = Arrow(
            left_start,
            point,
            buff=0,
            color=YELLOW,
            stroke_width=8,
        )
        reflected = Arrow(
            point,
            right_end,
            buff=0,
            color=GREEN,
            stroke_width=8,
        )

        normal = DashedLine(
            point,
            UP * 2.55,
            color=BLUE,
            stroke_width=6,
            dash_length=0.16,
        )
        normal_label = Text("Normal", font_size=34, color=BLUE)
        normal_label.move_to(RIGHT * 0.65 + UP * 2.05)

        incoming_label = Text("Incoming ray", font_size=34, color=YELLOW)
        incoming_label.move_to(LEFT * 4.0 + UP * 2.85)

        reflected_label = Text("Reflected ray", font_size=34, color=GREEN)
        reflected_label.move_to(RIGHT * 4.0 + UP * 2.85)

        left_arc = Arc(
            radius=0.78,
            start_angle=PI / 2,
            angle=40 * DEGREES,
            arc_center=point,
            color=ORANGE,
            stroke_width=6,
        )
        right_arc = Arc(
            radius=0.78,
            start_angle=PI / 2 - 40 * DEGREES,
            angle=40 * DEGREES,
            arc_center=point,
            color=ORANGE,
            stroke_width=6,
        )

        left_angle = Text("40°", font_size=36, color=ORANGE)
        left_angle.move_to(LEFT * 0.78 + DOWN * 0.55)

        right_angle = Text("40°", font_size=36, color=ORANGE)
        right_angle.move_to(RIGHT * 0.78 + DOWN * 0.55)

        measure_text = Text("Measure from normal", font_size=36, color=BLUE)
        measure_text.move_to(DOWN * 2.65 + LEFT * 1.2)

        not_mirror = Text("Not from mirror", font_size=36, color=RED)
        not_mirror.move_to(DOWN * 2.65 + RIGHT * 4.0)

        equal_text = Text("Equal: 40° each", font_size=38, color=GREEN)
        equal_text.move_to(DOWN * 2.65)
        equal_box = SurroundingRectangle(
            equal_text,
            color=GREEN,
            stroke_width=4,
            buff=0.15,
        )

        final_text = Text("Angle in = angle out", font_size=38, color=WHITE)
        final_text.move_to(DOWN * 2.65)

        self.play(
            FadeIn(title),
            Create(mirror),
            FadeIn(mirror_label),
            run_time=NARRATION[0][1],
        )

        self.play(
            GrowArrow(incoming),
            Create(normal),
            FadeIn(incoming_label),
            FadeIn(normal_label),
            run_time=NARRATION[1][1],
        )

        self.play(
            GrowArrow(reflected),
            Create(left_arc),
            Create(right_arc),
            FadeIn(reflected_label),
            FadeIn(left_angle),
            FadeIn(right_angle),
            run_time=NARRATION[2][1],
        )

        self.play(
            FadeIn(measure_text),
            FadeIn(not_mirror),
            run_time=NARRATION[3][1],
        )

        self.play(
            FadeOut(measure_text),
            FadeOut(not_mirror),
            FadeIn(equal_text),
            Create(equal_box),
            run_time=NARRATION[4][1],
        )

        self.play(
            FadeOut(equal_box),
            Transform(equal_text, final_text),
            run_time=NARRATION[5][1],
        )
