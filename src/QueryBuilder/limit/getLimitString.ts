import { int } from 'neo4j-driver';

import { assertLimitValue } from './assertLimitValue';
import type {
  GetLimitStringDeps,
  GetLimitStringLimit,
} from './getLimitString.types';

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
