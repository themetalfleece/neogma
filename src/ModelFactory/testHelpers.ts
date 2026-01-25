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

// ============ Order Model Types ============
export type OrderAttributesI = {
  name: string;
  id: string;
};

export type OrdersRelatedNodesI = object;
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
 * Creates a simple Orders model for testing.
 */
export function createOrdersModel(neogmaInstance?: Neogma): OrdersModel {
  const n = neogmaInstance ?? getNeogma();
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
      },
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
