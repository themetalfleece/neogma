import { assertRawValue } from './assertRawValue';
import type { GetRawStringRaw } from './getRawString.types';

/**
 * Returns the raw string as-is to be inserted into the query.
 *
 * **SECURITY WARNING**: The string parameter is inserted directly into the query
 * without any validation or escaping. Never pass user-provided input. Use
 * parameterized values via BindParam for dynamic data.
 *
 * @example
 * // Basic raw statement
 * getRawString('RETURN 1');
 * // => "RETURN 1"
 *
 * @example
 * // Raw statement with Cypher functions
 * getRawString('RETURN datetime() AS now');
 * // => "RETURN datetime() AS now"
 */
export const getRawString = (raw: GetRawStringRaw): string => {
  assertRawValue(raw);

  return raw;
};
