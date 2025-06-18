import type {LiquidContext, LiquidSettings, Logger} from './types';
import type {SourceMap} from './sourcemap';

import cloneDeepWith from 'lodash/cloneDeepWith';

import {composeFrontMatter, extractFrontMatter} from './frontmatter';
import {applySubstitutions} from './substitutions';
import {applyCycles} from './cycles';
import {applyConditions} from './conditions';
import {codeUtils} from './utils';

export type {LiquidContext} from './types';

export {evaluate, NoValue} from './syntax/evaluate';
export {SourceMap} from './sourcemap';
export {composeFrontMatter, extractFrontMatter} from './frontmatter';

export function liquidSnippet(
    this: LiquidContext,
    input: string,
    vars: Record<string, unknown>,
    sourcemap?: SourceMap,
): string {
    const {
        cycles = true,
        conditions = true,
        substitutions = true,
        conditionsInCode = false,
    } = this.settings;

    const {saveCode, repairCode} = codeUtils.call(this);

    let output = input;

    if (!conditionsInCode) {
        output = saveCode(output, vars);
    }

    if (cycles) {
        output = applyCycles.call(this, output, vars, sourcemap);
    }

    if (conditions) {
        output = applyConditions.call(this, output, vars, sourcemap);
    }

    if (substitutions) {
        output = applySubstitutions.call(this, output, vars);
    }

    if (!conditionsInCode && typeof output === 'string') {
        output = repairCode(output);
    }

    return output;
}

export function liquidJson(this: LiquidContext, json: object, vars: Record<string, unknown>) {
    return cloneDeepWith(json, (value) =>
        typeof value === 'string' ? liquidSnippet.call(this, value, vars) : undefined,
    );
}

export function liquidDocument(
    this: LiquidContext,
    input: string,
    vars: Record<string, unknown>,
    sourcemap?: SourceMap,
): string {
    const [frontMatter, strippedContent, rawFrontmatter] = extractFrontMatter(input);

    const liquidedFrontMatter = liquidJson.call(this, frontMatter, vars);
    const composedFrontmatter = composeFrontMatter(liquidedFrontMatter);

    if (sourcemap && rawFrontmatter.length) {
        sourcemap.patch({
            replace: [[1, rawFrontmatter, composedFrontmatter]],
        });
    }

    const liquidedResult = liquidSnippet.call(this, strippedContent, vars);

    return composedFrontmatter + liquidedResult;
}

export function createContext(
    logger: Logger,
    settings: Partial<LiquidSettings> = {},
): LiquidContext {
    return {
        logger,
        settings,
    };
}
