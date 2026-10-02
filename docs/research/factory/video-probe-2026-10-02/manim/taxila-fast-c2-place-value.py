from manim import *

NARRATION = [
    ("Let us build the number three hundred forty-five.", 5),
    ("Three hundred-flats show three hundreds.", 5),
    ("Four ten-rods show four tens.", 5),
    ("Five ones-cubes show five ones.", 5),
    ("The four means forty, not four.", 5),
    ("Three hundred forty-five equals three hundred plus forty plus five.", 5),
]


class Explainer(Scene):
    def construct(self):
        title = Text("Place Value", font_size=44, color=WHITE)
        title.to_edge(UP, buff=0.35)

        number = Text("345", font_size=54, color=YELLOW)
        number.next_to(title, DOWN, buff=0.18)

        flat_group = VGroup()
        flat_centers = [-4.7, -3.25, -1.8]
        for x in flat_centers:
            plate = Square(
                side_length=1.15,
                stroke_color=BLUE_E,
                stroke_width=3,
                fill_color=BLUE,
                fill_opacity=0.85,
            )
            plate.move_to([x, 0.85, 0])
            grid = VGroup()
            for i in range(1, 10):
                offset = -0.575 + i * 0.115
                grid.add(
                    Line(
                        [x + offset, 0.275, 0],
                        [x + offset, 1.425, 0],
                        stroke_color=WHITE,
                        stroke_width=1,
                    )
                )
                grid.add(
                    Line(
                        [x - 0.575, 0.85 + offset, 0],
                        [x + 0.575, 0.85 + offset, 0],
                        stroke_color=WHITE,
                        stroke_width=1,
                    )
                )
            flat_group.add(VGroup(plate, grid))

        flat_label = Text("3 hundreds", font_size=34, color=BLUE_B)
        flat_label.move_to([-3.25, -0.35, 0])

        rod_group = VGroup()
        rod_centers = [0.0, 0.65, 1.3, 1.95]
        for x in rod_centers:
            rod = RoundedRectangle(
                width=0.38,
                height=1.55,
                corner_radius=0.12,
                stroke_color=GREEN_E,
                stroke_width=3,
                fill_color=GREEN,
                fill_opacity=0.9,
            )
            rod.move_to([x, 0.85, 0])
            rod_group.add(rod)

        rod_label = Text("4 ten-rods", font_size=34, color=GREEN_B)
        rod_label.move_to([0.98, -0.35, 0])

        cube_group = VGroup()
        cube_centers = [3.3, 4.0, 4.7, 5.4]
        for x in cube_centers:
            front = Square(
                side_length=0.52,
                stroke_color=ORANGE,
                stroke_width=3,
                fill_color=YELLOW,
                fill_opacity=0.95,
            )
            front.move_to([x, 0.62, 0])

            top = Polygon(
                [x - 0.26, 0.88, 0],
                [x - 0.08, 1.05, 0],
                [x + 0.44, 1.05, 0],
                [x + 0.26, 0.88, 0],
                stroke_color=ORANGE,
                stroke_width=2,
                fill_color=GOLD,
                fill_opacity=0.95,
            )

            side = Polygon(
                [x + 0.26, 0.62, 0],
                [x + 0.44, 0.79, 0],
                [x + 0.44, 1.05, 0],
                [x + 0.26, 0.88, 0],
                stroke_color=ORANGE,
                stroke_width=2,
                fill_color=ORANGE,
                fill_opacity=0.95,
            )
            cube_group.add(VGroup(front, top, side))

        cube_label = Text("5 ones-cubes", font_size=34, color=ORANGE)
        cube_label.move_to([4.35, -0.35, 0])

        misconception = VGroup(
            Text("4 means 40", font_size=40, color=YELLOW),
            Text("Not 4 here", font_size=36, color=RED),
        )
        misconception.arrange(DOWN, buff=0.14)
        misconception.move_to([0, -1.35, 0])

        equation = Text("345 = 300 + 40 + 5", font_size=40, color=WHITE)
        equation.move_to([0, -2.15, 0])

        self.play(FadeIn(VGroup(title, number)), run_time=2)
        self.wait(3)

        self.play(FadeIn(VGroup(flat_group, flat_label)), run_time=2)
        self.wait(3)

        self.play(FadeIn(VGroup(rod_group, rod_label)), run_time=2)
        self.wait(3)

        self.play(FadeIn(VGroup(cube_group, cube_label)), run_time=2)
        self.wait(3)

        self.play(FadeIn(misconception), run_time=2)
        self.wait(3)

        self.play(
            FadeOut(misconception),
            FadeIn(equation),
            run_time=3,
        )
        self.wait(2)
