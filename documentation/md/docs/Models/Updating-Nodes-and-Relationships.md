# Updating Nodes and Relationships

Apart from saving an existing [Instance](./Instances), each model provides functions to directly update nodes or relationships.

## Updating Nodes

Nodes can be updated directly by providing the properties to be set, and a [where parameter](../Where-Parameters) to match the nodes.

```js
const result = await Users.update(
    {
        /* --> updates the nodes to set their name to 'Bob' */
        name: 'Bob',
    },
    {
        /* --> (optional) a where parameter to match nodes */
        where: {
            /* --> nodes with the id '1' will be matched */
            id: '1'
        },
        /* --> (optional, default false) whether to return the values of the nodes after the update */
        return: true,
        /* --> (optional) an existing session or transaction to use */
        session: null,
    }
);

/* --> ONLY if 'return' is set to true. The Instances of the matched and updated nodes. If 'return' is set to false, this will be an empty array */
const instances = result[0];
console.log(instances[0].name); // "Bob"

/* --> the QueryResult from the neo4j driver */
const queryResult = result[1];
```

## Updating relationship properties via the Model static

Relationship properties can be updated directly by providing the values to be set, the relatioship alias, and an optional where parameter to match the source nodes, target nodes and relationships.

```js
await Users.updateRelationship(
    {
        /* --> sets the 'rating' property of the relationship to the following */
        rating: 5
    },
    {
        /* --> used the 'Orders' alias for the relationship configuration, as provided in the Model definition */
        alias: 'Orders',
        /* --> (optional) where parameters for matching the nodes or the relationship */
        where: {
            /* --> the source node(s) (User) is matched to have the following name */
            source: {
                name: 'Bob'
            },
            /* --> the target node(s) (Order) is matched to have the following id */
            target: {
                id: '2'
            },
            /* --> the relationship(s) between the source and the target node(s) are matched to have the following 'rating' */
            relationship: {
                rating: 4
            }
        },
        /* --> (optional) an existing session or transaction to use */
        session: null,
    }
);
```

## Updating relationship properties via the Instance method

Similar to the Model static, relationship properties can be updated directly by providing the values to be set, the relatioship alias, and an optional where parameter to match the target nodes and relationships. The source node will always be the one that corresponds to the instance, and its primary key field must be set.

```js
/* --> let 'user' be a Users Instance. It's used as the source node */
await user.updateRelationship(
    {
        /* --> sets the 'rating' property of the relationship to the following */
        rating: 5
    },
    {
        /* --> used the 'Orders' alias for the relationship configuration, as provided in the Model definition */
        alias: 'Orders',
        /* --> (optional) where parameters for matching the nodes or the relationship */
        where: {
            /* --> the target node(s) (Order) is matched to have the following id */
            target: {
                id: '2'
            },
            /* --> the relationship(s) between the source and the target node(s) are matched to have the following 'rating' */
            relationship: {
                rating: 4
            }
        },
        /* --> (optional) an existing session or transaction to use */
        session: null,
    }
);
```

> :ToCPrevNext