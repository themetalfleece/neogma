import { randomUUID as uuid } from 'crypto';

import { NeogmaNotFoundError } from '../../Errors';
import { Op } from '../../Where';
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

  it('throws NeogmaNotFoundError when throwIfNotFound is true and not found', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    try {
      await Users.findOne({
        where: {
          id: 'non-existent-id',
        },
        throwIfNotFound: true,
      });
      fail('Expected NeogmaNotFoundError to be thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(NeogmaNotFoundError);
      expect(error).toBeInstanceOf(Error);
    }
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

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time.
 */
describe('findOne where type safety', () => {
  it('accepts valid property names with correct value types', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Valid: correct property names and value types
    await Users.findOne({
      where: { id: 'test-id' },
    });

    await Users.findOne({
      where: { name: 'John' },
    });

    await Users.findOne({
      where: { id: 'test-id', name: 'John' },
    });

    // Valid: using operators with correct types
    await Users.findOne({
      where: { id: { [Op.eq]: 'test-id' } },
    });

    await Users.findOne({
      where: { name: { [Op.contains]: 'John' } },
    });

    await Users.findOne({
      where: { id: { [Op.ne]: 'other-id' } },
    });

    expect(true).toBe(true);
  });

  it('rejects invalid property names in where clause', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(() =>
      Users.findOne({
        where: {
          id: 'valid',
          // @ts-expect-error - 'nam' is not a valid property (typo)
          nam: 'John',
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'userId' is not a valid property
          userId: 'test',
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'nonExistent' is not a valid property
          nonExistent: 'value',
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types for properties', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'id' expects string, not number
          id: 123,
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'name' expects string, not boolean
          name: true,
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'id' expects string, not object without operator
          id: { value: 'test' },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in operators', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - Op.eq expects string for 'id', not number
          id: { [Op.eq]: 123 },
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - Op.contains expects string for 'name', not number
          name: { [Op.contains]: 42 },
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - Op.ne expects string for 'id', not boolean
          id: { [Op.ne]: false },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('rejects operators on invalid property names', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'invalid' is not a valid property
          invalid: { [Op.eq]: 'value' },
        },
      }),
    );

    typeCheck(() =>
      Users.findOne({
        where: {
          // @ts-expect-error - 'typo' is not a valid property
          typo: { [Op.contains]: 'test' },
        },
      }),
    );

    expect(true).toBe(true);
  });
});
