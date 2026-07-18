import type { TSchema } from 'typebox/type';

import { registerPrimaryKey, tc39Store } from '../core';

/**
 * Field decorator that marks a property as the primary key for the node model.
 *
 * Automatically registers the field as a `@Property` as well, so you do NOT
 * need to stack `@PrimaryKey()` with `@Property()`. If you pass a TypeBox
 * schema it is forwarded to the property registration; if omitted, the field
 * defaults to `Type.String()` (the most common primary-key type).
 *
 * At most one field per class may carry this decorator.
 *
 * @param schema - Optional TypeBox schema. Defaults to an unvalidated
 *   property entry (same as bare `@Property()`). Pass e.g.
 *   `Type.String({ format: 'uuid' })` for stricter validation.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @PrimaryKey()
 *   id!: string;
 *
 *   @Property(Type.String({ minLength: 3 }))
 *   name!: string;
 * }
 * ```
 */
export function PrimaryKey(schema?: TSchema) {
  return function (
    _value: undefined,
    context: ClassFieldDecoratorContext,
  ): void {
    registerPrimaryKey(
      tc39Store(context.metadata),
      String(context.name),
      schema,
    );
  };
}
