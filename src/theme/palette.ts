// THE colour file for everything inside the board and the Studio game engines (main 2026-11-11, design revamp phase 2,
// decision dc-r8-design-direction-a). Every colour the board renderer (src/modules/whiteboard/**) and the studio-v2
// engines (src/studio-v2/**) draw with is named here, once, by ROLE; no other file in those paths holds a colour literal
// (tests/theme-palette.test.mjs: a hex, rgb() or hsl() literal anywhere else fails).
//
// Two themes, one set of names:
//   night — what is live today. Its values are today's literals, unchanged: the colour trace (every colour every engine
//           draws with, in order; tests/fixtures/studio-v2-colour-trace.json) and the board palettes must read the same.
//   paper — direction A, "Paper and ink" (prototypes/r8-design/a-paper on claude/r8-design): ink on a warm paper ground,
//           indigo for the part she is talking about, green for the answer, rust for a mix-up. A DRAFT: the Design
//           session sets the final values in its token file and sends changes as patches under docs/patches/to-studio/.
// Meaning is carried by the part, answer and mix-up roles (and their shapes: shared/whiteboard.js ROLE), never by red
// against green alone, and never by brightness alone (tests/theme-palette.test.mjs measures both themes).
//
// Inside the live Desk the board can also take Kaksha's tokens (palette.ts kakshaBoardSkin: the --k-* CSS variables the
// Design session owns); the board values here are what it draws with everywhere else, and its fallback.

export type ThemeName = "night" | "paper";
export const THEME_NAMES: readonly ThemeName[] = ["night", "paper"];
export const DEFAULT_THEME: ThemeName = "night";

/** The roles main named (2026-11-11), the same in both themes. Board and engines read their colours through these. */
export interface Roles {
  ground: string;       // what everything is drawn on
  ink: string;          // text and strokes
  inkQuiet: string;     // secondary text, soft labels
  focus: string;        // the part being talked about (her colour: she is pointing at it)
  answer: string;       // the answer mark (a tick or a box: shape carries it too)
  mixup: string;        // the mix-up (always dashed; never red, never a verdict)
  guide: string;        // guides and grid lines
  labelGround: string;  // the card a label sits on
  child: string;        // the child's own marks ("your move")
  right: string;        // right feedback
  wrong: string;        // wrong feedback ("look again": warm, never red)
}

/** The Studio engines' surfaces and accents (src/studio-v2/core/tokens.ts `C` reads the active theme's table). */
export interface StudioColours {
  bg: string; bg1: string; bg2: string; bg3: string; stage: string; board: string;
  ink: string; ink2: string; ink3: string;
  ion: string; ionDeep: string; volt: string; mint: string; amber: string; sci: string; sun: string;
  line: string; line2: string;
  /** a light wash over the ground (night: white at low alpha; paper: ink at low alpha) */
  hi: string;
  /** a dark wash (night and paper: black at low alpha) */
  lo: string;
  /** the dark stage ink on a bright fill (a label on a note, a coin) */
  onBright: string;
}

/** The board's inks per ground (src/modules/whiteboard/palette.ts reads these). */
export interface BoardInks { chalk: string; accent: string; ink: string; mark: string; good: string; soft: string }
export interface BoardRoleInks { focus: string; slot: string; answer: string; mixup: string; muted: string }
export interface BoardPaletteValues { ground: string; edge: string; grid?: string; fillAlpha: number; ink: BoardInks; role: BoardRoleInks }

export interface Theme {
  name: ThemeName;
  roles: Roles;
  studio: StudioColours;
  /** board palettes by the script's ground (a script names chalk, paper or grid; the theme decides how each looks) */
  board: { chalk: BoardPaletteValues; paper: BoardPaletteValues; grid: BoardPaletteValues };
}

