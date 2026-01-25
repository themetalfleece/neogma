import { randomUUID as uuid } from 'crypto';

import { Op } from '../../Where';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
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

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time.
 */
describe('delete where type safety', () => {
  it('accepts valid property names with correct value types', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testId = uuid();
    const testName = uuid();

    // Valid: correct property names and value types (using detach to handle any relationships)
    await Users.delete({ where: { id: testId }, detach: true });

    await Users.delete({ where: { id: testId, name: testName }, detach: true });

    await Users.delete({
      where: { id: testId, name: testName },
      detach: true,
    });

    // Valid: using operators with correct types
    await Users.delete({ where: { id: { [Op.eq]: testId } }, detach: true });

    await Users.delete({
      where: { id: { [Op.in]: [testId, uuid()] } },
      detach: true,
    });

    await Users.delete({
      where: { id: testId, name: { [Op.contains]: testName } },
      detach: true,
    });

    // Valid: numeric property with comparison operators
    await Users.delete({
      where: { id: testId, age: { [Op.gte]: 18 } },
      detach: true,
    });

    expect(true).toBe(true);
  });

  it('rejects invalid property names in where clause', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testId = uuid();

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'nam' is not a valid property (typo)
        nam: 'John',
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'userId' is not a valid property
        userId: 'test',
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'nonExistent' is not a valid property
        nonExistent: 'value',
      },
      detach: true,
    });

    expect(true).toBe(true);
  });

  it('rejects wrong value types for properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testId = uuid();

    await Users.delete({
      where: {
        name: testId,
        // @ts-expect-error - 'id' expects string, not number
        id: 123,
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'name' expects string, not boolean
        name: true,
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'age' expects number, not string
        age: 'twenty-five',
      },
      detach: true,
    });

    expect(true).toBe(true);
  });

  it('rejects wrong value types in operators', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testId = uuid();

    await Users.delete({
      where: {
        name: testId,
        // @ts-expect-error - Op.eq expects string for 'id', not number
        id: { [Op.eq]: 123 },
      },
      detach: true,
    });

    await Users.delete({
      where: {
        name: testId,
        // @ts-expect-error - Op.in expects string[] for 'id', not number[]
        id: { [Op.in]: [1, 2, 3] },
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - Op.gte expects number for 'age', not string
        age: { [Op.gte]: 'eighteen' },
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - Op.contains expects string for 'name', not number
        name: { [Op.contains]: 42 },
      },
      detach: true,
    });

    expect(true).toBe(true);
  });

  it('rejects operators on invalid property names', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const testId = uuid();

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'invalid' is not a valid property
        invalid: { [Op.eq]: 'value' },
      },
      detach: true,
    });

    await Users.delete({
      where: {
        id: testId,
        // @ts-expect-error - 'typo' is not a valid property
        typo: { [Op.in]: ['a', 'b'] },
      },
      detach: true,
    });

    expect(true).toBe(true);
  });
});
