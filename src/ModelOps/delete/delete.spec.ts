import { randomUUID as uuid } from 'crypto';
import {
  getNeogma,
  closeNeogma,
  createOrdersModel,
  createUsersModel,
} from '../testHelpers';

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('delete static', () => {
  it('deletes nodes matching where condition', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User to delete',
    });

    const deletedCount = await Users.delete({
      where: { id: user.id },
    });

    expect(deletedCount).toBe(1);

    const foundUser = await Users.findOne({
      where: { id: user.id },
    });

    expect(foundUser).toBeNull();
  });

  it('deletes multiple nodes matching where condition', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const uniqueAge = 999;
    await Users.createOne({
      id: uuid(),
      name: 'User 1',
      age: uniqueAge,
    });
    await Users.createOne({
      id: uuid(),
      name: 'User 2',
      age: uniqueAge,
    });

    const deletedCount = await Users.delete({
      where: { age: uniqueAge },
    });

    expect(deletedCount).toBe(2);
  });

  it('deletes nodes with detach option', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User with order',
      Orders: {
        properties: [{ id: uuid(), name: 'Related Order', Rating: 5 }],
      },
    });

    // Without detach, it would fail because of existing relationships
    const deletedCount = await Users.delete({
      where: { id: user.id },
      detach: true,
    });

    expect(deletedCount).toBe(1);
  });

  it('returns 0 when no nodes match', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const deletedCount = await Users.delete({
      where: { id: 'non-existent-id' },
    });

    expect(deletedCount).toBe(0);
  });
});

describe('delete instance method', () => {
  it('deletes the instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User to delete',
    });

    const deletedCount = await user.delete();

    expect(deletedCount).toBe(1);

    const foundUser = await Users.findOne({
      where: { id: user.id },
    });

    expect(foundUser).toBeNull();
  });

  it('deletes instance with detach option', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const orderId = uuid();
    const user = await Users.createOne({
      id: uuid(),
      name: 'User with order',
      Orders: {
        properties: [{ id: orderId, name: 'Related Order', Rating: 5 }],
      },
    });

    const deletedCount = await user.delete({ detach: true });

    expect(deletedCount).toBe(1);

    // Order should still exist
    const foundOrder = await Orders.findOne({
      where: { id: orderId },
    });
    expect(foundOrder).toBeTruthy();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('delete type safety', () => {
  it('delete returns correct Promise<number> type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    // Static delete returns number
    const staticDeletedCount: number = await Users.delete({
      where: { id: user.id },
    });
    expect(typeof staticDeletedCount).toBe('number');
  });

  it('instance delete returns correct Promise<number> type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    // Instance delete returns number
    const instanceDeletedCount: number = await user.delete();
    expect(typeof instanceDeletedCount).toBe('number');
  });

  it('delete configuration accepts correct options', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    // Valid options
    await Users.delete({
      where: { id: user.id },
      detach: true,
    });

    const user2 = await Users.createOne({
      id: uuid(),
      name: 'User 2',
    });

    // Instance delete with valid options
    await user2.delete({
      detach: false,
    });
  });
});
