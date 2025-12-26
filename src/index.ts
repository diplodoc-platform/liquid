import type {LiquidContext, LiquidSettings, Logger} from './types';
import type {SourceMap} from './sourcemap';

import {composeFrontMatter, extractFrontMatter} from './frontmatter';
import {applySubstitutions} from './substitutions';
import {applyCycles} from './cycles';
import {applyConditions} from './conditions';
import {codeUtils} from './utils';
import {cloneDeepWith} from './utils/cloneDeepWith';

export type {LiquidContext} from './types';

export {evaluate, NoValue} from './syntax/evaluate';
export {SourceMap} from './sourcemap';
export {composeFrontMatter, extractFrontMatter} from './frontmatter';

/**
 * Processes a Liquid template snippet (without frontmatter).
 * Applies cycles, conditions, and substitutions based on context settings.
 * Preserves code blocks from Liquid processing by default.
 *
 * **Processing Order** (current implementation):
 * 1. Save code blocks (if conditionsInCode is false)
 * 2. Process cycles
 * 3. Process conditions
 * 4. Process substitutions
 * 5. Restore code blocks
 *
 * **Known Limitation**: The current order processes all cycles before conditions,
 * which means cycles inside false condition branches are still expanded.
 * A refactoring is planned to process constructs in document order.
 *
 * @param this - Liquid context
 * @param input - Template string to process
 * @param vars - Variables for Liquid processing
 * @param sourcemap - Optional source map for tracking transformations
 * @returns Processed string with Liquid syntax evaluated
 *
 * @example
 * ```typescript
 * const snippet = 'Hello, {{ name }}!';
 * const vars = { name: 'World' };
 * const result = liquidSnippet.call(context, snippet, vars);
 * // Result: "Hello, World!"
 * ```
 */
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

    // Save code blocks before processing to preserve them from Liquid syntax processing
    // This maintains source map line numbers by keeping the same number of lines
    if (!conditionsInCode) {
        output = saveCode(output, vars);
    }

    // NOTE: Current processing order (cycles -> conditions -> substitutions) is not ideal.
    // Ideally, we should process tags in the order they appear in the document.
    // This would allow us to skip cycles inside false condition branches.
    // Refactoring is planned to implement proper sequential processing.

    // Process cycles first (all {% for %} blocks)
    if (cycles) {
        output = applyCycles.call(this, output, vars, sourcemap);
    }

    // Process conditions (all {% if %} blocks)
    // In strict mode, missing variables return NoValue instead of undefined
    if (conditions) {
        output = applyConditions.call(this, output, vars, sourcemap);
    }

    // Process substitutions last (all {{ variable }} patterns)
    // This allows variables from cycles/conditions to be substituted
    if (substitutions) {
        output = applySubstitutions.call(this, output, vars);
    }

    // Restore code blocks after processing
    if (!conditionsInCode && typeof output === 'string') {
        output = repairCode(output);
    }

    return output;
}

/**
 * Recursively processes Liquid syntax in JSON objects.
 * Traverses the object structure and processes all string values with liquidSnippet.
 *
 * @param this - Liquid context
 * @param json - JSON object to process
 * @param vars - Variables for Liquid processing
 * @returns Processed JSON object with Liquid syntax evaluated
 *
 * @example
 * ```typescript
 * const json = { title: '{{ title }}', items: ['{{ item1 }}', '{{ item2 }}'] };
 * const vars = { title: 'My Title', item1: 'First', item2: 'Second' };
 * const result = liquidJson.call(context, json, vars);
 * // Result: { title: 'My Title', items: ['First', 'Second'] }
 * ```
 */
export function liquidJson(
    this: LiquidContext,
    json: Record<string, unknown>,
    vars: Record<string, unknown>,
): Record<string, unknown> {
    return cloneDeepWith(json, (value) =>
        typeof value === 'string' ? liquidSnippet.call(this, value, vars) : undefined,
    );
}

/**
 * Processes a full YFM document with frontmatter.
 * Extracts and processes frontmatter separately, then processes the content body.
 * Composes the result with processed frontmatter.
 *
 * **Frontmatter Processing**: Frontmatter is processed via `liquidJson` (not `liquidSnippet`)
 * because it's extracted as an object structure, not a string. This allows processing
 * Liquid syntax in all string values within the frontmatter object recursively.
 *
 * @param this - Liquid context
 * @param input - Full YFM document string with optional frontmatter
 * @param vars - Variables for Liquid processing
 * @param sourcemap - Optional source map for tracking transformations
 * @returns Processed document with frontmatter and content
 *
 * @example
 * ```typescript
 * const document = `---
 * title: {{ title }}
 * ---
 * Hello, {{ name }}!`;
 * const vars = { title: 'My Document', name: 'World' };
 * const result = liquidDocument.call(context, document, vars);
 * // Result: "---\ntitle: My Document\n---\nHello, World!"
 * ```
 */
export function liquidDocument(
    this: LiquidContext,
    input: string,
    vars: Record<string, unknown>,
    sourcemap?: SourceMap,
): string {
    // Normalize line endings to Unix format
    const normalizedInput = input.replace(/\r\n/g, '\n');

    // Extract frontmatter (returns [parsedObject, contentWithoutFrontmatter, rawFrontmatterString])
    const [frontMatter, strippedContent, rawFrontmatter] = extractFrontMatter(normalizedInput);

    // Process frontmatter as an object (allows recursive processing of nested structures)
    const liquidedFrontMatter = liquidJson.call(this, frontMatter, vars);
    const composedFrontmatter = composeFrontMatter(liquidedFrontMatter);

    // Update source map if frontmatter was modified
    // This is important for yfmlint to report errors on original line numbers
    if (sourcemap && rawFrontmatter.length) {
        sourcemap.patch({
            replace: [[1, rawFrontmatter, composedFrontmatter]],
        });
    }

    // Process content body as a string
    const liquidedResult = liquidSnippet.call(this, strippedContent, vars, sourcemap);

    return composedFrontmatter + liquidedResult;
}

/**
 * Creates a Liquid context for processing templates.
 * The context contains logger and settings that control Liquid processing behavior.
 *
 * @param logger - Logger object with info, warn, and error methods
 * @param settings - Optional settings to configure Liquid processing
 * @returns Liquid context object
 *
 * @example
 * ```typescript
 * const context = createContext({
 *     info: console.log,
 *     warn: console.warn,
 *     error: console.error,
 * }, {
 *     conditions: true,
 *     cycles: true,
 *     substitutions: true,
 * });
 * ```
 */
export function createContext(
    logger: Logger,
    settings: Partial<LiquidSettings> = {},
): LiquidContext {
    return {
        logger,
        settings,
    };
}
