from manim import *

NARRATION = [
    ("Here is one triangle.", 5),
    ("Each corner has a color.", 5),
    ("These are three angles.", 5),
    ("Now move corners together.", 5),
    ("They make a straight line.", 5),
    ("So total is one eighty.", 5),
]


class Explainer(Scene):
    def construct(self):
        def angle_data(v, p1, p2):
            u1 = (p1 - v) / np.linalg.norm(p1 - v)
            u2 = (p2 - v) / np.linalg.norm(p2 - v)

            a1 = np.arctan2(u1[1], u1[0])
            a2 = np.arctan2(u2[1], u2[0])

            delta = (a2 - a1 + PI) % (2 * PI) - PI
            if delta >= 0:
                start = a1
                ang = delta
            else:
                start = a2
                ang = -delta
            return start, ang

        A = np.array([-4.2, -1.0, 0.0])
        B = np.array([4.2, -1.0, 0.0])
        C = np.array([0.0, 2.2, 0.0])

        triangle = Polygon(A, B, C, color=WHITE, stroke_width=6)

        sA_start, a = angle_data(A, B, C)
        sB_start, b = angle_data(B, C, A)
        sC_start, c = angle_data(C, A, B)

        corner_A = Sector(
            arc_center=A,
            radius=0.65,
            start_angle=sA_start,
            angle=a,
            fill_color=RED,
            fill_opacity=0.9,
            stroke_color=RED,
            stroke_width=2,
        )
        corner_B = Sector(
            arc_center=B,
            radius=0.65,
            start_angle=sB_start,
            angle=b,
            fill_color=GREEN,
            fill_opacity=0.9,
            stroke_color=GREEN,
            stroke_width=2,
        )
        corner_C = Sector(
            arc_center=C,
            radius=0.65,
            start_angle=sC_start,
            angle=c,
            fill_color=BLUE,
            fill_opacity=0.9,
            stroke_color=BLUE,
            stroke_width=2,
        )

        caption = Text("One triangle", font_size=44).move_to([0, 3.0, 0])

        # Segment 1: 5 seconds
        self.play(FadeIn(triangle), FadeIn(caption), run_time=3)
        self.wait(2)

        # Segment 2: 5 seconds
        cap2 = Text("Colorful corners", font_size=44).move_to([0, 3.0, 0])
        self.play(
            Transform(caption, cap2),
            FadeIn(corner_A),
            FadeIn(corner_B),
            FadeIn(corner_C),
            run_time=3,
        )
        self.wait(2)

        # Segment 3: 5 seconds
        cap3 = Text("Three angles", font_size=44).move_to([0, 3.0, 0])
        self.play(Transform(caption, cap3), run_time=1.5)
        self.play(
            corner_A.animate.scale(1.08),
            corner_B.animate.scale(1.08),
            corner_C.animate.scale(1.08),
            rate_func=there_and_back,
            run_time=1.5,
        )
        self.wait(2)

        O = np.array([0.0, -2.2, 0.0])
        r = 1.15
        tA = Sector(
            arc_center=O,
            radius=r,
            start_angle=0,
            angle=a,
            fill_color=RED,
            fill_opacity=0.9,
            stroke_color=RED,
            stroke_width=2,
        )
        tB = Sector(
            arc_center=O,
            radius=r,
            start_angle=a,
            angle=b,
            fill_color=GREEN,
            fill_opacity=0.9,
            stroke_color=GREEN,
            stroke_width=2,
        )
        tC = Sector(
            arc_center=O,
            radius=r,
            start_angle=a + b,
            angle=c,
            fill_color=BLUE,
            fill_opacity=0.9,
            stroke_color=BLUE,
            stroke_width=2,
        )
        base_line = Line([-5.0, O[1], 0], [5.0, O[1], 0], color=YELLOW, stroke_width=6)

        # Segment 4: 5 seconds
        cap4 = Text("Move corners together", font_size=44).move_to([0, 3.0, 0])
        self.play(
            Transform(caption, cap4),
            FadeIn(base_line),
            Transform(corner_A, tA),
            Transform(corner_B, tB),
            Transform(corner_C, tC),
            FadeOut(triangle),
            run_time=4,
        )
        self.wait(1)

        # Segment 5: 5 seconds
        cap5 = Text("Straight line is 180", font_size=44).move_to([0, 3.0, 0])
        line_text = Text("Straight line 180 degrees", font_size=38).move_to([0, -3.1, 0])
        self.play(Transform(caption, cap5), run_time=1.5)
        self.play(FadeIn(line_text), run_time=1.5)
        self.wait(2)

        # Segment 6: 5 seconds
        cap6 = Text("All angles make 180", font_size=44).move_to([0, 3.0, 0])
        self.play(Transform(caption, cap6), run_time=1)
        self.play(
            LaggedStart(
                Indicate(corner_A, scale_factor=1.05),
                Indicate(corner_B, scale_factor=1.05),
                Indicate(corner_C, scale_factor=1.05),
                lag_ratio=0.25,
            ),
            run_time=2,
        )
        self.wait(2)
