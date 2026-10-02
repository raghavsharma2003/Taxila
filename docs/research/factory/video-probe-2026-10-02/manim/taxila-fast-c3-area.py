from manim import *

NARRATION = [
    ("We will count the tiny squares.", 5),
    ("One row has four unit squares.", 5),
    ("There are three rows of four.", 5),
    ("Adding them gives four plus four plus four, twelve.", 5),
    ("So the area is twelve square units.", 5),
    ("Area is inside, not the boundary perimeter.", 5),
]


class Explainer(Scene):
    def construct(self):
        title = Text("Count unit squares", font_size=44)
        title.to_edge(UP, buff=0.35)

        squares = []
        for row in range(3):
            for column in range(4):
                square = Square(
                    side_length=0.95,
                    stroke_color=WHITE,
                    stroke_width=2,
                    fill_color=BLUE,
                    fill_opacity=0.25,
                )
                square.move_to(
                    RIGHT * (column - 1.5) * 0.95
                    + UP * (row - 1) * 0.95
                )
                squares.append(square)

        grid = VGroup(*squares)

        self.play(Write(title), run_time=0.8)
        self.play(Create(grid), run_time=1.7)
        self.wait(2.5)

        row_label = Text("Four squares in one row", font_size=36)
        row_label.next_to(grid, UP, buff=0.45)

        first_row = squares[8:12]
        self.play(Write(row_label), run_time=1.0)
        self.play(
            *[
                square.animate.set_fill(GREEN, opacity=0.8)
                for square in first_row
            ],
            run_time=1.5,
        )
        self.wait(2.5)

        rows_label = Text("Three rows of four", font_size=36)
        rows_label.next_to(grid, UP, buff=0.45)

        self.play(FadeOut(row_label), run_time=0.5)
        self.play(Write(rows_label), run_time=0.8)
        self.play(
            *[
                square.animate.set_fill(GREEN, opacity=0.8)
                for square in squares
            ],
            run_time=1.2,
        )
        self.wait(2.5)

        addition = Text("4 + 4 + 4 = 12", font_size=44)
        addition.next_to(grid, DOWN, buff=0.55)

        self.play(FadeOut(rows_label), run_time=0.5)
        self.play(Write(addition), run_time=1.2)
        self.wait(3.3)

        multiplication = Text("4 × 3 = 12", font_size=44)
        multiplication.next_to(grid, UP, buff=0.55)

        units = Text("Twelve square units", font_size=36)
        units.next_to(grid, DOWN, buff=0.55)

        self.play(FadeOut(addition), run_time=0.5)
        self.play(
            Write(multiplication),
            Write(units),
            run_time=1.2,
        )
        self.wait(3.3)

        boundary = Rectangle(
            width=3.8,
            height=2.85,
            stroke_color=RED,
            stroke_width=7,
            fill_opacity=0,
        )

        final_title = Text("Area is not perimeter", font_size=42)
        final_title.to_edge(UP, buff=0.35)

        area_label = Text("Area counts inside", font_size=36)
        area_label.next_to(grid, DOWN, buff=0.55)

        perimeter_label = Text("Perimeter counts boundary", font_size=34)
        perimeter_label.next_to(grid, UP, buff=0.55)

        self.play(
            FadeOut(title),
            FadeOut(multiplication),
            FadeOut(units),
            run_time=0.6,
        )
        self.play(Create(boundary), run_time=1.2)
        self.play(Write(final_title), run_time=0.8)
        self.play(
            Write(area_label),
            Write(perimeter_label),
            run_time=0.8,
        )
        self.wait(1.6)
