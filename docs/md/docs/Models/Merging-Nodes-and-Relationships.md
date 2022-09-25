# Merging Nodes and Relationships

Merging nodes and relationships happens with the same functions as creating nodes and relationships, by passing the appropriate params. Therefore, it is recommended that [Creating Nodes and Relationships](./Creating-Nodes-and-Relationships) is known well.

* When merging nodes, their data is used for the merge operation
  * i.e. `MERGE (u:User { id: '1' })`
* When merging relationships, the merge is made on the source node, target node and relationship name, but the relationship properties get set afterwards
  * i.e. `MERGE (u)-[r:CREATES]->(o) SET r.rating = 4`

## Merging a single or many nodes of a Model

For merging a single node, `createOne` can be used with the `merge` param set to true.
```js
/* --> merge a User node and get the Instance */
const user = await Users.createOne(
    /* --> the properties of the User node to be merged */
    {
        id: '1',
        name: 'John',
        age: 38,
    },
    {
        /* --> by setting this to true, a MERGE query instead of a CREATE one will run */
        merge: true,
        /* --> (optional, default true) validates the properties of the node */
        validate: true,
        /* --> (optional) an existing session or transaction to use */
        session: null,
    }
);

/* --> we can use the Instance as usual */
console.log(user.name); // "John"
```

For merging many nodes, `createMany` can be used with the `merge` param set to true.
```js
const users = await Users.createMany(
    [
        {
            id: '1',
            name: 'John',
        },
        {
            id: '2',
            name: 'Alex',
        }
    ],
    {
        /* --> by setting this to true, a MERGE query instead of a CREATE one will run */
        merge: true,
        /* --> (optional, default true) validates all nodes */
        validate: true,
        /* --> (optional) an existing session or transaction to use */
        session: null,
    }
);

console.log(usersWithOrders[0].id); // "1"
console.log(usersWithOrders[1].bar()); // "The name of this user is: Alex"
```

## Creating/Merging nodes and merging relationships with other nodes

When automatically associating with other nodes (either by creating them or by matching them), a MERGE instead of a CREATE can be used.

The following example uses `createMany`, but the same interface applies on `createOne` and instance save (when it doesn't exist in the database).

```js
const usersWithOrders = await Users.createMany(
    [
        {
            id: '1',
            name: 'John',
        },
        {
            id: '2',
            name: 'Alex',
            /* --> associate with other nodes by their aliases */
            /* --> the Orders alias will be used, as defined in the Users model */
            Orders: {
                /* --> (optional) configuration regarding what aspects of the 'properties' property to merge instead of create */
                propertiesMergeConfig: {
                    /* --> (optional) the created (Order) nodes will be merged, instead of created */
                    nodes: true,
                    /* --> (optional) the relationship between User and Order nodes will be merged, instead of created */
                    relationship: true,
                },
                /* --> (optional) merge new nodes (as propertiesMergeConfig.nodes is true) and associate with them */
                properties: [
                    /* --> creates the following 2 Order nodes, and creates a relationship with each one of them using the configuration of the Orders alias  */
                    {
                        id: '2'
                    },
                    {
                        id: '3',
                        items: 5,
                        /* --> the relationship is merged (as propertiesMergeConfig.relationship is true) with the following property (using its alias) */
                        Rating: 4,
                        /* --> can create (or merge) nodes and associate them with this Order node. The alias and configuration is that of the Orders model */
                        /* --> the 'Critics' alias will be used, as defined in the 'Orders' model */
                        Critics: {
                            propertiesMergeConfig: {
                                /* --> by setting this to false (or omitting it in the first place), the Critics nodes will be created, not merged */
                                nodes: false,
                                /* --> by setting this to false (or omitting it in the first place), the relationship between the Orders and the Critics nodes will be created, not merged */
                                relationship: false,
                            },
                            properties: [{ id: '10' }]
                        }
                    }
                ],
                /* --> (optional) also associates the User node with existing Order nodes */
                where: [
                    {
                        /* --> (optional) the relationship between the created User nodes and the matched Order nodes will be merged, instead of being created */
                        merge: true,
                        /* --> the Where clause find matching the existing Nodes */
                        params: {
                            id: '3'
                        },
                        /* --> (optional) properties can be added to the relationship merged by matching the User node with the existing Order nodes, using their alias */
                        Rating: 5,
                    },
                    {
                        /* --> another object can be used for matching the User node with the Order nodes of this where independently */
                        params: {
                            items: 3,
                        },
                        /* --> the realtionship of this match can be created, not merged */
                        merge: false,
                    }
                ]
            },
            /* --> other aliases can be used here, to associate the User node with those of other Models */
        }
    ],
    {
        /* --> merges the root-level nodes (the Users - 'John', 'Alex') */
        merge: true,
        /* --> (optional, default true) validates all nodes */
        validate: true,
        /* --> (optional) an existing session or transaction to use */
        session: null,
    }
);
```

> :ToCPrevNext