const actors = {
    delete:
        ({start, end}: SourceMapTx['delete'][number]) =>
        (value: number, flow: SourceMapTxFlow) => {
            if (value >= start && value <= end) {
                flow.offset -= 1;
                return -1;
            }

            return value;
        },

    offset:
        ([start, offset]: SourceMapTx['offset'][number]) =>
        (value: number) => {
            if (value >= start) {
                return value + offset;
            }

            return value;
        },
};
// @ts-ignore
type Point = {start: number; end: number};

type SourceMapTx = {
    delete: Point[];
    offset: [number, number][];
    replace: [number, string, string][];
};

type SourceMapTxFlow = {
    offset: number;
};

export class SourceMap {
    private patches: Function[] = [];

    private size: number;

    constructor(content: string) {
        this.size = this.lines(content).length;
    }

    dump() {
        let lazy: Record<string, string> | null = null;
        const init = (): Record<string, string> => {
            if (lazy === null) {
                const map = new Array(this.size);
                for (let index = 0; index < this.size - 1; index++) {
                    map[index] = index + 1;
                }

                this.patches.forEach((patch) => patch(map));

                lazy = {};

                for (const [index, value] of Object.entries(map)) {
                    if (value > 0) {
                        lazy[String(value)] = String(Number(index) + 1);
                    }
                }
            }

            // TODO: Consider memory optimization - clear lazy map after dump
            // The lazy map could be cleared asynchronously after dump() is called
            // to free memory, but this was not implemented to avoid potential race conditions

            return lazy;
        };

        return new Proxy(
            {},
            {
                get: (_target, prop) => {
                    return init()[prop as string];
                },

                has: (_target, prop) => {
                    return prop in init();
                },

                ownKeys(_target: {}): ArrayLike<string> {
                    return Object.keys(init());
                },

                getOwnPropertyDescriptor(
                    _target: {},
                    prop: string,
                ): PropertyDescriptor | undefined {
                    const map = init();

                    if (prop in map) {
                        return {configurable: true, enumerable: true, value: map[prop as string]};
                    }

                    return undefined;
                },
            },
        );
    }

    delete(start: number, content: string) {
        const lines = this.lines(content);
        const point = this.location(start, content.length, lines);

        this.patch({
            delete: [point],
        });
    }

    patch(tx: Partial<SourceMapTx>) {
        this.patches.push((map: number[]) => {
            const flow = {
                offset: 0,
            };

            const del = (tx.delete || []).map(actors.delete);
            const ofs = (tx.offset || []).map(actors.offset);
            (tx.replace || []).forEach(([start, source, result]) => {
                const sl = this.lines(source).length - 1;
                const rl = this.lines(result).length - 1;
                const offset = rl - sl;

                del.push(
                    actors.delete({
                        start: start + 1,
                        end: start + sl,
                    }),
                );

                ofs.push(actors.offset([start + 1, sl - 1 + offset]));
            });

            const patches = [...del, ...ofs];

            for (let index = 0; index < map.length; index++) {
                const patched = patches.reduce((value, patch) => {
                    if (value === -1) {
                        return value;
                    }

                    return patch(value, flow);
                }, map[index]);

                map[index] = patched === -1 ? patched : patched + flow.offset;
            }
        });
    }

    lines(content: string) {
        const line = /^/gm;
        const lines = [];

        while (line.exec(content)) {
            lines.push(line.lastIndex);
            line.lastIndex += 1;
        }

        lines.push(content.length + 1);

        return lines;
    }

    location(from: number, to: number, lines: number[], offset = 0): Point {
        const location = {start: -1, end: -1};

        let index = 0;

        while (lines.length > index) {
            if (from < lines[index]) {
                location.start = index + offset;
                break;
            }

            index++;
        }

        while (lines.length > index) {
            if (to < lines[index]) {
                location.end = index + offset;
                break;
            }

            index++;
        }

        return location;
    }
}
