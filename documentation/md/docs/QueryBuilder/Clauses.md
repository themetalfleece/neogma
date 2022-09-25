# Clauses

The `QueryBuilder` class supports all Neo4j clauses. They are used when adding parameters to the `QueryBuilder` instance (i.e. by calling the parameter methods), in order to generate the intended statement.

Each of them is an attribute of the `QueryBuilderParameters` type. A union of them is the `QueryBuilderParameters['ParameterI']` type.

The final statement will consist of all the given clauses, in the order they are given.

example:
```js
const queryBuilder = new QueryBuilder()
    .match({
        identifier: 'n',
        label: 'MyLabel',
        where: {
            status: 'active'
        }
    })
    .orderBy({
        identifier: 'n',
        property: 'age',
        direction: 'DESC'
    })
    .return('a');

console.log(queryBuilder.getStatement()); // MATCH (n:A { status: $status }) ORDER BY n.age DESC RETURN n
console.log(queryBuilder.getBindParam().get()); // { status: 'active' }
```

### Raw Clause
In case the intended statement cannot be added by using the supported clauses, a raw string can be included in the parameters.

```js
const queryBuilder = new QueryBuilder().raw('MATCH (a:A) RETURN a');

console.log(queryBuilder.getStatement()); // MATCH (a:A) RETURN a
console.log(queryBuilder.getBindParam().get()); // { }
```

> :ToCPrevNext