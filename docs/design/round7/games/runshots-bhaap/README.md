# Bhaap run shots (r7 bhaap, 360 × 640, deviceScaleFactor 1)

Class 6 and 7 science: processes of water and air, in the new family bhaap ("vapour"). Nothing runs on a clock. The child
runs each process one tap at a time: a heat, a cool, a wait, a sail, a rain or a pump.

- **avastha** (c6-science-ch08-t01, states of water). A pot sits on the stove beside a thermometer. The thermometer is marked
  only at 0 °C and 100 °C, the kit's two numbers; the notches between and the freezer below carry no number. Heat and Cool
  move it one notch per tap. At the 0 °C mark, heating melts the ice and cooling freezes the water. At the 100 °C mark, heating
  boils the water: big bubbles rise from the bottom. Right above the water is a clear gap, where the vapour is invisible;
  above that is a white cloud of tiny droplets. A cold lid on the pot turns the vapour back into drops of water.
  - **badlo** (s2, s3): a card names the changes to make in turn: melting, freezing, boiling, vapour to water, and
    dissolving sugar in the glass beside the pot.
  - **bachao** (s3, s1): boil the water and keep all of it in the pot.
- **bhaapan** (c6-science-ch08-t02, evaporation and condensation). With no heat, each wait moves one unit of water from an
  open plate, a shirt on the line or a wet floor into the air. A lens on the air shows that vapour as faint dots, since it
  cannot be seen. Something cold put out on the bench gathers drops from the air, one unit per wait. The tissue wipes the
  drops into the cup; they are clear water, even on a glass of coloured drink.
  - **os** (s2): the air already holds vapour. Get drops into the cup.
  - **wapas** (s3, s1): get all of the wet thing's water back into the cup.
- **hawa** (c7-science-ch07-t02, convection).
  - **naav** (s3): a beach. The child sets day or night and waits. The land warms faster than the sea by day and cools faster
    at night; the bars show warmer and cooler, never a number. The near-ground breeze blows from the cooler side to the warmer
    one; air rises over the warmer side and sinks over the cooler. Sail moves the boat one place with the breeze: out to the
    fishing place (the buoy) and back.
  - **kamra** (s4, s1): a room drawn as three layers of air. The child taps the device (AC, heater or kitchen exhaust), then
    High or Low on the wall. Each wait, a warmer layer below rises past a cooler one above.
- **chakra** (c7-science-ch07-t04, the water cycle and groundwater).
  - **baadal** (s1): Sun turns sea water into invisible vapour (dots in the lens). Let it rise makes the vapour rise and cool
    into a cloud of droplets. Rain brings the cloud down on the field. At looks 2 and 3, Let it flow sends the field's water
    down the river to the sea.
  - **kuan** (s2, s3): rain on the open soil fills one row of gaps from the bottom. Rain on the concrete runs off unless the
    recharge pit takes it in. The dashed line is the water table. Pump takes one row out, but only while the table is above
    the well's bottom.

The driver acts ONLY through real input:
- page.mouse clicks at the centre of the canvas targets in `window.__play.audit.targets`: tools, the fridge's things, the
  bench places, and the wall's High and Low;
- getByTestId(`play-ctl-done`) and getByTestId(`play-ctl-undo`) for the DOM buttons.

The driver reads each act list from the law's own solve and mal-rule acts and never dispatches them. Every goal was solved
this way on seeds 3 and 17, at two looks per goal (three for kamra), 34 runs in all; every act came in as touch. Every
mal-rule state was reached the same way. No label was clipped in any run. The smallest tap target in every run was 50 px
(a tool button, 80 × 50).

