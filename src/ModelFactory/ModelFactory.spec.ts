import { randomUUID as uuid } from 'crypto';

import { NeogmaModel } from '../index';
import { Neogma } from '../Neogma';
// Import from Queries index first to ensure proper module initialization
import { QueryRunner } from '../QueryRunner';
import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from '.';

const { getResultProperties } = QueryRunner;

let neogma: Neogma;

beforeAll(async () => {
  neogma = new Neogma({
    url: process.env.NEO4J_URL ?? '',
    username: process.env.NEO4J_USERNAME ?? '',
    password: process.env.NEO4J_PASSWORD ?? '',
  });

  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await neogma.driver.close();
});

type OrderAttributesI = {
  name: string;
  id: string;
};
interface OrdersRelatedNodesI {}
interface OrdersMethodsI {}
interface OrdersStaticsI {}

type OrdersInstance = NeogmaInstance<
  OrderAttributesI,
  OrdersRelatedNodesI,
  OrdersMethodsI
>;

let Orders: NeogmaModel<
  OrderAttributesI,
  OrdersRelatedNodesI,
  OrdersMethodsI,
  OrdersStaticsI
>;

type UserAttributesI = {
  name: string;
  age?: number;
  id: string;
};

interface UsersRelatedNodesI {
  Orders: ModelRelatedNodesI<
    typeof Orders,
    OrdersInstance,
    {
      Rating: number;
    },
    {
      rating: number;
    }
  >;
}

interface UsersMethodsI {}

interface UsersStaticsI {
  foo: () => string;
}

let Users: NeogmaModel<
  UserAttributesI,
  UsersRelatedNodesI,
  UsersMethodsI,
  UsersStaticsI
>;

