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
import { tuple } from "./utils/tuple";


console.log("puzzleId", puzzleId);
test();

type ActionNetworkNode =
    State & {
        bestKnownActionCount?: number,
        from?: ActionNetworkNode,

        knownDepth?: number,

        keep?: boolean,
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

    for (const nextNode of [...evenv.generateNextStates(node)].map(nodes.add)) {
        if (evenv.isSolved(nextNode)) { solutionNodes.add(nextNode); }
        const nextBestKnownActionCount = node.bestKnownActionCount! + 1;
        if (nextBestKnownActionCount < (nextNode.bestKnownActionCount ?? Infinity)) {
            nextNode.from = node;
            nextNode.bestKnownActionCount = nextBestKnownActionCount;
        }

        traverse(nextNode, depth - 1);
    }
}

const cleanUpCache = (selected: Iterable<ActionNetworkNode>) => {
    for (const node of nodes) { node.keep = false; }
    for (const node of selected) {
        let n: ActionNetworkNode | undefined = node;
        do { n.keep = true; } while ((n = n.from) && !n.keep);
    }
    nodes.filterInPlace(node => node.keep);
}


const trackBack = (node: ActionNetworkNode): ActionNetworkNode[] => {
    if (node.bestKnownActionCount === 0) { return [node]; }
    return [...trackBack(node.from!), node];
}

function orderByAndLimit<T>(s: Iterable<T>, propFn: (x: T) => number, limit: number) {
    const output = [] as T[];
    if (limit < 1) { return output; }

    for (const x of s) {
        if (output.length === 0 || propFn(x) <= propFn(output[0])) {
            output.unshift(x);
            output.splice(limit);
            continue;
        }
        if (propFn(x) >= propFn(output[output.length - 1])) {
            if (output.length < limit) {
                output.push(x);
            }
            continue;
        }
        const i = output.findIndex(x1 => propFn(x) < propFn(x1));
        output.splice(i, 0, x);
        output.splice(limit);
    }

    return output;
}

measure('total', () => {
    const initialState = nodes.add(evenv.initialState());
    initialState.bestKnownActionCount = 0;

    measure('traverse all', () => {
        for (let i = 0; i < 5; i++) {
            measure('traverse iteration' + i, () => {
                console.log("nodes in cache",
                    nodes.size,
                    process.memoryUsage().heapUsed.toExponential());

                const selectedNodes = orderByAndLimit(
                    apipe(
                        nodes[Symbol.iterator](),
                        it.filter(n => n.knownDepth === undefined
                            && !evenv.isSolved(n)
                        )),
                    n => n.targetsLeft,
                    15);

                measure('node cache cleanup ' + i, () => {
                    cleanUpCache([...selectedNodes, ...solutionNodes]);
                }).log();

                console.log("nodes in cache after cleanup",
                    nodes.size,
                    process.memoryUsage().heapUsed.toExponential());

                measure('traverse' + i, () => {
                    for (const n of selectedNodes) {
                        traverse(n, 9);
                    }
                }).log();
            }).log();
        }
    }).log();


    console.log({
        calls,
        nodes: nodes.size,
        solutionNodes: solutionNodes.size,
    });

    const bestSolution = trackBack(apipe(
        solutionNodes,
        it.minBy(node => node.bestKnownActionCount!),
    )!)!;
    console.log(
        "shortest solution",
        bestSolution.length,
        bestSolution.map(n =>
            evenv.tubes(n)
                .reverse()
                .map(t => t.length > 0 ? t.join("") : "×")
                .join("-")
            + "₀₁₂₃₄₅₆₇₈₉"[n.targetsLeft]
        ).join(" "));

}).log();
