import { isReturnObject } from '../QueryBuilder.types';
import type { GetReturnStringReturn } from './getReturnString.types';

export const getReturnString = (rtn: GetReturnStringReturn): string => {
  if (typeof rtn === 'string') {
    return `RETURN ${rtn}`;
  }

  if (isReturnObject(rtn)) {
    const returnString = rtn
      .map((v) => `${v.identifier}${v.property ? '.' + v.property : ''}`)
      .join(', ');

    return `RETURN ${returnString}`;
  }

  // else string array
  return `RETURN ${rtn.join(', ')}`;
};
