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

const nodesOfInterest = [] as ActionNetworkNode[];
const solutionNodes = new Set<ActionNetworkNode>();

type State = ReturnType<typeof evenv["evaluate"]>;

let calls = 0;
const traverse = (node: ActionNetworkNode, depth: number) => {
    calls++;

    if (depth <= (node.knownDepth ?? 0)) { return; }
    node.knownDepth = depth;

    for (const nextNode of [...evenv.generateNextStates(node)].map(nodes.add)) {
        if (evenv.isSolved(nextNode)) {
            solutionNodes.add(nextNode);
        } else if (nextNode.targetsLeft < node.targetsLeft) {
            nodesOfInterest.push(nextNode);
        }
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

const toGb = (x: number) => `${Math.round((x / (1 << 30)) * 100) / 100} GiB`;


measure('total', () => {
    const initialState = nodes.add(evenv.initialState());
    initialState.bestKnownActionCount = 0;
    nodesOfInterest.push(initialState);

    measure('traverse all', () => {
        for (let i = 0; i < 3; i++) {
            console.log("==== traverse iteration", i);
            measure('iteration ' + i, () => {
                console.log("nodes in cache",
                    nodes.size,
                    toGb(process.memoryUsage().heapUsed));

                measure('nodesOfInterest sort ' + i, () => {
                    nodesOfInterest
                        .sort((n1, n2) =>
                            (n1.targetsLeft - n2.targetsLeft)
                            || (n1.bestKnownActionCount! - n2.bestKnownActionCount!));
                }).log();
                console.log("nodesOfInterest",
                    nodesOfInterest.length,
                    "best targetsLeft",
                    nodesOfInterest[0].targetsLeft);
                console.log("solutionNodes",
                    solutionNodes.size);

                measure('nodes cleanup ' + i, () => {
                    cleanUpCache(nodesOfInterest);
                }).log();

                console.log("nodes size after cleanup",
                    nodes.size,
                    toGb(process.memoryUsage().heapUsed));

                measure('traverse ' + i, () => {
                    traverse(nodesOfInterest.shift()!, 12);
                }).log();
            }).log();
        }
    }).log();


    console.log({
        calls,
        nodes: nodes.size,
        solutionNodes: solutionNodes.size,
    });

    if (solutionNodes.size > 0) {
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
                    .map(t => t.length > 0 ? t.join("") : "x")
                    .join("-")
                + "/" + n.targetsLeft
            ).join(" "));
    } else {
        console.log("no solution was found");
    }
}).log();
