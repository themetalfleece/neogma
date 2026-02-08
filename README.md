![neogma logo](https://themetalfleece.github.io/neogma/assets/logo-text-horizontal.svg)

<h3 align="center">A powerful Neo4j OGM for Node.js & TypeScript</h3>

<p align="center">
  Build graph applications with ease using type-safe models, flexible query builders, and automatic relationship management
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/neogma"><img src="https://badgen.net/npm/v/neogma" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/neogma"><img src="https://badgen.net/npm/dm/neogma" alt="npm downloads"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://badgen.net/npm/types/tslib" alt="TypeScript"></a>
  <a href="https://github.com/themetalfleece/neogma/blob/master/LICENSE"><img src="https://badgen.net/github/license/themetalfleece/neogma" alt="License"></a>
  <a href="https://github.com/themetalfleece/neogma/actions/workflows/run-tests.yml"><img src="https://github.com/themetalfleece/neogma/actions/workflows/run-tests.yml/badge.svg?branch=master" alt="Tests"></a>
</p>

---

## Why Neogma?

- 🔷 **Fully Type-Safe** - Built-in TypeScript support with complete type inference
- ⚡ **Flexible** - Use Models, Query Builders, or raw Cypher queries
- 🔗 **Automatic Relationships** - Create and manage complex graph structures effortlessly
- 📦 **Eager Loading** - Load nested relationships in a single query to avoid N+1 problems
- ✅ **Validation** - Built-in schema validation for your data models
- 🚀 **Production Ready** - Battle-tested with comprehensive test coverage

## Installation

```bash
npm i neogma
```

## Quick Start

```typescript
import { Neogma, ModelFactory, ModelRelatedNodesI, NeogmaInstance } from 'neogma';

// Connect to Neo4j
const neogma = new Neogma({
  url: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password',
});

// Define your types
type UserProperties = {
  id: string;
  name: string;
  email: string;
};

// Define a type-safe model
const Users = ModelFactory<UserProperties>({
  label: 'User',
  schema: {
    id: { type: 'string', required: true },
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
  },
  primaryKeyField: 'id',
}, neogma);

// Create - TypeScript validates properties
const user = await Users.createOne({
  id: '1',
  name: 'Alice',
  email: 'alice@example.com',
});

// Find - results are fully typed
const found = await Users.findOne({ where: { email: 'alice@example.com' } });
console.log(found?.name); // TypeScript knows this is string | undefined

// Update
user.name = 'Alicia';
await user.save(); // the name change is reflected to the database
```

**[View full documentation →](https://themetalfleece.github.io/neogma)**

---

## Type Safety

Neogma's type system catches errors at compile time, not runtime:

```typescript
// ✅ TypeScript ensures correct property types
await Users.createOne({ id: '1', name: 'John', age: 30 });

// ❌ Compile error: 'age' must be number
await Users.createOne({ id: '1', name: 'John', age: 'thirty' });

// ❌ Compile error: 'address' doesn't exist on UserProperties
await Users.findOne({ where: { address: 'Infantino Street' } });

// ✅ Query results are typed - IDE autocomplete works
const user = await Users.findOne({ where: { id: '1' } });
user?.age.toFixed(2); // TypeScript knows 'age' is a number
```

---

## Creating Nodes with Relationships

Create nodes with their relationships in a single operation:

```typescript
// ... define the Users and Orders model, and relate them

await Users.createMany([
  {
    id: '1',
    name: 'John',
    age: 38,
    // Create Order and link to John in one query
    Orders: {
      attributes: [{ id: '1', status: 'confirmed' }],
    },
  },
]);
```

Result:

```
    (User: John) ──CREATES──▶ (Order: confirmed)
```

All nodes and relationships are created in a single statement for optimal performance.

---

## Query Builder

Build complex Cypher queries programmatically with full type safety:

```typescript
import { QueryBuilder, BindParam } from 'neogma';

const queryBuilder = new QueryBuilder()
  .match({
    identifier: 'u',
    model: Users,
  })
  .where('u.age >= $minAge')
  .match({
    related: [
      { identifier: 'u' },
      { direction: 'out', name: 'PLACED' },
      { identifier: 'o', model: Orders },
    ],
  })
  .where('o.status = $status')
  .return('u.name AS name, count(o) AS orderCount')
  .orderBy('orderCount DESC')
  .limit(10);

const bindParam = new BindParam({ minAge: 18, status: 'confirmed' });
const { records } = await queryBuilder.run(neogma.queryRunner, bindParam);
```

Parameters are automatically bound to prevent Cypher injection.

---

## Finding Nodes

Query nodes with flexible filtering:

```typescript
// Find with operators
const activeUsers = await Users.findMany({
  where: {
    age: { $gte: 18 },
    status: 'active',
  },
  order: [['name', 'ASC']],
  limit: 10,
});

// Available operators: $eq, $ne, $gt, $gte, $lt, $lte, $in, $contains, $like
```

---

## Eager Loading Relationships

Load related nodes in a single query to avoid N+1 problems:

```typescript
// Load users with their orders and nested items
const users = await Users.findMany({
  where: { status: 'active' },
  relationships: {
    Orders: {
      where: { target: { status: 'completed' } },
      order: [{ on: 'target', property: 'createdAt', direction: 'DESC' }],
      limit: 5,
      relationships: {
        Items: { limit: 10 }
      }
    }
  }
});

// Access nested data
users[0].Orders[0].node.id;              // Order id
users[0].Orders[0].relationship.rating;  // Relationship property (e.g., 5)
users[0].Orders[0].node.Items[0].node;   // Properties of the nested node
```

Features:
- **Nested loading** - Load relationships to arbitrary depth
- **Filtering** - Filter by target node or relationship properties at each level
- **Ordering & pagination** - Apply `order`, `limit`, `skip` at each level
- **Type-safe** - Relationship aliases are validated at compile time
- **Single query** - Uses CALL subqueries for optimal performance

---

## Documentation

Full documentation is available at **[themetalfleece.github.io/neogma](https://themetalfleece.github.io/neogma)**

## Contributing

See [DEVELOPMENT.md](DEVELOPMENT.md) for setup instructions and development workflow.

## Acknowledgements

- Neogma logo created by [Greg Magkos](https://github.com/grigmag)
- Development was made possible thanks to the open source libraries which can be found in package.json
