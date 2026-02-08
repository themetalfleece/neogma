import { int } from 'neo4j-driver';

import { assertSkipValue } from './assertSkipValue';
import type {
  GetSkipStringDeps,
  GetSkipStringSkip,
} from './getSkipString.types';

/**
 * Generates a SKIP clause string.
 * Accepts a string literal or a number that gets parameterized.
 */
export const getSkipString = (
  skip: GetSkipStringSkip,
  deps: GetSkipStringDeps,
): string => {
  assertSkipValue(skip);

  const skipString =
    typeof skip === 'string'
      ? skip
      : `$${deps.bindParam.getUniqueNameAndAdd('skip', int(skip))}`;

  return `SKIP ${skipString}`;
};
