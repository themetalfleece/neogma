import type { TSchema } from 'typebox/type';

import { NeogmaModelSchemaError } from '../../Errors';
import {
  getClassMetadataStore,
  NEOGMA_PROPERTIES_KEY,
  type PropertyMetadata,
} from '../metadata';

/**
 * Legacy property decorator that marks a class field as a node property.
 * Use this when your project has `experimentalDecorators: true` (e.g. NestJS).
 *
 * @param schema - Optional TypeBox schema (e.g. `Type.String({ minLength: 3 })`).
 *   If omitted, the property is tracked but not validated.
 *
 * @example
 * ```typescript
 * @Property(Type.String({ minLength: 3 }))
 * name!: string;
 * ```
 */
export function Property(schema?: TSchema) {
  return function (target: object, propertyKey: string): void {
    const store = getClassMetadataStore(target.constructor);
    if (!store[NEOGMA_PROPERTIES_KEY]) {
      store[NEOGMA_PROPERTIES_KEY] = [];
    }
    const properties = store[NEOGMA_PROPERTIES_KEY]!;
    if (
      properties.some((p: PropertyMetadata) => p.propertyKey === propertyKey)
    ) {
      throw new NeogmaModelSchemaError(
        `@Property decorator applied more than once to field "${propertyKey}". ` +
          `Each field may only carry a single @Property decoration.`,
        { propertyKey },
      );
    }
    properties.push({ propertyKey, schema });
  };
}
