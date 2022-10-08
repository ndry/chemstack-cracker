import { Problem } from './problem';
import { getProblemTargets } from './targets';

export type SubstanceId = number;

export type State = {
    problem: Problem;
    tubes: SubstanceId[][];
    targets: SubstanceId[][];
    isSolved: boolean;
    stats: {
        actionCount: number;
        maxAddedTubeCount: number;
        price: number;
    };
};

export const initialState = (problem: Problem) => ({
    problem,
    tubes: [[]],
    targets: getProblemTargets(problem),
    isSolved: false,
    stats: {
        actionCount: 0,
        maxAddedTubeCount: 0,
        price: 0,
    }
} as State);