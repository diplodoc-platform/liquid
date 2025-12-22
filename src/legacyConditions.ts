import type {LiquidContext} from './types';

import chalk from 'chalk';

import {tagLine} from './syntax/lexical';
import {getPreparedLeftContent, removeIndentBlock} from './utils';
import {evaluate} from './syntax/evaluate';

function getElseProp<B extends keyof Elses>({elses}: {elses: Elses[]}, propName: B, index = 0) {
    if (!elses.length || index >= elses.length) {
        return undefined;
    }

    return elses[index][propName];
}

type Opts = {
    ifTag: Tag;
    vars: Record<string, unknown>;
    content: string;
    match: RegExpExecArray;
    lastIndex: number;
};

function inlineConditions(this: LiquidContext, {ifTag, vars, content, match, lastIndex}: Opts) {
    let res = '';

    if (evaluate.call(this, ifTag.condition, vars)) {
        const ifRawLastIndex = ifTag.startPos + ifTag.ifRaw.length;
        const contentLastIndex = getElseProp(ifTag, 'startPos') || match.index;

        res = content.substring(ifRawLastIndex, contentLastIndex);
    } else {
        ifTag.elses.some(({condition, startPos, raw}, index) => {
            const isTruthy = !condition || evaluate.call(this, condition, vars);

            if (isTruthy) {
                const elseRawLastIndex = startPos + raw.length;
                const contentLastIndex = getElseProp(ifTag, 'startPos', index + 1) || match.index;

                res = content.substring(elseRawLastIndex, contentLastIndex);

                return true;
            }

            return false;
        });
    }

    const preparedLeftContent = getPreparedLeftContent({
        content,
        tagStartPos: ifTag.startPos,
        tagContent: res,
    });

    let shift = 0;
    if (
        res === '' &&
        preparedLeftContent[preparedLeftContent.length - 1] === '\n' &&
        content[lastIndex] === '\n'
    ) {
        shift = 1;
    }

    if (res !== '') {
        if (res[0] === '\n') {
            res = res.substring(1);
        }

        res = removeIndentBlock(res);

        if (res[res.length - 1] === '\n') {
            res = res.slice(0, -1);
        }
    }

    const leftPart = preparedLeftContent + res;

    return {
        result: leftPart + content.substring(lastIndex + shift),
        idx: leftPart.length,
    };
}

type Elses = {startPos: number; raw: string; condition?: string};

type Tag = {
    condition: string;
    startPos: number;
    ifRaw: string;
    elses: Elses[];
};

export default function legacyConditions(
    this: LiquidContext,
    originInput: string,
    vars: Record<string, unknown>,
) {
    const {path} = this;
    const R_LIQUID = /({%-?([\s\S]*?)-?%})/g;

    let match;
    const tagStack: Tag[] = [];
    let input = originInput;

    while ((match = R_LIQUID.exec(input)) !== null) {
        if (!match[1]) {
            continue;
        }

        const tagMatch = match[2].trim().match(tagLine);
        if (!tagMatch) {
            continue;
        }

        const [type, args] = tagMatch.slice(1);

        switch (type) {
            case 'if':
                tagStack.push({
                    condition: args,
                    startPos: match.index,
                    ifRaw: match[1],
                    elses: [],
                });
                break;
            case 'else': {
                const currentTag = tagStack[tagStack.length - 1];

                if (!currentTag) {
                    this.logger.error(
                        `Else block must have a preceding if block${path ? ` in ${chalk.bold(path)}` : ''}`,
                    );
                    break;
                }

                currentTag.elses.push({
                    startPos: match.index,
                    raw: match[1],
                });
                break;
            }
            case 'elsif': {
                const currentTag = tagStack[tagStack.length - 1];

                if (!currentTag) {
                    this.logger.error(
                        `Elsif block must have a preceding if block${path ? ` in ${chalk.bold(path)}` : ''}`,
                    );
                    break;
                }

                currentTag.elses.push({
                    condition: args,
                    startPos: match.index,
                    raw: match[1],
                });
                break;
            }
            case 'endif': {
                const ifTag = tagStack.pop();

                if (!ifTag) {
                    this.logger.error(
                        `If block must be opened before close${path ? ` in ${chalk.bold(path)}` : ''}`,
                    );
                    break;
                }

                const {idx, result} = inlineConditions.call(this, {
                    ifTag,
                    vars,
                    content: input,
                    match,
                    lastIndex: R_LIQUID.lastIndex,
                });
                R_LIQUID.lastIndex = idx;
                input = result;

                break;
            }
        }
    }

    if (tagStack.length !== 0) {
        this.logger.error(`Condition block must be closed${path ? ` in ${chalk.bold(path)}` : ''}`);
    }

    return input;
}
