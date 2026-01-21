import { randomUUID as uuid } from 'crypto';
import {
  getNeogma,
  closeNeogma,
  createOrdersModel,
  createUsersModel,
  ModelFactory,
} from '../testHelpers';

beforeAll(async () => {
  const neogma = getNeogma();
  await neogma.verifyConnectivity();
});

afterAll(async () => {
  await closeNeogma();
});

describe('validate', () => {
  it('throws on invalid data - minLength', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'ab', // Too short, minLength is 3
    });

    await expect(order.validate()).rejects.toThrow();
  });

  it('passes on valid data', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'Valid Name', // Valid, >= 3 characters
    });

    // Should not throw
    await expect(order.validate()).resolves.not.toThrow();
  });

  it('throws on invalid data - required field missing', async () => {
    const neogma = getNeogma();

    type TestAttributesI = {
      id: string;
      requiredField: string;
      optionalField?: string;
    };

    const TestModel = ModelFactory<TestAttributesI, object>(
      {
        label: 'Test',
        schema: {
          id: { type: 'string', required: true },
          requiredField: { type: 'string', required: true },
          optionalField: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
      },
      neogma,
    );

    const instance = TestModel.build({
      id: uuid(),
      // Missing requiredField
    } as TestAttributesI);

    await expect(instance.validate()).rejects.toThrow();
  });

  it('passes when optional field is missing', async () => {
    const neogma = getNeogma();

    type TestAttributesI = {
      id: string;
      requiredField: string;
      optionalField?: string;
    };

    const TestModel = ModelFactory<TestAttributesI, object>(
      {
        label: 'Test',
        schema: {
          id: { type: 'string', required: true },
          requiredField: { type: 'string', required: true },
          optionalField: { type: 'string', required: false },
        },
        primaryKeyField: 'id',
      },
      neogma,
    );

    const instance = TestModel.build({
      id: uuid(),
      requiredField: 'value',
      // optionalField is missing, which is fine
    });

    await expect(instance.validate()).resolves.not.toThrow();
  });

  it('throws on invalid data - type mismatch', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = Users.build({
      id: uuid(),
      name: 'Valid Name',
      age: 'not a number' as any, // age should be a number
    });

    await expect(user.validate()).rejects.toThrow();
  });

  it('throws on invalid data - minimum value', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const user = Users.build({
      id: uuid(),
      name: 'Valid Name',
      age: -1, // age minimum is 0
    });

    await expect(user.validate()).rejects.toThrow();
  });

  it('validates nested relationship properties', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Create user with invalid relationship property
    await expect(
      Users.createOne({
        id: uuid(),
        name: 'User',
        Orders: {
          properties: [
            {
              id: uuid(),
              name: 'Order',
              Rating: 10, // Rating max is 5
            },
          ],
        },
      }),
    ).rejects.toThrow();
  });
});

/**
 * Type-level tests to ensure type safety is maintained.
 */
describe('validate type safety', () => {
  it('validate returns Promise<void>', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'Valid Order',
    });

    // validate should return Promise<void>
    const result: void = await order.validate();
    expect(result).toBeUndefined();
  });

  it('validation is called during save', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'ab', // Invalid - too short
    });

    // save() should validate and throw
    await expect(order.save()).rejects.toThrow();
  });

  it('validation can be skipped during save', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);

    const order = Orders.build({
      id: uuid(),
      name: 'ab', // Invalid - too short, but we'll skip validation
    });

    // save() with validate: false should not throw validation error
    await order.save({ validate: false });

    // But the data is still saved
    const found = await Orders.findOne({ where: { id: order.id } });
    expect(found?.name).toBe('ab');
  });
});
