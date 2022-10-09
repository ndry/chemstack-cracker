import { evaluate, evaluateNoMem, _evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { referenceSolution } from "./referenceSolution";
import { _throw } from "./puzzle/_throw";
import { evaluateOptimized } from "./evaluateOptimized";



console.log("puzzleId", puzzleId);
// console.log("problem", referenceSolution.problem);
console.log("final stats", evaluate(referenceSolution).state.stats);
console.log("final stats opt", evaluateOptimized(referenceSolution.problem)(referenceSolution.actions).state.stats);

{
    const count = 100000;
    const start = performance.now();

    for (let i = 0; i < count; i++) {
        evaluate(referenceSolution);
    }

    const end = performance.now();
    const dt = end - start;

    console.log("orig mem", {
        count,
        dt: +dt.toFixed(0),
        dtpc_us: +(dt / count).toFixed(3) * 1000,
    });
}

{
    const count = 2000;
    const start = performance.now();

    const ev1 = evaluateOptimized(referenceSolution.problem)
    for (let i = 0; i < count; i++) {
        ev1(referenceSolution.actions);
    }

    const end = performance.now();
    const dt = end - start;

    console.log("------- opt", {
        count,
        dt: +dt.toFixed(0),
        dtpc_us: +(dt / count).toFixed(3) * 1000,
    });
}

{
    const count = 2000;
    const start = performance.now();

    for (let i = 0; i < count; i++) {
        evaluateNoMem(referenceSolution.problem, referenceSolution.actions);
    }

    const end = performance.now();
    const dt = end - start;

    console.log("orig no mem", {
        count,
        dt: +dt.toFixed(0),
        dtpc_us: +(dt / count).toFixed(3) * 1000,
    });
}