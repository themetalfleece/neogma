import { int } from 'neo4j-driver';

import { assertSkipValue } from './assertSkipValue';
import type {
  GetSkipStringDeps,
  GetSkipStringSkip,
} from './getSkipString.types';

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
