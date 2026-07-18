import type { TSchema } from 'typebox/type';

import { registerProperty, tc39Store } from '../core';

/**
 * Field decorator that marks a class field as a node property.
 *
 * @param schema - Optional TypeBox schema (e.g. `Type.String({ minLength: 3 })`).
 *   If omitted, the property is tracked but not validated.
 *
 * @example
 * ```typescript
 * import Type from 'typebox';
 *
 * @Property(Type.String({ minLength: 3 }))
 * name!: string;
 *
 * @Property(Type.Optional(Type.Number({ minimum: 0 })))
 * age?: number;
 *
 * // Tracked but unvalidated
 * @Property()
 * id!: string;
 * ```
 */
export function Property(schema?: TSchema) {
  return function (
    _value: undefined,
    context: ClassFieldDecoratorContext,
  ): void {
    registerProperty(tc39Store(context.metadata), String(context.name), schema);
  };
}
