# Where Parameters

An instance of the `Where` class can be used to easily create a statement and a bind parameter to be used in a query.

## Creating a Where instance and getting its values

Creating a `Where` instance with values for the identifier `n`

```js
const where = new Where({
    /* --> the node identifier is the key */
    n: {
        /* --> the per-identifier where values are used */
        x: 5,
        y: 'bar'
    }
});

/* --> a statement can be generated to be used in the query */
console.log(where.getStatement('text')); // "n.x = $x AND n.y = $y"
/* --> the "bindParam" property has a BindParam instance whose values can be used in the query */
console.log(where.bindParam.get()); // { x: 5, y: 'bar' }
```

Creating a `Where` instance with values for the identifiers `n` and `o`

```js
const where = new Where({
    n: {
        x: 5,
        y: 'bar'
    },
    o: {
        z: true,
    }
});

console.log(where.getStatement('text')); // "n.x = $x AND n.y = $y AND o.z = $z"
console.log(where.bindParam.get()); // { x: 5, y: 'bar', z: true }
```

Since Where uses a `BindParam`, non-unique keys can be used which will be automatically associated with a unique key

```js
const where = new Where({
    n: {
        x: 5,
        y: 'bar'
    },
    o: {
        /* --> since it's for a different identifier, we can use any key we want, even if it's used in another identifier */
        x: true,
    }
});

console.log(where.getStatement('text')); // "n.x = $x AND n.y = $y AND o.x = $x__aaaa"
console.log(where.bindParam.get()); // { x: 5, y: 'bar', x_aaaa: true }
```

An existing `BindParam` instance can be used, to ensure unique keys. The same instance will be used in the `Where` instance, so it will be mutated.

```js
const existingBindParam = new BindParam({
    x: 4,
});

const where = new Where(
    {
        n: {
            /* --> the same key as in the bind param can be used */
            x: 5,
            y: 'bar'
        }
    },
    existingBindParam
);

/* --> the "x" key already exists in the bind param, so a new one is used */
console.log(where.getStatement('text')); // "n.x = $x__aaaa AND n.y = $y"
console.log(where.bindParam.get()); // { x: 4, x_aaaa: 5, y: 'bar' }
console.log(where.bindParam === existingBindParam); // true
```

An existing `Where` instance can be used. In this case, the parameters of it will be merged with the one that's being created. The existing `Where` instance won't be mutated at all.

```js
const existingWhere = new Where(
    {
        n: {
            x: 4
        },
        o: {
            z: true
        }
    }
);

console.log(existingWhere.getStatement('text')); // "n.x = $x AND o.z = $z"
console.log(existingWhere.bindParam.get()); // { x: 4, z: true }

const newWhere = new Where(
    {
        n: {
            y: 'bar'
        },
        m: {
            z: 'foo'
        }
    },
    existingWhere
);

console.log(newWhere.getStatement('text')); // "n.x = $x AND n.y = $y AND o.z = $z AND m.z = $z__aaaa"
console.log(newWhere.bindParam.get()); // { x: 4, y: 'bar', z: true, z__aaaa: 'foo' }
```

## Adding parameters to an existing Where instance

Similarilly to creating a new `Where` instance, parameters can be added to an existing instance.

```js
const where = new Where({
    n: {
        x: 5,
        y: 'bar'
    }
});

where.addParams({
    n: {
        z: true
    },
    o: {
        x: 4
    }
});

console.log(where.getStatement('text')); // "n.x = $x AND n.y = $y AND n.z = $z AND o.x = $x__aaaa"
console.log(where.bindParam.get()); // { x: 5, y: 'bar', z: true, x__aaaa: 4 }
```

## Getting the statement of a Where instance

A `Where` instance can easily be used in a query using its `statement` and `bindParam` properties

### Text form

This is how the statement can be used in a "text" form
```js
const where = new Where({
    n: {
        x: 5,
        y: 'bar'
    },
    o: {
        z: true,
    }
});

const textStatement = where.getStatement('text'); // n.x = $x AND n.y = $y AND o.z = $z
const bindParamProperties = where.bindParam.get(); // { x: 5, y: 'bar', z: true }

await queryRunner.run(
    `MATCH (n), (o) WHERE ${textStatement} RETURN n, o`,
    bindParamProperties
);
```

