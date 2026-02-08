import type { LimitI } from './getLimitString.types';

/**
 * Type guard to check if a parameter has a 'limit' key.
 * Only checks for key presence; value validation happens in assertLimitValue.
 */
export const isLimitParameter = (param: unknown): param is LimitI => {
  return (
    typeof param === 'object' && param !== null && Object.hasOwn(param, 'limit')
  );
};
