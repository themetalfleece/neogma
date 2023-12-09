# Deleting Relationshhips

## Deleting Relationshhips via the Model static

Using the `deleteRelationships` static of a Model and providing a Where parameter, relationships of the Model can be deleted

```js
await Users.deleteRelationships({
    /* --> the Relationshhips to be deleted will be matched using this param */
    where: {
        /* --> (optional) the relationship(s) to be deleted need to be from a User with the name 'John' AND the id '1' */
        source: {
          name: 'John', 
          id: 1,
        },
        /* --> (optional) the relationship(s) to be deleted need to be to an Order with the id '2' */
        target: {
          id: 1,
        },
        /* --> (optional) the relationship(s) to be deleted need to be match the following properties */
        relationship: {
          rating: 5,
          status: 'completed',
        },
    },
    /* --> (optional) an existing session or transaction to use */
    session: null,
});
```

> :ToCPrevNext