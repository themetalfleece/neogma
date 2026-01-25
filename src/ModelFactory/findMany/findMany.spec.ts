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

describe('findMany', () => {
  it('finds many', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1 = await Users.createOne({
      id: uuid(),
      name: 'user1',
    });

    const user2 = await Users.createOne({
      id: uuid(),
      name: 'user2',
    });

    const users = await Users.findMany({
      where: {
        id: {
          [Op.in]: [user1.id, user2.id],
        },
      },
    });

    expect(users).toHaveLength(2);
    // Check both users are returned (order is not guaranteed without an ORDER clause)
    const userIds = users.map((u) => u.id);
    expect(userIds).toContain(user1.id);
    expect(userIds).toContain(user2.id);
    const dataValueIds = users.map((u) => u.dataValues.id);
    expect(dataValueIds).toContain(user1.dataValues.id);
    expect(dataValueIds).toContain(user2.dataValues.id);
  });

  it('finds many plain', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1Data = {
      id: uuid(),
      name: 'user1',
    };
    const user1 = await Users.createOne(user1Data);

    const user2Data = {
      id: uuid(),
      name: 'user2',
    };
    const user2 = await Users.createOne(user2Data);

    const users = await Users.findMany({
      where: {
        id: {
          [Op.in]: [user1.id, user2.id],
        },
      },
      plain: true,
      order: [['name', 'ASC']],
    });

    expect(users).toHaveLength(2);
    // With ORDER BY name ASC, user1 comes first (alphabetically)
    expect(users[0]).toEqual(user1Data);
    expect(users[1]).toEqual(user2Data);
    expect(users).toEqual([user1Data, user2Data]);
    // @ts-expect-error -- dataValues is not defined on plain
    users[0].dataValues?.id;
    // @ts-expect-error -- dataValues is not defined on plain
    users[1].dataValues?.id;
  });

  it('finds many with limit', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1 = await Users.createOne({ id: uuid(), name: uuid() });
    const user2 = await Users.createOne({ id: uuid(), name: uuid() });
    const user3 = await Users.createOne({ id: uuid(), name: uuid() });

    const users = await Users.findMany({
      where: {
        id: {
          [Op.in]: [user1.id, user2.id, user3.id],
        },
      },
      limit: 2,
    });

    expect(users).toHaveLength(2);
  });

  it('finds many with skip', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1 = await Users.createOne({ id: uuid(), name: uuid() });
    const user2 = await Users.createOne({ id: uuid(), name: uuid() });
    const user3 = await Users.createOne({ id: uuid(), name: uuid() });

    const users = await Users.findMany({
      where: {
        id: {
          [Op.in]: [user1.id, user2.id, user3.id],
        },
      },
      skip: 1,
    });

    expect(users).toHaveLength(2);
  });

  it('returns empty array when none found', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const users = await Users.findMany({
      where: {
        id: 'non-existent-id',
      },
    });

    expect(users).toEqual([]);
  });

  it('throws when throwIfNoneFound is true and none found', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await expect(
      Users.findMany({
        where: {
          id: 'non-existent-id',
        },
        throwIfNoneFound: true,
      }),
    ).rejects.toThrow();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('findMany type safety', () => {
  it('returns array of correctly typed instances', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user1 = await Users.createOne({
      id: uuid(),
      name: 'Test User 1',
    });

    const user2 = await Users.createOne({
      id: uuid(),
      name: 'Test User 2',
    });

    const users = await Users.findMany({
      where: {
        id: { [Op.in]: [user1.id, user2.id] },
      },
    });

    expect(users).toHaveLength(2);

    // Type tests: valid property access should compile
    const _id: string = users[0].id;
    const _name: string = users[0].name;
    expect(_id).toBeTruthy();
    expect(_name).toBeTruthy();

    // Instance methods should be available
    expect(users[0].getDataValues().id).toBeTruthy();

    // @ts-expect-error - 'nonExistent' is not a valid property
    void users[0].nonExistent;
  });

  it('plain returns only properties without instance methods', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const userData = {
      id: uuid(),
      name: 'Plain User',
    };
    await Users.createOne(userData);

    const users = await Users.findMany({
      where: { id: userData.id },
      plain: true,
    });

    expect(users[0]).toEqual(userData);
    // @ts-expect-error -- getDataValues is not defined on plain
    users[0].getDataValues;
  });
});

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time.
 */
describe('findMany where type safety', () => {
  it('accepts valid property names with correct value types', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Valid: correct property names and value types
    await Users.findMany({
      where: { id: 'test-id' },
    });

    await Users.findMany({
      where: { name: 'John' },
    });

    await Users.findMany({
      where: { id: 'test-id', name: 'John' },
    });

    // Valid: using operators with correct types
    await Users.findMany({
      where: { id: { [Op.eq]: 'test-id' } },
    });

    await Users.findMany({
      where: { id: { [Op.in]: ['id1', 'id2'] } },
    });

    await Users.findMany({
      where: { name: { [Op.contains]: 'John' } },
    });

    expect(true).toBe(true);
  });

  it('rejects invalid property names in where clause', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.findMany({
      where: {
        id: 'valid',
        // @ts-expect-error - 'nam' is not a valid property (typo)
        nam: 'John',
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - 'userId' is not a valid property
        userId: 'test',
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - 'nonExistent' is not a valid property
        nonExistent: 'value',
      },
    });

    expect(true).toBe(true);
  });

  it('rejects wrong value types for properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.findMany({
      where: {
        // @ts-expect-error - 'id' expects string, not number
        id: 123,
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - 'name' expects string, not boolean
        name: true,
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - 'id' expects string, not object without operator
        id: { value: 'test' },
      },
    });

    expect(true).toBe(true);
  });

  it('rejects wrong value types in operators', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.findMany({
      where: {
        // @ts-expect-error - Op.eq expects string for 'id', not number
        id: { [Op.eq]: 123 },
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - Op.in expects string[] for 'id', not number[]
        id: { [Op.in]: [1, 2, 3] },
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - Op.contains expects string for 'name', not number
        name: { [Op.contains]: 42 },
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - Op.ne expects string for 'id', not boolean
        id: { [Op.ne]: false },
      },
    });

    expect(true).toBe(true);
  });

  it('rejects operators on invalid property names', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.findMany({
      where: {
        // @ts-expect-error - 'invalid' is not a valid property
        invalid: { [Op.eq]: 'value' },
      },
    });

    await Users.findMany({
      where: {
        // @ts-expect-error - 'typo' is not a valid property
        typo: { [Op.in]: ['a', 'b'] },
      },
    });

    expect(true).toBe(true);
  });
});
