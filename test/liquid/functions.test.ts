import type {LiquidSettings} from '../../src/transform/types';

import {applySubstitutions} from '../../src/transform/substitutions';
import {createContext} from '../../src/transform';
import {logger} from '../../src/transform/utils';

function substitutions(
    input: string,
    vars: Record<string, unknown>,
    settings?: Partial<LiquidSettings>,
) {
    const context = createContext(logger(), settings);
    return applySubstitutions.call(context, input, vars);
}

describe('Functions', () => {
    describe('slice', () => {
        test('Test 1', () => {
            expect(
                substitutions('Hello M{{ user.name.slice(1) }}!', {user: {name: 'Pasha'}}),
            ).toEqual('Hello Masha!');
        });
        test('Test 2', () => {
            expect(
                substitutions('Hello M{{ user.name.slice(1, 2) }}sha!', {user: {name: 'Pasha'}}),
            ).toEqual('Hello Masha!');
        });
        test('Test 3', () => {
            expect(substitutions('Hello M{{ user.name.slice(1, 2) }}sha!', {})).toEqual(
                'Hello M{{ user.name.slice(1, 2) }}sha!',
            );
        });
    });
});
