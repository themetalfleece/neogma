import { randomUUID as uuid } from 'crypto';

import type { ModelRelatedNodesI, NeogmaInstance } from '../testHelpers';
import { closeNeogma, getNeogma, ModelFactory } from '../testHelpers';

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('createMany', () => {
  it('asserts created relationships by where', async () => {
    const neogma = getNeogma();

    type OrderAttributesI = {
      id: string;
    };
    interface OrdersRelatedNodesI {
      Parent: ModelRelatedNodesI<
        { createOne: (typeof Orders)['createOne'] },
        OrdersInstance,
        {
          Rating: number;
        }
      >;
    }

    type OrdersInstance = NeogmaInstance<
      OrderAttributesI,
      OrdersRelatedNodesI,
      object
    >;

    const Orders = ModelFactory<OrderAttributesI, OrdersRelatedNodesI>(
      {
        label: 'Order',
        schema: {
          id: {
            type: 'string',
            required: true,
          },
        },
        relationships: {
          Parent: {
            direction: 'out',
            model: 'self',
            name: 'PARENT',
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    const existingOrders = await Orders.createMany([
      {
        id: uuid(),
      },
      {
        id: uuid(),
      },
    ]);

    const withAssociationsCreateManyData: Parameters<
      typeof Orders.createMany
    >[0] = [
      {
        id: uuid(),
        Parent: {
          properties: [
            {
              id: uuid(),
              Parent: {
                where: {
                  params: {
                    id: existingOrders[0].id,
                  },
                },
              },
            },
            {
              id: uuid(),
              Parent: {
                properties: [
                  {
                    id: uuid(),
                  },
                ],
                where: {
                  params: {
                    id: existingOrders[0].id,
                  },
                },
              },
            },
            {
              id: uuid(),
            },
          ],
          where: {
            params: {
              id: existingOrders[1].id,
            },
          },
        },
      },
    ];

    await Orders.createMany(withAssociationsCreateManyData, {
      assertRelationshipsOfWhere: 3,
    });

    await expect(
      Orders.createMany(withAssociationsCreateManyData, {
        assertRelationshipsOfWhere: 4,
      }),
    ).rejects.toBeTruthy();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('createMany type safety', () => {
  it('returns array of correctly typed instances', async () => {
    const neogma = getNeogma();

    type OrderAttributesI = {
      id: string;
      name: string;
    };

    const Orders = ModelFactory<OrderAttributesI, object>(
      {
        label: 'Order',
        schema: {
          id: { type: 'string', required: true },
          name: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
      },
      neogma,
    );

    const ordersData = [
      { id: uuid(), name: 'Order 1' },
      { id: uuid(), name: 'Order 2' },
    ];

    const orders = await Orders.createMany(ordersData);

    expect(orders).toHaveLength(2);

    // Type tests: valid property access should compile
    const _id: string = orders[0].id;
    const _name: string = orders[0].name;
    expect(_id).toBe(ordersData[0].id);
    expect(_name).toBe(ordersData[0].name);

    // Instance methods should be available
    expect(orders[0].getDataValues()).toEqual(ordersData[0]);

    // @ts-expect-error - 'nonExistent' is not a valid property
    void orders[0].nonExistent;
  });
});
