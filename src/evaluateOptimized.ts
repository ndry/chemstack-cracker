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
    const rid = (r1: SubstanceId, r2: SubstanceId) => r1 * sidBase + r2;
    type TubeContent = number;
    const Tube = {
        empty: 1,
        isEmpty: (tube: TubeContent) => tube === 1,

        push: (tube: TubeContent, sid: SubstanceId) => tube * sidBase + sid,
        peek: (tube: TubeContent) => tube % sidBase,
        _pop_out: -1,
        pop: (tube: TubeContent) => {
            Tube._pop_out = Tube.peek(tube);
            return Math.floor(tube / sidBase);
        },
        getId: (tube: TubeContent) => tube,
        getReactionId: (tube: TubeContent) => tube < sidBase2 ? -1 : (tube % sidBase2),
        applyReaction: (tube: TubeContent, products: Reaction["products"]) => {
            tube = Math.floor(tube / sidBase2);
            tube = Tube.push(tube, products[0]);
            products.length > 1 && (tube = Tube.push(tube, products[1]!));
            products.length > 2 && (tube = Tube.push(tube, products[2]!));
            return tube;
        },
        clean: (tube: TubeContent) => {
            if (tube < sidBase4) { return tube; }
            if (tube < sidBase5) { return Math.floor(tube / sidBase); }
            return Math.floor(tube / sidBase2);
        },
        fits: (tube: TubeContent, target: TubeContent) => tube === target,
        clone: (tube: TubeContent) => tube,
        fromSidArray: (tube: SubstanceId[]) => tube.reduce((acc, val) => Tube.push(acc, val), Tube.empty),
        toSidArray(tube: TubeContent) {
            let t = Tube.clone(tube);
            let arr: number[] = [];
            while (t > 1) {
                t = Tube.pop(t);
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
            state.tubes.splice(0, 1);
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

    const reactions = Object.fromEntries(
        getProblemReactions(problem)
            .map(r => [rid(...r.reagents), r]));
    const targets = getProblemTargets(problem).map(Tube.fromSidArray);
    const initialState = () => ({
        tubes: [Tube.empty],
        targetsSolved: 0,
    } as State);
    const cloneState = (state: State) => ({
        tubes: state.tubes.map(Tube.clone),
        targetsSolved: state.targetsSolved,
    });
    const actRound = (state: State, action: Action) => {
        // @ts-ignore
        act[action.action](state, ...action.args);

        const { tubes } = state;

        // react
        for (let i = 0; i < tubes.length; i++) {
            const reaction = reactions[Tube.getReactionId(tubes[i])];
            if (reaction) { 
                tubes[i] = Tube.applyReaction(tubes[i], reaction.products); 
            }
        }

        // clean
        for (let i = 0; i < tubes.length; i++) {
            tubes[i] = Tube.clean(tubes[i]);
        }

        // giveaway
        const target = targets[state.targetsSolved];
        for (let i = 0; i < tubes.length; i++) {
            if (Tube.fits(tubes[i], target)) {
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
            state.tubes
                .map(Tube.getId)
                .join("-")
            + "|" + state.targetsSolved,
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
