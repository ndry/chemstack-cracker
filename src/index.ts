import { evaluateNoMem, _evaluate } from "./puzzle/evaluate";
import { puzzleId } from "./puzzle/puzzleId";
import { referenceSolution } from "./referenceSolution";
import { _throw } from "./puzzle/_throw";
import { evaluateEnv } from "./evaluateOptimized";
import { Action, isSolved } from "./puzzle/actions";
import { test } from "./test";
import { problems } from "./puzzle/problems";
import { CustomHashSet } from "./utils/CustomHashSet";
import * as it from "./utils/it";
import { apipe } from "./utils/apipe";
import { measure } from "./measure";


console.log("puzzleId", puzzleId);
test();

type ActionNetworkNode =
    State & {
        from?: Set<ActionNetworkNode>,
        to?: ActionNetworkNode[],
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
let edgeCount = 0;
const traverse = (node: ActionNetworkNode, depth: number) => {
    calls++;

    if (depth <= (node.knownDepth ?? 0)) { return; }
    node.knownDepth = depth;

    if (!node.to) {
        node.to = [...evenv.generateNextStates(node)];
        for (let i = 0; i < node.to.length; i++) {
            const edge = node.to[i] = nodes.add(node.to[i]);
            if (evenv.isSolved(edge)) { solutionNodes.add(edge); }
            (edge.from ?? (edge.from = new Set())).add(node);
        }
        edgeCount += node.to.length;
    }

    for (const edge of node.to) {
        traverse(edge, depth - 1);
    }

}

const initialState = nodes.add(evenv.initialState());

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


console.log({
    calls,
    edges: edgeCount,
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

function iterateWave(wave: number) {
    let changed = false;
    for (const node of nodes.values()) {
        if (node.wave === wave) {
            if (node.to) {
                for (const n of node.to) {
                    if ((n.wave ?? Infinity) > wave + 1) {
                        changed = true;
                        n.wave = wave + 1;
                    }
                }
            }
        }
    }
    return changed;
}

initialState.wave = 0;
for (let wave = 0; true; wave++) {
    console.log("wave", wave);
    if (!iterateWave(wave)) {
        break;
    }
}


const solutions = [...solutionNodes].flatMap(n => traverseBack(n));
solutions.sort((a, b) => a.length - b.length);
console.log("shortest solution", solutions[0].length, solutions[0].map(n => {
    return evenv.tubes(n);
}));
