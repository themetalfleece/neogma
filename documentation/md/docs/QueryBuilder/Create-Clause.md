# Create
`QueryBuilderParameters['Create']`

## Create a node by using a literal string
A literal string will be used as is.

```js
const queryBuilder = new QueryBuilder()
    .create('(a:A { id: 1 })'); /* --> literal string to use */

console.log(queryBuilder.getStatement()); // CREATE (a:A { id: 1 })
console.log(queryBuilder.getBindParam().get()); // {}
```

## Create a node by using an object
An object can be used to easily create a node with an identifier, label, properties.

```js
const queryBuilder = new QueryBuilder().create({
    /* --> (optional) the identifier of the node */
    identifier: 'n',
    /* --> (optional) the label of the node */
    label: 'MyLabel',
    /* --> (optional) the properties of thie node */
    properties: { 
        id: '20',
    },
});

console.log(queryBuilder.getStatement()); // CREATE (n:MyLabel { id: $id })
console.log(queryBuilder.getBindParam().get()); // { id: '20' }
```

A `Model` can be used instead of the `label` attribute. In this case, the Model's label will be used.
```js
const queryBuilder = new QueryBuilder().create({
    /* --> (optional) */
    identifier: 'n',
    /* --> (optional) the Model whose label will be used */
    model: MyModel,
});

/* --> assuming MyModel.getLabel() returns `MyModelLabel` */
console.log(queryBuilder.getStatement()); // CREATE (n:`MyModelLabel`)
console.log(queryBuilder.getBindParam().get()); // {}
```

## Create multiple nodes
By using the `multiple` attribute and an array of nodes, multiple nodes can be created. 

```js
const queryBuilder = new QueryBuilder().create({
    multiple: [
        /* --> each entry has the same type as creating with a single object, like in the examples above */
        {
            identifier: 'a',
            model: ModelA,
            properties: {
                id: '20',
            },
        },
        {
            label: 'LabelB',
        },
    ],
});

/* --> assuming MyModel.getLabel() returns `MyModelLabel` */
console.log(queryBuilder.getStatement()); // CREATE (a:`MyModelLabel` { id: $id }), (:LabelB)
console.log(queryBuilder.getBindParam().get()); // { id: '20' }
```

## Create nodes and relationships
By using the `related` attribute and an array of alternating node-relationship objects, a create between them is created.

```js
const queryBuilder = new QueryBuilder().create({
    related: [
        /* --> each even entry is a "node" object, as defined above */
        {
            identifier: 'a',
            model: ModelA,
            properties: {
                nodeProp: '20',
            },
        },
        /* --> each odd entry is a "relationship" object */
        {
            /* --> the direction of the relationship, from the node above towards the one below */
            direction: 'out', // --> 'out' or 'in' or 'none'
            /* --> (optional) name of the relationship */
            name: 'RelationshipName',
            /* --> (optional) identifier of the relationship */
            identifier: 'r',
            /* --> (optional) where parameters for matching this relationship. They are of the "WhereParamsI" type */
            properties: {
                relProp: 1,
            },
        },
        /* --> the final entry must be a node */
        {
            identifier: 'b'
        }
    ],
});

/* --> assuming MyModel.getLabel() returns `MyModelLabel` */
// CREATE (a:`MyModelLabel` { nodeProp: $nodeProp })-[r:RelationshipName { relProp: $relProp }]->(b)
console.log(queryBuilder.getStatement());
// { nodeProp: '20', relProp: 1 }
console.log(queryBuilder.getBindParam().get());
```

A more elaborate example:
```js
const queryBuilder = new QueryBuilder().create({
    related: [
        {
            identifier: 'a',
            model: ModelA,
            properties: {
                nodeProp: '20',
            },
        },
        /* --> The static `getRelationshipByAlias` of a model can be used as a shortcut. */
        ModelA.getRelationshipByAlias('Relationship1'),
        {
            identifier: 'b'
        },
        {
            direction: 'in'
        },
        {
            ...ModelA.getRelationshipByAlias('Relationship2'),
            identifier: 'r2'
            properties: {
                relProp: 2
            }
        },
        {}
    ],
});

/* --> assuming MyModel.getLabel() returns `MyModelLabel` */
/* --> assuming 'Relationship1' has configuration: direction: 'out', name: 'Relationship1Name' */
/* --> assuming 'Relationship1' has configuration: direction: 'in', name: 'Relationship2Name' */
// --> CREATE (a:`MyModelLabel` { nodeProp: $nodeProp })-[:Relationship1Name]->(b)<-[r2:Relationship2Name { relProp: $relProp }]-()
console.log(queryBuilder.getStatement());
// --> { nodeProp: '20', relProp: 2 }
console.log(queryBuilder.getBindParam().get());
```

For expected behavior, the first and last elements must be a node object.

# Merge
`QueryBuilderParameters['MergeI']`

Merge has identical typings and behavior as `create`. Just replace the `create` attributy with `merge`.

For example:

```js
const queryBuilder = new QueryBuilder().merge({
    identifier: 'n',
    label: 'MyLabel',
    properties: { 
        id: '20',
    },
});

console.log(queryBuilder.getStatement()); // MERGE (n:MyLabel { id: $id })
console.log(queryBuilder.getBindParam().get()); // { id: '20' }
```
