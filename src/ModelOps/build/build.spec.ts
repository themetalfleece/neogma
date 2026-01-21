import { randomUUID as uuid } from 'crypto';

import { QueryBuilder } from '../../Queries';
import { QueryRunner } from '../../Queries/QueryRunner';
import {
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  getNeogma,
  OrderAttributesI,
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

describe('build', () => {
  it('builds an instance from an existing node', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const userId = uuid();

    await Users.createOne({
      id: userId,
      name: 'will be changed',
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

    const userName = uuid();
    userInstance.name = userName;

    await userInstance.save();

    const finalUserInDbResult = await new QueryBuilder()
      .match({
        model: Users,
        identifier: 'n',
        where: {
          id: userId,
        },
      })
      .return('n')
      .run();

    const finalUsersInDb = getResultProperties<UserAttributesI>(
      finalUserInDbResult,
      'n',
    );

    expect(finalUsersInDb.length).toBe(1);

    const finalUserInDbData = finalUsersInDb[0];

    expect(finalUserInDbData.name).toBe(userName);
  });
});

describe('buildFromRecord', () => {
  it('builds an instance from a query result record', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const orderData: OrderAttributesI = {
      id: uuid(),
      name: uuid(),
    };

    await Orders.createOne(orderData);

    const existingOrderInDbResult = await new QueryBuilder()
      .match({
        model: Orders,
        identifier: 'n',
        where: {
          id: orderData.id,
        },
      })
      .return('n')
      .run();

    const orderInstance = Orders.buildFromRecord(
      existingOrderInDbResult.records[0].get('n'),
    );

    expect(orderInstance.getDataValues()).toEqual(orderData);
    expect(orderInstance.labels.sort()).toEqual(Orders.getRawLabels().sort());
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('type safety', () => {
  it('build returns correctly typed instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const userData: UserAttributesI = {
      id: uuid(),
      name: 'Test User',
    };

    const userInstance = Users.build(userData);

    // Type tests: valid property access should compile
    const _id: string = userInstance.id;
    const _name: string = userInstance.name;
    expect(_id).toBe(userData.id);
    expect(_name).toBe(userData.name);

    // Instance methods should be available
    const _dataValues = userInstance.getDataValues();
    expect(_dataValues.id).toBe(userData.id);

    // @ts-expect-error - 'nonExistent' is not a valid property
    void userInstance.nonExistent;
  });

  it('build data parameter accepts model properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    // Valid build with all properties
    const order = Orders.build({
      id: uuid(),
      name: 'Test Order',
    });

    expect(order.id).toBeTruthy();
    expect(order.name).toBe('Test Order');
  });

  it('buildFromRecord returns correctly typed instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const orderData: OrderAttributesI = {
      id: uuid(),
      name: uuid(),
    };

    await Orders.createOne(orderData);

    const existingOrderInDbResult = await new QueryBuilder()
      .match({
        model: Orders,
        identifier: 'n',
        where: { id: orderData.id },
      })
      .return('n')
      .run();

    const orderInstance = Orders.buildFromRecord(
      existingOrderInDbResult.records[0].get('n'),
    );

    // Type tests: valid property access should compile
    const _id: string = orderInstance.id;
    const _name: string = orderInstance.name;
    expect(_id).toBe(orderData.id);
    expect(_name).toBe(orderData.name);

    // Instance methods should be available
    expect(orderInstance.__existsInDatabase).toBe(true);

    // @ts-expect-error - 'nonExistent' is not a valid property
    void orderInstance.nonExistent;
  });
});

/**
 * Instance status and validation tests.
 */
describe('instance status', () => {
  it('build with status "new" sets __existsInDatabase to false', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build(
      { id: uuid(), name: 'New Order' },
      { status: 'new' },
    );

    expect(order.__existsInDatabase).toBe(false);
  });

  it('build with status "existing" sets __existsInDatabase to true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build(
      { id: uuid(), name: 'Existing Order' },
      { status: 'existing' },
    );

    expect(order.__existsInDatabase).toBe(true);
  });

  it('build without status defaults to new instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({ id: uuid(), name: 'Default Order' });

    expect(order.__existsInDatabase).toBe(false);
  });

  it('build tracks changed properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build(
      { id: uuid(), name: 'Original' },
      { status: 'existing' },
    );

    // Initially properties are tracked but not changed (set to false)
    expect(order.changed.id).toBe(false);
    expect(order.changed.name).toBe(false);

    // Modify property
    order.name = 'Changed';

    // changed should track the modification
    expect(order.changed.name).toBe(true);
    // id should still be unchanged
    expect(order.changed.id).toBe(false);
  });

  it('getDataValues returns only model properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = Users.build({
      id: uuid(),
      name: 'Test User',
      age: 25,
    });

    const dataValues = user.getDataValues();

    // Should only contain model properties
    expect(dataValues).toHaveProperty('id');
    expect(dataValues).toHaveProperty('name');
    expect(dataValues).toHaveProperty('age');

    // Should not contain instance metadata
    expect(dataValues).not.toHaveProperty('__existsInDatabase');
    expect(dataValues).not.toHaveProperty('changed');
    expect(dataValues).not.toHaveProperty('dataValues');
  });

  it('validate throws on invalid data', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'ab', // Too short, minLength is 3
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it('validate passes on valid data', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'Valid Name',
    });

    // Should not throw
    await expect(order.validate()).resolves.not.toThrow();
  });
});
