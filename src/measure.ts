const toTimeStr = (ms: number) => {
    const us = ms * 1000;
    if (us < 1000) { return `${us.toPrecision(3)} us`; }
    if (ms < 1000) { return `${ms.toPrecision(3)} ms`; }
    const s = ms / 1000;
    if (s < 1000) { return `${s.toPrecision(3)} s`; }
}

export function measure(markName: string, fn: () => unknown) {
    performance.mark(markName);
    fn();
    const measureName = `${markName} duration`;
    performance.measure(measureName, markName);


    const getEntries = () => performance.getEntriesByName(measureName);
    return {
        markName,
        measureName,
        getEntries,
        log: () => {
            const ms = getEntries().reduce((acc, m) => acc + m.duration, 0);
            return console.log(toTimeStr(ms), '-', measureName);
        },
    };
}
