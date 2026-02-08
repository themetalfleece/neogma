import { getSetParts } from '../setParts';
import { assertSetValue } from './assertSetValue';
import type { GetSetStringDeps, GetSetStringSet } from './getSetString.types';

/**
 * Returns a string in the format: `SET a.p1 = $v1, a.p2 = $v2`.
 *
 * **SECURITY WARNING**: String parameters are inserted directly into the query
 * without validation. Never pass user-provided input as strings. Use the object
 * format `{ identifier, properties }` for safe queries.
 *
 * @example
 * // SAFE: Object format - identifiers are escaped if needed, values use BindParam
 * getSetString({ identifier: 'n', properties: { name: 'John', age: 25 } }, deps);
 * // => "SET n.name = $name, n.age = $age"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getSetString('n.name = "John", n.updatedAt = datetime()', deps);
 * // => "SET n.name = "John", n.updatedAt = datetime()"
 */
export const getSetString = (
  set: GetSetStringSet,
  deps: GetSetStringDeps,
): string => {
  // Validate input - throws with specific error message if invalid
  assertSetValue(set);

  // String input: escape hatch for complex expressions - no validation
  if (typeof set === 'string') {
    return `SET ${set}`;
  }

  return getSetParts({
    data: set.properties,
    identifier: set.identifier,
    bindParam: deps.bindParam,
  }).statement;
};
