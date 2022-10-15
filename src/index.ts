import { evaluateNoMem, _evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { referenceSolution } from "./referenceSolution";
import { _throw } from "./puzzle/_throw";
import { evaluateEnv } from "./evaluateOptimized";
import { Action, isSolved } from "./puzzle/actions";
import { test } from "./test";
import { problems } from "./puzzle/problems";
import { CustomHashSet } from "./utils/CustomHashSet";


console.log("puzzleId", puzzleId);
test();

type ActionNetworkNode =
    State & {
        to?: ActionNetworkNode[],
        knownDepth?: number,
    };

const evenv = evaluateEnv(referenceSolution.problem);
// const evenv = evaluateEnv(problems[0]);

const nodes = CustomHashSet<ActionNetworkNode>({
    hashFn: evenv.getStateHash,
    equalsFn: evenv.stateEquals,
});

const solutionNodes = [] as ActionNetworkNode[];

type State = ReturnType<typeof evenv["evaluate"]>;

let nodeCount = 0;
const getNode = (state: State) => {
    const node = nodes.add(state);
    if (node === state) {
        nodeCount++;
        if (evenv.isSolved(state)) { solutionNodes.push(state); }
    }
    return node;
}

let edgeCount = 0;
const getNodeTo = (node: ActionNetworkNode) => {
    if (!node.to) {
        node.to = evenv.generateNextStates(node).map(getNode);
        edgeCount += node.to.length;
    }
    return node.to;
}

let calls = 0;
const traverse = (stateNode: ActionNetworkNode, depth: number) => {
    calls++;

    if (depth <= (stateNode.knownDepth ?? 0)) { return; }
    stateNode.knownDepth = depth;

    for (const edge of getNodeTo(stateNode)) {
        traverse(edge, depth - 1);
    }

}

const depth = 12;
const initialState = evenv.initialState();
performance.mark('traverse');
traverse(getNode(initialState), depth);
performance.measure('traverse duration', 'traverse');

logMeasure('traverse duration');

console.log({
    calls,
    edges: edgeCount,
    nodes: nodeCount,
    solutionNodes: solutionNodes.length,
});


function logMeasure(name: string) {
    console.log(
        name,
        performance.getEntriesByName(name)
            .map(m => m.duration)
            .reduce((acc, val) => acc + val, 0));
}