// ── night: today's values, unchanged ──────────────────────────────────────────────────────────────────────────────────
const NIGHT_STUDIO: StudioColours = {
  bg: "#0A0C12", bg1: "#10131B", bg2: "#161A24", bg3: "#1F2431", stage: "#0D1017", board: "#0E1118",
  ink: "#F2F4F8", ink2: "#A9B0C0", ink3: "#848CA0",
  ion: "#8B98FF", ionDeep: "#4F5BD5", volt: "#CBFF4D", mint: "#3DDC97", amber: "#FFB547",
  sci: "#2FD3C7", sun: "#FFD27A", line: "rgba(255,255,255,.08)", line2: "rgba(255,255,255,.15)",
  hi: "#FFFFFF", lo: "#000000", onBright: "#14161C",
};
const NIGHT_CHALK: BoardPaletteValues = {
  ground: "#1F3B30", edge: "#8C6B4A", fillAlpha: 0.32,
  ink: { chalk: "#F5F2E8", ink: "#F5F2E8", accent: "#F2C66D", mark: "#F4A261", good: "#9ED8A6", soft: "#BFD3C6" },
  // (design r8's night direction, on the chalk ground: focus her blue-violet, answer green, mix-up amber — never red)
  role: { focus: "#A9B4FF", slot: "#7FE0B0", answer: "#7FE0B0", mixup: "#FFB54A", muted: "#9DB3A6" },
};
const NIGHT_PAPER: BoardPaletteValues = {
  ground: "#FFFBF2", edge: "#D9CDB8", fillAlpha: 0.26,
  ink: { chalk: "#2B2620", ink: "#2B2620", accent: "#1F5FBF", mark: "#C8641A", good: "#2E7D4F", soft: "#8A7F70" },
  // (design r8's paper direction: --focus #3B47B0, --ans #1C7348, --mix #A84B22, --board-soft #6F675B)
  role: { focus: "#3B47B0", slot: "#1C7348", answer: "#1C7348", mixup: "#A84B22", muted: "#6F675B" },
};
export const NIGHT: Theme = {
  name: "night",
  roles: {
    ground: NIGHT_STUDIO.board, ink: NIGHT_STUDIO.ink, inkQuiet: NIGHT_STUDIO.ink2, focus: NIGHT_STUDIO.ion, answer: NIGHT_STUDIO.mint,
    mixup: NIGHT_STUDIO.amber, guide: NIGHT_STUDIO.line2, labelGround: NIGHT_STUDIO.bg1, child: NIGHT_STUDIO.volt, right: NIGHT_STUDIO.mint, wrong: NIGHT_STUDIO.amber,
  },
  studio: NIGHT_STUDIO,
  board: { chalk: NIGHT_CHALK, paper: NIGHT_PAPER, grid: { ...NIGHT_PAPER, grid: "#E6DCCB" } },
};

// ── paper: direction A, a draft (prototypes/r8-design/a-paper/tokens.css) ─────────────────────────────────────────────
const PAPER_STUDIO: StudioColours = {
  bg: "#F4EFE6", bg1: "#FFFDF8", bg2: "#EBE4D7", bg3: "#E0D7C7", stage: "#F4EFE6", board: "#FFFDF8",
  ink: "#1C1A16", ink2: "#4B453C", ink3: "#655E53",
  // her indigo for the part in focus; the child's move is marigold's text-safe dark (--move-text); green for right,
  // rust for "look again"; the science teal and the sun deepened to carry on paper
  // (answer #185850 and mix-up #B6581E, not the prototype's #1C7348 / #A84B22: those two merge for a red-green-blind
  // child (tests/theme-palette.test.mjs); these differ in lightness, 8.1 against 4.7 : 1 on paper, and both carry text)
  ion: "#3B47B0", ionDeep: "#2A3490", volt: "#7E4C00", mint: "#185850", amber: "#B6581E",
  sci: "#0E6B66", sun: "#8A5A00", line: "rgba(28,26,22,.10)", line2: "rgba(28,26,22,.22)",
  hi: "#1C1A16", lo: "#000000", onBright: "#1C1A16",
};
const PAPER_BOARD: BoardPaletteValues = {
  ground: "#FFFDF8", edge: "#E0D7C7", fillAlpha: 0.26,
  ink: { chalk: "#1C1A16", ink: "#1C1A16", accent: "#3B47B0", mark: "#B6581E", good: "#185850", soft: "#6F675B" },
  role: { focus: "#3B47B0", slot: "#185850", answer: "#185850", mixup: "#B6581E", muted: "#6F675B" },
};
export const PAPER: Theme = {
  name: "paper",
  roles: {
    ground: PAPER_STUDIO.board, ink: PAPER_STUDIO.ink, inkQuiet: PAPER_STUDIO.ink2, focus: PAPER_STUDIO.ion, answer: PAPER_STUDIO.mint,
    mixup: PAPER_STUDIO.amber, guide: PAPER_STUDIO.line2, labelGround: PAPER_STUDIO.bg1, child: PAPER_STUDIO.volt, right: PAPER_STUDIO.mint, wrong: PAPER_STUDIO.amber,
  },
  studio: PAPER_STUDIO,
  // (every ground the script names is paper under this theme; grid keeps its lines)
  board: { chalk: PAPER_BOARD, paper: PAPER_BOARD, grid: { ...PAPER_BOARD, grid: "#E6DCCB" } },
};

