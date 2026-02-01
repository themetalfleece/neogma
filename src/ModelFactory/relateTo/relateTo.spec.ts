import { randomUUID as uuid } from 'crypto';

import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
import { QueryBuilder } from '../../QueryBuilder';
import { QueryRunner } from '../../QueryRunner';
import { Op } from '../../Where';
import type {
  ModelRelatedNodesI,
  NeogmaInstance,
  UsersRelatedNodesI,
} from '../testHelpers';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  ModelFactory,
  typeCheck,
} from '../testHelpers';

const { getResultProperties } = QueryRunner;

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('relateTo static', () => {
  it('relates two nodes of different models without relationship properties', async () => {
    const neogma = getNeogma();

    type OrderAttributesI = {
      name: string;
      id: string;
    };

    type OrdersInstance = NeogmaInstance<OrderAttributesI, object, object>;

    const Orders = ModelFactory<OrderAttributesI, object, object, object>(
      {
        label: 'Order',
        schema: {
          name: { type: 'string', minLength: 3, required: true },
          id: { type: 'string', required: true },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    type UserAttributesI = {
      name: string;
      id: string;
    };

    interface LocalUsersRelatedNodesI {
      Orders: ModelRelatedNodesI<typeof Orders, OrdersInstance>;
    }

    const Users = ModelFactory<UserAttributesI, LocalUsersRelatedNodesI>(
      {
        label: 'User',
        schema: {
          name: { type: 'string', minLength: 3, required: true },
          id: { type: 'string', required: true },
        },
        relationships: {
          Orders: {
            model: Orders,
            direction: 'out',
            name: 'CREATES',
          },
        },
        primaryKeyField: 'id',
        statics: {},
        methods: {},
      },
      neogma,
    );

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          { model: Users, where: { id: user.id } },
          { ...Users.getRelationshipByAlias('Orders'), identifier: 'rel' },
          { model: Orders, where: { id: order.id } },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<object>(queryRes, 'rel')[0];
    expect(relationshipData).toBeTruthy();
  });

  it('relates two nodes with relationship properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
      properties: { Rating: 4 },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          { model: Users, where: { id: user.id } },
          { ...Users.getRelationshipByAlias('Orders'), identifier: 'rel' },
          { model: Orders, where: { id: order.id } },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<{ rating: number }>(
      queryRes,
      'rel',
    )[0];
    expect(relationshipData.rating).toBe(4);
  });
});

describe('relateTo instance method', () => {
  it('relates instance to another node', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 3 },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          { model: Users, where: { id: user.id } },
          { ...Users.getRelationshipByAlias('Orders'), identifier: 'rel' },
          { model: Orders, where: { id: order.id } },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<
      UsersRelatedNodesI['Orders']['RelationshipProperties']
    >(queryRes, 'rel')[0];

    expect(relationshipData.rating).toBe(3);
  });

  it('relates two nodes of the same model (self)', async () => {
    const neogma = getNeogma();

    type UserAttributesI = {
      name: string;
      id: string;
    };

    interface LocalUsersRelatedNodesI {
      Parent: ModelRelatedNodesI<
        { createOne: (typeof Users)['createOne'] },
        LocalUsersInstance,
        { Rating?: number },
        { rating?: number }
      >;
    }

    type LocalUsersInstance = NeogmaInstance<
      UserAttributesI,
      LocalUsersRelatedNodesI
    >;

    const Users = ModelFactory<UserAttributesI, LocalUsersRelatedNodesI>(
      {
        label: 'User',
        schema: {
          name: { type: 'string', minLength: 3, required: true },
          id: { type: 'string', required: true },
        },
        relationships: {
          Parent: {
            model: 'self',
            direction: 'out',
            name: 'PARENT',
            properties: {
              Rating: {
                property: 'rating',
                schema: { type: 'number', required: false },
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

    const parent = await Users.createOne({ id: uuid(), name: uuid() });
    const child = await Users.createOne({ id: uuid(), name: uuid() });

    await child.relateTo({
      alias: 'Parent',
      where: { id: parent.id },
    });

    const queryRes = await new QueryBuilder()
      .match({
        related: [
          { model: Users, where: { id: child.id } },
          { ...Users.getRelationshipByAlias('Parent'), identifier: 'rel' },
          { model: Users, where: { id: parent.id } },
        ],
      })
      .return('rel')
      .run();

    const relationshipData = getResultProperties<object>(queryRes, 'rel')[0];
    expect(relationshipData).toBeTruthy();
  });

  it('throws if property validation fails', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // Rating must be between 1-5
    await expect(
      user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: -1 },
      }),
    ).rejects.toThrow();

    // Using wrong property name (database property instead of alias)
    await expect(
      user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: {
          // @ts-expect-error - 'rating' is the database property, should use 'Rating'
          rating: 5,
        },
      }),
    ).rejects.toThrow();
  });

  it('asserts created relationships count', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // Should succeed with correct assertion
    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 3 },
      assertCreatedRelationships: 1,
    });

    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });

    // Should fail with wrong assertion
    await expect(
      user.relateTo({
        alias: 'Orders',
        where: { id: order2.id },
        properties: { Rating: 3 },
        assertCreatedRelationships: 2,
      }),
    ).rejects.toThrow();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('relateTo type safety', () => {
  it('relateTo alias must be a valid relationship alias', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // Valid alias
    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
    });

    // Type test: invalid alias should cause TypeScript error at compile time
    await expect(
      user.relateTo({
        // @ts-expect-error - 'InvalidAlias' is not a valid relationship alias
        alias: 'InvalidAlias',
        where: { id: order.id },
      }),
    ).rejects.toThrow();
  });

  it('relateTo properties must match relationship properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // Valid property
    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
    });

    // Type test: invalid property should cause TypeScript error at compile time
    await expect(
      user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        // @ts-expect-error - 'InvalidProperty' is not a valid relationship property
        properties: { InvalidProperty: 5 },
      }),
    ).rejects.toThrow();
  });

  it('relateTo returns Promise<number>', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [, count] = await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
    });

    expect(typeof count).toBe('number');
  });
});

