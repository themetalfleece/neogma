# Where Parameters

An instance of the `Where` class can be used to easily create a statement and a bind parameter to be used in a query.

## Type-Safe Where Parameters

When using TypeScript with Models, where parameters are type-checked to ensure both property names AND value types match your model's schema. This catches typos and type mismatches at compile time rather than runtime.

```typescript
import { Op } from 'neogma';

// Assuming Users is a Model with properties: { id: string, name: string, age: number }

// Valid - correct property names and matching value types
await Users.findMany({
    where: { name: 'John', age: 25 }
});

// TypeScript Error - 'nam' is not a valid property
await Users.findMany({
    where: { nam: 'John' }  // Error: 'nam' does not exist in type
});

// TypeScript Error - age expects number, not string
await Users.findMany({
    where: { age: 'twenty-five' }  // Error: string is not assignable to number
});

// TypeScript Error - operators also validate value types
await Users.findMany({
    where: { age: { [Op.gt]: '18' } }  // Error: Op.gt expects number, not string
});
```

### Type-Safe Relationship Queries

For `findRelationships`, `relateTo`, and similar methods, the type system validates property names for source, target, and relationship separately:

```typescript
import { Op } from 'neogma';

// Assuming Users is a Model with an 'Orders' relationship
await Users.findRelationships({
    alias: 'Orders',
    where: {
        source: { name: 'John' },           // User property
        target: { orderNumber: 'ORD-123' }, // Order property
        relationship: { rating: 5 },         // Relationship property
    },
});

// TypeScript Error - wrong property names
await Users.findRelationships({
    alias: 'Orders',
    where: {
        source: { userName: 'John' },    // Error: should be 'name'
        target: { grpName: 'Test' },     // Error: 'grpName' doesn't exist
    },
});
```

This type safety works with all where operators (`Op.eq`, `Op.in`, `Op.gt`, `Op.is`, etc.) and validates both property names and value types at any nesting level.

### Null vs Undefined Behavior

When using where parameters, `null` and `undefined` are handled differently:

- **`undefined`**: The property is **ignored** (no filter is applied for that property)
- **`null`**: Generates `IS NULL` check (filters for null values in the database)

```typescript
// undefined is ignored - no filter for 'deleted'
await Users.findMany({
    where: { name: 'John', deleted: undefined }
});
// Generates: WHERE n.name = $name

// null generates IS NULL check
await Users.findMany({
    where: { name: 'John', deleted: null }
});
// Generates: WHERE n.name = $name AND n.deleted IS NULL
```

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

Similarly to creating a new `Where` instance, parameters can be added to an existing instance.

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

### Operator Reference

| Operator       | Cypher                 | Description                    | Available For                        |
| -------------- | ---------------------- | ------------------------------ | ------------------------------------ |
| `Op.eq`        | `=` / `IS NULL`        | Equality (null → IS NULL)      | All types                            |
| `Op.ne`        | `<>` / `IS NOT NULL`   | Not equal (null → IS NOT NULL) | All types                            |
| `Op.in`        | `property IN [values]` | Property is one of values      | All types                            |
| `Op._in`       | `value IN property`    | Value exists in array property | All types (use for array membership) |
| `Op.gt`        | `>`                    | Greater than                   | Scalar types only                    |
| `Op.gte`       | `>=`                   | Greater than or equal          | Scalar types only                    |
| `Op.lt`        | `<`                    | Less than                      | Scalar types only                    |
| `Op.lte`       | `<=`                   | Less than or equal             | Scalar types only                    |
| `Op.contains`  | `CONTAINS`             | Substring matching             | **String only**                      |
| `Op.is`        | `IS NULL`              | Property is null               | All types                            |
| `Op.isNot`     | `IS NOT NULL`          | Property is not null           | All types                            |
| `null`         | `IS NULL`              | Shorthand for `Op.is: null`    | All types                            |

> **Type Safety Note**: When using TypeScript with typed models, operators are constrained to appropriate types. For example, `Op.contains` only accepts string values and is only valid for string properties.

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

