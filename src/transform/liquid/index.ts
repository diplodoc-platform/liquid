import type {SourceMap} from './sourcemap';

import cloneDeepWith from 'lodash/cloneDeepWith';

import {composeFrontMatter, extractFrontMatter} from '../frontmatter';

import applySubstitutions from './substitutions';
import applyCycles from './cycles';
import applyConditions from './conditions';
import ArgvService, {ArgvSettings} from './services/argv';

const fence = '```';

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

function saveCode(
    str: string,
    vars: Record<string, unknown>,
    codes: string[],
    path?: string,
    substitutions?: boolean,
) {
    return replace(
        fence,
        fence,
        (code) => {
            const codeWithVars = substitutions ? applySubstitutions(code, vars, path) : code;
            const index = codes.push(codeWithVars) - 1;

            /* Keep the same count of lines to avoid transformation of the source map */
            const codeLines = codeWithVars.split('\n');
            const emptyLines = codeLines.length > 1 ? '\n'.repeat(codeLines.length) : '';

            return `${index}${emptyLines}`;
        },
        str,
    );
}

function repairCode(str: string, codes: string[]) {
    return replace(fence, fence, (code) => codes[Number(code)], str);
}

function liquidSnippet(
    originInput: string,
    vars: Record<string, unknown>,
    path?: string,
    settings?: ArgvSettings & {sourcemap?: SourceMap},
): string {
    const {
        cycles = true,
        conditions = true,
        substitutions = true,
        conditionsInCode = false,
        useLegacyConditions = false,
        keepNotVar = false,
        sourcemap,
    } = settings || {};

    ArgvService.init({
        cycles,
        conditions,
        substitutions,
        conditionsInCode,
        useLegacyConditions,
        keepNotVar,
    });

    const codes: string[] = [];

    let output = conditionsInCode
        ? originInput
        : saveCode(originInput, vars, codes, path, substitutions);

    if (cycles) {
        output = applyCycles(output, vars, path, {sourcemap});
    }

    if (conditions) {
        const strict = conditions === 'strict';
        output = applyConditions(output, vars, path, {sourcemap, strict});
    }

    if (substitutions) {
        output = applySubstitutions(output, vars, path);
    }

    if (!conditionsInCode && typeof output === 'string') {
        output = repairCode(output, codes);
    }

    codes.length = 0;

    return output;
}

function liquidDocument(
    input: string,
    vars: Record<string, unknown>,
    path?: string,
    settings: ArgvSettings & {sourcemap?: SourceMap} = {},
): string {
    const {sourcemap} = settings;
    const [frontMatter, strippedContent, rawFrontmatter] = extractFrontMatter(input, path);

    const liquidedFrontMatter = cloneDeepWith(frontMatter, (value: unknown) =>
        typeof value === 'string'
            ? liquidSnippet(value, vars, path, {...settings, withSourceMap: false})
            : undefined,
    );
    const composedFrontmatter = composeFrontMatter(liquidedFrontMatter);

    if (sourcemap && rawFrontmatter.length) {
        sourcemap.patch({
            replace: [[1, rawFrontmatter, composedFrontmatter]],
        });
    }

    const liquidedResult = liquidSnippet(strippedContent, vars, path, settings);
    const output = composedFrontmatter + liquidedResult;

    return output;
}

// both default and named exports for convenience
export {liquidDocument, liquidSnippet};
