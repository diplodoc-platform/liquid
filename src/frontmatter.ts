import {dump, load} from 'js-yaml';
import cloneDeepWith from 'lodash/cloneDeepWith';

export type FrontMatter = {
    [key: string]: unknown;
};

const SEP = '---';

/**
 * Temporary workaround to enable parsing YAML metadata from potentially
 * Liquid-aware source files
 * @param content Input string which could contain Liquid-style substitution syntax (which clashes with YAML
 * object syntax)
 * @returns String with `{}` escaped, ready to be parsed with `js-yaml`
 */
const escapeLiquid = (content: string): string =>
    content.replace(/{{/g, '(({{').replace(/}}/g, '}}))');

/**
 * Inverse of a workaround defined above.
 * @see `escapeLiquidSubstitutionSyntax`
 * @param escapedContent Input string with `{}` escaped with backslashes
 * @returns Unescaped string
 */
const unescapeLiquid = (escapedContent: string): string =>
    escapedContent.replace(/\(\({{/g, '{{').replace(/}}\)\)/g, '}}');

const matchMetadata = (content: string) => {
    const rx = /^(?<open>[-]{3,} *\r?\n)(?<meta>[\s\S]+?)(?<close>\r?\n[-]{3,}(?: *\r?\n|$))/;
    const match = rx.exec(content);

    if (!match) {
        return null;
    }

    return match.groups as {open: string; meta: string; close: string};
};

export const extractFrontMatter = (
    content: string,
    options = {},
): [FrontMatter, string, string] => {
    const matches = matchMetadata(content);

    if (matches) {
        const {open, close, meta} = matches;
        const rawMeta = open + meta + close;
        const strippedContent = content.slice(rawMeta.length);

        const loadedData = load(escapeLiquid(meta), options) as FrontMatter;

        if (!loadedData) {
            return [{}, content, rawMeta];
        }

        return [
            cloneDeepWith(loadedData, (v) =>
                typeof v === 'string' ? unescapeLiquid(v) : undefined,
            ),
            strippedContent,
            rawMeta,
        ];
    }

    return [{}, content, ''];
};

export const composeFrontMatter = (frontMatter: FrontMatter, strippedContent = '') => {
    const dumped = dump(frontMatter, {lineWidth: -1}).trim();

    // This empty object check is a bit naive
    // The other option would be to check if all own fields are `undefined`,
    // since we exploit passing in `undefined` to remove a field quite a bit
    if (dumped === '{}') {
        return strippedContent;
    }

    return `${SEP}\n${dumped}\n${SEP}\n${strippedContent}`;
};
