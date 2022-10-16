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
        bestKnownActionCount?: number,

        from?: Set<ActionNetworkNode>,
        knownDepth?: number,
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
        (nextNode.from ?? (nextNode.from = new Set())).add(node);
        nextNode.bestKnownActionCount = Math.min(
            node.bestKnownActionCount! + 1,
            nextNode.bestKnownActionCount ?? Infinity,
        );

        traverse(nextNode, depth - 1);
    }
}

const getBestPathToOrigin = (node: ActionNetworkNode): ActionNetworkNode[] | undefined => {
    if (node.bestKnownActionCount === 0) { return [node]; }
    if (!node.from) { return; }
    const bestPath = apipe(
        node.from,
        it.filter(n => n.bestKnownActionCount! < node.bestKnownActionCount!),
        it.map(getBestPathToOrigin),
        it.minBy(fromPath => fromPath?.length ?? Infinity),
    );
    return bestPath ? [...bestPath, node] : undefined;
}

measure('total', () => {
    const initialState = nodes.add(evenv.initialState());
    initialState.bestKnownActionCount = 0;

    measure('traverse all', () => {
        for (let i = 0; i < 5; i++) {
            const ns = apipe(
                nodes[Symbol.iterator](),
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

    const bestSolution = getBestPathToOrigin(apipe(
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



