import type { TSchema } from 'typebox/type';

import { NeogmaModelSchemaError } from '../../Errors';
import {
  getClassMetadataStore,
  NEOGMA_PRIMARY_KEY_FIELD,
  NEOGMA_PROPERTIES_KEY,
  type PropertyMetadata,
} from '../metadata';

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
    const store = getClassMetadataStore(target.constructor);

    // ── Primary-key uniqueness guard ──
    const existing = store[NEOGMA_PRIMARY_KEY_FIELD];
    if (existing !== undefined) {
      throw new NeogmaModelSchemaError(
        `@PrimaryKey applied to field "${propertyKey}" but field "${existing}" ` +
          `is already marked as primary key. Only one field per class may be ` +
          `decorated with @PrimaryKey.`,
        { propertyKey },
      );
    }
    store[NEOGMA_PRIMARY_KEY_FIELD] = propertyKey;

    // ── Auto-register as @Property (unless already decorated) ──
    if (!store[NEOGMA_PROPERTIES_KEY]) {
      store[NEOGMA_PROPERTIES_KEY] = [];
    }
    const properties = store[NEOGMA_PROPERTIES_KEY]!;
    if (
      !properties.some((p: PropertyMetadata) => p.propertyKey === propertyKey)
    ) {
      properties.push({ propertyKey, schema });
    }
  };
}
