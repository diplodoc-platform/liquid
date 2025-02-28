import type {LiquidContext} from './types';

import chalk from 'chalk';

import {getObject} from './utils';
import {
    isSingleVariable,
    isVariable,
    singleVariable as singleVariableRe,
    vars as varsRe,
} from './syntax/lexical';
import {evaluate} from './syntax/evaluate';

export function applySubstitutions(
    this: LiquidContext,
    input: string,
    vars: Record<string, unknown>,
) {
    const {path} = this;
    const {keepNotVar = false} = this.settings;

    if (isSingleVariable(input)) {
        const match = input.match(singleVariableRe);

        if (!match) {
            return input;
        }

        const trimVarPath = match[1].trim();
        const value = substituteVariable.call(this, trimVarPath, vars);

        if (value === undefined) {
            this.logger.warn(
                `Variable ${chalk.bold(trimVarPath)} not found${path ? ` in ${chalk.bold(path)}` : ''}`,
            );

            return input;
        }

        return value;
    }

    return input.replace(varsRe, (match, _groupNotVar, flag, groupVar, groupVarValue) => {
        if (flag) {
            return keepNotVar ? _groupNotVar : groupVar;
        }

        const trimVarPath = groupVarValue.trim();

        if (trimVarPath.startsWith('.')) {
            return groupVar;
        }

        const value = substituteVariable.call(this, trimVarPath, vars);

        if (value === undefined) {
            this.logger.warn(
                `Variable ${chalk.bold(trimVarPath)} not found${path ? ` in ${chalk.bold(path)}` : ''}`,
            );

            return match;
        }

        return value;
    });
}

function substituteVariable(this: LiquidContext, varPath: string, vars: Record<string, unknown>) {
    if (isVariable(varPath)) {
        return getObject(varPath, vars);
    } else {
        return evaluate.call(this, varPath, vars);
    }
}
