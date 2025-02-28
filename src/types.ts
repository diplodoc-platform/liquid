export type Logger = {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
};

export type LiquidSettings = {
    conditions?: boolean | 'strict';
    conditionsInCode?: boolean;
    cycles?: boolean;
    substitutions?: boolean;
    keepNotVar?: boolean;
};

export type LiquidContext = {
    logger: Logger;
    settings: LiquidSettings;
    path?: string;
};
