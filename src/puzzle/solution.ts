import { Action } from './actions';
import { getProblemCmpObj, Problem } from './problem';


export type Solution = {
    problem: Problem;
    actions: Action[];
};

/**
 * Re-structs object to ensure order and drop extra entries so that it can be structurally compared by JSON.stringify output
 */
export const getSolutionCmpObj = ({
    problem,
    actions,
}: Solution): Solution => ({
    problem: getProblemCmpObj(problem),
    actions: actions.map(({ action, args }) => {
        switch (action) {
            case "addIngredient": return { action, args: [args[0]] }
            case "addTube": return { action, args: [] }
            case "trashTube": return { action, args: [] }
            case "pourFromMainIntoSecondary": return { action, args: [] }
            case "pourFromSecondaryIntoMain": return { action, args: [] }
            case "swapTubes": return { action, args: [] }
        }
    }),
});


/**
 * Get a string, safe to use for structural comparison
 */
export const getSolutionCmp = (solution: Solution) =>
    JSON.stringify(getSolutionCmpObj(solution));

