# Updating Nodes and Relationships

Apart from saving an existing [Instance](./Instances), each model provides functions to directly update nodes or relationships.

## Updating Nodes

Nodes can be updated directly by providing the properties to be set, providing property [update operators](../QueryRunner/Updating-Nodes#update-operators), and a [where parameter](../Where-Parameters) to match the nodes.

```js
await Users.update(
  {
    /* --> updates the nodes to set their name to 'Bob' */
    name: 'Bob',
    /* --> using the "remove" Symbol from "UpdateOp" */
    age: { [UpdateOp.remove]: true },
  },
  {
    /* --> (optional) a where parameter to match nodes */
    where: {
      /* --> nodes with the id '1' will be matched */
      id: '1',
    },
    /* --> (optional) when true, the first element of the returned tuple contains the updated instances */
    return: false,
    /* --> (optional) an existing session or transaction to use */
    session: null,
  },
);
```

### Return value
The method always returns a tuple `[instances, queryResult]`:
- `instances`: Array of updated Instances (populated when `return: true`, empty when `return: false`)
- `queryResult`: The QueryResult from the neo4j driver

```js
const [instances, queryResult] = await Users.update(
  { name: 'Bob' },
  {
    where: { id: '1' },
    return: true,
  },
);

/* --> instances is populated when return: true */
console.log(instances[0].name); // "Bob"
console.log(queryResult.summary.counters.updates().propertiesSet); // number of properties updated
```

## Updating relationship properties via the Model static

Relationship properties can be updated directly by providing the values to be set, the relationship alias, and an optional where parameter to match the source nodes, target nodes and relationships.

```js
await Users.updateRelationship(
  {
    /* --> sets the 'rating' property of the relationship to the following */
    rating: 5,
  },
  {
    /* --> used the 'Orders' alias for the relationship configuration, as provided in the Model definition */
    alias: 'Orders',
    /* --> (optional) where parameters for matching the nodes or the relationship */
    where: {
      /* --> the source node(s) (User) is matched to have the following name */
      source: {
        name: 'Bob',
      },
      /* --> the target node(s) (Order) is matched to have the following id */
      target: {
        id: '2',
      },
      /* --> the relationship(s) between the source and the target node(s) are matched to have the following 'rating' */
      relationship: {
        rating: 4,
      },
    },
    /* --> (optional) when true, the first element of the returned tuple contains the updated relationships */
    return: false,
    /* --> (optional) throws NeogmaNotFoundError if no relationships were updated */
    throwIfNoneUpdated: false,
    /* --> (optional) an existing session or transaction to use */
    session: null,
  },
);
```

### Return value
The method always returns a tuple `[relationships, queryResult]`:
- `relationships`: Array of `{ source, target, relationship }` objects (populated when `return: true`, empty when `return: false`)
- `queryResult`: The QueryResult from the neo4j driver

```js
const [relationships, queryResult] = await Users.updateRelationship(
  { rating: 5 },
  {
    alias: 'Orders',
    where: { source: { name: 'Bob' } },
    return: true,
  },
);

/* --> relationships is populated when return: true */
console.log(relationships[0].relationship.rating); // 5
console.log(queryResult.summary.counters.updates().propertiesSet); // number of properties updated
```

## Updating relationship properties via the Instance method

Similar to the Model static, relationship properties can be updated directly by providing the values to be set, the relationship alias, and an optional where parameter to match the target nodes and relationships. The source node will always be the one that corresponds to the instance, and its primary key field must be set.

```js
/* --> let 'user' be a Users Instance. It's used as the source node */
await user.updateRelationship(
  {
    /* --> sets the 'rating' property of the relationship to the following */
    rating: 5,
  },
  {
    /* --> used the 'Orders' alias for the relationship configuration, as provided in the Model definition */
    alias: 'Orders',
    /* --> (optional) where parameters for matching the nodes or the relationship */
    where: {
      /* --> the target node(s) (Order) is matched to have the following id */
      target: {
        id: '2',
      },
      /* --> the relationship(s) between the source and the target node(s) are matched to have the following 'rating' */
      relationship: {
        rating: 4,
      },
    },
    /* --> (optional) when true, the first element of the returned tuple contains the updated relationships */
    return: false,
    /* --> (optional) throws NeogmaNotFoundError if no relationships were updated */
    throwIfNoneUpdated: false,
    /* --> (optional) an existing session or transaction to use */
    session: null,
  },
);
```

The instance method also returns a tuple `[relationships, queryResult]`:

```js
const [relationships, queryResult] = await user.updateRelationship(
  { rating: 5 },
  {
    alias: 'Orders',
    where: { target: { id: '2' } },
    return: true,
  },
);

console.log(relationships[0].relationship.rating); // 5
console.log(queryResult.summary); // query summary
```

> :ToCPrevNext
