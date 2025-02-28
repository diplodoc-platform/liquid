import type {SourceMap} from './sourcemap';

import {bold} from 'chalk';

import {log} from '../log';

import {evalExp} from './evaluation';
import {tagLine, variable} from './lexical';
import {getPreparedLeftContent} from './utils';

import {liquidSnippet} from './index';

function resourcemap(
    source: string,
    template: string,
    result: string,
    forTag: Tag,
    sourcemap: SourceMap,
) {
    const lines = sourcemap.lines(source);

    if (!forTag.multiline) {
        return;
    }

    sourcemap.patch({
        delete: [
            sourcemap.location(forTag.startPos, forTag.contentStart - 1, lines),
            sourcemap.location(forTag.contentEnd + 1, forTag.endPos, lines),
        ],
        replace: [
            [
                sourcemap.location(forTag.contentStart, forTag.contentStart, lines).start,
                template,
                result,
            ],
        ],
    });
}

type Args2 = {
    forTag: Tag;
    vars: Record<string, unknown>;
    content: string;
    path?: string;
    sourcemap?: SourceMap;
};

function inlineConditions({forTag, vars, content, path, sourcemap}: Args2) {
    const forTemplate = content.substring(forTag.contentStart, forTag.contentEnd);

    let collection = evalExp(forTag.collectionName, vars);
    if (!collection || !Array.isArray(collection)) {
        collection = [];
        log.error(`${bold(forTag.collectionName)} is undefined or not iterable`);
    }

    const results = collection.map((item) => {
        const newVars = {...vars, [forTag.variableName]: item};
        return liquidSnippet(forTemplate, newVars, path).replace(/ +$/, '');
    });

    let res = results.join(forTag.multiline ? '\n' : '');

    if (sourcemap) {
        resourcemap(content, forTemplate, res, forTag, sourcemap);
    }

    const preparedLeftContent = getPreparedLeftContent({
        content,
        tagStartPos: forTag.startPos,
        tagContent: res,
    });

    let shift = 0;
    if (
        res === '' &&
        preparedLeftContent[preparedLeftContent.length - 1] === '\n' &&
        content[forTag.endPos] === '\n'
    ) {
        shift = 1;
    }

    if (res[0] === ' ') {
        res = res.substring(1);
    }

    const leftPart = preparedLeftContent + res;

    return {
        result: leftPart + content.substring(forTag.endPos + shift),
        idx: leftPart.length,
    };
}

type Tag = {
    item: string;
    variableName: string;
    collectionName: string;
    startPos: number;
    contentStart: number;
    contentEnd: number;
    endPos: number;
    multiline: boolean;
};

export = function cycles(
    originInput: string,
    vars: Record<string, unknown>,
    path?: string,
    settings: {sourcemap?: SourceMap} = {},
) {
    const {sourcemap} = settings;

    const R_LIQUID = /{%-?(?<for>\s*for[^}]+?)-?%}\n?|\n?{%-?(?<endfor>\s*endfor[^}]+?)-?%}/g;
    const FOR_SYNTAX = new RegExp(`(\\w+)\\s+in\\s+(${variable.source})`);

    let match;
    const tagStack: Tag[] = [];
    let input = originInput;
    let countSkippedInnerTags = 0;

    while ((match = R_LIQUID.exec(input))) {
        switch (true) {
            case Boolean(match.groups?.for): {
                const tagMatch = match.groups?.for.match(tagLine);
                if (!tagMatch) {
                    continue;
                }

                const [args] = tagMatch.slice(2);

                if (tagStack.length) {
                    countSkippedInnerTags += 1;
                    break;
                }

                const matches = args.match(FOR_SYNTAX);
                if (!matches) {
                    log.error(`Incorrect syntax in if condition${path ? ` in ${bold(path)}` : ''}`);
                    break;
                }

                const [variableName, collectionName] = matches.slice(1);
                tagStack.push({
                    item: args,
                    variableName,
                    collectionName,
                    startPos: match.index,
                    endPos: -1,
                    contentStart: R_LIQUID.lastIndex,
                    contentEnd: -1,
                    multiline: match[0].endsWith('\n'),
                });
                break;
            }
            case Boolean(match.groups?.endfor): {
                if (countSkippedInnerTags > 0) {
                    countSkippedInnerTags -= 1;
                    break;
                }
                const forTag = tagStack.pop();

                if (!forTag) {
                    log.error(
                        `For block must be opened before close${path ? ` in ${bold(path)}` : ''}`,
                    );
                    break;
                }

                forTag.endPos = R_LIQUID.lastIndex;
                forTag.contentEnd = match.index;

                const {idx, result} = inlineConditions({
                    forTag,
                    vars,
                    content: input,
                    path,
                    sourcemap,
                });
                R_LIQUID.lastIndex = idx;
                input = result;

                // let lastIndex = R_LIQUID.lastIndex;
                // if (input[lastIndex] === '\n') {
                //     lastIndex -= 1;
                // }
                // R_LIQUID.lastIndex = lastIndex;

                break;
            }
        }
    }

    if (tagStack.length !== 0) {
        log.error(`For block must be closed${path ? ` in ${bold(path)}` : ''}`);
    }

    return input;
};