/**
 * Tests for the return option in relateTo.
 * relateTo always returns a tuple [relationships[], count].
 * When return is true, relationships[] is populated. When false/not specified, it's empty.
 */
describe('relateTo with return option', () => {
  it('returns populated relationships when return is true (static method)', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
      properties: { Rating: 4 },
      return: true,
    });

    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(1);
    expect(relationships[0].source.id).toBe(user.id);
    expect(relationships[0].target.id).toBe(order.id);
    expect(relationships[0].relationship.rating).toBe(4);
    expect(count).toBe(1);
  });

  it('returns populated relationships when return is true (instance method)', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [relationships, count] = await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 3 },
      return: true,
    });

    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(1);
    expect(relationships[0].source.id).toBe(user.id);
    expect(relationships[0].target.id).toBe(order.id);
    expect(relationships[0].relationship.rating).toBe(3);
    expect(count).toBe(1);
  });

  it('returns empty array and count when return is false', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
      properties: { Rating: 5 },
      return: false,
    });

    expect(relationships).toEqual([]);
    expect(count).toBe(1);
  });

  it('returns empty array and count when return is not specified', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
      properties: { Rating: 5 },
    });

    expect(relationships).toEqual([]);
    expect(count).toBe(1);
  });

  it('creates multiple relationships and returns all when return is true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });

    // Create relationships to both orders
    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: { [Op.in]: [order1.id, order2.id] } },
      },
      properties: { Rating: 5 },
      return: true,
    });

    expect(Array.isArray(relationships)).toBe(true);
    expect(relationships.length).toBe(2);
    expect(relationships.every((r) => r.source.id === user.id)).toBe(true);
    expect(relationships.every((r) => r.relationship.rating === 5)).toBe(true);
    expect(count).toBe(2);
  });

  it('works with assertCreatedRelationships when return is true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
      properties: { Rating: 4 },
      return: true,
      assertCreatedRelationships: 1,
    });

    expect(relationships.length).toBe(1);
    expect(count).toBe(1);
  });
});

/**
 * Type-level tests for the return option.
 * Return type is always a tuple [relationships[], count].
 */
describe('relateTo return option type safety', () => {
  it('return type is tuple [relationships[], number]', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // This should compile - return type should be tuple
    const [relationships, count] = await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
    });

    expect(Array.isArray(relationships)).toBe(true);
    expect(typeof count).toBe('number');
  });

  it('relationships array is populated when return is true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // This should compile - return type should be tuple with populated array
    const [relationships, count] = await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
      return: true,
    });

    // Access relationship properties - this should compile
    const rating: number = relationships[0].relationship.rating;
    expect(rating).toBe(5);

    // Access source and target - this should compile
    const sourceId: string = relationships[0].source.id;
    const targetId: string = relationships[0].target.id;
    expect(sourceId).toBe(user.id);
    expect(targetId).toBe(order.id);
    expect(count).toBe(1);
  });
});

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time
 * for both static and instance relateTo methods.
 */
