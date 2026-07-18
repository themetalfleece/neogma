![neogma logo](https://themetalfleece.github.io/neogma/assets/logo-text-horizontal.svg)

<h3 align="center">The Neo4j OGM that feels like writing plain TypeScript</h3>

<p align="center">
  Define models with decorators, run fully type-safe queries against them, eager load relationships in a single trip, and let TypeScript catch your mistakes before Neo4j does
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

v2 replaces verbose factory configs with **decorators you can read at a glance**:

- **`@Node`, `@PrimaryKey`, `@Property`, `@Relationship`** -- define models as plain classes
- **TypeBox validation** built in -- powerful schemas, no extra dependencies
- **Zero boilerplate** -- no more separate `*Properties`, `*Instance`, or `*RelatedNodes` interfaces
- **Both decorator styles** -- TC39 standard (recommended) and legacy experimental

v2 is **fully backwards compatible**. Existing v1 code keeps working, but we recommend migrating for the improved DX. See the [migration guide](https://neogma.themetalfleece.dev/docs/migration) for step-by-step instructions.

> Looking for v1? Source is on the [`release/v1` branch](https://github.com/themetalfleece/neogma/tree/release/v1), docs at [themetalfleece.github.io/neogma](https://themetalfleece.github.io/neogma/).

---

## Why Neogma?

Most Neo4j libraries make you choose between convenience and control. Neogma gives you both:

- 🔷 **Type-safe end to end** - define a model once, get compile-time checks on creates, queries, and relationships
- 🎯 **Decorator-based models** - plain classes with `@Node`, `@Property`, `@Relationship` -- no boilerplate interfaces
- ⚡ **Flexible by design** - use the OGM for CRUD, the query builder for complex traversals, or drop to raw Cypher when you need to
- 🔗 **Automatic relationships** - create deeply nested graph structures in a single call
- 🌿 **Eager loading** - fetch related nodes in one query, no N+1 surprises
- ✅ **Built-in [TypeBox](https://github.com/sinclairzx81/typebox) validation** - schema validation included, nothing extra to install
- 🛡️ **Injection-safe** - every user value is a query parameter, never interpolated into Cypher
- 🔄 **Session and transaction helpers** - automatic cleanup, rollback on error, minimal ceremony
- 🐈 **NestJS ready** - first-class integration via `@neogma/nest`
- 🚀 **Battle-tested** - comprehensive test suite, used in production

## Documentation

Full documentation, guides, and API reference at **[neogma.themetalfleece.dev](https://neogma.themetalfleece.dev)**

For AI/LLM agents, the docs are also available in machine-readable formats:

- [neogma.themetalfleece.dev/llms.txt](https://neogma.themetalfleece.dev/llms.txt) - page index
- [neogma.themetalfleece.dev/llms-full.txt](https://neogma.themetalfleece.dev/llms-full.txt) - full documentation as markdown

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
  PrimaryKey,
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

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions and development workflow.

## Acknowledgements

- Neogma logo created by [Greg Magkos](https://github.com/grigmag)
- Development was made possible thanks to the open source libraries which can be found in package.json
