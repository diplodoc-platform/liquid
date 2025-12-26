import type {LiquidSettings} from 'src/types';

import dedent from 'ts-dedent';
import {describe, it, expect} from 'vitest';

import {createContext} from 'src';
import {applyConditions} from 'src/conditions';
import {logger} from 'src/utils';

function conditions(
    input: string,
    vars: Record<string, unknown>,
    settings?: Partial<LiquidSettings>,
) {
    const context = createContext(logger(), settings);
    return applyConditions.call(context, input, vars);
}

describe('New line cases', () => {
    it('should handle falsy conditions with Windows-style line endings (CRLF) correctly', () => {
        const input =
            'Prefix\r\n\r\n\r\n{% if list contains "non-existent" %}\r\n\r\n    Content\r\n\r\n{% endif %}\r\n\r\nPostfix';

        const result = conditions(input, {list: ['item']});

        expect(result).toEqual('Prefix\r\n\r\n\n\r\nPostfix');
    });

    it('should handle the specific case from the failing test', () => {
        const input = dedent`
            %%%0%%%
            <!-- [missed file](./missed.md) -->




            #### %%%1%%%

            {% if list contains "item" %}

                %%%2%%%

            {% endif %}

            #### %%%3%%%
        `.replace(/\n/g, '\r\n');

        const result = conditions(input, {list: ['item']});

        expect(result).toEqual(
            '%%%0%%%\r\n<!-- [missed file](./missed.md) -->\r\n\r\n\r\n\r\n\r\n#### %%%1%%%\r\n\n\r\n    %%%2%%%\r\n\n\r\n#### %%%3%%%',
        );
    });
});
