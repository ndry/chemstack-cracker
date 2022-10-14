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

type TubeContent = number;
const TubeModule = (capacity: number = 4) => (problem: Problem) => {
    const e1 = problem.substanceMaxCount; // 10
    const t1 = e1 ** (capacity + 1); // radix of compact tube, 10000

    // --------[ < t1 > ]
    // ?...????[1...1111] - absent
    // ?...???1[1...1110] - empty
    // ?...??11[1...110#] - one slot filled, where # in [0, substanceMaxCount)
    // ?...?111[1...10##] - two slots filled
    // ...
    // 111...1[0###...#] - all slots filled
    // Thus, the whole range [0, 111...1] is a valid tubes state


    const push = (tube: TubeContent, sid: SubstanceId) => (tube * e1 + sid) % t1;
    const peek = (tube: TubeContent) => tube % e1;
    const pop = (tube: TubeContent) => Math.floor((t1 + tube) / e1);

    const absent = (t1 - 1) / (e1 - 1); // 1...11
    const isAbsent = (tube: TubeContent) => tube === absent;
    const empty = push(absent, 0) % t1; // 1...10
    const isEmpty = (tube: TubeContent) => tube === empty;


    const fromSidArray = (tube: SubstanceId[]) =>
        tube.reduce((acc, val) => push(acc, val), empty);

    const toSidArray = (tube: TubeContent) => {
        let arr: number[] = [];
        while (!isEmpty(tube)) {
            arr.unshift(peek(tube));
            tube = pop(tube);
        }
        return arr;
    }

    const reactions = getProblemReactions(problem);
    const reactCleanTable = Array.from({ length: absent + 1 }, (_, t) => {
        if (isAbsent(t)) { return t; }

        const tube = toSidArray(t);

        // react
        const reaction = reactions.find(r =>
            r.reagents[1] === tube[tube.length - 1]
            && r.reagents[0] === tube[tube.length - 2]);
        if (reaction) { tube.splice(tube.length - 2, 2, ...reaction.products); }

        // clean
        tube.splice(3);

        return fromSidArray(tube);
    });

    return {
        e1,
        t1,
        absent,
        isAbsent,
        empty,
        isEmpty,

        push,
        peek,
        pop,
        reactClean: (tube: TubeContent) => reactCleanTable[tube],

        fromSidArray,
        toSidArray,
    }
}

type TubePackContent = number;
const TubePack2 = (problem: Problem) => {
    const Tube = TubeModule(4)(problem);
    const { e1, t1 } = Tube;

    const tube0 = (pack: TubePackContent) => pack % t1;
    const tube1 = (pack: TubePackContent) => Math.floor(pack / t1);
    const pack = (tube0: TubeContent, tube1: TubeContent) => tube1 * t1 + tube0;

    return {
        Tube,

        tube0,
        tube1,
        pack,

        toArray: (pack: TubePackContent) => {
            const t0 = tube0(pack);
            if (Tube.isAbsent(t0)) { return []; }
            const t1 = tube1(pack);
            if (Tube.isAbsent(t1)) { return [t0]; }
            return [t0, t1];
        }
    }
}

