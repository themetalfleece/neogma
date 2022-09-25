# Creating Relationships

A `QueryRunner` instance can be used for creating relationships from Objects. Information and where parameters about the source and target nodes can be used.

```js
/* --> let 'queryRunner' be a QueryRunner instance */
const result = await queryRunner.createRelationship({
    source: {
        /* --> (optional) the label of the source Node to be matched --> */
        label: 'Users',
        /* --> (optional) the identifier of the source Node th be used in the query. Defaults to the value of 'QueryRunner.identifiers.createRelationship.source' */
        identifier: 'source'
    },
    target: {
        /* --> (optional) the label of the target Node to be matched --> */
        label: 'Orders',
        /* --> (optional) the identifier of the source Node th be used in the query. Defaults to the value of 'QueryRunner.identifiers.createRelationship.target' */
        identifier: 'target'
    },
    relationship: {
        /* --> the name of the relationship */
        name: 'CREATES',
        /* --> the direction of this relationship, between source and target. Valid values are 'in', 'out', 'none' */
        direction: 'out',
        /* --> (optional) properties of the relationship */
        properties: {
            rating: 4
        }
    },
    /* --> (optional) the where clause for the source and target nodes to be matched. A param object or a Where instance can be used. The source/target identifiers needs to be used as keys */
    where: { // @see [Where](../Where-Parameters)
        /* --> where params for the source Node. The source identifier needs to be used as a key */
        source: {
            id: {
        /* --> using the "in" Symbol from "Op" */
                [Op.in]: ['1', '2']
            }
        },
        /* --> where params for the target Node. The target identifier needs to be used as a key */
        target: {
            name: 'Bob'
        },
    },
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

/* --> the result is the QueryResult from the neo4j driver */
console.log(result);
```

> :ToCPrevNext