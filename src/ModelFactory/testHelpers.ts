import Type from 'typebox';

import {
  clearModelRegistry,
  Node,
  NodeEntity,
  PrimaryKey,
  Property,
  Relationship,
} from '../Decorators';
import { toModel } from '../Decorators/toModel';
import { Neogma } from '../Neogma';
import {
  ModelFactory,
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
} from '.';

// Shared neogma instance
let neogma: Neogma;

/**
 * Gets or creates the shared Neogma instance.
 */
export function getNeogma(): Neogma {
  if (!neogma) {
    neogma = new Neogma({
      url: process.env.NEO4J_URL ?? '',
      username: process.env.NEO4J_USERNAME ?? '',
      password: process.env.NEO4J_PASSWORD ?? '',
    });
  }
  return neogma;
}

/**
 * Closes the shared Neogma connection.
 */
export async function closeNeogma(): Promise<void> {
  if (neogma) {
    await neogma.driver.close();
  }
}

// ============ Supplier Model Types ============
export type SupplierAttributesI = {
  name: string;
  id: string;
  country?: string;
};

export type SuppliersRelatedNodesI = object;
export type SuppliersMethodsI = object;
export type SuppliersStaticsI = object;

export type SuppliersInstance = NeogmaInstance<
  SupplierAttributesI,
  SuppliersRelatedNodesI,
  SuppliersMethodsI
>;

export type SuppliersModel = NeogmaModel<
  SupplierAttributesI,
  SuppliersRelatedNodesI,
  SuppliersMethodsI,
  SuppliersStaticsI
>;

// ============ Product Model Types ============
export type ProductAttributesI = {
  name: string;
  id: string;
  price?: number;
};

export interface ProductsRelatedNodesI {
  Supplier: ModelRelatedNodesI<
    SuppliersModel,
    SuppliersInstance,
    object,
    object
  >;
}

export type ProductsMethodsI = object;
export type ProductsStaticsI = object;

export type ProductsInstance = NeogmaInstance<
  ProductAttributesI,
  ProductsRelatedNodesI,
  ProductsMethodsI
>;

export type ProductsModel = NeogmaModel<
  ProductAttributesI,
  ProductsRelatedNodesI,
  ProductsMethodsI,
  ProductsStaticsI
>;

// ============ Order Model Types ============
export type OrderAttributesI = {
  name: string;
  id: string;
  status?: string;
};

/**
 * OrdersRelatedNodesI defines Products as a required type for proper type inference
 * in tests that use nested relationships. Note that createOrdersModel() only adds
 * the Products relationship when the optional `products` argument is provided.
 * Tests using Products should pass the products argument to createOrdersModel().
 */
export interface OrdersRelatedNodesI {
  Products: ModelRelatedNodesI<
    ProductsModel,
    ProductsInstance,
    {
      Quantity: number;
    },
    {
      quantity: number;
    }
  >;
}

export type OrdersMethodsI = object;
export type OrdersStaticsI = object;

export type OrdersInstance = NeogmaInstance<
  OrderAttributesI,
  OrdersRelatedNodesI,
  OrdersMethodsI
>;

export type OrdersModel = NeogmaModel<
  OrderAttributesI,
  OrdersRelatedNodesI,
  OrdersMethodsI,
  OrdersStaticsI
>;

// ============ User Model Types ============
export type UserAttributesI = {
  name: string;
  age?: number;
  id: string;
};

export interface UsersRelatedNodesI {
  Orders: ModelRelatedNodesI<
    OrdersModel,
    OrdersInstance,
    {
      Rating: number;
    },
    {
      rating: number;
    }
  >;
}

export type UsersMethodsI = object;

export interface UsersStaticsI {
  foo: () => string;
}

export type UsersInstance = NeogmaInstance<
  UserAttributesI,
  UsersRelatedNodesI,
  UsersMethodsI
>;

export type UsersModel = NeogmaModel<
  UserAttributesI,
  UsersRelatedNodesI,
  UsersMethodsI,
  UsersStaticsI
>;

// ============ Decorated Class Definitions ============

@Node({ label: 'Supplier' })
class SupplierNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.Optional(Type.String()))
  country?: string;
}

