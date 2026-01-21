import { randomUUID as uuid } from 'crypto';

import { QueryBuilder } from '../../QueryBuilder';
import { QueryRunner } from '../../QueryRunner';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  UserAttributesI,
} from '../testHelpers';

const { getResultProperties } = QueryRunner;

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('save', () => {
  it('throws an error if update fails', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    await user.save();

    // change the id of the user, so saving should fail
    user.id = uuid();

    await expect(user.save()).rejects.toThrow();
  });

  it('does not save if there are no changes', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const userId = uuid();

    await Users.createOne({
      id: userId,
      name: 'User',
    });

    const existingUserInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const existingUserInDbData = getResultProperties<UserAttributesI>(
      existingUserInDbResult,
      'n',
    )[0];

    const userInstance = Users.build(existingUserInDbData, {
      status: 'existing',
    });

    await userInstance.save();
  });

  it('saves modified properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const userId = uuid();
    const originalName = 'Original Name';
    const newName = 'New Name';

    const user = await Users.createOne({
      id: userId,
      name: originalName,
    });

    user.name = newName;
    await user.save();

    const foundUser = await Users.findOne({
      where: { id: userId },
    });

    expect(foundUser?.name).toBe(newName);
  });

  it('tracks changed properties correctly', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
      age: 25,
    });

    // Initially no changes
    expect(user.changed.name).toBe(false);
    expect(user.changed.age).toBe(false);

    // Modify a property
    user.name = 'Changed Name';

    // changed should track the modification
    expect(user.changed.name).toBe(true);
    expect(user.changed.age).toBe(false);
  });

  it('creates new node when saving a new instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'New Order',
    });

    expect(order.__existsInDatabase).toBe(false);

    await order.save();

    // After save, it should exist in the database
    const foundOrder = await Orders.findOne({
      where: { id: order.id },
    });

    expect(foundOrder).toBeTruthy();
    expect(foundOrder?.id).toBe(order.id);
    expect(foundOrder?.name).toBe(order.name);
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('save type safety', () => {
  it('save returns correct Promise type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
    });

    // save should return Promise<Instance>
    const savedUser = await user.save();

    // Type tests: the saved user should have all instance properties
    const _id: string = savedUser.id;
    const _name: string = savedUser.name;
    expect(_id).toBe(user.id);
    expect(_name).toBe(user.name);

    // @ts-expect-error - 'nonExistent' is not a valid property
    void savedUser.nonExistent;
  });

  it('changed property has correct type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = await Users.createOne({
      id: uuid(),
      name: 'User',
      age: 25,
    });

    // changed should have properties matching the model properties
    const _changedId: boolean = user.changed.id;
    const _changedName: boolean = user.changed.name;
    const _changedAge: boolean = user.changed.age;

    expect(typeof _changedId).toBe('boolean');
    expect(typeof _changedName).toBe('boolean');
    expect(typeof _changedAge).toBe('boolean');

    // @ts-expect-error - 'nonExistent' is not a valid changed property
    void user.changed.nonExistent;
  });
});
