import chalk from 'chalk';

export class SkippedEvalError extends Error {
    constructor(message: string, exp: string) {
        super();

        this.name = 'SkippedEvalError';
        this.message = `${message}: ${chalk.bold(exp)}`;
    }
}
