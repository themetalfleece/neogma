# Helpers

The `QueryBuilder` class also provides some helpers for generating strings which could be used in a statement.

## Getting normalized labels
`QueryRunner.getNormalizedLabels` returns a single string to be used in a query.
```js
const { getNormalizedLabels } = QueryRunner;

console.log(getNormalizedLabels('Users')); // `Users`

console.log(getNormalizedLabels('Important Users')); // "`Important Users`"

console.log(getNormalizedLabels(['Users', 'Active'])); // "`Users:Active`"

console.log(getNormalizedLabels(['Users', 'Active'], 'or')); // "`Users|Active`"

console.log(getNormalizedLabels(['Users', 'Active', 'Old'])); // "`Users:Active:Old`"
```

## Getting a node statement
`QueryRunner.getNodeStatement` returns a string for a node's identifier, label, and inner info (like a where), to be used in a query.

Every parameter is optional.
```js
const { getNodeStatement } = QueryRunner;

console.log(getNodeStatement({
    identifier: 'n',
    label: 'MyLabel'
})); // (n:MyLabel)

console.log(getNodeStatement({
    identifier: 'n',
})); // (n)

console.log(getNodeStatement({
    label: 'MyLabel',
})); // (:MyLabel)

console.log(getNodeStatement({})); // ()

// --> an inner statement can be given
console.log(getNodeStatement({
    identifier: 'n',
    label: 'MyLabel'
    inner: '{ id: 1 }' // --> using a literal string as inner
})); // (n:MyLabel { id: 1 })

/* --> using a Where instance as inner */
const where = new Where({ id: 1 });
console.log(getNodeStatement({
    identifier: 'n',
    label: 'MyLabel'
    inner: where 
})); // (n:MyLabel { id: $id })
console.log(where.getBindParam().get()); // { id: 1 }

/* --> using a BindParam and a properties object instance as inner */
const bindParam = new BindParam();
console.log(getNodeStatement({
    identifier: 'n',
    label: 'MyLabel'
    inner: {
        properties: {
            id: 1,
        },
        bindParam: bindParam
    }
})); // (n:MyLabel { id: $id })
console.log(bindParam().get()); // { id: 1 }
```

## Getting a relationship statement
`QueryRunner.getRelationshipStatement` returns a string for a relationship's direction, name, and inner info (like a where), to be used in a query.
```js
const { getRelationshipStatement } = QueryRunner;

console.log(getRelationshipStatement({
    direction: 'out',
    name: 'HAS',
    identifier: 'r'
})); // -[r:HAS]->

console.log(getRelationshipStatement({
    direction: 'in',
    name: 'HAS',
    identifier: 'r'
})); // <-[r:HAS]-

console.log(getRelationshipStatement({
    direction: 'none',
    name: 'HAS',
    identifier: 'r'
})); // -[r:HAS]-

console.log(getRelationshipStatement({
    direction: 'out',
    name: 'HAS',
    // --> in any of the above cases, the identifier can be skipped
})); // -[:HAS]->

// --> an inner statement can be given
console.log(getRelationshipStatement({
    direction: 'out',
    name: 'HAS',
    identifier: 'r',
    inner: '{ id: 1 }' // --> using a literal string as inner
})); // -[r:HAS { id: 1}]->

/* --> using a Where instance as inner */
const where = new Where({ id: 1 });
console.log(getRelationshipStatement({
    direction: 'out',
    name: 'HAS',
    identifier: 'r',
    inner: where 
})); // -[r:HAS { id: $id }]->
console.log(where.getBindParam().get()); // { id: 1 }

/* --> using a BindParam and a properties object instance as inner */
const bindParam = new BindParam();
console.log(getRelationshipStatement({
    direction: 'out',
    name: 'HAS',
    identifier: 'r',
    inner: {
        properties: {
            id: 1,
        },
        bindParam: bindParam
    }
})); // -[r:HAS { id: $id }]->
console.log(bindParam.get()); // { id: 1 }
```

## Getting an identifier with a label
`QueryRunner.getIdentifierWithLabel` returns a string to be used in a query, regardless if any of the identifier or label are null
```js
const { getIdentifierWithLabel } = QueryRunner;

console.log(getIdentifierWithLabel('MyIdentifier', 'MyLabel')); // "MyIdentifier:MyLabel"

console.log(getIdentifierWithLabel('MyIdentifier', 'MyLabel')); // "MyIdentifier"

console.log(getIdentifierWithLabel('MyIdentifier', 'MyLabel')); // ":MyLabel"
```

## Getting parts for a SET operation
`QueryRunner.getSetParts` returns the parts and the statement for a SET operation.
```js
const { getSetParts } = QueryRunner;

const existingBindParam = new BindParam({});
const result = getSetParts({
    /* --> the data to set */
    data: {
        x: 5,
        y: 'foo'
    },
    /* --> BindParam instance to be used */
    bindParam: existingBindParam, // @see [Bind Paramters](../Bind-Parameters)
    /* --> the identifier to use */
    identifier: 'node'
});
console.log(result.parts); // ["node.x = $x", "node.y = $y"]
console.log(result.statement); // "SET node.x = $x, node.y = $y"
console.log(bindParam.get()); // { x: 5, y: 'foo' }

const existingBindParam = new BindParam({
    x: 'irrelevant'
});
const result = getSetParts({
    data: {
        x: 5,
        y: 'foo'
    },
    bindParam: existingBindParam,
    identifier: 'node'
});
console.log(result.parts); // ["node.x = $x__aaaa", "node.y = $y"]
console.log(result.statement); // "SET node.x = $x__aaaa, node.y = $y"
console.log(bindParam.get()); // { x: 'irrelevant', x_aaaa: 5, y: 'foo' }
```

## Getting properties with query param values
`QueryRunner` exposes a `getPropertiesWithParams` function which returns an object in a string format to be used in queries, while replacing its values with bind params.

```js
/* --> an existing BindParam instance, could have existing values */
const bindParam = new BindParam({
    x: 4,
});
const result = QueryRunner.getPropertiesWithParams(
    /* --> the object to use */
    {
        x: 5,
        y: 'foo'
    },
    /* --> an existing bindParam must be passed */
    bindParam
);

/* --> the result gives us the needed object, while replacing its values with the appropriate bind param */
console.log(result); // "{ x: $x__aaaa, y: $y }"
console.log(bindParam.get()); // { x: 4, x__aaaa: 5, y: 'foo' }
```
