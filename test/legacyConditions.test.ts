import type {LiquidSettings} from '../src/types';

import dedent from 'ts-dedent';

import {logger} from '../src/utils';
import {applyConditions} from '../src/conditions';
import {createContext} from '../src';

function conditions(
    input: string,
    vars: Record<string, unknown>,
    settings?: Partial<LiquidSettings>,
) {
    const context = createContext(logger(), {...settings, legacyConditions: true});
    return applyConditions.call(context, input, vars);
}

describe('LegacyConditions', () => {
    describe('location', () => {
        test('Should works for if only', () => {
            expect(
                conditions('Prefix{% if user %} Inline if {% endif %}Postfix', {
                    user: {name: 'Alice'},
                }),
            ).toEqual('Prefix Inline if Postfix');
        });

        test('should not render text if condition is false', () => {
            expect(
                conditions('Prefix{% if foo %} Inline if{% endif %} Postfix', {foo: false}),
            ).toEqual('Prefix Postfix');
        });

        test('Should works for if-else: positive', () => {
            expect(
                conditions('Prefix{% if user %} Inline if {% else %} else {% endif %}Postfix', {
                    user: {name: 'Alice'},
                }),
            ).toEqual('Prefix Inline if Postfix');
        });

        test('Should works for if-else: negative', () => {
            expect(
                conditions('Prefix{% if yandex %} Inline if {% else %} else {% endif %}Postfix', {
                    user: {name: 'Alice'},
                }),
            ).toEqual('Prefix else Postfix');
        });

        test('Should works for if-elsif', () => {
            expect(
                conditions(
                    'Prefix{% if yandex %} Inline if {% elsif user %} else {% endif %}Postfix',
                    {user: {name: 'Alice'}},
                ),
            ).toEqual('Prefix else Postfix');
        });
        test('Should works for multiple if block', () => {
            expect(
                conditions(
                    `
                    Prefix
                    {% if test %}
                        How are you?
                    {% endif %}
                    Postfix
                `,
                    {test: true},
                ),
            ).toEqual(`
                    Prefix
                                            How are you?
                    Postfix
                `);
        });

        test('Multiple if block with indent', () => {
            expect(
                conditions(
                    `
                    Prefix
                        {% if test %}
                        How are you?
                        {% endif %}
                    Postfix
                `,
                    {test: true},
                ),
            ).toEqual(`
                    Prefix
                                                How are you?
                    Postfix
                `);
        });

        test('Multiple if block with indent and negative condition', () => {
            expect(
                conditions(
                    `
                    Prefix
                    {% if test %}
                        How are you?
                    {% endif %}
                    Postfix
                `,
                    {test: false},
                ),
            ).toEqual(`
                    Prefix
                    Postfix
                `);
        });

        test('Two multiple if blocks in a row', () => {
            expect(
                conditions(
                    dedent`
                    {% if test %}
                        How are you?
                    {% endif %}
                    {% if test %}
                        How are you?
                    {% endif %}
                `,
                    {test: true},
                ),
            ).toEqual(`    How are you?
    How are you?`);
        });

        test('Condition inside the list item content', () => {
            expect(
                conditions(
                    dedent`
                    1. list item 1

                        {% if true %}Test{% endif %}
                `,
                    {},
                ),
            ).toEqual(`1. list item 1

    Test`);
        });

        test('Condition inside the note block (at start)', () => {
            expect(
                conditions(
                    dedent`
                    {% note alert %}

                    {% if locale == 'ru' %}You can't use the public geofence names.{% endif %}Test

                    {% endnote %}
                `,
                    {},
                ),
            ).toEqual(dedent`
                {% note alert %}

                Test

                {% endnote %}
            `);
        });

        test('Condition inside the note block (at end)', () => {
            expect(
                conditions(
                    dedent`
                    {% note alert %}

                    Test{% if locale == 'ru' %}You can't use the public geofence names.{% endif %}

                    {% endnote %}
                `,
                    {},
                ),
            ).toEqual(dedent`
                {% note alert %}

                Test

                {% endnote %}
            `);
        });

        test('Falsy block condition after truthly block condition', () => {
            expect(
                conditions(
                    dedent`
                        Start

                        Before
                        {% if product == "A" %}
                        Truthly
                        {% endif %}
                        {% if product == "B" %}
                        Falsy
                        {% endif %}
                        After

                        End
                `,
                    {
                        product: 'A',
                    },
                ),
            ).toEqual(dedent`
                Start

                Before
                Truthly
                After

                End
            `);
        });

        test('Falsy inline condition after truthly inline condition', () => {
            expect(
                conditions(
                    dedent`
                        {% if product == "A" %}A{% endif %}
                        {% if product == "B" %}B{% endif %}
                        C
                `,
                    {
                        product: 'A',
                    },
                ),
            ).toEqual(
                dedent`
                        A
                        C
                `,
            );
        });

        test('Around other curly braced structures', () => {
            expect(
                conditions(
                    dedent`
                        * Title:
                            * {% include [A](./A.md) %}
                        {% if audience != "internal" %}
                        * {% include [B](./B.md) %}
                        {% endif %}
                        * {% include [C](./C.md) %}
                    `,
                    {
                        audience: 'other',
                    },
                ),
            ).toEqual(
                dedent`
                        * Title:
                            * {% include [A](./A.md) %}
                        * {% include [B](./B.md) %}
                        * {% include [C](./C.md) %}
                `,
            );
        });
    });

    describe('Conditions', () => {
        describe('Positive', () => {
            test('Should support single value', () => {
                expect(
                    conditions('Prefix{% if user %} Inline if {% endif %}Postfix', {
                        user: {name: 'Alice'},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test('Should support ==', () => {
                expect(
                    conditions("Prefix{% if user.name == 'Alice' %} Inline if {% endif %}Postfix", {
                        user: {name: 'Alice'},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test('Should support !=', () => {
                expect(
                    conditions("Prefix{% if user.name != 'Bob' %} Inline if {% endif %}Postfix", {
                        user: {name: 'Alice'},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test('Should support >=', () => {
                expect(
                    conditions('Prefix{% if user.age >= 18 %} Inline if {% endif %}Postfix', {
                        user: {age: 18},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test('Should support >', () => {
                expect(
                    conditions('Prefix{% if user.age > 18 %} Inline if {% endif %}Postfix', {
                        user: {age: 21},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test('Should support <=', () => {
                expect(
                    conditions('Prefix{% if user.age <= 18 %} Inline if {% endif %}Postfix', {
                        user: {age: 18},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test('Should support <', () => {
                expect(
                    conditions('Prefix{% if user.age < 18 %} Inline if {% endif %}Postfix', {
                        user: {age: 1},
                    }),
                ).toEqual('Prefix Inline if Postfix');
            });

            test("Should support 'and'", () => {
                expect(
                    conditions(
                        'Prefix{% if user and user.age >= 18 %} Inline if {% endif %}Postfix',
                        {user: {age: 18}},
                    ),
                ).toEqual('Prefix Inline if Postfix');
            });

            test("Should support 'or'", () => {
                expect(
                    conditions(
                        'Prefix{% if user.age < 18 or user.age >= 21 %} Inline if {% endif %}Postfix',
                        {user: {age: 21}},
                    ),
                ).toEqual('Prefix Inline if Postfix');
            });
        });

        describe('Negaive', () => {
            test('Should support single value', () => {
                expect(
                    conditions(
                        'Prefix{% if yandex %} Inline if {% else %} else {% endif %}Postfix',
                        {user: {name: 'Alice'}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test('Should support ==', () => {
                expect(
                    conditions(
                        "Prefix{% if user.name == 'Alice' %} Inline if {% else %} else {% endif %}Postfix",
                        {user: {name: 'Bob'}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test('Should support !=', () => {
                expect(
                    conditions(
                        "Prefix{% if user.name != 'Bob' %} Inline if {% else %} else {% endif %}Postfix",
                        {user: {name: 'Bob'}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test('Should support >=', () => {
                expect(
                    conditions(
                        'Prefix{% if user.age >= 18 %} Inline if {% else %} else {% endif %}Postfix',
                        {user: {age: 1}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test('Should support >', () => {
                expect(
                    conditions(
                        'Prefix{% if user.age > 18 %} Inline if {% else %} else {% endif %}Postfix',
                        {user: {age: 1}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test('Should support <=', () => {
                expect(
                    conditions(
                        'Prefix{% if user.age <= 18 %} Inline if {% else %} else {% endif %}Postfix',
                        {user: {age: 21}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test('Should support <', () => {
                expect(
                    conditions(
                        'Prefix{% if user.age < 18 %} Inline if {% else %} else {% endif %}Postfix',
                        {user: {age: 21}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test("Should support 'and'", () => {
                expect(
                    conditions(
                        'Prefix{% if user and user.age >= 18 %} Inline if {% else %} else {% endif %}Postfix',
                        {user: {age: 1}},
                    ),
                ).toEqual('Prefix else Postfix');
            });

            test("Should support 'or'", () => {
                expect(
                    conditions(
                        'Prefix{% if user.age < 18 or user.age >= 21 %} Inline if {% else %} else ' +
                            '{% endif %}Postfix',
                        {user: {age: 20}},
                    ),
                ).toEqual('Prefix else Postfix');
            });
        });
    });

    describe('Nested conditions', () => {
        describe('Inline text', () => {
            test("Should support nested if's: positive", () => {
                expect(
                    conditions(
                        "Prefix{% if user %} Before nested if{% if user.name == 'Alice' %} nested if " +
                            '{% endif %}After nested if {% endif %}Postfix',
                        {user: {name: 'Alice'}},
                    ),
                ).toEqual('Prefix Before nested if nested if After nested if Postfix');
            });

            test("Should support nested if's: negative", () => {
                expect(
                    conditions(
                        "Prefix{% if user %} Before nested if {% if user.name == 'Alice' %} nested if " +
                            '{% endif %} After nested if {% endif %}Postfix',
                        {user: {name: 'Bob'}},
                    ),
                ).toEqual('Prefix Before nested if  After nested if Postfix');
            });

            test('Condition inside the cut block with multiple linebreaks', () => {
                expect(
                    conditions(
                        dedent`
                    {% cut "Title" %}

                    {% if locale == 'ru' %}

                    a

                    {% endif %}

                    {% endcut %}
                `,
                        {locale: 'ru'},
                    ),
                ).toEqual(dedent`
                    {% cut "Title" %}


                    a


                    {% endcut %}
            `);
            });
        });
    });

    describe("Chail else's", () => {
        test('Should supported in inline text', () => {
            expect(
                conditions(
                    "Prefix{% if yandex %} if {% elsif user.name == 'Bob' %} Bob " +
                        "{% elsif user.name == 'Alice' %} Alice {% endif %}Postfix",
                    {user: {name: 'Alice'}},
                ),
            ).toEqual('Prefix Alice Postfix');
        });
        test('Should supported in inline text', () => {
            expect(
                conditions(
                    "Prefix{% if yandex %} if {% elsif user.name == 'Bob' %} Bob " +
                        "{% elsif user.name == 'Alice' %} Alice {% endif %}Postfix",
                    {user: {name: 'Bob'}},
                ),
            ).toEqual('Prefix Bob Postfix');
        });
    });

    describe('Error handling', () => {
        test('Should handle endif without matching if', () => {
            const mockLogger = {
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn(),
                log: jest.fn(),
            };
            const context = createContext(mockLogger, {legacyConditions: true});

            applyConditions.call(context, '{% endif %}', {});

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('If block must be opened before close'),
            );
        });

        test('Should handle unclosed if block', () => {
            const mockLogger = {
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn(),
                log: jest.fn(),
            };
            const context = createContext(mockLogger, {legacyConditions: true});

            applyConditions.call(context, '{% if test %}content', {test: true});

            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Condition block must be closed'),
            );
        });

        test('Should handle invalid liquid tag syntax', () => {
            // Test case where tagLine regex doesn't match
            const result = conditions('{% invalid syntax here %}', {});
            expect(result).toEqual('{% invalid syntax here %}');
        });

        test('Should handle empty match group', () => {
            // This tests the case where match[1] is empty/falsy
            // Using a malformed liquid tag that creates an empty match
            const result = conditions('text {%%} more text', {});
            expect(result).toEqual('text {%%} more text');
        });

        test('Should skip processing when match[1] is undefined', () => {
            // Edge case: regex match exists but capture group is undefined
            // This can happen with certain malformed liquid syntax
            const result = conditions('text {% %} more text', {});
            expect(result).toEqual('text {% %} more text');
        });

        test('Should handle else without preceding if', () => {
            const mockLogger = {
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn(),
                log: jest.fn(),
            };
            const context = createContext(mockLogger, {legacyConditions: true});

            // This should cause a runtime error when accessing tagStack[tagStack.length - 1]
            expect(() => {
                applyConditions.call(context, '{% else %}content', {});
            }).toThrow();
        });

        test('Should handle elsif without preceding if', () => {
            const mockLogger = {
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn(),
                log: jest.fn(),
            };
            const context = createContext(mockLogger, {legacyConditions: true});

            // This should cause a runtime error when accessing tagStack[tagStack.length - 1]
            expect(() => {
                applyConditions.call(context, '{% elsif test %}content', {test: true});
            }).toThrow();
        });

        test('Should handle else after endif (orphaned else)', () => {
            const mockLogger = {
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn(),
                log: jest.fn(),
            };
            const context = createContext(mockLogger, {legacyConditions: true});

            // else after endif should cause runtime error
            expect(() => {
                applyConditions.call(context, '{% if test %}content{% endif %}{% else %}orphaned', {
                    test: true,
                });
            }).toThrow();
        });
    });

    describe('Edge cases', () => {
        describe('Whitespace handling', () => {
            test('Should handle empty if block content', () => {
                expect(conditions('Prefix{% if test %}{% endif %}Postfix', {test: true})).toEqual(
                    'PrefixPostfix',
                );
            });

            test('Should handle if block with only whitespace', () => {
                expect(
                    conditions('Prefix{% if test %}   {% endif %}Postfix', {test: true}),
                ).toEqual('Prefix   Postfix');
            });

            test('Should handle multiple consecutive newlines in if block', () => {
                expect(
                    conditions(
                        dedent`
                        {% if test %}


                        content


                        {% endif %}
                        `,
                        {test: true},
                    ),
                ).toEqual(`

content

`);
            });

            test('Should handle tabs and spaces mixed in indentation', () => {
                expect(
                    conditions(
                        `{% if test %}
    content
{% endif %}`,
                        {test: true},
                    ),
                ).toEqual(`    content`);
            });

            test('Should preserve trailing whitespace in content', () => {
                expect(conditions('{% if test %}content   {% endif %}', {test: true})).toEqual(
                    'content   ',
                );
            });
        });

        describe('Multiple elsif chains', () => {
            test('Should handle long elsif chain with all false conditions', () => {
                expect(
                    conditions(
                        dedent`
                        {% if a == 1 %}
                        A
                        {% elsif b == 2 %}
                        B
                        {% elsif c == 3 %}
                        C
                        {% elsif d == 4 %}
                        D
                        {% else %}
                        None
                        {% endif %}
                        `,
                        {a: 0, b: 0, c: 0, d: 0},
                    ),
                ).toEqual('None');
            });

            test('Should handle elsif chain with middle condition true', () => {
                expect(
                    conditions(
                        dedent`
                        {% if a == 1 %}
                        A
                        {% elsif b == 2 %}
                        B
                        {% elsif c == 3 %}
                        C
                        {% elsif d == 4 %}
                        D
                        {% endif %}
                        `,
                        {a: 0, b: 0, c: 3, d: 0},
                    ),
                ).toEqual('C');
            });

            test('Should handle elsif without else fallback', () => {
                expect(
                    conditions('Prefix{% if a %}A{% elsif b %}B{% elsif c %}C{% endif %}Postfix', {
                        a: false,
                        b: false,
                        c: false,
                    }),
                ).toEqual('PrefixPostfix');
            });

            test('Should stop at first true elsif', () => {
                expect(
                    conditions('Prefix{% if a %}A{% elsif b %}B{% elsif c %}C{% endif %}Postfix', {
                        a: false,
                        b: true,
                        c: true,
                    }),
                ).toEqual('PrefixBPostfix');
            });
        });

        describe('Deeply nested conditions', () => {
            test('Should handle 3 levels of nesting', () => {
                expect(
                    conditions(
                        dedent`
                        {% if level1 %}
                        L1
                        {% if level2 %}
                        L2
                        {% if level3 %}
                        L3
                        {% endif %}
                        {% endif %}
                        {% endif %}
                        `,
                        {level1: true, level2: true, level3: true},
                    ),
                ).toEqual(`L1
L2
L3`);
            });

            test('Should handle nested conditions with mixed results', () => {
                expect(
                    conditions(
                        dedent`
                        {% if outer %}
                        Outer
                        {% if inner %}
                        Inner true
                        {% else %}
                        Inner false
                        {% endif %}
                        {% endif %}
                        `,
                        {outer: true, inner: false},
                    ),
                ).toEqual(`Outer
Inner false`);
            });

            test('Should handle nested elsif chains', () => {
                expect(
                    conditions(
                        dedent`
                        {% if a %}
                        {% if b %}
                        AB
                        {% elsif c %}
                        AC
                        {% endif %}
                        {% elsif d %}
                        D
                        {% endif %}
                        `,
                        {a: true, b: false, c: true, d: false},
                    ),
                ).toEqual('AC');
            });
        });

        describe('Complex variable access', () => {
            test('Should handle deeply nested object properties', () => {
                expect(
                    conditions('{% if user.profile.settings.theme %}Theme{% endif %}', {
                        user: {profile: {settings: {theme: 'dark'}}},
                    }),
                ).toEqual('Theme');
            });

            test('Should handle array access in conditions', () => {
                // Array bracket notation is not supported in legacy conditions
                // This test documents the current behavior
                expect(conditions('{% if items %}First{% endif %}', {items: ['value']})).toEqual(
                    'First',
                );
            });

            test('Should handle undefined nested properties gracefully', () => {
                expect(
                    conditions('{% if user.profile.missing %}Content{% else %}Empty{% endif %}', {
                        user: {profile: {}},
                    }),
                ).toEqual('Empty');
            });

            test('Should handle null values in conditions', () => {
                expect(
                    conditions('{% if value %}True{% else %}False{% endif %}', {value: null}),
                ).toEqual('False');
            });

            test('Should handle undefined variables', () => {
                expect(conditions('{% if missing %}True{% else %}False{% endif %}', {})).toEqual(
                    'False',
                );
            });
        });

        describe('Special characters and escaping', () => {
            test('Should handle quotes in condition values', () => {
                // Escaped quotes in liquid syntax are not fully supported
                // This test documents the current behavior with simple quotes
                expect(
                    conditions('{% if text == "value" %}Match{% endif %}', {text: 'value'}),
                ).toEqual('Match');
            });

            test('Should handle single quotes in conditions', () => {
                expect(
                    conditions("{% if text == 'value' %}Match{% endif %}", {text: 'value'}),
                ).toEqual('Match');
            });

            test('Should handle special markdown characters in content', () => {
                expect(
                    conditions('{% if test %}**bold** _italic_ `code`{% endif %}', {test: true}),
                ).toEqual('**bold** _italic_ `code`');
            });

            test('Should handle liquid-like syntax in content', () => {
                expect(
                    conditions('{% if test %}Content with {{ variable }} syntax{% endif %}', {
                        test: true,
                    }),
                ).toEqual('Content with {{ variable }} syntax');
            });
        });

        describe('Boundary conditions', () => {
            test('Should handle zero as truthy in numeric comparison', () => {
                expect(conditions('{% if value == 0 %}Zero{% endif %}', {value: 0})).toEqual(
                    'Zero',
                );
            });

            test('Should handle empty string as falsy', () => {
                expect(
                    conditions('{% if text %}True{% else %}False{% endif %}', {text: ''}),
                ).toEqual('False');
            });

            test('Should handle empty array as truthy', () => {
                expect(
                    conditions('{% if items %}True{% else %}False{% endif %}', {items: []}),
                ).toEqual('True');
            });

            test('Should handle empty object as truthy', () => {
                expect(conditions('{% if obj %}True{% else %}False{% endif %}', {obj: {}})).toEqual(
                    'True',
                );
            });

            test('Should handle boolean false explicitly', () => {
                expect(conditions('{% if flag == false %}False{% endif %}', {flag: false})).toEqual(
                    'False',
                );
            });

            test('Should handle boolean true explicitly', () => {
                expect(conditions('{% if flag == true %}True{% endif %}', {flag: true})).toEqual(
                    'True',
                );
            });
        });

        describe('Whitespace trimming with dash syntax', () => {
            test('Should handle left dash trim {%-', () => {
                expect(conditions('Text   {%- if test %}Content{% endif %}', {test: true})).toEqual(
                    'Text   Content',
                );
            });

            test('Should handle right dash trim -%}', () => {
                expect(conditions('{% if test -%}   Content{% endif %}', {test: true})).toEqual(
                    '   Content',
                );
            });

            test('Should handle both dash trims {%- -%}', () => {
                // Dash trim syntax is recognized but whitespace handling
                // follows the standard legacy conditions logic
                expect(
                    conditions('Text   {%- if test -%}   Content   {%- endif -%}   More', {
                        test: true,
                    }),
                ).toEqual('Text      Content      More');
            });
        });

        describe('Multiple conditions in sequence', () => {
            test('Should handle multiple independent if blocks', () => {
                expect(
                    conditions(
                        dedent`
                        {% if a %}A{% endif %}
                        {% if b %}B{% endif %}
                        {% if c %}C{% endif %}
                        `,
                        {a: true, b: false, c: true},
                    ),
                ).toEqual(`A
C`);
            });

            test('Should handle alternating true/false conditions', () => {
                expect(
                    conditions(
                        'A{% if t %}1{% endif %}B{% if f %}2{% endif %}C{% if t %}3{% endif %}D',
                        {t: true, f: false},
                    ),
                ).toEqual('A1BC3D');
            });

            test('Should handle conditions with shared variables', () => {
                expect(
                    conditions(
                        dedent`
                        {% if x > 5 %}Greater{% endif %}
                        {% if x < 10 %}Less{% endif %}
                        {% if x == 7 %}Equal{% endif %}
                        `,
                        {x: 7},
                    ),
                ).toEqual(`Greater
Less
Equal`);
            });
        });

        describe('Complex logical expressions', () => {
            test('Should handle multiple and conditions', () => {
                expect(
                    conditions('{% if a and b and c %}All true{% endif %}', {
                        a: true,
                        b: true,
                        c: true,
                    }),
                ).toEqual('All true');
            });

            test('Should handle multiple or conditions', () => {
                expect(
                    conditions('{% if a or b or c %}At least one{% endif %}', {
                        a: false,
                        b: false,
                        c: true,
                    }),
                ).toEqual('At least one');
            });

            test('Should handle mixed and/or with precedence', () => {
                expect(
                    conditions('{% if a and b or c %}Result{% endif %}', {
                        a: false,
                        b: true,
                        c: true,
                    }),
                ).toEqual('Result');
            });

            test('Should handle negation with comparison', () => {
                expect(conditions('{% if x != 5 and x > 0 %}Match{% endif %}', {x: 3})).toEqual(
                    'Match',
                );
            });
        });

        describe('Content preservation', () => {
            test('Should preserve exact indentation in true branch', () => {
                const input = dedent`
                    {% if test %}
                        Line 1
                            Line 2
                                Line 3
                    {% endif %}
                `;
                expect(conditions(input, {test: true})).toEqual(
                    `    Line 1
        Line 2
            Line 3`,
                );
            });

            test('Should handle mixed content types', () => {
                expect(
                    conditions(
                        dedent`
                        {% if test %}
                        # Header
                        
                        Paragraph with **bold** and *italic*.
                        
                        - List item 1
                        - List item 2
                        {% endif %}
                        `,
                        {test: true},
                    ),
                ).toEqual(
                    `# Header

Paragraph with **bold** and *italic*.

- List item 1
- List item 2`,
                );
            });

            test('Should preserve code blocks in content', () => {
                expect(
                    conditions(
                        dedent`
                        {% if test %}
                        \`\`\`javascript
                        const x = 1;
                        \`\`\`
                        {% endif %}
                        `,
                        {test: true},
                    ),
                ).toEqual(`\`\`\`javascript
const x = 1;
\`\`\``);
            });
        });

        describe('Edge cases with else/elsif positioning', () => {
            test('Should handle else immediately after if', () => {
                expect(conditions('{% if test %}{% else %}Else{% endif %}', {test: false})).toEqual(
                    'Else',
                );
            });

            test('Should handle multiple elsif without spacing', () => {
                expect(
                    conditions('{% if a %}A{% elsif b %}B{% elsif c %}C{% elsif d %}D{% endif %}', {
                        a: false,
                        b: false,
                        c: false,
                        d: true,
                    }),
                ).toEqual('D');
            });

            test('Should handle else with empty content', () => {
                expect(
                    conditions('Prefix{% if test %}Content{% else %}{% endif %}Postfix', {
                        test: false,
                    }),
                ).toEqual('PrefixPostfix');
            });
        });

        describe('Numeric edge cases', () => {
            test('Should handle negative numbers in comparisons', () => {
                expect(conditions('{% if temp < 0 %}Freezing{% endif %}', {temp: -5})).toEqual(
                    'Freezing',
                );
            });

            test('Should handle floating point comparisons', () => {
                expect(
                    conditions('{% if value > 3.14 %}Greater{% endif %}', {value: 3.15}),
                ).toEqual('Greater');
            });

            test('Should handle very large numbers', () => {
                expect(conditions('{% if big > 1000000 %}Big{% endif %}', {big: 9999999})).toEqual(
                    'Big',
                );
            });
        });

        describe('String comparison edge cases', () => {
            test('Should handle case-sensitive string comparison', () => {
                expect(
                    conditions('{% if text == "Hello" %}Match{% else %}No match{% endif %}', {
                        text: 'hello',
                    }),
                ).toEqual('No match');
            });

            test('Should handle strings with spaces', () => {
                expect(
                    conditions('{% if text == "hello world" %}Match{% endif %}', {
                        text: 'hello world',
                    }),
                ).toEqual('Match');
            });

            test('Should handle empty string comparison', () => {
                expect(conditions('{% if text == "" %}Empty{% endif %}', {text: ''})).toEqual(
                    'Empty',
                );
            });
        });
    });

    describe('Multiline tests without dedent', () => {
        test('Should works for multiple if block', () => {
            expect(
                conditions(
                    `
                    Prefix
                    {% if test %}
                        How are you?
                    {% endif %}
                    Postfix
                `,
                    {test: true},
                ),
            ).toEqual(`
                    Prefix
                                            How are you?
                    Postfix
                `);
        });

        test('Multiple if block with indent', () => {
            expect(
                conditions(
                    `
                    Prefix
                        {% if test %}
                        How are you?
                        {% endif %}
                    Postfix
                `,
                    {test: true},
                ),
            ).toEqual(`
                    Prefix
                                                How are you?
                    Postfix
                `);
        });

        test('Multiple if block with indent and negative condition', () => {
            expect(
                conditions(
                    `
                    Prefix
                    {% if test %}
                        How are you?
                    {% endif %}
                    Postfix
                `,
                    {test: false},
                ),
            ).toEqual(`
                    Prefix
                    Postfix
                `);
        });

        test('Two multiple if blocks in a row', () => {
            expect(
                conditions(
                    `{% if test %}
    How are you?
{% endif %}
{% if test %}
    How are you?
{% endif %}`,
                    {test: true},
                ),
            ).toEqual(`    How are you?
    How are you?`);
        });

        test('Condition inside the list item content', () => {
            expect(
                conditions(
                    `1. list item 1

    {% if true %}Test{% endif %}`,
                    {},
                ),
            ).toEqual(`1. list item 1

    Test`);
        });

        test('Condition inside the note block (at start)', () => {
            expect(
                conditions(
                    `{% note alert %}

{% if locale == 'ru' %}You can't use the public geofence names.{% endif %}Test

{% endnote %}`,
                    {},
                ),
            ).toEqual(`{% note alert %}

Test

{% endnote %}`);
        });

        test('Condition inside the note block (at end)', () => {
            expect(
                conditions(
                    `{% note alert %}

Test{% if locale == 'ru' %}You can't use the public geofence names.{% endif %}

{% endnote %}`,
                    {},
                ),
            ).toEqual(`{% note alert %}

Test

{% endnote %}`);
        });

        test('Falsy block condition after truthly block condition', () => {
            expect(
                conditions(
                    `Start

Before
{% if product == "A" %}
Truthly
{% endif %}
{% if product == "B" %}
Falsy
{% endif %}
After

End`,
                    {
                        product: 'A',
                    },
                ),
            ).toEqual(`Start

Before
Truthly
After

End`);
        });

        test('Falsy inline condition after truthly inline condition', () => {
            expect(
                conditions(
                    `{% if product == "A" %}A{% endif %}
{% if product == "B" %}B{% endif %}
C`,
                    {
                        product: 'A',
                    },
                ),
            ).toEqual(`A
C`);
        });

        test('Around other curly braced structures', () => {
            expect(
                conditions(
                    `* Title:
    * {% include [A](./A.md) %}
{% if audience != "internal" %}
* {% include [B](./B.md) %}
{% endif %}
* {% include [C](./C.md) %}`,
                    {
                        audience: 'other',
                    },
                ),
            ).toEqual(`* Title:
    * {% include [A](./A.md) %}
* {% include [B](./B.md) %}
* {% include [C](./C.md) %}`);
        });

        test('Condition inside the cut block with multiple linebreaks', () => {
            expect(
                conditions(
                    `{% cut "Title" %}

{% if locale == 'ru' %}

a

{% endif %}

{% endcut %}`,
                    {locale: 'ru'},
                ),
            ).toEqual(`{% cut "Title" %}


a


{% endcut %}`);
        });

        test('Should handle long elsif chain with all false conditions', () => {
            expect(
                conditions(
                    `{% if a == 1 %}
A
{% elsif b == 2 %}
B
{% elsif c == 3 %}
C
{% elsif d == 4 %}
D
{% else %}
None
{% endif %}`,
                    {a: 0, b: 0, c: 0, d: 0},
                ),
            ).toEqual('None');
        });

        test('Should handle elsif chain with middle condition true', () => {
            expect(
                conditions(
                    `{% if a == 1 %}
A
{% elsif b == 2 %}
B
{% elsif c == 3 %}
C
{% elsif d == 4 %}
D
{% endif %}`,
                    {a: 0, b: 0, c: 3, d: 0},
                ),
            ).toEqual('C');
        });

        test('Should handle 3 levels of nesting', () => {
            expect(
                conditions(
                    `{% if level1 %}
L1
{% if level2 %}
L2
{% if level3 %}
L3
{% endif %}
{% endif %}
{% endif %}`,
                    {level1: true, level2: true, level3: true},
                ),
            ).toEqual(`L1
L2
L3`);
        });

        test('Should handle nested conditions with mixed results', () => {
            expect(
                conditions(
                    `{% if outer %}
Outer
{% if inner %}
Inner true
{% else %}
Inner false
{% endif %}
{% endif %}`,
                    {outer: true, inner: false},
                ),
            ).toEqual(`Outer
Inner false`);
        });

        test('Should handle nested elsif chains', () => {
            expect(
                conditions(
                    `{% if a %}
{% if b %}
AB
{% elsif c %}
AC
{% endif %}
{% elsif d %}
D
{% endif %}`,
                    {a: true, b: false, c: true, d: false},
                ),
            ).toEqual('AC');
        });

        test('Should handle multiple consecutive newlines in if block', () => {
            expect(
                conditions(
                    `{% if test %}


content


{% endif %}`,
                    {test: true},
                ),
            ).toEqual(`

content

`);
        });

        test('Should handle multiple independent if blocks', () => {
            expect(
                conditions(
                    `{% if a %}A{% endif %}
{% if b %}B{% endif %}
{% if c %}C{% endif %}`,
                    {a: true, b: false, c: true},
                ),
            ).toEqual(`A
C`);
        });

        test('Should handle conditions with shared variables', () => {
            expect(
                conditions(
                    `{% if x > 5 %}Greater{% endif %}
{% if x < 10 %}Less{% endif %}
{% if x == 7 %}Equal{% endif %}`,
                    {x: 7},
                ),
            ).toEqual(`Greater
Less
Equal`);
        });

        test('Should preserve exact indentation in true branch', () => {
            const input = `{% if test %}
    Line 1
        Line 2
            Line 3
{% endif %}`;
            expect(conditions(input, {test: true})).toEqual(
                `    Line 1
        Line 2
            Line 3`,
            );
        });

        test('Should handle mixed content types', () => {
            expect(
                conditions(
                    `{% if test %}
# Header

Paragraph with **bold** and *italic*.

- List item 1
- List item 2
{% endif %}`,
                    {test: true},
                ),
            ).toEqual(
                `# Header

Paragraph with **bold** and *italic*.

- List item 1
- List item 2`,
            );
        });

        test('Should preserve code blocks in content', () => {
            expect(
                conditions(
                    `{% if test %}
\`\`\`javascript
const x = 1;
\`\`\`
{% endif %}`,
                    {test: true},
                ),
            ).toEqual(`\`\`\`javascript
const x = 1;
\`\`\``);
        });
    });
});
