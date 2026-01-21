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
