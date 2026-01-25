import { randomUUID as uuid } from 'crypto';

import { Op } from '../../Where';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  UsersRelatedNodesI,
} from '../testHelpers';

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('updateRelationship static method', () => {
  it('updates relationship properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    const initialRating: UsersRelatedNodesI['Orders']['RelationshipProperties'] =
      { rating: 3 };

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: initialRating.rating },
    });

    // Update the relationship
    await Users.updateRelationship(
      { rating: 5 },
      {
        alias: 'Orders',
        where: {
          source: { id: user.id },
          target: { id: order.id },
        },
      },
    );

    // Verify the update
    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: {
        source: { id: user.id },
        target: { id: order.id },
      },
    });

    expect(relationships.length).toBe(1);
    expect(relationships[0].relationship.rating).toBe(5);
  });

  it('updates multiple relationships matching where condition', async () => {
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
      properties: { Rating: 2 },
    });

    // Update all relationships from this user
    await Users.updateRelationship(
      { rating: 4 },
      {
        alias: 'Orders',
        where: { source: { id: user.id } },
      },
    );

    // Verify all were updated
    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
    });

    expect(relationships.length).toBe(2);
    expect(relationships[0].relationship.rating).toBe(4);
    expect(relationships[1].relationship.rating).toBe(4);
  });

  it('updates by relationship properties', async () => {
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

    // Update only relationships with rating 1
    await Users.updateRelationship(
      { rating: 3 },
      {
        alias: 'Orders',
        where: {
          source: { id: user.id },
          relationship: { rating: 1 },
        },
      },
    );

    // Verify only the first was updated
    const relationships = await Users.findRelationships({
      alias: 'Orders',
      where: { source: { id: user.id } },
      order: [{ on: 'target', property: 'id', direction: 'ASC' }],
    });

    expect(relationships.length).toBe(2);

    const rel1 = relationships.find((r) => r.target.id === order1.id);
    const rel2 = relationships.find((r) => r.target.id === order2.id);

    expect(rel1?.relationship.rating).toBe(3);
    expect(rel2?.relationship.rating).toBe(5);
  });
});

describe('updateRelationship instance method', () => {
  it('updates relationship from instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 2 },
    });

    // Update via instance method
    await user.updateRelationship(
      { rating: 4 },
      {
        alias: 'Orders',
        where: { target: { id: order.id } },
      },
    );

    // Verify the update
    const relationships = await user.findRelationships({
      alias: 'Orders',
    });

    expect(relationships.length).toBe(1);
    expect(relationships[0].relationship.rating).toBe(4);
  });

  it('updates specific relationship when multiple exist', async () => {
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
      properties: { Rating: 2 },
    });

    // Update only the relationship to order1
    await user.updateRelationship(
      { rating: 5 },
      {
        alias: 'Orders',
        where: { target: { id: order1.id } },
      },
    );

    // Verify only order1 relationship was updated
    const relationships = await user.findRelationships({
      alias: 'Orders',
    });

    expect(relationships.length).toBe(2);

    const rel1 = relationships.find((r) => r.target.id === order1.id);
    const rel2 = relationships.find((r) => r.target.id === order2.id);

    expect(rel1?.relationship.rating).toBe(5);
    expect(rel2?.relationship.rating).toBe(2);
  });

  it('instance method uses source automatically', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1 = await Users.createOne({ id: uuid(), name: uuid() });
    const user2 = await Users.createOne({ id: uuid(), name: uuid() });
    const order = await Orders.createOne({ id: uuid(), name: uuid() });

    // Both users relate to the same order
    await user1.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 1 },
    });
    await user2.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 2 },
    });

    // Update via user1's instance - should only affect user1's relationship
    await user1.updateRelationship(
      { rating: 5 },
      {
        alias: 'Orders',
        where: { target: { id: order.id } },
      },
    );

    // Verify only user1's relationship was updated
    const user1Relationships = await user1.findRelationships({
      alias: 'Orders',
    });
    const user2Relationships = await user2.findRelationships({
      alias: 'Orders',
    });

    expect(user1Relationships[0].relationship.rating).toBe(5);
    expect(user2Relationships[0].relationship.rating).toBe(2);
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('updateRelationship type safety', () => {
  it('updateRelationship alias must be valid', async () => {
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

    // Valid alias
    await Users.updateRelationship(
      { rating: 5 },
      {
        alias: 'Orders',
        where: { source: { id: user.id } },
      },
    );

    // Type test: invalid alias should cause TypeScript error at compile time
    await expect(
      Users.updateRelationship(
        { rating: 5 },
        {
          // @ts-expect-error - 'InvalidAlias' is not a valid relationship alias
          alias: 'InvalidAlias',
          where: { source: { id: user.id } },
        },
      ),
    ).rejects.toThrow();
  });

  it('instance updateRelationship alias must be valid', async () => {
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

    // Valid alias
    await user.updateRelationship(
      { rating: 5 },
      {
        alias: 'Orders',
        where: { target: { id: order.id } },
      },
    );

    // Type test: invalid alias should cause TypeScript error at compile time
    await expect(
      user.updateRelationship(
        { rating: 5 },
        {
          // @ts-expect-error - 'InvalidAlias' is not a valid relationship alias
          alias: 'InvalidAlias',
          where: { target: { id: order.id } },
        },
      ),
    ).rejects.toThrow();
  });

  it('updateRelationship returns Promise<QueryResult>', async () => {
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

    const result = await Users.updateRelationship(
      { rating: 5 },
      {
        alias: 'Orders',
        where: { source: { id: user.id } },
      },
    );

    // QueryResult has records property
    expect(result).toHaveProperty('records');
    expect(result).toHaveProperty('summary');
  });
});

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time
 * for source, target, and relationship where parameters in both static and instance methods.
 */
