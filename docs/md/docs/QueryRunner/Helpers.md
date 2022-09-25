# Helpers

The `QueryRunner` class also provides some helpers for custom Cypher queries.

## Getting the properties from a QueryResult
The properties of nodes can be easily fetched
```js
const queryResult = await queryRunner.run(
    `MATCH (n:User {id: $id}) RETURN n`,
    { id: 1 },
);

/* --> get the properties of the node with the alias 'n' */
const properties = QueryRunner.getResultProperties(queryResult, 'n');
console.log(properties[0].id); // 1
```

## Getting how many nodes where deleted, from a QueryResult
```js
const res = await queryRunner.delete({
    where: {
        name: 'John'
    },
});

const nodesDeleted = QueryRunner.getNodesDeleted(res);
console.log(nodesDeleted); // 5
```

## Default QueryRunner identifiers
`QueryRunner` exposes the default identifiers which are used in the queries.

```js
/* --> general purpose default identifier */
console.log(QueryRunner.identifiers.default);
/* --> default identifiers for createRelationship */
console.log(QueryRunner.createRelationship);
/* default identifier for the source node */
console.log(QueryRunner.createRelationship.source);
/* default identifier for the target node */
console.log(QueryRunner.createRelationship.target);
```

> :ToCPrevNext