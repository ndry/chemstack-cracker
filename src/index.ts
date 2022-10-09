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
        from: Array<ActionNetworkEdge>,
        to: Array<ActionNetworkEdge>,
        knownDepth: number,
    };
type ActionNetworkEdge =
    Action & {
        id: string,
        from: ActionNetworkNode,
        to: ActionNetworkNode,
    };

const actionNetwork = (() => {
    const nodes = {} as Record<string, ActionNetworkNode>;
    const edges = {} as Record<string, ActionNetworkEdge>;
    const add = (action: Action | ActionNetworkEdge, from: State, to: State) => {

    }
    return {
        nodes,
        edges,
        
    }
})();


const evenv = evaluateEnv(referenceSolution.problem);
// const evenv = evaluateEnv(problems[0]);
let stops = 0;
let actRounds = 0;
let calls = 0;
let solutions = 0;

type State = ReturnType<typeof evenv["evaluate"]>;
const traverseActionTree = (state: State, depth: number) => {
    calls++;
    
    if (evenv.isSolved(state)) {
        solutions++;
        return;
    }
    
    if (depth <= 0) {
        stops++;
        return;
    }
    
    for (const action of evenv.possibleActions) {
        actRounds++;
        // @ts-ignore;
        const _canAct = evenv.canAct[action.action](state, ...action.args);
        if (!_canAct) { continue; }
        const nextState = evenv.cloneState(state);
        evenv.actRound(nextState, action);
        const nextStateId = evenv.getStateId(nextState);

        const nextStateNode =
            actionNetwork.nodes[nextStateId]
            ?? (actionNetwork.nodes[nextStateId] = Object.assign(nextState, {
                id: nextStateId,
                from: [],
                to: [],
                knownDepth: 0,
            }));

        // nextStateNode.from.push( ... )

        if (nextStateNode.knownDepth < depth) {
            traverseActionTree(nextState, depth - 1);
            nextStateNode.knownDepth = Math.max(depth, nextStateNode.knownDepth);
        }

    }
}

const depth = 10;
const start = performance.now();
traverseActionTree(evenv.initialState(), depth);
const end = performance.now();
const dt = end - start;

console.log("times", {
    dt: (dt).toFixed(1) + " ms",
    stop: (dt / stops * 1000).toFixed(1) + " us",
    call: (dt / calls * 1000).toFixed(1) + " us",
    act: (dt / actRounds * 1000).toFixed(1) + " us",
});


console.log({
    stops,
    calls,
    actRounds,
    solutions,
})