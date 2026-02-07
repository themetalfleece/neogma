# Finding Nodes

Neogma provides some basic functionality for matching, filtering, limiting and ordering nodes. For more complex find statements, one can use the driver for running a raw query.

> **Type Safety**: When using TypeScript, the `where` parameters in all find methods are type-checked against your model's properties. Both property names and value types are validated at compile time. See [Where Parameters](../Where-Parameters.md#type-safe-where-parameters) for details.

## Finding Many Nodes

```js
import { Op } from 'neogma';

/* --> finds Users Nodes and returns an array of Users Instances */
const users = await Users.findMany({
    /* --> the where param for matching the Nodes */
    where: {
        /* --> the name property of the User Nodes must be 'John' and their id must be in: ('1', '2') */
        name: 'John',
        /* --> using the "in" Symbol from "Op" */
        id: { [Op.in]: ['1', '2'] },
    },
    /* --> (optional) the limit of this query */
    limit: 3,
    /* --> (optional) the skip of this query */
    skip: 3,
    /* --> (optional) the order of this query, in this case by: age DESC, id ASC */
    order: [['age', 'DESC'], ['id', 'ASC']],
    /* --> (optional, default false) returns an array of the plain properties, instead of Instances */
    plain: false,
    /* --> (optional) throws NeogmaNotFoundError if no nodes are found (results length 0) */
    throwIfNoneFound: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(users[0].bar()); // "The name of this user is: John"
console.log(users[0].age, users[0].id); // 45 "2"
console.log(users[1].age, users[1].id); // 45 "3"
console.log(users[2].age, users[2].id); // 38 "1"
```

## Finding a single Node

```js
/* --> finds a User Node and returns a Users Instances */
const user = await Users.findOne({
    /* --> the where param for matching the Node */
    where: {
        /* --> the name property of the User Node must be 'John' */
        name: 'John',
    },
    /* --> (optional) the order of this query, in this case by: id ASC */
    order: [['id', 'ASC']],
    /* --> (optional, default false) returns the plain properties, instead of Instance */
    plain: false,
    /* --> (optional) throws NeogmaNotFoundError if the node is not found */
    throwIfNotFound: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(user.bar()); // "The name of this user is: John"
console.log(user.id, user.age); // "1" 38
```

## Finding nodes and relationships via the Model static
The `findRelationships` static can find related nodes via an Alias.

```js
const relationships = await Users.findRelationships({
    /* --> the alias of the relationship, as provided in the Model definition */
    alias: 'Orders',
    /* --> (optional) where parameters for the query */
    where: {
        /* --> (optional) where parameters of the source node (i.e. User) */
        source: {
            id: '1'
        },
        /* --> (optional) where parameters of the target node (i.e. Order) */
        target: {
            id: '2'
        },
        /* --> (optional) where parameters of the relationship between the nodes */
        relationship: {
            rating: 4
        },
    },
    /* --> (optional) the order of the results. The 'on' property specifies the entity context: 'source', 'target', or 'relationship' */
    order: [
        {
            on: 'relationship',
            property: 'rating',
            direction: 'DESC',
        },
        {
            on: 'target',
            property: 'date',
            direction: 'ASC',
        }
    ],
    /* --> (optional) limits the query. It's useful when the purpose is to find whether a relationship exists */
    limit: 1,
    /* --> (optional) skips the specified number of records. Useful in combination with 'limit' for pagination */
    skip: 10,
    /* --> (optional) minimum hops for a variable length relationship */
    minHops: 1,
    /* --> (optional) maximum hops for a variable length relationship. The value Infinity can be used for no limit on the max hops */
    maxHops: 1,
    /* --> (optional) throws NeogmaNotFoundError if no relationships are found */
    throwIfNoneFound: false,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(relationships[0]?.source.id); // '1'
console.log(relationships[0]?.target.id); // '2'
console.log(relationships[0]?.relationship.rating); // 4
```

## Finding nodes and relationships via the Instance method
The `findRelationships` method can find related nodes via an Alias. It's a wrapper for the corresponding static, while using the Instance as the source node.

```js
/* --> let "user" be a Users instance with a primary field: id = '1' */
const relationships = await user.findRelationships({
    /* --> the alias of the relationship, as provided in the Model definition */
    alias: 'Orders',
    /* --> (optional) where parameters for the query */
    where: {
        /* --> (optional) where parameters of the target node (i.e. Order) */
        target: {
            id: '2'
        },
        /* --> (optional) where parameters of the relationship between the nodes */
        relationship: {
            rating: 4
        },
    },
    /* --> (optional) the order of the results. Use 'on' to apply sorting to the 'source', 'target', or 'relationship' */
    order: [
        {
            on: 'relationship',
            property: 'rating',
            direction: 'DESC',
        },
        {
            on: 'target',
            property: 'date',
            direction: 'ASC',
        }
    ],
    /* --> (optional) limits the query. It's useful when the purpose is to find whether a relationship exists */
    limit: 1,
    /* --> (optional) skips the specified number of records. Useful in combination with 'limit' for pagination */
    skip: 10,
    /* --> (optional) minimum hops for a variable length relationship */
    minHops: 1,
    /* --> (optional) maximum hops for a variable length relationship. The value Infinity can be used for no limit on the max hops */
    maxHops: 1,
    /* --> (optional) throws NeogmaNotFoundError if no relationships are found */
    throwIfNoneFound: false,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(relationships[0]?.source.id); // '1'
console.log(relationships[0]?.target.id); // '2'
console.log(relationships[0]?.relationship.rating); // 4
```

