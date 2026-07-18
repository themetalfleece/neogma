# Basic App — JavaScript (No TypeScript, No Decorators)

A runnable example app demonstrating every major neogma feature using **plain JavaScript** and `ModelFactory`.

## When to use this example

Use this as your starting point if:

- Your project uses **plain JavaScript** (no TypeScript)
- You prefer the **`ModelFactory`** API over decorators
- You want **zero build step** — run directly with `node`

### Imports

```javascript
const { Neogma, ModelFactory, Type, Op, QueryBuilder } = require('neogma');
```

Everything comes from the main `'neogma'` package. No special tsconfig, no decorators, no build step.

### Model definitions

Models are defined using `ModelFactory` with TypeBox schemas:

```javascript
const Users = ModelFactory(
  {
    label: 'User',
    schema: {
      id: Type.String(),
      name: Type.String({ minLength: 2 }),
      email: Type.String({ pattern: '^[^@]+@[^@]+$' }),
      age: Type.Optional(Type.Number({ minimum: 0 })),
    },
    primaryKeyField: 'id',
    relationships: {
      Orders: {
        model: Orders,
        direction: 'out',
        name: 'CREATES',
      },
    },
  },
  neogma,
);
```

## Other examples

| Example | Language | Decorator style | Use when |
|---------|----------|----------------|----------|
| **basic-app-js** (this) | JavaScript | None (ModelFactory) | Plain JS, no build step |
| [basic-app-decorators](../basic-app-decorators/) | TypeScript | TC39 Stage 3 | TS project without `experimentalDecorators` |
| [basic-app-legacy-decorators](../basic-app-legacy-decorators/) | TypeScript | Legacy/experimental | TS project with `experimentalDecorators: true` |
| [nestjs-app](../nestjs-app/) | TypeScript | Legacy + NestJS | NestJS project |

All basic apps demonstrate the same features — validation, CRUD, relationships, QueryBuilder, sessions, and cleanup. They differ only in language and model definition approach.

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
cd examples/basic-app-js
pnpm install                  # Install example deps (own lockfile)
pnpm start                    # Run directly — no build step needed
```

## What it demonstrates

1. **Validation** — TypeBox-driven schema validation via `Model.build()` + `validate()`
2. **Create** — `createOne` with nested related-node creation, `createMany` for bulk inserts
3. **Read** — `findOne`, `findMany` with operators (`Op.gte`, `Op.in`, `Op.contains`), ordering, paging, eager-loaded relationships
4. **Update** — Instance `save()` with change tracking, static `Model.update()`
5. **Relationships** — `relateTo` (static + instance), `findRelationships`, `createRelationship`, `deleteRelationships`
6. **QueryBuilder** — Typed read queries, optional match, mutation chains in rollback transactions
7. **Sessions & Transactions** — `getSession`, `getTransaction` (commit + rollback)
8. **Delete** — Instance `delete()`, static `Model.delete()` with count
9. **Cleanup** — Removes all example nodes

## Project structure

```
src/
├── index.js              # Orchestrator — runs all sections in order
├── lib/
│   ├── neogma.js         # Neo4j connection helper
│   └── log.js            # Logging utilities
├── models/
│   └── index.js          # buildModels() — defines all models via ModelFactory
└── sections/
    ├── 01-validation.js
    ├── 02-create.js
    ├── 03-read.js
    ├── 04-update.js
    ├── 05-relationships.js
    ├── 06-query-builder.js
    ├── 07-sessions.js
    ├── 08-delete.js
    └── 09-cleanup.js
```

## Environment variables

Copy `.env.example` to `.env` and adjust as needed:

```
NEO4J_URL=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
```
