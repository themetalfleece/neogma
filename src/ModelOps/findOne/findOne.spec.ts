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

describe('findOne', () => {
  it('finds one', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'user1',
    });

    const foundUser = await Users.findOne({
      where: {
        id: user.id,
      },
    });

    expect(foundUser).toBeTruthy();
    expect(foundUser?.id).toEqual(user.id);
    expect(foundUser?.dataValues.id).toEqual(user.dataValues.id);
  });

  it('finds one plain', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const userData = {
      id: uuid(),
      name: 'user1',
    };
    const user = await Users.createOne(userData);

    const foundUser = await Users.findOne({
      where: {
        id: user.id,
      },
      plain: true,
    });

    expect(foundUser).toEqual(userData);
    // @ts-expect-error -- dataValues is not defined on plain
    foundUser?.dataValues?.id;
  });

  it('returns null when not found', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const foundUser = await Users.findOne({
      where: {
        id: 'non-existent-id',
      },
    });

    expect(foundUser).toBeNull();
  });

  it('throws when throwIfNotFound is true and not found', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await expect(
      Users.findOne({
        where: {
          id: 'non-existent-id',
        },
        throwIfNotFound: true,
      }),
    ).rejects.toThrow();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('findOne type safety', () => {
  it('returns correctly typed instance or null', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'Test User',
    });

    const foundUser = await Users.findOne({
      where: { id: user.id },
    });

    if (foundUser) {
      // Type tests: valid property access should compile
      const _id: string = foundUser.id;
      const _name: string = foundUser.name;
      expect(_id).toBe(user.id);
      expect(_name).toBe(user.name);

      // Instance methods should be available
      expect(foundUser.getDataValues().id).toBe(user.id);

      // @ts-expect-error - 'nonExistent' is not a valid property
      void foundUser.nonExistent;
    }
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

    const foundUser = await Users.findOne({
      where: { id: userData.id },
      plain: true,
    });

    expect(foundUser).toEqual(userData);
    // @ts-expect-error -- getDataValues is not defined on plain
    foundUser?.getDataValues;
  });
});
