export function LogInline(header: string, separator = " ") {
    const process = globalThis.process;

    if (!process) {
        console.group(header);
        return Object.assign(
            (s: string) => console.log(header, s),
            { end: () => console.groupEnd() }
        );
    }

    const { stdout } = process;
    stdout.write(header);
    return Object.assign(
        (s: string) => stdout.write(separator + s),
        { end: () => stdout.write("\n") }
    );
}
