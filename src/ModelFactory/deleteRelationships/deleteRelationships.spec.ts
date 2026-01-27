import { randomUUID as uuid } from 'crypto';

import { Op } from '../../Where';
import type { UsersRelatedNodesI } from '../testHelpers';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  typeCheck,
} from '../testHelpers';

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('deleteRelationships', () => {
  it('deletes relationships matching where condition', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const relationshipProperties: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      { rating: 3 };

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: relationshipProperties.rating },
    });

    const deletedCount = await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
    });

    expect(deletedCount).toBe(1);

    // Verify relationship is deleted
    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
    });

    expect(relationships.length).toBe(0);
  });

  it('deletes multiple relationships', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: 3 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: 5 },
    });

    const deletedCount = await Users.deleteRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
    });

    expect(deletedCount).toBe(2);
  });

  it('returns 0 when no relationships match', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const deletedCount = await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: 'non-existent' },
        target: { id: 'non-existent' },
      },
    });

    expect(deletedCount).toBe(0);
  });

  it('deletes by relationship properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order1 = await Orders.createOne({ id: uuid(), name: uuid() });
    const order2 = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order1.id },
      properties: { Rating: 1 },
    });
    await user.relateTo({
      alias: 'Orders',
      where: { id: order2.id },
      properties: { Rating: 5 },
    });

    // Delete only the relationship with rating 1
    const deletedCount = await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        relationship: { rating: 1 },
      },
    });

    expect(deletedCount).toBe(1);

    // Verify only one relationship remains
    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
    });

    expect(relationships.length).toBe(1);
    expect(relationships[0].relationship.rating).toBe(5);
  });

  it('nodes are preserved after relationship deletion', async () => {
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

    await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
    });

    // Both nodes should still exist
    const foundUser = await Users.findOne({ where: { id: user.id } });
    const foundOrder = await Orders.findOne({ where: { id: order.id } });

    expect(foundUser).toBeTruthy();
    expect(foundOrder).toBeTruthy();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('deleteRelationships type safety', () => {
  it('deleteRelationships returns Promise<number>', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });

    const count: number = await Users.deleteRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
    });

    expect(typeof count).toBe('number');
  });

  it('deleteRelationships alias must be valid', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Valid alias
    await Users.deleteRelationships({
      alias: 'Orders',
      where: { source: { id: 'some-id' } },
    });

    // Type test: invalid alias should cause TypeScript error at compile time
    await expect(
      Users.deleteRelationships({
        // @ts-expect-error - 'InvalidAlias' is not a valid relationship alias
        alias: 'InvalidAlias',
        where: { source: { id: 'some-id' } },
      }),
    ).rejects.toThrow();
  });

  it('deleteRelationships where accepts correct params', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Valid where params
    await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: 'user-id' },
        target: { id: 'order-id' },
        relationship: { rating: 5 },
      },
    });
  });
});

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time
 * for source, target, and relationship where parameters.
 */
describe('deleteRelationships where type safety', () => {
  it('accepts valid where parameters for source, target, relationship', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testUserId = uuid();
    const testOrderId = uuid();

    // Valid: correct property names and types for all entities
    await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: testUserId, name: 'John' },
        target: { id: testOrderId, name: 'Order1' },
        relationship: { rating: 5 },
      },
    });

    // Valid: using operators with correct types
    await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: { [Op.eq]: testUserId } },
        target: { name: { [Op.contains]: 'Order' } },
        relationship: { rating: { [Op.gte]: 3 } },
      },
    });

    // Valid: partial where (only source)
    await Users.deleteRelationships({
      alias: 'Orders',
      where: { source: { id: testUserId } },
    });

    // Valid: partial where (only target)
    await Users.deleteRelationships({
      alias: 'Orders',
      where: { target: { id: testOrderId } },
    });

    // Valid: partial where (only relationship)
    await Users.deleteRelationships({
      alias: 'Orders',
      where: {
        source: { id: testUserId },
        relationship: { rating: 5 },
      },
    });

    expect(true).toBe(true);
  });

  it('rejects invalid property names in source where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testUserId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: {
            id: testUserId,
            // @ts-expect-error - 'nam' is not a valid source property (typo)
            nam: 'John',
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: {
            id: testUserId,
            // @ts-expect-error - 'userId' is not a valid source property
            userId: 'test',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects invalid property names in target where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testTargetId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          target: {
            id: testTargetId,
            // @ts-expect-error - 'orderId' is not a valid target property
            orderId: 'test',
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          target: {
            id: testTargetId,
            // @ts-expect-error - 'nonExistent' is not a valid target property
            nonExistent: 'value',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects invalid property names in relationship where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testSourceId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          relationship: {
            // @ts-expect-error - 'score' is not a valid relationship property
            score: 5,
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          relationship: {
            rating: 5,
            // @ts-expect-error - 'invalid' is not a valid relationship property
            invalid: 'value',
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in source where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testTargetId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          target: { id: testTargetId },
          source: {
            // @ts-expect-error - 'id' expects string, not number
            id: 123,
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          target: { id: testTargetId },
          source: {
            // @ts-expect-error - 'name' expects string, not boolean
            name: true,
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in target where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testSourceId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          target: {
            // @ts-expect-error - 'id' expects string, not number
            id: 456,
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          target: {
            // @ts-expect-error - 'name' expects string, not object
            name: { value: 'test' },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in relationship where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testSourceId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          relationship: {
            // @ts-expect-error - 'rating' expects number, not string
            rating: 'high',
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          relationship: {
            // @ts-expect-error - 'rating' expects number, not boolean
            rating: true,
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in operators for all entities', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testSourceId = uuid();
    const testTargetId = uuid();

    // Source: wrong type in operator
    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          target: { id: testTargetId },
          source: {
            // @ts-expect-error - Op.eq expects string for 'id', not number
            id: { [Op.eq]: 123 },
          },
        },
      }),
    );

    // Target: wrong type in operator
    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          target: {
            // @ts-expect-error - Op.in expects string[] for 'name', not number[]
            name: { [Op.in]: [1, 2, 3] },
          },
        },
      }),
    );

    // Relationship: wrong type in operator
    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          relationship: {
            // @ts-expect-error - Op.gte expects number for 'rating', not string
            rating: { [Op.gte]: 'high' },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects operators on invalid property names', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testSourceId = uuid();
    const testTargetId = uuid();

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          target: { id: testTargetId },
          source: {
            // @ts-expect-error - 'invalid' is not a valid source property
            invalid: { [Op.eq]: 'value' },
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          target: {
            // @ts-expect-error - 'typo' is not a valid target property
            typo: { [Op.contains]: 'test' },
          },
        },
      }),
    );

    typeCheck(() =>
      Users.deleteRelationships({
        alias: 'Orders',
        where: {
          source: { id: testSourceId },
          relationship: {
            // @ts-expect-error - 'score' is not a valid relationship property
            score: { [Op.gt]: 5 },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });
});
