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
        log: () => console.log(
            measureName,
            getEntries().reduce((acc, m) => acc + m.duration, 0)),
    };
}
