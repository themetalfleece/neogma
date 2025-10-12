![neogma logo](https://themetalfleece.github.io/neogma/assets/logo-text-horizontal.svg)

Object-Graph-Mapping neo4j framework, fully-typed with TypeScript, for easy and flexible node and relationship operations

[![npm version](https://badgen.net/npm/v/neogma)](https://www.npmjs.com/package/neogma)
[![npm monthly downloads](https://badgen.net/npm/dm/neogma)](https://www.npmjs.com/package/neogma)
[![types includes](https://badgen.net/npm/types/tslib)](https://www.typescriptlang.org/)
![license MIT](https://badgen.net/github/license/themetalfleece/neogma)
[![Tests](https://github.com/themetalfleece/neogma/actions/workflows/run-tests.yml/badge.svg?branch=master)](https://github.com/themetalfleece/neogma/actions/workflows/run-tests.yml)

## Table of Contents

- [Table of Contents](#table-of-contents)
- [Overview](#overview)
- [Installation](#installation)
- [Documentation](#documentation)
- [Examples](#examples)
  - [Basic Usage](#basic-usage)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Setting up Yarn](#setting-up-yarn)
  - [Setting up Neo4j](#setting-up-neo4j)
    - [Using Docker Compose (Recommended)](#using-docker-compose-recommended)
    - [Manual Neo4j Installation](#manual-neo4j-installation)
  - [Running Tests](#running-tests)
  - [Development Workflow](#development-workflow)
- [Acknowledgements](#acknowledgements)

## Overview

Neogma uses Model definitions to simplify and automate lots of operations. Alternatively, a flexible and fully-fletched query builder and a query runner is also provided for running operations directly with Javascript objects, without a Model definition.

By using Typescript, a user can also benefit from Neogma's type safety in all its parts. The types are built-in and used in neogma's core, so no external typings are needed.

## Installation

```bash
npm i neogma
# or
yarn add neogma
# or
pnpm i neogma
```

## Documentation

Full documentation is available at [themetalfleece.github.io/neogma](https://themetalfleece.github.io/neogma)

## Examples

### Basic Usage

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

- [Node.js](https://nodejs.org/) (managed via [nvm](https://github.com/nvm-sh/nvm) recommended).
- [Docker](https://www.docker.com/) and Docker Compose.

### Setting up Yarn

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
