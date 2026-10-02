from manim import *

NARRATION = [
    ("This roti is one whole.", 4),
    ("We cut it into four equal parts.", 6),
    ("Equal parts are very important.", 4),
    ("Now we colour three parts.", 5),
    ("So numerator is three coloured parts.", 5),
    ("Denominator is four total equal parts.", 6),
]


class Explainer(Scene):
    def construct(self):
        roti_center = LEFT * 2.8 + DOWN * 0.1

        title = Text("Three-Quarters", font_size=56).move_to(UP * 3.0)
        s1 = Text("One whole roti", font_size=40).move_to(UP * 2.2)
        s2 = Text("Cut into 4 equal parts", font_size=40).move_to(UP * 2.2)
        s3 = Text("Parts must be equal", font_size=40).move_to(UP * 2.2)
        s4 = Text("Colour 3 parts", font_size=40).move_to(UP * 2.2)

        whole = Circle(
            radius=1.6,
            color=ORANGE,
            stroke_width=6,
            fill_color="#E6C27A",
            fill_opacity=1,
        ).move_to(roti_center)

        sectors = VGroup(
            *[
                Sector(
                    radius=1.6,
                    start_angle=k * PI / 2,
                    angle=PI / 2,
                    arc_center=roti_center,
                    fill_color="#E6C27A",
                    fill_opacity=1,
                    stroke_color=WHITE,
                    stroke_width=2,
                )
                for k in range(4)
            ]
        )
        outline = Circle(radius=1.6, color=ORANGE, stroke_width=6).move_to(roti_center)
        hline = Line(
            roti_center + LEFT * 1.6,
            roti_center + RIGHT * 1.6,
            color=WHITE,
            stroke_width=5,
        )
        vline = Line(
            roti_center + UP * 1.6,
            roti_center + DOWN * 1.6,
            color=WHITE,
            stroke_width=5,
        )
        equal_group = VGroup(sectors, outline, hline, vline)

        wrong_center = RIGHT * 2.4 + DOWN * 0.9
        wrong_outline = Circle(
            radius=0.95,
            color=ORANGE,
            stroke_width=5,
            fill_color="#E6C27A",
            fill_opacity=1,
        ).move_to(wrong_center)

        ray_base = Line(wrong_center, wrong_center + RIGHT * 0.95, color=WHITE, stroke_width=4)
        ray_two = ray_base.copy().rotate(70 * DEGREES, about_point=wrong_center)
        ray_three = ray_base.copy().rotate(210 * DEGREES, about_point=wrong_center)
        wrong_lines = VGroup(ray_base, ray_two, ray_three)
        wrong_group = VGroup(wrong_outline, wrong_lines)

        warn_text = Text("Not equal parts", font_size=34, color=RED).next_to(
            wrong_outline, UP, buff=0.2
        )
        cross = VGroup(
            Line(wrong_outline.get_corner(UL), wrong_outline.get_corner(DR), color=RED, stroke_width=6),
            Line(wrong_outline.get_corner(UR), wrong_outline.get_corner(DL), color=RED, stroke_width=6),
        )

        num_text = Text("3", font_size=88, color=YELLOW)
        slash = Text("/", font_size=88)
        den_text = Text("4", font_size=88, color=BLUE)
        frac_group = VGroup(num_text, slash, den_text).arrange(RIGHT, buff=0.2).move_to(RIGHT * 3.6 + UP * 0.8)

        num_label = Text("3 = coloured parts", font_size=36).move_to(RIGHT * 3.6 + DOWN * 0.3)
        den_label = Text("4 = total equal parts", font_size=36).move_to(RIGHT * 3.6 + DOWN * 1.3)

        # Segment 1: 4 seconds
        self.play(FadeIn(title), FadeIn(whole), FadeIn(s1), run_time=2.5)
        self.wait(1.5)

        # Segment 2: 6 seconds
        self.play(ReplacementTransform(s1, s2), run_time=1.5)
        self.play(FadeOut(whole), FadeIn(equal_group), run_time=2.5)
        self.wait(2.0)

        # Segment 3: 4 seconds
        self.play(
            ReplacementTransform(s2, s3),
            FadeIn(wrong_group),
            FadeIn(warn_text),
            run_time=2.0,
        )
        self.play(Create(cross), run_time=1.0)
        self.wait(1.0)

        # Segment 4: 5 seconds
        self.play(ReplacementTransform(s3, s4), run_time=1.0)
        self.play(
            sectors[0].animate.set_fill(YELLOW, opacity=1),
            sectors[1].animate.set_fill(YELLOW, opacity=1),
            sectors[2].animate.set_fill(YELLOW, opacity=1),
            run_time=2.5,
        )
        self.wait(1.5)

        # Segment 5: 5 seconds
        self.play(FadeIn(frac_group), FadeIn(num_label), run_time=2.0)
        self.play(
            Indicate(num_text, color=YELLOW),
            Indicate(VGroup(sectors[0], sectors[1], sectors[2]), color=YELLOW),
            run_time=2.0,
        )
        self.wait(1.0)

        # Segment 6: 6 seconds
        self.play(FadeIn(den_label), run_time=1.5)
        self.play(
            Indicate(den_text, color=BLUE),
            Indicate(VGroup(*sectors), color=BLUE),
            run_time=2.0,
        )
        self.play(
            FadeOut(wrong_group),
            FadeOut(warn_text),
            FadeOut(cross),
            FadeOut(s4),
            run_time=1.5,
        )
        self.wait(1.0)
