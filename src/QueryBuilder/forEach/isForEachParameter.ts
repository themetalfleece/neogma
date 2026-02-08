import type { ForEachI } from './getForEachString.types';

/**
 * Type guard to check if a parameter has a 'forEach' key.
 * Only checks for key presence; value validation happens in assertForEachValue.
 */
export const isForEachParameter = (param: unknown): param is ForEachI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'forEach')
  );
};
