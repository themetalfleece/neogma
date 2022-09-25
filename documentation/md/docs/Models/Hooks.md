# Hooks

## Before Create

The `beforeCreate` hook runs before a Node is created by the `createOne`, `createMany` statics, and the `build` method.

It runs before the node is validated, therefore it's suitable for mutating data before the validation runs.

```js
Users.beforeCreate = (
    /* --> the Instance that's about to be saved to the database */
    user
) => {
    if (user.age) {
        user.age += 2;
    }
};

const user = await Users.createOne({
    id: '123',
    name: 'John',
    age: -1
});

console.log(user.age); // 1
```

It also runs when creating relating nodes

```js
Orders.beforeSave = (order) => {
    if (order.items < 0) {
        order.items = 0;
    }
};

await Users.createOne({
    id: '123',
    name: 'John',
    Orders: {
        properties: [
            {
                id: '456',
                items: -1
            }
        ]
    }
});

/* --> the created Order node will have items === 0 */
```

## Before Delete

The `beforeDelete` hook runs before an Instance is deleted with its `delete` method.

```js
Users.beforeDelete = (
    /* --> the Instance that's about to be deleted */
    user
) => {
    console.log(`I'm ${user.name} and I'm being deleted :(`)
}

const user = Users.build({
    id: '123',
    name: 'John',
});

await user.save();

/* --> before the next command finished, beforeDelete runs and logs to the console */
await user.delete();
```