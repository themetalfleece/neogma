import { escapeIfNeeded } from '../../utils/cypher';
import type { GetReturnStringReturn } from './getReturnString.types';

/**
 * Generates a RETURN clause string.
 *
 * Supports three formats:
 * - **String**: Raw Cypher expression (no escaping, use for complex expressions)
 * - **String array**: Raw Cypher expressions joined by comma
 * - **Object array**: `{ identifier, property? }` - identifiers/properties are escaped
 * - **Mixed array**: Combination of strings and objects
 *
 * **SECURITY WARNING**: String elements are inserted directly into the query
 * without validation. Never pass user-provided input as strings. Use object
 * format `{ identifier, property }` for safe, escaped queries.
 *
 * @example
 * // SAFE: Object array format - identifiers and properties are escaped if needed
 * getReturnString([{ identifier: 'n', property: 'name' }, { identifier: 'm' }]);
 * // => "RETURN n.name, m"
 *
 * @example
 * // Mixed array - strings are raw, objects are escaped
 * getReturnString(['count(n) AS total', { identifier: 'm', property: 'name' }]);
 * // => "RETURN count(n) AS total, m.name"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getReturnString('n.name, count(m) AS total');
 * // => "RETURN n.name, count(m) AS total"
 */
export const getReturnString = (rtn: GetReturnStringReturn): string => {
  // String input: escape hatch for complex expressions - no validation
  if (typeof rtn === 'string') {
    return `RETURN ${rtn}`;
  }

  // Array input: handle each element individually (supports mixed arrays)
  const returnString = rtn
    .map((element) => {
      // String elements: raw escape hatch - no validation
      if (typeof element === 'string') {
        return element;
      }
      // Object elements: safe format with escaping
      const safeIdentifier = escapeIfNeeded(element.identifier);
      const safeProperty = element.property
        ? '.' + escapeIfNeeded(element.property)
        : '';
      return `${safeIdentifier}${safeProperty}`;
    })
    .join(', ');

  return `RETURN ${returnString}`;
};
