[![NPM version](https://img.shields.io/npm/v/@diplodoc/liquid.svg?style=flat)](https://www.npmjs.org/package/@diplodoc/liquid)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_liquid&metric=alert_status)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_liquid)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_liquid&metric=coverage)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_liquid)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_liquid&metric=sqale_rating)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_liquid)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_liquid&metric=reliability_rating)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_liquid)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=diplodoc-platform_liquid&metric=security_rating)](https://sonarcloud.io/summary/overall?id=diplodoc-platform_liquid)

# @diplodoc/liquid

A small and fast implementation of basic Liquid syntax for processing YFM (Yandex Flavored Markdown) documents. Provides template processing capabilities including variable substitutions, conditions, cycles (loops), and frontmatter handling.

## Features

- **Variable substitutions** — `{{ variable }}` syntax
- **Conditional blocks** — `{% if condition %}...{% endif %}`
- **Cycle/loop blocks** — `{% for item in collection %}...{% endfor %}`
- **Frontmatter processing** — YAML frontmatter extraction and processing
- **Source map support** — Optional source maps for debugging
- **Custom filters** — Extensible filter system
- **Code block preservation** — Handles code blocks without processing Liquid syntax inside

## Installation

```bash
npm install @diplodoc/liquid
```

## Usage

### Basic Example

```typescript
import {createContext, liquidDocument} from '@diplodoc/liquid';

// Create a context with logger and settings
const context = createContext({
  info: console.log,
  warn: console.warn,
  error: console.error,
});

// Process a document with variables
const template = `
---
title: {{ title }}
---

Hello, {{ name }}!

{% if showDetails %}
Details: {{ details }}
{% endif %}
`;

const vars = {
  title: 'My Document',
  name: 'World',
  showDetails: true,
  details: 'Some important information',
};

const result = liquidDocument.call(context, template, vars);
// Result:
// ---
// title: My Document
// ---
//
// Hello, World!
//
// Details: Some important information
```

### Processing Snippets

```typescript
import {liquidSnippet} from '@diplodoc/liquid';

const snippet = 'Hello, {{ name }}!';
const vars = {name: 'World'};

const result = liquidSnippet.call(context, snippet, vars);
// Result: "Hello, World!"
```

### Processing JSON

```typescript
import {liquidJson} from '@diplodoc/liquid';

const json = {
  title: '{{ title }}',
  items: ['{{ item1 }}', '{{ item2 }}'],
};

const vars = {
  title: 'My Title',
  item1: 'First',
  item2: 'Second',
};

const result = liquidJson.call(context, json, vars);
// Result: { title: 'My Title', items: ['First', 'Second'] }
```

## API

### Functions

- **`liquidDocument(input, vars, sourcemap?)`** — Processes a full YFM document with frontmatter
- **`liquidSnippet(input, vars, sourcemap?)`** — Processes a Liquid template snippet (without frontmatter)
- **`liquidJson(json, vars)`** — Recursively processes Liquid syntax in JSON objects
- **`createContext(logger, settings?)`** — Creates a Liquid context for processing

### Types

- **`LiquidContext`** — Context object containing logger, settings, and optional path
- **`LiquidSettings`** — Configuration options for Liquid processing
- **`SourceMap`** — Source map for tracking transformations

See TypeScript definitions for detailed API documentation.

## Configuration

You can configure Liquid processing behavior via `LiquidSettings`:

```typescript
const context = createContext(logger, {
  conditions: true, // Enable/disable conditions
  cycles: true, // Enable/disable cycles
  substitutions: true, // Enable/disable substitutions
  conditionsInCode: false, // Process conditions in code blocks
  keepNotVar: false, // Keep {{ var }} if variable not found
});
```

## License

MIT
