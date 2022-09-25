# Where
`QueryBuilderParameters['MergeI']`

## Where using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .where('a.id = 5'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // WHERE a.id = 5
console.log(queryBuilder.getBindParam().get()); // {}
```

## Where using a parameters object

An object of the type `WhereParamsByIdentifierI` can be used.

```js
const queryBuilder = new QueryBuilder().where({
    identifier1: {
        id: '20'
    },
    identifier2: {
        id: '21',
        age: 28
    }
});

console.log(queryBuilder.getStatement()); // WHERE identifier1.id = $id AND identifier2.id = $id__aaaa AND identifier2.age = $age
console.log(queryBuilder.getBindParam().get()); // { id: '20', id__aaaa: '21', age: 28 }
```

## Where using an instance of the Where class
A [Where](../Where-Parameters.md) instance can be used. In this case, the return value of its `.getStatement('text')` method will be used.

```js
const existingWhereInstance = new Where({
    identifier1: {
        id: '20'
    },
    identifier2: {
        id: '21',
        age: 28
    }
});
const queryBuilder = new QueryBuilder(
    /* --> for expected behavior, the Where instance and the QueryBuilder instance should use the same BindParam */
    existingWhereInstance.getBindParam()
).where(existingWhereInstance);

console.log(queryBuilder.getStatement()); // WHERE identifier1.id = $id AND identifier2.id = $id__aaaa AND identifier2.age = $age
console.log(queryBuilder.getBindParam().get()); // { id: '20', id__aaaa: '21', age: 28 }
```

## Using a literal string

A [Literal String](../Where-Parameters.md#using-a-literal-string) can be used at Where conditions, when the typing supports it.