### In (Property IN List)

The `Op.in` operator checks if a property value is one of several values. This generates Cypher's `IN` clause.

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

> **Important - Direct Arrays vs Op.in**: A direct array value like `{ id: ['1', '2'] }` is treated as **equality** at runtime (`id = ['1', '2']`), NOT as an IN query. Always use `{ [Op.in]: ['1', '2'] }` explicitly when you want IN behavior.

### _In (Element IN Array Property)

The `Op._in` operator checks if a given value exists within an **array property**. This is the correct way to check array membership in Cypher (not `Op.contains`, which is for string substring matching).

```js
// Check if 'admin' is in the user's roles array
const where = new Where({
    n: {
        roles: {
            [Op._in]: 'admin',
        },
    },
});

console.log(where.getStatement('text')); // $roles IN n.roles
console.log(where.bindParam.get()); // { roles: 'admin' }
```

This generates `$value IN property` which checks if the element exists in the array:

```js
const where = new Where({
    n: {
        x: {
            [Op._in]: 1,
        },
        y: 2
    },
    o: {
        z: {
            [Op._in]: 2,
        }
    }
});

console.log(where.getStatement('text')); // $x IN n.x AND n.y = $y AND $z IN o.z
// "object" statement not available
console.log(where.bindParam.get()); // { x: 1, y: 2, z: 2 }
```

### Working with Array-Typed Properties

When querying array-typed properties (like `string[]` or `number[]`), a limited set of operators is available:

```typescript
// Assuming Users has: { tags: string[], scores: number[] }

// Check if an element exists in the array (use Op._in)
await Users.findMany({
    where: { tags: { [Op._in]: 'admin' } }  // generates: $tags IN u.tags
});

// Exact array match
await Users.findMany({
    where: { tags: { [Op.eq]: ['admin', 'user'] } }
});

// Array not equal
await Users.findMany({
    where: { tags: { [Op.ne]: ['guest'] } }
});

// TypeScript Error - Op.contains is for string substring matching, not array membership
await Users.findMany({
    where: { tags: { [Op.contains]: 'admin' } }  // Error!
});

// TypeScript Error - comparison operators don't apply to arrays
await Users.findMany({
    where: { scores: { [Op.gt]: [50] } }  // Error!
});
```

> **Key Point**: To check if an element exists in an array property, use `Op._in` (which generates `value IN arrayProperty`), NOT `Op.contains` (which is for string substring matching).

### Comparison
The following operators are available:

| Operator | Description            | Results in |
| -------- | ---------------------- | ---------- |
| ne       | not equals             | <>         |
| gt       | greater than           | >          |
| gte      | greater than or equals | >=         |
| lt       | less than              | <          |
| lte      | less than or equals    | <=         |

### Contains (String Substring Matching)

The `Op.contains` operator performs **substring matching on strings only**. It generates Cypher's `CONTAINS` clause, which checks if a string property contains a given substring.

> **Important**: `Op.contains` is NOT for checking array membership. To check if an element exists in an array property, use `Op._in` instead (see below).

```js
const where = new Where({
    n: {
        // Finds nodes where n.name contains 'xyz'
        name: {
            [Op.contains]: 'xyz',
        },
    },
});

console.log(where.getStatement('text')); // n.name CONTAINS $name
// "object" statement not available
console.log(where.bindParam.get()); // { name: 'xyz' }
```

When using TypeScript, `Op.contains` is only available for string-typed properties:

```typescript
// Valid - string property
await Users.findMany({ where: { name: { [Op.contains]: 'John' } } });

// TypeScript Error - number property
await Users.findMany({ where: { age: { [Op.contains]: 5 } } }); // Error!
```

### IS NULL and IS NOT NULL

Check if a property is null or not null using `Op.is` and `Op.isNot`:

```js
const where = new Where({
    n: {
        deleted: { [Op.is]: null },
        createdAt: { [Op.isNot]: null },
    },
});

console.log(where.getStatement('text'));
// n.deleted IS NULL AND n.createdAt IS NOT NULL
```

