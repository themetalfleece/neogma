# neogma

[![npm version](https://badgen.net/npm/v/neogma)](https://www.npmjs.com/package/neogma)
[![types includes](https://badgen.net/npm/types/tslib)](https://www.typescriptlang.org/)

Object-Graph-Mapping neo4j framework, fully-typed with TypeScript, for easy and flexible node and relationship operations

## Overview
Neogma uses Model definitions to simplify and automate lots of operations. Alternatively, a query runner is also provided for running operations directly with Javascript object, without a Model definition.

By using Typescript, a user can also benefit from Neogma's type safety in all its parts. The types are build-in and used in neogma's core, so no external typings are needed.

## Documentation
- [latest](https://themetalfleece.github.io/neogma-docs)

## Examples
You can try the following to see it in action!

First install neogma: `npm i neogma`

Then, run this:
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
    }
);

// create a Users model
const Users = ModelFactory({
    label: 'User',
    schema: {
        name: {
            type: 'string',
            minLength: 3,
            required: true
        },
        age: {
            type: 'number',
            minimum: 0,
        },
        id: {
            type: 'string',
            required: true,
        }
    },
    primaryKeyField: 'id',
    relationshipCreationKeys: {},
}, neogma);

const createAndUpdateUser = async () => {
    // creates a new Users node
    const user = await Users.createOne({
        id: '1',
        name: 'John',
        age: 38
    });

    console.log(user.name); // 'John'

    user.name = 'Alex';
    // updates the node's name in the database
    await user.save();
    console.log(user.name); // 'Alex'
}

createAndUpdateUser();
```

The Cypher which runs in `createAndUpdateUser` is the following:
```sql
Statement: UNWIND {bulkCreateOptions} as bulkCreateData CREATE (bulkCreateNodes:`User`) SET bulkCreateNodes += bulkCreateData
Parameters: { bulkCreateOptions: [ { name: 'John', age: 38, id: '1' } ] }

Statement: MATCH (node:`User`) WHERE node.id = {id} SET node.name = {name}
Parameters: { id: '1', name: 'Jack' }
```

Another feature is to associate the created nodes with other nodes, which will either be created now or by matched by a where clause. This supports infinite nesting for maximum flexibility.

```js
await Users.createMany([
    {
        id: '1',
        name: 'John',
        age: 38,
        RelatedNodesToAssociate: {
            // assuming we're created an Orders Model and alias
            Orders: {
                attributes: [{
                    // creates a new Order node with the following properties, and associates it with John
                    id: '1',
                    status: 'confirmed'
                }],
                where: {
                    params: {
                        // matches an Order node with the following id and associates it with John
                        id: '2'
                    }
                }
            }
        }
    }
]);

// find the Order node which is created in the above operation
const order = await Orders.findOne({
    where: {
        id: '1'
    }
});

console.log(order.status); // confirmed
```

The cypher which runs in `Users.createMany` is the following:
```sql
Statement: CREATE (node:`User`) SET node += {data} CREATE (node__aaaa:`Order`) SET node__aaaa += {data__aaaa} CREATE (node)-[:CREATES]->(node__aaaa) WITH DISTINCT node MATCH (targetNode:`Order`) WHERE targetNode.id = {id} CREATE (node)-[r:CREATES]->(targetNode)

Parameters: {
  data: { name: 'John', age: 38, id: '1' },
  data__aaaa: { id: '1', status: 'confirmed' },
  id: '2'
}
```
![John Creates Order graph](https://i.imgur.com/gK3d74h.png)

All of the above run in a single statement for max performance.

All the user-specified values are automatically used in the query with bind parameters. Neogma also offers helpers to easily create your own queries with generated where clauses and bind parameters.