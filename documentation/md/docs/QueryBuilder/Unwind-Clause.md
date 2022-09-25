# Unwind
`QueryBuilderParameters['UnwindI']`

## Unwind by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .unwind('[1, 2, 3] as arr'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // UNWIND [1, 2, 3] as arr
console.log(queryBuilder.getBindParam().get()); // {}
```

## Unwind by using an object
Unwind using an object with the value to unwind, and what to unwind as
```js
const queryBuilder = new QueryBuilder().unwind({
    /* --> unwind this value */
    value: 'x',
    /* --> as this */
    as: 'y'
});

console.log(queryBuilder.getStatement()); // UNWIND x as y
console.log(queryBuilder.getBindParam().get()); // {}
```
