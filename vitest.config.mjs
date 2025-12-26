import {defineConfig} from 'vitest/config';

export default defineConfig({
    test: {
        include: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
        exclude: ['node_modules', 'lib'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'node_modules/',
                'lib/',
                'test/',
                '**/*.test.ts',
                '**/__tests__/**',
                '**/*.spec.ts',
            ],
        },
    },
});

