# Sessions

All Model and QueryRunner queries use a session in order to run. A session can be created by using the driver, or by using the `getSession` helper to help with running queries in the same session.

All Model queries can accept an existing session as a parameter. If it's given, every query will run in this session. If not, a new session will be created for the queries to run.

All QueryRunner queries require an existing session.

## Getting a session from the driver
```js
/* --> the driver can be obtained by the Neogma instance */
const driver = neogma.getDriver();
/* --> use the driver to create a session */
const session = driver.session();
/* --> this session can be used in more than one Neogma operations */
await Users.createOne(
    {
        id: '1',
        name: 'John'
    },
    {
        session
    }
);
await Users.findAll({
    session
});
/* --> the session can also be used in the QueryRunner. Let 'queryRunner' be a QueryRunner instance */
await queryRunner.run('RETURN 1 = 1', {}, session); // @see [QueryRunner](./QueryRunner/Overview)
/* --> closing the session */
await session.close();
```

## Getting a session with the getSession helper
A session can also be obtained with the `getSession` helper. Its first parameter is an existing session: if it's set, it will be used as-is in the callback. Else, a new one will be created. Ιts second parameter is a callback with the session as the first parameter. 

After the callback is done, the session automatically closes.

If `getSession` calls are nested, the session will close after all of them are done.
```js
await getSession(
    /* --> no session is passed, so a new one will be created */
    null, 
    async (session) => {
        /* --> this session can be used in more than one Neogma operations */
        await Users.createOne(
            {
                id: '1',
                name: 'John'
            },
            {
                session
            }
        );

        /* --> let's create a function that takes a session param */
        const myFindUser = (sessionParam) => {
            /* --> this param is used for a getSession. So, if it already exists, it will be used. Else, a new one will be created */
            await getSession(sessionParam, async (sessionToUse) => {
                /* --> we can perform multiple operations with this session */
                await Users.findAll({
                    session: sessionToUse
                });
                await Users.findOne({
                    session: sessionToUse
                });
                await queryRunner.run('RETURN 1 = 1', {}, sessionToUse);
            }, driver);
        };

        /* --> no session is given, so the operations in 'myFindUser' will run in their own session */
        await myFindUser(null);
        /* --> the existing session is given, so the operations in 'myFindUser' will run using this existing session */
        await myFindUser(session);
    },
    /* --> a neo4j driver is needed */
    driver
);
/* --> at this stage, the session will close */
```
As we can see, this helper is useful when we have to run multiple operations in a single session, but we want to easily allow an existing session to be used.

## Getting a transaction from a session

An existing session can be used to create a transaction.

```js
/* --> let 'session' be a session object, acquired by one of the above methods */
const transaction = session.beginTransaction();
/* --> this transaction can be used in more than one Neogma operations */
await Users.createOne(
    {
        id: '1',
        name: 'John'
    },
    {
        session: transaction
    }
);
await Users.findOne({
    session: transaction
});
/* --> commit the transaction */
await transaction.commit(); // or .rollback() to roll it back
```

## Getting a transaction with the getTransaction helper
A transaction can also be obtained with the `getTransaction` helper. Its first parameter is an existing transaction or a session.
* If it's a transaction, it will be used as-is in the callback.
* Else, a new one will be created. If the first parameter is a session, it will be used to create the transaction.
Ιts second parameter is a callback with the transaction as the first parameter. 

After the callback is done, the transaction automatically gets commited and the session closes. In case an error is thrown, the transaction automatically gets rolled back.

If `getTransaction` calls are nested, the transaction will commit after all of them are done.
```js
await getTransaction(
    /* --> no transaction is passed, so a new one will be created */
    null,
    async (transaction) => {
        /* --> this transaction can be used in more than one Neogma operations */
        await Users.createOne(
            {
                id: '1',
                name: 'John'
            },
            {
                session: transaction
            }
        );

        /* --> getTransaction calls can be nested */
        await getTransaction(
            /* --> the existing transaction is used */
            transaction, 
            async (transactionToUse) => {
                /* --> we can perform multiple operations with this transaction */
                await Users.findAll({
                    session: transactionToUse
                });
                await Users.findOne({
                    session: transactionToUse
                });
                await queryRunner.run('RETURN 1 = 1', {}, transactionToUse);
            }
        );
    },
    /* --> a neo4j driver is needed */
    driver
);
/* --> at this stage, the transaction will be committed */
```
As we can see, this helper is useful when we have to run multiple operations in a single transaction, but we want to easily allow an existing transaction to be used.

## Getting a session or transaction with the getRunnable helper

The `getRunnable` helper can be used to acquire an existing transaction or session. If none is given, a new session will be created.

In case nothing is given:
```js
await getRunnable(
    /* --> no runnable is passed, so a new session will be created */
    null,
    async (session) => {
        await queryRunner.run('RETURN 1 = 1', {}, session);
    },
    /* --> a neo4j driver is needed */
    driver
);
```

In case a session is given:
```js
await getRunnable(
    /* --> no runnable is passed, so a new session will be created */
    null,
    async (session) => {
        await queryRunner.run('RETURN 1 = 1', {}, session);

        await getRunnable(
            /* --> a session is passed, so it will be used */
            session,
            async (sessionToUse) => {
                /* --> this runs in the same session as the other query */
                await queryRunner.run('RETURN 1 = 1', {}, sessionToUse);
            },
            driver
        );
    },
    driver
);
```

In case a transaction is given:
```js
/* --> let's create a transaction */
await getTransaction(
    null,
    async (transaction) => {
        await queryRunner.run('RETURN 1 = 1', {}, transaction);

        await getRunnable(
            /* --> a transaction is passed, so it will be used */
            transaction,
            async (transactionToUse) => {
                /* --> this runs in the same transaction as the other query */
                await queryRunner.run('RETURN 1 = 1', {}, transactionToUse);
            },
            driver
        );
    },
    driver
);
```

As we can see, this helper gives us flexibility when we want to run queries no matter in a session or transaction, depending on what was given in parameters.

## Using neogma instance wrappers for these functions

A `neogma` instance also provides a wrapper of those functions, with the last parameter (the driver) being omitted.

```js
await neogma.getSession(null, async (session) => {
    await Users.findOne({
        session
    });
});

await neogma.getTransaction(null, async (transaction) => {
    await Users.findOne({
        session: transaction
    });
});

await neogma.getRunnable(null, async (session) => {
    await Users.findOne({
        session
    });
});
```

> :ToCPrevNext