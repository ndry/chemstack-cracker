import { evaluate } from "./puzzle/evaluate";
import { referenceSolution } from "./referenceSolution";
import { evaluateEnv } from "./evaluateOptimized";

export function test() {

    // console.log("test");
    // console.log("problem", referenceSolution.problem);

    const evenv = evaluateEnv(referenceSolution.problem);

    for (let i = 0; i < referenceSolution.actions.length; i++) {
        const subActions = referenceSolution.actions.slice(0, i + 1);

        const refState = evaluate({
            ...referenceSolution,
            actions: subActions,
        }).state;

        const testState = evenv.evaluate(subActions);

        const cmp = (() => {
            const refTubes = refState.tubes;
            const testTubes = evenv.tubes(testState);
            if (refTubes.length !== testTubes.length) {
                return "tubes.length do not match";
            }
            for (let j = 0; j < refTubes.length; j++) {
                const refTube = refTubes[j];
                const testTube = testTubes[j];
                if (refTube.length !== testTube.length) {
                    return `tube[${j}].length do not match, refTube ${refTube.join("")}, testTube ${testTube.join("")}`;
                }
                for (let k = 0; k < refTube.length; k++) {
                    if (refTube[k] !== testTube[k]) {
                        return `tube[${j}][${k}] do not match, refTube ${refTube.join("")}, testTube ${testTube.join("")}`;
                    }
                }
            }
            if (refState.targets.length !== testState.targetsLeft) {
                return `solved targetst count do not match`;
            }
        })();

        if (cmp) {
            console.error(`test failed at action #${i} ${JSON.stringify(referenceSolution.actions[i])} with message ${cmp}`);
            console.log("refState", JSON.stringify(refState));
            console.log("testState", JSON.stringify(testState));
            return;
        }
    }

    console.log("test success");
}
