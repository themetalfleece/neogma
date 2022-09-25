# The Query Runner

The `QueryRunner` class can be used for arbitrary Cypher or Object-Graph mapping, without the need of defining Models. The parameters need to provide information about the labels etc. Bind parameters are used interally so there no need of escaping variables.

It also provides some utilities to help with running your queries.

## Creating a QueryRunner Instance
To run queries, a `QueryRunner` instance is needed.
```js
const queryRunner = new QueryRunner({
    /* --> a driver needs to be passed */
    driver: neogma.driver,
    /* --> (optional) logs every query that this QueryRunner instance runs, using the given function */
    logger: console.log
});
```

> :ToCPrevNext