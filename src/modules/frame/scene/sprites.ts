// scene@1 sprite library → glyphs. The production library is a manifest of flat, verified sprite images
// (genui-scene-dsl.mjs SPRITES); until those assets ship in the frame bundle, each id renders as a system
// emoji (no network: the frame CSP forbids fetching), and an unknown id renders as a labelled tile.
export const SPRITE_GLYPHS: Record<string, string> = {
  "obj.mango": "🥭", "obj.apple": "🍎", "obj.banana": "🍌", "obj.seed": "🌰", "obj.roti": "🫓", "obj.plate": "🍽️", "obj.matchstick": "🥢",
  "obj.bundle10": "🥢", "obj.coin1": "🪙", "obj.note10": "💵", "obj.ball": "⚽", "obj.bat": "🏏", "obj.bus": "🚌", "obj.book": "📘",
  "obj.pencil": "✏️", "obj.basket": "🧺", "obj.box": "📦", "obj.cup": "☕", "obj.bucket": "🪣", "obj.pot": "🍲", "obj.glass": "🥛",
  "obj.spoon": "🥄", "obj.ice_cube": "🧊", "obj.ruler": "📏",
  "animal.fish": "🐟", "animal.frog": "🐸", "animal.cow": "🐄", "animal.camel": "🐫", "animal.crow": "🐦‍⬛", "animal.duck": "🦆",
  "animal.goat": "🐐", "animal.snake": "🐍", "animal.lizard": "🦎", "animal.tiger": "🐅", "animal.whale": "🐋", "animal.crab": "🦀",
  "animal.dog": "🐕", "animal.cat": "🐈", "animal.hen": "🐔", "animal.elephant": "🐘", "animal.turtle": "🐢", "animal.octopus": "🐙",
  "animal.parrot": "🦜", "animal.butterfly": "🦋",
  "plant.flower": "🌸", "plant.tree": "🌳", "plant.cactus": "🌵", "plant.lotus": "🪷", "plant.grass": "🌿", "plant.seedling": "🌱",
  "plant.leaf": "🍃", "plant.root": "🫚", "plant.sprout": "🌱",
  "sky.sun": "☀️", "sky.moon": "🌙", "sky.cloud": "☁️", "sky.star": "⭐", "sky.rain": "🌧️",
  "sci.water_drop": "💧", "sci.bulb": "💡", "sci.battery": "🔋", "sci.magnet": "🧲", "sci.thermometer": "🌡️", "sci.beaker": "🧪",
  "sci.candle": "🕯️", "sci.puddle": "💧",
  "place.house": "🏠", "place.school": "🏫", "place.well": "⛲", "place.river": "🏞️", "place.hill": "⛰️", "place.pond": "💧",
  "people.child": "🧒", "people.farmer": "🧑‍🌾", "people.shopkeeper": "🧑‍💼",
  "shape.square": "◼", "shape.triangle": "▲", "shape.circle": "●",
};

export const glyph = (lib: string): string | null => SPRITE_GLYPHS[lib] ?? null;
