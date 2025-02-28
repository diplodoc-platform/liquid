export type Logger = {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

export type LiquidSettings = {
    conditions: boolean | 'strict';
    conditionsInCode: boolean;
    cycles: boolean;
    substitutions: boolean;
    keepNotVar: boolean;
};

export type LiquidContext = {
    log: Logger;
    settings: LiquidSettings;
    path?: string;
};
