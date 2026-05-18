import type {LiquidSettings} from '../src/types';

import dedent from 'ts-dedent';
import {describe, test, expect} from 'vitest';

import {createContext, liquidSnippet as liquid} from '../src';
import {logger} from '../src/utils';

function liquidSnippet(
    input: string,
    vars: Record<string, unknown>,
    settings?: Partial<LiquidSettings>,
) {
    const context = createContext(logger(), settings);
    return liquid.call(context, input, vars);
}

const commentsByPage = [
    {
        linkUrl: 'https://example.com',
        comments: ['First comment', 'Second comment'],
    },
    {
        linkUrl: 'https://example2.com',
        comments: ['Third comment', 'Fourth comment'],
    },
];
const vars = {
    users: ['Alice', 'Ivan', 'Petr'],
    users2: ['alice', 'ivan', 'petr'],
    needCapitalize: true,
    user: 'Alex',
    user2: 'Alex',
    projects: [
        {projectName: 'First project', commentsByPage},
        {projectName: 'Second project', commentsByPage},
    ],
};

describe('Cycles', () => {
    describe('location', () => {
        test('Inline for block', () => {
            expect(
                liquidSnippet('Prefix {% for user in users %} {{user}} {% endfor %} Postfix', vars),
            ).toEqual('Prefix Alice Ivan Petr Postfix');
        });

        test('Nested inline for block', () => {
            expect(
                liquidSnippet(
                    'Prefix {% for user1 in users %} {% for user2 in users %} {{user1}}+{{user2}} {% endfor %} {% endfor %} Postfix',
                    vars,
                ),
            ).toEqual(
                'Prefix Alice+Alice Alice+Ivan Alice+Petr Ivan+Alice Ivan+Ivan Ivan+Petr Petr+Alice Petr+Ivan Petr+Petr Postfix',
            );
        });

        test('Multiline for block', () => {
            expect(
                liquidSnippet(
                    dedent`
                    Prefix
                    {% for user in users %}
                    {{user}}
                    {% endfor %}
                    Postfix
                `,
                    vars,
                ),
            ).toEqual(dedent`
                Prefix
                Alice
                Ivan
                Petr
                Postfix
            `);
        });

        test('Multiline for block2', () => {
            const input = dedent`
                Prefix

                {% for project in projects %}

                ## {{project.projectName}}
                {% for item in project.commentsByPage %}

                [{{item.linkUrl}}]({{item.linkUrl}})
                {% for item2 in item.comments %}
                * {{item2}}
                {% endfor %}

                {% endfor %}
                {% endfor %}

                Postfix
            `;
            const result = dedent`
                Prefix


                ## First project

                [https://example.com](https://example.com)
                * First comment
                * Second comment


                [https://example2.com](https://example2.com)
                * Third comment
                * Fourth comment


                ## Second project

                [https://example.com](https://example.com)
                * First comment
                * Second comment


                [https://example2.com](https://example2.com)
                * Third comment
                * Fourth comment


                Postfix
            `;
            expect(liquidSnippet(input, vars)).toEqual(result);
        });

        test('Multiline nested for block without indent', () => {
            expect(
                liquidSnippet(
                    dedent`
                    Prefix
                    {% for user1 in users %}
                    {% for user2 in users %}
                    {{user1}}+{{user2}}
                    {% endfor %}
                    {% endfor %}
                    Postfix
                `,
                    vars,
                ),
            ).toEqual(dedent`
                Prefix
                Alice+Alice
                Alice+Ivan
                Alice+Petr
                Ivan+Alice
                Ivan+Ivan
                Ivan+Petr
                Petr+Alice
                Petr+Ivan
                Petr+Petr
                Postfix
            `);
        });

        const keyValues = [
            {name: 'apple', rapid: '10', regular: 'red'},
            {name: 'banana', rapid: '20', regular: 'yellow'},
            {name: 'cherry', rapid: '30', regular: 'red'},
        ];

        test('YFM table with for block', () => {
            const input = dedent`
                #|
                {% for type in key-values %}
                || {{ type.name }} | {{ type.rapid }} | {{ type.regular }} ||
                {% endfor %}
                |#
            `;
            const result = dedent`
                #|
                || apple | 10 | red ||
                || banana | 20 | yellow ||
                || cherry | 30 | red ||
                |#
            `;
            expect(liquidSnippet(input, {'key-values': keyValues})).toEqual(result);
        });

        test('YFM table with for block (substitutions: false)', () => {
            const input = dedent`
                #|
                {% for type in key-values %}
                || {{ type.name | capitalize }} | {{ type.rapid }} | {{ type.regular }} ||
                {% endfor %}
                |#
            `;
            const result = dedent`
                #|
                || {{ key-values.0.name | capitalize }} | {{ key-values.0.rapid }} | {{ key-values.0.regular }} ||
                || {{ key-values.1.name | capitalize }} | {{ key-values.1.rapid }} | {{ key-values.1.regular }} ||
                || {{ key-values.2.name | capitalize }} | {{ key-values.2.rapid }} | {{ key-values.2.regular }} ||
                |#
            `;
            const finalResult = dedent`
                #|
                || Apple | 10 | red ||
                || Banana | 20 | yellow ||
                || Cherry | 30 | red ||
                |#
            `;
            const intermediateResult = liquidSnippet(
                input,
                {'key-values': keyValues},
                {substitutions: false},
            );
            expect(intermediateResult).toEqual(result);
            expect(liquidSnippet(intermediateResult, {'key-values': keyValues})).toEqual(
                finalResult,
            );
        });
    });

    describe('with conditions, filters, substitutions', () => {
        test('Test 1', () => {
            expect(
                liquidSnippet(
                    'Prefix {% for user in users2 %}{% if needCapitalize %} {{user | capitalize}}+{{user2}} {% else %} {{user}} {% endif %}{% endfor %} Postfix',
                    vars,
                ),
            ).toEqual('Prefix Alice+Alex Ivan+Alex Petr+Alex Postfix');
        });
    });

    describe('with code blocks', () => {
        test('code block before cycle block', () => {
            expect(
                liquidSnippet(
                    '```\nCode block\n```\n\n {% for user in users %} {{user}} {% endfor %}',
                    vars,
                ),
            ).toEqual('```\nCode block\n```\n\n Alice Ivan Petr');
        });

        test('cycle block in code block', () => {
            expect(
                liquidSnippet('```\n{% for user in users %} {{user}} {% endfor %}\n```', vars, {
                    conditionsInCode: true,
                }),
            ).toEqual('```\nAlice Ivan Petr\n```');
        });
    });
});