describe('relateTo where type safety', () => {
  describe('static method (source/target where)', () => {
    it('accepts valid where parameters for source and target', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Valid: correct property names and types
      await Users.relateTo({
        alias: 'Orders',
        where: {
          source: { id: 'user-id', name: 'John' },
          target: { id: 'order-id', name: 'Order1' },
        },
        properties: { Rating: 5 },
      });

      // Valid: using operators with correct types
      await Users.relateTo({
        alias: 'Orders',
        where: {
          source: { id: { [Op.eq]: 'user-id' } },
          target: { name: { [Op.contains]: 'Order' } },
        },
        properties: { Rating: 5 },
      });

      expect(true).toBe(true);
    }, 30000);

    it('rejects invalid property names in source where clause', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: {
              id: 'valid',
              // @ts-expect-error - 'nam' is not a valid source property (typo)
              nam: 'John',
            },
            target: { id: 'order-id' },
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: {
              // @ts-expect-error - 'userId' is not a valid source property
              userId: 'test',
            },
            target: { id: 'order-id' },
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid property names in target where clause', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: { id: 'user-id' },
            target: {
              // @ts-expect-error - 'orderId' is not a valid target property
              orderId: 'test',
            },
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: { id: 'user-id' },
            target: {
              id: 'valid',
              // @ts-expect-error - 'nonExistent' is not a valid target property
              nonExistent: 'value',
            },
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types in source and target', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: {
              // @ts-expect-error - 'id' expects string, not number
              id: 123,
            },
            target: { id: 'order-id' },
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: { id: 'user-id' },
            target: {
              // @ts-expect-error - 'name' expects string, not boolean
              name: true,
            },
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types in operators', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: {
              // @ts-expect-error - Op.eq expects string for 'id', not number
              id: { [Op.eq]: 123 },
            },
            target: { id: 'order-id' },
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        Users.relateTo({
          alias: 'Orders',
          where: {
            source: { id: 'user-id' },
            target: {
              // @ts-expect-error - Op.in expects string[] for 'name', not number[]
              name: { [Op.in]: [1, 2, 3] },
            },
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });
  });

  describe('instance method (target only where)', () => {
    it('accepts valid where parameters for target', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      // Valid: correct property names and types
      await user.relateTo({
        alias: 'Orders',
        where: { id: 'order-id', name: 'Order1' },
        properties: { Rating: 5 },
      });

      // Valid: using operators with correct types
      await user.relateTo({
        alias: 'Orders',
        where: { id: { [Op.eq]: 'order-id' } },
        properties: { Rating: 5 },
      });

      await user.relateTo({
        alias: 'Orders',
        where: { name: { [Op.contains]: 'Order' } },
        properties: { Rating: 5 },
      });

      expect(true).toBe(true);
    });

    it('rejects invalid property names in where clause', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            id: 'valid',
            // @ts-expect-error - 'orderId' is not a valid target property
            orderId: 'test',
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - 'nonExistent' is not a valid target property
            nonExistent: 'value',
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types for properties', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - 'id' expects string, not number
            id: 123,
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - 'name' expects string, not boolean
            name: false,
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types in operators', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - Op.eq expects string for 'id', not number
            id: { [Op.eq]: 456 },
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - Op.contains expects string for 'name', not number
            name: { [Op.contains]: 123 },
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });

    it('rejects operators on invalid property names', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - 'invalid' is not a valid target property
            invalid: { [Op.eq]: 'value' },
          },
          properties: { Rating: 5 },
        }),
      );

      typeCheck(() =>
        user.relateTo({
          alias: 'Orders',
          where: {
            // @ts-expect-error - 'typo' is not a valid target property
            typo: { [Op.in]: ['a', 'b'] },
          },
          properties: { Rating: 5 },
        }),
      );

      expect(true).toBe(true);
    });
  });
});

/**
 * Tests for relateTo throwIfNoneCreated option.
 */
describe('relateTo throwIfNoneCreated', () => {
  it('returns 0 when no relationships created and throwIfNoneCreated is false', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: 'non-existent-user' },
        target: { id: 'non-existent-order' },
      },
      properties: { Rating: 5 },
      throwIfNoneCreated: false,
    });

    expect(relationships).toEqual([]);
    expect(count).toBe(0);
  });

  it('returns 0 when no relationships created and throwIfNoneCreated is not specified', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: 'non-existent-user' },
        target: { id: 'non-existent-order' },
      },
      properties: { Rating: 5 },
    });

    expect(relationships).toEqual([]);
    expect(count).toBe(0);
  });

  it('throws NeogmaNotFoundError when no relationships created and throwIfNoneCreated is true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await expect(
      Users.relateTo({
        alias: 'Orders',
        where: {
          source: { id: 'non-existent-user' },
          target: { id: 'non-existent-order' },
        },
        properties: { Rating: 5 },
        throwIfNoneCreated: true,
      }),
    ).rejects.toThrow(NeogmaNotFoundError);
  });

  it('does not throw when relationships are created and throwIfNoneCreated is true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const [relationships, count] = await Users.relateTo({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
      properties: { Rating: 5 },
      return: true,
      throwIfNoneCreated: true,
    });

    expect(count).toBe(1);
    expect(relationships.length).toBe(1);
  });
});
