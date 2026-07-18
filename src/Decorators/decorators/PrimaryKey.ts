import type { TSchema } from 'typebox/type';

import { NeogmaModelSchemaError } from '../../Errors';
import {
  getOrCreateMetadata,
  NEOGMA_PRIMARY_KEY_FIELD,
  NEOGMA_PROPERTIES_KEY,
  type PropertyMetadata,
} from '../metadata';

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
    const propertyKey = String(context.name);

    // ── Primary-key uniqueness guard ──
    const existing = context.metadata[NEOGMA_PRIMARY_KEY_FIELD] as
      string | undefined;
    if (existing !== undefined) {
      throw new NeogmaModelSchemaError(
        `@PrimaryKey applied to field "${propertyKey}" but field "${existing}" ` +
          `is already marked as primary key. Only one field per class may be ` +
          `decorated with @PrimaryKey.`,
        { propertyKey },
      );
    }
    context.metadata[NEOGMA_PRIMARY_KEY_FIELD] = propertyKey;

    // ── Auto-register as @Property (unless already decorated) ──
    const properties = getOrCreateMetadata<PropertyMetadata[]>(
      context.metadata,
      NEOGMA_PROPERTIES_KEY,
      [],
    );
    if (!properties.some((p) => p.propertyKey === propertyKey)) {
      properties.push({ propertyKey, schema });
    }
  };
}
