# Bind Parameters

The `BindPara` class provides utilities of easily creating a bind parameters object to be used in a query. Using the appropriate methods, if a key already exists in the parameter, a different one will be used. So, there is no need of manually ensuring uniqueness of keys.

## Creating a BindParam instance

First of all, a `BindParam` instance must be created.
```js
/* --> creating an empty BindParam instance */
const bindParam = new BindParam();

/* --> creating a BindParam instance with data (using an object) */
const bindParam = new BindParam({
    x: 5,
    y: 'bar'
});

/* --> creating a BindParam instance with data (using many objects) */
const bindParam = new BindParam(
    {
        x: 5,
        y: 'bar'
    },
    {
        z: true
    }
);

/* --> the following will throw an error since the keys are not unique. To add non-unique keys, the `getUniqueName` method must be used */
/* --> this is to prevent unexpected behavior in a case like the following: "n1.x = $x, n2.x = $x", where a different value is intended to be used each time */
const bindParam = new BindParam(
    {
        x: 5
    },
    {
        x: true // -> error! key 'x' is not unique
    }
);
```

## Getting the values of a BindParam

The `get` method can be used

```js
const bindParam = new BindParam({
    x: 5,
    y: 'bar'
});

console.log(bindParam.get()); // { x: 5, y: 'bar' }
```

## Adding a value to an existing BindParam instance

The `add` method can be used, however the added keys must be unique. To add non-unique keys, the `getUniqueName` method must be used.

```js
/* --> */
const bindParam = new BindParam({
    x: 5
});

/* --> adding a single object */
bindParam.add({
    y: 'bar'
});

console.log(bindParam.get()); // { x: 5, y: 'bar' }

/* --> adding multiple objects */
bindParam.add(
    {
        z: true,
        a: 1
    },
    {
        b: 2
    }
);

console.log(bindParam.get()); // { x: 5, y: 'bar', z: true, a: 1, b: 2 }

/* --> adding an existing key will result in an error */

bindParam.add({ x: 4 }); // -> error! key 'x' is not unique
```

## Getting a unique name to use

The `getUniqueName` can be used to generate a key which doesn't already exist in the bind param. This key can be used in your queries.

```js
const bindParam = new BindParam({
    x: 5,
    y: 'bar'
});
/* --> let's suppose you use those keys in a query. The bindParam can be used as a parameter when we run it */
let statement = `MATCH (n) WHERE n.x = $x AND n.y = $y`;

/* --> get a unique key based on the 'x' prefix */
const uniqueName = bindParam.getUniqueName('x');
console.log(uniqueName); // x__aaaa

/* --> the value for this unique name should be added to the bindParam */
bindParam.add({
    [uniqueName]: 4
});
console.log(bindParam.get()); // { x: 5, y: 'bar', x__aaaa: 4 }

/* --> this uniqueName can be used in queries */
statement += `WITH n MATCH (o) WHERE o.x = $${uniqueName} RETURN n, o`;

/* --> we can now run this query */
await queryRunner.run(statement, bindParam.get());
```

The `getUniqueNameAndAdd` can be used to perform the `getUniqueName` and `add` methods at once.

```js
const bindParam = new BindParam({
    x: 5,
    y: 'bar'
});
/* --> get a unique key based on the 'x' prefix and add the given value to the bindParam */
const uniqueName = bindParam.getUniqueNameAndAdd('x', 4);

console.log(uniqueName); // x__aaaa
console.log(bindParam.get()); // { x: 5, y: 'bar', x__aaaa: 4 }
```

The `getUniqueNameAndAddWithLiteral` method can be used for a similar functionality with `getUniqueNameAndAdd`, but if the given value is an instance of Literal, it returns it as is.

## Cloning a BindParam

A BindParam instance can be cloned, so a new one is returned with the same parameters.

```js
const oldBindParam = new BindParam({
    x: 5,
    y: 'bar'
});
oldBindParam.add({ z: true });

console.log(oldBindParam.get()); // { x: 5, y: 'bar', z: true }

const newBindParam = oldBindParam.clone();
newBindParam.add({ a: 1 });
oldBindParam.add({ b: 2 });

console.log(newBindParam.get()); // { x: 5, y: 'bar', z: true, a: 1 }
console.log(oldBindParam.get()); // { x: 5, y: 'bar', z: true, b: 2 }
```

## Acquire a BindParam instance

The `acquire` static can be used to ensure that a BindParam instance is at hand. If one is passed, it will be returned as is. Else, a new one will be created.

```js
const bindParamFirst = BindParam.acquire(null);
console.log(bindParamFirst instanceof BindParam); // true

const bindParamSecond = BindParam.acquire(bindParamFirst);
console.log(bindParamFirst === bindParamSecond); // true
```

## Removing parameters
The `remove` method can be used to remove keys from the BindParam.

```js
const bindParam = new BindParam({
    x: 5,
    y: 'bar'
});

const uniqueName = bindParam.getUniqueNameAndAdd('x', 4);

console.log(uniqueName); // x__aaaa
console.log(bindParam.get()); // { x: 5, y: 'bar', x__aaaa: 4 }

bindParam.remove([uniqueName, 'y']);
console.log(bindParam.get()); // { x: 5 }
```

> :ToCPrevNext