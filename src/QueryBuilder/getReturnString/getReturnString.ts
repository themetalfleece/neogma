import { escapeIfNeeded } from '../../utils/cypher';
import { isReturnObject } from '../QueryBuilder.types';
import type { GetReturnStringReturn } from './getReturnString.types';

/**
 * Generates a RETURN clause string.
 *
 * **SECURITY WARNING**: String parameters and string array elements are inserted
 * directly into the query without validation. Never pass user-provided input as
 * strings. Use the object format `[{ identifier, property }]` for safe queries.
 *
 * @example
 * // SAFE: Object array format - identifiers and properties are escaped if needed
 * getReturnString([{ identifier: 'n', property: 'name' }, { identifier: 'm' }]);
 * // => "RETURN n.name, m"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getReturnString('n.name, count(m) AS total');
 * // => "RETURN n.name, count(m) AS total"
 *
 * @example
 * // UNSAFE: String array format - no validation
 * getReturnString(['n.name', 'count(m) AS total']);
 * // => "RETURN n.name, count(m) AS total"
 */
export const getReturnString = (rtn: GetReturnStringReturn): string => {
  // String input: escape hatch for complex expressions - no validation
  if (typeof rtn === 'string') {
    return `RETURN ${rtn}`;
  }

  if (isReturnObject(rtn)) {
    const returnString = rtn
      .map((v) => {
        const safeIdentifier = escapeIfNeeded(v.identifier);
        const safeProperty = v.property ? '.' + escapeIfNeeded(v.property) : '';
        return `${safeIdentifier}${safeProperty}`;
      })
      .join(', ');

    return `RETURN ${returnString}`;
  }

  // String array: escape hatch - no validation
  return `RETURN ${rtn.join(', ')}`;
};
