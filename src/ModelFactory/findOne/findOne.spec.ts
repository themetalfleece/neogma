import { randomUUID as uuid } from 'crypto';

import { NeogmaNotFoundError } from '../../Errors';
import { Op } from '../../Where';
import {
  closeNeogma,
  createOrdersModel,
  createProductsModel,
  createSuppliersModel,
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

/**
 * findOne with relationships - behavior tests
 */
describe('findOne with relationships', () => {
  it('returns a single node with eager-loaded relationships', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Create test data
    const userId = uuid();
    const orderId = uuid();

    const user = await Users.createOne({
      id: userId,
      name: 'Test User',
    });

    const order = await Orders.createOne({
      id: orderId,
      name: 'Test Order',
    });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 5 },
    });

    // Find with relationship
    const foundUser = await Users.findOne({
      where: { id: userId },
      relationships: { Orders: {} },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(userId);
    expect(foundUser?.Orders).toBeDefined();
    expect(foundUser?.Orders?.length).toBe(1);
    expect(foundUser?.Orders?.[0].node.id).toBe(orderId);
    expect(foundUser?.Orders?.[0].relationship.rating).toBe(5);
  });

  it('returns null when node not found with relationships', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    const result = await Users.findOne({
      where: { id: 'non-existent' },
      relationships: { Orders: {} },
    });

    expect(result).toBeNull();
  });

  it('returns nested relationships (2 levels)', async () => {
    const neogma = getNeogma();
    const Suppliers = createSuppliersModel(neogma);
    const Products = createProductsModel(Suppliers, neogma);
    const Orders = createOrdersModel(neogma, Products);
    const Users = createUsersModel(Orders, neogma);

    // Create test data
    const userId = uuid();
    const orderId = uuid();
    const productId = uuid();

    const user = await Users.createOne({
      id: userId,
      name: 'Nested Test User',
    });
    const order = await Orders.createOne({
      id: orderId,
      name: 'Nested Test Order',
    });
    const product = await Products.createOne({
      id: productId,
      name: 'Nested Test Product',
    });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 4 },
    });

    await order.relateTo({
      alias: 'Products',
      where: { id: product.id },
      properties: { Quantity: 3 },
    });

    // Find with nested relationships
    const foundUser = await Users.findOne({
      where: { id: userId },
      relationships: {
        Orders: {
          relationships: {
            Products: {},
          },
        },
      },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.Orders?.length).toBe(1);
    expect(foundUser?.Orders?.[0].node.Products?.length).toBe(1);
    expect(foundUser?.Orders?.[0].node.Products?.[0].node.id).toBe(productId);
    expect(
      foundUser?.Orders?.[0].node.Products?.[0].relationship.quantity,
    ).toBe(3);
  });

  it('returns plain object with relationships when plain: true', async () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Create test data
    const userId = uuid();
    const orderId = uuid();

    const user = await Users.createOne({ id: userId, name: 'Plain Test User' });
    const order = await Orders.createOne({
      id: orderId,
      name: 'Plain Test Order',
    });

    await user.relateTo({
      alias: 'Orders',
      where: { id: order.id },
      properties: { Rating: 3 },
    });

    const foundUser = await Users.findOne({
      where: { id: userId },
      plain: true,
      relationships: { Orders: {} },
    });

    expect(foundUser).not.toBeNull();
    expect(foundUser?.id).toBe(userId);
    expect(foundUser?.Orders?.length).toBe(1);
    expect(foundUser?.Orders?.[0].node.id).toBe(orderId);
    // Plain objects don't have instance methods
    expect((foundUser as any)?.save).toBeUndefined();
    expect((foundUser?.Orders?.[0].node as any)?.save).toBeUndefined();
  });
});

/**
 * findOne with relationships - type tests
 */
