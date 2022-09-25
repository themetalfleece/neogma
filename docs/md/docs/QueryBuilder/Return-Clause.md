# Return

## Return by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .return('a, b.p1'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // RETURN a, b.p1
console.log(queryBuilder.getBindParam().get()); // {}
```

## Return by using an array of literal strings
The literal strings will be joined with a comma.

```js
const queryBuilder = new QueryBuilder()
    .return(['a', 'b.p1']); /* --> literal strings to use */

console.log(queryBuilder.getStatement()); // RETURN a, b.p1
console.log(queryBuilder.getBindParam().get()); // {}
```

## Order by, by using an object array
An array of objects with an identifier/name, and an optional property.

```js
const queryBuilder = new QueryBuilder().return([
    {
        /* --> identifier/name to return */
        identifier: 'a',
        /* --> (optional) the property of the identifier to return */
        property: 'name',
    }
    {
        identifier: 'b'
    }
]);

console.log(queryBuilder.getStatement()); // RETURN a.name, b
console.log(queryBuilder.getBindParam().get()); // {}
```
