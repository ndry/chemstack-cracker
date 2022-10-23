export function CustomHashSet<T>({
    hashFn, equalsFn, verbose,
}: {
    hashFn: (el: T) => any;
    equalsFn: (el1: T, el2: T) => boolean;
    verbose?: boolean;
}) {
    const bucketTag = Symbol();
    type Bucket = T[] & { [bucketTag]: true };
    const isBucket = (b: any): b is Bucket => Array.isArray(b) && (bucketTag in b);
    const newBucket = (el1: T, el2: T) => {
        const bucket = [el1, el2] as any;
        bucket[bucketTag] = true;
        return bucket as Bucket;
    }

    const buckets = new Map<any, Bucket | T>();

    let maxBucketLength = 0;
    const registerBucketLength = (len: number) => {
        if (len <= maxBucketLength) { return; }
        maxBucketLength = len;
        verbose && console.log("new maxBucketLength", maxBucketLength);
    }

    let size = 0;

    return {
        has: (el: T) => {
            const hash = hashFn(el);
            let bucket = buckets.get(hash);
            if (bucket) {
                if (isBucket(bucket)) {
                    for (const bel of bucket) {
                        if (equalsFn(el, bel)) { return true; }
                    }
                } else {
                    if (equalsFn(el, bucket)) { return true; }
                }
            }
            return false;
        },

        add: (el: T) => {
            const hash = hashFn(el);
            let bucket = buckets.get(hash);
            if (bucket) {
                if (isBucket(bucket)) {
                    for (const bel of bucket) {
                        if (equalsFn(el, bel)) { return bel; }
                    }

                    const len = bucket.push(el);
                    registerBucketLength(len);
                    size++;
                    return el;
                } else {
                    if (equalsFn(el, bucket)) { return bucket; }

                    buckets.set(hash, newBucket(bucket, el));
                    registerBucketLength(2);
                    size++;
                    return el;
                }
            } else {
                buckets.set(hash, el);
                registerBucketLength(1);
                size++;
                return el;
            }
        },

        filterInPlace: (fn: (el: T) => any) => {
            for (const [k, b] of buckets) {
                if (isBucket(b)) {
                    for (let i = b.length - 1; i >= 0; i--) {
                        if (!fn(b[i])) {
                            b.splice(i, 1);
                            size--;
                        }
                    }
                    if (b.length === 1) {
                        buckets.set(k, b[0]);
                    }
                    if (b.length === 0) {
                        buckets.delete(k);
                    }
                } else {
                    if (!fn(b)) {
                        buckets.delete(k);
                        size--;
                    }
                }
            }
        },

        [Symbol.iterator]: function* () {
            for (const b of buckets.values()) {
                if (isBucket(b)) {
                    // yield *b; - causes a lot of  overhead
                    for (let i = 0; i < b.length; i++) {
                        yield b[i];
                    }
                } else {
                    yield b;
                }
            }
        },

        get size() { return size; },
    };
}
