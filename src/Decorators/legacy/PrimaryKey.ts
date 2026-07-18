import type { TSchema } from 'typebox/type';

import { registerPrimaryKey, weakMapStore } from '../core';
import { getClassMetadataStore } from '../metadata';

/**
 * Legacy field decorator that marks a property as the primary key for the node model.
 * Use this when your project has `experimentalDecorators: true` (e.g. NestJS).
 *
 * Automatically registers the field as a `@Property` as well, so you do NOT
 * need to stack `@PrimaryKey()` with `@Property()`. If you pass a TypeBox
 * schema it is forwarded to the property registration; if omitted, the field
 * defaults to an unvalidated property entry (same as bare `@Property()`).
 *
 * At most one field per class may carry this decorator.
 *
 * @param schema - Optional TypeBox schema for the primary key field.
 *
 * @example
 * ```typescript
 * @Node({ label: 'User' })
 * class UserNode extends NodeEntity {
 *   @PrimaryKey()
 *   id!: string;
 * }
 * ```
 */
export function PrimaryKey(schema?: TSchema) {
  return function (target: object, propertyKey: string): void {
    registerPrimaryKey(
      weakMapStore(getClassMetadataStore(target.constructor)),
      propertyKey,
      schema,
    );
  };
}
