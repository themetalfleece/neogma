import { Where } from '../../Where';
import type {
  GetWhereStringDeps,
  GetWhereStringWhere,
} from './getWhereString.types';

/**
 * Generates a WHERE clause string.
 *
 * **SECURITY WARNING**: String parameters are inserted directly into the query
 * without validation. Never pass user-provided input as strings. Use a `Where`
 * instance or object format `{ identifier: { property: value } }` for safe queries.
 *
 * @example
 * // SAFE: Object format - identifiers are escaped if needed, values use BindParam
 * getWhereString({ n: { name: 'John', age: 25 } }, deps);
 * // => "WHERE n.name = $name AND n.age = $age"
 *
 * @example
 * // SAFE: Where instance - uses parameterized values
 * const where = new Where({ n: { status: 'active' } }, bindParam);
 * getWhereString(where, deps);
 * // => "WHERE n.status = $status"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getWhereString('n.name = "John" AND n.age > 21', deps);
 * // => "WHERE n.name = "John" AND n.age > 21"
 */
export const getWhereString = (
  where: GetWhereStringWhere,
  deps: GetWhereStringDeps,
): string => {
  // String input: escape hatch for complex conditions - no validation
  if (typeof where === 'string') {
    return `WHERE ${where}`;
  }

  if (where instanceof Where) {
    const statement = where.getStatement('text');
    if (!statement) {
      return '';
    }
    return `WHERE ${statement}`;
  }

  // else, where object
  const whereInstance = new Where(where, deps.bindParam);
  const statement = whereInstance.getStatement('text');
  if (!statement) {
    return '';
  }
  return `WHERE ${statement}`;
};
