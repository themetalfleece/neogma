# Limit

## Limit by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .limit('toInteger(3 * rand()) + 1'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // LIMIT toInteger(3 * rand()) + 1
console.log(queryBuilder.getBindParam().get()); // {}
```

## Limit by using a number
That way, a Bind Parameter is used

```js
const queryBuilder = new QueryBuilder().limit(5);

console.log(queryBuilder.getStatement()); // LIMIT $limit
console.log(queryBuilder.getBindParam().get()); // { limit: 5 }
```

# Skip

## Skip by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .skip('toInteger(3 * rand()) + 1'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // SKIP toInteger(3 * rand()) + 1
console.log(queryBuilder.getBindParam().get()); // {}
```

## Skip by using a number
That way, a Bind Parameter is used

```js
const queryBuilder = new QueryBuilder().skip(5);

console.log(queryBuilder.getStatement()); // SKIP $skip
console.log(queryBuilder.getBindParam().get()); // { skip: 5 }
```
