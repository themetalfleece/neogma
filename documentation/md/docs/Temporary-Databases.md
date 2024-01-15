# Temp DBs

You can work with temporary dbs (which can be cleared all at once) by using the static `fromTempDatabase` to initialize your Neogma instance. You pass in all the same props as in the constructor except the name of the database, as it will be created for you and managed internally by Neogma.

```js
/* --> create a neogma instance that is latched onto an internally managed temp database */
const neogma = Neogma.fromTempDatabase(
    {
        /* --> use your connection details */
        url: 'bolt://localhost',
        username: 'neo4j',
        password: 'password',
    },
    {
        logger: console.log,
    }
);
```

To dispose of a temp databse when you're done using it, you can use one of the following three methods:

```js
const database = neogma.database;
await neogma.clearTempDatabase(database);
```

As shown above this method requires you to pass the exact name of the database to dispose of. Sometimes that may not be what's needed if working with a large number of temp dbs so you could get them all at once.

```js
await neogma.clearAllTempDatabases();
```

You could also specify the time frame (of creation) in seconds to delete the dbs that are older than it.

```js
const seconds = 1000;
await neogma.clearTempDatabasesOlderThan(seconds);
```

> :ToCPrevNext