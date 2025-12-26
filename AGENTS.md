# AGENTS.md

A guide for AI coding agents working on the `@diplodoc/liquid` package.

## Package Overview

`@diplodoc/liquid` is a small and fast implementation of basic Liquid syntax for processing YFM (Yandex Flavored Markdown) documents. It provides template processing capabilities including variable substitutions, conditions, cycles (loops), and frontmatter handling.

**Key Features**:

- Variable substitutions (`{{ variable }}`)
- Conditional blocks (`{% if condition %}...{% endif %}`)
- Cycle/loop blocks (`{% for item in collection %}...{% endfor %}`)
- Frontmatter extraction and processing
- Source map support for debugging
- Custom filters support
- Code block preservation (handles code blocks without processing Liquid syntax inside)

## Package Structure

```
liquid/
├── src/
│   ├── index.ts              # Main entry point, public API
│   ├── types.ts              # TypeScript type definitions
│   ├── substitutions.ts      # Variable substitution logic
│   ├── conditions.ts         # Conditional block processing
│   ├── cycles.ts             # Loop/cycle processing
│   ├── frontmatter.ts         # Frontmatter extraction and composition
│   ├── sourcemap.ts          # Source map generation for debugging
│   ├── errors.ts             # Error handling utilities
│   ├── utils.ts              # Utility functions
│   └── syntax/
│       ├── lexical.ts        # Lexical analysis (regex patterns)
│       ├── evaluate.ts       # Expression evaluation
│       └── filters.ts        # Filter functions
├── lib/                      # Compiled JavaScript output (generated)
├── test/                     # Test files
│   ├── conditions.test.ts
│   ├── cycles.test.ts
│   ├── filters.test.ts
│   ├── lexical.test.ts
│   ├── substitutions.test.ts
│   ├── frontmatter.test.ts
│   ├── functions.test.ts
│   ├── new-line.test.ts
│   └── sourcemap.test.ts
├── package.json
├── tsconfig.json             # TypeScript config for type checking
├── tsconfig.transform.json   # TypeScript config for compilation
└── jest.config.js            # Jest test configuration
```

## Tech Stack

This package follows the standard Diplodoc platform tech stack. See `.agents/dev-infrastructure.md` and `.agents/style-and-testing.md` in the metapackage root for detailed information.

**Package-specific details**:

- **Build Tool**: TypeScript Compiler (`tsc`) - see `tsconfig.transform.json` for build configuration
- **Testing**: Jest with `ts-jest` (note: Vitest is recommended for new packages, but this package continues to use Jest)
- **Linting**: `@diplodoc/lint` (ESLint, Prettier, Stylelint) - configured via `lint init`

**Runtime Dependencies**:

- `chalk` - Terminal string styling for error messages
- `js-yaml` - YAML parsing for frontmatter
- `lodash` - Utility functions (cloneDeepWith)

## Public API

The main entry point (`src/index.ts`) exports:

### Functions

- **`liquidSnippet(input, vars, sourcemap?)`**: Processes a Liquid template snippet (without frontmatter)

  - Applies cycles, conditions, and substitutions based on settings
  - Preserves code blocks from Liquid processing

- **`liquidDocument(input, vars, sourcemap?)`**: Processes a full YFM document with frontmatter

  - Extracts and processes frontmatter separately
  - Processes content body
  - Composes result with processed frontmatter

- **`liquidJson(json, vars)`**: Recursively processes Liquid syntax in JSON objects

  - Uses `cloneDeepWith` to traverse object structure
  - Processes string values with `liquidSnippet`

- **`createContext(logger, settings?)`**: Creates a Liquid context for processing
  - Returns `LiquidContext` with logger and settings

### Types

- **`LiquidContext`**: Context object containing logger, settings, and optional path
- **`LiquidSettings`**: Configuration options for Liquid processing
- **`SourceMap`**: Source map for tracking transformations
- **`Logger`**: Logger interface (info, warn, error methods)

### Utilities

- **`evaluate(expr, vars)`**: Evaluates Liquid expressions
- **`NoValue`**: Special value indicating undefined/missing variable
- **`composeFrontMatter(frontmatter)`**: Composes frontmatter string from object
- **`extractFrontMatter(input)`**: Extracts frontmatter from YFM document

## Architecture

### Processing Pipeline

**Important Note**: The current processing order (cycles → conditions → substitutions) is a known limitation. Ideally, tags should be processed in the order they appear in the document. This would allow skipping cycles inside false condition branches. Refactoring is planned to implement proper sequential processing.

1. **Frontmatter Extraction** (for `liquidDocument`):

   - Extracts YAML frontmatter from document
   - Processes frontmatter with `liquidJson` (as object, not string)
   - Composes processed frontmatter back
   - Updates source map for frontmatter changes

2. **Code Block Preservation**:

   - Saves code blocks before processing (if `conditionsInCode` is false)
   - Replaces code blocks with placeholders (`${index}${emptyLines}`)
   - Preserves line count to maintain source map accuracy
   - Processes Liquid syntax on the rest of the document
   - Restores code blocks after processing

3. **Cycle Processing** (`applyCycles`):

   - Finds `{% for ... in ... %}` blocks
   - Evaluates collection expression
   - Iterates and processes loop body with `liquidSnippet` (recursive)
   - Supports nested loops and conditions
   - **Current limitation**: Cycles inside false condition branches are still processed