| file | what it shows |
|---|---|
| taps-badlo-f1-s3-solved-p360.png | badlo, a bottle in the fridge: cooled to the 0 °C mark it freezes, heated there it melts |
| taps-badlo-f1-s17-solved-p360.png | the same card on another seed |
| taps-badlo-f3-s3-solved-p360.png | badlo look 3: freeze, melt, boil, then vapour to water with the cold lid on (four ticks) |
| taps-badlo-f3-s17-solved-p360.png | badlo look 3, kulfi: melt, freeze, melt, then sugar dissolved in the glass |
| taps-bachao-f1-s3-solved-p360.png | bachao: heated to the 100 °C mark, the cold lid put on, boiled; drops under the lid, the water level kept |
| taps-bachao-f1-s17-solved-p360.png | the same on another seed |
| taps-bachao-f3-s3-solved-p360.png | bachao look 3: ice from the freezer melted at 0 °C, then boiled twice with the lid on |
| taps-bachao-f3-s17-solved-p360.png | the same, kulfi |
| taps-os-f1-s3-solved-p360.png | os, a hot humid day: a cold empty glass put out, two waits, the drops wiped into the cup |
| taps-os-f1-s17-solved-p360.png | os, monsoon air, the same way |
| taps-os-f2-s3-solved-p360.png, taps-os-f2-s17-solved-p360.png | os look 2: three units of drops |
| taps-wapas-f1-s3-solved-p360.png | wapas, a plate of water: a cold glass out, two waits (the plate dries, drops form), wiped into the cup |
| taps-wapas-f1-s17-solved-p360.png | wapas, a wet shirt on the line, the same way |
| taps-wapas-f3-s3-solved-p360.png, taps-wapas-f3-s17-solved-p360.png | wapas look 3: four units back in the cup |
| taps-naav-f1-s3-solved-p360.png | naav: Night, a wait (the land breeze), sailed out to the buoy |
| taps-naav-f1-s17-solved-p360.png | naav, the boat at sea at night: Day, a wait (the sea breeze), sailed back to the shore |
| taps-naav-f3-s3-solved-p360.png | naav look 3, starting on a hot afternoon: night, waited through the calm, out; day, back |
| taps-naav-f3-s17-solved-p360.png | naav look 3, starting at night: back by day, out again at night |
| taps-kamra-f1-s3-solved-p360.png, taps-kamra-f1-s17-solved-p360.png | kamra: the AC high, three waits, every layer cool |
| taps-kamra-f2-s3-solved-p360.png, taps-kamra-f2-s17-solved-p360.png | kamra look 2, a hall cooled the same way |
| taps-kamra-f3-s3-solved-p360.png, taps-kamra-f3-s17-solved-p360.png | kamra look 3: summer (the AC high) then winter (the heater low) |
| taps-baadal-f1-s3-solved-p360.png | baadal: sun, let it rise (a cloud), rain on the field |
| taps-baadal-f1-s17-solved-p360.png | baadal, two units of rain |
| taps-baadal-f2-s3-solved-p360.png, taps-baadal-f2-s17-solved-p360.png | baadal look 2: the rain then flows down the river back to the sea |
| taps-kuan-f1-s3-solved-p360.png, taps-kuan-f1-s17-solved-p360.png | kuan: the recharge pit, one rain (two rows of gaps fill), one day's water pumped |
| taps-kuan-f3-s3-solved-p360.png | kuan look 3, a borewell: a rain, the pit, one pump, the second rain, then three more pumps (the gaps cannot hold more than they have) |
| taps-kuan-f3-s17-solved-p360.png | kuan look 3, a village well: five days of water |
| mal-badlo-sugar-melts-p360.png | sugar-melts (t01 m3): sugar spooned when the card says Melt. The glass is "sugar water"; the Melt chip and the glass carry magnifiers; "That was dissolving. Next on the card: melting." |
| mal-bachao-air-bubbles-p360.png | air-bubbles (t01 m1): boiled with the pot open, then Done. The level has fallen; the clear gap is labelled as vapour and the cloud as droplets |
| mal-bachao-cloud-gas-p360.png | cloud-gas (t01 m2): the cold plate held up in the white cloud. The pot still loses water through the clear gap below it, which is labelled |
| mal-os-glass-leak-p360.png | glass-leak (t02 m1): a full glass of warm coloured drink put out. No drop forms on it and nothing comes through; the magnifier sits on the glass |
| mal-wapas-glass-leak-p360.png | the same in wapas: the plate's water goes into the air and none of it lands on the warm glass |
| mal-wapas-water-gone-p360.png | water-gone (t02 m3): Done with the plate dry and the cup empty. The lens shows the vapour in the air: "It is not gone." |
| mal-naav-day-landward-p360.png | day-landward (c7 t02 m2): the sail raised by day to go out. The sea breeze keeps the boat on the shore |
| mal-kamra-cold-rises-p360.png | cold-rises (c7 t02 m3): the AC fitted low. The floor layer turns cool and the two layers above stay warm |
| mal-baadal-vapour-rains-p360.png | vapour-rains (t04 m3): Rain tapped with vapour in the air but no cloud. "No cloud: vapour that has not risen and cooled is not a cloud" |
| mal-kuan-never-dry-p360.png | never-dry (t04 m2): pumped on with no recharge until the water table drops below the well's bottom. The well is dry |
