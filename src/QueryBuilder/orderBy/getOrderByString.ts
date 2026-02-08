import { escapeIfNeeded } from '../../utils/cypher';
import { assertOrderByValue } from './assertOrderByValue';
import type { GetOrderByStringOrderBy } from './getOrderByString.types';

/**
 * Builds the identifier.property string for ORDER BY clauses.
 * Escapes identifier and property names if they contain special characters.
 */
const buildOrderByProperty = (
  identifier?: string,
  property?: string,
): string => {
  const parts: string[] = [];
  if (identifier) {
    parts.push(escapeIfNeeded(identifier));
  }
  if (property) {
    parts.push(escapeIfNeeded(property));
  }
  return parts.join('.');
};

/**
 * Generates an ORDER BY clause string.
 *
 * **SECURITY WARNING**: String parameters and string array elements are inserted
 * directly into the query without validation. Never pass user-provided input as
 * strings. Use the object format for safe, escaped queries.
 *
 * @example
 * // SAFE: Object format - identifier and property are escaped if needed
 * getOrderByString({ identifier: 'n', property: 'name', direction: 'ASC' });
 * // => "ORDER BY n.name ASC"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getOrderByString('n.name ASC');
 * // => "ORDER BY n.name ASC"
 *
 * @example
 * // UNSAFE: String array elements - no validation
 * getOrderByString(['n.name ASC', 'n.age DESC']);
 */
export const getOrderByString = (orderBy: GetOrderByStringOrderBy): string => {
  assertOrderByValue(orderBy);

  // String input: escape hatch for complex expressions - no validation
  if (typeof orderBy === 'string') {
    return `ORDER BY ${orderBy}`;
  }

  if (Array.isArray(orderBy)) {
    const orderByParts = orderBy.map((element) => {
      // String elements: escape hatch - no validation
      if (typeof element === 'string') {
        return element;
      }
      // Tuple elements: escape hatch - no validation
      if (Array.isArray(element)) {
        return `${element[0]} ${element[1]}`;
      }
      return [
        // identifier.property (validated)
        buildOrderByProperty(element.identifier, element.property),
        // ASC or DESC
        element.direction,
      ]
        .filter((v) => v)
        .join(' ');
    });

    return `ORDER BY ${orderByParts.join(', ')}`;
  }

  // else, it's the object type
  const orderByString = [
    // identifier.property (validated)
    buildOrderByProperty(orderBy.identifier, orderBy.property),
    // ASC or DESC
    orderBy.direction,
  ]
    .filter((v) => v)
    .join(' ');

  return `ORDER BY ${orderByString}`;
};
