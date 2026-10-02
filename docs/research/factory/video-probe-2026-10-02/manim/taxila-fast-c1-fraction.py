from manim import *

NARRATION = [
    ("This roti is one whole.", 4),
    ("It is cut into four equal parts.", 5),
    ("Now, colour three parts.", 5),
    ("We coloured three parts.", 5),
    ("So, the fraction is three-fourths.", 5),
    ("Only equal parts make a fraction.", 6),
]


class Explainer(Scene):
    def construct(self):
        center = LEFT * 2.3
        radius = 2.15

        title = Text("Three-quarters", font_size=44)
        title.to_edge(UP, buff=0.25)

        pieces = VGroup(
            Sector(
                arc_center=center,
                radius=radius,
                start_angle=0,
                angle=PI / 2,
                fill_color=WHITE,
                fill_opacity=1,
                stroke_color=BLACK,
                stroke_width=4,
            ),
            Sector(
                arc_center=center,
                radius=radius,
                start_angle=PI / 2,
                angle=PI / 2,
                fill_color=WHITE,
                fill_opacity=1,
                stroke_color=BLACK,
                stroke_width=4,
            ),
            Sector(
                arc_center=center,
                radius=radius,
                start_angle=PI,
                angle=PI / 2,
                fill_color=WHITE,
                fill_opacity=1,
                stroke_color=BLACK,
                stroke_width=4,
            ),
            Sector(
                arc_center=center,
                radius=radius,
                start_angle=3 * PI / 2,
                angle=PI / 2,
                fill_color=WHITE,
                fill_opacity=1,
                stroke_color=BLACK,
                stroke_width=4,
            ),
        )

        roti_outline = Circle(
            radius=radius,
            stroke_color=WHITE,
            stroke_width=5,
        ).move_to(center)

        whole_label = Text("One whole roti", font_size=34)
        whole_label.move_to(center + DOWN * 2.75)

        self.play(
            Create(VGroup(title, pieces, roti_outline, whole_label)),
            run_time=4,
        )

        equal_label = Text("4 equal parts", font_size=38)
        equal_label.move_to(RIGHT * 3.1 + UP * 2.25)

        self.play(Write(equal_label), run_time=5)

        self.play(
            pieces[0].animate.set_fill(ORANGE, opacity=1),
            pieces[1].animate.set_fill(ORANGE, opacity=1),
            pieces[2].animate.set_fill(ORANGE, opacity=1),
            run_time=5,
        )

        coloured_label = Text("3 coloured parts", font_size=38)
        coloured_label.move_to(RIGHT * 3.1 + DOWN * 2.35)

        self.play(Write(coloured_label), run_time=5)

        numerator = Text("3", font_size=64)
        numerator.move_to(RIGHT * 3.1 + UP * 0.85)

        fraction_line = Line(
            RIGHT * 2.65 + UP * 0.25,
            RIGHT * 3.55 + UP * 0.25,
            stroke_width=6,
        )

        denominator = Text("4", font_size=64)
        denominator.move_to(RIGHT * 3.1 + DOWN * 0.45)

        numerator_label = Text("3 coloured parts", font_size=34)
        numerator_label.move_to(RIGHT * 3.1 + UP * 1.65)

        denominator_label = Text("4 equal parts total", font_size=34)
        denominator_label.move_to(RIGHT * 3.1 + DOWN * 1.2)

        fraction_group = VGroup(
            numerator,
            fraction_line,
            denominator,
            numerator_label,
            denominator_label,
        )

        self.play(
            FadeOut(equal_label),
            FadeOut(coloured_label),
            FadeIn(fraction_group),
            run_time=5,
        )

        final_title = Text("Equal parts matter!", font_size=42)
        final_title.move_to(title)

        self.play(
            Transform(title, final_title),
            Indicate(pieces, color=YELLOW),
            run_time=6,
        )
