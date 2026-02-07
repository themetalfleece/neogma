import { Literal } from '../../Literal';
import { escapeIfNeeded } from '../../utils/cypher';
import type { GetSetPartsParams, GetSetPartsResult } from './getSetParts.types';

/** Returns the parts and the statement for a SET operation with the given params */
export const getSetParts = (params: GetSetPartsParams): GetSetPartsResult => {
  const { data, bindParam, identifier } = params;

  const safeIdentifier = escapeIfNeeded(identifier);
  const setParts: string[] = [];
  for (const key in data) {
    if (!Object.hasOwn(data, key)) {
      continue;
    }

    const safeKey = escapeIfNeeded(key);
    if (data[key] instanceof Literal) {
      setParts.push(
        `${safeIdentifier}.${safeKey} = ${(data[key] as Literal).getValue()}`,
      );
    } else {
      const paramKey = bindParam.getUniqueNameAndAdd(key, data[key]);
      setParts.push(`${safeIdentifier}.${safeKey} = $${paramKey}`);
    }
  }

  if (!setParts.length) {
    return {
      parts: [],
      statement: '',
    };
  }

  return {
    parts: setParts,
    statement: `SET ${setParts.join(', ')}`,
  };
};
