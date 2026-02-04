// quote related
const singleQuoted = /'[^']*'/;
const doubleQuoted = /"[^"]*"/;

const quoted = new RegExp(`${singleQuoted.source}|${doubleQuoted.source}`);
export const quoteBalanced = new RegExp(`(?:${quoted.source}|[^'"])*`);

// Jinja2 expression content:
// \w          - identifiers (letters, digits, underscore)
// .           - attribute access
// \-          - hyphen in names, negative numbers
// |           - filters
// ()          - function calls
// ,           - argument separator
// '"          - string literals
// =           - named parameters
// []          - indexing, subscript
// :           - slices, dict literals
// +*/%        - arithmetic operators
// <>!         - comparison operators
// ~           - Jinja string concatenation
// @           - decorators (rare)
// \s already handled by space in character class
const varsContent = /[.\w\-|(),'=":[\]+*/%<>!~@\s]+/;
export const vars = new RegExp(`((not_var)?({{2}(${varsContent.source})}{2}))`, 'gm');
export const singleVariable = new RegExp(`^{{2}(${varsContent.source})}{2}$`);

// basic types
const number = /-?\d+\.?\d*|\.?\d+/;
const bool = /true|false/;

// property access
const identifier = /[\w-|]+[?]?/;
const subscript = new RegExp(`\\[(?:${quoted.source}|[\\w-\\.]+)\\]`);
const literal = new RegExp(`(?:${quoted.source}|${bool.source}|${number.source})`);
export const variable = new RegExp(
    `${identifier.source}(?:\\.${identifier.source}|${subscript.source})*`,
);

// range related
const rangeLimit = new RegExp(`(?:${variable.source}|${number.source})`);
const rangeCapture = new RegExp(`\\((${rangeLimit.source})\\.\\.(${rangeLimit.source})\\)`);

// full match
export const tagLine = new RegExp(`^\\s*(${identifier.source})\\s*([\\s\\S]*)\\s*$`);
const literalLine = new RegExp(`^${literal.source}$`, 'i');
const variableLine = new RegExp(`^${variable.source}$`);
const numberLine = new RegExp(`^${number.source}$`);
const boolLine = new RegExp(`^${bool.source}$`, 'i');
const quotedLine = new RegExp(`^${quoted.source}$`);
export const rangeLine = new RegExp(`^${rangeCapture.source}$`);

export const operators = [
    /\s+or\s+/,
    /\s+and\s+/,
    /[=]=|!=|<=|>=|<|>|\s+contains\s+/,
    /\s+\|\s+/, // myVar | filterName
    /\s+\|/, // myVar |filterName
    /\|\s+/, // myVar| filterName
    /\./,
];

const prepareArgsForMethods = {
    slice: (args: string[]) => args.map((arg) => Number(arg)),
};
const supportedMethods = Object.keys(prepareArgsForMethods);
const supportedMethodsRE = new RegExp(`^(${supportedMethods.join('\\|')})\\(([^)]*)\\)$`);
export const isSupportedMethod = (exp: string) => {
    return supportedMethodsRE.test(exp);
};
export const getParsedMethod = (exp: String) => {
    const match = exp.match(supportedMethodsRE);

    if (!match) {
        return null;
    }

    const name = match[1];
    const args = match[2].split(/[\s,]+/);

    return {
        name,
        args,
    };
};

export const isLiteral = (str: string) => literalLine.test(str);
export const isVariable = (str: string) => variableLine.test(str);
export const isSingleVariable = (str: string) => singleVariable.test(str);

export function parseLiteral(str: string) {
    let res = str.match(numberLine);

    if (res) {
        return Number(str);
    }
    res = str.match(boolLine);
    if (res) {
        return str.toLowerCase() === 'true';
    }
    res = str.match(quotedLine);
    if (res) {
        return str.slice(1, -1);
    }

    throw new TypeError(`cannot parse '${str}' as literal`);
}