describe('updateRelationship where type safety', () => {
  describe('static method (source/target/relationship where)', () => {
    it('accepts valid where parameters for source, target, relationship', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-check tests - verify valid parameters compile correctly
      // Use wrapper to check types without executing database queries
      const _typeCheck = (_fn: () => void) => {};

      // Valid: correct property names and types for all entities
      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              source: { id: 'user-id', name: 'John' },
              target: { id: 'order-id', name: 'Order1' },
              relationship: { rating: 3 },
            },
          },
        ),
      );

      // Valid: using operators with correct types
      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              source: { id: { [Op.eq]: 'user-id' } },
              target: { name: { [Op.contains]: 'Order' } },
              relationship: { rating: { [Op.gte]: 1 } },
            },
          },
        ),
      );

      // Valid: partial where (only source)
      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid property names in source where clause', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              source: {
                id: 'valid',
                // @ts-expect-error - 'nam' is not a valid source property (typo)
                nam: 'John',
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              source: {
                // @ts-expect-error - 'userId' is not a valid source property
                userId: 'test',
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid property names in target where clause', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - 'orderId' is not a valid target property
                orderId: 'test',
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                id: 'valid',
                // @ts-expect-error - 'nonExistent' is not a valid target property
                nonExistent: 'value',
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid property names in relationship where clause', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                // @ts-expect-error - 'score' is not a valid relationship property
                score: 5,
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                rating: 3,
                // @ts-expect-error - 'invalid' is not a valid relationship property
                invalid: 'value',
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types in source and target', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              source: {
                // @ts-expect-error - 'id' expects string, not number
                id: 123,
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - 'name' expects string, not boolean
                name: true,
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                // @ts-expect-error - 'rating' expects number, not string
                rating: 'high',
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types in operators', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              source: {
                // @ts-expect-error - Op.eq expects string for 'id', not number
                id: { [Op.eq]: 123 },
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - Op.in expects string[] for 'name', not number[]
                name: { [Op.in]: [1, 2, 3] },
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                // @ts-expect-error - Op.gte expects number for 'rating', not string
                rating: { [Op.gte]: 'high' },
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });
  });

  describe('instance method (target/relationship where)', () => {
    it('accepts valid where parameters for target and relationship', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      // Type-check tests - verify valid parameters compile correctly
      // Use wrapper to check types without executing database queries
      const _typeCheck = (_fn: () => void) => {};

      // Valid: correct property names and types
      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: { id: 'order-id', name: 'Order1' },
              relationship: { rating: 3 },
            },
          },
        ),
      );

      // Valid: using operators with correct types
      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: { id: { [Op.eq]: 'order-id' } },
              relationship: { rating: { [Op.gte]: 1 } },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid property names in target where clause', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - 'orderId' is not a valid target property
                orderId: 'test',
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                id: 'valid',
                // @ts-expect-error - 'nonExistent' is not a valid target property
                nonExistent: 'value',
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types for properties', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - 'id' expects string, not number
                id: 456,
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                // @ts-expect-error - 'rating' expects number, not string
                rating: 'high',
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types in operators', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - Op.eq expects string for 'id', not number
                id: { [Op.eq]: 123 },
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                // @ts-expect-error - Op.gte expects number for 'rating', not string
                rating: { [Op.gte]: 'high' },
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects operators on invalid property names', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              target: {
                // @ts-expect-error - 'invalid' is not a valid target property
                invalid: { [Op.eq]: 'value' },
              },
            },
          },
        ),
      );

      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: {
              relationship: {
                // @ts-expect-error - 'score' is not a valid relationship property
                score: { [Op.gt]: 5 },
              },
            },
          },
        ),
      );

      expect(true).toBe(true);
    });
  });
});

