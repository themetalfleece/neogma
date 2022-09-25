# Finding Nodes

Neogma provides some basic functionality for matching, filtering, limiting and ordering nodes. For more complex find statements, one can use the driver for running a raw query.

## Finding Many Nodes

```js
/* --> finds Users Nodes and returns an array of Users Instances */
const users = await Users.findMany({
    /* --> the where param for matching the Nodes */
    where: {
        /* --> the name property of the User Nodes must be 'John' and their id must be in: ('1', '2') */
        name: 'John',
        /* --> using the "in" Symbol from "Op" */
        id: { [Op.in]: ['1', '2'] },
    },
    /* --> (optional) the limit of this query */
    limit: 3,
    /* --> (optional) the skip of this query */
    skip: 3,
    /* --> (optional) the order of this query, in this case by: age DESC, id ASC */
    order: [['age', 'DESC'], ['id', 'ASC']],
    /* --> (optional) throws NeogmaNotFoundError if no nodes are found (results length 0) */
    throwIfNoneFound: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(users[0].bar()); // "The name of this user is: John"
console.log(users[0].age, users[0].id); // 45 "2"
console.log(users[1].age, users[1].id); // 45 "3"
console.log(users[2].age, users[2].id); // 38 "1"
```

## Finding a single Node

```js
/* --> finds a User Node and returns a Users Instances */
const user = await Users.findOne({
    /* --> the where param for matching the Node */
    where: {
        /* --> the name property of the User Node must be 'John' */
        name: 'John',
    },
    /* --> (optional) the order of this query, in this case by: id ASC */
    order: [['id', 'ASC']],
    /* --> (optional) throws NeogmaNotFoundError if the node is not found */
    throwIfNotFound: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(user.bar()); // "The name of this user is: John"
console.log(user.id, user.age); // "1" 38
```

## Finding nodes and relationships via the Model static
The `findRelationships` static can find related nodes via an Alias.

```js
const relationships = await Users.findRelationships({
    /* --> the alias of the relationship, as provided in the Model definition */
    alias: 'Orders',
    /* --> (optional) where parameters for the query */
    where: {
        /* --> (optional) where parameters of the source node (i.e. User) */
        source: {
            id: '1'
        },
        /* --> (optional) where parameters of the target node (i.e. Order) */
        target: {
            id: '2'
        },
        /* --> (optional) where parameters of the relationship between the nodes */
        relationship: {
            rating: 4
        },
    },
    /* --> (optional) limits the query. It's useful when the purpose is to find whether a relationship exists */
    limit: 1,
    /* --> (optional) minimum hops for a variable length relationship */
    minHops: 1,
    /* --> (optional) maximum hops for a variable length relationship. The value Infinity can be used for no limit on the max hops */
    maxHops: 1,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(relationships[0]?.source.id); // '1'
console.log(relationships[0]?.target.id); // '2'
console.log(relationships[0]?.relationship.rating); // 4
```

## Finding nodes and relationships via the Instance method
The `findRelationships` method can find related nodes via an Alias. It's a wrapper for the corresponding static, while using the Instance as the source node.

```js
/* --> let "user" be a Users instance with a primary field: id = '1' */
const relationships = await user.findRelationships({
    /* --> the alias of the relationship, as provided in the Model definition */
    alias: 'Orders',
    /* --> (optional) where parameters for the query */
    where: {
        /* --> (optional) where parameters of the target node (i.e. Order) */
        target: {
            id: '2'
        },
        /* --> (optional) where parameters of the relationship between the nodes */
        relationship: {
            rating: 4
        },
    },
    /* --> (optional) limits the query. It's useful when the purpose is to find whether a relationship exists */
    limit: 1,
    /* --> (optional) minimum hops for a variable length relationship */
    minHops: 1,
    /* --> (optional) maximum hops for a variable length relationship. The value Infinity can be used for no limit on the max hops */
    maxHops: 1,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(relationships[0]?.source.id); // '1'
console.log(relationships[0]?.target.id); // '2'
console.log(relationships[0]?.relationship.rating); // 4
```

> :ToCPrevNext