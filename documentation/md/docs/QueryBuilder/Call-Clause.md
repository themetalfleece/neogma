# Call (Subquery)
`QueryBuilderParameters['CallI']`

The `call` method allows you to create CALL subqueries in your Cypher query. CALL subqueries are useful for operations that need isolated scope, post-UNION processing, aggregations within OPTIONAL MATCH, and eager loading patterns.

## Call with a literal string
A literal string will be wrapped in a CALL block.

```js
const queryBuilder = new QueryBuilder()
    .match({ identifier: 'n', label: 'Node' })
    .call(`
        WITH n
        MATCH (n)-[:RELATES_TO]->(m:Related)
        RETURN collect(m) AS related
    `)
    .return(['n', 'related']);

console.log(queryBuilder.getStatement());
// MATCH (n:`Node`) CALL {
//         WITH n
//         MATCH (n)-[:RELATES_TO]->(m:Related)
//         RETURN collect(m) AS related
//     } RETURN n, related
```

## Call with a QueryBuilder instance
You can pass another `QueryBuilder` instance to the `call` method. The subquery's statement will be extracted and wrapped in a CALL block. Both QueryBuilder instances share the same `BindParam` for consistent parameter binding.

```js
const bindParam = new BindParam();

// Build the subquery
const subquery = new QueryBuilder(bindParam)
    .with('parent')
    .match({
        related: [
            { identifier: 'parent' },
            { direction: 'out', name: 'HAS_CHILD' },
            { identifier: 'child', label: 'Child' }
        ]
    })
    .return('collect(child) AS children');

// Build the main query
const queryBuilder = new QueryBuilder(bindParam)
    .match({ identifier: 'parent', label: 'Parent' })
    .call(subquery)
    .return(['parent', 'children']);

console.log(queryBuilder.getStatement());
// MATCH (parent:`Parent`) CALL {
// WITH parent
// MATCH (parent)-[:HAS_CHILD]->(child:`Child`)
// RETURN collect(child) AS children
// } RETURN parent, children
```

## Nested Call subqueries
You can nest CALL subqueries by calling `call` within the subquery builder.

```js
const bindParam = new BindParam();

// Inner subquery
const innerSubquery = new QueryBuilder(bindParam)
    .with('child')
    .match({
        related: [
            { identifier: 'child' },
            { direction: 'out', name: 'HAS_ITEM' },
            { identifier: 'item', label: 'Item' }
        ]
    })
    .return('collect(item) AS items');

// Outer subquery
const outerSubquery = new QueryBuilder(bindParam)
    .with('parent')
    .match({
        related: [
            { identifier: 'parent' },
            { direction: 'out', name: 'HAS_CHILD' },
            { identifier: 'child', label: 'Child' }
        ]
    })
    .call(innerSubquery)
    .return('collect({ node: child, items: items }) AS children');

// Main query
const queryBuilder = new QueryBuilder(bindParam)
    .match({ identifier: 'parent', label: 'Parent' })
    .call(outerSubquery)
    .return(['parent', 'children']);

console.log(queryBuilder.getStatement());
// MATCH (parent:`Parent`) CALL {
// WITH parent
// MATCH (parent)-[:HAS_CHILD]->(child:`Child`)
// CALL {
// WITH child
// MATCH (child)-[:HAS_ITEM]->(item:`Item`)
// RETURN collect(item) AS items
// } RETURN collect({ node: child, items: items }) AS children
// } RETURN parent, children
```

## Use Cases

### Eager Loading Relationships
CALL subqueries are ideal for loading related nodes with their relationships in a single query, avoiding N+1 query problems.

```js
const bindParam = new BindParam();

const ordersSubquery = new QueryBuilder(bindParam)
    .with('user')
    .match({
        related: [
            { identifier: 'user' },
            { direction: 'out', name: 'PLACED', identifier: 'rel' },
            { identifier: 'order', label: 'Order' }
        ],
        optional: true
    })
    .orderBy({ identifier: 'order', property: 'createdAt', direction: 'DESC' })
    .limit(10)
    .return('collect({ node: order, relationship: rel }) AS Orders');

const queryBuilder = new QueryBuilder(bindParam)
    .match({ identifier: 'user', label: 'User' })
    .where({ user: { status: 'active' } })
    .call(ordersSubquery)
    .return(['user', 'Orders']);
```

### Post-UNION Processing
CALL subqueries can wrap UNION operations to apply operations on the combined results.

```js
const queryBuilder = new QueryBuilder()
    .call(`
        MATCH (n:TypeA) RETURN n.name AS name
        UNION
        MATCH (n:TypeB) RETURN n.name AS name
    `)
    .return('name')
    .orderBy('name');
```

> :ToCPrevNext
