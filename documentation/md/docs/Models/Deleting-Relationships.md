# Deleting Relationships

## Deleting Relationships via the Model static

Using the `deleteRelationships` static of a Model and providing a Where parameter, relationships of the Model can be deleted

```js
const deletedCount = await Users.deleteRelationships({
    /* --> the alias of the relationship, as provided in the Model definition */
    alias: 'Orders',
    /* --> the Relationships to be deleted will be matched using this param */
    where: {
        /* --> (optional) the relationship(s) to be deleted need to be from a User with the name 'John' AND the id '1' */
        source: {
          name: 'John',
          id: '1',
        },
        /* --> (optional) the relationship(s) to be deleted need to be to an Order with the id '2' */
        target: {
          id: '2',
        },
        /* --> (optional) the relationship(s) to be deleted need to be match the following properties */
        relationship: {
          rating: 5,
        },
    },
    /* --> (optional) throws NeogmaNotFoundError if no relationships were deleted */
    throwIfNoneDeleted: false,
    /* --> (optional) an existing session or transaction to use */
    session: null,
});

console.log(deletedCount); // number of relationships deleted
```

> :ToCPrevNext