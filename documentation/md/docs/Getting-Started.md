# Getting Started

## Installing

> :Tabs
> > :Tab title=npm
> > ```bash
> > npm i neogma
> > ```
>
> > :Tab title=yarn
> > ```bash
> > yarn add neogma
> > ```
>
> > :Tab title=pnpm
> > ```bash
> > pnpm i neogma
> > ```
## Importing

The used classes and functions can be imported as follows:

> :Tabs
> > :Tab title=import
> > ```ts
> > import { BindParam, ModelFactory, Neogma, QueryBuilder, QueryRunner, Where, Literal, getSession, Op, neo4jDriver } from 'neogma';
> > // importing types
> > import { 
> >     /* --> used in Model definition */
> >     ModelRelatedNodesI, 
> >     NeogmaInstance, 
> >     /* --> all possible neo4j types which can be used in Models */
> >     Neo4jSupportedTypes 
> > } from 'neogma';
> > ```
>
> > :Tab title=require
> > ```js
> > const { BindParam, ModelFactory, Neogma, QueryBuilder, QueryRunner, Where, Literal, getSession, Op, neo4jDriver } = require('neogma');
> > ```

The `neo4jDriver` exports everything from the `neo4j-driver` package, including types, validators, etc:
```js
/* --> validator */
neo4jDriver.Date();
/* --> type contructor */
neo4jDriver.types.DateTime();
/* --> typescript interface */
neo4jDriver.Point;
```

## Initializing
To get started, a Neogma instance needs to be initialized
```js
const neogma = new Neogma(
    {
        url: 'bolt://localhost:7687',
        username: 'neo4j',
        password: 'password',
        /* --> (optional) the database to be used by default for sessions */
        database: 'myDb',
    },
    {
        /* --> (optional) logs every query that Neogma runs, using the given function */
        logger: console.log, 
        /* --> any driver configuration can be used */
        encrypted: true,
    }
);
```
> :Buttons
> > :CopyButton

This instance must be used when defining [Models](./Models/Overview).

### Verify connectivity

You can run
```js
await neogma.verifyConnectivity();
```

If there is a connectivity error in either the neogma initialization, or with `verifyConnectivity`, a `NeogmaConnectivityError` error will be thrown.

## Utilities
It also has the neo4j Driver and a [QueryRunner](./QueryRunner/Overview) instance. For more information about how to run your own queries and other non-model operations, refer to its documentation.

```js
/* --> gets the neo4j driver */
const driver = neogma.driver;
/* --> gets the QueryRunner instance used by this neogma instance */
const queryRunner = neogma.queryRunner;
/* --> wrapper for getSession */
const getSession = neogma.getSession; // @see [Sessions](./Sessions)
/* --> the defined Models by their names */
const modelsByName = neogma.modelsByName; // @see [Defining a Model](./Models/Defining-a-Model)
```

> :ToCPrevNext