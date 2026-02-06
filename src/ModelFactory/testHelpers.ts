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

// ============ Model Factory Functions ============

/**
 * Creates a simple Suppliers model for testing.
 */
export function createSuppliersModel(neogmaInstance?: Neogma): SuppliersModel {
  const n = neogmaInstance ?? getNeogma();
  return ModelFactory<
    SupplierAttributesI,
    SuppliersRelatedNodesI,
    SuppliersStaticsI,
    SuppliersMethodsI
  >(
    {
      label: 'Supplier',
      schema: {
        name: {
          type: 'string',
          minLength: 3,
          required: true,
        },
        id: {
          type: 'string',
          required: true,
        },
        country: {
          type: 'string',
          required: false,
        },
      },
      primaryKeyField: 'id',
      statics: {},
      methods: {},
    },
    n,
  );
}

/**
 * Creates a Products model with relationship to Suppliers for testing.
 */
export function createProductsModel(
  suppliers: SuppliersModel,
  neogmaInstance?: Neogma,
): ProductsModel {
  const n = neogmaInstance ?? getNeogma();
  return ModelFactory<
    ProductAttributesI,
    ProductsRelatedNodesI,
    ProductsStaticsI,
    ProductsMethodsI
  >(
    {
      label: 'Product',
      schema: {
        name: {
          type: 'string',
          minLength: 3,
          required: true,
        },
        id: {
          type: 'string',
          required: true,
        },
        price: {
          type: 'number',
          required: false,
        },
      },
      relationships: {
        Supplier: {
          model: suppliers,
          direction: 'out',
          name: 'SUPPLIED_BY',
        },
      },
      primaryKeyField: 'id',
      statics: {},
      methods: {},
    },
    n,
  );
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
  const relationships: OrdersModel['relationships'] = {};

  if (products) {
    relationships.Products = {
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
    };
  }

  return ModelFactory<
    OrderAttributesI,
    OrdersRelatedNodesI,
    OrdersStaticsI,
    OrdersMethodsI
  >(
    {
      label: 'Order',
      schema: {
        name: {
          type: 'string',
          minLength: 3,
          required: true,
        },
        id: {
          type: 'string',
          required: true,
        },
        status: {
          type: 'string',
          required: false,
        },
      },
      relationships,
      primaryKeyField: 'id',
      statics: {},
      methods: {},
    },
    n,
  );
}

/**
 * Creates a Users model with relationship to Orders for testing.
 */
export function createUsersModel(
  orders: OrdersModel,
  neogmaInstance?: Neogma,
): UsersModel {
  const n = neogmaInstance ?? getNeogma();
  return ModelFactory<
    UserAttributesI,
    UsersRelatedNodesI,
    UsersStaticsI,
    UsersMethodsI
  >(
    {
      label: 'User',
      schema: {
        name: {
          type: 'string',
          minLength: 3,
          required: true,
        },
        age: {
          type: 'number',
          minimum: 0,
          required: false,
        },
        id: {
          type: 'string',
          required: true,
        },
      },
      relationships: {
        Orders: {
          model: orders,
          direction: 'out',
          name: 'CREATES',
          properties: {
            Rating: {
              property: 'rating',
              schema: {
                type: 'number',
                minimum: 1,
                maximum: 5,
                required: true,
              },
            },
          },
        },
      },
      primaryKeyField: 'id',
      statics: {
        foo: () => 'foo',
      },
      methods: {},
    },
    n,
  );
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
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const typeCheck = (_fn: () => void): void => {};

// Re-export for convenience
export { ModelFactory, ModelRelatedNodesI, NeogmaInstance, NeogmaModel };
