import { puzzleId } from "./puzzleId";

export const problems = [
    {
        name: "Level 1",
        substanceCount: 3,
        ingredientCount: 3,
        targets: ["..."],
    },

    ...[
        ["..."],
        [".*.", "-.-"],
        ["@#@"],
        ["$"],
        ["!!", "$.$"],
        ["-.-", "%"],
    ].map((targets, i) => ({
        name: `Level 2-${i + 1}`,
        substanceCount: 4,
        ingredientCount: 3,
        targets,
    })),

    ...[{
        substanceCount: 5,
        ingredientCount: 3,
        targets: [[
            ['5,>'],
            ['*(70;(3', '6-'],
            [';/,', '-9,,', '>693+'],
            ['>033', '56;', '-(33'],
            ['6-', '-0,9@', '5,,+3,:'],
            ['-964', ';/,', ':2@', '6-'],
            ['70,9*05.', '5,,+3,:', ':/(;;,9,+', '-9(.4,5;:'],
        ]],
    }, {
        substanceCount: 6,
        ingredientCount: 4,
        targets: [[
            [';6'],
            ['4(2,', '@6<', '>6<5+,+'],
            [';6', '4(2,', '@6<', '-,,3', '<5:(-,'],
            [';6', ';,(9', '/63,:'],
            ['05', '*65*9,;,', '>(33:'],
            ['56;', '-3<0+', ':>(94:'],
        ], [
            ['<50;,+'],
            [':(;<9(;,+', '>0;/', '('],
            ['7904(3', '>033', ';6'],
            ['9,5+,9', ';/,', '05=(+,9', '6<;'],
            ['+0:;<9),+', ';6', '/(:/'],
            ['6-', '-(03,+', ',4709,'],
            ['-(03,+', '9,=(5*/,'],
        ]],
    }].flatMap((p, i) => p.targets.flatMap((t1, j) => t1.map((targets, k) => ({
        substanceCount: p.substanceCount,
        ingredientCount: p.ingredientCount - j,
        targets,
        name: `Level ${2 + i + 1}-${j + 1}-${k + 1}`,
    })))),

    ...[
        { substanceCount: 7, ingredientCount: 4, },
        { substanceCount: 8, ingredientCount: 5, },
        { substanceCount: 9, ingredientCount: 5, },
        { substanceCount: 9, ingredientCount: 6, },
    ].flatMap((p, i) => {
        const a = (x: number) => Array.from({ length: x }, (_, i) => i);
        return a(p.ingredientCount - 3 + 1).flatMap((_, j) => a(7).map((_, k) => ({
            substanceCount: p.substanceCount,
            ingredientCount: p.ingredientCount - j,
            targets: a(Math.ceil(Math.sqrt(k)) + 1).map((_, x) => [i, j, k, x].join("@")),
            name: `Level ${4 + i + 1}-${j + 1}-${k + 1}`,
        })));
    }),

].map((problemPreset) => ({
    puzzleId,
    seed: "4242",
    substanceMaxCount: 10,
    ...problemPreset,
}));
