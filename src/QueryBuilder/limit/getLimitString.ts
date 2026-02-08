import { int } from 'neo4j-driver';

import { assertLimitValue } from './assertLimitValue';
import type {
  GetLimitStringDeps,
  GetLimitStringLimit,
} from './getLimitString.types';

/**
 * Generates a LIMIT clause string.
 * Accepts a string literal or a number that gets parameterized.
 */
export const getLimitString = (
  limit: GetLimitStringLimit,
  deps: GetLimitStringDeps,
): string => {
  assertLimitValue(limit);

  const limitString =
    typeof limit === 'string'
      ? limit
      : `$${deps.bindParam.getUniqueNameAndAdd('limit', int(limit))}`;

  return `LIMIT ${limitString}`;
};
