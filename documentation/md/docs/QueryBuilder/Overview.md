# The Query Builder

The `QueryBuilder` class can be used to easily generate cypher using objects. It supports all Neo4j clauses, and automatically uses a Bind Parameter for the given values.

## Creating a QueryBuilder instance

After a QueryBuilder instance is created, parameters can be added to it by using the parameter methods.
More info about them can be found in [Clauses](./Clauses)
```js
const queryBuilder = new QueryBuilder()
    .match({
        identifier: 'p1'
    })
    .return('p1');

/* --> additional parameters can be added at any point */
queryBuilder.limit(1);
```

## Adding parameters by using an array of parameter objects

Additional parameters can be added using the `addParams` method of the `QueryBuilder` instance. The parameters are the same as in the constructor.

```js
// --> create the QueryBuilder instance using some initial parameters
const queryBuilder = new QueryBuilder()
    .match({
        identifier: 'p1'        
    });

// --> add more parameters (using an array)
queryBuilder.addParams([
    {
        match: '(n)'
    }
]);

// --> add more parameters (using comma-separated objects)
queryBuilder.addParams(
    {
        limit: 2
    },
    {
        return: 'p1'
    }
);
```

## Getting the statement from a QueryBuilder instance

The cypher statement of a `QueryBuilder` instance can be taken by using the `getStatement` method.

```js
const queryBuilder = new QueryBuilder().match({
    identifier: 'p1'
});

console.log(queryBuilder.getStatement()); // MATCH (p1)
```

The `BindParam` of a `QueryBuilder` instance can be taken by using the `getBindParam` method.

```js
const queryBuilder = new QueryBuilder().match({
    identifier: 'p1',
    where: {
        id: '1'
    }
});

console.log(queryBuilder.getStatement()); // MATCH (p1 { id: $id })
const bindParam = queryBuilder.getBindParam();
console.log(bindParam.get()); // { id: '1' }
```

## Using an existing BindParam instance
In case a `BindParam` instance is used on the constructor, it will be used.

```js
const existingBindParam = new BindParam({
    id: false,
});

const queryBuilder = new QueryBuilder(existingBindParam)
    .match({
        identifier: 'p1',
        where: {
            id: '1'
        }
    });

console.log(queryBuilder.getStatement()); // MATCH (p1 { id: $id__aaaa })
const bindParam = queryBuilder.getBindParam();
console.log(bindParam === existingBindParam); // true
console.log(bindParam.get()); // { id: false, id__aaaa: '1' }
```

## Running a QueryBuilder instance

If a `Neogma` instance is defined, a `QueryBuilder` instance can be ran straight away.


```js
    await new QueryBuilder()
        .raw('match n return n')
        .run();
```

An existing session can be given
```js
    await new QueryBuilder()
        .raw('match n return n')
        .run(session);
```

Defining a `Neogma` instance also sets the `QueryBuilder.queryRunner` object to the one it uses, so no `QueryRunner` object needs to be passed.

In case a different `QueryRunner` instance needs to be passed, it can either happen on an instance level:

```js
/** let 'queryRunner' be a QueryRunner instance */
const result = await new QueryBuilder()
    .match('n')
    .return('n')
    .run(queryRunner);

console.log(result.records.map(r => r.get('n')));
```

An existing session can be given
```js
    /** let 'queryRunner' be a QueryRunner instance and 'session' be a Session/Transaction */
    await new QueryBuilder()
        .raw('match n return n')
        .run(queryRunner, session);
```

Or on a global level:

```js
    QueryBuilder.queryRunner = new QueryRunner(...);
```


## Using a literal string

A [Literal String](../Where-Parameters.md#using-a-literal-string) can be used at Where conditions, when the typing supports it.

> :ToCPrevNext