describe('findOne with relationships type safety', () => {
  it('validates relationship alias names', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    // Valid alias
    typeCheck(() =>
      Users.findOne({
        relationships: { Orders: {} },
      }),
    );

    // Invalid alias should cause TypeScript error
    typeCheck(() =>
      Users.findOne({
        relationships: {
          // @ts-expect-error - 'InvalidAlias' is not a valid relationship
          InvalidAlias: {},
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('validates nested relationship alias names', () => {
    const neogma = getNeogma();
    const Suppliers = createSuppliersModel(neogma);
    const Products = createProductsModel(Suppliers, neogma);
    const Orders = createOrdersModel(neogma, Products);
    const Users = createUsersModel(Orders, neogma);

    // Valid nested alias
    typeCheck(() =>
      Users.findOne({
        relationships: {
          Orders: {
            relationships: {
              Products: {},
            },
          },
        },
      }),
    );

    // Invalid nested alias should cause TypeScript error
    typeCheck(() =>
      Users.findOne({
        relationships: {
          Orders: {
            relationships: {
              // @ts-expect-error - 'InvalidNestedAlias' is not a valid relationship on Orders
              InvalidNestedAlias: {},
            },
          },
        },
      }),
    );

    expect(true).toBe(true);
  });

  it('returns properly typed instance with relationships', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(async () => {
      const user = await Users.findOne({
        relationships: { Orders: {} },
      });

      if (user) {
        // Instance properties should be typed
        const _name: string = user.name;
        const _id: string = user.id;

        // Instance methods should be available
        const _dataValues = user.getDataValues();
        const _savePromise: Promise<typeof user> = user.save();

        // @ts-expect-error - 'invalidProp' does not exist
        user.invalidProp;
      }
    });

    expect(true).toBe(true);
  });

  it('returns properly typed plain object with relationships', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(async () => {
      const user = await Users.findOne({
        plain: true,
        relationships: { Orders: {} },
      });

      if (user) {
        // Properties should be typed
        const _name: string = user.name;
        const _id: string = user.id;

        // @ts-expect-error - 'getDataValues' does not exist on plain object
        user.getDataValues();

        // @ts-expect-error - 'save' does not exist on plain object
        user.save();
      }
    });

    expect(true).toBe(true);
  });

  it('types eager-loaded relationships correctly', () => {
    const neogma = getNeogma();
    const Suppliers = createSuppliersModel(neogma);
    const Products = createProductsModel(Suppliers, neogma);
    const Orders = createOrdersModel(neogma, Products);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(async () => {
      const user = await Users.findOne({
        relationships: {
          Orders: {
            relationships: {
              Products: {},
            },
          },
        },
      });

      if (user?.Orders?.[0]) {
        const order = user.Orders[0];

        // Order node should be typed
        const _orderName: string = order.node.name;
        const _orderId: string = order.node.id;

        // Relationship should be typed
        const _rating: number = order.relationship.rating;

        // @ts-expect-error - 'invalidProp' does not exist on Order
        order.node.invalidProp;

        // @ts-expect-error - 'invalidProp' does not exist on relationship
        order.relationship.invalidProp;
      }
    });

    expect(true).toBe(true);
  });

  it('types nested eager-loaded relationships correctly', () => {
    const neogma = getNeogma();
    const Suppliers = createSuppliersModel(neogma);
    const Products = createProductsModel(Suppliers, neogma);
    const Orders = createOrdersModel(neogma, Products);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(async () => {
      const user = await Users.findOne({
        relationships: {
          Orders: {
            relationships: {
              Products: {
                relationships: {
                  Supplier: {},
                },
              },
            },
          },
        },
      });

      if (user?.Orders?.[0]?.node.Products?.[0]) {
        const product = user.Orders[0].node.Products[0];

        // Product node should be typed
        const _productName: string = product.node.name;
        const _productPrice: number | undefined = product.node.price;

        // Product relationship should be typed
        const _quantity: number = product.relationship.quantity;

        // Nested Supplier should be typed
        if (product.node.Supplier?.[0]) {
          const supplier = product.node.Supplier[0];
          const _supplierName: string = supplier.node.name;

          // @ts-expect-error - 'invalidProp' does not exist on Supplier
          supplier.node.invalidProp;
        }
      }
    });

    expect(true).toBe(true);
  });

  it('instance methods are available on nested nodes', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(async () => {
      const user = await Users.findOne({
        relationships: { Orders: {} },
      });

      if (user?.Orders?.[0]) {
        const orderNode = user.Orders[0].node;

        // Instance methods should be available on nested nodes
        const dataValues = orderNode.getDataValues();
        const _name: string = dataValues.name;

        // save() should be available on nested nodes
        const _savePromise: Promise<typeof orderNode> = orderNode.save();
      }
    });

    expect(true).toBe(true);
  });

  it('plain nested nodes do not have instance methods', () => {
    const neogma = getNeogma();
    const Orders = createOrdersModel(neogma);
    const Users = createUsersModel(Orders, neogma);

    typeCheck(async () => {
      const user = await Users.findOne({
        plain: true,
        relationships: { Orders: {} },
      });

      if (user?.Orders?.[0]) {
        const orderNode = user.Orders[0].node;

        // Properties should be typed
        const _name: string = orderNode.name;

        // @ts-expect-error - 'getDataValues' does not exist on plain node
        orderNode.getDataValues();

        // @ts-expect-error - 'save' does not exist on plain node
        orderNode.save();
      }
    });

    expect(true).toBe(true);
  });
});
