import { Solution } from "./puzzle/solution";

export const referenceSolution = {
    problem: { // problems[23]
        puzzleId: "chemstack@2",
        seed: "4242",
        substanceMaxCount: 10,
        substanceCount: 6,
        ingredientCount: 3,
        targets: ["9,5+,9", ";/,", "05=(+,9", "6<;"],
    },
    actions: [
        { action: "addTube", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [1] },
        { action: "pourFromMainIntoSecondary", args: [] },
        { action: "swapTubes", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "pourFromSecondaryIntoMain", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [1] },
        { action: "addTube", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addTube", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [0] },
        { action: "pourFromMainIntoSecondary", args: [] },
        { action: "trashTube", args: [] },
        { action: "pourFromMainIntoSecondary", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [1] },
        { action: "pourFromMainIntoSecondary", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [1] },
        { action: "addTube", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [1] },
        { action: "pourFromMainIntoSecondary", args: [] },
        { action: "pourFromSecondaryIntoMain", args: [] },
        { action: "addIngredient", args: [1] },
        { action: "addTube", args: [] },
        { action: "addIngredient", args: [0] },
        { action: "addIngredient", args: [0] },
        { action: "pourFromMainIntoSecondary", args: [] },
        { action: "trashTube", args: [] },
        { action: "addTube", args: [] },
        { action: "pourFromSecondaryIntoMain", args: [] },
        { action: "pourFromSecondaryIntoMain", args: [] },
        { action: "pourFromSecondaryIntoMain", args: [] },
    ],
} as Solution;

export const referenceSolutionStats = {
    actionCount: 37,
    maxAddedTubeCount: 2,
    price: 15
};