export function CustomHashSet<T>({
    hashFn, equalsFn, verbose,
}: {
    hashFn: (el: T) => any;
    equalsFn: (el1: T, el2: T) => boolean;
    verbose?: boolean;
}) {
    const buckets = new Map<any, Set<T>>();
    let maxBucketLength = 0;
    let size = 0;

    return {
        add: (el: T) => {
            const hash = hashFn(el);
            let bucket = buckets.get(hash);
            if (bucket) {
                for (const bel of bucket) {
                    if (equalsFn(el, bel)) {
                        return bel;
                    }
                }
            } else {
                buckets.set(hash, bucket = new Set());
            }
            bucket.add(el);

            size++;

            if (bucket.size > maxBucketLength) {
                maxBucketLength = bucket.size;
                verbose && console.log(
                    "new maxBucketLength", maxBucketLength, hash);
            }

            return el;
        },

        [Symbol.iterator]: function* () { for (const b of buckets.values()) { yield* b; } },

        get size() { return size; },
    };
}