@Node({ label: 'Product' })
class ProductNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.Optional(Type.Number()))
  price?: number;

  @Relationship({
    name: 'SUPPLIED_BY',
    direction: 'out',
    model: () => SupplierNode,
  })
  Supplier!: any;
}

@Node({ label: 'Order' })
class OrderNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @PrimaryKey(Type.String())
  id!: string;

  @Property(Type.Optional(Type.String()))
  status?: string;

  // Products relationship added conditionally via addRelationships()
}

@Node({ label: 'User' })
class UserNode extends NodeEntity {
  @Property(Type.String({ minLength: 3 }))
  name!: string;

  @Property(Type.Optional(Type.Number({ minimum: 0 })))
  age?: number;

  @PrimaryKey(Type.String())
  id!: string;

  @Relationship({
    name: 'CREATES',
    direction: 'out',
    model: () => OrderNode,
    properties: {
      Rating: {
        property: 'rating',
        schema: Type.Number({ minimum: 1, maximum: 5 }),
      },
    },
  })
  Orders!: any;

  static foo() {
    return 'foo';
  }
}

// ============ Model Factory Functions ============

/**
 * Creates a simple Suppliers model for testing.
 */
export function createSuppliersModel(neogmaInstance?: Neogma): SuppliersModel {
  const n = neogmaInstance ?? getNeogma();
  return toModel<
    SupplierAttributesI,
    SuppliersRelatedNodesI,
    SuppliersStaticsI,
    SuppliersMethodsI
  >(SupplierNode, n);
}

/**
 * Creates a Products model with relationship to Suppliers for testing.
 */
export function createProductsModel(
  _suppliers: SuppliersModel,
  neogmaInstance?: Neogma,
): ProductsModel {
  const n = neogmaInstance ?? getNeogma();
  return toModel<
    ProductAttributesI,
    ProductsRelatedNodesI,
    ProductsStaticsI,
    ProductsMethodsI
  >(ProductNode, n);
}

/**
 * Creates an Orders model with optional relationship to Products for testing.
 * @param neogmaInstance - The Neogma instance to use
 * @param products - Optional Products model to create relationship with
 */
export function createOrdersModel(
  neogmaInstance?: Neogma,
  products?: ProductsModel,
): OrdersModel {
  const n = neogmaInstance ?? getNeogma();
  const Orders = toModel<
    OrderAttributesI,
    OrdersRelatedNodesI,
    OrdersStaticsI,
    OrdersMethodsI
  >(OrderNode, n);

  if (products) {
    Orders.addRelationships({
      Products: {
        model: products,
        direction: 'out',
        name: 'HAS_ITEM',
        properties: {
          Quantity: {
            property: 'quantity',
            schema: {
              type: 'number',
              minimum: 1,
              required: true,
            },
          },
        },
      },
    });
  }

  return Orders;
}

/**
 * Creates a Users model with relationship to Orders for testing.
 */
export function createUsersModel(
  _orders: OrdersModel,
  neogmaInstance?: Neogma,
): UsersModel {
  const n = neogmaInstance ?? getNeogma();
  // OrderNode already registered by prior createOrdersModel call
  return toModel<
    UserAttributesI,
    UsersRelatedNodesI,
    UsersStaticsI,
    UsersMethodsI
  >(UserNode, n);
}

// ============ Type Testing Utilities ============

/**
 * A no-op function for compile-time type checking in tests.
 * Accepts a function that returns void but doesn't execute it.
 * This allows testing TypeScript type errors with @ts-expect-error
 * without actually running the code at runtime.
 *
 * @example
 * ```typescript
 * // Verify that invalid types cause TypeScript errors
 * typeCheck(() =>
 *   Users.findMany({
 *     where: {
 *       // @ts-expect-error - 'age' expects number, not string
 *       age: 'invalid',
 *     },
 *   }),
 * );
 * ```
 */
export const typeCheck = (_fn: () => void): void => {};

// Re-export for convenience
export {
  clearModelRegistry,
  ModelFactory,
  ModelRelatedNodesI,
  NeogmaInstance,
  NeogmaModel,
};
