/*
 * Pixel grids for the footer runner game. Every non "." character is a filled
 * cell; rows may differ in length (missing cells are empty). Sprites face right
 * (birds face left, towards the runner) and are drawn bottom-aligned.
 */

export type Sprite = readonly string[]

export type CharacterId = "dino" | "cat" | "mark"

export const CHARACTERS: readonly { id: CharacterId; label: string }[] = [
  { id: "dino", label: "Dino" },
  { id: "cat", label: "Cat" },
  { id: "mark", label: "tweenly" },
]

export const isCharacter = (v: unknown): v is CharacterId => v === "dino" || v === "cat" || v === "mark"

const DINO_BODY = [
  "...........########.",
  "..........##.#######",
  "..........##########",
  "..........##########",
  "..........#####.....",
  "..........########..",
  "#........#####......",
  "#.......######......",
  "##.....#########....",
  "###...#######..#....",
  "##############......",
  ".############.......",
  "..###########.......",
  "...#########........",
  "....#######.........",
]

export type CharacterSprites = { run: readonly [Sprite, Sprite]; air: Sprite; idle: Sprite }

const DINO_AIR: Sprite = [...DINO_BODY, "....###.##..", "....##...#..", "....#....#..", "....##...##."]

export const DINO: CharacterSprites = {
  run: [
    [...DINO_BODY, "....###.##..", "....##...##.", "....#.......", "....##......"],
    [...DINO_BODY, "....###.##..", ".....##..#..", ".........#..", ".........##."],
  ],
  air: DINO_AIR,
  idle: DINO_AIR,
}

const CAT_BODY = [
  "...................#...#",
  "...................##.##",
  "..##...............#####",
  ".#.................#.###",
  ".#.................#####",
  "..#...###############...",
  "...#################....",
  "....################....",
  "....################....",
  "....###############.....",
]

export const CAT: CharacterSprites = {
  run: [
    [...CAT_BODY, "...##............##.", "..##..............##", "..#................#"],
    [...CAT_BODY, ".....##.......##....", ".....##.......##....", ".....#........#....."],
  ],
  air: [...CAT_BODY, "...##............##.", "..##..............##", "..#................#"],
  idle: [...CAT_BODY, "....##.........##...", "....##.........##...", "....#..........#...."],
}

export const BIRD: readonly [Sprite, Sprite] = [
  [
    "......#.......",
    "......##......",
    "..#...###.....",
    ".##...####....",
    "############..",
    "....#########.",
    ".......####...",
    "..............",
    "..............",
    "..............",
  ],
  [
    "..............",
    "..............",
    "..#...........",
    ".##...........",
    "############..",
    "....#########.",
    "......####....",
    "......###.....",
    "......##......",
    "......#.......",
  ],
]

/** Width in cells of the widest row. */
export const spriteCols = (s: Sprite) => s.reduce((m, row) => Math.max(m, row.length), 0)