describe('ModelFactory', () => {
  it('defines a simple Model', () => {
    Orders = ModelFactory<
      OrderAttributesI,
      OrdersRelatedNodesI,
      OrdersStaticsI,
      OrdersMethodsI
    >(
      {
        label: 'Order',
        schema: {
          name: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: [],
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    expect(Orders).toBeTruthy();
  });

  it('defines a 2 associated Models', () => {
    Users = ModelFactory<
      UserAttributesI,
      UsersRelatedNodesI,
      UsersStaticsI,
      UsersMethodsI
    >(
      {
        label: 'User',
        schema: {
          name: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          age: {
            type: 'number',
            minimum: 0,
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  minimum: 1,
                  maximum: 5,
                  required: true,
                },
              },
            },
          },
        },
        primaryKeyField: 'id',
        statics: {
          foo: () => {
            return 'foo';
          },
        },
        methods: {
          bar() {
            return 'The name of this user is: ' + this.name;
          },
        },
      },
      neogma,
    );

    expect(Orders).toBeTruthy();
    expect(Users).toBeTruthy();
  });

  it('defines prototype methods', () => {
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    interface OrdersMethodsI {
      foo: () => string;
    }

    const Orders = ModelFactory<
      OrderAttributesI,
      object,
      object,
      OrdersMethodsI
    >(
      {
        label: 'Order',
        schema: {
          name: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    Orders.prototype.foo = () => 'bar';

    const order = Orders.build({
      id: uuid(),
      name: uuid(),
    });

    expect(order.foo()).toBe('bar');

    expect(Orders).toBeTruthy();
  });
});

describe('addRelationships', () => {
  it('adds a relationship after the Model definition', async () => {
    /* Orders */
    type OrderAttributesI = {
      name: string;
      id: string;
    };

    type OrdersRelatedNodesI = object;
    type OrdersMethodsI = object;
    type OrdersStaticsI = object;

    type OrdersInstance = NeogmaInstance<
      OrderAttributesI,
      OrdersRelatedNodesI,
      OrdersMethodsI
    >;

    const Orders = ModelFactory<
      OrderAttributesI,
      OrdersRelatedNodesI,
      OrdersStaticsI,
      OrdersMethodsI
    >(
      {
        label: 'Order',
        schema: {
          name: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    /* Users */
    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    interface UsersRelatedNodesI {
      Orders: ModelRelatedNodesI<
        typeof Orders,
        OrdersInstance,
        {
          Rating: number;
        },
        {
          rating: number;
        }
      >;
      MoreOrders: ModelRelatedNodesI<
        typeof Orders,
        OrdersInstance,
        { More: boolean },
        { more: boolean }
      >;
    }

    interface UsersMethodsI {}
    interface UsersStaticsI {}

    const Users = ModelFactory<
      UserAttributesI,
      UsersRelatedNodesI,
      UsersStaticsI,
      UsersMethodsI
    >(
      {
        label: 'User',
        schema: {
          name: {
            type: 'string',
            minLength: 3,
            required: true,
          },
          age: {
            type: 'number',
            minimum: 0,
            required: false,
          },
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
            properties: {
              Rating: {
                property: 'rating',
                schema: {
                  type: 'number',
                  minimum: 0,
                  maximum: 5,
                  required: true,
                },
              },
            },
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    Users.addRelationships({
      MoreOrders: {
        direction: 'in',
        model: Orders,
        name: 'MORE',
        properties: {
          More: {
            property: 'more',
            schema: {
              type: 'boolean',
              required: true,
            },
          },
        },
      },
    });

    // create a user node and associate it with both associations
    const userWithOrdersData: Parameters<(typeof Users)['createOne']>[0] = {
      id: uuid(),
      name: 'User',
      MoreOrders: {
        properties: [
          {
            id: uuid(),
            name: 'More Order',
            More: true,
          },
        ],
      },
      Orders: {
        properties: [
          {
            id: uuid(),
            name: 'Order',
            Rating: 4,
          },
        ],
      },
    };
    await Users.createOne(userWithOrdersData);

    const userInDbResult = await neogma.queryRunner.run(
      `MATCH (n:User {id: $id}) RETURN n`,
      { id: userWithOrdersData.id },
    );
    const userInDbData = getResultProperties<typeof userWithOrdersData>(
      userInDbResult,
      'n',
    )[0];
    expect(userInDbData).toBeTruthy();
    expect(userInDbData.id).toEqual(userWithOrdersData.id);
    expect(userInDbData.name).toEqual(userWithOrdersData.name);

    const orderData = userWithOrdersData.Orders!.properties![0];
    const orderInDbResult = await neogma.queryRunner.run(
      `MATCH (n:Order {id: $id}) RETURN n`,
      { id: orderData.id },
    );
    const orderInDbData = getResultProperties<typeof orderData>(
      orderInDbResult,
      'n',
    )[0];
    expect(orderInDbData).toBeTruthy();
    expect(orderInDbData.id).toEqual(orderData.id);
    expect(orderInDbData.name).toEqual(orderData.name);

    const moreOrderData = userWithOrdersData.MoreOrders!.properties![0];
    const moreOrderInDbResult = await neogma.queryRunner.run(
      `MATCH (n:Order {id: $id}) RETURN n`,
      { id: moreOrderData.id },
    );
    const moreOrderInDbData = getResultProperties<typeof moreOrderData>(
      moreOrderInDbResult,
      'n',
    )[0];
    expect(moreOrderInDbData).toBeTruthy();
    expect(moreOrderInDbData.id).toEqual(moreOrderData.id);
    expect(moreOrderInDbData.name).toEqual(moreOrderData.name);

    const userOrderRelationshipResult = await neogma.queryRunner.run(
      `MATCH (o:Order {id: $orderId})<-[r:CREATES]-(u:User {id: $userId}) RETURN r`,
      {
        orderId: orderData.id,
        userId: userWithOrdersData.id,
      },
    );
    const userOrderRelationshipData = getResultProperties<{
      rating: number;
    }>(userOrderRelationshipResult, 'r')[0];
    expect(userOrderRelationshipData).toBeTruthy();
    expect(userOrderRelationshipData.rating).toBe(4);

    const userModeOrderRelationshipResult = await neogma.queryRunner.run(
      `MATCH (o:Order {id: $orderId})-[r:MORE]->(u:User {id: $userId}) RETURN r`,
      {
        orderId: moreOrderData.id,
        userId: userWithOrdersData.id,
      },
    );
    const userModeOrderRelationshipData = getResultProperties<{
      more: boolean;
    }>(userModeOrderRelationshipResult, 'r')[0];
    expect(userModeOrderRelationshipData).toBeTruthy();
    expect(userModeOrderRelationshipData.more).toBe(true);
  });
});

describe('methods this context', () => {
  it('this has access to instance properties', async () => {
    type PersonAttributesI = {
      name: string;
      age: number;
      id: string;
    };

    interface PersonMethodsI {
      getFullInfo: () => string;
      getAgeNextYear: () => number;
    }

    const Persons = ModelFactory<
      PersonAttributesI,
      object,
      object,
      PersonMethodsI
    >(
      {
        label: 'Person',
        schema: {
          name: { type: 'string', required: true },
          age: { type: 'number', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          getFullInfo() {
            // this.name and this.age should be properly typed
            return `${this.name} is ${this.age} years old`;
          },
          getAgeNextYear() {
            return this.age + 1;
          },
        },
      },
      neogma,
    );

    const person = Persons.build({
      id: uuid(),
      name: 'John',
      age: 30,
    });

    expect(person.getFullInfo()).toBe('John is 30 years old');
    expect(person.getAgeNextYear()).toBe(31);
  });

  it('this has access to instance methods', async () => {
    type ItemAttributesI = {
      title: string;
      id: string;
    };

    interface ItemMethodsI {
      getTitleFromDataValues: () => string;
    }

    const Items = ModelFactory<ItemAttributesI, object, object, ItemMethodsI>(
      {
        label: 'Item',
        schema: {
          title: { type: 'string', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          getTitleFromDataValues() {
            // this.getDataValues() should be accessible
            const data = this.getDataValues();
            return data.title;
          },
        },
      },
      neogma,
    );

    const item = Items.build({
      id: uuid(),
      title: 'My Item',
    });

    expect(item.getTitleFromDataValues()).toBe('My Item');
  });

  it('this has access to __existsInDatabase flag', () => {
    type FlagTestAttributesI = {
      id: string;
    };

    interface FlagTestMethodsI {
      checkIfNew: () => boolean;
    }

    const FlagTests = ModelFactory<
      FlagTestAttributesI,
      object,
      object,
      FlagTestMethodsI
    >(
      {
        label: 'FlagTest',
        schema: {
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          checkIfNew() {
            // this.__existsInDatabase should be accessible
            return !this.__existsInDatabase;
          },
        },
      },
      neogma,
    );

    const flagTest = FlagTests.build({ id: uuid() });
    expect(flagTest.checkIfNew()).toBe(true);
  });

  it('this has access to changed tracking', () => {
    type ChangeTrackAttributesI = {
      value: string;
      id: string;
    };

    interface ChangeTrackMethodsI {
      hasValueChanged: () => boolean;
    }

    const ChangeTrackers = ModelFactory<
      ChangeTrackAttributesI,
      object,
      object,
      ChangeTrackMethodsI
    >(
      {
        label: 'ChangeTracker',
        schema: {
          value: { type: 'string', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          hasValueChanged() {
            // this.changed should be accessible
            return this.changed.value;
          },
        },
      },
      neogma,
    );

    const tracker = ChangeTrackers.build({ id: uuid(), value: 'initial' });
    expect(tracker.hasValueChanged()).toBe(true); // New instances have all fields marked as changed
  });

  it('methods can call other custom methods via this', () => {
    type ChainAttributesI = {
      base: number;
      id: string;
    };

    interface ChainMethodsI {
      double: () => number;
      quadruple: () => number;
    }

    const Chains = ModelFactory<
      ChainAttributesI,
      object,
      object,
      ChainMethodsI
    >(
      {
        label: 'Chain',
        schema: {
          base: { type: 'number', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          double() {
            return this.base * 2;
          },
          quadruple() {
            // Call another custom method
            return this.double() * 2;
          },
        },
      },
      neogma,
    );

    const chain = Chains.build({ id: uuid(), base: 5 });
    expect(chain.double()).toBe(10);
    expect(chain.quadruple()).toBe(20);
  });
});

/**
 * Type-level tests for methods this context.
 * These tests verify TypeScript correctly types 'this' in method definitions.
 * The StrictNeogmaInstance type removes index signatures to ensure proper type checking.
 */
describe('methods this context type safety', () => {
  it('this does not allow access to non-existent properties', () => {
    type LimitedAttributesI = {
      existing: string;
      id: string;
    };

    interface LimitedMethodsI {
      tryAccess: () => string;
    }

    ModelFactory<LimitedAttributesI, object, object, LimitedMethodsI>(
      {
        label: 'Limited',
        schema: {
          existing: { type: 'string', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          tryAccess() {
            // Valid access - should compile
            const valid = this.existing;

            // @ts-expect-error - 'nonExistent' does not exist on the instance
            void this.nonExistent;

            return valid;
          },
        },
      },
      neogma,
    );
  });

  it('this enforces correct property types', () => {
    type StrictTypesAttributesI = {
      count: number;
      active: boolean;
      id: string;
    };

    interface StrictTypesMethodsI {
      testTypes: () => void;
    }

    ModelFactory<StrictTypesAttributesI, object, object, StrictTypesMethodsI>(
      {
        label: 'StrictTypes',
        schema: {
          count: { type: 'number', required: true },
          active: { type: 'boolean', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          testTypes() {
            // Correct types - should compile
            void (this.count as number);
            void (this.active as boolean);

            // @ts-expect-error - count is number, not string
            void (this.count as string);

            // @ts-expect-error - active is boolean, not number
            void (this.active as number);
          },
        },
      },
      neogma,
    );
  });

  it('this is typed with instance properties', () => {
    type TypeTestAttributesI = {
      stringProp: string;
      numberProp: number;
      id: string;
    };

    interface TypeTestMethodsI {
      useProps: () => string;
    }

    // This should compile without errors - this.stringProp and this.numberProp are valid
    const Model = ModelFactory<
      TypeTestAttributesI,
      object,
      object,
      TypeTestMethodsI
    >(
      {
        label: 'TypeTest',
        schema: {
          stringProp: { type: 'string', required: true },
          numberProp: { type: 'number', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          useProps() {
            const s: string = this.stringProp;
            const n: number = this.numberProp;
            return `${s}-${n}`;
          },
        },
      },
      neogma,
    );

    // Verify runtime behavior
    const instance = Model.build({
      id: uuid(),
      stringProp: 'test',
      numberProp: 42,
    });
    expect(instance.useProps()).toBe('test-42');
  });

  it('this has correct types for optional properties', () => {
    type OptionalAttributesI = {
      required: string;
      optional?: number;
      id: string;
    };

    interface OptionalMethodsI {
      checkOptional: () => number | undefined;
      hasOptional: () => boolean;
    }

    const Model = ModelFactory<
      OptionalAttributesI,
      object,
      object,
      OptionalMethodsI
    >(
      {
        label: 'Optional',
        schema: {
          required: { type: 'string', required: true },
          optional: { type: 'number', required: false },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          checkOptional() {
            // this.optional should be number | undefined
            return this.optional;
          },
          hasOptional() {
            return this.optional !== undefined;
          },
        },
      },
      neogma,
    );

    // Test with optional property set
    const withOptional = Model.build({
      id: uuid(),
      required: 'test',
      optional: 10,
    });
    expect(withOptional.checkOptional()).toBe(10);
    expect(withOptional.hasOptional()).toBe(true);

    // Test without optional property
    const withoutOptional = Model.build({
      id: uuid(),
      required: 'test',
    });
    expect(withoutOptional.checkOptional()).toBeUndefined();
    expect(withoutOptional.hasOptional()).toBe(false);
  });

  it('this has access to built-in instance methods with correct types', () => {
    type BuiltInTestAttributesI = {
      data: string;
      id: string;
    };

    interface BuiltInTestMethodsI {
      getDataString: () => string;
      isNew: () => boolean;
      getLabelCount: () => number;
    }

    const Model = ModelFactory<
      BuiltInTestAttributesI,
      object,
      object,
      BuiltInTestMethodsI
    >(
      {
        label: 'BuiltInTest',
        schema: {
          data: { type: 'string', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          getDataString() {
            // this.getDataValues() should return BuiltInTestAttributesI
            const values = this.getDataValues();
            return values.data;
          },
          isNew() {
            // this.__existsInDatabase should be boolean
            return !this.__existsInDatabase;
          },
          getLabelCount() {
            // this.labels should be string[]
            return this.labels.length;
          },
        },
      },
      neogma,
    );

    const instance = Model.build({ id: uuid(), data: 'hello' });
    expect(instance.getDataString()).toBe('hello');
    expect(instance.isNew()).toBe(true);
    // Labels are empty for newly built instances (populated from database records)
    expect(instance.getLabelCount()).toBe(0);
  });

  it('this correctly infers property types for arithmetic operations', () => {
    type MathAttributesI = {
      value: number;
      multiplier: number;
      id: string;
    };

    interface MathMethodsI {
      calculate: () => number;
      increment: () => number;
    }

    const Model = ModelFactory<MathAttributesI, object, object, MathMethodsI>(
      {
        label: 'Math',
        schema: {
          value: { type: 'number', required: true },
          multiplier: { type: 'number', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          calculate() {
            // TypeScript correctly infers these as numbers
            return this.value * this.multiplier;
          },
          increment() {
            return this.value + 1;
          },
        },
      },
      neogma,
    );

    const instance = Model.build({ id: uuid(), value: 5, multiplier: 3 });
    expect(instance.calculate()).toBe(15);
    expect(instance.increment()).toBe(6);
  });

  it('this correctly handles string operations', () => {
    type StringAttributesI = {
      firstName: string;
      lastName: string;
      id: string;
    };

    interface StringMethodsI {
      getFullName: () => string;
      getInitials: () => string;
    }

    const Model = ModelFactory<
      StringAttributesI,
      object,
      object,
      StringMethodsI
    >(
      {
        label: 'StringTest',
        schema: {
          firstName: { type: 'string', required: true },
          lastName: { type: 'string', required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {
          getFullName() {
            // TypeScript correctly infers these as strings
            return `${this.firstName} ${this.lastName}`;
          },
          getInitials() {
            // String methods work correctly
            return this.firstName.charAt(0) + this.lastName.charAt(0);
          },
        },
      },
      neogma,
    );

    const instance = Model.build({
      id: uuid(),
      firstName: 'John',
      lastName: 'Doe',
    });
    expect(instance.getFullName()).toBe('John Doe');
    expect(instance.getInitials()).toBe('JD');
  });
});
