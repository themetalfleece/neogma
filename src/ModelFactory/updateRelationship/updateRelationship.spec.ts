import { randomUUID as uuid } from 'crypto';

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
