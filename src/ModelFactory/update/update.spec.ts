import { randomUUID as uuid } from 'crypto';

import { UpdateOp } from '../../QueryRunner';
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

describe('update', () => {
  it('updates a node', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const id = uuid();
    const originalName = 'Original';
    const newName = 'Updated';

    await Users.createOne({
      id: id,
      name: originalName,
    });

    await Users.update(
      { name: newName },
      {
        where: { id: id },
      },
    );

    const updatedUser = await Users.findOne({
      where: { id: id },
    });

    expect(updatedUser?.name).toBe(newName);
  });

  it('updates multiple nodes', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const uniqueAge = 99;
    const user1 = await Users.createOne({
      id: uuid(),
      name: 'User 1',
      age: uniqueAge,
    });
    const user2 = await Users.createOne({
      id: uuid(),
      name: 'User 2',
      age: uniqueAge,
    });

    const newName = 'Updated Name';

    await Users.update(
      { name: newName },
      {
        where: { age: uniqueAge },
      },
    );

    const updatedUser1 = await Users.findOne({ where: { id: user1.id } });
    const updatedUser2 = await Users.findOne({ where: { id: user2.id } });

    expect(updatedUser1?.name).toBe(newName);
    expect(updatedUser2?.name).toBe(newName);
  });

  it('returns updated instances when return is true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const id = uuid();
    const newName = 'Updated';

    await Users.createOne({
      id: id,
      name: 'Original',
    });

    const [instances, result] = await Users.update(
      { name: newName },
      {
        where: { id: id },
        return: true,
      },
    );

    expect(instances).toHaveLength(1);
    expect(instances[0].name).toBe(newName);
    expect(result).toBeTruthy();
  });
});

describe('updateOpRemove', () => {
  it('removes a property from an existing node', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const id = uuid();

    const user = await Users.createOne({
      id: id,
      name: 'User',
      age: 10,
    });

    expect(user.age).toBe(10);

    await Users.update(
      {
        age: { [UpdateOp.remove]: true },
      },
      {
        where: {
          id: id,
        },
      },
    );

    const updatedUser = await Users.findOne({
      where: {
        id: id,
      },
    });

    expect(updatedUser).toBeTruthy();
    expect(updatedUser?.age).toBeUndefined();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('update type safety', () => {
  it('update data parameter accepts partial model properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
      age: 25,
    });

    // Should accept partial properties
    await Users.update({ name: 'New Name' }, { where: { id: user.id } });

    // Should accept multiple properties
    await Users.update(
      { name: 'Another Name', age: 30 },
      { where: { id: user.id } },
    );

    // @ts-expect-error - 'nonExistent' is not a valid property
    await Users.update({ nonExistent: 'value' }, { where: { id: user.id } });
  });

  it('update returns correct tuple type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    const [instances, queryResult] = await Users.update(
      { name: 'Updated' },
      { where: { id: user.id }, return: true },
    );

    // instances should be an array
    expect(Array.isArray(instances)).toBe(true);
    // queryResult should have summary
    expect(queryResult.summary).toBeTruthy();

    if (instances.length > 0) {
      // Type tests: instance should have model properties
      const _id: string = instances[0].id;
      const _name: string = instances[0].name;
      expect(_id).toBeTruthy();
      expect(_name).toBeTruthy();

      // @ts-expect-error - 'nonExistent' is not a valid property
      void instances[0].nonExistent;
    }
  });

  it('UpdateOp.remove is typed correctly for optional properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
      age: 25,
    });

    // age is optional, so UpdateOp.remove should be valid
    await Users.update(
      { age: { [UpdateOp.remove]: true } },
      { where: { id: user.id } },
    );
  });
});

/**
 * Where parameter type safety tests.
 * These tests verify that property names and value types are validated at compile time.
 */
describe('update where type safety', () => {
  it('accepts valid property names with correct value types', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Valid: correct property names and value types
    await Users.update({ name: 'New' }, { where: { id: 'test-id' } });

    await Users.update({ name: 'New' }, { where: { name: 'John' } });

    await Users.update(
      { name: 'New' },
      { where: { id: 'test-id', name: 'John' } },
    );

    // Valid: using operators with correct types
    await Users.update(
      { name: 'New' },
      { where: { id: { [Op.eq]: 'test-id' } } },
    );

    await Users.update(
      { name: 'New' },
      { where: { id: { [Op.in]: ['id1', 'id2'] } } },
    );

    await Users.update(
      { name: 'New' },
      { where: { name: { [Op.contains]: 'John' } } },
    );

    // Valid: numeric property with comparison operators
    await Users.update({ name: 'New' }, { where: { age: { [Op.gte]: 18 } } });

    expect(true).toBe(true);
  });

  it('rejects invalid property names in where clause', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.update(
      { name: 'New' },
      {
        where: {
          id: 'valid',
          // @ts-expect-error - 'nam' is not a valid property (typo)
          nam: 'John',
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'userId' is not a valid property
          userId: 'test',
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'nonExistent' is not a valid property
          nonExistent: 'value',
        },
      },
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types for properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'id' expects string, not number
          id: 123,
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'name' expects string, not boolean
          name: true,
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'age' expects number, not string
          age: 'twenty-five',
        },
      },
    );

    expect(true).toBe(true);
  });

  it('rejects wrong value types in operators', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - Op.eq expects string for 'id', not number
          id: { [Op.eq]: 123 },
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - Op.in expects string[] for 'id', not number[]
          id: { [Op.in]: [1, 2, 3] },
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - Op.gte expects number for 'age', not string
          age: { [Op.gte]: 'eighteen' },
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - Op.contains expects string for 'name', not number
          name: { [Op.contains]: 42 },
        },
      },
    );

    expect(true).toBe(true);
  });

  it('rejects operators on invalid property names', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'invalid' is not a valid property
          invalid: { [Op.eq]: 'value' },
        },
      },
    );

    await Users.update(
      { name: 'New' },
      {
        where: {
          // @ts-expect-error - 'typo' is not a valid property
          typo: { [Op.in]: ['a', 'b'] },
        },
      },
    );

    expect(true).toBe(true);
  });
});
