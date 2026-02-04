import {describe, test, expect} from 'vitest';

import {isSingleVariable} from '../src/syntax/lexical';

describe('Lexical functions', () => {
    describe('isSingleVariable', () => {
        test('Valid single variable without surrounding text', () => {
            expect(isSingleVariable('{{variable}}')).toEqual(true);
        });

        test('Two variables should return false', () => {
            expect(isSingleVariable('{{variable1}} {{variable2}}')).toEqual(false);
        });

        test('Text before variable should return false', () => {
            expect(isSingleVariable('some text {{variable}}')).toEqual(false);
        });

        test('Text after variable should return false', () => {
            expect(isSingleVariable('{{variable}} some text')).toEqual(false);
        });

        test('Valid single variable with filter', () => {
            expect(isSingleVariable('{{ variable | filter }}')).toEqual(true);
        });

        test('Single variable with leading and trailing space should return false', () => {
            expect(isSingleVariable(' {{variable}} ')).toEqual(false);
        });

        test('Single variable with multiple leading and trailing spaces should return false', () => {
            expect(isSingleVariable('  {{variable}}  ')).toEqual(false);
        });

        test('Single variable with tabs and newlines should return false', () => {
            expect(isSingleVariable('\t{{variable}} \n')).toEqual(false);
        });

        test('Empty string should return false', () => {
            expect(isSingleVariable('')).toEqual(false);
        });

        test('Text without variables should return false', () => {
            expect(isSingleVariable('just some text')).toEqual(false);
        });

        test('Single curly braces should return false', () => {
            expect(isSingleVariable('{variable}')).toEqual(false);
        });

        test('Unmatched curly braces should return false', () => {
            expect(isSingleVariable('{{variable}')).toEqual(false);
        });

        // Function calls with parameters
        test('Function call with single param', () => {
            expect(isSingleVariable('{{ do_something(1) }}')).toEqual(true);
        });

        test('Function call with multiple params', () => {
            expect(isSingleVariable("{{ do_something(2, 'explicit value', 200) }}")).toEqual(true);
        });

        test('Function call with named param', () => {
            expect(isSingleVariable('{{ do_something(3, param_3=300) }}')).toEqual(true);
        });

        test('Function call without params', () => {
            expect(isSingleVariable('{{ do_something_without_params() }}')).toEqual(true);
        });

        // Function calls with not_var prefix
        test('Function call with not_var prefix should return false', () => {
            expect(isSingleVariable('not_var{{ do_something(1) }}')).toEqual(false);
        });

        test('Function call without params with not_var prefix should return false', () => {
            expect(isSingleVariable('not_var{{ do_something_without_params() }}')).toEqual(false);
        });

        // Function calls with comments
        test('Function call followed by comment should return false', () => {
            expect(
                isSingleVariable(
                    "not_var{{ do_something(1) }} {#- do_something(1, 'default value', none) -#}",
                ),
            ).toEqual(false);
        });

        test('Function call with params followed by comment should return false', () => {
            expect(
                isSingleVariable(
                    "{{ do_something(2, 'explicit value', 200) }} {#- do_something(1, 'explicit value', 100) -#}",
                ),
            ).toEqual(false);
        });

        test('Function call with named param followed by comment should return false', () => {
            expect(
                isSingleVariable(
                    "{{ do_something(3, param_3=300) }} {#- do_something(1, 'default value', 300) -#}",
                ),
            ).toEqual(false);
        });

        // Macro definitions
        test('Macro definition with default params should return false', () => {
            expect(
                isSingleVariable(
                    "{%- macro do_something(param_1, param_2='default value', param_3=none) -%}",
                ),
            ).toEqual(false);
        });

        test('Macro definition without params should return false', () => {
            expect(isSingleVariable('{%- macro do_something_without_params() -%}')).toEqual(false);
        });

        test('Macro endmacro tag should return false', () => {
            expect(isSingleVariable('{%- endmacro -%}')).toEqual(false);
        });

        test('Full macro block should return false', () => {
            expect(
                isSingleVariable(`{%- macro do_something(param_1, param_2='default value', param_3=none) -%}
    {# body of macro here #}
{%- endmacro -%}`),
            ).toEqual(false);
        });

        test('Comment only should return false', () => {
            expect(isSingleVariable('{# body of macro here #}')).toEqual(false);
        });

        test('Trimmed comment should return false', () => {
            expect(isSingleVariable("{#- do_something(1, 'default value', none) -#}")).toEqual(
                false,
            );
        });
    });
});
