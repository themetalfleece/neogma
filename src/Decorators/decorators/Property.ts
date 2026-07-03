import type { TSchema } from 'typebox/type';

import { NeogmaModelSchemaError } from '../../Errors';
import {
  getOrCreateMetadata,
  NEOGMA_PROPERTIES_KEY,
  type PropertyMetadata,
} from '../metadata';

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
    const propertyKey = String(context.name);
    const properties = getOrCreateMetadata<PropertyMetadata[]>(
      context.metadata,
      NEOGMA_PROPERTIES_KEY,
      [],
    );
    if (properties.some((p) => p.propertyKey === propertyKey)) {
      throw new NeogmaModelSchemaError(
        `@Property decorator applied more than once to field "${propertyKey}". ` +
          `Each field may only carry a single @Property decoration.`,
        { propertyKey },
      );
    }
    properties.push({
      propertyKey,
      schema,
    });
  };
}
