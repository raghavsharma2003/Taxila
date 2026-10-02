from manim import *

NARRATION = [
    ("This number is three hundred forty five.", 5),
    ("See three hundred flats on the left.", 5),
    ("Now we add four ten rods.", 5),
    ("Now we add five one cubes.", 5),
    ("So three forty five is three hundred plus forty plus five.", 5),
    ("Remember, the four means forty, not four.", 5),
]


class Explainer(Scene):
    def construct(self):
        title = Text("Place value: 345", font_size=44).to_edge(UP, buff=0.4)
        number = Text("345", font_size=96, color=YELLOW).move_to([0, 2.0, 0])

        hundreds = VGroup(
            Square(side_length=0.9, fill_color=BLUE, fill_opacity=0.75, stroke_width=2).move_to([-5.3, 0.2, 0]),
            Square(side_length=0.9, fill_color=BLUE, fill_opacity=0.75, stroke_width=2).move_to([-4.2, 0.2, 0]),
            Square(side_length=0.9, fill_color=BLUE, fill_opacity=0.75, stroke_width=2).move_to([-3.1, 0.2, 0]),
        )
        tens = VGroup(
            Rectangle(width=0.28, height=0.9, fill_color=ORANGE, fill_opacity=0.85, stroke_width=2).move_to([-0.9, 0.2, 0]),
            Rectangle(width=0.28, height=0.9, fill_color=ORANGE, fill_opacity=0.85, stroke_width=2).move_to([-0.45, 0.2, 0]),
            Rectangle(width=0.28, height=0.9, fill_color=ORANGE, fill_opacity=0.85, stroke_width=2).move_to([0.0, 0.2, 0]),
            Rectangle(width=0.28, height=0.9, fill_color=ORANGE, fill_opacity=0.85, stroke_width=2).move_to([0.45, 0.2, 0]),
        )
        ones = VGroup(
            Square(side_length=0.28, fill_color=GREEN, fill_opacity=0.9, stroke_width=2).move_to([2.0, 0.2, 0]),
            Square(side_length=0.28, fill_color=GREEN, fill_opacity=0.9, stroke_width=2).move_to([2.4, 0.2, 0]),
            Square(side_length=0.28, fill_color=GREEN, fill_opacity=0.9, stroke_width=2).move_to([2.8, 0.2, 0]),
            Square(side_length=0.28, fill_color=GREEN, fill_opacity=0.9, stroke_width=2).move_to([3.2, 0.2, 0]),
            Square(side_length=0.28, fill_color=GREEN, fill_opacity=0.9, stroke_width=2).move_to([3.6, 0.2, 0]),
        )

        label_h = Text("3 Hundreds", font_size=34).move_to([-4.2, -1.0, 0])
        label_t = Text("4 Tens", font_size=34).move_to([-0.2, -1.0, 0])
        label_o = Text("5 Ones", font_size=34).move_to([2.8, -1.0, 0])

        val_300 = Text("300", font_size=40, color=BLUE).move_to([-4.2, 1.35, 0])
        val_40 = Text("40", font_size=40, color=ORANGE).move_to([-0.2, 1.35, 0])
        val_5 = Text("5", font_size=40, color=GREEN).move_to([2.8, 1.35, 0])

        equation = Text("345=300+40+5", font_size=48, color=YELLOW).move_to([0, -2.6, 0])

        wrong = Text("4 means 4", font_size=40, color=RED).move_to([4.5, 2.2, 0])
        right = Text("4 means forty", font_size=40, color=GREEN).move_to([4.5, 1.45, 0])
        note = Text("Not just four", font_size=36).move_to([4.5, 0.8, 0])
        cross_wrong = Cross(wrong, stroke_color=RED, stroke_width=8)

        # Segment 1: 5 seconds
        self.play(FadeIn(title, shift=UP), FadeIn(number), run_time=2)
        self.wait(1)
        self.play(number.animate.set_color(GOLD), run_time=1)
        self.wait(1)

        # Segment 2: 5 seconds
        self.play(
            LaggedStart(
                *[FadeIn(h, scale=0.8) for h in hundreds],
                lag_ratio=0.25
            ),
            run_time=3
        )
        self.play(Write(label_h), run_time=1)
        self.wait(1)

        # Segment 3: 5 seconds
        self.play(
            LaggedStart(
                *[GrowFromCenter(t) for t in tens],
                lag_ratio=0.2
            ),
            run_time=2.5
        )
        self.play(Write(label_t), run_time=1)
        self.play(Indicate(tens, color=YELLOW), run_time=1)
        self.wait(0.5)

        # Segment 4: 5 seconds
        self.play(
            LaggedStart(
                *[FadeIn(o, shift=UP * 0.1) for o in ones],
                lag_ratio=0.15
            ),
            run_time=2
        )
        self.play(Write(label_o), run_time=1)
        self.play(Indicate(ones, color=GREEN), run_time=1)
        self.wait(1)

        # Segment 5: 5 seconds
        self.play(FadeIn(val_300), FadeIn(val_40), FadeIn(val_5), run_time=1.5)
        self.play(FadeIn(equation, shift=UP * 0.1), run_time=1.5)
        self.play(Circumscribe(equation, color=YELLOW), run_time=1)
        self.wait(1)

        # Segment 6: 5 seconds
        self.play(FadeIn(wrong), run_time=1.2)
        self.play(Create(cross_wrong), run_time=0.8)
        self.play(AnimationGroup(Indicate(tens, color=YELLOW), FadeIn(right), lag_ratio=0.2), run_time=1.2)
        self.play(FadeIn(note), run_time=0.8)
        self.wait(1)
