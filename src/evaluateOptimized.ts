import { Action } from "./puzzle/actions";
import { Problem } from "./puzzle/problem";
import { getProblemReactions } from "./puzzle/reactions";
import { initialState, State, SubstanceId } from "./puzzle/state";


export function evaluateEnv(problem: Problem) {
    const rejson = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

    const canAct = {
        addIngredient: (state: State, ingredientId: SubstanceId) =>
            true,

        addTube: (state: State) =>
            state.tubes.length <= 6,

        trashTube: (state: State) =>
            state.tubes.length > 1,

        pourFromMainIntoSecondary: (state: State) =>
            state.tubes[0].length > 0,

        pourFromSecondaryIntoMain: (state: State) =>
            state.tubes.length > 1 && state.tubes[1].length > 0,

        swapTubes: (state: State) =>
            state.tubes.length > 1,
    };

    const act = {
        addIngredient: (state: State, ingredientId: SubstanceId) => {
            state.tubes[0].push(ingredientId);

            state.stats.actionCount++;
            state.stats.price += ingredientId;
        },

        addTube: (state: State) => {
            const additionalTubes = state.tubes.length - 1;
            const newAdditionalTubes = additionalTubes + 1;
            const isExtraTube = newAdditionalTubes > state.stats.maxAddedTubeCount;
            state.tubes.unshift([]);

            state.stats.actionCount++;
            state.stats.maxAddedTubeCount = Math.max(
                state.stats.maxAddedTubeCount,
                newAdditionalTubes
            );
            state.stats.price += isExtraTube ? additionalTubes : 0;
        },

        trashTube: (state: State) => {
            const [trashed] = state.tubes.splice(0, 1);
            state.stats.actionCount++;
            for (let i = 0; i < trashed.length; i++) {
                state.stats.price += trashed[i];
            }
        },

        pourFromMainIntoSecondary: (state: State) => {
            const sidToPour = state.tubes[0].pop()!;

            if (state.tubes.length > 1) {
                state.tubes[1].push(sidToPour);
            } else {
                state.stats.price += sidToPour;
            }

            state.stats.actionCount++;
        },

        pourFromSecondaryIntoMain: (state: State) => {
            state.tubes[0].push(state.tubes[1].pop()!);
            state.stats.actionCount++;
        },

        swapTubes: (state: State) => {
            const t = state.tubes[0];
            state.tubes[0] = state.tubes[1];
            state.tubes[1] = t;
            state.stats.actionCount++;
        },
    };

    const rid = (r1: SubstanceId, r2: SubstanceId) => r1 * problem.substanceMaxCount + r2;
    const reactions = Object.fromEntries(
        getProblemReactions(problem)
            .map(r => [rid(...r.reagents), r]));

    return {
        canAct,
        possibleActions: [
            ...Array.from(
                { length: problem.ingredientCount },
                (_, sid) => ({ action: "addIngredient", args: [sid] })),
            { action: "addTube", args: [] },
            { action: "trashTube", args: [] },
            { action: "pourFromMainIntoSecondary", args: [] },
            { action: "pourFromSecondaryIntoMain", args: [] },
            { action: "swapTubes", args: [] },
        ] as Action[],
        evaluate: (actions1: Action[]) => {
            let state = initialState(problem);
            state.targets = rejson(state.targets);

            for (const action of actions1) {
                // @ts-ignore
                act[action.action](state, ...action.args);

                const { tubes, targets } = state;

                // react
                for (let i = 0; i < tubes.length; i++) {
                    const tube = tubes[i];
                    const reaction = reactions[rid(tube[tube.length - 2], tube[tube.length - 1])];
                    if (reaction) {
                        tube.splice(tube.length - 2, 2, ...reaction.products);
                    }
                }

                // clean
                for (let i = 0; i < tubes.length; i++) {
                    const tube = tubes[i];
                    if (tube.length > 3) {
                        const cleaned = tube.splice(3);
                        for (let j = 0; j < cleaned.length; j++) {
                            state.stats.price += cleaned[j];
                        }
                    }
                }

                // giveaway
                const target = targets[0];
                for (let i = 0; i < tubes.length; i++) {
                    const tube = state.tubes[i];
                    if (tube[0] === target[0] && tube[1] === target[1] && tube[2] === target[2]) {
                        tubes.splice(i, 1);
                        if (tubes.length === 0) { tubes.push([]); }
                        targets.splice(0, 1);
                        state.isSolved = state.targets.length === 0;
                        break;
                    }

                }
            }
            return state;
        }
    };
}
