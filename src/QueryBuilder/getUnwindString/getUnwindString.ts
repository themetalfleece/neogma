import { escapeIfNeeded } from '../../utils/cypher';
import type { GetUnwindStringUnwind } from './getUnwindString.types';

/**
 * Generates an UNWIND clause string.
 *
 * **SECURITY WARNING**: String parameters and the `value` property are inserted
 * directly into the query without validation. Never pass user-provided input for
 * these. The `as` identifier is escaped if it contains special characters.
 *
 * @example
 * // Object format - value should reference a parameter, as is escaped if needed
 * getUnwindString({ value: '$items', as: 'item' });
 * // => "UNWIND $items AS item"
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getUnwindString('$items AS item');
 * // => "UNWIND $items AS item"
 *
 * @example
 * // Object with special character in as - gets escaped
 * getUnwindString({ value: '$items', as: 'my-item' });
 * // => "UNWIND $items AS `my-item`"
 */
export const getUnwindString = (unwind: GetUnwindStringUnwind): string => {
  if (typeof unwind === 'string') {
    // String format is unvalidated escape hatch
    return `UNWIND ${unwind}`;
  }

  // Object format: value is unvalidated, as is escaped if needed
  const safeAs = escapeIfNeeded(unwind.as);
  return `UNWIND ${unwind.value} AS ${safeAs}`;
};
