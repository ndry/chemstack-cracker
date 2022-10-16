import { _evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { referenceSolution } from "./referenceSolution";
import { _throw } from "./puzzle/_throw";
import { evaluateEnv } from "./evaluateOptimized";
import { test } from "./test";
import { CustomHashSet } from "./utils/CustomHashSet";
import * as it from "./utils/it";
import { apipe } from "./utils/apipe";
import { measure } from "./measure";


console.log("puzzleId", puzzleId);
test();

type ActionNetworkNode =
    State & {
        from?: Set<ActionNetworkNode>,
        knownDepth?: number,
        wave?: number,
    };

const evenv = evaluateEnv(referenceSolution.problem);
// const evenv = evaluateEnv(problems[0]);

let nodes = CustomHashSet<ActionNetworkNode>({
    hashFn: evenv.getStateHash,
    equalsFn: evenv.stateEquals,
});

const solutionNodes = new Set<ActionNetworkNode>();

type State = ReturnType<typeof evenv["evaluate"]>;

let calls = 0;
const traverse = (node: ActionNetworkNode, depth: number) => {
    calls++;

    if (depth <= (node.knownDepth ?? 0)) { return; }
    node.knownDepth = depth;

    for (const edge of [...evenv.generateNextStates(node)].map(nodes.add)) {
        if (evenv.isSolved(edge)) { solutionNodes.add(edge); }
        (edge.from ?? (edge.from = new Set())).add(node);
        traverse(edge, depth - 1);
    }
}



function iterateWave() {
    let changed = false;
    for (const node of nodes.values()) {
        let min = Infinity;
        for (const n of node.from!) {
            min = Math.min(min, n.wave ?? Infinity);
        }
        min = min + 1;
        if (min < (node.wave ?? Infinity)) {
            node.wave = min;
            changed = true;
        }
    }
    return changed;
}

measure('total', () => {
    const initialState = nodes.add(evenv.initialState());
    measure('traverse all', () => {
        for (let i = 0; i < 5; i++) {
            const ns = apipe(
                nodes.values(),
                it.filter(n => n.knownDepth === undefined),
                x => [...x]);
            ns.sort((a, b) => a.targetsLeft - b.targetsLeft);
            const ns2 = ns.slice(0, 1000);
            performance.mark(`traverse${i}`);
            // nodes = CustomHashSet<ActionNetworkNode>({
            //     hashFn: evenv.getStateHash,
            //     equalsFn: evenv.stateEquals,
            // });
            measure('traverse' + i, () => {
                for (const n of ns2) {
                    traverse(n, 5);
                }
            }).log();
        }
    }).log();


    console.log({
        calls,
        nodes: nodes.size,
        solutionNodes: solutionNodes.size,
    });

    const traverseBack = (node: ActionNetworkNode, path: ActionNetworkNode[] = []): ActionNetworkNode[][] => {
        path = [node, ...path];
        if (node.wave === 0) { return [path]; }
        if (!node.from) { return []; }
        return [...node.from]
            .filter(n => n.wave! < node.wave!)
            .flatMap(n => traverseBack(n, path));
    }
    measure('iterateWave', () => {
        const process = globalThis.process;
        initialState.wave = 0;
        process && process.stdout.write("wave");
        do {
            process ? process.stdout.write(" .") : console.log("wave", ".");
        } while (iterateWave())
        process && process?.stdout.write("\n");
    }).log();

    const solutions = [...solutionNodes].flatMap(n => traverseBack(n));
    solutions.sort((a, b) => a.length - b.length);
    console.log(
        "shortest solution",
        solutions[0].length,
        solutions[0].map(n =>
            evenv.tubes(n)
                .reverse()
                .map(t => t.length > 0 ? t.join("") : "×")
                .join("-")
            + "₀₁₂₃₄₅₆₇₈₉"[n.targetsLeft]
        ).join(" "));
}).log();



