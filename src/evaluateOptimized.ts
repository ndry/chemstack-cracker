import { Action } from "./puzzle/actions";
import { Problem } from "./puzzle/problem";
import { getProblemReactions, Reaction } from "./puzzle/reactions";
import { SubstanceId } from "./puzzle/state";
import { getProblemTargets } from "./puzzle/targets";



// export type Stats = {
//     actionCount: number;
//     maxAddedTubeCount: number;
//     price: number;
// };

export function evaluateEnv(problem: Problem) {
    const sidBase = problem.substanceMaxCount;
    const sidBase2 = sidBase * sidBase;
    const sidBase3 = sidBase2 * sidBase;
    const sidBase4 = sidBase3 * sidBase;
    const sidBase5 = sidBase4 * sidBase;
    type TubeContent = number;
    const Tube = {
        // optimized context
        empty: 1,
        isEmpty: (tube: TubeContent) => tube === 1,

        push: (tube: TubeContent, sid: SubstanceId) => tube * sidBase + sid,
        _pop_out: -1,
        pop: (tube: TubeContent) => {
            Tube._pop_out = tube % sidBase;
            return Math.floor(tube / sidBase);
        },

        // slow context
        isTube: (tube: number) => {
            while (tube !== 0) {
                if (Tube.isEmpty(tube)) { return true; }
                tube = Tube.pop(tube);
            }
        },
        fromSidArray: (tube: SubstanceId[]) => tube.reduce((acc, val) => Tube.push(acc, val), Tube.empty),
        toSidArray(tube: TubeContent) {
            let arr: number[] = [];
            while (tube > 1) {
                tube = Tube.pop(tube);
                arr.unshift(Tube._pop_out);
            }
            return arr;
        }
    }

    type State = {
        tubes: TubeContent[];
        targetsSolved: number;
    };



    const canAct = {
        addIngredient: (state: State, ingredientId: SubstanceId) =>
            true,

        addTube: (state: State) =>
            state.tubes.length <= 6,

        trashTube: (state: State) =>
            state.tubes.length > 1,

        pourFromMainIntoSecondary: (state: State) =>
            !Tube.isEmpty(state.tubes[0]),

        pourFromSecondaryIntoMain: (state: State) =>
            state.tubes.length > 1 && !Tube.isEmpty(state.tubes[1]),

        swapTubes: (state: State) =>
            state.tubes.length > 1,
    };

    const act = {
        addIngredient: (state: State, ingredientId: SubstanceId) => {
            state.tubes[0] = Tube.push(state.tubes[0], ingredientId);
        },

        addTube: (state: State) => {
            state.tubes.unshift(Tube.empty);
        },

        trashTube: (state: State) => {
            state.tubes.shift();
        },

        pourFromMainIntoSecondary: (state: State) => {
            state.tubes[0] = Tube.pop(state.tubes[0]);
            const sidToPour = Tube._pop_out;

            if (state.tubes.length > 1) {
                state.tubes[1] = Tube.push(state.tubes[1], sidToPour);
            }
        },

        pourFromSecondaryIntoMain: (state: State) => {
            state.tubes[1] = Tube.pop(state.tubes[1]);
            const sidToPour = Tube._pop_out;
            state.tubes[0] = Tube.push(state.tubes[0], sidToPour);
        },

        swapTubes: (state: State) => {
            const t = state.tubes[0];
            state.tubes[0] = state.tubes[1];
            state.tubes[1] = t;
        },
    };

    const reactions = getProblemReactions(problem);
    const reactCleanTable = Array.from({ length: sidBase5 + 1 }, (_, t) => {
        if (!Tube.isTube(t)) { return t; }

        const tube = Tube.toSidArray(t);

        // react
        const reaction = reactions.find(r =>
            r.reagents[1] === tube[tube.length - 1]
            && r.reagents[0] === tube[tube.length - 2]);
        if (reaction) { tube.splice(tube.length - 2, 2, ...reaction.products); }
        
        // clean
        tube.splice(3);

        return Tube.fromSidArray(tube);
    })


    const targets = getProblemTargets(problem).map(Tube.fromSidArray);
    const initialState = () => ({
        tubes: [Tube.empty],
        targetsSolved: 0,
    } as State);
    const cloneState = (state: State) => ({
        tubes: [...state.tubes],
        targetsSolved: state.targetsSolved,
    });
    const actRound = (state: State, action: Action) => {
        // @ts-ignore
        act[action.action](state, ...action.args);

        const { tubes } = state;

        // react & cleean
        for (let i = 0; i < tubes.length; i++) {
            tubes[i] = reactCleanTable[tubes[i]];
        }

        // giveaway
        const target = targets[state.targetsSolved];
        for (let i = 0; i < tubes.length; i++) {
            if (tubes[i] === target) {
                tubes.splice(i, 1);
                if (tubes.length === 0) { tubes.push(Tube.empty); }
                state.targetsSolved++;
                break;
            }

        }
    };

    return {
        Tube,
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
        initialState,
        cloneState,
        getStateId: (state: State) =>
            state.tubes.join("-") + "|" + state.targetsSolved,
        actRound,
        evaluate: (actions1: Action[]) => {
            let state = initialState();

            for (const action of actions1) {
                actRound(state, action);
            }

            return state;
        },
        isSolved: (state: State) => targets.length === state.targetsSolved,

    };
}
