import { randomUUID as uuid } from 'crypto';

import { NeogmaNotFoundError } from '../../Errors/NeogmaNotFoundError';
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

describe('findMany with relationships (eager loading)', () => {
  describe('single level eager loading', () => {
    it('loads related nodes with their relationships', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Create user and orders
      const user = await Users.createOne({ id: uuid(), name: 'Test User' });
      const order1 = await Orders.createOne({
        id: uuid(),
        name: 'Order 1',
        status: 'active',
      });
      const order2 = await Orders.createOne({
        id: uuid(),
        name: 'Order 2',
        status: 'pending',
      });

      // Create relationships
      await user.relateTo({
        alias: 'Orders',
        where: { id: order1.id },
        properties: { Rating: 5 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: order2.id },
        properties: { Rating: 3 },
      });

      // Test findMany with relationships (eager loading)
      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {},
        },
      });

      expect(results.length).toBe(1);
      expect(results[0].id).toBe(user.id);
      expect(results[0].name).toBe('Test User');

      // Check eager-loaded Orders
      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(2);

      const order1Data = ordersData.find((o) => o.node.id === order1.id);
      const order2Data = ordersData.find((o) => o.node.id === order2.id);

      expect(order1Data).toBeTruthy();
      expect(order1Data?.node.name).toBe('Order 1');
      expect(order1Data?.relationship.rating).toBe(5);

      expect(order2Data).toBeTruthy();
      expect(order2Data?.node.name).toBe('Order 2');
      expect(order2Data?.relationship.rating).toBe(3);
    });

    it('filters related nodes with target where clause', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });
      const activeOrder = await Orders.createOne({
        id: uuid(),
        name: 'Active Order',
        status: 'active',
      });
      const pendingOrder = await Orders.createOne({
        id: uuid(),
        name: 'Pending Order',
        status: 'pending',
      });

      await user.relateTo({
        alias: 'Orders',
        where: { id: activeOrder.id },
        properties: { Rating: 5 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: pendingOrder.id },
        properties: { Rating: 3 },
      });

      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {
            where: {
              target: { status: 'active' },
            },
          },
        },
      });

      expect(results.length).toBe(1);
      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(1);
      expect(ordersData[0].node.status).toBe('active');
    });

    it('filters by relationship properties', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });
      const order1 = await Orders.createOne({ id: uuid(), name: 'Order 1' });
      const order2 = await Orders.createOne({ id: uuid(), name: 'Order 2' });

      await user.relateTo({
        alias: 'Orders',
        where: { id: order1.id },
        properties: { Rating: 5 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: order2.id },
        properties: { Rating: 2 },
      });

      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {
            where: {
              relationship: { rating: { [Op.gte]: 4 } },
            },
          },
        },
      });

      expect(results.length).toBe(1);
      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(1);
      expect(ordersData[0].relationship.rating).toBe(5);
    });

    it('orders related nodes', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });
      const orderA = await Orders.createOne({ id: uuid(), name: 'A_Order' });
      const orderB = await Orders.createOne({ id: uuid(), name: 'B_Order' });
      const orderC = await Orders.createOne({ id: uuid(), name: 'C_Order' });

      await user.relateTo({
        alias: 'Orders',
        where: { id: orderB.id },
        properties: { Rating: 2 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: orderA.id },
        properties: { Rating: 3 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: orderC.id },
        properties: { Rating: 1 },
      });

      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {
            order: [{ on: 'target', property: 'name', direction: 'ASC' }],
          },
        },
      });

      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(3);
      expect(ordersData[0].node.name).toBe('A_Order');
      expect(ordersData[1].node.name).toBe('B_Order');
      expect(ordersData[2].node.name).toBe('C_Order');
    });

    it('limits related nodes', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      for (let i = 0; i < 5; i++) {
        const order = await Orders.createOne({
          id: uuid(),
          name: `Order ${i}`,
        });
        await user.relateTo({
          alias: 'Orders',
          where: { id: order.id },
          properties: { Rating: i + 1 },
        });
      }

      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {
            limit: 2,
          },
        },
      });

      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(2);
    });

    it('returns empty array when no relationships exist', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({ id: uuid(), name: uuid() });

      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {},
        },
      });

      expect(results.length).toBe(1);
      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(0);
    });
  });

  describe('nested eager loading', () => {
    it('loads two levels of relationships', async () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Create data hierarchy
      const supplier = await Suppliers.createOne({
        id: uuid(),
        name: 'Supplier Co',
        country: 'USA',
      });
      const product = await Products.createOne({
        id: uuid(),
        name: 'Widget',
        price: 99,
      });
      const order = await Orders.createOne({
        id: uuid(),
        name: 'Order 1',
        status: 'active',
      });
      const user = await Users.createOne({ id: uuid(), name: 'Test User' });

      // Create relationships
      await product.relateTo({
        alias: 'Supplier',
        where: { id: supplier.id },
      });
      await order.relateTo({
        alias: 'Products',
        where: { id: product.id },
        properties: { Quantity: 10 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 5 },
      });

      // Test two-level eager loading
      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {
            relationships: {
              Products: {},
            },
          },
        },
      });

      expect(results.length).toBe(1);

      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(1);
      expect(ordersData[0].node.name).toBe('Order 1');

      const productsData = ordersData[0].node.Products as Array<{
        node: any;
        relationship: any;
      }>;
      expect(productsData.length).toBe(1);
      expect(productsData[0].node.name).toBe('Widget');
      expect(productsData[0].relationship.quantity).toBe(10);
    });

    it('loads three levels of relationships', async () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Create data hierarchy
      const supplier = await Suppliers.createOne({
        id: uuid(),
        name: 'Supplier Co',
        country: 'USA',
      });
      const product = await Products.createOne({
        id: uuid(),
        name: 'Widget',
        price: 99,
      });
      const order = await Orders.createOne({
        id: uuid(),
        name: 'Order 1',
        status: 'active',
      });
      const user = await Users.createOne({ id: uuid(), name: 'Test User' });

      // Create relationships
      await product.relateTo({
        alias: 'Supplier',
        where: { id: supplier.id },
      });
      await order.relateTo({
        alias: 'Products',
        where: { id: product.id },
        properties: { Quantity: 10 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 5 },
      });

      // Test three-level eager loading
      const results = await Users.findMany({
        where: { id: user.id },
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

      expect(results.length).toBe(1);

      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(1);

      const productsData = ordersData[0].node.Products as Array<{
        node: any;
        relationship: any;
      }>;
      expect(productsData.length).toBe(1);

      const supplierData = productsData[0].node.Supplier as Array<{
        node: any;
        relationship: any;
      }>;
      expect(supplierData.length).toBe(1);
      expect(supplierData[0].node.name).toBe('Supplier Co');
      expect(supplierData[0].node.country).toBe('USA');
    });

    it('filters at nested level', async () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Create data
      const supplier = await Suppliers.createOne({
        id: uuid(),
        name: 'Supplier Co',
      });
      const cheapProduct = await Products.createOne({
        id: uuid(),
        name: 'Cheap Widget',
        price: 10,
      });
      const expensiveProduct = await Products.createOne({
        id: uuid(),
        name: 'Expensive Widget',
        price: 1000,
      });
      const order = await Orders.createOne({ id: uuid(), name: 'Order 1' });
      const user = await Users.createOne({ id: uuid(), name: 'Test User' });

      // Create relationships
      await cheapProduct.relateTo({
        alias: 'Supplier',
        where: { id: supplier.id },
      });
      await expensiveProduct.relateTo({
        alias: 'Supplier',
        where: { id: supplier.id },
      });
      await order.relateTo({
        alias: 'Products',
        where: { id: cheapProduct.id },
        properties: { Quantity: 5 },
      });
      await order.relateTo({
        alias: 'Products',
        where: { id: expensiveProduct.id },
        properties: { Quantity: 1 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 4 },
      });

      // Filter products by price
      const results = await Users.findMany({
        where: { id: user.id },
        relationships: {
          Orders: {
            relationships: {
              Products: {
                where: {
                  target: { price: { [Op.gt]: 100 } },
                },
              },
            },
          },
        },
      });

      const ordersData = (results[0] as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      const productsData = ordersData[0].node.Products as Array<{
        node: any;
        relationship: any;
      }>;
      expect(productsData.length).toBe(1);
      expect(productsData[0].node.name).toBe('Expensive Widget');
    });
  });

  describe('root filtering and pagination', () => {
    it('filters root nodes with where clause', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const uniquePrefix = uuid().substring(0, 8);
      const user1 = await Users.createOne({
        id: uuid(),
        name: `${uniquePrefix}_Alice`,
        age: 25,
      });
      const user2 = await Users.createOne({
        id: uuid(),
        name: `${uniquePrefix}_Bob`,
        age: 30,
      });

      const order = await Orders.createOne({
        id: uuid(),
        name: 'Shared Order',
      });
      await user1.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 5 },
      });
      await user2.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 3 },
      });

      const results = await Users.findMany({
        where: { id: user1.id },
        relationships: {
          Orders: {},
        },
      });

      expect(results.length).toBe(1);
      expect(results[0].name).toBe(`${uniquePrefix}_Alice`);
    });

    it('orders root nodes', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const uniquePrefix = uuid().substring(0, 8);
      const user1 = await Users.createOne({
        id: uuid(),
        name: `${uniquePrefix}_Charlie`,
      });
      const user2 = await Users.createOne({
        id: uuid(),
        name: `${uniquePrefix}_Alice`,
      });
      const user3 = await Users.createOne({
        id: uuid(),
        name: `${uniquePrefix}_Bob`,
      });

      const results = await Users.findMany({
        where: {
          id: { [Op.in]: [user1.id, user2.id, user3.id] },
        },
        order: [['name', 'ASC']],
        relationships: {
          Orders: {},
        },
      });

      expect(results.length).toBe(3);
      expect(results[0].name).toBe(`${uniquePrefix}_Alice`);
      expect(results[1].name).toBe(`${uniquePrefix}_Bob`);
      expect(results[2].name).toBe(`${uniquePrefix}_Charlie`);
    });

    it('limits and skips root nodes', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const userIds: string[] = [];
      const uniquePrefix = uuid().substring(0, 8);
      for (let i = 0; i < 5; i++) {
        const user = await Users.createOne({
          id: uuid(),
          name: `${uniquePrefix}_User_${i}`,
        });
        userIds.push(user.id);
      }

      const results = await Users.findMany({
        where: { id: { [Op.in]: userIds } },
        order: [['name', 'ASC']],
        skip: 1,
        limit: 2,
        relationships: {
          Orders: {},
        },
      });

      expect(results.length).toBe(2);
      expect(results[0].name).toBe(`${uniquePrefix}_User_1`);
      expect(results[1].name).toBe(`${uniquePrefix}_User_2`);
    });
  });

  describe('error handling', () => {
    it('returns empty array when no root nodes match', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const results = await Users.findMany({
        where: { id: 'non-existent-id' },
        relationships: {
          Orders: {},
        },
      });

      expect(results).toEqual([]);
    });

    it('throws NeogmaNotFoundError when throwIfNoneFound is true and no matches', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      await expect(
        Users.findMany({
          where: { id: 'non-existent-id' },
          relationships: {
            Orders: {},
          },
          throwIfNoneFound: true,
        }),
      ).rejects.toThrow(NeogmaNotFoundError);
    });
  });

  describe('type safety', () => {
    it('validates relationship alias names at compile time', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Valid alias
      typeCheck(() =>
        Users.findMany({
          relationships: { Orders: {} },
        }),
      );

      // Invalid alias should cause TypeScript error
      typeCheck(() =>
        Users.findMany({
          // @ts-expect-error - 'InvalidAlias' is not a valid relationship
          relationships: { InvalidAlias: {} },
        }),
      );

      expect(true).toBe(true);
    });

    it('validates where property names for target', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Valid target where
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              where: {
                target: { name: 'test', id: 'test-id' },
              },
            },
          },
        }),
      );

      // Invalid property name should cause TypeScript error
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              where: {
                target: {
                  // @ts-expect-error - 'invalidProp' is not on Order
                  invalidProp: 'value',
                },
              },
            },
          },
        }),
      );

      expect(true).toBe(true);
    });

    it('validates order property names', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Valid order
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              order: [{ on: 'target', property: 'name', direction: 'ASC' }],
            },
          },
        }),
      );

      // Invalid property name should cause TypeScript error
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              order: [
                // @ts-expect-error - 'invalidProperty' is not on Order
                { on: 'target', property: 'invalidProperty', direction: 'ASC' },
              ],
            },
          },
        }),
      );

      expect(true).toBe(true);
    });

    it('validates nested relationship alias names (2 levels)', () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Valid nested alias
      typeCheck(() =>
        Users.findMany({
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
        Users.findMany({
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

    it('validates nested relationship alias names (3 levels)', () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Valid 3-level nesting
      typeCheck(() =>
        Users.findMany({
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
        }),
      );

      // Invalid alias at level 3 should cause TypeScript error
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              relationships: {
                Products: {
                  relationships: {
                    // @ts-expect-error - 'InvalidAlias' is not a valid relationship on Products
                    InvalidAlias: {},
                  },
                },
              },
            },
          },
        }),
      );

      expect(true).toBe(true);
    });

    it('validates nested where property names', () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Valid nested where
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              relationships: {
                Products: {
                  where: {
                    target: { name: 'Widget', price: 100 },
                  },
                },
              },
            },
          },
        }),
      );

      // Invalid property in nested where should cause TypeScript error
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              relationships: {
                Products: {
                  where: {
                    target: {
                      // @ts-expect-error - 'invalidProp' is not on Product
                      invalidProp: 'value',
                    },
                  },
                },
              },
            },
          },
        }),
      );

      expect(true).toBe(true);
    });

    it('validates nested order property names', () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Valid nested order
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              relationships: {
                Products: {
                  order: [
                    { on: 'target', property: 'price', direction: 'DESC' },
                  ],
                },
              },
            },
          },
        }),
      );

      // Invalid property in nested order should cause TypeScript error
      typeCheck(() =>
        Users.findMany({
          relationships: {
            Orders: {
              relationships: {
                Products: {
                  order: [
                    {
                      on: 'target',
                      // @ts-expect-error - 'invalidProperty' is not on Product
                      property: 'invalidProperty',
                      direction: 'ASC',
                    },
                  ],
                },
              },
            },
          },
        }),
      );

      expect(true).toBe(true);
    });

    it('returns properly typed instances', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
          relationships: { Orders: {} },
        });

        // Results should be typed as UsersInstance[]
        const user = results[0];
        if (user) {
          // Valid property access
          const _name: string = user.name;
          const _id: string = user.id;
          const _age: number | undefined = user.age;

          // Invalid property access should cause TypeScript error
          // @ts-expect-error - 'invalidProp' does not exist on User
          user.invalidProp;
        }
      });

      expect(true).toBe(true);
    });

    it('returns properly typed plain objects', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
          plain: true,
          relationships: { Orders: {} },
        });

        // Results should be typed as UserAttributesI[]
        const user = results[0];
        if (user) {
          // Valid property access
          const _name: string = user.name;
          const _id: string = user.id;
          const _age: number | undefined = user.age;

          // Invalid property access should cause TypeScript error
          // @ts-expect-error - 'invalidProp' does not exist on User properties
          user.invalidProp;
        }
      });

      expect(true).toBe(true);
    });

    it('instance methods are available on non-plain results', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
          relationships: { Orders: {} },
        });

        const user = results[0];
        if (user) {
          // Instance methods should be available and typed
          const dataValues = user.getDataValues();
          const _name: string = dataValues.name;

          // save() should be available
          const _savePromise: Promise<typeof user> = user.save();
        }
      });

      expect(true).toBe(true);
    });

    it('plain results do not have instance methods in types', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      typeCheck(async () => {
        const results = await Users.findMany({
          plain: true,
          relationships: { Orders: {} },
        });

        const user = results[0];
        if (user) {
          // @ts-expect-error - 'getDataValues' does not exist on plain object
          user.getDataValues();

          // @ts-expect-error - 'save' does not exist on plain object
          user.save();
        }
      });

      expect(true).toBe(true);
    });

    it('types eager-loaded relationships correctly on instances', () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
          relationships: {
            Orders: {
              relationships: {
                Products: {},
              },
            },
          },
        });

        const user = results[0];
        if (user && user.Orders) {
          // Orders should be typed as an array of { node, relationship }
          const order = user.Orders[0];
          if (order) {
            // node should be typed as OrdersInstance
            const _orderName: string = order.node.name;
            const _orderId: string = order.node.id;
            const _orderStatus: string | undefined = order.node.status;

            // relationship should be typed with the relationship properties
            const _rating: number = order.relationship.rating;

            // Invalid property access should cause TypeScript error
            // @ts-expect-error - 'invalidProp' does not exist on Order
            order.node.invalidProp;

            // @ts-expect-error - 'invalidProp' does not exist on relationship
            order.relationship.invalidProp;
          }
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

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
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

        const user = results[0];
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
            const _supplierCountry: string | undefined = supplier.node.country;

            // @ts-expect-error - 'invalidProp' does not exist on Supplier
            supplier.node.invalidProp;
          }
        }
      });

      expect(true).toBe(true);
    });

    it('types eager-loaded relationships correctly on plain objects', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
          plain: true,
          relationships: {
            Orders: {},
          },
        });

        const user = results[0];
        if (user?.Orders?.[0]) {
          const order = user.Orders[0];

          // node should be plain object (no instance methods)
          const _orderName: string = order.node.name;
          const _orderId: string = order.node.id;

          // relationship should be typed
          const _rating: number = order.relationship.rating;

          // @ts-expect-error - 'save' does not exist on plain node
          order.node.save;

          // @ts-expect-error - 'invalidProp' does not exist on plain Order
          order.node.invalidProp;
        }
      });

      expect(true).toBe(true);
    });

    it('allows calling instance methods on nested nodes', () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      // Pure type check - no actual database call
      typeCheck(async () => {
        const results = await Users.findMany({
          relationships: { Orders: {} },
        });

        const user = results[0];
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
  });

  describe('plain mode with relationships', () => {
    it('returns plain objects with relationships when plain: true', async () => {
      const neogma = getNeogma();
      const Orders = createOrdersModel(neogma);
      const Users = createUsersModel(Orders, neogma);

      const user = await Users.createOne({
        id: uuid(),
        name: 'Plain Test User',
      });
      const order = await Orders.createOne({
        id: uuid(),
        name: 'Plain Test Order',
        status: 'active',
      });

      await user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 5 },
      });

      const results = await Users.findMany({
        where: { id: user.id },
        plain: true,
        relationships: {
          Orders: {},
        },
      });

      expect(results.length).toBe(1);

      // Should be a plain object, not an instance
      const plainUser = results[0];
      expect(plainUser.id).toBe(user.id);
      expect(plainUser.name).toBe('Plain Test User');

      // Should not have instance methods
      expect((plainUser as any).save).toBeUndefined();
      expect((plainUser as any).getDataValues).toBeUndefined();

      // Should have relationships attached
      const ordersData = (plainUser as any).Orders as Array<{
        node: any;
        relationship: any;
      }>;
      expect(ordersData.length).toBe(1);
      expect(ordersData[0].node.id).toBe(order.id);
      expect(ordersData[0].node.name).toBe('Plain Test Order');
      expect(ordersData[0].relationship.rating).toBe(5);

      // Nested node should also be plain (no instance methods)
      expect(ordersData[0].node.save).toBeUndefined();
      expect(ordersData[0].node.getDataValues).toBeUndefined();
    });

    it('handles nested relationships with plain: true', async () => {
      const neogma = getNeogma();
      const Suppliers = createSuppliersModel(neogma);
      const Products = createProductsModel(Suppliers, neogma);
      const Orders = createOrdersModel(neogma, Products);
      const Users = createUsersModel(Orders, neogma);

      const supplier = await Suppliers.createOne({
        id: uuid(),
        name: 'Plain Test Supplier',
      });
      const product = await Products.createOne({
        id: uuid(),
        name: 'Plain Test Product',
        price: 100,
      });
      const order = await Orders.createOne({
        id: uuid(),
        name: 'Plain Test Order',
      });
      const user = await Users.createOne({
        id: uuid(),
        name: 'Plain Test User',
      });

      await product.relateTo({ alias: 'Supplier', where: { id: supplier.id } });
      await order.relateTo({
        alias: 'Products',
        where: { id: product.id },
        properties: { Quantity: 3 },
      });
      await user.relateTo({
        alias: 'Orders',
        where: { id: order.id },
        properties: { Rating: 4 },
      });

      const results = await Users.findMany({
        where: { id: user.id },
        plain: true,
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

      expect(results.length).toBe(1);

      const plainUser = results[0] as any;
      expect(plainUser.save).toBeUndefined();

      const ordersData = plainUser.Orders;
      expect(ordersData.length).toBe(1);
      expect(ordersData[0].node.save).toBeUndefined();

      const productsData = ordersData[0].node.Products;
      expect(productsData.length).toBe(1);
      expect(productsData[0].node.name).toBe('Plain Test Product');
      expect(productsData[0].node.save).toBeUndefined();

      const supplierData = productsData[0].node.Supplier;
      expect(supplierData.length).toBe(1);
      expect(supplierData[0].node.name).toBe('Plain Test Supplier');
      expect(supplierData[0].node.save).toBeUndefined();
    });
  });
});
