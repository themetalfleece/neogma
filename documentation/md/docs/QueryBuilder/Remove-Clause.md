# Remove
`QueryBuilderParameters['RemoveI']`

## Remove by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .remove('a.name'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // REMOVE a.name
console.log(queryBuilder.getBindParam().get()); // {}
```

## Remove properties by using an object
The properties of an identifier can be removed by using an object.

```js
const queryBuilder = new QueryBuilder().remove({
    /* --> the identifier whose properties will be removed */
    identifier: 'a',
    /* --> the properties of the identifier to remove */
    properties: ['name', 'age']
});

console.log(queryBuilder.getStatement()); // REMOVE a.name, a.age
console.log(queryBuilder.getBindParam().get()); // {}
```

## Remove labels by using an object
The labels of an identifier can be removed by using an object.

```js
const queryBuilder = new QueryBuilder().remove({
    /* --> the identifier whose labels will be removed */
    identifier: 'a',
    /* --> the labels of the identifier to remove */
    labels: ['Label1', 'Label2']
});

console.log(queryBuilder.getStatement()); // REMOVE a:Label1:Label2
console.log(queryBuilder.getBindParam().get()); // {}
```
