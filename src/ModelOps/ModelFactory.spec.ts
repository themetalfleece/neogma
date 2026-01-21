import { randomUUID as uuid } from 'crypto';
// Import from Queries index first to ensure proper module initialization
import { QueryRunner } from '../Queries';
import { NeogmaModel } from '../index';
import { Neogma } from '../Neogma';
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
type OrdersRelatedNodesI = object;
type OrdersMethodsI = object;
type OrdersStaticsI = object;

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

type UsersMethodsI = object;

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

    type UsersMethodsI = object;
    type UsersStaticsI = object;

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