export function evaluateEnv(problem: Problem) {
    const Tubes = TubePack2(problem);
    const { Tube } = Tubes;

    type State = {
        firstTubes: TubePackContent,
        restTubes: TubeContent[];
        targetsLeft: number;
    };

    const targets = getProblemTargets(problem).map(Tube.fromSidArray);
    const initialState = () => ({
        firstTubes: Tubes.pack(Tube.empty, Tube.absent),
        restTubes: [],
        targetsLeft: targets.length,
    } as State);
    const giveaway = (s: State) => {
        const target = targets[targets.length - s.targetsLeft];
        const tube0 = Tubes.tube0(s.firstTubes);
        const tube1 = Tubes.tube1(s.firstTubes);

        if (tube0 === target) {
            if (Tube.isAbsent(tube1)) {
                return {
                    firstTubes: Tubes.pack(Tube.empty, Tube.absent),
                    restTubes: s.restTubes,
                    targetsLeft: s.targetsLeft - 1,
                };
            }

            const restTubes = [...s.restTubes];
            const tube2 = restTubes.shift();
            return {
                firstTubes: Tubes.pack(tube1, tube2 ?? Tube.absent),
                restTubes,
                targetsLeft: s.targetsLeft - 1,
            }
        }

        if (tube1 === target) {
            const restTubes = [...s.restTubes];
            const tube2 = restTubes.shift();

            return {
                firstTubes: Tubes.pack(tube0, tube2 ?? Tube.absent),
                restTubes,
                targetsLeft: s.targetsLeft - 1,
            }
        }

        for (let i = 0; i < s.restTubes.length; i++) {
            if (s.restTubes[i] !== target) { continue; }

            const restTubes = [...s.restTubes];
            restTubes.splice(i, 1);
            return {
                firstTubes: s.firstTubes,
                restTubes,
                targetsLeft: s.targetsLeft - 1,
            }
        }

        return s;
    };
    const isSolved = (state: State) => state.targetsLeft === 0;

    const getStateId = (() => {
        const _id = Symbol();
        return (state: State) => {
            // const stateWithId = state as any as State & { [_id]?: string };
            // if (stateWithId[_id] !== undefined) { return stateWithId[_id]; }

            const restTubesWithId = state.restTubes as any as State["restTubes"] & { [_id]?: string };
            const restTubesId =
                restTubesWithId[_id]
                ?? (restTubesWithId[_id] = restTubesWithId.join("-"));

            const stateId = state.firstTubes + "|" + restTubesId + "|" + state.targetsLeft;
            // stateWithId[_id] = stateId;
            return stateId;
        };
    })();

    const actReactClean = {
        addIngredient: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft }: State,
            ingredientId: SubstanceId
        ) => ({
            firstTubes: Tubes.pack(
                Tube.reactClean(Tube.push(Tubes.tube0(firstTubes), ingredientId)),
                Tube.reactClean(Tubes.tube1(firstTubes)),
            ),
            restTubes: restTubesReactedCleaned,
            targetsLeft,
        }),

        addTube: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft, restTubes }: State,
        ) => {
            if (restTubes.length > 4) { return; }

            const tube1 = Tubes.tube1(firstTubes);

            const nextState = {
                firstTubes: Tubes.pack(
                    Tube.empty,
                    Tube.reactClean(Tubes.tube0(firstTubes)),
                ),
                restTubes: [...restTubesReactedCleaned],
                targetsLeft,
            };

            if (!Tube.isAbsent(tube1)) { nextState.restTubes.unshift(Tube.reactClean(tube1)); }

            return nextState;
        },

        trashTube: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft }: State,
        ) => {
            const tube1 = Tubes.tube1(firstTubes);

            if (Tube.isAbsent(tube1)) { return; }

            const restTubesReactedCleanedCopy = [...restTubesReactedCleaned];
            const tube2 = restTubesReactedCleanedCopy.shift();

            return {
                firstTubes: Tubes.pack(
                    Tube.reactClean(tube1),
                    tube2
                        ? tube2
                        : Tube.absent,
                ),
                restTubes: restTubesReactedCleanedCopy,
                targetsLeft,
            };
        },

        pourFromMainIntoSecondary: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft }: State,
        ) => {
            const tube0 = Tubes.tube0(firstTubes);

            if (Tube.isEmpty(Tubes.tube0(tube0))) { return; }

            const tube1 = Tubes.tube1(firstTubes);

            return ({
                firstTubes: Tubes.pack(
                    Tube.reactClean(Tube.pop(tube0)),
                    Tube.isAbsent(tube1)
                        ? tube1
                        : Tube.reactClean(Tube.push(Tubes.tube1(firstTubes), Tube.peek(tube0))),
                ),
                restTubes: restTubesReactedCleaned,
                targetsLeft,
            });
        },

        pourFromSecondaryIntoMain: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft }: State,
        ) => {
            const tube1 = Tubes.tube1(firstTubes);

            if (Tube.isAbsent(tube1) || Tube.isEmpty(tube1)) { return; }

            return ({
                firstTubes: Tubes.pack(
                    Tube.reactClean(Tube.push(Tubes.tube0(firstTubes), Tube.peek(tube1))),
                    Tube.reactClean(Tube.pop(tube1)),
                ),
                restTubes: restTubesReactedCleaned,
                targetsLeft,
            });
        },

        swapTubes: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft }: State,
        ) => {
            const tube1 = Tubes.tube1(firstTubes);

            if (Tube.isAbsent(Tubes.tube1(firstTubes))) { return; }

            return ({
                firstTubes: Tubes.pack(
                    Tube.reactClean(tube1),
                    Tube.reactClean(Tubes.tube0(firstTubes))
                ),
                restTubes: restTubesReactedCleaned,
                targetsLeft,
            });
        },

    };

    const ingredients = Array.from({ length: problem.ingredientCount }, (_, i) => i);

    return {
        // optimized
        getStateId,
        generateNextStates: (state: State) => {
            if (isSolved(state)) { return []; }

            const restTubesReactedCleaned = state.restTubes.map(Tube.reactClean);

            return [
                ...ingredients.map(sid => actReactClean.addIngredient(restTubesReactedCleaned, state, sid)),
                actReactClean.addTube(restTubesReactedCleaned, state),
                actReactClean.trashTube(restTubesReactedCleaned, state),
                actReactClean.pourFromMainIntoSecondary(restTubesReactedCleaned, state),
                actReactClean.pourFromSecondaryIntoMain(restTubesReactedCleaned, state),
                actReactClean.swapTubes(restTubesReactedCleaned, state),
            ].filter((x): x is State => Boolean(x)).map(giveaway);
        },
        isSolved,


        // regular use
        initialState,
        evaluate: (actions: Action[]) => {
            let state = initialState();

            for (const action of actions) {
                state = actReactClean[action.action](
                    state.restTubes.map(Tube.reactClean),
                    state,
                    // @ts-ignore
                    ...action.args)!;
                state = giveaway(state);
            }

            return state;
        },
        tubes: (state: State) => [
            ...Tubes.toArray(state.firstTubes),
            ...state.restTubes
        ].map(Tube.toSidArray),
    };
}
