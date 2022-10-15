export function CustomHashSet<T>({
    hashFn, equalsFn, verbose,
}: {
    hashFn: (el: T) => any;
    equalsFn: (el1: T, el2: T) => boolean;
    verbose?: boolean;
}) {
    const buckets = new Map<any, T[]>();
    let maxBucketLength = 0;

    return {
        add: (el: T) => {
            const hash = hashFn(el);
            let bucket = buckets.get(hash);
            if (!bucket) { buckets.set(hash, bucket = []); }
            for (const bel of bucket) { if (equalsFn(el, bel)) { return bel; } }
            bucket.push(el);

            if (bucket.length > maxBucketLength) {
                maxBucketLength = bucket.length;
                verbose && console.log(
                    "new maxBucketLength", maxBucketLength, hash);
            }

            return el;
        },
    };
}
