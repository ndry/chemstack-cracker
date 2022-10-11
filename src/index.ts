import { evaluateNoMem, _evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { referenceSolution } from "./referenceSolution";
import { _throw } from "./puzzle/_throw";
import { evaluateEnv } from "./evaluateOptimized";
import { Action, isSolved } from "./puzzle/actions";
import { test } from "./test";
import { problems } from "./puzzle/problems";


console.log("puzzleId", puzzleId);
test();

type ActionNetworkNode =
    State & {
        id: string,
        from: ActionNetworkEdge[],
        to?: ActionNetworkEdge[],
        knownDepth?: number,
    };
type ActionNetworkEdge = {
    // id: string,
    action: Action
    from: ActionNetworkNode,
    to: ActionNetworkNode,
};

const nodes = {} as Record<string, ActionNetworkNode>;



const evenv = evaluateEnv(referenceSolution.problem);
// const evenv = evaluateEnv(problems[0]);
const solutionNodes = [] as ActionNetworkNode[];

type State = ReturnType<typeof evenv["evaluate"]>;

const getNode = (state: State) => {
    const stateId = evenv.getStateId(state);
    const node = nodes[stateId];
    if (node) { return node; }

    const newNode = nodes[stateId] = Object.assign(state, {
        id: stateId,
        from: [],
        to: undefined,
        knownDepth: 0,
        initialized: false,
    });

    if (evenv.isSolved(newNode)) {
        solutionNodes.push(newNode);
    }

    return newNode;
}

let edgeCount = 0;
const getNodeTo = (node: ActionNetworkNode) => {
    if (node.to) { return node.to; }

    node.to = [];

    if (!evenv.isSolved(node)) {
        for (const action of evenv.possibleActions) {
            // @ts-ignore;
            const _canAct = evenv.canAct[action.action](node, ...action.args);
            if (!_canAct) { continue; }

            edgeCount++;
            const nextState = evenv.cloneState(node);
            evenv.actRound(nextState, action);
            const edge = { action, from: node, to: getNode(nextState) };
            node.to.push(edge);
            edge.to.from.push(edge);
        }
    }

    return node.to;
}

const traverse = (stateNode: ActionNetworkNode, depth: number) => {
    if (depth <= (stateNode.knownDepth ?? 0)) { return; }
    stateNode.knownDepth = depth;

    for (const edge of getNodeTo(stateNode)) {
        traverse(edge.to, depth - 1);
    }

}

const depth = 11;
const start = performance.now();
const initialState = evenv.initialState();
traverse(getNode(initialState), depth);
const end = performance.now();
const dt = end - start;

console.log("times", {
    dt: (dt).toFixed(1) + " ms",
    edge: (dt / edgeCount * 1000).toFixed(1) + " us",
    node: (dt / Object.keys(nodes).length * 1000).toFixed(1) + " us",
});

console.log({
    edges: edgeCount,
    nodes: Object.keys(nodes).length,
    solutionNodes: solutionNodes.length,
});