/**
 * Polyfills `Symbol.metadata` for runtimes that target ES2020 but consume TC39
 * Stage 3 decorators (which require `Symbol.metadata`). Idempotent.
 *
 * Importing this module pins the polyfill into the import graph as a side
 * effect; it must run before any `@Node` / `@Property` / `@Relationship`
 * decorator executes.
 */
(Symbol as { metadata: symbol }).metadata ??= Symbol('Symbol.metadata');

// Empty export marker so TypeScript treats this file as a module.
export {};
