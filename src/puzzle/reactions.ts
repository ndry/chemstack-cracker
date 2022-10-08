import { SubstanceId } from './state';
import { createRand } from '../utils/createRand';
import { apipe } from '../utils/apipe';
import * as it from "../utils/it";
import * as memoize from "memoizee";

export type Reaction = {
    reagents:
    [SubstanceId, SubstanceId],
    products:
    [SubstanceId]
    | [SubstanceId, SubstanceId]
    | [SubstanceId, SubstanceId, SubstanceId],
};

export const getAllReactions = memoize(({
    seed,
    substanceMaxCount,
}: {
    seed: string,
    substanceMaxCount: number,
}) => {
    const f1p = <T>(all: T[], sub: T[]) => all
        .filter(x => sub.indexOf(x) < 0)
        .map(r => [...sub, r]);

    function* f3(xs: number[]) {
        const n = xs.length;
        for (let x0 = 0; x0 < n; x0++) {
            for (let x1 = x0 + 1; x1 < n; x1++) {
                for (let x2 = x1 + 1; x2 < n; x2++) {
                    yield [xs[x0], xs[x1], xs[x2]];
                }
            }
        }
    }

    function* f5(xs: number[]) {
        const n = xs.length;
        for (let x0 = 0; x0 < n; x0++) {
            for (let x1 = x0 + 1; x1 < n; x1++) {
                for (let x2 = x1 + 1; x2 < n; x2++) {
                    for (let x3 = x2 + 1; x3 < n; x3++) {
                        for (let x4 = x3 + 1; x4 < n; x4++) {
                            yield [xs[x0], xs[x1], xs[x2], xs[x3], xs[x4]];
                        }
                    }
                }
            }
        }
    }

    function remapSids(reactions: Reaction[], sidRevMap: SubstanceId[]) {
        const sidMap = sidRevMap.map(() => 0);
        for (let i = 0; i < sidMap.length; i++) {
            sidMap[sidRevMap[i]] = i;
        }

        return reactions.map(r => ({
            reagents: r.reagents.map(sid => sidMap[sid]),
            products: r.products.map(sid => sidMap[sid]),
        } as Reaction));
    }

    function generateReaction([reagent1, reagent2]: [SubstanceId, SubstanceId]) {
        const uniqueReagentsId = reagent1 * substanceMaxCount + reagent2;
        const rand = createRand(seed + uniqueReagentsId);
        return {
            reagents: [reagent1, reagent2],
            products: rand() < 0.5
                ? [reagent1, reagent2]
                : [
                    rand.rangeInt(substanceMaxCount),
                    ...(rand() < 0.3) ? [] : [
                        rand.rangeInt(substanceMaxCount),
                        ...(rand() < 0.7) ? [] : [
                            rand.rangeInt(substanceMaxCount),
                        ],
                    ]
                ],
        } as Reaction;
    }

    function subreactions(subsids: number[]) {
        return reactions.filter((r) => [...r.products, ...r.reagents].every((sid) => subsids.indexOf(sid) >= 0)
        );
    }

    function selectMostReactiveCore(sids: Iterable<SubstanceId[]>) {
        return apipe(sids,
            it.map(subset => ({ subset, len: subreactions(subset).length })),
            s => [...s],
        ).sort((a, b) => b.len - a.len)[0].subset;
    }

    const substances = apipe(
        it.inf(),
        it.take(substanceMaxCount),
        s => [...s]);

    const reactions = apipe(
        it.cross(substances, substances),
        it.map(generateReaction),
        it.filter(({ reagents, products }) => {
            const isReactionIntoSelf = reagents.length === products.length
                && reagents[0] === products[0]
                && reagents[1] === products[1];
            return !isReactionIntoSelf;
        }),
        s => [...s],
    );

    const sidRevMap = (() => {
        // find 5 sids with the biggest mutual reaction count
        const sidRevMap = selectMostReactiveCore(f5(substances));

        // among those 5, find 3 sids with the biggest mutual reaction count
        let sidRevMap1 = selectMostReactiveCore(f3(sidRevMap));

        // grow those 3 to 5
        while (sidRevMap1.length < sidRevMap.length) {
            sidRevMap1 = selectMostReactiveCore(f1p(sidRevMap, sidRevMap1));
        }

        // grow those 5 to max
        while (sidRevMap1.length < substances.length) {
            sidRevMap1 = selectMostReactiveCore(f1p(substances, sidRevMap1));
        }

        return sidRevMap1;
    })();

    return remapSids(reactions, sidRevMap)
        .sort((r1, r2) => r1.reagents[0] - r2.reagents[0]);
}, {
    max: 1,
    normalizer: ([{ seed, substanceMaxCount }]) =>
        JSON.stringify({ seed, substanceMaxCount }),
});

export const getProblemReactions = memoize(({
    seed,
    substanceMaxCount,
    substanceCount,
}: {
    seed: string,
    substanceMaxCount: number,
    substanceCount: number,
}) => {
    return getAllReactions({ seed, substanceMaxCount })
        .filter(r => [...r.reagents, ...r.products].every(sid => sid < substanceCount));
}, {
    max: 1,
    normalizer: ([{ seed, substanceMaxCount, substanceCount }]) =>
        JSON.stringify({ seed, substanceMaxCount, substanceCount }),
});