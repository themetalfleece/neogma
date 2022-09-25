# Running Arbitrary Queries

A `QueryRunner` instance can be used to run arbitrary/raw queries.

```js
/* --> let 'queryRunner' be a QueryRunner instance */
const result = await queryRunner.run(
    /* --> arbitrary Cypher */
    `MATCH (u:Users) WHERE u.id = $id RETURN u`,
    /* --> (optional) bind parameter for the statement */
    {
        id: '1'
    },
    /* --> (optional) an existing session or transaction to use */
    null,
);

/* --> the result is the QueryResult from the neo4j driver */
console.log(result.records.map((v) => v.get('u').properties));
```

> :ToCPrevNext