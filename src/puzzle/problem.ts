export type Problem = {
    puzzleId: string; // e.g. "chemstack@5",
    seed: string;
    substanceMaxCount: number;
    substanceCount: number;
    ingredientCount: number;
    targets: string[];
};

/**
 * Re-structs object to ensure order and drop extra entries so that it can be structurally compared by JSON.stringify output
 */
export const getProblemCmpObj = ({
    puzzleId,
    seed,
    substanceMaxCount,
    substanceCount,
    ingredientCount,
    targets,
}: Problem): Problem => ({
    puzzleId,
    seed,
    substanceMaxCount,
    substanceCount,
    ingredientCount,
    targets,
});


/**
 * Get a string, safe to use for structural comparison
 */
export const getProblemCmp = (problem: Problem) =>
    JSON.stringify(getProblemCmpObj(problem));
