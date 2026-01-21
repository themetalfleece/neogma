import { getSetParts } from '../getSetParts';
import { GetSetStringDeps, GetSetStringSet } from './getSetString.types';

/** Returns a string in the format: `SET a.p1 = $v1, a.p2 = $v2` */
export const getSetString = (
  set: GetSetStringSet,
  deps: GetSetStringDeps,
): string => {
  if (typeof set === 'string') {
    return `SET ${set}`;
  }

  return getSetParts({
    data: set.properties,
    identifier: set.identifier,
    bindParam: deps.bindParam,
  }).statement;
};