4. **Condition Processing** (`applyConditions`):

   - Finds `{% if ... %}...{% endif %}` blocks
   - Evaluates condition expressions
   - In `strict` mode: missing variables return `NoValue` (condition is false)
   - In normal mode: missing variables return `undefined` (condition is false)
   - Includes/excludes content based on condition
   - Supports `{% elsif %}` and `{% else %}`

5. **Substitution Processing** (`applySubstitutions`):
   - Finds `{{ variable }}` patterns
   - Evaluates variable paths (supports dot notation)
   - Replaces with actual values
   - Handles missing variables (warns or keeps original)
   - Processes last to allow variables from cycles/conditions to be substituted

### Expression Evaluation

The `syntax/evaluate.ts` module handles:

- Variable path resolution (e.g., `user.name.first`)
- Filter application (e.g., `{{ name | uppercase }}`)
- Boolean logic for conditions
- Array/object property access

### Lexical Analysis

The `syntax/lexical.ts` module provides regex patterns for:

- Variable patterns: `{{ variable }}`
- Tag patterns: `{% tag %}`
- Single variable detection
- Code block detection

### Source Maps

The `sourcemap.ts` module tracks transformations for accurate error reporting:

- **Purpose**: Maps processed output back to original source lines
- **Usage**: Used by `yfmlint` to report errors on original line numbers after Liquid processing
- **Operations**:
  - Line mappings between source and output
  - Deletions (removed conditional blocks)
  - Replacements (cycle iterations, frontmatter changes)
  - Offset tracking for line number adjustments
- **Code Block Preservation**: Code blocks preserve line count (`emptyLines`) to maintain source map accuracy

## Configuration

### LiquidSettings

```typescript
{
  conditions?: boolean | 'strict';      // Enable/disable conditions
                                        // 'strict': missing variables return NoValue (condition is false)
                                        // true: missing variables return undefined (condition is false)
  conditionsInCode?: boolean;            // Process conditions in code blocks
                                        // Controlled via .yfm config: template.scopes.code
  keepConditionSyntaxOnTrue?: boolean;   // Keep syntax when condition is true
  cycles?: boolean;                      // Enable/disable cycles
  substitutions?: boolean;               // Enable/disable substitutions
  keepNotVar?: boolean;                  // Keep {{ var }} if variable not found
}
```

## Common Tasks

### Adding a New Filter

1. Add filter function to `src/syntax/filters.ts`
2. Register filter in filter registry
3. Add test case to `test/filters.test.ts`
4. Update documentation if needed

### Modifying Expression Evaluation

1. Edit `src/syntax/evaluate.ts`
2. Ensure filter support is maintained
3. Update tests in relevant test files
4. Check source map handling if needed

### Adding New Syntax Feature

1. Add lexical patterns to `src/syntax/lexical.ts`
2. Create processing function (similar to `applyConditions` or `applyCycles`)
3. Integrate into `liquidSnippet` pipeline
4. Add comprehensive tests
5. Update source map handling if needed

### Debugging Source Maps

1. Use `SourceMap` class to track transformations
2. Call `sourcemap.patch()` with operations
3. Use `sourcemap.location()` to map positions
4. Check test cases in `test/sourcemap.test.ts`

## Testing

### Test Structure

- Tests are in `test/` directory
- Each module has corresponding test file
- Uses Jest with `ts-jest` for TypeScript support
- Snapshot tests for complex outputs (see `test/__snapshots__/`)

### Running Tests

```bash
npm test              # Run all tests with coverage
npm run typecheck     # Type check without running tests
```

### Test Coverage

Tests cover:

- All three main processing types (substitutions, conditions, cycles)
- Frontmatter extraction and composition
- Source map generation
- Filter functions
- Edge cases (missing variables, empty collections, etc.)

## Build System

### Compilation

```bash
npm run build          # Build library
npm run build:lib      # Same as build (TypeScript compilation)
npm run dev:lib        # Watch mode for development
```

### TypeScript Configuration

- **`tsconfig.json`**: Main config for type checking (includes test files)
- **`tsconfig.transform.json`**: Config for compilation (excludes test files, outputs to `lib/`)

### Output

- Compiled JavaScript: `lib/**/*.js`
- Type declarations: `lib/**/*.d.ts`
- Source maps: `lib/**/*.js.map`

## Important Notes

1. **Code Block Preservation**: The package preserves code blocks (fenced code blocks, inline code) from Liquid processing by default. This is controlled by `conditionsInCode` setting.

2. **Source Maps**: Source map support is optional but recommended for debugging. It tracks transformations and helps map output back to source.

3. **Error Handling**: Missing variables are logged as warnings but don't fail processing (unless `keepNotVar` is false and variable is required).

4. **Performance**: The package is designed to be fast and lightweight. Avoid adding heavy dependencies or complex processing without justification.

5. **YFM Integration**: This package is specifically designed for YFM (Yandex Flavored Markdown) but can be used standalone for any Liquid template processing.

6. **Testing Framework**: Currently uses Jest. Migration to Vitest is recommended for new packages, but this package continues to use Jest for now.

## Development Workflow

1. Make changes in `src/`
2. Run `npm run dev:lib` for watch mode compilation
3. Write/update tests in `test/`
4. Run `npm test` to verify
5. Run `npm run lint` to check code style
6. Run `npm run typecheck` to verify types
7. Build with `npm run build` before committing

## Related Packages

- **`@diplodoc/transform`**: Uses this package for Liquid processing in YFM transformation pipeline
- **`@diplodoc/cli`**: May use this package for build-time template processing
