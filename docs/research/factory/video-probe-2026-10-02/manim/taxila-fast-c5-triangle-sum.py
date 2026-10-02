from manim import *

NARRATION = [
    ("Here is a triangle.", 4),
    ("Its three corners are angles.", 5),
    ("We colour each corner.", 4),
    ("Now move them together.", 5),
    ("They form a straight line.", 6),
    ("Triangle angles total one hundred eighty degrees.", 6),
]

class Explainer(Scene):
    def construct(self):
        a = np.array([-3.0, -1.5, 0.0])
        b = np.array([0.0, 1.8, 0.0])
        c = np.array([3.0, -1.5, 0.0])

        triangle = Polygon(
            a, b, c,
            stroke_color=WHITE,
            stroke_width=6,
            fill_color=BLUE_E,
            fill_opacity=0.18,
        )
        title = Text("Triangle angles", font_size=42).to_edge(UP, buff=0.35)

        self.play(
            Create(triangle),
            Write(title),
            run_time=4,
        )

        angle_a = Sector(
            radius=0.72,
            start_angle=0,
            angle=PI / 3,
            arc_center=a,
            fill_color=WHITE,
            fill_opacity=0.3,
            stroke_color=WHITE,
            stroke_width=4,
        )
        angle_b = Sector(
            radius=0.72,
            start_angle=-2 * PI / 3,
            angle=PI / 3,
            arc_center=b,
            fill_color=WHITE,
            fill_opacity=0.3,
            stroke_color=WHITE,
            stroke_width=4,
        )
        angle_c = Sector(
            radius=0.72,
            start_angle=2 * PI / 3,
            angle=PI / 3,
            arc_center=c,
            fill_color=WHITE,
            fill_opacity=0.3,
            stroke_color=WHITE,
            stroke_width=4,
        )
        sectors = [angle_a, angle_b, angle_c]

        self.play(
            *[Create(sector) for sector in sectors],
            run_time=5,
        )

        label_a = Text("60°", font_size=34).move_to(a + RIGHT * 0.42 + UP * 0.18)
        label_b = Text("60°", font_size=34).move_to(b + DOWN * 0.48)
        label_c = Text("60°", font_size=34).move_to(c + LEFT * 0.42 + UP * 0.18)
        labels = [label_a, label_b, label_c]

        self.play(
            angle_a.animate.set_fill(RED, opacity=0.85),
            angle_b.animate.set_fill(YELLOW, opacity=0.85),
            angle_c.animate.set_fill(GREEN, opacity=0.85),
            Write(label_a),
            Write(label_b),
            Write(label_c),
            run_time=4,
        )

        common_center = np.array([0.0, -1.15, 0.0])
        target_a = Sector(
            radius=1.35,
            start_angle=0,
            angle=PI / 3,
            arc_center=common_center,
            fill_color=RED,
            fill_opacity=0.85,
            stroke_color=WHITE,
            stroke_width=4,
        )
        target_b = Sector(
            radius=1.35,
            start_angle=PI / 3,
            angle=PI / 3,
            arc_center=common_center,
            fill_color=YELLOW,
            fill_opacity=0.85,
            stroke_color=WHITE,
            stroke_width=4,
        )
        target_c = Sector(
            radius=1.35,
            start_angle=2 * PI / 3,
            angle=PI / 3,
            arc_center=common_center,
            fill_color=GREEN,
            fill_opacity=0.85,
            stroke_color=WHITE,
            stroke_width=4,
        )

        target_label_a = Text("60°", font_size=34).move_to(
            common_center + RIGHT * 0.48 + UP * 0.28
        )
        target_label_b = Text("60°", font_size=34).move_to(
            common_center + UP * 0.55
        )
        target_label_c = Text("60°", font_size=34).move_to(
            common_center + LEFT * 0.48 + UP * 0.28
        )

        straight_line = Line(
            common_center + LEFT * 2.15,
            common_center + RIGHT * 2.15,
            stroke_color=WHITE,
            stroke_width=7,
        )

        self.play(
            Transform(angle_a, target_a),
            Transform(angle_b, target_b),
            Transform(angle_c, target_c),
            Transform(label_a, target_label_a),
            Transform(label_b, target_label_b),
            Transform(label_c, target_label_c),
            Create(straight_line),
            run_time=5,
        )

        line_text = Text("Straight line = 180°", font_size=38)
        line_text.move_to(np.array([0.0, -2.65, 0.0]))

        self.play(
            Write(line_text),
            run_time=6,
        )

        result = Text("60° + 60° + 60° = 180°", font_size=38)
        result.move_to(np.array([0.0, 3.0, 0.0]))

        self.play(
            FadeOut(title),
            Write(result),
            run_time=6,
        )
