import { randomUUID as uuid } from 'crypto';
import { UpdateOp } from '../../Queries/QueryRunner';
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
