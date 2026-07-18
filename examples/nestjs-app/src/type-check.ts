/**
 * Compile-time type-safety verification.
 * This file is NOT meant to be executed — it only tests that ModelOf
 * provides proper type inference for createOne, findOne, etc.
 *
 * If the types are working:
 * - Lines marked "OK" should compile
 * - Lines marked @ts-expect-error should fail (proving types are NOT any)
 */
import type { OrderModel, UserModel } from './models';

// Verify createOne knows about the required properties
declare const Users: UserModel;
declare const Orders: OrderModel;

// OK: valid create
const _validUser: Promise<any> = Users.createOne({
  id: 'u1',
  name: 'Alice',
  email: 'alice@example.com',
});

// OK: with optional age
const _validUserWithAge: Promise<any> = Users.createOne({
  id: 'u2',
  name: 'Bob',
  email: 'bob@example.com',
  age: 25,
});

// OK: valid order
const _validOrder: Promise<any> = Orders.createOne({
  id: 'o1',
  item: 'Widget',
  quantity: 3,
});

// Verify findOne where clause knows properties
const _findResult: Promise<any> = Users.findOne({
  where: { id: 'u1' },
});

// --- Negative tests: these MUST produce type errors ---
// If @ts-expect-error is "unused" (i.e., the line compiles without error),
// that means the types are `any` and NOT providing type safety.

// @ts-expect-error — 'bogusField' is not a user property
Users.createOne({ id: 'x', name: 'y', email: 'z', bogusField: 123 });

// @ts-expect-error — missing required 'item' field on Order
Orders.createOne({ id: 'x', quantity: 1 });

// @ts-expect-error — 'age' should be number, not string
Users.createOne({ id: 'x', name: 'y', email: 'z', age: 'old' });
