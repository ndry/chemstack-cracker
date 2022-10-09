import { evaluate, evaluateNoMem, _evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { referenceSolution } from "./referenceSolution";
import { _throw } from "./puzzle/_throw";
import { evaluateEnv } from "./evaluateOptimized";
import { Action, isSolved } from "./puzzle/actions";
import { problems } from "./puzzle/problems";



console.log("puzzleId", puzzleId);
// console.log("problem", referenceSolution.problem);
console.log("final stats", evaluate(referenceSolution).state.stats);
console.log("final stats opt", evaluateEnv(referenceSolution.problem).evaluate(referenceSolution.actions).stats);

// {
//     const count = 100000;
//     const start = performance.now();

//     for (let i = 0; i < count; i++) {
//         evaluate(referenceSolution);
//     }

//     const end = performance.now();
//     const dt = end - start;

//     console.log("orig mem", {
//         count,
//         dt: +dt.toFixed(0),
//         dtpc_us: +(dt / count).toFixed(3) * 1000,
//     });
// }

// {
//     const count = 2000;
//     const start = performance.now();

//     const ev1 = evaluateOptimized(referenceSolution.problem)
//     for (let i = 0; i < count; i++) {
//         ev1(referenceSolution.actions);
//     }

//     const end = performance.now();
//     const dt = end - start;

//     console.log("------- opt", {
//         count,
//         dt: +dt.toFixed(0),
//         dtpc_us: +(dt / count).toFixed(3) * 1000,
//     });
// }

// {
//     const count = 2000;
//     const start = performance.now();

//     for (let i = 0; i < count; i++) {
//         evaluateNoMem(referenceSolution.problem, referenceSolution.actions);
//     }

//     const end = performance.now();
//     const dt = end - start;

//     console.log("orig no mem", {
//         count,
//         dt: +dt.toFixed(0),
//         dtpc_us: +(dt / count).toFixed(3) * 1000,
//     });
// }


const evenv = evaluateEnv(referenceSolution.problem);
let traverseStops = 0;
const solutions = [] as Action[][];

const traverseActionTree = (path: Action[], depth: number) => {
    const state = evenv.evaluate(path);

    if (isSolved(state)) {
        solutions.push(path);
        return;
    }

    if (depth <= 0) {
        traverseStops++;
        return;
    }

    for (const action of evenv.possibleActions) {
        // @ts-ignore;
        const _canAct = evenv.canAct[action.action](state, ...action.args);
        if (!_canAct) { continue; }
        traverseActionTree([...path, action], depth - 1);
    }
}

const depth = 7;
const start = performance.now();
traverseActionTree([], depth);
const end = performance.now();
const dt = end - start;

console.log("measuremenys", {
    dt: (dt).toFixed(3) + " ms",
    dtPerStop: (dt / traverseStops * 1000).toFixed(3) + " us",
    dtPerAction: (dt / traverseStops / depth * 1000).toFixed(3) + " us",
});


console.log({
    traverseStops,
    solutions: solutions
        .map(s => s.map(a => `[${a.action}.${a.args.join()}]`).join("-")),
})