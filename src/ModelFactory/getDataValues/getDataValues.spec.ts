import { randomUUID as uuid } from 'crypto';

import type { OrderAttributesI, UserAttributesI } from '../testHelpers';
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

describe('getDataValues', () => {
  it('returns only model properties', async () => {
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
    expect(dataValues).not.toHaveProperty('labels');
    expect(dataValues).not.toHaveProperty('getDataValues');
    expect(dataValues).not.toHaveProperty('save');
    expect(dataValues).not.toHaveProperty('validate');
    expect(dataValues).not.toHaveProperty('delete');
  });

  it('returns correct values', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const orderData: OrderAttributesI = {
      id: uuid(),
      name: 'Test Order',
    };

    const order = Orders.build(orderData);
    const dataValues = order.getDataValues();

    expect(dataValues).toEqual(orderData);
  });

  it('returns updated values after modification', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const originalName = 'Original Name';
    const newName = 'New Name';

    const order = Orders.build({
      id: uuid(),
      name: originalName,
    });

    // Modify the instance
    order.name = newName;

    const dataValues = order.getDataValues();

    expect(dataValues.name).toBe(newName);
  });

  it('excludes undefined optional properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = Users.build({
      id: uuid(),
      name: 'Test User',
      // age is not set
    });

    const dataValues = user.getDataValues();

    expect(dataValues).toHaveProperty('id');
    expect(dataValues).toHaveProperty('name');
    expect(dataValues).not.toHaveProperty('age');
  });

  it('includes undefined optional properties when they are set', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = Users.build({
      id: uuid(),
      name: 'Test User',
      age: 25,
    });

    const dataValues = user.getDataValues();

    expect(dataValues).toHaveProperty('age');
    expect(dataValues.age).toBe(25);
  });

  it('dataValues property matches getDataValues()', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const orderData: OrderAttributesI = {
      id: uuid(),
      name: 'Test Order',
    };

    const order = Orders.build(orderData);

    // dataValues property should contain the same data
    expect(order.dataValues).toEqual(order.getDataValues());
  });

  it('dataValues property does not include relationship data', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Build a user with relationship data
    const user = Users.build({
      id: uuid(),
      name: 'Test User',
      age: 25,
      // Relationship data for creating related nodes
      Orders: {
        where: [
          {
            params: {
              name: 'test-order',
            },
          },
        ],
      },
    });

    // dataValues should only contain schema properties, NOT relationship data
    expect(user.dataValues).not.toHaveProperty('Orders');
    expect(user.dataValues).toHaveProperty('id');
    expect(user.dataValues).toHaveProperty('name');
    expect(user.dataValues).toHaveProperty('age');

    // dataValues property should match getDataValues()
    expect(user.dataValues).toEqual(user.getDataValues());
  });

  it('relationship aliases are accessible as getters on the instance', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const orderRelationshipData = {
      where: [
        {
          params: {
            name: 'test-order',
          },
        },
      ],
    };

    // Build a user with relationship data
    const user = Users.build({
      id: uuid(),
      name: 'Test User',
      Orders: orderRelationshipData,
    });

    // Relationship data should be accessible via the getter on the instance
    // This is used during createOne/createMany for creating related nodes
    expect((user as unknown as Record<string, unknown>).Orders).toEqual(
      orderRelationshipData,
    );

    // But it should NOT be in dataValues
    expect(user.dataValues).not.toHaveProperty('Orders');
    expect(user.getDataValues()).not.toHaveProperty('Orders');
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('getDataValues type safety', () => {
  it('getDataValues returns correct type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = Users.build({
      id: uuid(),
      name: 'Test User',
      age: 25,
    });

    const dataValues: UserAttributesI = user.getDataValues();

    // Type tests: valid property access should compile
    const _id: string = dataValues.id;
    const _name: string = dataValues.name;
    const _age: number | undefined = dataValues.age;

    expect(_id).toBeTruthy();
    expect(_name).toBeTruthy();
    expect(_age).toBe(25);

    // @ts-expect-error - 'nonExistent' is not a valid property
    void dataValues.nonExistent;

    // @ts-expect-error - instance methods should not be on data values
    void dataValues.save;

    // @ts-expect-error - instance metadata should not be on data values
    void dataValues.__existsInDatabase;
  });

  it('dataValues property has correct type', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'Test Order',
    });

    // dataValues should have the correct type
    const dataValues: OrderAttributesI = order.dataValues;

    const _id: string = dataValues.id;
    const _name: string = dataValues.name;

    expect(_id).toBeTruthy();
    expect(_name).toBeTruthy();

    // @ts-expect-error - 'nonExistent' is not a valid property
    void dataValues.nonExistent;
  });
});