## Eager Loading Relationships

Neogma supports eager loading of relationships to fetch nodes with their related nodes in a single query. This avoids the N+1 query problem where you would otherwise need to make additional queries for each relationship.

### Basic Usage

Use the `relationships` parameter in `findMany` or `findOne` to specify which relationships to load:

```js
const users = await Users.findMany({
    where: { status: 'active' },
    relationships: {
        /* --> Load Orders using the 'Orders' alias defined in the model */
        Orders: {}
    }
});

/* --> Each user now has Orders populated */
console.log(users[0].Orders);
// [
//   { node: OrderInstance, relationship: { rating: 5, ... } },
//   { node: OrderInstance, relationship: { rating: 4, ... } }
// ]
```

### Filtering Related Nodes

You can filter the related nodes and relationships using the `where` parameter:

```js
const users = await Users.findMany({
    where: { id: '1' },
    relationships: {
        Orders: {
            where: {
                /* --> Filter by target node properties */
                target: {
                    status: 'completed'
                },
                /* --> Filter by relationship properties */
                relationship: {
                    rating: { [Op.gte]: 4 }
                }
            }
        }
    }
});
```

### Ordering and Pagination

Each relationship level supports `order`, `limit`, and `skip`:

```js
const users = await Users.findMany({
    where: { id: '1' },
    order: [['name', 'ASC']],  /* --> Order root nodes */
    limit: 10,                  /* --> Limit root nodes */
    relationships: {
        Orders: {
            /* --> Order related nodes */
            order: [
                { on: 'target', property: 'createdAt', direction: 'DESC' },
                { on: 'relationship', property: 'rating', direction: 'DESC' }
            ],
            /* --> Limit related nodes per parent */
            limit: 5,
            skip: 0
        }
    }
});
```

### Nested Relationships

You can load relationships of related nodes to arbitrary depth:

```js
const users = await Users.findMany({
    where: { id: '1' },
    relationships: {
        Orders: {
            limit: 10,
            relationships: {
                /* --> Load Items for each Order */
                Items: {
                    limit: 20,
                    relationships: {
                        /* --> Load Supplier for each Item */
                        Supplier: {}
                    }
                }
            }
        }
    }
});

/* --> Access nested data */
const firstOrder = users[0].Orders[0];
console.log(firstOrder.node.id);  // Order id

const firstItem = firstOrder.node.Items[0];
console.log(firstItem.node.name);  // Item name

const supplier = firstItem.node.Supplier[0];
console.log(supplier.node.companyName);  // Supplier company name
```

### Multiple Relationships

Load multiple relationships in a single query:

```js
const users = await Users.findMany({
    where: { status: 'active' },
    relationships: {
        /* --> Load Orders */
        Orders: {
            where: { target: { status: 'pending' } },
            limit: 5
        },
        /* --> Also load Friends (another relationship alias) */
        Friends: {
            limit: 10
        }
    }
});

console.log(users[0].Orders);   // Array of order relationships
console.log(users[0].Friends);  // Array of friend relationships
```

### Result Structure

Each loaded relationship returns an array of objects containing:
- `node`: The related node instance
- `relationship`: The relationship properties

```js
const users = await Users.findMany({
    relationships: { Orders: {} }
});

for (const orderRel of users[0].Orders) {
    console.log(orderRel.node);         // Order instance
    console.log(orderRel.node.id);      // Access node properties
    console.log(orderRel.relationship); // Relationship properties
    console.log(orderRel.relationship.rating); // e.g., 5
}
```

### Type Safety

When using TypeScript, the `relationships` parameter is fully typed based on your model's relationship definitions:

```typescript
/* --> TypeScript will autocomplete valid aliases */
const users = await Users.findMany({
    relationships: {
        Orders: {}, // valid - 'Orders' is a defined alias
        // InvalidAlias: {} // TypeScript error - 'InvalidAlias' doesn't exist
    }
});

/* --> Nested relationships are also typed based on the target model */
const users = await Users.findMany({
    relationships: {
        Orders: {
            relationships: {
                Items: {}, // valid - 'Items' is defined on Orders model
            }
        }
    }
});
```

### Performance Considerations

Eager loading uses CALL subqueries with COLLECT to efficiently fetch all data in a single database round-trip:

```cypher
MATCH (root:User)
WHERE root.status = $status
CALL {
    WITH root
    OPTIONAL MATCH (root)-[rel:CREATES]->(target:Order)
    WHERE target.status = $orderStatus
    ORDER BY target.createdAt DESC
    LIMIT 5
    RETURN COLLECT({ node: target, relationship: rel }) AS Orders
}
RETURN root, Orders
```

This approach:
- Executes a single query regardless of the number of relationships
- Applies ORDER BY and LIMIT at each level before collecting
- Handles cases where related nodes don't exist (returns empty arrays)
- Shares bind parameters across the entire query for safety

> :ToCPrevNext