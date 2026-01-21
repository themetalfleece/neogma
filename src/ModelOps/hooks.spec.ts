import { randomUUID as uuid } from 'crypto';
import { ModelFactory, ModelRelatedNodesI, NeogmaInstance } from '.';
import { QueryBuilder } from '../Queries';
import { QueryRunner } from '../Queries/QueryRunner';
import { closeNeogma, getNeogma } from './testHelpers';

const { getResultProperties } = QueryRunner;

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('beforeCreate', () => {
  it('mutates data on save', async () => {
    const neogma = getNeogma();

    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    type UsersRelatedNodesI = object;
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
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    Users.beforeCreate = (user) => {
      if (!user.age) {
        user.age = 18;
      }
    };

    const userId = uuid();

    const user = Users.build({
      id: userId,
      name: 'User' + Math.random(),
    });

    await user.save();

    const userInDbResult = await neogma.queryRunner.run(
      `MATCH (n:User {id: $id}) RETURN n`,
      { id: userId },
    );

    const userInDbData = getResultProperties<UserAttributesI>(
      userInDbResult,
      'n',
    )[0];

    expect(userInDbData.age).toBe(18);
  });

  it('mutates data before related nodes are created', async () => {
    const neogma = getNeogma();

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

    const orderId = uuid();
    const userId = uuid();
    const orderName = 'Order' + Math.random();

    Users.beforeCreate = (user) => {
      user.age = (user.age || 0) + 2;
    };

    Orders.beforeCreate = (order) => {
      order.name = orderName;
    };

    await Users.createMany([
      {
        id: userId,
        name: 'User' + Math.random(),
        // after beforeCreate, it should be positive and the validation should succeed
        age: -1,
        Orders: {
          properties: [
            {
              id: orderId,
              name: 'to be changed',
              Rating: 5,
            },
          ],
        },
      },
    ]);

    const userInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const userInDbData = getResultProperties<UserAttributesI>(
      userInDbResult,
      'n',
    )[0];

    expect(userInDbData.age).toBe(1);

    const orderInDbResult = await new QueryBuilder()
      .match({
        model: Orders,
        identifier: 'n',
        where: {
          id: orderId,
        },
      })
      .return('n')
      .run();

    const orderInDbData = getResultProperties<OrderAttributesI>(
      orderInDbResult,
      'n',
    )[0];

    expect(orderInDbData.name).toBe(orderName);
  });
});

describe('beforeDelete', () => {
  it('runs before a node is deleted', async () => {
    const neogma = getNeogma();

    type UserAttributesI = {
      name: string;
      age?: number;
      id: string;
    };

    type UsersRelatedNodesI = object;
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
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    let beforeDeleteUserId = '';

    Users.beforeDelete = (user) => {
      beforeDeleteUserId = user.id;
    };

    const userId = uuid();

    const user = Users.build({
      id: userId,
      name: 'User' + Math.random(),
    });

    await user.save();

    await user.delete();

    expect(beforeDeleteUserId).toBe(userId);
  });
});
