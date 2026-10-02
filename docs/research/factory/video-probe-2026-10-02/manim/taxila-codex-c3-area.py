from manim import *

NARRATION = [
    ("This rectangle is four by three.", 5),
    ("Count unit squares in each row.", 5),
    ("There are three rows of four.", 5),
    ("Add them: four plus four plus four.", 5),
    ("So area is twelve square units.", 5),
    ("Area is not perimeter length.", 5),
]


class Explainer(Scene):
    def construct(self):
        # Base objects
        title = Text("Area by counting squares", font_size=42).move_to([0, 3.1, 0])

        squares = VGroup()
        row_groups = []
        for r in range(3):
            row = VGroup()
            for c in range(4):
                sq = Square(side_length=0.9, stroke_width=3, stroke_color=WHITE)
                sq.set_fill(BLUE, opacity=0.0)
                sq.move_to([c * 0.9, -r * 0.9, 0])
                squares.add(sq)
                row.add(sq)
            row_groups.append(row)

        squares.move_to([-1.5, -0.1, 0])

        row_labels = VGroup(
            Text("4 squares", font_size=36, color=YELLOW).move_to([2.3, row_groups[0].get_center()[1], 0]),
            Text("4 squares", font_size=36, color=YELLOW).move_to([2.3, row_groups[1].get_center()[1], 0]),
            Text("4 squares", font_size=36, color=YELLOW).move_to([2.3, row_groups[2].get_center()[1], 0]),
        )

        rows_text = Text("3 rows of 4", font_size=40, color=YELLOW).move_to([2.3, 2.7, 0])
        add_text = Text("4+4+4=12", font_size=46, color=YELLOW).move_to([0, -2.8, 0])
        mult_text = Text("4 x 3 = 12", font_size=46, color=GREEN).move_to([0, -2.8, 0])
        area_text = Text("Area is 12 units", font_size=38, color=BLUE).move_to([2.3, 2.2, 0])

        inside_text = Text("Area counts inside", font_size=36, color=GREEN).move_to([2.3, 2.2, 0])
        not_text = Text("Not perimeter", font_size=38, color=RED).move_to([2.3, 1.4, 0])
        boundary_text = Text("Perimeter is boundary", font_size=34, color=RED).move_to([2.3, 0.7, 0])

        perimeter_rect = Rectangle(
            width=4 * 0.9, height=3 * 0.9, stroke_color=RED, stroke_width=8
        ).move_to(squares.get_center())

        # Segment 1 (5s)
        self.play(FadeIn(title), run_time=1.5)
        self.play(Create(squares), run_time=2.5)
        self.wait(1.0)

        # Segment 2 (5s)
        self.play(
            AnimationGroup(
                row_groups[0].animate.set_fill(YELLOW, opacity=0.45),
                FadeIn(row_labels[0]),
                lag_ratio=0.2,
            ),
            run_time=1.4,
        )
        self.play(
            AnimationGroup(
                row_groups[1].animate.set_fill(YELLOW, opacity=0.45),
                FadeIn(row_labels[1]),
                lag_ratio=0.2,
            ),
            run_time=1.4,
        )
        self.play(
            AnimationGroup(
                row_groups[2].animate.set_fill(YELLOW, opacity=0.45),
                FadeIn(row_labels[2]),
                lag_ratio=0.2,
            ),
            run_time=1.4,
        )
        self.wait(0.8)

        # Segment 3 (5s)
        self.play(FadeIn(rows_text), run_time=1.0)
        self.play(Indicate(row_groups[0], color=YELLOW), run_time=1.0)
        self.play(Indicate(row_groups[1], color=YELLOW), run_time=1.0)
        self.play(Indicate(row_groups[2], color=YELLOW), run_time=1.0)
        self.wait(1.0)

        # Segment 4 (5s)
        self.play(FadeIn(add_text), run_time=1.5)
        self.play(Indicate(row_labels, color=YELLOW), run_time=1.5)
        self.wait(2.0)

        # Segment 5 (5s)
        self.play(ReplacementTransform(add_text, mult_text), run_time=1.5)
        self.play(FadeIn(area_text), run_time=1.0)
        self.play(squares.animate.set_fill(BLUE, opacity=0.45), run_time=1.0)
        self.wait(1.5)

        # Segment 6 (5s)
        self.play(ReplacementTransform(area_text, inside_text), run_time=1.0)
        self.play(Create(perimeter_rect), run_time=1.2)
        self.play(FadeIn(not_text), run_time=0.8)
        self.play(FadeIn(boundary_text), run_time=0.8)
        self.play(Indicate(perimeter_rect, color=RED), run_time=0.7)
        self.wait(0.5)
