# Instances

Each Instance of a Model represents a node in the database, with its label, properties etc. matching those in the Model definition.

Instances offer flexible access to a node's properties, as well as operations regarding it, such as updating/deleting the node itself and its relationships.

## Creating and saving an Instance
An Instance is returned from various Model operations (such as [Create](./Creating-Nodes-and-Relationships), [Find](./Finding-Nodes-And-Relationships)), or a new Instance (which doesn't yet exist in the database) can be created as follows:
```js
    /* --> creates an Instance of the Users model, which still doesn't exist in the database */
    const user = Users.build({
        id: '1',
        name: 'John',
        age: 38,
    });

    /* --> the Instance can be saved to the database. This will run a CREATE operation to create a node to match the Users Model configuration (label etc.) */
    await user.save({
        /* --> (optional, default true) validates that the properties of the Instance are valid, given the schema of the Model definition */
        validate: true,
        /* --> (optional) an existing session or transaction to use */
        session: null,
    });
```

## Updating an Instance
```js
    /* --> given a user Instance, like the one created above, we can change the properties of the Instance */
    user.name = 'Alex';

    /* --> we reflect this change to the database. Since the node already exists in the databse, neogma will automatically run a MATCH-SET operation to update just the name of this node */
    await user.save({
        validate: false,
    });
```

If nothing has changed, `.save()` will do nothing.

**WARNING**: Updating a instance ignores its Association fields (as described below) meaning that related nodes will not be created and associated. Only the initial `save` (when an instance doesn't yet exist in the database) creates related nodes.

## Accessing the Instance's properties and methods
```js
    /* --> the Instance's properties and methods are accessible by their key */
    console.log(user.id, user.name, user.age); // "1" "Alex" 38
    /* --> all the instance properties can be taken as follows */
    console.log(user.getDataValues()); // { id: "1", name: "Alex", age: 38 }
    /* --> the methods, used in the Model definition can be used */
    console.log(user.bar()); // "The name of this user is: Alex"
```

## Validating an Instance
```js
    user.age = 30;
    /* --> we can validate the properties of the Instance without saving it to the database. The properties of the Instance are valid, so this will not throw an error */
    await user.validate();

    try {
        user.age = -1;
        /* --> the properties of the Instance are invalid, so this will throw an error */
        await user.validate();
    } catch(err) { 
        console.log(err); // NeogmaInstanceValidationError
    }
```

## Creating related nodes
```js
    /* --> by using the Related Nodes aliases specified in the Model definition, related nodes can also be created */
    const userWithOrder = Users.build({
        id: '2',
        name: 'Alex',
        /* --> the 'Orders' alias will be used, as defined in the 'Users' model */
        Orders: {
            /* --> (optional) create new nodes and associate with them */
            properties: [{
                /* --> a new Order node will be created with the following properties, and a relationship with the configuration of alias 'Orders' will be created (direction: out, name: CREATES) */
                id: '3'
            }],
        }
    });
    /* --> when calling the following method, the User node, the Order node and the relationship between them */
    await userWithOrder.save();
```
For more examples of creating realted nodes, refer to the [Create operations](./Creating-Nodes-and-Relationships), as the same interface is used.

## Creating an Instance for an existing Node
If a Node already exists in the database, an Instance can still be created. This is useful for running methods like `.save()` on it.

### Creating an Instance for an existing Node using buildFromRecord
When a record is available (i.e. from a QueryResult), an Instance can be built using it directly in the `buildFromRecord` static.

This is the easiest and best way to build an Instance from an existing node, as its `labels` field is properly set.

This static is used internally in Neogma for this purpose. 

```js
const result = await new QueryBuilder() // @see [QueryBuilder](../QueryBuilder/Overview)
    .match({
        model: Users,
        where: {
            id: '1'
        },
        identifier: 'u'
    })
    .return ('u')
    .run();

const userRecord = result.records[0]?.get('u');
if (!userRecord) {
    throw new Error('user not found');
}

const userInstance = Users.buildFromRecord(userRecord);

console.log(userInstance.labels); // ["User"]

userInstance.name = 'Some new name';

await userInstance.save(); /* --> the instance will be updated */
```

### Creating an Instance for an existing Node using build
Another way is to use the `build` static. It's not recommended as the `labels` property is not set.

The first parameter of the `build` function must equal to the data of the Node, for example from the statement result.

The second parameter is an object with its `status` property set to `existing`.

```js
const result = await new QueryBuilder() // @see [QueryBuilder](../QueryBuilder/Overview)
    .match({
        model: Users,
        where: {
            id: '1'
        },
        identifier: 'u'
    })
    .return ('u')
    .run();

const userData = result.records[0]?.get('u')?.properties;
if (!userData) {
    throw new Error('user not found');
}

const userInstance = Users.build(userData, { status: 'existing' });

userInstance.name = 'Some new name';

await userInstance.save(); /* --> the instance will be updated */
```

## Instance attributes
The labels of the Instance can be taken from the `labels` attribute. It's properly set when the Instance is built internally (i.e. in the `findMany`, `update`, `updateRelationship` statics), or when building an Instance using the [buildFromRecord](#creating-an-instance-for-an-existing-node-using-buildfromrecord) static.
```js
/* --> let "user" be a Users instance */
console.log(user.labels); // ["User"]
```

## More Instance methods
More Instance methods are found at the corresponding documentation, i.e. [Creating Nodes and Relationships](./Creating-Nodes-and-Relationships)

> :ToCPrevNext