/**
 * Data parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time
 * for the data parameter that updates relationship properties.
 */
describe('updateRelationship data type safety', () => {
  describe('static method data parameter', () => {
    it('accepts valid relationship property names and types', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-check tests - verify valid parameters compile correctly
      // Use wrapper to check types without executing database queries
      const _typeCheck = (_fn: () => void) => {};

      // Valid: correct property name and type
      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      // Valid: partial update with only some properties
      _typeCheck(() =>
        Users.updateRelationship(
          { rating: 3 },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid relationship property names', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          {
            // @ts-expect-error - 'score' is not a valid relationship property
            score: 5,
          },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          {
            rating: 5,
            // @ts-expect-error - 'invalid' is not a valid relationship property
            invalid: 'value',
          },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          {
            // @ts-expect-error - 'nonExistent' is not a valid relationship property
            nonExistent: 123,
          },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types for relationship properties', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // These type tests verify TypeScript errors at compile time
      // We use a function wrapper to check types without executing
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        Users.updateRelationship(
          {
            // @ts-expect-error - 'rating' expects number, not string
            rating: 'high',
          },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          {
            // @ts-expect-error - 'rating' expects number, not boolean
            rating: true,
          },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      _typeCheck(() =>
        Users.updateRelationship(
          {
            // @ts-expect-error - 'rating' expects number, not object
            rating: { value: 5 },
          },
          {
            alias: 'Orders',
            where: { source: { id: 'user-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });
  });

  describe('instance method data parameter', () => {
    it('accepts valid relationship property names and types', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: 'user-id', name: 'John' });

      // Type-check tests - verify valid parameters compile correctly
      // Use wrapper to check types without executing database queries
      const _typeCheck = (_fn: () => void) => {};

      // Valid: correct property name and type
      _typeCheck(() =>
        user.updateRelationship(
          { rating: 5 },
          {
            alias: 'Orders',
            where: { target: { id: 'order-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects invalid relationship property names', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: 'user-id', name: 'John' });

      // Type-only tests - use wrapper to avoid runtime execution
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        user.updateRelationship(
          {
            // @ts-expect-error - 'score' is not a valid relationship property
            score: 5,
          },
          {
            alias: 'Orders',
            where: { target: { id: 'order-id' } },
          },
        ),
      );

      _typeCheck(() =>
        user.updateRelationship(
          {
            rating: 5,
            // @ts-expect-error - 'invalid' is not a valid relationship property
            invalid: 'value',
          },
          {
            alias: 'Orders',
            where: { target: { id: 'order-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });

    it('rejects wrong value types for relationship properties', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: 'user-id', name: 'John' });

      // These type tests verify TypeScript errors at compile time
      // We use a function wrapper to check types without executing
      const _typeCheck = (_fn: () => void) => {};

      _typeCheck(() =>
        user.updateRelationship(
          {
            // @ts-expect-error - 'rating' expects number, not string
            rating: 'high',
          },
          {
            alias: 'Orders',
            where: { target: { id: 'order-id' } },
          },
        ),
      );

      _typeCheck(() =>
        user.updateRelationship(
          {
            // @ts-expect-error - 'rating' expects number, not boolean
            rating: true,
          },
          {
            alias: 'Orders',
            where: { target: { id: 'order-id' } },
          },
        ),
      );

      expect(true).toBe(true);
    });
  });
});
