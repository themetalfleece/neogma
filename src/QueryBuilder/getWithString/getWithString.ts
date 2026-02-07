import type { GetWithStringWith } from './getWithString.types';

/**
 * Generates a WITH clause string.
 *
 * **SECURITY WARNING**: String parameters and array elements are inserted directly
 * into the query without validation. Never pass user-provided input. Use validated
 * identifiers or parameterized values for dynamic data.
 *
 * @example
 * // UNSAFE: String format - no validation, use only with trusted input
 * getWithString('n, count(m) AS total');
 * // => "WITH n, count(m) AS total"
 *
 * @example
 * // UNSAFE: String array format - no validation
 * getWithString(['n', 'collect(m) AS items', 'count(*) AS total']);
 * // => "WITH n, collect(m) AS items, count(*) AS total"
 */
export const getWithString = (wth: GetWithStringWith): string => {
  // All inputs are unvalidated escape hatches
  const wthArr = Array.isArray(wth) ? wth : [wth];

  return `WITH ${wthArr.join(', ')}`;
};