### Object form

This is how the statement can be used in an "object" form
```js
const where = new Where({
    n: {
        x: 5,
        y: 'bar'
    },
});

const objectStatement = where.getStatement('object'); // { x: $x, y: $y }
const bindParamProperties = where.bindParam.get(); // { x: 5, y: 'bar' }

await queryRunner.run(
    `MATCH (n ${objectStatement}) RETURN n`,
    bindParamProperties
);
```
This ignores the identifier, and is only available for the "equals" operator. So, it's recommended that it's used with only 1 identifier.

## Where operators

While some of the operators can be used with plain objects, some others need to use the exported `Op` variable. It contains symbols for the operators.

### Equals
A direct object value corresponds to equality.
```js
const where = new Where({
    n: {
        x: 5
    },
});

console.log(where.getStatement('text')); // n.x = $x
console.log(where.getStatement('object')); // { x: $x }
console.log(where.bindParam.get()); // { x: 5 }
```
Alternatively, the operator "eq" can be used.
```js
const where = new Where({
    n: {
        x: {
            [Op.eq]: 5,
        }
    },
});

console.log(where.getStatement('text')); // n.x = $x
console.log(where.getStatement('object')); // { x: $x }
console.log(where.bindParam.get()); // { x: 5 }
```

### And
The values of the parameters object are separated by an "and" operator
```js
const where = new Where({
    n: {
        x: 5,
        y: 'bar'
    },
});

console.log(where.getStatement('text')); // n.x = $x AND n.y = $y
console.log(where.getStatement('object')); // { x: $x, y: $y }
console.log(where.bindParam.get()); // { x: 5, y: 'bar' }
```

### In
```js
const where = new Where({
    n: {
        x: { 
            [Op.in]: [1, 2, 3],
        },
        y: 2
    },
    o: {
        z: {
            [Op.in]: [4, 5, 6],
        }
    }
});

console.log(where.getStatement('text')); // n.x IN $x AND n.y = $y AND o.z IN $z
// "object" statement not available
console.log(where.bindParam.get()); // { x: [1, 2, 3], y: 2, z: [4, 5, 6] }
```

### Comparison
The following operators are available:

| Operator | Description            | Results in |
| -------- | ---------------------- | ---------- |
| ne       | not equals             | <>         |
| gt       | greater than           | >          |
| gte      | greater than or equals | >=         |
| lt       | less than              | <          |
| lte      | less than or equals    | <=         |

### Contains
```js
const where = new Where({
    n: {
        x: { 
            [Op.contains]: 'xyz',
        },
    },
});

console.log(where.getStatement('text')); // n.x CONTAINS $x
// "object" statement not available
console.log(where.bindParam.get()); // { x: 'xyz' }
```

## Using a literal string

The class `Literal` can be used to use any given string in a Where condition.

```js
const where = new Where({
    n: {
        x: 2,
        y: new Literal('n.x')
    },
    o: {
        z: {
            [Op.gt]: new Literal('n.y'),
        }
    }
});

console.log(where.getStatement('text')); // n.x = $x AND n.y = n.x AND o.z >= n.y
// "object" statement not available
console.log(where.bindParam.get()); // { x: 2 }
```

## Acquire a Where instance

The `acquire` static can be used to ensure that a Where instance is at hand. If one is passed, it will be returned as is. If an object with where parameters is passed, a new Where instance will be created with them. Else, a new one will be created.

```js
const whereFirst = Where.acquire(null);
console.log(whereFirst instanceof Where); // true

const whereSecond = Where.acquire(whereFirst);
console.log(whereFirst === whereSecond); // true

/* --> an object with where parameters can be used */
const whereWithPlainParams = Where.acquire({
    n: {
        x: 5
    }
});
console.log(whereWithPlainParams instanceof Where); // true

/* --> a BindParam instance can be passed to be used */
const existingBindParam = new BindParam({ x: 4 });
const whereWithBindParams = Where.acquire(
    {
        n: {
            x: 5
        }
    },
    existingBindParam
);

console.log(whereWithBindParams instanceof Where); // true
console.log(whereWithBindParams.statement); // "n.x = $x__aaaa"
console.log(whereWithBindParams.bindParam.get()); // { x: 4, x__aaaa: 5 }
```

> :ToCPrevNext