# Deleting Nodes

## Deleting Nodes via the Model static

Using the `delete` static of a Model and providing a Where paramter, nodes of the Model can be deleted

```js
await Users.delete({
    /* --> the Nodes to be deleted will be matched using this param */
    where: {
        /* --> the node(s) to be deleted need to have the name 'John' AND the id '1' */
        name: 'John',
        id: '1'
    },
    /* --> (optional) adds the DETACH keyword to the delete statement, also deleting the relationships of the node(s) */
    detach: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});
```

## Deleting Nodes via the Instance method

Using the `delete` method of an Instance, the node which corresponds to the Instance will be deleted.

```js
/* --> let 'user' be a Users Instance. This node will be deleted */
await user.delete({
    /* --> (optional) adds the DETACH keyword to the delete statement, also deleting the relationships of the node */
    detach: true,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});
```

> :ToCPrevNext