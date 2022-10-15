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
    const radix = Tube.absent + 1;

    const tube0 = (pack: TubePackContent) => pack % radix;
    const tube1 = (pack: TubePackContent) => Math.floor(pack / radix);
    const pack = (tube0: TubeContent, tube1: TubeContent) => tube1 * radix + tube0;

    return {
        Tube,

        tube0,
        tube1,
        pack,
        reactCleanPack: (tube0: TubeContent, tube1: TubeContent) =>
            pack(Tube.reactClean(tube0), Tube.reactClean(tube1)),

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

    const actReactClean = {
        addIngredient: (
            restTubesReactedCleaned: State["restTubes"],
            { firstTubes, targetsLeft }: State,
            ingredientId: SubstanceId
        ) => ({
            firstTubes: Tubes.reactCleanPack(
                Tube.push(Tubes.tube0(firstTubes), ingredientId),
                Tubes.tube1(firstTubes),
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
                firstTubes: Tubes.reactCleanPack(
                    Tube.empty,
                    Tubes.tube0(firstTubes),
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
                    tube2 !== undefined
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
                firstTubes: Tubes.reactCleanPack(
                    Tube.pop(tube0),
                    Tube.isAbsent(tube1)
                        ? Tube.absent
                        : Tube.push(tube1, Tube.peek(tube0)),
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
                firstTubes: Tubes.reactCleanPack(
                    Tube.push(Tubes.tube0(firstTubes), Tube.peek(tube1)),
                    Tube.pop(tube1),
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
                firstTubes: Tubes.reactCleanPack(
                    tube1,
                    Tubes.tube0(firstTubes),
                ),
                restTubes: restTubesReactedCleaned,
                targetsLeft,
            });
        },

    };

    const ingredients = Array.from({ length: problem.ingredientCount }, (_, i) => i);

    return {
        // optimized
        getStateHash: (state: State) => {
            let hash = state.firstTubes * targets.length + state.targetsLeft;
            for (let i = 0; i < state.restTubes.length; i++) {
                hash = hash ^ (state.restTubes[i] << (i * 4)) * 0x01000193;
            }
            return hash;
        },
        stateEquals: (s1: State, s2: State) => {
            if (s1 === s2) { return true; }
            if (s1.firstTubes !== s2.firstTubes) { return false; }
            if (s1.targetsLeft !== s2.targetsLeft) { return false; }
            if (s1.restTubes === s2.restTubes) { return true; }
            if (s1.restTubes.length !== s2.restTubes.length) { return false; }
            for (let i = 0; i < s1.restTubes.length; i++) {
                if (s1.restTubes[i] !== s2.restTubes[i]) { return false; }
            }
            return true;
        },
        isSolved,
        generateNextStates: (state: State) => {
            if (isSolved(state)) { return []; }

            const restTubesReactedCleaned =
                state.restTubes.some(x => x !== Tube.reactClean(x))
                    ? state.restTubes.map(Tube.reactClean)
                    : state.restTubes;

            return [
                ...ingredients.map(sid => actReactClean.addIngredient(restTubesReactedCleaned, state, sid)),
                actReactClean.addTube(restTubesReactedCleaned, state),
                actReactClean.trashTube(restTubesReactedCleaned, state),
                actReactClean.pourFromMainIntoSecondary(restTubesReactedCleaned, state),
                actReactClean.pourFromSecondaryIntoMain(restTubesReactedCleaned, state),
                actReactClean.swapTubes(restTubesReactedCleaned, state),
            ].filter((x): x is State => Boolean(x)).map(giveaway);
        },


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
