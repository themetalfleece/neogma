# With
`QueryBuilderParameters['WithI']`

## With by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .with('a, b'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // WITH a, b
console.log(queryBuilder.getBindParam().get()); // {}
```

## With by using an array of strings
An array of strings can be used, which will be joined with a comma.

```js
const queryBuilder = new QueryBuilder()
    .with(['x', '{ y: x }']);

console.log(queryBuilder.getStatement()); // WITH x, { y: x }
console.log(queryBuilder.getBindParam().get()); // {}
```
