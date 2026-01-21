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
    });

    expect(users).toHaveLength(2);
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
