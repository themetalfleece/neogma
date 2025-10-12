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
- ✅ **Validation** - Built-in schema validation for your data models
- 🚀 **Production Ready** - Battle-tested with comprehensive test coverage

## Quick Start

### Installation

```bash
npm i neogma
# or
yarn add neogma
# or
pnpm i neogma
```

### Basic Example

```js
const { Neogma, ModelFactory } = require('neogma');

// Connect to Neo4j
const neogma = new Neogma({
  url: 'bolt://localhost:7687',
  username: 'neo4j',
  password: 'password',
});

// Define a model
const User = ModelFactory({
  label: 'User',
  schema: {
    name: { type: 'string', required: true },
    email: { type: 'string', required: true },
  },
}, neogma);

// Create and query
const user = await User.createOne({
  name: 'Alice',
  email: 'alice@example.com',
});

const found = await User.findOne({ where: { email: 'alice@example.com' } });
```

**[View full documentation →](https://themetalfleece.github.io/neogma)**

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Examples](#examples)
- [Documentation](#documentation)
- [Development](#development)
- [Acknowledgements](#acknowledgements)

---

## Documentation

Full documentation is available at **[themetalfleece.github.io/neogma](https://themetalfleece.github.io/neogma)**

---

## Examples

### Creating and Updating Nodes

```js
const { Neogma, ModelFactory } = require('neogma');

// create a neogma instance and database connection
const neogma = new Neogma(
    {
        // use your connection details
        url: 'bolt://localhost',
        username: 'neo4j',
        password: 'password',
    },
    {
        logger: console.log,
    },
);

// create a Users model
const Users = ModelFactory(
    {
        label: 'User',
        schema: {
            name: {
                type: 'string',
                minLength: 3,
                required: true,
            },
            age: {
                type: 'number',
                minimum: 0,
            },
            id: {
                type: 'string',
                required: true,
            },
        },
        primaryKeyField: 'id',
        relationshipCreationKeys: {},
    },
    neogma,
);

const createAndUpdateUser = async () => {
    // creates a new Users node
    const user = await Users.createOne({
        id: '1',
        name: 'John',
        age: 38,
    });

    console.log(user.name); // 'John'

    user.name = 'Alex';
    // updates the node's name in the database
    await user.save();
    console.log(user.name); // 'Alex'

    await neogma.getDriver().close();
};

createAndUpdateUser();
```

The Cypher which runs in `createAndUpdateUser` is the following:

```sql
Statement: UNWIND {bulkCreateOptions} as bulkCreateData CREATE (bulkCreateNodes:`User`) SET bulkCreateNodes += bulkCreateData
Parameters: { bulkCreateOptions: [ { name: 'John', age: 38, id: '1' } ] }

Statement: MATCH (node:`User`) WHERE node.id = $id SET node.name = $name
Parameters: { id: '1', name: 'Jack' }
```

Another feature is to associate the created nodes with other nodes, which will either be created now or by matched by a where clause. This supports infinite nesting for maximum flexibility.

```js
await Users.createMany([
    {
        id: '1',
        name: 'John',
        age: 38,
        // assuming we're created an Orders Model and alias
        Orders: {
            attributes: [
                {
                    // creates a new Order node with the following properties, and associates it with John
                    id: '1',
                    status: 'confirmed',
                },
            ],
            where: {
                params: {
                    // matches an Order node with the following id and associates it with John
                    id: '2',
                },
            },
        },
    },
]);

// find the Order node which is created in the above operation
const order = await Orders.findOne({
    where: {
        id: '1',
    },
});

console.log(order.status); // confirmed
```

The cypher which runs in `Users.createMany` is the following:

```sql
Statement: CREATE (node:`User`) SET node += $data CREATE (node__aaaa:`Order`) SET node__aaaa += $data__aaaa CREATE (node)-[:CREATES]->(node__aaaa) WITH DISTINCT node MATCH (targetNode:`Order`) WHERE targetNode.id = $id CREATE (node)-[r:CREATES]->(targetNode)

Parameters: {
  data: { name: 'John', age: 38, id: '1' },
  data__aaaa: { id: '1', status: 'confirmed' },
  id: '2'
}
```

![John Creates Order graph](https://i.imgur.com/gK3d74h.png)

All of the above run in a single statement for max performance.

All the user-specified values are automatically used in the query with bind parameters. Neogma also offers helpers to easily create your own queries with generated where clauses and bind parameters.

---

## Development

### Prerequisites

- [nvm](https://github.com/nvm-sh/nvm), which will install node.js
- [Docker](https://www.docker.com/) and Docker Compose

### Setting up Node.js and Yarn

**Activate the project's Node.js version:**

```bash
nvm use
```

This will automatically use the Node.js version specified in `.nvmrc`.

**Enable Yarn via Corepack:**

```bash
corepack enable yarn
```

### Setting up Neo4j

Neogma requires a running Neo4j instance for unit tests. The easiest way to get started is using Docker Compose.

#### Using Docker Compose (Recommended)

**Start Neo4j:**

```bash
docker compose up -d
```

This will start a Neo4j 5.x Enterprise instance with:
- HTTP interface on http://localhost:7474
- Bolt protocol on bolt://localhost:7687
- Default credentials: `neo4j/password`

**Note:** Enterprise Edition is required for temporary database support used in tests.

**Verify Neo4j is running:**

Open http://localhost:7474 in your browser and login with username `neo4j` and password `password`.

**Configure environment variables:**

```bash
cp .env.example .env
```

The `.env` file contains the connection details. You can modify them if you changed the Docker Compose configuration.

**Stop Neo4j:**

```bash
docker compose down
```

To also remove the data volumes:

```bash
docker compose down -v
```

#### Manual Neo4j Installation

If you prefer not to use Docker:

1. Download and install [Neo4j Desktop](https://neo4j.com/download/) or [Neo4j Community Edition](https://neo4j.com/deployment-center/)
2. Create a new database with username `neo4j` and password `password`
3. Start the database
4. Copy `.env.example` to `.env` and update the connection details if needed

### Running Tests

1. **Install dependencies:**
   ```bash
   yarn
   ```

2. **Ensure Neo4j is running** (see above)

3. **Configure environment variables:**
   Make sure you have a `.env` file with the Neo4j connection details (see `.env.example`)

4. **Run the tests:**
   ```bash
   yarn test
   ```

   The tests will automatically create temporary databases for each test suite to avoid conflicts.

### Development Workflow

**Build TypeScript:**
```bash
yarn build
```

**Lint code:**
```bash
yarn lint
```

**Format code:**
```bash
yarn format
```

**Run tests in watch mode:**
```bash
yarn test --watch
```

---

## Acknowledgements

- Neogma logo created by [Greg Magkos](https://github.com/grigmag)
- Development was made possible thanks to the open source libraries which can be found in package.json.
