# Order By

## Order by, by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .orderBy('a ASC, b'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // ORDER BY a ASC, b
console.log(queryBuilder.getBindParam().get()); // {}
```

## Order by, by using an array of literal strings
The literal strings will be joined with a comma.

```js
const queryBuilder = new QueryBuilder()
    .orderBy(['a ASC', 'b']); /* --> literal strings to use */

console.log(queryBuilder.getStatement()); // ORDER BY a ASC, b
console.log(queryBuilder.getBindParam().get()); // {}
```

## Order by, by using an object
An object with an identifier, and an optional property and direction can be used.

```js
const queryBuilder = new QueryBuilder().orderBy({
    /* --> identifier/name to use for ordering */
    identifier: 'a',
    /* --> (optional) the property of the identifier to order by */
    property: 'name',
    /* --> (optional) the direction to orde by */
    direction: 'DESC', // --> 'ASC' or 'DESC'
});

console.log(queryBuilder.getStatement()); // ORDER BY a.name DESC
console.log(queryBuilder.getBindParam().get()); // {}
```

## Order by, by using an array of anything
An array can be used with any combination of: a string literal, an array with identifier/direction, and an object.

```js
const queryBuilder = new QueryBuilder().orderBy([
    /* --> literal string */
    'a',
    /* --> identifier/direction tuple */
    ['b', 'DESC'], // -> 'ASC' or 'DESC',
    {
        /* --> an object, as defined above */
        identifier: 'c',
        property: 'age',
    }
]);

console.log(queryBuilder.getStatement()); // ORDER BY a, b DESC, c.age
console.log(queryBuilder.getBindParam().get()); // {}
```
