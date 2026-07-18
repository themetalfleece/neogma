# Basic App — TC39 Proposal Decorators

A runnable example app demonstrating every major neogma feature using **TC39 Stage 3 (proposal) decorators**.

## When to use this example

Use this as your starting point if your project does **NOT** have `experimentalDecorators: true` in its `tsconfig.json`. This is the default for new TypeScript projects and represents the future standard for decorators in JavaScript/TypeScript.

### Key tsconfig requirements

```json
{
  "compilerOptions": {
    "lib": ["es2022", "esnext.decorators"],
    // Do NOT set experimentalDecorators or emitDecoratorMetadata
  }
}
```

- `"esnext.decorators"` in `lib` is required — it provides the TC39 decorator type definitions (`ClassDecoratorContext`, `ClassFieldDecoratorContext`, etc.) and augments `Function` with `[Symbol.metadata]`.
- Do **not** enable `experimentalDecorators` — that would switch TypeScript to the legacy decorator protocol, which is incompatible with neogma's TC39 decorators.

### Imports

```typescript
import { Node, NodeEntity, Property, Relationship, Type } from 'neogma';
import type { Related } from 'neogma';
```

All decorator-related imports come from the main `'neogma'` package.

## Other examples

| Example | Language | Decorator style | Use when |
|---------|----------|----------------|----------|
| **basic-app-decorators** (this) | TypeScript | TC39 Stage 3 | TS project without `experimentalDecorators` |
| [basic-app-legacy-decorators](../basic-app-legacy-decorators/) | TypeScript | Legacy/experimental | TS project with `experimentalDecorators: true` |
| [basic-app-js](../basic-app-js/) | JavaScript | None (ModelFactory) | Plain JS, no build step |
| [nestjs-app](../nestjs-app/) | TypeScript | Legacy + NestJS | NestJS project |

All basic apps demonstrate the same features. They differ only in language, decorator style, and import path.

## Prerequisites

- Node.js >= 24.13.0
- Docker (for Neo4j)
- The root neogma package must be built first (`pnpm install && pnpm build` from the repo root)

## Quick start

```bash
# From the repo root
docker compose up -d          # Start Neo4j
pnpm install                  # Install workspace deps + build neogma

# From this directory
cd examples/basic-app-decorators
pnpm install                  # Install example deps (own lockfile)
pnpm build                    # Compile TypeScript
pnpm start                    # Run the example
```

Or use the shorthand:

```bash
pnpm dev    # Build + run in one step
```

## What it demonstrates

The example runs 9 sections sequentially against a local Neo4j instance:

1. **Validation** — TypeBox-driven schema validation via `Model.build()` + `validate()`
2. **Create** — `createOne` with nested related-node creation, `createMany` for bulk inserts
3. **Read** — `findOne`, `findMany` with operators (`Op.gte`, `Op.in`, `Op.contains`), ordering, paging, eager-loaded relationships
4. **Update** — Instance `save()` with change tracking, static `Model.update()`, instance methods
5. **Relationships** — `relateTo` (static + instance), `findRelationships`, `createRelationship`, `deleteRelationships`
6. **QueryBuilder** — Typed read queries, optional match, mutation chains (`merge`/`set`/`unwind`/`call`/`remove`/`delete`) in rollback transactions
7. **Sessions & Transactions** — `getSession`, `getTransaction` (commit + rollback paths)
8. **Delete** — Instance `delete()`, static `Model.delete()` with count
9. **Cleanup** — Removes all example nodes

## Project structure

```
src/
├── index.ts              # Orchestrator — runs all sections in order
├── lib/
│   ├── neogma.ts         # Neo4j connection helper
│   └── log.ts            # Logging utilities
├── models/
│   ├── index.ts          # buildModels() — registers all models via toModel()
│   ├── UserNode.ts       # @Node + @Property + @Relationship (TC39 decorators)
│   ├── OrderNode.ts
│   ├── OrderItemNode.ts
│   └── TagNode.ts
└── sections/
    ├── 01-validation.ts
    ├── 02-create.ts
    ├── 03-read.ts
    ├── 04-update.ts
    ├── 05-relationships.ts
    ├── 06-query-builder.ts
    ├── 07-sessions.ts
    ├── 08-delete.ts
    └── 09-cleanup.ts
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```
