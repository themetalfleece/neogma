# Creating Nodes

A `QueryRunner` instance can be used for creating nodes from Objects. The node properties and label are needed.

```js
/* --> let 'queryRunner' be a QueryRunner instance */
const result = await queryRunner.create({
    /* --> label(s) of the created nodes. Multiple labels like 'User:Person' can also be used */
    label: 'User',
    /* --> data (properties) for the nodes. Here, 2 nodes will be created */
    data: [
        {
            phoneNumber: '1234567890',
            codes: [0, 3, 8],
        },
        {
            age: 38,
        }
    ],
    /* --> (optional) the identifier of the nodes for the query. Is needed for parsing the results. Default is the value of 'QueryRunner.identifiers.default' */
    identifier: 'u',
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

/* --> the result is the QueryResult from the neo4j driver */
console.log(result.records.map((v) => v.get('u').properties));
```

> :ToCPrevNext