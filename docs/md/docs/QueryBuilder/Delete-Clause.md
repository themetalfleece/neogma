# Delete
`QueryBuilderParameters['DeleteI']`

## Delete by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .delete('a, b'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // DELETE a, b
console.log(queryBuilder.getBindParam().get()); // {}
```

## Delete by using a literal object
This has the benefit of being able to use `detach` delete.

```js
const queryBuilder = new QueryBuilder().delete({
    /* --> literal string to use */
    literal: 'a, b',
    /* --> (optional) whether this delete will be "detach" */
    detach: true,
});

console.log(queryBuilder.getStatement()); // DETACH DELETE a, b
console.log(queryBuilder.getBindParam().get()); // {}
```

## Delete by using an array of identifiers
```js
const queryBuilder = new QueryBuilder().delete({
    /* --> the identifiers to be deleted */
    identifiers: ['a', 'b'],
    /* --> (optional) whether this delete will be "detach" */
    detach: false,
});

console.log(queryBuilder.getStatement()); // DELETE a, b
console.log(queryBuilder.getBindParam().get()); // {}
```
