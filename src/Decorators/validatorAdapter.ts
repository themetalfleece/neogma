import type { TSchema } from 'typebox/type';
import { Value } from 'typebox/value';

/**
 * Returns `true` when the given value is a TypeBox schema.
 * TypeBox v1 attaches a non-enumerable `~kind` string to every schema it
 * produces, which is what we use to distinguish TypeBox schemas from the
 * legacy revalidator-shaped entries that share `type` / `required` keys.
 */
export function isTSchema(schema: unknown): schema is TSchema {
  return (
    schema !== null &&
    typeof schema === 'object' &&
    typeof (schema as Record<string, unknown>)['~kind'] === 'string'
  );
}

/**
 * Returns `true` when a TypeBox schema is wrapped with `Type.Optional(...)`.
 * TypeBox v1 marks optionality via a non-enumerable `~optional` property.
 */
export function isOptional(schema: TSchema): boolean {
  return (schema as unknown as Record<string, unknown>)['~optional'] === true;
}

/**
 * Checks a single value against a TypeBox schema and returns
 * `Revalidator.IErrrorProperty` entries (one per validation issue), or an
 * empty array on success. Optional schemas short-circuit `undefined` because
 * TypeBox's `Value.Check` does not treat `Type.Optional(...)` as a top-level
 * skip — optionality only affects whether a parent Object includes the field
 * in its `required` array.
 */
export function checkSchema(
  property: string,
  schema: TSchema,
  value: unknown,
): Revalidator.IErrrorProperty[] {
  if (isOptional(schema) && value === undefined) {
    return [];
  }
  if (Value.Check(schema, value)) {
    return [];
  }
  const errors: Revalidator.IErrrorProperty[] = [];
  for (const issue of Value.Errors(schema, value)) {
    errors.push({ property, message: issue.message });
  }
  if (errors.length === 0) {
    // Value.Check returned false but Value.Errors yielded nothing. Surface what
    // we have so the user can at least see the offending value, instead of a
    // generic "validation failed" with no context.
    let printable: string;
    try {
      printable = JSON.stringify(value);
    } catch {
      printable = String(value);
    }
    errors.push({
      property,
      message: `TypeBox validation failed for property "${property}" (value: ${printable})`,
    });
  }
  return errors;
}
