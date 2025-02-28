import type {LiquidContext} from './types';

import {applySubstitutions} from './substitutions';

export function removeIndentBlock(str: string) {
    let i = str.length - 1;
    let curChar = str[i];

    while (curChar === ' ') {
        curChar = str[--i];
    }

    if (curChar === '\n') {
        return str.substring(0, i + 1);
    }

    return str;
}

type Opts = {
    content: string;
    tagStartPos: number;
    tagContent: string;
};

export function getPreparedLeftContent({content, tagStartPos, tagContent}: Opts) {
    const preparedLeftContent = content.substring(0, tagStartPos);

    if (tagContent === '') {
        return removeIndentBlock(preparedLeftContent);
    }

    return preparedLeftContent;
}

const fence = '```';

export function codeUtils(this: LiquidContext) {
    const {substitutions = true} = this.settings;
    const codes: string[] = [];

    const find = (open: string, close: string, string: string, index: number) => {
        const start = string.indexOf(open, index);
        const end = start > -1 ? string.indexOf(close, start + open.length) : -1;

        return [start, end];
    };

    const replace = (
        open: string,
        close: string,
        value: (string: string) => string,
        string: string,
    ) => {
        let result = '';
        let carriage = 0;
        let [start, end] = find(open, close, string, carriage);

        while (start > -1 && end > -1) {
            const fragment = string.slice(start + open.length, end);

            result += string.slice(carriage, start) + open + value(fragment) + close;
            carriage = end + close.length;
            [start, end] = find(open, close, string, carriage);
        }

        result += string.slice(carriage);

        return result;
    };

    const saveCode = (str: string, vars: Record<string, unknown>) => {
        return replace(
            fence,
            fence,
            (code) => {
                const codeWithVars = substitutions
                    ? applySubstitutions.call(this, code, vars)
                    : code;
                const index = codes.push(codeWithVars) - 1;

                /* Keep the same count of lines to avoid transformation of the source map */
                const codeLines = codeWithVars.split('\n');
                const emptyLines = codeLines.length > 1 ? '\n'.repeat(codeLines.length) : '';

                return `${index}${emptyLines}`;
            },
            str,
        );
    };

    function repairCode(str: string) {
        if (!codes.length) {
            return str;
        }

        return replace(fence, fence, (code) => codes[Number(code)], str);
    }

    return {saveCode, repairCode};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getObject(path: string, obj: Record<string, any>, fallback?: any) {
    const queue = path.split('.');

    let box = obj;
    while (queue.length) {
        const step = queue.shift() as string;

        if (!Object.prototype.hasOwnProperty.call(box, step)) {
            return fallback || undefined;
        }

        box = box[step];
    }

    return box;
}

export function logger() {
    return {
        info: () => {},
        warn: () => {},
        error: () => {},
    };
}