For convenience, you can use `null` directly as shorthand for `{ [Op.is]: null }`:

```js
const where = new Where({
    n: {
        deleted: null,  // Equivalent to { [Op.is]: null }
    },
});
```

You can also use `{ [Op.eq]: null }` for IS NULL and `{ [Op.ne]: null }` for IS NOT NULL:

```js
const where = new Where({
    n: {
        deleted: { [Op.eq]: null },   // Generates: n.deleted IS NULL
        active: { [Op.ne]: null },    // Generates: n.active IS NOT NULL
    },
});
```

> **Note**: These operators are only available in "text" mode (WHERE clause), not "object" mode (bracket syntax).

## Using Operators in QueryBuilder Match

When using operators in QueryBuilder's `match()` method for nodes or relationships, all operators are supported. The QueryBuilder automatically separates equality operators (which can use Neo4j's bracket syntax `{ prop: $val }`) from non-equality operators (which require a WHERE clause).

### Example: Using Comparison Operators in Match

```js
const queryBuilder = new QueryBuilder().match({
    identifier: 'u',
    label: 'User',
    where: {
        name: 'John',           // eq operator - uses bracket syntax
        age: { [Op.gte]: 18 },  // non-eq - generates WHERE clause
    },
});

// Generates: MATCH (u:User { name: $name }) WHERE u.age >= $age
console.log(queryBuilder.getStatement());
// { name: 'John', age: 18 }
console.log(queryBuilder.getBindParam().get());
```

### Example: Multiple Operators on Same Property

```js
const queryBuilder = new QueryBuilder().match({
    identifier: 'u',
    label: 'User',
    where: {
        age: { [Op.gte]: 18, [Op.lte]: 65 },
    },
});

// Generates: MATCH (u:User) WHERE u.age >= $age AND u.age <= $age__aaaa
console.log(queryBuilder.getStatement());
```

### Example: Operators on Relationships

```js
const queryBuilder = new QueryBuilder().match({
    related: [
        { identifier: 'u', label: 'User' },
        {
            direction: 'out',
            name: 'FOLLOWS',
            identifier: 'r',
            where: { since: { [Op.gte]: 2020 } },
        },
        { identifier: 'p', label: 'Post' },
    ],
});

// Generates: MATCH (u:User)-[r:FOLLOWS]->(p:Post) WHERE r.since >= $since
console.log(queryBuilder.getStatement());
```

### Auto-generated Identifiers

When using non-equality operators without an explicit identifier, QueryBuilder automatically generates a unique identifier for the WHERE clause:

```js
// With explicit identifier
new QueryBuilder().match({
    identifier: 'n',
    label: 'Node',
    where: { age: { [Op.gt]: 18 } },
});
// Result: MATCH (n:Node) WHERE n.age > $age

// Without identifier - one is auto-generated
new QueryBuilder().match({
    label: 'Node',
    where: { age: { [Op.gt]: 18 } },
});
// Result: MATCH (__n:Node) WHERE __n.age > $age
```

The same applies to relationships - if no identifier is provided and non-equality operators are used, a unique identifier (like `__r`) is generated automatically.

### Using a Custom BindParam

You can pass a custom `BindParam` instance to the QueryBuilder constructor. The auto-generated identifiers will use this shared BindParam, which is useful for:
- Sharing parameters across multiple queries
- Controlling parameter naming
- Accessing generated identifiers programmatically

```js
import { BindParam, QueryBuilder, Op } from 'neogma';

const bindParam = new BindParam();

const queryBuilder = new QueryBuilder(bindParam).match({
    label: 'Node',
    where: { age: { [Op.gt]: 18 } },
});

// Result: MATCH (__n:Node) WHERE __n.age > $age
console.log(queryBuilder.getStatement());

// Access bind parameters from either reference
console.log(bindParam.get()); // { age: 18 }
console.log(queryBuilder.getBindParam().get()); // { age: 18 }
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