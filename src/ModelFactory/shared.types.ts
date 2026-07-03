import type { TSchema } from 'typebox/type';

import type { Runnable } from '../QueryRunner';

export type AnyObject = Record<string, any>;

export interface GenericConfiguration {
  session?: Runnable | null;
}

/**
 * Per-property schema accepted by ModelFactory. TypeBox `TSchema` is the
 * primary, recommended form. The revalidator-shaped variants are kept as a
 * legacy compatibility layer for pre-TypeBox schemas.
 *
 * @example
 * ```typescript
 * import Type from 'typebox';
 *
 * // Preferred — TypeBox
 * schema: {
 *   name: Type.String({ minLength: 3 }),
 *   age: Type.Optional(Type.Number({ minimum: 0 })),
 * }
 *
 * // Legacy — revalidator
 * schema: {
 *   name: { type: 'string', minLength: 3, required: true },
 * }
 * ```
 */
export type PropertySchema<T = AnyObject> =
  TSchema | IValidationSchema<T> | Revalidator.JSONSchema<T>;

/**
 * Revalidator-based schema entry.
 *
 * @deprecated Provide a TypeBox `TSchema` instead (e.g. `Type.String({ minLength: 3 })`).
 *             This shape is preserved only for backward compatibility.
 */
export type IValidationSchema<T = AnyObject> = Revalidator.ISchema<T> & {
  required: boolean;
};
