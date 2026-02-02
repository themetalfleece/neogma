# On Create Set / On Match Set
`QueryBuilderParameters['OnCreateSetI']` / `QueryBuilderParameters['OnMatchSetI']`

The `ON CREATE SET` and `ON MATCH SET` clauses are used with `MERGE` to specify different actions depending on whether the pattern was created or matched.

## On Create Set

Sets properties when a new node is created by a `MERGE` statement.

### On Create Set by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'Person',
        properties: { name: 'John' }
    })
    .onCreateSet('n.created = timestamp()') /* --> literal string to use */
    .return('n.name, n.created');

console.log(queryBuilder.getStatement());
// MERGE (n:Person { name: $name }) ON CREATE SET n.created = timestamp() RETURN n.name, n.created

console.log(queryBuilder.getBindParam().get());
// { name: 'John' }
```

### On Create Set by using an object
An ON CREATE SET statement can be generated using an object with an identifier and properties.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'User',
        properties: { email: 'test@example.com' }
    })
    .onCreateSet({
        /* --> identifier whose properties will be set */
        identifier: 'n',
        /* --> properties to set when created */
        properties: {
            createdAt: '2024-01-01',
            status: 'pending',
        },
    })
    .return('n');

console.log(queryBuilder.getStatement());
// MERGE (n:User { email: $email }) ON CREATE SET n.createdAt = $createdAt, n.status = $status RETURN n

console.log(queryBuilder.getBindParam().get());
// { email: 'test@example.com', createdAt: '2024-01-01', status: 'pending' }
```

### On Create Set with Literal for Cypher functions
You can use the `Literal` class to include Cypher functions that should not be parameterized.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'Person',
        properties: { name: 'John' }
    })
    .onCreateSet({
        identifier: 'n',
        properties: {
            created: new Literal('timestamp()'),
            version: 1,
        },
    })
    .return('n');

console.log(queryBuilder.getStatement());
// MERGE (n:Person { name: $name }) ON CREATE SET n.created = timestamp(), n.version = $version RETURN n

console.log(queryBuilder.getBindParam().get());
// { name: 'John', version: 1 }
```

## On Match Set

Sets properties when an existing node is matched by a `MERGE` statement.

### On Match Set by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'Counter',
        properties: { name: 'pageViews' }
    })
    .onMatchSet('n.count = n.count + 1') /* --> literal string to use */
    .return('n');

console.log(queryBuilder.getStatement());
// MERGE (n:Counter { name: $name }) ON MATCH SET n.count = n.count + 1 RETURN n

console.log(queryBuilder.getBindParam().get());
// { name: 'pageViews' }
```

### On Match Set by using an object
An ON MATCH SET statement can be generated using an object with an identifier and properties.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'User',
        properties: { email: 'test@example.com' }
    })
    .onMatchSet({
        /* --> identifier whose properties will be set */
        identifier: 'n',
        /* --> properties to set when matched */
        properties: {
            lastLogin: '2024-01-01',
            loginCount: 5,
        },
    })
    .return('n');

console.log(queryBuilder.getStatement());
// MERGE (n:User { email: $email }) ON MATCH SET n.lastLogin = $lastLogin, n.loginCount = $loginCount RETURN n

console.log(queryBuilder.getBindParam().get());
// { email: 'test@example.com', lastLogin: '2024-01-01', loginCount: 5 }
```

### On Match Set with Literal for increment expressions
You can use the `Literal` class to include expressions like incrementing a counter.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'Counter',
        properties: { name: 'pageViews' }
    })
    .onMatchSet({
        identifier: 'n',
        properties: {
            count: new Literal('n.count + 1'),
            lastUpdated: new Literal('timestamp()'),
        },
    })
    .return('n');

console.log(queryBuilder.getStatement());
// MERGE (n:Counter { name: $name }) ON MATCH SET n.count = n.count + 1, n.lastUpdated = timestamp() RETURN n

console.log(queryBuilder.getBindParam().get());
// { name: 'pageViews' }
```

## Using On Create Set and On Match Set together

You can combine both clauses to handle creation and matching differently.

```js
const queryBuilder = new QueryBuilder()
    .merge({
        identifier: 'n',
        label: 'Counter',
        properties: { name: 'pageViews' }
    })
    .onCreateSet({
        identifier: 'n',
        properties: {
            count: 1,
            created: new Literal('timestamp()'),
        },
    })
    .onMatchSet({
        identifier: 'n',
        properties: {
            count: new Literal('n.count + 1'),
            lastUpdated: new Literal('timestamp()'),
        },
    })
    .return('n');

console.log(queryBuilder.getStatement());
// MERGE (n:Counter { name: $name }) ON CREATE SET n.count = $count, n.created = timestamp() ON MATCH SET n.count = n.count + 1, n.lastUpdated = timestamp() RETURN n

console.log(queryBuilder.getBindParam().get());
// { name: 'pageViews', count: 1 }
```

This pattern is commonly used for:
- **Counters**: Initialize to 1 on create, increment on match
- **Timestamps**: Set `created` on create, set `lastUpdated` on match
- **Status tracking**: Set initial status on create, update status on match

> :ToCPrevNext
