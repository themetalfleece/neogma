import { Literal } from '../../Literal';
import { GetSetPartsParams, GetSetPartsResult } from './getSetParts.types';

/** Returns the parts and the statement for a SET operation with the given params */
export const getSetParts = (params: GetSetPartsParams): GetSetPartsResult => {
  const { data, bindParam, identifier } = params;

  const setParts: string[] = [];
  for (const key in data) {
    if (!Object.hasOwn(data, key)) {
      continue;
    }
    if (data[key] instanceof Literal) {
      setParts.push(
        `${identifier}.${key} = ${(data[key] as Literal).getValue()}`,
      );
    } else {
      const paramKey = bindParam.getUniqueNameAndAdd(key, data[key]);
      setParts.push(`${identifier}.${key} = $${paramKey}`);
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
