import { assertForEachValue } from './assertForEachValue';
import type { GetForEachStringForEach } from './getForEachString.types';

/**
 * Generates a FOREACH clause string.
 *
 * **SECURITY WARNING**: The string parameter is inserted directly into the query
 * without validation. Never pass user-provided input. Use parameterized values
 * via BindParam for dynamic data.
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getForEachString('(item IN $items | CREATE (n:Node {value: item}))');
 * // => "FOREACH (item IN $items | CREATE (n:Node {value: item}))"
 *
 * @example
 * // Pattern: Use BindParam for the collection, not inline values
 * // bindParam.add({ items: [1, 2, 3] });
 * getForEachString('(x IN $items | SET n.processed = true)');
 * // => "FOREACH (x IN $items | SET n.processed = true)"
 */
export const getForEachString = (forEach: GetForEachStringForEach): string => {
  assertForEachValue(forEach);

  // String input is unvalidated - escape hatch only
  return `FOREACH ${forEach}`;
};
