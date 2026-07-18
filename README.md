![neogma logo](https://themetalfleece.github.io/neogma/assets/logo-text-horizontal.svg)

<h3 align="center">A powerful Neo4j OGM for Node.js & TypeScript</h3>

<p align="center">
  Build graph applications with ease using type-safe models, flexible query builders, and automatic relationship management
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/neogma"><img src="https://badgen.net/npm/v/neogma" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/neogma"><img src="https://badgen.net/npm/dm/neogma" alt="npm downloads"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://badgen.net/npm/types/tslib" alt="TypeScript"></a>
  <a href="https://github.com/themetalfleece/neogma/blob/main/LICENSE"><img src="https://badgen.net/github/license/themetalfleece/neogma" alt="License"></a>
  <a href="https://github.com/themetalfleece/neogma/actions/workflows/run-tests.yml"><img src="https://github.com/themetalfleece/neogma/actions/workflows/run-tests.yml/badge.svg?branch=main" alt="Tests"></a>
</p>

---

## What's new in v2

Neogma v2 introduces a **decorator-based model definition** with simple, readable class decorators:

- **`@Node`, `@PrimaryKey`, `@Property`, `@Relationship` decorators** - define models with plain classes
- **TypeBox validation** - powerful, type-safe schema validation built in
- **Zero-boilerplate types** - no separate `*Properties`, `*Instance`, or `*RelatedNodes` interfaces needed
- **Both decorator styles** - supports TC39 standard decorators and legacy experimental decorators

v2 is **fully backwards compatible** with v1. We suggest upgrading to v2 for the improved developer experience, new features, and extended support. See the [migration guide](https://neogma.themetalfleece.dev/docs/migration) for step-by-step upgrade instructions.

> Looking for v1? The v1 source is on the [`v1` branch](https://github.com/themetalfleece/neogma/tree/v1), and the v1 documentation is at [themetalfleece.github.io/neogma](https://themetalfleece.github.io/neogma/).

---

## Why Neogma?

- 🔷 **Fully type-safe** - built-in TypeScript support with complete type inference
- 🎯 **Decorator-based models** - define nodes, properties, and relationships with simple decorators
- ⚡ **Flexible** - use models, query builders, or raw Cypher queries
- 🔗 **Automatic relationships** - create and manage complex graph structures effortlessly
- 🌿 **Eager loading** - load nested relationships in a single query to avoid N+1 problems
- ✅ **[TypeBox](https://github.com/sinclairzx81/typebox) validation** - powerful schema validation (included, no extra install)
- 🛡️ **Parameterized queries** - all user input is passed as query parameters, never interpolated into Cypher strings
- 🔄 **Session and transaction management** - built-in helpers for sessions, transactions, and automatic rollback
- 🐈 **NestJS integration** - first-class support via `@neogma/nest`
- 🚀 **Production ready** - battle-tested with comprehensive test coverage

## Installation

```bash
npm install neogma
# or
pnpm add neogma
# or
yarn add neogma
```

## Quick Start

```typescript
import {
  Neogma,
  Node,
  PrimaryKey,
  Property,
  Relationship,
  NodeEntity,
  Type,
} from 'neogma';
import type { Related } from 'neogma';

// Connect to Neo4j
const neogma = new Neogma({
  url: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password',
});

// Define models with decorators
@Node({ label: 'Order' })
class OrderNode extends NodeEntity {
  @PrimaryKey(Type.String()) id!: string;
  @Property(Type.String()) status!: string;
}

@Node({ label: 'User' })
class UserNode extends NodeEntity {
  @PrimaryKey(Type.String()) id!: string;

  @Property(Type.String({ minLength: 1 }))
  name!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0 })))
  age?: number;

  @Relationship({ name: 'PLACED', direction: 'out', model: () => OrderNode })
  Orders!: Related<typeof OrderNode>;
}

// Register models (dependency order - referenced models first)
const Orders = neogma.model(OrderNode);
const Users = neogma.model(UserNode);

// Create - TypeScript validates properties at compile time
const user = await Users.createOne({
  id: '1',
  name: 'Alice',
  age: 30,
  Orders: {
    attributes: [{ id: 'order-1', status: 'confirmed' }],
  },
});

// Eager-load relationships in one query
const found = await Users.findOne({
  where: { name: 'Alice' },
  relationships: { Orders: { where: { target: { status: 'confirmed' } } } },
});
console.log(found?.name); // string
console.log(found?.Orders[0].node.status); // string
// console.log(found?.bogusValue);           // TypeScript error
```

---

## Decorator styles

Neogma supports both TC39 standard decorators (recommended) and legacy experimental decorators.

### TC39 decorators (default)

No tsconfig changes needed. Import from `neogma`:

```typescript
import { Node, PrimaryKey, Property, Relationship, NodeEntity } from 'neogma';
```

### Legacy experimental decorators

Enable in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

Import from `neogma/legacy`:

```typescript
import {
  Node,
  Primarykey,
  Property,
  Relationship,
  NodeEntity,
} from 'neogma/legacy';
```

---

## Query Builder

Build complex Cypher queries programmatically:

```typescript
import { QueryBuilder, BindParam } from 'neogma';

const qb = new QueryBuilder()
  .match({ identifier: 'u', model: Users })
  .where('u.age >= $minAge')
  .match({
    related: [
      { identifier: 'u' },
      { direction: 'out', name: 'PLACED' },
      { identifier: 'o', model: Orders },
    ],
  })
  .return('u.name AS name, count(o) AS orderCount')
  .orderBy('orderCount DESC')
  .limit(10);

const bp = new BindParam({ minAge: 18 });
const { records } = await qb.run(neogma.queryRunner, bp);
```

---

## Eager Loading

Load related nodes in a single query:

```typescript
const users = await Users.findMany({
  where: { status: 'active' },
  relationships: {
    Orders: {
      where: { target: { status: 'confirmed' } },
      order: [{ on: 'target', property: 'createdAt', direction: 'DESC' }],
      limit: 5,
      relationships: {
        Items: { limit: 10 },
      },
    },
  },
});

users[0].Orders[0].node.status; // Order property
users[0].Orders[0].relationship; // Relationship properties
```

---

## NestJS Integration

Use `@neogma/nest` for first-class NestJS support:

```bash
npm install @neogma/nest
```

```typescript
import { Module } from '@nestjs/common';
import { NeogmaModule } from '@neogma/nest';

@Module({
  imports: [
    NeogmaModule.forRoot({
      connection: {
        url: 'bolt://localhost:7687',
        username: 'neo4j',
        password: 'password',
      },
    }),
    NeogmaModule.forFeature([UserNode, OrderNode]),
  ],
})
export class AppModule {}
```

See the [NestJS integration docs](https://neogma.themetalfleece.dev/docs/integrations/nestjs) for full details.

---

## Example Applications

Runnable examples are in the [`/examples`](./examples) directory:

| Example                                                                 | Description                                  |
| ----------------------------------------------------------------------- | -------------------------------------------- |
| [`basic-app-decorators`](./examples/basic-app-decorators)               | TC39 decorator-based models (recommended)    |
| [`basic-app-legacy-decorators`](./examples/basic-app-legacy-decorators) | Experimental (legacy) decorator-based models |
| [`basic-app-js`](./examples/basic-app-js)                               | JavaScript with ModelFactory                 |
| [`nestjs-app`](./examples/nestjs-app)                                   | NestJS integration with `@neogma/nest`       |

---

## Documentation

Full documentation is available at **[neogma.themetalfleece.dev](https://neogma.themetalfleece.dev)**

For AI/LLM agents, the docs are also available in machine-readable formats:

- [neogma.themetalfleece.dev/llms.txt](https://neogma.themetalfleece.dev/llms.txt) - page index
- [neogma.themetalfleece.dev/llms-full.txt](https://neogma.themetalfleece.dev/llms-full.txt) - full documentation as markdown

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions and development workflow.

## Acknowledgements

- Neogma logo created by [Greg Magkos](https://github.com/grigmag)
- Development was made possible thanks to the open source libraries which can be found in package.json
