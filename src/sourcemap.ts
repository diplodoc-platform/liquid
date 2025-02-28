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
    private map: number[] = [];

    constructor(content: string) {
        this.map = this.lines(content)
            .map((_, index) => index)
            .slice(1);
    }

    dump() {
        const dump: Record<string, string> = {};

        for (const [index, value] of Object.entries(this.map)) {
            if (value > 0) {
                dump[String(value)] = String(Number(index) + 1);
            }
        }

        return dump;
    }

    delete(start: number, content: string) {
        const lines = this.lines(content);
        const point = this.location(start, content.length, lines);

        this.patch({
            delete: [point],
        });
    }

    patch(tx: Partial<SourceMapTx>) {
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

        for (let index = 0; index < this.map.length; index++) {
            const patched = patches.reduce((value, patch) => {
                if (value === -1) {
                    return value;
                }

                return patch(value, flow);
            }, this.map[index]);

            this.map[index] = patched === -1 ? patched : patched + flow.offset;
        }
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

    origin(line: string | number) {
        if (!this.map.length) {
            return Number(line);
        }

        return this.map[Number(line) - 1];
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