export const THEMES: Readonly<Record<ThemeName, Theme>> = { night: NIGHT, paper: PAPER };
export const themeOf = (name: string | null | undefined): Theme => THEMES[(name as ThemeName)] ?? THEMES[DEFAULT_THEME];

// ── engine colours by meaning, batch 1 ────────────────────────────────────────────────────────────────────────────────
// Colours an engine draws with that are not a surface above (a note's paper, a card wash, a planet). Each key names what
// it is FOR; night is the exact value the engine drew before (the colour trace proves it), paper is a draft. Engines
// read them as C.<key> (src/studio-v2/core/tokens.ts merges these tables into C for the active theme).
export const ENGINE_1 = {
  night: {
    // moon
    moonDarkSide: "#1A2030", moonDarkSideEclipse: "#1C222F", moonDarkSideBlood: "#3A1A12", moonLitEclipse: "#F2F0EA",
    moonBlood: "#D0673C", moonLit: "#F4F2EC", moonLitEdgeEclipse: "#B9BCC6", moonBloodEdge: "#7A2E18",
    moonLitEdge: "#B5B9C4", moonCrater: "#3A4050", moonPhaseDark: "#151A26", moonPhaseEdge: "#A9AEBA",
    moonPhaseBloodEdge: "#6A2A16", moonPhaseCrater: "#2E3443", moonEarthSea: "#3F8BF0", moonEarthSeaDeep: "#13408F",
    moonEarthLand: "#5CAA6E", moonEarthIce: "#F0F6FF", moonEarthNight: "#040712", moonEarthAir: "#82BEFF",
    moonDuskTop: "#070A1C", moonDuskMid: "#1A1D46", moonDuskLow: "#4A2E58", moonDuskGlow: "#C0705A",
    moonStar: "#E8ECFF", moonSkyline: "#06070D", moonWindowLight: "#FFCE82", moonSpaceCore: "#0D1120",
    moonSpace: "#05060B", moonStarFar: "#C9D2F2", moonSunGlow: "#FFB24A", moonSunCore: "#FFF4D6", moonSunRim: "#FFA94A",
    moonVoid: "#07080E", moonShine: "#DDE6FF", moonOrbit: "#AAB4D2", moonSunArc: "#FFC86B", moonSunLabel: "#3A2208",
    moonShadowLabel: "#9AA6C8", moonEclipseLabel: "#E8956A", moonPaneSkyTop: "#0A1030", moonPaneSkyMid: "#1B2353",
    moonPaneSkyLow: "#3B2A55", moonPaneStar: "#E6EAFF", moonBloodWash: "#963C1E",
    // heat
    heatStones: "#8E96A8", heatRice: "#F2EEDC", heatFlour: "#EDE6D3", heatHusk: "#C9A26B", heatSand: "#D9B36C",
    heatSugar: "#FFF4D6", heatIron: "#5A6070", heatSawdust: "#B88B5A", heatChalk: "#F4F4F4", heatFinBlack: "#15171C",
    heatFinDark: "#3E4A5C", heatFinShiny: "#C8D0DC", heatAccent: "#FF8F6B", heatVessel: "#2A3142", heatWet: "#5AA0FF",
    heatRod: "#3A4256", heatWax: "#F3E7C4", heatRodEdge: "#C9D2E8", heatLabelDark: "#0B0E14", heatPale: "#E8ECF5",
    heatDaySky: "#78AAE6", heatNightSky: "#141E3C", heatDark: "#151A28", heatSea: "#1F5D8C", heatLand: "#6D5A3A",
    heatSeaLabel: "#CFE3FF", heatLandLabel: "#F3E1C0", heatSeaTemp: "#9FD0FF", heatLandTemp: "#FFD49A",
    heatCool: "#BFE4FF", heatWarm: "#FFB0A0", heatNeutral: "#E0E6F0", heatRadiator: "#4A3A2E", heatSalt: "#FFFFFF",
    heatFinWhite: "#F2F4F8",
    // sky
    skyAccent: "#9FB7FF", skySunCore: "#FFF6D0", skyMoonDark: "#1E222C", skyMoonLit: "#F2F0E6", skyEarthSea: "#1C4E7A",
    skyEarthLand: "#4E7A4A", skyNightSide: "#03060E", skyEarthLit: "#5FA8FF", skyEarthDark: "#0D2440",
    skyEarth: "#3D7BD9", skyMoonShade: "#2A2E38", skyMoon: "#E8ECF5", skyMoonGrey: "#D8DCE6", skyCard: "#0A0D14",
    skyBloodMoon: "#A0281E", skyDomeTop: "#0F1B3A", skyDome: "#070B18", skyTrack: "#A0BEFF", skyStar: "#C8D2FF",
    skyStarBright: "#F2F5FF",
    // phase
    phaseBurner: "#151924", phaseHeatGlow: "#FF8A4C", phaseCool: "#7FD6FF", phaseGlass: "#DCE6FF", phaseDrop: "#9FD8F0",
    phaseIceBond: "#BEEBFF", phaseIce: "#CFF2FF", phaseWaterCold: "#5F7BFF", phaseWaterHot: "#9AA7FF",
    phaseHeat: "#FF9A5C", phaseKnob: "#1F2536",
    // dukaan
    dkNoteUnknown: "#999999", dkNote500: "#9AA0A6", dkNote200: "#F2C230", dkNote100: "#B9A4E0", dkNote50: "#5FC8E8",
    dkNote20: "#C7D85A", dkNote10: "#9C6B48", dkCoinSmall: "#B7BCC4", dkCoin: "#C9CED6", dkCoinGold: "#C9B26A",
    dkCounter: "#3C2818", dkLamp: "#FFC878", dkCard: "#18161E", dkTray: "#0E1016", dkTill: "#12100E",
    dkCrate: "#3C2D19", dkCrateFill: "#966E3C", dkButton: "#16181E",
    // watercycle
    wcInset: "#121726", wcSkyTop: "#08122A", wcSkyMid: "#1A2C55", wcSkyLow: "#3E5482", wcStar: "#DDE6FF",
    wcLand: "#1E2B25", wcHills: "#2D3650", wcSnow: "#E6ECF5", wcSunGlow: "#FFC46B", wcSun: "#FFE7A8", wcSoil: "#2A2118",
    wcGroundWater: "#5096FF", wcGrain: "#6B5642", wcSeep: "#A0CDFF", wcSea: "#1E5594", wcSeaDeep: "#0B2142",
    wcSeaLine: "#C8E1FF", wcRiver: "#6EAAFF", wcCloud: "#EBF0FA", wcCloudShade: "#AAB4C8", wcInsetHill: "#4A5168",
    wcVapourLabel: "#BFD4FF", wcRainLabel: "#9CC4FF", wcVapour: "#DCEBFF", wcRain: "#96C3FF", wcMist: "#F0F4FA",
    // solarscale
    solarSpaceCore: "#151A2E", solarSpace: "#05060B", solarStar: "#C9D2F2", solarSunGlow: "#FFC46B",
    solarSun: "#FFE3A0", solarRing: "#E6D29A", solarFarSunGlow: "#FFF3C8", solarFarSun: "#FFF8E0",
    solarEarthGlow: "#4F8FEA", solarEarth: "#6FA3F0", solarOrbit: "#FFE2A0", solarLabel: "#9CC4FF",
    // vault
    vaultTileShade: "#141828", vaultTray: "#151925", vaultDigit100: "#C69BFF", vaultDigit10000: "#7FD6FF",
    vaultBgTop: "#0A0B11", vaultBg: "#11131C", vaultBelt: "#1A1F2C", vaultBeltEdge: "#0D0F17", vaultLaser: "#FF9678",
    vaultLaserGlow: "#FF9A78",
    // beam
    beamCrateLow: "#141829", beamBgTop: "#0B0C13", beamBg: "#13141D", beamFloor: "#171A25", beamPan: "#9AA3B8",
    beamLabelDark: "#0B0D14", beamKilo: "#C9D0E6", beamMysteryTop: "#3A2E14", beamCrateTop: "#232A45",
    beamMysteryLow: "#211A0B", beamFulcrum: "#262C3D", beamBarHi: "#C9CFE0", beamBarLo: "#6B7390", beamPeg: "#1A1F2C",
    beamHook: "#2F3547", beamHanger: "#3A4157",
    // data
    dataRoad: "#151924", dataCar: "#9AA7FF", dataBus: "#C9D0E6", dataAuto: "#CBD58A", dataTruck: "#B7A79A",
    dataGlass: "#0A0C14", dataDarkPart: "#1F2536", dataLamp: "#FFF2C0", dataLight: "#3A4256",
    // area
    areaPlot: "#101712", areaBgTop: "#0A0D12", areaBg: "#0F1511", areaSoil: "#16211A", areaSoilAlt: "#18241C",
    areaSprout: "#7BE3A9", areaPaved: "#343C52",
    // pattern
    patPoly3: "#FF8FB1", patBlue: "#5FA8FF", patPoly5: "#C9A7FF", patPoly6: "#7FD3A6", patPoly12: "#9FE7FF",
    patLabelDark: "#0B0E14",
    // beat
    beatRightCard: "#142820", beatChip: "#181428", beatAccent: "#FF8FB1", beatGlow: "#1C1530", beatBgMid: "#0F0D1C",
    beatBg: "#06060B", beatCue: "#12101E", beatWrongCard: "#281E10",
    // foodweb
    fwBgTop: "#0A0D10", fwBgMid: "#0D1410", fwBg: "#0C120E", fwGrass: "#7BD389", fwLostCard: "#281E16",
    // field
    fieldNorth: "#FF5A6E", fieldSouth: "#5FA8FF", fieldNeutral: "#7A8094", fieldLabelDark: "#0B0E14",
    fieldTrack: "#2A3142", fieldMap: "#1E3324", fieldCompass: "#E8ECF5",
    // landfall
    landCardLow: "#141829", landSkyTop: "#090B11", landSkyMid: "#0E1220", landSkyLow: "#151A33", landGround: "#0B0D15",
    landCardTop: "#232A45",
    // picto
    pictoShelf: "#121621", pictoPink: "#FF8FB1",
    // zero
    zeroBelt: "#121621", zeroNeg: "#5FA8FF", zeroTray: "#0E1018",
    // runner
    runSkyMid: "#121732", runSkyTop: "#090B12", runSkyLow: "#0A0C14", runCity: "#0C0F1D", runGround: "#0B0D16",
    // era
    eraPod: "#181426", eraAccent: "#C9A7FF", eraDust: "#D9C8FF",
    // mirror
    mirrorAccent: "#FF8FB1", mirrorBoard: "#12141E",
    // sieve
    sieveCell: "#181C2E",
  },
  paper: {
    // moon
    moonDarkSide: "#D5DAE8", moonDarkSideEclipse: "#D6DBE7", moonDarkSideBlood: "#3A1A12", moonLitEclipse: "#F2F0EA",
    moonBlood: "#D0673C", moonLit: "#F4F2EC", moonLitEdgeEclipse: "#B9BCC6", moonBloodEdge: "#7A2E18",
    moonLitEdge: "#B5B9C4", moonCrater: "#C3C8D4", moonPhaseDark: "#DBE0EB", moonPhaseEdge: "#A9AEBA",
    moonPhaseBloodEdge: "#6A2A16", moonPhaseCrater: "#CBCFDB", moonEarthSea: "#3F8BF0", moonEarthSeaDeep: "#13408F",
    moonEarthLand: "#5CAA6E", moonEarthIce: "#F0F6FF", moonEarthNight: "#040712", moonEarthAir: "#82BEFF",
    moonDuskTop: "#E4E6F1", moonDuskMid: "#CCCEE4", moonDuskLow: "#D2BDDC", moonDuskGlow: "#C0705A",
    moonStar: "#E8ECFF", moonSkyline: "#2B2620", moonWindowLight: "#FFCE82", moonSpaceCore: "#E0E3EE",
    moonSpace: "#EBEDF5", moonStarFar: "#C9D2F2", moonSunGlow: "#FFB24A", moonSunCore: "#FFF4D6", moonSunRim: "#FFA94A",
    moonVoid: "#EAEBF3", moonShine: "#DDE6FF", moonOrbit: "#AAB4D2", moonSunArc: "#FFC86B", moonSunLabel: "#35220D",
    moonShadowLabel: "#3A466A", moonEclipseLabel: "#834221", moonPaneSkyTop: "#DBDEEC", moonPaneSkyMid: "#C7CBE1",
    moonPaneSkyLow: "#CCC0DD", moonPaneStar: "#E6EAFF", moonBloodWash: "#963C1E",
    // heat
    heatStones: "#8E96A8", heatRice: "#F2EEDC", heatFlour: "#EDE6D3", heatHusk: "#C9A26B", heatSand: "#D9B36C",
    heatSugar: "#FFF4D6", heatIron: "#5A6070", heatSawdust: "#B88B5A", heatChalk: "#F4F4F4", heatFinBlack: "#15171C",
    heatFinDark: "#3E4A5C", heatFinShiny: "#C8D0DC", heatAccent: "#FF8F6B", heatVessel: "#CBD0DE", heatWet: "#5AA0FF",
    heatRod: "#BFC5D4", heatWax: "#F3E7C4", heatRodEdge: "#C9D2E8", heatLabelDark: "#1C1A16", heatPale: "#E8ECF5",
    heatDaySky: "#78AAE6", heatNightSky: "#D3D8E7", heatDark: "#DADEEB", heatSea: "#1F5D8C", heatLand: "#6D5A3A",
    heatSeaLabel: "#214983", heatLandLabel: "#836021", heatSeaTemp: "#215383", heatLandTemp: "#835921",
    heatCool: "#BFE4FF", heatWarm: "#FFB0A0", heatNeutral: "#E0E6F0", heatRadiator: "#4A3A2E", heatSalt: "#FFFFFF",
    heatFinWhite: "#F2F4F8",
    // sky
    skyAccent: "#9FB7FF", skySunCore: "#FFF6D0", skyMoonDark: "#D8DCE5", skyMoonLit: "#F2F0E6", skyEarthSea: "#B7C9D8",
    skyEarthLand: "#4E7A4A", skyNightSide: "#03060E", skyEarthLit: "#5FA8FF", skyEarthDark: "#D4DDE8",
    skyEarth: "#3D7BD9", skyMoonShade: "#D2D5DD", skyMoon: "#E8ECF5", skyMoonGrey: "#D8DCE6", skyCard: "#E6E9F2",
    skyBloodMoon: "#A0281E", skyDomeTop: "#D5DBE9", skyDome: "#E6E8F1", skyTrack: "#A0BEFF", skyStar: "#C8D2FF",
    skyStarBright: "#F2F5FF",
    // phase
    phaseBurner: "#DDE0EB", phaseHeatGlow: "#FF8A4C", phaseCool: "#7FD6FF", phaseGlass: "#DCE6FF", phaseDrop: "#9FD8F0",
    phaseIceBond: "#BEEBFF", phaseIce: "#CFF2FF", phaseWaterCold: "#5F7BFF", phaseWaterHot: "#9AA7FF",
    phaseHeat: "#FF9A5C", phaseKnob: "#D2D7E5",
    // dukaan
    dkNoteUnknown: "#999999", dkNote500: "#9AA0A6", dkNote200: "#F2C230", dkNote100: "#B9A4E0", dkNote50: "#5FC8E8",
    dkNote20: "#C7D85A", dkNote10: "#9C6B48", dkCoinSmall: "#B7BCC4", dkCoin: "#C9CED6", dkCoinGold: "#C9B26A",
    dkCounter: "#E6DAD1", dkLamp: "#FFC878", dkCard: "#E3E1E9", dkTray: "#E5E8EF", dkTill: "#EEEBE9",
    dkCrate: "#E6DDD1", dkCrateFill: "#966E3C", dkButton: "#E1E3E9",
    // watercycle
    wcInset: "#DCE0EC", wcSkyTop: "#DEE3ED", wcSkyMid: "#C6CEE1", wcSkyLow: "#3E5482", wcStar: "#DDE6FF",
    wcLand: "#D9E5DF", wcHills: "#C2C9DD", wcSnow: "#E6ECF5", wcSunGlow: "#FFC46B", wcSun: "#FFE7A8", wcSoil: "#E9E1D9",
    wcGroundWater: "#5096FF", wcGrain: "#6B5642", wcSeep: "#A0CDFF", wcSea: "#1E5594", wcSeaDeep: "#D4DCE8",
    wcSeaLine: "#C8E1FF", wcRiver: "#6EAAFF", wcCloud: "#EBF0FA", wcCloudShade: "#AAB4C8", wcInsetHill: "#4A5168",
    wcVapourLabel: "#214183", wcRainLabel: "#214883", wcVapour: "#DCEBFF", wcRain: "#96C3FF", wcMist: "#F0F4FA",
    // solarscale
    solarSpaceCore: "#D8DBEA", solarSpace: "#EBEDF5", solarStar: "#C9D2F2", solarSunGlow: "#FFC46B",
    solarSun: "#FFE3A0", solarRing: "#E6D29A", solarFarSunGlow: "#FFF3C8", solarFarSun: "#FFF8E0",
    solarEarthGlow: "#4F8FEA", solarEarth: "#6FA3F0", solarOrbit: "#FFE2A0", solarLabel: "#214883",
    // vault
    vaultTileShade: "#DADEEB", vaultTray: "#DCE0EB", vaultDigit100: "#C69BFF", vaultDigit10000: "#7FD6FF",
    vaultBgTop: "#E8E9F1", vaultBg: "#E2E4ED", vaultBelt: "#D8DCE8", vaultBeltEdge: "#E4E7F0", vaultLaser: "#FF9678",
    vaultLaserGlow: "#FF9A78",
    // beam
    beamCrateLow: "#DADDEB", beamBgTop: "#E7E8F1", beamBg: "#E1E2EC", beamFloor: "#DCDFE9", beamPan: "#9AA3B8",
    beamLabelDark: "#1C1A16", beamKilo: "#C9D0E6", beamMysteryTop: "#E7E1D3", beamCrateTop: "#C9CEE2",
    beamMysteryLow: "#EFEAE1", beamFulcrum: "#CED3E0", beamBarHi: "#C9CFE0", beamBarLo: "#6B7390", beamPeg: "#D8DCE8",
    beamHook: "#C8CDDB", beamHanger: "#BFC4D4",
    // data
    dataRoad: "#DDE0EB", dataCar: "#9AA7FF", dataBus: "#C9D0E6", dataAuto: "#CBD58A", dataTruck: "#B7A79A",
    dataGlass: "#E6E8F2", dataDarkPart: "#D2D7E5", dataLamp: "#FFF2C0", dataLight: "#BFC5D4",
    // area
    areaPlot: "#E5EDE7", areaBgTop: "#E7EBF2", areaBg: "#E6EEE9", areaSoil: "#DFEAE3", areaSoilAlt: "#DDE8E1",
    areaSprout: "#7BE3A9", areaPaved: "#C1C7D8",
    // pattern
    patPoly3: "#FF8FB1", patBlue: "#5FA8FF", patPoly5: "#C9A7FF", patPoly6: "#7FD3A6", patPoly12: "#9FE7FF",
    patLabelDark: "#1C1A16",
    // beat
    beatRightCard: "#DAEBE4", beatChip: "#DEDAEB", beatAccent: "#FF8FB1", beatGlow: "#DCD7E9", beatBgMid: "#E4E2EF",
    beatBg: "#EBEBF4", beatCue: "#E2E0EE", beatWrongCard: "#ECE5DC",
    // foodweb
    fwBgTop: "#E9EDF1", fwBgMid: "#E7EFEA", fwBg: "#E8F0EB", fwGrass: "#7BD389", fwLostCard: "#EBE1DA",
    // field
    fieldNorth: "#FF5A6E", fieldSouth: "#5FA8FF", fieldNeutral: "#7A8094", fieldLabelDark: "#1C1A16",
    fieldTrack: "#CBD0DE", fieldMap: "#D4E5D9", fieldCompass: "#E8ECF5",
    // landfall
    landCardLow: "#DADDEB", landSkyTop: "#E8EAF2", landSkyMid: "#E0E3EE", landSkyLow: "#D6D9E9", landGround: "#E5E8F1",
    landCardTop: "#C9CEE2",
    // picto
    pictoShelf: "#DEE2ED", pictoPink: "#FF8FB1",
    // zero
    zeroBelt: "#DEE2ED", zeroNeg: "#5FA8FF", zeroTray: "#E4E6EF",
    // runner
    runSkyMid: "#D7DAEA", runSkyTop: "#E7EAF2", runSkyLow: "#E6E8F2", runCity: "#E2E4EF", runGround: "#E5E7F1",
    // era
    eraPod: "#DFDBEC", eraAccent: "#C9A7FF", eraDust: "#D9C8FF",
    // mirror
    mirrorAccent: "#FF8FB1", mirrorBoard: "#E0E2ED",
    // sieve
    sieveCell: "#D6DAE9",
  },
} satisfies Record<ThemeName, Record<string, string>>;

/** A colour string from channels (an engine that computes a colour builds it here, so no engine holds a colour literal). */
export const rgbaOf = (r: number, g: number, b: number, a = 1): string => (a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`);
/** hsl / hsla from channels (hue in degrees; saturation and lightness in %). */
export const hslaOf = (h: number, s: number, l: number, a = 1): string => (a >= 1 ? `hsl(${h},${s}%,${l}%)` : `hsla(${h},${s}%,${l}%,${a})`);
/** A palette colour (hex #rgb / #rrggbb, or an rgb() string) at an alpha. */
export function withAlpha(colour: string, a: number): string {
  if (colour.startsWith("rgb")) return colour;
  const h = colour.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((x) => x + x).join("") : h, 16);
  return rgbaOf((n >> 16) & 255, (n >> 8) & 255, n & 255, a);
}

// ── engine colours by meaning, batch 2 ────────────────────────────────────────────────────────────────────────────────
export const ENGINE_2 = {
  night: {
  },
  paper: {
  },
} satisfies Record<ThemeName, Record<string, string>>;
