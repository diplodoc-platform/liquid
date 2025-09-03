import type {LiquidContext} from './types';
import type {SourceMap} from './sourcemap';

import chalk from 'chalk';

import {tagLine} from './syntax/lexical';
import {NoValue, evaluate} from './syntax/evaluate';

interface SourcePoint {
    start: number;
    end: number;
    rawStart: string;
    rawEnd: string;
}

function resourcemap(
    source: string,
    ifTag: SourcePoint,
    ifCon: SourcePoint | null,
    sourcemap: SourceMap,
) {
    const lines = sourcemap.lines(source);
    const sourcel = sourcemap.location(ifTag.start + 1, ifTag.end - 1, lines);
    const isInlineTag = sourcel.start === sourcel.end;

    if (isInlineTag || ifTag === ifCon) {
        return;
    }

    if (ifCon) {
        const resultl = sourcemap.location(ifCon.start, ifCon.end, lines);

        sourcemap.patch({
            delete: [
                {start: resultl.end + 1, end: sourcel.end},
                {start: sourcel.start, end: resultl.start - 1},
            ],
        });
    } else {
        sourcemap.patch({delete: [sourcel]});
    }
}

type IfCondition = SourcePoint & {
    expr: string;
};

function headLinebreak(raw: string) {
    const match = raw.match(/^([^{]+){.*/);

    return match ? match[1] : '';
}

function tailLinebreak(raw: string) {
    const match = raw.match(/.*}(\s*\n)$/);

    return match ? match[1] : '';
}

function trimResult(content: string, ifTag: IfTag, ifCon: IfCondition | null) {
    if (!ifCon) {
        const head = headLinebreak(ifTag.rawStart);
        const tail = tailLinebreak(ifTag.rawEnd);

        let rest = head + tail;
        if (rest !== head && rest !== tail) {
            // We have extra line break, if condition was placed on individual line
            rest = rest.replace('\n', '');
        }

        return ifTag.isBlock ? '\n' : rest;
    }

    content = content.substring(ifCon.start, ifCon.end);

    if (ifTag.isBlock) {
        return trimBlockResult(content, ifCon);
    } else {
        return trimInlineResult(content, ifTag);
    }
}

function trimBlockResult(content: string, ifCon: IfCondition) {
    const head = headLinebreak(ifCon.rawStart);
    if (head) {
        content = '\n' + content;
    }

    const tail = tailLinebreak(ifCon.rawEnd);
    if (tail) {
        content = content + '\n';
    }

    return content;
}

function trimInlineResult(content: string, ifTag: IfTag) {
    const head = headLinebreak(ifTag.rawStart);
    if (head) {
        content = head + content;
    }

    const tail = tailLinebreak(ifTag.rawEnd);
    if (tail) {
        content = content + tail;
    }

    return content;
}

class IfTag implements SourcePoint {
    private conditions: IfCondition[] = [];

    get start() {
        if (!this.conditions.length) {
            return -1;
        }

        const first = this.conditions[0];

        return first.start - first.rawStart.length;
    }

    get end() {
        if (!this.conditions.length) {
            return -1;
        }

        const last = this.conditions[this.conditions.length - 1];

        return last.end + last.rawEnd.length;
    }

    get rawStart() {
        if (!this.conditions.length) {
            return '';
        }

        const first = this.conditions[0];

        return first.rawStart;
    }

    get rawEnd() {
        if (!this.conditions.length) {
            return '';
        }

        const last = this.conditions[this.conditions.length - 1];

        return last.rawEnd;
    }

    get isBlock() {
        const first = this.conditions[0];
        const last = this.conditions[this.conditions.length - 1];

        return tailLinebreak(first.rawStart) && headLinebreak(last.rawEnd);
    }

    *[Symbol.iterator](): Generator<IfCondition> {
        for (const condition of this.conditions) {
            yield condition;
        }
    }

    openCondition(raw: string, expr: string, start: number) {
        this.closeCondition(raw, start);
        this.conditions.push({
            rawStart: raw,
            start: start + raw.length,
            expr,
        } as IfCondition);

        return start + raw.length - tailLinebreak(raw).length;
    }

    closeCondition(raw: string, end: number) {
        const condition = this.conditions[this.conditions.length - 1];
        if (condition) {
            condition.rawEnd = raw;
            condition.end = end;
        }
    }
}

function inlineConditions(
    this: LiquidContext,
    content: string,
    vars: Record<string, unknown>,
    ifTag: IfTag,
) {
    const {conditions = true, keepConditionSyntaxOnTrue = false} = this.settings;

    let ifCon = null;

    for (const condition of ifTag) {
        const value = evaluate.call(this, condition.expr, vars, conditions === 'strict');

        if (
            condition.expr &&
            (value === NoValue || (keepConditionSyntaxOnTrue && value === true))
        ) {
            return {
                result: content,
                // Fix offset for next matches.
                // There can be some significant linebreak and spaces.
                lastIndex: ifTag.end - tailLinebreak(ifTag.rawEnd).length,
                ifCon: ifTag,
            };
        }

        if (!condition.expr || value) {
            ifCon = condition;
            break;
        }
    }

    const start = content.slice(0, ifTag.start);
    const end = content.slice(ifTag.end);
    const result = trimResult(content, ifTag, ifCon);

    return {
        result: start + result + end,
        lastIndex: start.length + result.length - tailLinebreak(ifTag.rawEnd).length,
        ifCon,
    };
}

export function applyConditions(
    this: LiquidContext,
    input: string,
    vars: Record<string, unknown>,
    sourcemap?: SourceMap,
) {
    const {path} = this;
    const tagStack: IfTag[] = [];

    // Consumes all between curly braces
    // and all closest upon to first linebreak before and after braces.
    const R_LIQUID = /((?:\n[\t ]*)?{%-?([\s\S]*?)-?%}(?:[\t ]*\n)?)/g;

    let match;
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
            case 'if': {
                const tag = new IfTag();

                R_LIQUID.lastIndex = tag.openCondition(match[1], args, match.index);

                tagStack.push(tag);
                break;
            }
            case 'elsif':
            case 'else': {
                const tag = tagStack[tagStack.length - 1] as IfTag;

                R_LIQUID.lastIndex = tag.openCondition(match[1], args, match.index);

                break;
            }
            case 'endif': {
                const ifTag = tagStack.pop();

                if (!ifTag) {
                    // TODO(3y3): make lint rule
                    this.logger.error(
                        `If block must be opened before close${path ? ` in ${chalk.bold(path)}` : ''}`,
                    );
                    break;
                }

                ifTag.closeCondition(match[1], match.index);

                const {result, lastIndex, ifCon} = inlineConditions.call(this, input, vars, ifTag);

                if (sourcemap) {
                    resourcemap(input, ifTag, ifCon, sourcemap);
                }

                R_LIQUID.lastIndex = lastIndex;
                input = result;

                break;
            }
            default:
                // This is not condition.
                // Step back last linebreaks to match them on next condition
                R_LIQUID.lastIndex -= tailLinebreak(match[1]).length;
        }
    }

    if (tagStack.length !== 0) {
        this.logger.error(`Condition block must be closed${path ? ` in ${chalk.bold(path)}` : ''}`);
    }

    return input;
}
