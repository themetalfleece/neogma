import type { TSchema } from 'typebox/type';

import { registerProperty, weakMapStore } from '../core';
import { getClassMetadataStore } from '../metadata';

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
    registerProperty(
      weakMapStore(getClassMetadataStore(target.constructor)),
      propertyKey,
      schema,
    );
  };
}
