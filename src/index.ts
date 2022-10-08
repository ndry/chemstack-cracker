import { evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { Solution } from "./puzzle/solution";


console.log("puzzleId", puzzleId);
const refSolution = {
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

console.log("problem", refSolution.problem);
console.log("final state", evaluate(refSolution).state);