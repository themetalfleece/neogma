# Updating Nodes

A `QueryRunner` instance can be used for editing nodes from Objects. The node properties to update, a optional label, and an optional where param are needed.

```js
/* --> let 'queryRunner' be a QueryRunner instance */
const result = await queryRunner.update({
    /* --> the matched nodes will be updated with the following values */
    data: {
        name: 'Alex',
        age: 30,
        /* --> using the "remove" Symbol from "UpdateOp" */
        disabled: { [UpdateOp.remove]: true },
    },
    /* --> (optional) label(s) of the nodes to be matched. Multiple labels like 'User:Person' can also be used */
    label: 'User',
    /* --> (optional) the where clause for the nodes to be matched. A param object or a Where instance can be used */
    where: { // @see [Where](../Where-Parameters)
        /* --> the identifier needs to be used as a key */
        u: {
            id: {
                /* --> using the "in" Symbol from "Op" */
                $[Op.in]: ['1', '2']
            }
        }
    },
    /* --> (optional) the identifier of the nodes for the query. Is needed for parsing the results. Default is the value of 'QueryRunner.identifiers.default' */
    identifier: 'u',
    /* --> (optional) whether to return the nodes */
    return: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

/* --> the result is the QueryResult from the neo4j driver. In case the nodes were returned, their properties can be retrieved */
console.log(result.records.map((v) => v.get('u').properties));
```

## Update Operators

Node properties can be updated just by setting a new value of the respective type. However, some update operations can only be performed using the exported `UpdateOp` variable.

### Remove a Property

When this operation is set to `true`, the respective property will be completely removed from the node (similar to the JS `delete` operator).

```js
// ...
  data: {
      name: 'Alex',
      /* --> using the "remove" Symbol from "UpdateOp" */
      age: { [UpdateOp.remove]: true },
  },
  // ...
  identifier: 'u',
// ...

console.log(result.records.map((v) => v.get('u').properties.age)); // undefined
```

> :ToCPrevNext
