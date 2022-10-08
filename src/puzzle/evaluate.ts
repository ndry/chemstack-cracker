import { initialState, State } from './state';
import { actRound, Action } from './actions';
import { Problem } from './problem';
import * as memoize from 'memoizee';
import { _throw } from './_throw';
import { Solution } from './solution';

export type StateTransition = ReturnType<typeof actRound> | { state: State };

const initialStateMem = memoize(initialState, { max: 1 });
const actRoundMem = memoize(actRound, { max: 1000 });

function _evaluate(problem: Problem, actions: Action[]): StateTransition {
    if (actions.length === 0) { return { state: initialStateMem(problem) }; }
    const { state: prevState } = _evaluate(problem, actions.slice(0, -1));
    const action = actions[actions.length - 1];
    return actRoundMem(action, prevState);
}

const _evaluateMem = memoize(_evaluate, { max: 10 });

export const evaluate = ({ problem, actions }: Solution) =>
    _evaluateMem(problem, actions);