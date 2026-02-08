import type { OrderByI } from './getOrderByString.types';

/**
 * Type guard to check if a parameter has an 'orderBy' key.
 * Only checks for key presence; value validation happens in assertOrderByValue.
 */
export const isOrderByParameter = (param: unknown): param is OrderByI => {
  return (
    typeof param === 'object' &&
    param !== null &&
    Object.hasOwn(param, 'orderBy')
  );
};
