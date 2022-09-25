# Defining a Model

## Importing Neogma
To avoid importing issues, The instance of the "Neogma" class (refered to as "neogma" in those examples) must exported before any Model is imported.

For example, in `App.ts`:
```ts
import { Neogma } from 'neogma';
export const neogma = new Neogma(...);
import { SomeModel } from './MyModel';
```
In `MyModel.ts`
```ts
import { neogma } from './App';
```

## Using ModelFactory
To define a Model, the information presented at [Overview](./Overview) must be provided.

For the schema, [revalidator](https://github.com/flatiron/revalidator) is used. Its documentation is applied as-is for defining validating the properties of the nodes of this Model.

A sample Model definition with all configuration options is the following. Note that when using Typescript, to enable proper typing, some interfaces need to be provided.

> :Tabs
> > :Tab title=Javascript
> > ```js
> > const Users = ModelFactory({
> >     /* --> the label that the nodes of this Model have. For multiple labels, an array can be provided like ['User', 'New'] */
> >     label: 'User',
> >     /* --> The properties of the nodes of this Model and the validation for them. This follows the revalidator schema configuration */
> >     schema: {
> >         name: {
> >             type: 'string',
> >             minLength: 3,
> >             required: true
> >         },
> >         age: {
> >             type: 'number',
> >             minimum: 0,
> >         },
> >         id: {
> >             type: 'string',
> >             required: true,
> >         }
> >     },
> >     /* --> all the possible relationships (with other Models or itself), for relationship-related functions to work properly */
> >     relationships: {
> >         /* --> an arbitrary alias to be used for identifying this relationship when using the relationship-related functions */
> >         Orders: {
> >             /* --> reference to the Orders Model. For reference to this model, the value 'self' can be used */
> >             model: Orders,
> >             /* --> the direction of the relationship. Valid values are 'in' | 'out' | 'none' */
> >             direction: 'out',
> >             /* --> the name of this relationship */
> >             name: 'CREATES',
> >             /* --> properties of the relationship between the nodes */
> >             properties: {
> >                 /* --> the key to be used that the property is a relationship property */
> >                 Rating: {
> >                     /* --> the actual property to be created in the relationship */
> >                     property: 'rating',
> >                     /* --> schema validation for it */
> >                     schema: {
> >                         type: 'number',
> >                     },
> >                 },
> >             }
> >         }
> >     },
> >     /* --> (optional) the key to be used as a unique identifier, which enables some Instance methods */
> >     primaryKeyField: 'id',
> >     /* --> (optional) statics to be added to the Model. In this example, can be called using `Users.foo()` */
> >     statics: {
> >         foo: () => {
> >             return 'foo';
> >         }
> >     },
> >     /* --> (optional) methods to be added to the Instance of this Model. In this example, they can be called on a Users Instance using `user.bar()` */
> >     methods: {
> >         bar: function() {
> >             /* --> returns the id of this node */
> >             return this.id;
> >         }
> >     }
> > }, neogma); // <-- the neogma instance is used
> > /* --> relationships can also be defined after the model definition, to avoid potential circular references */
> > /* --> The same param as "relationships" is used */
> > Users.addRelationships({
> >     /* --> Orders can be defined either here or in the "relationships" param. Choose one! */
> >     Orders: {...}
> > });
> > /* --> statics can also be defined after the model definition, to avoid potential circular references. It should be defined either here or in the statics param. Choose one! */
> > Users.foo = function () {
> >     return 'foo';
> >};
> > /* --> methods can also be defined after the model definition, to avoid potential circular references. It should be defined either here or in the methods param. Choose one! */
> > Users.prototype.bar = function () {
> >     return this.id;
> >};
> >
> > ```
>
> > :Tab title=Typescript
> > ```ts
> > 
> > /* --> the interface of the properties of the Instance (properties of the node). They match the schema definition */
> > type UserPropertiesI = {
> >     name: string,
> >     age?: number,
> >     id: string,
> > };
> > 
> > /* --> the interface for the related Models. The keys are the arbitrary aliases of the relationships */
> > interface UsersRelatedNodesI {
> >     Orders: ModelRelatedNodesI<
> >         /* --> the related Model */
> >         typeof Orders, /* --> when refering to the same Model that is currently being defined, this line must be replaced with `{ createOne: typeof Orders["createOne"] }` */
> >         /* --> the type of the Instance of the related Model. It should have a definition to correspond to `UsersInstance`, as defined below */
> >         OrdersInstance,
> >         /* --> (optional) the interface of the relationship properties, which will be used while creating the relationship. The keys are the aliases to be used to indicate that the property refers to a relationship property */
> >         {
> >             Rating: number
> >         },
> >         /* --> (optional) the interface of the relationship properties, as they are in the database. The keys are the actual property names */
> >         {
> >             rating: number
> >         }
> >      >
> > }
> >
> > /* --> (optional) types for the methods of the Instance. This has to be defined only if methods are used */
> > interface MethodsI {
> >     /* --> 'this' needs to be cast as the Instance of this Model (in this example, it is defined a few lines below) */
> >     bar: (this: UsersInstance) => string
> > }
> >
> > /* --> (optional) types for the statics of the Model. This has to be defined only if statics are used */
> > interface StaticsI {
> >     foo: () => string
> > }
> >
> > /* --> the type of the Instance of this Model. Its generics are interfaces that are defined in this file */
> > type UsersInstance = NeogmaInstance<UserPropertiesI, UsersRelatedNodesI, MethodsI>;
> >
> > const Users = ModelFactory<
> >     UserPropertiesI,
> >     UsersRelatedNodesI,
> >     StaticsI, // --> optional, needed only if they are defined
> >     MethodsI // --> optional, needed only if they are defined
> >     > (
> >     {
> >     /* --> the label that the nodes of this Model have. For multiple labels, an array can be provided like ['User', 'New'] */
> >     label: 'User',
> >     /* --> The properties of the nodes of this Model and the validation for them. This follows the revalidator schema configuration */
> >     schema: {
> >         name: {
> >             type: 'string',
> >             minLength: 3,
> >             required: true
> >         },
> >         age: {
> >             type: 'number',
> >             minimum: 0,
> >         },
> >         id: {
> >             type: 'string',
> >             required: true,
> >         }
> >     },
> >     /* --> all the possible relationships (with other Models or itself), for relationship-related functions to work properly */
> >     relationships: {
> >        /* --> an arbitrary alias to be used for identifying this relationship when using the relationship-related functions. It must be a key of UsersRelatedNodesI */
> >        Orders: {
> >             /* --> reference to the Orders Model. For reference to this model, the value 'self' can be used */
> >             model: Orders,
> >             /* --> the direction of the relationship. Valid values are 'in' | 'out' | 'none' */
> >             direction: 'out',
> >             /* --> the name of this relationship */
> >             name: 'CREATES',
> >             /* --> (optional) properties of the relationship between the nodes */
> >             properties: {
> >                 /* --> the key to be used that the property is a relationship property */
> >                 Rating: {
> >                     /* --> the actual property to be created in the relationship (a key of of fourth generic of ModelRelatedNodesI, if given) */
> >                     property: 'rating',
> >                     /* --> schema validation for it */
> >                     schema: {
> >                         type: 'number',
> >                     },
> >                 },
> >             }
> >         },
> >     },
> >     /* --> (optional) the key to be used as a unique identifier, which enables some Instance methods */
> >     primaryKeyField: 'id',
> >     /* --> (optional) statics to be added to the Model. In this example, can be called using `Users.foo()` */
> >     statics: {
> >         foo: () => {
> >             return 'foo';
> >         }
> >     },
> >     /* --> (optional) methods to be added to the Instance of this Model. In this example, they can be called on a Users Instance using `user.bar()` */
> >     methods: {
> >         bar: function() {
> >             /* --> returns the name of this node with a friendly text */
> >             return 'The name of this user is: ' + this.name;
> >         }
> >     }
> > }, neogma); // <-- the neogma instance is used
> > /* --> relationships can also be defined after the model definition, to avoid potential circular references */
> > /* --> The same param as "relationships" is used */
> > Users.addRelationships({
> >     /* --> Orders can be defined either here or in the "relationships" param. Choose one! */
> >     Orders: {...}
> > });
> > /* --> statics can also be defined after the model definition, to avoid potential circular references. It should be defined either here or in the statics param. Choose one! */
> > Users.foo = function () {
> >     return 'foo';
> >};
> > /* --> methods can also be defined after the model definition, to avoid potential circular references. It should be defined either here or in the methods param. Choose one! */
> > Users.prototype.bar = function (
> >     /* --> "this" must be cast as an Instance for proper typings */
> >     this: UsersInstance
> >) {
> >     return this.id;
> >};
> > ```
> >

> :Buttons
> > :CopyButton

## Relating a Model to itself
Instead of providing a Model to a relationship `model` field, the string `"self"` can be given to relate a Model to itself:
```ts
...
relationships: {
   Orders: {
        model: 'self',
...
```

## Using the Model's helpers
The created Model provides functions for database operations, as well as the following helpers
```js
    /* --> by providing an alias, gets the relationship configuration (model, direction, name, properties) */
    Users.getRelationshipConfiguration('Orders'); // --> { model: Orders, direction: 'out', name: 'CREATES', properties: {...} }
    /* --> by providing an alias, gets the relationship information (model, direction, name). It's similar to getRelationshipConfiguration but it doesn't return "properties", so it's safe to use in QueryBuilder */
    Users.getRelationshipByAlias('Orders'); // --> { model: Orders, direction: 'out', name: 'CREATES'}
    /* --> by providing an alias, reverses the configuration of the relationship, so it's perfectly duplicated when definition the same relationship at the other model (here Orders) */
    Users.reverseRelationshipConfiguration('Orders');  // --> { model: Users, direction: 'in', name: 'CREATES', properties: {...} }
    /* --> gets the primaryKeyField provided when defining the Model */
    Users.getPrimaryKeyField(); // --> id
    /* --> gets a name which is generated by the Model labels */
    Users.getModelName(); // --> Users
    /* --> gets the labels of this model as provided in its definition */
    AdminUsers.getRawLabels(); // --> ['Admin', 'User']
    /* --> gets the labels of this model, to be used in a query. Wrapper for QueryRunner.getNormalizedLabels */
    AdminUsers.getLabel(); // --> `Admin`:`User`
    /* --> getting a Model by its name by using the neogma instance */
    neogma.modelsByName['Users'];
```

The `ModelRelatedNodesI` equals to the following:
```ts
{
    /** interface of the actual properties of the relationship (as given in the fourth generic) */
    RelationshipProperties: object;
    /** interface of the properties of the relationship used in create functions (as given in the third generic) */
    CreateRelationshipProperties: object;
    /** the instance of the related model (as given in the second generic) */
    Instance: object;
    /* --> the type of the data to create */
    CreateData: object;
}
```

For example, after fetching a relationship from the database, its properties can be typed like this:
```ts
// let "queryResult" be the result of a raw query
const relationshipProperties: UsersRelatedNodesI['Orders']['RelationshipProperties'] = queryResult.records[0].get('n').properties;
```

## Declaring bidirectional relationships
If a relationship from Model A to Model B is declared, the reverse relationship from Model B to Model A can be declared, but not directly. In order to avoid circular dependencies, it should be added after all models are declared, using the `Model.addRelationships` static. Follow [this issue](https://github.com/themetalfleece/neogma/issues/34#issuecomment-945848665) for more information.

```ts
ModelB.addRelationships({
    NewAlias: ModelA.reverseRelationshipConfiguration('OtherAlias'),
});
```

> :ToCPrevNext